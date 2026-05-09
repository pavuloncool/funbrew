import {
  fetchRoasterTelemetryCore,
  labelRepurchaseIntent,
  normalizeFlowError,
  type RepurchaseIntent,
  upsertRoasterTelemetryCore,
  updateCoffeeStats,
  visualSystemTokens,
} from '@funcup/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrewMethodPicker } from '../../src/coffee/tasting/BrewMethodPicker';
import { FlavorNoteSelector } from '../../src/coffee/tasting/FlavorNoteSelector';
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
  tastingNoteIds: string[];
  freeTextNotes: string | null;
  reviewBody: string | null;
};

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
    coffee_log_tasting_notes?: Array<{ tasting_note_id: string }> | null;
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
    tastingNoteIds: (row.coffee_log_tasting_notes ?? []).map((item) => item.tasting_note_id),
    freeTextNotes: row.free_text_notes,
    reviewBody: row.reviews?.[0]?.body ?? null,
  };
}

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

const SCORE_OPTIONS = [1, 2, 3, 4, 5] as const;
const INTENT_OPTIONS: Array<{ value: RepurchaseIntent; label: string }> = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Not sure' },
];

type CoffeeLogsTable = {
  update: (value: { rating?: number; brew_method_id?: string | null; free_text_notes?: string | null }) => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => {
        select: (columns: string) => {
          maybeSingle: () => Promise<{ data: { id: string; rating: number } | null; error: Error | null }>;
        };
      };
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

type CoffeeLogTastingNotesTable = {
  delete: () => {
    eq: (column: string, value: string) => Promise<{ error: Error | null }>;
  };
  insert: (
    value: Array<{ coffee_log_id: string; tasting_note_id: string }>
  ) => Promise<{ error: Error | null }>;
};

export default function CoffeeLogDetailsScreen() {
  const params = useLocalSearchParams<{ logId?: string }>();
  const logId = typeof params.logId === 'string' ? params.logId : '';
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId, isLoading: userLoading } = useViewerUserId();
  const insets = useSafeAreaInsets();
  const contentBottomPadding = insets.bottom + 124;

  const detailsQuery = useQuery({
    queryKey: ['coffeeLogDetails', logId, userId ?? null],
    enabled: Boolean(logId && userId) && !userLoading,
    queryFn: async () => {
      if (!logId || !userId) throw new Error('Missing context');

      const { data, error } = await supabase
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
          coffee_log_tasting_notes ( tasting_note_id ),
          reviews ( body )
        `
        )
        .eq('id', logId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      const details = parseLogDetails(data);
      return details;
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
  const [repurchaseIntent, setRepurchaseIntent] = useState<RepurchaseIntent>('unsure');

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
    setRepurchaseIntent(telemetry.repurchaseIntent);
  }, [telemetryQuery.data, isEditing]);

  const details = detailsQuery.data ?? null;

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
      const coffeeLogsTable = supabase.from('coffee_logs') as unknown as CoffeeLogsTable;
      const reviewsTable = supabase.from('reviews') as unknown as ReviewsTable;
      const tastingNotesTable = supabase.from('coffee_log_tasting_notes') as unknown as CoffeeLogTastingNotesTable;

      const { data: updatedLogRow, error: logError } = await coffeeLogsTable
        .update({
          rating,
          brew_method_id: brewMethodId,
          free_text_notes: freeTextNotes.trim() || null,
        })
        .eq('id', details.id)
        .eq('user_id', userId)
        .select('id,rating')
        .maybeSingle();
      if (logError) throw logError;
      if (!updatedLogRow) {
        throw new Error('Tasting update was not applied. Re-open the entry and try again.');
      }
      if (updatedLogRow.rating !== rating) {
        throw new Error('Tasting rating was not persisted. Try again in a moment.');
      }

      const { error: deleteTastingNotesError } = await tastingNotesTable
        .delete()
        .eq('coffee_log_id', details.id);
      if (deleteTastingNotesError) throw deleteTastingNotesError;

      const uniqueTastingNoteIds = Array.from(new Set(tastingNoteIds));
      const nextTastingNoteRows = uniqueTastingNoteIds.map((tastingNoteId) => ({
        coffee_log_id: details.id,
        tasting_note_id: tastingNoteId,
      }));
      const { error: insertTastingNotesError } = await tastingNotesTable.insert(nextTastingNoteRows);
      if (insertTastingNotesError) throw insertTastingNotesError;

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

      let telemetrySaveFailed = false;
      let statsRefreshFailed = false;
      let telemetrySaveErrorMessage: string | null = null;
      let savedTelemetry: Awaited<ReturnType<typeof upsertRoasterTelemetryCore>> | null = null;

      try {
        savedTelemetry = await upsertRoasterTelemetryCore({
          supabase,
          coffeeLogId: details.id,
          userId,
          input: {
            brewMethodId: brewMethodId as string,
            overallRating: rating,
            sensoryAcidity,
            sensorySweetness,
            sensoryBody,
            repurchaseIntent,
            experienceLevel: telemetryQuery.data?.experienceLevel ?? 'beginner',
          },
        });
      } catch (telemetryError) {
        telemetrySaveFailed = true;
        const normalizedTelemetryError = normalizeFlowError({
          error: telemetryError,
          domain: 'tasting_log',
          fallbackMessage: 'Telemetry profile save failed.',
        });
        telemetrySaveErrorMessage = extractErrorMessage(normalizedTelemetryError);
      }

      try {
        await updateCoffeeStats(supabase, {
          batchId: details.batchId,
          userId,
        });
      } catch {
        statsRefreshFailed = true;
      }

      if (telemetrySaveFailed && statsRefreshFailed) {
        setSaveStatus('Tasting updated. Stats + telemetry refresh are temporarily unavailable.');
      } else if (telemetrySaveFailed) {
        setSaveStatus(
          telemetrySaveErrorMessage
            ? `Tasting updated. Telemetry refresh failed: ${telemetrySaveErrorMessage}`
            : 'Tasting updated. Telemetry refresh is temporarily unavailable.'
        );
      } else if (statsRefreshFailed) {
        setSaveStatus('Tasting updated. Stats refresh is temporarily unavailable.');
      } else {
        setSaveStatus('Tasting updated.');
      }

      const nextFreeTextNotes = freeTextNotes.trim() || null;
      const nextReviewBody = reviewBody.trim() || null;
      queryClient.setQueryData<LogDetails | null>(
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
      if (savedTelemetry) {
        queryClient.setQueryData(
          ['coffeeLogTelemetry', logId, userId],
          savedTelemetry
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
        <AppText>Missing log id.</AppText>
      </AppScrollScreen>
    );
  }

  if (detailsQuery.isLoading || userLoading) {
    return (
      <AppScrollScreen
        contentContainerStyle={[pageStyles.contentCompact, { paddingBottom: contentBottomPadding }]}
      >
        <AppText>Loading tasting entry...</AppText>
      </AppScrollScreen>
    );
  }

  if (detailsQuery.isError) {
    return (
      <AppScrollScreen
        contentContainerStyle={[pageStyles.contentCompact, { paddingBottom: contentBottomPadding }]}
      >
        <AppText tone="danger">Could not load tasting details.</AppText>
      </AppScrollScreen>
    );
  }

  if (!details) {
    return (
      <AppScrollScreen
        contentContainerStyle={[pageStyles.contentCompact, { paddingBottom: contentBottomPadding }]}
      >
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
        />

        <AppText variant="body" weight="600">Free-text tasting notes</AppText>
        <AppInput
          value={freeTextNotes}
          onChangeText={setFreeTextNotes}
          editable={isEditing}
          placeholder="Acidity, sweetness, balance, aftertaste..."
          multiline
          style={styles.multilineInput}
        />

        <AppText variant="body" weight="600">Optional review</AppText>
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
