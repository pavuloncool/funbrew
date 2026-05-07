import type { LogTastingInput } from './tastingService';
import type { TypedSupabaseClient } from './supabaseClientFactory';
import {
  logTasting,
  normalizeTastingSyncError,
  type TastingSyncErrorKind,
  updateCoffeeStats,
} from './tastingService';

const OFFLINE_QUEUE_STORAGE_KEY = 'funcup_pending_tastings_v1';
const FAILED_QUEUE_STORAGE_KEY = 'funcup_failed_tastings_v1';
const MAX_QUEUE_SIZE = 50;
const MAX_FAILED_QUEUE_SIZE = 200;

export type QueueStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

export type PendingTasting = LogTastingInput & {
  id: string;
  createdAt: string;
};

export type FailedTasting = PendingTasting & {
  failedAt: string;
  errorKind: TastingSyncErrorKind;
  errorMessage: string;
  status: number | null;
  code: string | null;
};

export type EnqueueResult = {
  queuedItem: PendingTasting;
  queueSize: number;
  wasCapped: boolean;
};

function safeParseQueue(raw: string | null): PendingTasting[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is PendingTasting => {
      if (!item || typeof item !== 'object') return false;
      const candidate = item as Partial<PendingTasting>;
      return (
        typeof candidate.id === 'string' &&
        typeof candidate.createdAt === 'string' &&
        typeof candidate.batchId === 'string' &&
        typeof candidate.rating === 'number'
      );
    });
  } catch {
    return [];
  }
}

async function readQueue(storage: QueueStorage): Promise<PendingTasting[]> {
  return safeParseQueue(await storage.getItem(OFFLINE_QUEUE_STORAGE_KEY));
}

async function writeQueue(storage: QueueStorage, queue: PendingTasting[]) {
  await storage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(queue));
}

function safeParseFailedQueue(raw: string | null): FailedTasting[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is FailedTasting => {
      if (!item || typeof item !== 'object') return false;
      const candidate = item as Partial<FailedTasting>;
      return (
        typeof candidate.id === 'string' &&
        typeof candidate.createdAt === 'string' &&
        typeof candidate.batchId === 'string' &&
        typeof candidate.rating === 'number' &&
        typeof candidate.failedAt === 'string' &&
        typeof candidate.errorKind === 'string' &&
        typeof candidate.errorMessage === 'string'
      );
    });
  } catch {
    return [];
  }
}

async function readFailedQueue(storage: QueueStorage): Promise<FailedTasting[]> {
  return safeParseFailedQueue(await storage.getItem(FAILED_QUEUE_STORAGE_KEY));
}

async function writeFailedQueue(storage: QueueStorage, queue: FailedTasting[]) {
  await storage.setItem(FAILED_QUEUE_STORAGE_KEY, JSON.stringify(queue.slice(-MAX_FAILED_QUEUE_SIZE)));
}

export async function getPendingTastings(storage: QueueStorage): Promise<PendingTasting[]> {
  return readQueue(storage);
}

export async function getFailedTastings(storage: QueueStorage): Promise<FailedTasting[]> {
  return readFailedQueue(storage);
}

export async function enqueuePendingTasting(
  storage: QueueStorage,
  input: LogTastingInput,
  now = new Date()
): Promise<EnqueueResult> {
  const queue = await readQueue(storage);
  const nextItem: PendingTasting = {
    ...input,
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: now.toISOString(),
  };

  // T073: last-write-wins for rating collisions within a batch while offline.
  const queueWithoutBatch = queue.filter((item) => item.batchId !== input.batchId);
  const nextQueue = [...queueWithoutBatch, nextItem].slice(-MAX_QUEUE_SIZE);
  await writeQueue(storage, nextQueue);

  return {
    queuedItem: nextItem,
    queueSize: nextQueue.length,
    wasCapped: nextQueue.length < queueWithoutBatch.length + 1,
  };
}

export async function flushPendingTastings(params: {
  storage: QueueStorage;
  supabase: TypedSupabaseClient;
  now?: Date;
}): Promise<{ synced: number; remainingTransient: number; failedPermanent: number }> {
  const queue = await readQueue(params.storage);
  if (queue.length === 0) {
    return { synced: 0, remainingTransient: 0, failedPermanent: 0 };
  }

  let userId: string | null = null;
  try {
    const authClient = (params.supabase as TypedSupabaseClient & {
      auth?: { getUser?: () => Promise<{ data: { user: { id: string } | null } }> };
    }).auth;
    if (authClient?.getUser) {
      const {
        data: { user },
      } = await authClient.getUser();
      userId = user?.id ?? null;
    }
  } catch {
    userId = null;
  }

  let synced = 0;
  const remainingTransient: PendingTasting[] = [];
  const failedPermanent: FailedTasting[] = [];
  const nowIso = (params.now ?? new Date()).toISOString();

  for (const item of queue) {
    try {
      await logTasting(params.supabase, {
        batchId: item.batchId,
        rating: item.rating,
        brewMethodId: item.brewMethodId,
        brewTimeSeconds: item.brewTimeSeconds,
        tastingNoteIds: item.tastingNoteIds,
        freeTextNotes: item.freeTextNotes,
        review: item.review,
      });
      if (userId) {
        await updateCoffeeStats(params.supabase, {
          batchId: item.batchId,
          userId,
        });
      }
      synced += 1;
    } catch (error) {
      const syncError = normalizeTastingSyncError(error);
      if (syncError.retryable) {
        remainingTransient.push(item);
        continue;
      }
      failedPermanent.push({
        ...item,
        failedAt: nowIso,
        errorKind: syncError.kind,
        errorMessage: syncError.message,
        status: syncError.status,
        code: syncError.code,
      });
    }
  }

  await writeQueue(params.storage, remainingTransient);

  if (failedPermanent.length > 0) {
    const existingFailed = await readFailedQueue(params.storage);
    await writeFailedQueue(params.storage, [...existingFailed, ...failedPermanent]);
  }

  return {
    synced,
    remainingTransient: remainingTransient.length,
    failedPermanent: failedPermanent.length,
  };
}

export const offlineQueueConfig = {
  storageKey: OFFLINE_QUEUE_STORAGE_KEY,
  failedStorageKey: FAILED_QUEUE_STORAGE_KEY,
  maxQueueSize: MAX_QUEUE_SIZE,
  maxFailedQueueSize: MAX_FAILED_QUEUE_SIZE,
};
