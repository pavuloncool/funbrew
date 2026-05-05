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
      label: 'Dodaj kawę',
      onClick: () => router.push('/tag'),
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
      label: 'Analytics',
      disabled: true,
    },
  ];

  const shortName = profile?.roaster_short_name || 'Roaster';

  return (
    <div className={roasterHubStyles.pageWithPad}>
      <div className={roasterHubStyles.narrowContentTop}>
        <h1 className={roasterHubStyles.hubTitle}>{shortName}</h1>
        <p className={roasterHubStyles.hubSubtitle}>Wybierz sekcję palarni</p>

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
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
