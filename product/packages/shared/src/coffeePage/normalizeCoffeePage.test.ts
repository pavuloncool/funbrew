import { describe, expect, it } from 'vitest';

import { normalizeCoffeePageData, toCanonicalPublicationFields } from './normalizeCoffeePage';

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
          brewing_notes: 'Use softer water.',
          roaster_story: 'Seasonal espresso.',
        },
        coffee: {
          id: 'coffee-1',
          name: 'Demo Coffee',
          variety: 'Bourbon',
          varieties: [{ id: 'var-1', name: 'Bourbon' }],
          processing_method: 'washed',
          producer_notes: 'Stone fruit and sugarcane.',
          cover_image_url: 'https://example.com/cover.png',
          store_url: 'https://shop.example.com/demo-coffee',
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
          roaster_short_name: 'R1',
          city: 'Warsaw',
          country: 'PL',
          logo_url: 'https://example.com/logo.png',
        },
        stats: {
          total_count: 12,
          avg_rating: 4.5,
          rating_distribution: { '5': 9 },
          top_flavor_notes: [],
          favorite_user_count: 7,
        },
      },
      { hash: 'hash-1' }
    );

    expect(result.source).toBe('canonical');
    expect(result.product.name).toBe('Demo Coffee');
    expect(result.product.storeUrl).toBe('https://shop.example.com/demo-coffee');
    expect(result.product.varieties).toEqual([{ id: 'var-1', name: 'Bourbon' }]);
    expect(result.origin.altitudeLabel).toBe('1700-1900 m');
    expect(result.logBatchId).toBe('batch-1');
    expect(result.roaster.shortName).toBe('R1');
    expect(result.origin.altitudeMin).toBe(1700);
    expect(result.origin.altitudeMax).toBe(1900);
    expect(result.stats.favoriteUsersCount).toBe(7);
  });

  it('builds canonical publication fields from normalized data', () => {
    const normalized = normalizeCoffeePageData(
      {
        kind: 'batch',
        archived: false,
        batch: {
          id: 'batch-1',
          roast_date: '2026-05-01',
          lot_number: 'LOT-42',
          brewing_notes: 'Use softer water.',
          roaster_story: 'Seasonal espresso.',
        },
        coffee: {
          id: 'coffee-1',
          name: 'Demo Coffee',
          variety: 'Bourbon',
          varieties: [
            { id: 'var-1', name: 'Bourbon' },
            { id: 'var-2', name: 'Caturra' },
          ],
          processing_method: 'washed',
          producer_notes: 'Stone fruit and sugarcane.',
          cover_image_url: 'https://example.com/cover.png',
          store_url: 'https://shop.example.com/demo-coffee',
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
          roaster_short_name: 'R1',
          city: 'Warsaw',
          country: 'PL',
          logo_url: 'https://example.com/logo.png',
        },
        stats: {
          total_count: 12,
          avg_rating: 4.5,
          rating_distribution: { '5': 9 },
          top_flavor_notes: [],
          favorite_user_count: 7,
        },
      },
      { hash: 'hash-1' }
    );

    const fields = toCanonicalPublicationFields(normalized);
    expect(fields.coffee.name).toBe('Demo Coffee');
    expect(fields.coffee.storeUrl).toBe('https://shop.example.com/demo-coffee');
    expect(fields.coffee.varieties.map((entry) => entry.name)).toEqual(['Bourbon', 'Caturra']);
    expect(fields.origin.country).toBe('Colombia');
    expect(fields.origin.altitudeLabel).toBe('1700-1900 m');
    expect(fields.batch.id).toBe('batch-1');
    expect(fields.batch.roasterStory).toBe('Seasonal espresso.');
    expect(fields.qr.hash).toBe('hash-1');
    expect('url' in fields.qr).toBe(false);
  });
});
