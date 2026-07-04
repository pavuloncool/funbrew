import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

import {
  createCoffeeAndBatch,
  getBrewMethodId,
  insertTelemetryForLog,
  logConsumerTasting,
  provisionConsumer,
  provisionVerifiedRoaster,
  type TestActor,
  updateBatchDeclaredTelemetry,
} from './supabase-test-helpers';

async function loginViaForm(page: Page, actor: TestActor): Promise<void> {
  await page.goto('/login');
  await page.getByPlaceholder('Email').fill(actor.email);
  await page.getByPlaceholder('Password').fill(actor.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/roaster-hub', { timeout: 20_000 });
}

async function insertTelemetryBackedLog(params: {
  request: APIRequestContext;
  batchId: string;
  consumer: Awaited<ReturnType<typeof provisionConsumer>>;
  brewMethodId: string;
}): Promise<void> {
  const { coffeeLogId } = await logConsumerTasting({
    request: params.request,
    consumer: params.consumer,
    batchId: params.batchId,
    rating: 4,
    brewMethodId: params.brewMethodId,
    freeTextNotes: 'Telemetry test note.',
  });
  await insertTelemetryForLog({
    request: params.request,
    coffeeLogId,
    brewMethodId: params.brewMethodId,
  });
}

test.describe('roaster telemetry analytics', () => {
  test('owner sees telemetry aggregates for own batch', async ({
    page,
    request,
  }) => {
    const owner = await provisionVerifiedRoaster(request, 'telemetry-owner');
    const { batch } = await createCoffeeAndBatch(
      request,
      owner,
      'telemetry-owner'
    );
    await updateBatchDeclaredTelemetry({
      request,
      batchId: batch.id,
      declaredSensoryAcidity: 3,
      declaredSensorySweetness: 4,
      declaredSensoryBody: 2,
      declaredSensoryBitter: 2,
      declaredSensoryAftertaste: 4,
    });
    const consumer = await provisionConsumer(request, 'owner');
    const v60Id = await getBrewMethodId(request, 'V60');
    await insertTelemetryBackedLog({
      request,
      batchId: batch.id,
      consumer,
      brewMethodId: v60Id,
    });

    await loginViaForm(page, owner);
    await page.goto(`/roaster-hub/analytics/${batch.id}`);
    await page.waitForURL(`**/roaster-hub/analytics/${batch.id}`, {
      timeout: 20_000,
    });

    await expect(
      page.getByText('No tastings logged for this batch yet.')
    ).toHaveCount(0);
    await page.getByRole('tab', { name: 'Average rating over time' }).click();
    await expect(
      page.getByRole('tabpanel', { name: 'Average rating over time' })
    ).toBeVisible();
    await page
      .getByRole('tab', { name: 'Declared vs perceived sensory core' })
      .click();
    await expect(
      page.getByRole('tabpanel', { name: 'Declared vs perceived sensory core' })
    ).toBeVisible();
    await expect(page.getByText('Sensory Core coverage').first()).toBeVisible();
    await expect(page.getByText('1/ 1')).toBeVisible();
    await expect(page.getByText('4.00', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('5.00', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('3.00', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('2.00', { exact: true }).first()).toBeVisible();
    await expect(
      page.getByText('Declared vs Perceived Sensory Core')
    ).toBeVisible();
    await expect(
      page.getByText('Consumers perceive higher').first()
    ).toBeVisible();

    await page.getByRole('button', { name: 'V60' }).click();
    await expect(
      page.getByText('Filtered by brew method.').first()
    ).toBeVisible();
  });

  test('non-owner does not see telemetry for someone else batch', async ({
    page,
    request,
  }) => {
    const owner = await provisionVerifiedRoaster(
      request,
      'telemetry-owner-hidden'
    );
    const intruder = await provisionVerifiedRoaster(
      request,
      'telemetry-intruder'
    );
    const { batch } = await createCoffeeAndBatch(
      request,
      owner,
      'telemetry-owner-hidden'
    );
    const consumer = await provisionConsumer(request, 'hidden');
    const v60Id = await getBrewMethodId(request, 'V60');
    await insertTelemetryBackedLog({
      request,
      batchId: batch.id,
      consumer,
      brewMethodId: v60Id,
    });

    await loginViaForm(page, intruder);
    await page.goto(`/roaster-hub/analytics/${batch.id}`);
    await page.waitForURL(`**/roaster-hub/analytics/${batch.id}`, {
      timeout: 20_000,
    });

    await expect(page.getByText('Sensory Core coverage').first()).toBeVisible();
    await expect(page.getByText('0/ 0')).toBeVisible();
  });
});
