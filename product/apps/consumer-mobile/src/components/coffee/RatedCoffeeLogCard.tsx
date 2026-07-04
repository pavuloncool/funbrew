import { visualSystemTokens } from '@funcup/shared';
import { Pressable, StyleSheet, View } from 'react-native';

import type { RatedCoffeeLogSummary } from '@funcup/shared';

import { AppCard, AppText } from '../ui/primitives';
import { FavoriteToggleButton } from './FavoriteToggleButton';

const { colors, spacing, radius } = visualSystemTokens;

function formatLogDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

export function matchesRatedCoffeeSearch(entry: RatedCoffeeLogSummary, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  const values = [
    entry.coffeeName,
    entry.roasterName,
    entry.roasterCountry,
    entry.originCountry,
    entry.processingMethod,
    entry.lotNumber,
    entry.rating != null ? String(entry.rating) : null,
    entry.freeTextNotes,
    entry.loggedAt ? formatLogDate(entry.loggedAt) : null,
    entry.loggedAt ? new Date(entry.loggedAt).toLocaleDateString() : null,
  ];
  return values.some((value) => value?.toLowerCase().includes(normalizedQuery));
}

function formatRatingLabel(rating: number | null): string {
  if (rating == null) return '—';
  return `${rating} / 5`;
}

function formatSummaryLine(entry: RatedCoffeeLogSummary): string {
  const details = [
    entry.processingMethod,
    entry.lotNumber ? `Lot ${entry.lotNumber}` : null,
    entry.originCountry ? `Origin ${entry.originCountry}` : null,
  ].filter((value): value is string => Boolean(value));
  return details.join(' · ');
}

export function RatedCoffeeLogCard(props: {
  entry: RatedCoffeeLogSummary;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  favoriteToggleDisabled?: boolean;
  favoriteToggleLabel?: string;
}) {
  const ratingLabel = formatRatingLabel(props.entry.rating);
  const summaryLine = formatSummaryLine(props.entry);

  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityLabel={`${props.entry.coffeeName}, rating ${ratingLabel}`}
      style={({ pressed }) => [styles.cardPressable, pressed ? styles.pressed : null]}
    >
      <AppCard style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <AppText variant="h3" weight="700">
              {props.entry.coffeeName}
            </AppText>
            {props.entry.roasterName ? <AppText tone="secondary">{props.entry.roasterName}</AppText> : null}
          </View>
          <FavoriteToggleButton
            compact
            active={props.isFavorite}
            onPress={props.onToggleFavorite}
            disabled={props.favoriteToggleDisabled}
            accessibilityLabel={props.favoriteToggleLabel}
          />
        </View>

        <AppText tone="secondary">
          {ratingLabel}
          {props.entry.loggedAt ? ` · ${formatLogDate(props.entry.loggedAt)}` : ''}
        </AppText>

        {summaryLine ? <AppText tone="secondary">{summaryLine}</AppText> : null}

        {props.entry.roasterCountry ? (
          <AppText tone="secondary">Roaster country: {props.entry.roasterCountry}</AppText>
        ) : null}

        {props.entry.freeTextNotes ? (
          <AppText tone="muted" style={styles.notes} numberOfLines={4}>
            {props.entry.freeTextNotes}
          </AppText>
        ) : null}

        <AppText style={styles.openLabel}>Open details</AppText>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardPressable: {
    borderRadius: radius.xl,
  },
  pressed: {
    opacity: 0.92,
  },
  card: {
    gap: spacing.xs,
    backgroundColor: colors.surface,
    padding: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  headerText: {
    flex: 1,
    gap: spacing.xxs,
  },
  notes: {
    marginTop: spacing.xxs,
  },
  openLabel: {
    marginTop: spacing.xs,
    textDecorationLine: 'underline',
  },
});
