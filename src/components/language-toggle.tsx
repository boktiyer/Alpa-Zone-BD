'use client';

import { useTransition } from 'react';
import { setLocale } from '@/i18n/actions';
import { useI18n } from '@/i18n/provider';

/** বাংলা ⇄ English. The choice is saved in a cookie for one year. */
export function LanguageToggle({ className = '' }: { className?: string }) {
  const { locale, t } = useI18n();
  const [pending, startTransition] = useTransition();
  const next = locale === 'bn' ? 'en' : 'bn';

  return (
    <button
      type="button"
      aria-label={t.language.label}
      disabled={pending}
      onClick={() => startTransition(() => setLocale(next))}
      className={`rounded-md border border-current/30 px-2.5 py-1 text-sm font-semibold transition hover:border-current disabled:opacity-60 ${className}`}
    >
      {t.language.switchTo}
    </button>
  );
}
