import type { Metadata } from 'next';
import { getI18n } from '@/i18n/server';
import { ProductListing, type ListingSearchParams } from '@/components/store/product-listing';

type Props = { searchParams: Promise<ListingSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [{ t }, params] = await Promise.all([getI18n(), searchParams]);
  const q = typeof params.q === 'string' ? params.q.trim() : '';
  return {
    title: q ? `${t.list.resultsFor} “${q}”` : t.list.title,
    // Filtered / searched lists are endless variations of one page.
    robots: Object.keys(params).length > 0 ? { index: false, follow: true } : undefined,
  };
}

export default async function ProductsPage({ searchParams }: Props) {
  const [{ t }, params] = await Promise.all([getI18n(), searchParams]);

  return (
    <div className="container-page pt-6">
      <h1 className="text-2xl font-bold sm:text-3xl">{t.list.title}</h1>
      <ProductListing searchParams={params} basePath="/products" />
    </div>
  );
}
