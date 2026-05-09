import { authWebShellClasses } from '@funcup/shared';

/**
 * Style strony /coffee-bank (roaster-app, Tailwind — pełne literały dla JIT).
 */
export const coffeeBankStyles = {
  pageShell: `${authWebShellClasses.page} pb-14`,
  contentInner: 'mx-auto w-full max-w-[1500px] px-6 pt-6',
  pageTitle: 'mb-3 mt-2 font-display text-5xl uppercase tracking-[-0.03em] text-vs-text-primary',
  backToHub: 'mb-6 inline-flex items-center text-xl font-semibold text-vs-text-primary underline underline-offset-4',

  compatibilityBox: 'mb-6 rounded-vs-md border-2 border-vs-border-strong bg-vs-surface p-5 shadow-vs-sm',
  compatibilityTitle: 'font-display text-3xl uppercase tracking-[-0.02em] text-vs-text-primary',
  compatibilityBody: 'mt-2 text-lg text-vs-text-primary',
  compatibilityLink: 'font-semibold underline',
  inlineCode: 'rounded border border-vs-border-default bg-vs-elevated px-1.5 py-0.5 text-base',

  authGateBox: 'mb-5 rounded-vs-md border-2 border-vs-warning/40 bg-vs-warning/10 p-5 shadow-vs-sm',
  authGateTitle: 'font-display text-2xl uppercase tracking-[-0.02em] text-vs-warning',
  authGateBody: 'mt-2 text-base text-vs-text-primary',
  authGateLink: 'font-semibold underline',

  roasterGateBox: 'mb-5 rounded-vs-md border-2 border-vs-danger/30 bg-vs-danger/10 p-5 shadow-vs-sm',
  roasterGateTitle: 'font-display text-2xl uppercase tracking-[-0.02em] text-vs-danger',
  roasterGateBody: 'mt-2 text-base text-vs-text-primary',
  roasterGateCode: 'text-sm',
  roasterGateLinkPrimary: 'vs-button-primary mt-4 inline-block px-5 py-2 text-base font-semibold',

  twoColumnGrid:
    'grid grid-cols-1 gap-8 min-[1080px]:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] min-[1080px]:items-start',
  leftColumn: 'min-w-0',
  rightColumn: 'min-w-0 min-[900px]:sticky min-[900px]:top-4',

  tableTitle: 'mb-4 font-display text-4xl uppercase tracking-[-0.02em] text-vs-text-primary',
  tableScroll: 'overflow-x-auto rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated shadow-vs-sm',
  table: 'w-full min-w-[320px] border-collapse text-left text-lg',
  tableHeadRow: 'border-b-2 border-vs-border-strong bg-vs-surface',
  tableTh: 'px-5 py-3.5 font-display text-3xl uppercase tracking-[-0.02em] text-vs-text-primary',
  tableThBtn:
    'inline-flex w-full items-center gap-1 rounded text-left font-semibold text-vs-text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-vs-hero-primary focus:ring-offset-1',
  tableThBtnActive: 'text-vs-text-primary',
  sortIcon: 'text-lg text-vs-text-secondary',
  tableBody: 'bg-vs-elevated',
  tableTr: 'border-b-2 border-vs-border-subtle/40 last:border-0',
  tableTrSelected: 'bg-vs-surface',
  tableTd: 'px-5 py-4 align-middle text-vs-text-primary',
  tableTdAction: 'px-5 py-4 align-middle text-center text-vs-text-primary',
  nameLink:
    'rounded text-left font-medium text-vs-text-primary underline decoration-vs-text-primary hover:text-vs-text-secondary focus:outline-none focus:ring-2 focus:ring-vs-hero-primary focus:ring-offset-1',
  editLink:
    'vs-button-secondary inline-flex min-w-[132px] items-center justify-center whitespace-nowrap px-5 py-2 text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-vs-hero-primary focus:ring-offset-1',

  loadingText: 'text-base text-vs-text-secondary',
  errorBox: 'mb-4 rounded-vs-md border-2 border-vs-danger/30 bg-vs-danger/10 p-5 shadow-vs-sm',
  errorText: 'text-base text-vs-danger',
  emptyText: 'text-base text-vs-text-secondary',

  productCard: 'rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-6 shadow-vs-sm',
  productCardTitle: 'mb-4 font-display text-4xl uppercase tracking-[-0.02em] text-vs-text-primary',
  productImageWrap: 'mb-4',
  productImage: 'max-h-64 w-full rounded object-contain',
  productSection: 'mb-3 text-base leading-relaxed text-vs-text-primary',
  productStrong: 'font-semibold text-vs-text-primary',
  productEmpty: 'text-base text-vs-text-secondary',

  actionRow: 'mb-4 flex flex-wrap gap-2',
  actionLink:
    'vs-button-secondary inline-block px-5 py-2 text-base font-semibold',

  qrBlock: 'mt-6 border-t border-vs-border-subtle/30 pt-4',
  qrTitle: 'mb-2 text-sm font-semibold text-vs-text-primary',
  qrCard: 'rounded-vs-md border-2 border-vs-border-strong bg-vs-surface p-4 shadow-vs-sm',
  qrImage: 'mx-auto block h-auto w-full max-w-[240px]',
  qrImagePng: 'mx-auto mt-3 block h-auto w-full max-w-[240px] min-[900px]:hidden',
  qrUrl: 'mt-2 break-all text-[11px] text-vs-text-secondary',
  qrDownloadBtn: 'vs-button-primary mt-3 px-5 py-2 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60',
  qrActionRow: 'mt-2 flex flex-wrap gap-2',
  qrLoading: 'text-sm text-vs-text-secondary',
  qrError: 'mt-2 text-sm text-vs-danger',

  devApiNote: 'mt-4 text-sm leading-relaxed text-vs-text-secondary',
} as const;
