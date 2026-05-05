'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import {
  getBrowserSessionSafely,
  getBrowserUserSafely,
} from '@/src/lib/supabase/browserAuth';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

import { hubCrudStyles } from '../../../../hub-crud.styles';

type BatchDetails = {
  id: string;
  coffee_id: string;
  lot_number: string;
  roast_date: string;
  status: string;
  brewing_notes: string | null;
  roaster_story: string | null;
};

type CoffeeDetails = {
  id: string;
  name: string;
  roaster_id: string;
};

type QrPreview = {
  created: boolean;
  hash: string;
  lotNumber: string;
  url: string;
  svg: string;
  png: string;
};

export default function BatchDetailsPage() {
  const params = useParams<{ id: string; batchId: string }>();
  const [batch, setBatch] = useState<BatchDetails | null>(null);
  const [coffee, setCoffee] = useState<CoffeeDetails | null>(null);
  const [qrPreview, setQrPreview] = useState<QrPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const user = await getBrowserUserSafely();

      if (!user) {
        if (!cancelled) {
          setError('Please log in again.');
          setLoading(false);
        }
        return;
      }

      const { data: roaster } = await supabaseBrowser
        .from('roasters')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const roasterRow = roaster as { id: string } | null;
      if (!roasterRow) {
        if (!cancelled) {
          setError('Roaster profile is required.');
          setLoading(false);
        }
        return;
      }

      const { data: batchData, error: batchError } = await supabaseBrowser
        .from('roast_batches')
        .select('id, coffee_id, lot_number, roast_date, status, brewing_notes, roaster_story')
        .eq('id', params.batchId)
        .maybeSingle();

      if (cancelled) return;

      if (batchError || !batchData) {
        setError(batchError?.message ?? 'Batch not found.');
        setLoading(false);
        return;
      }

      const batchRow = batchData as BatchDetails;

      const { data: coffeeData, error: coffeeError } = await supabaseBrowser
        .from('coffees')
        .select('id, name, roaster_id')
        .eq('id', batchRow.coffee_id)
        .maybeSingle();

      if (cancelled) return;

      if (coffeeError || !coffeeData) {
        setError(coffeeError?.message ?? 'Coffee not found for this batch.');
        setLoading(false);
        return;
      }

      const coffeeRow = coffeeData as CoffeeDetails;
      if (coffeeRow.roaster_id !== roasterRow.id) {
        setError('This batch does not belong to your roastery.');
        setLoading(false);
        return;
      }

      const { data: qrData } = await supabaseBrowser
        .from('qr_codes')
        .select('hash, qr_url')
        .eq('batch_id', params.batchId)
        .maybeSingle();

      if (cancelled) return;

      setBatch(batchRow);
      setCoffee(coffeeRow);
      if (qrData) {
        setQrPreview({
          created: false,
          hash: (qrData as { hash: string }).hash,
          lotNumber: batchRow.lot_number,
          url: (qrData as { qr_url: string }).qr_url,
          svg: '',
          png: '',
        });
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [params.batchId]);

  const generateQr = useCallback(async () => {
    setQrError(null);
    setQrLoading(true);
    try {
      const session = await getBrowserSessionSafely();
      if (!session?.access_token) {
        throw new Error('Missing auth session.');
      }
      const res = await fetch('/api/batch-qr', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchId: params.batchId }),
      });
      const body = (await res.json()) as
        | QrPreview
        | { error?: string; message?: string };
      if (!res.ok) {
        throw new Error(body && 'message' in body ? body.message : 'Unable to generate QR.');
      }
      setQrPreview(body as QrPreview);
    } catch (nextError) {
      setQrError(nextError instanceof Error ? nextError.message : 'Unable to generate QR.');
    } finally {
      setQrLoading(false);
    }
  }, [params.batchId]);

  const downloadSvg = useCallback(() => {
    if (!qrPreview?.svg) return;
    const blob = new Blob([qrPreview.svg], { type: 'image/svg+xml' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `batch-${params.batchId}.svg`;
    a.click();
    URL.revokeObjectURL(href);
  }, [params.batchId, qrPreview]);

  if (loading) {
    return (
      <main className={hubCrudStyles.main760}>
        <p className={hubCrudStyles.muted}>Loading batch details…</p>
      </main>
    );
  }

  return (
    <main className={hubCrudStyles.main760}>
      <h1 className={hubCrudStyles.pageHeading}>Batch details</h1>
      {error ? <p className={hubCrudStyles.error}>{error}</p> : null}
      {batch && coffee ? (
        <>
          <p className={hubCrudStyles.bodyText}>
            <strong className={hubCrudStyles.bodyStrong}>Coffee:</strong> {coffee.name}
          </p>
          <p className={hubCrudStyles.bodyText}>
            <strong className={hubCrudStyles.bodyStrong}>Lot number:</strong> {batch.lot_number}
          </p>
          <p className={hubCrudStyles.bodyText}>
            <strong className={hubCrudStyles.bodyStrong}>Roast date:</strong> {batch.roast_date}
          </p>
          <p className={hubCrudStyles.bodyText}>
            <strong className={hubCrudStyles.bodyStrong}>Brewing notes:</strong>{' '}
            {batch.brewing_notes ?? '—'}
          </p>
          <p className={hubCrudStyles.bodyText}>
            <strong className={hubCrudStyles.bodyStrong}>Roaster story:</strong>{' '}
            {batch.roaster_story ?? '—'}
          </p>

          <div className="mt-5 rounded border border-neutral-300 bg-white p-4">
            <p className={`${hubCrudStyles.bodyStrong} mb-2`}>Public QR</p>
            <p className={`${hubCrudStyles.muted} mb-3`}>
              Canonical batch flow now generates its own public `/q/{'{hash}'}` link instead of delegating to `/tag`.
            </p>
            <button
              type="button"
              className={hubCrudStyles.submitBtn}
              onClick={() => void generateQr()}
              disabled={qrLoading}
            >
              {qrLoading ? 'Generating…' : qrPreview?.hash ? 'Refresh QR preview' : 'Generate public QR'}
            </button>

            {qrPreview?.url ? (
              <div className="mt-4 space-y-2 text-sm">
                <p>
                  <strong>Hash:</strong> {qrPreview.hash}
                </p>
                <p className="break-all">
                  <strong>Public URL:</strong> {qrPreview.url}
                </p>
                {qrPreview.svg ? (
                  <div className="space-y-3">
                    <div
                      className="max-w-[240px]"
                      dangerouslySetInnerHTML={{ __html: qrPreview.svg }}
                    />
                    <button
                      type="button"
                      className={hubCrudStyles.submitBtn}
                      onClick={downloadSvg}
                    >
                      Download SVG
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {qrError ? <p className={hubCrudStyles.error}>{qrError}</p> : null}
          </div>

          <p className="mt-5">
            <Link href={`/roaster-hub/analytics/${params.batchId}`} className={hubCrudStyles.actionLink}>
              Batch analytics
            </Link>
          </p>
          <p>
            <Link href={`/roaster-hub/coffees/${params.id}`} className={hubCrudStyles.actionLink}>
              Back to coffee
            </Link>
          </p>
        </>
      ) : null}
    </main>
  );
}
