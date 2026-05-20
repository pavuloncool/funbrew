'use client';

import type { BrewMethodOption } from '@funcup/shared';

import { cn } from '@/src/lib/utils';

import { analyticsStyles } from './analytics.styles';

type Props = {
  options: BrewMethodOption[];
  value: string | null;
  onChange: (brewMethodId: string | null) => void;
  disabled?: boolean;
};

export default function BrewMethodFilter({
  options,
  value,
  onChange,
  disabled,
}: Props) {
  if (options.length === 0) {
    return <div className={analyticsStyles.dashedHint}>Brew method filter appears when tastings include a brew method.</div>;
  }

  return (
    <div className={analyticsStyles.card}>
      <h2 className={analyticsStyles.cardTitle}>Brew method</h2>
      <p className={analyticsStyles.cardCaption}>
        Filter the sections below; published batch totals above stay unchanged.
      </p>
      <div className={analyticsStyles.filterButtons}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null)}
          className={cn(
            analyticsStyles.pillBase,
            value === null ? analyticsStyles.pillOn : analyticsStyles.pillOff
          )}
        >
          All methods
        </button>
        {options.map(opt => (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            className={cn(
              analyticsStyles.pillBase,
              value === opt.id ? analyticsStyles.pillOn : analyticsStyles.pillOff
            )}
          >
            {opt.name}
          </button>
        ))}
      </div>
    </div>
  );
}
