'use client';

import { toggleSelectedId } from '@funcup/shared';
import { useMemo, useState } from 'react';

import { hubCrudStyles } from '@/app/roaster-hub/hub-crud.styles';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import { cn } from '@/src/lib/utils';

type MultiPickOption = {
  id: string;
  label: string;
  meta?: string | null;
};

type Props = {
  label: string;
  options: MultiPickOption[];
  selectedIds: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyState: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  hint?: string | null;
  maxSelected?: number;
  required?: boolean;
};

export function SelectionMultiPickField(props: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedOptions = useMemo(
    () => props.options.filter((option) => props.selectedIds.includes(option.id)),
    [props.options, props.selectedIds]
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return props.options;
    return props.options.filter((option) => {
      const haystack = `${option.label} ${option.meta ?? ''}`.toLocaleLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [props.options, query]);

  const triggerLabel = props.loading
    ? 'Loading options…'
    : selectedOptions.length > 0
      ? selectedOptions.map((option) => option.label).join(', ')
      : props.placeholder;

  return (
    <label className={hubCrudStyles.formGrid}>
      <span className={hubCrudStyles.label}>
        {props.label}
        {props.required ? ' *' : ''}
      </span>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              hubCrudStyles.input,
              'min-h-11 text-left',
              selectedOptions.length === 0 && 'text-vs-text-muted'
            )}
            disabled={props.disabled || props.loading}
          >
            {triggerLabel}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[min(32rem,calc(100vw-2rem))] border-2 border-vs-border-strong bg-vs-elevated p-3"
        >
          <div className="space-y-3">
            <input
              className={hubCrudStyles.input}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={props.searchPlaceholder}
            />

            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const selected = props.selectedIds.includes(option.id);
                  const blockedByLimit =
                    !selected &&
                    typeof props.maxSelected === 'number' &&
                    props.selectedIds.length >= props.maxSelected;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={cn(
                        'flex w-full items-start gap-3 rounded-vs-sm border border-vs-border-subtle/40 bg-vs-surface px-3 py-3 text-left transition-colors',
                        selected && 'border-vs-accent-primary bg-vs-accent-primary/10',
                        blockedByLimit && 'cursor-not-allowed opacity-50'
                      )}
                      disabled={blockedByLimit}
                      onClick={() => {
                        props.onChange(
                          toggleSelectedId(props.selectedIds, option.id, props.maxSelected)
                        );
                      }}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-semibold',
                          selected
                            ? 'border-vs-accent-primary bg-vs-accent-primary text-vs-text-inverse'
                            : 'border-vs-border-strong bg-vs-elevated text-transparent'
                        )}
                      >
                        ✓
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium text-vs-text-primary">
                          {option.label}
                        </span>
                        {option.meta ? (
                          <span className="block text-xs text-vs-text-muted">{option.meta}</span>
                        ) : null}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-vs-text-muted">{props.emptyState}</p>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {selectedOptions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <span
              key={option.id}
              className="rounded-full border border-vs-border-subtle/40 bg-vs-surface px-3 py-1 text-sm text-vs-text-primary"
            >
              {option.label}
            </span>
          ))}
        </div>
      ) : null}

      {props.hint ? <span className={`${hubCrudStyles.muted} text-xs`}>{props.hint}</span> : null}
      {props.error ? <span className={hubCrudStyles.error}>{props.error}</span> : null}
    </label>
  );
}
