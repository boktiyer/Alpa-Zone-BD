import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAdminI18n, requireAdmin } from '@/lib/admin';
import { formatDateTime, formatPrice } from '@/lib/format';
import type { Order, Profile } from '@/types/database';
import { Badge, card, PageTitle, TableWrap, td, th } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'Customer' };

export default async function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { locale, t, L } = await getAdminI18n();
  const supabase = await requireAdmin();

  const [profileResult, ordersResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('orders')
      .select('id, order_number, total, status, payment_status, payment_method, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
  ]);
  if (!profileResult.data) notFound();
  const customer = profileResult.data as Profile;
  const orders = (ordersResult.data as Order[] | null) ?? [];

  return (
    <>
      <Link href="/admin/customers" className="text-sm font-semibold text-royal-700 hover:underline">
        ← {t.admin.customers}
      </Link>
      <div className="mt-3">
        <PageTitle title={customer.full_name || customer.email || '—'} />
      </div>

      <dl className={`${card} mb-6 grid gap-3 p-4 text-sm sm:grid-cols-2`}>
        {[
          [t.auth.email, customer.email],
          [t.auth.phone, customer.phone],
          [t.account.address, customer.address],
          [t.account.district, customer.district],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-zinc-600">{label}</dt>
            <dd className="font-medium">{value || '—'}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mb-2 text-lg font-semibold">{L('অর্ডারের ইতিহাস', 'Order history')}</h2>
      {orders.length === 0 ? (
        <p className="rounded-lg bg-white p-4 text-sm text-zinc-600">{t.admin.noOrders}</p>
      ) : (
        <TableWrap>
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className={th}>{t.admin.orderNo}</th>
                <th className={th}>{t.admin.total}</th>
                <th className={th}>{t.admin.payment}</th>
                <th className={th}>{t.admin.status}</th>
                <th className={th}>{t.admin.date}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className={td}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-bold text-royal-700 hover:underline"
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td className={`${td} font-semibold`}>{formatPrice(order.total, locale)}</td>
                  <td className={td}>
                    {t.paymentMethod[order.payment_method]}{' '}
                    <Badge payment={order.payment_status}>{t.paymentStatus[order.payment_status]}</Badge>
                  </td>
                  <td className={td}>
                    <Badge status={order.status}>{t.orderStatus[order.status]}</Badge>
                  </td>
                  <td className={`${td} text-zinc-600`}>{formatDateTime(order.created_at, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </>
  );
}
