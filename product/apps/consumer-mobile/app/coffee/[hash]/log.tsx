import {
  type ScanQrResult,
  type RepurchaseIntent,
  enqueuePendingTasting,
  flowErrorUiCopy,
  logTasting,
  logFlowError,
  normalizeFlowError,
  normalizeTastingSyncError,
  SENSORY_CORE_METRICS,
  upsertRoasterTelemetryCore,
  useCoffeePage,
  useUnlockedTastingNotes,
  updateCoffeeStats,
  visualSystemTokens,
} from '@funcup/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrewMethodPicker } from '../../../src/coffee/tasting/BrewMethodPicker';
import { FlavorNoteSelector } from '../../../src/coffee/tasting/FlavorNoteSelector';
import { RatingInput } from '../../../src/coffee/tasting/RatingInput';
import { SensoryCoreScorePicker } from '../../../src/coffee/tasting/SensoryCoreScorePicker';
import { InlineBackHeader } from '../../../src/components/navigation/InlineBackHeader';
import { useOfflineTastingSync } from '../../../src/hooks/useOfflineTastingSync';
import { useViewerUserId } from '../../../src/hooks/useViewerUserId';
import { useTastingLogExitGuardRegistration } from '../../../src/navigation/TastingLogExitGuard';
import { useGoBackOrFallback } from '../../../src/navigation/useGoBackOrFallback';
import { offlineQueueStorage } from '../../../src/services/offlineQueueStorage';
import {
  addPendingTastingDiscoverCoffeeId,
  refreshPendingTastingDiscoverCoffeeIds,
} from '../../../src/services/pendingTastingDiscoverExclusions';
import { getResolvedSupabasePublicUrl, supabase } from '../../../src/services/supabaseClient';
import { AppButton, AppCard, AppInput, AppScrollScreen, AppText } from '../../../src/components/ui/primitives';
import { pageStyles } from '../../../src/theme/pageStyles';

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

export default function TastingLogScreen() {
  const insets = useSafeAreaInsets();
  const { userId } = useViewerUserId();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ hash?: string; batchId?: string }>();
  const hash = typeof params.hash === 'string' && params.hash.length > 0 ? params.hash : null;
  const batchId = typeof params.batchId === 'string' && params.batchId.length > 0 ? params.batchId : null;
  const coffeeFallbackHref = hash
    ? ({ pathname: '/coffee/[hash]', params: { hash } } as const)
    : '/(tabs)/coffee';
  const { refreshPendingCount } = useOfflineTastingSync();
  const unlocksQuery = useUnlockedTastingNotes({ supabase, userId });
  const coffeeQuery = useCoffeePage({ supabase, hash });
  const goBackToCoffee = useGoBackOrFallback(coffeeFallbackHref);
  const [rating, setRating] = useState<number | null>(null);
  const [brewMethodId, setBrewMethodId] = useState<string | null>(null);
  const [tastingNoteIds, setTastingNoteIds] = useState<string[]>([]);
  const [freeTextNotes, setFreeTextNotes] = useState('');
  const [review, setReview] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'form' | 'saved'>('form');
  const [sensoryAcidity, setSensoryAcidity] = useState(3);
  const [sensorySweetness, setSensorySweetness] = useState(3);
  const [sensoryBody, setSensoryBody] = useState(3);
  const [sensoryBitter, setSensoryBitter] = useState(3);
  const [sensoryAftertaste, setSensoryAftertaste] = useState(3);
  const [repurchaseIntent, setRepurchaseIntent] = useState<RepurchaseIntent>('unsure');
  const [coffeeImageFailed, setCoffeeImageFailed] = useState(false);

  const getCachedCoffeeId = () => {
    if (!hash) return null;
    return queryClient.getQueryData<ScanQrResult>(['coffeePage', hash])?.coffee.id ?? null;
  };

  const coffeeName = coffeeQuery.data?.coffee.name ?? 'Coffee';
  const coffeeRoasterName = coffeeQuery.data?.roaster.roaster_short_name ?? coffeeQuery.data?.roaster.name ?? null;
  const coffeeImageUri = resolveImageUri(coffeeQuery.data?.coffee.cover_image_url ?? null);

  useEffect(() => {
    setCoffeeImageFailed(false);
  }, [coffeeImageUri]);

  const hasUnsavedDraft = useMemo(() => (
    rating != null ||
    brewMethodId != null ||
    tastingNoteIds.length > 0 ||
    freeTextNotes.trim().length > 0 ||
    review.trim().length > 0 ||
    sensoryAcidity !== 3 ||
    sensorySweetness !== 3 ||
    sensoryBody !== 3 ||
    sensoryBitter !== 3 ||
    sensoryAftertaste !== 3 ||
    repurchaseIntent !== 'unsure'
  ), [
    brewMethodId,
    freeTextNotes,
    rating,
    repurchaseIntent,
    review,
    sensoryAcidity,
    sensoryAftertaste,
    sensoryBitter,
    sensoryBody,
    sensorySweetness,
    tastingNoteIds.length,
  ]);

  useTastingLogExitGuardRegistration(viewMode === 'form' && hasUnsavedDraft);

  const validate = (): string | null => {
    if (!batchId) return 'Missing batch id';
    if (rating == null || !Number.isFinite(rating) || rating < 1 || rating > 5) {
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

  const onSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitError(null);
    setStatus(null);
    setSavedMessage(null);
    setIsSubmitting(true);
    const netState = await NetInfo.fetch();
    const online = Boolean(netState.isConnected && netState.isInternetReachable !== false);
    const payload = {
      batchId: batchId as string,
      rating: rating as number,
      brewMethodId: brewMethodId as string,
      tastingNoteIds,
      freeTextNotes: freeTextNotes.trim() || undefined,
      review: review.trim() || undefined,
    };

    try {
      if (!online) {
        await enqueuePendingTasting(offlineQueueStorage, payload);
        const cachedCoffeeId = getCachedCoffeeId();
        if (cachedCoffeeId) {
          addPendingTastingDiscoverCoffeeId(cachedCoffeeId);
        }
        await refreshPendingCount();
        setSavedMessage('Queued offline. It will sync after reconnect.');
        setViewMode('saved');
        return;
      }

      const saved = await logTasting(supabase, payload);
      let statsRefreshFailed = false;
      let telemetrySaveFailed = false;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        try {
          await updateCoffeeStats(supabase, {
            batchId: payload.batchId,
            userId: user.id,
          });
        } catch {
          statsRefreshFailed = true;
        }

        try {
          await upsertRoasterTelemetryCore({
            supabase,
            coffeeLogId: saved.coffeeLogId,
            userId: user.id,
            input: {
              brewMethodId: payload.brewMethodId,
              overallRating: payload.rating,
              sensoryAcidity,
              sensorySweetness,
              sensoryBody,
              sensoryBitter,
              sensoryAftertaste,
              repurchaseIntent,
              experienceLevel: 'beginner',
            },
          });
        } catch (telemetryError) {
          telemetrySaveFailed = true;
          const normalized = normalizeFlowError({
            error: telemetryError,
            domain: 'tasting_log',
            fallbackMessage: 'Telemetry profile save failed.',
          });
          logFlowError(normalized, 'mobile.tasting-log.telemetry');
        }
      }
      if (statsRefreshFailed && telemetrySaveFailed) {
        setSavedMessage('Rating saved.');
      } else if (statsRefreshFailed) {
        setSavedMessage('Rating saved.');
      } else if (telemetrySaveFailed) {
        setSavedMessage('Rating saved.');
      } else {
        setSavedMessage('Rating saved.');
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['journal', userId] }),
        queryClient.invalidateQueries({ queryKey: ['discoverCoffees'] }),
      ]);
      await refreshPendingTastingDiscoverCoffeeIds().catch(() => undefined);
      setViewMode('saved');
    } catch (error) {
      const syncError = normalizeTastingSyncError(error);
      logFlowError(syncError, 'mobile.tasting-log.submit');
      const copy = flowErrorUiCopy(syncError);
      if (syncError.retryable) {
        await enqueuePendingTasting(offlineQueueStorage, payload);
        const cachedCoffeeId = getCachedCoffeeId();
        if (cachedCoffeeId) {
          addPendingTastingDiscoverCoffeeId(cachedCoffeeId);
        }
        await refreshPendingCount();
        setStatus(copy.message);
      } else if (syncError.kind === 'validation') {
        setSubmitError(copy.message);
      } else {
        setSubmitError(copy.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppScrollScreen contentContainerStyle={[pageStyles.content, styles.content, { paddingBottom: 96 + insets.bottom }]}>
      <InlineBackHeader title="Tasting Log" fallbackHref={coffeeFallbackHref} />
      <AppCard style={styles.coffeeHeroCard}>
        <View style={styles.coffeeHeroMedia}>
          {!coffeeImageFailed && coffeeImageUri ? (
            <Image
              source={{ uri: coffeeImageUri }}
              style={styles.coffeeHeroImage}
              resizeMode="contain"
              accessibilityLabel={`Etykieta kawy ${coffeeName}`}
              onError={() => setCoffeeImageFailed(true)}
            />
          ) : (
            <View style={styles.coffeeHeroFallback}>
              <AppText tone="muted">Brak podglądu etykiety</AppText>
            </View>
          )}
        </View>
        <View style={styles.coffeeHeroText}>
          <AppText variant="h3" weight="700">{coffeeName}</AppText>
          {coffeeRoasterName ? <AppText tone="secondary">{coffeeRoasterName}</AppText> : null}
        </View>
      </AppCard>

      {viewMode === 'saved' ? (
        <View style={styles.submit}>
          <AppText variant="body" weight="600">{savedMessage ?? 'Rating saved.'}</AppText>
          <AppButton
            label="Edit rating"
            variant="secondary"
            onPress={() => {
              setSubmitError(null);
              setViewMode('form');
            }}
          />
          <AppButton
            label="Back to coffee"
            onPress={goBackToCoffee}
          />
        </View>
      ) : (
        <>
          <RatingInput value={rating} onChange={setRating} />
          <BrewMethodPicker value={brewMethodId} onChange={setBrewMethodId} />
          <FlavorNoteSelector
            selectedIds={tastingNoteIds}
            onChange={setTastingNoteIds}
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
          <View style={styles.fieldBlock}>
            <AppText variant="body" weight="600">Sensory Core</AppText>
            {SENSORY_CORE_METRICS.map((metric) => (
              <SensoryCoreScorePicker
                key={metric.id}
                metric={metric}
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
              <AppText tone="secondary">Would you buy this lot again?</AppText>
              <View style={styles.intentRow}>
                {INTENT_OPTIONS.map((option) => {
                  const active = repurchaseIntent === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setRepurchaseIntent(option.value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={[styles.intentChip, active ? styles.intentChipActive : null]}
                    >
                      <AppText tone={active ? 'onPrimary' : 'secondary'} weight="700">
                        {option.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <AppText variant="body" weight="600">Free-text tasting notes</AppText>
            <AppText tone="secondary">
              Shown to roaster in Analytics as anonymized free-text tasting notes.
            </AppText>
            <AppInput
              value={freeTextNotes}
              onChangeText={setFreeTextNotes}
              placeholder="Acidity, sweetness, balance, finish..."
              multiline
              style={styles.multilineInput}
            />
          </View>

          <View style={styles.fieldBlock}>
            <AppText variant="body" weight="600">Optional review</AppText>
            <AppText tone="secondary">
              Shown to roaster in Analytics under Anonymized reviews.
            </AppText>
            <AppInput
              value={review}
              onChangeText={setReview}
              placeholder="Share a short review for roaster analytics."
              multiline
              style={styles.multilineInput}
            />
          </View>

          <View style={styles.submit}>
            <AppText variant="body" weight="600">Submit tasting</AppText>
            <AppText tone="secondary">
              Required: rating, brew method, at least one tasting note.
            </AppText>
            {submitError ? <AppText tone="danger">{submitError}</AppText> : null}
            <AppButton
              onPress={() => { void onSubmit(); }}
              label={isSubmitting ? 'Saving...' : 'Save tasting'}
              disabled={isSubmitting || !batchId}
            />
            {status ? <AppText tone="secondary">{status}</AppText> : null}
          </View>
        </>
      )}
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
  },
  coffeeHeroCard: {
    gap: visualSystemTokens.spacing.sm,
  },
  coffeeHeroMedia: {
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
  coffeeHeroImage: {
    width: '100%',
    height: 180,
  },
  coffeeHeroFallback: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coffeeHeroText: {
    gap: visualSystemTokens.spacing.xxs,
  },
  fieldBlock: { gap: visualSystemTokens.spacing.xs },
  selectorMeta: { gap: visualSystemTokens.spacing.xxs },
  multilineInput: {
    minHeight: 132,
  },
  submit: { gap: visualSystemTokens.spacing.xs, paddingBottom: visualSystemTokens.spacing.md },
  intentGroup: {
    gap: visualSystemTokens.spacing.xs,
  },
  intentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: visualSystemTokens.spacing.xs,
  },
  intentChip: {
    borderRadius: visualSystemTokens.radius.pill,
    borderWidth: 1,
    borderColor: visualSystemTokens.colors.borderSubtle,
    paddingHorizontal: visualSystemTokens.spacing.md,
    paddingVertical: visualSystemTokens.spacing.xs,
  },
  intentChipActive: {
    backgroundColor: visualSystemTokens.colors.accentPrimary,
    borderColor: visualSystemTokens.colors.accentPrimary,
  },
});

const INTENT_OPTIONS: Array<{ value: RepurchaseIntent; label: string }> = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Unsure' },
];
