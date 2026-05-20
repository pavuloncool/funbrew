import { createBrowserSupabaseClient } from '@funcup/shared';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'missing-anon-key';

export const supabaseBrowser = createBrowserSupabaseClient({
  supabaseUrl,
  supabaseAnonKey
});

