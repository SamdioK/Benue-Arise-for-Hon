# Phase 2 — Profile, Project and Evidence CMS Manual

## Purpose
This phase adds one structured record table for the profile and campaign information pages that were not covered by the original CMS. It keeps biography, legal and academic career, public service, scholarships, philanthropy, achievements, projects and evidence in one consistent, filterable content model.

## Database
Table: `arise_site.profile_records`

Core fields:
- `section_key`: one of biography, legal_academic, public_service, scholarships, philanthropy, achievements, projects or evidence.
- `title`, `slug`, `category`: record identity and classification.
- `excerpt`, `body`: short and full text.
- `location`: location, LGA or community where relevant.
- `source_url`, `evidence_url`: primary source and supporting evidence.
- `verification_status`: Verified, Official Record, Campaign Statement or Under Verification.
- `status`: draft, published or archived.
- `published_at`, `created_by`, `created_at`, `updated_at`: publication and audit metadata.

A unique constraint prevents duplicate slugs within the same section. Check constraints validate section keys, publication status, verification status, slug format and title length. Indexes support section/status/date listing and category filtering. An update trigger maintains `updated_at`.

## Security
- RLS is enabled.
- Anonymous and authenticated users may select only rows with status `published`.
- Authenticated administrators may manage rows when `arise_site.is_admin()` returns true.
- Assigned Profile Managers may manage `profile_records` only when `arise_site.is_profile_manager()` returns true. They receive no access to other CMS modules or site assets.
- Explicit Data API grants are present: SELECT to anon/authenticated; INSERT, UPDATE and DELETE to authenticated.
- Schema USAGE is granted to anon and authenticated.
- Do not add service_role or secret keys to browser code.

Supabase Data API schema exposure is a separate dashboard setting. Confirm `arise_site` is listed under Settings → API → Exposed schemas before browser testing. Grants and RLS do not automatically add a schema to the exposed schema list.

## Profile Manager role and access

The Administrator dashboard supports a separate **Profile Manager** role. An administrator first creates the person’s Auth account in Supabase Authentication, then assigns that existing user from the **Profile Manager users** section using the Auth user UUID, full name and email. The dashboard lists assigned managers and allows an administrator to revoke access.

A Profile Manager signs in through the same `admin.html` page. The workspace is restricted to `profile_records`; the content-module selector and site-assets manager are disabled or hidden. The database enforces this separation through RLS: Profile Managers can manage profile records only and cannot manage news, events, gallery, vision/mission content or manager assignments. Access is removed by revoking the assignment; the Auth account itself is not deleted.

## Administrator workflow
1. Open `admin.html` and sign in with an authorised administrator account.
2. Select **Biography, career, projects & evidence**.
3. Choose **New record**.
4. Select the destination website section.
5. Enter a concise title and a lowercase hyphenated slug.
6. Add a short summary and full text.
7. Add location only where relevant.
8. Add the primary source and supporting evidence URLs where available.
9. Select the accurate verification status. Do not label a campaign statement as an official record.
10. Save as Draft while review is pending.
11. Publish only after source checking and editorial approval.
12. Open the corresponding public page and verify that the published record and evidence links render correctly.

## Public page mapping
| CMS section key | Public page |
|---|---|
| biography | biography.html |
| legal_academic | legal-academic.html |
| public_service | public-service.html |
| scholarships | scholarships.html |
| philanthropy | philanthropy.html |
| achievements | achievements.html |
| projects | projects.html |
| evidence | evidence.html |

Public pages query only the matching section and published status. They display verification labels and source/evidence links when provided. If there are no published records, the page shows a cautious placeholder or empty state.

## Editorial and privacy safeguards
- Verify qualifications, professional designations, offices, awards, project ownership, dates, locations and outcomes against reliable records.
- Do not invent programme numbers, beneficiaries, amounts, project status or outcomes.
- Obtain consent before publishing identifiable beneficiary details, photographs or personal stories.
- Do not upload confidential documents or private personal data to public storage.
- Use only authorised source URLs. Test external links before publishing.

## Test checklist
- [ ] Assign an existing Auth user from **Profile Manager users** using the exact Auth UUID.
- [ ] Sign in as that user and confirm only profile records are available.
- [ ] Confirm the site-assets manager and Profile Manager user controls are hidden for the Profile Manager.
- [ ] Attempt direct Data API writes to news, events, gallery and vision/mission as Profile Manager; each must be denied by RLS.
- [ ] Revoke the assignment and confirm the user can no longer enter the CMS.
- [ ] Confirm `arise_site.profile_records` exists.
- [ ] Confirm RLS is enabled and the two policies are present.
- [ ] Confirm explicit grants for anon and authenticated.
- [ ] Confirm `arise_site` is enabled in Supabase Exposed schemas.
- [ ] Sign in with an authorised administrator.
- [ ] Create a Draft test record and confirm it is not public.
- [ ] Publish a non-sensitive test record and confirm it appears only on its mapped page.
- [ ] Confirm source and evidence links open safely.
- [ ] Return the test record to Draft or delete it.
- [ ] Test on a mobile browser.

## Troubleshooting
**The new module does not load:** verify the Data API exposes `arise_site`, the table grants are present and the browser has refreshed its schema cache.

**An unauthorised user cannot edit:** expected. Check the Auth user UUID against `arise_site.admins`; the separate `hero_admins` allowlist is not sufficient.

**A record is missing from a public page:** check `section_key`, `status = 'published'`, and whether the row has a matching page.

**A source link is not visible:** confirm that a valid URL was saved in the correct field and the record is published.

## Current limitations
This phase manages structured text and source links. It does not yet upload files, create a document repository, implement revision history, schedule publication, or provide a contact-enquiry backend. Those functions require separate reviewed workflows.
