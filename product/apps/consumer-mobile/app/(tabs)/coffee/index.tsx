import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useMemo, useState } from 'react';
import {
  type FavoriteScannedEntry,
  useFavoriteRatedCoffeeLogs,
  useFavoriteScannedEntries,
  useToggleFavoriteRatedCoffeeLog,
  useToggleFavoriteScannedEntry,
  visualSystemTokens,
} from '@funcup/shared';

import { RatedCoffeesSection } from '../../../src/components/coffee/RatedCoffeesSection';
import { RatedCoffeeLogCard, matchesRatedCoffeeSearch } from '../../../src/components/coffee/RatedCoffeeLogCard';
import { FavoriteToggleButton } from '../../../src/components/coffee/FavoriteToggleButton';
import { DiscoverCoffeesTab } from '../../../src/components/hub/DiscoverCoffeesTab';
import { EmptyState } from '../../../src/components/EmptyState';
import { AppCard, AppInput, AppScrollScreen, AppText } from '../../../src/components/ui/primitives';
import { usePendingTastingDiscoverCoffeeIds } from '../../../src/hooks/usePendingTastingDiscoverCoffeeIds';
import { useViewerUserId } from '../../../src/hooks/useViewerUserId';
import { supabase } from '../../../src/services/supabaseClient';
import { pageStyles } from '../../../src/theme/pageStyles';

type CoffeeSection = 'rated' | 'discover' | 'favorites';

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

function matchesScannedFavoriteSearch(entry: FavoriteScannedEntry, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  const values = [
    entry.coffeeName,
    entry.roasterName,
    entry.roasterCountry,
    entry.originCountry,
    entry.processingMethod,
    entry.lotNumber,
    entry.roastDate,
    entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : null,
  ];
  return values.some((value) => value?.toLowerCase().includes(normalizedQuery));
}

function formatRoastDate(iso: string | null): string | null {
  if (!iso) return null;
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function formatScannedFavoriteSummary(entry: FavoriteScannedEntry): string {
  return [
    entry.processingMethod,
    entry.lotNumber ? `Lot ${entry.lotNumber}` : null,
    entry.originCountry ? `Origin ${entry.originCountry}` : null,
  ].filter((value): value is string => Boolean(value)).join(' · ');
}

function ScannedFavoriteCard(props: {
  entry: FavoriteScannedEntry;
  onPress: () => void;
  onRemoveFavorite: () => void;
  disabled?: boolean;
}) {
  const summaryLine = formatScannedFavoriteSummary(props.entry);
  const roastDate = formatRoastDate(props.entry.roastDate);

  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${props.entry.coffeeName} favourite coffee details`}
      style={({ pressed }) => [styles.cardPressable, pressed ? styles.cardPressed : null]}
    >
      <AppCard style={styles.favoriteCard}>
        <View style={styles.favoriteHeaderRow}>
          <View style={styles.favoriteHeaderText}>
            <AppText variant="h3" weight="700">
              {props.entry.coffeeName}
            </AppText>
            {props.entry.roasterName ? <AppText tone="secondary">{props.entry.roasterName}</AppText> : null}
          </View>
          <FavoriteToggleButton
            active
            onPress={props.onRemoveFavorite}
            disabled={props.disabled}
            label="Remove from Favourites"
            accessibilityLabel="Remove from Favourites"
          />
        </View>
        <AppText tone="secondary">Saved from QR scan{roastDate ? ` · Roast ${roastDate}` : ''}</AppText>
        {summaryLine ? <AppText tone="secondary">{summaryLine}</AppText> : null}
        {props.entry.roasterCountry ? (
          <AppText tone="secondary">Roaster country: {props.entry.roasterCountry}</AppText>
        ) : null}
        <AppText style={styles.openLabel}>Open details</AppText>
      </AppCard>
    </Pressable>
  );
}

export default function CoffeeScreen() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<CoffeeSection>('rated');
  const [searchQuery, setSearchQuery] = useState('');
  const { userId, isLoading: authLoading } = useViewerUserId();
  const pendingDiscoverCoffeeIds = usePendingTastingDiscoverCoffeeIds({
    enabled: Boolean(userId),
  });
  const ratedFavoritesQuery = useFavoriteRatedCoffeeLogs({ supabase, userId });
  const scannedFavoritesQuery = useFavoriteScannedEntries({ supabase, userId });
  const favoriteToggleMutation = useToggleFavoriteRatedCoffeeLog({ supabase, userId });
  const scannedFavoriteToggleMutation = useToggleFavoriteScannedEntry({ supabase, userId });
  const normalizedQuery = normalizeSearchValue(searchQuery);
  const ratedFavorites = ratedFavoritesQuery.data ?? [];
  const ratedFavoriteBatchIds = useMemo(
    () => new Set(ratedFavorites.map((entry) => entry.batchId).filter((batchId): batchId is string => Boolean(batchId))),
    [ratedFavorites]
  );
  const scannedFavorites = useMemo(
    () => (scannedFavoritesQuery.data ?? []).filter((entry) => !ratedFavoriteBatchIds.has(entry.batchId)),
    [ratedFavoriteBatchIds, scannedFavoritesQuery.data]
  );
  const filteredRatedFavorites = useMemo(
    () => ratedFavorites.filter((entry) => matchesRatedCoffeeSearch(entry, normalizedQuery)),
    [ratedFavorites, normalizedQuery]
  );
  const filteredScannedFavorites = useMemo(
    () => scannedFavorites.filter((entry) => matchesScannedFavoriteSearch(entry, normalizedQuery)),
    [scannedFavorites, normalizedQuery]
  );
  const hasFavorites = ratedFavorites.length > 0 || scannedFavorites.length > 0;
  const hasFilteredFavorites = filteredRatedFavorites.length > 0 || filteredScannedFavorites.length > 0;

  return (
    <AppScrollScreen contentContainerStyle={[pageStyles.content, styles.content]}>
      <View style={styles.header}>
        <AppText variant="h2" weight="700">Coffee Log</AppText>
        <AppText tone="secondary">
          Discover and log your coffee journey.
        </AppText>
        <AppInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by coffee, roaster, lot, notes, or country"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search coffees by name, country, or other text"
        />
      </View>

      <View style={styles.segmentedControl} accessibilityRole="tablist">
        {([
          ['rated', 'Rated'] as const,
          ['discover', 'Discover'] as const,
          ['favorites', 'Favorites'] as const,
        ]).map(([key, label]) => (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeSection === key }}
            onPress={() => setActiveSection(key)}
            style={[styles.segment, activeSection === key ? styles.segmentActive : null]}
          >
            <AppText weight="700" tone={activeSection === key ? 'onPrimary' : 'secondary'}>
              {label}
            </AppText>
          </Pressable>
        ))}
      </View>

      {activeSection === 'rated' ? (
        <RatedCoffeesSection searchQuery={searchQuery} />
      ) : null}

      {activeSection === 'discover' ? (
        <View style={styles.section}>
          <AppText variant="h3" weight="700">Discover Coffees</AppText>
          <AppText tone="secondary">
            Recommendation ranking evolves later. MVP shows latest active coffees tied to current QR flows.
          </AppText>
          <DiscoverCoffeesTab
            searchQuery={searchQuery}
            userId={userId}
            excludeCoffeeIds={pendingDiscoverCoffeeIds.coffeeIds}
          />
        </View>
      ) : null}

      {activeSection === 'favorites' ? (
        <View style={styles.section}>
          {/*<AppText variant="h3" weight="700">Favourite rated coffees</AppText>
          <AppText tone="secondary">
            These are rated coffees you marked with the star. Tap a card to open the tasting log.
          </AppText>*/}
          {authLoading || ratedFavoritesQuery.isLoading || scannedFavoritesQuery.isLoading ? (
            <AppText tone="secondary">Loading favourites…</AppText>
          ) : !userId ? (
            <EmptyState
              title="Sign in to save favourites"
              description="Star a scanned or rated coffee to keep it here."
              footer={
                <Link href="/(auth)/login" accessibilityRole="link">
                  Go to sign in
                </Link>
              }
            />
          ) : !hasFavorites ? (
            <EmptyState
              title="No favourite coffees yet"
              description="Scan a QR code or open a rated coffee and tap the star to keep it here."
            />
          ) : !hasFilteredFavorites ? (
            <EmptyState
              title="No matching favourite coffees"
              description="Try coffee name, roaster, lot, notes, rating, or country."
            />
          ) : (
            <>
              {filteredRatedFavorites.map((entry) => (
                <RatedCoffeeLogCard
                  key={`rated-${entry.coffeeLogId}`}
                  entry={entry}
                  isFavorite
                  favoriteToggleLabel="Remove from Favourites"
                  favoriteToggleDisabled={favoriteToggleMutation.isPending}
                  onPress={() => {
                    router.push(`/coffee-log/${entry.coffeeLogId}`);
                  }}
                  onToggleFavorite={() => {
                    void favoriteToggleMutation.mutateAsync({
                      coffeeLogId: entry.coffeeLogId,
                      shouldFavorite: false,
                      optimisticEntry: entry,
                    });
                  }}
                />
              ))}
              {filteredScannedFavorites.map((entry) => (
                <ScannedFavoriteCard
                  key={`scanned-${entry.id}`}
                  entry={entry}
                  disabled={scannedFavoriteToggleMutation.isPending}
                  onPress={() => {
                    router.push({
                      pathname: '/coffee/[hash]',
                      params: { hash: entry.qrHash },
                    });
                  }}
                  onRemoveFavorite={() => {
                    void scannedFavoriteToggleMutation.mutateAsync({
                      qrHash: entry.qrHash,
                      batchId: entry.batchId,
                      coffeeId: entry.coffeeId,
                      shouldFavorite: false,
                      optimisticEntry: entry,
                    });
                  }}
                />
              ))}
            </>
          )}
        </View>
      ) : null}
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: visualSystemTokens.spacing.xl * 2,
  },
  header: {
    gap: visualSystemTokens.spacing.xs,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: visualSystemTokens.spacing.xs,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: visualSystemTokens.colors.borderSubtle,
    borderRadius: visualSystemTokens.radius.pill,
    backgroundColor: visualSystemTokens.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: visualSystemTokens.spacing.sm,
  },
  segmentActive: {
    borderColor: visualSystemTokens.colors.accentPrimary,
    backgroundColor: visualSystemTokens.colors.accentPrimary,
  },
  section: {
    gap: visualSystemTokens.spacing.sm,
  },
  cardPressable: {
    borderRadius: visualSystemTokens.radius.xl,
  },
  cardPressed: {
    opacity: 0.92,
  },
  favoriteCard: {
    gap: visualSystemTokens.spacing.xs,
    backgroundColor: visualSystemTokens.colors.surface,
    padding: visualSystemTokens.spacing.sm,
  },
  favoriteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: visualSystemTokens.spacing.xs,
  },
  favoriteHeaderText: {
    flex: 1,
    gap: visualSystemTokens.spacing.xxs,
  },
  openLabel: {
    marginTop: visualSystemTokens.spacing.xs,
    textDecorationLine: 'underline',
  },
});
