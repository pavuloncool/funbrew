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

  it('maps tag payload to the same public model', () => {
    const result = normalizeCoffeePageData(
      {
        kind: 'tag',
        archived: false,
        tag: {
          id: 'tag-1',
          public_hash: 'hash-2',
          roaster_id: 'roaster-2',
          roaster_short_name: 'Bean Lab',
          img_coffee_label: 'https://example.com/label.png',
          bean_origin_country: 'Ethiopia',
          bean_origin_farm: 'Konga',
          bean_origin_tradename: '',
          bean_origin_region: 'Yirgacheffe',
          bean_type: 'arabica',
          bean_varietal_main: 'Heirloom',
          bean_varietal_extra: '',
          bean_origin_height: 1900,
          bean_processing: 'washed',
          bean_roast_date: '2026-05-02',
          bean_roast_level: 'light',
          brew_method: 'V60',
          tasting_note_ids: [],
          created_at: '',
          updated_at: '',
        },
        tasting_notes: [
          { id: 'tn-1', name: 'berry', label: 'Berry', category: 'fruity' },
        ],
      },
      { hash: 'hash-2' }
    );

    expect(result.source).toBe('tag');
    expect(result.product.name).toBe('Konga');
    expect(result.brewing.recommendedMethod).toBe('V60');
    expect(result.tastingNotes).toHaveLength(1);
    expect(result.logBatchId).toBeNull();
  });
});
