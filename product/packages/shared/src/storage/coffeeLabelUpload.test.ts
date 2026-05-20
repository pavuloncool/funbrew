import { describe, expect, it } from 'vitest';

import {
  MAX_COFFEE_LABEL_BYTES,
  assertCoffeeLabelFileSize,
  storageSegmentFromRoasterShortName,
} from './coffeeLabelUpload';

describe('coffeeLabelUpload', () => {
  it('accepts files up to max size and rejects larger files', () => {
    const atLimit = { size: MAX_COFFEE_LABEL_BYTES } as File;
    const tooLarge = { size: MAX_COFFEE_LABEL_BYTES + 1 } as File;

    expect(() => assertCoffeeLabelFileSize(atLimit)).not.toThrow();
    expect(() => assertCoffeeLabelFileSize(tooLarge)).toThrowError('File too large');
  });

  it('builds stable storage segments from roaster short names', () => {
    expect(storageSegmentFromRoasterShortName(' Bean Lab ')).toBe('bean-lab');
    expect(storageSegmentFromRoasterShortName('***')).toBe('roaster');
    expect(storageSegmentFromRoasterShortName('Roaster__Name-01')).toBe('roaster__name-01');
    expect(storageSegmentFromRoasterShortName('A'.repeat(80))).toHaveLength(48);
  });
});
