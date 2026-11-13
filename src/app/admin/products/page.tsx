import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { tr } from '@/i18n/config';
import { getAdminI18n, requireAdmin } from '@/lib/admin';
import { formatNumber, formatPrice } from '@/lib/format';
import { deleteProduct, quickPrice, toggleProduct } from '@/app/admin/actions';
import { ConfirmButton, SubmitButton } from '@/components/admin/client';
import { Notice, PageTitle, card } from '@/components/admin/ui';

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

type Show = 'all' | 'visible' | 'hidden';

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; show?: string; ok?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { locale, t, L } = await getAdminI18n();
  const supabase = await requireAdmin();
  const q = (params.q ?? '').replace(/[^\p{L}\p{M}\p{N}\s-]/gu, ' ').trim().slice(0, 60);
  const show: Show = params.show === 'visible' || params.show === 'hidden' ? params.show : 'all';

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
  if (show !== 'all') query = query.eq('is_active', show === 'visible');
  const { data, error } = await query;
  if (error) console.error(`[admin] products: ${error.message}`);
  const products = (data as unknown as Row[] | null) ?? [];

  const tabs: { key: Show; label: string }[] = [
    { key: 'all', label: L('সব', 'All') },
    { key: 'visible', label: L('চালু', 'Visible') },
    { key: 'hidden', label: L('বন্ধ', 'Hidden') },
  ];
  const tabHref = (key: Show) => {
    const search = new URLSearchParams();
    if (q) search.set('q', q);
    if (key !== 'all') search.set('show', key);
    const text = search.toString();
    return text ? `/admin/products?${text}` : '/admin/products';
  };

  return (
    <>
      <Notice params={params} okText={L('সেভ হয়েছে।', 'Saved.')} />
      <PageTitle title={`${t.admin.products} (${formatNumber(products.length, locale)})`}>
        <Link href="/admin/products/new" className="btn-primary">
          + {L('নতুন প্রোডাক্ট যোগ করুন', 'Add new product')}
        </Link>
      </PageTitle>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form className="flex min-w-0 flex-1 gap-2 sm:max-w-md">
          {show !== 'all' && <input type="hidden" name="show" value={show} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={L('নাম বা কোড দিয়ে খুঁজুন', 'Search by name or SKU')}
            className="field"
          />
          <button type="submit" className="btn-outline shrink-0">
            {t.nav.searchButton}
          </button>
        </form>

        <ul className="flex gap-1 rounded-lg bg-zinc-200/70 p-1 text-sm font-medium">
          {tabs.map((tab) => (
            <li key={tab.key}>
              <Link
                href={tabHref(tab.key)}
                aria-current={show === tab.key ? 'page' : undefined}
                className={`block rounded-md px-3 py-1.5 ${
                  show === tab.key ? 'bg-white shadow-sm' : 'text-zinc-600 hover:text-ink'
                }`}
              >
                {tab.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {products.length === 0 ? (
        <div className={`${card} p-6 text-center`}>
          <p className="text-sm text-zinc-600">{t.list.none}</p>
          <Link href="/admin/products/new" className="btn-primary mt-3">
            + {L('নতুন প্রোডাক্ট যোগ করুন', 'Add new product')}
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {products.map((product) => {
            const image = [...product.product_images].sort(
              (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
            )[0];
            const stock =
              product.product_variants.length > 0
                ? product.product_variants.reduce((sum, variant) => sum + variant.stock, 0)
                : product.stock;
            const name = tr(product, 'name', locale);
            const regular = product.compare_at_price ?? product.price;
            const discount = product.compare_at_price ? product.price : null;
            const percent =
              discount === null || regular <= 0
                ? 0
                : Math.round(((regular - discount) / regular) * 100);
            const action = 'rounded-lg border px-3 py-2 text-sm font-semibold';

            return (
              <li key={product.id} className={`${card} p-3 ${product.is_active ? '' : 'bg-zinc-50'}`}>
                <div className="flex gap-3">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100 sm:size-24"
                  >
                    {image && (
                      <Image
                        src={image.url}
                        alt=""
                        fill
                        sizes="96px"
                        className={`object-cover ${product.is_active ? '' : 'opacity-50'}`}
                      />
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="line-clamp-2 font-semibold leading-snug hover:text-brand hover:underline"
                    >
                      {name}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {product.categories ? tr(product.categories, 'name', locale) : '—'}
                    </p>

                    <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
                      <strong className="text-lg">{formatPrice(product.price, locale)}</strong>
                      {discount !== null && (
                        <>
                          <span className="text-sm text-zinc-500 line-through">
                            {formatPrice(regular, locale)}
                          </span>
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                            -{formatNumber(percent, locale)}%
                          </span>
                        </>
                      )}
                    </p>

                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          product.is_active ? 'bg-green-100 text-green-800' : 'bg-zinc-200 text-zinc-700'
                        }`}
                      >
                        {product.is_active ? L('চালু', 'Visible') : L('বন্ধ', 'Hidden')}
                      </span>
                      <span className={stock === 0 ? 'text-red-700' : 'text-zinc-600'}>
                        {L('স্টক', 'Stock')}: {formatNumber(stock, locale)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Quick price / discount */}
                <details className="group mt-3 rounded-lg border border-zinc-200">
                  <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-brand marker:hidden hover:bg-blush">
                    ৳ {L('দাম / ডিসকাউন্ট বদলান', 'Change price / discount')}
                  </summary>
                  <form action={quickPrice} className="grid grid-cols-2 items-end gap-2 p-3 pt-1 sm:grid-cols-[1fr_1fr_auto]">
                    <input type="hidden" name="id" value={product.id} />
                    <label className="text-xs font-medium text-zinc-600">
                      {L('দাম (৳)', 'Price (৳)')}
                      <input
                        name="regular_price"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        required
                        defaultValue={regular}
                        className="field mt-0.5"
                      />
                    </label>
                    <label className="text-xs font-medium text-zinc-600">
                      {L('ডিসকাউন্ট দাম (৳)', 'Discount price (৳)')}
                      <input
                        name="discount_price"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        defaultValue={discount ?? ''}
                        placeholder={L('ছাড় নেই', 'No discount')}
                        className="field mt-0.5"
                      />
                    </label>
                    <SubmitButton className="btn-primary col-span-2 sm:col-span-1">
                      {L('সেভ', 'Save')}
                    </SubmitButton>
                    <p className="col-span-2 text-xs text-zinc-500 sm:col-span-3">
                      {L(
                        'ছাড় তুলে দিতে "ডিসকাউন্ট দাম" ফাঁকা করে সেভ দিন।',
                        'To remove the discount, clear "Discount price" and save.',
                      )}
                    </p>
                  </form>
                </details>

                <div className="mt-2 grid grid-cols-3 gap-2">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className={`${action} border-zinc-300 text-center hover:border-brand hover:text-brand`}
                  >
                    {L('এডিট', 'Edit')}
                  </Link>

                  <form action={toggleProduct} className="contents">
                    <input type="hidden" name="id" value={product.id} />
                    <input type="hidden" name="active" value={product.is_active ? '0' : '1'} />
                    <SubmitButton
                      className={`${action} ${
                        product.is_active
                          ? 'border-zinc-300 hover:border-amber-500 hover:text-amber-700'
                          : 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100'
                      }`}
                    >
                      {product.is_active ? L('বন্ধ করুন', 'Hide') : L('চালু করুন', 'Show')}
                    </SubmitButton>
                  </form>

                  <form action={deleteProduct} className="contents">
                    <input type="hidden" name="id" value={product.id} />
                    <ConfirmButton
                      className={`${action} border-red-200 text-red-700 hover:bg-red-50`}
                      message={L(
                        `"${name}" মুছে ফেলবেন? এটা ফেরানো যাবে না। শুধু লুকাতে চাইলে "বন্ধ করুন" চাপুন।`,
                        `Delete "${name}"? This cannot be undone. To only hide it, use "Hide".`,
                      )}
                    >
                      {L('মুছুন', 'Delete')}
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
