import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getI18n } from '@/i18n/server';
import { getCurrentProfile } from '@/lib/auth';
import { logout } from '@/app/auth/actions';
import { ProfileForm } from '@/components/profile-form';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.account.title };
}

export default async function AccountPage() {
  const [{ t }, profile] = await Promise.all([getI18n(), getCurrentProfile()]);
  // src/proxy.ts already blocks guests; this is a second check.
  if (!profile) redirect('/login?next=/account');

  const isAdmin = profile.role === 'admin';

  return (
    <div className="container-page max-w-3xl pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{t.account.title}</h1>
        <form action={logout}>
          <button type="submit" className="btn-outline">
            {t.nav.logout}
          </button>
        </form>
      </div>

      <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-zinc-600">{t.account.role}:</span>
        <span
          className={`rounded-full px-3 py-0.5 font-semibold ${
            isAdmin ? 'bg-ink text-white' : 'bg-blush text-brand-dark'
          }`}
        >
          {isAdmin ? t.account.roleAdmin : t.account.roleCustomer}
        </span>
        {isAdmin && (
          <Link href="/admin" className="font-semibold text-brand hover:underline">
            {t.nav.admin} →
          </Link>
        )}
      </p>

      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { href: '/account/orders', label: t.nav.orders },
          { href: '/wishlist', label: t.nav.wishlist },
          { href: '/track-order', label: t.nav.track },
        ].map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-xl border border-border bg-white p-4 text-center font-semibold hover:border-brand hover:text-brand"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-6 rounded-2xl border border-border bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">{t.account.profile}</h2>
        <ProfileForm profile={profile} />
      </section>
    </div>
  );
}
