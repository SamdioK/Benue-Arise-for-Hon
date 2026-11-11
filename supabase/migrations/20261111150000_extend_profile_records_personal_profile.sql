-- Extend profile records for the Personal Profile module.
-- Supports approved photographs, accessible image descriptions and ordered milestones.
begin;
alter table arise_site.profile_records
  add column if not exists image_url text,
  add column if not exists image_alt text,
  add column if not exists display_order integer not null default 0,
  add column if not exists milestone_date date;
create index if not exists profile_records_section_display_order_idx
  on arise_site.profile_records(section_key, display_order, published_at desc);
commit;
