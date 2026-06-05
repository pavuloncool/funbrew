import type { SupabaseClient } from '@supabase/supabase-js';

export type BrewMethodOption = {
  id: string;
  name: string;
  sortOrder?: number;
};

export type TastingNoteOption = {
  id: string;
  name: string;
  label: string;
  category: string;
  sortOrder?: number;
};

type BrewMethodRow = {
  id: string;
  name: string;
  sort_order: number;
};

type TastingNoteRow = {
  id: string;
  name: string;
  label: string;
  category: string;
  sort_order: number;
};

type OptionLike = {
  id: string;
};

const CANONICAL_NOTES: Array<{ key: string; names: string[]; label: string; category: string; sortOrder: number }> = [
  { key: 'berry', names: ['berry'], label: 'Berry', category: 'fruity', sortOrder: 1 },
  { key: 'citrus', names: ['citrus'], label: 'Citrus', category: 'fruity', sortOrder: 2 },
  { key: 'stone-fruit', names: ['stone-fruit', 'stone_fruit'], label: 'Stone Fruit', category: 'fruity', sortOrder: 3 },
  { key: 'floral', names: ['floral'], label: 'Floral', category: 'floral', sortOrder: 4 },
  { key: 'jasmine', names: ['jasmine'], label: 'Jasmine', category: 'floral', sortOrder: 5 },
  { key: 'chocolate', names: ['chocolate'], label: 'Chocolate', category: 'sweet', sortOrder: 6 },
  { key: 'caramel', names: ['caramel'], label: 'Caramel', category: 'sweet', sortOrder: 7 },
  { key: 'honey', names: ['honey'], label: 'Honey', category: 'sweet', sortOrder: 8 },
  { key: 'brown-sugar', names: ['brown-sugar', 'brown_sugar'], label: 'Brown Sugar', category: 'sweet', sortOrder: 9 },
  { key: 'almond', names: ['almond'], label: 'Almond', category: 'nutty', sortOrder: 10 },
  { key: 'hazelnut', names: ['hazelnut'], label: 'Hazelnut', category: 'nutty', sortOrder: 11 },
  { key: 'cinnamon', names: ['cinnamon'], label: 'Cinnamon', category: 'spice', sortOrder: 12 },
];

export function sanitizeSelectedIds<TOption extends OptionLike>(
  selectedIds: string[],
  options: TOption[]
): string[] {
  const allowedIds = new Set(options.map((option) => option.id));
  const seen = new Set<string>();
  const sanitized: string[] = [];

  for (const id of selectedIds) {
    if (!allowedIds.has(id) || seen.has(id)) continue;
    seen.add(id);
    sanitized.push(id);
  }

  return sanitized;
}

export function toggleSelectedId(selectedIds: string[], nextId: string, limit?: number): string[] {
  if (selectedIds.includes(nextId)) {
    return selectedIds.filter((id) => id !== nextId);
  }
  if (typeof limit === 'number' && selectedIds.length >= limit) {
    return selectedIds;
  }
  return [...selectedIds, nextId];
}

export function labelForSelectedId<TOption extends { id: string; name: string }>(
  options: TOption[],
  selectedId: string | null,
  fallback: string
): string {
  if (!selectedId) return fallback;
  const selected = options.find((option) => option.id === selectedId);
  return selected?.name ?? fallback;
}

export function labelsForSelectedIds<TOption extends { id: string }>(
  options: TOption[],
  selectedIds: string[],
  getLabel: (option: TOption) => string
): string[] {
  const selectedSet = new Set(selectedIds);
  return options
    .filter((option) => selectedSet.has(option.id))
    .map((option) => getLabel(option));
}

export async function loadBrewMethodOptions(supabase: SupabaseClient): Promise<BrewMethodOption[]> {
  const { data, error } = await supabase
    .from('brew_methods')
    .select('id,name,sort_order')
    .order('sort_order', { ascending: true })
    .returns<BrewMethodRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    sortOrder: item.sort_order,
  }));
}

function toCanonicalTastingNoteOptions(rows: TastingNoteRow[]): TastingNoteOption[] {
  const byName = new Map(rows.map((row) => [row.name, row] as const));
  const options: TastingNoteOption[] = [];

  for (const canonical of CANONICAL_NOTES) {
    const matched = canonical.names.map((name) => byName.get(name)).find(Boolean);
    if (!matched) continue;
    options.push({
      id: matched.id,
      name: canonical.key,
      label: canonical.label,
      category: canonical.category,
      sortOrder: canonical.sortOrder,
    });
  }

  return options;
}

export async function loadTastingNoteOptions(supabase: SupabaseClient): Promise<TastingNoteOption[]> {
  const primary = await supabase
    .from('tasting_notes')
    .select('id,name,label,category,sort_order')
    .order('sort_order', { ascending: true })
    .returns<TastingNoteRow[]>();

  if (!primary.error) {
    return toCanonicalTastingNoteOptions(primary.data ?? []);
  }

  const fallback = await supabase
    .from('flavor_notes')
    .select('id,name,label,category,sort_order')
    .order('sort_order', { ascending: true })
    .returns<TastingNoteRow[]>();

  if (fallback.error) {
    throw new Error(primary.error.message);
  }

  return toCanonicalTastingNoteOptions(fallback.data ?? []);
}
