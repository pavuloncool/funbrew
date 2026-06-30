/** Wspólne style ekranów (auth): logowanie, rejestracja, pending (Tailwind). */
export const authPagesStyles = {
  main420: 'mx-auto max-w-[420px] px-4 py-10 font-sans text-vs-text-primary',
  main620: 'mx-auto max-w-[620px] px-4 py-10 font-sans text-vs-text-primary',
  title: 'mb-4 text-2xl font-semibold text-vs-text-primary',
  notice: 'mb-4 rounded border border-vs-border-default bg-vs-elevated px-3 py-2 text-sm text-vs-text-primary',
  form: 'grid gap-3',
  input: 'w-full rounded border border-vs-border-default px-2 py-1.5 text-sm',
  submitBtn:
    'rounded-full border-2 border-vs-border-strong bg-vs-hero-primary px-5 py-2 text-sm font-semibold text-vs-text-primary shadow-vs-sm transition-all duration-220 hover:bg-vs-hero-primary/90 active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-55',
  error: 'text-sm text-vs-danger',
  footer: 'mt-4 text-sm text-vs-text-secondary',
} as const;
