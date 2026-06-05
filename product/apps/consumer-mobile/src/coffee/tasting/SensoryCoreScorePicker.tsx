import {
  SENSORY_CORE_SCORE_OPTIONS,
  type SensoryCoreMetric,
  visualSystemTokens,
} from '@funcup/shared';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/ui/primitives';

type Props = {
  editable?: boolean;
  metric: SensoryCoreMetric;
  onChange: (value: number) => void;
  value: number;
};

export function SensoryCoreScorePicker(props: Props) {
  return (
    <View style={styles.root}>
      <AppText tone="secondary" weight="600">{props.metric.label}</AppText>
      <View style={styles.row}>
        <AppText tone="muted" style={styles.scaleLabelLeft}>{props.metric.leftLabel}</AppText>
        <View style={styles.scoreButtons}>
          {SENSORY_CORE_SCORE_OPTIONS.map((option) => {
            const active = props.value === option;
            return (
              <Pressable
                key={option}
                onPress={() => props.editable !== false && props.onChange(option)}
                disabled={props.editable === false}
                style={[styles.scoreButton, active ? styles.scoreButtonActive : null]}
                accessibilityRole="button"
                accessibilityState={{ selected: active, disabled: props.editable === false }}
              >
                <AppText tone={active ? 'onPrimary' : 'secondary'} weight="700">{option}</AppText>
              </Pressable>
            );
          })}
        </View>
        <AppText tone="muted" style={styles.scaleLabelRight}>{props.metric.rightLabel}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: visualSystemTokens.spacing.xs,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: visualSystemTokens.spacing.xxs,
  },
  scaleLabelLeft: {
    flex: 1,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 14,
  },
  scaleLabelRight: {
    flex: 1,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 14,
    textAlign: 'right',
  },
  scoreButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  scoreButton: {
    minWidth: 28,
    minHeight: 28,
    borderRadius: visualSystemTokens.radius.pill,
    borderWidth: 1,
    borderColor: visualSystemTokens.colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreButtonActive: {
    backgroundColor: visualSystemTokens.colors.accentPrimary,
    borderColor: visualSystemTokens.colors.accentPrimary,
  },
});
