-- =====================================================================
-- Alpa Zone BD — full database schema
-- Supabase Dashboard → SQL Editor → New query → paste this whole file → Run
-- Safe to re-run: it never drops tables or data.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. ENUM TYPES
-- ---------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('customer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum
    ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.delivery_area as enum ('dhaka', 'outside');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('bkash', 'nagad', 'cod');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('unpaid', 'pending', 'paid', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.discount_type as enum ('percent', 'fixed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 2. TABLES
-- ---------------------------------------------------------------------

-- One row per auth user. Created automatically by a trigger on signup.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  phone       text,
  address     text,
  district    text,
  role        public.user_role not null default 'customer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- parent_id = null → top-level category; otherwise a sub-category (any depth).
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references public.categories (id) on delete set null,
  name_en     text not null,
  name_bn     text not null,
  slug        text not null unique,
  image_url   text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint categories_not_own_parent check (parent_id is null or parent_id <> id)
);

create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  category_id       uuid references public.categories (id) on delete set null,
  name_en           text not null,
  name_bn           text not null,
  slug              text not null unique,
  description_en    text,
  description_bn    text,
  price             numeric(10,2) not null check (price >= 0),
  compare_at_price  numeric(10,2) check (compare_at_price is null or compare_at_price >= 0),
  sku               text unique,
  -- Used only when the product has no variants.
  stock             integer not null default 0 check (stock >= 0),
  is_active         boolean not null default true,
  is_featured       boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  url         text not null,
  alt         text,
  sort_order  integer not null default 0,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  size        text,
  color       text,
  stock       integer not null default 0 check (stock >= 0),
  -- null → use products.price
  price       numeric(10,2) check (price is null or price >= 0),
  sku         text unique,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  constraint product_variants_unique_combo unique nulls not distinct (product_id, size, color)
);

create table if not exists public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  variant_id  uuid references public.product_variants (id) on delete cascade,
  quantity    integer not null default 1 check (quantity > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint cart_items_unique_line unique nulls not distinct (user_id, product_id, variant_id)
);

create table if not exists public.wishlist (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint wishlist_unique_line unique (user_id, product_id)
);

create table if not exists public.coupons (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique check (code = upper(code)),
  description       text,
  discount_type     public.discount_type not null default 'percent',
  discount_value    numeric(10,2) not null check (discount_value > 0),
  min_order_amount  numeric(10,2) not null default 0,
  max_discount      numeric(10,2),
  usage_limit       integer,
  used_count        integer not null default 0,
  starts_at         timestamptz,
  expires_at        timestamptz,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  constraint coupons_percent_range check (discount_type <> 'percent' or discount_value <= 100)
);

create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique default ('AZ-' || nextval('public.order_number_seq')),
  user_id          uuid references auth.users (id) on delete set null,
  status           public.order_status not null default 'pending',

  customer_name    text not null,
  phone            text not null,
  address          text not null,
  district         text,
  note             text,

  delivery_area    public.delivery_area not null,
  delivery_charge  numeric(10,2) not null,

  subtotal         numeric(12,2) not null default 0 check (subtotal >= 0),
  discount         numeric(12,2) not null default 0 check (discount >= 0),
  total            numeric(12,2) not null default 0 check (total >= 0),
  coupon_id        uuid references public.coupons (id) on delete set null,
  coupon_code      text,

  payment_method   public.payment_method not null,
  transaction_id   text,
  payment_status   public.payment_status not null default 'unpaid',

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- Dhaka = 60, outside Dhaka = 120
  constraint orders_delivery_charge_matches_area check (
    (delivery_area = 'dhaka'   and delivery_charge = 60) or
    (delivery_area = 'outside' and delivery_charge = 120)
  ),
  -- bKash / Nagad orders must carry the customer's transaction id
  constraint orders_transaction_id_required check (
    payment_method = 'cod' or (transaction_id is not null and length(trim(transaction_id)) > 0)
  )
);

-- Name and price are copied here so old orders stay correct
-- even if the product is edited or deleted later.
create table if not exists public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  product_id     uuid references public.products (id) on delete set null,
  variant_id     uuid references public.product_variants (id) on delete set null,
  product_name   text not null,
  variant_label  text,
  image_url      text,
  unit_price     numeric(10,2) not null check (unit_price >= 0),
  quantity       integer not null check (quantity > 0),
  line_total     numeric(12,2) not null check (line_total >= 0),
  created_at     timestamptz not null default now()
);

create table if not exists public.banners (
  id           uuid primary key default gen_random_uuid(),
  title_en     text,
  title_bn     text,
  subtitle_en  text,
  subtitle_bn  text,
  image_url    text not null,
  link_url     text,
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  starts_at    timestamptz,
  ends_at      timestamptz,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. INDEXES
-- ---------------------------------------------------------------------
create index if not exists categories_parent_id_idx        on public.categories (parent_id);
create index if not exists products_category_id_idx        on public.products (category_id);
create index if not exists products_active_featured_idx    on public.products (is_active, is_featured);
create index if not exists products_created_at_idx         on public.products (created_at desc);
create index if not exists product_images_product_id_idx   on public.product_images (product_id);
create index if not exists product_variants_product_id_idx on public.product_variants (product_id);
create index if not exists cart_items_user_id_idx          on public.cart_items (user_id);
create index if not exists wishlist_user_id_idx            on public.wishlist (user_id);
create index if not exists orders_user_id_idx              on public.orders (user_id);
create index if not exists orders_status_idx               on public.orders (status);
create index if not exists orders_created_at_idx           on public.orders (created_at desc);
create index if not exists order_items_order_id_idx        on public.order_items (order_id);

-- ---------------------------------------------------------------------
-- 4. HELPER FUNCTIONS + TRIGGERS
-- ---------------------------------------------------------------------

-- True when the logged-in user is an admin. SECURITY DEFINER so it can read
-- profiles without recursing into the RLS policies that call it.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.categories;
create trigger set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.products;
create trigger set_updated_at before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.cart_items;
create trigger set_updated_at before update on public.cart_items
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.orders;
create trigger set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- Create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profiles for users who signed up before this file was run.
insert into public.profiles (id, email, full_name, phone)
select u.id, u.email, u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'phone'
from auth.users u
on conflict (id) do nothing;

-- A customer may edit their own profile but can never change their own
-- role or email. Admins, and the SQL editor (no auth.uid()), still can.
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    new.role  := old.role;
    new.email := old.email;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_fields on public.profiles;
create trigger protect_profile_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- Delivery charge: Dhaka 60, outside Dhaka 120.
create or replace function public.delivery_charge_for(p_area public.delivery_area)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case p_area when 'dhaka' then 60 else 120 end::numeric;
$$;

-- Discount a coupon gives on a subtotal. Raises an error if it is not usable.
-- Customers cannot read the coupons table directly; they go through this.
create or replace function public.coupon_discount(p_code text, p_subtotal numeric)
returns numeric
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  c public.coupons%rowtype;
  d numeric;
begin
  select * into c
  from public.coupons
  where code = upper(trim(p_code))
    and is_active
    and (starts_at  is null or starts_at  <= now())
    and (expires_at is null or expires_at >  now())
    and (usage_limit is null or used_count < usage_limit);

  if not found then
    raise exception 'invalid_coupon';
  end if;

  if p_subtotal < c.min_order_amount then
    raise exception 'coupon_min_order_not_met';
  end if;

  if c.discount_type = 'percent' then
    d := round(p_subtotal * c.discount_value / 100, 2);
  else
    d := c.discount_value;
  end if;

  if c.max_discount is not null then
    d := least(d, c.max_discount);
  end if;

  return least(d, p_subtotal);
end;
$$;

-- Turns the logged-in customer's cart into an order, in one transaction.
-- Prices, delivery charge and discount are all calculated here from the
-- database, so the browser can never send a fake total. Stock is reduced,
-- and the whole order is rolled back if anything is out of stock.
create or replace function public.place_order(
  p_customer_name   text,
  p_phone           text,
  p_address         text,
  p_district        text,
  p_delivery_area   public.delivery_area,
  p_payment_method  public.payment_method,
  p_transaction_id  text default null,
  p_coupon_code     text default null,
  p_note            text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user       uuid := (select auth.uid());
  v_order_id   uuid;
  v_subtotal   numeric(12,2) := 0;
  v_discount   numeric(12,2) := 0;
  v_charge     numeric(10,2) := public.delivery_charge_for(p_delivery_area);
  v_coupon_id  uuid;
  v_unit_price numeric(10,2);
  v_label      text;
  v_count      integer := 0;
  r            record;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  if coalesce(trim(p_customer_name), '') = ''
     or coalesce(trim(p_phone), '') = ''
     or coalesce(trim(p_address), '') = '' then
    raise exception 'missing_delivery_details';
  end if;

  if p_payment_method <> 'cod' and coalesce(trim(p_transaction_id), '') = '' then
    raise exception 'transaction_id_required';
  end if;

  insert into public.orders (
    user_id, customer_name, phone, address, district, note,
    delivery_area, delivery_charge, payment_method, transaction_id, payment_status
  ) values (
    v_user, trim(p_customer_name), trim(p_phone), trim(p_address), nullif(trim(p_district), ''),
    nullif(trim(p_note), ''),
    p_delivery_area, v_charge, p_payment_method,
    case when p_payment_method = 'cod' then null else trim(p_transaction_id) end,
    -- bKash/Nagad: waiting for the admin to verify the transaction id
    case when p_payment_method = 'cod' then 'unpaid' else 'pending' end::public.payment_status
  )
  returning id into v_order_id;

  for r in
    select
      ci.quantity,
      p.id        as product_id,
      p.name_en,
      p.price     as product_price,
      p.is_active as product_active,
      v.id        as variant_id,
      v.size,
      v.color,
      v.price     as variant_price,
      v.is_active as variant_active,
      (select i.url from public.product_images i
        where i.product_id = p.id
        order by i.is_primary desc, i.sort_order
        limit 1) as image_url,
      exists (select 1 from public.product_variants pv where pv.product_id = p.id) as has_variants
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    left join public.product_variants v on v.id = ci.variant_id
    where ci.user_id = v_user
  loop
    v_count := v_count + 1;

    if not r.product_active or (r.variant_id is not null and not r.variant_active) then
      raise exception 'product_unavailable: %', r.name_en;
    end if;

    if r.variant_id is null and r.has_variants then
      raise exception 'variant_required: %', r.name_en;
    end if;

    -- Reduce stock only if enough is left (safe when two people order at once).
    if r.variant_id is not null then
      update public.product_variants
        set stock = stock - r.quantity
        where id = r.variant_id and stock >= r.quantity;
    else
      update public.products
        set stock = stock - r.quantity
        where id = r.product_id and stock >= r.quantity;
    end if;

    if not found then
      raise exception 'insufficient_stock: %', r.name_en;
    end if;

    v_unit_price := coalesce(r.variant_price, r.product_price);
    v_label := nullif(concat_ws(' / ', r.size, r.color), '');

    insert into public.order_items (
      order_id, product_id, variant_id, product_name, variant_label,
      image_url, unit_price, quantity, line_total
    ) values (
      v_order_id, r.product_id, r.variant_id, r.name_en, v_label,
      r.image_url, v_unit_price, r.quantity, v_unit_price * r.quantity
    );

    v_subtotal := v_subtotal + v_unit_price * r.quantity;
  end loop;

  if v_count = 0 then
    raise exception 'cart_empty';
  end if;

  if coalesce(trim(p_coupon_code), '') <> '' then
    v_discount := public.coupon_discount(p_coupon_code, v_subtotal);

    update public.coupons
      set used_count = used_count + 1
      where code = upper(trim(p_coupon_code))
        and (usage_limit is null or used_count < usage_limit)
      returning id into v_coupon_id;

    if v_coupon_id is null then
      raise exception 'invalid_coupon';
    end if;
  end if;

  update public.orders
    set subtotal    = v_subtotal,
        discount    = v_discount,
        total       = v_subtotal - v_discount + v_charge,
        coupon_id   = v_coupon_id,
        coupon_code = case when v_coupon_id is null then null else upper(trim(p_coupon_code)) end
    where id = v_order_id;

  delete from public.cart_items where user_id = v_user;

  return v_order_id;
end;
$$;

revoke execute on function public.place_order(text, text, text, text, public.delivery_area, public.payment_method, text, text, text) from public, anon;
grant  execute on function public.place_order(text, text, text, text, public.delivery_area, public.payment_method, text, text, text) to authenticated;

revoke execute on function public.coupon_discount(text, numeric) from public, anon;
grant  execute on function public.coupon_discount(text, numeric) to authenticated;

-- ---------------------------------------------------------------------
-- 5. TABLE PRIVILEGES (Row Level Security below decides which rows)
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on
  public.categories, public.products, public.product_images,
  public.product_variants, public.banners
to anon, authenticated;

grant select, insert, update, delete on
  public.profiles, public.categories, public.products, public.product_images,
  public.product_variants, public.cart_items, public.wishlist, public.orders,
  public.order_items, public.coupons, public.banners
to authenticated;

grant usage, select on sequence public.order_number_seq to authenticated;

-- ---------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
--    • everyone        → can read active categories / products / banners
--    • customer        → only their own profile, cart, wishlist, orders
--    • admin           → everything
-- ---------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.categories        enable row level security;
alter table public.products          enable row level security;
alter table public.product_images    enable row level security;
alter table public.product_variants  enable row level security;
alter table public.cart_items        enable row level security;
alter table public.wishlist          enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.coupons           enable row level security;
alter table public.banners           enable row level security;

-- profiles ------------------------------------------------------------
drop policy if exists "profiles: read own or admin" on public.profiles;
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

drop policy if exists "profiles: update own or admin" on public.profiles;
create policy "profiles: update own or admin" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

drop policy if exists "profiles: admin delete" on public.profiles;
create policy "profiles: admin delete" on public.profiles
  for delete to authenticated
  using (public.is_admin());

-- categories ----------------------------------------------------------
drop policy if exists "categories: public read" on public.categories;
create policy "categories: public read" on public.categories
  for select to anon, authenticated
  using (is_active or public.is_admin());

drop policy if exists "categories: admin write" on public.categories;
create policy "categories: admin write" on public.categories
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- products ------------------------------------------------------------
drop policy if exists "products: public read" on public.products;
create policy "products: public read" on public.products
  for select to anon, authenticated
  using (is_active or public.is_admin());

drop policy if exists "products: admin write" on public.products;
create policy "products: admin write" on public.products
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- product_images ------------------------------------------------------
drop policy if exists "product_images: public read" on public.product_images;
create policy "product_images: public read" on public.product_images
  for select to anon, authenticated
  using (true);

drop policy if exists "product_images: admin write" on public.product_images;
create policy "product_images: admin write" on public.product_images
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- product_variants ----------------------------------------------------
drop policy if exists "product_variants: public read" on public.product_variants;
create policy "product_variants: public read" on public.product_variants
  for select to anon, authenticated
  using (is_active or public.is_admin());

drop policy if exists "product_variants: admin write" on public.product_variants;
create policy "product_variants: admin write" on public.product_variants
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- banners -------------------------------------------------------------
drop policy if exists "banners: public read" on public.banners;
create policy "banners: public read" on public.banners
  for select to anon, authenticated
  using (
    (is_active
      and (starts_at is null or starts_at <= now())
      and (ends_at   is null or ends_at   >  now()))
    or public.is_admin()
  );

drop policy if exists "banners: admin write" on public.banners;
create policy "banners: admin write" on public.banners
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- cart_items ----------------------------------------------------------
drop policy if exists "cart_items: own rows" on public.cart_items;
create policy "cart_items: own rows" on public.cart_items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "cart_items: admin read" on public.cart_items;
create policy "cart_items: admin read" on public.cart_items
  for select to authenticated
  using (public.is_admin());

-- wishlist ------------------------------------------------------------
drop policy if exists "wishlist: own rows" on public.wishlist;
create policy "wishlist: own rows" on public.wishlist
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "wishlist: admin read" on public.wishlist;
create policy "wishlist: admin read" on public.wishlist
  for select to authenticated
  using (public.is_admin());

-- orders --------------------------------------------------------------
-- Customers only READ their orders. New orders are created through
-- place_order(), never by inserting directly, so totals cannot be faked.
drop policy if exists "orders: read own or admin" on public.orders;
create policy "orders: read own or admin" on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "orders: admin write" on public.orders;
create policy "orders: admin write" on public.orders
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- order_items ---------------------------------------------------------
drop policy if exists "order_items: read own or admin" on public.order_items;
create policy "order_items: read own or admin" on public.order_items
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = (select auth.uid())
    )
  );

drop policy if exists "order_items: admin write" on public.order_items;
create policy "order_items: admin write" on public.order_items
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- coupons (admin only; customers use coupon_discount()) ---------------
drop policy if exists "coupons: admin all" on public.coupons;
create policy "coupons: admin all" on public.coupons
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 7. STORAGE BUCKETS (public read, admin-only upload/update/delete)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('banners',        'banners',        true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "store media: public read" on storage.objects;
create policy "store media: public read" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('product-images', 'banners'));

drop policy if exists "store media: admin insert" on storage.objects;
create policy "store media: admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('product-images', 'banners') and public.is_admin());

drop policy if exists "store media: admin update" on storage.objects;
create policy "store media: admin update" on storage.objects
  for update to authenticated
  using (bucket_id in ('product-images', 'banners') and public.is_admin())
  with check (bucket_id in ('product-images', 'banners') and public.is_admin());

drop policy if exists "store media: admin delete" on storage.objects;
create policy "store media: admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('product-images', 'banners') and public.is_admin());
