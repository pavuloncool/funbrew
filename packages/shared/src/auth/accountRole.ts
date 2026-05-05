import type { TypedSupabaseClient } from '../services/supabaseClientFactory';

export type AccountRole = 'roaster' | 'consumer';

function resolveAccountRoleFromMetadata(userMetadata: unknown): AccountRole | null {
  if (!userMetadata || typeof userMetadata !== 'object' || Array.isArray(userMetadata)) {
    return null;
  }

  const role = (userMetadata as { app_role?: unknown }).app_role;
  if (role === 'roaster' || role === 'consumer') {
    return role;
  }

  return null;
}

export async function resolveAccountRole(
  supabase: TypedSupabaseClient,
  userId: string,
  userMetadata?: unknown
): Promise<AccountRole> {
  const metadataRole = resolveAccountRoleFromMetadata(userMetadata);
  if (metadataRole) {
    return metadataRole;
  }

  const { data, error } = await supabase
    .from('roasters')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const row = data as { id: string } | null;
  return row?.id ? 'roaster' : 'consumer';
}
