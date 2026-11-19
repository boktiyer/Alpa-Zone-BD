'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useI18n } from '@/i18n/provider';
import { formatNumber } from '@/lib/format';
import { LanguageToggle } from '@/components/language-toggle';
import { InstallAppButton } from '@/components/store/install-app-button';
import { CartIcon, CloseIcon, MenuIcon } from '@/components/icons';
import { CART_ADDED_EVENT } from '@/components/store/toast';

export type NavItem = { href: string; label: string };

const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

/**
 * Sticky header. After a little scrolling it gets `data-scrolled`, which the
 * children use (through `group-data-[scrolled=true]/header:`) to shrink the
 * logo slightly and deepen the shadow.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header data-scrolled={scrolled} className="group/header sticky top-0 z-40 bg-ivory">
      {children}
      {/* The shadow lives on its own layer so only its opacity animates. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border shadow-[0_6px_16px_rgb(53_16_28/0.18)] opacity-40 transition-opacity duration-300 group-data-[scrolled=true]/header:opacity-100"
      />
    </header>
  );
}

/** Desktop category links: brand colour + gold underline on hover / current page. */
export function NavLinks({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="hidden border-t border-border/70 md:block">
      <ul className="container-page flex flex-wrap gap-x-1 text-sm font-medium">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative block whitespace-nowrap px-3 py-2.5 transition-colors duration-300 hover:text-brand ${
                  active ? 'text-brand' : 'text-ink'
                } after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:origin-left after:rounded-full after:bg-gold after:transition-transform after:duration-300 hover:after:scale-x-100 ${
                  active ? 'after:scale-x-100' : 'after:scale-x-0'
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Cart icon with the item count. Bounces when something is added to the cart. */
export function CartLink({ count, label }: { count: number; label: string }) {
  const { locale } = useI18n();
  const [bounce, setBounce] = useState(0);

  useEffect(() => {
    const onAdded = () => setBounce((value) => value + 1);
    window.addEventListener(CART_ADDED_EVENT, onAdded);
    return () => window.removeEventListener(CART_ADDED_EVENT, onAdded);
  }, []);

  return (
    <Link
      href="/cart"
      aria-label={`${label} (${count})`}
      className="relative grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-brand/10 hover:text-brand"
    >
      {/* A new key restarts the animation on every add. */}
      <span key={bounce} className={bounce > 0 ? 'animate-bounce-once' : ''}>
        <CartIcon className="size-6" />
      </span>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-sale px-1 text-xs font-bold leading-5 text-white">
          {formatNumber(count, locale)}
        </span>
      )}
    </Link>
  );
}

/** Phone menu: a panel that slides in from the left. */
export function MobileMenu({
  items,
  extra,
  isAdmin,
}: {
  items: NavItem[];
  /** Account / login / wishlist links under the categories. */
  extra: NavItem[];
  /** Decided on the server from the profile role; non-admins never receive the link. */
  isAdmin: boolean;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close when the page changes or Escape is pressed; stop the page scrolling behind.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const link = (item: NavItem) => {
    const active = isActive(pathname, item.href);
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-current={active ? 'page' : undefined}
          onClick={() => setOpen(false)}
          className={`block rounded-xl px-3 py-2.5 font-medium ${
            active ? 'bg-brand text-white' : 'text-ink hover:bg-blush hover:text-brand'
          }`}
        >
          {item.label}
        </Link>
      </li>
    );
  };

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={t.nav.menu}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="grid size-10 place-items-center rounded-full text-ink hover:bg-brand/10 hover:text-brand"
      >
        <MenuIcon className="size-6" />
      </button>

      {/* Backdrop */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-footer/60 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.nav.menu}
        inert={!open}
        className={`fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-xs flex-col bg-ivory shadow-2xl transition-transform duration-300 ease-soft ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-display text-lg font-semibold text-brand">{t.nav.menu}</span>
          <button
            type="button"
            aria-label={t.nav.close}
            onClick={() => setOpen(false)}
            className="grid size-10 place-items-center rounded-full text-ink hover:bg-brand/10 hover:text-brand"
          >
            <CloseIcon className="size-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">{items.map(link)}</ul>
          <hr className="my-3 border-border" />
          <ul className="space-y-1">
            {extra.map(link)}
            {isAdmin && (
              <li>
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="block rounded-xl bg-brand-dark px-3 py-2.5 font-semibold text-white"
                >
                  {t.nav.admin}
                </Link>
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-2 border-t border-border p-3">
          <InstallAppButton variant="menu" />
          <LanguageToggle className="w-full text-ink" />
        </div>
      </div>
    </div>
  );
}
