import { Stack, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Platform, View } from 'react-native';
import { RootErrorBoundary } from '../src/components/RootErrorBoundary';
import { useOfflineTastingSync } from '../src/hooks/useOfflineTastingSync';
import { AppChromeTabBar } from '../src/components/ui/AppTabBar';
import { AuthProvider } from '../src/auth';

const queryClient = new QueryClient();

function OfflineSyncBootstrap() {
  useOfflineTastingSync();
  return null;
}

function AppShellStack() {
  const segments = useSegments() as string[];
  const topSegment = segments[0] ?? null;
  const secondSegment = segments[1] ?? null;
  const thirdSegment = segments[2] ?? null;

  const isSplash = segments.length === 0 || topSegment === 'index';
  const isProfileScreen = topSegment === '(tabs)' && secondSegment === 'profile';
  const showTabBar = !(isSplash || isProfileScreen);

  let activeTab: 'home' | 'journal' | 'settings' | null = null;
  if (
    (topSegment === '(tabs)' && ['hub', 'discover-roasters', 'brew-your-skills'].includes(secondSegment ?? '')) ||
    topSegment === 'coffee' ||
    topSegment === 'roaster' ||
    topSegment === 'learn' ||
    topSegment === 'home'
  ) {
    activeTab = thirdSegment === 'log' ? 'journal' : 'home';
  }
  if (topSegment === '(tabs)' && secondSegment === 'journal') activeTab = 'journal';
  if (topSegment === '(tabs)' && secondSegment === 'profile') activeTab = 'settings';

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: true }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="test-select-user" options={{ title: 'Wybór roli' }} />
          <Stack.Screen name="home" options={{ title: 'funcup' }} />
        </Stack>
      </View>
      {showTabBar ? <AppChromeTabBar active={activeTab} /> : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <RootErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {Platform.OS !== 'web' ? <OfflineSyncBootstrap /> : null}
          <AppShellStack />
        </AuthProvider>
      </QueryClientProvider>
    </RootErrorBoundary>
  );
}
