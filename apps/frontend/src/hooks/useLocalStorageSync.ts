import { useState, useEffect, useCallback } from 'react';

interface PendingTasting {
  id: string;
  batch_id: string;
  rating: number;
  brew_method_id?: string;
  brew_time_seconds?: number;
  tasting_note_ids: string[];
  free_text_notes?: string;
  review?: string;
  created_at: string;
}

interface LocalStorageSyncOptions {
  storageKey?: string;
  maxQueueSize?: number;
}

const DEFAULT_OPTIONS: LocalStorageSyncOptions = {
  storageKey: 'funcup_pending_tastings',
  maxQueueSize: 50,
};

export function useLocalStorageSync(options: LocalStorageSyncOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [pendingTastings, setPendingTastings] = useState<PendingTasting[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(opts.storageKey);
    if (stored) {
      try {
        setPendingTastings(JSON.parse(stored));
      } catch {
        console.error('Failed to parse pending tastings from localStorage');
      }
    }
  }, [opts.storageKey]);

  useEffect(() => {
    localStorage.setItem(opts.storageKey, JSON.stringify(pendingTastings));
  }, [pendingTastings, opts.storageKey]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addPendingTasting = useCallback((tasting: Omit<PendingTasting, 'id' | 'created_at'>) => {
    setPendingTastings(prev => {
      if (prev.length >= opts.maxQueueSize) {
        const oldest = prev[0];
        console.warn(`Pending tastings queue full (${opts.maxQueueSize}). Oldest pending: ${oldest.id}`);
        return prev;
      }
      return [...prev, {
        ...tasting,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      }];
    });
  }, [opts.maxQueueSize]);

  const removePendingTasting = useCallback((id: string) => {
    setPendingTastings(prev => prev.filter(t => t.id !== id));
  }, []);

  const syncPendingTastings = useCallback(async (getAuthToken: () => Promise<string | null>) => {
    if (!isOnline || pendingTastings.length === 0 || isSyncing) {
      return { synced: 0, failed: 0 };
    }

    setIsSyncing(true);
    let synced = 0;
    let failed = 0;

    for (const tasting of pendingTastings) {
      try {
        const token = await getAuthToken();
        if (!token) {
          failed++;
          continue;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log-tasting`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              batch_id: tasting.batch_id,
              rating: tasting.rating,
              brew_method_id: tasting.brew_method_id,
              brew_time_seconds: tasting.brew_time_seconds,
              tasting_note_ids: tasting.tasting_note_ids,
              free_text_notes: tasting.free_text_notes,
              review: tasting.review,
            }),
          }
        );

        if (response.ok) {
          removePendingTasting(tasting.id);
          synced++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error('Failed to sync tasting:', error);
        failed++;
      }
    }

    setIsSyncing(false);
    return { synced, failed };
  }, [isOnline, pendingTastings, isSyncing, removePendingTasting]);

  useEffect(() => {
    if (!isOnline || pendingTastings.length === 0) return;

    const syncInterval = setInterval(() => {
      syncPendingTastings(async () => localStorage.getItem('funcup_token'));
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [isOnline, pendingTastings.length, syncPendingTastings]);

  return {
    pendingTastings,
    isOnline,
    isSyncing,
    addPendingTasting,
    removePendingTasting,
    syncPendingTastings,
    pendingCount: pendingTastings.length,
  };
}

export function createOfflineTasting(
  batchId: string,
  rating: number,
  options: {
    brewMethodId?: string;
    brewTimeSeconds?: number;
    tastingNoteIds?: string[];
    freeTextNotes?: string;
    review?: string;
  }
): Omit<PendingTasting, 'id' | 'created_at'> {
  return {
    batch_id: batchId,
    rating,
    brew_method_id: options.brewMethodId,
    brew_time_seconds: options.brewTimeSeconds,
    tasting_note_ids: options.tastingNoteIds || [],
    free_text_notes: options.freeTextNotes,
    review: options.review,
  };
}