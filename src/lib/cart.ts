import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { primaryImage } from '@/lib/queries';
import type { Cart, CartLine, ProductCardData } from '@/types/database';

export const COUPON_COOKIE = 'azbd_coupon';

type CartRow = {
  id: string;
  quantity: number;
  product_id: string;
  variant_id: string | null;
  products: {
    name_en: string;
    name_bn: string;
    slug: string;
    price: number;
    stock: number;
    is_active: boolean;
    product_images: { url: string; is_primary: boolean; sort_order: number }[];
  } | null;
  product_variants: {
    size: string | null;
    color: string | null;
    price: number | null;
    stock: number;
    is_active: boolean;
  } | null;
};

const EMPTY_CART: Cart = { lines: [], subtotal: 0, count: 0 };

/** The logged-in customer's cart with live prices and stock. Empty for guests. */
export const getCart = cache(async (): Promise<Cart> => {
  const profile = await getCurrentProfile();
  if (!profile) return EMPTY_CART;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cart_items')
    .select(
      'id, quantity, product_id, variant_id, ' +
        'products(name_en, name_bn, slug, price, stock, is_active, product_images(url, is_primary, sort_order)), ' +
        'product_variants(size, color, price, stock, is_active)',
    )
    // Admins may read every cart, so always ask for our own rows only.
    .eq('user_id', profile.id)
    .order('created_at');

  if (error) {
    console.error(`[supabase] getCart: ${error.message}`);
    return EMPTY_CART;
  }

  const lines: CartLine[] = [];
  for (const row of (data as unknown as CartRow[]) ?? []) {
    const product = row.products;
    if (!product) continue;
    const variant = row.product_variants;

    const available = product.is_active && (row.variant_id ? Boolean(variant?.is_active) : true);
    const stock = available ? (row.variant_id ? (variant?.stock ?? 0) : product.stock) : 0;
    const unitPrice = variant?.price ?? product.price;

    lines.push({
      id: row.id,
      productId: row.product_id,
      variantId: row.variant_id,
      slug: product.slug,
      name_en: product.name_en,
      name_bn: product.name_bn,
      imageUrl: primaryImage(product.product_images)?.url ?? null,
      variantLabel: [variant?.size, variant?.color].filter(Boolean).join(' / ') || null,
      unitPrice,
      quantity: row.quantity,
      stock,
      lineTotal: unitPrice * row.quantity,
    });
  }

  return {
    lines,
    subtotal: lines.reduce((sum, line) => sum + line.lineTotal, 0),
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
  };
});

/** Number shown on the cart icon. */
export const getCartCount = cache(async (): Promise<number> => {
  const profile = await getCurrentProfile();
  if (!profile) return 0;

  const supabase = await createClient();
  const { data } = await supabase.from('cart_items').select('quantity').eq('user_id', profile.id);
  return ((data as { quantity: number }[] | null) ?? []).reduce((sum, row) => sum + row.quantity, 0);
});

/** True when every line can be bought in the chosen quantity. */
export function cartIsValid(cart: Cart): boolean {
  return cart.lines.length > 0 && cart.lines.every((line) => line.quantity <= line.stock);
}

/**
 * The coupon saved from the cart page, re-checked against the current subtotal.
 * Returns null when there is none or it no longer applies.
 */
export async function getAppliedCoupon(
  subtotal: number,
): Promise<{ code: string; discount: number } | null> {
  const code = (await cookies()).get(COUPON_COOKIE)?.value;
  if (!code || subtotal <= 0) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('coupon_discount', {
    p_code: code,
    p_subtotal: subtotal,
  });
  if (error || typeof data !== 'number') return null;
  return { code, discount: data };
}

/** Ids of the products in the customer's wishlist. */
export const getWishlistIds = cache(async (): Promise<string[]> => {
  const profile = await getCurrentProfile();
  if (!profile) return [];

  const supabase = await createClient();
  const { data } = await supabase.from('wishlist').select('product_id').eq('user_id', profile.id);
  return ((data as { product_id: string }[] | null) ?? []).map((row) => row.product_id);
});

export async function getWishlistProducts(): Promise<ProductCardData[]> {
  const profile = await getCurrentProfile();
  if (!profile) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('wishlist')
    .select('created_at, products(*, product_images(url, alt, is_primary, sort_order))')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  if (error) console.error(`[supabase] getWishlistProducts: ${error.message}`);
  return ((data as unknown as { products: ProductCardData | null }[] | null) ?? [])
    .map((row) => row.products)
    .filter((product): product is ProductCardData => Boolean(product?.is_active));
}
