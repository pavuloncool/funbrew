import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { visualSystemTokens } from '@funcup/shared';

const { colors, spacing, radius, typography } = visualSystemTokens;

export const discoverHubStyles = StyleSheet.create({
  list: { gap: spacing.sm - 2 },
  card: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.sm,
    padding: spacing.sm,
    gap: spacing.xs - 2,
    backgroundColor: colors.surfaceElevated,
  },
  title: {
    fontSize: typography.bodyLG,
    lineHeight: typography.lineHeight.bodyLG,
    fontFamily: 'SplineSans_500Medium',
    color: colors.textPrimary,
  },
});

export function followPressableStyle(isFollowed: boolean): ViewStyle {
  return {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.xs + 2,
    paddingHorizontal: spacing.sm - 2,
    paddingVertical: spacing.xs,
    backgroundColor: isFollowed ? colors.accentPrimary : colors.surfaceElevated,
  };
}

export function followLabelStyle(isFollowed: boolean): TextStyle {
  return {
    color: isFollowed ? colors.textOnPrimary : colors.textPrimary,
    fontFamily: 'SplineSans_500Medium',
  };
}
