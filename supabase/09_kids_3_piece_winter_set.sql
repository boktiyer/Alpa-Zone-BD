-- =====================================================================
-- Alpa Zone BD — product: Premium Kids 3-Piece Winter Jacket+Hoodie Set (Baby's)
-- Price ৳750, old price ৳950. Run in Supabase → SQL Editor. Safe to re-run.
-- The picture lives in public/products/, so deploy the site as well.
-- Everything here can be edited later from Admin → Products.
-- =====================================================================

insert into public.products
  (category_id, name_en, name_bn, slug, description_en, description_bn,
   price, compare_at_price, sku, stock, is_featured)
select c.id,
  'Premium Kids 3-Piece Winter Jacket+Hoodie Set',
  'প্রিমিয়াম কিডস ৩-পিস উইন্টার জ্যাকেট+হুডি সেট',
  'premium-kids-3-piece-winter-set',
  $en$A premium quality 3-piece jacket set for your little one's winter style and comfort.

✨ What's in the set:
Stylish Sweatshirt
Zipper Hoodie with Cap
Matching Design Pant

⭐ Product details
Fabric: Premium One Side Brush Cotton
GSM: 300 per piece
Set: 3 Pieces
Quality: Super Soft & Comfortable
Design: Premium Matching Design

Age: 1 to 8 years

📏 Size chart (inch)
1-2Y: Length 14" | Chest 12" | Pant 16"
2-3Y: Length 15" | Chest 12.5" | Pant 18"
3-4Y: Length 16" | Chest 13" | Pant 20"
4-5Y: Length 17" | Chest 14" | Pant 22"
5-6Y: Length 18" | Chest 15" | Pant 24"
6-7Y: Length 19" | Chest 15.5" | Pant 26"
7-8Y: Length 20" | Chest 16" | Pant 28"$en$,
  $bn$আপনার সোনামণির শীতের স্টাইল ও আরামের জন্য
নিয়ে এলাম প্রিমিয়াম কোয়ালিটির ৩ পার্টের জ্যাকেট সেট।

✨ সেটে যা যা থাকছে:
Stylish Sweatshirt
Zipper Hoodie with Cap
Matching Design Pant

⭐ Product Details
Fabric: Premium One Side Brush Cotton
GSM: 300 প্রতি পার্ট
Set: 3 Pieces
Quality: Super Soft & Comfortable
Design: Premium Matching Design

Age: 1 থেকে 8 বছর

📏 Size Chart (Inch)
1-2Y: Length 14" | Chest 12" | Pant 16"
2-3Y: Length 15" | Chest 12.5" | Pant 18"
3-4Y: Length 16" | Chest 13" | Pant 20"
4-5Y: Length 17" | Chest 14" | Pant 22"
5-6Y: Length 18" | Chest 15" | Pant 24"
6-7Y: Length 19" | Chest 15.5" | Pant 26"
7-8Y: Length 20" | Chest 16" | Pant 28"$bn$,
  750.00, 950.00, 'AZ-B-WS01', 0, true
from public.categories c
where c.slug = 'babys'
on conflict (slug) do nothing;

-- ---- Pictures (the 3-piece overview first = the main picture) ----------
insert into public.product_images (product_id, url, alt, sort_order, is_primary)
select p.id, s.url, p.name_en, s.sort_order, s.is_primary
from (values
  ('/products/kids-3-piece-winter-set.png',   0, true),
  ('/products/kids-3-piece-winter-set-2.png', 1, false)
) as s (url, sort_order, is_primary)
join public.products p on p.slug = 'premium-kids-3-piece-winter-set'
where not exists (
  select 1 from public.product_images i where i.product_id = p.id and i.url = s.url
);

-- ---- Sizes -------------------------------------------------------------
-- STOCK IS A PLACEHOLDER (10 each). Change it to your real stock here,
-- or later from Admin → Products.
insert into public.product_variants (product_id, size, color, stock, price, sku)
select p.id, s.size, 'Red & Black', s.stock, null::numeric, s.sku
from (values
  ('1-2Y', 10, 'AZ-B-WS01-12'),
  ('2-3Y', 10, 'AZ-B-WS01-23'),
  ('3-4Y', 10, 'AZ-B-WS01-34'),
  ('4-5Y', 10, 'AZ-B-WS01-45'),
  ('5-6Y', 10, 'AZ-B-WS01-56'),
  ('6-7Y', 10, 'AZ-B-WS01-67'),
  ('7-8Y', 10, 'AZ-B-WS01-78')
) as s (size, stock, sku)
join public.products p on p.slug = 'premium-kids-3-piece-winter-set'
on conflict (sku) do nothing;
