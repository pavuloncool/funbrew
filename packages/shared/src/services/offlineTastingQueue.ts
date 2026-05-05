import type { LogTastingInput } from './tastingService';
import type { TypedSupabaseClient } from './supabaseClientFactory';
import { logTasting, updateCoffeeStats } from './tastingService';

const OFFLINE_QUEUE_STORAGE_KEY = 'funcup_pending_tastings_v1';
const MAX_QUEUE_SIZE = 50;

export type QueueStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

export type PendingTasting = LogTastingInput & {
  id: string;
  createdAt: string;
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

export async function getPendingTastings(storage: QueueStorage): Promise<PendingTasting[]> {
  return readQueue(storage);
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
}): Promise<{ synced: number; remaining: number }> {
  const queue = await readQueue(params.storage);
  if (queue.length === 0) return { synced: 0, remaining: 0 };

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
  const remaining: PendingTasting[] = [];

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
    } catch {
      remaining.push(item);
    }
  }

  await writeQueue(params.storage, remaining);
  return { synced, remaining: remaining.length };
}

export const offlineQueueConfig = {
  storageKey: OFFLINE_QUEUE_STORAGE_KEY,
  maxQueueSize: MAX_QUEUE_SIZE,
};
