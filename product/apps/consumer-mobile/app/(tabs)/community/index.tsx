import { visualSystemTokens } from '@funcup/shared';
import { StyleSheet, View } from 'react-native';

import { AppCard, AppScrollScreen, AppText } from '../../../src/components/ui/primitives';
import { pageStyles } from '../../../src/theme/pageStyles';

export default function CommunityScreen() {
  return (
    <AppScrollScreen contentContainerStyle={[pageStyles.content, styles.content]}>
      <View style={styles.header}>
        <AppText variant="h2" weight="700">Community</AppText>
        <AppText tone="secondary">
          This area will gather public reviews, helpful votes and community activity in one place.
        </AppText>
      </View>

      <AppCard>
        <AppText variant="h3" weight="700">Coming next</AppText>
        <AppText tone="secondary">
          Move community-oriented screen flows here instead of attaching them to Hub or Profile.
        </AppText>
      </AppCard>

      <AppCard style={styles.placeholderCard}>
        <AppText variant="body" weight="700">Planned modules</AppText>
        <AppText tone="secondary">Public reviews tied to coffees and batches.</AppText>
        <AppText tone="secondary">Helpful reputation and trust signals.</AppText>
        <AppText tone="secondary">Activity summaries and participation history.</AppText>
      </AppCard>
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: visualSystemTokens.spacing.xl * 2,
  },
  header: {
    gap: visualSystemTokens.spacing.xs,
  },
  placeholderCard: {
    backgroundColor: visualSystemTokens.basePalette.champagneMistSoft,
  },
});
