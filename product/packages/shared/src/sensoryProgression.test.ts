import { describe, expect, it } from 'vitest';

import {
  buildSensoryUnlockState,
  getRequiredUnlockLevelForTastingNote,
  getUnlockedTastingNoteNames,
} from './sensoryProgression';

describe('sensory progression unlocks', () => {
  it('keeps advanced and expert descriptors locked for beginners', () => {
    const unlocked = getUnlockedTastingNoteNames('beginner');
    expect(unlocked).toContain('chocolate');
    expect(unlocked).not.toContain('stone-fruit');
    expect(unlocked).not.toContain('floral');
  });

  it('unlocks advanced descriptors at advanced level', () => {
    const state = buildSensoryUnlockState(30, ['chocolate', 'stone-fruit', 'floral']);
    expect(state.level).toBe('advanced');
    expect(state.unlockedNames).toContain('stone-fruit');
    expect(state.lockedNames).toContain('floral');
  });

  it('uses effective level override for unlocks without changing score', () => {
    const state = buildSensoryUnlockState(2, ['chocolate', 'stone-fruit', 'floral'], 'advanced');
    expect(state.score).toBe(2);
    expect(state.level).toBe('advanced');
    expect(state.unlockedNames).toContain('stone-fruit');
  });

  it('marks floral descriptors as expert only', () => {
    expect(getRequiredUnlockLevelForTastingNote('jasmine')).toBe('expert');
    expect(getRequiredUnlockLevelForTastingNote('stone_fruit')).toBe('advanced');
    expect(getRequiredUnlockLevelForTastingNote('caramel')).toBe('beginner');
  });
});
