/**
 * Visual System (SSoT)
 * - Base palette comes from app-palette.scss
 * - Semantic roles and component recipes are derived from this palette
 */

type Hex = `#${string}`;

type RGB = { r: number; g: number; b: number };

function hexToRgb(hex: Hex): RGB {
  const normalized = hex.replace('#', '');
  const raw = normalized.length === 3
    ? normalized
        .split('')
        .map(part => `${part}${part}`)
        .join('')
    : normalized;

  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);

  return { r, g, b };
}

function withAlpha(hex: Hex, alpha: number): `rgba(${number}, ${number}, ${number}, ${number})` {
  const { r, g, b } = hexToRgb(hex);
  const safe = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${safe})`;
}

export const basePalette = {
  champagneMist: '#f8e4cb',
  champagneMistSoft: '#f6dec0',
  ebony: '#676a5b',
  oliveWood: '#82745e',
  stormyTeal: '#406766',
} as const satisfies Record<string, Hex>;

export const semanticColors = {
  canvas: '#fafafa',
  surface: '#f5f5f5',
  surfaceElevated: '#ffffff',
  surfaceMuted: '#eeeeee',

  textPrimary: '#171717',
  textSecondary: '#525252',
  textMuted: '#737373',
  textOnPrimary: '#ffffff',

  borderDefault: '#a3a3a3',
  borderStrong: '#404040',
  borderSubtle: withAlpha('#404040', 0.2),

  accentPrimary: '#171717',
  accentPrimaryPressed: '#262626',
  accentPrimaryDisabled: '#737373',

  accentSecondary: '#404040',
  accentSecondaryPressed: '#262626',

  success: '#166534',
  warning: '#92400e',
  danger: '#dc2626',

  overlayScrim: withAlpha('#000000', 0.55),
} as const;

export const typographyScale = {
  hero: 42,
  headingXL: 30,
  headingLG: 24,
  headingMD: 20,
  headingSM: 18,
  bodyLG: 16,
  bodyMD: 15,
  bodySM: 13,
  caption: 12,
} as const;

export const spacingScale = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  '3xl': 40,
} as const;

export const radiusScale = {
  xs: 6,
  sm: 10,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const componentRecipes = {
  screen: {
    background: semanticColors.canvas,
    paddingHorizontal: spacingScale.md,
  },
  card: {
    background: semanticColors.surfaceElevated,
    borderColor: semanticColors.borderSubtle,
    borderRadius: radiusScale.md,
    borderWidth: 1,
  },
  input: {
    background: semanticColors.surfaceElevated,
    borderColor: semanticColors.borderDefault,
    borderColorFocus: semanticColors.accentPrimary,
    borderColorError: semanticColors.danger,
    text: semanticColors.textPrimary,
    placeholder: semanticColors.textSecondary,
    borderRadius: radiusScale.sm,
    borderWidth: 1,
    height: 46,
  },
  button: {
    primary: {
      background: semanticColors.accentPrimary,
      backgroundPressed: semanticColors.accentPrimaryPressed,
      backgroundDisabled: semanticColors.accentPrimaryDisabled,
      label: semanticColors.textOnPrimary,
      radius: radiusScale.md,
    },
    secondary: {
      background: semanticColors.surfaceElevated,
      backgroundPressed: semanticColors.surface,
      label: semanticColors.textPrimary,
      borderColor: semanticColors.borderDefault,
      radius: radiusScale.md,
    },
  },
  tabbar: {
    background: semanticColors.surfaceElevated,
    borderTopColor: semanticColors.borderSubtle,
    activeIcon: semanticColors.accentPrimary,
    inactiveIcon: semanticColors.textSecondary,
    fabBackground: semanticColors.accentPrimary,
    fabIcon: semanticColors.textOnPrimary,
  },
} as const;

export const appShellRules = {
  tabsVisibleInAuth: false,
  tabsVisibleInPostLogin: true,
  centralActionRoute: '/(tabs)/hub/scan',
  centralActionLabel: 'Scan Coffee',
} as const;

export const visualSystemTokens = {
  basePalette,
  colors: semanticColors,
  spacing: spacingScale,
  radius: radiusScale,
  typography: typographyScale,
  recipes: componentRecipes,
  appShellRules,
} as const;

export type VisualSystemTokens = typeof visualSystemTokens;
