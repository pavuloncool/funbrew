/** Max upload size for coffee label image (bytes). */
export const MAX_COFFEE_LABEL_BYTES = 512_000;

/**
 * Folder segment for storage path `{segment}/{uuid}.{ext}`.
 * Derived from `roaster_short_name`.
 */
export function storageSegmentFromRoasterShortName(name: string): string {
  const segment = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (segment || 'roaster').slice(0, 48);
}

export function assertCoffeeLabelFileSize(file: File): void {
  if (file.size > MAX_COFFEE_LABEL_BYTES) {
    throw new Error('File too large');
  }
}
