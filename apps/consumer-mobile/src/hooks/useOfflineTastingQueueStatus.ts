import { useEffect, useState } from 'react';
import { getFailedTastings, getPendingTastings } from '@funcup/shared';

import { offlineQueueStorage } from '../services/offlineQueueStorage';

type OfflineQueueStatus = {
  pendingCount: number;
  failedCount: number;
};

export function useOfflineTastingQueueStatus(): OfflineQueueStatus {
  const [status, setStatus] = useState<OfflineQueueStatus>({
    pendingCount: 0,
    failedCount: 0,
  });

  useEffect(() => {
    let stopped = false;

    const refresh = async () => {
      try {
        const [pending, failed] = await Promise.all([
          getPendingTastings(offlineQueueStorage),
          getFailedTastings(offlineQueueStorage),
        ]);
        if (stopped) return;
        setStatus({
          pendingCount: pending.length,
          failedCount: failed.length,
        });
      } catch {
        if (stopped) return;
        setStatus({ pendingCount: 0, failedCount: 0 });
      }
    };

    void refresh();
    const intervalId = setInterval(() => {
      void refresh();
    }, 15_000);

    return () => {
      stopped = true;
      clearInterval(intervalId);
    };
  }, []);

  return status;
}
