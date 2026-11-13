import Link from 'next/link';
import { getI18n } from '@/i18n/server';
import { tr } from '@/i18n/config';
import { getCurrentProfile } from '@/lib/auth';
import { getCartCount } from '@/lib/cart';
import { getCategories } from '@/lib/queries';
import { categoryPath } from '@/lib/category-url';
import { Logo } from '@/components/logo';
import { LanguageToggle } from '@/components/language-toggle';
import { HeartIcon, SearchIcon, UserIcon } from '@/components/icons';
import {
  CartLink,
  HeaderShell,
  MobileMenu,
  NavLinks,
  type NavItem,
} from '@/components/store/header-client';

function SearchForm({ placeholder, label }: { placeholder: string; label: string }) {
  return (
    <form action="/products" role="search" className="relative w-full">
      <input
        type="search"
        name="q"
        aria-label={label}
        placeholder={placeholder}
        className="w-full rounded-full border border-border bg-white py-2 pl-4 pr-11 text-sm text-ink placeholder:text-zinc-500 focus:border-brand focus:outline-none"
      />
      <button
        type="submit"
        aria-label={label}
        className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark"
      >
        <SearchIcon className="size-4" />
      </button>
    </form>
  );
}

export async function Header() {
  const [{ locale, t }, profile, categories, cartCount] = await Promise.all([
    getI18n(),
    getCurrentProfile(),
    getCategories(),
    getCartCount(),
  ]);
  const topCategories = categories.filter((category) => !category.parent_id);
  // The admin link is only ever rendered for admins. /admin itself is also
  // protected by the proxy, the admin layout and Row Level Security.
  const isAdmin = profile?.role === 'admin';
  const iconLink =
    'relative size-10 place-items-center rounded-full text-ink transition-colors hover:bg-brand/10 hover:text-brand';

  const navItems: NavItem[] = [
    { href: '/', label: t.nav.home },
    { href: '/products', label: t.nav.shop },
    ...topCategories.map((category) => ({
      href: categoryPath(category.slug),
      label: tr(category, 'name', locale),
    })),
    { href: '/track-order', label: t.nav.track },
  ];
  const accountItems: NavItem[] = profile
    ? [
        { href: '/account', label: t.nav.account },
        { href: '/account/orders', label: t.nav.orders },
        { href: '/wishlist', label: t.nav.wishlist },
      ]
    : [
        { href: '/login', label: t.nav.login },
        { href: '/signup', label: t.nav.signup },
      ];

  return (
    <>
      <div className="bg-brand-dark text-white">
        <p className="container-page py-1.5 text-center text-xs sm:text-sm">{t.topbar}</p>
      </div>

      <HeaderShell>
        <div className="container-page flex items-center gap-2 sm:gap-5">
          <MobileMenu items={navItems} extra={accountItems} isAdmin={isAdmin} />

          <Link href="/" className="shrink-0">
            <Logo
              tone="light"
              className="h-14 w-auto origin-left py-1 transition-transform duration-300 ease-soft group-data-[scrolled=true]/header:scale-[0.86] sm:h-[4.5rem]"
            />
          </Link>

          <div className="hidden flex-1 md:block md:max-w-xl">
            <SearchForm placeholder={t.nav.search} label={t.nav.searchButton} />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <LanguageToggle className="mr-1 hidden text-ink sm:inline-block" />

            <Link
              href="/wishlist"
              aria-label={t.nav.wishlist}
              className={`${iconLink} hidden md:grid`}
            >
              <HeartIcon className="size-6" />
            </Link>

            <CartLink count={cartCount} label={t.nav.cart} />

            {profile ? (
              <>
                {isAdmin && (
                  <Link href="/admin" className="btn-primary hidden min-h-9 px-3 py-1.5 text-sm lg:inline-flex">
                    {t.nav.admin}
                  </Link>
                )}
                <Link
                  href="/account"
                  aria-label={t.nav.account}
                  className={`${iconLink} hidden md:grid`}
                >
                  <UserIcon className="size-6" />
                </Link>
              </>
            ) : (
              <Link href="/login" className="btn-primary min-h-9 px-3 py-1.5 text-sm">
                {t.nav.login}
              </Link>
            )}
          </div>
        </div>

        <div className="container-page pb-2.5 md:hidden">
          <SearchForm placeholder={t.nav.search} label={t.nav.searchButton} />
        </div>

        <NavLinks items={navItems} label={t.nav.categories} />
      </HeaderShell>
    </>
  );
}
