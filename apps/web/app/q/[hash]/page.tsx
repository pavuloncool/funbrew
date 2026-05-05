'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { ScanQrResult } from '@funcup/shared';

import { resolveHashStyles } from '../resolve-hash.styles';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; data: ScanQrResult };

export default function ResolveHashPage() {
  const params = useParams<{ hash: string }>();
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    async function resolve() {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        setState({ status: 'error', message: 'Missing NEXT_PUBLIC_SUPABASE_URL.' });
        return;
      }

      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/scan_qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(anonKey
            ? {
                apikey: anonKey,
                Authorization: `Bearer ${anonKey}`,
              }
            : {}),
        },
        body: JSON.stringify({ hash: params.hash }),
      });

      const body = (await response.json()) as unknown;
      if (!response.ok) {
        const msg =
          typeof body === 'object' && body !== null && 'message' in body
            ? String((body as { message?: string }).message)
            : 'Unable to resolve hash.';
        setState({ status: 'error', message: msg });
        return;
      }

      try {
        const raw = body as Record<string, unknown>;
        let data: ScanQrResult;
        if (raw.kind === 'tag' && raw.tag && typeof raw.tag === 'object') {
          data = raw as ScanQrResult;
        } else if (raw.kind === 'batch' && raw.batch && raw.coffee) {
          data = raw as ScanQrResult;
        } else if (raw.batch && raw.coffee) {
          data = { ...(raw as object), kind: 'batch' } as ScanQrResult;
        } else {
          setState({ status: 'error', message: 'Unexpected response from scan.' });
          return;
        }
        setState({ status: 'ok', data });
      } catch {
        setState({ status: 'error', message: 'Unable to parse scan response.' });
      }
    }
    void resolve();
  }, [params.hash]);

  if (state.status === 'loading') {
    return (
      <main className={resolveHashStyles.main}>
        <h1 className={resolveHashStyles.heading}>QR Hash Resolver</h1>
        <p className={resolveHashStyles.bodyText}>
          <strong>Hash:</strong> {params.hash}
        </p>
        <p role="status" aria-live="polite">
          Resolving…
        </p>
      </main>
    );
  }

  if (state.status === 'error') {
    return (
      <main className={resolveHashStyles.main}>
        <h1 className={resolveHashStyles.heading}>QR Hash Resolver</h1>
        <p className={resolveHashStyles.bodyText}>
          <strong>Hash:</strong> {params.hash}
        </p>
        <p role="alert" className={resolveHashStyles.errorAlert}>
          {state.message}
        </p>
      </main>
    );
  }

  const { data } = state;

  if (data.kind === 'tag') {
    const t = data.tag;
    return (
      <main className={resolveHashStyles.main}>
        <h1 className={resolveHashStyles.heading}>Coffee tag</h1>
        <p className={resolveHashStyles.bodyText}>
          <strong>Roaster:</strong> {t.roaster_short_name}
        </p>
        <p>
          <img
            src={t.img_coffee_label}
            alt="Coffee label"
            className={resolveHashStyles.labelImage}
          />
        </p>
        <p className={resolveHashStyles.bodyText}>
          <strong>Trade name:</strong> {t.bean_origin_tradename}
        </p>
        <p className={resolveHashStyles.bodyText}>
          <strong>Origin:</strong> {t.bean_origin_country} · {t.bean_origin_region} ·{' '}
          {t.bean_origin_farm}
        </p>
        <p className={resolveHashStyles.bodyText}>
          <strong>Bean:</strong> {t.bean_type} · {t.bean_varietal_main}{' '}
          {t.bean_varietal_extra ? `· ${t.bean_varietal_extra}` : ''}
        </p>
        <p className={resolveHashStyles.bodyText}>
          <strong>Processing:</strong> {t.bean_processing}
        </p>
        <p className={resolveHashStyles.bodyText}>
          <strong>Roast:</strong> {t.bean_roast_date} ({t.bean_roast_level})
        </p>
        <p className={resolveHashStyles.bodyText}>
          <strong>Brew:</strong> {t.brew_method}
        </p>
        <p className={resolveHashStyles.bodyText}>
          <strong>Elevation:</strong> {t.bean_origin_height} m
        </p>
      </main>
    );
  }

  return (
    <main className={resolveHashStyles.main}>
      <h1 className={resolveHashStyles.heading}>QR Hash Resolver</h1>
      <p className={resolveHashStyles.bodyText}>
        <strong>Hash:</strong> {params.hash}
      </p>
      <p className={resolveHashStyles.bodyText}>
        <strong>Roaster:</strong> {data.roaster?.name ?? 'n/a'}
      </p>
      <p className={resolveHashStyles.bodyText}>
        <strong>Coffee:</strong> {data.coffee?.name ?? 'n/a'}
      </p>
      <p className={resolveHashStyles.bodyText}>
        <strong>Batch:</strong> {data.batch?.lot_number ?? data.batch?.id ?? 'n/a'}
      </p>
    </main>
  );
}
