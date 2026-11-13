-- =====================================================================
-- Alpa Zone BD — product: Premium Half Sleeve Polo Shirt (Men's Clothing)
-- Price ৳450, old price ৳600. Run in Supabase → SQL Editor. Safe to re-run.
-- The picture lives in public/products/, so deploy the site as well.
-- Everything here can be edited later from Admin → Products.
-- =====================================================================

insert into public.products
  (category_id, name_en, name_bn, slug, description_en, description_bn,
   price, compare_at_price, sku, stock, is_featured)
select c.id,
  'Premium Half Sleeve Polo Shirt',
  'প্রিমিয়াম হাফ স্লিভ পোলো শার্ট',
  'premium-half-sleeve-polo-shirt',
  $en$Fabric: PK Cotton
Fabrication: Knitting Dyeing Cotton and Striped
GSM: 210+ (±10)
Export Quality Sewing Striped Polo

Size: M, L, XL
M — Length 28", Chest 38"
L — Length 29", Chest 40"
XL — Length 30", Chest 42"$en$,
  $bn$ফেব্রিক: PK কটন
ফেব্রিকেশন: নিটিং ডাইং কটন ও স্ট্রাইপড
GSM: ২১০+ (±১০)
এক্সপোর্ট কোয়ালিটি সেলাইয়ের স্ট্রাইপড পোলো

সাইজ: M, L, XL
M — Length 28", Chest 38"
L — Length 29", Chest 40"
XL — Length 30", Chest 42"$bn$,
  450.00, 600.00, 'AZ-M-PL01', 0, true
from public.categories c
where c.slug = 'mens-clothing'
on conflict (slug) do nothing;

-- ---- Picture -----------------------------------------------------------
insert into public.product_images (product_id, url, alt, sort_order, is_primary)
select p.id, s.url, p.name_en, s.sort_order, s.is_primary
from (values
  ('/products/half-sleeve-polo-green.png',  0, true),
  ('/products/half-sleeve-polo-maroon.png', 1, false)
) as s (url, sort_order, is_primary)
join public.products p on p.slug = 'premium-half-sleeve-polo-shirt'
where not exists (
  select 1 from public.product_images i where i.product_id = p.id and i.url = s.url
);

-- ---- Sizes -------------------------------------------------------------
-- STOCK IS A PLACEHOLDER (10 each). Change it to your real stock here,
-- or later from Admin → Products.
insert into public.product_variants (product_id, size, color, stock, price, sku)
select p.id, s.size, s.color, s.stock, null::numeric, s.sku
from (values
  ('M',  'Green',  10, 'AZ-M-PL01-M-GRN'),
  ('L',  'Green',  10, 'AZ-M-PL01-L-GRN'),
  ('XL', 'Green',  10, 'AZ-M-PL01-XL-GRN'),
  ('M',  'Maroon', 10, 'AZ-M-PL01-M-MRN'),
  ('L',  'Maroon', 10, 'AZ-M-PL01-L-MRN'),
  ('XL', 'Maroon', 10, 'AZ-M-PL01-XL-MRN')
) as s (size, color, stock, sku)
join public.products p on p.slug = 'premium-half-sleeve-polo-shirt'
on conflict (sku) do nothing;
