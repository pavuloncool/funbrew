import { Link } from 'expo-router';
import { View } from 'react-native';
import { useDiscoverCoffees } from '@funcup/shared';

import { EmptyState } from '../EmptyState';
import { ScreenError } from '../ScreenError';
import { DiscoverListSkeleton } from '../ui/Skeleton';
import { supabase } from '../../services/supabaseClient';
import { AppText } from '../ui/primitives';

import { discoverHubStyles } from './discoverHub.styles';

function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

function matchesSearch(
  coffee: {
    name: string;
    processingMethod: string | null;
    originCountry: string | null;
    roaster: {
      name: string;
      country: string | null;
      city: string | null;
    } | null;
  },
  normalizedQuery: string
): boolean {
  if (!normalizedQuery) return true;
  const values = [
    coffee.name,
    coffee.processingMethod,
    coffee.originCountry,
    coffee.roaster?.name,
    coffee.roaster?.country,
    coffee.roaster?.city,
  ];
  return values.some((value) => value?.toLowerCase().includes(normalizedQuery));
}

export function DiscoverCoffeesTab(props: {
  searchQuery?: string;
  userId?: string | null;
  excludeCoffeeIds?: string[];
}) {
  const coffeesQuery = useDiscoverCoffees({
    supabase,
    userId: props.userId,
    limit: 8,
    excludeCoffeeIds: props.excludeCoffeeIds,
  });

  if (coffeesQuery.isLoading) {
    return <DiscoverListSkeleton rows={4} />;
  }

  if (coffeesQuery.isError) {
    return (
      <ScreenError
        message={formatError(coffeesQuery.error)}
        onRetry={() => void coffeesQuery.refetch()}
      />
    );
  }

  if (!coffeesQuery.data || coffeesQuery.data.length === 0) {
    return (
      <EmptyState
        title="No coffees yet"
        description="When roasters publish batches, they will appear here for you to explore."
      />
    );
  }

  const normalizedQuery = normalizeSearchValue(props.searchQuery ?? '');
  const filteredCoffees = coffeesQuery.data.filter((coffee) =>
    matchesSearch(coffee, normalizedQuery)
  );

  if (filteredCoffees.length === 0) {
    return (
      <EmptyState
        title="No matching coffees"
        description="Try coffee name, roaster, processing, or country."
      />
    );
  }

  return (
    <View style={discoverHubStyles.list} accessibilityRole="list">
      {filteredCoffees.map((coffee) => (
        <View
          key={coffee.id}
          style={discoverHubStyles.card}
          accessibilityRole="text"
          accessibilityLabel={`${coffee.name}, ${coffee.roaster?.name ?? 'Unknown roaster'}`}
        >
          <AppText variant="body" weight="600">{coffee.name}</AppText>
          <AppText tone="secondary">
            {coffee.roaster?.name ?? 'Unknown roaster'}
            {coffee.processingMethod ? ` · ${coffee.processingMethod}` : ''}
            {coffee.originCountry ? ` · Origin: ${coffee.originCountry}` : ''}
          </AppText>
          <Link
            href={{ pathname: '/coffee/[hash]', params: { hash: coffee.qrHash } }}
            accessibilityRole="link"
            accessibilityLabel={`Open coffee page for ${coffee.name}`}
          >
            Open Coffee Page
          </Link>
        </View>
      ))}
    </View>
  );
}
