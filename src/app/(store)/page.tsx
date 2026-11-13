import Image from 'next/image';
import Link from 'next/link';
import { getI18n } from '@/i18n/server';
import { tr } from '@/i18n/config';
import { getBanners, getCategories, getCategoryCovers, listProducts } from '@/lib/queries';
import { BannerSlider } from '@/components/store/banner-slider';
import { ProductGrid } from '@/components/store/product-card';
import type { ProductCardData } from '@/types/database';

export default async function HomePage() {
  const [{ locale, t }, banners, categories, newest, discounted] = await Promise.all([
    getI18n(),
    getBanners(),
    getCategories(),
    listProducts({ sort: 'newest', pageSize: 8 }),
    listProducts({ sort: 'discount', discountOnly: true, pageSize: 8 }),
  ]);
  const topCategories = categories.filter((category) => !category.parent_id);
  const covers = await getCategoryCovers(categories);

  const productSection = (title: string, href: string, products: ProductCardData[]) => (
    <section className="container-page pt-10">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
        <Link href={href} className="shrink-0 text-sm font-semibold text-royal-700 hover:underline">
          {t.home.viewAll} →
        </Link>
      </div>
      <div className="mt-4">
        <ProductGrid products={products} locale={locale} t={t} />
      </div>
    </section>
  );

  return (
    <>
      <BannerSlider banners={banners} />

      <section className="container-page pt-10">
        <h2 className="text-xl font-bold sm:text-2xl">{t.home.shopByCategory}</h2>

        {topCategories.length === 0 ? (
          <p className="mt-4 rounded-lg bg-royal-50 p-4 text-sm text-royal-900">
            {t.home.noCategories}
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {topCategories.map((category) => {
              // The category's own picture, or a photo of one of its products.
              const cover = covers.get(category.id);
              return (
                <li key={category.id}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="group relative flex aspect-[4/5] items-end overflow-hidden rounded-xl bg-gradient-to-br from-maroon to-[#3d0817] p-4 text-white shadow-sm transition hover:shadow-lg sm:aspect-[4/3] lg:aspect-[4/5]"
                  >
                    {cover && (
                      <>
                        <Image
                          src={cover}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 25vw, 50vw"
                          className="object-cover object-top transition duration-300 group-hover:scale-105"
                        />
                        <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                      </>
                    )}
                    <span className="relative text-base font-semibold leading-tight sm:text-lg">
                      {tr(category, 'name', locale)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {newest.products.length === 0 ? (
        <section className="container-page pt-10">
          <p className="rounded-lg bg-royal-50 p-4 text-sm text-royal-900">{t.home.noProducts}</p>
        </section>
      ) : (
        productSection(t.home.newArrivals, '/products', newest.products)
      )}

      {discounted.products.length > 0 &&
        productSection(t.home.discounted, '/products?discount=1&sort=discount', discounted.products)}
    </>
  );
}
