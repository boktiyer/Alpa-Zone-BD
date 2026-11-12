import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import type { Order, OrderItem, OrderStatus, OrderView } from '@/types/database';

type OrderRow = Order & {
  order_items: OrderItem[];
  order_status_history: { status: OrderStatus; created_at: string }[];
};

const byDate = (a: { created_at: string }, b: { created_at: string }) =>
  a.created_at.localeCompare(b.created_at);

function toView(row: OrderRow): OrderView {
  return {
    order_number: row.order_number,
    status: row.status,
    created_at: row.created_at,
    customer_name: row.customer_name,
    delivery_area: row.delivery_area,
    delivery_charge: row.delivery_charge,
    subtotal: row.subtotal,
    discount: row.discount,
    total: row.total,
    payment_method: row.payment_method,
    payment_status: row.payment_status,
    advance_amount: row.advance_amount ?? 0,
    items: [...row.order_items].sort(byDate),
    history: [...row.order_status_history].sort(byDate),
  };
}

/** One of the logged-in customer's own orders, by order number (AZ-1001). */
export async function getOwnOrder(orderNumber: string): Promise<OrderView | null> {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), order_status_history(status, created_at)')
    .eq('user_id', profile.id)
    .eq('order_number', orderNumber.toUpperCase())
    .maybeSingle();

  if (error) console.error(`[supabase] getOwnOrder: ${error.message}`);
  return data ? toView(data as OrderRow) : null;
}

export type OrderListItem = Pick<
  Order,
  'id' | 'order_number' | 'status' | 'total' | 'payment_method' | 'payment_status' | 'created_at'
> & { order_items: { quantity: number }[] };

/** The logged-in customer's orders, newest first. */
export async function getOwnOrders(): Promise<OrderListItem[]> {
  const profile = await getCurrentProfile();
  if (!profile) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, order_number, status, total, payment_method, payment_status, created_at, order_items(quantity)',
    )
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  if (error) console.error(`[supabase] getOwnOrders: ${error.message}`);
  return (data as OrderListItem[] | null) ?? [];
}
