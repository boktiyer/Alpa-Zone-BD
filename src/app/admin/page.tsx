import Link from 'next/link';
import { tr } from '@/i18n/config';
import {
  dhakaDay,
  getAdminI18n,
  getStockRows,
  LOW_STOCK,
  ordersBetween,
  requireAdmin,
  shiftDay,
} from '@/lib/admin';
import { formatDateTime, formatNumber, formatPrice } from '@/lib/format';
import { Badge, card } from '@/components/admin/ui';
import type { OrderStatus, PaymentStatus } from '@/types/database';

const CHART_DAYS = 14;

export default async function AdminDashboardPage() {
  const { locale, t, L } = await getAdminI18n();
  const supabase = await requireAdmin();

  const today = dhakaDay(new Date());
  const monthStart = `${today.slice(0, 7)}-01`;
  const chartStart = shiftDay(today, -(CHART_DAYS - 1));

  const [recent, totalOrders, pendingOrders, toVerify, stockRows, latest] = await Promise.all([
    ordersBetween(chartStart < monthStart ? chartStart : monthStart, today),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'pending')
      .neq('status', 'cancelled'),
    getStockRows(),
    supabase
      .from('orders')
      .select('id, order_number, customer_name, total, status, payment_status, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
  ]);
  type LatestOrder = {
    id: string;
    order_number: string;
    customer_name: string;
    total: number;
    status: OrderStatus;
    payment_status: PaymentStatus;
    created_at: string;
  };
  if (latest.error) console.error(`[admin] dashboard latest orders: ${latest.error.message}`);
  const latestOrders = (latest.data as LatestOrder[] | null) ?? [];

  // Sales = total of every order that was not cancelled.
  const sold = recent.filter((order) => order.status !== 'cancelled');
  const byDay = new Map<string, number>();
  for (const order of sold) {
    const day = dhakaDay(order.created_at);
    byDay.set(day, (byDay.get(day) ?? 0) + order.total);
  }
  const salesToday = byDay.get(today) ?? 0;
  const salesMonth = sold
    .filter((order) => dhakaDay(order.created_at) >= monthStart)
    .reduce((sum, order) => sum + order.total, 0);

  const chart = Array.from({ length: CHART_DAYS }, (_, index) => {
    const day = shiftDay(chartStart, index);
    return { day, total: byDay.get(day) ?? 0 };
  });
  const chartMax = Math.max(1, ...chart.map((bar) => bar.total));

  const lowStock = stockRows
    .filter((row) => row.stock <= LOW_STOCK)
    .sort((a, b) => a.stock - b.stock);

  const stats = [
    { label: L('আজকের বিক্রি', "Today's sales"), value: formatPrice(salesToday, locale) },
    { label: L('এই মাসের বিক্রি', 'Sales this month'), value: formatPrice(salesMonth, locale) },
    {
      label: L('মোট অর্ডার', 'Total orders'),
      value: formatNumber(totalOrders.count ?? 0, locale),
      href: '/admin/orders',
    },
    {
      label: L('পেন্ডিং অর্ডার', 'Pending orders'),
      value: formatNumber(pendingOrders.count ?? 0, locale),
      href: '/admin/orders?status=pending',
      highlight: (pendingOrders.count ?? 0) > 0,
    },
    {
      label: L('পেমেন্ট যাচাই বাকি', 'Payments to verify'),
      value: formatNumber(toVerify.count ?? 0, locale),
      href: '/admin/orders?payment=pending',
      highlight: (toVerify.count ?? 0) > 0,
    },
    {
      label: L('কম স্টক', 'Low stock'),
      value: formatNumber(lowStock.length, locale),
      href: '/admin/stock?low=1',
      highlight: lowStock.length > 0,
    },
  ];

  return (
    <>
      <h1 className="text-2xl font-bold">{t.admin.dashboard}</h1>

      <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => {
          const body = (
            <>
              <p className={`text-sm ${stat.highlight ? 'text-white/85' : 'text-zinc-600'}`}>
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-bold">{stat.value}</p>
            </>
          );
          const box = `block h-full rounded-xl border p-4 ${
            stat.highlight ? 'border-brand bg-brand text-white' : 'border-border bg-white'
          }`;
          return (
            <li key={stat.label}>
              {stat.href ? (
                <Link href={stat.href} className={`${box} hover:shadow-md`}>
                  {body}
                </Link>
              ) : (
                <div className={box}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      <section className={`${card} mt-6 p-4`}>
        <h2 className="text-lg font-semibold">
          {L(`গত ${formatNumber(CHART_DAYS, locale)} দিনের বিক্রি`, `Sales, last ${CHART_DAYS} days`)}
        </h2>
        <ol className="mt-4 flex h-48 items-end gap-1 sm:gap-2" aria-label="Sales chart">
          {chart.map((bar) => (
            <li key={bar.day} className="flex h-full min-w-0 flex-1 flex-col justify-end text-center">
              <span className="truncate text-[10px] text-zinc-600 sm:text-xs">
                {bar.total > 0 ? formatNumber(Math.round(bar.total), locale) : ''}
              </span>
              <span
                title={`${bar.day}: ${formatPrice(bar.total, locale)}`}
                className={`mt-1 block rounded-t ${bar.day === today ? 'bg-brand-dark' : 'bg-brand-soft'}`}
                style={{ height: `${Math.max(2, (bar.total / chartMax) * 80)}%` }}
              />
              <span className="mt-1 text-[10px] text-zinc-500 sm:text-xs">
                {formatNumber(Number(bar.day.slice(8)), locale)}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${card} mt-6`}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold">{L('সাম্প্রতিক অর্ডার', 'Recent orders')}</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-brand hover:underline">
            {L('সব অর্ডার', 'All orders')} →
          </Link>
        </div>
        {latestOrders.length === 0 ? (
          <p className="p-4 text-sm text-zinc-600">{L('এখনো কোনো অর্ডার নেই।', 'No orders yet.')}</p>
        ) : (
          <ul className="divide-y divide-border/70 text-sm">
            {latestOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 transition-colors hover:bg-blush"
                >
                  <span className="font-semibold text-brand">{order.order_number}</span>
                  <span className="min-w-0 flex-1 truncate">{order.customer_name}</span>
                  <span className="hidden text-zinc-500 sm:inline">
                    {formatDateTime(order.created_at, locale)}
                  </span>
                  <Badge payment={order.payment_status}>{t.paymentStatus[order.payment_status]}</Badge>
                  <Badge status={order.status}>{t.orderStatus[order.status]}</Badge>
                  <span className="w-20 text-right font-semibold">{formatPrice(order.total, locale)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={`${card} mt-6`}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold">
            {L('কম স্টকের সতর্কতা', 'Low stock alert')} (≤ {formatNumber(LOW_STOCK, locale)})
          </h2>
          <Link href="/admin/stock?low=1" className="text-sm font-semibold text-brand hover:underline">
            {L('স্টক আপডেট করুন', 'Update stock')} →
          </Link>
        </div>
        {lowStock.length === 0 ? (
          <p className="p-4 text-sm text-zinc-600">{L('সব প্রোডাক্টের স্টক ঠিক আছে।', 'All stock levels are fine.')}</p>
        ) : (
          <ul className="divide-y divide-border/70 text-sm">
            {lowStock.slice(0, 8).map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-2">
                <span>
                  {tr(row, 'name', locale)}
                  {row.label && <span className="text-zinc-600"> · {row.label}</span>}
                </span>
                <span className={`font-bold ${row.stock === 0 ? 'text-red-700' : 'text-amber-700'}`}>
                  {formatNumber(row.stock, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
