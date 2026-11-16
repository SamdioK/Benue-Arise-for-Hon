-- Lawshield customer cart RPCs
-- All persistent cart data remains in Supabase. Customers must authenticate with Supabase Auth.
create unique index if not exists commerce_customers_auth_user_uidx
  on arise_site.commerce_customers(auth_user_id) where auth_user_id is not null;

create or replace function arise_site.commerce_customer_for_current_user()
returns uuid
language plpgsql
security definer
set search_path = arise_site, auth, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt()->>'email',''));
  v_name text;
  v_customer uuid;
begin
  if v_uid is null or v_email = '' then
    raise exception 'Sign in with your email address to use the cart';
  end if;
  v_name := coalesce(nullif(btrim(auth.jwt()->'user_metadata'->>'full_name'),''), split_part(v_email,'@',1));
  if char_length(v_name) < 2 then v_name := 'Customer'; end if;
  insert into arise_site.commerce_customers(auth_user_id,full_name,email)
  values(v_uid,left(v_name,160),left(v_email,254))
  on conflict(auth_user_id) do update
    set email=excluded.email,
        full_name=case when arise_site.commerce_customers.full_name in ('Customer',split_part(arise_site.commerce_customers.email,'@',1))
                       then excluded.full_name else arise_site.commerce_customers.full_name end
  returning id into v_customer;
  return v_customer;
end;
$$;

create or replace function arise_site.commerce_cart_get(p_currency text default 'NGN')
returns jsonb
language plpgsql
security definer
set search_path = arise_site, auth, pg_temp
as $$
declare
  v_customer uuid;
  v_cart arise_site.shop_carts%rowtype;
  v_count integer;
begin
  if p_currency not in ('NGN','USD') then raise exception 'Choose NGN or USD'; end if;
  v_customer := arise_site.commerce_customer_for_current_user();
  select * into v_cart from arise_site.shop_carts
    where customer_id=v_customer and status='active'
    order by updated_at desc limit 1 for update;
  if not found then
    insert into arise_site.shop_carts(customer_id,currency) values(v_customer,p_currency)
    returning * into v_cart;
  else
    select count(*) into v_count from arise_site.shop_cart_items where cart_id=v_cart.id;
    if v_cart.currency <> p_currency and v_count > 0 then
      raise exception 'Your cart contains items in %. Empty the cart before changing currency.',v_cart.currency;
    elsif v_cart.currency <> p_currency then
      update arise_site.shop_carts set currency=p_currency where id=v_cart.id returning * into v_cart;
    end if;
  end if;
  return jsonb_build_object(
    'id',v_cart.id,'currency',v_cart.currency,'status',v_cart.status,
    'items',coalesce((
      select jsonb_agg(jsonb_build_object(
        'cart_item_id',ci.id,'variant_id',v.id,'product_id',p.id,
        'title',p.title,'author_name',p.author_name,'format',v.format,
        'quantity',ci.quantity,
        'unit_price',case when v_cart.currency='USD' then v.price_usd else v.price_ngn end,
        'line_total',ci.quantity * case when v_cart.currency='USD' then v.price_usd else v.price_ngn end,
        'cover_storage_path',p.cover_storage_path
      ) order by ci.created_at)
      from arise_site.shop_cart_items ci
      join arise_site.shop_product_variants v on v.id=ci.variant_id
      join arise_site.shop_products p on p.id=v.product_id
      where ci.cart_id=v_cart.id
    ),'[]'::jsonb)
  );
end;
$$;

create or replace function arise_site.commerce_cart_add(p_variant_id uuid,p_quantity integer,p_currency text)
returns jsonb
language plpgsql
security definer
set search_path = arise_site, auth, pg_temp
as $$
declare
  v_customer uuid;
  v_cart arise_site.shop_carts%rowtype;
  v_variant arise_site.shop_product_variants%rowtype;
  v_existing integer;
begin
  if p_quantity < 1 or p_quantity > 50 then raise exception 'Quantity must be between 1 and 50'; end if;
  if p_currency not in ('NGN','USD') then raise exception 'Choose NGN or USD'; end if;
  v_customer := arise_site.commerce_customer_for_current_user();
  select * into v_variant from arise_site.shop_product_variants v
    join arise_site.shop_products p on p.id=v.product_id
    where v.id=p_variant_id and v.is_active=true and p.status='published'
    for update of v;
  if not found then raise exception 'This edition is not currently available'; end if;
  select * into v_cart from arise_site.shop_carts
    where customer_id=v_customer and status='active'
    order by updated_at desc limit 1 for update;
  if not found then
    insert into arise_site.shop_carts(customer_id,currency) values(v_customer,p_currency) returning * into v_cart;
  elsif v_cart.currency <> p_currency then
    if exists(select 1 from arise_site.shop_cart_items where cart_id=v_cart.id) then
      raise exception 'Your cart is in %. Empty it before changing currency.',v_cart.currency;
    end if;
    update arise_site.shop_carts set currency=p_currency where id=v_cart.id returning * into v_cart;
  end if;
  select quantity into v_existing from arise_site.shop_cart_items where cart_id=v_cart.id and variant_id=p_variant_id;
  if v_variant.stock_quantity is not null and coalesce(v_existing,0)+p_quantity > v_variant.stock_quantity then
    raise exception 'The requested quantity exceeds available stock';
  end if;
  insert into arise_site.shop_cart_items(cart_id,variant_id,quantity)
    values(v_cart.id,p_variant_id,p_quantity)
  on conflict(cart_id,variant_id) do update set quantity=arise_site.shop_cart_items.quantity+excluded.quantity;
  update arise_site.shop_carts set updated_at=now() where id=v_cart.id;
  return arise_site.commerce_cart_get(p_currency);
end;
$$;

create or replace function arise_site.commerce_cart_set_quantity(p_variant_id uuid,p_quantity integer)
returns jsonb
language plpgsql
security definer
set search_path = arise_site, auth, pg_temp
as $$
declare v_customer uuid; v_cart arise_site.shop_carts%rowtype; v_stock integer;
begin
  if p_quantity < 1 or p_quantity > 50 then raise exception 'Quantity must be between 1 and 50'; end if;
  v_customer := arise_site.commerce_customer_for_current_user();
  select * into v_cart from arise_site.shop_carts where customer_id=v_customer and status='active' order by updated_at desc limit 1 for update;
  if not found then raise exception 'No active cart found'; end if;
  select v.stock_quantity into v_stock from arise_site.shop_cart_items ci join arise_site.shop_product_variants v on v.id=ci.variant_id
    where ci.cart_id=v_cart.id and ci.variant_id=p_variant_id;
  if not found then raise exception 'Cart item not found'; end if;
  if v_stock is not null and p_quantity > v_stock then raise exception 'Quantity exceeds available stock'; end if;
  update arise_site.shop_cart_items set quantity=p_quantity where cart_id=v_cart.id and variant_id=p_variant_id;
  return arise_site.commerce_cart_get(v_cart.currency);
end;
$$;

create or replace function arise_site.commerce_cart_remove(p_variant_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = arise_site, auth, pg_temp
as $$
declare v_customer uuid; v_cart arise_site.shop_carts%rowtype;
begin
  v_customer := arise_site.commerce_customer_for_current_user();
  select * into v_cart from arise_site.shop_carts where customer_id=v_customer and status='active' order by updated_at desc limit 1 for update;
  if not found then raise exception 'No active cart found'; end if;
  delete from arise_site.shop_cart_items where cart_id=v_cart.id and variant_id=p_variant_id;
  return arise_site.commerce_cart_get(v_cart.currency);
end;
$$;

create or replace function arise_site.commerce_cart_clear()
returns jsonb
language plpgsql
security definer
set search_path = arise_site, auth, pg_temp
as $$
declare v_customer uuid; v_cart arise_site.shop_carts%rowtype;
begin
  v_customer := arise_site.commerce_customer_for_current_user();
  select * into v_cart from arise_site.shop_carts where customer_id=v_customer and status='active' order by updated_at desc limit 1 for update;
  if not found then raise exception 'No active cart found'; end if;
  delete from arise_site.shop_cart_items where cart_id=v_cart.id;
  return arise_site.commerce_cart_get(v_cart.currency);
end;
$$;

revoke all on function arise_site.commerce_customer_for_current_user() from public, anon;
revoke all on function arise_site.commerce_cart_get(text) from public, anon;
revoke all on function arise_site.commerce_cart_add(uuid,integer,text) from public, anon;
revoke all on function arise_site.commerce_cart_set_quantity(uuid,integer) from public, anon;
revoke all on function arise_site.commerce_cart_remove(uuid) from public, anon;
revoke all on function arise_site.commerce_cart_clear() from public, anon;
grant execute on function arise_site.commerce_cart_get(text) to authenticated;
grant execute on function arise_site.commerce_cart_add(uuid,integer,text) to authenticated;
grant execute on function arise_site.commerce_cart_set_quantity(uuid,integer) to authenticated;
grant execute on function arise_site.commerce_cart_remove(uuid) to authenticated;
grant execute on function arise_site.commerce_cart_clear() to authenticated;
