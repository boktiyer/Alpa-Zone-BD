import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Banner, Category, ProductCardData, ProductDetail } from '@/types/database';

// All store data comes from the database — nothing is hardcoded.
// Row Level Security already hides inactive rows from customers.

const PRODUCT_CARD_SELECT = '*, product_images(url, alt, is_primary, sort_order)';

function logError(where: string, error: { message: string } | null) {
  if (error) console.error(`[supabase] ${where}: ${error.message}`);
}

export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
    .order('name_en');
  logError('getCategories', error);
  return (data as Category[] | null) ?? [];
});

export async function getBanners(): Promise<Banner[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  logError('getBanners', error);
  return (data as Banner[] | null) ?? [];
}

/**
 * A picture for each top-level category on the home page: the category's own
 * image if the admin set one, otherwise the main photo of one of its products
 * (sub-categories count). Categories with neither are left out.
 */
export async function getCategoryCovers(categories: Category[]): Promise<Map<string, string>> {
  const covers = new Map<string, string>();
  const topOf = new Map(categories.map((category) => [category.id, category.parent_id ?? category.id]));
  for (const category of categories) {
    if (!category.parent_id && category.image_url) covers.set(category.id, category.image_url);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('category_id, product_images(url, is_primary, sort_order)')
    .eq('is_active', true)
    .not('category_id', 'is', null)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .order('id')
    .limit(300);
  logError('getCategoryCovers', error);

  type Row = {
    category_id: string;
    product_images: { url: string; is_primary: boolean; sort_order: number }[];
  };
  for (const product of (data as Row[] | null) ?? []) {
    const top = topOf.get(product.category_id);
    if (!top || covers.has(top)) continue;
    const image = [...product.product_images].sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
    )[0];
    // Skip the placeholder drawings that came with the sample products.
    if (image && !image.url.startsWith('/seed/')) covers.set(top, image.url);
  }
  return covers;
}

export type ProductSort ='newest' | 'price_asc' | 'price_desc' | 'discount';

export const PRODUCT_SORTS: ProductSort[] = ['newest', 'price_asc', 'price_desc', 'discount'];
export const PAGE_SIZE = 12;

export interface ProductListParams {
  /** Search text (name or SKU). */
  q?: string;
  categoryIds?: string[];
  min?: number;
  max?: number;
  discountOnly?: boolean;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

/** Product list with search, filters, sorting and pagination. */
export async function listProducts(
  params: ProductListParams,
): Promise<{ products: ProductCardData[]; total: number }> {
  const pageSize = params.pageSize ?? PAGE_SIZE;
  const page = Math.max(1, params.page ?? 1);
  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select(PRODUCT_CARD_SELECT, { count: 'exact' })
    .eq('is_active', true);

  if (params.categoryIds) query = query.in('category_id', params.categoryIds);
  if (params.min !== undefined) query = query.gte('price', params.min);
  if (params.max !== undefined) query = query.lte('price', params.max);
  if (params.discountOnly) query = query.gt('discount_percent', 0);

  // Keep only letters, digits, spaces and dashes so the text is safe inside a filter.
  const term = params.q
    ?.replace(/[^\p{L}\p{M}\p{N}\s-]/gu, ' ')
    .trim()
    .slice(0, 60);
  if (term) {
    const like = `%${term.replace(/\s+/g, '%')}%`;
    query = query.or(`name_en.ilike.${like},name_bn.ilike.${like},sku.ilike.${like}`);
  }

  switch (params.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'discount':
      query = query.order('discount_percent', { ascending: false });
      break;
  }
  query = query.order('created_at', { ascending: false }).order('id');

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);

  // PGRST103 = the requested page is past the last one; that is just an empty page.
  if (error && error.code !== 'PGRST103') logError('listProducts', error);
  return { products: (data as ProductCardData[] | null) ?? [], total: count ?? 0 };
}

/** Ids of a category and every sub-category below it (any depth). */
export function categoryWithDescendants(categories: Category[], rootId: string): string[] {
  const ids = [rootId];
  for (let i = 0; i < ids.length; i++) {
    for (const category of categories) {
      if (category.parent_id === ids[i] && !ids.includes(category.id)) ids.push(category.id);
    }
  }
  return ids;
}

export const getProductBySlug = cache(async (slug: string): Promise<ProductDetail | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(*), product_variants(*), categories(id, name_en, name_bn, slug)')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  logError('getProductBySlug', error);
  return (data as ProductDetail | null) ?? null;
});

/** Main picture of a product: the primary one, otherwise the first by sort order. */
export function primaryImage<T extends { is_primary: boolean; sort_order: number }>(
  images: T[],
): T | undefined {
  return [...images].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  )[0];
}
