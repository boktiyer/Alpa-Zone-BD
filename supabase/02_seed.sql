-- =====================================================================
-- Alpa Zone BD — seed data
-- Run AFTER 01_schema.sql. Safe to re-run (existing rows are left alone).
-- Everything here is ordinary data: edit or delete it later from the admin panel.
-- =====================================================================

-- ---- Top-level categories -------------------------------------------
insert into public.categories (name_en, name_bn, slug, sort_order) values
  ('Women''s Clothing',          'মেয়েদের পোশাক',          'womens-clothing',     1),
  ('Men''s Clothing',            'ছেলেদের পোশাক',          'mens-clothing',       2),
  ('Baby''s',                    'শিশুদের পোশাক',          'babys',               3),
  ('Other Fashion Accessories',  'অন্যান্য ফ্যাশন এক্সেসরিজ', 'fashion-accessories', 4)
on conflict (slug) do nothing;

-- ---- Sample sub-categories (shows how parent_id works) ---------------
insert into public.categories (parent_id, name_en, name_bn, slug, sort_order)
select p.id, s.name_en, s.name_bn, s.slug, s.sort_order
from (values
  ('womens-clothing', 'Three Piece', 'থ্রি পিস',  'womens-three-piece', 1),
  ('womens-clothing', 'Saree',       'শাড়ি',      'womens-saree',       2),
  ('mens-clothing',   'Panjabi',     'পাঞ্জাবি',   'mens-panjabi',       1),
  ('mens-clothing',   'T-Shirt',     'টি-শার্ট',   'mens-t-shirt',       2)
) as s (parent_slug, name_en, name_bn, slug, sort_order)
join public.categories p on p.slug = s.parent_slug
on conflict (slug) do nothing;

-- ---- 3 sample products ----------------------------------------------
insert into public.products
  (category_id, name_en, name_bn, slug, description_en, description_bn,
   price, compare_at_price, sku, stock, is_featured)
select c.id, s.name_en, s.name_bn, s.slug, s.description_en, s.description_bn,
       s.price, s.compare_at_price, s.sku, s.stock, true
from (values
  ('womens-three-piece',
   'Cotton Printed Three Piece', 'কটন প্রিন্টেড থ্রি পিস', 'cotton-printed-three-piece',
   'Soft cotton three piece with printed kameez, salwar and dupatta. Comfortable for everyday wear.',
   'নরম সুতি কাপড়ের প্রিন্টেড কামিজ, সালোয়ার ও ওড়না। প্রতিদিন পরার জন্য আরামদায়ক।',
   1450.00, 1850.00, 'AZ-W-001', 0),
  ('mens-panjabi',
   'Premium Cotton Panjabi', 'প্রিমিয়াম কটন পাঞ্জাবি', 'premium-cotton-panjabi',
   'Regular fit cotton panjabi with a clean embroidered placket. Ideal for Eid, Jummah and family events.',
   'রেগুলার ফিট সুতি পাঞ্জাবি, বুকে হালকা এমব্রয়ডারি। ঈদ, জুমা ও পারিবারিক অনুষ্ঠানের জন্য উপযুক্ত।',
   1250.00, 1600.00, 'AZ-M-001', 0),
  ('babys',
   'Baby Cotton Romper Set', 'বেবি কটন রম্পার সেট', 'baby-cotton-romper-set',
   'Breathable 100% cotton romper set that is gentle on baby skin. Easy snap buttons.',
   'শিশুর ত্বকের জন্য আরামদায়ক ১০০% সুতির রম্পার সেট। সহজে খোলা-পরার স্ন্যাপ বাটন।',
   650.00, 850.00, 'AZ-B-001', 0)
) as s (category_slug, name_en, name_bn, slug, description_en, description_bn,
        price, compare_at_price, sku, stock)
join public.categories c on c.slug = s.category_slug
on conflict (slug) do nothing;

-- ---- Product images (placeholder pictures from /public/seed) ---------
insert into public.product_images (product_id, url, alt, sort_order, is_primary)
select p.id, s.url, p.name_en, 0, true
from (values
  ('cotton-printed-three-piece', '/seed/product-1.svg'),
  ('premium-cotton-panjabi',     '/seed/product-2.svg'),
  ('baby-cotton-romper-set',     '/seed/product-3.svg')
) as s (product_slug, url)
join public.products p on p.slug = s.product_slug
where not exists (select 1 from public.product_images i where i.product_id = p.id);

-- ---- Variants (size, color, stock, price) ----------------------------
-- price = null means "same as the product price".
insert into public.product_variants (product_id, size, color, stock, price, sku)
select p.id, s.size, s.color, s.stock, s.price, s.sku
from (values
  ('cotton-printed-three-piece', 'M',      'Blue',  10, null::numeric, 'AZ-W-001-M-BLU'),
  ('cotton-printed-three-piece', 'L',      'Blue',   8, null,          'AZ-W-001-L-BLU'),
  ('cotton-printed-three-piece', 'M',      'Pink',   6, null,          'AZ-W-001-M-PNK'),
  ('cotton-printed-three-piece', 'XL',     'Pink',   4, 1550.00,       'AZ-W-001-XL-PNK'),
  ('premium-cotton-panjabi',     '40',     'White', 12, null,          'AZ-M-001-40-WHT'),
  ('premium-cotton-panjabi',     '42',     'White', 10, null,          'AZ-M-001-42-WHT'),
  ('premium-cotton-panjabi',     '42',     'Black',  7, null,          'AZ-M-001-42-BLK'),
  ('premium-cotton-panjabi',     '44',     'Black',  5, 1350.00,       'AZ-M-001-44-BLK'),
  ('baby-cotton-romper-set',     '0-6 M',  'Sky',   15, null,          'AZ-B-001-06-SKY'),
  ('baby-cotton-romper-set',     '6-12 M', 'Sky',   12, null,          'AZ-B-001-612-SKY'),
  ('baby-cotton-romper-set',     '6-12 M', 'Yellow', 9, null,          'AZ-B-001-612-YLW')
) as s (product_slug, size, color, stock, price, sku)
join public.products p on p.slug = s.product_slug
on conflict (sku) do nothing;

-- ---- 2 banners -------------------------------------------------------
insert into public.banners
  (title_en, title_bn, subtitle_en, subtitle_bn, image_url, link_url, sort_order)
select s.*
from (values
  ('New Collection Is Here', 'নতুন কালেকশন এসে গেছে',
   'Fresh styles for the whole family, delivered all over Bangladesh.',
   'পুরো পরিবারের জন্য নতুন ডিজাইন, সারা বাংলাদেশে ডেলিভারি।',
   '/seed/banner-1.svg', '/category/womens-clothing', 1),
  ('Cash on Delivery Available', 'ক্যাশ অন ডেলিভারি সুবিধা',
   'Delivery charge ৳60 inside Dhaka, ৳120 outside Dhaka.',
   'ঢাকার ভিতরে ডেলিভারি চার্জ ৬০ টাকা, ঢাকার বাইরে ১২০ টাকা।',
   '/seed/banner-2.svg', '/category/mens-clothing', 2)
) as s (title_en, title_bn, subtitle_en, subtitle_bn, image_url, link_url, sort_order)
where not exists (select 1 from public.banners);

-- ---- 1 sample coupon (10% off, max ৳200, orders of ৳1000+) -----------
insert into public.coupons (code, description, discount_type, discount_value, min_order_amount, max_discount)
values ('WELCOME10', '10% off the first order', 'percent', 10, 1000, 200)
on conflict (code) do nothing;
