import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';

import { selectFieldStyles } from './SelectField.styles';

export type SelectOption = { value: string; label: string };

type Props = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  testID?: string;
};

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Wybierz…',
  testID,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={selectFieldStyles.wrap} testID={testID}>
      <Text style={selectFieldStyles.label}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={selectFieldStyles.trigger}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Opens list of options"
      >
        <Text style={selected ? selectFieldStyles.triggerText : selectFieldStyles.triggerPlaceholder}>
          {selected?.label ?? placeholder}
        </Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={selectFieldStyles.modalRoot}>
          <Pressable style={selectFieldStyles.backdropFill} onPress={() => setOpen(false)} />
          <View style={selectFieldStyles.sheetWrap} pointerEvents="box-none">
            <View style={selectFieldStyles.sheet}>
              <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <Pressable
                    style={selectFieldStyles.optionRow}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                  >
                    <Text style={selectFieldStyles.optionText}>{item.label}</Text>
                  </Pressable>
                )}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
