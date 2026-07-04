import {
  type CoffeeLogDetails,
  deleteTasting,
  fetchCoffeeLogDetails,
  fetchRoasterTelemetryCore,
  flowErrorUiCopy,
  labelRepurchaseIntent,
  normalizeFlowError,
  SENSORY_CORE_METRICS,
  type RepurchaseIntent,
  updateTasting,
  useFavoriteRatedCoffeeLogs,
  useToggleFavoriteRatedCoffeeLog,
  useUnlockedTastingNotes,
  visualSystemTokens,
} from '@funcup/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrewMethodPicker } from '../../src/coffee/tasting/BrewMethodPicker';
import { FlavorNoteSelector } from '../../src/coffee/tasting/FlavorNoteSelector';
import { SensoryCoreScorePicker } from '../../src/coffee/tasting/SensoryCoreScorePicker';
import { FavoriteToggleButton } from '../../src/components/coffee/FavoriteToggleButton';
import { InlineBackHeader } from '../../src/components/navigation/InlineBackHeader';
import { useViewerUserId } from '../../src/hooks/useViewerUserId';
import { getResolvedSupabasePublicUrl, supabase } from '../../src/services/supabaseClient';
import { AppButton, AppCard, AppInput, AppScrollScreen, AppText } from '../../src/components/ui/primitives';
import { pageStyles } from '../../src/theme/pageStyles';

type JournalCacheRow = {
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

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) {
      return maybeMessage;
    }
  }
  return 'Could not save tasting update.';
}

const INTENT_OPTIONS: Array<{ value: RepurchaseIntent; label: string }> = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Not sure' },
];
const SCORE_OPTIONS = [1, 2, 3, 4, 5] as const;

function resolveImageUri(rawUri: string | null | undefined): string | null {
  const value = rawUri?.trim() ?? '';
  if (!value) return null;

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

export default function CoffeeLogDetailsScreen() {
  const params = useLocalSearchParams<{ logId?: string }>();
  const logId = typeof params.logId === 'string' ? params.logId : '';
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId, isLoading: userLoading } = useViewerUserId();
  const insets = useSafeAreaInsets();
  const contentBottomPadding = insets.bottom + 124;
  const unlocksQuery = useUnlockedTastingNotes({ supabase, userId });
  const favoriteLogsQuery = useFavoriteRatedCoffeeLogs({ supabase, userId });
  const favoriteToggleMutation = useToggleFavoriteRatedCoffeeLog({ supabase, userId });

  const detailsQuery = useQuery({
    queryKey: ['coffeeLogDetails', logId, userId ?? null],
    enabled: Boolean(logId && userId) && !userLoading,
    queryFn: async () => {
      if (!logId || !userId) throw new Error('Missing context');
      return fetchCoffeeLogDetails(supabase, { logId, userId });
    },
  });

  const telemetryQuery = useQuery({
    queryKey: ['coffeeLogTelemetry', logId, userId ?? null],
    enabled: Boolean(logId && userId) && !userLoading,
    retry: 1,
    queryFn: async () => {
      if (!logId) return null;
      return fetchRoasterTelemetryCore(supabase, logId);
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [rating, setRating] = useState(3);
  const [brewMethodId, setBrewMethodId] = useState<string | null>(null);
  const [tastingNoteIds, setTastingNoteIds] = useState<string[]>([]);
  const [freeTextNotes, setFreeTextNotes] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [sensoryAcidity, setSensoryAcidity] = useState(3);
  const [sensorySweetness, setSensorySweetness] = useState(3);
  const [sensoryBody, setSensoryBody] = useState(3);
  const [sensoryBitter, setSensoryBitter] = useState(3);
  const [sensoryAftertaste, setSensoryAftertaste] = useState(3);
  const [repurchaseIntent, setRepurchaseIntent] = useState<RepurchaseIntent>('unsure');
  const [coffeeImageFailed, setCoffeeImageFailed] = useState(false);

  useEffect(() => {
    const details = detailsQuery.data;
    if (!details || isEditing) return;

    setRating(details.rating);
    setBrewMethodId(details.brewMethodId);
    setTastingNoteIds(details.tastingNoteIds);
    setFreeTextNotes(details.freeTextNotes ?? '');
    setReviewBody(details.reviewBody ?? '');
  }, [detailsQuery.data, isEditing]);

  useEffect(() => {
    const telemetry = telemetryQuery.data;
    if (!telemetry || isEditing) return;
    setSensoryAcidity(telemetry.sensoryAcidity);
    setSensorySweetness(telemetry.sensorySweetness);
    setSensoryBody(telemetry.sensoryBody);
    setSensoryBitter(telemetry.sensoryBitter);
    setSensoryAftertaste(telemetry.sensoryAftertaste);
    setRepurchaseIntent(telemetry.repurchaseIntent);
  }, [telemetryQuery.data, isEditing]);

  const details = detailsQuery.data ?? null;
  const isFavorite = Boolean(
    favoriteLogsQuery.data?.some((entry) => entry.coffeeLogId === logId)
  );
  const coffeeImageUri = resolveImageUri(details?.coverImageUrl);

  useEffect(() => {
    setCoffeeImageFailed(false);
  }, [coffeeImageUri]);

  const validate = (): string | null => {
    if (rating < 1 || rating > 5) {
      return 'Rating must be between 1 and 5';
    }
    if (!brewMethodId) {
      return 'Select a brew method';
    }
    if (tastingNoteIds.length === 0) {
      return 'Select at least one tasting note';
    }
    return null;
  };

  const save = async () => {
    if (!details || !userId) return;
    const validationError = validate();
    if (validationError) {
      setSaveError(validationError);
      return;
    }

    setSaveError(null);
    setSaveStatus(null);
    setIsSaving(true);

    try {
      const result = await updateTasting(supabase, {
        coffeeLogId: details.id,
        batchId: details.batchId,
        userId,
        rating,
        brewMethodId: brewMethodId as string,
        tastingNoteIds,
        freeTextNotes,
        review: reviewBody,
        telemetry: {
          brewMethodId: brewMethodId as string,
          overallRating: rating,
          sensoryAcidity,
          sensorySweetness,
          sensoryBody,
          sensoryBitter,
          sensoryAftertaste,
          repurchaseIntent,
          experienceLevel: telemetryQuery.data?.experienceLevel ?? 'beginner',
        },
      });

      const telemetrySaveFailed = Boolean(result.telemetryError);
      const statsRefreshFailed = !result.statsUpdated;
      const telemetrySaveErrorMessage = result.telemetryError
        ? extractErrorMessage(result.telemetryError)
        : null;

      if (telemetrySaveFailed && statsRefreshFailed) {
        setSaveStatus('Tasting updated. Stats + Sensory Core refresh are temporarily unavailable.');
      } else if (telemetrySaveFailed) {
        setSaveStatus(
          telemetrySaveErrorMessage
            ? `Tasting updated. Sensory Core refresh failed: ${telemetrySaveErrorMessage}`
            : 'Tasting updated. Sensory Core refresh is temporarily unavailable.'
        );
      } else if (statsRefreshFailed) {
        setSaveStatus('Tasting updated. Stats refresh is temporarily unavailable.');
      } else {
        setSaveStatus('Tasting updated.');
      }

      const nextFreeTextNotes = freeTextNotes.trim() || null;
      const nextReviewBody = reviewBody.trim() || null;
      queryClient.setQueryData<CoffeeLogDetails | null>(
        ['coffeeLogDetails', logId, userId],
        (current) => {
          if (!current || current.id !== details.id) return current;
          return {
            ...current,
            rating,
            brewMethodId,
            tastingNoteIds: [...tastingNoteIds],
            freeTextNotes: nextFreeTextNotes,
            reviewBody: nextReviewBody,
          };
        }
      );
      queryClient.setQueryData<JournalCacheRow[]>(
        ['journal', userId],
        (current) => {
          if (!Array.isArray(current)) return current;
          return current.map((row) => (row.id === details.id
            ? { ...row, rating, free_text_notes: nextFreeTextNotes }
            : row));
        }
      );
      if (result.savedTelemetry) {
        queryClient.setQueryData(
          ['coffeeLogTelemetry', logId, userId],
          result.savedTelemetry
        );
      }

      setIsEditing(false);
      await Promise.all([
        detailsQuery.refetch(),
        telemetryQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ['journal', userId] }),
        queryClient.invalidateQueries({ queryKey: ['coffeePage'] }),
      ]);
    } catch (error) {
      const normalized = normalizeFlowError({
        error,
        domain: 'tasting_log',
        fallbackMessage: 'Could not save tasting update.',
      });
      setSaveError(extractErrorMessage(normalized));
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    if (!details || !userId) return;

    Alert.alert('Delete tasting', 'This will permanently remove this tasting entry.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setIsDeleting(true);
            setSaveError(null);
            try {
              const result = await deleteTasting(supabase, {
                coffeeLogId: details.id,
                batchId: details.batchId,
                userId,
              });
              if (!result.statsUpdated) {
                setSaveStatus(flowErrorUiCopy(normalizeFlowError({
                  error: new Error('Stats refresh is temporarily unavailable.'),
                  domain: 'tasting_log',
                })).message);
              }

              await queryClient.invalidateQueries({ queryKey: ['journal', userId] });
              router.replace('/(tabs)/coffee');
            } catch (deleteError) {
              setSaveError(
                deleteError instanceof Error
                  ? deleteError.message
                  : 'Could not delete tasting entry.'
              );
            } finally {
              setIsDeleting(false);
            }
          })();
        },
      },
    ]);
  };

  if (!logId) {
    return (
      <AppScrollScreen
        contentContainerStyle={[pageStyles.contentCompact, { paddingBottom: contentBottomPadding }]}
      >
        <InlineBackHeader title="Rated Coffee" fallbackHref="/(tabs)/coffee" />
        <AppText>Missing log id.</AppText>
      </AppScrollScreen>
    );
  }

  if (detailsQuery.isLoading || userLoading) {
    return (
      <AppScrollScreen
        contentContainerStyle={[pageStyles.contentCompact, { paddingBottom: contentBottomPadding }]}
      >
        <InlineBackHeader title="Rated Coffee" fallbackHref="/(tabs)/coffee" />
        <AppText>Loading tasting entry...</AppText>
      </AppScrollScreen>
    );
  }

  if (detailsQuery.isError) {
    return (
      <AppScrollScreen
        contentContainerStyle={[pageStyles.contentCompact, { paddingBottom: contentBottomPadding }]}
      >
        <InlineBackHeader title="Rated Coffee" fallbackHref="/(tabs)/coffee" />
        <AppText tone="danger">Could not load tasting details.</AppText>
      </AppScrollScreen>
    );
  }

  if (!details) {
    return (
      <AppScrollScreen
        contentContainerStyle={[pageStyles.contentCompact, { paddingBottom: contentBottomPadding }]}
      >
        <InlineBackHeader title="Rated Coffee" fallbackHref="/(tabs)/coffee" />
        <AppText>Tasting entry not found.</AppText>
      </AppScrollScreen>
    );
  }

  const title = details.coffeeName;
  const subtitle = details.roasterName
    ? `${details.roasterName} · ${new Date(details.loggedAt).toLocaleString()}`
    : new Date(details.loggedAt).toLocaleString();

  return (
    <AppScrollScreen
      contentContainerStyle={[pageStyles.contentCompact, { paddingBottom: contentBottomPadding }]}
    >
      <InlineBackHeader title="Rated Coffee" fallbackHref="/(tabs)/coffee" />
      <AppCard style={styles.heroCard}>
        <View style={styles.heroMedia}>
          {!coffeeImageFailed && coffeeImageUri ? (
            <Image
              source={{ uri: coffeeImageUri }}
              style={styles.heroImage}
              resizeMode="contain"
              accessibilityLabel={`Etykieta kawy ${title}`}
              onError={() => setCoffeeImageFailed(true)}
            />
          ) : (
            <View style={styles.heroFallback}>
              <AppText tone="muted">Brak podglądu etykiety</AppText>
            </View>
          )}
        </View>
        <View style={styles.heroText}>
          <AppText variant="h3" weight="700">{title}</AppText>
          <AppText tone="secondary">{subtitle}</AppText>
          {userId ? (
            <FavoriteToggleButton
              active={isFavorite}
              onPress={() => {
                void favoriteToggleMutation.mutateAsync({
                  coffeeLogId: logId,
                  shouldFavorite: !isFavorite,
                  optimisticEntry: {
                    coffeeLogId: logId,
                    coffeeName: title,
                    roasterName: details.roasterName,
                    roasterCountry: null,
                    originCountry: null,
                    processingMethod: null,
                    lotNumber: null,
                    rating: details.rating,
                    loggedAt: details.loggedAt,
                    freeTextNotes: details.freeTextNotes,
                  },
                });
              }}
              disabled={favoriteLogsQuery.isLoading || favoriteToggleMutation.isPending}
              label={isFavorite ? 'Remove favourite' : 'Add favourite'}
            />
          ) : null}
        </View>
      </AppCard>

      <AppCard style={styles.cardGap}>
        <AppText variant="body" weight="600">Rating</AppText>
        <View style={styles.scoreButtons}>
          {SCORE_OPTIONS.map((option) => {
            const active = rating === option;
            return (
              <Pressable
                key={option}
                onPress={() => isEditing && setRating(option)}
                disabled={!isEditing}
                style={[styles.scoreButton, active ? styles.scoreButtonActive : null]}
                accessibilityRole="button"
                accessibilityState={{ selected: active, disabled: !isEditing }}
              >
                <AppText tone={active ? 'onPrimary' : 'secondary'} weight="700">{option}</AppText>
              </Pressable>
            );
          })}
        </View>

        <BrewMethodPicker
          value={brewMethodId}
          onChange={(value) => {
            if (!isEditing) return;
            setBrewMethodId(value);
          }}
        />

        <FlavorNoteSelector
          selectedIds={tastingNoteIds}
          onChange={(nextIds) => {
            if (!isEditing) return;
            setTastingNoteIds(nextIds);
          }}
          options={unlocksQuery.data?.unlockedOptions}
        />
        {unlocksQuery.data ? (
          <View style={styles.selectorMeta}>
            <AppText tone="secondary">
              Current level: {unlocksQuery.data.levelLabel}
              {unlocksQuery.data.nextLevelLabel ? ` · next unlock at ${unlocksQuery.data.nextLevelLabel}` : ''}
            </AppText>
            {unlocksQuery.data.unlockHint ? (
              <AppText tone="secondary">{unlocksQuery.data.unlockHint}</AppText>
            ) : null}
          </View>
        ) : null}

        <AppText variant="body" weight="600">Free-text tasting notes</AppText>
        <AppText tone="secondary">
          Shown to roaster in Analytics as anonymized free-text tasting notes.
        </AppText>
        <AppInput
          value={freeTextNotes}
          onChangeText={setFreeTextNotes}
          editable={isEditing}
          placeholder="Acidity, sweetness, balance, finish..."
          multiline
          style={styles.multilineInput}
        />

        <AppText variant="body" weight="600">Optional review</AppText>
        <AppText tone="secondary">
          Shown to roaster in Analytics under Anonymized reviews.
        </AppText>
        <AppInput
          value={reviewBody}
          onChangeText={setReviewBody}
          editable={isEditing}
          placeholder="Share a short review for roaster analytics."
          multiline
          style={styles.multilineInput}
        />
      </AppCard>

      <AppCard style={styles.cardGap}>
        <AppText variant="body" weight="600">Sensory Core</AppText>
        {SENSORY_CORE_METRICS.map((metric) => (
          <SensoryCoreScorePicker
            key={metric.id}
            metric={metric}
            editable={isEditing}
            value={
              metric.telemetryKey === 'sensoryAcidity'
                ? sensoryAcidity
                : metric.telemetryKey === 'sensorySweetness'
                  ? sensorySweetness
                  : metric.telemetryKey === 'sensoryBody'
                    ? sensoryBody
                    : metric.telemetryKey === 'sensoryBitter'
                      ? sensoryBitter
                      : sensoryAftertaste
            }
            onChange={(value) => {
              if (metric.telemetryKey === 'sensoryAcidity') {
                setSensoryAcidity(value);
                return;
              }
              if (metric.telemetryKey === 'sensorySweetness') {
                setSensorySweetness(value);
                return;
              }
              if (metric.telemetryKey === 'sensoryBody') {
                setSensoryBody(value);
                return;
              }
              if (metric.telemetryKey === 'sensoryBitter') {
                setSensoryBitter(value);
                return;
              }
              setSensoryAftertaste(value);
            }}
          />
        ))}
        <View style={styles.intentGroup}>
          <AppText tone="secondary">Repurchase intent</AppText>
          <View style={styles.intentRow}>
            {INTENT_OPTIONS.map((option) => {
              const active = repurchaseIntent === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => isEditing && setRepurchaseIntent(option.value)}
                  disabled={!isEditing}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active, disabled: !isEditing }}
                  style={[styles.intentChip, active ? styles.intentChipActive : null]}
                >
                  <AppText tone={active ? 'onPrimary' : 'secondary'} weight="700">
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          {!isEditing ? (
            <AppText tone="muted">{labelRepurchaseIntent(repurchaseIntent)}</AppText>
          ) : null}
        </View>
      </AppCard>

      {saveError ? <AppText tone="danger">{saveError}</AppText> : null}
      {saveStatus ? <AppText tone="secondary">{saveStatus}</AppText> : null}

      <View style={styles.submit}>
        <AppText variant="body" weight="600">Submit tasting</AppText>
        <AppText tone="secondary">
          Required: rating, brew method, at least one tasting note.
        </AppText>
      </View>

      <View style={styles.actionsRow}>
        <AppButton
          label={isEditing ? (isSaving ? 'Saving...' : 'Save tasting') : 'Edit entry'}
          onPress={() => {
            if (isEditing) {
              void save();
            } else {
              setIsEditing(true);
            }
          }}
          disabled={isSaving || isDeleting}
        />
        {isEditing ? (
          <AppButton
            label="Cancel"
            variant="secondary"
            onPress={() => {
              setIsEditing(false);
              if (detailsQuery.data) {
                setRating(detailsQuery.data.rating);
                setBrewMethodId(detailsQuery.data.brewMethodId);
                setTastingNoteIds(detailsQuery.data.tastingNoteIds);
                setFreeTextNotes(detailsQuery.data.freeTextNotes ?? '');
                setReviewBody(detailsQuery.data.reviewBody ?? '');
                setSensoryAcidity(telemetryQuery.data?.sensoryAcidity ?? 3);
                setSensorySweetness(telemetryQuery.data?.sensorySweetness ?? 3);
                setSensoryBody(telemetryQuery.data?.sensoryBody ?? 3);
                setSensoryBitter(telemetryQuery.data?.sensoryBitter ?? 3);
                setSensoryAftertaste(telemetryQuery.data?.sensoryAftertaste ?? 3);
                setRepurchaseIntent(telemetryQuery.data?.repurchaseIntent ?? 'unsure');
              }
            }}
            disabled={isSaving || isDeleting}
          />
        ) : null}
      </View>

      <AppButton
        label={isDeleting ? 'Deleting...' : 'Delete entry'}
        variant="secondary"
        onPress={remove}
        disabled={isSaving || isDeleting}
      />
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    gap: visualSystemTokens.spacing.sm,
  },
  heroMedia: {
    minHeight: 180,
    borderRadius: visualSystemTokens.radius.lg,
    borderWidth: 1,
    borderColor: visualSystemTokens.colors.borderSubtle,
    backgroundColor: visualSystemTokens.colors.surfaceElevated,
    padding: visualSystemTokens.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 180,
  },
  heroFallback: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    gap: visualSystemTokens.spacing.xxs,
  },
  cardGap: {
    gap: visualSystemTokens.spacing.xs,
  },
  selectorMeta: {
    gap: visualSystemTokens.spacing.xxs,
  },
  scoreButtons: {
    flexDirection: 'row',
    gap: visualSystemTokens.spacing.xs,
  },
  scoreButton: {
    minWidth: 36,
    minHeight: 36,
    borderRadius: visualSystemTokens.radius.pill,
    borderWidth: 1,
    borderColor: visualSystemTokens.colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreButtonActive: {
    borderColor: visualSystemTokens.colors.accentPrimary,
    backgroundColor: visualSystemTokens.colors.accentPrimary,
  },
  multilineInput: {
    minHeight: 132,
  },
  intentGroup: {
    gap: visualSystemTokens.spacing.xs,
  },
  intentRow: {
    flexDirection: 'row',
    gap: visualSystemTokens.spacing.xs,
    flexWrap: 'wrap',
  },
  intentChip: {
    borderWidth: 1,
    borderColor: visualSystemTokens.colors.borderSubtle,
    borderRadius: visualSystemTokens.radius.pill,
    paddingHorizontal: visualSystemTokens.spacing.sm,
    paddingVertical: visualSystemTokens.spacing.xxs,
  },
  intentChipActive: {
    borderColor: visualSystemTokens.colors.accentPrimary,
    backgroundColor: visualSystemTokens.colors.accentPrimary,
  },
  actionsRow: {
    gap: visualSystemTokens.spacing.xs,
  },
  submit: {
    gap: visualSystemTokens.spacing.xxs,
  },
});
