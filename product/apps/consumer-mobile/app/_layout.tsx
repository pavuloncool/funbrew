import { useFonts } from 'expo-font';
import { Stack, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Platform, View } from 'react-native';
import { RootErrorBoundary } from '../src/components/RootErrorBoundary';
import { useOfflineTastingSync } from '../src/hooks/useOfflineTastingSync';
import { AppChromeTabBar } from '../src/components/ui/AppTabBar';
import { TastingLogExitGuardProvider } from '../src/navigation/TastingLogExitGuard';
import { AuthProvider } from '../src/auth';
import { MobileAccountRoleGate } from '../src/auth/MobileAccountRoleGate';

const queryClient = new QueryClient();
const rootStackScreenOptions = {
  headerShown: false,
  animation: 'slide_from_right' as const,
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
};

function OfflineSyncBootstrap() {
  useOfflineTastingSync();
  return null;
}

function AppShellStack() {
  const segments = useSegments() as string[];
  const topSegment = segments[0] ?? null;
  const secondSegment = segments[1] ?? null;

  const isSplash = segments.length === 0 || topSegment === 'index';
  const isAuthScreen = topSegment === '(auth)';
  const showTabBar = !(isSplash || isAuthScreen);

  let activeTab: 'home' | 'profile' | null = null;
  if (
    (topSegment === '(tabs)' &&
      ['hub', 'coffee', 'roasters', 'community', 'learn'].includes(secondSegment ?? '')) ||
    topSegment === 'coffee' ||
    topSegment === 'roaster' ||
    topSegment === 'learn' ||
    topSegment === 'atlas'
  ) {
    activeTab = 'home';
  }
  if (topSegment === '(tabs)' && secondSegment === 'profile') activeTab = 'profile';

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={rootStackScreenOptions}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </View>
      {showTabBar ? <AppChromeTabBar active={activeTab} /> : null}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts({
    SplineSans_400Regular: require('../assets/fonts/spline-sans/SplineSans-Regular.ttf'),
    SplineSans_500Medium: require('../assets/fonts/spline-sans/SplineSans-Medium.ttf'),
    SplineSans_600SemiBold: require('../assets/fonts/spline-sans/SplineSans-SemiBold.ttf'),
    SplineSans_700Bold: require('../assets/fonts/spline-sans/SplineSans-Bold.ttf'),
  });

  if (!fontsLoaded && !fontsError) {
    return null;
  }

  return (
    <RootErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {Platform.OS !== 'web' ? <OfflineSyncBootstrap /> : null}
          <TastingLogExitGuardProvider>
            <MobileAccountRoleGate />
            <AppShellStack />
          </TastingLogExitGuardProvider>
        </AuthProvider>
      </QueryClientProvider>
    </RootErrorBoundary>
  );
}
