# Phase 8 — Dedicated Supabase Storage for Permanent Site Assets

## Completed
- Created public bucket `site-assets` in Supabase project `atstsekevoozausbiqbi`.
- Enforced 10 MiB maximum file size.
- Allowed MIME types: JPEG, PNG, WebP and SVG.
- Added public read policy for campaign website delivery.
- Added authenticated admin-only insert, update and delete policies using `arise_site.is_admin()`.
- Verified bucket configuration and all four policies directly in the live database.
- Added an administrator upload and asset-management section to `admin.html` / `admin-portal.js`.
- The uploader places files in the `campaign/` folder, lists uploaded assets and provides public URLs.
- Existing browser-session persistence remains disabled in the administrator client.

## Important remaining migration step
The existing repository image files (including the SDP logo and candidate portrait) have not yet been copied into the new bucket or switched over to Storage URLs. The connected GitHub/Supabase tools in this session can create the bucket, policies and upload workflow, but do not expose a binary file-upload operation for copying repository image bytes directly into Storage. Do not mark the static asset migration complete until those files have been uploaded and their page references changed and verified.

## How to complete the binary migration
1. Deploy the implementation branch to the preview site.
2. Open the administrator page and sign in with an authorised administrator account.
3. In “Permanent site assets · Supabase Storage”, select the current logo, candidate portrait and other permanent images and upload them.
4. Copy each resulting public URL.
5. Replace the matching static image references in the website with the Supabase Storage URLs.
6. Verify each URL loads and confirm the website no longer references local repository image paths for those migrated assets.

## Security
- Public read is intentional for public campaign artwork.
- Only authenticated users passing `arise_site.is_admin()` can upload, update or delete files.
- No service-role key is exposed in browser code.
- The bucket is separate from the existing `hero-slides` bucket; its policies do not alter that bucket.

## Deployment and status
- Database bucket and policies: applied and verified.
- Admin upload interface: committed to implementation branch.
- Actual binary image transfer and public-page URL replacement: pending administrator upload and subsequent reference update.
- No merge to `main` or production deployment was performed.
