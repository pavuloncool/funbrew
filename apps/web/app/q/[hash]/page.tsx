'use client';

import {
  flowErrorUiCopy,
  logFlowError,
  normalizeCoffeePageData,
  normalizeFlowError,
  toCanonicalPublicationFields,
} from '@funcup/shared';
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
        const flowError = normalizeFlowError({
          error: new Error('Missing NEXT_PUBLIC_SUPABASE_URL.'),
          domain: 'scan',
        });
        logFlowError(flowError, 'web.resolve-hash.missing-env');
        setState({ status: 'error', message: flowErrorUiCopy(flowError).message });
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
        const flowError = normalizeFlowError({
          error:
            typeof body === 'object' && body !== null
              ? body
              : { message: 'Unable to resolve hash.', status: response.status },
          domain: 'scan',
          fallbackMessage: 'Unable to resolve hash.',
        });
        logFlowError(flowError, 'web.resolve-hash.http');
        setState({ status: 'error', message: flowErrorUiCopy(flowError).message });
        return;
      }

      try {
        const raw = body as Record<string, unknown>;
        let data: ScanQrResult;
        if (raw.kind === 'batch' && raw.batch && raw.coffee) {
          data = raw as ScanQrResult;
        } else if (raw.batch && raw.coffee) {
          data = { ...(raw as object), kind: 'batch' } as ScanQrResult;
        } else {
          const flowError = normalizeFlowError({
            error: new Error('Unexpected response from scan.'),
            domain: 'scan',
          });
          logFlowError(flowError, 'web.resolve-hash.shape');
          setState({ status: 'error', message: flowErrorUiCopy(flowError).message });
          return;
        }
        setState({ status: 'ok', data });
      } catch (error) {
        const flowError = normalizeFlowError({
          error,
          domain: 'scan',
          fallbackMessage: 'Unable to parse scan response.',
        });
        logFlowError(flowError, 'web.resolve-hash.parse');
        setState({ status: 'error', message: flowErrorUiCopy(flowError).message });
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
  const publicCoffee = normalizeCoffeePageData(data, { hash: params.hash });
  const fields = toCanonicalPublicationFields(publicCoffee);

  return (
    <main className={resolveHashStyles.main}>
      <h1 className={resolveHashStyles.heading}>QR Hash Resolver</h1>
      <p className={resolveHashStyles.bodyText}>
        <strong>Hash:</strong> {params.hash}
      </p>
      <p className={resolveHashStyles.bodyText}>
        <strong>Roaster:</strong> {publicCoffee.roaster.name ?? 'n/a'}
      </p>
      <p className={resolveHashStyles.bodyText}>
        <strong>Coffee:</strong> {fields.coffee.name}
      </p>
      <p className={resolveHashStyles.bodyText}>
        <strong>Batch:</strong> {fields.batch.lotNumber ?? fields.batch.id ?? 'n/a'}
      </p>
    </main>
  );
}
