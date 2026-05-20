import { StyleSheet } from 'react-native';
import { AppPanel, AppText } from '../components/ui/primitives';

export function CoffeePageStory(props: { roasterStory?: string | null }) {
  return (
    <AppPanel style={styles.section}>
      <AppText variant="h3" weight="600">Story</AppText>
      <AppText style={styles.body}>
        {props.roasterStory?.trim() ? props.roasterStory : 'No roaster story for this batch yet.'}
      </AppText>
    </AppPanel>
  );
}

const styles = StyleSheet.create({
  section: { paddingVertical: 12 },
  body: { lineHeight: 22 },
});
