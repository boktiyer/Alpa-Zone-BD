import type { Metadata } from 'next';
import { getI18n } from '@/i18n/server';
import { AuthForm } from '@/components/auth-form';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.nav.signup };
}

export default function SignupPage() {
  return (
    <div className="container-page py-10">
      <AuthForm mode="signup" />
    </div>
  );
}
