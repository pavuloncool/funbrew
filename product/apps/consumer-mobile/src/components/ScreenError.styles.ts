import { StyleSheet } from 'react-native';
import { visualSystemTokens } from '@funcup/shared';

const { colors, spacing, radius, typography } = visualSystemTokens;

export const screenErrorStyles = StyleSheet.create({
  wrap: {
    padding: spacing.lg,
    gap: spacing.sm - 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surfaceMuted,
  },
  title: {
    fontSize: typography.bodyLG,
    lineHeight: typography.lineHeight.bodyLG,
    fontFamily: 'SplineSans_700Bold',
    color: colors.danger,
  },
  body: {
    fontSize: typography.bodyMD,
    lineHeight: typography.lineHeight.bodyMD,
    fontFamily: 'SplineSans_400Regular',
    color: colors.textSecondary,
  },
  button: {
    alignSelf: 'flex-start',
    marginTop: spacing.xxs,
    backgroundColor: colors.danger,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.xs + 2,
  },
  buttonLabel: {
    color: colors.textOnPrimary,
    fontFamily: 'SplineSans_700Bold',
    fontSize: typography.bodySM,
    lineHeight: typography.lineHeight.bodySM,
  },
});
