import Link from 'next/link';
import { getI18n } from '@/i18n/server';
import { tr } from '@/i18n/config';
import { formatNumber } from '@/lib/format';
import { getCurrentProfile } from '@/lib/auth';
import { getCartCount } from '@/lib/cart';
import { getCategories } from '@/lib/queries';
import { Logo } from '@/components/logo';
import { LanguageToggle } from '@/components/language-toggle';
import { CartIcon, HeartIcon, SearchIcon, UserIcon } from '@/components/icons';

function SearchForm({ placeholder, label }: { placeholder: string; label: string }) {
  return (
    <form action="/products" role="search" className="relative w-full">
      <input
        type="search"
        name="q"
        aria-label={label}
        placeholder={placeholder}
        className="w-full rounded-full border-0 bg-white py-2 pl-4 pr-11 text-sm text-ink placeholder:text-zinc-500"
      />
      <button
        type="submit"
        aria-label={label}
        className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-royal-600 text-white hover:bg-royal-700"
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
  const iconLink =
    'relative size-10 place-items-center rounded-full text-ink hover:bg-black/10';

  const navItems = [
    { href: '/', label: t.nav.home },
    { href: '/products', label: t.nav.shop },
    ...topCategories.map((category) => ({
      href: `/category/${category.slug}`,
      label: tr(category, 'name', locale),
    })),
    { href: '/track-order', label: t.nav.track },
  ];

  return (
    <>
      <div className="bg-ink text-white">
        <p className="container-page py-1.5 text-center text-xs sm:text-sm">{t.topbar}</p>
      </div>

      <header className="sticky top-0 z-40 shadow-md">
        <div className="bg-sand">
          <div className="container-page flex items-center gap-3 sm:gap-5">
            <Link href="/" className="shrink-0">
              <Logo tone="light" className="h-16 w-auto py-1.5 sm:h-20" />
            </Link>

            <div className="hidden flex-1 md:block md:max-w-xl">
              <SearchForm placeholder={t.nav.search} label={t.nav.searchButton} />
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
              <LanguageToggle className="mr-1 text-ink" />

              <Link
                href="/wishlist"
                aria-label={t.nav.wishlist}
                className={`${iconLink} hidden md:grid`}
              >
                <HeartIcon className="size-6" />
              </Link>

              <Link
                href="/cart"
                aria-label={`${t.nav.cart} (${cartCount})`}
                className={`${iconLink} grid`}
              >
                <CartIcon className="size-6" />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-maroon px-1 text-xs font-bold leading-5 text-white">
                    {formatNumber(cartCount, locale)}
                  </span>
                )}
              </Link>

              {profile ? (
                <>
                  {profile.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="hidden rounded-md bg-ink px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-800 lg:inline-block"
                    >
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
                <Link
                  href="/login"
                  className="rounded-md bg-royal-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-royal-700"
                >
                  {t.nav.login}
                </Link>
              )}
            </div>
          </div>

          <div className="container-page pb-2.5 md:hidden">
            <SearchForm placeholder={t.nav.search} label={t.nav.searchButton} />
          </div>
        </div>
      </header>

      <nav aria-label={t.nav.categories} className="border-t border-black/10 bg-sand shadow-sm">
        <ul className="container-page no-scrollbar flex gap-1 overflow-x-auto py-1.5 text-sm font-medium">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block whitespace-nowrap rounded-md px-3 py-1.5 hover:bg-black/10"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
