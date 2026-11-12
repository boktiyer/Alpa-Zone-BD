-- =====================================================================
-- Alpa Zone BD — step 2 (customer site) database update
-- Run AFTER 01_schema.sql and 02_seed.sql. Safe to re-run.
--
-- Adds:
--   • products.discount_percent      → "discount products" list + sort
--   • cart stock guard               → cart can never hold more than stock
--   • orders.advance_via / advance_amount
--       COD      → delivery charge is paid in advance by bKash/Nagad
--       bKash/Nagad → the full amount is paid in advance
--   • order_status_history           → status timeline
--   • place_order()  (new version)   → returns the order number
--   • track_order()                  → order number + phone, no login needed
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Discount percent (calculated by the database, always in sync)
-- ---------------------------------------------------------------------
alter table public.products
  add column if not exists discount_percent integer
  generated always as (
    case
      when compare_at_price is not null and compare_at_price > 0 and compare_at_price > price
        then round((compare_at_price - price) * 100 / compare_at_price)::integer
      else 0
    end
  ) stored;

create index if not exists products_discount_percent_idx on public.products (discount_percent);
create index if not exists products_price_idx on public.products (price);

-- ---------------------------------------------------------------------
-- 2. Cart guard: right variant, product still on sale, never above stock
-- ---------------------------------------------------------------------
create or replace function public.check_cart_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stock  integer;
  v_active boolean;
begin
  if new.variant_id is not null then
    select v.stock, (v.is_active and p.is_active)
      into v_stock, v_active
    from public.product_variants v
    join public.products p on p.id = v.product_id
    where v.id = new.variant_id and v.product_id = new.product_id;

    if not found then
      raise exception 'variant_mismatch';
    end if;
  else
    if exists (select 1 from public.product_variants pv where pv.product_id = new.product_id) then
      raise exception 'variant_required';
    end if;

    select p.stock, p.is_active into v_stock, v_active
    from public.products p
    where p.id = new.product_id;
  end if;

  if not coalesce(v_active, false) then
    raise exception 'product_unavailable';
  end if;

  if new.quantity > coalesce(v_stock, 0) then
    raise exception 'insufficient_stock';
  end if;

  return new;
end;
$$;

drop trigger if exists check_cart_item on public.cart_items;
create trigger check_cart_item
  before insert or update on public.cart_items
  for each row execute function public.check_cart_item();

-- ---------------------------------------------------------------------
-- 3. Orders: advance payment + Bangla product name on order lines
-- ---------------------------------------------------------------------
alter table public.orders add column if not exists advance_via public.payment_method;
alter table public.orders add column if not exists advance_amount numeric(12,2) not null default 0;
alter table public.order_items add column if not exists product_name_bn text;

alter table public.orders drop constraint if exists orders_transaction_id_required;
alter table public.orders drop constraint if exists orders_advance_rules;
-- Every order carries a bKash/Nagad transaction id:
--   COD → for the delivery charge;  bKash/Nagad → for the full amount.
alter table public.orders add constraint orders_advance_rules check (
  advance_via in ('bkash', 'nagad')
  and transaction_id is not null and length(trim(transaction_id)) > 0
  and (payment_method = 'cod' or advance_via = payment_method)
) not valid;

-- ---------------------------------------------------------------------
-- 4. Status history (for the tracking timeline)
-- ---------------------------------------------------------------------
create table if not exists public.order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  status      public.order_status not null,
  created_at  timestamptz not null default now()
);

create index if not exists order_status_history_order_idx
  on public.order_status_history (order_id, created_at);

create or replace function public.log_order_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_status_history (order_id, status) values (new.id, new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists log_order_status on public.orders;
create trigger log_order_status
  after insert or update of status on public.orders
  for each row execute function public.log_order_status();

-- History for orders that already exist.
insert into public.order_status_history (order_id, status, created_at)
select o.id, o.status, o.created_at
from public.orders o
where not exists (select 1 from public.order_status_history h where h.order_id = o.id);

grant select on public.order_status_history to authenticated;
alter table public.order_status_history enable row level security;

drop policy if exists "order_status_history: read own or admin" on public.order_status_history;
create policy "order_status_history: read own or admin" on public.order_status_history
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id and o.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- 5. place_order() — new version
-- ---------------------------------------------------------------------
drop function if exists public.place_order(text, text, text, text, public.delivery_area, public.payment_method, text, text, text);
drop function if exists public.place_order(text, text, text, text, public.delivery_area, public.payment_method, public.payment_method, text, text, text);

-- Turns the logged-in customer's cart into an order, in one transaction,
-- and returns the order number (e.g. AZ-1001).
-- Prices, discount, delivery charge and the advance amount are calculated
-- here from the database, so the browser can never send a fake total.
create function public.place_order(
  p_customer_name   text,
  p_phone           text,
  p_address         text,
  p_district        text,
  p_delivery_area   public.delivery_area,
  p_payment_method  public.payment_method,
  p_advance_via     public.payment_method,   -- wallet the advance was sent with (bkash / nagad)
  p_transaction_id  text,
  p_coupon_code     text default null,
  p_note            text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user         uuid := (select auth.uid());
  v_order_id     uuid;
  v_order_number text;
  v_subtotal     numeric(12,2) := 0;
  v_discount     numeric(12,2) := 0;
  v_total        numeric(12,2);
  v_charge       numeric(10,2) := public.delivery_charge_for(p_delivery_area);
  v_advance_via  public.payment_method;
  v_coupon_id    uuid;
  v_unit_price   numeric(10,2);
  v_label        text;
  v_count        integer := 0;
  r              record;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  if coalesce(trim(p_customer_name), '') = ''
     or coalesce(trim(p_phone), '') = ''
     or coalesce(trim(p_address), '') = '' then
    raise exception 'missing_delivery_details';
  end if;

  v_advance_via := case when p_payment_method = 'cod' then p_advance_via else p_payment_method end;
  if v_advance_via is null or v_advance_via = 'cod' then
    raise exception 'advance_method_required';
  end if;

  if coalesce(trim(p_transaction_id), '') = '' then
    raise exception 'transaction_id_required';
  end if;

  insert into public.orders (
    user_id, customer_name, phone, address, district, note,
    delivery_area, delivery_charge, payment_method, advance_via, transaction_id, payment_status
  ) values (
    v_user, trim(p_customer_name), trim(p_phone), trim(p_address), nullif(trim(p_district), ''),
    nullif(trim(p_note), ''),
    p_delivery_area, v_charge, p_payment_method, v_advance_via, trim(p_transaction_id),
    'pending'   -- waiting for the admin to verify the transaction id
  )
  returning id, order_number into v_order_id, v_order_number;

  for r in
    select
      ci.quantity,
      p.id        as product_id,
      p.name_en,
      p.name_bn,
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
    order by ci.created_at
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
      order_id, product_id, variant_id, product_name, product_name_bn, variant_label,
      image_url, unit_price, quantity, line_total
    ) values (
      v_order_id, r.product_id, r.variant_id, r.name_en, r.name_bn, v_label,
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

  v_total := v_subtotal - v_discount + v_charge;

  update public.orders
    set subtotal       = v_subtotal,
        discount       = v_discount,
        total          = v_total,
        -- COD: only the delivery charge is paid now; the rest on delivery.
        advance_amount = case when p_payment_method = 'cod' then v_charge else v_total end,
        coupon_id      = v_coupon_id,
        coupon_code    = case when v_coupon_id is null then null else upper(trim(p_coupon_code)) end
    where id = v_order_id;

  delete from public.cart_items where user_id = v_user;

  return v_order_number;
end;
$$;

revoke execute on function public.place_order(text, text, text, text, public.delivery_area, public.payment_method, public.payment_method, text, text, text) from public, anon;
grant  execute on function public.place_order(text, text, text, text, public.delivery_area, public.payment_method, public.payment_method, text, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 6. track_order() — anyone with the order number AND the phone number
--    used on the order can see its status. Returns null if they don't match.
-- ---------------------------------------------------------------------
create or replace function public.track_order(p_order_number text, p_phone text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  o       public.orders%rowtype;
  -- compare the last 10 digits, so 017..., +88017... and 88017... all match
  v_phone text := right(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), 10);
begin
  if length(v_phone) < 10 then
    return null;
  end if;

  select * into o
  from public.orders
  where upper(order_number) = upper(trim(coalesce(p_order_number, '')))
    and right(regexp_replace(phone, '[^0-9]', '', 'g'), 10) = v_phone;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'order_number',    o.order_number,
    'status',          o.status,
    'created_at',      o.created_at,
    'customer_name',   o.customer_name,
    'delivery_area',   o.delivery_area,
    'delivery_charge', o.delivery_charge,
    'subtotal',        o.subtotal,
    'discount',        o.discount,
    'total',           o.total,
    'payment_method',  o.payment_method,
    'payment_status',  o.payment_status,
    'advance_amount',  o.advance_amount,
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'product_name',    i.product_name,
        'product_name_bn', i.product_name_bn,
        'variant_label',   i.variant_label,
        'image_url',       i.image_url,
        'unit_price',      i.unit_price,
        'quantity',        i.quantity,
        'line_total',      i.line_total
      ) order by i.created_at), '[]'::jsonb)
      from public.order_items i where i.order_id = o.id
    ),
    'history', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'status',     h.status,
        'created_at', h.created_at
      ) order by h.created_at), '[]'::jsonb)
      from public.order_status_history h where h.order_id = o.id
    )
  );
end;
$$;

grant execute on function public.track_order(text, text) to anon, authenticated;
