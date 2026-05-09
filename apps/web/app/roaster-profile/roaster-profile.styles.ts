import { authWebShellClasses } from '@funcup/shared';

/** Style ekranu profilu palarni (web). Łańcuchy Tailwind dosłowne — JIT. */
export const roasterProfileStyles = {
  pageWithPad: `${authWebShellClasses.page} pb-14`,
  narrowContent: 'mx-auto w-full max-w-[1200px] px-6 pt-6',
  narrowContentMain: 'mx-auto w-full max-w-[1200px] px-6 pt-6',
  mutedSmall: 'text-base text-vs-text-secondary',
  errorSmall: 'text-base text-vs-danger',
  pageTitle: 'mb-3 mt-2 font-display text-5xl uppercase tracking-[-0.03em] text-vs-text-primary',
  backToHub: 'mb-6 inline-flex items-center text-xl font-semibold text-vs-text-primary underline underline-offset-4',
  viewCard: 'rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-8 shadow-vs-sm',
  viewModeHint: 'mb-5 text-lg text-vs-text-secondary',
  dlRoot: 'grid gap-4 text-xl text-vs-text-primary md:grid-cols-2',
  dlTerm: 'font-display text-2xl uppercase tracking-[-0.02em]',
  incompleteBanner: 'mt-5 rounded-vs-md border-2 border-vs-danger/30 bg-vs-danger/10 p-4 text-base text-vs-danger shadow-vs-sm',
  editCta: 'vs-button-primary mt-8 mb-0 w-full max-w-[520px] py-3 text-3xl font-display uppercase tracking-[-0.02em]',
  ctaText: authWebShellClasses.socialButtonText,
  formCard: 'max-w-[760px] rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-8 shadow-vs-sm',
  formIntro: 'mb-5 text-lg text-vs-text-secondary',
  submitError: 'mt-2 mb-4 text-base text-vs-danger',
  saveCta: 'vs-button-primary mt-3 mb-0 w-full max-w-[520px] py-3 text-2xl font-display uppercase tracking-[-0.02em]',
  cancelButton:
    'vs-button-secondary mt-3 w-full max-w-[520px] py-3 text-xl font-semibold',
  fieldWrap: 'mb-4',
  fieldLabel: authWebShellClasses.fieldLabel,
  fieldInput: `${authWebShellClasses.input} mb-1 h-12 text-base`,
  fieldError: '-mt-1 mb-1 text-sm text-vs-danger',
} as const;
