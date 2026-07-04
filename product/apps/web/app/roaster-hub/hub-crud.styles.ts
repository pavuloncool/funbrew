/** Wspólna powłoka layoutu dla prostych stron CRUD pod /roaster-hub (Tailwind). */
export const hubCrudStyles = {
  main760:
    'mx-auto w-full max-w-[1240px] px-6 py-10 font-sans text-vs-text-primary',
  mainAnalyticsTabs:
    'mx-auto w-full max-w-[1520px] px-6 py-10 font-sans text-vs-text-primary',
  main480:
    'mx-auto w-full max-w-[560px] px-6 py-10 font-sans text-vs-text-primary',
  navBack:
    'mb-5 inline-flex items-center text-xl font-semibold text-vs-text-primary underline underline-offset-4',
  link: 'text-vs-text-primary underline',
  linkStrong: 'font-semibold text-vs-text-primary underline',
  formGrid: 'grid gap-4',
  label: 'text-sm font-semibold uppercase tracking-wide text-vs-text-primary',
  input:
    'vs-focus-ring w-full rounded-vs-sm border-2 border-vs-border-strong bg-vs-elevated px-3 py-2 text-base text-vs-text-primary placeholder:text-vs-text-muted',
  submitBtn: 'vs-button-primary px-6 py-2 text-base font-semibold',
  error: 'mt-3 text-sm text-vs-danger',
  muted: 'text-base text-vs-text-secondary',
  title:
    'font-display text-4xl uppercase tracking-[-0.03em] text-vs-text-primary',
  titleSetup:
    'mb-2 font-display text-4xl uppercase tracking-[-0.03em] text-vs-text-primary',
  lead: 'mb-6 text-base leading-relaxed text-vs-text-secondary',
  footerLinks: 'mt-6 flex flex-wrap gap-3 text-sm',
  bodyText: 'text-base text-vs-text-primary',
  bodyStrong: 'font-semibold text-vs-text-primary',
  inlineGapTop: 'mt-2',
  batchNote: 'mt-3 text-base text-vs-text-secondary',
  assetPreviewFrame:
    'mt-2 flex h-28 w-28 items-center justify-center overflow-hidden rounded-vs-md border-2 border-vs-border-strong bg-vs-surface shadow-vs-sm',
  assetPreviewImage: 'h-full w-full object-contain',
  assetPreviewHelp: 'mt-2 text-sm text-vs-text-secondary',
  pageHeading:
    'mb-5 font-display text-5xl uppercase tracking-[-0.03em] text-vs-text-primary',
  list: 'list-disc space-y-1 pl-5 text-base',
  actionLink:
    'vs-button-secondary inline-block px-5 py-2 text-base font-semibold',
} as const;
