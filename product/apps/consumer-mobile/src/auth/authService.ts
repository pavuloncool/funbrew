import type { TypedSupabaseClient } from '@funcup/shared';
import * as LocalAuthentication from 'expo-local-authentication';
import type { Session } from '@supabase/supabase-js';

import type { AuthSession, AuthSnapshot, AuthUser } from './types';
import { resolveProfileCompletedFromUser } from './profileCompletion';
import { AUTH_STORAGE_KEYS, type SecureStorageService } from './secureStorage';

export const SESSION_EXPIRED_MOBILE_MESSAGE = 'Twoja sesja wygasła. Zaloguj się w fun•brew.';

export class SessionExpiredAuthError extends Error {
  constructor() {
    super(SESSION_EXPIRED_MOBILE_MESSAGE);
    this.name = 'SessionExpiredAuthError';
  }
}

export interface AuthService {
  register(params: { email: string; password: string; displayName: string }): Promise<AuthSnapshot>;
  login(params: { email: string; password: string }): Promise<AuthSnapshot>;
  logout(): Promise<void>;
  restoreSession(): Promise<AuthSnapshot>;
  refreshSession(): Promise<AuthSnapshot>;
  lockWithBiometrics(): Promise<void>;
  unlockWithBiometrics(): Promise<boolean>;
  enableBiometrics(): Promise<void>;
  disableBiometrics(): Promise<void>;
  isBiometricsEnabled(): Promise<boolean>;
}

export class SupabaseAuthService implements AuthService {
  constructor(
    private readonly supabase: TypedSupabaseClient,
    private readonly secureStorage: SecureStorageService
  ) {}

  async register(params: { email: string; password: string; displayName: string }): Promise<AuthSnapshot> {
    const trimmedDisplayName = params.displayName.trim();
    const fallbackDisplayName = params.email.split('@')[0] ?? 'User';
    const { data, error } = await this.supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          app_role: 'consumer',
          display_name: trimmedDisplayName || fallbackDisplayName,
          profile_completed: false,
        },
      },
    });

    if (error) {
      if (isAlreadyRegisteredError(error)) {
        const { data: signInData, error: signInError } = await this.supabase.auth.signInWithPassword({
          email: params.email,
          password: params.password,
        });

        if (!signInError && signInData.session) {
          await this.persistSessionMaterial(signInData.session);
          await this.signOutOtherSessions();
          return mapSnapshot(signInData.user, signInData.session);
        }

        throw new Error('Konto z tym adresem email już istnieje. Zaloguj się.');
      }

      throw new Error(formatAuthError(error, 'register'));
    }

    if (data.session) {
      await this.persistSessionMaterial(data.session);
      await this.signOutOtherSessions();
    }

    return mapSnapshot(data.user, data.session);
  }

  async login(params: { email: string; password: string }): Promise<AuthSnapshot> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });

    if (error) {
      throw new Error(formatAuthError(error, 'login'));
    }

    if (!data.session) {
      throw new Error('Brak aktywnej sesji po logowaniu.');
    }

    await this.persistSessionMaterial(data.session);
    await this.signOutOtherSessions();

    return mapSnapshot(data.user, data.session);
  }

  async logout(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut({ scope: 'local' });
      if (error) {
        throw new Error(formatAuthError(error, 'logout'));
      }
    } finally {
      await this.secureStorage.clearAuthData();
    }
  }

  async restoreSession(): Promise<AuthSnapshot> {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) {
      if (isInvalidRefreshError(error)) {
        throw new SessionExpiredAuthError();
      }
      throw new Error(formatAuthError(error, 'session'));
    }

    if (!data.session) {
      await this.secureStorage.clearAuthData();
      return {
        user: null,
        session: null,
        profileCompleted: false,
      };
    }

    await this.persistSessionMaterial(data.session);

    return mapSnapshot(data.session.user, data.session);
  }

  async refreshSession(): Promise<AuthSnapshot> {
    const { data, error } = await this.supabase.auth.refreshSession();

    if (error) {
      if (isInvalidRefreshError(error)) {
        throw new SessionExpiredAuthError();
      }
      throw new Error(formatAuthError(error, 'session'));
    }

    if (!data.session) {
      throw new Error('Nie udało się odświeżyć sesji.');
    }

    await this.persistSessionMaterial(data.session);

    return mapSnapshot(data.session.user, data.session);
  }

  async lockWithBiometrics(): Promise<void> {
    const enabled = await this.isBiometricsEnabled();
    if (!enabled) {
      throw new Error('Najpierw włącz odblokowanie biometrią.');
    }
  }

  async unlockWithBiometrics(): Promise<boolean> {
    const enabled = await this.isBiometricsEnabled();
    if (!enabled) {
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Odblokuj sesję',
      cancelLabel: 'Anuluj',
      disableDeviceFallback: false,
      fallbackLabel: 'Użyj kodu urządzenia',
    });

    return result.success;
  }

  async enableBiometrics(): Promise<void> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      throw new Error('Biometria jest niedostępna na tym urządzeniu.');
    }

    await this.secureStorage.set(AUTH_STORAGE_KEYS.biometricEnabled, 'true');
  }

  async disableBiometrics(): Promise<void> {
    await this.secureStorage.remove(AUTH_STORAGE_KEYS.biometricEnabled);
  }

  async isBiometricsEnabled(): Promise<boolean> {
    const value = await this.secureStorage.get(AUTH_STORAGE_KEYS.biometricEnabled);
    return value === 'true';
  }

  private async persistSessionMaterial(session: Session): Promise<void> {
    const normalized = mapSession(session);
    await this.secureStorage.set(AUTH_STORAGE_KEYS.refreshToken, normalized.refreshToken);
  }

  private async signOutOtherSessions(): Promise<void> {
    const { error } = await this.supabase.auth.signOut({ scope: 'others' });
    if (error) {
      // Best effort: do not block active login if other-session revocation fails.
      return;
    }
  }
}

function mapUser(user: Session['user'] | null): AuthUser | null {
  if (!user || !user.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}

function mapSession(session: Session): AuthSession {
  const expiresAtMs = (session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in) * 1000;

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: expiresAtMs,
  };
}

function mapSnapshot(user: Session['user'] | null, session: Session | null): AuthSnapshot {
  return {
    user: mapUser(user),
    session: session ? mapSession(session) : null,
    profileCompleted: resolveProfileCompletedFromUser(user),
  };
}

type AuthContext = 'register' | 'login' | 'logout' | 'session';

type AuthErrorLike = {
  message?: string;
  code?: string;
};

function isAlreadyRegisteredError(error: AuthErrorLike): boolean {
  const code = String(error.code ?? '').toLowerCase();
  const message = String(error.message ?? '').toLowerCase();

  return (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    message.includes('user already registered') ||
    message.includes('already exists')
  );
}

function isInvalidRefreshError(error: AuthErrorLike): boolean {
  const code = String(error.code ?? '').toLowerCase();
  const message = String(error.message ?? '').toLowerCase();

  return (
    code === 'invalid_grant' ||
    code === 'refresh_token_not_found' ||
    code === 'refresh_token_already_used' ||
    message.includes('refresh token') ||
    message.includes('invalid_grant') ||
    message.includes('refresh_token_not_found') ||
    message.includes('refresh_token_already_used')
  );
}

function formatAuthError(error: AuthErrorLike, context: AuthContext): string {
  const code = String(error.code ?? '').toLowerCase();
  const message = String(error.message ?? '').toLowerCase();

  if (context === 'register' && isAlreadyRegisteredError(error)) {
    return 'Konto z tym adresem email już istnieje. Zaloguj się.';
  }

  if (context === 'login' && (code === 'invalid_credentials' || message.includes('invalid login credentials'))) {
    return 'Nieprawidłowy email lub hasło.';
  }

  if (message.includes('webcrypto is unavailable')) {
    return 'Błąd konfiguracji bezpiecznego storage. Uruchom aplikację ponownie.';
  }

  if (context === 'session') {
    return 'Nie udało się odtworzyć sesji. Zaloguj się ponownie.';
  }

  if (context === 'logout') {
    return 'Nie udało się wylogować.';
  }

  if (context === 'register') {
    return 'Rejestracja nie powiodła się. Spróbuj ponownie.';
  }

  if (context === 'login') {
    return 'Logowanie nie powiodło się. Spróbuj ponownie.';
  }

  return 'Wystąpił błąd autoryzacji.';
}
