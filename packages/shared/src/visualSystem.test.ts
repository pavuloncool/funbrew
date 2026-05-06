import { describe, expect, it } from 'vitest';

import { appShellRules, basePalette, semanticColors, visualSystemTokens } from './visualSystem';

describe('visualSystem', () => {
  it('keeps palette from app-palette.scss', () => {
    expect(basePalette.champagneMist).toBe('#f8e4cb');
    expect(basePalette.ebony).toBe('#676a5b');
    expect(basePalette.oliveWood).toBe('#82745e');
    expect(basePalette.stormyTeal).toBe('#406766');
    expect(basePalette.champagneMistSoft).toBe('#f6dec0');
  });

  it('defines semantic states for primary actions', () => {
    expect(semanticColors.accentPrimary).toMatch(/^#/);
    expect(semanticColors.accentPrimaryPressed).toMatch(/^#/);
    expect(semanticColors.accentPrimaryDisabled).toMatch(/^#/);
    expect(visualSystemTokens.recipes.button.primary.background).toBe(semanticColors.accentPrimary);
  });

  it('defines post-login tabbar shell rule with scan action route', () => {
    expect(appShellRules.tabsVisibleInAuth).toBe(false);
    expect(appShellRules.tabsVisibleInPostLogin).toBe(true);
    expect(appShellRules.centralActionLabel).toBe('Scan Coffee');
    expect(appShellRules.centralActionRoute).toBe('/(tabs)/hub/scan');
  });
});
