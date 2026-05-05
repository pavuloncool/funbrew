import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppPanel, AppText } from '../../components/ui/primitives';
import { BrewMethodPickerField } from '../../features/profile/preferences/BrewMethodPickerField';
import {
  loadBrewMethodOptions,
  type BrewMethodOption,
} from '../../features/profile/preferences/brewMethods';
import { supabase } from '../../services/supabaseClient';

export function BrewMethodPicker(props: {
  value: string | null;
  onChange: (value: string) => void;
}) {
  const [options, setOptions] = useState<BrewMethodOption[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const nextOptions = await loadBrewMethodOptions(supabase);
        if (!mounted) return;
        setOptions(nextOptions);
        setLoadError(null);
      } catch (error) {
        if (!mounted) return;
        setOptions([]);
        setLoadError(error instanceof Error ? error.message : 'Failed to load brew methods.');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppPanel style={styles.section}>
      {options.length > 0 ? (
        <BrewMethodPickerField
          options={options}
          value={props.value}
          onChange={props.onChange}
          label="Metoda parzenia *"
        />
      ) : (
        <>
          <AppText variant="body" weight="600">
            Metoda parzenia *
          </AppText>
          <AppText tone={loadError ? 'danger' : 'secondary'}>
            {loadError ?? 'Ładowanie metod parzenia...'}
          </AppText>
        </>
      )}
    </AppPanel>
  );
}

const styles = StyleSheet.create({
  section: { paddingVertical: 12 },
});
