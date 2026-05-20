import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../../../supabase/types/database';

export type TypedSupabaseClient = SupabaseClient<Database>;

export function createBrowserSupabaseClient(params: {
  supabaseUrl: string;
  supabaseAnonKey: string;
}): TypedSupabaseClient {
  return createClient<Database>(params.supabaseUrl, params.supabaseAnonKey, {
    auth: { persistSession: true },
  });
}

export function createServiceRoleSupabaseClient(params: {
  supabaseUrl: string;
  serviceRoleKey: string;
}): TypedSupabaseClient {
  return createClient<Database>(params.supabaseUrl, params.serviceRoleKey, {
    auth: { persistSession: false },
  });
}

