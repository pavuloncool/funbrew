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

const useOriginalCircleHeroDecor = true;

function MokaPotGraphic() {
  return (
    <svg viewBox="0 0 240 240" className="h-full w-full" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="6.5">
        <path d="M112 24h16l10 18h-36z" />
        <path d="M58 86h124" />
        <path d="M72 86l28 74h40l28-74" />
        <path d="M98 86l6 74" />
        <path d="M142 86l-6 74" />
        <path d="M104 160h32" />
        <path d="M100 160l-16 54" />
        <path d="M140 160l16 54" />
        <path d="M84 214h72" />
        <path d="M68 86l-24 18 28 40" />
        <path d="M172 90c12 0 22 3 28 9 6 6 9 15 9 25 0 12-3 28-10 47-4 12-8 24-10 36" />
        <path d="M188 207c-9 0-14-5-14-14s5-14 14-14h2" />
        <path d="M58 86l48-14h28l48 14" />
        <path d="M98 72l14-18h16l14 18" />
      </g>
    </svg>
  );
}

function V60Graphic() {
  return (
    <svg viewBox="0 0 240 240" className="h-full w-full" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="6.5">
        <path d="M48 44h144" />
        <path d="M68 44l26 34" />
        <path d="M172 44l-26 34" />
        <path d="M94 78l18 74" />
        <path d="M146 78l-18 74" />
        <path d="M112 78v74" />
        <path d="M76 78h72" />
        <path d="M96 152h32" />
        <path d="M82 152l-8 18" />
        <path d="M142 152l8 18" />
        <path d="M74 170h76" />
        <path d="M88 170l-8 28" />
        <path d="M136 170l8 28" />
        <path d="M80 198h64" />
      </g>
    </svg>
  );
}

function AeropressGraphic() {
  return (
    <svg viewBox="0 0 240 240" className="h-full w-full" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="6.5">
        <path d="M96 24h48" />
        <path d="M108 24V10h24v14" />
        <path d="M92 38h56" />
        <path d="M98 38v40" />
        <path d="M142 38v40" />
        <path d="M84 78h72" />
        <path d="M92 78l-10 90h76l-10-90" />
        <path d="M78 168h84" />
        <path d="M84 168l-8 28h88l-8-28" />
        <path d="M92 196h56" />
        <path d="M156 92h16c8 0 14 6 14 14v18c0 8-6 14-14 14h-10" />
        <path d="M78 92h-10c-8 0-14 6-14 14v10c0 8 6 14 14 14h10" />
      </g>
    </svg>
  );
}

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
      label: 'Add Coffee Batch',
      onClick: () => router.push('/roaster-hub/coffees/new'),
    },
    {
      label: 'Roaster profile',
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
              <h1 className={roasterHubStyles.hubTitle}>{shortName} uses data from fun•brew.</h1>
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
