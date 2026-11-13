-- =====================================================================
-- Alpa Zone BD — product: Polo Shirt For Men (Men's Clothing)
-- Price ৳450, old price ৳600. Run in Supabase → SQL Editor. Safe to re-run.
-- The pictures live in public/products/, so deploy the site as well.
-- Everything here can be edited later from Admin → Products.
-- =====================================================================

insert into public.products
  (category_id, name_en, name_bn, slug, description_en, description_bn,
   price, compare_at_price, sku, stock, is_featured)
select c.id,
  'Polo Shirt For Men',
  'ছেলেদের পোলো শার্ট',
  'polo-shirt-for-men',
  $en$- Main Material: Cotton
- Fabrics: Cotton
- Premium Quality
- Fabrication: 200 (±) GSM
- Sleeve: Half Sleeve
- 100% Export Fabric

Size: M, L, XL
M — Length 27", Chest 38"
L — Length 28", Chest 40"
XL — Length 29", Chest 42"$en$,
  $bn$- মূল ম্যাটেরিয়াল: কটন
- ফেব্রিক্স: কটন
- প্রিমিয়াম কোয়ালিটি
- ফেব্রিকেশন: ২০০ (±) GSM
- স্লিভ: হাফ স্লিভ
- ১০০% এক্সপোর্ট ফেব্রিক

সাইজ: M, L, XL
M — Length 27", Chest 38"
L — Length 28", Chest 40"
XL — Length 29", Chest 42"$bn$,
  450.00, 600.00, 'AZ-M-PL02', 0, true
from public.categories c
where c.slug = 'mens-clothing'
on conflict (slug) do nothing;

-- ---- Pictures (black first = the main picture) -------------------------
insert into public.product_images (product_id, url, alt, sort_order, is_primary)
select p.id, s.url, s.alt, s.sort_order, s.is_primary
from (values
  ('/products/mens-polo-black.png',  'Polo Shirt For Men — Black',  0, true),
  ('/products/mens-polo-maroon.png', 'Polo Shirt For Men — Maroon', 1, false)
) as s (url, alt, sort_order, is_primary)
join public.products p on p.slug = 'polo-shirt-for-men'
where not exists (
  select 1 from public.product_images i where i.product_id = p.id and i.url = s.url
);

-- ---- Sizes and colours -------------------------------------------------
-- STOCK IS A PLACEHOLDER (10 each). Change it to your real stock here,
-- or later from Admin → Products.
insert into public.product_variants (product_id, size, color, stock, price, sku)
select p.id, s.size, s.color, s.stock, null::numeric, s.sku
from (values
  ('M',  'Black',  10, 'AZ-M-PL02-M-BLK'),
  ('L',  'Black',  10, 'AZ-M-PL02-L-BLK'),
  ('XL', 'Black',  10, 'AZ-M-PL02-XL-BLK'),
  ('M',  'Maroon', 10, 'AZ-M-PL02-M-MRN'),
  ('L',  'Maroon', 10, 'AZ-M-PL02-L-MRN'),
  ('XL', 'Maroon', 10, 'AZ-M-PL02-XL-MRN')
) as s (size, color, stock, sku)
join public.products p on p.slug = 'polo-shirt-for-men'
on conflict (sku) do nothing;
