import { authWebShellClasses } from '@funcup/shared';

/**
 * Style strony /coffee-bank (roaster-app, Tailwind — pełne literały dla JIT).
 */
export const coffeeBankStyles = {
  pageShell: `${authWebShellClasses.page} pb-12`,
  contentInner: 'mx-auto w-full max-w-6xl px-4 pt-2',
  pageTitle: 'mb-2 mt-2 text-[22px] font-bold text-neutral-900',
  backToHub: 'mb-5 inline-block text-sm font-semibold text-neutral-900 underline',

  authGateBox: 'mb-4 rounded border border-amber-300 bg-amber-50 p-3',
  authGateTitle: 'text-sm font-semibold text-amber-900',
  authGateBody: 'mt-1 text-[13px] text-neutral-900',
  authGateLink: 'font-semibold underline',

  roasterGateBox: 'mb-4 rounded border border-red-200 bg-red-50 p-3',
  roasterGateTitle: 'text-sm font-semibold text-red-700',
  roasterGateBody: 'mt-1 text-[13px] text-neutral-900',
  roasterGateCode: 'text-xs',
  roasterGateLinkPrimary: 'mt-2 inline-block text-sm font-semibold underline',
  roasterGateLinkSecondary: 'mt-2 ml-4 inline-block text-sm font-semibold text-neutral-700 underline',

  twoColumnGrid:
    'grid grid-cols-1 gap-8 min-[900px]:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] min-[900px]:items-start',
  leftColumn: 'min-w-0',
  rightColumn: 'min-w-0 min-[900px]:sticky min-[900px]:top-4',

  tableTitle: 'mb-3 text-sm font-semibold text-neutral-900',
  tableScroll: 'overflow-x-auto rounded border border-neutral-300 bg-white shadow-sm',
  table: 'w-full min-w-[320px] border-collapse text-left text-sm',
  tableHeadRow: 'border-b border-neutral-200 bg-neutral-100',
  tableTh: 'px-3 py-2.5 font-semibold text-neutral-900',
  tableThBtn:
    'inline-flex w-full items-center gap-1 rounded text-left font-semibold text-neutral-900 hover:underline focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1',
  /** Łącz z {@link tableThBtn} gdy kolumna jest aktywna w sortowaniu */
  tableThBtnActive: 'text-neutral-900',
  sortIcon: 'text-xs text-neutral-600',
  tableBody: 'bg-white',
  tableTr: 'border-b border-neutral-200 last:border-0',
  tableTrSelected: 'bg-neutral-100',
  tableTd: 'px-3 py-2.5 align-middle text-neutral-900',
  tableTdAction: 'px-3 py-2.5 align-middle text-right text-neutral-900',
  nameLink:
    'rounded text-left font-medium text-neutral-900 underline decoration-neutral-900 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1',
  editLink:
    'inline-block rounded border border-neutral-300 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-900 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1',

  loadingText: 'text-sm text-neutral-600',
  errorBox: 'mb-4 rounded border border-red-200 bg-red-50 p-3',
  errorText: 'text-sm text-red-700',
  emptyText: 'text-sm text-neutral-600',

  productCard: 'rounded border border-neutral-300 bg-white p-4 shadow-sm',
  productCardTitle: 'mb-3 text-base font-bold text-neutral-900',
  productImageWrap: 'mb-4',
  productImage: 'max-h-64 w-full rounded object-contain',
  productSection: 'mb-3 text-[13px] leading-relaxed text-neutral-900',
  productStrong: 'font-semibold text-neutral-900',
  productEmpty: 'text-sm text-neutral-600',

  qrBlock: 'mt-6 border-t border-neutral-200 pt-4',
  qrTitle: 'mb-2 text-sm font-semibold text-neutral-900',
  qrCard: 'rounded border border-neutral-300 bg-neutral-50 p-3',
  qrImage: 'mx-auto block h-auto w-full max-w-[240px]',
  qrImagePng: 'mx-auto mt-3 block h-auto w-full max-w-[240px] min-[900px]:hidden',
  qrUrl: 'mt-2 break-all text-[11px] text-neutral-600',
  qrDownloadBtn:
    'mt-3 w-full rounded border border-neutral-900 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100',
  qrLoading: 'text-sm text-neutral-600',
  qrError: 'mt-2 text-sm text-red-600',

  devApiNote: 'mt-4 text-[11px] leading-relaxed text-neutral-600',
} as const;
