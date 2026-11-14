# Phase 10 — Mux Development Stream Provisioning Manual

## Purpose

Connect the Benue Arise Broadcast Control Centre to Mux using a server-side Supabase Edge Function. This phase provisions **Mux Development test streams** for the On-Air audio and Live video channels. It does not yet activate public production broadcasting.

## Scope delivered

- Mux API credentials are configured by the project owner as Supabase Edge Function secrets:
  - `MUX_TOKEN_ID`
  - `MUX_TOKEN_SECRET`
- A private database table, `public.broadcast_streams_private`, stores the event-to-Mux stream mapping and playback ID. It does not store stream keys.
- Row Level Security is enabled on the private table. Direct access is revoked from `public`, `anon` and `authenticated`; the server-side service role is granted access.
- Edge Function `mux-create-broadcast-stream` is deployed with JWT verification enabled.
- The Administrator Broadcast Control Centre now exposes audio/video test-stream provisioning when an administrator selects a saved broadcast event.
- The function creates an audio-only stream for On-Air or a video stream for Live, requests public playback, and saves the resulting HLS playback URL to the corresponding event field.
- The RTMPS ingest endpoint and stream key are returned only to the authorised administrator in the function response. The stream key is not persisted in the website or database.

## Roles and permissions

- Only a signed-in user with a matching row in `arise_site.admins` can provision a stream.
- Profile Managers do not receive the broadcast provisioning controls.
- Public visitors can access only the public HLS playback URL when the event is published and its broadcast status permits display.
- Mux API credentials remain server-side in Supabase Edge Function secrets.

## Administrator workflow

1. Sign in to the Benue Arise administrator portal.
2. Open **Broadcast Control Centre** and choose **Manage broadcast schedule**.
3. Create and save a broadcast event, or select an existing event.
4. Enable the required channel:
   - **Show on Benue Arise On-Air** for audio-only transmission.
   - **Show on Benue Arise Live** for video transmission.
5. Save the event.
6. With the saved event selected, choose **Create On-Air audio stream** or **Create Live video stream**.
7. Copy the displayed RTMPS server and stream key into the authorised encoder immediately.
8. Store the stream key securely outside the website. It is returned once and is not recoverable from the portal after leaving the page.
9. Keep the event in Draft or Scheduled until the full streaming and status workflow has been tested and approved.

## Important technical behaviour

- This function creates Mux **test** live streams in the Mux Development environment (`test: true`).
- RTMPS server: `rtmps://global-live.mux.com:443/app`.
- Playback URL format: `https://stream.mux.com/{PLAYBACK_ID}.m3u8`.
- The public playback URL is written to `audio_playback_url` or `video_playback_url` in `arise_site.broadcast_events`.
- The private mapping table has a unique constraint on event and channel. Repeated creation is blocked to avoid silently creating duplicate streams.
- If a stream already exists, the function returns its identifiers and explains that its one-time stream key is not stored.
- The function verifies the Supabase user JWT, checks the administrator allowlist, checks that the event exists and that the selected channel is enabled, and only then calls the Mux API.
- Mux credentials are never sent to the browser.

## Security and operational cautions

- Never paste Mux Token ID, Token Secret, or stream keys into chat, GitHub, website configuration, or public database records.
- Do not share an RTMPS stream key. Anyone who obtains it may be able to broadcast to that stream.
- Do not change an event to Live merely because a stream has been provisioned. Provisioning is not proof that an encoder is connected or that viewers can receive the stream.
- Do not use this Development token for production streaming.
- If a stream key is lost, do not try to retrieve it from Supabase. Disable/delete the affected Mux stream and provision a replacement through an authorised process.

## Not yet included — next integration stage

- Mux webhook endpoint and signature verification. This requires creating a Mux webhook in the Mux dashboard and adding its signing secret as `MUX_WEBHOOK_SECRET` in Supabase.
- Automatic synchronisation of connected, active, idle, disabled, and errored stream states.
- Authorised stop/disable controls and stream replacement workflow.
- End-to-end encoder testing from an Android RTMP/RTMPS broadcasting app.
- Production Mux environment token, production stream provisioning, and launch approval.
- Recording and replay publication workflow.

## Verification checklist

- [x] Supabase private stream-mapping table exists.
- [x] RLS is enabled on the private stream-mapping table.
- [x] Direct grants are revoked from public browser roles.
- [x] Mux stream-creation Edge Function is deployed and JWT verification is enabled.
- [x] Administrator UI has separate audio and video test-stream actions.
- [x] The UI reveals the stream key only in the authorised active session and does not save it.
- [ ] Confirm the two Mux secrets in Supabase dashboard (owner confirmation required).
- [ ] Create an event and provision a test audio stream.
- [ ] Create an event and provision a test video stream.
- [ ] Verify encoder connection and actual playback.
- [ ] Configure and verify signed Mux webhooks.

## Troubleshooting

- **Unauthorised / 401:** Sign in again; the administrator session may have expired.
- **Forbidden / 403:** Confirm the signed-in account is listed in `arise_site.admins`.
- **Channel disabled:** Open the event and enable the matching On-Air or Live channel.
- **Event not found:** Save the event first and select it again.
- **Mux configuration incomplete:** Check that `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` exist in Supabase Edge Function Secrets and that the token belongs to the Mux Development environment with Mux Video permissions.
- **A stream already exists:** Use the existing stream record; do not repeatedly create new streams. The stream key is deliberately not stored.
- **No playback:** A playback URL alone does not mean an encoder is transmitting. Confirm encoder configuration and wait for the webhook/status integration in the next phase.

