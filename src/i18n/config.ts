export const locales = ['bn', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'bn';
export const LOCALE_COOKIE = 'azbd_locale';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

/**
 * Pick the Bangla or English column of a database row.
 * tr(category, 'name', 'bn') → category.name_bn (falls back to name_en if empty)
 */
export function tr(row: object, field: string, locale: Locale): string {
  const record = row as Record<string, unknown>;
  const value = record[`${field}_${locale}`] || record[`${field}_en`] || record[`${field}_bn`];
  return typeof value === 'string' ? value : '';
}
