'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useRoasterProfile } from '@/src/hooks/useRoasterProfile';

import { roasterHubStyles } from './roaster-hub.styles';

type Tile = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
};

export default function RoasterHubPage() {
  const router = useRouter();
  const { loading, exists, complete, profile, error } = useRoasterProfile();

  useEffect(() => {
    if (loading) return;
    if (!exists || !complete) {
      router.replace('/roaster-profile');
    }
  }, [complete, exists, loading, router]);

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

  if (!exists || !complete) {
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
      label: 'Publikuj batch MVP',
      onClick: () => router.push('/roaster-hub/coffees/new'),
    },
    {
      label: 'Profil palarni',
      onClick: () => router.push('/roaster-profile'),
    },
    {
      label: 'Coffee Bank',
      onClick: () => router.push('/coffee-bank'),
    },
    {
      label: 'User data analytics',
      onClick: () => router.push('/roaster-hub/analytics'),
    },
  ];

  const shortName = profile?.roaster_short_name || 'Roaster';

  return (
    <div className={roasterHubStyles.pageWithPad}>
      <div className={roasterHubStyles.narrowContentTop}>
        <section className={roasterHubStyles.splitHero}>
          <div className={roasterHubStyles.leftPanel}>
            <div>
              <span className={roasterHubStyles.heroEyebrow}>Roaster workspace</span>
              <h1 className={roasterHubStyles.hubTitle}>{shortName} moves faster with funcup</h1>
              <p className={roasterHubStyles.hubSubtitle}>
                Publish batches, keep your coffee bank synced and monitor consumer signals in one place.
                Everything below is optimized for the core beta-demo loop.
              </p>

              <div className={roasterHubStyles.actionRow}>
                <button
                  type="button"
                  className={roasterHubStyles.primaryCta}
                  onClick={() => router.push('/roaster-hub/coffees/new')}
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
            <div className={roasterHubStyles.rightDecoA} aria-hidden />
            <div className={roasterHubStyles.rightDecoB} aria-hidden />
            <div className={roasterHubStyles.rightDecoC} aria-hidden />
          </div>
        </section>

        <section className={roasterHubStyles.tileSection}>
          <h2 className={roasterHubStyles.tileSectionTitle}>Choose your next action</h2>
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
