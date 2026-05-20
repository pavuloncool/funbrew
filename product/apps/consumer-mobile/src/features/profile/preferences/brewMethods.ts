import type { SupabaseClient } from '@supabase/supabase-js';

export type BrewMethodOption = {
  id: string;
  name: string;
  sortOrder: number;
};

type BrewMethodRow = {
  id: string;
  name: string;
  sort_order: number;
};

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
