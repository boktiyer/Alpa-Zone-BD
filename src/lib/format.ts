import type { Locale } from '@/i18n/config';

const numberLocale = (locale: Locale) => (locale === 'bn' ? 'bn-BD' : 'en-US');

/** 1450 → "৳১,৪৫০" (bn) or "৳1,450" (en) */
export function formatPrice(amount: number, locale: Locale): string {
  return `৳${new Intl.NumberFormat(numberLocale(locale), { maximumFractionDigits: 2 }).format(amount)}`;
}

/** 12 → "১২" (bn) or "12" (en) */
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(numberLocale(locale)).format(value);
}

export function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Dhaka',
  }).format(new Date(value));
}

/** Percentage saved, e.g. price 1450 / old price 1850 → 22 */
export function discountPercent(price: number, compareAt: number | null): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

/** Only allow redirects to pages of this site ("/account"), never to other sites. */
export function safeNextPath(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  return value;
}

/** Bangladeshi mobile number: 01XXXXXXXXX, with or without +88 / spaces / dashes. */
export function isValidBdPhone(value: string): boolean {
  const digits = value.replace(/[^0-9]/g, '').replace(/^88/, '');
  return /^01[3-9][0-9]{8}$/.test(digits);
}

export function formatDateTime(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Dhaka',
  }).format(new Date(value));
}
