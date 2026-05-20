import { StyleSheet } from 'react-native';
import { AppPanel, AppText } from '../components/ui/primitives';

export function CoffeePageProduct(props: {
  coffeeName?: string;
  variety?: string | null;
  processingMethod?: string | null;
  producerNotes?: string | null;
  roasterName?: string | null;
}) {
  return (
    <AppPanel style={styles.section}>
      <AppText variant="h3" weight="600">Product</AppText>
      <AppText variant="body" weight="600">{props.coffeeName ?? 'Coffee'}</AppText>
      {props.roasterName ? <AppText tone="secondary">{props.roasterName}</AppText> : null}
      {[props.variety, props.processingMethod].filter(Boolean).length > 0 ? (
        <AppText tone="muted" style={styles.meta}>
          {[props.variety, props.processingMethod].filter(Boolean).join(' · ')}
        </AppText>
      ) : null}
      {props.producerNotes ? (
        <AppText style={styles.body}>{props.producerNotes}</AppText>
      ) : null}
    </AppPanel>
  );
}

const styles = StyleSheet.create({
  section: { paddingVertical: 12 },
  meta: { marginTop: 4 },
  body: { marginTop: 8, lineHeight: 22 },
});
