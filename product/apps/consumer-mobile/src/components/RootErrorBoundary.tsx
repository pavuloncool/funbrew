import React, { type ErrorInfo, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { rootErrorBoundaryStyles } from './RootErrorBoundary.styles';

type Props = { children: ReactNode };

type State = { hasError: boolean; message: string };

export class RootErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Something went wrong.' };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    if (__DEV__) {
      console.error('[RootErrorBoundary]', error, info.componentStack);
    }
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, message: '' });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ScrollView contentContainerStyle={rootErrorBoundaryStyles.center}>
          <View style={rootErrorBoundaryStyles.card} accessibilityRole="alert">
            <Text style={rootErrorBoundaryStyles.title}>Something broke</Text>
            <Text style={rootErrorBoundaryStyles.body}>{this.state.message}</Text>
            <Pressable
              onPress={this.handleRetry}
              style={rootErrorBoundaryStyles.button}
              accessibilityRole="button"
              accessibilityLabel="Try again after an error"
            >
              <Text style={rootErrorBoundaryStyles.buttonLabel}>Try again</Text>
            </Pressable>
          </View>
        </ScrollView>
      );
    }

    return this.props.children;
  }
}
