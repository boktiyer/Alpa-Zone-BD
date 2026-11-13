import type { Metadata } from 'next';
import { getI18n } from '@/i18n/server';
import { createClient } from '@/lib/supabase/server';
import { ResetPasswordForm } from '@/components/password-forms';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.resetTitle, robots: { index: false } };
}

// Opened from the "forgot password" email link.
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="container-page py-10">
      <ResetPasswordForm loggedIn={Boolean(user)} />
    </div>
  );
}
