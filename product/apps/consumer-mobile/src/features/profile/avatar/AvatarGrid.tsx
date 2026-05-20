import { StyleSheet, View } from 'react-native';

import type { AvatarOption } from './avatarFactory';
import { AvatarTile } from './AvatarTile';

export function AvatarGrid(props: {
  options: AvatarOption[];
  selectedId: string;
  onChange: (id: string) => void;
}) {
  return (
    <View style={styles.grid}>
      {props.options.map((option) => (
        <AvatarTile
          key={option.id}
          id={option.id}
          label={option.label}
          svg={option.svg}
          selected={props.selectedId === option.id}
          onPress={props.onChange}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 18,
  },
});
