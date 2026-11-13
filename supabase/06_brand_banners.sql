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
