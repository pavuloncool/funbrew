/** Host used by dev hints (should match local Studio when on CLI Supabase). */
export function getResolvedSupabasePublicOrigin(supabaseUrl: string): string {
  try {
    return new URL(supabaseUrl).host;
  } catch {
    return supabaseUrl;
  }
}
