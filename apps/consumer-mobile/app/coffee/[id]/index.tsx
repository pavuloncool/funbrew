import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useCoffeePage } from '@funcup/shared';

import { ScreenError } from '../../../src/components/ScreenError';
import { CoffeePageSkeleton } from '../../../src/components/ui/Skeleton';
import { getResolvedSupabasePublicUrl, supabase } from '../../../src/services/supabaseClient';
import { CoffeePageBrewing } from '../../../src/coffee/CoffeePageBrewing';
import { CoffeePageCommunity } from '../../../src/coffee/CoffeePageCommunity';
import { CoffeePageProduct } from '../../../src/coffee/CoffeePageProduct';
import { CoffeePageStory } from '../../../src/coffee/CoffeePageStory';
import { AppCard, AppScrollScreen, AppText } from '../../../src/components/ui/primitives';
import { visualSystemTokens } from '@funcup/shared';

const NO_BOTTOM_SAFE_AREA = { edges: ['right', 'left'] as const };
const { colors, spacing, radius, typography } = visualSystemTokens;

function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function displayTagName(tag: { bean_origin_tradename: string; bean_origin_farm: string; id: string }): string {
  const tradename = tag.bean_origin_tradename.trim();
  if (tradename) return tradename;
  const farm = tag.bean_origin_farm.trim();
  if (farm) return farm;
  return `Kawa ${tag.id.slice(0, 8)}`;
}

function formatRoastDate(iso: string): string {
  const raw = iso.trim();
  if (!raw) return '—';
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00`) : new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' }).format(parsed);
}

function resolveTagImageUri(rawUri: string): string {
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
  const coffeeQuery = useCoffeePage({ supabase, hash });
  const [tagImageFailed, setTagImageFailed] = useState(false);
  const demoReputationScore = 52;
  const tagImageUri = useMemo(() => {
    const d = coffeeQuery.data;
    if (!d || d.kind !== 'tag') return null;
    return resolveTagImageUri(d.tag.img_coffee_label);
  }, [coffeeQuery.data]);

  useEffect(() => {
    setTagImageFailed(false);
  }, [tagImageUri]);

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
    return (
      <AppScrollScreen safeAreaProps={NO_BOTTOM_SAFE_AREA} contentContainerStyle={styles.standardContent}>
        <ScreenError
          message={formatError(coffeeQuery.error)}
          onRetry={() => void coffeeQuery.refetch()}
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

  if (data.kind === 'tag') {
    const t = data.tag;
    const tagName = displayTagName(t);

    return (
      <AppScrollScreen safeAreaProps={NO_BOTTOM_SAFE_AREA} style={styles.page} contentContainerStyle={styles.pageContent}>
        <AppCard style={styles.card}>
          <AppText variant="h1" weight="700" accessibilityRole="header" style={styles.title}>
            {tagName}
          </AppText>

          <View style={styles.imageWrap}>
            {!tagImageFailed && tagImageUri ? (
              <Image
                source={{ uri: tagImageUri }}
                style={styles.image}
                resizeMode="contain"
                accessibilityLabel="Etykieta kawy"
                onError={() => setTagImageFailed(true)}
              />
            ) : (
              <View style={styles.imageFallback}>
                <AppText tone="muted">Brak podglądu etykiety</AppText>
              </View>
            )}
          </View>

          <AppText style={styles.row}>
            <AppText weight="700">Roaster:</AppText> {t.roaster_short_name}
          </AppText>
          <AppText style={styles.row}>
            <AppText weight="700">Nazwa handlowa:</AppText> {t.bean_origin_tradename || '—'}
          </AppText>
          <AppText style={styles.row}>
            <AppText weight="700">Pochodzenie:</AppText> {t.bean_origin_country} · {t.bean_origin_region} ·{' '}
            {t.bean_origin_farm}
          </AppText>
          <AppText style={styles.row}>
            <AppText weight="700">Ziarno:</AppText> {t.bean_type} · {t.bean_varietal_main}
            {t.bean_varietal_extra ? ` · ${t.bean_varietal_extra}` : ''}
          </AppText>
          <AppText style={styles.row}>
            <AppText weight="700">Obróbka:</AppText> {t.bean_processing}
          </AppText>
          <AppText style={styles.row}>
            <AppText weight="700">Wypał:</AppText> {formatRoastDate(t.bean_roast_date)} ({t.bean_roast_level})
          </AppText>
          <AppText style={styles.row}>
            <AppText weight="700">Parzenie:</AppText> {t.brew_method}
          </AppText>
          <AppText style={styles.row}>
            <AppText weight="700">Wysokość:</AppText> {t.bean_origin_height} m
          </AppText>
          <AppText style={styles.row}>
            <AppText weight="700">Tasting notes:</AppText>{' '}
            {data.tasting_notes && data.tasting_notes.length > 0
              ? data.tasting_notes.map((note) => note.label).join(', ')
              : '—'}
          </AppText>
        </AppCard>
      </AppScrollScreen>
    );
  }

  const logHref = {
    pathname: '/coffee/[id]/log' as const,
    params: {
      id: hash,
      batchId: data.batch.id,
    },
  };

  return (
    <AppScrollScreen safeAreaProps={NO_BOTTOM_SAFE_AREA} contentContainerStyle={styles.standardContent}>
      {data.archived ? (
        <AppCard style={styles.archived}>
          <AppText weight="600">Archived batch</AppText>
          <AppText tone="secondary" style={styles.archivedInfo}>Tasting may be limited for this roast.</AppText>
        </AppCard>
      ) : null}

      <AppText variant="h2" weight="700" accessibilityRole="header">Coffee Page</AppText>

      <CoffeePageProduct
        coffeeName={data.coffee.name}
        variety={data.coffee.variety}
        processingMethod={data.coffee.processing_method}
        producerNotes={data.coffee.producer_notes}
        roasterName={data.roaster.name}
      />
      <CoffeePageBrewing brewingNotes={data.batch.brewing_notes} />
      <CoffeePageStory roasterStory={data.batch.roaster_story} />
      <CoffeePageCommunity
        reputationScore={demoReputationScore}
        totalTastings={data.stats.total_count}
        avgRating={data.stats.avg_rating}
      />

      <View style={styles.logAction}>
        <Link href={logHref} accessibilityRole="link" accessibilityLabel="Open tasting log for this batch">
          Go to Tasting Log
        </Link>
      </View>
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
});
