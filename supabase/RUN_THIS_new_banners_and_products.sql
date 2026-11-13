-- =====================================================================
-- Alpa Zone BD - ALL NEW BANNERS AND PRODUCTS IN ONE FILE
-- This is files 06 to 16 joined together. Paste the whole file into
-- Supabase -> SQL Editor and press Run. Safe to run again.
-- =====================================================================

-- =====================================================================
-- Alpa Zone BD — the 3 brand banners (men's, women's, baby)
-- Run in Supabase → SQL Editor. Safe to re-run.
-- The pictures live in public/banners/, so deploy the site as well.
-- No title/subtitle on purpose: the text is already part of each picture.
-- =====================================================================

insert into public.banners (image_url, link_url, sort_order)
select s.image_url, s.link_url, s.sort_order
from (values
  ('/banners/mens-fashion.png', '/category/mens-clothing',   1),
  ('/banners/womens-items.png', '/category/womens-clothing', 2),
  ('/banners/baby-items.png',   '/category/babys',           3)
) as s (image_url, link_url, sort_order)
where not exists (
  select 1 from public.banners b where b.image_url = s.image_url
);

-- Hide the two sample banners from 02_seed.sql (not deleted — you can turn
-- them back on from Admin → Banners).
update public.banners
set is_active = false
where image_url in ('/seed/banner-1.svg', '/seed/banner-2.svg');


-- =====================================================================
-- Alpa Zone BD — product: Stylish Design Winter Hoodie (Men's Clothing)
-- Price ৳650, old price ৳750. Run in Supabase → SQL Editor. Safe to re-run.
-- The pictures live in public/products/, so deploy the site as well.
-- Everything here can be edited later from Admin → Products.
-- =====================================================================

insert into public.products
  (category_id, name_en, name_bn, slug, description_en, description_bn,
   price, compare_at_price, sku, stock, is_featured)
select c.id,
  'Stylish Design Winter Hoodie',
  'স্টাইলিশ ডিজাইন উইন্টার হুডি',
  'stylish-design-winter-hoodie',
  $en$Stylish hoodie made from premium 300 GSM heavyweight fabric.
Eye-catching DTF design and a comfortable fit — perfect for winter.

📌 Product details:
🧵 Fabric: Premium Philips cotton
⚖️ GSM: 300 GSM (heavyweight)
🎨 Design: Premium DTF print
👕 Fit: Regular fit
🧥 Neck type: Hooded neck
✋ Sleeve: Full sleeve
❄️ Comfort: Soft, warm and breathable
✨ Quality: Premium finishing and strong stitching
🌡️ Best for: Winter and cold weather
📏 Sizes: M, L, XL, XXL

Size measurement:
M = Chest: 39" | Length: 27"
L = Chest: 41" | Length: 28"
XL = Chest: 43" | Length: 29"
XXL = Chest: 45" | Length: 30"$en$,
  $bn$প্রিমিয়াম কোয়ালিটির ৩০০ GSM হেভিওয়েট ফেব্রিক্সের স্টাইলিশ হুডি।
আকর্ষণীয় DTF ডিজাইন ও কমফোর্টেবল ফিটিংয়ে শীতের জন্য পারফেক্ট।

📌 প্রোডাক্ট ডিটেইলসঃ
🧵 ফেব্রিক্স: প্রিমিয়াম ফিলিপস কটন
⚖️ GSM: ৩০০ GSM (হেভিওয়েট)
🎨 ডিজাইন: প্রিমিয়াম DTF প্রিন্ট
👕 ফিটিং: রেগুলার ফিট
🧥 নেক টাইপ: হুডেড নেক
✋ স্লিভ: ফুল স্লিভ
❄️ কমফোর্ট: সফট, উষ্ণ ও ব্রিদেবল
✨ কোয়ালিটি: প্রিমিয়াম ফিনিশিং ও মজবুত স্টিচিং
🌡️ উপযোগী: শীতকাল ও ঠান্ডা আবহাওয়া
📏 সাইজ: M, L, XL, XXL

Size Measurement:
M = Chest: 39" | Length: 27"
L = Chest: 41" | Length: 28"
XL = Chest: 43" | Length: 29"
XXL = Chest: 45" | Length: 30"$bn$,
  650.00, 750.00, 'AZ-M-HD01', 0, true
from public.categories c
where c.slug = 'mens-clothing'
on conflict (slug) do nothing;

-- ---- Pictures (olive first = the main picture) ------------------------
insert into public.product_images (product_id, url, alt, sort_order, is_primary)
select p.id, s.url, s.alt, s.sort_order, s.is_primary
from (values
  ('/products/winter-hoodie-olive.png', 'Stylish Design Winter Hoodie — Olive', 0, true),
  ('/products/winter-hoodie-white.png', 'Stylish Design Winter Hoodie — White', 1, false)
) as s (url, alt, sort_order, is_primary)
join public.products p on p.slug = 'stylish-design-winter-hoodie'
where not exists (
  select 1 from public.product_images i where i.product_id = p.id and i.url = s.url
);

-- ---- Sizes and colours -------------------------------------------------
-- STOCK IS A PLACEHOLDER (10 each). Change it to your real stock here,
-- or later from Admin → Products.
insert into public.product_variants (product_id, size, color, stock, price, sku)
select p.id, s.size, s.color, s.stock, null::numeric, s.sku
from (values
  ('M',   'Olive', 10, 'AZ-M-HD01-M-OLV'),
  ('L',   'Olive', 10, 'AZ-M-HD01-L-OLV'),
  ('XL',  'Olive', 10, 'AZ-M-HD01-XL-OLV'),
  ('XXL', 'Olive', 10, 'AZ-M-HD01-XXL-OLV'),
  ('M',   'White', 10, 'AZ-M-HD01-M-WHT'),
  ('L',   'White', 10, 'AZ-M-HD01-L-WHT'),
  ('XL',  'White', 10, 'AZ-M-HD01-XL-WHT'),
  ('XXL', 'White', 10, 'AZ-M-HD01-XXL-WHT')
) as s (size, color, stock, sku)
join public.products p on p.slug = 'stylish-design-winter-hoodie'
on conflict (sku) do nothing;


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


-- =====================================================================
-- Alpa Zone BD — product: Premium Cotton Drop Shoulder Tshirt (Men's → T-Shirt)
-- Price ৳500, old price ৳650. Run in Supabase → SQL Editor. Safe to re-run.
-- The picture lives in public/products/, so deploy the site as well.
-- Everything here can be edited later from Admin → Products.
-- =====================================================================

insert into public.products
  (category_id, name_en, name_bn, slug, description_en, description_bn,
   price, compare_at_price, sku, stock, is_featured)
select c.id,
  'Premium Cotton Drop Shoulder Tshirt',
  'প্রিমিয়াম কটন ড্রপ শোল্ডার টি-শার্ট',
  'premium-cotton-drop-shoulder-tshirt',
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
  500.00, 650.00, 'AZ-M-TS01', 0, true
from public.categories c
where c.slug = 'mens-t-shirt'
on conflict (slug) do nothing;

-- ---- Picture -----------------------------------------------------------
insert into public.product_images (product_id, url, alt, sort_order, is_primary)
select p.id, s.url, p.name_en, s.sort_order, s.is_primary
from (values
  ('/products/drop-shoulder-tshirt-black.png', 0, true)
) as s (url, sort_order, is_primary)
join public.products p on p.slug = 'premium-cotton-drop-shoulder-tshirt'
where not exists (
  select 1 from public.product_images i where i.product_id = p.id and i.url = s.url
);

-- ---- Sizes -------------------------------------------------------------
-- STOCK IS A PLACEHOLDER (10 each). Change it to your real stock here,
-- or later from Admin → Products.
insert into public.product_variants (product_id, size, color, stock, price, sku)
select p.id, s.size, 'Black', s.stock, null::numeric, s.sku
from (values
  ('M',   10, 'AZ-M-TS01-M-BLK'),
  ('L',   10, 'AZ-M-TS01-L-BLK'),
  ('XL',  10, 'AZ-M-TS01-XL-BLK'),
  ('XXL', 10, 'AZ-M-TS01-XXL-BLK')
) as s (size, stock, sku)
join public.products p on p.slug = 'premium-cotton-drop-shoulder-tshirt'
on conflict (sku) do nothing;


-- =====================================================================
-- Alpa Zone BD — product: Premium Cotton Drop Shoulder Tshirt, Racing Print
-- (Men's → T-Shirt). Price ৳500, old price ৳650.
-- Run in Supabase → SQL Editor. Safe to re-run.
-- The picture lives in public/products/, so deploy the site as well.
-- Everything here can be edited later from Admin → Products.
-- =====================================================================

insert into public.products
  (category_id, name_en, name_bn, slug, description_en, description_bn,
   price, compare_at_price, sku, stock, is_featured)
select c.id,
  'Premium Cotton Drop Shoulder Tshirt — Racing Print',
  'প্রিমিয়াম কটন ড্রপ শোল্ডার টি-শার্ট — রেসিং প্রিন্ট',
  'premium-cotton-drop-shoulder-tshirt-racing',
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
  500.00, 650.00, 'AZ-M-TS02', 0, true
from public.categories c
where c.slug = 'mens-t-shirt'
on conflict (slug) do nothing;

-- ---- Picture -----------------------------------------------------------
insert into public.product_images (product_id, url, alt, sort_order, is_primary)
select p.id, s.url, p.name_en, s.sort_order, s.is_primary
from (values
  ('/products/drop-shoulder-tshirt-racing.png', 0, true)
) as s (url, sort_order, is_primary)
join public.products p on p.slug = 'premium-cotton-drop-shoulder-tshirt-racing'
where not exists (
  select 1 from public.product_images i where i.product_id = p.id and i.url = s.url
);

-- ---- Sizes -------------------------------------------------------------
-- STOCK IS A PLACEHOLDER (10 each). Change it to your real stock here,
-- or later from Admin → Products.
insert into public.product_variants (product_id, size, color, stock, price, sku)
select p.id, s.size, 'Black', s.stock, null::numeric, s.sku
from (values
  ('M',   10, 'AZ-M-TS02-M-BLK'),
  ('L',   10, 'AZ-M-TS02-L-BLK'),
  ('XL',  10, 'AZ-M-TS02-XL-BLK'),
  ('XXL', 10, 'AZ-M-TS02-XXL-BLK')
) as s (size, stock, sku)
join public.products p on p.slug = 'premium-cotton-drop-shoulder-tshirt-racing'
on conflict (sku) do nothing;


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


-- =====================================================================
-- Alpa Zone BD — product: Stylish Padding Jacket (Men's Clothing)
-- Price ৳1000, old price ৳1300. Run in Supabase → SQL Editor. Safe to re-run.
-- The picture lives in public/products/, so deploy the site as well.
-- Everything here can be edited later from Admin → Products.
-- =====================================================================

insert into public.products
  (category_id, name_en, name_bn, slug, description_en, description_bn,
   price, compare_at_price, sku, stock, is_featured)
select c.id,
  'Stylish Padding Jacket',
  'স্টাইলিশ প্যাডিং জ্যাকেট',
  'stylish-padding-jacket',
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
  1000.00, 1300.00, 'AZ-M-JK01', 0, true
from public.categories c
where c.slug = 'mens-clothing'
on conflict (slug) do nothing;

-- ---- Picture -----------------------------------------------------------
insert into public.product_images (product_id, url, alt, sort_order, is_primary)
select p.id, s.url, p.name_en, s.sort_order, s.is_primary
from (values
  ('/products/padding-jacket-black.png', 0, true)
) as s (url, sort_order, is_primary)
join public.products p on p.slug = 'stylish-padding-jacket'
where not exists (
  select 1 from public.product_images i where i.product_id = p.id and i.url = s.url
);

-- ---- Sizes -------------------------------------------------------------
-- STOCK IS A PLACEHOLDER (10 each). Change it to your real stock here,
-- or later from Admin → Products.
insert into public.product_variants (product_id, size, color, stock, price, sku)
select p.id, s.size, 'Black', s.stock, null::numeric, s.sku
from (values
  ('M',   10, 'AZ-M-JK01-M-BLK'),
  ('L',   10, 'AZ-M-JK01-L-BLK'),
  ('XL',  10, 'AZ-M-JK01-XL-BLK'),
  ('2XL', 10, 'AZ-M-JK01-2XL-BLK')
) as s (size, stock, sku)
join public.products p on p.slug = 'stylish-padding-jacket'
on conflict (sku) do nothing;


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


