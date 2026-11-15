# Benue SDP Politics — Phase 1 Portal Foundation

## Purpose
Create an independent, responsive Benue SDP Politics portal integrated into the Benue Arise for Hon website. The portal uses the existing SDP logo and a distinct visual identity, layout and navigation.

## Access
- Public portal: `/sdp/`
- Legacy entry URL: `/benue-sdp-politics.html` (redirects to `/sdp/`)
- Return link: Benue Arise for Hon, from the portal utility bar and footer.

## Phase 1 deliverables
- Independent portal homepage and brand header using the existing SDP logo.
- Dedicated desktop navigation and mobile hamburger menu.
- About, leadership, candidates, policies, 23 LGAs, newsroom, events, membership, donations and contact sections.
- Search filter for the 23 Local Government Area directory.
- Responsive layouts for mobile, tablet and desktop.
- Cross-navigation from the existing campaign website.
- Reduced-motion support and keyboard-accessible menu controls.

## Content integrity
Candidate names, leadership identities, official policy positions, membership rules, donation channels and contact details are not fabricated. The portal clearly identifies areas awaiting verified content and authorised processes.

## Membership and donations
The public portal currently introduces these modules but does not collect applications or payments. Activation requires the authorised party membership process, data requirements, approved collection arrangements, payment provider integration and Supabase-backed workflows.

## Data and security
Phase 1 is a static presentation layer. It does not write to Supabase, create persistent browser storage, or claim that membership or donation services are operational. Later modules must store permanent data in Supabase Database and media in Supabase Storage, enforce RLS and role-based permissions, and verify successful server-side operations.

## Validation checklist
- [x] HTML structure created.
- [x] CSS stylesheet created.
- [x] JavaScript syntax checked.
- [x] Responsive navigation controls implemented.
- [x] LGA search interaction implemented.
- [x] Existing campaign-site navigation links redirected to the new portal path.
- [ ] Verify GitHub Pages deployment and test on actual Android and desktop browsers.
- [ ] Replace pending content with party-approved information.
- [ ] Build and secure separate administration portal.
- [ ] Implement and test Supabase-backed membership and donations modules.

## Files
- `sdp/index.html`
- `sdp/portal.css`
- `sdp/portal.js`
- `sdp/README.md`
- `benue-sdp-politics.html` (legacy redirect)
