import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useDiscoverRoasters, useFollowRoaster } from '@funcup/shared';

import { EmptyState } from '../EmptyState';
import { ScreenError } from '../ScreenError';
import { DiscoverListSkeleton } from '../ui/Skeleton';
import { useViewerUserId } from '../../hooks/useViewerUserId';
import { supabase } from '../../services/supabaseClient';
import { AppText } from '../ui/primitives';

import { discoverHubStyles, followLabelStyle, followPressableStyle } from './discoverHub.styles';

function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export function DiscoverRoastersTab() {
  const { userId, isLoading: userLoading } = useViewerUserId();
  const roastersQuery = useDiscoverRoasters({ supabase, userId, limit: 8 });
  const followMutation = useFollowRoaster({ supabase, userId });

  if (roastersQuery.isLoading || userLoading) {
    return <DiscoverListSkeleton rows={4} />;
  }

  if (roastersQuery.isError) {
    return (
      <ScreenError
        message={formatError(roastersQuery.error)}
        onRetry={() => void roastersQuery.refetch()}
      />
    );
  }

  if (!roastersQuery.data || roastersQuery.data.length === 0) {
    return (
      <EmptyState
        title="No roasters yet"
        description="Verified roasters will appear here as they join funcup."
      />
    );
  }

  return (
    <View style={discoverHubStyles.list} accessibilityRole="list">
      {roastersQuery.data.map((roaster) => (
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
              followMutation.mutate({ roasterId: roaster.id, follow: !roaster.isFollowed })
            }
            disabled={!userId || followMutation.isPending}
            style={followPressableStyle(roaster.isFollowed)}
            accessibilityRole="button"
            accessibilityState={{ disabled: !userId || followMutation.isPending }}
            accessibilityLabel={roaster.isFollowed ? `Unfollow ${roaster.name}` : `Follow ${roaster.name}`}
          >
            <AppText style={followLabelStyle(roaster.isFollowed)}>
              {roaster.isFollowed ? 'Following' : 'Follow'}
            </AppText>
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
  );
}
