'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/i18n/provider';
import { formatNumber } from '@/lib/format';
import { CartIcon, GridIcon, HeartIcon, HomeIcon, UserIcon } from '@/components/icons';

/** Bottom navigation bar, shown on phones only. */
export function MobileNav({ cartCount, loggedIn }: { cartCount: number; loggedIn: boolean }) {
  const { locale, t } = useI18n();
  const pathname = usePathname();

  const items = [
    { href: '/', label: t.nav.home, icon: HomeIcon, active: pathname === '/' },
    {
      href: '/products',
      label: t.nav.shop,
      icon: GridIcon,
      active: pathname.startsWith('/products') || pathname.startsWith('/category'),
    },
    {
      href: '/cart',
      label: t.nav.cart,
      icon: CartIcon,
      active: pathname.startsWith('/cart') || pathname.startsWith('/checkout'),
      badge: cartCount,
    },
    {
      href: '/wishlist',
      label: t.nav.wishlist,
      icon: HeartIcon,
      active: pathname.startsWith('/wishlist'),
    },
    {
      href: loggedIn ? '/account' : '/login',
      label: loggedIn ? t.nav.account : t.nav.login,
      icon: UserIcon,
      active: pathname.startsWith('/account') || pathname === '/login' || pathname === '/signup',
    },
  ];

  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-ivory pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, icon: IconComponent, active, badge }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                active ? 'text-brand' : 'text-zinc-700'
              }`}
            >
              <span className="relative">
                <IconComponent className="size-6" />
                {badge ? (
                  <span className="absolute -right-2.5 -top-1.5 grid min-w-[18px] place-items-center rounded-full bg-sale px-1 text-[10px] font-bold leading-[18px] text-white">
                    {formatNumber(badge, locale)}
                  </span>
                ) : null}
              </span>
              <span className="max-w-full truncate px-1">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
