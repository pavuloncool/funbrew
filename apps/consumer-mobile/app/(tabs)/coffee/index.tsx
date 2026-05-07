import { Pressable, StyleSheet, View } from 'react-native';
import { visualSystemTokens } from '@funcup/shared';
import { useState } from 'react';

import { RatedCoffeesSection } from '../../../src/components/coffee/RatedCoffeesSection';
import { DiscoverCoffeesTab } from '../../../src/components/hub/DiscoverCoffeesTab';
import { AppScrollScreen, AppText } from '../../../src/components/ui/primitives';
import { pageStyles } from '../../../src/theme/pageStyles';

type CoffeeSection = 'rated' | 'discover';

export default function CoffeeScreen() {
  const [activeSection, setActiveSection] = useState<CoffeeSection>('rated');

  return (
    <AppScrollScreen contentContainerStyle={[pageStyles.content, styles.content]}>
      <View style={styles.header}>
        <AppText variant="h2" weight="700">Coffee</AppText>
        <AppText tone="secondary">
          Rated coffees from your tasting journal and discover feed in one place.
        </AppText>
      </View>

      <View style={styles.segmentedControl} accessibilityRole="tablist">
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeSection === 'rated' }}
          onPress={() => setActiveSection('rated')}
          style={[styles.segment, activeSection === 'rated' ? styles.segmentActive : null]}
        >
          <AppText
            weight="700"
            tone={activeSection === 'rated' ? 'onPrimary' : 'secondary'}
          >
            Rated Coffees
          </AppText>
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeSection === 'discover' }}
          onPress={() => setActiveSection('discover')}
          style={[styles.segment, activeSection === 'discover' ? styles.segmentActive : null]}
        >
          <AppText
            weight="700"
            tone={activeSection === 'discover' ? 'onPrimary' : 'secondary'}
          >
            Discover Coffees
          </AppText>
        </Pressable>
      </View>

      {activeSection === 'rated' ? (
        <RatedCoffeesSection />
      ) : (
        <View style={styles.section}>
          <AppText variant="h3" weight="700">Discover Coffees</AppText>
          <AppText tone="secondary">
            Recommendation ranking evolves in upcoming iterations. MVP shows latest active coffees.
          </AppText>
          <DiscoverCoffeesTab />
        </View>
      )}
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
  segmentedControl: {
    flexDirection: 'row',
    gap: visualSystemTokens.spacing.xs,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: visualSystemTokens.colors.borderSubtle,
    borderRadius: visualSystemTokens.radius.pill,
    backgroundColor: visualSystemTokens.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: visualSystemTokens.spacing.sm,
  },
  segmentActive: {
    borderColor: visualSystemTokens.colors.accentPrimary,
    backgroundColor: visualSystemTokens.colors.accentPrimary,
  },
  section: {
    gap: visualSystemTokens.spacing.sm,
  },
});
