import type { Metadata } from 'next';
import Link from 'next/link';
import { getAdminI18n, requireAdmin } from '@/lib/admin';
import { formatDate, formatNumber, formatPrice } from '@/lib/format';
import type { Profile } from '@/types/database';
import { PageTitle, TableWrap, td, th } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'Customers' };

export default async function AdminCustomersPage() {
  const { locale, t, L } = await getAdminI18n();
  const supabase = await requireAdmin();

  const [profiles, orders] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(1000),
    supabase.from('orders').select('user_id, total, status').limit(10000),
  ]);
  const customers = (profiles.data as Profile[] | null) ?? [];

  // Orders and money spent per customer (cancelled orders are not counted as spent).
  const stats = new Map<string, { orders: number; spent: number }>();
  for (const order of (orders.data as { user_id: string | null; total: number; status: string }[] | null) ?? []) {
    if (!order.user_id) continue;
    const entry = stats.get(order.user_id) ?? { orders: 0, spent: 0 };
    entry.orders += 1;
    if (order.status !== 'cancelled') entry.spent += order.total;
    stats.set(order.user_id, entry);
  }

  return (
    <>
      <PageTitle title={`${t.admin.customers} (${formatNumber(customers.length, locale)})`} />
      <TableWrap>
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-brand">
            <tr>
              <th className={th}>{t.admin.customer}</th>
              <th className={th}>{t.auth.phone}</th>
              <th className={th}>{t.admin.orders}</th>
              <th className={th}>{L('মোট কেনাকাটা', 'Total spent')}</th>
              <th className={th}>{L('যোগ দিয়েছেন', 'Joined')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {customers.map((customer) => {
              const stat = stats.get(customer.id) ?? { orders: 0, spent: 0 };
              return (
                <tr key={customer.id} className="hover:bg-blush/60">
                  <td className={td}>
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="font-semibold text-brand hover:underline"
                    >
                      {customer.full_name || '—'}
                    </Link>
                    {customer.role === 'admin' && (
                      <span className="ml-2 rounded bg-ink px-1.5 py-0.5 text-xs text-white">Admin</span>
                    )}
                    <span className="block text-xs text-zinc-500">{customer.email}</span>
                  </td>
                  <td className={td}>{customer.phone ?? '—'}</td>
                  <td className={td}>{formatNumber(stat.orders, locale)}</td>
                  <td className={`${td} font-semibold`}>{formatPrice(stat.spent, locale)}</td>
                  <td className={`${td} text-zinc-600`}>{formatDate(customer.created_at, locale)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableWrap>
    </>
  );
}
