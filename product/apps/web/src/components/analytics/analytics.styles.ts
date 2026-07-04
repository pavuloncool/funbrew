/** Wspólne klasy kart analityki (Tailwind). */
export const analyticsStyles = {
  card: 'rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-6 shadow-vs-sm',
  cardTitle:
    'font-display text-4xl uppercase tracking-[-0.02em] text-vs-text-primary',
  cardCaption: 'mt-2 text-base text-vs-text-secondary',
  emptyState: 'mt-4 text-base text-vs-text-muted',
  dashedHint:
    'rounded-vs-md border-2 border-dashed border-vs-border-strong bg-vs-surface px-5 py-4 text-base text-vs-text-secondary',
  statGrid: 'mt-4 grid gap-3 sm:grid-cols-2',
  statGridTelemetry:
    'mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  statLabel: 'text-xs font-semibold uppercase tracking-wide text-vs-text-muted',
  statValue:
    'font-display text-5xl uppercase tabular-nums tracking-[-0.02em] text-vs-text-primary',
  statSuffix: 'ml-1 text-xl font-normal text-vs-text-muted',
  sectionTitle:
    'font-display text-2xl uppercase tracking-[-0.02em] text-vs-text-secondary',
  distSection: 'mt-6',
  distSectionCompact: 'mt-4',
  distList: 'mt-3 space-y-2',
  distRow: 'flex items-center gap-3 text-base',
  distStar: 'w-10 shrink-0 font-semibold tabular-nums text-vs-text-secondary',
  distLabel: 'w-36 shrink-0 text-vs-text-secondary',
  distTrack:
    'h-3 flex-1 overflow-hidden rounded-full border border-vs-border-strong bg-vs-surface',
  distBar: 'h-full rounded-full transition-all',
  distCount: 'w-8 shrink-0 text-right tabular-nums text-vs-text-secondary',
  flavorList: 'mt-4 space-y-2',
  flavorRow:
    'flex items-center justify-between gap-3 rounded-vs-sm border border-vs-border-subtle/40 bg-vs-surface px-4 py-3 text-base',
  flavorRank: 'mr-2 tabular-nums text-vs-text-muted',
  flavorName: 'font-medium text-vs-text-primary',
  flavorCategory: 'ml-2 text-xs font-normal text-vs-text-muted',
  flavorCount: 'shrink-0 tabular-nums text-vs-text-secondary',
  reviewList: 'mt-4 space-y-3',
  reviewCard:
    'rounded-vs-sm border border-vs-border-subtle/40 bg-vs-surface px-4 py-4',
  reviewMeta: 'flex flex-wrap gap-x-3 gap-y-1 text-xs text-vs-text-muted',
  reviewBody: 'mt-2 text-base leading-relaxed text-vs-text-primary',
  filterButtons: 'mt-4 flex flex-wrap gap-2',
  pillBase:
    'rounded-full border-2 border-vs-border-strong px-4 py-2 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
  pillOn: 'border-vs-accent-primary bg-vs-accent-primary text-vs-text-inverse',
  pillOff:
    'border-vs-border-default bg-vs-elevated text-vs-text-secondary hover:bg-vs-surface',
  pillList: 'mt-4 flex flex-wrap gap-2',
  pillNeutral: 'border-vs-border-default bg-vs-surface text-vs-text-primary',
  pillMatch:
    'border-vs-accent-primary bg-vs-accent-primary/10 text-vs-text-primary',
  pillMissing: 'border-vs-warning bg-vs-warning/10 text-vs-text-primary',
  pillUnexpected:
    'border-vs-hero-primary bg-vs-hero-primary/10 text-vs-text-primary',
  compareColumns: 'mt-6 grid gap-4 lg:grid-cols-2',
  compareBlock:
    'rounded-vs-sm border border-vs-border-subtle/40 bg-vs-surface px-4 py-4',
  compareBlockStacked:
    'mt-4 rounded-vs-sm border border-vs-border-subtle/40 bg-vs-surface px-4 py-4',
  declaredMetricGrid: 'mt-4 grid gap-3 sm:grid-cols-3',
  sectionTabsLayout:
    'grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)] xl:items-start',
  sectionTabsRail:
    'rounded-vs-lg border-2 border-vs-border-strong bg-vs-elevated p-3 shadow-vs-md',
  sectionTabsRailHeader: 'px-3 pb-4 pt-2',
  sectionTabsRailEyebrow:
    'text-[11px] font-semibold uppercase tracking-[0.18em] text-vs-text-muted',
  sectionTabsRailTitle:
    'mt-1 font-display text-3xl uppercase tracking-[-0.03em] text-vs-text-primary',
  sectionTabsRailDescription:
    'mt-2 text-sm leading-relaxed text-vs-text-secondary',
  sectionTabsList: 'mt-4 space-y-2',
  sectionTabButton:
    'vs-focus-ring relative flex w-full flex-col items-start gap-1 rounded-vs-md border-2 px-4 py-3 text-left transition-all duration-220',
  sectionTabButtonActive:
    'border-vs-hero-primary bg-vs-hero-primary text-vs-text-inverse shadow-vs-sm',
  sectionTabButtonInactive:
    'border-vs-border-default bg-vs-surface text-vs-text-primary hover:-translate-y-px hover:bg-vs-accent-secondary/15',
  sectionTabLabel:
    'font-display text-[1.1rem] uppercase leading-[0.95] tracking-[-0.03em]',
  sectionTabMeta:
    'text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80',
  sectionTabPanel: 'min-w-0',
  sectionStack: 'space-y-6',
  subTabsList: 'mt-5 flex flex-wrap gap-2',
  subTabButton:
    'vs-focus-ring rounded-vs-md border-2 px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em] transition-all duration-220',
  subTabButtonActive:
    'border-vs-border-strong bg-vs-elevated text-vs-text-primary shadow-vs-sm',
  subTabButtonInactive:
    'border-vs-border-default bg-vs-surface text-vs-text-secondary hover:bg-vs-accent-secondary/15',
  subTabPanel: 'mt-5',
} as const;
