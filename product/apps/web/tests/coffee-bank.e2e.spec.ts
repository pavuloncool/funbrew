import { expect, test } from '@playwright/test';

test.describe('/coffee-bank compatibility', () => {
  test('redirects to the new batch manager route', async ({ request }) => {
    const res = await request.get('/coffee-bank', { maxRedirects: 0 });
    expect([301, 302, 307, 308]).toContain(res.status());
    const loc = res.headers().location ?? '';
    expect(loc.replace(/\/$/, '')).toMatch(/\/roaster-hub\/batches$/);
  });
});
