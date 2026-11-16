-- Atomic order-intent creation from a verified customer cart.
create or replace function arise_site.commerce_prepare_order(
  p_user_id uuid,
  p_cart_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_delivery_address jsonb,
  p_delivery_method text,
  p_customer_note text
) returns jsonb
language plpgsql
security definer
set search_path = arise_site, public, pg_temp
as $$
declare
  v_customer_id uuid;
  v_currency text;
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(14,2);
  v_has_physical boolean;
  v_count integer;
  item record;
begin
  select id into v_customer_id
  from arise_site.commerce_customers
  where auth_user_id=p_user_id;
  if v_customer_id is null then
    raise exception 'Customer profile is missing';
  end if;

  select currency into v_currency
  from arise_site.shop_carts
  where id=p_cart_id and customer_id=v_customer_id and status='active'
  for update;
  if v_currency is null then
    raise exception 'Active cart not found';
  end if;

  select count(*), coalesce(sum(ci.quantity * case when v_currency='NGN' then v.price_ngn else v.price_usd end),0),
         coalesce(bool_or(v.format='physical'),false)
  into v_count,v_subtotal,v_has_physical
  from arise_site.shop_cart_items ci
  join arise_site.shop_product_variants v on v.id=ci.variant_id and v.is_active
  join arise_site.shop_products p on p.id=v.product_id and p.status='published'
  where ci.cart_id=p_cart_id;
  if v_count=0 then raise exception 'Cart is empty or contains unavailable items'; end if;

  for item in
    select ci.quantity,v.format,v.stock_quantity,p.title
    from arise_site.shop_cart_items ci
    join arise_site.shop_product_variants v on v.id=ci.variant_id and v.is_active
    join arise_site.shop_products p on p.id=v.product_id and p.status='published'
    where ci.cart_id=p_cart_id
  loop
    if item.format='physical' and item.stock_quantity is not null and item.stock_quantity < item.quantity then
      raise exception 'Insufficient stock for %',item.title;
    end if;
  end loop;

  if v_has_physical and (p_delivery_address is null or coalesce(trim(p_delivery_address->>'address_line1'),'')='') then
    raise exception 'A delivery address is required for physical books';
  end if;

  v_order_number := 'LSP-' || to_char(now() at time zone 'utc','YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  insert into arise_site.shop_orders(
    order_number,customer_id,customer_name,customer_email,customer_phone,currency,status,
    subtotal,delivery_fee,discount_total,total,delivery_address,delivery_method,customer_note
  ) values (
    v_order_number,v_customer_id,trim(p_customer_name),lower(trim(p_customer_email)),nullif(trim(p_customer_phone),''),
    v_currency,'pending_payment',v_subtotal,0,0,v_subtotal,p_delivery_address,nullif(trim(p_delivery_method),''),nullif(trim(p_customer_note),'')
  ) returning id into v_order_id;

  insert into arise_site.shop_order_items(order_id,product_id,variant_id,title_snapshot,author_snapshot,format_snapshot,unit_price,quantity,line_total)
  select v_order_id,p.id,v.id,p.title,p.author_name,v.format,
    case when v_currency='NGN' then v.price_ngn else v.price_usd end,
    ci.quantity,ci.quantity * case when v_currency='NGN' then v.price_ngn else v.price_usd end
  from arise_site.shop_cart_items ci
  join arise_site.shop_product_variants v on v.id=ci.variant_id
  join arise_site.shop_products p on p.id=v.product_id
  where ci.cart_id=p_cart_id;

  update arise_site.shop_carts set status='converted' where id=p_cart_id;
  return jsonb_build_object('success',true,'order_id',v_order_id,'order_number',v_order_number,'currency',v_currency,'subtotal',v_subtotal,'total',v_subtotal,'status','pending_payment');
end;
$$;

revoke all on function arise_site.commerce_prepare_order(uuid,uuid,text,text,text,jsonb,text,text) from public,anon,authenticated;
grant execute on function arise_site.commerce_prepare_order(uuid,uuid,text,text,text,jsonb,text,text) to service_role;
