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
  canvas: '#e9e37f',
  surface: '#e4e4e4',
  surfaceElevated: '#f2f2f2',
  surfaceMuted: '#d8d8d8',

  textPrimary: '#16161c',
  textSecondary: '#2e2e37',
  textMuted: '#6b6b76',
  textOnPrimary: '#fdfdfd',
  textInverse: '#fdfdfd',

  borderDefault: '#1f1f26',
  borderStrong: '#111117',
  borderSubtle: withAlpha('#1f1f26', 0.3),
  borderInverse: withAlpha('#ffffff', 0.35),

  accentPrimary: '#17171d',
  accentPrimaryPressed: '#0d0d12',
  accentPrimaryDisabled: '#6a6a74',

  accentSecondary: '#ece57d',
  accentSecondaryPressed: '#ddd66d',

  heroPrimary: '#df6de6',
  heroSecondary: '#73e2de',
  heroContrast: '#17171d',

  success: '#7be38f',
  warning: '#d4cb5a',
  danger: '#ff5f8e',
  info: '#75dbe7',

  overlayScrim: withAlpha('#0d0d12', 0.6),
} as const;

export const typographyScale = {
  hero: 72,
  headingXL: 58,
  headingLG: 40,
  headingMD: 28,
  headingSM: 22,
  bodyLG: 20,
  bodyMD: 17,
  bodySM: 14,
  caption: 12,
} as const;

export const typographyLineHeight = {
  hero: 74,
  headingXL: 60,
  headingLG: 44,
  headingMD: 32,
  headingSM: 28,
  bodyLG: 28,
  bodyMD: 24,
  bodySM: 20,
  caption: 16,
} as const;

export const typographyTracking = {
  tighter: -1.2,
  tight: -0.6,
  normal: 0,
  wide: 0.6,
  wider: 1,
} as const;

export const typographyFontFamily = {
  displayWeb: "'Spline Sans', 'Avenir Next', 'Segoe UI', sans-serif",
  bodyWeb: "'Spline Sans', 'Avenir Next', 'Segoe UI', sans-serif",
  monoWeb: "'IBM Plex Mono', 'SFMono-Regular', ui-monospace, monospace",
  displayNative: 'SplineSans_700Bold',
  bodyNative: 'SplineSans_400Regular',
  monoNative: 'Courier',
} as const;

export const typography = {
  ...typographyScale,
  fontFamily: typographyFontFamily,
  lineHeight: typographyLineHeight,
  tracking: typographyTracking,
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
  '4xl': 56,
} as const;

export const radiusScale = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const elevationScale = {
  web: {
    none: 'none',
    sm: '4px 4px 0 rgba(17, 17, 23, 1)',
    md: '8px 8px 0 rgba(17, 17, 23, 1)',
    lg: '12px 12px 0 rgba(17, 17, 23, 1)',
  },
  native: {
    none: { shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
    sm: {
      shadowColor: '#111117',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.09,
      shadowRadius: 10,
      elevation: 2,
    },
    md: {
      shadowColor: '#111117',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.13,
      shadowRadius: 20,
      elevation: 5,
    },
    lg: {
      shadowColor: '#111117',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.2,
      shadowRadius: 30,
      elevation: 8,
    },
  },
} as const;

export const motionTokens = {
  duration: {
    instant: 80,
    fast: 140,
    normal: 220,
    slow: 320,
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    emphasize: 'cubic-bezier(0.22, 1, 0.36, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  },
  press: {
    scale: 0.98,
    opacity: 0.92,
  },
  hover: {
    opacityBoost: 1.02,
  },
  focus: {
    ringWidth: 2,
    ringColor: withAlpha('#406766', 0.45),
    ringOffset: 2,
  },
} as const;

export const gradientTokens = {
  heroWeb: `linear-gradient(135deg, #df6de6 0%, #ffb55e 45%, #73e2de 100%)`,
  cardWeb: `linear-gradient(180deg, #efefef 0%, #e4e4e4 100%)`,
  meshWeb: `linear-gradient(180deg, #e9e37f 0%, #e9e37f 100%)`,
  heroNative: {
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    colors: [basePalette.stormyTeal, basePalette.ebony, basePalette.oliveWood],
  },
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
    shadow: elevationScale.native.sm,
  },
  input: {
    background: semanticColors.surfaceElevated,
    borderColor: semanticColors.borderDefault,
    borderColorFocus: semanticColors.heroPrimary,
    borderColorError: semanticColors.danger,
    text: semanticColors.textPrimary,
    placeholder: semanticColors.textSecondary,
    borderRadius: radiusScale.sm,
    borderWidth: 1,
    height: 48,
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
      background: semanticColors.accentSecondary,
      backgroundPressed: semanticColors.accentSecondaryPressed,
      label: semanticColors.textPrimary,
      borderColor: semanticColors.borderStrong,
      radius: radiusScale.md,
    },
    contrast: {
      background: semanticColors.heroPrimary,
      backgroundPressed: semanticColors.heroContrast,
      label: semanticColors.textInverse,
      radius: radiusScale.md,
    },
  },
  tabbar: {
    background: semanticColors.surfaceElevated,
    borderTopColor: semanticColors.borderSubtle,
    activeIcon: semanticColors.accentPrimary,
    inactiveIcon: semanticColors.textSecondary,
    fabBackground: semanticColors.heroPrimary,
    fabIcon: semanticColors.textInverse,
  },
} as const;

export const appShellRules = {
  tabsVisibleInAuth: false,
  tabsVisibleInPostLogin: true,
  centralActionRoute: '/(tabs)/scan/scan',
  centralActionLabel: 'Scan Coffee',
} as const;

export const visualSystemTokens = {
  basePalette,
  colors: semanticColors,
  spacing: spacingScale,
  radius: radiusScale,
  typography,
  elevation: elevationScale,
  motion: motionTokens,
  gradients: gradientTokens,
  recipes: componentRecipes,
  appShellRules,
} as const;

export type VisualSystemTokens = typeof visualSystemTokens;
