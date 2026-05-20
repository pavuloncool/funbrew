/**
 * Custom-scheme cold starts (e.g. funcup:///) parse to an empty path after Expo Router
 * strips a lone leading slash — which does not match the index route and shows Unmatched.
 * @see https://docs.expo.dev/router/advanced/native-intent/
 */
function normalizeQDeepLink(path: string, initial: boolean): string | null {
  const trimmed = path.trim();
  if (!trimmed) return null;

  const absoluteUrlPattern = /^[a-z][a-z0-9+.-]*:\/\//i;
  if (absoluteUrlPattern.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const pathname = url.pathname || '/';
      if (url.protocol === 'funcup:' && url.hostname === 'q') {
        const hash = pathname.replace(/^\/+/, '').split('/')[0];
        if (hash) {
          return `/q/${hash}${url.search}${url.hash}`;
        }
      }
      if (pathname.startsWith('/q/')) {
        return `${pathname}${url.search}${url.hash}`;
      }
    } catch {
      return null;
    }
  }

  if (trimmed.startsWith('/q/')) {
    return trimmed;
  }

  const withoutLeadingSlash = trimmed.replace(/^\/+/, '');
  if (withoutLeadingSlash.startsWith('q/')) {
    return `/${withoutLeadingSlash}`;
  }

  if (!initial) {
    return null;
  }

  const bareHashMatch = withoutLeadingSlash.match(/^([^/?#]+)([?#].*)?$/);
  if (!bareHashMatch) {
    return null;
  }

  const [, hash, suffix = ''] = bareHashMatch;
  return `/q/${hash}${suffix}`;
}

export function redirectSystemPath(event: { path: string; initial: boolean }): string {
  const { path, initial } = event;
  try {
    const trimmed = typeof path === 'string' ? path.trim() : '';
    if (trimmed === '' || trimmed === '/') {
      return '/';
    }
    const normalizedQDeepLink = normalizeQDeepLink(trimmed, initial);
    if (normalizedQDeepLink) {
      return normalizedQDeepLink;
    }
    return path;
  } catch {
    return '/';
  }
}
