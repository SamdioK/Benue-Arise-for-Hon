-- Hon's Bookshop & Services — Phase 1 commerce foundation
-- Branch: implementation/brand-and-foundation
-- This migration is intentionally staged in GitHub for review before live application.

create table if not exists arise_site.shop_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists arise_site.shop_products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references arise_site.shop_categories(id) on delete set null,
  title text not null check (char_length(btrim(title)) between 2 and 240),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  author_name text not null check (char_length(btrim(author_name)) between 2 and 180),
  subtitle text,
  description text,
  isbn_10 text,
  isbn_13 text,
  publisher text,
  publication_date date,
  edition text,
  language text not null default 'English',
  page_count integer check (page_count is null or page_count > 0),
  cover_storage_path text,
  preview_storage_path text,
  product_kind text not null default 'book' check (product_kind in ('book','publication','other')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  display_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists arise_site.shop_product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references arise_site.shop_products(id) on delete cascade,
  format text not null check (format in ('physical','digital')),
  sku text unique,
  price_ngn numeric(14,2) not null check (price_ngn >= 0),
  price_usd numeric(14,2) not null check (price_usd >= 0),
  compare_at_price_ngn numeric(14,2) check (compare_at_price_ngn is null or compare_at_price_ngn >= price_ngn),
  compare_at_price_usd numeric(14,2) check (compare_at_price_usd is null or compare_at_price_usd >= price_usd),
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  is_active boolean not null default true,
  digital_storage_path text,
  weight_grams integer check (weight_grams is null or weight_grams > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, format),
  check ((format = 'digital' and digital_storage_path is not null) or format = 'physical')
);

create table if not exists arise_site.shop_external_listings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references arise_site.shop_products(id) on delete cascade,
  marketplace text not null check (char_length(btrim(marketplace)) between 2 and 80),
  marketplace_region text,
  listing_url text not null check (listing_url ~ '^https://'),
  external_product_id text,
  observed_price numeric(14,2) check (observed_price is null or observed_price >= 0),
  currency text check (currency is null or currency in ('NGN','USD','GBP','EUR','CAD','AUD','INR')),
  price_observed_at timestamptz,
  price_display_authorized boolean not null default false,
  availability_label text,
  capture_method text not null default 'manual' check (capture_method in ('manual','approved_api','approved_feed')),
  source_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists arise_site.commerce_customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 160),
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists arise_site.shop_carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references arise_site.commerce_customers(id) on delete set null,
  guest_session_hash text unique,
  currency text not null check (currency in ('NGN','USD')),
  status text not null default 'active' check (status in ('active','converted','abandoned')),
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (customer_id is not null or guest_session_hash is not null)
);

create table if not exists arise_site.shop_cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references arise_site.shop_carts(id) on delete cascade,
  variant_id uuid not null references arise_site.shop_product_variants(id) on delete restrict,
  quantity integer not null check (quantity between 1 and 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(cart_id, variant_id)
);

create table if not exists arise_site.shop_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references arise_site.commerce_customers(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  currency text not null check (currency in ('NGN','USD')),
  status text not null default 'pending_payment' check (status in ('pending_payment','paid','processing','partially_fulfilled','fulfilled','cancelled','refunded','partially_refunded')),
  subtotal numeric(14,2) not null check (subtotal >= 0),
  delivery_fee numeric(14,2) not null default 0 check (delivery_fee >= 0),
  discount_total numeric(14,2) not null default 0 check (discount_total >= 0),
  total numeric(14,2) not null check (total >= 0),
  delivery_address jsonb,
  delivery_method text,
  customer_note text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists arise_site.shop_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references arise_site.shop_orders(id) on delete cascade,
  product_id uuid references arise_site.shop_products(id) on delete set null,
  variant_id uuid references arise_site.shop_product_variants(id) on delete set null,
  title_snapshot text not null,
  author_snapshot text,
  format_snapshot text not null check (format_snapshot in ('physical','digital')),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 50),
  line_total numeric(14,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists arise_site.shop_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references arise_site.shop_orders(id) on delete restrict,
  provider text not null default 'paystack',
  provider_reference text not null unique,
  currency text not null check (currency in ('NGN','USD')),
  amount numeric(14,2) not null check (amount > 0),
  status text not null default 'initialised' check (status in ('initialised','pending','successful','failed','reversed','refunded')),
  provider_transaction_id text,
  verification_payload jsonb,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists arise_site.shop_deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references arise_site.shop_orders(id) on delete cascade,
  carrier text,
  tracking_number text,
  tracking_url text,
  status text not null default 'awaiting_fulfilment' check (status in ('awaiting_fulfilment','packed','dispatched','in_transit','delivered','delivery_failed','returned')),
  dispatched_at timestamptz,
  delivered_at timestamptz,
  delivery_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists arise_site.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists arise_site.service_offerings (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references arise_site.service_categories(id) on delete set null,
  title text not null check (char_length(btrim(title)) between 2 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  pricing_mode text not null check (pricing_mode in ('fixed','from','quote')),
  price_ngn numeric(14,2) check (price_ngn is null or price_ngn >= 0),
  price_usd numeric(14,2) check (price_usd is null or price_usd >= 0),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  display_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((pricing_mode = 'quote' and price_ngn is null and price_usd is null) or (pricing_mode in ('fixed','from') and price_ngn is not null and price_usd is not null))
);

create table if not exists arise_site.service_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique,
  customer_id uuid references arise_site.commerce_customers(id) on delete set null,
  service_id uuid references arise_site.service_offerings(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  description text not null check (char_length(btrim(description)) between 10 and 5000),
  preferred_date timestamptz,
  currency text check (currency is null or currency in ('NGN','USD')),
  status text not null default 'submitted' check (status in ('submitted','under_review','quoted','accepted','scheduled','in_progress','completed','declined','cancelled')),
  attachment_paths text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists arise_site.service_quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references arise_site.service_requests(id) on delete cascade,
  currency text not null check (currency in ('NGN','USD')),
  amount numeric(14,2) not null check (amount >= 0),
  scope text not null,
  valid_until timestamptz,
  status text not null default 'draft' check (status in ('draft','sent','accepted','rejected','expired','withdrawn')),
  sent_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists arise_site.service_appointments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references arise_site.service_requests(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'Africa/Lagos',
  location_or_meeting_link text,
  status text not null default 'proposed' check (status in ('proposed','confirmed','rescheduled','completed','cancelled','no_show')),
  appointment_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists arise_site.shop_audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_table text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists shop_products_public_idx on arise_site.shop_products(status, featured, display_order);
create index if not exists shop_variants_product_idx on arise_site.shop_product_variants(product_id, is_active);
create index if not exists shop_external_listings_product_idx on arise_site.shop_external_listings(product_id, price_observed_at desc);
create index if not exists shop_orders_customer_idx on arise_site.shop_orders(customer_id, created_at desc);
create index if not exists shop_orders_status_idx on arise_site.shop_orders(status, created_at desc);
create index if not exists shop_order_items_order_idx on arise_site.shop_order_items(order_id);
create index if not exists shop_payments_order_idx on arise_site.shop_payments(order_id, created_at desc);
create index if not exists service_requests_status_idx on arise_site.service_requests(status, created_at desc);
create index if not exists service_requests_email_idx on arise_site.service_requests(lower(customer_email));

create or replace function arise_site.commerce_touch_updated_at()
returns trigger language plpgsql set search_path = arise_site, pg_temp as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'shop_categories','shop_products','shop_product_variants','shop_external_listings',
    'commerce_customers','shop_carts','shop_cart_items','shop_orders','shop_payments',
    'shop_deliveries','service_categories','service_offerings','service_requests',
    'service_quotes','service_appointments'
  ] loop
    execute format('drop trigger if exists %I on arise_site.%I', t || '_touch_updated_at', t);
    execute format('create trigger %I before update on arise_site.%I for each row execute function arise_site.commerce_touch_updated_at()', t || '_touch_updated_at', t);
  end loop;
end $$;

alter table arise_site.shop_categories enable row level security;
alter table arise_site.shop_products enable row level security;
alter table arise_site.shop_product_variants enable row level security;
alter table arise_site.shop_external_listings enable row level security;
alter table arise_site.commerce_customers enable row level security;
alter table arise_site.shop_carts enable row level security;
alter table arise_site.shop_cart_items enable row level security;
alter table arise_site.shop_orders enable row level security;
alter table arise_site.shop_order_items enable row level security;
alter table arise_site.shop_payments enable row level security;
alter table arise_site.shop_deliveries enable row level security;
alter table arise_site.service_categories enable row level security;
alter table arise_site.service_offerings enable row level security;
alter table arise_site.service_requests enable row level security;
alter table arise_site.service_quotes enable row level security;
alter table arise_site.service_appointments enable row level security;
alter table arise_site.shop_audit_logs enable row level security;

-- Public access is read-only and limited to published catalogue content.
drop policy if exists "Public read active shop categories" on arise_site.shop_categories;
create policy "Public read active shop categories" on arise_site.shop_categories
for select to anon, authenticated using (is_active = true);

drop policy if exists "Public read published shop products" on arise_site.shop_products;
create policy "Public read published shop products" on arise_site.shop_products
for select to anon, authenticated using (status = 'published');

drop policy if exists "Public read active product variants" on arise_site.shop_product_variants;
create policy "Public read active product variants" on arise_site.shop_product_variants
for select to anon, authenticated using (
  is_active = true and exists (
    select 1 from arise_site.shop_products p
    where p.id = product_id and p.status = 'published'
  )
);

drop policy if exists "Public read marketplace links for published products" on arise_site.shop_external_listings;
create policy "Public read marketplace links for published products" on arise_site.shop_external_listings
for select to anon, authenticated using (
  exists (select 1 from arise_site.shop_products p where p.id = product_id and p.status = 'published')
);

drop policy if exists "Public read active service categories" on arise_site.service_categories;
create policy "Public read active service categories" on arise_site.service_categories
for select to anon, authenticated using (is_active = true);

drop policy if exists "Public read published service offerings" on arise_site.service_offerings;
create policy "Public read published service offerings" on arise_site.service_offerings
for select to anon, authenticated using (status = 'published');

-- Existing portal administrator allowlist governs all commerce administration.
do $$
declare t text;
begin
  foreach t in array array[
    'shop_categories','shop_products','shop_product_variants','shop_external_listings',
    'commerce_customers','shop_carts','shop_cart_items','shop_orders','shop_order_items',
    'shop_payments','shop_deliveries','service_categories','service_offerings',
    'service_requests','service_quotes','service_appointments','shop_audit_logs'
  ] loop
    execute format('drop policy if exists %I on arise_site.%I', 'Commerce admins manage ' || t, t);
    execute format('create policy %I on arise_site.%I for all to authenticated using (arise_site.is_admin()) with check (arise_site.is_admin())', 'Commerce admins manage ' || t, t);
  end loop;
end $$;

grant usage on schema arise_site to anon, authenticated;
grant select on arise_site.shop_categories, arise_site.shop_products, arise_site.shop_product_variants,
  arise_site.shop_external_listings, arise_site.service_categories, arise_site.service_offerings
  to anon, authenticated;
grant all on arise_site.shop_categories, arise_site.shop_products, arise_site.shop_product_variants,
  arise_site.shop_external_listings, arise_site.commerce_customers, arise_site.shop_carts,
  arise_site.shop_cart_items, arise_site.shop_orders, arise_site.shop_order_items,
  arise_site.shop_payments, arise_site.shop_deliveries, arise_site.service_categories,
  arise_site.service_offerings, arise_site.service_requests, arise_site.service_quotes,
  arise_site.service_appointments, arise_site.shop_audit_logs to authenticated;
grant usage, select on all sequences in schema arise_site to authenticated;

-- Public book covers only. Digital books and customer/order files remain private.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('shop-covers','shop-covers',true,10485760,array['image/jpeg','image/png','image/webp']),
  ('shop-digital','shop-digital',false,104857600,array['application/pdf','application/epub+zip']),
  ('shop-documents','shop-documents',false,20971520,array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read shop covers" on storage.objects;
create policy "Public read shop covers" on storage.objects
for select to anon, authenticated using (bucket_id = 'shop-covers');

drop policy if exists "Commerce admins upload shop assets" on storage.objects;
create policy "Commerce admins upload shop assets" on storage.objects
for insert to authenticated with check (
  bucket_id in ('shop-covers','shop-digital','shop-documents') and arise_site.is_admin()
);

drop policy if exists "Commerce admins update shop assets" on storage.objects;
create policy "Commerce admins update shop assets" on storage.objects
for update to authenticated using (
  bucket_id in ('shop-covers','shop-digital','shop-documents') and arise_site.is_admin()
) with check (
  bucket_id in ('shop-covers','shop-digital','shop-documents') and arise_site.is_admin()
);

drop policy if exists "Commerce admins delete shop assets" on storage.objects;
create policy "Commerce admins delete shop assets" on storage.objects
for delete to authenticated using (
  bucket_id in ('shop-covers','shop-digital','shop-documents') and arise_site.is_admin()
);
