import { getPendingTastings } from '@funcup/shared';

import { offlineQueueStorage } from './offlineQueueStorage';
import { supabase } from './supabaseClient';

type RoastBatchCoffeeRow = {
  id: string;
  coffee_id: string;
};

type PendingDiscoverCoffeeIdsListener = (coffeeIds: string[]) => void;

const listeners = new Set<PendingDiscoverCoffeeIdsListener>();
let cachedPendingDiscoverCoffeeIds: string[] = [];

function normalizeCoffeeIds(coffeeIds: string[]): string[] {
  return Array.from(
    new Set(
      coffeeIds
        .map((coffeeId) => coffeeId.trim())
        .filter((coffeeId) => coffeeId.length > 0)
    )
  ).sort();
}

function emitPendingDiscoverCoffeeIds() {
  for (const listener of listeners) {
    listener(cachedPendingDiscoverCoffeeIds);
  }
}

export function getCachedPendingTastingDiscoverCoffeeIds(): string[] {
  return cachedPendingDiscoverCoffeeIds;
}

export function subscribePendingTastingDiscoverCoffeeIds(
  listener: PendingDiscoverCoffeeIdsListener
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function addPendingTastingDiscoverCoffeeId(coffeeId: string) {
  const nextCoffeeIds = normalizeCoffeeIds([...cachedPendingDiscoverCoffeeIds, coffeeId]);
  if (nextCoffeeIds.join(',') === cachedPendingDiscoverCoffeeIds.join(',')) {
    return;
  }
  cachedPendingDiscoverCoffeeIds = nextCoffeeIds;
  emitPendingDiscoverCoffeeIds();
}

export async function loadPendingTastingDiscoverCoffeeIds(): Promise<string[]> {
  const pendingTastings = await getPendingTastings(offlineQueueStorage);
  const batchIds = Array.from(new Set(pendingTastings.map((item) => item.batchId)));

  if (batchIds.length === 0) {
    cachedPendingDiscoverCoffeeIds = [];
    return cachedPendingDiscoverCoffeeIds;
  }

  const { data, error } = await supabase
    .from('roast_batches')
    .select('id,coffee_id')
    .in('id', batchIds);

  if (error) {
    throw error;
  }

  cachedPendingDiscoverCoffeeIds = normalizeCoffeeIds(
    ((data ?? []) as RoastBatchCoffeeRow[]).map((row) => row.coffee_id)
  );

  return cachedPendingDiscoverCoffeeIds;
}

export async function refreshPendingTastingDiscoverCoffeeIds(): Promise<string[]> {
  const coffeeIds = await loadPendingTastingDiscoverCoffeeIds();
  emitPendingDiscoverCoffeeIds();
  return coffeeIds;
}
