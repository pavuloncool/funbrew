import { Ionicons } from '@expo/vector-icons';
import { appShellRules, visualSystemTokens } from '@funcup/shared';
import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTastingLogExitGuardNavigation } from '../../navigation/TastingLogExitGuard';

const { recipes, spacing, radius, colors, motion } = visualSystemTokens;
export const TAB_BAR_HEIGHT = 56;
export const TAB_BAR_FAB_OVERLAP = 54;

export function TabDotIcon(props: { active: boolean; label: string }) {
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: radius.pill,
        borderWidth: 1.5,
        borderColor: recipes.tabbar.fabBackground,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: props.active ? visualSystemTokens.recipes.screen.background : 'transparent',
      }}
    >
      <Text
        style={{
          fontSize: visualSystemTokens.typography.bodyMD,
          fontFamily: 'SplineSans_700Bold',
          color: props.active ? colors.textPrimary : recipes.tabbar.inactiveIcon,
        }}
      >
        {props.label}
      </Text>
    </View>
  );
}

export function TabCentralScanFab() {
  return (
    <View
      style={{
        width: 86,
        height: 86,
        borderRadius: radius.pill,
        marginTop: -TAB_BAR_FAB_OVERLAP,
        backgroundColor: recipes.tabbar.fabBackground,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: recipes.tabbar.background,
        shadowColor: colors.textPrimary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 18,
        elevation: 6,
      }}
    >
      <Ionicons name="qr-code-outline" size={33} color={recipes.tabbar.fabIcon} />
    </View>
  );
}

type StandaloneTabBarTab = 'home' | 'profile' | null;

export function AppChromeTabBar(props: { active?: StandaloneTabBarTab }) {
  const active = props.active ?? null;
  const insets = useSafeAreaInsets();
  const requestGuardedNavigation = useTastingLogExitGuardNavigation();

  return (
    <View style={[standaloneStyles.shell, { paddingBottom: insets.bottom }]}> 
      <View style={standaloneStyles.bar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to Home"
          onPress={() => requestGuardedNavigation(() => router.replace('/(tabs)/hub'))}
          style={({ pressed }) => [standaloneStyles.item, pressed && { opacity: motion.press.opacity }]}
        >
          <TabDotIcon active={active === 'home'} label="H" />
          <Text style={[standaloneStyles.label, active === 'home' ? standaloneStyles.labelActive : null]}>Home</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to Scan Coffee"
          onPress={() => requestGuardedNavigation(() => router.replace(appShellRules.centralActionRoute))}
          style={({ pressed }) => [standaloneStyles.centerItem, pressed && { opacity: motion.press.opacity }]}
        >
          <TabCentralScanFab />
          <Text style={standaloneStyles.label}>{appShellRules.centralActionLabel}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to Profile"
          onPress={() => requestGuardedNavigation(() => router.replace('/(tabs)/profile'))}
          style={({ pressed }) => [standaloneStyles.item, pressed && { opacity: motion.press.opacity }]}
        >
          <TabDotIcon active={active === 'profile'} label="P" />
          <Text style={[standaloneStyles.label, active === 'profile' ? standaloneStyles.labelActive : null]}>Profile</Text>
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
    justifyContent: 'space-evenly' as const,
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
    fontSize: visualSystemTokens.typography.caption,
    fontFamily: 'SplineSans_500Medium',
    color: recipes.tabbar.inactiveIcon,
  },
  labelActive: {
    color: colors.textPrimary,
  },
} as const;
