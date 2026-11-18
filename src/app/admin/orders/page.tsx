import type { Metadata } from 'next';
import Link from 'next/link';
import { getAdminI18n, requireAdmin } from '@/lib/admin';
import { formatDateTime, formatNumber, formatPrice } from '@/lib/format';
import { ORDER_STATUSES, type Order, type OrderStatus, type PaymentStatus } from '@/types/database';
import { Badge, PageTitle, TableWrap, td, th } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'Orders' };

const PAGE_SIZE = 50;

type Row = Pick<
  Order,
  | 'id'
  | 'order_number'
  | 'customer_name'
  | 'phone'
  | 'total'
  | 'payment_method'
  | 'payment_status'
  | 'status'
  | 'transaction_id'
  | 'created_at'
>;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; payment?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { locale, t, L } = await getAdminI18n();
  const supabase = await requireAdmin();

  const status = ORDER_STATUSES.includes(params.status as OrderStatus)
    ? (params.status as OrderStatus)
    : undefined;
  const payment = params.payment === 'pending' ? ('pending' as PaymentStatus) : undefined;
  // Letters (Bangla too), digits and dashes only, so the text is safe inside the filter.
  const q = (params.q ?? '')
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, ' ')
    .trim()
    .slice(0, 40)
    .replace(/\s+/g, '%');
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);

  let query = supabase
    .from('orders')
    .select(
      'id, order_number, customer_name, phone, total, payment_method, payment_status, status, transaction_id, created_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  if (payment) query = query.eq('payment_status', payment).neq('status', 'cancelled');
  if (q) {
    query = query.or(
      `order_number.ilike.%${q}%,phone.ilike.%${q}%,transaction_id.ilike.%${q}%,customer_name.ilike.%${q}%`,
    );
  }

  const { data, count, error } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error && error.code !== 'PGRST103') console.error(`[admin] orders: ${error.message}`);
  const orders = (data as Row[] | null) ?? [];
  const pageCount = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const href = (changes: Record<string, string | undefined>) => {
    const next = { status, payment, q: q || undefined, ...changes };
    const search = new URLSearchParams(
      Object.entries(next).filter((entry): entry is [string, string] => Boolean(entry[1])),
    ).toString();
    return search ? `/admin/orders?${search}` : '/admin/orders';
  };
  const tab = (active: boolean) =>
    `whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium ${
      active ? 'bg-brand text-white' : 'border border-border bg-white hover:border-brand'
    }`;

  return (
    <>
      <PageTitle title={`${t.admin.orders} (${formatNumber(count ?? 0, locale)})`} />

      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
        <Link href={href({ status: undefined, payment: undefined })} className={tab(!status && !payment)}>
          {L('সব', 'All')}
        </Link>
        {ORDER_STATUSES.map((value) => (
          <Link
            key={value}
            href={href({ status: value, payment: undefined })}
            className={tab(status === value)}
          >
            {t.orderStatus[value]}
          </Link>
        ))}
        <Link href={href({ status: undefined, payment: 'pending' })} className={tab(Boolean(payment))}>
          {L('পেমেন্ট যাচাই বাকি', 'Payment to verify')}
        </Link>
      </div>

      <form className="mb-4 flex max-w-md gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        {payment && <input type="hidden" name="payment" value={payment} />}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={L('অর্ডার নম্বর / নাম / ফোন / TrxID', 'Order number / name / phone / TrxID')}
          className="field"
        />
        <button type="submit" className="btn-outline shrink-0">
          {t.nav.searchButton}
        </button>
      </form>

      {orders.length === 0 ? (
        <p className="rounded-lg bg-white p-4 text-sm text-zinc-600">{t.admin.noOrders}</p>
      ) : (
        <TableWrap>
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-brand">
              <tr>
                <th className={th}>{t.admin.orderNo}</th>
                <th className={th}>{t.admin.customer}</th>
                <th className={th}>{t.admin.total}</th>
                <th className={th}>{t.admin.payment}</th>
                <th className={th}>TrxID</th>
                <th className={th}>{t.admin.status}</th>
                <th className={th}>{t.admin.date}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-blush/60">
                  <td className={td}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-bold text-brand hover:underline"
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td className={td}>
                    {order.customer_name}
                    <span className="block text-xs text-zinc-500">{order.phone}</span>
                  </td>
                  <td className={`${td} font-semibold`}>{formatPrice(order.total, locale)}</td>
                  <td className={td}>
                    {t.paymentMethod[order.payment_method]}
                    <span className="mt-0.5 block">
                      <Badge payment={order.payment_status}>
                        {t.paymentStatus[order.payment_status]}
                      </Badge>
                    </span>
                  </td>
                  <td className={`${td} font-mono text-xs`}>{order.transaction_id}</td>
                  <td className={td}>
                    <Badge status={order.status}>{t.orderStatus[order.status]}</Badge>
                  </td>
                  <td className={`${td} whitespace-nowrap text-zinc-600`}>
                    {formatDateTime(order.created_at, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}

      {pageCount > 1 && (
        <nav className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <Link href={href({ page: String(page - 1) })} className="btn-outline">
              ← {t.list.prev}
            </Link>
          )}
          <span>
            {formatNumber(page, locale)} / {formatNumber(pageCount, locale)}
          </span>
          {page < pageCount && (
            <Link href={href({ page: String(page + 1) })} className="btn-outline">
              {t.list.next} →
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
