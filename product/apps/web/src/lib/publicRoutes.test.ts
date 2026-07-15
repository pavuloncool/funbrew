import { describe, expect, it } from 'vitest';

import { isPublicRoute } from './publicRoutes';

describe('publicRoutes', () => {
  it('treats the privacy policy as a public route', () => {
    expect(isPublicRoute('/privacy')).toBe(true);
  });
});
