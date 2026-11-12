import Image from 'next/image';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/en';
import { formatDateTime, formatNumber, formatPrice } from '@/lib/format';
import type { OrderStatus, OrderView } from '@/types/database';
import { CheckIcon } from '@/components/icons';

// The normal path of an order. "cancelled" is shown separately.
const STEPS: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

/** Status timeline: finished steps are ticked, with the time each one happened. */
export function OrderTimeline({
  order,
  locale,
  t,
}: {
  order: OrderView;
  locale: Locale;
  t: Dictionary;
}) {
  const timeOf = (status: OrderStatus) =>
    [...order.history].reverse().find((entry) => entry.status === status)?.created_at;

  if (order.status === 'cancelled') {
    const cancelledAt = timeOf('cancelled');
    return (
      <p className="rounded-lg bg-red-50 p-4 font-medium text-red-800">
        {t.order.cancelled}
        {cancelledAt && (
          <span className="block text-sm font-normal">{formatDateTime(cancelledAt, locale)}</span>
        )}
      </p>
    );
  }

  const current = STEPS.indexOf(order.status);

  return (
    <ol className="grid gap-0 sm:grid-cols-5">
      {STEPS.map((step, index) => {
        const done = index <= current;
        const time = done ? timeOf(step) : undefined;

        return (
          <li
            key={step}
            aria-current={index === current ? 'step' : undefined}
            className="relative flex gap-3 pb-6 last:pb-0 sm:flex-col sm:items-center sm:gap-2 sm:pb-0 sm:text-center"
          >
            {/* connector to the next step: vertical on phones, horizontal on desktop */}
            {index < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute left-4 top-8 h-[calc(100%-2rem)] w-0.5 -translate-x-1/2 sm:left-[calc(50%+1.25rem)] sm:top-4 sm:h-0.5 sm:w-[calc(100%-2.5rem)] sm:translate-x-0 sm:-translate-y-1/2 ${
                  index < current ? 'bg-royal-600' : 'bg-zinc-300'
                }`}
              />
            )}
            <span
              className={`relative grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                done ? 'bg-royal-600 text-white' : 'border-2 border-zinc-300 bg-white text-zinc-500'
              }`}
            >
              {done ? <CheckIcon className="size-4" /> : formatNumber(index + 1, locale)}
            </span>
            <span>
              <span className={`block font-semibold ${done ? 'text-ink' : 'text-zinc-500'}`}>
                {t.orderStatus[step]}
              </span>
              {time && (
                <span className="block text-xs text-zinc-600">{formatDateTime(time, locale)}</span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Full order: number, timeline, items, amounts and payment. */
export function OrderDetails({
  order,
  locale,
  t,
}: {
  order: OrderView;
  locale: Locale;
  t: Dictionary;
}) {
  const due = Math.max(0, order.total - order.advance_amount);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
        <div>
          <p className="text-sm text-zinc-600">{t.order.orderNumber}</p>
          <p className="text-2xl font-bold tracking-wide text-royal-700">{order.order_number}</p>
        </div>
        <p className="text-sm text-zinc-600">
          {t.order.placedOn}: {formatDateTime(order.created_at, locale)}
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
        <h2 className="mb-4 text-lg font-semibold">{t.order.status}</h2>
        <OrderTimeline order={order} locale={locale} t={t} />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white">
        <h2 className="border-b border-zinc-200 px-4 py-3 text-lg font-semibold sm:px-5">
          {t.order.items}
        </h2>
        <ul className="divide-y divide-zinc-100">
          {order.items.map((item, index) => (
            <li key={index} className="flex gap-3 p-3 sm:px-5">
              <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-royal-50">
                {item.image_url && (
                  <Image src={item.image_url} alt="" fill sizes="64px" className="object-cover" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">
                  {(locale === 'bn' && item.product_name_bn) || item.product_name}
                </span>
                {item.variant_label && (
                  <span className="block text-sm text-zinc-600">{item.variant_label}</span>
                )}
                <span className="block text-sm text-zinc-600">
                  {formatPrice(item.unit_price, locale)} × {formatNumber(item.quantity, locale)}
                </span>
              </span>
              <span className="font-semibold">{formatPrice(item.line_total, locale)}</span>
            </li>
          ))}
        </ul>

        <dl className="space-y-2 border-t border-zinc-200 p-4 text-sm sm:px-5">
          <div className="flex justify-between">
            <dt>{t.cart.subtotal}</dt>
            <dd>{formatPrice(order.subtotal, locale)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-700">
              <dt>{t.cart.discount}</dt>
              <dd>− {formatPrice(order.discount, locale)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>
              {t.checkout.deliveryCharge} (
              {order.delivery_area === 'dhaka' ? t.checkout.insideDhaka : t.checkout.outsideDhaka})
            </dt>
            <dd>{formatPrice(order.delivery_charge, locale)}</dd>
          </div>
          <div className="flex justify-between border-t border-zinc-200 pt-2 text-lg font-bold">
            <dt>{t.cart.total}</dt>
            <dd className="text-royal-700">{formatPrice(order.total, locale)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
        <h2 className="text-lg font-semibold">{t.order.payment}</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt>{t.checkout.paymentMethod}</dt>
            <dd className="font-medium">{t.paymentMethod[order.payment_method]}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>{t.order.paymentStatus}</dt>
            <dd className="font-medium">{t.paymentStatus[order.payment_status]}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>{t.order.advance}</dt>
            <dd className="font-medium">{formatPrice(order.advance_amount, locale)}</dd>
          </div>
          {due > 0 && (
            <div className="flex justify-between gap-3 text-base font-bold">
              <dt>{t.order.due}</dt>
              <dd>{formatPrice(due, locale)}</dd>
            </div>
          )}
        </dl>
      </section>
    </div>
  );
}
