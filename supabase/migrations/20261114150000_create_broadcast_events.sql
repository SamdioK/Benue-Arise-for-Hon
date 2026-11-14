-- Benue Arise Media: broadcast event metadata and public playback references.
-- Stream keys and provider secrets MUST NOT be stored in this table.
create table if not exists arise_site.broadcast_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  venue text,
  location text,
  event_type text not null default 'campaign_event'
    check (event_type in ('campaign_event','rally','town_hall','press_conference','interview','community_meeting','other')),
  speaker text,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft','scheduled','live','ended','cancelled')),
  is_published boolean not null default false,
  audio_playback_url text,
  video_playback_url text,
  recording_url text,
  poster_path text,
  enable_on_air boolean not null default true,
  enable_live_video boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (audio_playback_url is null or audio_playback_url ~ '^https://'),
  check (video_playback_url is null or video_playback_url ~ '^https://'),
  check (recording_url is null or recording_url ~ '^https://')
);
create index if not exists broadcast_events_public_schedule_idx
  on arise_site.broadcast_events (is_published, starts_at desc);
create index if not exists broadcast_events_status_idx
  on arise_site.broadcast_events (status, starts_at desc);
alter table arise_site.broadcast_events enable row level security;
grant usage on schema arise_site to anon, authenticated;
grant select on arise_site.broadcast_events to anon, authenticated;
grant insert, update, delete on arise_site.broadcast_events to authenticated;
drop policy if exists "Public can read published broadcast events" on arise_site.broadcast_events;
create policy "Public can read published broadcast events"
  on arise_site.broadcast_events for select to anon, authenticated
  using (is_published = true and status in ('scheduled','live','ended'));
drop policy if exists "Admins manage broadcast events" on arise_site.broadcast_events;
create policy "Admins manage broadcast events"
  on arise_site.broadcast_events for all to authenticated
  using (arise_site.is_admin())
  with check (arise_site.is_admin());
