import { useQuery } from '@tanstack/react-query';
import { useFollowRoaster, visualSystemTokens } from '@funcup/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';

import { EmptyState } from '../../../src/components/EmptyState';
import { ScreenError } from '../../../src/components/ScreenError';
import { useRoasterPublishedCoffees } from '../../../src/hooks/useRoasterPublishedCoffees';
import { useViewerUserId } from '../../../src/hooks/useViewerUserId';
import { useGoBackOrFallback } from '../../../src/navigation/useGoBackOrFallback';
import { resolveSupabaseImageUri } from '../../../src/utils/resolveSupabaseImageUri';
import { supabase } from '../../../src/services/supabaseClient';
import { AppScrollScreen, AppText } from '../../../src/components/ui/primitives';
import { pageStyles } from '../../../src/theme/pageStyles';

type RoasterProfileData = {
  id: string;
  name: string;
  roaster_short_name: string | null;
  country: string | null;
  city: string | null;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  verification_status: string | null;
  isFollowed: boolean;
};

function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function formatVerificationStatus(status: string | null): string {
  if (!status) return 'Status unavailable';
  if (status === 'verified') return 'Verified roaster';
  if (status === 'pending') return 'Verification pending';
  if (status === 'revoked') return 'Verification revoked';
  return status;
}

function normalizeExternalUrl(rawUrl: string | null): string | null {
  const value = rawUrl?.trim() ?? '';
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function followButtonPressableStyle(params: {
  isFollowed: boolean;
  pressed: boolean;
  hovered: boolean;
  disabled: boolean;
}) {
  if (params.disabled) {
    return [styles.followButtonBase, styles.followButtonDisabled];
  }

  if (params.pressed) {
    return [styles.followButtonBase, styles.followButtonPressed];
  }

  if (params.hovered) {
    return [styles.followButtonBase, styles.followButtonHovered];
  }

  return [
    styles.followButtonBase,
    params.isFollowed ? styles.followButtonFollowing : styles.followButtonDefault,
  ];
}

function followButtonLabelTone(params: {
  isFollowed: boolean;
  pressed: boolean;
  hovered: boolean;
}): 'primary' | 'onPrimary' {
  if (params.pressed) return 'onPrimary';
  if (params.hovered) return 'primary';
  return params.isFollowed ? 'onPrimary' : 'primary';
}

function coffeeAppletPressableStyle(params: { pressed: boolean; hovered: boolean }) {
  if (params.pressed) {
    return [styles.coffeeApplet, styles.coffeeAppletPressed];
  }

  if (params.hovered) {
    return [styles.coffeeApplet, styles.coffeeAppletHovered];
  }

  return styles.coffeeApplet;
}

function coffeeAppletTextTone(params: { pressed: boolean }): 'primary' | 'secondary' | 'onPrimary' {
  return params.pressed ? 'onPrimary' : 'primary';
}

async function fetchRoasterProfile(params: {
  roasterId: string;
  userId: string | null;
}): Promise<RoasterProfileData | null> {
  const { data: roasterData, error } = await supabase
    .from('roasters')
    .select('id,name,roaster_short_name,country,city,description,website,logo_url,verification_status')
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
        logo_url: string | null;
        verification_status: string | null;
      }
    | null;
  if (!data) return null;

  let isFollowed = false;
  if (params.userId) {
    const { data: followData, error: userError } = await supabase
      .from('user_roaster_follows')
      .select('roaster_id')
      .eq('user_id', params.userId)
      .eq('roaster_id', params.roasterId);
    if (userError) throw userError;
    isFollowed = Array.isArray(followData) && followData.length > 0;
  }

  return {
    id: data.id,
    name: data.name,
    roaster_short_name: data.roaster_short_name,
    country: data.country,
    city: data.city,
    description: data.description,
    website: data.website,
    logo_url: data.logo_url,
    verification_status: data.verification_status,
    isFollowed,
  };
}

export default function RoasterProfileScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { userId, isLoading: userLoading } = useViewerUserId();
  const followMutation = useFollowRoaster({ supabase, userId });
  const roasterId = params.id ?? '';
  const goBackOrFallback = useGoBackOrFallback('/(tabs)/roasters');
  const [isFollowHovered, setIsFollowHovered] = useState(false);
  const [hoveredCoffeeId, setHoveredCoffeeId] = useState<string | null>(null);

  const roasterQuery = useQuery({
    queryKey: ['roasterProfile', roasterId, userId ?? null],
    enabled: Boolean(roasterId) && !userLoading,
    queryFn: () => fetchRoasterProfile({ roasterId, userId }),
  });
  const roasterCoffeesQuery = useRoasterPublishedCoffees({
    supabase,
    roasterId,
    userId,
    enabled: Boolean(roasterId) && !userLoading,
  });

  if (!roasterId) {
    return (
      <AppScrollScreen contentContainerStyle={pageStyles.contentCompact}>
        <AppText variant="h2" weight="700">Roaster</AppText>
        <AppText>Missing roaster id.</AppText>
      </AppScrollScreen>
    );
  }

  if (roasterQuery.isLoading || userLoading) {
    return (
      <AppScrollScreen contentContainerStyle={pageStyles.contentCompact}>
        <AppText variant="h2" weight="700">Roaster</AppText>
        <AppText>Loading roaster profile...</AppText>
      </AppScrollScreen>
    );
  }

  if (roasterQuery.isError) {
    return (
      <AppScrollScreen contentContainerStyle={pageStyles.contentCompact}>
        <AppText variant="h2" weight="700">Roaster</AppText>
        <AppText>Could not load roaster profile.</AppText>
      </AppScrollScreen>
    );
  }

  if (!roasterQuery.data) {
    return (
      <AppScrollScreen contentContainerStyle={pageStyles.contentCompact}>
        <AppText variant="h2" weight="700">Roaster</AppText>
        <AppText>Roaster not found.</AppText>
      </AppScrollScreen>
    );
  }

  const roaster = roasterQuery.data;
  const websiteUrl = normalizeExternalUrl(roaster.website);
  const logoUri = resolveSupabaseImageUri(roaster.logo_url);
  const isFollowed = followMutation.isPending
    ? !roaster.isFollowed
    : roaster.isFollowed;

  return (
    <AppScrollScreen contentContainerStyle={[pageStyles.contentCompact, styles.content]}>
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Go back from ${roaster.roaster_short_name ?? roaster.name}`}
          hitSlop={10}
          onPress={goBackOrFallback}
          style={({ pressed }) => [styles.backButton, pressed ? styles.backButtonPressed : null]}
        >
          <AppText variant="h2" weight="400">←</AppText>
        </Pressable>
        <AppText variant="h2" weight="700" accessibilityRole="header" style={styles.headerTitle}>
          {roaster.roaster_short_name ?? roaster.name}
        </AppText>
        <View style={styles.logoWrap}>
          {logoUri ? (
            <Image
              source={{ uri: logoUri }}
              style={styles.logoImage}
              accessibilityLabel={`${roaster.roaster_short_name ?? roaster.name} logo`}
            />
          ) : (
            <View style={styles.logoPlaceholder}>
              <AppText variant="caption" weight="700" tone="secondary">Logo</AppText>
            </View>
          )}
        </View>
      </View>

      <AppText tone="secondary" style={styles.locationText}>
        {[roaster.city, roaster.country].filter(Boolean).join(', ') || 'Location unavailable'}
      </AppText>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <AppText variant="bodySm" weight="400" tone="secondary" style={styles.infoLabel}>
            Location
          </AppText>
          <AppText variant="body" weight="600" style={styles.infoValue}>
            {[roaster.city, roaster.country].filter(Boolean).join(', ') || 'Location unavailable'}
          </AppText>
        </View>

        <View style={styles.infoRow}>
          <AppText variant="bodySm" weight="400" tone="secondary" style={styles.infoLabel}>
            Verification
          </AppText>
          <AppText variant="body" weight="600" style={styles.infoValue}>
            {formatVerificationStatus(roaster.verification_status)}
          </AppText>
        </View>

        <View style={styles.infoRow}>
          <AppText variant="bodySm" weight="400" tone="secondary" style={styles.infoLabel}>
            Description
          </AppText>
          <AppText variant="body" weight="600" style={styles.infoValue}>
            {roaster.description ?? 'No roaster story yet.'}
          </AppText>
        </View>

        <View style={styles.infoRow}>
          <AppText variant="bodySm" weight="400" tone="secondary" style={styles.infoLabel}>
            Website
          </AppText>
          {websiteUrl ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Open website for ${roaster.roaster_short_name ?? roaster.name}`}
              onPress={() => void Linking.openURL(websiteUrl)}
            >
              <AppText variant="body" weight="600" style={[styles.infoValue, styles.websiteLink]}>
                {roaster.website}
              </AppText>
            </Pressable>
          ) : (
            <AppText variant="body" weight="600" tone="secondary" style={styles.infoValue}>
              No website
            </AppText>
          )}
        </View>
      </View>

      <View style={styles.actionWrap}>
        <Pressable
          onPress={() =>
            followMutation.mutate({
              roasterId: roaster.id,
              follow: !roaster.isFollowed,
              source: 'roaster-profile',
            })
          }
          disabled={!userId || followMutation.isPending}
          accessibilityRole="button"
          accessibilityLabel={isFollowed ? 'Following roaster' : 'Follow roaster'}
          accessibilityState={{ disabled: !userId || followMutation.isPending }}
          onHoverIn={() => setIsFollowHovered(true)}
          onHoverOut={() => setIsFollowHovered(false)}
          style={({ pressed }) =>
            followButtonPressableStyle({
              isFollowed,
              pressed,
              hovered: isFollowHovered,
              disabled: !userId || followMutation.isPending,
            })
          }
        >
          {({ pressed }) => (
            <AppText
              variant="body"
              weight="700"
              tone={followButtonLabelTone({ isFollowed, pressed, hovered: isFollowHovered })}
            >
              {isFollowed ? 'Following' : 'Follow Roaster'}
            </AppText>
          )}
        </Pressable>
      </View>

      <View style={styles.section}>
        <AppText variant="h3" weight="700" style={styles.sectionTitle}>
          Roaster Coffees
        </AppText>
        {roasterCoffeesQuery.isLoading ? (
          <AppText tone="secondary">Loading coffees…</AppText>
        ) : roasterCoffeesQuery.isError ? (
          <ScreenError
            title="Could not load roaster coffees"
            message={formatError(roasterCoffeesQuery.error)}
            onRetry={() => void roasterCoffeesQuery.refetch()}
          />
        ) : (roasterCoffeesQuery.data?.length ?? 0) === 0 ? (
          <EmptyState
            title="No public coffees yet"
            description="This roaster has not published any consumer-visible coffees yet."
          />
        ) : (
          <View style={styles.coffeeList}>
            {(roasterCoffeesQuery.data ?? []).map((coffee) => {
              const href =
                coffee.routeKind === 'rated'
                  ? ({ pathname: '/coffee-log/[logId]', params: { logId: coffee.latestCoffeeLogId as string } } as const)
                  : ({ pathname: '/coffee/[hash]', params: { hash: coffee.qrHash } } as const);

              return (
                <Pressable
                  key={coffee.coffeeId}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${coffee.coffeeName} in ${coffee.routeKind === 'rated' ? 'Rated' : 'Discover'}`}
                  onPress={() => router.push(href)}
                  onHoverIn={() => setHoveredCoffeeId(coffee.coffeeId)}
                  onHoverOut={() =>
                    setHoveredCoffeeId((current) => (current === coffee.coffeeId ? null : current))
                  }
                  style={({ pressed }) =>
                    coffeeAppletPressableStyle({
                      pressed,
                      hovered: hoveredCoffeeId === coffee.coffeeId,
                    })
                  }
                >
                  {({ pressed }) => (
                    <>
                    <View style={styles.coffeeAppletTopRow}>
                      <AppText
                        variant="caption"
                        weight="700"
                        tone={coffeeAppletTextTone({ pressed })}
                        style={styles.coffeeAppletEyebrow}
                      >
                        {coffee.routeKind === 'rated' ? 'Rated' : 'Discover'}
                      </AppText>
                    </View>
                    <AppText
                      weight="700"
                      tone={coffeeAppletTextTone({ pressed })}
                      style={styles.coffeeAppletTitle}
                      numberOfLines={2}
                    >
                      {coffee.coffeeName}
                    </AppText>
                    <AppText variant="bodySm" tone={pressed ? 'onPrimary' : 'secondary'} weight="500">
                      {coffee.routeKind === 'rated' ? 'Open your tasting notes' : 'Open coffee details'}
                    </AppText>
                    </>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: visualSystemTokens.spacing.xl * 2,
    gap: visualSystemTokens.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: visualSystemTokens.spacing.sm,
  },
  backButton: {
    minWidth: 28,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonPressed: {
    opacity: 0.65,
  },
  headerTitle: {
    flex: 1,
    fontSize: 34,
    lineHeight: 38,
    maxWidth: '100%',
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: visualSystemTokens.radius.md,
    borderWidth: 1,
    borderColor: visualSystemTokens.colors.borderStrong,
    overflow: 'hidden',
    backgroundColor: visualSystemTokens.colors.surfaceElevated,
    flexShrink: 0,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: visualSystemTokens.colors.surfaceMuted,
  },
  locationText: {
    display: 'none',
  },
  infoCard: {
    gap: visualSystemTokens.spacing.md,
    padding: visualSystemTokens.spacing.lg,
    borderWidth: 1,
    borderColor: visualSystemTokens.colors.borderStrong,
    borderRadius: visualSystemTokens.radius.lg,
    backgroundColor: visualSystemTokens.colors.surfaceElevated,
    shadowColor: visualSystemTokens.colors.borderStrong,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
  },
  infoRow: {
    gap: visualSystemTokens.spacing.xxs,
  },
  infoLabel: {
    textTransform: 'none',
    letterSpacing: 0,
  },
  infoValue: {
    fontSize: visualSystemTokens.typography.bodyLG,
    lineHeight: visualSystemTokens.typography.lineHeight.bodyLG,
  },
  websiteLink: {
    textDecorationLine: 'underline',
  },
  actionWrap: {
    paddingTop: visualSystemTokens.spacing.xs,
  },
  followButtonBase: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: visualSystemTokens.colors.borderStrong,
    borderRadius: visualSystemTokens.radius.lg,
    paddingHorizontal: visualSystemTokens.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonDefault: {
    backgroundColor: visualSystemTokens.colors.accentSecondary,
  },
  followButtonFollowing: {
    backgroundColor: visualSystemTokens.colors.accentPrimary,
  },
  followButtonHovered: {
    backgroundColor: visualSystemTokens.colors.heroPrimary,
  },
  followButtonPressed: {
    backgroundColor: visualSystemTokens.colors.accentPrimaryPressed,
  },
  followButtonDisabled: {
    backgroundColor: visualSystemTokens.colors.accentPrimaryDisabled,
    opacity: 0.65,
  },
  section: {
    gap: visualSystemTokens.spacing.sm,
    paddingTop: visualSystemTokens.spacing.sm,
  },
  sectionTitle: {
    fontSize: 28,
    lineHeight: 32,
  },
  coffeeList: {
    gap: visualSystemTokens.spacing.sm,
  },
  coffeeApplet: {
    alignSelf: 'stretch',
    minHeight: 116,
    paddingHorizontal: visualSystemTokens.spacing.md,
    paddingVertical: visualSystemTokens.spacing.md,
    gap: visualSystemTokens.spacing.xs,
    borderWidth: 1,
    borderColor: visualSystemTokens.colors.borderStrong,
    borderRadius: visualSystemTokens.radius.lg,
    backgroundColor: visualSystemTokens.colors.surfaceElevated,
  },
  coffeeAppletHovered: {
    backgroundColor: visualSystemTokens.colors.heroPrimary,
  },
  coffeeAppletPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: visualSystemTokens.colors.accentPrimaryPressed,
  },
  coffeeAppletTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: visualSystemTokens.spacing.xs,
  },
  coffeeAppletEyebrow: {
    textTransform: 'uppercase',
    letterSpacing: visualSystemTokens.typography.tracking.wide,
  },
  coffeeAppletTitle: {
    fontSize: 25,
    lineHeight: 29,
    textTransform: 'uppercase',
  },
});
