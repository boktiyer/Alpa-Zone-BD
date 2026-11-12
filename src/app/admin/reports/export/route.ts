import type { NextRequest } from 'next/server';
import { dhakaDay, isDay, ordersBetween } from '@/lib/admin';

// Spreadsheets run cells that start with = + - @ as formulas, so those get a leading '.
function cell(value: string | number | null): string {
  let text = value === null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text) && typeof value !== 'number') text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

// GET /admin/reports/export?from=2026-11-01&to=2026-11-30 → CSV, one line per order.
// ordersBetween() calls requireAdmin(), so only admins get the file.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const today = dhakaDay(new Date());
  const to = isDay(searchParams.get('to')) ? (searchParams.get('to') as string) : today;
  const from = isDay(searchParams.get('from')) ? (searchParams.get('from') as string) : to;

  const orders = await ordersBetween(from <= to ? from : to, to);

  const header = [
    'Order', 'Date (Dhaka)', 'Status', 'Customer', 'Phone', 'Products', 'Discount',
    'Delivery', 'Total', 'Payment method', 'Payment status', 'Transaction ID',
  ];
  const lines = orders.map((order) =>
    [
      order.order_number,
      new Date(order.created_at).toLocaleString('sv-SE', { timeZone: 'Asia/Dhaka' }),
      order.status,
      order.customer_name,
      order.phone,
      order.subtotal,
      order.discount,
      order.delivery_charge,
      order.total,
      order.payment_method,
      order.payment_status,
      order.transaction_id,
    ]
      .map(cell)
      .join(','),
  );

  // ﻿ (BOM) makes Excel read Bangla names correctly.
  const csv = `﻿${[header.map(cell).join(','), ...lines].join('\r\n')}\r\n`;
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="alpa-zone-sales-${from}-to-${to}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
