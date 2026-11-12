import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getI18n } from '@/i18n/server';
import { tr } from '@/i18n/config';
import { formatNumber, formatPrice } from '@/lib/format';
import { getCurrentProfile } from '@/lib/auth';
import { cartIsValid, getAppliedCoupon, getCart } from '@/lib/cart';
import { CheckoutForm } from '@/components/store/checkout-form';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.checkout.title, robots: { index: false } };
}

export default async function CheckoutPage() {
  const [{ locale, t }, profile, cart] = await Promise.all([
    getI18n(),
    getCurrentProfile(),
    getCart(),
  ]);
  if (!profile) redirect('/login?next=/checkout');
  // Empty cart, or something in it is out of stock → back to the cart to fix it.
  if (!cartIsValid(cart)) redirect('/cart');

  const coupon = await getAppliedCoupon(cart.subtotal);

  return (
    <div className="container-page pt-6">
      <h1 className="text-2xl font-bold sm:text-3xl">{t.checkout.title}</h1>

      <section className="mt-5 rounded-2xl border border-zinc-200 bg-white">
        <h2 className="border-b border-zinc-200 px-4 py-3 font-semibold sm:px-6">
          {t.order.items} ({formatNumber(cart.count, locale)})
        </h2>
        <ul className="divide-y divide-zinc-100 text-sm">
          {cart.lines.map((line) => (
            <li key={line.id} className="flex justify-between gap-3 px-4 py-2.5 sm:px-6">
              <span>
                {tr(line, 'name', locale)}
                {line.variantLabel && <span className="text-zinc-600"> · {line.variantLabel}</span>}
                <span className="text-zinc-600"> × {formatNumber(line.quantity, locale)}</span>
              </span>
              <span className="shrink-0 font-medium">{formatPrice(line.lineTotal, locale)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6">
        <CheckoutForm
          subtotal={cart.subtotal}
          discount={coupon?.discount ?? 0}
          defaults={{
            name: profile.full_name ?? '',
            phone: profile.phone ?? '',
            address: profile.address ?? '',
            district: profile.district ?? '',
          }}
        />
      </div>
    </div>
  );
}
