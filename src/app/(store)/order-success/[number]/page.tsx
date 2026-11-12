import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getI18n } from '@/i18n/server';
import { getOwnOrder } from '@/lib/orders';
import { OrderDetails } from '@/components/store/order-details';
import { CheckIcon } from '@/components/icons';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.order.successTitle, robots: { index: false } };
}

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const [{ locale, t }, order] = await Promise.all([getI18n(), getOwnOrder(number)]);
  if (!order) notFound();

  return (
    <div className="container-page max-w-3xl pt-8">
      <div className="rounded-2xl bg-green-50 p-5 text-center sm:p-8">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-green-600 text-white">
          <CheckIcon className="size-8" />
        </span>
        <h1 className="mt-3 text-2xl font-bold text-green-900">{t.order.successTitle}</h1>
        <p className="mt-1 text-green-900">{t.order.successText}</p>
        <p className="mt-3 text-sm font-medium text-green-900">{t.order.saveNumber}</p>
      </div>

      <div className="mt-5">
        <OrderDetails order={order} locale={locale} t={t} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/account/orders" className="btn-primary flex-1">
          {t.nav.orders}
        </Link>
        <Link href="/products" className="btn-outline flex-1">
          {t.cart.continueShopping}
        </Link>
      </div>
    </div>
  );
}
