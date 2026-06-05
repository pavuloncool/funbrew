import { expect, test } from '@playwright/test';

import {
  createBatchForCoffee,
  createCoffeeOnly,
  getBrewMethodId,
  logConsumerTasting,
  provisionConsumer,
  provisionVerifiedRoaster,
  refreshCoffeeStats,
  supabaseEnv,
} from './supabase-test-helpers';

test.describe('supabase data contract', () => {
  test('orphan coffees audit stays at zero after migrations', async ({ request }) => {
    const { url, serviceRoleKey } = supabaseEnv();
    const stableCutoff = encodeURIComponent(new Date(Date.now() - 60_000).toISOString());
    const response = await request.get(
      `${url}/rest/v1/orphan_coffees_report?select=coffee_id&issue_type=eq.coffee_without_batch&detected_at=lt.${stableCutoff}`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const rows = (await response.json()) as Array<{ coffee_id: string }>;
    expect(rows).toEqual([]);
  });

  test('saved batches can generate public qr handoff immediately', async ({ request }) => {
    const actor = await provisionVerifiedRoaster(request, 'qr-handoff-ready');
    const coffee = await createCoffeeOnly(request, actor, 'qr-handoff-ready');
    const batch = await createBatchForCoffee(request, coffee.id, 'qr-handoff-ready');
    const { url, anonKey } = supabaseEnv();

    const response = await request.post(`${url}/functions/v1/ensure_batch_qr`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${actor.accessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        batchId: batch.id,
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { hash?: string; lotNumber?: string };
    expect(body.hash).toBeTruthy();
    expect(body.lotNumber).toBeTruthy();
  });

  test('canonical tasting flow persists review and aggregated rating', async ({ request }) => {
    const roaster = await provisionVerifiedRoaster(request, 'canonical-tasting-contract');
    const consumer = await provisionConsumer(request, 'canonical-tasting-contract');
    const { batch } = await (async () => {
      const coffee = await createCoffeeOnly(request, roaster, 'canonical-tasting-contract');
      const nextBatch = await createBatchForCoffee(request, coffee.id, 'canonical-tasting-contract');
      return { batch: nextBatch };
    })();
    const brewMethodId = await getBrewMethodId(request, 'V60');
    const reviewBody = 'Contract review should persist end-to-end.';
    const { coffeeLogId } = await logConsumerTasting({
      request,
      consumer,
      batchId: batch.id,
      rating: 5,
      brewMethodId,
      freeTextNotes: 'Contract free-text note.',
      review: reviewBody,
    });
    await refreshCoffeeStats({ request, batchId: batch.id, consumer });

    const { url, serviceRoleKey } = supabaseEnv();
    const reviewResponse = await request.get(
      `${url}/rest/v1/reviews?select=body&coffee_log_id=eq.${coffeeLogId}&limit=1`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );
    expect(reviewResponse.ok()).toBeTruthy();
    const reviews = (await reviewResponse.json()) as Array<{ body: string }>;
    expect(reviews[0]?.body).toBe(reviewBody);

    const statsResponse = await request.get(
      `${url}/rest/v1/coffee_stats?select=avg_rating,total_count,rating_distribution&batch_id=eq.${batch.id}&limit=1`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );
    expect(statsResponse.ok()).toBeTruthy();
    const statsRows = (await statsResponse.json()) as Array<{
      avg_rating: number;
      total_count: number;
      rating_distribution: Record<string, number>;
    }>;
    expect(statsRows[0]?.avg_rating).toBe(5);
    expect(statsRows[0]?.total_count).toBe(1);
    expect(statsRows[0]?.rating_distribution?.['5']).toBe(1);
  });
});
