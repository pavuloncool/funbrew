'use client';

import { flowErrorUiCopy, listRoasterBatchPublications, normalizeFlowError } from '@funcup/shared';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useRoasterProfile } from '@/src/hooks/useRoasterProfile';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

import { roasterHubStyles } from './roaster-hub.styles';

type Tile = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
};

type WeeklyAnalyticsLogRow = {
  batch_id: string;
  rating: number;
  logged_at: string;
};

type TopCoffeeLastWeek = {
  coffeeName: string;
  avgRating: number;
  tastingCount: number;
};

function formatSystemDate(value: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

function buildLastWeekTopCoffee(
  logs: WeeklyAnalyticsLogRow[],
  coffeeNameByBatchId: Map<string, string>
): TopCoffeeLastWeek | null {
  const aggregate = new Map<string, { ratingSum: number; tastingCount: number }>();

  for (const log of logs) {
    const coffeeName = coffeeNameByBatchId.get(log.batch_id)?.trim();
    if (!coffeeName) continue;

    const current = aggregate.get(coffeeName) ?? { ratingSum: 0, tastingCount: 0 };
    current.ratingSum += log.rating;
    current.tastingCount += 1;
    aggregate.set(coffeeName, current);
  }

  let topCoffee: TopCoffeeLastWeek | null = null;

  for (const [coffeeName, stats] of aggregate.entries()) {
    if (stats.tastingCount === 0) continue;
    const avgRating = Number((stats.ratingSum / stats.tastingCount).toFixed(2));
    const candidate: TopCoffeeLastWeek = {
      coffeeName,
      avgRating,
      tastingCount: stats.tastingCount,
    };

    if (
      !topCoffee ||
      candidate.avgRating > topCoffee.avgRating ||
      (candidate.avgRating === topCoffee.avgRating && candidate.tastingCount > topCoffee.tastingCount) ||
      (candidate.avgRating === topCoffee.avgRating &&
        candidate.tastingCount === topCoffee.tastingCount &&
        candidate.coffeeName.localeCompare(topCoffee.coffeeName) < 0)
    ) {
      topCoffee = candidate;
    }
  }

  return topCoffee;
}

function isAnalyticsFlowError(value: unknown): value is { domain: 'analytics' } {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'domain' in value &&
      (value as { domain?: unknown }).domain === 'analytics'
  );
}

export default function RoasterHubPage() {
  const router = useRouter();
  const { loading, exists, complete, profile, requiresPasswordChange, error } = useRoasterProfile();
  const [batchCount, setBatchCount] = useState<number | null>(null);
  const [topCoffeeLastWeek, setTopCoffeeLastWeek] = useState<TopCoffeeLastWeek | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [systemNow, setSystemNow] = useState<Date | null>(null);
  const [systemDate, setSystemDate] = useState('');

  useEffect(() => {
    if (loading) return;
    if (requiresPasswordChange || !exists || !complete) {
      router.replace('/roaster-profile');
    }
  }, [complete, exists, loading, requiresPasswordChange, router]);

  useEffect(() => {
    const now = new Date();
    setSystemNow(now);
    setSystemDate(formatSystemDate(now));
  }, []);

  useEffect(() => {
    if (loading || requiresPasswordChange || !exists || !complete || !systemNow) {
      setBatchCount(null);
      setTopCoffeeLastWeek(null);
      setSummaryError(null);
      return;
    }

    let cancelled = false;
    setBatchCount(null);
    setTopCoffeeLastWeek(null);
    setSummaryError(null);

    void (async () => {
      try {
        const records = await listRoasterBatchPublications(supabaseBrowser);
        if (cancelled) return;

        setBatchCount(records.length);

        if (records.length === 0) {
          setTopCoffeeLastWeek(null);
          return;
        }

        const coffeeNameByBatchId = new Map(
          records.map((record) => [record.batchId, record.coffeeName] as const)
        );
        const batchIds = records.map((record) => record.batchId);
        const lastWeekStart = new Date(systemNow);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);

        const { data: analyticsLogs, error: analyticsError } = await supabaseBrowser
          .from('coffee_logs')
          .select('batch_id, rating, logged_at')
          .in('batch_id', batchIds)
          .gte('logged_at', lastWeekStart.toISOString())
          .lte('logged_at', systemNow.toISOString());

        if (analyticsError) {
          throw normalizeFlowError({
            error: analyticsError,
            domain: 'analytics',
          });
        }

        if (cancelled) return;

        const topCoffee = buildLastWeekTopCoffee(
          ((analyticsLogs ?? []) as WeeklyAnalyticsLogRow[]).filter(
            (log) => typeof log.batch_id === 'string' && typeof log.rating === 'number'
          ),
          coffeeNameByBatchId
        );
        setTopCoffeeLastWeek(topCoffee);
      } catch (nextError) {
        if (cancelled) return;

        const normalized = normalizeFlowError({
          error: nextError,
          domain: isAnalyticsFlowError(nextError) ? 'analytics' : 'batch_publication',
        });
        setSummaryError(flowErrorUiCopy(normalized).message);
        setTopCoffeeLastWeek(null);

        if (normalized.domain === 'batch_publication') {
          setBatchCount(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [complete, exists, loading, requiresPasswordChange, systemNow]);

  if (loading) {
    return (
      <div className={roasterHubStyles.pageWithPad}>
        <div className={roasterHubStyles.narrowContent}>
          <p className={roasterHubStyles.mutedSmall}>Ładowanie roaster hub…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={roasterHubStyles.pageWithPad}>
        <div className={roasterHubStyles.narrowContent}>
          <p className={roasterHubStyles.errorSmall}>Błąd: {error}</p>
        </div>
      </div>
    );
  }

  if (requiresPasswordChange || !exists || !complete) {
    return (
      <div className={roasterHubStyles.pageWithPad}>
        <div className={roasterHubStyles.narrowContent}>
          <p className={roasterHubStyles.mutedSmall}>Przekierowanie do profilu palarni…</p>
        </div>
      </div>
    );
  }

  const tiles: Tile[] = [
    {
      label: 'Add Coffee Batch',
      onClick: () => router.push('/roaster-hub/batches/new'),
    },
    {
      label: 'Batch Manager',
      onClick: () => router.push('/roaster-hub/batches'),
    },
    {
      label: 'Batch analytics',
      onClick: () => router.push('/roaster-hub/analytics'),
    },
    {
      label: 'Roaster profile',
      onClick: () => router.push('/roaster-profile'),
    },
  ];

  const shortName = profile?.roaster_short_name || 'Roaster';
  const customerNumber = profile?.customer_number ?? '—';
  const logoAlt = `${profile?.company_name ?? shortName} logo`;
  const logoFallback = shortName.slice(0, 2).toUpperCase();
  const coffeeCountLabel = batchCount === null ? '—' : String(batchCount);
  const topCoffeeLabel = topCoffeeLastWeek?.coffeeName ?? 'No tastings';
  const topCoffeeAverageLabel = topCoffeeLastWeek
    ? `${topCoffeeLastWeek.avgRating.toFixed(2)} avg from ${topCoffeeLastWeek.tastingCount} tastings`
    : null;

  return (
    <div className={roasterHubStyles.pageWithPad}>
      <div className={roasterHubStyles.narrowContentTop}>
        {/* –– to jest sekcja hero, która była w oryginalnym projekcie, ale w trakcie testów okazało się, że nie spełnia swojej roli i jest bardziej rozpraszająca niż zachęcająca. Na razie ją ukrywam, ale zostawiam w kodzie, bo może kiedyś wróci w jakiejś innej formie
        <section className={roasterHubStyles.splitHero}>
          <div className={roasterHubStyles.leftPanel}>
            <div>
              <span className={roasterHubStyles.heroEyebrow}>Roaster workspace</span>
              <h1 className={roasterHubStyles.hubTitle}>{shortName} roasts data delivered by fun•brew.</h1>
              <p className={roasterHubStyles.hubSubtitle}>
                Publish canonical batches, manage the batch list and monitor consumer signals in one place.
                Everything below is optimized for the core beta-demo loop.
              </p>

              <div className={roasterHubStyles.actionRow}>
                <button
                  type="button"
                  className={roasterHubStyles.primaryCta}
                  onClick={() => router.push('/roaster-hub/batches/new')}
                >
                  Publish batch
                  <span aria-hidden>↗</span>
                </button>
                <button
                  type="button"
                  className={roasterHubStyles.secondaryCta}
                  onClick={() => router.push('/roaster-hub/analytics')}
                >
                  Open analytics
                  <span aria-hidden>→</span>
                </button>
              </div>
            </div>
          </div>

          <div className={roasterHubStyles.rightPanel}>
            <div className={roasterHubStyles.rightCard}>
              <p className={roasterHubStyles.rightCardTitle}>Beta ready</p>
              <p className={roasterHubStyles.rightCardBody}>
                Canonical publish flow, QR resolution, tasting logs and batch analytics are now aligned in one visual system.
              </p>
            </div>
            {useOriginalCircleHeroDecor ? (
              <>
                <div className={roasterHubStyles.rightDecoA} aria-hidden />
                <div className={roasterHubStyles.rightDecoB} aria-hidden />
                <div className={roasterHubStyles.rightDecoC} aria-hidden />
              </>
            ) : (
              <>
                <div className={`${roasterHubStyles.rightDevice} ${roasterHubStyles.rightDeviceMoka}`}>
                  <MokaPotGraphic />
                </div>
                <div className={`${roasterHubStyles.rightDevice} ${roasterHubStyles.rightDeviceV60}`}>
                  <V60Graphic />
                </div>
                <div className={`${roasterHubStyles.rightDevice} ${roasterHubStyles.rightDeviceAeropress}`}>
                  <AeropressGraphic />
                </div>
              </>
            )}
          </div>
        </section>*/}

        <section className={roasterHubStyles.summaryApplet}>
          <div className={roasterHubStyles.summaryIntro}>
            {profile?.logo_url ? (
              <div className={roasterHubStyles.summaryLogoFrame}>
                <img src={profile.logo_url} alt={logoAlt} className={roasterHubStyles.summaryLogoImage} />
              </div>
            ) : (
              <div className={roasterHubStyles.summaryLogoFallback} aria-hidden>
                {logoFallback}
              </div>
            )}
            <div className={roasterHubStyles.summaryMeta}>
              <span className={roasterHubStyles.summaryEyebrow}>Roaster Dashboard</span>
              <h1 className={roasterHubStyles.summaryTitle}>{shortName}</h1>
              <div className={roasterHubStyles.summaryAccountMeta}>
                <span className={roasterHubStyles.summaryCustomerLabel}>Numer klienta</span>
                <span className={roasterHubStyles.summaryCustomerDivider} aria-hidden>
                  --
                </span>
                <span className={roasterHubStyles.summaryCustomerValue}>{customerNumber}</span>
              </div>
            </div>
          </div>

          <div className={roasterHubStyles.summaryStatGrid}>
            <article className={roasterHubStyles.summaryStatCard}>
              <span className={roasterHubStyles.summaryStatLabel}>Today is</span>
              <strong className={roasterHubStyles.summaryStatValue}>{systemDate || '—'}</strong>
            </article>
            <article className={roasterHubStyles.summaryStatCard}>
              <span className={roasterHubStyles.summaryStatLabel}>Top of last week</span>
              <strong className={roasterHubStyles.summaryStatValue}>{topCoffeeLabel}</strong>
              {topCoffeeAverageLabel ? (
                <span className={roasterHubStyles.summaryStatMeta}>{topCoffeeAverageLabel}</span>
              ) : null}
            </article>
            <article className={roasterHubStyles.summaryStatCard}>
              <span className={roasterHubStyles.summaryStatLabel}>Your fun•brew coffees</span>
              <strong className={roasterHubStyles.summaryStatValue}>{coffeeCountLabel}</strong>
            </article>
          </div>

          {summaryError ? <p className={roasterHubStyles.summaryError}>{summaryError}</p> : null}
        </section>

        <section className={roasterHubStyles.tileSection}>
          <h2 className={roasterHubStyles.tileSectionTitle}>What&apos;s your next move?</h2>
          <div className={roasterHubStyles.tileGrid}>
            {tiles.map((tile) => (
              <button
                key={tile.label}
                type="button"
                className={`${roasterHubStyles.hubTile} ${
                  tile.disabled ? roasterHubStyles.hubTileDisabled : roasterHubStyles.hubTileEnabled
                }`}
                onClick={tile.onClick}
                disabled={tile.disabled}
                aria-disabled={tile.disabled}
              >
                <span className={roasterHubStyles.hubTileLabel}>{tile.label}</span>
                <span className={roasterHubStyles.hubTileArrow} aria-hidden>
                  ↗
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
