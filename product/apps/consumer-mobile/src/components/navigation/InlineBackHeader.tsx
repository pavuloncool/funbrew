import { visualSystemTokens } from '@funcup/shared';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { type Href } from 'expo-router';

import { AppText } from '../ui/primitives';
import { useGoBackOrFallback } from '../../navigation/useGoBackOrFallback';

type TitleVariant = 'h1' | 'h2' | 'h3';

export function InlineBackHeader(props: {
  title: string;
  fallbackHref: Href;
  titleVariant?: TitleVariant;
  style?: StyleProp<ViewStyle>;
  preferHistory?: boolean;
}) {
  const goBackOrFallback = useGoBackOrFallback(props.fallbackHref, 'replace', {
    preferHistory: props.preferHistory,
  });
  const titleVariant = props.titleVariant === 'h3' ? 'h3' : 'h2';

  return (
    <View style={[styles.row, props.style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Go back from ${props.title}`}
        hitSlop={10}
        onPress={goBackOrFallback}
        style={({ pressed }) => [styles.backButton, pressed ? styles.backButtonPressed : null]}
      >
        <AppText variant={titleVariant} weight="400" style={styles.arrow}>←</AppText>
      </Pressable>
      <AppText
        variant={titleVariant}
        weight="700"
        accessibilityRole="header"
        style={styles.title}
      >
        {props.title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: visualSystemTokens.spacing.xs,
  },
  backButton: {
    minWidth: 28,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonPressed: {
    opacity: 0.65,
  },
  arrow: {
    color: visualSystemTokens.colors.textPrimary,
  },
  title: {
    flex: 1,
  },
});
