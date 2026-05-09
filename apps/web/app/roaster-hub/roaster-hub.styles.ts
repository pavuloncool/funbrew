import { authWebShellClasses } from '@funcup/shared';

/**
 * Roaster Hub shell inspired by Wero's split hero language.
 */
export const roasterHubStyles = {
  pageWithPad: `${authWebShellClasses.page} pb-16`,
  narrowContent: 'mx-auto w-full max-w-[1480px] px-6 pt-6',
  narrowContentTop: 'mx-auto w-full max-w-[1480px] px-6 pt-6',
  mutedSmall: 'text-base text-vs-text-secondary',
  errorSmall: 'text-base text-vs-danger',

  splitHero: 'grid grid-cols-1 border-2 border-vs-border-strong bg-vs-surface lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]',
  leftPanel: 'flex min-h-[620px] flex-col justify-between border-b-2 border-vs-border-strong p-8 lg:border-b-0 lg:border-r-2 lg:p-12',
  rightPanel: 'relative min-h-[620px] overflow-hidden bg-vs-hero-primary p-8 lg:p-12',
  heroEyebrow: 'inline-flex w-fit items-center rounded-full border-2 border-vs-border-strong bg-vs-accent-secondary px-4 py-1 text-sm font-semibold uppercase tracking-wide text-vs-text-primary shadow-vs-sm',
  hubTitle: 'mt-6 max-w-[780px] font-display text-[74px] uppercase leading-[0.95] tracking-[-0.04em] text-vs-text-primary lg:text-[100px]',
  hubSubtitle: 'mt-6 max-w-[640px] text-xl leading-relaxed text-vs-text-secondary',
  actionRow: 'mt-8 flex flex-wrap gap-4',
  primaryCta:
    'vs-button-primary inline-flex items-center gap-2 text-lg font-semibold',
  secondaryCta:
    'vs-button-secondary inline-flex items-center gap-2 text-lg font-semibold',

  rightCard: 'absolute left-8 top-8 z-10 w-[min(520px,calc(100%-64px))] rounded-vs-md border-2 border-vs-border-strong bg-vs-accent-secondary p-5 shadow-vs-md',
  rightCardTitle: 'font-display text-3xl uppercase leading-none text-vs-text-primary',
  rightCardBody: 'mt-3 text-base leading-relaxed text-vs-text-primary',
  rightDecoA: 'absolute -right-20 top-24 h-72 w-72 rounded-full border-2 border-vs-border-strong bg-vs-hero-secondary/80',
  rightDecoB: 'absolute bottom-10 right-10 h-56 w-56 rounded-full border-2 border-vs-border-strong bg-vs-accent-secondary/75',
  rightDecoC: 'absolute bottom-20 left-10 h-44 w-44 rounded-full border-2 border-vs-border-strong bg-vs-elevated/70',

  tileSection: 'mt-8 border-2 border-vs-border-strong bg-vs-elevated p-6 lg:p-8',
  tileSectionTitle: 'font-display text-4xl uppercase tracking-[-0.03em] text-vs-text-primary lg:text-5xl',
  tileGrid: 'mt-6 grid grid-cols-1 gap-4 md:grid-cols-2',
  hubTile:
    'mb-0 flex min-h-[124px] w-full cursor-pointer items-center justify-between rounded-vs-md border-2 border-vs-border-strong bg-vs-surface px-6 text-left text-[20px] font-semibold text-vs-text-primary shadow-vs-sm transition-all duration-220 hover:-translate-y-0.5 hover:bg-vs-accent-secondary active:translate-y-[1px] active:shadow-none',
  hubTileDisabled: 'cursor-not-allowed opacity-55',
  hubTileEnabled: 'hover:bg-vs-accent-secondary',
  hubTileLabel: 'font-display text-[32px] uppercase leading-none tracking-[-0.02em] text-vs-text-primary',
  hubTileArrow: 'inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-vs-border-strong bg-vs-elevated text-xl text-vs-text-primary',
} as const;
