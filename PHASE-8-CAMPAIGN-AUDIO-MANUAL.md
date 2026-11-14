# PHASE 8 — BENUE ARISE AUDIO
## Campaign Songs Platform: Implementation and Administration Manual

### 1. Purpose
Benue Arise Audio is the campaign website's dedicated music and audio destination. It is accessible from the main site navigation as **Campaign Songs** and organises recordings into four election-level collections:
- Governorship
- Senate
- House of Representatives
- House of Assembly

The interface is responsive and includes song discovery, search, sorting, a persistent player, playback queue, shuffle, repeat, volume, seeking, optional downloads and Campaign Radio.

### 2. Files added or updated
- `campaign-songs.html` — public audio experience.
- `audio.css` — responsive audio-platform styling.
- `audio.js` — Supabase queries, song discovery and playback.
- `index.html` — Campaign Songs navigation and homepage quick link.
- `admin.html` — Campaign Songs and Campaign Playlists CMS modules plus Campaign Audio Studio.
- `admin-portal.js` — song/playlist forms and protected audio/artwork uploads.

### 3. Supabase data model
Schema: `arise_site`

Tables:
- `campaign_songs` — track metadata, campaign level, artist, language, audio/artwork paths, publication state and play count.
- `campaign_playlists` — curated collection metadata.
- `campaign_playlist_songs` — playlist-to-song relationships and ordering.
- `campaign_song_plays` — listening events for aggregate analytics.

The database migration enables RLS, provides public read access only to published and scheduled campaign songs/playlists, restricts management to authorised administrators, and records play events. A database trigger increments each song's play count when a play event is recorded.

### 4. Storage
Bucket: `campaign-audio`

- Audio recordings: `songs/`
- Cover artwork: `artwork/`
- Audio upload limit: 50 MB.
- Artwork upload limit: 8 MB.
- Accepted audio formats: MP3, MP4/M4A-compatible audio, AAC, OGG, WAV, FLAC and WebM, subject to browser support.
- Accepted artwork: JPEG, PNG and WebP.

The bucket is public for direct playback of approved public campaign media. Anonymous bucket listing is not granted. Do not upload private, embargoed or unapproved material. Use unique filenames and publish only after rights and content approval.

### 5. Administrator workflow
1. Sign in at `admin.html` with an authorised administrator account.
2. Open **Campaign Audio Studio**.
3. Upload the audio recording. Copy the returned storage path (for example, `songs/...`).
4. Upload the cover artwork if available. Copy its storage path.
5. In **Content module**, select **Campaign Songs** and create a record.
6. Enter the title, slug, performer, language and campaign level. Add the audio path and optional artwork path.
7. Save as Draft while metadata, rights, lyrics and artwork are reviewed.
8. Set the publication status to **published** and provide a publication date/time to make the recording visible publicly.
9. Use **Campaign Playlists** to create collection titles and descriptions.

A published song must have a valid audio storage path and a publication timestamp not later than the current time. The public page never treats draft, pending, approved-but-unpublished or archived records as public releases.

### 6. Public experience
Open `campaign-songs.html` from the website's Campaign Songs navigation. Visitors can browse the four election-level categories, search songs, sort the library, play tracks, use the queue and start Campaign Radio. Downloads are shown only when the administrator enables them for a song.

### 7. Important operational notes
- Only upload recordings for which the campaign has the necessary permission or licence.
- Obtain performer/producer credits and any required consent before publication.
- Lyrics must be approved before they are entered.
- Use factual artist, language, constituency and campaign-level metadata.
- Playlist Composer manages playlist-song assignments and ordering. Published playlists can be played as a queue on the public audio page.
- Listening events are collected for platform analytics. Do not use them to identify individual listeners.
- Test playback on Android Chrome and at least one desktop browser after the site deployment updates.

### 8. Deployment and verification
The changes are committed to the `implementation/brand-and-foundation` branch. The Supabase migration for the four audio tables, RLS policies, storage bucket and play-count trigger was applied successfully. The live GitHub Pages deployment must still be checked after the branch is published or merged according to the repository's deployment settings.

### 9. Acceptance checklist
- [ ] Campaign Songs appears in the main website navigation.
- [ ] The four campaign-level collections display.
- [ ] An authorised administrator can upload audio and artwork.
- [ ] A song can be saved as Draft without appearing publicly.
- [ ] A published song with a valid audio path appears publicly.
- [ ] Playback, seeking, queue, shuffle, repeat and volume work.
- [ ] Play events increment the database play count.\n- [ ] Playlist Composer saves song membership and ordering.\n- [ ] Published playlists play their assigned published songs.
- [ ] Public visitors cannot create or edit song records.
- [ ] Unapproved recordings are not published.
