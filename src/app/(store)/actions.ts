'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getI18n } from '@/i18n/server';
import { COUPON_COOKIE, getCart } from '@/lib/cart';
import { isValidBdPhone } from '@/lib/format';
import type { DeliveryArea, OrderView, PaymentMethod } from '@/types/database';

export type ActionResult = { ok: true } | { ok: false; error: string; needLogin?: boolean };
export type FormState = { error?: string; message?: string } | null;

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function refreshStore() {
  // Cart count in the header, cart page, checkout…
  revalidatePath('/', 'layout');
}

// ---------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------

export async function addToCart(input: {
  productId: string;
  variantId: string | null;
  quantity: number;
}): Promise<ActionResult> {
  const { t } = await getI18n();
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: t.auth.loginFirst, needLogin: true };

  const quantity = Math.max(1, Math.floor(input.quantity) || 1);

  let existing = supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('product_id', input.productId);
  existing = input.variantId
    ? existing.eq('variant_id', input.variantId)
    : existing.is('variant_id', null);
  const { data: row } = await existing.maybeSingle();

  // The database trigger check_cart_item refuses anything above the stock.
  const { error } = row
    ? await supabase
        .from('cart_items')
        .update({ quantity: row.quantity + quantity })
        .eq('id', row.id)
    : await supabase.from('cart_items').insert({
        user_id: user.id,
        product_id: input.productId,
        variant_id: input.variantId,
        quantity,
      });

  if (error) {
    if (error.message.includes('insufficient_stock')) return { ok: false, error: t.cart.stockLimit };
    if (error.message.includes('variant_required')) return { ok: false, error: t.product.chooseOptions };
    if (error.message.includes('product_unavailable')) return { ok: false, error: t.product.outOfStock };
    console.error(`[cart] addToCart: ${error.message}`);
    return { ok: false, error: t.auth.genericError };
  }

  refreshStore();
  return { ok: true };
}

export async function updateCartItem(itemId: string, quantity: number): Promise<ActionResult> {
  const { t } = await getI18n();
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: t.auth.loginFirst, needLogin: true };

  const wanted = Math.floor(quantity);
  const query =
    wanted < 1
      ? supabase.from('cart_items').delete().eq('id', itemId).eq('user_id', user.id)
      : supabase.from('cart_items').update({ quantity: wanted }).eq('id', itemId).eq('user_id', user.id);
  const { error } = await query;

  if (error) {
    if (error.message.includes('insufficient_stock')) return { ok: false, error: t.cart.stockLimit };
    if (error.message.includes('product_unavailable')) return { ok: false, error: t.cart.unavailable };
    console.error(`[cart] updateCartItem: ${error.message}`);
    return { ok: false, error: t.auth.genericError };
  }

  refreshStore();
  return { ok: true };
}

export async function removeCartItem(itemId: string): Promise<ActionResult> {
  return updateCartItem(itemId, 0);
}

// ---------------------------------------------------------------------
// Coupon (the code is kept in a cookie until the order is placed)
// ---------------------------------------------------------------------

export async function applyCoupon(_prev: FormState, formData: FormData): Promise<FormState> {
  const { t } = await getI18n();
  const code = text(formData, 'code').toUpperCase();
  if (!code) return { error: t.cart.couponInvalid };

  const cart = await getCart();
  const supabase = await createClient();
  const { error } = await supabase.rpc('coupon_discount', {
    p_code: code,
    p_subtotal: cart.subtotal,
  });

  if (error) {
    return {
      error: error.message.includes('coupon_min_order_not_met')
        ? t.cart.couponMinOrder
        : t.cart.couponInvalid,
    };
  }

  (await cookies()).set(COUPON_COOKIE, code, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
    httpOnly: true,
  });
  refreshStore();
  return { message: t.cart.couponApplied };
}

export async function removeCoupon() {
  (await cookies()).delete(COUPON_COOKIE);
  refreshStore();
}

// ---------------------------------------------------------------------
// Wishlist
// ---------------------------------------------------------------------

export async function toggleWishlist(
  productId: string,
): Promise<{ ok: true; inWishlist: boolean } | { ok: false; error: string; needLogin?: boolean }> {
  const { t } = await getI18n();
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: t.auth.loginFirst, needLogin: true };

  const { data: existing } = await supabase
    .from('wishlist')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from('wishlist').delete().eq('id', existing.id)
    : await supabase.from('wishlist').insert({ user_id: user.id, product_id: productId });

  if (error) {
    console.error(`[wishlist] toggleWishlist: ${error.message}`);
    return { ok: false, error: t.auth.genericError };
  }

  refreshStore();
  return { ok: true, inWishlist: !existing };
}

// ---------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------

const AREAS: DeliveryArea[] = ['dhaka', 'outside'];
const METHODS: PaymentMethod[] = ['cod', 'bkash', 'nagad'];

export async function placeOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const { t } = await getI18n();
  const { supabase, user } = await requireUser();
  if (!user) redirect('/login?next=/checkout');

  const name = text(formData, 'customer_name');
  const phone = text(formData, 'phone');
  const address = text(formData, 'address');
  const area = text(formData, 'delivery_area') as DeliveryArea;
  const method = text(formData, 'payment_method') as PaymentMethod;
  const advanceVia = text(formData, 'advance_via') as PaymentMethod;
  const transactionId = text(formData, 'transaction_id');

  if (!name || !phone || !address) return { error: t.checkout.missing };
  if (!isValidBdPhone(phone)) return { error: t.checkout.invalidPhone };
  if (!AREAS.includes(area) || !METHODS.includes(method)) return { error: t.checkout.genericError };
  if (method === 'cod' && advanceVia !== 'bkash' && advanceVia !== 'nagad') {
    return { error: t.checkout.genericError };
  }
  if (!transactionId) return { error: t.checkout.trxRequired };

  const cookieStore = await cookies();
  const couponCode = cookieStore.get(COUPON_COOKIE)?.value ?? null;

  // The database function calculates every amount itself and saves the order.
  const { data: orderNumber, error } = await supabase.rpc('place_order', {
    p_customer_name: name,
    p_phone: phone,
    p_address: address,
    p_district: text(formData, 'district'),
    p_delivery_area: area,
    p_payment_method: method,
    p_advance_via: method === 'cod' ? advanceVia : method,
    p_transaction_id: transactionId,
    p_coupon_code: couponCode,
    p_note: text(formData, 'note'),
  });

  if (error || typeof orderNumber !== 'string') {
    const message = error?.message ?? '';
    if (/insufficient_stock|product_unavailable|variant_required/.test(message)) {
      return { error: t.checkout.stockError };
    }
    if (message.includes('cart_empty')) return { error: t.checkout.cartEmpty };
    if (/invalid_coupon|coupon_min_order_not_met/.test(message)) {
      cookieStore.delete(COUPON_COOKIE);
      return { error: t.cart.couponInvalid };
    }
    console.error(`[checkout] placeOrder: ${message}`);
    return { error: t.checkout.genericError };
  }

  cookieStore.delete(COUPON_COOKIE);
  refreshStore();
  redirect(`/order-success/${orderNumber}`);
}

// ---------------------------------------------------------------------
// Order tracking (no login needed: order number + phone)
// ---------------------------------------------------------------------

export type TrackState = { error?: string; order?: OrderView } | null;

export async function trackOrder(_prev: TrackState, formData: FormData): Promise<TrackState> {
  const { t } = await getI18n();
  const orderNumber = text(formData, 'order_number');
  const phone = text(formData, 'phone');
  if (!orderNumber || !phone) return { error: t.track.notFound };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('track_order', {
    p_order_number: orderNumber,
    p_phone: phone,
  });

  if (error) {
    console.error(`[track] trackOrder: ${error.message}`);
    return { error: t.auth.genericError };
  }
  if (!data) return { error: t.track.notFound };
  return { order: data as OrderView };
}
