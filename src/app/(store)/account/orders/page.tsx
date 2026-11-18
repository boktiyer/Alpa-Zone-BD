import type { Metadata } from 'next';
import Link from 'next/link';
import { getI18n } from '@/i18n/server';
import { formatDate, formatNumber, formatPrice } from '@/lib/format';
import { getOwnOrders } from '@/lib/orders';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.nav.orders, robots: { index: false } };
}

export default async function MyOrdersPage() {
  const [{ locale, t }, orders] = await Promise.all([getI18n(), getOwnOrders()]);

  return (
    <div className="container-page max-w-3xl pt-8">
      <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
        <Link href="/account" className="hover:text-brand">
          {t.account.title}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">{t.nav.orders}</span>
      </nav>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{t.nav.orders}</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-14 text-center">
          <p className="text-zinc-600">{t.order.none}</p>
          <Link href="/products" className="btn-primary">
            {t.cart.continueShopping}
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {orders.map((order) => {
            const pieces = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
            return (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.order_number}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white p-4 transition hover:border-gold"
                >
                  <span>
                    <span className="block text-lg font-bold text-brand">
                      {order.order_number}
                    </span>
                    <span className="block text-sm text-zinc-600">
                      {formatDate(order.created_at, locale)} · {t.order.qty}:{' '}
                      {formatNumber(pieces, locale)} · {t.paymentMethod[order.payment_method]}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-bold">{formatPrice(order.total, locale)}</span>
                    <span
                      className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        order.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blush text-brand-dark'
                      }`}
                    >
                      {t.orderStatus[order.status]}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
