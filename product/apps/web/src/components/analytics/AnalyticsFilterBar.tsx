'use client';

import { labelForSelectedId, loadBrewMethodOptions, type BrewMethodOption } from '@funcup/shared';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { Button } from '@/src/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';
import { cn } from '@/src/lib/utils';

type Filters = {
  brewMethodId: string | null;
  minRating: number | null;
  maxRating: number | null;
  startDate: string;
  endDate: string;
  feedbackQuery: string;
};

type Props = {
  filters: Filters;
  brewMethods: BrewMethodOption[];
  onChange: (updater: (current: Filters) => Filters) => void;
  disabled?: boolean;
  reportMode?: boolean;
};

type BrewMethodRow = {
  id: string | null;
  label: string;
  active: boolean;
};

const RATING_OPTIONS = [
  { label: 'Any rating', value: '' },
  { label: '1+', value: '1' },
  { label: '2+', value: '2' },
  { label: '3+', value: '3' },
  { label: '4+', value: '4' },
  { label: '5 only', value: '5' },
] as const;

const STICKY_TOP_PX = 16;

function useStickyState(enabled: boolean) {
  const ref = useRef<HTMLElement | null>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setStuck(false);
      return;
    }

    let frame = 0;
    const measure = () => {
      frame = 0;
      const top = ref.current?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      setStuck(top <= STICKY_TOP_PX + 1);
    };

    const schedule = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(measure);
    };

    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [enabled]);

  return { ref, stuck };
}

function useCompactViewport() {
  const [compactViewport, setCompactViewport] = useState(false);

  useEffect(() => {
    const update = () => {
      setCompactViewport(window.innerWidth < 768);
    };

    update();
    window.addEventListener('resize', update);

    return () => {
      window.removeEventListener('resize', update);
    };
  }, []);

  return compactViewport;
}

function BrewMethodSingleSelect(props: {
  brewMethods: BrewMethodOption[];
  selectedId: string | null;
  onSelect: (value: string | null) => void;
  disabled?: boolean;
  reportMode?: boolean;
}) {
  const { brewMethods, selectedId, onSelect, disabled, reportMode } = props;
  const [open, setOpen] = useState(false);
  const [catalog, setCatalog] = useState<BrewMethodOption[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogFailed, setCatalogFailed] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setCatalogLoading(true);
      setCatalogFailed(false);
      try {
        const allMethods = await loadBrewMethodOptions(supabaseBrowser);
        if (!cancelled) {
          setCatalog(allMethods);
        }
      } catch {
        if (!cancelled) {
          setCatalogFailed(true);
          setCatalog([]);
        }
      } finally {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const observedIds = useMemo(() => new Set(brewMethods.map((option) => option.id)), [brewMethods]);
  const sourceOptions = useMemo(
    () => (catalog.length > 0 ? catalog : brewMethods),
    [brewMethods, catalog]
  );
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const rows = useMemo<BrewMethodRow[]>(() => {
    const baseRows = sourceOptions
      .filter((option) => {
        if (!normalizedQuery) return true;
        return option.name.toLocaleLowerCase().includes(normalizedQuery);
      })
      .map((option) => ({
        id: option.id,
        label: option.name,
        active: observedIds.has(option.id),
      }));

    if (!normalizedQuery || 'all methods'.includes(normalizedQuery)) {
      return [{ id: null, label: 'All methods', active: true }, ...baseRows];
    }

    return baseRows;
  }, [normalizedQuery, observedIds, sourceOptions]);

  const triggerLabel = labelForSelectedId(brewMethods, selectedId, 'All methods');
  const triggerMuted = selectedId == null;

  return (
    <FilterField label="Brew method">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled || reportMode}
            className={cn(
              'flex h-11 w-full items-center justify-between rounded-vs-sm border border-vs-border-default bg-vs-surface px-3 text-left text-sm text-vs-text-primary outline-none transition-colors focus-visible:ring-2 focus-visible:ring-vs-hero-primary/60',
              triggerMuted && 'text-vs-text-secondary',
              (disabled || reportMode) && 'cursor-not-allowed opacity-60'
            )}
          >
            <span className="truncate">{triggerLabel}</span>
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-vs-text-muted" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[min(24rem,calc(100vw-2rem))] border-2 border-vs-border-strong bg-vs-elevated/95 p-3 shadow-vs-md backdrop-blur-xl"
        >
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vs-text-muted" />
              <input
                className="h-11 w-full rounded-vs-sm border border-vs-border-default bg-vs-surface pl-9 pr-3 text-sm text-vs-text-primary outline-none focus-visible:ring-2 focus-visible:ring-vs-hero-primary/60"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search brew methods"
              />
            </div>

            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {catalogLoading && !catalogFailed ? (
                <p className="text-sm text-vs-text-muted">Loading brew methods…</p>
              ) : rows.length > 0 ? (
                rows.map((row) => {
                  const selected = row.id === selectedId || (row.id == null && selectedId == null);
                  const rowDisabled = row.id != null && !row.active;

                  return (
                    <button
                      key={row.id ?? 'all-methods'}
                      type="button"
                      disabled={rowDisabled}
                      onClick={() => {
                        onSelect(row.id);
                        setOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-start justify-between gap-3 rounded-vs-sm border px-3 py-3 text-left transition-colors',
                        selected
                          ? 'border-vs-border-strong bg-vs-accent-secondary text-vs-text-primary'
                          : 'border-vs-border-subtle/40 bg-vs-surface text-vs-text-primary hover:bg-vs-elevated',
                        rowDisabled && 'cursor-not-allowed border-vs-border-subtle/30 bg-vs-surface/60 text-vs-text-muted opacity-55 hover:bg-vs-surface/60'
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block font-medium">{row.label}</span>
                        {row.id != null ? (
                          <span className="block text-xs text-vs-text-muted">
                            {row.active ? 'Appears in current ratings' : 'Not present in current ratings'}
                          </span>
                        ) : (
                          <span className="block text-xs text-vs-text-muted">
                            Show all consumer tastings regardless of brew method
                          </span>
                        )}
                      </span>
                      {selected ? (
                        <span className="shrink-0 rounded-full border border-vs-border-strong bg-vs-hero-primary/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-vs-text-primary">
                          Active
                        </span>
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-vs-text-muted">No brew methods match this search.</p>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </FilterField>
  );
}

function FilterField(props: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('space-y-2', props.className)}>
      <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-vs-text-muted">
        {props.label}
      </span>
      {props.children}
    </label>
  );
}

export default function AnalyticsFilterBar(props: Props) {
  const { filters, brewMethods, onChange, disabled, reportMode } = props;
  const { ref, stuck } = useStickyState(!reportMode);
  const compactViewport = useCompactViewport();
  const compactCollapsed = compactViewport && !reportMode && stuck;

  const fieldClassName =
    'h-11 w-full rounded-vs-sm border border-vs-border-default bg-vs-surface px-3 text-sm text-vs-text-primary outline-none focus-visible:ring-2 focus-visible:ring-vs-hero-primary/60';

  return (
    <section
      ref={ref}
      className={cn(
        'rounded-vs-lg border-2 border-vs-border-strong shadow-vs-md transition-[background-color,box-shadow,backdrop-filter] duration-200',
        reportMode
          ? 'relative bg-vs-elevated p-4'
          : cn(
              'sticky top-4 z-10 bg-vs-elevated',
              compactCollapsed ? 'p-3' : 'p-4 md:p-5'
            ),
        stuck && !reportMode && 'bg-vs-elevated/75 shadow-vs-lg backdrop-blur-xl supports-[backdrop-filter]:backdrop-saturate-150'
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-2xl uppercase tracking-[-0.03em] text-vs-text-primary">
            Dashboard filters
          </p>
          {!compactCollapsed ? (
            <p className="mt-1 max-w-[56rem] text-sm text-vs-text-secondary">
              Narrow charts and tables by brew method, tasting date and rating.
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {!reportMode ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={disabled}
              onClick={() =>
                onChange(() => ({
                  brewMethodId: null,
                  minRating: null,
                  maxRating: null,
                  startDate: '',
                  endDate: '',
                  feedbackQuery: '',
                }))
              }
              >
              Reset filters
            </Button>
          ) : null}
        </div>
      </div>

      {!compactCollapsed ? (
        <div
          className={cn(
            'mt-4 grid gap-3',
            'md:grid-cols-2 xl:grid-cols-[minmax(15rem,1.2fr)_minmax(9rem,0.8fr)_minmax(9rem,0.8fr)_minmax(8rem,0.7fr)_minmax(8rem,0.7fr)_minmax(16rem,1.35fr)]'
          )}
        >
          <BrewMethodSingleSelect
            brewMethods={brewMethods}
            selectedId={filters.brewMethodId}
            onSelect={(value) => onChange((current) => ({ ...current, brewMethodId: value }))}
            disabled={disabled}
            reportMode={reportMode}
          />

          <FilterField label="Start date">
            <input
              type="date"
              className={fieldClassName}
              value={filters.startDate}
              disabled={disabled || reportMode}
              onChange={(event) => onChange((current) => ({ ...current, startDate: event.target.value }))}
            />
          </FilterField>

          <FilterField label="End date">
            <input
              type="date"
              className={fieldClassName}
              value={filters.endDate}
              disabled={disabled || reportMode}
              onChange={(event) => onChange((current) => ({ ...current, endDate: event.target.value }))}
            />
          </FilterField>

          <FilterField label="Min rating">
            <select
              className={fieldClassName}
              value={filters.minRating == null ? '' : String(filters.minRating)}
              disabled={disabled || reportMode}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  minRating: event.target.value ? Number(event.target.value) : null,
                }))
              }
            >
              {RATING_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Max rating">
            <select
              className={fieldClassName}
              value={filters.maxRating == null ? '' : String(filters.maxRating)}
              disabled={disabled || reportMode}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  maxRating: event.target.value ? Number(event.target.value) : null,
                }))
              }
            >
              {RATING_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label === 'Any rating' ? 'Any max' : option.label}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Search feedback">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vs-text-muted" />
              <input
                className={cn(fieldClassName, 'pl-9')}
                value={filters.feedbackQuery}
                placeholder="Search notes and reviews"
                disabled={disabled || reportMode}
                onChange={(event) => onChange((current) => ({ ...current, feedbackQuery: event.target.value }))}
              />
            </div>
          </FilterField>
        </div>
      ) : null}
    </section>
  );
}
