# Phase 1 — Brand, Supabase Foundation and CMS Integration Manual

## 1. Purpose

This phase establishes the approved public identity, connects the website to the existing Supabase project, and aligns the first content-management modules with the live database. It deliberately reuses the existing `arise_site` schema rather than creating duplicate `portal_*` tables.

Official profile name to use consistently:

**Prof. (Chief) Sebastine Tartenger Hon, SAN, FCIArb, DSSRS, Sema-Wan u Tiv.**

Do not reintroduce the unconfirmed designation FICAP.

## 2. System components

- Website repository: `SamdioK/Benue-Arise-for-Hon`
- Implementation branch: `implementation/brand-and-foundation`
- Supabase project reference: `atstsekevoozausbiqbi`
- Supabase schema: `arise_site`
- Browser client: Supabase JavaScript v2.118.0, loaded from the pinned CDN URL
- Authentication: Supabase Auth email/password
- Public browser key: publishable key in `config.js`

The publishable key is designed for frontend use and does not replace database security. Never place a secret key or service_role key in `config.js`, HTML, JavaScript, or GitHub Pages assets.

## 3. Existing database structure inspected

The following tables were present before this phase's code changes:

| Table | Main purpose |
|---|---|
| `admins` | CMS administrator allowlist |
| `events` | Event title, dates, venue, registration link and publication status |
| `gallery` | Gallery title, caption, alt text, storage path and display order |
| `hero_admins` | Separate allowlist for hero image administration |
| `hero_slides` | Hero image metadata and active state |
| `news` | Articles, excerpts, content, featured image and publication status |
| `site_settings` | JSON site settings |
| `vision_mission_content` | Vision and mission content with publication state |

All eight tables had RLS enabled. The existing policies allow public reads of published news, events, gallery records, active hero slides, public site settings and published vision/mission content. Administrator write policies use the existing `arise_site.is_admin()` check.

The existing `hero-slides` storage bucket is public for reading. Its upload and delete policies use the separate `hero_admins` allowlist and restrict uploads/deletions to a folder named with the signed-in user's UUID. It is not treated as a general-purpose gallery upload bucket.

## 4. Roles and access

### Public visitor
1. Opens the public website.
2. Reads only records allowed by the public RLS policies.
3. Sees published news, events, gallery records and published vision/mission content.
4. Cannot create, edit or delete CMS records.

### CMS administrator
1. Opens `admin.html`.
2. Signs in through Supabase Auth.
3. The website checks the signed-in user's UUID against `arise_site.admins`.
4. Supabase RLS independently protects database operations.
5. The administrator can create, edit, publish, archive or delete records in the CMS modules made available.

The frontend allowlist check is a usability gate, not the security boundary. RLS remains authoritative.

## 5. Current CMS modules

### News and publications
Fields: title, slug, excerpt, content, featured image URL, status and publication date.

Workflow:
1. Select **News & publications**.
2. Select **New record**.
3. Enter the title, slug and article content.
4. Keep the status as Draft while checking facts and source material.
5. Set Published only after editorial approval.
6. Save and inspect the public News page.

### Events
Fields: title, slug, description, venue, start/end date and time, registration URL, featured image URL and status.

Workflow:
1. Select **Events**.
2. Create or select an event.
3. Enter authorised event details only.
4. Save as Draft until date, venue and organiser approval are confirmed.
5. Publish after approval and check the public Events page.

### Gallery captions
Fields: title, caption, accessible alt text, storage path or already-public image URL, display order and status.

This module manages gallery metadata only. It does not upload image files. Do not place private or unapproved beneficiary photographs in the public bucket. General gallery upload support requires a separately designed storage bucket and RLS policies.

### Vision and mission
Fields: section type, title, content, published flag and display order.

Published records are read by the public Manifesto page. Keep unpublished records hidden until approved.

## 6. Public website behaviour

- `news.html` reads rows from `arise_site.news` where status is Published.
- `events.html` reads rows from `arise_site.events` where status is Published.
- `gallery.html` reads rows from `arise_site.gallery` where status is Published.
- `manifesto.html` reads rows from `arise_site.vision_mission_content` where published is true.
- The homepage reads the latest published news.
- Other profile and campaign pages retain explicit verification placeholders until their content model and approved source records are ready.

If the database request fails, the website does not invent content. It displays the safe placeholder or empty state.

## 7. Contact form status

The online contact form is intentionally disabled in this phase. The previous frontend expected a `portal_contact_submissions` table that does not exist in the live project. The form must not claim that an enquiry was submitted when no secure submission endpoint exists.

Before enabling it, implement and test server-side validation, spam/rate controls, consent capture, restricted access, data retention and privacy-request handling.

## 8. Verification checklist

- [x] Create a separate implementation branch.
- [x] Inspect the live `arise_site` tables and columns.
- [x] Confirm RLS is enabled on the existing tables.
- [x] Inspect public and administrator policies.
- [x] Confirm the schema has USAGE grants for anon and authenticated.
- [x] Configure the frontend with the project URL and publishable key only.
- [x] Align the CMS with existing tables rather than the nonexistent `portal_*` tables.
- [x] Correct the homepage's official candidate name and remove FICAP.
- [x] Update page metadata to use the approved full name.
- [ ] Verify browser sign-in with the authorised administrator account.
- [ ] Verify live public reads from GitHub Pages after deployment.
- [ ] Verify actual gallery object URLs and image permissions.
- [ ] Add an approved media upload workflow.
- [ ] Add a secure contact submission workflow.
- [ ] Expand the CMS for biography, career, public service, scholarships, philanthropy, achievements, projects and evidence after their data model is reviewed.

## 9. Troubleshooting

**CMS says the account is not authorised**
- Confirm the account can sign in through Supabase Auth.
- Confirm its Auth UUID is present in `arise_site.admins`.
- Confirm the account is not merely present in `hero_admins`; the two allowlists serve different functions.

**Public page is empty**
- Confirm the row exists in the correct `arise_site` table.
- Confirm status is exactly `published`, or for vision/mission set `published = true`.
- Check the RLS policy and browser network response.
- Confirm the custom schema is exposed in the Supabase Data API settings.

**Gallery image does not appear**
- Confirm `storage_path` is an already-public URL or points to an approved public object.
- The current gallery module does not upload files.
- Do not assume the `hero-slides` bucket is a general gallery bucket.

**Contact form is unavailable**
- This is intentional until a secure server-side submission workflow is implemented.

## 10. Training exercise

1. Sign in using an already-authorised administrator account.
2. Create a Draft news record with a test title and clearly labelled test content.
3. Confirm it does not appear on the public News page.
4. Publish the test record only in a controlled test environment.
5. Confirm it appears on the public page.
6. Return it to Draft or delete it after the test.
7. Repeat the workflow for an event and a vision/mission record.

Do not use fabricated claims, real beneficiary details or unapproved campaign material for training records.
