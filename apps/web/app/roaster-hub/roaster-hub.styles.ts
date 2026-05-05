import { authWebShellClasses } from '@funcup/shared';

/**
 * Style specyficzne dla roaster hub (ładowanie, kafelki).
 * Łańcuchy Tailwind muszą być dosłowne w tym pliku (JIT).
 */
export const roasterHubStyles = {
  pageWithPad: `${authWebShellClasses.page} pb-12`,
  narrowContent: 'mx-auto w-full max-w-4xl px-4 pt-4',
  narrowContentTop: 'mx-auto w-full max-w-4xl px-4 pt-2',
  mutedSmall: 'text-sm text-neutral-600',
  errorSmall: 'text-sm text-red-600',
  hubTitle: 'mb-2 mt-2 text-[22px] font-bold text-neutral-900',
  hubSubtitle: 'mb-6 text-sm text-neutral-700',
  tileGrid: 'grid grid-cols-1 gap-4 min-[480px]:grid-cols-2',
  /** Bazuje na tej samej semantyce co authWebShellClasses.socialButton; sufiks pod kafelki hub. */
  hubTile:
    'mb-0 flex h-24 w-full cursor-pointer items-center justify-center rounded border border-neutral-300 bg-white text-left text-[15px] font-medium text-neutral-900 transition hover:bg-neutral-100',
  hubTileDisabled: 'cursor-not-allowed opacity-55',
  hubTileEnabled: 'hover:bg-neutral-100',
  hubTileLabel: 'px-2 text-[17px] font-semibold text-neutral-900',
} as const;
