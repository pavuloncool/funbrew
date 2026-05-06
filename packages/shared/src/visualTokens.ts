import { semanticColors, spacingScale, typographyScale, visualSystemTokens } from './visualSystem';

/**
 * Backward-compatible token alias kept for existing call sites.
 * New code should prefer `visualSystemTokens`.
 */
export const visualTokens = {
  colors: {
    screenBackground: semanticColors.canvas,
    textPrimary: semanticColors.textPrimary,
    textMuted: semanticColors.textSecondary,
    textMutedWeb: semanticColors.textSecondary,
    borderButton: semanticColors.borderStrong,
    surfaceButton: semanticColors.surfaceElevated,
    textOnButton: semanticColors.textPrimary,
    borderInput: semanticColors.borderDefault,
    textLabel: semanticColors.textPrimary,
    error: semanticColors.danger,
    white: semanticColors.surfaceElevated,
    googleBlue: '#4285f4',
    separatorLine: semanticColors.borderSubtle,
    separatorText: semanticColors.textSecondary,
    loginActionText: semanticColors.textOnPrimary,
    registerPrompt: semanticColors.textSecondary,
    registerLink: semanticColors.accentPrimary,
    tileHover: semanticColors.surface,
  },
  layout: {
    topSectionMaxWidth: 340,
    topSectionMarginTop: spacingScale.xxl,
    socialButtonHeight: 46,
    socialButtonMarginBottom: spacingScale.lg,
    socialButtonGap: spacingScale.xs,
    inputHeight: 46,
    inputBorderRadius: 10,
    inputPaddingHorizontal: spacingScale.sm,
    inputMarginBottom: spacingScale.sm,
    inputBorderWidth: 1,
    screenPaddingHorizontal: spacingScale.md,
    separatorMarginHorizontal: spacingScale.sm,
    registerPromptMarginBottom: spacingScale.lg,
    googleIconSize: 20,
    googleIconRadius: 10,
    loginActionPaddingVertical: spacingScale.sm,
    loginActionPaddingHorizontal: spacingScale.md,
  },
  radius: {
    socialButton: 10,
  },
  fontSize: {
    socialButtonText: typographyScale.bodyMD,
    separatorText: typographyScale.bodyMD,
    loginAction: typographyScale.bodyLG,
    registerPrompt: typographyScale.bodySM,
    googleIcon: typographyScale.bodyMD,
    appleIcon: typographyScale.headingSM,
  },
  fontWeight: {
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
} as const;

export { visualSystemTokens };
