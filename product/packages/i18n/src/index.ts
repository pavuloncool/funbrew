import en from './locales/en';
import pl from './locales/pl';

export type Locale = 'en' | 'pl';

export const locales = { en, pl } as const;
export type LocaleKey = keyof typeof locales;

let currentLocale: Locale = 'en';

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: string, params?: Record<string, string>): string {
  const keys = key.split('.');
  let value: unknown = locales[currentLocale];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }
  
  if (typeof value !== 'string') return key;
  
  if (params) {
    return Object.entries(params).reduce(
      (str, [k, v]) => str.replace(`{${k}}`, v),
      value
    );
  }
  
  return value;
}

export { en, pl };