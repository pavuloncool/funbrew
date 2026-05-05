import { authWebShellClasses } from '@funcup/shared';

/**
 * Style strony /tag (Tailwind — pełne literały dla JIT).
 * Pola formularza używają tej samej powłoki co {@link authWebShellClasses}.
 */
export const tagStyles = {
  pageShell: `${authWebShellClasses.page} pb-12`,
  contentInner: 'mx-auto w-full max-w-4xl px-4 pt-2',
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

  qrPanelWrap: 'min-[480px]:pt-10',
  qrPanelTitle: 'mb-2 text-sm font-semibold text-neutral-900',
  qrCard: 'rounded border border-neutral-300 bg-white p-3 shadow-sm',
  qrImage: 'mx-auto block h-auto w-full max-w-[240px]',
  qrImagePng: 'mx-auto mt-3 block h-auto w-full max-w-[240px] md:hidden',
  qrUrl: 'mt-2 break-all text-[11px] text-neutral-600',
  qrDownloadBtn:
    'mt-3 w-full rounded border border-neutral-900 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100',
  qrHint: 'text-[13px] leading-relaxed text-neutral-600',
  qrError: 'mt-2 text-sm text-red-600',

  successBox: 'mb-4 rounded border border-emerald-300 bg-emerald-50 p-3',
  successTitle: 'mb-1 text-sm font-bold text-emerald-900',
  successBody: 'text-[13px] leading-relaxed text-neutral-900',
  successCode: 'text-xs',
  successDevNote: 'mt-2 text-[11px] text-emerald-900',
  successDevMono: 'font-mono text-xs',
  successCta: 'mt-3 rounded border border-neutral-900 bg-neutral-900 px-3.5 py-2 text-sm font-semibold text-white',

  errorBox: 'mb-4 rounded border border-red-200 bg-red-50 p-3',
  errorTitle: 'mb-2 text-sm font-bold text-red-700',
  errorBody: 'text-[13px] leading-relaxed text-neutral-900',

  formGrid: 'grid grid-cols-1 gap-8 min-[480px]:grid-cols-[minmax(0,1fr)_260px]',
  formColumn: 'min-w-0 max-w-[480px]',
  formRoot: 'space-y-0',

  filepondWrap: 'mb-[18px]',
  dateRow: 'mb-[18px] flex flex-wrap items-center gap-2',
  datePickerTrigger: `${authWebShellClasses.input} mb-0 flex h-[42px] flex-1 min-w-[200px] justify-between text-left font-normal`,
  datePlaceholder: 'text-neutral-500',
  calendarIcon: 'h-4 w-4 shrink-0 opacity-60',
  todayBtn:
    'h-[42px] shrink-0 rounded border border-neutral-400 bg-neutral-100 px-3.5 font-bold text-neutral-900 transition hover:bg-neutral-200',
  tastingNotesWrap: 'mb-2 flex max-w-[480px] flex-wrap gap-2',
  tastingDropdown: 'relative mb-2 max-w-[480px]',
  tastingDropdownTrigger:
    'mb-0 min-h-[42px] w-full rounded border border-neutral-300 bg-white px-3 py-2 text-left text-[15px] text-neutral-900',
  tastingDropdownPanel:
    'absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded border border-neutral-300 bg-white p-2 shadow-lg',
  tastingDropdownOption:
    'flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-neutral-900 hover:bg-neutral-100',
  tastingNoteChip:
    'rounded-full border border-neutral-300 bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-800 transition hover:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-45',
  tastingNoteChipSelected: 'border-neutral-900 bg-neutral-900 text-white',
  tastingNotesHint: 'mb-[18px] text-xs text-neutral-600',

  saveBtn: `${authWebShellClasses.socialButton} mt-2 mb-4 w-full max-w-[480px]`,
  saveBtnSpinner: 'text-white',
  qrGenerateWrap: 'mb-6',
  qrGenerateBtn: `${authWebShellClasses.socialButton} w-full max-w-[480px]`,
  qrGenerateSpinner: 'text-white',

  devApiNote: 'mt-4 text-[11px] leading-relaxed text-neutral-600',

  input: authWebShellClasses.input,
  /** Wartość ze skrótu palarni (profil) — tylko odczyt, bez pola edycyjnego */
  readOnlyRoasterName:
    'mb-[18px] min-h-[42px] rounded border border-neutral-300 bg-neutral-100 px-3 py-2.5 text-[15px] font-medium leading-snug text-neutral-900',
  fieldLabel: authWebShellClasses.fieldLabel,
  err: authWebShellClasses.err,
  socialButtonText: authWebShellClasses.socialButtonText,
} as const;
