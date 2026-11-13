-- =====================================================================
-- Alpa Zone BD — product: Trendy Stylish Ladies Hoodie (Women's Clothing)
-- Price ৳650, old price ৳800. Run in Supabase → SQL Editor. Safe to re-run.
-- The picture lives in public/products/, so deploy the site as well.
-- Everything here can be edited later from Admin → Products.
-- =====================================================================

insert into public.products
  (category_id, name_en, name_bn, slug, description_en, description_bn,
   price, compare_at_price, sku, stock, is_featured)
select c.id,
  'Trendy Stylish Ladies Hoodie',
  'ট্রেন্ডি স্টাইলিশ লেডিস হুডি',
  'trendy-stylish-ladies-hoodie',
  $en$🔥 This stylish cat-design hoodie makes your look more attractive and trendy. 🔥
💥 A comfortable hoodie in premium fleece cotton fabric — perfect for winter fashion. 💥

📌 Product details:
✓ Hoodie: Full sleeve contrast hoodie.
✓ Fabric: 300 GSM cotton.
✓ Material: Fleece cotton, one side brushed.
✓ Design: Stylish and trendy cat design.
✓ Features: Comfortable, soft and warm for winter.
✓ Available sizes: M, L, XL

📏 Size measurement:
M = Chest 36", Length 26"
L = Chest 38", Length 27"
XL = Chest 40", Length 28"$en$,
  $bn$🔥স্টাইলিশ ক্যাট ডিজাইনের এই হুডিটি আপনার লুককে করবে আরও আকর্ষণীয় ও ট্রেন্ডি।🔥
💥প্রিমিয়াম ফ্লিস কটন ফেব্রিকের আরামদায়ক হুডিটি শীতের ফ্যাশনের জন্য পারফেক্ট।💥

📌 প্রোডাক্ট ডিটেইলসঃ
✓ হুডিঃ ফুল স্লিভ কনট্রাস্ট পিকাজু হুডি।
✓ ফেব্রিক্সঃ ৩০০ জিএসএম কটন কাপড়।
✓ মেটেরিয়ালঃ ফ্লিস কটন, ওয়ান সাইড ব্রাশ।
✓ ডিজাইনঃ স্টাইলিশ ও ট্রেন্ডি ক্যাট ডিজাইন।
✓ ফিচারঃ আরামদায়ক, নরম ও শীতের উপযোগী।
✓ এভাইলেবল সাইজঃ M, L, XL

📏Size Measurement:
M = Chest 36", Length 26"
L = Chest 38", Length 27"
XL = Chest 40", Length 28"$bn$,
  650.00, 800.00, 'AZ-W-HD01', 0, true
from public.categories c
where c.slug = 'womens-clothing'
on conflict (slug) do nothing;

-- ---- Picture -----------------------------------------------------------
insert into public.product_images (product_id, url, alt, sort_order, is_primary)
select p.id, '/products/ladies-cat-hoodie.png', p.name_en, 0, true
from public.products p
where p.slug = 'trendy-stylish-ladies-hoodie'
  and not exists (select 1 from public.product_images i where i.product_id = p.id);

-- ---- Sizes -------------------------------------------------------------
-- STOCK IS A PLACEHOLDER (10 each). Change it to your real stock here,
-- or later from Admin → Products.
insert into public.product_variants (product_id, size, color, stock, price, sku)
select p.id, s.size, 'White & Black', s.stock, null::numeric, s.sku
from (values
  ('M',  10, 'AZ-W-HD01-M'),
  ('L',  10, 'AZ-W-HD01-L'),
  ('XL', 10, 'AZ-W-HD01-XL')
) as s (size, stock, sku)
join public.products p on p.slug = 'trendy-stylish-ladies-hoodie'
on conflict (sku) do nothing;
