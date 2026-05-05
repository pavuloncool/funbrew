import { useQuery } from '@tanstack/react-query';

import type { RoasterCoffeeTagRow } from '@funcup/types';

import type { TypedSupabaseClient } from '../services/supabaseClientFactory';

/** Payload for a legacy / batch QR (`qr_codes` → roast batch). */
export type ScanQrBatchResponse = {
  kind: 'batch';
  batch: {
    id: string;
    roast_date: string;
    lot_number: string | null;
    status: string;
    brewing_notes: string | null;
    roaster_story: string | null;
  };
  coffee: {
    id: string;
    name: string;
    variety: string | null;
    processing_method: string | null;
    producer_notes: string | null;
    cover_image_url: string | null;
    status: string;
  };
  origin: Record<string, unknown> | null;
  roaster: {
    id: string;
    name: string;
    city: string | null;
    country: string | null;
    logo_url: string | null;
  };
  stats: {
    total_count: number;
    avg_rating: number;
    rating_distribution: Record<string, number>;
    top_flavor_notes: unknown[];
  };
  archived: boolean;
};

/** Payload when QR resolves to a `roaster_coffee_tags` row (`public_hash`). */
export type ScanQrTagResponse = {
  kind: 'tag';
  tag: RoasterCoffeeTagRow;
  tasting_notes?: Array<{
    id: string;
    name: string;
    label: string;
    category: string;
  }>;
  archived: false;
};

export type ScanQrResult = ScanQrBatchResponse | ScanQrTagResponse;

function parseScanQrResult(raw: unknown): ScanQrResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid scan_qr response');
  }
  const o = raw as Record<string, unknown>;

  if (o.error && typeof o.error === 'string') {
    throw new Error(
      typeof o.message === 'string' ? o.message : o.error
    );
  }

  if (o.kind === 'tag' && o.tag && typeof o.tag === 'object') {
    return o as ScanQrTagResponse;
  }

  if (o.kind === 'batch' && o.batch && o.coffee) {
    return o as ScanQrBatchResponse;
  }

  if (o.batch && o.coffee && typeof o.batch === 'object' && typeof o.coffee === 'object') {
    return { ...(o as Omit<ScanQrBatchResponse, 'kind'>), kind: 'batch' };
  }

  throw new Error('Unexpected scan_qr response shape');
}

export function useCoffeePage(params: {
  supabase: TypedSupabaseClient;
  hash: string | null;
}) {
  return useQuery({
    queryKey: ['coffeePage', params.hash],
    enabled: Boolean(params.hash),
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async (): Promise<ScanQrResult> => {
      if (!params.hash) throw new Error('hash is required');
      const { data, error } = await params.supabase.functions.invoke<unknown>('scan_qr', {
        body: { hash: params.hash },
      });
      if (error) throw error;
      if (!data) throw new Error('Empty scan_qr response');
      return parseScanQrResult(data);
    },
  });
}
