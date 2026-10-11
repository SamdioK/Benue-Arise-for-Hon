# Arise Movement for Hon — Public Website Starter (v1)

This is an **additive, reviewable starter package** for the public website. It is intentionally contained in its own folder so that it does not overwrite any files already in `SamdioK/Benue-Arise-for-Hon`.

## Existing repository inspection

The public repository currently lists `index.html`, `register.html`, `privacy.html`, `styles.css`, `app.js`, and `README.txt`. This package does not replace them. Review it locally first, then merge or copy files deliberately after backing up the repository.

## Contents

- Multi-page static site: Home, About, Vision & Mission, News, Article, Events, Gallery, Contact, Privacy.
- Reference-led campaign homepage with SDP green/red, orange, violet, navy, white and natural landscape/skin-tone accents; responsive multi-page design.
- Supabase client configuration template.
- A separate `arise_site` database schema migration, not applied automatically.
- An example Supabase Edge Function for contact submissions (needs rate limiting/CAPTCHA and deployment configuration before production).
- Supplied SDP logo and an optimized crop of the supplied Prof. Sebastine Tartenger Hon, SAN portrait composite are included in `assets/images/`. The full supplied composite is also retained as an optional gallery asset.

## 1. Add campaign assets

The supplied assets are already included in `assets/images/`:
- `sdp-logo.png` — supplied SDP logo.
- `hon-portrait.webp` — optimized crop for the homepage and profile layouts.
- `hon-campaign-composite.webp` — full supplied composite, including its caption panel.
Do not publish assets without authorization. Verify spelling of the official name, title, party designation, and all public claims before launch.

## 2. Configure Supabase

Edit `assets/js/config.js` and supply:
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

The publishable key is public by design. **Never put a Supabase secret/service-role key in this website.**

The SQL migration creates a separate `arise_site` schema and its tables. It does not run itself. Inspect it and take a backup before applying it. To access a custom schema through the Supabase Data API, add `arise_site` to the project's exposed schemas in API settings, then run the migration as a database owner. The migration includes grants and RLS policies, but production security must still be tested.

Contact messages are **not** inserted directly from the browser. The example form expects a deployed Edge Function endpoint. Deploy `supabase/functions/contact-message`, configure its environment, and add rate limiting and a CAPTCHA/anti-spam mechanism before accepting real submissions. If not configured, the form explains that the channel is not yet available.

## 3. Preview locally

Open `index.html` directly for the visual pages. For Supabase modules, use a local static server (for example VS Code Live Server), because browser module imports and fetch calls can behave differently from `file://`.

## 4. GitHub Pages

Copy the approved files into the repository only after review. GitHub Pages needs `index.html` at the configured publishing root. Because this package is nested, do not enable Pages to publish this package subfolder unless you intentionally configure a build/deployment workflow. The simplest safe option is to review and merge its files into the existing publishing root manually.

## 5. Before launch

- Replace all placeholders and sample text with approved factual content.
- Confirm candidate/party details and use the approved SDP logo and portrait.
- Configure privacy notice, data retention, consent language, and the responsible data controller's contact details.
- Test RLS allow/deny behavior as anonymous and authenticated users.
- Test mobile layout, keyboard navigation, contrast, broken links, social previews, and low-bandwidth performance.
- Do not collect voter preference, political opinions, or other sensitive information through a public form unless the organization has established a lawful basis, necessity, safeguards, and appropriate legal review under applicable Nigerian data-protection law.
