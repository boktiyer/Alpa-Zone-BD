import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { tr } from '@/i18n/config';
import { getAdminI18n, requireAdmin } from '@/lib/admin';
import { formatNumber, formatPrice } from '@/lib/format';
import { Notice, PageTitle, TableWrap, td, th } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'Products' };

type Row = {
  id: string;
  name_en: string;
  name_bn: string;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  is_active: boolean;
  categories: { name_en: string; name_bn: string } | null;
  product_images: { url: string; is_primary: boolean; sort_order: number }[];
  product_variants: { stock: number }[];
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ok?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { locale, t, L } = await getAdminI18n();
  const supabase = await requireAdmin();
  const q = (params.q ?? '').replace(/[^\p{L}\p{M}\p{N}\s-]/gu, ' ').trim().slice(0, 60);

  let query = supabase
    .from('products')
    .select(
      'id, name_en, name_bn, sku, price, compare_at_price, stock, is_active, categories(name_en, name_bn), product_images(url, is_primary, sort_order), product_variants(stock)',
    )
    .order('created_at', { ascending: false })
    .limit(200);
  if (q) {
    const like = `%${q.replace(/\s+/g, '%')}%`;
    query = query.or(`name_en.ilike.${like},name_bn.ilike.${like},sku.ilike.${like}`);
  }
  const { data, error } = await query;
  if (error) console.error(`[admin] products: ${error.message}`);
  const products = (data as unknown as Row[] | null) ?? [];

  return (
    <>
      <Notice params={params} okText={L('সেভ হয়েছে।', 'Saved.')} />
      <PageTitle title={`${t.admin.products} (${formatNumber(products.length, locale)})`}>
        <Link href="/admin/products/new" className="btn-primary">
          + {L('নতুন প্রোডাক্ট', 'New product')}
        </Link>
      </PageTitle>

      <form className="mb-4 flex max-w-md gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={L('নাম বা কোড', 'Name or SKU')}
          className="field"
        />
        <button type="submit" className="btn-outline shrink-0">
          {t.nav.searchButton}
        </button>
      </form>

      {products.length === 0 ? (
        <p className="rounded-lg bg-white p-4 text-sm text-zinc-600">{t.list.none}</p>
      ) : (
        <TableWrap>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className={th}>{t.admin.products}</th>
                <th className={th}>{t.list.category}</th>
                <th className={th}>{L('দাম', 'Price')}</th>
                <th className={th}>{L('স্টক', 'Stock')}</th>
                <th className={th}>{t.admin.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {products.map((product) => {
                const image = [...product.product_images].sort(
                  (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
                )[0];
                const stock =
                  product.product_variants.length > 0
                    ? product.product_variants.reduce((sum, variant) => sum + variant.stock, 0)
                    : product.stock;
                return (
                  <tr key={product.id} className="hover:bg-royal-50/50">
                    <td className={td}>
                      <Link href={`/admin/products/${product.id}`} className="flex items-center gap-3">
                        <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                          {image && (
                            <Image src={image.url} alt="" fill sizes="48px" className="object-cover" />
                          )}
                        </span>
                        <span>
                          <span className="block font-semibold text-royal-700 hover:underline">
                            {tr(product, 'name', locale)}
                          </span>
                          <span className="block text-xs text-zinc-500">{product.sku}</span>
                        </span>
                      </Link>
                    </td>
                    <td className={td}>
                      {product.categories ? tr(product.categories, 'name', locale) : '—'}
                    </td>
                    <td className={td}>
                      {formatPrice(product.price, locale)}
                      {product.compare_at_price && (
                        <span className="block text-xs text-zinc-500 line-through">
                          {formatPrice(product.compare_at_price, locale)}
                        </span>
                      )}
                    </td>
                    <td className={`${td} font-semibold ${stock === 0 ? 'text-red-700' : ''}`}>
                      {formatNumber(stock, locale)}
                    </td>
                    <td className={td}>
                      {product.is_active ? L('চালু', 'Visible') : L('বন্ধ', 'Hidden')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      )}
    </>
  );
}
