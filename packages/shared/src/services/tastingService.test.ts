import { describe, expect, it, vi } from 'vitest';

import { logTasting, normalizeTastingSyncError } from './tastingService';

describe('tastingService', () => {
  it('uses canonical log_tasting endpoint when available', async () => {
    const invoke = vi.fn(async (name: string) => {
      expect(name).toBe('log_tasting');
      return { data: { coffee_log_id: 'log-1' }, error: null };
    });

    const result = await logTasting(
      { functions: { invoke } } as never,
      { batchId: 'batch-1', rating: 5 }
    );

    expect(result.coffeeLogId).toBe('log-1');
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('falls back to legacy endpoint when canonical function is not found', async () => {
    const invoke = vi.fn(
      async (name: string): Promise<{ data: unknown; error: unknown }> => {
        if (name === 'log_tasting') {
          return {
            data: null,
            error: { message: 'Requested function was not found', status: 404, code: 'NOT_FOUND' },
          };
        }
        if (name === 'coffee/log-tasting') {
          return { data: { coffee_log_id: 'legacy-1' }, error: null };
        }
        throw new Error('unexpected function');
      }
    );

    const result = await logTasting(
      { functions: { invoke } } as never,
      { batchId: 'batch-1', rating: 4 }
    );

    expect(result.coffeeLogId).toBe('legacy-1');
    expect(invoke).toHaveBeenNthCalledWith(1, 'log_tasting', expect.anything());
    expect(invoke).toHaveBeenNthCalledWith(2, 'coffee/log-tasting', expect.anything());
  });

  it('does not fall back for non-not-found errors', async () => {
    const invoke = vi.fn(async () => ({
      data: null,
      error: { message: 'rating must be between 1 and 5', status: 400, code: 'BAD_REQUEST' },
    }));

    await expect(
      logTasting(
        { functions: { invoke } } as never,
        { batchId: 'batch-1', rating: 0 }
      )
    ).rejects.toMatchObject({
      name: 'TastingSyncError',
      kind: 'validation',
      retryable: false,
      status: 400,
    });
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('normalizes network errors as retryable', () => {
    const normalized = normalizeTastingSyncError(new Error('Network request failed'));
    expect(normalized.kind).toBe('offline');
    expect(normalized.retryable).toBe(true);
  });
});
