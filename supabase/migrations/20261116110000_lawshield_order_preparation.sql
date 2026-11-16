-- Lawshield authenticated order preparation and customer order history.
create or replace function arise_site.commerce_prepare_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text default null,
  p_delivery_address jsonb default null,
  p_delivery_method text default null,
  p_customer_note text default null
) returns jsonb
language plpgsql
security definer
set search_path = arise_site, auth, pg_temp
as $$
declare
  v_customer uuid;
  v_cart arise_site.shop_carts%rowtype;
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(14,2);
  v_physical boolean;
  v_item record;
begin
  if auth.uid() is null then raise exception 'Sign in to prepare an order'; end if;
  if char_length(btrim(coalesce(p_customer_name,''))) < 2 then raise exception 'Enter your full name'; end if;
  if p_customer_email !~* '^[^\s@]+@[^\s@]+\.[^\s@]+$' then raise exception 'Enter a valid email address'; end if;
  v_customer := arise_site.commerce_customer_for_current_user();
  select * into v_cart from arise_site.shop_carts
    where customer_id=v_customer and status='active'
    order by updated_at desc limit 1 for update;
  if not found then raise exception 'No active cart found'; end if;
  if not exists(select 1 from arise_site.shop_cart_items where cart_id=v_cart.id) then raise exception 'Your cart is empty'; end if;
  if exists(
    select 1 from arise_site.shop_cart_items ci
    join arise_site.shop_product_variants v on v.id=ci.variant_id
    join arise_site.shop_products p on p.id=v.product_id
    where ci.cart_id=v_cart.id and (p.status<>'published' or not v.is_active or (v.stock_quantity is not null and ci.quantity>v.stock_quantity))
  ) then raise exception 'One or more editions are unavailable or exceed current stock. Refresh your cart.'; end if;
  select exists(select 1 from arise_site.shop_cart_items ci join arise_site.shop_product_variants v on v.id=ci.variant_id where ci.cart_id=v_cart.id and v.format='physical') into v_physical;
  if v_physical and (coalesce(p_delivery_address->>'address_line1','')='' or coalesce(p_delivery_address->>'city','')='' or coalesce(p_delivery_address->>'country','')='') then
    raise exception 'A complete delivery address is required for printed books';
  end if;
  select sum(ci.quantity * case when v_cart.currency='USD' then v.price_usd else v.price_ngn end)
    into v_subtotal
    from arise_site.shop_cart_items ci join arise_site.shop_product_variants v on v.id=ci.variant_id
    where ci.cart_id=v_cart.id;
  v_order_number := 'LWP-' || to_char(now() at time zone 'Africa/Lagos','YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  insert into arise_site.shop_orders(order_number,customer_id,customer_name,customer_email,customer_phone,currency,status,subtotal,delivery_fee,discount_total,total,delivery_address,delivery_method,customer_note)
  values(v_order_number,v_customer,left(btrim(p_customer_name),160),lower(btrim(p_customer_email)),nullif(left(btrim(coalesce(p_customer_phone,'')),40),''),v_cart.currency,'pending_payment',v_subtotal,0,0,v_subtotal,p_delivery_address,p_delivery_method,left(coalesce(p_customer_note,''),1500))
  returning id into v_order_id;
  for v_item in
    select ci.quantity,p.id as product_id,p.title,p.author_name,v.id as variant_id,v.format,
      case when v_cart.currency='USD' then v.price_usd else v.price_ngn end as unit_price
    from arise_site.shop_cart_items ci
    join arise_site.shop_product_variants v on v.id=ci.variant_id
    join arise_site.shop_products p on p.id=v.product_id
    where ci.cart_id=v_cart.id
    for update of v
  loop
    insert into arise_site.shop_order_items(order_id,product_id,variant_id,title_snapshot,author_snapshot,format_snapshot,unit_price,quantity,line_total)
    values(v_order_id,v_item.product_id,v_item.variant_id,v_item.title,v_item.author_name,v_item.format,v_item.unit_price,v_item.quantity,v_item.unit_price*v_item.quantity);
    if v_item.format='physical' then
      update arise_site.shop_product_variants set stock_quantity=stock_quantity-v_item.quantity
      where id=v_item.variant_id and stock_quantity is not null;
    end if;
  end loop;
  update arise_site.shop_carts set status='converted' where id=v_cart.id;
  return jsonb_build_object('success',true,'order_id',v_order_id,'order_number',v_order_number,'currency',v_cart.currency,'subtotal',v_subtotal,'delivery_fee',0,'total',v_subtotal,'status','pending_payment');
end;
$$;

create or replace function arise_site.commerce_customer_orders()
returns jsonb
language plpgsql
security definer
set search_path = arise_site, auth, pg_temp
as $$
declare v_customer uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to view orders'; end if;
  v_customer := arise_site.commerce_customer_for_current_user();
  return coalesce((
    select jsonb_agg(jsonb_build_object('order_number',o.order_number,'currency',o.currency,'total',o.total,'status',o.status,'created_at',o.created_at) order by o.created_at desc)
    from arise_site.shop_orders o where o.customer_id=v_customer
  ),'[]'::jsonb);
end;
$$;

revoke all on function arise_site.commerce_prepare_order(text,text,text,jsonb,text,text) from public,anon;
revoke all on function arise_site.commerce_customer_orders() from public,anon;
grant execute on function arise_site.commerce_prepare_order(text,text,text,jsonb,text,text) to authenticated;
grant execute on function arise_site.commerce_customer_orders() to authenticated;
