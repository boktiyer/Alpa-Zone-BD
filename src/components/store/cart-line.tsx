'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { removeCartItem, updateCartItem } from '@/app/(store)/actions';
import { tr } from '@/i18n/config';
import { useI18n } from '@/i18n/provider';
import { formatNumber, formatPrice } from '@/lib/format';
import type { CartLine } from '@/types/database';
import { TrashIcon } from '@/components/icons';

/** One row of the cart: picture, name, quantity stepper (capped at stock), remove. */
export function CartLineRow({ line }: { line: CartLine }) {
  const { locale, t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const name = tr(line, 'name', locale);
  const unavailable = line.stock === 0;
  const overStock = !unavailable && line.quantity > line.stock;

  const change = (quantity: number) => {
    setError(null);
    startTransition(async () => {
      const result = await updateCartItem(line.id, quantity);
      if (!result.ok) setError(result.error);
    });
  };

  const remove = () => {
    setError(null);
    startTransition(async () => {
      const result = await removeCartItem(line.id);
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <li className={`flex gap-3 p-3 sm:gap-4 sm:p-4 ${pending ? 'opacity-60' : ''}`}>
      <Link
        href={`/products/${line.slug}`}
        className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-blush sm:size-24"
      >
        {line.imageUrl && (
          <Image src={line.imageUrl} alt="" fill sizes="96px" className="object-cover" />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/products/${line.slug}`} className="font-medium hover:text-brand">
              {name}
            </Link>
            {line.variantLabel && <p className="text-sm text-zinc-600">{line.variantLabel}</p>}
            <p className="text-sm text-zinc-600">{formatPrice(line.unitPrice, locale)}</p>
          </div>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label={`${t.cart.remove}: ${name}`}
            title={t.cart.remove}
            className="grid size-9 shrink-0 place-items-center rounded-md text-zinc-500 hover:bg-red-50 hover:text-red-700"
          >
            <TrashIcon className="size-5" />
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div
            role="group"
            aria-label={t.product.quantity}
            className="inline-flex items-center rounded-lg border border-border bg-white"
          >
            <button
              type="button"
              aria-label="−"
              disabled={pending || line.quantity <= 1}
              onClick={() => change(line.quantity - 1)}
              className="size-9 text-lg font-semibold disabled:opacity-30"
            >
              −
            </button>
            <span className="min-w-9 text-center text-sm font-semibold">
              {formatNumber(line.quantity, locale)}
            </span>
            <button
              type="button"
              aria-label="+"
              disabled={pending || line.quantity >= line.stock}
              onClick={() => change(line.quantity + 1)}
              className="size-9 text-lg font-semibold disabled:opacity-30"
            >
              +
            </button>
          </div>
          <p className="font-bold text-brand">{formatPrice(line.lineTotal, locale)}</p>
        </div>

        {unavailable ? (
          <p className="mt-2 text-sm font-medium text-red-700">{t.cart.unavailable}</p>
        ) : overStock ? (
          <p className="mt-2 text-sm font-medium text-red-700">
            {t.cart.stockLimit} {t.cart.maxStock} {formatNumber(line.stock, locale)}{' '}
            <button type="button" onClick={() => change(line.stock)} className="underline">
              OK
            </button>
          </p>
        ) : line.quantity >= line.stock ? (
          <p className="mt-2 text-xs text-zinc-500">
            {t.cart.maxStock} {formatNumber(line.stock, locale)}
          </p>
        ) : null}

        {error && (
          <p role="alert" className="mt-2 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
      </div>
    </li>
  );
}
