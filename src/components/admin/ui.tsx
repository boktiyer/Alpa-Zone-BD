import type { ReactNode } from 'react';
import type { OrderStatus, PaymentStatus } from '@/types/database';

export const card = 'rounded-xl border border-zinc-200 bg-white';
export const th = 'px-3 py-2 text-left font-medium text-zinc-600';
export const td = 'px-3 py-2 align-top';

/** Green / red banner driven by ?ok=1 or ?error=message in the URL. */
export function Notice({
  params,
  okText,
}: {
  params: { ok?: string; error?: string };
  okText: string;
}) {
  if (params.error) {
    return (
      <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
        {params.error}
      </p>
    );
  }
  if (params.ok) {
    return (
      <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-800">
        {okText}
      </p>
    );
  }
  return null;
}

export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold">{title}</h1>
      {children && <div className="flex flex-wrap gap-2 print:hidden">{children}</div>}
    </div>
  );
}

/** Scrolls sideways on phones instead of breaking the page. */
export function TableWrap({ children }: { children: ReactNode }) {
  return <div className={`${card} overflow-x-auto`}>{children}</div>;
}

const statusColor: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-royal-100 text-royal-800',
  processing: 'bg-royal-100 text-royal-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const paymentColor: Record<PaymentStatus, string> = {
  unpaid: 'bg-zinc-100 text-zinc-800',
  pending: 'bg-amber-100 text-amber-900',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-zinc-200 text-zinc-800',
};

export function Badge({
  status,
  payment,
  children,
}: {
  status?: OrderStatus;
  payment?: PaymentStatus;
  children: ReactNode;
}) {
  const color = status ? statusColor[status] : payment ? paymentColor[payment] : 'bg-zinc-100';
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {children}
    </span>
  );
}
