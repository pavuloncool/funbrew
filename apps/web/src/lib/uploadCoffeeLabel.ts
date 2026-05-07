import type { SupabaseClient } from '@supabase/supabase-js';
import {
  MAX_COFFEE_LABEL_BYTES,
  assertCoffeeLabelFileSize,
  storageSegmentFromRoasterShortName,
} from '@funcup/shared';

function extensionFromFile(file: File): string {
  const m = /\.([a-zA-Z0-9]+)$/.exec(file.name);
  if (m) return m[1]!.toLowerCase();
  if (file.type === 'image/jpeg') return 'jpg';
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'bin';
}

/**
 * Uploads label image to `coffee-labels` bucket and returns the public URL.
 * Path: `{sanitized roaster short name}/{uuid}.{ext}`.
 */
export async function uploadCoffeeLabelToSupabase(
  supabase: SupabaseClient,
  file: File,
  roasterShortName: string
): Promise<string> {
  if (file.size > MAX_COFFEE_LABEL_BYTES) {
    return Promise.reject(new Error('File too large'));
  }
  assertCoffeeLabelFileSize(file);
  const segment = storageSegmentFromRoasterShortName(roasterShortName);
  const ext = extensionFromFile(file);
  const path = `${segment}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('coffee-labels').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('coffee-labels').getPublicUrl(path);
  const url = data.publicUrl;
  if (!url) {
    throw new Error('Image upload failed');
  }
  return url;
}
