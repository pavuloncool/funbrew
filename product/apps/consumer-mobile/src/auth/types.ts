export type AuthUser = {
  id: string;
  email: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export type AuthStatus = 'bootstrapping' | 'authenticated' | 'unauthenticated' | 'locked';

export type AuthSnapshot = {
  user: AuthUser | null;
  session: AuthSession | null;
  profileCompleted: boolean;
};
