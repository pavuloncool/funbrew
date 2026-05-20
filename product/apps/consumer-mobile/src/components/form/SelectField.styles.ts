import { visualSystemTokens } from '@funcup/shared';
import { StyleSheet } from 'react-native';

const { colors, radius, spacing, typography } = visualSystemTokens;

export const selectFieldStyles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginBottom: spacing.sm + 2,
  },
  label: {
    fontSize: typography.bodySM,
    fontFamily: 'SplineSans_500Medium',
    color: colors.textPrimary,
    marginBottom: spacing.xs - 2,
  },
  trigger: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  triggerText: {
    fontSize: typography.bodyMD,
    fontFamily: 'SplineSans_400Regular',
    color: colors.textPrimary,
  },
  triggerPlaceholder: {
    fontSize: typography.bodyMD,
    fontFamily: 'SplineSans_400Regular',
    color: colors.textMuted,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayScrim,
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'center',
    maxHeight: '100%',
  },
  sheet: {
    maxHeight: 360,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
  },
  optionRow: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderDefault,
  },
  optionText: {
    fontSize: typography.bodyLG,
    fontFamily: 'SplineSans_400Regular',
    color: colors.textPrimary,
  },
});
