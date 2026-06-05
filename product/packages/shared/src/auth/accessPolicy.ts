import type { AccountRole } from './accountRole';
import { requiresPasswordChange } from './accountRole';

export type AuthSurface = 'web_roaster' | 'consumer_mobile';

export type WebLoginReason = 'roaster_auth_required' | 'consumer_mobile_only';
export type MobileLoginReason = 'roaster_web_only' | 'session_expired';
export type AuthReason = WebLoginReason | MobileLoginReason;

export const DEFAULT_WEB_POST_LOGIN_PATH = '/roaster-hub';
export const DEFAULT_MOBILE_POST_LOGIN_PATH = '/(tabs)/hub';
export const INCOMPLETE_PROFILE_MOBILE_PATH = '/(auth)/complete-profile';
export const ROASTER_ONBOARDING_PATH = '/roaster-profile';

type SearchParamsLike = { toString(): string } | string | null | undefined;

function normalizeSearchParams(
  searchParams: SearchParamsLike
): string {
  if (!searchParams) return '';
  if (typeof searchParams === 'string') return searchParams.replace(/^\?/, '');
  const rendered = searchParams.toString();
  return rendered;
}

export function canAccessSurface(role: AccountRole, surface: AuthSurface): boolean {
  if (surface === 'web_roaster') {
    return role === 'roaster';
  }

  return role === 'consumer';
}

export function getDeniedAccessReason(surface: AuthSurface): AuthReason {
  return surface === 'web_roaster' ? 'consumer_mobile_only' : 'roaster_web_only';
}

export function resolveWebPostLoginPath(nextParam: string | null): string {
  if (!nextParam) return DEFAULT_WEB_POST_LOGIN_PATH;
  if (!nextParam.startsWith('/') || nextParam.startsWith('//')) {
    return DEFAULT_WEB_POST_LOGIN_PATH;
  }
  if (
    nextParam.startsWith('/login') ||
    nextParam.startsWith('/register') ||
    nextParam.startsWith('/pending')
  ) {
    return DEFAULT_WEB_POST_LOGIN_PATH;
  }
  return nextParam;
}

export function resolveWebAuthenticatedPath(
  nextParam: string | null,
  userMetadata?: unknown
): string {
  if (requiresPasswordChange(userMetadata)) {
    return ROASTER_ONBOARDING_PATH;
  }

  return resolveWebPostLoginPath(nextParam);
}

export function shouldRedirectRoasterToOnboarding(
  pathname: string,
  userMetadata?: unknown
): boolean {
  return requiresPasswordChange(userMetadata) && !pathname.startsWith(ROASTER_ONBOARDING_PATH);
}

export function buildWebLoginRedirectTarget(
  pathname: string,
  searchParams: SearchParamsLike
): string {
  const search = normalizeSearchParams(searchParams);
  const nextPath = search.length > 0 ? `${pathname}?${search}` : pathname;
  return `/login?reason=roaster_auth_required&next=${encodeURIComponent(nextPath)}`;
}

export function resolveMobileAuthenticatedPath(profileCompleted: boolean): string {
  return profileCompleted ? DEFAULT_MOBILE_POST_LOGIN_PATH : INCOMPLETE_PROFILE_MOBILE_PATH;
}

export function getWebLoginReasonMessage(reason: string | null | undefined): string | null {
  if (reason === 'roaster_auth_required') {
    return 'Zaloguj się, by skorzystać z fun•brew';
  }
  if (reason === 'consumer_mobile_only') {
    return 'This consumer account is available in the mobile app only.';
  }
  return null;
}

export function getMobileLoginReasonMessage(reason: string | null | undefined): string | null {
  if (reason === 'roaster_web_only') {
    return 'To konto palarni działa tylko w aplikacji web.';
  }
  if (reason === 'session_expired') {
    return 'Twoja sesja wygasła. Zaloguj się w fun•brew.';
  }
  return null;
}
