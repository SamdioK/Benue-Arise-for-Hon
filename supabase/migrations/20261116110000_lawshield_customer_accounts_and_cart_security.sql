-- Lawshield customer accounts and persistent shopping carts.
-- Also prevents public catalogue queries from exposing unapproved marketplace price data.

drop policy if exists "Public read marketplace links for published products" on arise_site.shop_external_listings;
revoke select on arise_site.shop_external_listings from anon, authenticated;
grant select, insert, update, delete on arise_site.shop_external_listings to authenticated;

create or replace view arise_site.shop_public_external_listings
with (security_barrier = true) as
select
  l.id,
  l.product_id,
  l.marketplace,
  l.marketplace_region,
  l.listing_url,
  case when l.price_display_authorized then l.observed_price else null end as observed_price,
  case when l.price_display_authorized then l.currency else null end as currency,
  case when l.price_display_authorized then l.price_observed_at else null end as price_observed_at,
  l.price_display_authorized,
  l.availability_label
from arise_site.shop_external_listings l
join arise_site.shop_products p on p.id=l.product_id
where p.status='published';

grant select on arise_site.shop_public_external_listings to anon, authenticated;

drop policy if exists "Customers read own commerce profile" on arise_site.commerce_customers;
create policy "Customers read own commerce profile" on arise_site.commerce_customers
for select to authenticated using (auth_user_id=auth.uid());
drop policy if exists "Customers create own commerce profile" on arise_site.commerce_customers;
create policy "Customers create own commerce profile" on arise_site.commerce_customers
for insert to authenticated with check (auth_user_id=auth.uid());
drop policy if exists "Customers update own commerce profile" on arise_site.commerce_customers;
create policy "Customers update own commerce profile" on arise_site.commerce_customers
for update to authenticated using (auth_user_id=auth.uid()) with check (auth_user_id=auth.uid());

drop policy if exists "Customers manage own carts" on arise_site.shop_carts;
create policy "Customers manage own carts" on arise_site.shop_carts
for all to authenticated using (
  customer_id in (select id from arise_site.commerce_customers where auth_user_id=auth.uid())
) with check (
  customer_id in (select id from arise_site.commerce_customers where auth_user_id=auth.uid())
);

drop policy if exists "Customers manage own cart items" on arise_site.shop_cart_items;
create policy "Customers manage own cart items" on arise_site.shop_cart_items
for all to authenticated using (
  exists (
    select 1 from arise_site.shop_carts c
    join arise_site.commerce_customers u on u.id=c.customer_id
    where c.id=cart_id and u.auth_user_id=auth.uid() and c.status='active'
  )
) with check (
  exists (
    select 1 from arise_site.shop_carts c
    join arise_site.commerce_customers u on u.id=c.customer_id
    where c.id=cart_id and u.auth_user_id=auth.uid() and c.status='active'
  )
);

drop policy if exists "Customers read own orders" on arise_site.shop_orders;
create policy "Customers read own orders" on arise_site.shop_orders
for select to authenticated using (
  customer_id in (select id from arise_site.commerce_customers where auth_user_id=auth.uid())
);
drop policy if exists "Customers read own order items" on arise_site.shop_order_items;
create policy "Customers read own order items" on arise_site.shop_order_items
for select to authenticated using (
  exists (
    select 1 from arise_site.shop_orders o
    join arise_site.commerce_customers c on c.id=o.customer_id
    where o.id=order_id and c.auth_user_id=auth.uid()
  )
);
drop policy if exists "Customers read own payments" on arise_site.shop_payments;
create policy "Customers read own payments" on arise_site.shop_payments
for select to authenticated using (
  exists (
    select 1 from arise_site.shop_orders o
    join arise_site.commerce_customers c on c.id=o.customer_id
    where o.id=order_id and c.auth_user_id=auth.uid()
  )
);
drop policy if exists "Customers read own deliveries" on arise_site.shop_deliveries;
create policy "Customers read own deliveries" on arise_site.shop_deliveries
for select to authenticated using (
  exists (
    select 1 from arise_site.shop_orders o
    join arise_site.commerce_customers c on c.id=o.customer_id
    where o.id=order_id and c.auth_user_id=auth.uid()
  )
);

grant select, insert, update, delete on arise_site.commerce_customers,
  arise_site.shop_carts, arise_site.shop_cart_items to authenticated;
grant select on arise_site.shop_orders, arise_site.shop_order_items,
  arise_site.shop_payments, arise_site.shop_deliveries to authenticated;

create index if not exists shop_carts_customer_status_idx
on arise_site.shop_carts(customer_id,status,currency,updated_at desc);
