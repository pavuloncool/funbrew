import { expect, test } from '@playwright/test';

import {
  createCoffeeAndBatch,
  provisionVerifiedRoaster,
} from './supabase-test-helpers';

const webBase = () => process.env.WEB_BASE_URL ?? 'http://127.0.0.1:3000';

type ApiBatchQrResponse = {
  created: boolean;
  hash: string;
  lotNumber: string;
  url: string;
  svg: string;
  png: string;
  error?: string;
  message?: string;
};

test.describe('POST /api/batch-qr', () => {
  test('returns svg, png, hash, and url for owned batch', async ({ request }) => {
    const actor = await provisionVerifiedRoaster(request, 'batch-qr');
    const { batch } = await createCoffeeAndBatch(request, actor, 'batch-qr');

    const res = await request.post(`${webBase()}/api/batch-qr`, {
      headers: {
        Authorization: `Bearer ${actor.accessToken}`,
        'Content-Type': 'application/json',
      },
      data: { batchId: batch.id },
    });

    expect(res.status()).toBe(200);
    const body = (await res.json()) as ApiBatchQrResponse;
    expect(body.svg).toContain('<svg');
    expect(body.png.length).toBeGreaterThan(32);
    expect(body.hash).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(body.url).toContain(`/q/${body.hash}`);
  });

  test('returns 404 for unknown batchId', async ({ request }) => {
    const actor = await provisionVerifiedRoaster(request, 'batch-qr-404');

    const response = await request.post(`${webBase()}/api/batch-qr`, {
      headers: {
        Authorization: `Bearer ${actor.accessToken}`,
        'Content-Type': 'application/json',
      },
      data: { batchId: '11111111-1111-4111-8111-111111111111' },
    });

    expect(response.status()).toBe(404);
    const body = (await response.json()) as ApiBatchQrResponse;
    expect(body.error).toBe('not_found');
  });

  test('returns 403 when batch belongs to another roaster', async ({ request }) => {
    const owner = await provisionVerifiedRoaster(request, 'batch-qr-owner');
    const intruder = await provisionVerifiedRoaster(request, 'batch-qr-intruder');
    const { batch } = await createCoffeeAndBatch(request, owner, 'batch-qr-forbidden');

    const response = await request.post(`${webBase()}/api/batch-qr`, {
      headers: {
        Authorization: `Bearer ${intruder.accessToken}`,
        'Content-Type': 'application/json',
      },
      data: { batchId: batch.id },
    });

    expect(response.status()).toBe(403);
    const body = (await response.json()) as ApiBatchQrResponse;
    expect(body.error).toBe('forbidden');
  });
});
