import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

import {
  createCoffeeAndBatch,
  insertQrCodeForBatch,
  provisionVerifiedRoaster,
} from './supabase-test-helpers';

test('US2 happy path: seeded batch -> /q/{hash} opens app handoff without scan_qr', async ({
  page,
  request,
}) => {
  const actor = await provisionVerifiedRoaster(request, 'us2-happy-path');
  const { coffee, batch } = await createCoffeeAndBatch(request, actor, 'us2-happy-path');
  const hash = randomUUID();
  await insertQrCodeForBatch(request, batch.id, hash, 'us2-happy-path');

  let scanQrCalls = 0;
  await page.route('**/functions/v1/scan_qr', async (route) => {
    scanQrCalls += 1;
    await route.abort();
  });

  await page.goto(`/q/${hash}`);
  await expect(page.getByRole('heading', { name: 'Open this coffee in fun•brew' })).toBeVisible({
    timeout: 25_000,
  });
  await expect(page.getByText(`Hash ${hash}`)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open in app' })).toHaveAttribute(
    'href',
    `funcup://q/${hash}`
  );
  await expect(page.getByText('This web page no longer renders batch details.')).toBeVisible();
  await expect(page.getByText(coffee.name)).toHaveCount(0);
  await expect(page.getByText(actor.roasterName)).toHaveCount(0);
  await expect(page.getByText(batch.lot_number)).toHaveCount(0);
  expect(scanQrCalls).toBe(0);
});
