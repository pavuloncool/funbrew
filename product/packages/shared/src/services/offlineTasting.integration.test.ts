import { describe, expect, it, vi } from 'vitest';

import { enqueuePendingTasting, flushPendingTastings } from './offlineTastingQueue';

describe('offline tasting integration', () => {
  it('queues offline tasting and syncs it within 30s budget after reconnect', async () => {
    const memory = new Map<string, string>();
    const storage = {
      getItem: async (key: string) => memory.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        memory.set(key, value);
      },
    };

    await enqueuePendingTasting(storage, {
      batchId: 'batch-airplane',
      rating: 5,
      review: 'offline-first',
    });

    const invoke = vi.fn(async () => ({
      data: { coffee_log_id: 'synced-1' },
      error: null,
    }));

    const startedAt = Date.now();
    const result = await flushPendingTastings({
      storage,
      supabase: { functions: { invoke } } as never,
    });
    const elapsed = Date.now() - startedAt;

    expect(result.synced).toBe(1);
    expect(result.remainingTransient).toBe(0);
    expect(result.failedPermanent).toBe(0);
    expect(elapsed).toBeLessThanOrEqual(30_000);
  });
});
