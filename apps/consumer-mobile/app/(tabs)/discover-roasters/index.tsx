import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { visualSystemTokens } from '@funcup/shared';

import { DiscoverCoffeesTab } from '../../../src/components/hub/DiscoverCoffeesTab';
import { DiscoverRoastersTab } from '../../../src/components/hub/DiscoverRoastersTab';
import { AppScrollScreen, AppText } from '../../../src/components/ui/primitives';
import { pageStyles } from '../../../src/theme/pageStyles';

type DiscoverySection = 'coffees' | 'roasters';

export default function DiscoverRoastersScreen() {
  const [activeSection, setActiveSection] = useState<DiscoverySection>('coffees');

  return (
    <AppScrollScreen contentContainerStyle={pageStyles.content}>
      <View style={styles.header}>
        <AppText variant="h2" weight="700">Discover</AppText>
        <AppText tone="secondary">
          MVP discovery stays simple: browse coffees, open verified roasters, and follow the ones you want to keep on your radar.
        </AppText>
      </View>

      <View style={styles.segmentedControl} accessibilityRole="tablist">
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeSection === 'coffees' }}
          onPress={() => setActiveSection('coffees')}
          style={[styles.segment, activeSection === 'coffees' ? styles.segmentActive : null]}
        >
          <AppText
            weight="700"
            tone={activeSection === 'coffees' ? 'onPrimary' : 'secondary'}
          >
            Coffees
          </AppText>
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeSection === 'roasters' }}
          onPress={() => setActiveSection('roasters')}
          style={[styles.segment, activeSection === 'roasters' ? styles.segmentActive : null]}
        >
          <AppText
            weight="700"
            tone={activeSection === 'roasters' ? 'onPrimary' : 'secondary'}
          >
            Roasters
          </AppText>
        </Pressable>
      </View>

      {activeSection === 'coffees' ? <DiscoverCoffeesTab /> : <DiscoverRoastersTab />}
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
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
});
