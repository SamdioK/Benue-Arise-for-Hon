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


### Hero gallery presentation correction
- Restored the previous logo artwork source for the SDP Official Logo.
- Removed the circular disc, orbit rings and circular hero decoration from the logo display.
- Both gallery images now sit directly on the existing forest-green hero background, without a circular container or added image frame.
- The gallery caption and previous/next controls remain below the artwork.


### SDP gubernatorial candidate profile integration
- Added a featured profile for **Prof. (Chief) Sebastine Tartenger Hon, SAN, FCIArb, DSSRS, Sema-Wan u Tiv**, identified by the Benue Arise for Hon campaign website as its **SDP Gubernatorial Candidate · 2027**.
- Reused the source campaign portrait at https://atstsekevoozausbiqbi.supabase.co/storage/v1/object/public/site-assets/campaign/candidate-portrait.jpg.
- Transferred the eight official public-profile module headings from the source profile page. The source site's own profile introduction states that detailed records are published as supplied, reviewed and approved; the SDP portal therefore does not invent a longer biography or unsupported achievements.
- Added a direct link to the source campaign website's Official Public Profile.
- Further candidate profiles remain subject to confirmation and approval.


### LGA → ward → polling-unit directory
- The Benue 23 LGAs directory is an interactive three-level electoral geography explorer.
- Selecting an LGA retrieves its verified register rows from the same public.benue_polling_units source used by SDP-BESR, in Supabase project mcbwbcqetrrwxfqfvhkc. The browser uses only the project's publishable key; row visibility remains governed by Supabase RLS.
- The LGA summary displays the number of distinct verified wards and verified polling-unit records returned for that LGA.
- Wards are grouped by source ward code and ward name, sorted numerically by ward code, and displayed with each ward's polling-unit count.
- Selecting a ward displays its polling units with name, PU code, full register code and location where recorded. Missing locations are labelled as not recorded; none are inferred.
- The layout uses two columns on wider screens and stacked panels on mobile.
- SDP-BESR's directory is documented as containing 23 LGAs, 276 wards and 5,102 polling-unit records. Live counts here are calculated from rows marked verification_status = verified; they are not hard-coded totals.
- If the directory cannot be reached, the interface displays an error state rather than substituting fabricated or locally stored records.
- The portal reads directly from SDP-BESR's source; electoral records are not copied into browser storage or duplicated in the Benue Arise database.
