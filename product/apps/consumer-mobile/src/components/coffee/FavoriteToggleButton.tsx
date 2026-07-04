import { Ionicons } from '@expo/vector-icons';
import { visualSystemTokens } from '@funcup/shared';
import { Pressable, StyleSheet, type GestureResponderEvent } from 'react-native';

import { AppText } from '../ui/primitives';

const { colors, radius, spacing } = visualSystemTokens;

export function FavoriteToggleButton(props: {
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
  label?: string;
  accessibilityLabel?: string;
}) {
  const label = props.label ?? (props.active ? 'Remove favourite' : 'Add favourite');

  return (
    <Pressable
      onPress={(event: GestureResponderEvent) => {
        event.stopPropagation();
        props.onPress();
      }}
      disabled={props.disabled}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.button,
        props.compact ? styles.compact : styles.expanded,
        props.active ? styles.active : styles.inactive,
        pressed && !props.disabled ? styles.pressed : null,
        props.disabled ? styles.disabled : null,
      ]}
    >
      <Ionicons
        name={props.active ? 'star' : 'star-outline'}
        size={props.compact ? 18 : 16}
        color={props.active ? colors.textOnPrimary : colors.accentPrimary}
      />
      {props.compact ? null : (
        <AppText
          variant="bodySm"
          weight="700"
          tone={props.active ? 'onPrimary' : 'secondary'}
          style={styles.label}
        >
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    alignSelf: 'flex-start',
  },
  compact: {
    minWidth: 36,
    minHeight: 36,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
  },
  expanded: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    gap: spacing.xxs,
    borderWidth: 1,
  },
  active: {
    borderColor: colors.accentPrimary,
    backgroundColor: colors.accentPrimary,
  },
  inactive: {
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceElevated,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    marginLeft: spacing.xxs,
  },
});
