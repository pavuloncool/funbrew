import {
  fetchRoasterTelemetryCore,
  labelRepurchaseIntent,
  type RepurchaseIntent,
  upsertRoasterTelemetryCore,
  updateCoffeeStats,
  visualSystemTokens,
} from '@funcup/shared';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { useViewerUserId } from '../../src/hooks/useViewerUserId';
import { supabase } from '../../src/services/supabaseClient';
import { AppButton, AppCard, AppInput, AppScrollScreen, AppText } from '../../src/components/ui/primitives';
import { pageStyles } from '../../src/theme/pageStyles';

type LogDetails = {
  id: string;
  batchId: string;
  brewMethodId: string | null;
  coffeeName: string;
  roasterName: string | null;
  loggedAt: string;
  rating: number;
  freeTextNotes: string | null;
  reviewBody: string | null;
};

function parseLogDetails(raw: unknown): LogDetails | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as {
    id: string;
    batch_id: string;
    brew_method_id: string | null;
    rating: number;
    free_text_notes: string | null;
    logged_at: string;
    roast_batches?: {
      coffees?: {
        name?: string;
        roasters?: { name?: string | null } | null;
      } | null;
    } | null;
    reviews?: Array<{ body: string }> | null;
  };

  return {
    id: row.id,
    batchId: row.batch_id,
    brewMethodId: row.brew_method_id,
    coffeeName: row.roast_batches?.coffees?.name ?? 'Coffee',
    roasterName: row.roast_batches?.coffees?.roasters?.name ?? null,
    loggedAt: row.logged_at,
    rating: row.rating,
    freeTextNotes: row.free_text_notes,
    reviewBody: row.reviews?.[0]?.body ?? null,
  };
}

const SCORE_OPTIONS = [1, 2, 3, 4, 5] as const;
const INTENT_OPTIONS: Array<{ value: RepurchaseIntent; label: string }> = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Not sure' },
];

type CoffeeLogsTable = {
  update: (value: { rating?: number; free_text_notes?: string | null }) => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => Promise<{ error: Error | null }>;
    };
  };
  delete: () => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => Promise<{ error: Error | null }>;
    };
  };
};

type ReviewsTable = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      maybeSingle: () => Promise<{ data: { id: string } | null; error: Error | null }>;
    };
  };
  update: (value: { body: string }) => {
    eq: (column: string, value: string) => Promise<{ error: Error | null }>;
  };
  insert: (value: { coffee_log_id: string; body: string }) => Promise<{ error: Error | null }>;
  delete: () => {
    eq: (column: string, value: string) => Promise<{ error: Error | null }>;
  };
};

export default function CoffeeLogDetailsScreen() {
  const params = useLocalSearchParams<{ logId?: string }>();
  const logId = typeof params.logId === 'string' ? params.logId : '';
  const router = useRouter();
  const { userId, isLoading: userLoading } = useViewerUserId();

  const query = useQuery({
    queryKey: ['coffeeLogDetails', logId, userId ?? null],
    enabled: Boolean(logId && userId) && !userLoading,
    queryFn: async () => {
      if (!logId || !userId) throw new Error('Missing context');

      const [{ data, error }, telemetry] = await Promise.all([
        supabase
          .from('coffee_logs')
          .select(
            `
            id,
            batch_id,
            brew_method_id,
            rating,
            free_text_notes,
            logged_at,
            roast_batches (
              coffees (
                name,
                roasters ( name )
              )
            ),
            reviews ( body )
          `
          )
          .eq('id', logId)
          .eq('user_id', userId)
          .maybeSingle(),
        fetchRoasterTelemetryCore(supabase, logId),
      ]);

      if (error) throw error;
      const details = parseLogDetails(data);
      if (!details) return null;

      return { details, telemetry };
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [rating, setRating] = useState(3);
  const [freeTextNotes, setFreeTextNotes] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [sensoryAcidity, setSensoryAcidity] = useState(3);
  const [sensorySweetness, setSensorySweetness] = useState(3);
  const [sensoryBody, setSensoryBody] = useState(3);
  const [repurchaseIntent, setRepurchaseIntent] = useState<RepurchaseIntent>('unsure');

  useEffect(() => {
    const payload = query.data;
    if (!payload) return;

    setRating(payload.details.rating);
    setFreeTextNotes(payload.details.freeTextNotes ?? '');
    setReviewBody(payload.details.reviewBody ?? '');
    setSensoryAcidity(payload.telemetry?.sensoryAcidity ?? 3);
    setSensorySweetness(payload.telemetry?.sensorySweetness ?? 3);
    setSensoryBody(payload.telemetry?.sensoryBody ?? 3);
    setRepurchaseIntent(payload.telemetry?.repurchaseIntent ?? 'unsure');
  }, [query.data]);

  const details = query.data?.details ?? null;

  const save = async () => {
    if (!details || !userId) return;
    if (!details.brewMethodId) {
      setSaveError('This legacy entry has no brew method. Save from Tasting Log to migrate it.');
      return;
    }

    setSaveError(null);
    setIsSaving(true);

    try {
      const coffeeLogsTable = supabase.from('coffee_logs') as unknown as CoffeeLogsTable;
      const reviewsTable = supabase.from('reviews') as unknown as ReviewsTable;

      const { error: logError } = await coffeeLogsTable
        .update({
          rating,
          free_text_notes: freeTextNotes.trim() || null,
        })
        .eq('id', details.id)
        .eq('user_id', userId);
      if (logError) throw logError;

      const trimmedReview = reviewBody.trim();
      if (trimmedReview.length > 0) {
        const { data: existingReview, error: existingReviewError } = await reviewsTable
          .select('id')
          .eq('coffee_log_id', details.id)
          .maybeSingle();
        if (existingReviewError) throw existingReviewError;

        if (existingReview?.id) {
          const { error: updateReviewError } = await reviewsTable
            .update({ body: trimmedReview })
            .eq('id', existingReview.id);
          if (updateReviewError) throw updateReviewError;
        } else {
          const { error: insertReviewError } = await reviewsTable
            .insert({ coffee_log_id: details.id, body: trimmedReview });
          if (insertReviewError) throw insertReviewError;
        }
      } else {
        const { error: deleteReviewError } = await reviewsTable
          .delete()
          .eq('coffee_log_id', details.id);
        if (deleteReviewError) throw deleteReviewError;
      }

      await upsertRoasterTelemetryCore({
        supabase,
        coffeeLogId: details.id,
        userId,
        input: {
          brewMethodId: details.brewMethodId,
          overallRating: rating,
          sensoryAcidity,
          sensorySweetness,
          sensoryBody,
          repurchaseIntent,
          experienceLevel: query.data?.telemetry?.experienceLevel ?? 'beginner',
        },
      });

      await updateCoffeeStats(supabase, {
        batchId: details.batchId,
        userId,
      });

      setIsEditing(false);
      await query.refetch();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save tasting update.');
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
              const coffeeLogsTable = supabase.from('coffee_logs') as unknown as CoffeeLogsTable;
              const { error } = await coffeeLogsTable
                .delete()
                .eq('id', details.id)
                .eq('user_id', userId);
              if (error) throw error;

              await updateCoffeeStats(supabase, {
                batchId: details.batchId,
                userId,
              });

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
      <AppScrollScreen contentContainerStyle={pageStyles.contentCompact}>
        <AppText>Missing log id.</AppText>
      </AppScrollScreen>
    );
  }

  if (query.isLoading || userLoading) {
    return (
      <AppScrollScreen contentContainerStyle={pageStyles.contentCompact}>
        <AppText>Loading tasting entry...</AppText>
      </AppScrollScreen>
    );
  }

  if (query.isError) {
    return (
      <AppScrollScreen contentContainerStyle={pageStyles.contentCompact}>
        <AppText tone="danger">Could not load tasting details.</AppText>
      </AppScrollScreen>
    );
  }

  if (!details) {
    return (
      <AppScrollScreen contentContainerStyle={pageStyles.contentCompact}>
        <AppText>Tasting entry not found.</AppText>
      </AppScrollScreen>
    );
  }

  const title = details.coffeeName;
  const subtitle = details.roasterName
    ? `${details.roasterName} · ${new Date(details.loggedAt).toLocaleString()}`
    : new Date(details.loggedAt).toLocaleString();

  return (
    <AppScrollScreen contentContainerStyle={pageStyles.contentCompact}>
      <View style={styles.navRow}>
        <Link href="/(tabs)/coffee">Back to Coffee</Link>
      </View>

      <AppText variant="h2" weight="700">Rated Coffee Entry</AppText>
      <AppCard>
        <AppText variant="h3" weight="700">{title}</AppText>
        <AppText tone="secondary">{subtitle}</AppText>
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

        <AppText variant="body" weight="600">Notes</AppText>
        <AppInput
          value={freeTextNotes}
          onChangeText={setFreeTextNotes}
          editable={isEditing}
          multiline
          style={styles.multilineInput}
        />

        <AppText variant="body" weight="600">Review</AppText>
        <AppInput
          value={reviewBody}
          onChangeText={setReviewBody}
          editable={isEditing}
          multiline
          style={styles.multilineInput}
        />
      </AppCard>

      <AppCard style={styles.cardGap}>
        <AppText variant="body" weight="600">Roaster telemetry profile (MVP core)</AppText>
        <ScorePicker label="Acidity" value={sensoryAcidity} onChange={setSensoryAcidity} editable={isEditing} />
        <ScorePicker label="Sweetness" value={sensorySweetness} onChange={setSensorySweetness} editable={isEditing} />
        <ScorePicker label="Body" value={sensoryBody} onChange={setSensoryBody} editable={isEditing} />
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

      <View style={styles.actionsRow}>
        <AppButton
          label={isEditing ? (isSaving ? 'Saving...' : 'Save changes') : 'Edit entry'}
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
              if (query.data) {
                setRating(query.data.details.rating);
                setFreeTextNotes(query.data.details.freeTextNotes ?? '');
                setReviewBody(query.data.details.reviewBody ?? '');
                setSensoryAcidity(query.data.telemetry?.sensoryAcidity ?? 3);
                setSensorySweetness(query.data.telemetry?.sensorySweetness ?? 3);
                setSensoryBody(query.data.telemetry?.sensoryBody ?? 3);
                setRepurchaseIntent(query.data.telemetry?.repurchaseIntent ?? 'unsure');
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

function ScorePicker(props: {
  label: string;
  value: number;
  editable: boolean;
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
              onPress={() => props.editable && props.onChange(option)}
              disabled={!props.editable}
              style={[styles.scoreButton, active ? styles.scoreButtonActive : null]}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled: !props.editable }}
            >
              <AppText tone={active ? 'onPrimary' : 'secondary'} weight="700">{option}</AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navRow: {
    paddingBottom: visualSystemTokens.spacing.xxs,
  },
  cardGap: {
    gap: visualSystemTokens.spacing.xs,
  },
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
    borderColor: visualSystemTokens.colors.accentPrimary,
    backgroundColor: visualSystemTokens.colors.accentPrimary,
  },
  multilineInput: {
    minHeight: 112,
    textAlignVertical: 'top',
    paddingTop: visualSystemTokens.spacing.sm,
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
});
