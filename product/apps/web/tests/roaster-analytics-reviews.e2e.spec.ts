import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

import {
  createCoffeeAndBatch,
  getBrewMethodId,
  logConsumerTasting,
  provisionConsumer,
  provisionVerifiedRoaster,
  type TestActor,
} from './supabase-test-helpers';

async function loginViaForm(page: Page, actor: TestActor): Promise<void> {
  await page.goto('/login');
  await page.getByPlaceholder('Email').fill(actor.email);
  await page.getByPlaceholder('Password').fill(actor.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/roaster-hub', { timeout: 20_000 });
}

async function insertLog(params: {
  request: APIRequestContext;
  batchId: string;
  consumer: Awaited<ReturnType<typeof provisionConsumer>>;
  brewMethodId: string;
  reviewBody?: string;
}): Promise<void> {
  await logConsumerTasting({
    request: params.request,
    consumer: params.consumer,
    batchId: params.batchId,
    rating: 4,
    brewMethodId: params.brewMethodId,
    freeTextNotes: 'Review visibility smoke',
    review: params.reviewBody,
  });
}

test.describe('roaster analytics anonymized reviews', () => {
  test('shows optional review text when consumer added one', async ({
    page,
    request,
  }) => {
    const roaster = await provisionVerifiedRoaster(request, 'reviews-visible');
    const consumer = await provisionConsumer(request, 'reviews-visible');
    const { batch } = await createCoffeeAndBatch(
      request,
      roaster,
      'reviews-visible'
    );
    const v60Id = await getBrewMethodId(request, 'V60');
    const reviewBody =
      'Consumer optional review should appear in anonymized reviews.';
    await insertLog({
      request,
      batchId: batch.id,
      consumer,
      brewMethodId: v60Id,
      reviewBody,
    });

    await loginViaForm(page, roaster);
    await page.goto(`/roaster-hub/analytics/${batch.id}`);
    await page.waitForURL(`**/roaster-hub/analytics/${batch.id}`, {
      timeout: 20_000,
    });
    await page.getByRole('tab', { name: 'Other data' }).click();
    await expect(
      page.getByRole('heading', { name: 'Anonymized optional reviews' })
    ).toBeVisible();
    await expect(page.getByText(reviewBody)).toBeVisible();
    await expect(
      page.getByText('No written reviews for this batch yet.')
    ).toHaveCount(0);
  });

  test('keeps empty-state when no review exists', async ({ page, request }) => {
    const roaster = await provisionVerifiedRoaster(request, 'reviews-empty');
    const consumer = await provisionConsumer(request, 'reviews-empty');
    const { batch } = await createCoffeeAndBatch(
      request,
      roaster,
      'reviews-empty'
    );
    const v60Id = await getBrewMethodId(request, 'V60');
    await insertLog({
      request,
      batchId: batch.id,
      consumer,
      brewMethodId: v60Id,
    });

    await loginViaForm(page, roaster);
    await page.goto(`/roaster-hub/analytics/${batch.id}`);
    await page.waitForURL(`**/roaster-hub/analytics/${batch.id}`, {
      timeout: 20_000,
    });
    await page.getByRole('tab', { name: 'Other data' }).click();
    await expect(
      page.getByRole('heading', { name: 'Anonymized optional reviews' })
    ).toBeVisible();
    await expect(
      page.getByText('No written reviews for this batch yet.')
    ).toBeVisible();
  });
});
