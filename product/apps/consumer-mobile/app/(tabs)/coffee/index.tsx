import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useMemo, useState } from 'react';
import {
  useFavoriteRatedCoffeeLogs,
  useToggleFavoriteRatedCoffeeLog,
  visualSystemTokens,
} from '@funcup/shared';

import { RatedCoffeesSection } from '../../../src/components/coffee/RatedCoffeesSection';
import { RatedCoffeeLogCard, matchesRatedCoffeeSearch } from '../../../src/components/coffee/RatedCoffeeLogCard';
import { DiscoverCoffeesTab } from '../../../src/components/hub/DiscoverCoffeesTab';
import { EmptyState } from '../../../src/components/EmptyState';
import { AppInput, AppScrollScreen, AppText } from '../../../src/components/ui/primitives';
import { usePendingTastingDiscoverCoffeeIds } from '../../../src/hooks/usePendingTastingDiscoverCoffeeIds';
import { useViewerUserId } from '../../../src/hooks/useViewerUserId';
import { supabase } from '../../../src/services/supabaseClient';
import { pageStyles } from '../../../src/theme/pageStyles';

type CoffeeSection = 'rated' | 'discover' | 'favorites';

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

export default function CoffeeScreen() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<CoffeeSection>('rated');
  const [searchQuery, setSearchQuery] = useState('');
  const { userId, isLoading: authLoading } = useViewerUserId();
  const pendingDiscoverCoffeeIds = usePendingTastingDiscoverCoffeeIds({
    enabled: Boolean(userId),
  });
  const favoritesQuery = useFavoriteRatedCoffeeLogs({ supabase, userId });
  const favoriteToggleMutation = useToggleFavoriteRatedCoffeeLog({ supabase, userId });
  const normalizedQuery = normalizeSearchValue(searchQuery);
  const favorites = favoritesQuery.data ?? [];
  const filteredFavorites = useMemo(
    () => favorites.filter((entry) => matchesRatedCoffeeSearch(entry, normalizedQuery)),
    [favorites, normalizedQuery]
  );

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
          {authLoading || favoritesQuery.isLoading ? (
            <AppText tone="secondary">Loading favourites…</AppText>
          ) : !userId ? (
            <EmptyState
              title="Sign in to save favourites"
              description="Star a rated coffee to keep it here."
              footer={
                <Link href="/(auth)/login" accessibilityRole="link">
                  Go to sign in
                </Link>
              }
            />
          ) : favorites.length === 0 ? (
            <EmptyState
              title="No favourite rated coffees yet"
              description="Open a rated coffee and tap the star to keep it here."
            />
          ) : filteredFavorites.length === 0 ? (
            <EmptyState
              title="No matching favourite coffees"
              description="Try coffee name, roaster, lot, notes, rating, or country."
            />
          ) : (
            filteredFavorites.map((entry) => (
              <RatedCoffeeLogCard
                key={entry.coffeeLogId}
                entry={entry}
                isFavorite
                favoriteToggleLabel="Remove favourite from rated coffee"
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
            ))
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
});
