import { Pressable, Text, View } from 'react-native';

import { screenErrorStyles } from './ScreenError.styles';

export function ScreenError(props: {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  const title = props.title ?? 'Could not load';
  return (
    <View style={screenErrorStyles.wrap} accessibilityRole="alert">
      <Text style={screenErrorStyles.title}>{title}</Text>
      <Text style={screenErrorStyles.body}>{props.message}</Text>
      {props.onRetry ? (
        <Pressable
          onPress={props.onRetry}
          style={screenErrorStyles.button}
          accessibilityRole="button"
          accessibilityLabel={props.retryLabel ?? 'Retry loading this screen'}
        >
          <Text style={screenErrorStyles.buttonLabel}>{props.retryLabel ?? 'Retry'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
