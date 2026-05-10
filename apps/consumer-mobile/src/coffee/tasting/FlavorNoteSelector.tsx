import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppPanel, AppText } from '../../components/ui/primitives';
import { FlavorNotesMultiSelect } from '../../features/profile/preferences/FlavorNotesMultiSelect';
import { loadTastingNoteOptions, type TastingNoteOption } from '../../features/profile/preferences/tastingNotes';
import { supabase } from '../../services/supabaseClient';

export function FlavorNoteSelector(props: {
  selectedIds: string[];
  onChange: (nextIds: string[]) => void;
  options?: Array<TastingNoteOption & { requiredLevel?: string }>;
  disabledIds?: string[];
  disabledHint?: string | null;
  getDisabledReason?: (option: TastingNoteOption & { requiredLevel?: string }) => string | null;
}) {
  const [visibleNotes, setVisibleNotes] = useState<Array<TastingNoteOption & { requiredLevel?: string }>>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (props.options) {
      setVisibleNotes(props.options);
      setLoadError(null);
      return;
    }
    let mounted = true;
    void (async () => {
      try {
        const all = await loadTastingNoteOptions(supabase);
        if (!mounted) return;
        setVisibleNotes(all);
        setLoadError(null);
      } catch (error) {
        if (!mounted) return;
        setVisibleNotes([]);
        setLoadError(error instanceof Error ? error.message : 'Failed to load tasting notes.');
      }
    })();
    return () => {
      mounted = false;
    };
  }, [props.options]);

  return (
    <AppPanel style={styles.section}>
      {visibleNotes.length > 0 ? (
        <FlavorNotesMultiSelect
          options={visibleNotes}
          selectedIds={props.selectedIds}
          onChange={props.onChange}
          maxSelected={5}
          label="Tasting notes *"
          disabledIds={props.disabledIds}
          disabledHint={props.disabledHint}
          getDisabledReason={props.getDisabledReason}
        />
      ) : (
        <View style={styles.message}>
          <AppText variant="body" weight="600">
            Tasting notes *
          </AppText>
          <AppText tone={loadError ? 'danger' : 'secondary'}>
            {loadError ?? 'Ładowanie tasting notes...'}
          </AppText>
        </View>
      )}
    </AppPanel>
  );
}

const styles = StyleSheet.create({
  section: { paddingVertical: 12 },
  message: { gap: 8 },
});
