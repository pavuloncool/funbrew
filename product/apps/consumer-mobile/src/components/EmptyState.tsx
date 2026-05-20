import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { emptyStateStyles } from './EmptyState.styles';

export function EmptyState(props: {
  title: string;
  description?: string;
  icon?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <View style={emptyStateStyles.wrap} accessibilityRole="text" accessibilityLabel={`${props.title}. ${props.description ?? ''}`}>
      {props.icon ? <View style={emptyStateStyles.icon}>{props.icon}</View> : null}
      <Text style={emptyStateStyles.title}>{props.title}</Text>
      {props.description ? <Text style={emptyStateStyles.description}>{props.description}</Text> : null}
      {props.footer ? <View style={emptyStateStyles.footer}>{props.footer}</View> : null}
    </View>
  );
}
