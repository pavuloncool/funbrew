import { describe, expect, it } from 'vitest';

import { isPublicRoute } from './publicRoutes';

describe('publicRoutes', () => {
  it('treats the privacy policy as a public route', () => {
    expect(isPublicRoute('/privacy')).toBe(true);
  });

  it('treats partner program detail pages as public routes', () => {
    expect(isPublicRoute('/co-badamy')).toBe(true);
    expect(isPublicRoute('/jak-to-robimy')).toBe(true);
  });
});
