import type { SupabaseClient, User } from '@supabase/supabase-js';
import { normalizeOptionalReputationLevel, normalizeReputationLevel } from '@funcup/shared';

import {
  DEFAULT_AVATAR_SEED,
  resolveAvatarSeedOption,
  serializeAvatarOption,
} from './avatar/avatarFactory';

type UserRow = {
  display_name: string | null;
  avatar_url: string | null;
  favorite_brew_method_id?: string | null;
  sensory_level?: 'beginner' | 'advanced' | 'expert' | null;
  sensory_level_override?: 'beginner' | 'advanced' | 'expert' | null;
  sensory_score?: number | null;
};

type ProfileMetadata = {
  display_name?: unknown;
  avatar_url?: unknown;
  profile_completed?: unknown;
};

export type EditableProfile = {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  favoriteBrewMethodId: string | null;
  favoriteTastingNoteIds: string[];
  sensoryLevel: 'beginner' | 'advanced' | 'expert';
  sensoryLevelOverride: 'beginner' | 'advanced' | 'expert' | null;
  sensoryScore: number;
  profileCompleted: boolean;
};

function isRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input) && typeof input === 'object' && !Array.isArray(input);
}

function getMetadata(user: User | null): ProfileMetadata {
  if (!user || !isRecord(user.user_metadata)) {
    return {};
  }

  return user.user_metadata as ProfileMetadata;
}

export function isProfileCompleted(user: User | null): boolean {
  const metadata = getMetadata(user);
  if (typeof metadata.profile_completed === 'boolean') {
    return metadata.profile_completed;
  }

  // Backward compatibility for users created before this flag existed.
  return true;
}

export const serializeAvatar = serializeAvatarOption;
export const resolveAvatarOption = resolveAvatarSeedOption;

export async function loadEditableProfile(
  supabase: SupabaseClient
): Promise<EditableProfile> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error(userError?.message ?? 'Brak aktywnej sesji.');
  }

  const metadata = getMetadata(user);

  const { row } = await loadUsersRow(supabase, user.id);

  const metadataDisplayName = typeof metadata.display_name === 'string' ? metadata.display_name : null;
  const metadataAvatar = typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null;

  const favoriteRows = await loadFavoriteTastingNoteRows(supabase, user.id);

  return {
    userId: user.id,
    displayName: row?.display_name ?? metadataDisplayName ?? '',
    email: user.email ?? '',
    avatarUrl: row?.avatar_url ?? metadataAvatar ?? serializeAvatar(DEFAULT_AVATAR_SEED),
    favoriteBrewMethodId: row?.favorite_brew_method_id ?? null,
    favoriteTastingNoteIds: (favoriteRows ?? []).map((item) => item.tasting_note_id),
    sensoryLevel: normalizeReputationLevel(row?.sensory_level),
    sensoryLevelOverride: normalizeOptionalReputationLevel(row?.sensory_level_override),
    sensoryScore: normalizeSensoryScore(row?.sensory_score),
    profileCompleted: isProfileCompleted(user),
  };
}

export async function saveEditableProfile(params: {
  supabase: SupabaseClient;
  userId: string;
  displayName: string;
  avatarUrl: string;
  favoriteBrewMethodId?: string | null;
  favoriteTastingNoteIds?: string[];
  markCompleted?: boolean;
}): Promise<void> {
  const trimmedName = params.displayName.trim();

  const updatePayload: {
    display_name: string;
    avatar_url: string;
    favorite_brew_method_id?: string | null;
  } = {
    display_name: trimmedName,
    avatar_url: params.avatarUrl,
  };

  if (params.favoriteBrewMethodId !== undefined) {
    updatePayload.favorite_brew_method_id = params.favoriteBrewMethodId;
  }

  await saveUsersRow(params.supabase, params.userId, updatePayload);

  if (params.favoriteTastingNoteIds !== undefined) {
    const { error: deleteError } = await params.supabase
      .from('user_favorite_flavor_notes')
      .delete()
      .eq('user_id', params.userId);

    if (deleteError) {
      if (isMissingFavoriteNotesRelation(deleteError)) {
        throw buildSchemaMissingError('Brakuje tabeli public.user_favorite_flavor_notes albo kolumny tasting_note_id.');
      }
      throw new Error(deleteError.message);
    }

    if (params.favoriteTastingNoteIds.length > 0) {
      const primaryInsert = await params.supabase
        .from('user_favorite_flavor_notes')
        .insert(
          params.favoriteTastingNoteIds.map((tastingNoteId) => ({
            user_id: params.userId,
            tasting_note_id: tastingNoteId,
          }))
        );

      if (primaryInsert.error) {
        const legacyInsert = await params.supabase
          .from('user_favorite_flavor_notes')
          .insert(
            params.favoriteTastingNoteIds.map((tastingNoteId) => ({
              user_id: params.userId,
              flavor_note_id: tastingNoteId,
            }))
          );

        if (legacyInsert.error) {
          if (isMissingFavoriteNotesRelation(primaryInsert.error)) {
            throw buildSchemaMissingError('Brakuje tabeli public.user_favorite_flavor_notes albo kolumny tasting_note_id.');
          }
          throw new Error(primaryInsert.error.message);
        }
      }
    }
  }

  const { error: authError } = await params.supabase.auth.updateUser({
    data: {
      display_name: trimmedName,
      avatar_url: params.avatarUrl,
      ...(params.markCompleted ? { profile_completed: true } : {}),
    },
  });

  if (authError) {
    throw new Error(authError.message);
  }
}

type QueryErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

const PROFILE_PREFERENCES_SCHEMA_MISSING = 'PROFILE_PREFERENCES_SCHEMA_MISSING';
const USER_PROFILE_ROW_MISSING = 'USER_PROFILE_ROW_MISSING';

function buildDomainError(code: string, details: string): Error {
  return new Error(`${code}: ${details}`);
}

function buildSchemaMissingError(details: string): Error {
  return buildDomainError(
    PROFILE_PREFERENCES_SCHEMA_MISSING,
    `${details} Uruchom migracje Supabase, w tym 0011_user_profile_preferences.sql oraz 0013_tasting_notes_source_of_truth.sql.`
  );
}

async function loadUsersRow(supabase: SupabaseClient, userId: string): Promise<{ row: UserRow | null }> {
  const withFavorite = await supabase
    .from('users')
    .select('display_name,avatar_url,favorite_brew_method_id,sensory_level,sensory_level_override,sensory_score')
    .eq('id', userId)
    .maybeSingle<UserRow>();

  if (!withFavorite.error) {
    return { row: withFavorite.data };
  }

  // Graceful fallback for older schemas: preserve as many fields as possible.
  if (
    isMissingFavoriteBrewMethodColumn(withFavorite.error) ||
    isMissingSensoryScoreColumn(withFavorite.error) ||
    isMissingSensoryLevelOverrideColumn(withFavorite.error)
  ) {
    const legacySelect = [
      'display_name',
      'avatar_url',
      isMissingFavoriteBrewMethodColumn(withFavorite.error) ? null : 'favorite_brew_method_id',
      'sensory_level',
      isMissingSensoryLevelOverrideColumn(withFavorite.error) ? null : 'sensory_level_override',
    ]
      .filter(Boolean)
      .join(',');

    const legacy = await supabase
      .from('users')
      .select(legacySelect)
      .eq('id', userId)
      .maybeSingle<
        Pick<UserRow, 'display_name' | 'avatar_url' | 'favorite_brew_method_id' | 'sensory_level' | 'sensory_level_override'>
      >();

    if (!legacy.error) {
      return {
        row: legacy.data
          ? {
              ...legacy.data,
              favorite_brew_method_id: legacy.data.favorite_brew_method_id ?? null,
              sensory_level_override: legacy.data.sensory_level_override ?? null,
              sensory_score: 0,
            }
          : null,
      };
    }

    if (isNoRowsMaybeSingleError(legacy.error)) {
      return { row: null };
    }

    if (isPermissionDeniedError(legacy.error)) {
      throw buildDomainError(
        USER_PROFILE_ROW_MISSING,
        'Brak rekordu public.users dla aktywnego usera albo brak dostępu RLS do rekordu.'
      );
    }

    throw new Error(legacy.error.message);
  }

  if (isNoRowsMaybeSingleError(withFavorite.error)) {
    return { row: null };
  }

  if (isPermissionDeniedError(withFavorite.error)) {
    throw buildDomainError(
      USER_PROFILE_ROW_MISSING,
      'Brak rekordu public.users dla aktywnego usera albo brak dostępu RLS do rekordu.'
    );
  }

  throw new Error(withFavorite.error.message);
}

function normalizeSensoryScore(raw: UserRow['sensory_score']): number {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) {
    return Math.floor(raw);
  }
  return 0;
}

function isNoRowsMaybeSingleError(error: QueryErrorLike): boolean {
  const code = String(error.code ?? '').toLowerCase();
  const message = String(error.message ?? '').toLowerCase();
  return code === 'pgrst116' || message.includes('0 rows') || message.includes('no rows');
}

function isPermissionDeniedError(error: QueryErrorLike): boolean {
  const code = String(error.code ?? '').toLowerCase();
  const message = String(error.message ?? '').toLowerCase();
  return code === '42501' || message.includes('row-level security') || message.includes('permission denied');
}

async function loadFavoriteTastingNoteRows(supabase: SupabaseClient, userId: string): Promise<Array<{ tasting_note_id: string }>> {
  const primary = await supabase
    .from('user_favorite_flavor_notes')
    .select('tasting_note_id')
    .eq('user_id', userId)
    .returns<Array<{ tasting_note_id: string }>>();

  if (!primary.error) {
    return primary.data ?? [];
  }

  // Backward compatibility for schemas before `tasting_note_id` rename.
  const legacy = await supabase
    .from('user_favorite_flavor_notes')
    .select('flavor_note_id')
    .eq('user_id', userId)
    .returns<Array<{ flavor_note_id: string }>>();

  if (!legacy.error) {
    return (legacy.data ?? []).map((item) => ({ tasting_note_id: item.flavor_note_id }));
  }

  if (isMissingFavoriteNotesRelation(primary.error)) {
    // Keep profile usable even if preferences relation is missing.
    return [];
  }

  throw new Error(primary.error.message);
}

async function saveUsersRow(
  supabase: SupabaseClient,
  userId: string,
  payload: { display_name: string; avatar_url: string; favorite_brew_method_id?: string | null }
): Promise<void> {
  const update = await supabase
    .from('users')
    .update(payload)
    .eq('id', userId)
    .select('id')
    .maybeSingle<{ id: string }>();

  if (!update.error && update.data?.id) {
    return;
  }

  if (update.error) {
    if ('favorite_brew_method_id' in payload && isMissingFavoriteBrewMethodColumn(update.error)) {
      throw buildSchemaMissingError('Brakuje kolumny public.users.favorite_brew_method_id.');
    }
    if (isMissingSensoryScoreColumn(update.error)) {
      throw buildSchemaMissingError('Brakuje kolumny public.users.sensory_score.');
    }
    if (isPermissionDeniedError(update.error)) {
      throw buildDomainError(
        USER_PROFILE_ROW_MISSING,
        'Brak rekordu public.users dla aktywnego usera albo brak dostępu RLS do aktualizacji.'
      );
    }
    throw new Error(update.error.message);
  }

  const insertPayload: { id: string; display_name: string; avatar_url: string; favorite_brew_method_id?: string | null } = {
    id: userId,
    display_name: payload.display_name,
    avatar_url: payload.avatar_url,
  };
  if ('favorite_brew_method_id' in payload) {
    insertPayload.favorite_brew_method_id = payload.favorite_brew_method_id;
  }

  const insert = await supabase
    .from('users')
    .insert(insertPayload)
    .select('id')
    .maybeSingle<{ id: string }>();

  if (insert.error) {
    if ('favorite_brew_method_id' in insertPayload && isMissingFavoriteBrewMethodColumn(insert.error)) {
      throw buildSchemaMissingError('Brakuje kolumny public.users.favorite_brew_method_id.');
    }
    if (isMissingSensoryScoreColumn(insert.error)) {
      throw buildSchemaMissingError('Brakuje kolumny public.users.sensory_score.');
    }
    if (isPermissionDeniedError(insert.error)) {
      throw buildDomainError(
        USER_PROFILE_ROW_MISSING,
        'Brak rekordu public.users i brak uprawnień do utworzenia rekordu przez RLS.'
      );
    }
    throw new Error(insert.error.message);
  }

  if (insert.data?.id) {
    return;
  }

  throw buildDomainError(
    USER_PROFILE_ROW_MISSING,
    'Nie udało się potwierdzić zapisu rekordu public.users po update/insert.'
  );
}

function isMissingFavoriteBrewMethodColumn(error: QueryErrorLike): boolean {
  const message = String(error.message ?? '').toLowerCase();
  const code = String(error.code ?? '').toLowerCase();
  return (
    (message.includes('favorite_brew_method_id') || message.includes('favourite_brew_method_id')) &&
    (message.includes('does not exist') || code === '42703' || code === 'pgrst204')
  );
}

function isMissingFavoriteNotesRelation(error: QueryErrorLike): boolean {
  const message = String(error.message ?? '').toLowerCase();
  const code = String(error.code ?? '').toLowerCase();
  return (
    (message.includes('user_favorite_flavor_notes') || message.includes('tasting_note_id')) &&
    (message.includes('does not exist') || code === '42p01' || code === 'pgrst205' || code === 'pgrst204')
  );
}

function isMissingSensoryScoreColumn(error: QueryErrorLike): boolean {
  const message = String(error.message ?? '').toLowerCase();
  const code = String(error.code ?? '').toLowerCase();
  return message.includes('sensory_score') && (message.includes('does not exist') || code === '42703' || code === 'pgrst204');
}

function isMissingSensoryLevelOverrideColumn(error: QueryErrorLike): boolean {
  const message = String(error.message ?? '').toLowerCase();
  const code = String(error.code ?? '').toLowerCase();
  return (
    message.includes('sensory_level_override') &&
    (message.includes('does not exist') || code === '42703' || code === 'pgrst204')
  );
}

export async function requestEmailChange(params: {
  supabase: SupabaseClient;
  nextEmail: string;
}): Promise<{ simulated: boolean }> {
  const { error } = await params.supabase.auth.updateUser({
    email: params.nextEmail,
  });

  if (!error) {
    return { simulated: false };
  }

  if (__DEV__) {
    return { simulated: true };
  }

  throw new Error(error.message);
}

export async function changePasswordWithReauth(params: {
  supabase: SupabaseClient;
  email: string;
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  // Prefer "change password with current password" in a single auth call.
  // This avoids an explicit sign-in with the old password, which can prevent iOS
  // from updating stored credentials in Password AutoFill.
  const { error: updateError } = await params.supabase.auth.updateUser({
    password: params.newPassword,
    // `current_password` is supported by Supabase Auth even if older supabase-js types don't expose it.
    ...(params.currentPassword ? ({ current_password: params.currentPassword } as Record<string, string>) : {}),
  } as never);

  if (updateError) {
    throw new Error(updateError.message || 'Nie udało się zmienić hasła.');
  }

  // Re-authenticate with the new password so iOS password manager can detect updated credentials.
  const { error: refreshSignInError } = await params.supabase.auth.signInWithPassword({
    email: params.email,
    password: params.newPassword,
  });

  if (refreshSignInError) {
    throw new Error(refreshSignInError.message);
  }
}
