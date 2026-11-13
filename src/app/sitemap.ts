import { categoryPath } from '@/lib/category-url';
import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

// /sitemap.xml — built from the database, so new products appear automatically.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const [categories, products] = await Promise.all([
    supabase.from('categories').select('slug, updated_at').eq('is_active', true),
    supabase.from('products').select('slug, updated_at').eq('is_active', true),
  ]);

  type Row = { slug: string; updated_at: string };
  return [
    { url: siteUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/products`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/track-order`, changeFrequency: 'yearly', priority: 0.3 },
    ...((categories.data as Row[] | null) ?? []).map((row) => ({
      url: `${siteUrl}${categoryPath(row.slug)}`,
      lastModified: row.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...((products.data as Row[] | null) ?? []).map((row) => ({
      url: `${siteUrl}/products/${row.slug}`,
      lastModified: row.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
