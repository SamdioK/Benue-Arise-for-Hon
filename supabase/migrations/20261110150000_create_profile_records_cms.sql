-- Phase 2: structured profile, projects and evidence content.
-- Run through Supabase migration tooling; table is protected by RLS and explicit Data API grants.
begin;
create table if not exists arise_site.profile_records (
  id uuid primary key default gen_random_uuid(),
  section_key text not null check (section_key in ('biography','legal_academic','public_service','scholarships','philanthropy','achievements','projects','evidence')),
  title text not null check (length(btrim(title)) between 2 and 220),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category text,
  excerpt text,
  body text not null default '',
  location text,
  source_url text,
  evidence_url text,
  verification_status text not null default 'Under Verification' check (verification_status in ('Verified','Official Record','Campaign Statement','Under Verification')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_records_section_slug_unique unique (section_key, slug)
);
create index if not exists profile_records_public_listing_idx on arise_site.profile_records (section_key, status, published_at desc);
create index if not exists profile_records_category_idx on arise_site.profile_records (section_key, category);
create or replace function arise_site.set_profile_record_updated_at()
returns trigger language plpgsql set search_path = ''
as $function$ begin new.updated_at := now(); return new; end; $function$;
drop trigger if exists profile_records_set_updated_at on arise_site.profile_records;
create trigger profile_records_set_updated_at before update on arise_site.profile_records
for each row execute function arise_site.set_profile_record_updated_at();
alter table arise_site.profile_records enable row level security;
drop policy if exists "Public can read published profile records" on arise_site.profile_records;
create policy "Public can read published profile records" on arise_site.profile_records
for select to anon, authenticated using (status = 'published');
drop policy if exists "Admins can manage profile records" on arise_site.profile_records;
create policy "Admins can manage profile records" on arise_site.profile_records
for all to authenticated using ((select arise_site.is_admin()))
with check ((select arise_site.is_admin()));
grant usage on schema arise_site to anon, authenticated;
grant select on table arise_site.profile_records to anon, authenticated;
grant insert, update, delete on table arise_site.profile_records to authenticated;
commit;
