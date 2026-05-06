import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppPanel, AppScreen, AppText } from '../../../src/components/ui/primitives';
import { visualSystemTokens } from '@funcup/shared';

export default function HubIndexScreen() {
  const router = useRouter();

  return (
    <AppScreen>
      <AppPanel style={styles.root} padded={false}>
        <AppPanel style={styles.headerWrap} padded={false}>
          <AppText variant="h2" weight="700" style={styles.screenTitle}>
            FunCup Home
          </AppText>
        </AppPanel>

        <View style={styles.tilesWrap}>
          <Pressable
            onPress={() => router.push('/(tabs)/journal')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.tile, pressed ? styles.tilePressed : null]}
          >
            <AppText variant="h3" weight="700" style={styles.tileLabel}>Coffee Log</AppText>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/discover-roasters')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.tile, pressed ? styles.tilePressed : null]}
          >
            <AppText variant="h3" weight="700" style={styles.tileLabel}>Discover</AppText>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/brew-your-skills')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.tile, pressed ? styles.tilePressed : null]}
          >
            <AppText variant="h3" weight="700" style={styles.tileLabel}>Learn Coffee</AppText>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/profile')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.tile, pressed ? styles.tilePressed : null]}
          >
            <AppText variant="h3" weight="700" style={styles.tileLabel}>Settings</AppText>
          </Pressable>
        </View>
      </AppPanel>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerWrap: {
    width: '100%',
    paddingHorizontal: visualSystemTokens.spacing.xl,
    paddingTop: visualSystemTokens.spacing.xs,
  },
  screenTitle: { alignSelf: 'flex-start' },
  tilesWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: visualSystemTokens.spacing.sm,
    paddingHorizontal: visualSystemTokens.spacing.xl,
    paddingTop: visualSystemTokens.spacing.md,
    paddingBottom: visualSystemTokens.spacing.xl,
    alignContent: 'flex-start',
  },
  tile: {
    width: '48%',
    minHeight: 132,
    borderRadius: visualSystemTokens.radius.lg,
    borderWidth: 1,
    borderColor: visualSystemTokens.colors.borderSubtle,
    backgroundColor: visualSystemTokens.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: visualSystemTokens.spacing.sm,
  },
  tilePressed: {
    opacity: 0.85,
  },
  tileLabel: {
    textAlign: 'center',
  },
});
