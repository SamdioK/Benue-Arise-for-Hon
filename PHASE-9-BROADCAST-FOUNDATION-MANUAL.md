# PHASE 9 — BENUE ARISE MEDIA: BROADCAST FOUNDATION

## 1. Purpose and approved structure
This phase establishes the public navigation and data foundation for the approved three-service media structure:
- **Benue Arise Songs 24/7** — continuous campaign music. The existing Campaign Songs page and its radio card remain in their original position.
- **Benue Arise On-Air** — live campaign audio.
- **Benue Arise Live** — live campaign video with its associated audio.

The existing **Media → Photo & Video Gallery** remains intact. On-Air and Live are added as sibling destinations under the expandable Media navigation.

## 2. Files added
- `on-air.html` — public audio channel.
- `live.html` — public video channel.
- `broadcast.js` — retrieves published broadcast event metadata and loads public playback URLs.
- `broadcast.css` — responsive green, gold and white broadcast interface.

## 3. Files updated
- `index.html` — expandable Media navigation with Gallery, On-Air and Live.
- `gallery.html` — preserves the existing gallery and adds the Media submenu.
- `campaign-songs.html` — preserves the Campaign Songs page and its existing radio card position; renames the radio card to **Benue Arise Songs 24/7** and adds Media submenu navigation.
- `styles.css` — responsive dropdown styling.
- `admin.html`, `admin-portal.js` and `admin-content.css` — add the Broadcast Control Centre shortcut and Broadcast Events & Schedule CMS module.

## 4. Database
The migrations `20261114150000_create_broadcast_events.sql` and `20261114160000_harden_broadcast_event_constraints.sql` create and harden `arise_site.broadcast_events` with event title, slug, description, venue, location, event type, speaker, scheduled times, status, publication flag, public audio/video playback URLs, recording URL, poster path and channel visibility flags.

RLS is enabled. Anonymous visitors can read only published scheduled/live/ended event records. Authenticated administrators can manage all records through the existing `arise_site.is_admin()` check. Explicit Data API grants are included because table exposure and row policies are separate controls. Integrity checks prevent an end time earlier than the start time and prevent an event being marked Live without at least one enabled public playback URL. An update trigger maintains `updated_at`.

## 5. Administrator workflow
1. Sign in at `admin.html`.
2. Select **Broadcast Events & Schedule** from Content module.
3. Create an event and enter its title, slug, event type, location, speaker and schedule.
4. Keep the event as Draft until details are checked.
5. Set status to Scheduled and enable publication when approved.
6. Add the public playback URL(s) only after the streaming provider has been configured.
7. When the real stream is active, set status to Live. After the event, set status to Ended and optionally add the approved recording URL.

**Security rule:** Never paste an ingest stream key, API secret, provider token or password into the CMS. The CMS fields are for public playback URLs only. Provider credentials must be held in protected server-side secrets and used through an authenticated server-side integration.

## 6. Public channel behaviour
- On-Air selects the published live event with On-Air enabled and an audio playback URL.
- Live selects the published live event with video enabled and a video playback URL.
- If no matching live event is configured, each page clearly displays Off Air and lists upcoming published events.
- The Live page supports native HLS where available and HLS.js where required. The On-Air page also supports HLS audio playback through HLS.js on browsers without native HLS support, including compatible Android browsers.
- Playback is user-initiated; no unexpected autoplay is attempted.

## 7. Important implementation boundary
This phase delivers navigation, event scheduling metadata, public channel pages and playback URL handling. It does **not** yet create a real ingest endpoint, stream key, transcoding pipeline, provider recording workflow or actual broadcast start/stop controls. Those require selecting and configuring a managed streaming provider, then implementing protected server-side control functions. Until that is complete, the public pages correctly remain Off Air unless a valid playback URL is supplied.

## 8. Verification checklist
- [ ] Confirm migration and RLS policies.
- [ ] Confirm public read is limited to published events.
- [ ] Confirm administrator CMS can create/edit event metadata.
- [ ] Confirm Media submenu retains Photo & Video Gallery.
- [ ] Confirm On-Air and Live pages load without an active event.
- [ ] Confirm public playback URLs are HTTPS only.
- [ ] Configure a streaming provider before attempting a real broadcast.
- [ ] Test real audio/video playback and mobile data behaviour before launch.

## 9. Troubleshooting
- **No event appears:** Check `is_published`, status and channel visibility flags.
- **On-Air shows Off Air:** Confirm status is Live, On-Air is enabled and audio playback URL is a valid public HTTPS URL.
- **Live shows Off Air:** Confirm status is Live, video is enabled and video playback URL is valid HTTPS.
- **HLS does not play:** Confirm the provider returns a browser-compatible HLS manifest and CORS headers allow the campaign domain.
- **CMS cannot save:** Verify the signed-in user exists in `arise_site.admins`; RLS intentionally blocks non-admin writes.
- **Do not troubleshoot by exposing stream keys in frontend code.** Move credentials to server-side secrets.

## 10. Next phase
Select the managed streaming provider and configure the secure ingest/playback workflow. Then build the full administrator Video Studio and Audio Control Studio, including real start/stop, recording, stream-health and audience metrics.
