'use client';

import type { TastingNoteOption } from '@funcup/shared';

import { SelectionMultiPickField } from './SelectionMultiPickField';

type Props = {
  options: TastingNoteOption[];
  selectedIds: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
};

export function FlavorNoteSelector(props: Props) {
  return (
    <SelectionMultiPickField
      label="Suggested flavor notes"
      options={props.options.map((option) => ({
        id: option.id,
        label: option.label,
        meta: option.category,
      }))}
      selectedIds={props.selectedIds}
      onChange={props.onChange}
      placeholder="Pick one or more flavor notes"
      searchPlaceholder="Search flavor notes"
      emptyState="No flavor notes match this search."
      disabled={props.disabled}
      loading={props.loading}
      error={props.error}
      hint="These suggestions will be compared against the notes consumers actually select."
    />
  );
}
