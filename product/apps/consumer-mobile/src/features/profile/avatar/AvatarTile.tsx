import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { visualSystemTokens } from '@funcup/shared';

import { AppText } from '../../../components/ui/primitives';

export function AvatarTile(props: {
  id: string;
  label: string;
  svg: string;
  selected: boolean;
  onPress: (id: string) => void;
}) {
  const scale = useRef(new Animated.Value(props.selected ? 1.03 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: props.selected ? 1.03 : 1,
      friction: 8,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [props.selected, scale]);

  return (
    <Pressable
      onPress={() => props.onPress(props.id)}
      style={styles.itemPressable}
      accessibilityRole="button"
      accessibilityState={{ selected: props.selected }}
      accessibilityLabel={`Avatar ${props.label}`}
    >
      <Animated.View
        style={[styles.itemContainer, props.selected && styles.itemContainerSelected, { transform: [{ scale }] }]}
      >
        <View style={styles.avatarWrap}>
          <SvgXml xml={props.svg} width="100%" height="100%" />
        </View>
        <AppText variant="caption" weight="600" tone="secondary">
          {props.label}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  itemPressable: {
    width: '48%',
  },
  itemContainer: {
    borderWidth: 1,
    borderColor: visualSystemTokens.colors.borderSubtle,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: visualSystemTokens.colors.surfaceElevated,
    gap: 6,
  },
  itemContainerSelected: {
    borderColor: visualSystemTokens.colors.accentPrimary,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: visualSystemTokens.colors.surface,
  },
});
