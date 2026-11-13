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
