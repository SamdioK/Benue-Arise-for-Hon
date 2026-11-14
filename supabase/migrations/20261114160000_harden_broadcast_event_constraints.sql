-- Additional integrity checks and updated_at maintenance for broadcast events.
alter table arise_site.broadcast_events
  add constraint broadcast_event_end_after_start
  check (ends_at is null or starts_at is null or ends_at >= starts_at);
alter table arise_site.broadcast_events
  add constraint broadcast_live_requires_playback
  check (
    status <> 'live'
    or ((enable_on_air and audio_playback_url is not null)
      or (enable_live_video and video_playback_url is not null))
  );
create or replace function arise_site.touch_broadcast_event_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;
drop trigger if exists broadcast_events_touch_updated_at on arise_site.broadcast_events;
create trigger broadcast_events_touch_updated_at
before update on arise_site.broadcast_events
for each row execute function arise_site.touch_broadcast_event_updated_at();
revoke all on function arise_site.touch_broadcast_event_updated_at() from public, anon, authenticated;
