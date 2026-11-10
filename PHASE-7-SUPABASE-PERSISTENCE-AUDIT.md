# Phase 7 — Supabase-Only Persistence and Browser Storage Audit

## Audit scope
Reviewed the public portal and administrator frontend JavaScript/HTML modules on implementation/brand-and-foundation, plus the live Supabase schema and Storage bucket inventory.

## Changes made
- Set Supabase client auth `persistSession: false` and `autoRefreshToken: false` in `portal.js`, `admin-portal.js`, and `admin.js`.
- Confirmed `site.js` already uses both settings as false.
- This prevents Supabase Auth from persisting access/refresh tokens in browser local storage. The active login session remains in client memory for the current page lifetime.

## Important administrator login behaviour
Because browser persistence is disabled, an administrator will need to sign in again after a page reload, closing the tab, or opening a new browser session. This is intentional to meet the no-browser-persistence requirement. Auth credentials and sessions continue to be validated by Supabase Auth; the browser only holds the active in-memory session while the page is open.

## Browser-storage scan
Scanned the following files for `localStorage`, `sessionStorage`, `indexedDB`, CacheStorage, Cache API, `navigator.storage`, localForage and related persistence patterns:
- `portal.js`
- `admin-portal.js`
- `admin.js`
- `site.js`
- `app.js`
- `register.html`
- `contact.html`
- `config.js`

No direct use of browser local/session storage, IndexedDB or Cache API was found. Supabase Auth previously had `persistSession: true` in three client initialisations; these have now been disabled.

## Supabase database verification
Live project `atstsekevoozausbiqbi`, schema `arise_site`:
- `admins`
- `events`
- `gallery`
- `hero_admins`
- `hero_slides`
- `news`
- `profile_records`
- `site_settings`
- `vision_mission_content`

All nine listed tables have row-level security enabled. CMS content and administrator-managed records are persisted in Supabase Postgres, subject to their RLS policies.

## Supabase Storage verification
The project currently has one bucket: `hero-slides` (public, 5 MiB limit, JPEG/PNG/WebP allowed). It is used by the existing hero-slide image upload workflow. No general-purpose media/site-assets bucket was found.

The campaign logo and candidate portrait are versioned static assets in the GitHub Pages repository, not browser storage. They are not currently stored in Supabase Storage. The existing `hero-slides` bucket was not repurposed because its access rules and purpose are specific to hero-slide uploads. A separate dedicated bucket and upload workflow would be required if the owner wants every static image asset copied into Supabase Storage as well.

## Result and limitations
- No browser/local storage use remains in the reviewed frontend modules.
- Supabase database is the persistence layer for CMS records.
- Supabase Storage currently holds hero-slide uploads only.
- Static source assets remain in GitHub, which is repository hosting rather than browser/local storage.
- No data was deleted or migrated in this audit.
- No live deployment was performed.
