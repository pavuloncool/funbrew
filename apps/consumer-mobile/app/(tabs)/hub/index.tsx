import {
  useCoffeeGeographySummary,
  useCommunityReputationSummary,
  useFavoriteScannedEntries,
  useUnlockedTastingNotes,
  visualSystemTokens,
} from '@funcup/shared';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyState } from '../../../src/components/EmptyState';
import { AppButton, AppCard, AppScrollScreen, AppText } from '../../../src/components/ui/primitives';
import { useViewerUserId } from '../../../src/hooks/useViewerUserId';
import { supabase } from '../../../src/services/supabaseClient';
import { pageStyles } from '../../../src/theme/pageStyles';

function formatProcessingName(value: string): string {
  return value
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export default function HubIndexScreen() {
  const router = useRouter();
  const { userId, isLoading } = useViewerUserId();
  const unlocksQuery = useUnlockedTastingNotes({ supabase, userId });
  const geographyQuery = useCoffeeGeographySummary({ supabase, userId });
  const communityQuery = useCommunityReputationSummary({ supabase, userId });
  const favoritesQuery = useFavoriteScannedEntries({ supabase, userId });

  const favoriteCount = favoritesQuery.data?.length ?? 0;
  const geography = geographyQuery.data;
  const unlocks = unlocksQuery.data;
  const community = communityQuery.data;

  return (
    <AppScrollScreen contentContainerStyle={[pageStyles.content, styles.content]}>
      <View style={styles.header}>
        <AppText variant="caption" weight="700" tone="secondary" style={styles.eyebrow}>
          FUN•BREW HUB
        </AppText>
        <AppText variant="h1" weight="700">Scan & Learn</AppText>
        <AppText tone="secondary">
          Gamification stays editorial here: your next scan, your sensory progression and the coffee places you have already explored.
        </AppText>
      </View>

      <Pressable
        onPress={() => router.push('/(tabs)/scan/scan')}
        accessibilityRole="button"
        accessibilityLabel="Scan Coffee"
        style={({ pressed }) => [styles.scanHero, pressed ? styles.scanHeroPressed : null]}
      >
        <AppText variant="caption" weight="700" tone="onPrimary">PRIMARY LOOP</AppText>
        <AppText variant="hero" weight="700" tone="onPrimary" style={styles.scanHeroTitle}>
          Scan Coffee
        </AppText>
        <AppText tone="onPrimary">
          Open the next bag, scan the QR and keep your tasting memory tied to a real coffee experience.
        </AppText>
        <View style={styles.scanHeroFooter}>
          <AppText weight="700" tone="primary" style={styles.scanHeroPill}>Open scanner</AppText>
        </View>
      </Pressable>

      <AppCard>
        <AppText variant="h3" weight="700">Sensory progression</AppText>
        {isLoading || unlocksQuery.isLoading ? (
          <AppText tone="secondary">Loading progression…</AppText>
        ) : !userId ? (
          <EmptyState
            title="Sign in to track progression"
            description="Your tasting logs unlock more precise descriptors over time."
          />
        ) : unlocks ? (
          <>
            <AppText variant="h2" weight="700">{unlocks.levelLabel}</AppText>
            <AppText tone="secondary">Sensory score: {unlocks.score}</AppText>
            <AppText tone="secondary">
              Unlocked descriptors: {unlocks.unlockedOptions.slice(0, 4).map((option) => option.label).join(', ')}
              {unlocks.unlockedOptions.length > 4 ? '…' : ''}
            </AppText>
            {unlocks.unlockHint ? <AppText tone="secondary">{unlocks.unlockHint}</AppText> : null}
          </>
        ) : null}
      </AppCard>

      <Pressable
        onPress={() => router.push('/atlas')}
        accessibilityRole="button"
        style={({ pressed }) => [styles.tile, pressed ? styles.tilePressed : null]}
      >
        <AppText variant="caption" weight="700" tone="secondary">COFFEE GEOGRAPHY</AppText>
        <AppText variant="h3" weight="700">Atlas preview</AppText>
        {geographyQuery.isLoading ? (
          <AppText tone="secondary">Building map summary…</AppText>
        ) : geography && geography.uniqueCountries > 0 ? (
          <>
            <AppText tone="secondary">
              {geography.uniqueCountries} countries across {geography.totalLogs} tasting logs.
            </AppText>
            <View style={styles.chipRow}>
              {geography.topCountries.slice(0, 3).map((country) => (
                <View key={country.country} style={styles.countryChip}>
                  <AppText variant="bodySm" weight="700">{country.country}</AppText>
                  <AppText variant="caption" tone="secondary">{country.count} logs</AppText>
                </View>
              ))}
            </View>
          </>
        ) : (
          <AppText tone="secondary">Your atlas will start after the first logged coffee with origin data.</AppText>
        )}
      </Pressable>

      <View style={styles.grid}>
        <Pressable
          onPress={() => router.push('/(tabs)/coffee')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.tile, pressed ? styles.tilePressed : null]}
        >
          <AppText variant="caption" weight="700" tone="secondary">FAVORITES</AppText>
          <AppText variant="h3" weight="700">Favorite scans</AppText>
          <AppText tone="secondary">
            {favoriteCount > 0
              ? `${favoriteCount} saved entries ready to reopen.`
              : 'Save scanned coffees you want to revisit later.'}
          </AppText>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(tabs)/profile')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.tile, pressed ? styles.tilePressed : null]}
        >
          <AppText variant="caption" weight="700" tone="secondary">COMMUNITY</AppText>
          <AppText variant="h3" weight="700">Helpful reputation</AppText>
          {communityQuery.isLoading ? (
            <AppText tone="secondary">Loading community summary…</AppText>
          ) : (
            <AppText tone="secondary">
              {community?.helpfulReceived ?? 0} helpful votes across {community?.reviewCount ?? 0} public reviews.
            </AppText>
          )}
        </Pressable>
      </View>

      {geography?.processingCounts?.length ? (
        <AppCard>
          <AppText variant="h3" weight="700">What you keep brewing</AppText>
          <AppText tone="secondary">
            {geography.processingCounts
              .slice(0, 2)
              .map((item) => `${formatProcessingName(item.processingMethod)} (${item.count})`)
              .join(' · ')}
          </AppText>
        </AppCard>
      ) : null}

      <AppCard style={styles.placeholderCard}>
        <AppText variant="h3" weight="700">Contextual missions</AppText>
        <AppText tone="secondary">
          Placeholder for beta demos: future suggestions like comparing washed vs natural or trying three coffees from one region.
        </AppText>
      </AppCard>

      <AppButton label="Open Learn Coffee" variant="secondary" onPress={() => router.push('/(tabs)/brew-your-skills')} />
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: visualSystemTokens.spacing.xl * 2,
    gap: visualSystemTokens.spacing.md,
  },
  header: {
    gap: visualSystemTokens.spacing.xs,
  },
  eyebrow: {
    letterSpacing: 1.2,
  },
  scanHero: {
    minHeight: 260,
    borderRadius: visualSystemTokens.radius.lg,
    padding: visualSystemTokens.spacing.xl,
    backgroundColor: visualSystemTokens.basePalette.stormyTeal,
    justifyContent: 'space-between',
    gap: visualSystemTokens.spacing.sm,
  },
  scanHeroPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  scanHeroTitle: {
    maxWidth: 240,
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
  grid: {
    gap: visualSystemTokens.spacing.sm,
  },
  tile: {
    minHeight: 132,
    borderRadius: visualSystemTokens.radius.lg,
    borderWidth: 1,
    borderColor: visualSystemTokens.colors.borderSubtle,
    backgroundColor: visualSystemTokens.colors.surfaceElevated,
    paddingHorizontal: visualSystemTokens.spacing.md,
    paddingVertical: visualSystemTokens.spacing.md,
    gap: visualSystemTokens.spacing.xs,
  },
  tilePressed: {
    opacity: 0.88,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: visualSystemTokens.spacing.xs,
  },
  countryChip: {
    minWidth: 88,
    borderWidth: 1,
    borderColor: visualSystemTokens.colors.borderSubtle,
    borderRadius: visualSystemTokens.radius.md,
    paddingHorizontal: visualSystemTokens.spacing.sm,
    paddingVertical: visualSystemTokens.spacing.xs,
    backgroundColor: visualSystemTokens.colors.surface,
  },
  placeholderCard: {
    backgroundColor: visualSystemTokens.colors.surfaceMuted,
  },
});
