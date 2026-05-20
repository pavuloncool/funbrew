/**
 * Literal Tailwind classes for auth shells on web.
 * Keep static strings so Tailwind JIT can discover them.
 */
export const authWebShellClasses = {
  page: 'min-h-screen bg-vs-canvas text-vs-text-primary',
  screen: 'flex min-h-screen flex-col items-center px-4',
  topSection: 'mt-10 flex w-full max-w-[420px] flex-col items-center',
  title: 'mb-4 text-2xl font-semibold text-vs-text-primary font-display tracking-tight',
  subtitle: 'mb-6 text-center text-sm text-vs-text-secondary',
  socialButton:
    'vs-focus-ring mb-3 flex h-12 w-full cursor-pointer items-center justify-center rounded-vs-md border border-vs-accent-primary bg-vs-accent-primary px-3 text-sm font-semibold text-vs-text-inverse transition-all duration-220 hover:bg-vs-accent-pressed disabled:opacity-50',
  socialButtonText: 'text-sm font-semibold text-vs-text-inverse',
  input:
    'vs-focus-ring mb-3 h-12 w-full max-w-[480px] rounded-vs-sm border border-vs-border-default bg-vs-elevated px-3 text-sm text-vs-text-primary placeholder:text-vs-text-muted',
  registerLink: 'font-semibold text-vs-text-primary underline underline-offset-4',
  fieldLabel: 'mb-1.5 self-stretch text-sm font-semibold text-vs-text-primary',
  err: '-mt-1 mb-2 text-sm text-vs-danger',
} as const;
