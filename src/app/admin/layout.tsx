import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getI18n } from '@/i18n/server';
import { getCurrentProfile } from '@/lib/auth';
import { logout } from '@/app/auth/actions';
import { Logo } from '@/components/logo';
import { LanguageToggle } from '@/components/language-toggle';
import { AdminNav } from '@/components/admin/client';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: { default: t.admin.title, template: `%s | ${t.admin.title}` }, robots: 'noindex' };
}

// Admin panel shell. Three layers keep customers out:
//   1. src/proxy.ts redirects non-admins before the page renders
//   2. this layout (and every admin action) checks the role again on the server
//   3. Row Level Security in the database refuses the data anyway
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [{ t }, profile] = await Promise.all([getI18n(), getCurrentProfile()]);
  if (!profile) redirect('/login?next=/admin');
  if (profile.role !== 'admin') redirect('/');

  return (
    <div className="flex min-h-dvh flex-col bg-page print:bg-white">
      <header className="bg-footer text-white print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <Logo className="h-14 w-auto py-1.5" />
            <span className="rounded-md bg-gold px-2 py-0.5 text-xs font-semibold text-brand-dark">
              {t.admin.title}
            </span>
          </Link>

          <div className="flex items-center gap-2 text-sm sm:gap-3">
            <span className="hidden text-white/70 lg:inline">{profile.email}</span>
            <LanguageToggle />
            <Link href="/" className="rounded-md px-2.5 py-1 font-medium hover:bg-white/10">
              {t.admin.viewStore}
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md bg-gold px-2.5 py-1 font-semibold text-brand-dark transition-colors hover:bg-white"
              >
                {t.nav.logout}
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <AdminNav />
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 print:p-0">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
