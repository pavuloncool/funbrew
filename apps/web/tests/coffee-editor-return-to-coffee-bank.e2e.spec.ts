import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import {
  createCoffeeAndBatch,
  provisionVerifiedRoaster,
  supabaseEnv,
  type TestActor,
} from './supabase-test-helpers';

async function completeRoasterProfile(
  request: APIRequestContext,
  actor: TestActor
): Promise<void> {
  const { url, serviceRoleKey } = supabaseEnv();
  const response = await request.patch(`${url}/rest/v1/roasters?id=eq.${actor.roasterId}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    data: {
      company_name: `Company ${actor.roasterName}`,
      roaster_short_name: actor.roasterName,
      city: 'Warsaw',
    },
  });
  expect(response.ok()).toBeTruthy();
}

async function enrichCoffeeBatchForParity(
  request: APIRequestContext,
  params: {
    coffeeId: string;
    batchId: string;
  }
): Promise<void> {
  const { url, serviceRoleKey } = supabaseEnv();
  const originInsert = await request.post(`${url}/rest/v1/origins?select=id`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    data: {
      country: 'Colombia',
      region: 'Huila',
      farm: 'La Esperanza',
      producer: 'A. Producer',
      altitude_min: 1700,
      altitude_max: 1900,
    },
  });
  expect(originInsert.ok()).toBeTruthy();
  const originRows = (await originInsert.json()) as Array<{ id: string }>;
  const originId = originRows[0]?.id;
  expect(originId).toBeTruthy();

  const coffeeUpdate = await request.patch(`${url}/rest/v1/coffees?id=eq.${params.coffeeId}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    data: {
      variety: 'Bourbon',
      processing_method: 'washed',
      producer_notes: 'Stone fruit and sugarcane.',
      origin_id: originId,
    },
  });
  expect(coffeeUpdate.ok()).toBeTruthy();

  const batchUpdate = await request.patch(`${url}/rest/v1/roast_batches?id=eq.${params.batchId}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    data: {
      brewing_notes: 'Use softer water.',
      roaster_story: 'Seasonal espresso.',
    },
  });
  expect(batchUpdate.ok()).toBeTruthy();
}

async function loginViaForm(page: Page, actor: TestActor): Promise<void> {
  await page.getByPlaceholder('Email').fill(actor.email);
  await page.getByPlaceholder('Password').fill(actor.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/roaster-hub', { timeout: 20_000 });
}

test.describe('coffee editor return navigation', () => {
  test('returns to /coffee-bank?batch=<id> after save when opened from Coffee Bank', async ({ page, request }) => {
    const actor = await provisionVerifiedRoaster(request, 'coffee-editor-return');
    await completeRoasterProfile(request, actor);
    const { coffee, batch } = await createCoffeeAndBatch(request, actor, 'coffee-editor-return');

    await page.goto('/login');
    await loginViaForm(page, actor);

    await page.goto('/coffee-bank');
    await page.getByRole('link', { name: 'Edit coffee' }).first().click();
    await page.waitForURL(new RegExp(`/roaster-hub/coffees/${coffee.id}\\?batch=`), {
      timeout: 20_000,
    });

    await page.getByRole('button', { name: 'Save coffee' }).click();
    await page.waitForURL(`**/coffee-bank?batch=${batch.id}`, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: coffee.name })).toBeVisible();
  });

  test('stays on editor after save when opened directly without batch query', async ({ page, request }) => {
    const actor = await provisionVerifiedRoaster(request, 'coffee-editor-direct');
    await completeRoasterProfile(request, actor);
    const { coffee } = await createCoffeeAndBatch(request, actor, 'coffee-editor-direct');

    await page.goto('/login');
    await loginViaForm(page, actor);

    await page.goto(`/roaster-hub/coffees/${coffee.id}`);
    await page.waitForURL(`**/roaster-hub/coffees/${coffee.id}`, { timeout: 20_000 });

    await page.getByRole('button', { name: 'Save coffee' }).click();
    await page.waitForTimeout(1200);
    await expect(page).toHaveURL(new RegExp(`/roaster-hub/coffees/${coffee.id}$`));
    await expect(page.getByRole('heading', { name: 'Edit canonical coffee' })).toBeVisible();
  });

  test('returns from batch details to /coffee-bank?batch=<id>', async ({ page, request }) => {
    const actor = await provisionVerifiedRoaster(request, 'batch-details-return');
    await completeRoasterProfile(request, actor);
    const { coffee, batch } = await createCoffeeAndBatch(request, actor, 'batch-details-return');

    await page.goto('/login');
    await loginViaForm(page, actor);

    await page.goto(`/coffee-bank?batch=${batch.id}`);
    await page.getByRole('link', { name: 'Batch details' }).click();
    await page.waitForURL(`**/roaster-hub/coffees/${coffee.id}/batches/${batch.id}`, { timeout: 20_000 });

    await page.getByRole('link', { name: 'Back to Coffee Bank' }).click();
    await page.waitForURL(`**/coffee-bank?batch=${batch.id}`, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: coffee.name })).toBeVisible();
  });

  test('shows coffee name + lot in batch analytics header with batch id as meta', async ({ page, request }) => {
    const actor = await provisionVerifiedRoaster(request, 'analytics-header');
    await completeRoasterProfile(request, actor);
    const { coffee, batch } = await createCoffeeAndBatch(request, actor, 'analytics-header');

    await page.goto('/login');
    await loginViaForm(page, actor);

    await page.goto(`/roaster-hub/analytics/${batch.id}`);
    await page.waitForURL(`**/roaster-hub/analytics/${batch.id}`, { timeout: 20_000 });

    await expect(page.getByText(`Coffee: ${coffee.name}`)).toBeVisible();
    await expect(page.getByText(`Batch/Lot: ${batch.lot_number}`)).toBeVisible();
    await expect(page.getByText(`Batch ID: ${batch.id}`)).toBeVisible();
  });

  test('renders full canonical publication fields on /coffee-bank?batch=*', async ({ page, request }) => {
    const actor = await provisionVerifiedRoaster(request, 'coffee-bank-publication-parity');
    await completeRoasterProfile(request, actor);
    const { coffee, batch } = await createCoffeeAndBatch(request, actor, 'coffee-bank-publication-parity');
    await enrichCoffeeBatchForParity(request, { coffeeId: coffee.id, batchId: batch.id });

    await page.goto('/login');
    await loginViaForm(page, actor);

    await page.goto(`/coffee-bank?batch=${batch.id}`);
    await expect(page.getByRole('heading', { name: coffee.name })).toBeVisible();
    await expect(page.getByText('Variety: Bourbon')).toBeVisible();
    await expect(page.getByText('Processing: washed')).toBeVisible();
    await expect(page.getByText('Producer notes: Stone fruit and sugarcane.')).toBeVisible();
    await expect(page.getByText('Brewing notes: Use softer water.')).toBeVisible();
    await expect(page.getByText('Roaster story: Seasonal espresso.')).toBeVisible();
    await expect(page.getByText('Origin: Colombia · Huila · La Esperanza')).toBeVisible();
    await expect(page.getByText('Origin producer: A. Producer')).toBeVisible();
    await expect(page.getByText('Altitude: 1700-1900 m')).toBeVisible();
  });
});
