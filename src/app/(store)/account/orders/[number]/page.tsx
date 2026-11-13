import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getI18n } from '@/i18n/server';
import { getOwnOrder } from '@/lib/orders';
import { OrderDetails } from '@/components/store/order-details';

type Props = { params: Promise<{ number: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { number } = await params;
  return { title: number.toUpperCase(), robots: { index: false } };
}

export default async function OrderPage({ params }: Props) {
  const { number } = await params;
  const [{ locale, t }, order] = await Promise.all([getI18n(), getOwnOrder(number)]);
  if (!order) notFound();

  return (
    <div className="container-page max-w-3xl pt-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-zinc-500">
        <Link href="/account" className="hover:text-brand">
          {t.account.title}
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/account/orders" className="hover:text-brand">
          {t.nav.orders}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">{order.order_number}</span>
      </nav>
      <OrderDetails order={order} locale={locale} t={t} />
    </div>
  );
}
