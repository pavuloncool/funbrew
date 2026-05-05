/** Wspólna powłoka layoutu dla prostych stron CRUD pod /roaster-hub (Tailwind). */
export const hubCrudStyles = {
  main760: 'mx-auto w-full max-w-[760px] px-4 py-10 font-sans text-neutral-900',
  main480: 'mx-auto w-full max-w-[480px] px-4 py-10 font-sans text-neutral-900',
  navBack: 'mb-4 block text-sm font-medium text-neutral-900 underline',
  link: 'text-neutral-900 underline',
  linkStrong: 'font-semibold text-neutral-900 underline',
  formGrid: 'grid gap-3',
  label: 'text-sm font-semibold text-neutral-900',
  input:
    'w-full rounded border border-neutral-400 bg-white px-2 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-500',
  submitBtn:
    'rounded border border-neutral-900 bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50',
  error: 'mt-3 text-sm text-red-600',
  muted: 'text-sm text-neutral-600',
  title: 'text-xl font-semibold text-neutral-900',
  titleSetup: 'mb-2 text-[1.35rem] font-semibold text-neutral-900',
  lead: 'mb-5 text-sm leading-relaxed text-neutral-700',
  footerLinks: 'mt-6 flex flex-wrap gap-2 text-sm',
  bodyText: 'text-sm text-neutral-800',
  bodyStrong: 'font-semibold text-neutral-900',
  inlineGapTop: 'mt-2',
  batchNote: 'mt-3 text-sm text-neutral-700',
  pageHeading: 'mb-4 text-2xl font-semibold text-neutral-900',
  list: 'list-disc space-y-1 pl-5 text-sm',
  actionLink: 'text-sm font-medium text-neutral-900 underline',
} as const;
