// Public address of a category page.
//
// The baby category is stored in the database with the slug "babys", but its
// address on the site is /category/kids. This works whether or not the slug
// has been renamed in the database (supabase/17_rename_babys_to_kids.sql):
// both "babys" and "kids" rows are shown at /category/kids, and the old
// /category/babys address redirects there (next.config.ts).

/** database slug → slug shown in the address bar */
const PUBLIC_SLUG: Record<string, string> = {
  babys: 'kids',
};

export function categoryPath(slug: string): string {
  return `/category/${PUBLIC_SLUG[slug] ?? slug}`;
}

/** Database slugs that an address-bar slug may stand for. */
export function categorySlugCandidates(urlSlug: string): string[] {
  const stored = Object.keys(PUBLIC_SLUG).filter((slug) => PUBLIC_SLUG[slug] === urlSlug);
  return [urlSlug, ...stored];
}
