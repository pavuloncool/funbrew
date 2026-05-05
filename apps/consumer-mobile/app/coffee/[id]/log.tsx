import { enqueuePendingTasting, logTasting, updateCoffeeStats, visualSystemTokens } from '@funcup/shared';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

import { BrewMethodPicker } from '../../../src/coffee/tasting/BrewMethodPicker';
import { FlavorNoteSelector } from '../../../src/coffee/tasting/FlavorNoteSelector';
import { RatingInput } from '../../../src/coffee/tasting/RatingInput';
import { useOfflineTastingSync } from '../../../src/hooks/useOfflineTastingSync';
import { offlineQueueStorage } from '../../../src/services/offlineQueueStorage';
import { supabase } from '../../../src/services/supabaseClient';
import { AppButton, AppInput, AppScreen, AppText } from '../../../src/components/ui/primitives';
import { pageStyles } from '../../../src/theme/pageStyles';

export default function TastingLogScreen() {
  const params = useLocalSearchParams<{ id?: string; batchId?: string }>();
  const batchId =
    typeof params.batchId === 'string' && params.batchId.length > 0 ? params.batchId : params.id;
  const { isOnline, pendingCount, refreshPendingCount } = useOfflineTastingSync();
  const [rating, setRating] = useState<number | null>(null);
  const [brewMethodId, setBrewMethodId] = useState<string | null>(null);
  const [tastingNoteIds, setTastingNoteIds] = useState<string[]>([]);
  const [freeTextNotes, setFreeTextNotes] = useState('');
  const [review, setReview] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

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

      await logTasting(supabase, payload);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        await updateCoffeeStats(supabase, {
          batchId: payload.batchId,
          userId: user.id,
        });
      }
      setStatus('Synced immediately.');
      setFreeTextNotes('');
      setReview('');
      setTastingNoteIds([]);
    } catch {
      await enqueuePendingTasting(offlineQueueStorage, payload);
      await refreshPendingCount();
      setStatus('Network issue. Queued offline for retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppScreen>
      <View style={[pageStyles.content, styles.page]}>
      <AppText variant="h2" weight="700">Tasting Log</AppText>
      <AppText>Batch id: {batchId ?? '(missing)'}</AppText>
      <AppText tone={isOnline ? 'success' : 'danger'}>
        {isOnline ? 'Online' : 'Offline'} | Pending queue: {pendingCount}
      </AppText>

      <RatingInput value={rating} onChange={setRating} />
      <BrewMethodPicker value={brewMethodId} onChange={setBrewMethodId} />
      <FlavorNoteSelector selectedIds={tastingNoteIds} onChange={setTastingNoteIds} />

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
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  fieldBlock: { gap: visualSystemTokens.spacing.xs },
  multilineInput: {
    minHeight: 112,
    textAlignVertical: 'top',
    paddingTop: visualSystemTokens.spacing.sm,
  },
  submit: { gap: visualSystemTokens.spacing.xs, paddingBottom: visualSystemTokens.spacing.md },
});
