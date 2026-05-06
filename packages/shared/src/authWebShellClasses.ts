/**
 * Literal Tailwind classes for auth shells on web.
 * Keep static strings so Tailwind JIT can discover them.
 */
export const authWebShellClasses = {
  page: 'min-h-screen bg-neutral-50 text-neutral-900',
  screen: 'flex min-h-screen flex-col items-center px-4',
  topSection: 'mt-10 flex w-full max-w-[420px] flex-col items-center',
  title: 'mb-4 text-2xl font-semibold text-neutral-900',
  subtitle: 'mb-6 text-center text-sm text-neutral-700',
  socialButton:
    'mb-3 flex h-12 w-full cursor-pointer items-center justify-center rounded border border-neutral-900 bg-neutral-900 px-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50',
  socialButtonText: 'text-sm font-medium text-white',
  input:
    'mb-3 h-[46px] w-full max-w-[480px] rounded border border-neutral-400 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-500',
  registerLink: 'font-medium text-neutral-900 underline',
  fieldLabel: 'mb-1.5 self-stretch text-sm font-medium text-neutral-900',
  err: '-mt-1 mb-2 text-sm text-red-600',
} as const;
