import type { Metadata } from 'next';
import Link from 'next/link';
import { getAdminI18n } from '@/lib/admin';
import { ProductForm } from '@/components/admin/product-form';
import { Notice, PageTitle } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'New product' };

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ t, L }, params] = await Promise.all([getAdminI18n(), searchParams]);

  return (
    <>
      <Link href="/admin/products" className="text-sm font-semibold text-royal-700 hover:underline">
        ← {t.admin.products}
      </Link>
      <div className="mt-3">
        <Notice params={params} okText="" />
        <PageTitle title={L('নতুন প্রোডাক্ট', 'New product')} />
        <ProductForm />
      </div>
    </>
  );
}
