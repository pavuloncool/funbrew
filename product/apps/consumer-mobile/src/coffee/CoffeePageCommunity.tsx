import { formatFavoriteUsersCopy, hasExpertBadge } from '@funcup/shared';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../components/ui/primitives';

export function CoffeePageCommunity(props: {
  reputationScore?: number;
  totalTastings?: number;
  avgRating?: number;
  favoriteUsersCount?: number;
}) {
  const showExpertBadge = hasExpertBadge(props.reputationScore ?? 0);
  const tastings = props.totalTastings ?? 0;
  const avg = props.avgRating ?? 0;
  const favoriteUsersCopy = formatFavoriteUsersCopy(props.favoriteUsersCount ?? 0);

  return (
    <View style={styles.section}>
      <AppText tone="secondary">
        {tastings > 0
          ? `${tastings} tasting${tastings === 1 ? '' : 's'} · avg ${avg.toFixed(1)} / 5`
          : 'Be the first to log a tasting for this batch.'}
      </AppText>
      <AppText tone="secondary">
        {favoriteUsersCopy ?? 'Favourite this coffee to surface community interest.'}
      </AppText>
      {showExpertBadge ? (
        <AppText variant="caption" tone="muted" style={styles.badge}>Expert taster</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 6,
  },
  badge: { marginTop: 6 },
});
