'use client';

import type { BrewMethodOption } from '@funcup/shared';

import { SelectionMultiPickField } from './SelectionMultiPickField';

type Props = {
  options: BrewMethodOption[];
  selectedIds: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
};

function normalizeBrewMethodName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function canonicalBrewMethodLabel(name: string): string {
  if (normalizeBrewMethodName(name) === 'aeropress') {
    return 'AeroPress';
  }

  return name;
}

export function BrewMethodPicker(props: Props) {
  const options = props.options.reduce<Array<{ id: string; label: string }>>((acc, option) => {
    const label = canonicalBrewMethodLabel(option.name);
    const normalizedLabel = normalizeBrewMethodName(label);
    const existingIndex = acc.findIndex((item) => normalizeBrewMethodName(item.label) === normalizedLabel);

    if (existingIndex === -1) {
      acc.push({
        id: option.id,
        label,
      });
      return acc;
    }

    if (label === 'AeroPress') {
      acc[existingIndex] = {
        id: option.id,
        label,
      };
    }

    return acc;
  }, []);

  return (
    <SelectionMultiPickField
      label="Suggested brew methods"
      options={options}
      selectedIds={props.selectedIds}
      onChange={props.onChange}
      placeholder="Pick one or more methods"
      searchPlaceholder="Search brew methods"
      emptyState="No brew methods match this search."
      disabled={props.disabled}
      loading={props.loading}
      error={props.error}
      hint="These suggestions will be compared against the brew methods consumers actually log."
    />
  );
}
