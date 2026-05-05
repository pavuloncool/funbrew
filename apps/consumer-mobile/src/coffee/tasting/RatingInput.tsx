import { visualSystemTokens } from '@funcup/shared';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppPanel, AppText } from '../../components/ui/primitives';

export function RatingInput(props: {
  value: number | null;
  onChange: (value: number) => void;
  label?: string;
}) {
  return (
    <AppPanel style={styles.section}>
      <AppText variant="body" weight="600">
        {props.label ?? 'Rating *'}
      </AppText>
      <View style={styles.options}>
        {[1, 2, 3, 4, 5].map((value) => {
          const selected = value === props.value;
          return (
            <Pressable
              key={value}
              onPress={() => props.onChange(value)}
              style={[styles.option, selected && styles.optionSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Rating ${value}`}
            >
              <AppText tone={selected ? 'onPrimary' : 'primary'} weight="700">
                {value}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </AppPanel>
  );
}

const styles = StyleSheet.create({
  section: { paddingVertical: 12, gap: visualSystemTokens.spacing.xs },
  options: {
    flexDirection: 'row',
    gap: visualSystemTokens.spacing.xs,
  },
  option: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: visualSystemTokens.colors.borderSubtle,
    backgroundColor: visualSystemTokens.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: {
    borderColor: visualSystemTokens.colors.accentPrimary,
    backgroundColor: visualSystemTokens.colors.accentPrimary,
  },
});
