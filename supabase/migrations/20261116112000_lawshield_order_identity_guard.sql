-- Ensure a customer cannot prepare an order using another person's email or customer profile.
create or replace function arise_site.commerce_guard_customer_order_identity()
returns trigger
language plpgsql
security definer
set search_path = arise_site, auth, pg_temp
as $$
declare v_customer uuid; v_email text;
begin
  if auth.uid() is not null and not arise_site.is_admin() then
    select id into v_customer from arise_site.commerce_customers where auth_user_id=auth.uid();
    v_email := lower(coalesce(auth.jwt()->>'email',''));
    if v_customer is null or new.customer_id is distinct from v_customer then
      raise exception 'Order customer does not match the authenticated account';
    end if;
    if v_email='' or lower(new.customer_email)<>v_email then
      raise exception 'Order email must match the authenticated customer account';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists commerce_guard_customer_order_identity on arise_site.shop_orders;
create trigger commerce_guard_customer_order_identity
before insert on arise_site.shop_orders
for each row execute function arise_site.commerce_guard_customer_order_identity();
