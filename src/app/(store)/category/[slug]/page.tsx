import { categoryPath, categorySlugCandidates } from '@/lib/category-url';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getI18n } from '@/i18n/server';
import { tr } from '@/i18n/config';
import { getCategories } from '@/lib/queries';
import { ProductListing, type ListingSearchParams } from '@/components/store/product-listing';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ListingSearchParams>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [{ locale }, categories] = await Promise.all([getI18n(), getCategories()]);
  const category = categories.find((item) => categorySlugCandidates(slug).includes(item.slug));
  return category ? { title: tr(category, 'name', locale) } : {};
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const [{ locale, t }, categories] = await Promise.all([getI18n(), getCategories()]);

  const category = categories.find((item) => categorySlugCandidates(slug).includes(item.slug));
  if (!category) notFound();

  const parent = categories.find((item) => item.id === category.parent_id);
  const children = categories.filter((item) => item.parent_id === category.id);

  return (
    <div className="container-page pt-6">
      <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
        <Link href="/" className="hover:text-brand">
          {t.nav.home}
        </Link>
        {parent && (
          <>
            <span className="mx-1.5">/</span>
            <Link href={categoryPath(parent.slug)} className="hover:text-brand">
              {tr(parent, 'name', locale)}
            </Link>
          </>
        )}
        <span className="mx-1.5">/</span>
        <span className="text-ink">{tr(category, 'name', locale)}</span>
      </nav>

      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{tr(category, 'name', locale)}</h1>

      {children.length > 0 && (
        <ul aria-label={t.category.subCategories} className="mt-4 flex flex-wrap gap-2">
          {children.map((child) => (
            <li key={child.id}>
              <Link
                href={categoryPath(child.slug)}
                className="block rounded-full border border-gold bg-blush px-4 py-1.5 text-sm font-medium text-brand-dark hover:border-brand"
              >
                {tr(child, 'name', locale)}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Products of this category and all its sub-categories. */}
      <ProductListing
        searchParams={query}
        basePath={categoryPath(category.slug)}
        fixedCategory={category}
      />
    </div>
  );
}
