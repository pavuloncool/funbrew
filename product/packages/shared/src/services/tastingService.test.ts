import { describe, expect, it, vi } from 'vitest';

import { deleteTasting, logTasting, normalizeTastingSyncError, updateCoffeeStats, updateTasting } from './tastingService';
import * as telemetryCoreService from '../roasterDataProfile/telemetryCoreService';

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

  it('updates tasting details through the shared write workflow', async () => {
    vi.spyOn(telemetryCoreService, 'upsertRoasterTelemetryCore').mockResolvedValue({
      coffeeLogId: 'log-77',
      brewMethodId: 'v60',
      overallRating: 4,
      sensoryAcidity: 3,
      sensorySweetness: 4,
      sensoryBody: 5,
      sensoryBitter: 2,
      sensoryAftertaste: 4,
      repurchaseIntent: 'yes',
      experienceLevel: 'advanced',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const maybeSingleUpdated = vi.fn(async () => ({ data: { id: 'log-77', rating: 4 }, error: null }));
    const selectUpdated = vi.fn(() => ({ maybeSingle: maybeSingleUpdated }));
    const eqUpdatedUser = vi.fn(() => ({ select: selectUpdated }));
    const eqUpdatedId = vi.fn(() => ({ eq: eqUpdatedUser }));
    const updateCoffeeLogs = vi.fn(() => ({ eq: eqUpdatedId }));
    const deleteCoffeeLogs = vi.fn();

    const maybeSingleReview = vi.fn(async () => ({ data: { id: 'review-1' }, error: null }));
    const eqReview = vi.fn(() => ({ maybeSingle: maybeSingleReview }));
    const selectReview = vi.fn(() => ({ eq: eqReview }));
    const updateReviewEq = vi.fn(async () => ({ error: null }));
    const updateReview = vi.fn(() => ({ eq: updateReviewEq }));
    const insertReview = vi.fn(async () => ({ error: null }));
    const deleteReviewEq = vi.fn(async () => ({ error: null }));
    const deleteReview = vi.fn(() => ({ eq: deleteReviewEq }));

    const deleteNotesEq = vi.fn(async () => ({ error: null }));
    const deleteNotes = vi.fn(() => ({ eq: deleteNotesEq }));
    const insertNotes = vi.fn(async () => ({ error: null }));

    const invoke = vi.fn(async () => ({ data: { updated: true }, error: null }));
    const from = vi.fn((table: string) => {
      if (table === 'coffee_logs') {
        return { update: updateCoffeeLogs, delete: deleteCoffeeLogs };
      }
      if (table === 'reviews') {
        return { select: selectReview, update: updateReview, insert: insertReview, delete: deleteReview };
      }
      if (table === 'coffee_log_tasting_notes') {
        return { delete: deleteNotes, insert: insertNotes };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await updateTasting(
      { from, functions: { invoke } } as never,
      {
        coffeeLogId: 'log-77',
        batchId: 'batch-77',
        userId: 'user-77',
        rating: 4,
        brewMethodId: 'v60',
        tastingNoteIds: ['tn-1', 'tn-2', 'tn-1'],
        freeTextNotes: ' berry ',
        review: ' sweet finish ',
        telemetry: {
          brewMethodId: 'v60',
          overallRating: 4,
          sensoryAcidity: 3,
          sensorySweetness: 4,
          sensoryBody: 5,
          sensoryBitter: 2,
          sensoryAftertaste: 4,
          repurchaseIntent: 'yes',
          experienceLevel: 'advanced',
        },
      }
    );

    expect(updateCoffeeLogs).toHaveBeenCalledWith({
      rating: 4,
      brew_method_id: 'v60',
      free_text_notes: 'berry',
    });
    expect(deleteNotesEq).toHaveBeenCalledWith('coffee_log_id', 'log-77');
    expect(insertNotes).toHaveBeenCalledWith([
      { coffee_log_id: 'log-77', tasting_note_id: 'tn-1' },
      { coffee_log_id: 'log-77', tasting_note_id: 'tn-2' },
    ]);
    expect(updateReview).toHaveBeenCalledWith({ body: 'sweet finish' });
    expect(invoke).toHaveBeenCalledWith('update_coffee_stats', {
      body: { batch_id: 'batch-77', user_id: 'user-77' },
    });
    expect(result.savedTelemetry?.coffeeLogId).toBe('log-77');
    expect(result.telemetryError).toBeNull();
    expect(result.statsUpdated).toBe(true);
  });

  it('deletes tasting entries through the shared write workflow', async () => {
    const deleteEqUser = vi.fn(async () => ({ error: null }));
    const deleteEqId = vi.fn(() => ({ eq: deleteEqUser }));
    const deleteCoffeeLogs = vi.fn(() => ({ eq: deleteEqId }));
    const invoke = vi.fn(async () => ({ data: { updated: true }, error: null }));
    const from = vi.fn(() => ({ delete: deleteCoffeeLogs }));

    const result = await deleteTasting(
      { from, functions: { invoke } } as never,
      { coffeeLogId: 'log-91', batchId: 'batch-91', userId: 'user-91' }
    );

    expect(deleteEqId).toHaveBeenCalledWith('id', 'log-91');
    expect(deleteEqUser).toHaveBeenCalledWith('user_id', 'user-91');
    expect(invoke).toHaveBeenCalledWith('update_coffee_stats', {
      body: { batch_id: 'batch-91', user_id: 'user-91' },
    });
    expect(result.statsUpdated).toBe(true);
  });
});
