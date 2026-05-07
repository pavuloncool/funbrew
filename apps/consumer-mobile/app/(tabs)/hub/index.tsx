import { appShellRules, visualSystemTokens } from '@funcup/shared';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppPanel, AppScrollScreen, AppText } from '../../../src/components/ui/primitives';
import { pageStyles } from '../../../src/theme/pageStyles';

export default function HubIndexScreen() {
  const router = useRouter();

  return (
    <AppScrollScreen contentContainerStyle={[pageStyles.content, styles.content]}>
      <AppPanel style={styles.root} padded={false}>
        <AppPanel style={styles.headerWrap} padded={false}>
          <AppText variant="caption" weight="700" tone="secondary" style={styles.eyebrow}>
            FUNCUP HUB
          </AppText>
          <AppText variant="h1" weight="700" style={styles.screenTitle}>
            Scan & Explore
          </AppText>
          <AppText tone="secondary" style={styles.screenSubtitle}>
            QR is the core loop. Everything else should support the next coffee you scan.
          </AppText>
        </AppPanel>

        <Pressable
          onPress={() => router.push(appShellRules.centralActionRoute)}
          accessibilityRole="button"
          accessibilityLabel="Scan Coffee"
          accessibilityHint="Open the QR scanner directly"
          style={({ pressed }) => [styles.scanHero, pressed ? styles.scanHeroPressed : null]}
        >
          <View style={styles.scanHeroTopRow}>
            <AppText variant="caption" weight="700" tone="onPrimary" style={styles.heroBadge}>
              PRIMARY CTA
            </AppText>
            <AppText variant="bodySm" tone="onPrimary" style={styles.heroKicker}>
              FR-006
            </AppText>
          </View>
          <AppText variant="hero" weight="700" tone="onPrimary" style={styles.scanHeroTitle}>
            Scan Coffee
          </AppText>
          <AppText tone="onPrimary" style={styles.scanHeroBody}>
            Jump straight into the QR scanner and open the next coffee without detouring through discovery.
          </AppText>
          <View style={styles.scanHeroFooter}>
            <AppText weight="700" tone="primary" style={styles.scanHeroPill}>
              Open scanner
            </AppText>
          </View>
        </Pressable>

        <View style={styles.sectionGrid}>
          <Pressable
            onPress={() => router.push('/(tabs)/coffee')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.tile, pressed ? styles.tilePressed : null]}
          >
            <AppText variant="caption" weight="700" tone="secondary">COFFEE</AppText>
            <AppText variant="h3" weight="700" style={styles.tileLabel}>Coffee</AppText>
            <AppText tone="secondary" style={styles.tileBody}>
              Open Rated Coffees and Discover Coffees in one place.
            </AppText>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/roasters')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.tile, pressed ? styles.tilePressed : null]}
          >
            <AppText variant="caption" weight="700" tone="secondary">ROASTERS</AppText>
            <AppText variant="h3" weight="700" style={styles.tileLabel}>Roasters</AppText>
            <AppText tone="secondary" style={styles.tileBody}>
              Manage followed roasters and discover verified profiles.
            </AppText>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/brew-your-skills')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.tile, pressed ? styles.tilePressed : null]}
          >
            <AppText variant="caption" weight="700" tone="secondary">LEARN</AppText>
            <AppText variant="h3" weight="700" style={styles.tileLabel}>Learn Coffee</AppText>
            <AppText tone="secondary" style={styles.tileBody}>
              Read compact guides that make the next tasting more intentional.
            </AppText>
          </Pressable>
        </View>

      </AppPanel>
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: visualSystemTokens.spacing.xl * 2,
  },
  root: {
    width: '100%',
    gap: visualSystemTokens.spacing.md,
  },
  headerWrap: {
    width: '100%',
    gap: visualSystemTokens.spacing.xs,
  },
  eyebrow: {
    letterSpacing: 1.2,
  },
  screenTitle: {
    alignSelf: 'flex-start',
    maxWidth: 280,
  },
  screenSubtitle: {
    maxWidth: 320,
  },
  scanHero: {
    minHeight: 320,
    borderRadius: visualSystemTokens.radius.lg,
    padding: visualSystemTokens.spacing.xl,
    backgroundColor: visualSystemTokens.basePalette.stormyTeal,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  scanHeroPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  scanHeroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBadge: {
    paddingHorizontal: visualSystemTokens.spacing.sm,
    paddingVertical: visualSystemTokens.spacing.xxs,
    borderRadius: visualSystemTokens.radius.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.14)',
    letterSpacing: 0.8,
  },
  heroKicker: {
    opacity: 0.84,
  },
  scanHeroTitle: {
    maxWidth: 240,
    lineHeight: 48,
  },
  scanHeroBody: {
    maxWidth: 280,
    lineHeight: 22,
  },
  scanHeroFooter: {
    alignItems: 'flex-start',
  },
  scanHeroPill: {
    paddingHorizontal: visualSystemTokens.spacing.md,
    paddingVertical: visualSystemTokens.spacing.xs,
    borderRadius: visualSystemTokens.radius.pill,
    overflow: 'hidden',
    backgroundColor: visualSystemTokens.basePalette.champagneMist,
  },
  sectionGrid: {
    gap: visualSystemTokens.spacing.sm,
  },
  tile: {
    minHeight: 120,
    borderRadius: visualSystemTokens.radius.lg,
    borderWidth: 1,
    borderColor: visualSystemTokens.colors.borderSubtle,
    backgroundColor: visualSystemTokens.colors.surfaceElevated,
    justifyContent: 'space-between',
    paddingHorizontal: visualSystemTokens.spacing.md,
    paddingVertical: visualSystemTokens.spacing.md,
    gap: visualSystemTokens.spacing.xs,
  },
  tilePressed: {
    opacity: 0.85,
  },
  tileLabel: {
    textAlign: 'left',
  },
  tileBody: {
    lineHeight: 20,
  },
});
