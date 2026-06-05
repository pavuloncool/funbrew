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

export function BrewMethodPicker(props: Props) {
  return (
    <SelectionMultiPickField
      label="Suggested brew methods"
      options={props.options.map((option) => ({
        id: option.id,
        label: option.name,
      }))}
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
