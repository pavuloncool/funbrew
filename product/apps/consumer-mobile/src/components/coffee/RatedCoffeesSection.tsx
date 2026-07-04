import { Link, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';
import { useCallback, useMemo } from 'react';
import {
  useFavoriteRatedCoffeeLogs,
  useJournal,
  useToggleFavoriteRatedCoffeeLog,
  type RatedCoffeeLogSummary,
  visualSystemTokens,
} from '@funcup/shared';

import { EmptyState } from '../EmptyState';
import { ScreenError } from '../ScreenError';
import { DiscoverListSkeleton } from '../ui/Skeleton';
import { useViewerUserId } from '../../hooks/useViewerUserId';
import { useOfflineTastingQueueStatus } from '../../hooks/useOfflineTastingQueueStatus';
import { supabase } from '../../services/supabaseClient';
import { AppCard, AppText } from '../ui/primitives';
import { RatedCoffeeLogCard, matchesRatedCoffeeSearch } from './RatedCoffeeLogCard';

type JournalRow = {
  id: string;
  rating: number | null;
  free_text_notes: string | null;
  logged_at: string;
  roast_batches: {
    id: string;
    lot_number: string | null;
    coffees: {
      id: string;
      name: string;
      processing_method: string | null;
      origin: { country: string | null } | null;
      roasters:
        | { id: string; name: string; country: string | null; city: string | null }
        | { id: string; name: string; country: string | null; city: string | null }[]
        | null;
    } | null;
  } | null;
};

function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

function resolveSingle<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function toRatedCoffeeLogSummary(row: JournalRow): RatedCoffeeLogSummary {
  const coffee = resolveSingle(row.roast_batches?.coffees ?? null);
  const roaster = resolveSingle(coffee?.roasters ?? null);

  return {
    coffeeLogId: row.id,
    coffeeName: coffee?.name ?? 'Coffee',
    roasterName: roaster?.name ?? null,
    roasterCountry: roaster?.country ?? null,
    originCountry: coffee?.origin?.country ?? null,
    processingMethod: coffee?.processing_method ?? null,
    lotNumber: row.roast_batches?.lot_number ?? null,
    rating: row.rating,
    loggedAt: row.logged_at,
    freeTextNotes: row.free_text_notes,
  };
}

export function RatedCoffeesSection(props: { searchQuery?: string }) {
  const { userId, isLoading: authLoading } = useViewerUserId();
  const router = useRouter();
  const { pendingCount, failedCount } = useOfflineTastingQueueStatus();
  const journalQuery = useJournal({ supabase, userId });
  const favoriteLogsQuery = useFavoriteRatedCoffeeLogs({ supabase, userId });
  const favoriteToggleMutation = useToggleFavoriteRatedCoffeeLog({ supabase, userId });
  const hasQueueWarnings = pendingCount > 0 || failedCount > 0;
  const favoriteLogIds = useMemo(
    () => new Set((favoriteLogsQuery.data ?? []).map((entry) => entry.coffeeLogId)),
    [favoriteLogsQuery.data]
  );

  useFocusEffect(
    useCallback(() => {
      if (!userId) return undefined;
      void journalQuery.refetch();
      void favoriteLogsQuery.refetch();
      return undefined;
    }, [favoriteLogsQuery, journalQuery, userId])
  );

  if (authLoading) {
    return (
      <View style={styles.section}>
        <DiscoverListSkeleton rows={3} />
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={styles.section}>
        <EmptyState
          title="Sign in to see rated coffees"
          description="Your tastings and star-marked favourites will show up here after you log a coffee."
          footer={
            <Link href="/(auth)/login" accessibilityRole="link">
              Go to sign in
            </Link>
          }
        />
      </View>
    );
  }

  if (journalQuery.isLoading) {
    return (
      <View style={styles.section}>
        <DiscoverListSkeleton rows={4} />
      </View>
    );
  }

  if (journalQuery.isError) {
    return (
      <View style={styles.section}>
        <ScreenError message={formatError(journalQuery.error)} onRetry={() => void journalQuery.refetch()} />
      </View>
    );
  }

  const rows = (journalQuery.data ?? []) as JournalRow[];
  const entries = rows.map((row) => toRatedCoffeeLogSummary(row));
  const normalizedQuery = normalizeSearchValue(props.searchQuery ?? '');
  const filteredEntries = entries.filter((entry) => matchesRatedCoffeeSearch(entry, normalizedQuery));

  if (rows.length === 0) {
    return (
      <View style={styles.section}>
        {hasQueueWarnings ? (
          <AppCard style={styles.syncInfoCard}>
            <AppText weight="600">Sync status</AppText>
            {pendingCount > 0 ? (
              <AppText tone="secondary">Pending sync: {pendingCount}</AppText>
            ) : null}
            {failedCount > 0 ? (
              <AppText tone="danger">Failed sync: {failedCount} (requires retry after backend fix)</AppText>
            ) : null}
          </AppCard>
        ) : null}
        <EmptyState
          title="Rate your first coffee"
          description="Scan QR from a coffee bag, log a tasting, and star the rated coffee to build this list."
          footer={
            <Link href="/(tabs)/scan/scan" accessibilityRole="link">
              Open scanner
            </Link>
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {hasQueueWarnings ? (
        <AppCard style={styles.syncInfoCard}>
          <AppText weight="600">Sync status</AppText>
          {pendingCount > 0 ? (
            <AppText tone="secondary">Pending sync: {pendingCount}</AppText>
          ) : null}
          {failedCount > 0 ? (
            <AppText tone="danger">Failed sync: {failedCount} (requires retry after backend fix)</AppText>
          ) : null}
        </AppCard>
      ) : null}
      {filteredEntries.length === 0 ? (
        <EmptyState
          title="No matching rated coffees"
          description="Try a different coffee name, country, lot, note phrase, or rating."
        />
      ) : null}
      {filteredEntries.map((entry) => {
        const isFavorite = favoriteLogIds.has(entry.coffeeLogId);

        return (
          <RatedCoffeeLogCard
            key={entry.coffeeLogId}
            entry={entry}
            isFavorite={isFavorite}
            favoriteToggleDisabled={favoriteLogsQuery.isLoading || favoriteToggleMutation.isPending}
            favoriteToggleLabel={
              isFavorite
                ? 'Remove favourite from rated coffee'
                : 'Add rated coffee to favourites'
            }
            onPress={() => {
              router.push(`/coffee-log/${entry.coffeeLogId}`);
            }}
            onToggleFavorite={() => {
              void favoriteToggleMutation.mutateAsync({
                coffeeLogId: entry.coffeeLogId,
                shouldFavorite: !isFavorite,
                optimisticEntry: entry,
              });
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: visualSystemTokens.spacing.sm,
  },
  syncInfoCard: {
    padding: visualSystemTokens.spacing.sm,
    gap: visualSystemTokens.spacing.xxs,
    backgroundColor: visualSystemTokens.colors.surfaceMuted,
  },
});
