-- Index the profile record author foreign key for efficient referential checks.
create index if not exists profile_records_created_by_idx
on arise_site.profile_records (created_by);
