import type { Metadata } from 'next';
import Link from 'next/link';
import { getI18n } from '@/i18n/server';
import { getWishlistProducts } from '@/lib/cart';
import { ProductCard } from '@/components/store/product-card';
import { WishlistRemove } from '@/components/store/wishlist-remove';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.wishlist.title, robots: { index: false } };
}

export default async function WishlistPage() {
  const [{ locale, t }, products] = await Promise.all([getI18n(), getWishlistProducts()]);

  return (
    <div className="container-page pt-6">
      <h1 className="text-2xl font-bold sm:text-3xl">{t.wishlist.title}</h1>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-14 text-center">
          <p className="text-zinc-600">{t.wishlist.empty}</p>
          <Link href="/products" className="btn-primary">
            {t.cart.continueShopping}
          </Link>
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.id} className="flex flex-col">
              <div className="flex flex-1 flex-col [&>a]:flex-1">
                <ProductCard product={product} locale={locale} t={t} />
              </div>
              <WishlistRemove productId={product.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
