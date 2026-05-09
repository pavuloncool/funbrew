const PUBLIC_MARKETING_ROUTES = new Set([
  '/',
  '/home',
  '/about',
  '/pricing',
  '/features',
  '/contact',
  '/market',
  '/login',
  '/register',
  '/pending',
]);

export function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_MARKETING_ROUTES.has(pathname)) {
    return true;
  }

  return pathname.startsWith('/q/');
}
