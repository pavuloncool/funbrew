import { describe, expect, it } from 'vitest';

import {
  aggregateRatingSummary,
  brewMethodsPresentInLogs,
  EMPTY_RATING_DISTRIBUTION,
  filterLogsByBrewMethod,
  topFlavorNotesFromLogs,
  type RoasterTastingLog,
} from './roasterBatchAnalytics';

function note(id: string, label: string, category = 'fruit') {
  return { id, name: id, label, category };
}

function log(
  partial: Omit<Partial<RoasterTastingLog>, 'flavorNotes'> & {
    id: string;
    rating: number;
    flavorNotes?: RoasterTastingLog['flavorNotes'];
  }
): RoasterTastingLog {
  return {
    loggedAt: '2026-01-01T00:00:00.000Z',
    brewMethodId: null,
    brewMethodName: null,
    freeTextNotes: null,
    review: null,
    telemetry: null,
    flavorNotes: [],
    ...partial,
  };
}

describe('roasterBatchAnalytics (US6 / T080)', () => {
  it('aggregates 5 mock tastings: total, average, distribution', () => {
    const logs = [
      log({
        id: '1',
        rating: 5,
        brewMethodId: 'bm-a',
        brewMethodName: 'V60',
        flavorNotes: [note('f1', 'Berry')],
      }),
      log({
        id: '2',
        rating: 4,
        brewMethodId: 'bm-a',
        brewMethodName: 'V60',
        flavorNotes: [note('f1', 'Berry'), note('f2', 'Citrus')],
      }),
      log({
        id: '3',
        rating: 3,
        brewMethodId: 'bm-b',
        brewMethodName: 'Espresso',
        flavorNotes: [note('f2', 'Citrus')],
      }),
      log({
        id: '4',
        rating: 5,
        brewMethodId: 'bm-b',
        brewMethodName: 'Espresso',
        flavorNotes: [note('f3', 'Chocolate')],
      }),
      log({
        id: '5',
        rating: 4,
        brewMethodId: 'bm-b',
        brewMethodName: 'Espresso',
        flavorNotes: [note('f1', 'Berry')],
      }),
    ];

    const summary = aggregateRatingSummary(logs);
    expect(summary.totalTastings).toBe(5);
    expect(summary.avgRating).toBe(4.2);
    expect(summary.ratingDistribution).toEqual({
      ...EMPTY_RATING_DISTRIBUTION,
      '3': 1,
      '4': 2,
      '5': 2,
    });

    const top = topFlavorNotesFromLogs(logs, 10);
    expect(top[0]).toMatchObject({ id: 'f1', count: 3 });
    expect(top.map(t => t.id)).toContain('f2');
    expect(top.map(t => t.id)).toContain('f3');
  });

  it('brew method filter restricts summaries without changing the full set', () => {
    const logs = [
      log({
        id: '1',
        rating: 5,
        brewMethodId: 'bm-a',
        brewMethodName: 'V60',
        flavorNotes: [note('f1', 'Berry')],
      }),
      log({
        id: '2',
        rating: 3,
        brewMethodId: 'bm-b',
        brewMethodName: 'Espresso',
        flavorNotes: [note('f2', 'Citrus')],
      }),
      log({
        id: '3',
        rating: 4,
        brewMethodId: 'bm-b',
        brewMethodName: 'Espresso',
        flavorNotes: [note('f2', 'Citrus')],
      }),
    ];

    const full = aggregateRatingSummary(logs);
    expect(full.totalTastings).toBe(3);

    const v60 = filterLogsByBrewMethod(logs, 'bm-a');
    const esp = filterLogsByBrewMethod(logs, 'bm-b');

    expect(aggregateRatingSummary(v60).totalTastings).toBe(1);
    expect(aggregateRatingSummary(v60).avgRating).toBe(5);
    expect(aggregateRatingSummary(esp).totalTastings).toBe(2);
    expect(aggregateRatingSummary(esp).avgRating).toBe(3.5);

    const methods = brewMethodsPresentInLogs(logs);
    expect(methods.map(m => m.id).sort()).toEqual(['bm-a', 'bm-b']);
  });
});
