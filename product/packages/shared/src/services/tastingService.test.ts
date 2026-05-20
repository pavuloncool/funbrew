import { describe, expect, it, vi } from 'vitest';

import { logTasting, normalizeTastingSyncError, updateCoffeeStats } from './tastingService';

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

  it('surfaces canonical endpoint errors without legacy fallback', async () => {
    const invoke = vi.fn(async () => ({
      data: null,
      error: { message: 'Requested function was not found', status: 404, code: 'NOT_FOUND' },
    }));

    await expect(
      logTasting(
        { functions: { invoke } } as never,
        { batchId: 'batch-1', rating: 4 }
      )
    ).rejects.toMatchObject({
      name: 'TastingSyncError',
      kind: 'not_found',
      retryable: false,
      status: 404,
    });
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith('log_tasting', expect.anything());
  });

  it('classifies validation errors from canonical endpoint', async () => {
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

  it('sends snake_case payload fields expected by log_tasting', async () => {
    const invoke = vi.fn(async (_name: string, options?: { body?: Record<string, unknown> }) => {
      expect(options?.body).toEqual({
        batch_id: 'batch-9',
        rating: 5,
        brew_method_id: 'v60',
        brew_time_seconds: 180,
        tasting_note_ids: ['tn-1', 'tn-2'],
        free_text_notes: 'juicy acidity',
        review: 'clean cup',
      });
      return { data: { coffee_log_id: 'shape-1' }, error: null };
    });

    await logTasting(
      { functions: { invoke } } as never,
      {
        batchId: 'batch-9',
        rating: 5,
        brewMethodId: 'v60',
        brewTimeSeconds: 180,
        tastingNoteIds: ['tn-1', 'tn-2'],
        freeTextNotes: 'juicy acidity',
        review: 'clean cup',
      }
    );
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith('log_tasting', expect.anything());
  });

  it('calls update_coffee_stats with contract body expected by analytics pipeline', async () => {
    const invoke = vi.fn(async () => ({ data: { updated: true }, error: null }));

    await updateCoffeeStats(
      { functions: { invoke } } as never,
      { batchId: 'batch-42', userId: 'user-42' }
    );

    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith('update_coffee_stats', {
      body: { batch_id: 'batch-42', user_id: 'user-42' },
    });
  });
});
