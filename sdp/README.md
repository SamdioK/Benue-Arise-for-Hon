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


### Hero artwork refinement (15 November 2026)
- Removed the floating top and bottom rectangular callout panels around the circular hero emblem.
- Removed the duplicate `SOCIAL DEMOCRATIC PARTY` caption beneath the emblem because the supplied party logo already carries that wording.
- Removed the orange star-like decorative symbol from the lower-right of the hero artwork.
- Kept the circular logo container, party emblem, orbital rings, and existing green/orange visual identity intact.


### Featured hero media gallery
- The circular artwork area is now a reusable featured-media gallery, rather than a single static logo treatment.
- Current entries: **SDP Official Logo** and **Benue SDP Politics**, each with its own name, alternative text and short caption displayed below the circular media stage.
- Image slides fade automatically between entries; previous/next controls are available for manual navigation. The media stage scales responsively and preserves each logo's aspect ratio inside the enlarged circular presentation.
- The gallery structure also supports future short video entries: add a `figure.hero-gallery-slide` with `data-kind="video"`, `data-title`, `data-caption`, and `data-duration` (10,000–15,000 milliseconds), containing a muted, plays-inline `video` element with its source. Video entries are played when active and advance after their configured duration.
- Future approved portraits, leadership photographs, candidate images, event photographs and short clips can be added as individual slides with descriptive names and optional captions. Do not publish unverified identity or event claims in captions.


### Circular logo masking and transparent backgrounds
- The hero media window is a true circular clipping area. Any square/rectangular corners or artwork points extending beyond its circular boundary are hidden.
- The official SDP vector artwork is used without its former white rectangular page background.
- The Benue SDP Politics WebP artwork retains its transparent background; both marks now sit directly over the portal's green hero artwork rather than on a solid cream disc.
- Both images preserve their aspect ratio with `object-fit: contain`, while the circular media window clips any content at its perimeter. The circular orbital treatment remains as the gallery frame.
