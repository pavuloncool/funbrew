import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useJournal } from '@funcup/shared';

import { EmptyState } from '../../../src/components/EmptyState';
import { ScreenError } from '../../../src/components/ScreenError';
import { DiscoverListSkeleton } from '../../../src/components/ui/Skeleton';
import { useViewerUserId } from '../../../src/hooks/useViewerUserId';
import { supabase } from '../../../src/services/supabaseClient';
import { AppCard, AppScrollScreen, AppText } from '../../../src/components/ui/primitives';
import { visualSystemTokens } from '@funcup/shared';
import { pageStyles } from '../../../src/theme/pageStyles';

type JournalRow = {
  id: string;
  rating: number | null;
  free_text_notes: string | null;
  logged_at: string;
  roast_batches: {
    id: string;
    lot_number: string | null;
    coffees: { id: string; name: string; roasters: { id: string; name: string } | null } | null;
  } | null;
};

function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export default function JournalIndex() {
  const { userId, isLoading: authLoading } = useViewerUserId();
  const journalQuery = useJournal({ supabase, userId });

  if (authLoading) {
    return (
      <AppScrollScreen contentContainerStyle={pageStyles.content}>
        <AppText variant="h2" weight="700" accessibilityRole="header" style={styles.title}>Journal</AppText>
        <DiscoverListSkeleton rows={3} />
      </AppScrollScreen>
    );
  }

  if (!userId) {
    return (
      <AppScrollScreen contentContainerStyle={pageStyles.content}>
        <AppText variant="h2" weight="700" accessibilityRole="header" style={styles.title}>Journal</AppText>
        <EmptyState
          title="Sign in to see your journal"
          description="Your tastings will show up here after you log a coffee."
          footer={
            <Link href="/(auth)/login" accessibilityRole="link">
              Go to sign in
            </Link>
          }
        />
      </AppScrollScreen>
    );
  }

  if (journalQuery.isLoading) {
    return (
      <AppScrollScreen contentContainerStyle={pageStyles.content}>
        <AppText variant="h2" weight="700" accessibilityRole="header" style={styles.title}>Journal</AppText>
        <DiscoverListSkeleton rows={4} />
      </AppScrollScreen>
    );
  }

  if (journalQuery.isError) {
    return (
      <AppScrollScreen contentContainerStyle={pageStyles.content}>
        <AppText variant="h2" weight="700" accessibilityRole="header">Journal</AppText>
        <ScreenError message={formatError(journalQuery.error)} onRetry={() => void journalQuery.refetch()} />
      </AppScrollScreen>
    );
  }

  const rows = (journalQuery.data ?? []) as JournalRow[];

  if (rows.length === 0) {
    return (
      <AppScrollScreen contentContainerStyle={pageStyles.content}>
        <AppText variant="h2" weight="700" accessibilityRole="header" style={styles.title}>Coffee Log</AppText>
        <EmptyState
          title="Add your first tasting"
          description="Scan QR from coffee bag, log a tasting and share your experience with other coffee lovers."
          footer={
            <Link href="/(tabs)/scan/scan" accessibilityRole="link">
              Open scanner
            </Link>
          }
        />
      </AppScrollScreen>
    );
  }

  return (
    <AppScrollScreen contentContainerStyle={pageStyles.content}>
      <AppText variant="h2" weight="700" accessibilityRole="header">Journal</AppText>
      {rows.map((row) => {
        const coffee = row.roast_batches?.coffees;
        const title = coffee?.name ?? 'Coffee';
        const roaster = coffee?.roasters?.name;
        const ratingLabel = row.rating != null ? `${row.rating} / 5` : '—';
        return (
          <AppCard
            key={row.id}
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
          </AppCard>
        );
      })}
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: visualSystemTokens.spacing.xxs },
  rowCard: {
    padding: visualSystemTokens.spacing.sm,
    backgroundColor: visualSystemTokens.colors.surface,
  },
  note: { marginTop: visualSystemTokens.spacing.xxs },
});
