import { createServiceRoleSupabaseClient } from '@funcup/shared';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'missing-service-role-key';

export const supabaseServer = createServiceRoleSupabaseClient({
  supabaseUrl,
  serviceRoleKey
});

