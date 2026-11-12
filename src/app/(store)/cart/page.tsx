import type { Metadata } from 'next';
import Link from 'next/link';
import { getI18n } from '@/i18n/server';
import { formatPrice } from '@/lib/format';
import { cartIsValid, getAppliedCoupon, getCart } from '@/lib/cart';
import { CartLineRow } from '@/components/store/cart-line';
import { CouponForm } from '@/components/store/coupon-form';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.cart.title, robots: { index: false } };
}

export default async function CartPage() {
  const [{ locale, t }, cart] = await Promise.all([getI18n(), getCart()]);

  if (cart.lines.length === 0) {
    return (
      <div className="container-page flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-bold">{t.cart.title}</h1>
        <p className="text-zinc-600">{t.cart.empty}</p>
        <Link href="/products" className="btn-primary">
          {t.cart.continueShopping}
        </Link>
      </div>
    );
  }

  const coupon = await getAppliedCoupon(cart.subtotal);
  const discount = coupon?.discount ?? 0;
  const valid = cartIsValid(cart);

  return (
    <div className="container-page pt-6">
      <h1 className="text-2xl font-bold sm:text-3xl">{t.cart.title}</h1>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <ul className="divide-y divide-zinc-200 self-start rounded-2xl border border-zinc-200 bg-white">
          {cart.lines.map((line) => (
            <CartLineRow key={line.id} line={line} />
          ))}
        </ul>

        <aside>
          <div className="sticky top-28 space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
            <CouponForm appliedCode={coupon?.code ?? null} />

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>{t.cart.subtotal}</dt>
                <dd>{formatPrice(cart.subtotal, locale)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <dt>{t.cart.discount}</dt>
                  <dd>− {formatPrice(discount, locale)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-200 pt-2 text-lg font-bold">
                <dt>{t.cart.total}</dt>
                <dd className="text-royal-700">{formatPrice(cart.subtotal - discount, locale)}</dd>
              </div>
            </dl>
            <p className="text-xs text-zinc-600">{t.cart.deliveryNote}</p>

            {valid ? (
              <Link href="/checkout" className="btn-primary w-full py-3">
                {t.cart.checkout}
              </Link>
            ) : (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
                {t.cart.fixCart}
              </p>
            )}
            <Link href="/products" className="btn-outline w-full">
              {t.cart.continueShopping}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
