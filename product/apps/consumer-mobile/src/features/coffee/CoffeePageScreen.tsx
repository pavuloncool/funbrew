import {
  getReputationLevelLabel,
  useBatchCommunityReviews,
  flowErrorUiCopy,
  normalizeCoffeePageData,
  normalizeFlowError,
  toCanonicalPublicationFields,
  useToggleReviewHelpful,
  useCoffeePage,
  visualSystemTokens,
} from '@funcup/shared';
import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { useLocalSearchParams, useRouter, useSegments } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { CoffeePageCommunity } from '../../coffee/CoffeePageCommunity';
import { EmptyState } from '../../components/EmptyState';
import { InlineBackHeader } from '../../components/navigation/InlineBackHeader';
import { ScreenError } from '../../components/ScreenError';
import { AppCard, AppScrollScreen, AppText } from '../../components/ui/primitives';
import { CoffeePageSkeleton } from '../../components/ui/Skeleton';
import { useViewerUserId } from '../../hooks/useViewerUserId';
import { getResolvedSupabasePublicUrl, supabase } from '../../services/supabaseClient';

const NO_BOTTOM_SAFE_AREA = { edges: ['top', 'right', 'left'] as const };
const { colors, spacing, radius } = visualSystemTokens;

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

function formatDisplayValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '—';
}

function formatVarietyLabel(
  varieties: Array<{ id: string; name: string }> | undefined,
  legacyVariety: string | null | undefined
): string {
  const varietyNames = (varieties ?? [])
    .map((entry) => entry.name.trim())
    .filter((entry) => entry.length > 0);
  if (varietyNames.length > 0) return varietyNames.join(', ');
  return formatDisplayValue(legacyVariety);
}

function MetaRow(props: { label: string; value: string | null | undefined }) {
  return (
    <AppText style={styles.row}>
      <AppText weight="700">{props.label}:</AppText> {formatDisplayValue(props.value)}
    </AppText>
  );
}

export default function CoffeePageScreen() {
  const params = useLocalSearchParams<{ hash?: string }>();
  const segments = useSegments() as string[];
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const router = useRouter();
  const hash = params.hash ?? null;
  const topSegment = segments[0] ?? null;
  const isScanContext = topSegment === 'q';
  const scanExitInProgressRef = useRef(false);
  const { userId } = useViewerUserId();
  const coffeeQuery = useCoffeePage({ supabase, hash });
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
  const fallbackHref = '/(tabs)/coffee';
  const coffeeImageUri = useMemo(() => {
    const d = coffeeQuery.data;
    if (!d) return null;
    return d.coffee.cover_image_url ? resolveImageUri(d.coffee.cover_image_url) : null;
  }, [coffeeQuery.data]);

  useEffect(() => {
    setCoffeeImageFailed(false);
  }, [coffeeImageUri]);

  useEffect(() => {
    if (!isScanContext) return;

    scanExitInProgressRef.current = false;
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (scanExitInProgressRef.current) return;

      event.preventDefault();
      scanExitInProgressRef.current = true;
      router.replace('/(tabs)/coffee');
    });

    return unsubscribe;
  }, [isScanContext, navigation, router]);

  if (!hash) {
    return (
      <AppScrollScreen safeAreaProps={NO_BOTTOM_SAFE_AREA} contentContainerStyle={styles.standardContent}>
        <InlineBackHeader
          title="Discover Coffee"
          fallbackHref={fallbackHref}
          preferHistory={!isScanContext}
        />
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
        <InlineBackHeader
          title="Discover Coffee"
          fallbackHref={fallbackHref}
          preferHistory={!isScanContext}
          style={styles.loadingHeader}
        />
        <CoffeePageSkeleton />
      </AppScrollScreen>
    );
  }

  if (coffeeQuery.isError) {
    const flowError = normalizeFlowError({ error: coffeeQuery.error, domain: 'scan' });
    const copy = flowErrorUiCopy(flowError);
    return (
      <AppScrollScreen safeAreaProps={NO_BOTTOM_SAFE_AREA} contentContainerStyle={styles.standardContent}>
        <InlineBackHeader
          title="Discover Coffee"
          fallbackHref={fallbackHref}
          preferHistory={!isScanContext}
        />
        <ScreenError
          title={copy.title}
          message="Data not fetched. Try again or contact fun•brew."
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
        <InlineBackHeader
          title="Discover Coffee"
          fallbackHref={fallbackHref}
          preferHistory={!isScanContext}
        />
        <ScreenError title="No data" message="Unexpected empty response from scan." />
      </AppScrollScreen>
    );
  }

  const publicCoffee = normalizeCoffeePageData(data, { hash });
  const fields = toCanonicalPublicationFields(publicCoffee);

  return (
    <AppScrollScreen safeAreaProps={NO_BOTTOM_SAFE_AREA} contentContainerStyle={styles.standardContent}>
      <InlineBackHeader
        title="Discover Coffee"
        fallbackHref={fallbackHref}
        preferHistory={!isScanContext}
      />

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

      <AppCard style={styles.roasterCard}>
        {/*<AppText variant="h3" weight="700">Roaster data</AppText>*/}
        <MetaRow label="Coffee Name" value={fields.coffee.name} />
        <MetaRow label="Roaster short name" value={publicCoffee.roaster.shortName} />
        <MetaRow
          label="Variety"
          value={formatVarietyLabel(fields.coffee.varieties, fields.coffee.variety)}
        />
        <MetaRow label="Country of Origin" value={fields.origin.country} />
        <MetaRow label="Region of Origin" value={fields.origin.region} />
        <MetaRow label="Farm" value={fields.origin.farm} />
        <MetaRow label="Altitude" value={fields.origin.altitudeLabel} />
        <MetaRow
          label="Roast date"
          value={fields.batch.roastDate ? formatRoastDate(fields.batch.roastDate) : null}
        />
        <MetaRow label="Brewing suggestions" value={fields.batch.brewingNotes} />
        <MetaRow label="Roaster story" value={fields.batch.roasterStory} />
      </AppCard>

      <AppCard style={styles.communityCard}>
        <AppText variant="h3" weight="700">Community feedback</AppText>
        <CoffeePageCommunity
          totalTastings={publicCoffee.stats.totalTastings}
          avgRating={publicCoffee.stats.avgRating}
          favoriteUsersCount={publicCoffee.stats.favoriteUsersCount}
        />
        <View style={styles.communityReviewsSection}>
          <AppText variant="body" weight="700">Community reviews</AppText>
          <AppText tone="secondary" style={styles.communityReviewsIntro}>
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
        </View>
      </AppCard>
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
    padding: spacing.xl,
  },
  loadingHeader: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.xl,
  },
  imageWrap: {
    marginTop: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: 240,
  },
  imageFallback: {
    width: '100%',
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roasterCard: {
    gap: spacing.xs,
  },
  communityCard: {
    gap: spacing.md,
  },
  row: {
    color: colors.textPrimary,
  },
  communityReviewsSection: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  communityReviewsIntro: {
    marginBottom: spacing.xs,
  },
  reviewCard: {
    marginTop: spacing.md,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.md,
  },
  helpfulButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  helpfulButtonActive: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  helpfulButtonPressed: {
    opacity: 0.85,
  },
});
