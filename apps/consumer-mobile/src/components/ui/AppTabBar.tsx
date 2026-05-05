import { Ionicons } from '@expo/vector-icons';
import { visualSystemTokens } from '@funcup/shared';
import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { recipes, spacing, radius } = visualSystemTokens;
const TAB_BAR_HEIGHT = 52;

export function TabDotIcon(props: { active: boolean; label: string }) {
  return (
    <View
      style={{
        width: props.active ? 30 : 30,
        height: props.active ? 30 : 30,
        borderRadius: radius.pill,
        borderWidth: 1.5,
        borderColor: props.active ? recipes.tabbar.activeIcon : recipes.tabbar.inactiveIcon,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: props.active ? visualSystemTokens.colors.surface : 'transparent',
      }}
    >
      <Text style={{ fontSize: 15, color: props.active ? recipes.tabbar.activeIcon : recipes.tabbar.inactiveIcon }}>
        {props.label}
      </Text>
    </View>
  );
}

export function TabCentralScanFab() {
  return (
    <View
      style={{
        width: 84,
        height: 84,
        borderRadius: radius.pill,
        marginTop: -52,
        backgroundColor: recipes.tabbar.fabBackground,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2.5,
        borderColor: recipes.tabbar.background,
      }}
    >
      <Ionicons name="qr-code-outline" size={32} color={recipes.tabbar.fabIcon} />
    </View>
  );
}

type StandaloneTabBarTab = 'home' | 'journal' | 'settings' | null;

export function AppChromeTabBar(props: { active?: StandaloneTabBarTab }) {
  const active = props.active ?? null;
  const insets = useSafeAreaInsets();

  return (
    <View style={[standaloneStyles.shell, { paddingBottom: insets.bottom }]}>
      <View style={standaloneStyles.bar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to Home"
          onPress={() => router.replace('/(tabs)/hub')}
          style={standaloneStyles.item}
        >
          <TabDotIcon active={active === 'home'} label="H" />
          <Text style={standaloneStyles.label}>Home</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to QR Scan"
          onPress={() => router.replace('/(tabs)/scan/scan')}
          style={standaloneStyles.centerItem}
        >
          <TabCentralScanFab />
          <Text style={standaloneStyles.label}>QR Scan</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to Journal"
          onPress={() => router.replace('/(tabs)/journal')}
          style={standaloneStyles.item}
        >
          <TabDotIcon active={active === 'journal'} label="J" />
          <Text style={standaloneStyles.label}>Journal</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to Settings"
          onPress={() => router.replace('/(tabs)/profile')}
          style={standaloneStyles.item}
        >
          <TabDotIcon active={active === 'settings'} label="S" />
          <Text style={standaloneStyles.label}>Settings</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function HiddenNativeTabBar(_: BottomTabBarProps) {
  return null;
}

export const tabBarScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: recipes.tabbar.activeIcon,
  tabBarInactiveTintColor: recipes.tabbar.inactiveIcon,
  tabBarStyle: {
    height: TAB_BAR_HEIGHT,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: recipes.tabbar.borderTopColor,
    backgroundColor: recipes.tabbar.background,
  },
} as const;

const standaloneStyles = {
  shell: {
    backgroundColor: recipes.tabbar.background,
    borderTopWidth: 1,
    borderTopColor: recipes.tabbar.borderTopColor,
  },
  bar: {
    height: TAB_BAR_HEIGHT,
    paddingTop: spacing.xs,
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    alignItems: 'center' as const,
  },
  item: {
    minWidth: 64,
    height: TAB_BAR_HEIGHT,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
  },
  centerItem: {
    minWidth: 96,
    alignItems: 'center' as const,
    gap: 6,
  },
  label: {
    fontSize: 11,
    color: recipes.tabbar.inactiveIcon,
  },
} as const;
