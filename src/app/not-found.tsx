import Link from 'next/link';
import { getI18n } from '@/i18n/server';

export default async function NotFound() {
  const { t } = await getI18n();

  return (
    <main className="container-page flex min-h-dvh flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="text-6xl font-bold text-brand">404</p>
      <h1 className="text-2xl font-bold">{t.notFound.title}</h1>
      <p className="max-w-md text-zinc-600">{t.notFound.text}</p>
      <Link href="/" className="btn-primary">
        {t.notFound.back}
      </Link>
    </main>
  );
}
