BENUE ARISE FOR HON — CAMPAIGN PORTAL PACKAGE
================================================

Brand: Benue Arise for Hon
Slogan: RESCUE | REBUILD | RESTORE
Candidate profile: Prof. Sebastine Tartenger Hon, SAN, FCIArb, DSSRS, FICAP
Political context: SDP · Benue State · 2027

WHAT IS INCLUDED
- Responsive public website with Home plus 13 detailed content sections.
- Biography, career, public service, scholarships, philanthropy, achievements,
  projects for all 23 LGAs, manifesto, evidence centre, news, gallery, events and contact.
- Search/filter interfaces and Nigerian date formatting.
- Supabase-backed published-record reading when configured.
- Secure-by-default CMS starter with sign-in and allowlisted roles.
- Review-only additive Supabase SQL migration; no SQL is run by uploading this ZIP.
- Existing SDP logo and candidate portrait assets are preserved.

PHONE-BASED GITHUB PAGES UPLOAD
1. Download this ZIP and extract it using your phone's Files app.
2. Open https://github.com/SamdioK/Benue-Arise-for-Hon
3. Add file -> Upload files. Upload the CONTENTS of this folder, including assets/.
4. Keep the assets folder and its files in their relative paths. Do not upload only the ZIP.
5. Commit the upload. If GitHub mobile cannot select all files, upload in manageable batches.
6. Enable/confirm GitHub Pages and reload the deployed site after the build finishes.

IMPORTANT: this is a safe additive site package, not a live commit. It does not connect to or modify your Supabase project automatically.

SUPABASE CONFIGURATION
1. Open config.js and set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY using your project's URL and publishable/anon key.
2. Never paste a service-role or secret key into browser JavaScript, GitHub, or this ZIP.
3. Before using the CMS, inspect your existing Supabase schema, API exposed schemas, grants, RLS policies, functions and storage. Review supabase_portal_cms_REVIEW_ONLY.sql line-by-line and back up first.
4. The SQL is additive and portal-prefixed, but still must be reviewed for existing objects and your project's current policy conventions. Do not run blindly.
5. If approved, apply in a non-production project first. Add a trusted administrator's Auth UUID manually to arise_site.portal_admins only after verifying it. Never add a service key to config.js.
6. Test as anonymous visitor, administrator, editor and reviewer. Public reads should show only published records; only administrator should delete records. Test contact spam controls before enabling submissions.
7. `arise_site` must be exposed in Supabase API settings to use the schema client. Confirm this is acceptable and RLS policies are effective before enabling it.

EDITORIAL SAFETY
- No invented biography, education, appointment, award, endorsement, project, scholarship, cost, outcome or beneficiary count is presented as fact.
- Records are placeholders until sourced. Policy areas are templates, not confirmed commitments.
- Obtain consent before publishing identifiable beneficiary information or photographs.
- Verify all public claims and confirm image rights before launch.

CURRENT LIMITATIONS / PRODUCTION CHECKLIST
- This CMS starter provides generic CRUD for the defined record modules, but rich text, revision history, scheduled publishing, detailed role-specific field permissions, media upload workflows, audit log UI, pagination and anti-spam CAPTCHA require further implementation/testing before representing the system as production-complete.
- Contact submissions need rate limiting/CAPTCHA and an approved retention policy.
- No database migration has been executed and no repository changes have been committed on your behalf.
