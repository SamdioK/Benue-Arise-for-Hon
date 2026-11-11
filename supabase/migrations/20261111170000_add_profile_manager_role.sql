create table if not exists arise_site.profile_managers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 120),
  email text not null check (char_length(btrim(email)) between 3 and 254),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);
alter table arise_site.profile_managers enable row level security;
create or replace function arise_site.is_profile_manager()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from arise_site.profile_managers pm where pm.user_id = (select auth.uid())); $$;
revoke all on function arise_site.is_profile_manager() from public;
grant execute on function arise_site.is_profile_manager() to authenticated;
create policy "Admins can manage profile manager assignments"
on arise_site.profile_managers for all to authenticated
using ((select arise_site.is_admin())) with check ((select arise_site.is_admin()));
create policy "Profile managers can read own assignment"
on arise_site.profile_managers for select to authenticated
using (user_id = (select auth.uid()));
grant select, insert, delete on arise_site.profile_managers to authenticated;
drop policy if exists "Admins can manage profile records" on arise_site.profile_records;
create policy "Admins can manage profile records"
on arise_site.profile_records for all to authenticated
using ((select arise_site.is_admin())) with check ((select arise_site.is_admin()));
create policy "Profile managers can create drafts"
on arise_site.profile_records for insert to authenticated
with check ((select arise_site.is_profile_manager()) and status = 'draft');
create policy "Profile managers can update drafts"
on arise_site.profile_records for update to authenticated
using ((select arise_site.is_profile_manager()) and status = 'draft')
with check ((select arise_site.is_profile_manager()) and status = 'draft');
create policy "Profile managers can read draft records"
on arise_site.profile_records for select to authenticated
using ((select arise_site.is_profile_manager()) and status = 'draft');