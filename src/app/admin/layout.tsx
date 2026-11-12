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
    <div className="min-h-dvh bg-zinc-50 print:bg-white">
      <header className="bg-black text-white print:hidden">
        <div className="container-page flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Logo className="h-14 w-auto py-1.5" />
            <span className="rounded bg-royal-600 px-1.5 py-0.5 text-xs font-semibold">
              {t.admin.title}
            </span>
          </Link>

          <div className="flex items-center gap-2 text-sm sm:gap-3">
            <span className="hidden text-zinc-300 lg:inline">{profile.email}</span>
            <LanguageToggle />
            <Link href="/" className="rounded-md px-2.5 py-1 font-medium hover:bg-white/10">
              {t.admin.viewStore}
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md bg-white px-2.5 py-1 font-semibold text-ink hover:bg-zinc-200"
              >
                {t.nav.logout}
              </button>
            </form>
          </div>
        </div>
      </header>

      <AdminNav />

      <main className="container-page py-6 print:py-0">{children}</main>
    </div>
  );
}
