import type { Metadata } from 'next';
import Link from 'next/link';
import { tr } from '@/i18n/config';
import { getAdminI18n, getStockRows, LOW_STOCK } from '@/lib/admin';
import { formatNumber } from '@/lib/format';
import { updateStock } from '@/app/admin/actions';
import { SubmitButton } from '@/components/admin/client';
import { Notice, PageTitle, TableWrap, td, th } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'Stock' };

export default async function AdminStockPage({
  searchParams,
}: {
  searchParams: Promise<{ low?: string; ok?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { locale, L } = await getAdminI18n();
  const lowOnly = params.low === '1';

  const all = await getStockRows();
  const lowCount = all.filter((row) => row.stock <= LOW_STOCK).length;
  const rows = (lowOnly ? all.filter((row) => row.stock <= LOW_STOCK) : all).sort(
    (a, b) => a.stock - b.stock,
  );
  const tab = (active: boolean) =>
    `rounded-full px-3 py-1 text-sm font-medium ${
      active ? 'bg-brand text-white' : 'border border-zinc-300 bg-white hover:border-brand'
    }`;

  return (
    <>
      <Notice params={params} okText={L('স্টক আপডেট হয়েছে।', 'Stock updated.')} />
      <PageTitle title={L('স্টক ম্যানেজমেন্ট', 'Stock management')} />

      <div className="mb-4 flex gap-2">
        <Link href="/admin/stock" className={tab(!lowOnly)}>
          {L('সব', 'All')} ({formatNumber(all.length, locale)})
        </Link>
        <Link href="/admin/stock?low=1" className={tab(lowOnly)}>
          {L('কম স্টক', 'Low stock')} ≤ {formatNumber(LOW_STOCK, locale)} (
          {formatNumber(lowCount, locale)})
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg bg-white p-4 text-sm text-zinc-600">
          {L('কিছু নেই।', 'Nothing here.')}
        </p>
      ) : (
        <TableWrap>
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-brand">
              <tr>
                <th className={th}>{L('প্রোডাক্ট', 'Product')}</th>
                <th className={th}>{L('সাইজ / রং', 'Size / colour')}</th>
                <th className={th}>{L('কোড', 'SKU')}</th>
                <th className={th}>{L('স্টক', 'Stock')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((row) => (
                <tr key={row.id} className={row.stock === 0 ? 'bg-red-50' : row.stock <= LOW_STOCK ? 'bg-amber-50' : ''}>
                  <td className={td}>
                    <Link
                      href={`/admin/products/${row.productId}`}
                      className="font-medium text-brand hover:underline"
                    >
                      {tr(row, 'name', locale)}
                    </Link>
                  </td>
                  <td className={td}>{row.label ?? '—'}</td>
                  <td className={`${td} text-xs text-zinc-600`}>{row.sku}</td>
                  <td className={td}>
                    <form action={updateStock} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="kind" value={row.kind} />
                      {lowOnly && <input type="hidden" name="back" value="low" />}
                      <input
                        type="number"
                        name="stock"
                        min={0}
                        step={1}
                        required
                        defaultValue={row.stock}
                        aria-label={`${row.name_en} ${row.label ?? ''}`}
                        className="field w-24 py-1.5"
                      />
                      <SubmitButton className="btn-outline px-3 py-1.5 text-sm">
                        {L('সেভ', 'Save')}
                      </SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </>
  );
}
