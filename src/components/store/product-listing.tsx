import Link from 'next/link';
import { getI18n } from '@/i18n/server';
import { tr } from '@/i18n/config';
import { formatNumber } from '@/lib/format';
import {
  categoryWithDescendants,
  getCategories,
  listProducts,
  PAGE_SIZE,
  PRODUCT_SORTS,
  type ProductSort,
} from '@/lib/queries';
import type { Category } from '@/types/database';
import { ProductGrid } from '@/components/store/product-card';

export type ListingSearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

function toPrice(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

/** Categories as a flat list in tree order, with their depth (for indenting). */
function flattenTree(categories: Category[], parentId: string | null = null, depth = 0) {
  const result: { category: Category; depth: number }[] = [];
  for (const category of categories.filter((item) => item.parent_id === parentId)) {
    result.push({ category, depth }, ...flattenTree(categories, category.id, depth + 1));
  }
  return result;
}

/**
 * Product list with search, category + price filters, sorting and pagination.
 * Everything lives in the URL (?q=&category=&min=&max=&sort=&page=), so it works
 * without JavaScript and every result page can be shared.
 */
export async function ProductListing({
  searchParams,
  basePath,
  fixedCategory,
}: {
  searchParams: ListingSearchParams;
  /** Page the filter form submits to, e.g. "/products" or "/category/mens-clothing". */
  basePath: string;
  /** Set on category pages: the list is limited to this category and its children. */
  fixedCategory?: Category;
}) {
  const [{ locale, t }, categories] = await Promise.all([getI18n(), getCategories()]);

  const q = first(searchParams.q)?.trim() ?? '';
  const categorySlug = first(searchParams.category) ?? '';
  const min = toPrice(first(searchParams.min));
  const max = toPrice(first(searchParams.max));
  const discountOnly = first(searchParams.discount) === '1';
  const sortParam = first(searchParams.sort) as ProductSort | undefined;
  const sort: ProductSort = sortParam && PRODUCT_SORTS.includes(sortParam) ? sortParam : 'newest';
  const page = Math.max(1, Math.floor(Number(first(searchParams.page))) || 1);

  const chosen = fixedCategory ?? categories.find((item) => item.slug === categorySlug);
  const { products, total } = await listProducts({
    q,
    categoryIds: chosen ? categoryWithDescendants(categories, chosen.id) : undefined,
    min,
    max,
    discountOnly,
    sort,
    page,
  });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Link to another page that keeps the current filters.
  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (!fixedCategory && chosen) params.set('category', chosen.slug);
    if (min !== undefined) params.set('min', String(min));
    if (max !== undefined) params.set('max', String(max));
    if (discountOnly) params.set('discount', '1');
    if (sort !== 'newest') params.set('sort', sort);
    if (target > 1) params.set('page', String(target));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const sortLabels: Record<ProductSort, string> = {
    newest: t.list.sortNewest,
    price_asc: t.list.sortPriceAsc,
    price_desc: t.list.sortPriceDesc,
    discount: t.list.sortDiscount,
  };
  const hasFilters =
    Boolean(q) || (!fixedCategory && Boolean(chosen)) || min !== undefined || max !== undefined || discountOnly || sort !== 'newest';

  const filterForm = (
    <form action={basePath} className="space-y-4 text-sm">
      <label className="block font-medium">
        {t.nav.searchButton}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={t.nav.search}
          className="field mt-1"
        />
      </label>

      {!fixedCategory && (
        <label className="block font-medium">
          {t.list.category}
          <select name="category" defaultValue={chosen?.slug ?? ''} className="field mt-1">
            <option value="">{t.list.allCategories}</option>
            {flattenTree(categories).map(({ category, depth }) => (
              <option key={category.id} value={category.slug}>
                {'— '.repeat(depth)}
                {tr(category, 'name', locale)}
              </option>
            ))}
          </select>
        </label>
      )}

      <fieldset>
        <legend className="font-medium">{t.list.price}</legend>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <input
            type="number"
            name="min"
            min={0}
            inputMode="numeric"
            defaultValue={min ?? ''}
            placeholder={t.list.min}
            aria-label={t.list.min}
            className="field"
          />
          <input
            type="number"
            name="max"
            min={0}
            inputMode="numeric"
            defaultValue={max ?? ''}
            placeholder={t.list.max}
            aria-label={t.list.max}
            className="field"
          />
        </div>
      </fieldset>

      <label className="block font-medium">
        {t.list.sort}
        <select name="sort" defaultValue={sort} className="field mt-1">
          {PRODUCT_SORTS.map((value) => (
            <option key={value} value={value}>
              {sortLabels[value]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 font-medium">
        <input
          type="checkbox"
          name="discount"
          value="1"
          defaultChecked={discountOnly}
          className="size-4 accent-brand"
        />
        {t.list.discountOnly}
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-primary flex-1">
          {t.list.apply}
        </button>
        {hasFilters && (
          <Link href={basePath} className="btn-outline flex-1">
            {t.list.reset}
          </Link>
        )}
      </div>
    </form>
  );

  return (
    <div className="mt-5 grid gap-6 lg:grid-cols-[16rem_1fr]">
      {/* Phones: collapsible. Desktop: always-open sidebar. */}
      <aside>
        <details className="rounded-xl border border-border bg-white lg:hidden" open={hasFilters}>
          <summary className="cursor-pointer px-4 py-3 font-semibold">{t.list.filters}</summary>
          <div className="border-t border-border p-4">{filterForm}</div>
        </details>
        <div className="sticky top-28 hidden rounded-xl border border-border bg-white p-4 lg:block">
          <p className="mb-3 font-semibold">{t.list.filters}</p>
          {filterForm}
        </div>
      </aside>

      <div>
        <p className="text-sm text-zinc-600">
          {q && (
            <>
              {t.list.resultsFor} <span className="font-semibold text-ink">“{q}”</span> ·{' '}
            </>
          )}
          {formatNumber(total, locale)} {t.list.results}
        </p>

        {products.length === 0 ? (
          <p className="mt-4 rounded-lg bg-blush p-4 text-sm text-brand-dark">{t.list.none}</p>
        ) : (
          <div className="mt-4">
            <ProductGrid products={products} locale={locale} t={t} />
          </div>
        )}

        {pageCount > 1 && (
          <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="btn-outline">
                ← {t.list.prev}
              </Link>
            ) : (
              <span className="btn-outline pointer-events-none opacity-40">← {t.list.prev}</span>
            )}
            <span className="text-sm font-medium">
              {t.list.page} {formatNumber(Math.min(page, pageCount), locale)} /{' '}
              {formatNumber(pageCount, locale)}
            </span>
            {page < pageCount ? (
              <Link href={pageHref(page + 1)} className="btn-outline">
                {t.list.next} →
              </Link>
            ) : (
              <span className="btn-outline pointer-events-none opacity-40">{t.list.next} →</span>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
