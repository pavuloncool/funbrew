import { Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { appShellRules } from '@funcup/shared';
import { HiddenNativeTabBar, tabBarScreenOptions } from '../../src/components/ui/AppTabBar';
import { useAuth } from '../../src/auth';

export default function TabsLayout() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'unauthenticated' || status === 'locked') {
      router.replace('/(auth)/login');
    }
  }, [router, status]);

  if (status === 'bootstrapping') {
    return null;
  }

  return (
    <Tabs
      tabBar={HiddenNativeTabBar}
      screenOptions={tabBarScreenOptions}
    >
      <Tabs.Screen
        name="hub/index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="coffee/index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="roasters/index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="community/index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="learn/index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="scan/scan"
        options={{
          title: appShellRules.centralActionLabel,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
