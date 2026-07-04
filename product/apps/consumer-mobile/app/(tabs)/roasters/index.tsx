import { Link } from 'expo-router';
import { useFollowRoaster, useDiscoverRoasters, visualSystemTokens } from '@funcup/shared';
import { Pressable, StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { EmptyState } from '../../../src/components/EmptyState';
import { ScreenError } from '../../../src/components/ScreenError';
import { DiscoverListSkeleton } from '../../../src/components/ui/Skeleton';
import { useViewerUserId } from '../../../src/hooks/useViewerUserId';
import { supabase } from '../../../src/services/supabaseClient';
import { AppInput, AppScrollScreen, AppText } from '../../../src/components/ui/primitives';
import { pageStyles } from '../../../src/theme/pageStyles';
import { discoverHubStyles, followLabelStyle, followPressableStyle } from '../../../src/components/hub/discoverHub.styles';

function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

type RoasterSection = 'followed' | 'discover';

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

function matchesSearch(
  roaster: { name: string; city: string | null },
  normalizedQuery: string
): boolean {
  if (!normalizedQuery) return true;
  const name = roaster.name.toLowerCase();
  const city = roaster.city?.toLowerCase() ?? '';
  return name.includes(normalizedQuery) || city.includes(normalizedQuery);
}

export default function RoastersScreen() {
  const { userId, isLoading: userLoading } = useViewerUserId();
  const roastersQuery = useDiscoverRoasters({ supabase, userId, limit: 16 });
  const followMutation = useFollowRoaster({ supabase, userId });
  const [activeSection, setActiveSection] = useState<RoasterSection>('followed');
  const [searchQuery, setSearchQuery] = useState('');

  if (userLoading || roastersQuery.isLoading) {
    return (
      <AppScrollScreen contentContainerStyle={pageStyles.content}>
        <AppText variant="h2" weight="700">Roasters</AppText>
        <DiscoverListSkeleton rows={5} />
      </AppScrollScreen>
    );
  }

  if (roastersQuery.isError) {
    return (
      <AppScrollScreen contentContainerStyle={pageStyles.content}>
        <AppText variant="h2" weight="700">Roasters</AppText>
        <ScreenError
          message={formatError(roastersQuery.error)}
          onRetry={() => void roastersQuery.refetch()}
        />
      </AppScrollScreen>
    );
  }

  const allRoasters = roastersQuery.data ?? [];
  const normalizedQuery = normalizeSearchValue(searchQuery);
  const followedRoasters = allRoasters
    .filter((roaster) => roaster.isFollowed)
    .filter((roaster) => matchesSearch(roaster, normalizedQuery));
  const discoverRoasters = allRoasters
    .filter((roaster) => !roaster.isFollowed)
    .filter((roaster) => matchesSearch(roaster, normalizedQuery));

  return (
    <AppScrollScreen contentContainerStyle={[pageStyles.content, styles.content]}>
      <View style={styles.header}>
        <AppText variant="h2" weight="700">Roasters</AppText>
        <AppText tone="secondary">
          Keep your followed roasters close and discover new verified profiles.
        </AppText>
        <AppInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search roasters by name or city"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search roasters by name or city"
        />
      </View>

      <View style={styles.segmentedControl} accessibilityRole="tablist">
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeSection === 'followed' }}
          onPress={() => setActiveSection('followed')}
          style={[styles.segment, activeSection === 'followed' ? styles.segmentActive : null]}
        >
          <AppText
            weight="700"
            tone={activeSection === 'followed' ? 'onPrimary' : 'secondary'}
          >
            Followed
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
            Discover
          </AppText>
        </Pressable>
      </View>

      <View style={styles.section}>
        {activeSection === 'followed' ? (
          <>
            <AppText variant="h3" weight="700">Followed Roasters</AppText>
            {followedRoasters.length === 0 ? (
              <EmptyState
                title={normalizedQuery ? 'No matching followed roasters' : 'No followed roasters yet'}
                description={
                  normalizedQuery
                    ? 'Try a different name or city.'
                    : 'Follow a verified roaster and they will appear here.'
                }
              />
            ) : (
              <View style={discoverHubStyles.list} accessibilityRole="list">
                {followedRoasters.map((roaster) => (
                  <View
                    key={roaster.id}
                    style={discoverHubStyles.card}
                    accessibilityRole="text"
                    accessibilityLabel={`${roaster.name}, ${[roaster.city, roaster.country].filter(Boolean).join(', ') || 'location unknown'}`}
                  >
                    <AppText variant="body" weight="600">{roaster.name}</AppText>
                    <AppText tone="secondary">
                      {[roaster.city, roaster.country].filter(Boolean).join(', ') || 'Location unavailable'}
                    </AppText>
                    <AppText>{roaster.description ?? 'No roaster story yet.'}</AppText>
                    <Pressable
                      onPress={() =>
                        followMutation.mutate({
                          roasterId: roaster.id,
                          follow: false,
                          source: 'roasters-screen',
                        })
                      }
                      disabled={!userId || followMutation.isPending}
                      style={followPressableStyle(true)}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !userId || followMutation.isPending }}
                      accessibilityLabel={`Unfollow ${roaster.name}`}
                    >
                      <AppText style={followLabelStyle(true)}>Following</AppText>
                    </Pressable>
                    <Link
                      href={{ pathname: '/roaster/[id]', params: { id: roaster.id } }}
                      accessibilityRole="link"
                      accessibilityLabel={`Open profile for ${roaster.name}`}
                    >
                      Open profile
                    </Link>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            <AppText variant="h3" weight="700">Discover Roasters</AppText>
            {discoverRoasters.length === 0 ? (
              <EmptyState
                title={normalizedQuery ? 'No matching roasters to discover' : 'No new roasters now'}
                description={
                  normalizedQuery
                    ? 'Try a different name or city.'
                    : 'You already follow all currently available verified roasters.'
                }
              />
            ) : (
              <View style={discoverHubStyles.list} accessibilityRole="list">
                {discoverRoasters.map((roaster) => (
                  <View
                    key={roaster.id}
                    style={discoverHubStyles.card}
                    accessibilityRole="text"
                    accessibilityLabel={`${roaster.name}, ${[roaster.city, roaster.country].filter(Boolean).join(', ') || 'location unknown'}`}
                  >
                    <AppText variant="body" weight="600">{roaster.name}</AppText>
                    <AppText tone="secondary">
                      {[roaster.city, roaster.country].filter(Boolean).join(', ') || 'Location unavailable'}
                    </AppText>
                    <AppText>{roaster.description ?? 'No roaster story yet.'}</AppText>
                    <Pressable
                      onPress={() =>
                        followMutation.mutate({
                          roasterId: roaster.id,
                          follow: true,
                          source: 'roasters-screen',
                        })
                      }
                      disabled={!userId || followMutation.isPending}
                      style={followPressableStyle(false)}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !userId || followMutation.isPending }}
                      accessibilityLabel={`Follow ${roaster.name}`}
                    >
                      <AppText style={followLabelStyle(false)}>Follow</AppText>
                    </Pressable>
                    <Link
                      href={{ pathname: '/roaster/[id]', params: { id: roaster.id } }}
                      accessibilityRole="link"
                      accessibilityLabel={`Open profile for ${roaster.name}`}
                    >
                      Open profile
                    </Link>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>
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
