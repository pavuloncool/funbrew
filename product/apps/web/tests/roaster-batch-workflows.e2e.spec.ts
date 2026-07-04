import { expect, test, type Page } from '@playwright/test';

import {
  createCoffeeAndBatch,
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

test.describe('roaster batch workflow split', () => {
  test('manage batch detail stays operational and excludes analytics cards', async ({
    page,
    request,
  }) => {
    const roaster = await provisionVerifiedRoaster(request, 'workflow-manage');
    const { batch } = await createCoffeeAndBatch(
      request,
      roaster,
      'workflow-manage'
    );

    await loginViaForm(page, roaster);
    await page.goto(`/roaster-hub/batches/${batch.id}`);
    await page.waitForURL(`**/roaster-hub/batches/${batch.id}`, {
      timeout: 20_000,
    });

    await expect(
      page.getByRole('heading', { name: 'Manage batch' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /save batch publication/i })
    ).toBeVisible();
    await expect(page.getByText('QR Handoff', { exact: true })).toBeVisible();
    await expect(page.getByText('Sensory Core coverage')).toHaveCount(0);
    await expect(
      page.getByRole('heading', { name: 'Anonymized optional reviews' })
    ).toHaveCount(0);
  });

  test('analytics detail shows metrics workflow without manage form', async ({
    page,
    request,
  }) => {
    const roaster = await provisionVerifiedRoaster(
      request,
      'workflow-analytics'
    );
    const { batch, coffee } = await createCoffeeAndBatch(
      request,
      roaster,
      'workflow-analytics'
    );

    await loginViaForm(page, roaster);
    await page.goto(`/roaster-hub/analytics`);
    await page.waitForURL('**/roaster-hub/analytics', { timeout: 20_000 });
    await expect(
      page.getByRole('heading', { name: 'Batch Analytics' })
    ).toBeVisible();
    await expect(page.getByText(coffee.name)).toBeVisible();

    await page.goto(`/roaster-hub/analytics/${batch.id}`);
    await page.waitForURL(`**/roaster-hub/analytics/${batch.id}`, {
      timeout: 20_000,
    });

    await expect(
      page.getByRole('heading', { name: 'Batch Analytics' })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Manage batch' })
    ).toBeVisible();
    await expect(
      page.getByRole('tab', { name: 'Declared vs perceived sensory core' })
    ).toBeVisible();
    await page
      .getByRole('tab', { name: 'Declared vs perceived sensory core' })
      .click();
    await expect(
      page.getByRole('tabpanel', { name: 'Declared vs perceived sensory core' })
    ).toBeVisible();
    await expect(page.getByText('1/ 1')).toBeVisible();
    await expect(page.getByText('QR Handoff')).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: /save batch publication/i })
    ).toHaveCount(0);
  });

  test('legacy analytics hash redirects into the new analytics route', async ({
    page,
    request,
  }) => {
    const roaster = await provisionVerifiedRoaster(request, 'workflow-legacy');
    const { batch } = await createCoffeeAndBatch(
      request,
      roaster,
      'workflow-legacy'
    );

    await loginViaForm(page, roaster);
    await page.goto(`/roaster-hub/batches/${batch.id}#analytics`);
    await page.waitForURL(`**/roaster-hub/analytics/${batch.id}`, {
      timeout: 20_000,
    });

    await expect(
      page.getByRole('heading', { name: 'Batch Analytics' })
    ).toBeVisible();
  });
});
