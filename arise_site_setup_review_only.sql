-- Benue Arise for Hon public website: additive, separate schema.
-- REVIEW BEFORE RUNNING. This file is not executed by the website or package.
-- Back up the project and confirm privileges before applying.
-- In Supabase Dashboard, expose `arise_site` in API settings after review.

begin;

create schema if not exists arise_site;

create table if not exists arise_site.news_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt text not null default '' check (char_length(excerpt) <= 500),
  body text not null default '',
  category text not null default 'Update' check (char_length(category) <= 80),
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists arise_site.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 180),
  description text not null default '' check (char_length(description) <= 3000),
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue text not null default '' check (char_length(venue) <= 300),
  public_url text,
  status text not null default 'draft' check (status in ('draft','published','cancelled','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_end_after_start check (ends_at is null or ends_at >= starts_at)
);

create table if not exists arise_site.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  caption text not null default '' check (char_length(caption) <= 500),
  media_path text not null,
  media_type text not null default 'image' check (media_type in ('image','video')),
  public_media_url text,
  taken_at date,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists arise_site.site_settings (
  key text primary key check (char_length(key) between 1 and 100),
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Contact submissions are intentionally NOT exposed through this schema.
-- Store them only through a separately secured Edge Function / trusted service.

create index if not exists news_articles_published_idx
  on arise_site.news_articles (published_at desc)
  where status = 'published';
create index if not exists events_published_start_idx
  on arise_site.events (starts_at asc)
  where status = 'published';
create index if not exists gallery_published_idx
  on arise_site.gallery_items (created_at desc)
  where published = true;

alter table arise_site.news_articles enable row level security;
alter table arise_site.events enable row level security;
alter table arise_site.gallery_items enable row level security;
alter table arise_site.site_settings enable row level security;

-- Explicit minimum grants. Public browser reads only published rows.
grant usage on schema arise_site to anon, authenticated;
grant select on arise_site.news_articles, arise_site.events, arise_site.gallery_items, arise_site.site_settings to anon, authenticated;

drop policy if exists "Public reads published news" on arise_site.news_articles;
create policy "Public reads published news" on arise_site.news_articles
  for select to anon, authenticated
  using (status = 'published' and published_at is not null and published_at <= now());

drop policy if exists "Public reads published events" on arise_site.events;
create policy "Public reads published events" on arise_site.events
  for select to anon, authenticated
  using (status = 'published');

drop policy if exists "Public reads published gallery" on arise_site.gallery_items;
create policy "Public reads published gallery" on arise_site.gallery_items
  for select to anon, authenticated
  using (published = true);

drop policy if exists "Public reads public site settings" on arise_site.site_settings;
create policy "Public reads public site settings" on arise_site.site_settings
  for select to anon, authenticated
  using (key like 'public.%');

-- No browser INSERT/UPDATE/DELETE grants are provided for public content.
-- Later admin publishing should use authenticated, role-checked policies or
-- an Edge Function with server-side authorization. Do not grant anon writes.

commit;
