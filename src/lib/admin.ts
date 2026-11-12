import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getI18n } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

/** Stock at or below this number counts as "low stock". */
export const LOW_STOCK = 5;

/**
 * Use at the top of every admin Server Action and admin data read.
 * Returns a Supabase client only if the visitor is an admin.
 * (The proxy and Row Level Security check this too — this is the third lock.)
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') redirect('/');

  return supabase;
}

/** Bangla / English label picker for the admin pages: L('অর্ডার', 'Orders') */
export type Labeler = (bn: string, en: string) => string;
export const makeL =
  (locale: Locale): Labeler =>
  (bn, en) =>
    locale === 'bn' ? bn : en;

export async function getAdminI18n() {
  const { locale, t } = await getI18n();
  return { locale, t, L: makeL(locale) };
}

// ---- Dates (the shop works in Bangladesh time) ------------------------

/** '2026-11-13' for a moment in time, in Asia/Dhaka. */
export function dhakaDay(value: string | Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

/** Start of a Dhaka calendar day as an ISO timestamp. */
export const dhakaDayStart = (day: string) => new Date(`${day}T00:00:00+06:00`).toISOString();
/** End of a Dhaka calendar day (exclusive) as an ISO timestamp. */
export const dhakaDayEnd = (day: string) =>
  new Date(new Date(`${day}T00:00:00+06:00`).getTime() + 86_400_000).toISOString();

export const isDay = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

/** Day `n` days before `day` (both 'YYYY-MM-DD'). */
export function shiftDay(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}

// ---- Misc -------------------------------------------------------------

/** "Men's T-Shirt" → "mens-t-shirt". Falls back to a random slug for Bangla-only names. */
export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || `item-${Date.now().toString(36)}`;
}

export type OrderReportRow = {
  order_number: string;
  created_at: string;
  status: string;
  customer_name: string;
  phone: string;
  subtotal: number;
  discount: number;
  delivery_charge: number;
  total: number;
  payment_method: string;
  payment_status: string;
  transaction_id: string | null;
};

/** Every order between two Dhaka days (inclusive), read 1000 rows at a time. */
export async function ordersBetween(from: string, to: string): Promise<OrderReportRow[]> {
  const supabase = await requireAdmin();
  const rows: OrderReportRow[] = [];

  for (let start = 0; ; start += 1000) {
    const { data, error } = await supabase
      .from('orders')
      .select(
        'order_number, created_at, status, customer_name, phone, subtotal, discount, delivery_charge, total, payment_method, payment_status, transaction_id',
      )
      .gte('created_at', dhakaDayStart(from))
      .lt('created_at', dhakaDayEnd(to))
      .order('created_at')
      .range(start, start + 999);

    if (error) {
      console.error(`[admin] ordersBetween: ${error.message}`);
      break;
    }
    rows.push(...((data as OrderReportRow[]) ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

export type StockRow = {
  kind: 'product' | 'variant';
  id: string;
  productId: string;
  name_en: string;
  name_bn: string;
  /** "M / Blue" for a variant, null for a product without variants. */
  label: string | null;
  sku: string | null;
  stock: number;
};

/** One row per thing that has its own stock: each variant, or the product itself. */
export async function getStockRows(): Promise<StockRow[]> {
  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from('products')
    .select('id, name_en, name_bn, sku, stock, product_variants(id, size, color, sku, stock)')
    .order('name_en');
  if (error) console.error(`[admin] getStockRows: ${error.message}`);

  type Row = {
    id: string;
    name_en: string;
    name_bn: string;
    sku: string | null;
    stock: number;
    product_variants: { id: string; size: string | null; color: string | null; sku: string | null; stock: number }[];
  };

  return ((data as Row[] | null) ?? []).flatMap((product): StockRow[] =>
    product.product_variants.length === 0
      ? [{ kind: 'product', id: product.id, productId: product.id, name_en: product.name_en, name_bn: product.name_bn, label: null, sku: product.sku, stock: product.stock }]
      : product.product_variants.map((variant) => ({
          kind: 'variant',
          id: variant.id,
          productId: product.id,
          name_en: product.name_en,
          name_bn: product.name_bn,
          label: [variant.size, variant.color].filter(Boolean).join(' / ') || null,
          sku: variant.sku,
          stock: variant.stock,
        })),
  );
}
