import { createBrowserSupabaseClient } from '@funcup/shared';

const PROD_SUPABASE_URL = 'https://ztbfsnxofxpwhuwhrfvq.supabase.co';
const PROD_SUPABASE_ANON_KEY = 'sb_publishable_Ojtssa-ar1de9fadQMdPsw_qEdgiJsq';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  (process.env.NODE_ENV === 'production' ? PROD_SUPABASE_URL : 'http://127.0.0.1:54321');
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  (process.env.NODE_ENV === 'production' ? PROD_SUPABASE_ANON_KEY : 'missing-anon-key');

export const supabaseBrowser = createBrowserSupabaseClient({
  supabaseUrl,
  supabaseAnonKey
});
