'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAdmin, slugify } from '@/lib/admin';
import { ORDER_STATUSES, type OrderStatus, type PaymentStatus } from '@/types/database';

// Every action: 1) requireAdmin()  2) validate input  3) write  4) redirect back
// with ?ok=1 or ?error=message, which the page shows as a notice.

const PAYMENT_STATUSES: PaymentStatus[] = ['unpaid', 'pending', 'paid', 'failed', 'refunded'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const str = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
};
const orNull = (value: string) => value || null;
const isId = (value: string) => UUID.test(value);

/** Non-negative number, or null when the field is empty. NaN when invalid. */
function num(form: FormData, name: string): number | null {
  const raw = str(form, name);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : NaN;
}

function fail(path: string, message: string): never {
  redirect(`${path}${path.includes('?') ? '&' : '?'}error=${encodeURIComponent(message)}`);
}

function done(path: string): never {
  // Store pages read the same data (categories in the menu, products, banners…).
  revalidatePath('/', 'layout');
  redirect(`${path}${path.includes('?') ? '&' : '?'}ok=1`);
}

/** Readable message for the most common database errors. */
function dbMessage(error: { code?: string; message: string }): string {
  if (error.code === '23505') return 'Duplicate value: this slug, SKU or code is already used.';
  if (error.code === '23503') return 'This item is still used somewhere else.';
  if (error.message.includes('cancelled_order_locked')) return 'A cancelled order cannot be changed.';
  return error.message;
}

async function uniqueSlug(supabase: SupabaseClient, table: string, base: string, id: string) {
  let query = supabase.from(table).select('id').eq('slug', base);
  if (id) query = query.neq('id', id);
  const { data } = await query.limit(1);
  return data && data.length > 0 ? `${base}-${Math.random().toString(36).slice(2, 6)}` : base;
}

/** Storage path of a public file URL in one of our buckets, or null for other URLs. */
function storagePath(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
}

async function removeFiles(supabase: SupabaseClient, bucket: string, urls: string[]) {
  const paths = urls.map((url) => storagePath(url, bucket)).filter((p): p is string => Boolean(p));
  if (paths.length > 0) await supabase.storage.from(bucket).remove(paths);
}

// ---------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------

export async function saveCategory(form: FormData) {
  const supabase = await requireAdmin();
  const path = '/admin/categories';
  const id = str(form, 'id');
  const nameEn = str(form, 'name_en');
  const nameBn = str(form, 'name_bn');
  const parentId = str(form, 'parent_id');
  const sortOrder = num(form, 'sort_order') ?? 0;

  if (!nameEn || !nameBn) fail(path, 'Both names are required.');
  if (id && !isId(id)) fail(path, 'Invalid category.');
  if (parentId && (!isId(parentId) || parentId === id)) fail(path, 'Invalid parent category.');
  if (Number.isNaN(sortOrder)) fail(path, 'Sort order must be a number.');

  const row = {
    name_en: nameEn,
    name_bn: nameBn,
    slug: await uniqueSlug(supabase, 'categories', slugify(str(form, 'slug') || nameEn), id),
    parent_id: orNull(parentId),
    sort_order: Math.round(sortOrder),
    is_active: form.get('is_active') === 'on',
  };

  const { error } = id
    ? await supabase.from('categories').update(row).eq('id', id)
    : await supabase.from('categories').insert(row);
  if (error) fail(path, dbMessage(error));
  done(path);
}

export async function deleteCategory(form: FormData) {
  const supabase = await requireAdmin();
  const id = str(form, 'id');
  if (!isId(id)) fail('/admin/categories', 'Invalid category.');
  // Products and sub-categories are kept; they just lose this category.
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) fail('/admin/categories', dbMessage(error));
  done('/admin/categories');
}

// ---------------------------------------------------------------------
// Products (with variants and images)
// ---------------------------------------------------------------------

type VariantInput = { id?: string; size: string; color: string; stock: number; price: number | null };

/**
 * The forms ask for a "price" and an optional "discount price".
 * The database stores what the customer pays (price) and the crossed-out
 * old price (compare_at_price), so a discount swaps the two.
 */
function readPrices(form: FormData, path: string) {
  const regular = num(form, 'regular_price');
  const discount = num(form, 'discount_price');
  if (regular === null || Number.isNaN(regular)) fail(path, 'Price must be a number.');
  if (Number.isNaN(discount)) fail(path, 'Discount price must be a number.');
  if (discount === null) return { price: regular, compare_at_price: null };
  if (discount >= regular) {
    fail(path, 'Discount price must be lower than the price (or leave it empty).');
  }
  return { price: discount, compare_at_price: regular };
}

export async function saveProduct(form: FormData) {
  const supabase = await requireAdmin();
  const id = str(form, 'id');
  const path = id ? `/admin/products/${id}` : '/admin/products/new';

  // One name is enough: the other language falls back to it.
  const nameEn = str(form, 'name_en') || str(form, 'name_bn');
  const nameBn = str(form, 'name_bn') || nameEn;
  const categoryId = str(form, 'category_id');
  const stock = num(form, 'stock') ?? 0;

  if (id && !isId(id)) fail('/admin/products', 'Invalid product.');
  if (!nameEn) fail(path, 'Please write the product name.');
  const { price, compare_at_price: compareAt } = readPrices(form, path);
  if (Number.isNaN(stock) || !Number.isInteger(stock)) fail(path, 'Stock must be a whole number.');
  if (categoryId && !isId(categoryId)) fail(path, 'Invalid category.');

  let variants: VariantInput[] = [];
  let images: string[] = [];
  try {
    variants = JSON.parse(str(form, 'variants') || '[]');
    images = JSON.parse(str(form, 'images') || '[]');
  } catch {
    fail(path, 'Invalid form data.');
  }
  if (!Array.isArray(variants) || !Array.isArray(images)) fail(path, 'Invalid form data.');
  if (images.some((url) => typeof url !== 'string' || !/^(https:\/\/|\/)/.test(url))) {
    fail(path, 'Invalid image.');
  }

  const cleanVariants = variants.map((variant) => ({
    id: typeof variant.id === 'string' && isId(variant.id) ? variant.id : undefined,
    size: orNull(String(variant.size ?? '').trim()),
    color: orNull(String(variant.color ?? '').trim()),
    stock: Number(variant.stock),
    price: variant.price === null || variant.price === undefined ? null : Number(variant.price),
  }));
  for (const variant of cleanVariants) {
    if (!variant.size && !variant.color) fail(path, 'Each variant needs a size or a colour.');
    if (!Number.isInteger(variant.stock) || variant.stock < 0) {
      fail(path, 'Variant stock must be a whole number.');
    }
    if (variant.price !== null && !(variant.price >= 0)) fail(path, 'Invalid variant price.');
  }
  const combos = cleanVariants.map((variant) => `${variant.size}|${variant.color}`);
  if (new Set(combos).size !== combos.length) fail(path, 'Two variants have the same size and colour.');

  const row = {
    name_en: nameEn,
    name_bn: nameBn,
    slug: await uniqueSlug(supabase, 'products', slugify(str(form, 'slug') || nameEn), id),
    description_en: orNull(str(form, 'description_en')),
    description_bn: orNull(str(form, 'description_bn')),
    category_id: orNull(categoryId),
    price,
    compare_at_price: compareAt,
    sku: orNull(str(form, 'sku')),
    stock,
    is_active: form.get('is_active') === 'on',
    is_featured: form.get('is_featured') === 'on',
  };

  let productId = id;
  if (id) {
    const { error } = await supabase.from('products').update(row).eq('id', id);
    if (error) fail(path, dbMessage(error));
  } else {
    const { data, error } = await supabase.from('products').insert(row).select('id').single();
    if (error || !data) fail(path, error ? dbMessage(error) : 'Could not save.');
    productId = data.id;
  }
  const editPath = `/admin/products/${productId}`;

  // Variants: delete the removed ones, update the kept ones, insert the new ones.
  const { data: existing } = await supabase
    .from('product_variants')
    .select('id')
    .eq('product_id', productId);
  const keptIds = cleanVariants.map((variant) => variant.id).filter(Boolean);
  const removed = (existing ?? []).map((v) => v.id).filter((vid) => !keptIds.includes(vid));
  if (removed.length > 0) {
    const { error } = await supabase.from('product_variants').delete().in('id', removed);
    if (error) fail(editPath, dbMessage(error));
  }
  for (const { id: variantId, ...values } of cleanVariants) {
    const { error } = variantId
      ? await supabase
          .from('product_variants')
          .update(values)
          .eq('id', variantId)
          .eq('product_id', productId)
      : await supabase.from('product_variants').insert({ ...values, product_id: productId });
    if (error) fail(editPath, dbMessage(error));
  }

  // Images: replace the list (first one is the main picture), then delete dropped files.
  const { data: oldImages } = await supabase
    .from('product_images')
    .select('url')
    .eq('product_id', productId);
  await supabase.from('product_images').delete().eq('product_id', productId);
  if (images.length > 0) {
    const { error } = await supabase.from('product_images').insert(
      images.map((url, index) => ({
        product_id: productId,
        url,
        alt: nameEn,
        sort_order: index,
        is_primary: index === 0,
      })),
    );
    if (error) fail(editPath, dbMessage(error));
  }
  await removeFiles(
    supabase,
    'product-images',
    (oldImages ?? []).map((image) => image.url).filter((url) => !images.includes(url)),
  );

  // A new product goes back to the list (ready to add the next one);
  // an edited product stays open.
  done(id ? editPath : '/admin/products');
}

/** Change price / discount straight from the product list. */
export async function quickPrice(form: FormData) {
  const supabase = await requireAdmin();
  const path = '/admin/products';
  const id = str(form, 'id');
  if (!isId(id)) fail(path, 'Invalid product.');
  const { error } = await supabase.from('products').update(readPrices(form, path)).eq('id', id);
  if (error) fail(path, dbMessage(error));
  done(path);
}

/** Show or hide a product on the site without deleting it. */
export async function toggleProduct(form: FormData) {
  const supabase = await requireAdmin();
  const path = '/admin/products';
  const id = str(form, 'id');
  if (!isId(id)) fail(path, 'Invalid product.');
  const { error } = await supabase
    .from('products')
    .update({ is_active: str(form, 'active') === '1' })
    .eq('id', id);
  if (error) fail(path, dbMessage(error));
  done(path);
}

export async function deleteProduct(form: FormData) {
  const supabase = await requireAdmin();
  const id = str(form, 'id');
  if (!isId(id)) fail('/admin/products', 'Invalid product.');

  const { data: images } = await supabase.from('product_images').select('url').eq('product_id', id);
  // Old orders keep their own copy of the name and price, so they stay correct.
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) fail('/admin/products', dbMessage(error));
  await removeFiles(supabase, 'product-images', (images ?? []).map((image) => image.url));
  done('/admin/products');
}

// ---------------------------------------------------------------------
// Stock quick update
// ---------------------------------------------------------------------

export async function updateStock(form: FormData) {
  const supabase = await requireAdmin();
  const back = str(form, 'back') === 'low' ? '/admin/stock?low=1' : '/admin/stock';
  const id = str(form, 'id');
  const stock = num(form, 'stock');
  if (!isId(id) || stock === null || !Number.isInteger(stock)) {
    fail(back, 'Stock must be a whole number.');
  }

  const table = str(form, 'kind') === 'variant' ? 'product_variants' : 'products';
  const { error } = await supabase.from(table).update({ stock }).eq('id', id);
  if (error) fail(back, dbMessage(error));
  done(back);
}

// ---------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------

export async function updateOrder(form: FormData) {
  const supabase = await requireAdmin();
  const id = str(form, 'id');
  if (!isId(id)) fail('/admin/orders', 'Invalid order.');
  const path = `/admin/orders/${id}`;

  const status = str(form, 'status') as OrderStatus;
  const paymentStatus = str(form, 'payment_status') as PaymentStatus;
  const changes: { status?: OrderStatus; payment_status?: PaymentStatus } = {};
  if (status) {
    if (!ORDER_STATUSES.includes(status)) fail(path, 'Invalid status.');
    changes.status = status;
  }
  if (paymentStatus) {
    if (!PAYMENT_STATUSES.includes(paymentStatus)) fail(path, 'Invalid payment status.');
    changes.payment_status = paymentStatus;
  }
  if (Object.keys(changes).length === 0) fail(path, 'Nothing to change.');

  // Cancelling returns the stock (database trigger handle_order_cancel).
  const { error } = await supabase.from('orders').update(changes).eq('id', id);
  if (error) fail(path, dbMessage(error));
  done(path);
}

// ---------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------

export async function saveCoupon(form: FormData) {
  const supabase = await requireAdmin();
  const path = '/admin/coupons';
  const id = str(form, 'id');
  const code = str(form, 'code').toUpperCase().replace(/\s+/g, '');
  const type = str(form, 'discount_type');
  const value = num(form, 'discount_value');
  const minOrder = num(form, 'min_order_amount') ?? 0;
  const maxDiscount = num(form, 'max_discount');
  const usageLimit = num(form, 'usage_limit');
  const expires = str(form, 'expires_at');

  if (id && !isId(id)) fail(path, 'Invalid coupon.');
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) fail(path, 'Code: 3–30 letters or digits, no spaces.');
  if (type !== 'percent' && type !== 'fixed') fail(path, 'Invalid discount type.');
  if (value === null || Number.isNaN(value) || value <= 0) fail(path, 'Discount must be above 0.');
  if (type === 'percent' && value > 100) fail(path, 'Percent discount cannot be above 100.');
  if ([minOrder, maxDiscount, usageLimit].some((n) => Number.isNaN(n))) fail(path, 'Invalid number.');
  if (usageLimit !== null && !Number.isInteger(usageLimit)) fail(path, 'Usage limit: whole number.');
  if (expires && Number.isNaN(Date.parse(expires))) fail(path, 'Invalid expiry date.');

  const row = {
    code,
    description: orNull(str(form, 'description')),
    discount_type: type,
    discount_value: value,
    min_order_amount: minOrder,
    max_discount: maxDiscount,
    usage_limit: usageLimit,
    // The coupon works until the end of the chosen day, Bangladesh time.
    expires_at: expires ? new Date(`${expires}T23:59:59+06:00`).toISOString() : null,
    is_active: form.get('is_active') === 'on',
  };

  const { error } = id
    ? await supabase.from('coupons').update(row).eq('id', id)
    : await supabase.from('coupons').insert(row);
  if (error) fail(path, dbMessage(error));
  done(path);
}

export async function deleteCoupon(form: FormData) {
  const supabase = await requireAdmin();
  const id = str(form, 'id');
  if (!isId(id)) fail('/admin/coupons', 'Invalid coupon.');
  const { error } = await supabase.from('coupons').delete().eq('id', id);
  if (error) fail('/admin/coupons', dbMessage(error));
  done('/admin/coupons');
}

// ---------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------

export async function saveBanner(form: FormData) {
  const supabase = await requireAdmin();
  const path = '/admin/banners';
  const id = str(form, 'id');
  const imageUrl = str(form, 'image_url');
  const link = str(form, 'link_url');
  const sortOrder = num(form, 'sort_order') ?? 0;

  if (id && !isId(id)) fail(path, 'Invalid banner.');
  if (!/^(https:\/\/|\/)/.test(imageUrl)) fail(path, 'Please upload a banner image.');
  // Only links inside this site, or full https links.
  if (link && !/^(\/(?!\/)|https:\/\/)/.test(link)) fail(path, 'Link must start with / or https://');
  if (Number.isNaN(sortOrder)) fail(path, 'Sort order must be a number.');

  const row = {
    title_en: orNull(str(form, 'title_en')),
    title_bn: orNull(str(form, 'title_bn')),
    subtitle_en: orNull(str(form, 'subtitle_en')),
    subtitle_bn: orNull(str(form, 'subtitle_bn')),
    image_url: imageUrl,
    link_url: orNull(link),
    sort_order: Math.round(sortOrder),
    is_active: form.get('is_active') === 'on',
  };

  if (id) {
    const { data: old } = await supabase.from('banners').select('image_url').eq('id', id).single();
    const { error } = await supabase.from('banners').update(row).eq('id', id);
    if (error) fail(path, dbMessage(error));
    if (old && old.image_url !== imageUrl) await removeFiles(supabase, 'banners', [old.image_url]);
  } else {
    const { error } = await supabase.from('banners').insert(row);
    if (error) fail(path, dbMessage(error));
  }
  done(path);
}

export async function toggleBanner(form: FormData) {
  const supabase = await requireAdmin();
  const id = str(form, 'id');
  if (!isId(id)) fail('/admin/banners', 'Invalid banner.');
  const { error } = await supabase
    .from('banners')
    .update({ is_active: str(form, 'active') === '1' })
    .eq('id', id);
  if (error) fail('/admin/banners', dbMessage(error));
  done('/admin/banners');
}

export async function deleteBanner(form: FormData) {
  const supabase = await requireAdmin();
  const id = str(form, 'id');
  if (!isId(id)) fail('/admin/banners', 'Invalid banner.');
  const { data: old } = await supabase.from('banners').select('image_url').eq('id', id).single();
  const { error } = await supabase.from('banners').delete().eq('id', id);
  if (error) fail('/admin/banners', dbMessage(error));
  if (old) await removeFiles(supabase, 'banners', [old.image_url]);
  done('/admin/banners');
}
