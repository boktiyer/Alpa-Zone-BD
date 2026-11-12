'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useI18n } from '@/i18n/provider';

// Shown when a store page crashes, instead of a blank screen.
export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-bold">{t.errors.title}</h1>
      <p className="max-w-md text-zinc-600">{t.errors.text}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          {t.errors.retry}
        </button>
        <Link href="/" className="btn-outline">
          {t.notFound.back}
        </Link>
      </div>
    </div>
  );
}
