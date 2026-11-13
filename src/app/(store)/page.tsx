import Image from 'next/image';
import Link from 'next/link';
import { getI18n } from '@/i18n/server';
import { tr } from '@/i18n/config';
import { getBanners, getCategories, getCategoryCovers, listProducts } from '@/lib/queries';
import { categoryPath } from '@/lib/category-url';
import { reviews } from '@/config/site';
import { BannerSlider } from '@/components/store/banner-slider';
import { ProductGrid } from '@/components/store/product-card';
import { Reveal } from '@/components/reveal';
import { CashIcon, ReturnIcon, StarIcon, TruckIcon, WhatsAppIcon } from '@/components/icons';
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

  const heading = 'text-xl font-bold sm:text-2xl';

  const productSection = (title: string, href: string, products: ProductCardData[]) => (
    <Reveal as="section" className="container-page pt-12">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className={heading}>{title}</h2>
        <Link
          href={href}
          className="shrink-0 text-sm font-semibold text-brand transition-colors hover:text-brand-dark hover:underline"
        >
          {t.home.viewAll} →
        </Link>
      </div>
      <div className="mt-4">
        <ProductGrid products={products} locale={locale} t={t} />
      </div>
    </Reveal>
  );

  const reasons = [
    { icon: TruckIcon, title: t.home.whyDeliveryTitle, text: t.home.whyDeliveryText },
    { icon: CashIcon, title: t.home.whyCodTitle, text: t.home.whyCodText },
    {
      icon: ReturnIcon,
      title: t.home.whyReturnTitle,
      text: t.home.whyReturnText,
      href: '/return-policy',
    },
    { icon: WhatsAppIcon, title: t.home.whySupportTitle, text: t.home.whySupportText },
  ];

  return (
    <>
      <BannerSlider banners={banners} />

      <section className="container-page pt-10">
        <h2 className={heading}>{t.home.shopByCategory}</h2>

        {topCategories.length === 0 ? (
          <p className="mt-4 rounded-xl bg-blush p-4 text-sm text-brand-dark">
            {t.home.noCategories}
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {topCategories.map((category) => {
              // The category's own picture, ready-made artwork, or a photo of one of
              // its products. With none of these the brand gradient shows instead.
              const cover = covers.get(category.id);
              return (
                <li key={category.id}>
                  <Link
                    href={categoryPath(category.slug)}
                    className="card-lift group flex aspect-square items-end rounded-xl bg-gradient-to-br from-brand to-brand-dark text-white"
                  >
                    <span className="absolute inset-0 overflow-hidden rounded-xl">
                      {cover && (
                        <Image
                          src={cover}
                          alt=""
                          fill
                          sizes="(min-width: 1280px) 300px, (min-width: 1024px) 25vw, 50vw"
                          className={`object-cover transition-transform duration-500 ease-soft group-hover:scale-105 ${
                            // Artwork is centred; product photos keep the top (faces) in view.
                            cover.startsWith('/categories/') ? 'object-center' : 'object-top'
                          }`}
                        />
                      )}
                      {/* Dark fade at the bottom so the name is always readable. */}
                      <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                    </span>
                    <span className="relative p-3 text-base font-bold leading-tight sm:p-4 sm:text-lg">
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
          <p className="rounded-xl bg-blush p-4 text-sm text-brand-dark">{t.home.noProducts}</p>
        </section>
      ) : (
        productSection(t.home.newArrivals, '/products', newest.products)
      )}

      {discounted.products.length > 0 &&
        productSection(t.home.discounted, '/products?discount=1&sort=discount', discounted.products)}

      {/* Why shop with us */}
      <Reveal as="section" className="mt-14 bg-blush py-10">
        <div className="container-page">
          <h2 className={`${heading} text-center text-brand`}>{t.home.whyTitle}</h2>
          <ul className="stagger mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {reasons.map(({ icon: IconComponent, title, text, href }) => {
              const body = (
                <>
                  <span className="grid size-12 place-items-center rounded-full bg-brand text-white">
                    <IconComponent className="size-6" />
                  </span>
                  <span className="mt-3 block font-semibold text-brand-dark">{title}</span>
                  <span className="mt-1 block text-sm text-zinc-700">{text}</span>
                </>
              );
              const box =
                'flex h-full flex-col items-center rounded-xl border border-border bg-white p-4 text-center sm:p-5';
              return (
                <li key={title}>
                  {href ? (
                    <Link href={href} className={`${box} transition-colors hover:border-gold`}>
                      {body}
                    </Link>
                  ) : (
                    <div className={box}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </Reveal>

      {/* Customer reviews — only real ones, added in src/config/site.ts */}
      {reviews.length > 0 && (
        <Reveal as="section" className="container-page pt-12">
          <h2 className={`${heading} text-center`}>{t.home.reviewsTitle}</h2>
          <ul className="stagger mt-6 grid gap-3 sm:gap-4 md:grid-cols-3">
            {reviews.map((review) => (
              <li
                key={`${review.name}-${review.text.slice(0, 20)}`}
                className="flex flex-col rounded-xl border border-border bg-white p-5"
              >
                <span
                  className="flex gap-0.5 text-gold"
                  role="img"
                  aria-label={`${review.rating} / 5`}
                >
                  {Array.from({ length: 5 }, (_, index) => (
                    <StarIcon
                      key={index}
                      className={`size-5 ${index < review.rating ? '' : 'opacity-25'}`}
                    />
                  ))}
                </span>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-700">“{review.text}”</p>
                <p className="mt-4 font-semibold text-brand-dark">
                  {review.name}
                  {review.place && (
                    <span className="font-normal text-zinc-500"> · {review.place}</span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
      )}
    </>
  );
}
