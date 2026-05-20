import { describe, expect, it, vi } from 'vitest';

import { upsertCoffeeCoverImageForBatch } from './canonicalBatchFlow';
import * as uploadCoffeeLabel from './uploadCoffeeLabel';

describe('upsertCoffeeCoverImageForBatch', () => {
  it('returns null when no file is provided', async () => {
    const update = vi.fn();
    const eq = vi.fn();
    const from = vi.fn().mockReturnValue({ update });
    const supabase = { from } as unknown as Parameters<typeof upsertCoffeeCoverImageForBatch>[0]['supabase'];

    const result = await upsertCoffeeCoverImageForBatch({
      supabase,
      coffeeId: 'coffee-1',
      roasterId: 'roaster-1',
      roasterShortName: 'Bean Lab',
    });

    expect(result).toBeNull();
    expect(from).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(eq).not.toHaveBeenCalled();
  });

  it('uploads and updates canonical coffees.cover_image_url when file exists', async () => {
    vi.spyOn(uploadCoffeeLabel, 'uploadCoffeeLabelToSupabase').mockResolvedValue(
      'https://cdn.example/cover.png'
    );
    const eqSecond = vi.fn().mockResolvedValue({ error: null });
    const eqFirst = vi.fn().mockReturnValue({ eq: eqSecond });
    const update = vi.fn().mockReturnValue({ eq: eqFirst });
    const from = vi.fn().mockReturnValue({ update });
    const supabase = { from } as unknown as Parameters<typeof upsertCoffeeCoverImageForBatch>[0]['supabase'];
    const file = new File([new Uint8Array([1, 2, 3])], 'cover.png', { type: 'image/png' });

    const result = await upsertCoffeeCoverImageForBatch({
      supabase,
      coffeeId: 'coffee-1',
      roasterId: 'roaster-1',
      roasterShortName: 'Bean Lab',
      file,
    });

    expect(result).toBe('https://cdn.example/cover.png');
    expect(uploadCoffeeLabel.uploadCoffeeLabelToSupabase).toHaveBeenCalledWith(
      supabase,
      file,
      'Bean Lab'
    );
    expect(from).toHaveBeenCalledWith('coffees');
    expect(update).toHaveBeenCalledWith({ cover_image_url: 'https://cdn.example/cover.png' });
    expect(eqFirst).toHaveBeenCalledWith('id', 'coffee-1');
    expect(eqSecond).toHaveBeenCalledWith('roaster_id', 'roaster-1');
  });
});
