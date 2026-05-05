import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '../../../components/ui/primitives';
import type { TastingNoteOption } from './tastingNotes';

export function FlavorNotesMultiSelect(props: {
  options: TastingNoteOption[];
  selectedIds: string[];
  onChange: (nextIds: string[]) => void;
  maxSelected?: number;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const maxSelected = props.maxSelected ?? 3;

  const selectedLabel = useMemo(() => {
    if (props.selectedIds.length === 0) {
      return 'Ulubione tasting notes';
    }

    const labels = props.options
      .filter((option) => props.selectedIds.includes(option.id))
      .map((option) => option.label);

    return labels.join(', ');
  }, [props.options, props.selectedIds]);

  const toggle = (id: string) => {
    const selectedSet = new Set(props.selectedIds);

    if (selectedSet.has(id)) {
      selectedSet.delete(id);
      props.onChange(Array.from(selectedSet));
      return;
    }

    if (selectedSet.size >= maxSelected) {
      return;
    }

    selectedSet.add(id);
    props.onChange(Array.from(selectedSet));
  };

  return (
    <View style={styles.root}>
      <AppText variant="bodySm" weight="600" style={styles.label}>
        {props.label ?? 'Ulubione tasting notes *'}
      </AppText>

      <Pressable
        onPress={() => setOpen(true)}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel={props.label ?? 'Ulubione tasting notes'}
        accessibilityHint="Otwiera listę tasting notes"
        testID="fav-tasting-notes"
      >
        {props.selectedIds.length > 0 ? <AppText>{selectedLabel}</AppText> : <AppText tone="secondary">{selectedLabel}</AppText>}
      </Pressable>

      <AppText variant="caption" tone="secondary" style={styles.hint}>
        Wybierz od 1 do {maxSelected} pozycji.
      </AppText>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdropFill} onPress={() => setOpen(false)} />
          <View style={styles.sheetWrap} pointerEvents="box-none">
            <View style={styles.sheet}>
              <AppText variant="body" weight="600" style={styles.sheetTitle}>
                Ulubione tasting notes
              </AppText>

              <FlatList
                data={props.options}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const selected = props.selectedIds.includes(item.id);
                  const blocked = !selected && props.selectedIds.length >= maxSelected;

                  return (
                    <Pressable
                      onPress={() => toggle(item.id)}
                      style={[styles.optionRow, blocked && styles.optionRowBlocked]}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled: blocked }}
                      accessibilityLabel={`Tasting note ${item.label}`}
                      disabled={blocked}
                    >
                      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                        {selected ? <AppText tone="onPrimary" weight="700">✓</AppText> : null}
                      </View>
                      <AppText style={styles.optionLabel}>{item.label}</AppText>
                    </Pressable>
                  );
                }}
              />

              <Pressable
                onPress={() => setOpen(false)}
                style={styles.doneButton}
                accessibilityRole="button"
                accessibilityLabel="Zamknij listę tasting notes"
              >
                <AppText weight="600">Gotowe</AppText>
              </Pressable>
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
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
  },
  trigger: {
    minHeight: 44,
    borderWidth: 2,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    backgroundColor: '#f3f3f3',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  hint: {
    marginTop: 8,
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
    maxHeight: 460,
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
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#cccccc',
  },
  optionRowBlocked: {
    opacity: 0.45,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxSelected: {
    backgroundColor: '#2d6d71',
    borderColor: '#2d6d71',
  },
  optionLabel: {
    flex: 1,
  },
  doneButton: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#cccccc',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#f3f3f3',
  },
});
