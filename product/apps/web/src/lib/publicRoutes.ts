const PUBLIC_MARKETING_ROUTES = new Set([
  '/',
  '/home',
  '/about',
  '/support',
  '/contact',
  '/business',
  '/pricing',
  '/features',
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

export function isMarketingRoute(pathname: string): boolean {
  return MARKETING_ROUTES.has(pathname);
}

const MARKETING_ROUTES = new Set(['/home', '/register', '/about', '/support', '/contact', '/business']);
