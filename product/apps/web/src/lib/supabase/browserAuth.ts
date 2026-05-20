import type { Session, User } from '@supabase/supabase-js';

import { supabaseBrowser } from './browserClient';

function isInvalidRefreshTokenMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('invalid refresh token') ||
    normalized.includes('refresh token not found')
  );
}

async function clearBrokenLocalSession(): Promise<void> {
  try {
    await supabaseBrowser.auth.signOut({ scope: 'local' });
  } catch {
    // Ignore cleanup failures and treat the user as signed out.
  }
}

export async function getBrowserSessionSafely(): Promise<Session | null> {
  try {
    const { data, error } = await supabaseBrowser.auth.getSession();
    if (error) {
      if (isInvalidRefreshTokenMessage(error.message)) {
        await clearBrokenLocalSession();
        return null;
      }
      throw error;
    }
    return data.session ?? null;
  } catch (error) {
    if (error instanceof Error && isInvalidRefreshTokenMessage(error.message)) {
      await clearBrokenLocalSession();
      return null;
    }
    throw error;
  }
}

export async function getBrowserUserSafely(): Promise<User | null> {
  try {
    const { data, error } = await supabaseBrowser.auth.getUser();
    if (error) {
      if (isInvalidRefreshTokenMessage(error.message)) {
        await clearBrokenLocalSession();
        return null;
      }
      throw error;
    }
    return data.user ?? null;
  } catch (error) {
    if (error instanceof Error && isInvalidRefreshTokenMessage(error.message)) {
      await clearBrokenLocalSession();
      return null;
    }
    throw error;
  }
}
