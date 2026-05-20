import { describe, expect, it, vi } from 'vitest';

import { uploadCoffeeLabelToSupabase } from './uploadCoffeeLabel';

describe('uploadCoffeeLabelToSupabase', () => {
  it('uploads once, uses coffee-labels bucket, returns public URL (no base64)', async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const getPublicUrl = vi.fn().mockReturnValue({
      data: {
        publicUrl: 'http://127.0.0.1:54321/storage/v1/object/public/coffee-labels/bean-lab/u.png',
      },
    });
    const from = vi.fn().mockReturnValue({ upload, getPublicUrl });
    const supabase = { storage: { from } } as unknown as Parameters<
      typeof uploadCoffeeLabelToSupabase
    >[0];

    const file = new File([new Uint8Array([137, 80, 78, 71])], 'label.png', { type: 'image/png' });
    const url = await uploadCoffeeLabelToSupabase(supabase, file, 'Bean Lab');

    expect(from).toHaveBeenCalledWith('coffee-labels');
    expect(upload).toHaveBeenCalledTimes(1);
    const uploadPath = upload.mock.calls[0]?.[0] as string;
    expect(uploadPath).toMatch(/^bean-lab\/[0-9a-f-]{36}\.png$/i);
    expect(url).toContain('/coffee-labels/');
    expect(url.startsWith('http')).toBe(true);
    expect(url.includes('base64')).toBe(false);
  });

  it('throws when file exceeds size limit before upload', async () => {
    const from = vi.fn();
    const supabase = { storage: { from } } as unknown as Parameters<
      typeof uploadCoffeeLabelToSupabase
    >[0];
    const big = new Uint8Array(512_001);
    const file = new File([big], 'big.png', { type: 'image/png' });

    await uploadCoffeeLabelToSupabase(supabase, file, 'R')
      .then(() => {
        throw new Error('Expected uploadCoffeeLabelToSupabase to reject for oversized files');
      })
      .catch((error: unknown) => {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toMatch(/File too large/);
      });
    expect(from).not.toHaveBeenCalled();
  });
});
