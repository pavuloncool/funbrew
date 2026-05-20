import { expect, test } from '@playwright/test';

import { provisionConsumer, supabaseEnv } from './supabase-test-helpers';

test.describe('log_tasting review durability', () => {
  test('fails hard when review body violates DB constraint', async ({ request }) => {
    const consumer = await provisionConsumer(request, 'log-tasting-invalid-review');
    const { url, anonKey } = supabaseEnv();
    const invalidReview = 'x'.repeat(2001);

    const response = await request.post(`${url}/functions/v1/log_tasting`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${consumer.accessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        batch_id: '41000000-0000-0000-0000-000000000001',
        rating: 4,
        review: invalidReview,
      },
    });

    expect(response.ok()).toBeFalsy();
    const body = (await response.json()) as { error?: string; message?: string };
    expect(body.error).toBe('review_insert_failed');
  });
});
