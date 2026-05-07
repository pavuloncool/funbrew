import {
  enqueuePendingTasting,
  flowErrorUiCopy,
  logTasting,
  logFlowError,
  normalizeFlowError,
  normalizeTastingSyncError,
  type RepurchaseIntent,
  upsertRoasterTelemetryCore,
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
import { useOfflineTastingSync } from '../../../src/hooks/useOfflineTastingSync';
import { offlineQueueStorage } from '../../../src/services/offlineQueueStorage';
import { supabase } from '../../../src/services/supabaseClient';
import { AppButton, AppInput, AppScrollScreen, AppText } from '../../../src/components/ui/primitives';
import { pageStyles } from '../../../src/theme/pageStyles';

export default function TastingLogScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; batchId?: string }>();
  const batchId =
    typeof params.batchId === 'string' && params.batchId.length > 0 ? params.batchId : params.id;
  const { isOnline, pendingCount, failedCount, refreshPendingCount } = useOfflineTastingSync();
  const [rating, setRating] = useState<number | null>(null);
  const [brewMethodId, setBrewMethodId] = useState<string | null>(null);
  const [tastingNoteIds, setTastingNoteIds] = useState<string[]>([]);
  const [freeTextNotes, setFreeTextNotes] = useState('');
  const [review, setReview] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [sensoryAcidity, setSensoryAcidity] = useState(3);
  const [sensorySweetness, setSensorySweetness] = useState(3);
  const [sensoryBody, setSensoryBody] = useState(3);
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
        setStatus('Queued offline. It will sync after reconnect.');
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
          // Tasting is already persisted at this point; don't requeue to avoid duplicates.
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
        setStatus('Tasting saved. Stats + telemetry refresh are temporarily unavailable.');
      } else if (statsRefreshFailed) {
        setStatus('Tasting saved. Stats refresh is temporarily unavailable.');
      } else if (telemetrySaveFailed) {
        setStatus('Tasting saved. Roaster telemetry profile was not saved this time.');
      } else {
        setStatus('Synced immediately.');
      }
      setFreeTextNotes('');
      setReview('');
      setTastingNoteIds([]);
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
      <AppText variant="h2" weight="700">Tasting Log</AppText>
      <AppText>Batch id: {batchId ?? '(missing)'}</AppText>
      <AppText tone={isOnline ? 'success' : 'danger'}>
        {isOnline ? 'Online' : 'Offline'} | Pending queue: {pendingCount}
        {failedCount > 0 ? ` | Failed sync: ${failedCount}` : ''}
      </AppText>

      <RatingInput value={rating} onChange={setRating} />
      <BrewMethodPicker value={brewMethodId} onChange={setBrewMethodId} />
      <FlavorNoteSelector selectedIds={tastingNoteIds} onChange={setTastingNoteIds} />
      <View style={styles.fieldBlock}>
        <AppText variant="body" weight="600">Roaster telemetry profile (MVP core)</AppText>
        <ScorePicker label="Acidity" value={sensoryAcidity} onChange={setSensoryAcidity} />
        <ScorePicker label="Sweetness" value={sensorySweetness} onChange={setSensorySweetness} />
        <ScorePicker label="Body" value={sensoryBody} onChange={setSensoryBody} />
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
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
  },
  fieldBlock: { gap: visualSystemTokens.spacing.xs },
  multilineInput: {
    minHeight: 112,
    textAlignVertical: 'top',
    paddingTop: visualSystemTokens.spacing.sm,
  },
  submit: { gap: visualSystemTokens.spacing.xs, paddingBottom: visualSystemTokens.spacing.md },
  scoreRow: {
    gap: visualSystemTokens.spacing.xs,
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
    backgroundColor: visualSystemTokens.colors.accentPrimary,
    borderColor: visualSystemTokens.colors.accentPrimary,
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
});

const SCORE_OPTIONS = [1, 2, 3, 4, 5] as const;
const INTENT_OPTIONS: Array<{ value: RepurchaseIntent; label: string }> = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Not sure' },
];

function ScorePicker(props: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.scoreRow}>
      <AppText tone="secondary">{props.label}: {props.value}</AppText>
      <View style={styles.scoreButtons}>
        {SCORE_OPTIONS.map((option) => {
          const active = props.value === option;
          return (
            <Pressable
              key={option}
              onPress={() => props.onChange(option)}
              accessibilityRole="button"
              accessibilityLabel={`${props.label} ${option}`}
              accessibilityState={{ selected: active }}
              style={[styles.scoreButton, active ? styles.scoreButtonActive : null]}
            >
              <AppText tone={active ? 'onPrimary' : 'secondary'} weight="700">{option}</AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
