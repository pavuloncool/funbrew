import { visualSystemTokens } from '@funcup/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppScreen, AppText } from '../../../src/components/ui/primitives';
import { TAB_BAR_FAB_OVERLAP, TAB_BAR_HEIGHT } from '../../../src/components/ui/AppTabBar';

const { spacing, radius, colors, basePalette, typography } = visualSystemTokens;
const HUB_HORIZONTAL_PADDING = Math.round(spacing.xl * 0.7);
const GRID_GAP = spacing.xs;
const HEADER_TO_GRID_GAP = GRID_GAP * 2;
const TILE_PADDING = spacing.md;
const GRID_BOTTOM_MARGIN = spacing.sm;
const FALLBACK_HEADER_HEIGHT = typography.headingSM;
const COMPACT_SCREEN_HEIGHT = 667;
const COMPACT_SCREEN_WIDTH = 375;

export default function HubIndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [headerHeight, setHeaderHeight] = useState<number>(FALLBACK_HEADER_HEIGHT);
  const isCompactScreen = height <= COMPACT_SCREEN_HEIGHT || width <= COMPACT_SCREEN_WIDTH;

  const availableWidth = Math.max(width - HUB_HORIZONTAL_PADDING * 2, 0);
  const tileWidth = Math.max(Math.floor((availableWidth - GRID_GAP) / 2), 0);

  const availableGridHeight = Math.max(
    height
      - insets.top
      - insets.bottom
      - TAB_BAR_HEIGHT
      - TAB_BAR_FAB_OVERLAP
      - headerHeight
      - HEADER_TO_GRID_GAP
      - GRID_BOTTOM_MARGIN,
    0
  );
  const tileHeight = Math.max(Math.floor((availableGridHeight - GRID_GAP) / 2), 0);

  return (
    <AppScreen edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.dashboard}>
          <View
            style={styles.header}
            onLayout={(event) => {
              const nextHeight = Math.ceil(event.nativeEvent.layout.height);
              if (nextHeight > 0 && nextHeight !== headerHeight) {
                setHeaderHeight(nextHeight);
              }
            }}
          >
            <AppText variant="h3" weight="700" style={styles.title}>fun•brew: passion for coffee</AppText>
          </View>

          <View style={[styles.grid, { width: availableWidth, height: availableGridHeight }]}>
            <View style={styles.row}>
              <HubTile
                title="Coffee Log"
                caption="LOG & DISCOVER"
                description="Log your coffee experiences, discover new batches and manage your favourites."
                onPress={() => router.push('/(tabs)/coffee')}
                tileWidth={tileWidth}
                tileHeight={tileHeight}
                isCompactScreen={isCompactScreen}
              />
              <HubTile
                title="Roasters"
                caption="FOLLOW & EXPLORE"
                description="Visit your favourite roasters and meet new coffee houses to find your next coffee bag."
                onPress={() => router.push('/(tabs)/roasters')}
                tileWidth={tileWidth}
                tileHeight={tileHeight}
                isCompactScreen={isCompactScreen}
              />
            </View>

            <View style={styles.row}>
              <HubTile
                title="Network"
                caption="MEET & SHARE"
                description="Enter the future home for public reviews, helpful votes and activity."
                onPress={() => router.push('/(tabs)/community')}
                tileWidth={tileWidth}
                tileHeight={tileHeight}
                isCompactScreen={isCompactScreen}
              />
              <HubTile
                title="Learn"
                caption="ARTICLES & BASICS"
                description="Read coffee primers and practical guides curated for fun•brew."
                onPress={() => router.push('/(tabs)/learn')}
                tileWidth={tileWidth}
                tileHeight={tileHeight}
                isCompactScreen={isCompactScreen}
              />
            </View>
          </View>
        </View>
      </View>
    </AppScreen>
  );
}

function HubTile(props: {
  title: string;
  caption: string;
  description: string;
  onPress: () => void;
  tileWidth: number;
  tileHeight: number;
  isCompactScreen: boolean;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityLabel={props.title}
      style={({ pressed }) => [
        styles.tile,
        { width: props.tileWidth, height: props.tileHeight },
        pressed ? styles.tilePressed : null,
      ]}
    >
      <AppText variant="caption" weight="700" tone="secondary" style={styles.tileCaption}>
        {props.caption}
      </AppText>
      <View style={styles.tileBody}>
        <AppText
          weight="700"
          style={[styles.tileTitle, props.isCompactScreen ? styles.tileTitleCompact : styles.tileTitleRegular]}
        >
          {props.title}
        </AppText>
        <AppText
          tone="secondary"
          style={[
            styles.tileDescription,
            props.isCompactScreen ? styles.tileDescriptionCompact : styles.tileDescriptionRegular,
          ]}
        >
          {props.description}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: visualSystemTokens.recipes.screen.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: HUB_HORIZONTAL_PADDING,
    paddingBottom: GRID_BOTTOM_MARGIN,
  },
  dashboard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: HEADER_TO_GRID_GAP,
  },
  title: {
    maxWidth: 320,
    textAlign: 'center',
  },
  grid: {
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: GRID_GAP,
  },
  tile: {
    borderRadius: radius.lg,
    padding: TILE_PADDING,
    backgroundColor: basePalette.champagneMist,
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    gap: spacing.sm,
  },
  tilePressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  tileCaption: {
    fontSize: typography.caption,
    lineHeight: typography.lineHeight.caption,
  },
  tileBody: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: spacing.sm,
  },
  tileTitle: {
    maxWidth: '100%',
  },
  tileTitleCompact: {
    fontSize: typography.bodyMD,
    lineHeight: typography.lineHeight.bodyMD,
  },
  tileTitleRegular: {
    fontSize: typography.headingSM,
    lineHeight: typography.lineHeight.headingSM,
  },
  tileDescription: {
  },
  tileDescriptionCompact: {
    fontSize: typography.bodySM,
    lineHeight: typography.lineHeight.bodySM,
  },
  tileDescriptionRegular: {
    fontSize: typography.bodyMD,
    lineHeight: typography.lineHeight.bodyMD,
  },
});
