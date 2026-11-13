-- =====================================================================
-- Alpa Zone BD — product: Premium Cotton Drop Shoulder Tshirt, Gold Stripe Print
-- (Men's → T-Shirt). Price ৳500, old price ৳650.
-- Run in Supabase → SQL Editor. Safe to re-run.
-- The picture lives in public/products/, so deploy the site as well.
-- Everything here can be edited later from Admin → Products.
-- =====================================================================

insert into public.products
  (category_id, name_en, name_bn, slug, description_en, description_bn,
   price, compare_at_price, sku, stock, is_featured)
select c.id,
  'Premium Cotton Drop Shoulder Tshirt — Gold Stripe Print',
  'প্রিমিয়াম কটন ড্রপ শোল্ডার টি-শার্ট — গোল্ড স্ট্রাইপ প্রিন্ট',
  'premium-cotton-drop-shoulder-tshirt-gold-stripe',
  $en$DROP SHOULDER T-SHIRT
FABRIC 100% COTTON
PREMIUM QUALITY FABRIC
Print Type: DTF
GSM: 200–230

SIZE GUIDE (IN INCHES)
M — Chest 42" Length 27"
L — Chest 44" Length 28"
XL — Chest 46" Length 29"
XXL — Chest 48" Length 30"$en$,
  $bn$ড্রপ শোল্ডার টি-শার্ট
ফেব্রিক: ১০০% কটন
প্রিমিয়াম কোয়ালিটি ফেব্রিক
প্রিন্ট টাইপ: DTF
GSM: ২০০–২৩০

সাইজ গাইড (ইঞ্চি)
M — Chest 42" Length 27"
L — Chest 44" Length 28"
XL — Chest 46" Length 29"
XXL — Chest 48" Length 30"$bn$,
  500.00, 650.00, 'AZ-M-TS03', 0, true
from public.categories c
where c.slug = 'mens-t-shirt'
on conflict (slug) do nothing;

-- ---- Picture -----------------------------------------------------------
insert into public.product_images (product_id, url, alt, sort_order, is_primary)
select p.id, s.url, p.name_en, s.sort_order, s.is_primary
from (values
  ('/products/drop-shoulder-tshirt-gold-stripe.png', 0, true)
) as s (url, sort_order, is_primary)
join public.products p on p.slug = 'premium-cotton-drop-shoulder-tshirt-gold-stripe'
where not exists (
  select 1 from public.product_images i where i.product_id = p.id and i.url = s.url
);

-- ---- Sizes -------------------------------------------------------------
-- STOCK IS A PLACEHOLDER (10 each). Change it to your real stock here,
-- or later from Admin → Products.
insert into public.product_variants (product_id, size, color, stock, price, sku)
select p.id, s.size, 'Black', s.stock, null::numeric, s.sku
from (values
  ('M',   10, 'AZ-M-TS03-M-BLK'),
  ('L',   10, 'AZ-M-TS03-L-BLK'),
  ('XL',  10, 'AZ-M-TS03-XL-BLK'),
  ('XXL', 10, 'AZ-M-TS03-XXL-BLK')
) as s (size, stock, sku)
join public.products p on p.slug = 'premium-cotton-drop-shoulder-tshirt-gold-stripe'
on conflict (sku) do nothing;
