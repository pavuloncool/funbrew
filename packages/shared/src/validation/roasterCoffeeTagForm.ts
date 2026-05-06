import type { RoasterCoffeeBeanType, RoasterCoffeeTagInsert } from '@funcup/types';
import { z } from 'zod';

/** Max upload size for coffee label image (bytes). */
export const MAX_COFFEE_LABEL_BYTES = 512_000;

export const ALLOWED_COFFEE_LABEL_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseLocalDay(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function startOfTodayLocal(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** Local calendar date as `YYYY-MM-DD` (same as HTML date inputs). */
export function getTodayIsoDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Folder segment for Storage path `{segment}/{uuid}.{ext}`.
 * Derived from `roaster_short_name` (no UUID column on `roaster_coffee_tags`).
 */
export function storageSegmentFromRoasterShortName(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (s || 'roaster').slice(0, 48);
}

export const roasterCoffeeTagClientFormSchema = z
  .object({
    roaster_short_name: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1, 'Wymagane').max(64, 'Max 64 znaków')),
    coffeeLabelFile: z.union([z.instanceof(File), z.undefined()]),
    bean_origin_country: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1, 'Wybierz kraj')),
    bean_origin_farm: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1, 'Wymagane').max(96, 'Max 96 znaków')),
    bean_origin_tradename: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1, 'Wymagane').max(48, 'Max 48 znaków')),
    bean_origin_region: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1, 'Wymagane').max(96, 'Max 96 znaków')),
    bean_type: z
      .string()
      .refine((v) => v === 'arabica' || v === 'robusta', { message: 'Wybierz gatunek' }),
    bean_varietal_main: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1, 'Wymagane').max(48, 'Max 48 znaków')),
    bean_varietal_extra: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().max(48, 'Max 48 znaków')),
    bean_origin_height: z
      .string()
      .transform((s) => s.trim())
      .pipe(
        z
          .string()
          .regex(/^\d{1,4}$/, 'Liczba naturalna, max 4 cyfry')
          .refine((s) => {
            const h = Number(s);
            return Number.isInteger(h) && h >= 0 && h <= 3000;
          }, 'Wartość 0–3000')
      ),
    bean_processing: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1, 'Wybierz obróbkę')),
    bean_roast_date: z
      .string()
      .transform((s) => s.trim())
      .pipe(
        z
          .string()
          .min(1, 'Wymagane')
          .regex(ISO_DATE, 'Format RRRR-MM-DD')
          .refine((s) => !Number.isNaN(parseLocalDay(s).getTime()), 'Nieprawidłowa data')
          .refine((s) => {
            const roast = parseLocalDay(s);
            const today = startOfTodayLocal();
            return roast.getTime() <= today.getTime();
          }, 'Data nie może być w przyszłości')
      ),
    bean_roast_level: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1, 'Wybierz stopień wypału')),
    brew_method: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1, 'Wybierz przeznaczenie')),
  })
  .superRefine((data, ctx) => {
    const f = data.coffeeLabelFile;
    if (!(f instanceof File)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Wymagane', path: ['coffeeLabelFile'] });
      return;
    }
    if (f.size > MAX_COFFEE_LABEL_BYTES) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Plik max 512 KB', path: ['coffeeLabelFile'] });
    }
    const mimeOk = (ALLOWED_COFFEE_LABEL_MIME as readonly string[]).includes(f.type);
    if (!mimeOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Dozwolone: JPEG, PNG, WebP',
        path: ['coffeeLabelFile'],
      });
    }
  });

/** Raw form shape (e.g. empty selects before submit). */
export type RoasterCoffeeTagClientFormInput = z.input<typeof roasterCoffeeTagClientFormSchema>;

/** Validated form output (same fields; `bean_type` is a known gatunek). */
export type RoasterCoffeeTagClientFormValues = z.output<typeof roasterCoffeeTagClientFormSchema>;

export function assertCoffeeLabelFileSize(file: File): void {
  if (file.size > MAX_COFFEE_LABEL_BYTES) {
    throw new Error('File too large');
  }
}

export function clientFormValuesToInsert(
  v: RoasterCoffeeTagClientFormValues,
  img_coffee_label: string,
  roaster_id: string,
  tasting_note_ids: string[] = []
): RoasterCoffeeTagInsert {
  const url = img_coffee_label.trim();
  if (!url) {
    throw new Error('Image upload failed');
  }
  if (!(v.coffeeLabelFile instanceof File)) {
    throw new Error('Image upload failed');
  }
  return {
    roaster_id,
    roaster_short_name: v.roaster_short_name,
    img_coffee_label: url,
    bean_origin_country: v.bean_origin_country,
    bean_origin_farm: v.bean_origin_farm,
    bean_origin_tradename: v.bean_origin_tradename,
    bean_origin_region: v.bean_origin_region,
    bean_type: v.bean_type as RoasterCoffeeBeanType,
    bean_varietal_main: v.bean_varietal_main,
    bean_varietal_extra: v.bean_varietal_extra,
    bean_origin_height: Number(v.bean_origin_height),
    bean_processing: v.bean_processing,
    bean_roast_date: v.bean_roast_date,
    bean_roast_level: v.bean_roast_level,
    brew_method: v.brew_method,
    tasting_note_ids,
  };
}
