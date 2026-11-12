import type { Metadata } from 'next';
import { getI18n } from '@/i18n/server';
import { safeNextPath } from '@/lib/format';
import { AuthForm } from '@/components/auth-form';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.nav.login };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const [{ t }, params] = await Promise.all([getI18n(), searchParams]);

  return (
    <div className="container-page py-10">
      <AuthForm
        mode="login"
        next={safeNextPath(params.next)}
        initialError={params.error ? t.auth.linkError : undefined}
      />
    </div>
  );
}
