-- =====================================================================
-- Alpa Zone BD — step 3 (admin panel) database update
-- Run AFTER 04_step2_store.sql. Safe to re-run.
--
-- When an admin cancels an order, the stock of its items goes back.
-- A cancelled order stays cancelled (its stock was already returned).
-- =====================================================================

create or replace function public.handle_order_cancel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'cancelled' and new.status <> 'cancelled' then
    raise exception 'cancelled_order_locked';
  end if;

  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.product_variants v
      set stock = v.stock + i.quantity
      from public.order_items i
      where i.order_id = new.id and i.variant_id = v.id;

    update public.products p
      set stock = p.stock + i.quantity
      from public.order_items i
      where i.order_id = new.id and i.variant_id is null and i.product_id = p.id;
  end if;

  return new;
end;
$$;

drop trigger if exists handle_order_cancel on public.orders;
create trigger handle_order_cancel
  before update of status on public.orders
  for each row execute function public.handle_order_cancel();
