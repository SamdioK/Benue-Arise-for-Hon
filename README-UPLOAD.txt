# Benue Arise for Hon — flat GitHub upload package

Every website file in this package is in the repository root. You do not need to create folders on your phone. Upload the files individually from GitHub's Add file → Upload files screen.

## Upload these files
- index.html, about.html, article.html, contact.html, events.html, gallery.html, news.html, privacy.html, vision.html
- styles.css, config.js, site.js, sdp-logo.png
- hon-portrait.webp (add your approved standalone portrait as this file; until then, the page's fallback placeholder is shown)

The SQL file and function reference are NOT website assets and will not run merely by uploading them. They are included for reference only. Do not execute the SQL until its tables, grants, and RLS policies have been reviewed against the live Supabase project. The Edge Function must be deployed through Supabase's supported function workflow, not just uploaded to the repository root.

## Supabase configuration
Open config.js after upload and enter only your project URL and publishable/anon key. Never place a service-role or secret key in browser JavaScript. Do not turn off RLS. Confirm the database schema and policies first.

## Upload on a phone
1. Download and extract this ZIP using your phone's file manager.
2. Open the GitHub repository and choose Add file → Upload files.
3. Select all the extracted files together, keeping them at the root (do not upload the enclosing ZIP).
4. Commit the changes. If GitHub does not let you select all files at once, upload in batches.
5. Open GitHub Pages and hard-refresh/reload after deployment.

Official identity: **Benue Arise for Hon**. Official slogan: **RESCUE | REBUILD | RESTORE**.
