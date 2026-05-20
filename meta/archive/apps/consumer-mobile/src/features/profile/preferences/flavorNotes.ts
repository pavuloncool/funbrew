import type { SupabaseClient } from '@supabase/supabase-js';

export type FlavorNoteOption = {
  id: string;
  name: string;
  label: string;
  category: string;
  sortOrder: number;
};

type FlavorNoteRow = {
  id: string;
  name: string;
  label: string;
  category: string;
  sort_order: number;
};

export async function loadFlavorNoteOptions(supabase: SupabaseClient): Promise<FlavorNoteOption[]> {
  const { data, error } = await supabase
    .from('flavor_notes')
    .select('id,name,label,category,sort_order')
    .order('sort_order', { ascending: true })
    .returns<FlavorNoteRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    label: item.label,
    category: item.category,
    sortOrder: item.sort_order,
  }));
}
