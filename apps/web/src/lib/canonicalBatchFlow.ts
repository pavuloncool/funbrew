import { assertCoffeeLabelFileSize } from '@funcup/shared';
import type { SupabaseClient } from '@supabase/supabase-js';

import { uploadCoffeeLabelToSupabase } from './uploadCoffeeLabel';

type UpsertCoverImageInput = {
  supabase: SupabaseClient;
  coffeeId: string;
  roasterId: string;
  roasterShortName: string;
  file?: File;
};

export async function upsertCoffeeCoverImageForBatch(input: UpsertCoverImageInput): Promise<string | null> {
  const { supabase, coffeeId, roasterId, roasterShortName, file } = input;
  if (!(file instanceof File)) {
    return null;
  }

  assertCoffeeLabelFileSize(file);
  const imageUrl = await uploadCoffeeLabelToSupabase(supabase, file, roasterShortName);

  const { error } = await supabase
    .from('coffees')
    .update({ cover_image_url: imageUrl })
    .eq('id', coffeeId)
    .eq('roaster_id', roasterId);
  if (error) {
    throw error;
  }

  return imageUrl;
}
