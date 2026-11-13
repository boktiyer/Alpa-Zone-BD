import Image from 'next/image';
import Link from 'next/link';
import { tr, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/en';
import { discountPercent, formatNumber, formatPrice } from '@/lib/format';
import { getWishlistIds } from '@/lib/cart';
import { primaryImage } from '@/lib/queries';
import type { ProductCardData } from '@/types/database';
import { WishlistHeart } from '@/components/store/wishlist-heart';

/** A product counts as "new" for this many days after it was added. */
const NEW_FOR_DAYS = 14;

/**
 * Lowest price a customer can pay for the product. Sizes / colours may have
 * their own price; if they differ, the card shows "from ৳…".
 */
function cardPrice(product: ProductCardData): { price: number; from: boolean } {
  const prices = (product.product_variants ?? [])
    .filter((variant) => variant.is_active)
    .map((variant) => variant.price ?? product.price);
  if (prices.length === 0) return { price: product.price, from: false };
  const lowest = Math.min(...prices);
  return { price: lowest, from: prices.some((price) => price !== lowest) };
}

export function ProductCard({
  product,
  locale,
  t,
  inWishlist = false,
}: {
  product: ProductCardData;
  locale: Locale;
  t: Dictionary;
  inWishlist?: boolean;
}) {
  const name = tr(product, 'name', locale);
  const image = primaryImage(product.product_images);
  const { price, from } = cardPrice(product);
  const percent = discountPercent(price, product.compare_at_price);
  const isNew = Date.now() - Date.parse(product.created_at) < NEW_FOR_DAYS * 86_400_000;
  const priceText = formatPrice(price, locale);

  return (
    <div className="card-lift group flex h-full flex-col rounded-xl border border-border bg-white">
      <Link href={`/products/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/5] overflow-hidden rounded-t-xl bg-blush">
          {image && (
            <Image
              src={image.url}
              alt={image.alt || name}
              fill
              sizes="(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-500 ease-soft group-hover:scale-105"
            />
          )}
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {percent > 0 && (
              <span className="rounded-md bg-sale px-2 py-0.5 text-xs font-semibold text-white">
                {formatNumber(percent, locale)}% {t.product.off}
              </span>
            )}
            {isNew && (
              <span className="rounded-md bg-gold px-2 py-0.5 text-xs font-semibold text-brand-dark">
                {t.product.new}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3">
          <h3 className="line-clamp-2 font-sans text-sm font-medium transition-colors duration-300 group-hover:text-brand sm:text-base">
            {name}
          </h3>
          <p className="mt-auto flex flex-wrap items-baseline gap-x-2">
            <span className="text-lg font-bold text-brand">
              {from ? t.product.fromPrice.replace('{price}', priceText) : priceText}
            </span>
            {percent > 0 && product.compare_at_price && (
              <span className="text-sm text-zinc-500 line-through">
                {formatPrice(product.compare_at_price, locale)}
              </span>
            )}
          </p>
        </div>
      </Link>

      <WishlistHeart productId={product.id} initial={inWishlist} />
    </div>
  );
}

/** Responsive product grid: 2 columns on phones, 3 on tablets, 4 on desktop. */
export async function ProductGrid({
  products,
  locale,
  t,
}: {
  products: ProductCardData[];
  locale: Locale;
  t: Dictionary;
}) {
  const wishlistIds = new Set(await getWishlistIds());

  return (
    <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          locale={locale}
          t={t}
          inWishlist={wishlistIds.has(product.id)}
        />
      ))}
    </div>
  );
}
