import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { tr } from '@/i18n/config';
import { getAdminI18n, requireAdmin } from '@/lib/admin';
import type { ProductDetail } from '@/types/database';
import { ProductForm } from '@/components/admin/product-form';
import { Notice, PageTitle } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'Edit product' };

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const [{ id }, notice] = await Promise.all([params, searchParams]);
  const { locale, t, L } = await getAdminI18n();
  const supabase = await requireAdmin();

  const { data } = await supabase
    .from('products')
    .select('*, product_images(*), product_variants(*), categories(id, name_en, name_bn, slug)')
    .eq('id', id)
    .maybeSingle();
  if (!data) notFound();
  const product = data as ProductDetail;

  return (
    <>
      <Link href="/admin/products" className="text-sm font-semibold text-brand hover:underline">
        ← {t.admin.products}
      </Link>
      <div className="mt-3">
        <Notice params={notice} okText={L('প্রোডাক্ট সেভ হয়েছে।', 'Product saved.')} />
        <PageTitle title={tr(product, 'name', locale)}>
          {product.is_active && (
            <Link href={`/products/${product.slug}`} target="_blank" className="btn-outline">
              {L('সাইটে দেখুন', 'View on site')} ↗
            </Link>
          )}
        </PageTitle>
        <ProductForm product={product} />
      </div>
    </>
  );
}
