import { expect, test } from '@playwright/test';

import { provisionVerifiedRoaster, supabaseEnv } from './supabase-test-helpers';

test.describe('roaster customer numbers', () => {
  test('auto-assigns a customer number and renders it in roaster views', async ({
    page,
    request,
  }) => {
    const actor = await provisionVerifiedRoaster(request, 'customer-number-ui');
    const { url, serviceRoleKey } = supabaseEnv();

    const profileUpdateResponse = await request.patch(`${url}/rest/v1/roasters?id=eq.${actor.roasterId}`, {
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
    expect(profileUpdateResponse.ok()).toBeTruthy();

    await page.goto('/login');
    await page.getByPlaceholder('Email').fill(actor.email);
    await page.getByPlaceholder('Password').fill(actor.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('**/roaster-hub', { timeout: 20_000 });

    await expect(page.getByText('Numer klienta')).toBeVisible();
    await expect(page.getByText(actor.customerNumber)).toBeVisible();

    await page.goto('/roaster-profile');
    await expect(page.getByText('Numer klienta')).toBeVisible();
    await expect(page.getByText(actor.customerNumber)).toBeVisible();
  });

  test('support provisioning function creates roaster account with customer number', async ({
    request,
  }) => {
    const { url, serviceRoleKey } = supabaseEnv();
    const email = `support-provision-${Date.now()}@example.com`;

    const response = await request.post(`${url}/functions/v1/provision_roaster_account`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      data: {
        email,
        company_name: 'Big Papa Roaster Sp. z o.o.',
        roaster_short_name: 'Big Papa',
        contact_name: 'Big Papa Ops',
        city: 'Warsaw',
        country: 'Poland',
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as {
      user_id: string;
      roaster_id: string;
      customer_number: string;
      temporary_password: string;
    };

    expect(body.user_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(body.roaster_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(body.customer_number).toMatch(/^\d{6}$/);
    expect(body.temporary_password.length).toBeGreaterThanOrEqual(16);

    const userResponse = await request.get(`${url}/auth/v1/admin/users/${body.user_id}`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });
    expect(userResponse.ok()).toBeTruthy();

    const userBody = (await userResponse.json()) as {
      user_metadata?: { must_change_password?: boolean };
    };
    expect(userBody.user_metadata?.must_change_password).toBe(true);
  });
});
