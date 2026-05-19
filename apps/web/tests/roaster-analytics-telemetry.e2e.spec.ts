import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

import {
  createCoffeeAndBatch,
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

async function createConsumerUser(
  request: APIRequestContext,
  label: string
): Promise<{ userId: string }> {
  const { url, serviceRoleKey } = supabaseEnv();
  const email = `telemetry-consumer-${label}-${Date.now()}@example.com`;
  const password = `Phase4!${randomUUID().slice(0, 8)}`;
  const response = await request.post(`${url}/auth/v1/admin/users`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    data: {
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: `Consumer ${label}` },
    },
  });
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as { id: string };
  return { userId: body.id };
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

async function insertTelemetryBackedLog(params: {
  request: APIRequestContext;
  batchId: string;
  consumerUserId: string;
  brewMethodId: string;
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
      brew_time_seconds: 185,
      free_text_notes: 'Telemetry test note.',
    },
  });
  expect(logResponse.ok()).toBeTruthy();
  const logRows = (await logResponse.json()) as Array<{ id: string }>;
  const coffeeLogId = logRows[0]?.id;
  expect(coffeeLogId).toBeTruthy();

  const telemetryResponse = await params.request.post(
    `${url}/rest/v1/coffee_log_telemetry_core`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      data: {
        coffee_log_id: coffeeLogId,
        brew_method_id: params.brewMethodId,
        overall_rating: 4,
        sensory_acidity: 4,
        sensory_sweetness: 5,
        sensory_body: 3,
        repurchase_intent: 'yes',
        experience_level: 'advanced',
      },
    }
  );
  expect(telemetryResponse.ok()).toBeTruthy();
}

test.describe('roaster telemetry analytics', () => {
  test('owner sees telemetry aggregates for own batch', async ({ page, request }) => {
    const owner = await provisionVerifiedRoaster(request, 'telemetry-owner');
    const { batch } = await createCoffeeAndBatch(request, owner, 'telemetry-owner');
    const consumer = await createConsumerUser(request, 'owner');
    const v60Id = await getBrewMethodId(request, 'V60');
    await insertTelemetryBackedLog({
      request,
      batchId: batch.id,
      consumerUserId: consumer.userId,
      brewMethodId: v60Id,
    });

    await loginViaForm(page, owner);
    await page.goto(`/roaster-hub/analytics/${batch.id}`);
    await page.waitForURL(`**/roaster-hub/analytics/${batch.id}`, { timeout: 20_000 });

    await expect(page.getByText('No tastings logged for this batch yet.')).toHaveCount(0);
    await expect(page.getByText('Telemetry coverage')).toBeVisible();
    await expect(page.getByText('1/ 1')).toBeVisible();
    await expect(page.getByText('4.00', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('5.00', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('3.00', { exact: true }).first()).toBeVisible();
  });

  test('non-owner does not see telemetry for someone else batch', async ({ page, request }) => {
    const owner = await provisionVerifiedRoaster(request, 'telemetry-owner-hidden');
    const intruder = await provisionVerifiedRoaster(request, 'telemetry-intruder');
    const { batch } = await createCoffeeAndBatch(request, owner, 'telemetry-owner-hidden');
    const consumer = await createConsumerUser(request, 'hidden');
    const v60Id = await getBrewMethodId(request, 'V60');
    await insertTelemetryBackedLog({
      request,
      batchId: batch.id,
      consumerUserId: consumer.userId,
      brewMethodId: v60Id,
    });

    await loginViaForm(page, intruder);
    await page.goto(`/roaster-hub/analytics/${batch.id}`);
    await page.waitForURL(`**/roaster-hub/analytics/${batch.id}`, { timeout: 20_000 });

    await expect(page.getByText('No tastings logged for this batch yet.')).toBeVisible();
    await expect(page.getByText('Telemetry coverage')).toBeVisible();
    await expect(page.getByText('0/ 0')).toBeVisible();
  });
});
