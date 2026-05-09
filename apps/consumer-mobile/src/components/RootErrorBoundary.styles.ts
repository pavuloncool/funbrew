import { visualSystemTokens } from '@funcup/shared';
import { StyleSheet } from 'react-native';

const { colors, radius, spacing, typography } = visualSystemTokens;

export const rootErrorBoundaryStyles = StyleSheet.create({
  center: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.canvas,
  },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.lg,
    backgroundColor: colors.surfaceElevated,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.headingMD,
    lineHeight: typography.lineHeight.headingMD,
    fontFamily: 'SplineSans_700Bold',
    color: colors.textPrimary,
  },
  body: {
    fontSize: typography.bodyMD,
    lineHeight: typography.lineHeight.bodyMD,
    fontFamily: 'SplineSans_400Regular',
    color: colors.textSecondary,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentPrimary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  buttonLabel: { color: colors.textOnPrimary, fontFamily: 'SplineSans_700Bold', fontSize: typography.bodyLG },
});
