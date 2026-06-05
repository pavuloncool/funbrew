import { useCoffeeGeographySummary, visualSystemTokens } from '@funcup/shared';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '../../src/components/EmptyState';
import { InlineBackHeader } from '../../src/components/navigation/InlineBackHeader';
import { AppCard, AppScrollScreen, AppText } from '../../src/components/ui/primitives';
import { useViewerUserId } from '../../src/hooks/useViewerUserId';
import { supabase } from '../../src/services/supabaseClient';
import { pageStyles } from '../../src/theme/pageStyles';

function CountryDot(props: { label: string; top: number; left: number }) {
  return (
    <View style={[styles.dot, { top: props.top, left: props.left }]}>
      <AppText variant="caption" weight="700" tone="onPrimary">{props.label}</AppText>
    </View>
  );
}

export default function AtlasScreen() {
  const { userId } = useViewerUserId();
  const geographyQuery = useCoffeeGeographySummary({ supabase, userId });
  const geography = geographyQuery.data;

  return (
    <AppScrollScreen contentContainerStyle={[pageStyles.content, styles.content]}>
      <View style={styles.header}>
        <InlineBackHeader title="Coffee Atlas" fallbackHref="/(tabs)/hub" />
        <AppText tone="secondary">
          A static geography layer for beta demos: origin countries first, region detail second, no game board mechanics.
        </AppText>
      </View>

      <AppCard style={styles.mapCard}>
        <AppText variant="caption" weight="700" tone="secondary">STATIC MAP PREVIEW</AppText>
        <View style={styles.mapCanvas}>
          <View style={styles.continentBand} />
          <CountryDot label="ETH" top={64} left={178} />
          <CountryDot label="COL" top={104} left={86} />
          <CountryDot label="PAN" top={96} left={62} />
          <CountryDot label="KEN" top={84} left={196} />
        </View>
        <AppText tone="secondary">
          This map is intentionally static in MVP. It visualizes coffee origin as an editorial layer, not a conquest mechanic.
        </AppText>
      </AppCard>

      {geographyQuery.isLoading ? (
        <AppCard>
          <AppText tone="secondary">Loading atlas summary…</AppText>
        </AppCard>
      ) : geography && geography.uniqueCountries > 0 ? (
        <>
          <AppCard>
            <AppText variant="h3" weight="700">Visited origins</AppText>
            <AppText tone="secondary">
              {geography.uniqueCountries} countries from {geography.totalLogs} tasting logs.
            </AppText>
            {geography.topCountries.map((country) => (
              <View key={country.country} style={styles.listRow}>
                <AppText weight="700">{country.country}</AppText>
                <AppText tone="secondary">
                  {country.count} logs{country.topRegion ? ` · top region ${country.topRegion}` : ''}
                </AppText>
              </View>
            ))}
          </AppCard>

          <AppCard>
            <AppText variant="h3" weight="700">Processing snapshot</AppText>
            {geography.processingCounts.map((item) => (
              <View key={item.processingMethod} style={styles.listRow}>
                <AppText weight="700">{item.processingMethod}</AppText>
                <AppText tone="secondary">{item.count} logs</AppText>
              </View>
            ))}
          </AppCard>
        </>
      ) : (
        <EmptyState
          title="Your atlas is still blank"
          description="Log coffees with origin data and the geography layer will start grouping visited countries here."
        />
      )}

      <AppCard style={styles.placeholderCard}>
        <AppText variant="h3" weight="700">Collection album</AppText>
        <AppText tone="secondary">
          Placeholder for the post-beta layer: structured origin/process/flavor collections grouped like an archive rather than a checklist.
        </AppText>
      </AppCard>
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: visualSystemTokens.spacing.md,
    paddingBottom: visualSystemTokens.spacing.xl * 2,
  },
  header: {
    gap: visualSystemTokens.spacing.xs,
  },
  mapCard: {
    gap: visualSystemTokens.spacing.sm,
  },
  mapCanvas: {
    position: 'relative',
    minHeight: 220,
    borderRadius: visualSystemTokens.radius.lg,
    backgroundColor: '#d7ece7',
    overflow: 'hidden',
  },
  continentBand: {
    position: 'absolute',
    top: '18%',
    left: '10%',
    right: '12%',
    bottom: '22%',
    borderRadius: visualSystemTokens.radius.lg,
    backgroundColor: '#8bb8a9',
    opacity: 0.35,
  },
  dot: {
    position: 'absolute',
    minWidth: 46,
    paddingHorizontal: visualSystemTokens.spacing.xs,
    paddingVertical: 6,
    borderRadius: visualSystemTokens.radius.pill,
    backgroundColor: visualSystemTokens.basePalette.stormyTeal,
    alignItems: 'center',
  },
  listRow: {
    gap: 2,
    paddingVertical: visualSystemTokens.spacing.xxs,
  },
  placeholderCard: {
    backgroundColor: visualSystemTokens.colors.surfaceMuted,
  },
});
