import { describe, expect, it, vi } from 'vitest';

import { fetchCoffeeLogDetails, parseCoffeeLogDetails } from './coffeeLogDetails';

describe('coffeeLogDetails', () => {
  it('parses embedded review arrays into canonical read model', () => {
    expect(
      parseCoffeeLogDetails({
        id: 'log-1',
        batch_id: 'batch-1',
        brew_method_id: 'v60',
        rating: 4,
        free_text_notes: 'Juicy',
        logged_at: '2026-01-01T00:00:00.000Z',
        roast_batches: {
          coffees: {
            name: 'Washed Ethiopia',
            cover_image_url: 'https://example.com/washed-ethiopia.png',
            roasters: { name: 'Bean Lab' },
          },
        },
        coffee_log_tasting_notes: [{ tasting_note_id: 'tn-1' }, { tasting_note_id: 'tn-2' }],
        reviews: [{ body: 'Clean and sweet' }],
      })
    ).toEqual({
      id: 'log-1',
      batchId: 'batch-1',
      brewMethodId: 'v60',
      coffeeName: 'Washed Ethiopia',
      coverImageUrl: 'https://example.com/washed-ethiopia.png',
      roasterName: 'Bean Lab',
      loggedAt: '2026-01-01T00:00:00.000Z',
      rating: 4,
      tastingNoteIds: ['tn-1', 'tn-2'],
      freeTextNotes: 'Juicy',
      reviewBody: 'Clean and sweet',
    });
  });

  it('loads details through the shared read contract', async () => {
    const maybeSingle = vi.fn(async () => ({
      data: {
        id: 'log-2',
        batch_id: 'batch-2',
        brew_method_id: null,
        rating: 5,
        free_text_notes: null,
        logged_at: '2026-01-02T00:00:00.000Z',
        roast_batches: { coffees: { name: 'Kenya AA', cover_image_url: null, roasters: null } },
        coffee_log_tasting_notes: [],
        reviews: { body: null },
      },
      error: null,
    }));
    const eqUser = vi.fn(() => ({ maybeSingle }));
    const eqLog = vi.fn(() => ({ eq: eqUser }));
    const select = vi.fn(() => ({ eq: eqLog }));
    const from = vi.fn(() => ({ select }));

    const result = await fetchCoffeeLogDetails(
      { from } as never,
      { logId: 'log-2', userId: 'user-2' }
    );

    expect(from).toHaveBeenCalledWith('coffee_logs');
    expect(eqLog).toHaveBeenCalledWith('id', 'log-2');
    expect(eqUser).toHaveBeenCalledWith('user_id', 'user-2');
    expect(result?.coffeeName).toBe('Kenya AA');
    expect(result?.coverImageUrl).toBeNull();
  });
});
