import type { SupabaseClient } from '@supabase/supabase-js';

export type TastingNoteOption = {
  id: string;
  name: string;
  label: string;
  category: string;
  sortOrder: number;
};

type TastingNoteRow = {
  id: string;
  name: string;
  label: string;
  category: string;
  sort_order: number;
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

function toCanonicalOptions(rows: TastingNoteRow[]): TastingNoteOption[] {
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
    return toCanonicalOptions(primary.data ?? []);
  }

  // Backward compatibility for environments where taxonomy is still in `flavor_notes`.
  const fallback = await supabase
    .from('flavor_notes')
    .select('id,name,label,category,sort_order')
    .order('sort_order', { ascending: true })
    .returns<TastingNoteRow[]>();

  if (fallback.error) {
    throw new Error(primary.error.message);
  }

  return toCanonicalOptions(fallback.data ?? []);
}
