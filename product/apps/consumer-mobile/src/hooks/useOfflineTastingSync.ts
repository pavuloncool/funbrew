import { useEffect, useMemo, useState } from 'react';

import { flushPendingTastings, getFailedTastings, getPendingTastings } from '@funcup/shared';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

import { offlineQueueStorage } from '../services/offlineQueueStorage';
import { refreshPendingTastingDiscoverCoffeeIds } from '../services/pendingTastingDiscoverExclusions';
import { supabase } from '../services/supabaseClient';

export function useOfflineTastingSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const refreshPendingCount = useMemo(
    () => async () => {
      const [pending, failed] = await Promise.all([
        getPendingTastings(offlineQueueStorage),
        getFailedTastings(offlineQueueStorage),
      ]);
      setPendingCount(pending.length);
      setFailedCount(failed.length);
    },
    []
  );

  useEffect(() => {
    void refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      onlineManager.setOnline(online);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isOnline) return;

    let stopped = false;
    const flush = async () => {
      if (stopped) return;
      try {
        await flushPendingTastings({
          storage: offlineQueueStorage,
          supabase,
        });
      } catch {
        // Keep the sync loop alive; queue state is still refreshed below.
      }
      await refreshPendingCount();
      try {
        await refreshPendingTastingDiscoverCoffeeIds();
      } catch {
        // Keep discover filtering best-effort; queue state still refreshes separately.
      }
    };

    void flush();
    const id = setInterval(() => {
      void flush();
    }, 30_000);

    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [isOnline, refreshPendingCount]);

  return { isOnline, pendingCount, failedCount, refreshPendingCount };
}
