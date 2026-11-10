# Phase 4 — Welcome, News and Announcements Ticker

## Purpose
Provide a continuous, filling-station-style welcome strip immediately beneath the main campaign header. The ticker introduces the website to visitors and can automatically include published news headlines from the administrator CMS.

## Position and appearance
- The ticker is inserted directly after the site header and before the homepage hero.
- It uses the campaign's deep green background, orange section label and purple News link.
- The welcome text scrolls continuously from right to left.
- Hovering over the ticker or focusing a link pauses the animation.
- On narrow screens, the strip remains horizontally compact and legible.
- When a visitor requests reduced motion, the animation is disabled and the ticker content remains available for horizontal reading.

## Default welcome message
> WELCOME TO BENUE ARISE FOR HON! This is the official campaign website of the 2027 SDP Gubernatorial Candidate in Benue State, Prof. (Chief) Sebastine Tartenger Hon, SAN, FCIArb, DSSRS, Sema-Wan u Tiv. Explore our vision, follow our activities and join the movement for a peaceful, prosperous and progressive Benue State. Together, let us rescue and rebuild Benue in 2027.

## Dynamic headlines and announcements
- The ticker queries the existing `arise_site.news` table.
- Only records with `status = 'published'` are eligible.
- The latest 12 published titles are added after the welcome message.
- Each headline links to the corresponding news page anchor where a slug is available.
- Newly published items appear when the page is loaded again; the ticker does not expose drafts.
- The existing news CMS remains the editorial publishing route. Administrators should publish an announcement through that CMS as a news item, with a clear announcement title/category in its content. The ticker uses the published title.

## Security and accessibility
- Uses the existing public Supabase client and public-read RLS policy; no privileged key is used.
- Headline text and slugs are HTML-escaped before insertion.
- The static welcome message remains available if Supabase is unavailable.
- The ticker has an accessible label and its decorative duplicate loop is hidden from assistive technology.
- Animation pauses on hover/focus and respects reduced-motion preferences.

## Files changed
- `index.html` — adds the ticker directly below the header.
- `styles.css` — adds continuous ticker animation, responsive layout and reduced-motion behaviour.
- `portal.js` — loads published news titles and duplicates the ticker content for seamless looping.

## Verification checklist
- [x] Ticker is positioned immediately after the main header.
- [x] User-provided welcome text is included verbatim, with punctuation and credentials separated by commas.
- [x] Published news titles are fetched from the existing CMS table.
- [x] Draft news is excluded by the published status filter.
- [x] Welcome message remains the fallback if Supabase is unavailable.
- [x] Mobile and reduced-motion styles are included.
- [ ] Verify live appearance on Android after deployment.
- [ ] Publish a test news item and verify it appears in the ticker after deployment.

## Deployment
Changes are committed to `implementation/brand-and-foundation` only. No merge to `main` or live deployment is performed in this phase.


## Phase 5 — Motion refinement
- Orange label "BENUE ARISE UPDATE" now fades/slides into view periodically on a seven-second cycle, rather than remaining visually static.
- Continuous headline track speed increased from 105 seconds to 52 seconds per full loop for a moderately faster reading pace.
- Reduced-motion preference disables both the ticker and label animation while retaining readable content.
