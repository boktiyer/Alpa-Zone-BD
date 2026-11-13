import type { Metadata } from 'next';
import { dhakaDay, getAdminI18n, isDay, ordersBetween } from '@/lib/admin';
import { formatNumber, formatPrice } from '@/lib/format';
import { card, PageTitle, TableWrap, td, th } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'Sales report' };

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; group?: string }>;
}) {
  const params = await searchParams;
  const { locale, L } = await getAdminI18n();

  const today = dhakaDay(new Date());
  const to = isDay(params.to) ? params.to : today;
  let from = isDay(params.from) ? params.from : `${today.slice(0, 7)}-01`;
  if (from > to) from = to;
  const monthly = params.group === 'month';

  const orders = await ordersBetween(from, to);
  const sold = orders.filter((order) => order.status !== 'cancelled');
  const cancelled = orders.length - sold.length;

  // One line per day (or per month).
  const groups = new Map<string, { orders: number; products: number; discount: number; delivery: number; total: number }>();
  for (const order of sold) {
    const key = dhakaDay(order.created_at).slice(0, monthly ? 7 : 10);
    const line = groups.get(key) ?? { orders: 0, products: 0, discount: 0, delivery: 0, total: 0 };
    line.orders += 1;
    line.products += order.subtotal;
    line.discount += order.discount;
    line.delivery += order.delivery_charge;
    line.total += order.total;
    groups.set(key, line);
  }
  const lines = [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
  const sum = (pick: (line: { orders: number; products: number; discount: number; delivery: number; total: number }) => number) =>
    lines.reduce((total, [, line]) => total + pick(line), 0);
  const exportHref = `/admin/reports/export?from=${from}&to=${to}`;

  return (
    <>
      <PageTitle title={L('বিক্রির রিপোর্ট', 'Sales report')}>
        <a href={exportHref} className="btn-primary">
          ⬇ {L('CSV ডাউনলোড', 'Download CSV')}
        </a>
      </PageTitle>

      <form className={`${card} mb-5 flex flex-wrap items-end gap-3 p-4 print:hidden`}>
        <label className="text-sm font-medium">
          {L('শুরু', 'From')}
          <input type="date" name="from" defaultValue={from} max={today} className="field mt-1" />
        </label>
        <label className="text-sm font-medium">
          {L('শেষ', 'To')}
          <input type="date" name="to" defaultValue={to} max={today} className="field mt-1" />
        </label>
        <label className="text-sm font-medium">
          {L('ভাগ', 'Group by')}
          <select name="group" defaultValue={monthly ? 'month' : 'day'} className="field mt-1">
            <option value="day">{L('দিন অনুযায়ী', 'Daily')}</option>
            <option value="month">{L('মাস অনুযায়ী', 'Monthly')}</option>
          </select>
        </label>
        <button type="submit" className="btn-outline">
          {L('দেখুন', 'Show')}
        </button>
      </form>

      <ul className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [L('মোট বিক্রি', 'Total sales'), formatPrice(sum((line) => line.total), locale)],
          [L('অর্ডার', 'Orders'), formatNumber(sold.length, locale)],
          [
            L('গড় অর্ডার', 'Average order'),
            formatPrice(sold.length ? Math.round(sum((line) => line.total) / sold.length) : 0, locale),
          ],
          [L('বাতিল অর্ডার', 'Cancelled orders'), formatNumber(cancelled, locale)],
        ].map(([label, value]) => (
          <li key={label} className={`${card} p-4`}>
            <p className="text-sm text-zinc-600">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </li>
        ))}
      </ul>

      {lines.length === 0 ? (
        <p className="rounded-lg bg-white p-4 text-sm text-zinc-600">
          {L('এই সময়ে কোনো বিক্রি নেই।', 'No sales in this period.')}
        </p>
      ) : (
        <TableWrap>
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-brand">
              <tr>
                <th className={th}>{monthly ? L('মাস', 'Month') : L('তারিখ', 'Date')}</th>
                <th className={`${th} text-right`}>{L('অর্ডার', 'Orders')}</th>
                <th className={`${th} text-right`}>{L('প্রোডাক্টের দাম', 'Products')}</th>
                <th className={`${th} text-right`}>{L('ছাড়', 'Discount')}</th>
                <th className={`${th} text-right`}>{L('ডেলিভারি', 'Delivery')}</th>
                <th className={`${th} text-right`}>{L('মোট', 'Total')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {lines.map(([key, line]) => (
                <tr key={key}>
                  <td className={`${td} font-medium`}>{key}</td>
                  <td className={`${td} text-right`}>{formatNumber(line.orders, locale)}</td>
                  <td className={`${td} text-right`}>{formatPrice(line.products, locale)}</td>
                  <td className={`${td} text-right`}>{formatPrice(line.discount, locale)}</td>
                  <td className={`${td} text-right`}>{formatPrice(line.delivery, locale)}</td>
                  <td className={`${td} text-right font-bold`}>{formatPrice(line.total, locale)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-zinc-50 font-bold">
              <tr>
                <td className={td}>{L('মোট', 'Total')}</td>
                <td className={`${td} text-right`}>{formatNumber(sum((line) => line.orders), locale)}</td>
                <td className={`${td} text-right`}>{formatPrice(sum((line) => line.products), locale)}</td>
                <td className={`${td} text-right`}>{formatPrice(sum((line) => line.discount), locale)}</td>
                <td className={`${td} text-right`}>{formatPrice(sum((line) => line.delivery), locale)}</td>
                <td className={`${td} text-right`}>{formatPrice(sum((line) => line.total), locale)}</td>
              </tr>
            </tfoot>
          </table>
        </TableWrap>
      )}
    </>
  );
}
