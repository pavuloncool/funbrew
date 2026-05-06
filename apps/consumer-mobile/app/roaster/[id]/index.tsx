import { useQuery } from '@tanstack/react-query';
import { useFollowRoaster, visualSystemTokens } from '@funcup/shared';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useViewerUserId } from '../../../src/hooks/useViewerUserId';
import { supabase } from '../../../src/services/supabaseClient';
import { AppButton, AppScrollScreen, AppText } from '../../../src/components/ui/primitives';
import { pageStyles } from '../../../src/theme/pageStyles';

type RoasterProfileData = {
  id: string;
  name: string;
  roaster_short_name: string | null;
  country: string | null;
  city: string | null;
  description: string | null;
  website: string | null;
  isFollowed: boolean;
};

async function fetchRoasterProfile(params: {
  roasterId: string;
  userId: string | null;
}): Promise<RoasterProfileData | null> {
  const { data: roasterData, error } = await supabase
    .from('roasters')
    .select('id,name,roaster_short_name,country,city,description,website')
    .eq('id', params.roasterId)
    .maybeSingle();
  if (error) throw error;
  const data = roasterData as
    | {
        id: string;
        name: string;
        roaster_short_name: string | null;
        country: string | null;
        city: string | null;
        description: string | null;
        website: string | null;
      }
    | null;
  if (!data) return null;

  let isFollowed = false;
  if (params.userId) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('following_roaster_ids')
      .eq('id', params.userId)
      .maybeSingle();
    if (userError) throw userError;
    const ids = (userData as { following_roaster_ids?: string[] } | null)?.following_roaster_ids ?? [];
    isFollowed = ids.includes(params.roasterId);
  }

  return {
    id: data.id,
    name: data.name,
    roaster_short_name: data.roaster_short_name,
    country: data.country,
    city: data.city,
    description: data.description,
    website: data.website,
    isFollowed,
  };
}

export default function RoasterProfileScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { userId, isLoading: userLoading } = useViewerUserId();
  const followMutation = useFollowRoaster({ supabase, userId });
  const roasterId = params.id ?? '';

  const roasterQuery = useQuery({
    queryKey: ['roasterProfile', roasterId, userId ?? null],
    enabled: Boolean(roasterId) && !userLoading,
    queryFn: () => fetchRoasterProfile({ roasterId, userId }),
  });

  if (!roasterId) {
    return (
      <AppScrollScreen contentContainerStyle={pageStyles.contentCompact}>
        <AppText>Missing roaster id.</AppText>
      </AppScrollScreen>
    );
  }

  if (roasterQuery.isLoading || userLoading) {
    return (
      <AppScrollScreen contentContainerStyle={pageStyles.contentCompact}>
        <AppText>Loading roaster profile...</AppText>
      </AppScrollScreen>
    );
  }

  if (roasterQuery.isError) {
    return (
      <AppScrollScreen contentContainerStyle={pageStyles.contentCompact}>
        <AppText>Could not load roaster profile.</AppText>
      </AppScrollScreen>
    );
  }

  if (!roasterQuery.data) {
    return (
      <AppScrollScreen contentContainerStyle={pageStyles.contentCompact}>
        <AppText>Roaster not found.</AppText>
      </AppScrollScreen>
    );
  }

  const roaster = roasterQuery.data;
  const isFollowed = followMutation.isPending
    ? !roaster.isFollowed
    : roaster.isFollowed;

  return (
    <AppScrollScreen contentContainerStyle={pageStyles.contentCompact}>
      <AppText variant="h1" weight="700">{roaster.roaster_short_name ?? roaster.name}</AppText>
      <AppText tone="secondary">
        {[roaster.city, roaster.country].filter(Boolean).join(', ') || 'Location unavailable'}
      </AppText>
      <AppText>{roaster.description ?? 'No roaster story yet.'}</AppText>
      <AppText>{roaster.website ?? 'No website'}</AppText>

      <View style={styles.actionWrap}>
        <AppButton
          onPress={() => followMutation.mutate({ roasterId: roaster.id, follow: !roaster.isFollowed })}
          disabled={!userId || followMutation.isPending}
          variant={isFollowed ? 'primary' : 'secondary'}
          label={isFollowed ? 'Following' : 'Follow Roaster'}
        />
      </View>
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  actionWrap: { paddingTop: visualSystemTokens.spacing.xs },
});
