-- =====================================================================
-- Alpa Zone BD — OPTIONAL: rename the baby category slug "babys" → "kids"
-- The site already shows this category at /category/kids and redirects the
-- old /category/babys address, with or without this file. Running it only
-- makes the database match. Safe to re-run.
-- =====================================================================

update public.categories
set slug = 'kids'
where slug = 'babys'
  and not exists (select 1 from public.categories where slug = 'kids');

update public.banners
set link_url = '/category/kids'
where link_url = '/category/babys';
