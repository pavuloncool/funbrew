import { authWebShellClasses } from '@funcup/shared';

/** Style ekranu profilu palarni (web). Łańcuchy Tailwind dosłowne — JIT. */
export const roasterProfileStyles = {
  pageWithPad: `${authWebShellClasses.page} pb-12`,
  narrowContent: 'mx-auto w-full max-w-4xl px-4 pt-4',
  narrowContentMain: 'mx-auto w-full max-w-4xl px-4 pt-2',
  mutedSmall: 'text-sm text-neutral-600',
  errorSmall: 'text-sm text-red-600',
  pageTitle: 'mb-2 mt-2 text-[22px] font-bold text-neutral-900',
  backToHub: 'mb-5 inline-block text-sm font-semibold text-neutral-900 underline',
  viewCard: 'rounded border border-neutral-300 bg-white p-4',
  viewModeHint: 'mb-3 text-sm text-neutral-700',
  dlRoot: 'space-y-2 text-sm text-neutral-900',
  dlTerm: 'font-semibold',
  incompleteBanner: 'mt-4 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700',
  editCta: `${authWebShellClasses.socialButton} mt-5 mb-0 w-full max-w-[480px]`,
  ctaText: authWebShellClasses.socialButtonText,
  formCard: 'max-w-[480px] rounded border border-neutral-300 bg-white p-4',
  formIntro: 'mb-4 text-sm text-neutral-700',
  submitError: 'mt-1 mb-3 text-xs text-red-600',
  saveCta: `${authWebShellClasses.socialButton} mt-2 mb-0 w-full max-w-[480px]`,
  cancelButton:
    'mt-3 w-full rounded border border-neutral-400 bg-white px-3 py-2 text-sm font-medium text-neutral-900',
  fieldWrap: 'mb-3',
  fieldLabel: authWebShellClasses.fieldLabel,
  fieldInput: `${authWebShellClasses.input} mb-1`,
  fieldError: '-mt-1 mb-1 text-xs text-red-600',
} as const;
