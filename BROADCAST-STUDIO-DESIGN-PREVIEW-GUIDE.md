# Broadcast Studio Design Preview — Review Guide

## Purpose
This page provides a visual and interactive demonstration of the proposed Benue Arise On-Air audio studio and Benue Arise Live video studio. It allows administrators and project reviewers to inspect the interface before a real broadcast provider or production workflow is activated.

## Access
1. Sign in to the Benue Arise administrator dashboard.
2. Open **Broadcast Control Centre**.
3. Select **Open Studio Design Preview**.
4. Switch between **Audio studio** and **Video studio**.

## Demonstration areas
- Audio studio: programme monitor, decorative waveform, simulated input-level meter, illustrative listener and stream-health figures, quality selector, recording and chat switches, schedule and sample recording library.
- Video studio: 16:9 programme output mock-up, preview simulation, quality selector, recording indicator, illustrative connection diagnostics and audience trend, upcoming event card, moderation and notice controls.
- Studio activity log: records interactions performed within the current page session.

## Safety and data handling
- The page is a static front-end demonstration. It does not connect to Mux, an encoder, a microphone, a camera, Supabase or any streaming provider.
- Every audience, bitrate, latency, health, schedule and recording value is sample data for visual review.
- Buttons and selectors change only the displayed demonstration state. No stream is created, no recording file is produced, no event is modified, and no database or browser persistent storage is used.
- The page must not be used to initiate or claim a real broadcast.

## Review checklist
1. Check the page on a mobile phone and a desktop-sized screen.
2. Switch between the audio and video studio tabs.
3. Test the demonstration play/pause, preview, quality and toggle controls.
4. Review readability, spacing, contrast, labels and the information hierarchy.
5. Record requested visual changes before connecting real broadcast operations.

## Expected outcome
Reviewers can inspect the proposed studio layout and demonstrate its visible controls without upgrading Supabase or provisioning a streaming service. Real streaming, provider analytics, moderation enforcement, recording storage and operational audit records remain separate implementation tasks.
