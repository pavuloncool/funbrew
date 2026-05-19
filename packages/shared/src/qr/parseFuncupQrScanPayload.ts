/**
 * Extracts `public_hash` from QR payload text. Does not call Supabase — Edge `scan_qr` resolves the hash.
 * Supports: bare UUID, https?://host/.../q/{hash}, funcup://q/{hash} (see consumer app.config scheme).
 */
// Accept all UUIDs stored in DB (including seeded values with 0000 version/variant groups).
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeHash(candidate: string): string | null {
  const t = candidate.trim();
  if (!UUID_RE.test(t)) return null;
  return t.toLowerCase();
}

/** Path pattern from roaster-app QR: `/q/{public_hash}` */
function hashFromSlashQPathname(pathname: string): string | null {
  const p = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const m = p.match(/^\/q\/([^/?#]+)/);
  if (!m) return null;
  try {
    return normalizeHash(decodeURIComponent(m[1]));
  } catch {
    return normalizeHash(m[1]);
  }
}

export function parseFuncupQrScanPayload(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  const bare = normalizeHash(raw);
  if (bare) return bare;

  try {
    const u = new URL(raw);

    if (u.protocol === 'http:' || u.protocol === 'https:') {
      const fromPath = hashFromSlashQPathname(u.pathname);
      if (fromPath) return fromPath;
    }

    // funcup://q/{hash} → URL parser sets hostname "q", pathname "/{uuid}"
    if (u.protocol === 'funcup:' && u.hostname === 'q') {
      const segment = u.pathname.replace(/^\//, '');
      const h = normalizeHash(segment);
      if (h) return h;
    }
  } catch {
    // not an absolute URL
  }

  const rel = hashFromSlashQPathname(raw);
  if (rel) return rel;

  return null;
}
