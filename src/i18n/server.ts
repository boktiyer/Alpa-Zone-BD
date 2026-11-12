import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from './config';
import type { Dictionary } from './dictionaries/en';
import en from './dictionaries/en';
import bn from './dictionaries/bn';

const dictionaries: Record<Locale, Dictionary> = { bn, en };

/** Language chosen by the visitor (saved in a cookie). Bangla by default. */
export const getLocale = cache(async (): Promise<Locale> => {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
});

/** Use in Server Components: const { locale, t } = await getI18n(); */
export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
