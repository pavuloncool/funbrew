export const resolveHashStyles = {
  page: 'min-h-screen bg-vs-canvas px-4 py-10 text-vs-text-primary',
  main: 'mx-auto flex w-full max-w-[720px] flex-col gap-6',
  hero: 'rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-6 shadow-vs-sm',
  eyebrow: 'text-xs font-semibold uppercase tracking-[0.18em] text-vs-text-muted',
  heading: 'mt-3 font-display text-4xl uppercase tracking-[-0.03em] text-vs-text-primary',
  subheading: 'mt-3 max-w-[700px] text-base text-vs-text-secondary',
  statusCard: 'rounded-vs-md border border-vs-border-subtle/40 bg-vs-surface p-4',
  actionsCard: 'rounded-vs-md border border-vs-border-subtle/40 bg-vs-surface p-4',
  factLabel: 'text-xs font-semibold uppercase tracking-[0.14em] text-vs-text-muted',
  factValue: 'mt-2 text-base text-vs-text-primary',
  primaryAction:
    'inline-flex min-h-12 items-center justify-center rounded-vs-md border-2 border-vs-border-strong bg-vs-text-primary px-5 py-3 text-center text-sm font-semibold uppercase tracking-[0.12em] text-vs-canvas transition hover:opacity-90',
  secondaryActions: 'mt-3 flex flex-wrap gap-3',
  secondaryAction:
    'inline-flex min-h-11 items-center justify-center rounded-vs-md border border-vs-border-default px-4 py-3 text-sm font-medium text-vs-text-primary transition hover:bg-vs-elevated',
  helperText: 'mt-3 text-sm leading-6 text-vs-text-secondary',
} as const;
