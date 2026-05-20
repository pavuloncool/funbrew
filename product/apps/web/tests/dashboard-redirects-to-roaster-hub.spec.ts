import { expect, test } from '@playwright/test';

/** Assert Next `redirects()` legacy path → `/roaster-hub/*` (HTTP redirect, no client auth). */
test.describe('Legacy /dashboard routes redirect to new destinations', () => {
  test('/dashboard/coffees responds with redirect to /roaster-hub/batches', async ({ request }) => {
    const res = await request.get('/dashboard/coffees', { maxRedirects: 0 });
    expect([301, 302, 307, 308]).toContain(res.status());
    const loc = res.headers().location ?? '';
    expect(loc.replace(/\/$/, '')).toMatch(/\/roaster-hub\/batches$/);
  });

  test('/dashboard/roaster/setup responds with redirect to /roaster-hub/setup', async ({ request }) => {
    const res = await request.get('/dashboard/roaster/setup', { maxRedirects: 0 });
    expect([301, 302, 307, 308]).toContain(res.status());
    const loc = res.headers().location ?? '';
    expect(loc.replace(/\/$/, '')).toMatch(/\/roaster-hub\/setup$/);
  });
});
