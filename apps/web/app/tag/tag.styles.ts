import { authWebShellClasses } from '@funcup/shared';

/**
 * Style strony /tag (Tailwind — pełne literały dla JIT).
 * Pola formularza używają tej samej powłoki co {@link authWebShellClasses}.
 */
export const tagStyles = {
  pageShell: `${authWebShellClasses.page} pb-12`,
  contentInner: 'mx-auto w-full max-w-4xl px-4 pt-2',
  pageTitle: 'mb-2 mt-2 text-[22px] font-bold text-vs-text-primary',
  backToHub: 'mb-5 inline-block text-sm font-semibold text-vs-text-primary underline',
  compatibilityBox: 'mb-4 rounded border border-vs-info/30 bg-vs-info/10 p-3',
  compatibilityTitle: 'text-sm font-semibold text-vs-info',
  compatibilityBody: 'mt-1 text-[13px] leading-relaxed text-vs-text-primary',
  compatibilityLink: 'font-semibold underline',

  authGateBox: 'mb-4 rounded border border-vs-warning/40 bg-vs-warning/10 p-3',
  authGateTitle: 'text-sm font-semibold text-vs-warning',
  authGateBody: 'mt-1 text-[13px] text-vs-text-primary',
  authGateLink: 'font-semibold underline',

  roasterGateBox: 'mb-4 rounded border border-vs-danger/30 bg-vs-danger/10 p-3',
  roasterGateTitle: 'text-sm font-semibold text-vs-danger',
  roasterGateBody: 'mt-1 text-[13px] text-vs-text-primary',
  roasterGateCode: 'text-xs',
  roasterGateLinkPrimary: 'mt-2 inline-block text-sm font-semibold underline',
  roasterGateLinkSecondary: 'mt-2 ml-4 inline-block text-sm font-semibold text-vs-text-secondary underline',

  qrPanelWrap: 'min-[480px]:pt-10',
  qrPanelTitle: 'mb-2 text-sm font-semibold text-vs-text-primary',
  qrCard: 'rounded border border-vs-border-default bg-vs-elevated p-3 shadow-sm',
  qrImage: 'mx-auto block h-auto w-full max-w-[240px]',
  qrImagePng: 'mx-auto mt-3 block h-auto w-full max-w-[240px] md:hidden',
  qrUrl: 'mt-2 break-all text-[11px] text-vs-text-secondary',
  qrDownloadBtn:
    'mt-3 w-full rounded border border-vs-accent-primary bg-vs-elevated px-3 py-2 text-sm font-semibold text-vs-text-primary transition hover:bg-vs-surface',
  qrHint: 'text-[13px] leading-relaxed text-vs-text-secondary',
  qrError: 'mt-2 text-sm text-vs-danger',

  successBox: 'mb-4 rounded border border-vs-success/40 bg-vs-success/10 p-3',
  successTitle: 'mb-1 text-sm font-bold text-vs-success',
  successBody: 'text-[13px] leading-relaxed text-vs-text-primary',
  successCode: 'text-xs',
  successDevNote: 'mt-2 text-[11px] text-vs-success',
  successDevMono: 'font-mono text-xs',
  successCta: 'mt-3 rounded border border-vs-accent-primary bg-vs-accent-primary px-3.5 py-2 text-sm font-semibold text-vs-text-inverse',

  errorBox: 'mb-4 rounded border border-vs-danger/30 bg-vs-danger/10 p-3',
  errorTitle: 'mb-2 text-sm font-bold text-vs-danger',
  errorBody: 'text-[13px] leading-relaxed text-vs-text-primary',

  formGrid: 'grid grid-cols-1 gap-8 min-[480px]:grid-cols-[minmax(0,1fr)_260px]',
  formColumn: 'min-w-0 max-w-[480px]',
  formRoot: 'space-y-0',

  filepondWrap: 'mb-[18px]',
  dateRow: 'mb-[18px] flex flex-wrap items-center gap-2',
  datePickerTrigger: `${authWebShellClasses.input} mb-0 flex h-[42px] flex-1 min-w-[200px] justify-between text-left font-normal`,
  datePlaceholder: 'text-vs-text-muted',
  calendarIcon: 'h-4 w-4 shrink-0 opacity-60',
  todayBtn:
    'h-[42px] shrink-0 rounded border border-vs-border-default bg-vs-surface px-3.5 font-bold text-vs-text-primary transition hover:bg-vs-accent-secondaryPressed',
  tastingNotesWrap: 'mb-2 flex max-w-[480px] flex-wrap gap-2',
  tastingDropdown: 'relative mb-2 max-w-[480px]',
  tastingDropdownTrigger:
    'mb-0 min-h-[42px] w-full rounded border border-vs-border-default bg-vs-elevated px-3 py-2 text-left text-[15px] text-vs-text-primary',
  tastingDropdownPanel:
    'absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded border border-vs-border-default bg-vs-elevated p-2 shadow-lg',
  tastingDropdownOption:
    'flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-vs-text-primary hover:bg-vs-surface',
  tastingNoteChip:
    'rounded-full border border-vs-border-default bg-vs-surface px-3 py-1.5 text-sm font-medium text-vs-text-primary transition hover:border-vs-border-strong disabled:cursor-not-allowed disabled:opacity-45',
  tastingNoteChipSelected: 'border-vs-accent-primary bg-vs-accent-primary text-vs-text-inverse',
  tastingNotesHint: 'mb-[18px] text-xs text-vs-text-secondary',

  saveBtn: `${authWebShellClasses.socialButton} mt-2 mb-4 w-full max-w-[480px]`,
  saveBtnSpinner: 'text-vs-text-inverse',
  qrGenerateWrap: 'mb-6',
  qrGenerateBtn: `${authWebShellClasses.socialButton} w-full max-w-[480px]`,
  qrGenerateSpinner: 'text-vs-text-inverse',

  devApiNote: 'mt-4 text-[11px] leading-relaxed text-vs-text-secondary',

  input: authWebShellClasses.input,
  /** Wartość ze skrótu palarni (profil) — tylko odczyt, bez pola edycyjnego */
  readOnlyRoasterName:
    'mb-[18px] min-h-[42px] rounded border border-vs-border-default bg-vs-surface px-3 py-2.5 text-[15px] font-medium leading-snug text-vs-text-primary',
  fieldLabel: authWebShellClasses.fieldLabel,
  err: authWebShellClasses.err,
  socialButtonText: authWebShellClasses.socialButtonText,
} as const;
