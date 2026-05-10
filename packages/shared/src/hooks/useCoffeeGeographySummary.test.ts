import { describe, expect, it } from 'vitest';

import { buildCoffeeGeographySummary } from './useCoffeeGeographySummary';

describe('buildCoffeeGeographySummary', () => {
  it('aggregates countries, regions and processing methods from tasting logs', () => {
    const summary = buildCoffeeGeographySummary([
      {
        id: '1',
        logged_at: '2026-05-01T10:00:00Z',
        roast_batches: {
          coffees: {
            processing_method: 'washed',
            origin: {
              country: 'Ethiopia',
              region: 'Yirgacheffe',
            },
          },
        },
      },
      {
        id: '2',
        logged_at: '2026-05-02T10:00:00Z',
        roast_batches: {
          coffees: {
            processing_method: 'washed',
            origin: {
              country: 'Ethiopia',
              region: 'Guji',
            },
          },
        },
      },
      {
        id: '3',
        logged_at: '2026-05-03T10:00:00Z',
        roast_batches: {
          coffees: {
            processing_method: 'natural',
            origin: {
              country: 'Colombia',
              region: 'Huila',
            },
          },
        },
      },
    ]);

    expect(summary.totalLogs).toBe(3);
    expect(summary.uniqueCountries).toBe(2);
    expect(summary.topCountries[0]).toEqual({
      country: 'Ethiopia',
      count: 2,
      topRegion: 'Yirgacheffe',
    });
    expect(summary.processingCounts).toEqual([
      { processingMethod: 'washed', count: 2 },
      { processingMethod: 'natural', count: 1 },
    ]);
  });

  it('returns empty aggregates when logs have no origin data', () => {
    const summary = buildCoffeeGeographySummary([
      {
        id: '1',
        logged_at: '2026-05-01T10:00:00Z',
        roast_batches: {
          coffees: {
            processing_method: null,
            origin: null,
          },
        },
      },
    ]);

    expect(summary.uniqueCountries).toBe(0);
    expect(summary.topCountries).toEqual([]);
    expect(summary.processingCounts).toEqual([]);
  });
});
