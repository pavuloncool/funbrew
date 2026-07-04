import { useQuery } from '@tanstack/react-query';

import type { TypedSupabaseClient } from '../services/supabaseClientFactory';
import { logFlowError, normalizeFlowError } from '../errors/flowError';

/** Payload for canonical QR (`qr_codes` → roast batch). */
export type ScanQrBatchResponse = {
  kind: 'batch';
  batch: {
    id: string;
    roast_date: string;
    lot_number: string | null;
    brewing_notes: string | null;
    roaster_story: string | null;
  };
  coffee: {
    id: string;
    name: string;
    variety: string | null;
    varieties: Array<{ id: string; name: string }>;
    processing_method: string | null;
    producer_notes: string | null;
    cover_image_url: string | null;
    store_url: string | null;
  };
  origin: Record<string, unknown> | null;
  roaster: {
    id: string;
    name: string;
    roaster_short_name: string | null;
    city: string | null;
    country: string | null;
    logo_url: string | null;
  };
  stats: {
    total_count: number;
    avg_rating: number;
    rating_distribution: Record<string, number>;
    top_flavor_notes: unknown[];
    favorite_user_count: number;
  };
  archived: boolean;
};

export type ScanQrResult = ScanQrBatchResponse;

function resolveSupabaseHost(client: TypedSupabaseClient): string | null {
  const candidate = (client as unknown as { supabaseUrl?: unknown }).supabaseUrl;
  if (typeof candidate !== 'string' || candidate.trim().length === 0) return null;
  try {
    return new URL(candidate).host;
  } catch {
    return candidate;
  }
}

function parseScanQrResult(raw: unknown): ScanQrResult {
  if (!raw || typeof raw !== 'object') {
    throw normalizeFlowError({
      error: new Error('Invalid scan_qr response'),
      domain: 'scan',
      fallbackMessage: 'Invalid scan_qr response',
    });
  }
  const o = raw as Record<string, unknown>;

  if (o.error && typeof o.error === 'string') {
    throw normalizeFlowError({
      error: {
        message: typeof o.message === 'string' ? o.message : o.error,
        status: typeof o.status === 'number' ? o.status : null,
        code: typeof o.code === 'string' ? o.code : null,
      },
      domain: 'scan',
    });
  }

  if (o.kind === 'batch' && o.batch && o.coffee) {
    return o as ScanQrBatchResponse;
  }

  if (o.batch && o.coffee && typeof o.batch === 'object' && typeof o.coffee === 'object') {
    return { ...(o as Omit<ScanQrBatchResponse, 'kind'>), kind: 'batch' };
  }

  throw normalizeFlowError({
    error: new Error('Unexpected scan_qr response shape'),
    domain: 'scan',
  });
}

export function useCoffeePage(params: {
  supabase: TypedSupabaseClient;
  hash: string | null;
}) {
  const supabaseHost = resolveSupabaseHost(params.supabase);
  return useQuery({
    queryKey: ['coffeePage', params.hash],
    enabled: Boolean(params.hash),
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async (): Promise<ScanQrResult> => {
      try {
        if (!params.hash) {
          throw normalizeFlowError({
            error: new Error('hash is required'),
            domain: 'scan',
            fallbackMessage: 'Missing QR hash.',
          });
        }

        const { data, error } = await params.supabase.functions.invoke<unknown>('scan_qr', {
          body: { hash: params.hash },
        });
        if (error) {
          throw normalizeFlowError({
            error,
            domain: 'scan',
          });
        }
        if (!data) {
          throw normalizeFlowError({
            error: new Error('Empty scan_qr response'),
            domain: 'scan',
          });
        }
        return parseScanQrResult(data);
      } catch (error) {
        const normalized = normalizeFlowError({
          error,
          domain: 'scan',
        });
        logFlowError(normalized, 'useCoffeePage.queryFn', {
          hash: params.hash,
          supabaseHost,
          errorType:
            error instanceof Error
              ? error.name
              : typeof error === 'object' && error !== null
                ? 'object'
                : typeof error,
        });
        throw normalized;
      }
    },
  });
}
