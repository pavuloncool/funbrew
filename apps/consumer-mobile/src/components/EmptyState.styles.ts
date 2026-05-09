import { StyleSheet } from 'react-native';
import { visualSystemTokens } from '@funcup/shared';

const { colors, spacing, typography } = visualSystemTokens;

export const emptyStateStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: spacing.xl + 4,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  icon: { marginBottom: spacing.xxs },
  title: {
    fontSize: typography.bodyLG,
    lineHeight: typography.lineHeight.bodyLG,
    fontFamily: 'SplineSans_700Bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.bodyMD,
    lineHeight: typography.lineHeight.bodyMD,
    fontFamily: 'SplineSans_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footer: { marginTop: spacing.xs, width: '100%', alignItems: 'center' },
});
