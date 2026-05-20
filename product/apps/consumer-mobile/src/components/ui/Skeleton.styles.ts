import { StyleSheet } from 'react-native';
import { visualSystemTokens } from '@funcup/shared';

const { colors, spacing, radius } = visualSystemTokens;

export const skeletonStyles = StyleSheet.create({
  page: { padding: spacing.xl, gap: spacing.md },
  section: { gap: spacing.sm - 2, paddingVertical: spacing.xs },
  list: { gap: spacing.sm },
  card: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.sm,
    padding: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.surface,
  },
  block: {
    borderRadius: radius.xs,
    backgroundColor: colors.borderSubtle,
  },
});
