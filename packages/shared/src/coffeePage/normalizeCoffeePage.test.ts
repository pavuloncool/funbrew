import { describe, expect, it } from 'vitest';

import { normalizeCoffeePageData } from './normalizeCoffeePage';

describe('normalizeCoffeePageData', () => {
  it('maps canonical batch payload to a unified public model', () => {
    const result = normalizeCoffeePageData(
      {
        kind: 'batch',
        archived: false,
        batch: {
          id: 'batch-1',
          roast_date: '2026-05-01',
          lot_number: 'LOT-42',
          status: 'active',
          brewing_notes: 'Use softer water.',
          roaster_story: 'Seasonal espresso.',
        },
        coffee: {
          id: 'coffee-1',
          name: 'Demo Coffee',
          variety: 'Bourbon',
          processing_method: 'washed',
          producer_notes: 'Stone fruit and sugarcane.',
          cover_image_url: 'https://example.com/cover.png',
          status: 'active',
        },
        origin: {
          country: 'Colombia',
          region: 'Huila',
          farm: 'El Paraiso',
          producer: 'A. Producer',
          altitude_min: 1700,
          altitude_max: 1900,
        },
        roaster: {
          id: 'roaster-1',
          name: 'Roaster One',
          city: 'Warsaw',
          country: 'PL',
          logo_url: 'https://example.com/logo.png',
        },
        stats: {
          total_count: 12,
          avg_rating: 4.5,
          rating_distribution: { '5': 9 },
          top_flavor_notes: [],
        },
      },
      { hash: 'hash-1' }
    );

    expect(result.source).toBe('canonical');
    expect(result.product.name).toBe('Demo Coffee');
    expect(result.origin.altitudeLabel).toBe('1700-1900 m');
    expect(result.logBatchId).toBe('batch-1');
  });
});
