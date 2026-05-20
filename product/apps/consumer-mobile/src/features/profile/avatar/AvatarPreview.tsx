import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { visualSystemTokens } from '@funcup/shared';

export function AvatarPreview(props: { svg: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.wrap, props.style]}>
      <SvgXml xml={props.svg} width="100%" height="100%" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: visualSystemTokens.colors.surface,
  },
});
