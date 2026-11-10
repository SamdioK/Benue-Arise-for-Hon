BENUE ARISE FOR HON — PUBLIC INFORMATION PORTAL

Official profile name:
Prof. (Chief) Sebastine Tartenger Hon, SAN, FCIArb, DSSRS, Sema-Wan u Tiv.

Project:
- Public information and campaign portal for Benue Arise for Hon.
- SDP identity and approved green, orange and violet visual direction.
- Responsive HTML/CSS/JavaScript frontend hosted through GitHub Pages.
- Supabase project: atstsekevoozausbiqbi.
- Supabase schema: arise_site.

Frontend configuration:
- config.js contains the project URL and public publishable key only.
- Never place a Supabase secret or service_role key in browser code.
- Public access depends on the RLS policies in arise_site.

Live public content integration:
- news: published news and publications.
- events: published public engagement events.
- gallery: published gallery captions and metadata.
- vision_mission_content: published vision and mission content on the manifesto page.
- profile_records: biography, legal and academic career, public service, scholarships, philanthropy, achievements, projects and evidence records.
- Profile pages read only their matching published section from profile_records. Pages with no approved records retain cautious placeholders.

Homepage experience:
- Campaign-style responsive homepage with hero, quick links, news, upcoming events, gallery and support/get-involved panels.
- Homepage news, events and gallery panels read published records from arise_site.
- Candidate portrait and authorised original SDP logo remain pending separate approved assets; no unverified likeness is used.
- See PHASE-3-HOMEPAGE-REDESIGN-MANUAL.md.

Administrator CMS:
- admin.html uses Supabase Auth email/password.
- Access is checked against arise_site.admins and protected again by database RLS.
- Current CMS modules: news, events, gallery captions, vision and mission.
- Draft records are not shown publicly.
- The CMS does not yet provide general media upload, contact enquiry processing, audit-history UI, or full profile/project/achievement editing.

Storage:
- Existing public bucket: hero-slides.
- Its upload/delete policies are restricted to the separate hero_admins allowlist and per-user folders.
- Do not assume this bucket is a general gallery upload bucket.
- Gallery records may reference an already-public image URL or an approved storage path.

Privacy and editorial safeguards:
- Online contact form submission is intentionally disabled until server-side validation, spam controls, access rules and retention policy are implemented.
- Do not publish beneficiary identities or photographs without appropriate consent.
- Verify professional credentials, biography, achievements, project claims and campaign statements against approved evidence before publication.

Deployment:
- Publish from the implementation branch only after review and merge.
- See PHASE-1-IMPLEMENTATION-MANUAL.md and PHASE-2-PROFILE-CMS-MANUAL.md for the workflows, safeguards and current limitations.
