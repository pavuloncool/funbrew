import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '../../../components/ui/primitives';
import type { BrewMethodOption } from './brewMethods';

export function BrewMethodPickerField(props: {
  options: BrewMethodOption[];
  value: string | null;
  onChange: (value: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    const selected = props.options.find((option) => option.id === props.value);
    return selected?.name ?? 'Ulubiona metoda parzenia';
  }, [props.options, props.value]);

  return (
    <View style={styles.root}>
      <AppText variant="bodySm" weight="600" style={styles.label}>
        {props.label ?? 'Ulubiona metoda parzenia *'}
      </AppText>

      <Pressable
        onPress={() => setOpen(true)}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel={props.label ?? 'Ulubiona metoda parzenia'}
        accessibilityHint="Otwiera listę metod parzenia"
        testID="fav-brew-method"
      >
        {props.value ? <AppText>{selectedLabel}</AppText> : <AppText tone="secondary">{selectedLabel}</AppText>}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdropFill} onPress={() => setOpen(false)} />
          <View style={styles.sheetWrap} pointerEvents="box-none">
            <View style={styles.sheet}>
              <AppText variant="body" weight="600" style={styles.sheetTitle}>
                Ulubiona metoda parzenia
              </AppText>

              <FlatList
                data={props.options}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const selected = item.id === props.value;
                  return (
                    <Pressable
                      onPress={() => {
                        props.onChange(item.id);
                        setOpen(false);
                      }}
                      style={[styles.optionRow, selected && styles.optionRowSelected]}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={item.name}
                    >
                      <AppText>{item.name}</AppText>
                      <AppText tone={selected ? 'primary' : 'secondary'}>{selected ? 'Wybrane' : ''}</AppText>
                    </Pressable>
                  );
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    marginBottom: 14,
  },
  label: {
    marginBottom: 6,
  },
  trigger: {
    width: '100%',
    minHeight: 44,
    borderWidth: 2,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    backgroundColor: '#f3f3f3',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  sheet: {
    maxHeight: 420,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1f1f1f',
    overflow: 'hidden',
  },
  sheetTitle: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#cccccc',
  },
  optionRowSelected: {
    backgroundColor: '#edf5ff',
  },
});
