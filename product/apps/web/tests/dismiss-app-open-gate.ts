import type { Page } from '@playwright/test';

/**
 * Animated splash exists only on `/`. Most tests hit other routes and should skip quickly.
 */
export async function dismissAppOpenGate(page: Page) {
  const splash = page.getByRole('button', { name: /Fingerprint funcup/i });
  try {
    await splash.waitFor({ state: 'visible', timeout: 600 });
  } catch {
    return;
  }
  await splash.click();

  const bean = page.getByRole('button', { name: /Coffee Bean/i });
  try {
    await bean.waitFor({ state: 'visible', timeout: 5000 });
    await bean.click();
  } catch {
    // no-op: keep helper resilient if splash implementation changes timing
  }
}
