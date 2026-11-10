-- Dedicated public bucket for permanent campaign website assets.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-assets', 'site-assets', true, 10485760, array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "Public can read site assets" on storage.objects for select to anon, authenticated using (bucket_id='site-assets');
create policy "Admins can upload site assets" on storage.objects for insert to authenticated with check (bucket_id='site-assets' and (select arise_site.is_admin()));
create policy "Admins can update site assets" on storage.objects for update to authenticated using (bucket_id='site-assets' and (select arise_site.is_admin())) with check (bucket_id='site-assets' and (select arise_site.is_admin()));
create policy "Admins can delete site assets" on storage.objects for delete to authenticated using (bucket_id='site-assets' and (select arise_site.is_admin()));
