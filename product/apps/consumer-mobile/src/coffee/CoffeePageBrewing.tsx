import { StyleSheet } from 'react-native';
import { AppPanel, AppText } from '../components/ui/primitives';

export function CoffeePageBrewing(props: { brewingNotes?: string | null }) {
  return (
    <AppPanel style={styles.section}>
      <AppText variant="h3" weight="600">Brewing</AppText>
      <AppText style={styles.body}>
        {props.brewingNotes?.trim() ? props.brewingNotes : 'No brewing notes for this batch yet.'}
      </AppText>
    </AppPanel>
  );
}

const styles = StyleSheet.create({
  section: { paddingVertical: 12 },
  body: { lineHeight: 22 },
});
