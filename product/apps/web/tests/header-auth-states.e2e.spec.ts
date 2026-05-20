import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { provisionVerifiedRoaster, supabaseEnv, type TestActor } from './supabase-test-helpers';

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

async function loginViaForm(page: Page, actor: TestActor): Promise<void> {
  await page.getByPlaceholder('Email').fill(actor.email);
  await page.getByPlaceholder('Password').fill(actor.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/roaster-hub', { timeout: 20_000 });
}

test.describe('header auth states across public routes and roaster workspace', () => {
  test('keeps button states consistent across logout and re-login', async ({ page, request }) => {
    const actor = await provisionVerifiedRoaster(request, 'header-auth-states');
    await completeRoasterProfile(request, actor);

    await page.goto('/home');
    await expect(page.getByRole('button', { name: 'My Roaster Hub' })).toBeVisible();

    await page.getByRole('button', { name: 'My Roaster Hub' }).click();
    await page.waitForURL('**/login', { timeout: 15_000 });

    await loginViaForm(page, actor);
    await expect(page.getByRole('button', { name: 'Wyloguj' })).toBeVisible();

    await page.goto('/home');
    await expect(page.getByRole('button', { name: 'My Roaster Hub' })).toBeVisible();

    await page.getByRole('button', { name: 'My Roaster Hub' }).click();
    await page.waitForURL('**/roaster-hub', { timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Wyloguj' })).toBeVisible();

    await page.getByRole('button', { name: 'Wyloguj' }).click();
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByRole('button', { name: 'My Roaster Hub' })).toBeVisible();

    await page.getByRole('button', { name: 'My Roaster Hub' }).click();
    await page.waitForURL('**/login', { timeout: 15_000 });
    await loginViaForm(page, actor);

    await expect(page.getByRole('button', { name: 'Wyloguj' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Wylogowywanie…' })).toHaveCount(0);
  });
});
