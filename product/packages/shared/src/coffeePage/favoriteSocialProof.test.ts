import { describe, expect, it } from 'vitest';

import { formatFavoriteUsersCopy } from './favoriteSocialProof';

describe('formatFavoriteUsersCopy', () => {
  it('returns null for zero favorites', () => {
    expect(formatFavoriteUsersCopy(0)).toBeNull();
  });

  it('pluralizes singular and plural social proof text', () => {
    expect(formatFavoriteUsersCopy(1)).toBe("1 user's favourite coffee");
    expect(formatFavoriteUsersCopy(3)).toBe("3 users' favourite coffee");
  });
});
