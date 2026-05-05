import { describe, expect, it, vi } from 'vitest';

import type { QueueStorage } from './offlineTastingQueue';
import {
  enqueuePendingTasting,
  flushPendingTastings,
  getPendingTastings,
  offlineQueueConfig,
} from './offlineTastingQueue';

function createMemoryStorage(): QueueStorage {
  const memory = new Map<string, string>();
  return {
    async getItem(key) {
      return memory.get(key) ?? null;
    },
    async setItem(key, value) {
      memory.set(key, value);
    },
  };
}

describe('offlineTastingQueue', () => {
  it('enqueues tasting and persists queue', async () => {
    const storage = createMemoryStorage();

    const result = await enqueuePendingTasting(
      storage,
      {
        batchId: 'batch-a',
        rating: 4,
        tastingNoteIds: ['n1'],
      },
      new Date('2026-01-01T00:00:00.000Z')
    );

    expect(result.queueSize).toBe(1);
    expect(result.queuedItem.batchId).toBe('batch-a');
    expect(await getPendingTastings(storage)).toHaveLength(1);
  });

  it('applies last-write-wins for the same batch', async () => {
    const storage = createMemoryStorage();

    await enqueuePendingTasting(
      storage,
      { batchId: 'batch-a', rating: 2 },
      new Date('2026-01-01T00:00:00.000Z')
    );
    await enqueuePendingTasting(
      storage,
      { batchId: 'batch-a', rating: 5 },
      new Date('2026-01-01T00:00:01.000Z')
    );

    const pending = await getPendingTastings(storage);
    expect(pending).toHaveLength(1);
    expect(pending[0]?.rating).toBe(5);
  });

  it('caps queue to max size', async () => {
    const storage = createMemoryStorage();

    for (let i = 0; i < offlineQueueConfig.maxQueueSize + 3; i += 1) {
      await enqueuePendingTasting(
        storage,
        { batchId: `batch-${i}`, rating: 3 },
        new Date(`2026-01-01T00:00:${String(i).padStart(2, '0')}.000Z`)
      );
    }

    const pending = await getPendingTastings(storage);
    expect(pending).toHaveLength(offlineQueueConfig.maxQueueSize);
    expect(pending.at(-1)?.batchId).toBe(`batch-${offlineQueueConfig.maxQueueSize + 2}`);
  });

  it('flushes queue and keeps failed items', async () => {
    const storage = createMemoryStorage();

    await enqueuePendingTasting(
      storage,
      { batchId: 'ok-1', rating: 4 },
      new Date('2026-01-01T00:00:00.000Z')
    );
    await enqueuePendingTasting(
      storage,
      { batchId: 'fail-1', rating: 1 },
      new Date('2026-01-01T00:00:01.000Z')
    );

    const invoke = vi.fn(async (name: string, payload: { body: { batch_id: string } }) => {
      if (name !== 'coffee/log-tasting') throw new Error('unexpected function');
      if (payload.body.batch_id === 'fail-1') {
        return { data: null, error: new Error('network') };
      }
      return { data: { coffee_log_id: 'log-id' }, error: null };
    });

    const result = await flushPendingTastings({
      storage,
      supabase: { functions: { invoke } } as never,
    });

    expect(result.synced).toBe(1);
    expect(result.remaining).toBe(1);
    expect((await getPendingTastings(storage))[0]?.batchId).toBe('fail-1');
  });
});
