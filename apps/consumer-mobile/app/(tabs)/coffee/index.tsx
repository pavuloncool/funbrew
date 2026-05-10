import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { useFavoriteScannedEntries, visualSystemTokens } from '@funcup/shared';

import { RatedCoffeesSection } from '../../../src/components/coffee/RatedCoffeesSection';
import { DiscoverCoffeesTab } from '../../../src/components/hub/DiscoverCoffeesTab';
import { EmptyState } from '../../../src/components/EmptyState';
import { AppCard, AppInput, AppScrollScreen, AppText } from '../../../src/components/ui/primitives';
import { useViewerUserId } from '../../../src/hooks/useViewerUserId';
import { supabase } from '../../../src/services/supabaseClient';
import { pageStyles } from '../../../src/theme/pageStyles';

type CoffeeSection = 'rated' | 'discover' | 'favorites';

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

function matchesFavoriteSearch(
  entry: {
    coffeeName: string;
    roasterName: string | null;
    processingMethod: string | null;
    lotNumber: string | null;
    roastDate: string | null;
    roasterCountry: string | null;
    originCountry: string | null;
  },
  normalizedQuery: string
): boolean {
  if (!normalizedQuery) return true;
  const values = [
    entry.coffeeName,
    entry.roasterName,
    entry.processingMethod,
    entry.lotNumber,
    entry.roastDate,
    entry.roasterCountry,
    entry.originCountry,
  ];
  return values.some((value) => value?.toLowerCase().includes(normalizedQuery));
}

export default function CoffeeScreen() {
  const [activeSection, setActiveSection] = useState<CoffeeSection>('rated');
  const [searchQuery, setSearchQuery] = useState('');
  const { userId } = useViewerUserId();
  const favoritesQuery = useFavoriteScannedEntries({ supabase, userId });
  const normalizedQuery = normalizeSearchValue(searchQuery);
  const favorites = favoritesQuery.data ?? [];
  const filteredFavorites = favorites.filter((entry) =>
    matchesFavoriteSearch(entry, normalizedQuery)
  );

  return (
    <AppScrollScreen contentContainerStyle={[pageStyles.content, styles.content]}>
      <View style={styles.header}>
        <AppText variant="h2" weight="700">Coffee</AppText>
        <AppText tone="secondary">
          Rated coffees, discover feed and saved scan entries in one place.
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
          <DiscoverCoffeesTab searchQuery={searchQuery} />
        </View>
      ) : null}

      {activeSection === 'favorites' ? (
        <View style={styles.section}>
          <AppText variant="h3" weight="700">Favorite scanned entries</AppText>
          <AppText tone="secondary">
            This beta list stores exact scanned entries so you can reopen a coffee page without scanning again.
          </AppText>
          {favoritesQuery.isLoading ? (
            <AppText tone="secondary">Loading favorites…</AppText>
          ) : (favoritesQuery.data?.length ?? 0) === 0 ? (
            <EmptyState
              title="No favorite scans yet"
              description="Save a coffee from the Coffee Page to keep that exact scanned entry close."
            />
          ) : filteredFavorites.length === 0 ? (
            <EmptyState
              title="No matching favorite scans"
              description="Try coffee name, lot, roaster, processing, or country."
            />
          ) : (
            filteredFavorites.map((entry) => (
              <Link
                key={entry.id}
                href={{ pathname: '/coffee/[id]', params: { id: entry.qrHash } }}
                asChild
              >
                <Pressable accessibilityRole="button">
                  <AppCard>
                    <AppText variant="h3" weight="700">{entry.coffeeName}</AppText>
                    {entry.roasterName ? <AppText tone="secondary">{entry.roasterName}</AppText> : null}
                    <AppText tone="secondary">
                      {[entry.processingMethod, entry.lotNumber].filter(Boolean).join(' · ') || 'Saved scanned entry'}
                    </AppText>
                    {(entry.roasterCountry || entry.originCountry) ? (
                      <AppText tone="secondary">
                        {[entry.roasterCountry && `Roaster: ${entry.roasterCountry}`, entry.originCountry && `Origin: ${entry.originCountry}`]
                          .filter(Boolean)
                          .join(' · ')}
                      </AppText>
                    ) : null}
                    {entry.roastDate ? <AppText tone="muted">Roast date: {entry.roastDate}</AppText> : null}
                    <AppText style={styles.openLabel}>Open Coffee Page</AppText>
                  </AppCard>
                </Pressable>
              </Link>
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
  openLabel: {
    marginTop: visualSystemTokens.spacing.xs,
    textDecorationLine: 'underline',
  },
});
