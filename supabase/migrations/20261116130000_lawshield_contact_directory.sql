-- Lawshield contact directory: draft contact details are private until published.
create table if not exists arise_site.lawshield_contact_profiles (
  id text primary key default 'primary' check (id = 'primary'),
  contact_data jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','published')),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
alter table arise_site.lawshield_contact_profiles enable row level security;
drop policy if exists "Public read published Lawshield contact" on arise_site.lawshield_contact_profiles;
create policy "Public read published Lawshield contact" on arise_site.lawshield_contact_profiles
for select to anon, authenticated using (status = 'published');
drop policy if exists "Lawshield admins manage contact profile" on arise_site.lawshield_contact_profiles;
create policy "Lawshield admins manage contact profile" on arise_site.lawshield_contact_profiles
for all to authenticated using (arise_site.is_admin()) with check (arise_site.is_admin());
grant select on arise_site.lawshield_contact_profiles to anon, authenticated;
grant all on arise_site.lawshield_contact_profiles to authenticated;
