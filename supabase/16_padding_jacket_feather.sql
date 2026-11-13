-- =====================================================================
-- Alpa Zone BD — product: Stylish Padding Jacket, Feather Print (Men's Clothing)
-- Price ৳1000, old price ৳1300. Run in Supabase → SQL Editor. Safe to re-run.
-- The picture lives in public/products/, so deploy the site as well.
-- Everything here can be edited later from Admin → Products.
-- =====================================================================

insert into public.products
  (category_id, name_en, name_bn, slug, description_en, description_bn,
   price, compare_at_price, sku, stock, is_featured)
select c.id,
  'Stylish Padding Jacket — Feather Print',
  'স্টাইলিশ প্যাডিং জ্যাকেট — ফেদার প্রিন্ট',
  'stylish-padding-jacket-feather',
  $en$A premium padding jacket with a stylish, modern design for winter.
Water-resistant fabric and comfortable padding make it suitable for everyday winter wear, sports and bike riding.

📌 Product details
Product type: Padding jacket
Outer fabric: Saskin
Inner fabric: Padding
Zipper: China zipper
Rib: Solid rib
Water resistant: Yes
Sizes: M, L, XL, 2XL

Size measurement:
M = Chest 40", Length 28"
L = Chest 42", Length 27"
XL = Chest 44", Length 30"
2XL = Chest 46", Length 31"$en$,
  $bn$শীতের জন্য স্টাইলিশ ও আধুনিক ডিজাইনের প্রিমিয়াম প্যাডিং জ্যাকেট।
ওয়াটার রেজিস্ট্যান্ট ফ্যাব্রিক ও আরামদায়ক প্যাডিংয়ে শীতের প্রতিদিনের ব্যবহার, স্পোর্টস ও বাইক রাইডিংয়ের জন্য উপযুক্ত।

📌 Product Details
প্রোডাক্ট টাইপ: প্যাডিং জ্যাকেট
বাহিরের কাপড়: সাসকিন (Saskin)
ভেতরের কাপড়: প্যাডিং
জিপার: চায়না জিপার
রিব: চেলি সলিড রিব
পানি প্রতিরোধী: হ্যাঁ
সাইজ: M, L, XL, 2XL

Size Measurement:
M = Chest 40", Length 28"
L = Chest 42", Length 27"
XL = Chest 44", Length 30"
2XL = Chest 46", Length 31"$bn$,
  1000.00, 1300.00, 'AZ-M-JK02', 0, true
from public.categories c
where c.slug = 'mens-clothing'
on conflict (slug) do nothing;

-- ---- Picture -----------------------------------------------------------
insert into public.product_images (product_id, url, alt, sort_order, is_primary)
select p.id, s.url, p.name_en, s.sort_order, s.is_primary
from (values
  ('/products/padding-jacket-feather.png', 0, true)
) as s (url, sort_order, is_primary)
join public.products p on p.slug = 'stylish-padding-jacket-feather'
where not exists (
  select 1 from public.product_images i where i.product_id = p.id and i.url = s.url
);

-- ---- Sizes -------------------------------------------------------------
-- STOCK IS A PLACEHOLDER (10 each). Change it to your real stock here,
-- or later from Admin → Products.
insert into public.product_variants (product_id, size, color, stock, price, sku)
select p.id, s.size, 'Dark Grey', s.stock, null::numeric, s.sku
from (values
  ('M',   10, 'AZ-M-JK02-M-GRY'),
  ('L',   10, 'AZ-M-JK02-L-GRY'),
  ('XL',  10, 'AZ-M-JK02-XL-GRY'),
  ('2XL', 10, 'AZ-M-JK02-2XL-GRY')
) as s (size, stock, sku)
join public.products p on p.slug = 'stylish-padding-jacket-feather'
on conflict (sku) do nothing;
