import { visualSystemTokens } from '@funcup/shared';
import { StyleSheet } from 'react-native';

const { spacing } = visualSystemTokens;

/**
 * Shared layout styles for user-facing screens.
 * Keep spacing rhythm aligned across app surfaces.
 */
export const pageStyles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    gap: spacing.sm,
  },
  contentCompact: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  topGap: {
    paddingTop: spacing.xs,
  },
  sectionGap: {
    gap: spacing.sm,
  },
  sectionGapTight: {
    gap: spacing.xs,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
});
