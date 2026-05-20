import { describe, expect, it } from 'vitest';

import {
  getFlavorNotesForReputation,
  getReputationLevel,
  hasExpertBadge,
  silentReputationUi,
} from '../constants/reputation';
import { reputationThresholds } from '../constants/reputationThresholds';

describe('reputation progression', () => {
  it('advances level at exact threshold boundaries', () => {
    expect(getReputationLevel(0)).toBe('beginner');
    expect(getReputationLevel(reputationThresholds.beginnerToAdvanced - 1)).toBe('beginner');
    expect(getReputationLevel(reputationThresholds.beginnerToAdvanced)).toBe('advanced');
    expect(getReputationLevel(reputationThresholds.advancedToExpert - 1)).toBe('advanced');
    expect(getReputationLevel(reputationThresholds.advancedToExpert)).toBe('expert');
  });

  it('expands flavor-note pool silently per level', () => {
    const beginner = getFlavorNotesForReputation(0);
    const advanced = getFlavorNotesForReputation(reputationThresholds.beginnerToAdvanced);
    const expert = getFlavorNotesForReputation(reputationThresholds.advancedToExpert);

    expect(beginner.length).toBe(12);
    expect(advanced.length).toBe(24);
    expect(expert.length).toBeGreaterThan(advanced.length);
  });

  it('marks expert badge only for expert level', () => {
    expect(hasExpertBadge(reputationThresholds.advancedToExpert - 1)).toBe(false);
    expect(hasExpertBadge(reputationThresholds.advancedToExpert)).toBe(true);
  });
});

describe('anti-gamification guards', () => {
  it('keeps progression UI silent', () => {
    expect(silentReputationUi.showProgressBar).toBe(false);
    expect(silentReputationUi.unlockMessage).toBeNull();
    expect(silentReputationUi.notification).toBeNull();
  });
});
