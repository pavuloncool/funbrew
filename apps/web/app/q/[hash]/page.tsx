'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { resolveHashStyles } from '../resolve-hash.styles';

const FALLBACK_DELAY_MS = 1400;

type HandoffStatus = 'opening-app' | 'redirecting-store' | 'manual';
type Platform = 'ios' | 'android' | 'unknown';

function normalizeConfiguredUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function detectPlatform(userAgent: string): Platform {
  const normalized = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(normalized)) return 'ios';
  if (normalized.includes('android')) return 'android';
  return 'unknown';
}

export default function ResolveHashPage() {
  const params = useParams<{ hash: string }>();
  const hash = typeof params.hash === 'string' ? params.hash : '';
  const deepLinkUrl = useMemo(() => `funcup://q/${encodeURIComponent(hash)}`, [hash]);
  const iosStoreUrl = normalizeConfiguredUrl(process.env.NEXT_PUBLIC_APP_STORE_URL);
  const androidStoreUrl = normalizeConfiguredUrl(process.env.NEXT_PUBLIC_PLAY_STORE_URL);
  const [status, setStatus] = useState<HandoffStatus>('opening-app');
  const [detectedPlatform, setDetectedPlatform] = useState<Platform>('unknown');

  const primaryStoreUrl = useMemo(() => {
    if (detectedPlatform === 'ios') return iosStoreUrl;
    if (detectedPlatform === 'android') return androidStoreUrl;
    return null;
  }, [androidStoreUrl, detectedPlatform, iosStoreUrl]);

  useEffect(() => {
    if (!hash) {
      setStatus('manual');
      return;
    }

    const platform = detectPlatform(window.navigator.userAgent);
    setDetectedPlatform(platform);

    let appSwitchSucceeded = false;

    const markAppSwitch = () => {
      if (document.visibilityState === 'hidden') {
        appSwitchSucceeded = true;
      }
    };

    const handlePageHide = () => {
      appSwitchSucceeded = true;
    };

    document.addEventListener('visibilitychange', markAppSwitch);
    window.addEventListener('pagehide', handlePageHide);

    const fallbackTimer = window.setTimeout(() => {
      if (appSwitchSucceeded) return;

      const storeUrl =
        platform === 'ios' ? iosStoreUrl : platform === 'android' ? androidStoreUrl : null;

      if (storeUrl) {
        setStatus('redirecting-store');
        window.location.replace(storeUrl);
        return;
      }

      setStatus('manual');
    }, FALLBACK_DELAY_MS);

    window.location.assign(deepLinkUrl);

    return () => {
      window.clearTimeout(fallbackTimer);
      document.removeEventListener('visibilitychange', markAppSwitch);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [androidStoreUrl, deepLinkUrl, hash, iosStoreUrl]);

  const statusCopy =
    status === 'redirecting-store'
      ? 'The app did not open, so we are sending you to the store.'
      : status === 'manual'
        ? 'The app did not open automatically. Use the app link or install buttons below.'
        : 'We are trying to open this coffee in the fun•brew app now.';

  return (
    <div className={resolveHashStyles.page}>
      <main className={resolveHashStyles.main}>
        <section className={resolveHashStyles.hero}>
          <p className={resolveHashStyles.eyebrow}>smart link</p>
          <h1 className={resolveHashStyles.heading}>Open this coffee in fun•brew</h1>
          <p className={resolveHashStyles.subheading} role="status" aria-live="polite">
            {statusCopy}
          </p>
        </section>

        <section className={resolveHashStyles.statusCard}>
          <p className={resolveHashStyles.factLabel}>QR handoff</p>
          <p className={resolveHashStyles.factValue}>Hash {hash || 'Unavailable'}</p>
          <p className={resolveHashStyles.helperText}>
            The QR opens the mobile tasting flow. This web page no longer renders batch details.
          </p>
        </section>

        <section className={resolveHashStyles.actionsCard}>
          <a href={deepLinkUrl} className={resolveHashStyles.primaryAction}>
            Open in app
          </a>

          <div className={resolveHashStyles.secondaryActions}>
            {iosStoreUrl ? (
              <a href={iosStoreUrl} className={resolveHashStyles.secondaryAction}>
                Download on the App Store
              </a>
            ) : null}
            {androidStoreUrl ? (
              <a href={androidStoreUrl} className={resolveHashStyles.secondaryAction}>
                Get it on Google Play
              </a>
            ) : null}
          </div>

          {!primaryStoreUrl ? (
            <p className={resolveHashStyles.helperText}>
              Store fallback is not configured for this device yet. Ask the roaster for the latest
              fun•brew beta install link.
            </p>
          ) : null}
        </section>

        <section className={resolveHashStyles.statusCard}>
          <p className="text-sm text-vs-text-secondary">
            Looking for the roaster workspace?{' '}
            <Link href="/login" className="font-medium text-vs-text-primary underline">
              Sign in to fun•brew
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
