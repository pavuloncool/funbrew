import { useCallback, useEffect, useState } from 'react';

import {
  getCachedPendingTastingDiscoverCoffeeIds,
  refreshPendingTastingDiscoverCoffeeIds,
  subscribePendingTastingDiscoverCoffeeIds,
} from '../services/pendingTastingDiscoverExclusions';

export function usePendingTastingDiscoverCoffeeIds(params?: { enabled?: boolean }) {
  const enabled = params?.enabled ?? true;
  const [coffeeIds, setCoffeeIds] = useState<string[]>(() =>
    enabled ? getCachedPendingTastingDiscoverCoffeeIds() : []
  );
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setCoffeeIds([]);
      setIsLoading(false);
      return [];
    }

    setIsLoading(true);
    try {
      const nextCoffeeIds = await refreshPendingTastingDiscoverCoffeeIds();
      setCoffeeIds(nextCoffeeIds);
      return nextCoffeeIds;
    } catch {
      const cachedCoffeeIds = getCachedPendingTastingDiscoverCoffeeIds();
      setCoffeeIds(cachedCoffeeIds);
      return cachedCoffeeIds;
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setCoffeeIds([]);
      setIsLoading(false);
      return;
    }

    setCoffeeIds(getCachedPendingTastingDiscoverCoffeeIds());
    void refresh();
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    return subscribePendingTastingDiscoverCoffeeIds((nextCoffeeIds) => {
      setCoffeeIds(nextCoffeeIds);
    });
  }, [enabled]);

  return { coffeeIds, isLoading, refresh };
}
