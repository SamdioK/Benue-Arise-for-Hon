# Phase 3 — Campaign Homepage Redesign & Public Content Panels

## Purpose
This phase reshapes the public homepage around the campaign dashboard reference supplied by the project owner. It adds a desktop campaign header and hero, six quick-access modules, a homepage content dashboard, an events panel, a campaign-media panel and a responsive mobile layout.

## Files changed
- `index.html` — replaces the previous text-led landing page with the campaign homepage structure.
- `styles.css` — adds the reference-led campaign visual system and mobile breakpoints while retaining existing page styles.
- `portal.js` — loads published news, future published events and published gallery metadata from Supabase.
- `assets/sdp-logo.svg` — adds a lightweight vector campaign identity mark so the header no longer displays a broken image.

## Homepage modules
1. Campaign header: campaign identity, About, Vision, Newsroom, Media and Get Involved navigation.
2. Hero: candidate name and approved credentials, Benue-forward headline, vision and movement actions.
3. Quick links: candidate profile, policy agenda, news, events, gallery and Get Involved.
4. News: reads up to three published records from `arise_site.news`.
5. Upcoming events: reads up to three future published records from `arise_site.events`, ordered by start time.
6. Media gallery: reads up to three published records from `arise_site.gallery`, ordered by display order.
7. Support and movement calls to action: direct visitors to the contact page for authorised information. No donation processing or membership database is implied by these links.
8. Footer: profile, vision, privacy, contact and administrator links.

## Responsive behaviour
- Desktop: campaign header and multi-column dashboard.
- Tablet: compact navigation and rearranged dashboard columns.
- Mobile: accessible menu toggle, stacked hero, two-column quick links, stacked content panels and single-column gallery.

## Supabase behaviour
- Public homepage modules use the configured Supabase client and the `arise_site` schema.
- Only records with `status = 'published'` are requested.
- Events are restricted to future `starts_at` values.
- No placeholder campaign news, event or gallery records are inserted into the database.
- Empty-state text is shown when there are no approved records.

## Editorial and asset safeguards
- The actual high-resolution candidate portrait was not present in the repository or supplied as a separate original asset. The homepage therefore uses a clearly labelled portrait placeholder, not an invented or AI-generated likeness.
- The SVG campaign identity mark is a temporary vector stand-in; replace it with the authorised original SDP logo asset when supplied.
- Donation and movement links route to Contact. They do not collect money, promise registration or claim that an online workflow exists.
- No unverified rally, news, event, social account or campaign contribution claims have been invented.

## Verification checklist
- [x] Homepage structure includes all proposed dashboard modules.
- [x] Header logo path now resolves to a repository asset.
- [x] Homepage queries use existing `news`, `events` and `gallery` table names and known columns.
- [x] Published-only filters are applied.
- [x] Mobile-specific layout rules are included.
- [ ] Actual candidate portrait supplied and installed.
- [ ] Original authorised SDP logo supplied and installed.
- [ ] Admin publishes approved news, events and gallery records for live content testing.
- [ ] Android browser visual test completed after GitHub Pages deployment.
- [ ] Deployment verified on the public URL.

## Deployment note
Changes are committed only to `implementation/brand-and-foundation`. This phase does not merge to `main`, change GitHub Pages settings or claim a live deployment. A separate review and deployment approval is required.
