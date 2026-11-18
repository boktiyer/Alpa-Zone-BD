import { categoryPath } from '@/lib/category-url';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getI18n } from '@/i18n/server';
import { tr } from '@/i18n/config';
import { formatPrice } from '@/lib/format';
import { getWishlistIds } from '@/lib/cart';
import { getProductBySlug } from '@/lib/queries';
import { DELIVERY_CHARGE } from '@/types/database';
import { ProductGallery } from '@/components/store/product-gallery';
import { ProductPurchase } from '@/components/store/product-purchase';

type Props = { params: Promise<{ slug: string }> };

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [{ locale }, product] = await Promise.all([getI18n(), getProductBySlug(slug)]);
  if (!product) return {};

  const title = tr(product, 'name', locale);
  const description = tr(product, 'description', locale).slice(0, 160) || undefined;
  const image = product.product_images.find((item) => item.is_primary) ?? product.product_images[0];

  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/products/${product.slug}`,
      images: image ? [image.url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [{ locale, t }, product, wishlistIds] = await Promise.all([
    getI18n(),
    getProductBySlug(slug),
    getWishlistIds(),
  ]);
  if (!product) notFound();

  const name = tr(product, 'name', locale);
  const description = tr(product, 'description', locale);
  const images = [...product.product_images].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  const variants = product.product_variants.filter((variant) => variant.is_active);
  const productUrl = `${siteUrl}/products/${product.slug}`;
  const inStock =
    variants.length > 0 ? variants.some((variant) => variant.stock > 0) : product.stock > 0;

  // Structured data so Google can show price and availability.
  // Sizes / colours may have their own price, so give the real range.
  const prices = variants.length > 0 ? variants.map((variant) => variant.price ?? product.price) : [product.price];
  const lowPrice = Math.min(...prices);
  const highPrice = Math.max(...prices);
  const availability = inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: description || undefined,
    sku: product.sku || undefined,
    brand: { '@type': 'Brand', name: t.brand },
    category: product.categories ? tr(product.categories, 'name', locale) : undefined,
    image: images.map((image) =>
      image.url.startsWith('http') ? image.url : `${siteUrl}${image.url}`,
    ),
    offers:
      lowPrice === highPrice
        ? { '@type': 'Offer', url: productUrl, priceCurrency: 'BDT', price: lowPrice, availability }
        : {
            '@type': 'AggregateOffer',
            url: productUrl,
            priceCurrency: 'BDT',
            lowPrice,
            highPrice,
            offerCount: variants.length,
            availability,
          },
  };

  return (
    <div className="container-page pt-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
        <Link href="/" className="hover:text-brand">
          {t.nav.home}
        </Link>
        {product.categories && (
          <>
            <span className="mx-1.5">/</span>
            <Link href={categoryPath(product.categories.slug)} className="hover:text-brand">
              {tr(product.categories, 'name', locale)}
            </Link>
          </>
        )}
      </nav>

      {/* The photo and the details fade up one after the other when the page opens. */}
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div className="animate-fade-in">
          <ProductGallery
            name={name}
            images={images.map((image) => ({ id: image.id, url: image.url, alt: image.alt }))}
          />
        </div>

        <div className="animate-fade-in [animation-delay:120ms]">
          <h1 className="text-2xl font-bold sm:text-3xl">{name}</h1>
          {product.sku && (
            <p className="mt-1 text-sm text-zinc-500">
              {t.product.sku}: {product.sku}
            </p>
          )}

          <div className="mt-4">
            <ProductPurchase
              productId={product.id}
              slug={product.slug}
              name={name}
              price={product.price}
              compareAtPrice={product.compare_at_price}
              stock={product.stock}
              inWishlist={wishlistIds.includes(product.id)}
              productUrl={productUrl}
              variants={variants.map((variant) => ({
                id: variant.id,
                size: variant.size,
                color: variant.color,
                stock: variant.stock,
                price: variant.price,
              }))}
            />
          </div>

          <dl className="mt-6 grid gap-3 rounded-xl border border-border bg-white p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold">{t.product.delivery}</dt>
              <dd className="mt-1 text-zinc-600">
                {t.product.deliveryDhaka}: {formatPrice(DELIVERY_CHARGE.dhaka, locale)}
                <br />
                {t.product.deliveryOutside}: {formatPrice(DELIVERY_CHARGE.outside, locale)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">{t.product.payment}</dt>
              <dd className="mt-1 text-zinc-600">{t.product.paymentMethods}</dd>
            </div>
          </dl>

          {description && (
            <section className="mt-6">
              <h2 className="text-lg font-semibold">{t.product.description}</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-zinc-700">
                {description}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
