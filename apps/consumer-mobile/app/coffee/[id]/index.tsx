import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import {
  getReputationLevelLabel,
  useBatchCommunityReviews,
  useFavoriteScannedEntries,
  flowErrorUiCopy,
  normalizeCoffeePageData,
  normalizeFlowError,
  toCanonicalPublicationFields,
  useToggleFavoriteScannedEntry,
  useToggleReviewHelpful,
  useCoffeePage,
  visualSystemTokens,
} from '@funcup/shared';

import { ScreenError } from '../../../src/components/ScreenError';
import { CoffeePageSkeleton } from '../../../src/components/ui/Skeleton';
import { getResolvedSupabasePublicUrl, supabase } from '../../../src/services/supabaseClient';
import { CoffeePageBrewing } from '../../../src/coffee/CoffeePageBrewing';
import { CoffeePageCommunity } from '../../../src/coffee/CoffeePageCommunity';
import { CoffeePageProduct } from '../../../src/coffee/CoffeePageProduct';
import { CoffeePageStory } from '../../../src/coffee/CoffeePageStory';
import { AppButton, AppCard, AppScrollScreen, AppText } from '../../../src/components/ui/primitives';
import { EmptyState } from '../../../src/components/EmptyState';
import { useViewerUserId } from '../../../src/hooks/useViewerUserId';

const NO_BOTTOM_SAFE_AREA = { edges: ['right', 'left'] as const };
const { colors, spacing, radius, typography } = visualSystemTokens;

function formatRoastDate(iso: string): string {
  const raw = iso.trim();
  if (!raw) return '—';
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00`) : new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' }).format(parsed);
}

function resolveImageUri(rawUri: string): string {
  const value = rawUri.trim();
  if (!value) return value;

  let supabaseBase: URL | null = null;
  try {
    supabaseBase = new URL(getResolvedSupabasePublicUrl());
  } catch {
    supabaseBase = null;
  }

  if (value.startsWith('/')) {
    return supabaseBase ? `${supabaseBase.origin}${value}` : value;
  }

  try {
    const imageUrl = new URL(value);
    if (
      supabaseBase &&
      (imageUrl.hostname === '127.0.0.1' || imageUrl.hostname === 'localhost')
    ) {
      imageUrl.protocol = supabaseBase.protocol;
      imageUrl.hostname = supabaseBase.hostname;
      imageUrl.port = supabaseBase.port;
      return imageUrl.toString();
    }
    return imageUrl.toString();
  } catch {
    return value;
  }
}

export default function CoffeePage() {
  const params = useLocalSearchParams<{ id?: string }>();
  const hash = params.id ?? null;
  const { userId } = useViewerUserId();
  const coffeeQuery = useCoffeePage({ supabase, hash });
  const favoritesQuery = useFavoriteScannedEntries({ supabase, userId });
  const communityBatchId = coffeeQuery.data?.batch.id ?? null;
  const communityQuery = useBatchCommunityReviews({
    supabase,
    batchId: communityBatchId,
  });
  const helpfulMutation = useToggleReviewHelpful({
    supabase,
    userId,
    batchId: communityBatchId,
  });
  const [coffeeImageFailed, setCoffeeImageFailed] = useState(false);
  const favoriteMutation = useToggleFavoriteScannedEntry({ supabase, userId });
  const coffeeImageUri = useMemo(() => {
    const d = coffeeQuery.data;
    if (!d) return null;
    return d.coffee.cover_image_url ? resolveImageUri(d.coffee.cover_image_url) : null;
  }, [coffeeQuery.data]);

  useEffect(() => {
    setCoffeeImageFailed(false);
  }, [coffeeImageUri]);

  if (!hash) {
    return (
      <AppScrollScreen safeAreaProps={NO_BOTTOM_SAFE_AREA} contentContainerStyle={styles.standardContent}>
        <ScreenError
          title="Missing QR"
          message="Open this page from a scanned QR code or a valid link."
        />
      </AppScrollScreen>
    );
  }

  if (coffeeQuery.isLoading) {
    return (
      <AppScrollScreen safeAreaProps={NO_BOTTOM_SAFE_AREA}>
        <CoffeePageSkeleton />
      </AppScrollScreen>
    );
  }

  if (coffeeQuery.isError) {
    const flowError = normalizeFlowError({ error: coffeeQuery.error, domain: 'scan' });
    const copy = flowErrorUiCopy(flowError);
    return (
      <AppScrollScreen safeAreaProps={NO_BOTTOM_SAFE_AREA} contentContainerStyle={styles.standardContent}>
        <ScreenError
          title={copy.title}
          message={copy.message}
          onRetry={() => void coffeeQuery.refetch()}
          retryLabel={copy.retryLabel ?? 'Retry'}
        />
      </AppScrollScreen>
    );
  }

  const data = coffeeQuery.data;
  if (!data) {
    return (
      <AppScrollScreen safeAreaProps={NO_BOTTOM_SAFE_AREA} contentContainerStyle={styles.paddedContent}>
        <ScreenError title="No data" message="Unexpected empty response from scan." />
      </AppScrollScreen>
    );
  }

  const publicCoffee = normalizeCoffeePageData(data, { hash });
  const fields = toCanonicalPublicationFields(publicCoffee);
  const isFavorite = Boolean(favoritesQuery.data?.some((entry) => entry.qrHash === hash));

  const logHref = {
    pathname: '/coffee/[id]/log' as const,
    params: {
      id: hash,
      batchId: publicCoffee.logBatchId ?? hash,
    },
  };

  return (
    <AppScrollScreen safeAreaProps={NO_BOTTOM_SAFE_AREA} contentContainerStyle={styles.standardContent}>
      {publicCoffee.archived ? (
        <AppCard style={styles.archived}>
          <AppText weight="600">Archived batch</AppText>
          <AppText tone="secondary" style={styles.archivedInfo}>Tasting may be limited for this roast.</AppText>
        </AppCard>
      ) : null}

      <AppText variant="h2" weight="700" accessibilityRole="header">Coffee Page</AppText>
      <View style={styles.imageWrap}>
        {!coffeeImageFailed && coffeeImageUri ? (
          <Image
            source={{ uri: coffeeImageUri }}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel="Etykieta kawy"
            onError={() => setCoffeeImageFailed(true)}
          />
        ) : (
          <View style={styles.imageFallback}>
            <AppText tone="muted">Brak podglądu etykiety</AppText>
          </View>
        )}
      </View>

      <AppCard style={styles.card}>
        <AppText style={styles.row}>
          <AppText weight="700">Roaster:</AppText> {publicCoffee.roaster.shortName ?? '—'}
        </AppText>
        <AppText style={styles.row}>
          <AppText weight="700">Coffee status:</AppText> {fields.coffee.status ?? '—'}
        </AppText>
        <AppText style={styles.row}>
          <AppText weight="700">Batch status:</AppText> {fields.batch.status ?? '—'}
        </AppText>
        <AppText style={styles.row}>
          <AppText weight="700">Lot number:</AppText> {fields.batch.lotNumber ?? '—'}
        </AppText>
        <AppText style={styles.row}>
          <AppText weight="700">Roast date:</AppText>{' '}
          {fields.batch.roastDate ? formatRoastDate(fields.batch.roastDate) : '—'}
        </AppText>
        <AppText style={styles.row}>
          <AppText weight="700">Origin:</AppText>{' '}
          {[fields.origin.country, fields.origin.region, fields.origin.farm].filter(Boolean).join(' · ') || '—'}
        </AppText>
        <AppText style={styles.row}>
          <AppText weight="700">Producer:</AppText> {fields.origin.producer ?? '—'}
        </AppText>
        <AppText style={styles.row}>
          <AppText weight="700">Altitude:</AppText> {fields.origin.altitudeLabel ?? '—'}
        </AppText>
        {userId ? (
          <AppButton
            label={favoriteMutation.isPending ? 'Saving favorite…' : isFavorite ? 'Remove from favorites' : 'Save scanned entry'}
            variant={isFavorite ? 'secondary' : 'primary'}
            onPress={() => {
              void favoriteMutation.mutateAsync({
                qrHash: hash,
                batchId: publicCoffee.logBatchId ?? data.batch.id,
                coffeeId: data.coffee.id,
                shouldFavorite: !isFavorite,
                optimisticEntry: {
                  id: `optimistic-${hash}`,
                  qrHash: hash,
                  batchId: publicCoffee.logBatchId ?? data.batch.id,
                  coffeeId: data.coffee.id,
                  createdAt: new Date().toISOString(),
                  coffeeName: fields.coffee.name,
                  processingMethod: fields.coffee.processingMethod,
                  roastDate: fields.batch.roastDate ?? null,
                  lotNumber: fields.batch.lotNumber ?? null,
                  roasterName: publicCoffee.roaster.name,
                },
              });
            }}
            disabled={favoriteMutation.isPending}
          />
        ) : null}
      </AppCard>

      <CoffeePageProduct
        coffeeName={fields.coffee.name}
        variety={fields.coffee.variety}
        processingMethod={fields.coffee.processingMethod}
        producerNotes={fields.coffee.producerNotes}
        roasterName={publicCoffee.roaster.name}
      />
      <CoffeePageBrewing brewingNotes={fields.batch.brewingNotes} />
      <CoffeePageStory roasterStory={fields.batch.roasterStory} />
      <CoffeePageCommunity
        totalTastings={publicCoffee.stats.totalTastings}
        avgRating={publicCoffee.stats.avgRating}
      />

      <AppCard style={styles.card}>
        <AppText variant="h3" weight="700">Community reviews</AppText>
        <AppText tone="secondary">
          Public tasting notes for this batch. Helpful votes are lightweight quality signals only.
        </AppText>
        {communityQuery.isLoading ? (
          <AppText tone="secondary">Loading reviews…</AppText>
        ) : (communityQuery.data?.length ?? 0) === 0 ? (
          <EmptyState
            title="No public reviews yet"
            description="Be the first to publish a short review from the tasting log."
          />
        ) : (
          communityQuery.data?.map((review) => (
            <View key={review.reviewId} style={styles.reviewCard}>
              <AppText weight="700">
                {review.authorName ?? 'Anonymous taster'}
                {review.authorSensoryLevel ? ` · ${getReputationLevelLabel(review.authorSensoryLevel)}` : ''}
              </AppText>
              <AppText tone="secondary">
                {new Date(review.loggedAt).toLocaleDateString('pl-PL')} · {review.helpfulCount} helpful
              </AppText>
              <AppText>{review.body}</AppText>
              {userId ? (
                <Pressable
                  onPress={() => {
                    void helpfulMutation.mutateAsync({
                      reviewId: review.reviewId,
                      shouldMarkHelpful: !review.viewerMarkedHelpful,
                    });
                  }}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.helpfulButton,
                    review.viewerMarkedHelpful ? styles.helpfulButtonActive : null,
                    pressed ? styles.helpfulButtonPressed : null,
                  ]}
                >
                  <AppText tone={review.viewerMarkedHelpful ? 'onPrimary' : 'secondary'} weight="700">
                    {review.viewerMarkedHelpful ? 'Helpful saved' : 'Mark Helpful'}
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          ))
        )}
      </AppCard>

      {publicCoffee.logBatchId ? (
        <View style={styles.logAction}>
          <Link href={logHref} asChild>
            <Pressable accessibilityRole="button" style={styles.logCta}>
              <AppText weight="700" tone="onPrimary">Go to Tasting Log</AppText>
            </Pressable>
          </Link>
        </View>
      ) : null}
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  standardContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 0,
    gap: spacing.sm,
  },
  paddedContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 0,
  },
  page: { backgroundColor: colors.canvas },
  pageContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 0,
  },
  card: {
    padding: spacing.md,
  },
  title: {
    marginBottom: spacing.sm,
    lineHeight: 36,
  },
  imageWrap: { marginBottom: spacing.md },
  image: {
    width: '100%',
    height: 420,
    borderRadius: radius.xs,
    backgroundColor: colors.canvas,
  },
  imageFallback: {
    width: '100%',
    height: 420,
    borderRadius: radius.xs,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { marginBottom: spacing.sm, lineHeight: typography.headingSM + spacing.xs },
  archived: { backgroundColor: colors.surfaceMuted },
  archivedInfo: { marginTop: spacing.xxs },
  logAction: { paddingVertical: spacing.sm },
  logCta: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.accentPrimary,
    paddingHorizontal: spacing.md,
  },
  reviewCard: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  helpfulButton: {
    alignSelf: 'flex-start',
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  helpfulButtonActive: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  helpfulButtonPressed: {
    opacity: 0.9,
  },
});
