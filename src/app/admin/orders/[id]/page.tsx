import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { site } from '@/config/site';
import { getAdminI18n, requireAdmin } from '@/lib/admin';
import { formatDateTime, formatNumber, formatPrice } from '@/lib/format';
import { ORDER_STATUSES, type Order, type OrderItem, type PaymentStatus } from '@/types/database';
import { updateOrder } from '@/app/admin/actions';
import { ConfirmButton, PrintButton, SubmitButton } from '@/components/admin/client';
import { Badge, card, Notice, td, th } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'Order' };

const PAYMENT_STATUSES: PaymentStatus[] = ['unpaid', 'pending', 'paid', 'failed', 'refunded'];

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
};

// This page is also the invoice: "Print" hides the buttons and forms.
export default async function AdminOrderPage({ params, searchParams }: Props) {
  const [{ id }, notice] = await Promise.all([params, searchParams]);
  const { locale, t, L } = await getAdminI18n();
  const supabase = await requireAdmin();

  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .maybeSingle();
  if (!data) notFound();
  const order = data as Order & { order_items: OrderItem[] };
  const due = Math.max(0, order.total - (order.advance_amount ?? 0));
  const locked = order.status === 'cancelled';

  return (
    <>
      <Notice params={notice} okText={L('সেভ হয়েছে।', 'Saved.')} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/admin/orders" className="text-sm font-semibold text-brand hover:underline">
          ← {t.admin.orders}
        </Link>
        <PrintButton>{L('ইনভয়েস প্রিন্ট করুন', 'Print invoice')}</PrintButton>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem] print:block">
        <article className={`${card} p-4 sm:p-6 print:border-0 print:p-0`}>
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 pb-4">
            <div>
              <p className="text-xl font-bold">{site.name}</p>
              <p className="text-sm text-zinc-600">{site.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {L('ইনভয়েস', 'Invoice')}
              </p>
              <p className="text-xl font-bold text-brand">{order.order_number}</p>
              <p className="text-sm text-zinc-600">{formatDateTime(order.created_at, locale)}</p>
            </div>
          </header>

          <div className="grid gap-4 py-4 text-sm sm:grid-cols-2">
            <div>
              <p className="font-semibold">{L('ডেলিভারির ঠিকানা', 'Deliver to')}</p>
              <p className="mt-1">{order.customer_name}</p>
              <p>{order.phone}</p>
              <p className="whitespace-pre-line">{order.address}</p>
              {order.district && <p>{order.district}</p>}
              {order.note && (
                <p className="mt-2 rounded bg-amber-50 p-2">
                  {L('নোট', 'Note')}: {order.note}
                </p>
              )}
            </div>
            <div className="sm:text-right">
              <p className="font-semibold">{t.admin.payment}</p>
              <p className="mt-1">{t.paymentMethod[order.payment_method]}</p>
              <p>
                <Badge payment={order.payment_status}>{t.paymentStatus[order.payment_status]}</Badge>{' '}
                <Badge status={order.status}>{t.orderStatus[order.status]}</Badge>
              </p>
              {order.coupon_code && (
                <p className="mt-1">
                  {t.cart.coupon}: {order.coupon_code}
                </p>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-brand">
                <tr>
                  <th className={th}>{t.order.items}</th>
                  <th className={`${th} text-right`}>{L('দাম', 'Price')}</th>
                  <th className={`${th} text-right`}>{t.order.qty}</th>
                  <th className={`${th} text-right`}>{t.admin.total}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {order.order_items.map((item) => (
                  <tr key={item.id}>
                    <td className={td}>
                      {(locale === 'bn' && item.product_name_bn) || item.product_name}
                      {item.variant_label && (
                        <span className="block text-xs text-zinc-600">{item.variant_label}</span>
                      )}
                    </td>
                    <td className={`${td} text-right`}>{formatPrice(item.unit_price, locale)}</td>
                    <td className={`${td} text-right`}>{formatNumber(item.quantity, locale)}</td>
                    <td className={`${td} text-right font-medium`}>
                      {formatPrice(item.line_total, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="ml-auto mt-4 max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt>{t.cart.subtotal}</dt>
              <dd>{formatPrice(order.subtotal, locale)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <dt>{t.cart.discount}</dt>
                <dd>− {formatPrice(order.discount, locale)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>{t.checkout.deliveryCharge}</dt>
              <dd>{formatPrice(order.delivery_charge, locale)}</dd>
            </div>
            <div className="flex justify-between border-t border-zinc-300 pt-1.5 text-base font-bold">
              <dt>{t.cart.total}</dt>
              <dd>{formatPrice(order.total, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t.order.advance}</dt>
              <dd>{formatPrice(order.advance_amount ?? 0, locale)}</dd>
            </div>
            <div className="flex justify-between text-base font-bold">
              <dt>{t.order.due}</dt>
              <dd>{formatPrice(due, locale)}</dd>
            </div>
          </dl>
        </article>

        <aside className="space-y-4 print:hidden">
          <section className={`${card} p-4`}>
            <h2 className="font-semibold">{L('পেমেন্ট যাচাই', 'Verify payment')}</h2>
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-600">{L('মাধ্যম', 'Sent with')}</dt>
                <dd className="font-medium">
                  {order.advance_via ? t.paymentMethod[order.advance_via] : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-600">{L('পাঠানোর কথা', 'Should have sent')}</dt>
                <dd className="font-bold">{formatPrice(order.advance_amount ?? 0, locale)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-600">TrxID</dt>
                <dd className="break-all font-mono font-bold">{order.transaction_id ?? '—'}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-zinc-600">
              {L(
                'বিকাশ/নগদ অ্যাপে এই TrxID ও টাকার পরিমাণ মিলিয়ে দেখুন, তারপর "Paid" করুন।',
                'Check this TrxID and amount in your bKash/Nagad app, then mark it paid.',
              )}
            </p>

            {order.payment_status !== 'paid' && (
              <form action={updateOrder} className="mt-3">
                <input type="hidden" name="id" value={order.id} />
                <input type="hidden" name="payment_status" value="paid" />
                <SubmitButton className="btn-primary w-full">
                  ✓ {L('পেমেন্ট পেয়েছি (Paid)', 'Mark as paid')}
                </SubmitButton>
              </form>
            )}

            <form action={updateOrder} className="mt-3 flex gap-2">
              <input type="hidden" name="id" value={order.id} />
              <select
                name="payment_status"
                defaultValue={order.payment_status}
                aria-label={t.order.paymentStatus}
                className="field"
              >
                {PAYMENT_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {t.paymentStatus[value]}
                  </option>
                ))}
              </select>
              <SubmitButton className="btn-outline shrink-0">{t.account.save}</SubmitButton>
            </form>
          </section>

          <section className={`${card} p-4`}>
            <h2 className="font-semibold">{L('অর্ডারের স্ট্যাটাস', 'Order status')}</h2>
            {locked ? (
              <p className="mt-2 text-sm text-red-700">
                {L('বাতিল অর্ডার আর বদলানো যায় না।', 'A cancelled order cannot be changed.')}
              </p>
            ) : (
              <>
                <form action={updateOrder} className="mt-3 flex gap-2">
                  <input type="hidden" name="id" value={order.id} />
                  <select
                    name="status"
                    defaultValue={order.status}
                    aria-label={t.admin.status}
                    className="field"
                  >
                    {ORDER_STATUSES.filter((value) => value !== 'cancelled').map((value) => (
                      <option key={value} value={value}>
                        {t.orderStatus[value]}
                      </option>
                    ))}
                  </select>
                  <SubmitButton className="btn-outline shrink-0">{t.account.save}</SubmitButton>
                </form>

                <form action={updateOrder} className="mt-4 border-t border-zinc-200 pt-3">
                  <input type="hidden" name="id" value={order.id} />
                  <input type="hidden" name="status" value="cancelled" />
                  <ConfirmButton
                    message={L(
                      'অর্ডারটি বাতিল করবেন? স্টক ফেরত যাবে এবং এটা আর ফেরানো যাবে না।',
                      'Cancel this order? Stock is returned and this cannot be undone.',
                    )}
                  >
                    {L('অর্ডার বাতিল করুন', 'Cancel order')}
                  </ConfirmButton>
                </form>
              </>
            )}
          </section>

          {order.user_id && (
            <Link
              href={`/admin/customers/${order.user_id}`}
              className="block text-sm font-semibold text-brand hover:underline"
            >
              {L('এই কাস্টমারের সব অর্ডার', "This customer's orders")} →
            </Link>
          )}
        </aside>
      </div>
    </>
  );
}
