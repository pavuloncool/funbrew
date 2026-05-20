import { hasExpertBadge } from '@funcup/shared';
import { StyleSheet } from 'react-native';
import { AppPanel, AppText } from '../components/ui/primitives';

export function CoffeePageCommunity(props: {
  reputationScore?: number;
  totalTastings?: number;
  avgRating?: number;
}) {
  const showExpertBadge = hasExpertBadge(props.reputationScore ?? 0);
  const tastings = props.totalTastings ?? 0;
  const avg = props.avgRating ?? 0;

  return (
    <AppPanel style={styles.section}>
      <AppText variant="h3" weight="600">Community</AppText>
      <AppText tone="secondary">
        {tastings > 0
          ? `${tastings} tasting${tastings === 1 ? '' : 's'} · avg ${avg.toFixed(1)} / 5`
          : 'Be the first to log a tasting for this batch.'}
      </AppText>
      {showExpertBadge ? (
        <AppText variant="caption" tone="muted" style={styles.badge}>Expert taster</AppText>
      ) : null}
    </AppPanel>
  );
}

const styles = StyleSheet.create({
  section: { paddingVertical: 12 },
  badge: { marginTop: 6 },
});
