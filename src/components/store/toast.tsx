'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckIcon } from '@/components/icons';

type ToastDetail = { text: string; href?: string; linkText?: string; tone?: 'ok' | 'error' };
type ToastItem = ToastDetail & { id: number };

const EVENT = 'alpa:toast';
/** Fired after something was added to the cart (the header cart icon bounces). */
export const CART_ADDED_EVENT = 'alpa:cart-added';

/** Show a small message at the bottom of the screen for a few seconds. */
export function toast(detail: ToastDetail) {
  window.dispatchEvent(new CustomEvent<ToastDetail>(EVENT, { detail }));
}

export function announceCartAdded() {
  window.dispatchEvent(new Event(CART_ADDED_EVENT));
}

/** Renders the toasts. Placed once in the store layout. */
export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (event: Event) => {
      const item = { ...(event as CustomEvent<ToastDetail>).detail, id: Date.now() + Math.random() };
      setItems((current) => [...current.slice(-2), item]);
      setTimeout(() => setItems((current) => current.filter((it) => it.id !== item.id)), 3500);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6"
    >
      {items.map((item) => (
        <div
          key={item.id}
          role={item.tone === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto flex max-w-sm animate-toast items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
            item.tone === 'error' ? 'bg-sale' : 'bg-brand-dark'
          }`}
        >
          {item.tone !== 'error' && (
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gold text-brand-dark">
              <CheckIcon className="size-4" />
            </span>
          )}
          <span>{item.text}</span>
          {item.href && item.linkText && (
            <Link href={item.href} className="shrink-0 font-semibold text-gold underline">
              {item.linkText}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
