import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import {
  createCoffeeAndBatch,
  provisionConsumer,
  provisionVerifiedRoaster,
  supabaseEnv,
  type TestActor,
} from './supabase-test-helpers';

async function loginViaForm(page: Page, actor: TestActor): Promise<void> {
  await page.goto('/login');
  await page.getByPlaceholder('Email').fill(actor.email);
  await page.getByPlaceholder('Password').fill(actor.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/roaster-hub', { timeout: 20_000 });
}

async function getBrewMethodId(request: APIRequestContext, name: string): Promise<string> {
  const { url, serviceRoleKey } = supabaseEnv();
  const response = await request.get(
    `${url}/rest/v1/brew_methods?select=id&name=eq.${encodeURIComponent(name)}&limit=1`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    }
  );
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as Array<{ id: string }>;
  expect(body[0]?.id).toBeTruthy();
  return body[0].id;
}

async function insertLog(params: {
  request: APIRequestContext;
  batchId: string;
  consumerUserId: string;
  brewMethodId: string;
  reviewBody?: string;
}): Promise<void> {
  const { url, serviceRoleKey } = supabaseEnv();

  const logResponse = await params.request.post(`${url}/rest/v1/coffee_logs?select=id`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    data: {
      user_id: params.consumerUserId,
      batch_id: params.batchId,
      rating: 4,
      brew_method_id: params.brewMethodId,
      brew_time_seconds: 180,
      free_text_notes: 'Review visibility smoke',
    },
  });
  expect(logResponse.ok()).toBeTruthy();
  const rows = (await logResponse.json()) as Array<{ id: string }>;
  const coffeeLogId = rows[0]?.id;
  expect(coffeeLogId).toBeTruthy();

  if (params.reviewBody) {
    const reviewResponse = await params.request.post(`${url}/rest/v1/reviews`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      data: {
        coffee_log_id: coffeeLogId,
        body: params.reviewBody,
      },
    });
    expect(reviewResponse.ok()).toBeTruthy();
  }
}

test.describe('roaster analytics anonymized reviews', () => {
  test('shows optional review text when consumer added one', async ({ page, request }) => {
    const roaster = await provisionVerifiedRoaster(request, 'reviews-visible');
    const consumer = await provisionConsumer(request, 'reviews-visible');
    const { batch } = await createCoffeeAndBatch(request, roaster, 'reviews-visible');
    const v60Id = await getBrewMethodId(request, 'V60');
    const reviewBody = 'Consumer optional review should appear in anonymized reviews.';
    await insertLog({
      request,
      batchId: batch.id,
      consumerUserId: consumer.userId,
      brewMethodId: v60Id,
      reviewBody,
    });

    await loginViaForm(page, roaster);
    await page.goto(`/roaster-hub/analytics/${batch.id}`);
    await page.waitForURL(`**/roaster-hub/analytics/${batch.id}`, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Anonymized optional reviews' })).toBeVisible();
    await expect(page.getByText(reviewBody)).toBeVisible();
    await expect(page.getByText('No written reviews for this batch yet.')).toHaveCount(0);
  });

  test('keeps empty-state when no review exists', async ({ page, request }) => {
    const roaster = await provisionVerifiedRoaster(request, 'reviews-empty');
    const consumer = await provisionConsumer(request, 'reviews-empty');
    const { batch } = await createCoffeeAndBatch(request, roaster, 'reviews-empty');
    const v60Id = await getBrewMethodId(request, 'V60');
    await insertLog({
      request,
      batchId: batch.id,
      consumerUserId: consumer.userId,
      brewMethodId: v60Id,
    });

    await loginViaForm(page, roaster);
    await page.goto(`/roaster-hub/analytics/${batch.id}`);
    await page.waitForURL(`**/roaster-hub/analytics/${batch.id}`, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Anonymized optional reviews' })).toBeVisible();
    await expect(page.getByText('No written reviews for this batch yet.')).toBeVisible();
  });
});
