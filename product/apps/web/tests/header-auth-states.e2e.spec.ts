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

const MARKETING_NAV_ITEMS = ['Support', 'About', 'Contact', 'Business'];
const PARTNER_HOME_NAV_ITEMS = ['Stan na dzisiaj', 'Co badamy?', 'Jak to robimy?', 'Co w zamian?', 'Kontakt'];
const HIDDEN_NAV_ITEMS = ['News', 'Individuals'];

async function expectMarketingHeader(page: Page): Promise<void> {
  for (const item of PARTNER_HOME_NAV_ITEMS) {
    await expect(page.getByRole('link', { name: item }).first()).toBeVisible();
  }

  for (const item of [...MARKETING_NAV_ITEMS, ...HIDDEN_NAV_ITEMS]) {
    await expect(page.getByRole('link', { name: item })).toHaveCount(0);
  }

  await expect(page.getByRole('button', { name: 'Roaster Hub' })).toBeVisible();
}

async function expectPartnerHomeHeader(page: Page): Promise<void> {
  for (const item of PARTNER_HOME_NAV_ITEMS) {
    await expect(page.getByRole('link', { name: item }).first()).toBeVisible();
  }

  for (const item of MARKETING_NAV_ITEMS) {
    await expect(page.getByRole('link', { name: item })).toHaveCount(0);
  }

  await expect(page.getByRole('button', { name: 'Roaster Hub' })).toBeVisible();
}

test.describe('header auth states across public routes and roaster workspace', () => {
  test('keeps button states consistent across logout and re-login', async ({ page, request }) => {
    const actor = await provisionVerifiedRoaster(request, 'header-auth-states');
    await completeRoasterProfile(request, actor);

    await page.goto('/');
    await expectPartnerHomeHeader(page);

    await page.goto('/register');
    await expectMarketingHeader(page);

    await page.goto('/business');
    await expectMarketingHeader(page);

    await page.getByRole('button', { name: 'Roaster Hub' }).click();
    await page.waitForURL('**/login', { timeout: 15_000 });
    await expectMarketingHeader(page);

    await loginViaForm(page, actor);
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();

    await page.goto('/');
    await expectPartnerHomeHeader(page);

    await page.goto('/register');
    await expectMarketingHeader(page);

    await page.getByRole('button', { name: 'Roaster Hub' }).click();
    await page.waitForURL('**/roaster-hub', { timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expectPartnerHomeHeader(page);

    await page.getByRole('button', { name: 'Roaster Hub' }).click();
    await page.waitForURL('**/login', { timeout: 15_000 });
    await expectMarketingHeader(page);
    await loginViaForm(page, actor);

    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Logging out…' })).toHaveCount(0);
  });
});
