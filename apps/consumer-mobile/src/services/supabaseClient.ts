import { type TypedSupabaseClient } from '@funcup/shared';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { Database } from '../../../../supabase/types/database';
import { createSupabaseSecureStorageAdapter, ExpoSecureStorageService } from '../auth/secureStorage';

type SupabaseExtra = {
  supabaseFallbackUrl?: string;
  supabaseFallbackAnonKey?: string;
};

/** Same defaults as app.config.ts — used only if env + manifest extra are empty. */
const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321';
const LOCAL_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.9kEXx9GFfgcZ21LlMB1qI-LOwSGOzI8g8c92UgEHQDk';

function getSupabaseExtra(): SupabaseExtra {
  const e = Constants.expoConfig?.extra ?? Constants.manifest2?.extra;
  return (e ?? {}) as SupabaseExtra;
}

/**
 * Resolve URL/key after native bridge + Expo manifest are ready (fixes stale config when importing early).
 * Prefer manifest `extra` from app.config (loaded via dotenv when Expo CLI starts).
 */
function resolveSupabaseConfig(): { url: string; key: string; usedFallbackUrl: boolean; usedFallbackKey: boolean } {
  const extra = getSupabaseExtra();
  const envUrl =
    typeof process.env.EXPO_PUBLIC_SUPABASE_URL === 'string' && process.env.EXPO_PUBLIC_SUPABASE_URL.length > 0
      ? process.env.EXPO_PUBLIC_SUPABASE_URL
      : undefined;
  const envKey =
    typeof process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY === 'string' && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.length > 0
      ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
      : undefined;
  const extraUrl =
    typeof extra.supabaseFallbackUrl === 'string' && extra.supabaseFallbackUrl.length > 0
      ? extra.supabaseFallbackUrl
      : undefined;
  const extraKey =
    typeof extra.supabaseFallbackAnonKey === 'string' && extra.supabaseFallbackAnonKey.length > 0
      ? extra.supabaseFallbackAnonKey
      : undefined;

  const url = extraUrl || envUrl || LOCAL_SUPABASE_URL;
  const key = extraKey || envKey || LOCAL_SUPABASE_ANON_KEY;
  const usedFallbackUrl = !extraUrl && !envUrl;
  const usedFallbackKey = !extraKey && !envKey;

  return { url, key, usedFallbackUrl, usedFallbackKey };
}

let _client: TypedSupabaseClient | null = null;
let _didLogSupabaseConfig = false;

/** Lazily creates the client so Constants.expoConfig.extra matches the last Metro manifest (important for Expo Go). */
export function getSupabase(): TypedSupabaseClient {
  if (!_client) {
    const { url, key, usedFallbackUrl, usedFallbackKey } = resolveSupabaseConfig();
    const secureStorage = new ExpoSecureStorageService();

    _client = createClient<Database>(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        ...(Platform.OS !== 'web' ? { storage: createSupabaseSecureStorageAdapter(secureStorage) } : {}),
      },
    });

    if (__DEV__ && !_didLogSupabaseConfig) {
      _didLogSupabaseConfig = true;
      try {
        const host = new URL(url).host;
        console.info(`[supabase] configured host: ${host}`);
      } catch {
        console.info(`[supabase] configured host: ${url}`);
      }

      if (usedFallbackUrl || usedFallbackKey) {
        console.warn(
          '[supabase] Using built-in local fallback config. Verify EXPO_PUBLIC_SUPABASE_URL/ANON_KEY to avoid connecting to a different backend after restart.'
        );
      }
    }
  }
  return _client;
}

/**
 * Shared Supabase singleton — use `getSupabase()` or this proxy (backward compatible).
 * Proxy ensures lazy init for Expo Go + LAN / .env timing.
 */
export const supabase = new Proxy({} as TypedSupabaseClient, {
  get(_target, prop: string | symbol) {
    const c = getSupabase();
    const value = (c as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(c);
    }
    return value;
  },
});

/** For dev UI: which API host the client uses (should match local Studio DB when developing against CLI). */
export function getResolvedSupabasePublicOrigin(): string {
  try {
    const url = resolveSupabaseConfig().url;
    return new URL(url).host;
  } catch {
    return resolveSupabaseConfig().url;
  }
}

/** For URL rewriting (e.g. localhost image URLs to LAN host on physical iOS device). */
export function getResolvedSupabasePublicUrl(): string {
  return resolveSupabaseConfig().url;
}
