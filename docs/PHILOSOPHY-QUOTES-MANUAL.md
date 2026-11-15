# Philosophy & Quotes — Interaction Manual

## Purpose
The Philosophy & Quotes page presents approved quotations attributed to Prof. S. T. Hon with navigation, Love/Like reactions, public comments, correction-by-edit-code and branded image sharing.

## Public interface
- Select a quote card to open its full-screen presentation.
- Use Previous and Next to move between featured quotations.
- Love and Like reactions are stored once per quote and network/browser fingerprint.
- Comment opens the discussion form. Visitors may post without signing in.
- Share artwork creates a 1080 × 1350 branded PNG and uses the device share sheet when image-file sharing is supported. If not, the PNG is downloaded for manual attachment.
- Comment totals count approved comments. The visible list shows the latest 100 approved comments.

## Comment workflow
1. Enter an optional display name and a comment of 2–1,200 characters.
2. Submit. The server checks a conservative set of profanity, slur, direct-insult and threat patterns.
3. Comments that pass are published immediately. Potentially abusive comments are stored as held and are not shown publicly.
4. The server returns a one-time private edit code and a comment reference. Keep both safe.
5. To correct a comment, open the correction panel, enter the reference, edit code and corrected text, then save.
6. Edited text passes through the same moderation check. A flagged edit is held.

## Moderation limits
The current moderation is deterministic phrase/pattern screening, not an AI model. It aims to catch explicit abuse while allowing respectful disagreement and political criticism. It can miss coded/contextual abuse and can occasionally flag harmless wording. Held comments appear in the administrator CMS moderation queue. Administrators can approve and publish acceptable comments or remove comments that violate the discussion rules.

## Data and security
- Comments, reactions and rate-limit records are stored in Supabase schema `arise_site`.
- RLS is enabled. Direct anonymous/authenticated table access is revoked; the Edge Function performs permitted operations with the server-side Supabase secret.
- Edit codes are random, returned at submission, and stored as SHA-256 hashes. They expire after 365 days.
- Comment posting is rate-limited to five submissions per IP/user-agent fingerprint per five minutes; edit attempts are limited to ten per five minutes.
- Reactions are deduplicated by quote, reaction type and network/user-agent fingerprint.
- No persistent browser storage is used.

## Operational follow-up
A moderator review interface and an advanced contextual moderation provider can be added separately. Social platforms that accept image-file sharing receive the PNG itself. When image sharing is unavailable, visitors download the artwork and attach it manually.
