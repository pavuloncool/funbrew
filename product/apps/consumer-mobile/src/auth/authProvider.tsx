import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { MobileLoginReason } from '@funcup/shared';
import type { Session } from '@supabase/supabase-js';

import { getSupabase } from '../services/supabaseClient';
import { type AuthService, SessionExpiredAuthError, SupabaseAuthService } from './authService';
import { resolveProfileCompletedFromUser } from './profileCompletion';
import { ExpoSecureStorageService } from './secureStorage';
import type { AuthSession, AuthSnapshot, AuthStatus, AuthUser } from './types';

const REFRESH_MARGIN_MS = 60_000;
const REFRESH_RETRY_DELAYS_MS = [500, 1500, 3500] as const;

type AuthContextValue = {
  status: AuthStatus;
  isLoading: boolean;
  loginReason: MobileLoginReason | null;
  user: AuthUser | null;
  profileCompleted: boolean;
  session: AuthSession | null;
  biometricsEnabled: boolean;
  login: (params: { email: string; password: string }) => Promise<void>;
  register: (params: { email: string; password: string; displayName: string }) => Promise<{ hasSession: boolean }>;
  logout: () => Promise<void>;
  lockWithBiometrics: () => Promise<void>;
  unlockWithBiometrics: () => Promise<boolean>;
  enableBiometrics: () => Promise<void>;
  disableBiometrics: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function createAuthService(): AuthService {
  return new SupabaseAuthService(getSupabase(), new ExpoSecureStorageService());
}

function shouldRefreshSoon(session: AuthSession | null): boolean {
  if (!session) return false;
  return session.expiresAt - Date.now() <= REFRESH_MARGIN_MS;
}

function isNetworkLikeError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('fetch') ||
    message.includes('request_timeout')
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function mapSession(session: Session): AuthSession {
  const expiresAtMs = (session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in) * 1000;

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: expiresAtMs,
  };
}

function mapSnapshotFromSession(session: Session): AuthSnapshot {
  return {
    user: session.user.email
      ? {
          id: session.user.id,
          email: session.user.email,
        }
      : null,
    session: mapSession(session),
    profileCompleted: resolveProfileCompletedFromUser(session.user),
  };
}

export function AuthProvider(props: { children: ReactNode }) {
  const authService = useMemo(() => createAuthService(), []);
  const statusRef = useRef<AuthStatus>('bootstrapping');
  const [status, setStatus] = useState<AuthStatus>('bootstrapping');
  const [loginReason, setLoginReason] = useState<MobileLoginReason | null>(null);
  const [snapshot, setSnapshot] = useState<AuthSnapshot>({
    user: null,
    session: null,
    profileCompleted: false,
  });
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  const setAuthenticated = useCallback((nextSnapshot: AuthSnapshot) => {
    setLoginReason(null);
    setSnapshot(nextSnapshot);
    statusRef.current = 'authenticated';
    setStatus('authenticated');
  }, []);

  const setUnauthenticated = useCallback(() => {
    setSnapshot({ user: null, session: null, profileCompleted: false });
    statusRef.current = 'unauthenticated';
    setStatus('unauthenticated');
  }, []);

  const retryRefreshSession = useCallback(async () => {
    for (let index = 0; index < REFRESH_RETRY_DELAYS_MS.length; index += 1) {
      try {
        return await authService.refreshSession();
      } catch (error) {
        const isLastTry = index === REFRESH_RETRY_DELAYS_MS.length - 1;
        if (!isNetworkLikeError(error) || isLastTry) {
          throw error;
        }

        const jitter = Math.floor(Math.random() * 200);
        await delay(REFRESH_RETRY_DELAYS_MS[index] + jitter);
      }
    }

    throw new Error('Nie udało się odświeżyć sesji.');
  }, [authService]);

  const refreshSession = useCallback(async () => {
    const refreshed = await retryRefreshSession();
    setAuthenticated(refreshed);
  }, [retryRefreshSession, setAuthenticated]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const enabled = await authService.isBiometricsEnabled();
        if (mounted) {
          setBiometricsEnabled(enabled);
        }

        let restored = await authService.restoreSession();

        if (restored.session && shouldRefreshSoon(restored.session)) {
          try {
            restored = await retryRefreshSession();
          } catch (error) {
            if (error instanceof SessionExpiredAuthError) {
              setLoginReason('session_expired');
              try {
                await authService.logout();
              } catch {
                // Local cleanup already runs in logout() finally.
              }
              if (mounted) {
                setUnauthenticated();
              }
              return;
            }

            throw error;
          }
        }

        if (!mounted) return;

        if (restored.session) {
          setAuthenticated(restored);
          return;
        }

        setLoginReason(null);
        setUnauthenticated();
      } catch (error) {
        if (!mounted) return;
        if (error instanceof SessionExpiredAuthError) {
          setLoginReason('session_expired');
          try {
            await authService.logout();
          } catch {
            // Local cleanup already runs in logout() finally.
          }
        } else {
          setLoginReason(null);
        }
        setUnauthenticated();
      }
    };

    void bootstrap();

    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !session?.access_token) {
        setUnauthenticated();
        return;
      }

      if (statusRef.current === 'locked') {
        return;
      }

      setAuthenticated(mapSnapshotFromSession(session));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [authService, retryRefreshSession, setAuthenticated, setUnauthenticated]);

  const login = useCallback(
    async (params: { email: string; password: string }) => {
      const nextSnapshot = await authService.login(params);
      setAuthenticated(nextSnapshot);
    },
    [authService, setAuthenticated]
  );

  const register = useCallback(
    async (params: { email: string; password: string; displayName: string }) => {
      const nextSnapshot = await authService.register(params);
      if (nextSnapshot.session) {
        setAuthenticated(nextSnapshot);
        return { hasSession: true };
      }

      setLoginReason(null);
      setUnauthenticated();
      return { hasSession: false };
    },
    [authService, setAuthenticated, setUnauthenticated]
  );

  const logout = useCallback(async () => {
    setLoginReason(null);
    await authService.logout();
    setBiometricsEnabled(false);
    setUnauthenticated();
  }, [authService, setUnauthenticated]);

  const lockWithBiometrics = useCallback(async () => {
    await authService.lockWithBiometrics();
    statusRef.current = 'locked';
    setStatus('locked');
  }, [authService]);

  const unlockWithBiometrics = useCallback(async (): Promise<boolean> => {
    const unlocked = await authService.unlockWithBiometrics();
    if (unlocked) {
      const nextStatus = snapshot.session ? 'authenticated' : 'unauthenticated';
      statusRef.current = nextStatus;
      setStatus(nextStatus);
    }

    return unlocked;
  }, [authService, snapshot.session]);

  const enableBiometrics = useCallback(async () => {
    await authService.enableBiometrics();
    setBiometricsEnabled(true);
  }, [authService]);

  const disableBiometrics = useCallback(async () => {
    await authService.disableBiometrics();
    setBiometricsEnabled(false);
  }, [authService]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      isLoading: status === 'bootstrapping',
      loginReason,
      user: snapshot.user,
      profileCompleted: snapshot.profileCompleted,
      session: snapshot.session,
      biometricsEnabled,
      login,
      register,
      logout,
      lockWithBiometrics,
      unlockWithBiometrics,
      enableBiometrics,
      disableBiometrics,
      refreshSession,
    }),
    [
      biometricsEnabled,
      disableBiometrics,
      enableBiometrics,
      loginReason,
      lockWithBiometrics,
      login,
      logout,
      refreshSession,
      register,
      snapshot.profileCompleted,
      snapshot.session,
      snapshot.user,
      status,
      unlockWithBiometrics,
    ]
  );

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}
