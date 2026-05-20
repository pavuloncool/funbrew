import { visualSystemTokens } from '@funcup/shared';
import { StyleSheet } from 'react-native';

const { colors, spacing, typography } = visualSystemTokens;

export const mobileEntrySplashStyles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
  },
  white: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hit: {
    minWidth: 160,
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  wordmark: {
    marginTop: spacing.md,
    fontSize: 28,
    letterSpacing: 1.2,
    color: colors.textPrimary,
    fontFamily: 'SplineSans_700Bold',
    lineHeight: typography.lineHeight.headingLG,
  },
  confettiFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.borderSubtle,
  },
  particleHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  beanWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
