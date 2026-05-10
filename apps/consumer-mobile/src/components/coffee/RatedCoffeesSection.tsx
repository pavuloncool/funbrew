import { Link } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useJournal, visualSystemTokens } from '@funcup/shared';
import { useCallback } from 'react';

import { EmptyState } from '../EmptyState';
import { ScreenError } from '../ScreenError';
import { DiscoverListSkeleton } from '../ui/Skeleton';
import { useViewerUserId } from '../../hooks/useViewerUserId';
import { useOfflineTastingQueueStatus } from '../../hooks/useOfflineTastingQueueStatus';
import { supabase } from '../../services/supabaseClient';
import { AppCard, AppText } from '../ui/primitives';

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

function matchesSearch(row: JournalRow, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  const coffee = row.roast_batches?.coffees;
  const roaster = Array.isArray(coffee?.roasters)
    ? (coffee?.roasters[0] ?? null)
    : (coffee?.roasters ?? null);
  const values = [
    coffee?.name,
    roaster?.name,
    roaster?.city,
    roaster?.country,
    coffee?.origin?.country,
    row.roast_batches?.lot_number,
    row.free_text_notes,
    row.logged_at ? new Date(row.logged_at).toLocaleDateString() : null,
  ];

  return values.some((value) => value?.toLowerCase().includes(normalizedQuery));
}

export function RatedCoffeesSection(props: { searchQuery?: string }) {
  const { userId, isLoading: authLoading } = useViewerUserId();
  const { pendingCount, failedCount } = useOfflineTastingQueueStatus();
  const journalQuery = useJournal({ supabase, userId });
  const hasQueueWarnings = pendingCount > 0 || failedCount > 0;

  useFocusEffect(
    useCallback(() => {
      if (!userId) return undefined;
      void journalQuery.refetch();
      return undefined;
    }, [journalQuery, userId])
  );

  if (authLoading) {
    return (
      <View style={styles.section}>
        <AppText variant="h3" weight="700">Rated Coffees</AppText>
        <DiscoverListSkeleton rows={3} />
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={styles.section}>
        <AppText variant="h3" weight="700">Rated Coffees</AppText>
        <EmptyState
          title="Sign in to see rated coffees"
          description="Your tastings will show up here after you log a coffee."
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
        <AppText variant="h3" weight="700">Rated Coffees</AppText>
        <DiscoverListSkeleton rows={4} />
      </View>
    );
  }

  if (journalQuery.isError) {
    return (
      <View style={styles.section}>
        <AppText variant="h3" weight="700">Rated Coffees</AppText>
        <ScreenError message={formatError(journalQuery.error)} onRetry={() => void journalQuery.refetch()} />
      </View>
    );
  }

  const rows = (journalQuery.data ?? []) as JournalRow[];
  const normalizedQuery = normalizeSearchValue(props.searchQuery ?? '');
  const filteredRows = rows.filter((row) => matchesSearch(row, normalizedQuery));

  if (rows.length === 0) {
    return (
      <View style={styles.section}>
        <AppText variant="h3" weight="700">Rated Coffees</AppText>
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
          description="Scan QR from coffee bag and save your tasting to build this list."
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
      <AppText variant="h3" weight="700">Rated Coffees</AppText>
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
      {filteredRows.length === 0 ? (
        <EmptyState
          title="No matching rated coffees"
          description="Try a different coffee name, country, lot, or note phrase."
        />
      ) : null}
      {filteredRows.map((row) => {
        const coffee = row.roast_batches?.coffees;
        const roasterProfile = Array.isArray(coffee?.roasters)
          ? (coffee?.roasters[0] ?? null)
          : (coffee?.roasters ?? null);
        const title = coffee?.name ?? 'Coffee';
        const roaster = roasterProfile?.name;
        const ratingLabel = row.rating != null ? `${row.rating} / 5` : '—';

        return (
          <Link
            key={row.id}
            href={`/coffee-log/${row.id}`}
            asChild
          >
            <Pressable accessibilityRole="button">
              <AppCard
                style={styles.rowCard}
                accessibilityLabel={`${title}, ${roaster ?? ''}, rating ${ratingLabel}`}
              >
                <AppText variant="h3" weight="700">{title}</AppText>
                {roaster ? <AppText tone="secondary">{roaster}</AppText> : null}
                <AppText tone="secondary">
                  {ratingLabel}
                  {row.logged_at ? ` · ${new Date(row.logged_at).toLocaleString()}` : ''}
                </AppText>
                {row.free_text_notes ? (
                  <AppText tone="muted" style={styles.note} numberOfLines={4}>
                    {row.free_text_notes}
                  </AppText>
                ) : null}
                <AppText style={styles.openLabel}>Open details</AppText>
              </AppCard>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: visualSystemTokens.spacing.sm,
  },
  rowCard: {
    padding: visualSystemTokens.spacing.sm,
    backgroundColor: visualSystemTokens.colors.surface,
  },
  syncInfoCard: {
    padding: visualSystemTokens.spacing.sm,
    gap: visualSystemTokens.spacing.xxs,
    backgroundColor: visualSystemTokens.colors.surfaceMuted,
  },
  note: {
    marginTop: visualSystemTokens.spacing.xxs,
  },
  openLabel: {
    marginTop: visualSystemTokens.spacing.xs,
    textDecorationLine: 'underline',
  },
});
