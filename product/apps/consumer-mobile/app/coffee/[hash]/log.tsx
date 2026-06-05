import {
  enqueuePendingTasting,
  flowErrorUiCopy,
  logTasting,
  logFlowError,
  normalizeFlowError,
  normalizeTastingSyncError,
  SENSORY_CORE_METRICS,
  type RepurchaseIntent,
  upsertRoasterTelemetryCore,
  useUnlockedTastingNotes,
  updateCoffeeStats,
  visualSystemTokens,
} from '@funcup/shared';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrewMethodPicker } from '../../../src/coffee/tasting/BrewMethodPicker';
import { FlavorNoteSelector } from '../../../src/coffee/tasting/FlavorNoteSelector';
import { RatingInput } from '../../../src/coffee/tasting/RatingInput';
import { SensoryCoreScorePicker } from '../../../src/coffee/tasting/SensoryCoreScorePicker';
import { InlineBackHeader } from '../../../src/components/navigation/InlineBackHeader';
import { useOfflineTastingSync } from '../../../src/hooks/useOfflineTastingSync';
import { useViewerUserId } from '../../../src/hooks/useViewerUserId';
import { useGoBackOrFallback } from '../../../src/navigation/useGoBackOrFallback';
import { offlineQueueStorage } from '../../../src/services/offlineQueueStorage';
import { supabase } from '../../../src/services/supabaseClient';
import { AppButton, AppInput, AppScrollScreen, AppText } from '../../../src/components/ui/primitives';
import { pageStyles } from '../../../src/theme/pageStyles';

export default function TastingLogScreen() {
  const insets = useSafeAreaInsets();
  const { userId } = useViewerUserId();
  const params = useLocalSearchParams<{ hash?: string; batchId?: string }>();
  const hash = typeof params.hash === 'string' && params.hash.length > 0 ? params.hash : null;
  const batchId = typeof params.batchId === 'string' && params.batchId.length > 0 ? params.batchId : null;
  const coffeeFallbackHref = hash
    ? ({ pathname: '/coffee/[hash]', params: { hash } } as const)
    : '/(tabs)/coffee';
  const { isOnline, pendingCount, failedCount, refreshPendingCount } = useOfflineTastingSync();
  const unlocksQuery = useUnlockedTastingNotes({ supabase, userId });
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
      setViewMode('saved');
    } catch (error) {
      const syncError = normalizeTastingSyncError(error);
      logFlowError(syncError, 'mobile.tasting-log.submit');
      const copy = flowErrorUiCopy(syncError);
      if (syncError.retryable) {
        await enqueuePendingTasting(offlineQueueStorage, payload);
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
      <AppText>Batch id: {batchId ?? '(missing)'}</AppText>
      <AppText tone={isOnline ? 'success' : 'danger'}>
        {isOnline ? 'Online' : 'Offline'} | Pending queue: {pendingCount}
        {failedCount > 0 ? ` | Failed sync: ${failedCount}` : ''}
      </AppText>

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
              placeholder="Acidity, sweetness, balance, aftertaste..."
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
