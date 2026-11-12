import Image from 'next/image';
import Link from 'next/link';
import { tr, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/en';
import { discountPercent, formatNumber, formatPrice } from '@/lib/format';
import { primaryImage } from '@/lib/queries';
import type { ProductCardData } from '@/types/database';

export function ProductCard({
  product,
  locale,
  t,
}: {
  product: ProductCardData;
  locale: Locale;
  t: Dictionary;
}) {
  const name = tr(product, 'name', locale);
  const image = primaryImage(product.product_images);
  const percent = discountPercent(product.price, product.compare_at_price);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-royal-300 hover:shadow-md"
    >
      <div className="relative aspect-[4/5] bg-royal-50">
        {image && (
          <Image
            src={image.url}
            alt={image.alt || name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        )}
        {percent > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-royal-600 px-2 py-0.5 text-xs font-semibold text-white">
            {formatNumber(percent, locale)}% {t.product.off}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium group-hover:text-royal-700 sm:text-base">
          {name}
        </h3>
        <p className="mt-auto flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-bold text-royal-700">
            {formatPrice(product.price, locale)}
          </span>
          {percent > 0 && product.compare_at_price && (
            <span className="text-sm text-zinc-500 line-through">
              {formatPrice(product.compare_at_price, locale)}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}

export function ProductGrid({
  products,
  locale,
  t,
}: {
  products: ProductCardData[];
  locale: Locale;
  t: Dictionary;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} locale={locale} t={t} />
      ))}
    </div>
  );
}
