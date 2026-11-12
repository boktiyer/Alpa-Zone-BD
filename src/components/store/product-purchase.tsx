'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { addToCart, toggleWishlist } from '@/app/(store)/actions';
import { whatsappLink } from '@/config/site';
import { useI18n } from '@/i18n/provider';
import { discountPercent, formatNumber, formatPrice } from '@/lib/format';
import { CartIcon, HeartIcon, WhatsAppIcon } from '@/components/icons';

type Variant = {
  id: string;
  size: string | null;
  color: string | null;
  stock: number;
  /** null → use the product price */
  price: number | null;
};

function unique(values: (string | null)[]): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

/**
 * Buy box on the product page: price, size + colour, stock, quantity,
 * Add to Cart, Wishlist and "Order on WhatsApp".
 */
export function ProductPurchase({
  productId,
  slug,
  name,
  price,
  compareAtPrice,
  stock,
  variants,
  inWishlist: initialInWishlist,
  productUrl,
}: {
  productId: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  variants: Variant[];
  inWishlist: boolean;
  productUrl: string;
}) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const sizes = useMemo(() => unique(variants.map((variant) => variant.size)), [variants]);
  const colors = useMemo(() => unique(variants.map((variant) => variant.color)), [variants]);

  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [adding, startAdding] = useTransition();
  const [wishing, startWishing] = useTransition();

  const hasVariants = variants.length > 0;
  const needsSize = sizes.length > 0;
  const needsColor = colors.length > 0;
  const complete = (!needsSize || size !== null) && (!needsColor || color !== null);

  const selected = complete
    ? variants.find(
        (variant) =>
          (!needsSize || variant.size === size) && (!needsColor || variant.color === color),
      )
    : undefined;

  const shownPrice = selected?.price ?? price;
  const percent = discountPercent(shownPrice, compareAtPrice);
  const available = hasVariants ? (selected?.stock ?? 0) : stock;
  const canBuy = (!hasVariants || Boolean(selected)) && available > 0;
  const safeQuantity = Math.min(quantity, Math.max(available, 1));

  // Is there any in-stock variant with this option, given the other choice?
  const optionInStock = (option: { size?: string; color?: string }) =>
    variants.some(
      (variant) =>
        variant.stock > 0 &&
        variant.size === (option.size ?? size ?? variant.size) &&
        variant.color === (option.color ?? color ?? variant.color),
    );

  const optionClass = (active: boolean, enabled: boolean) =>
    `rounded-lg border px-3.5 py-1.5 text-sm font-medium transition ${
      active
        ? 'border-royal-600 bg-royal-600 text-white'
        : enabled
          ? 'border-zinc-300 bg-white hover:border-royal-500'
          : 'border-zinc-200 bg-white text-zinc-400 line-through'
    }`;

  const pick = (kind: 'size' | 'color', value: string) => {
    setFeedback(null);
    setQuantity(1);
    if (kind === 'size') setSize(size === value ? null : value);
    else setColor(color === value ? null : value);
  };

  const goToLogin = () => router.push(`/login?next=${encodeURIComponent(`/products/${slug}`)}`);

  const handleAdd = () => {
    if (hasVariants && !complete) {
      setFeedback({ type: 'error', text: t.product.chooseOptions });
      return;
    }
    startAdding(async () => {
      const result = await addToCart({
        productId,
        variantId: selected?.id ?? null,
        quantity: safeQuantity,
      });
      if (result.ok) setFeedback({ type: 'ok', text: t.product.added });
      else if (result.needLogin) goToLogin();
      else setFeedback({ type: 'error', text: result.error });
    });
  };

  const handleWishlist = () => {
    startWishing(async () => {
      const result = await toggleWishlist(productId);
      if (result.ok) setInWishlist(result.inWishlist);
      else if (result.needLogin) goToLogin();
      else setFeedback({ type: 'error', text: result.error });
    });
  };

  const whatsappMessage = [
    t.product.whatsappText,
    name,
    selected ? [selected.size, selected.color].filter(Boolean).join(' / ') : '',
    `${t.product.quantity}: ${safeQuantity}`,
    formatPrice(shownPrice, 'en'),
    productUrl,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div className="space-y-4">
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-3xl font-bold text-royal-700">{formatPrice(shownPrice, locale)}</span>
        {percent > 0 && compareAtPrice && (
          <>
            <span className="text-lg text-zinc-500 line-through">
              {formatPrice(compareAtPrice, locale)}
            </span>
            <span className="rounded-md bg-royal-100 px-2 py-0.5 text-sm font-semibold text-royal-800">
              {formatNumber(percent, locale)}% {t.product.off}
            </span>
          </>
        )}
      </p>

      {needsSize && (
        <fieldset>
          <legend className="text-sm font-semibold">{t.product.size}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizes.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={size === value}
                onClick={() => pick('size', value)}
                className={optionClass(size === value, optionInStock({ size: value }))}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {needsColor && (
        <fieldset>
          <legend className="text-sm font-semibold">{t.product.color}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {colors.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={color === value}
                onClick={() => pick('color', value)}
                className={optionClass(color === value, optionInStock({ color: value }))}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <p aria-live="polite" className="text-sm font-medium">
        {hasVariants && !complete ? (
          <span className="text-zinc-600">{t.product.chooseOptions}</span>
        ) : hasVariants && !selected ? (
          <span className="text-red-700">{t.product.unavailableCombo}</span>
        ) : available > 0 ? (
          <span className="text-green-700">
            {t.product.inStock}
            {available <= 5 && ` · ${formatNumber(available, locale)} ${t.product.left}`}
          </span>
        ) : (
          <span className="text-red-700">{t.product.outOfStock}</span>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label={t.product.quantity}
          className="inline-flex items-center rounded-lg border border-zinc-300 bg-white"
        >
          <button
            type="button"
            aria-label="−"
            disabled={safeQuantity <= 1}
            onClick={() => setQuantity(safeQuantity - 1)}
            className="size-11 text-xl font-semibold disabled:opacity-30"
          >
            −
          </button>
          <span className="min-w-10 text-center font-semibold" aria-live="polite">
            {formatNumber(safeQuantity, locale)}
          </span>
          <button
            type="button"
            aria-label="+"
            disabled={!canBuy || safeQuantity >= available}
            onClick={() => setQuantity(safeQuantity + 1)}
            className="size-11 text-xl font-semibold disabled:opacity-30"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || (complete && !canBuy)}
          className="btn-primary min-w-44 flex-1 py-3 sm:flex-none"
        >
          <CartIcon className="size-5" />
          {adding ? t.product.adding : t.product.addToCart}
        </button>

        <button
          type="button"
          onClick={handleWishlist}
          disabled={wishing}
          aria-pressed={inWishlist}
          aria-label={inWishlist ? t.product.removeWishlist : t.product.addWishlist}
          title={inWishlist ? t.product.removeWishlist : t.product.addWishlist}
          className={`grid size-12 place-items-center rounded-lg border bg-white transition disabled:opacity-60 ${
            inWishlist
              ? 'border-red-300 text-red-600'
              : 'border-zinc-300 text-zinc-700 hover:border-red-300 hover:text-red-600'
          }`}
        >
          <HeartIcon filled={inWishlist} className="size-6" />
        </button>
      </div>

      {feedback && (
        <p
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`rounded-lg p-3 text-sm ${
            feedback.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
          }`}
        >
          {feedback.text}{' '}
          {feedback.type === 'ok' && (
            <Link href="/cart" className="font-semibold underline">
              {t.product.viewCart} →
            </Link>
          )}
        </p>
      )}

      <a
        href={whatsappLink(whatsappMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#128c4a] px-5 py-3 font-semibold text-white transition hover:bg-[#0e733c] sm:w-auto"
      >
        <WhatsAppIcon className="size-5" />
        {t.product.whatsappOrder}
      </a>
    </div>
  );
}
