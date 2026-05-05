import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppPanel, AppText } from '../../components/ui/primitives';
import { FlavorNotesMultiSelect } from '../../features/profile/preferences/FlavorNotesMultiSelect';
import { loadTastingNoteOptions, type TastingNoteOption } from '../../features/profile/preferences/tastingNotes';
import { supabase } from '../../services/supabaseClient';

export function FlavorNoteSelector(props: {
  selectedIds: string[];
  onChange: (nextIds: string[]) => void;
}) {
  const [visibleNotes, setVisibleNotes] = useState<TastingNoteOption[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  return (
    <AppPanel style={styles.section}>
      {visibleNotes.length > 0 ? (
        <FlavorNotesMultiSelect
          options={visibleNotes}
          selectedIds={props.selectedIds}
          onChange={props.onChange}
          maxSelected={5}
          label="Tasting notes *"
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
