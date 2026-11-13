'use client';

import { useActionState, useState } from 'react';
import { placeOrder, type FormState } from '@/app/(store)/actions';
import { site } from '@/config/site';
import { useI18n } from '@/i18n/provider';
import { formatPrice } from '@/lib/format';
import { DELIVERY_CHARGE, type DeliveryArea, type PaymentMethod } from '@/types/database';

type Wallet = 'bkash' | 'nagad';

/**
 * Delivery details + payment.
 *   COD          → delivery charge is sent now by bKash/Nagad, the rest is paid on delivery
 *   bKash/Nagad  → the full amount is sent now
 * The amounts shown here are only a preview: the database recalculates everything
 * when the order is saved.
 */
export function CheckoutForm({
  defaults,
  subtotal,
  discount,
}: {
  defaults: { name: string; phone: string; address: string; district: string };
  subtotal: number;
  discount: number;
}) {
  const { locale, t } = useI18n();
  const [state, formAction, pending] = useActionState<FormState, FormData>(placeOrder, null);
  const [area, setArea] = useState<DeliveryArea>('dhaka');
  const [method, setMethod] = useState<PaymentMethod>('cod');
  const [wallet, setWallet] = useState<Wallet>('bkash');

  const charge = DELIVERY_CHARGE[area];
  const total = subtotal - discount + charge;
  const payNow = method === 'cod' ? charge : total;
  const payLater = total - payNow;
  const walletName = t.paymentMethod[method === 'cod' ? wallet : method];

  const choice = (active: boolean) =>
    `flex cursor-pointer items-center gap-3 rounded-lg border bg-white p-3 transition ${
      active ? 'border-brand ring-2 ring-gold/40' : 'border-zinc-300 hover:border-gold'
    }`;

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        {state?.error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
            {state.error}
          </p>
        )}

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold">{t.checkout.deliveryDetails}</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              {t.checkout.name}
              <input
                name="customer_name"
                required
                defaultValue={defaults.name}
                autoComplete="name"
                className="field mt-1"
              />
            </label>
            <label className="block text-sm font-medium">
              {t.checkout.phone}
              <input
                name="phone"
                type="tel"
                required
                inputMode="numeric"
                defaultValue={defaults.phone}
                autoComplete="tel"
                placeholder="01XXXXXXXXX"
                className="field mt-1"
              />
            </label>
          </div>

          <label className="mt-4 block text-sm font-medium">
            {t.checkout.address}
            <textarea
              name="address"
              required
              rows={2}
              defaultValue={defaults.address}
              autoComplete="street-address"
              placeholder={t.checkout.addressPlaceholder}
              className="field mt-1"
            />
          </label>

          <label className="mt-4 block text-sm font-medium">
            {t.checkout.district}
            <input name="district" defaultValue={defaults.district} className="field mt-1" />
          </label>

          <fieldset className="mt-4">
            <legend className="text-sm font-medium">{t.checkout.deliveryArea}</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(['dhaka', 'outside'] as const).map((value) => (
                <label key={value} className={choice(area === value)}>
                  <input
                    type="radio"
                    name="delivery_area"
                    value={value}
                    checked={area === value}
                    onChange={() => setArea(value)}
                    className="size-4 accent-brand"
                  />
                  <span className="flex-1 font-medium">
                    {value === 'dhaka' ? t.checkout.insideDhaka : t.checkout.outsideDhaka}
                  </span>
                  <span className="font-bold text-brand">
                    {formatPrice(DELIVERY_CHARGE[value], locale)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="mt-4 block text-sm font-medium">
            {t.checkout.note}
            <textarea name="note" rows={2} className="field mt-1" />
          </label>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold">{t.checkout.paymentMethod}</h2>

          <div className="mt-4 grid gap-2">
            {(['cod', 'bkash', 'nagad'] as const).map((value) => (
              <label key={value} className={choice(method === value)}>
                <input
                  type="radio"
                  name="payment_method"
                  value={value}
                  checked={method === value}
                  onChange={() => setMethod(value)}
                  className="size-4 accent-brand"
                />
                <span>
                  <span className="block font-medium">
                    {value === 'cod' ? t.checkout.cod : t.paymentMethod[value]}
                  </span>
                  <span className="block text-sm text-zinc-600">
                    {value === 'cod' ? t.checkout.codHelp : t.checkout.walletHelp}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="mt-4 rounded-xl border-2 border-dashed border-gold bg-blush p-4">
            <h3 className="font-semibold">{t.checkout.payNow}</h3>

            {method === 'cod' && (
              <fieldset className="mt-3">
                <legend className="text-sm font-medium">{t.checkout.advanceVia}</legend>
                <div className="mt-2 flex gap-2">
                  {(['bkash', 'nagad'] as const).map((value) => (
                    <label
                      key={value}
                      className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold ${
                        wallet === value
                          ? 'border-brand bg-brand text-white'
                          : 'border-zinc-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="advance_via"
                        value={value}
                        checked={wallet === value}
                        onChange={() => setWallet(value)}
                        className="sr-only"
                      />
                      {t.paymentMethod[value]}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <dt>
                  {t.checkout.sendMoney} ({walletName})
                </dt>
                <dd className="text-xl font-bold tracking-wide text-ink">{site.paymentNumber}</dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <dt>{t.checkout.amountToSend}</dt>
                <dd className="text-xl font-bold text-brand">{formatPrice(payNow, locale)}</dd>
              </div>
              {payLater > 0 && (
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <dt>{t.checkout.dueOnDelivery}</dt>
                  <dd className="font-semibold">{formatPrice(payLater, locale)}</dd>
                </div>
              )}
            </dl>

            <label className="mt-4 block text-sm font-medium">
              {t.checkout.transactionId}
              <input
                name="transaction_id"
                required
                autoComplete="off"
                autoCapitalize="characters"
                className="field mt-1 uppercase"
              />
              <span className="mt-1 block text-xs font-normal text-zinc-600">
                {t.checkout.transactionHint}
              </span>
            </label>
          </div>
        </section>
      </div>

      <aside>
        <div className="sticky top-28 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold">{t.checkout.orderSummary}</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>{t.cart.subtotal}</dt>
              <dd>{formatPrice(subtotal, locale)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-700">
                <dt>{t.cart.discount}</dt>
                <dd>− {formatPrice(discount, locale)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>{t.checkout.deliveryCharge}</dt>
              <dd>{formatPrice(charge, locale)}</dd>
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-2 text-lg font-bold">
              <dt>{t.cart.total}</dt>
              <dd className="text-brand">{formatPrice(total, locale)}</dd>
            </div>
          </dl>

          <button type="submit" disabled={pending} className="btn-primary mt-5 w-full py-3">
            {pending ? t.checkout.placing : t.checkout.placeOrder}
          </button>
        </div>
      </aside>
    </form>
  );
}
