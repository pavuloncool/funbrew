import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppChip, AppPanel, AppText } from '../../components/ui/primitives';
import { loadTastingNoteOptions, type TastingNoteOption } from '../../features/profile/preferences/tastingNotes';
import { supabase } from '../../services/supabaseClient';

export function FlavorNoteSelector() {
  const [visibleNotes, setVisibleNotes] = useState<TastingNoteOption[]>([]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const all = await loadTastingNoteOptions(supabase).catch(() => []);
      if (!mounted) return;
      setVisibleNotes(all);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppPanel style={styles.section}>
      <AppText variant="body" weight="600">Flavor notes</AppText>
      <AppText tone="secondary">Visible notes: {visibleNotes.length}</AppText>
      <View style={styles.list}>
        {visibleNotes.map((note) => (
          <AppChip key={note.name} label={note.label} />
        ))}
      </View>
    </AppPanel>
  );
}

const styles = StyleSheet.create({
  section: { paddingVertical: 12 },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
});
