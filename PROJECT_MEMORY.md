# Project Memory: Khaaviya's Birthday Surprise Website

This document is the persistent memory and single source of truth for the development of Khaaviya's Birthday Surprise Website. It records all decisions, preferences, structures, and history to ensure consistency across updates.

---

## Project Overview
A premium, highly interactive digital birthday surprise countdown portal created specifically as a custom gift for **Khaaviya**. The user experience transitions from anticipation (countdown and memories) to a cinematic celebration when the countdown reaches zero on December 26.

---

## Person Details
* **Name**: Khaaviya
* **Wishes Accent**: "Khaaviya ❤️"
* **Target Audience**: Dedicated completely to her memories and birthday celebration.

---

## Birthday Details
* **Date**: December 26
* **Target Timing**: 00:00:00 (Midnight)
* **Automatic Roll-forward**: If the date has passed in the current year, the countdown dynamically shifts to December 26 of the following year.

---

## Website Requirements
The user experience follows a structured emotional flow:
1. **Mystery Intro**: A teaser screen saying *"For someone very special..."* that prompts the user to enter, which unlocks the browser audio context.
2. **Anticipation Portal**:
   * Header title: *"Something Special Is Waiting For You, Khaaviya ❤️"*
   * Subtitle: *"Your special day is getting closer..."*
   * Countdown Clock: DAYS | HOURS | MINUTES | SECONDS in large glowing cards.
   * Memories Slider: *"While you wait... here's a few memories ❤️"* showing her photos in an elegant animated gallery.
3. **Open a Memory Interactivity**: A button that opens a fullscreen typewriter text letter accompanying the active photo.
4. **December 26 Transformation (The Reveal)**:
   * Automatic dark screen fade when the countdown hits zero.
   * Cinematic title zoom: *"🎉 HAPPY BIRTHDAY 🎉 KHAAVIYA ❤️"*.
   * Full-screen celebratory canvas effects (fireworks, falling confetti).
   * Floating balloons rising from the bottom.
   * Memory Wall transition: Staggered reveal of all memory cards one by one.
   * Final birthday wish panel and card.

---

## Design & UI Decisions
* **Backdrop**: Deep velvet rose gradient radial backdrop for a premium romantic look.
* **Panels**: Translucent glassmorphism boards with blurred backdrops and glowing border frames.
* **Typography**: Clean, geometric modern sans-serif **Outfit** for interface labels, and elegant serifs **Playfair Display** for headers and typewriter quotes.
* **Themes**:
  1. *Romantic Velvet* (Default Rose/Burgundy theme)
  2. *Starry Gold* (Midnight Navy and gold accents)
  3. *Sweet Lavender* (Deep royal purple and lavender accents)
  4. *Ocean Coral* (Teal/aquamarine with coral accents)
* **Mobile Layout**: Replaces the desktop 3-card cinematic slideshow with a clean, touch-swipeable auto-playing horizontal carousel.

---

## Animations
* **Ken Burns Effect**: Slow scale and translation on active slideshow cards.
* **Glow Pulse**: Dynamic radial box shadows simulating glowing borders.
* **Floating Hearts**: CSS-based heart particles that float upwards with random sizes, swinging speeds, and rotations.
* **Balloons & Swing**: SVG balloons drifting up with lateral oscillation keyframes.
* **Fireworks & Confetti**: Custom HTML5 Canvas particle simulation running in a `requestAnimationFrame` loop.
* **Form Errors**: Shake effect translation for failed logins.

---

## Photos & Assets
* **Audio**:
  * Primary background audio: `music.mp3.mp3` or `music.mp3` or `assets/audio/music.mp3` or dynamic `music_url` fetched from Supabase settings.
  * Celebration background audio: `assets/audio/celebration.mp3` or hosted celebration lullaby.
  * *Fallback*: If local audio fails, the player automatically switches to hosted Mixkit CDN tracks.
* **Images**:
  * Real photos uploaded by the user are saved at `assets/photos/photo1.jpg` to `photo4.jpg`.
  * Dynamically uploaded cloud assets are fetched directly from the **Supabase Storage Bucket** `memories`.
  * *Fallback*: If local/cloud images fail to load, `onerror` handlers switch class states to display a styled glass gradient block and heart indicator.

---

## Birthday Messages
Individual cards carry detailed messages typed in a fullscreen modal:
1. **Memory Slot #1**: *"You look absolutely beautiful in this saree, Khaaviya! Every single detail of your presence brings a special touch of elegance and grace. ❤️"*
2. **Memory Slot #2**: *"Your birthday celebration is the highlight of the year! Seeing your glowing face next to your name in lights is the best sight ever. ✨"*
3. **Memory Slot #3**: *"Every moment shared with you is a memory I keep close to my heart. Thank you for being my constant source of joy and laughter. 🥂"*
4. **Memory Slot #4**: *"No flower or balloon background can ever shine brighter than your smile. Never stop being the magical person that you are! 💫"*
5. **Final Celebration Quote**:
   *"Every picture has a story.*
   *Every memory has a feeling.*
   *And today is all about you, Khaaviya. ❤️"*
6. **Final Card Title**: *"Happy Birthday, Khaaviya! 🎂❤️"*

---

## Features
* **Volume Control Toggle**: Mute/unmute background music.
* **Admin Login**: A lock icon routes to `/admin` which triggers a credential form:
  * **Username**: `kaaviya`
  * **Password**: `26/12`
  * *Authentication Mechanism*: Translates credentials to the Supabase Auth profile `kaaviya@birthday.com` (password `kaaviya_26_12`) under the hood to comply with password guidelines while preserving exact credentials.
* **Admin Panel Settings**:
  * Configure Countdown Target Name, Target Date, Audio URL, Intro titles/texts, and final wish letters stored in Supabase `birthday_settings` table.
  * Toggle between Velvet, Starry Gold, Sweet Lavender, and Ocean Coral layout themes.
* **Dropbox-Style Memories File Manager**:
  * Accessible at `/memories`. View-only for public guests, fully editable for the Admin.
  * Drag & drop upload, click to upload, progress bar tracking, image/video/PDF metadata previews.
  * Virtual folder creation, rename directories/files, download files, bulk check-selection, bulk move/delete.
  * **Gallery Integration**: Checkbox to toggle `is_gallery_photo` or `is_featured` on database metadata. Checking "Slideshow photo" feeds the image/video directly to the landing page slider without writing code.
* **Realtime Syncing**: Estabishes WebSocket connections so that database changes (adding files, changing countdown settings, deleting media) update instantly across all active client devices.

---

## Technical Decisions
* **Frontend Technology**: Next.js App Router (React.js)
* **Backend Database**: Supabase PostgreSQL (`files`, `folders`, and `birthday_settings` tables)
* **Cloud File Storage**: Supabase Storage (`memories` public bucket)
* **Security**: Row Level Security (RLS) on all tables/buckets. Authenticated admin writes, anonymous read SELECTs.
* **Hosting**: Automated deployment on Vercel connected to the GitHub repository.

---

## User Preferences
* Do not use fake/placeholder images; use actual photos of Khaaviya.
* Autoplay audio immediately after clicking the "Reveal the Surprise" gate.
* Build should deploy on Vercel (`https://kaaviya-one.vercel.app`).
* Changes made from one device must update and sync instantly across all devices.

---

## Pending Tasks
* None. All requirements met.

---

## Completed Tasks
* [x] Structure HTML countdown cards, sliders, and celebration elements.
* [x] Implement Glassmorphic CSS style files, variables, animations, and responsive layouts.
* [x] Initialize Git and Vercel routing configurations.
* [x] Bootstrapped Next.js App Router project and migrated styles to `app/globals.css`.
* [x] Configured Supabase database schema (`folders`, `files`, `birthday_settings`) and `memories` storage bucket.
* [x] Built Supabase Client utility (`lib/supabase.js`) and environment configs.
* [x] Built Main Countdown page React component with canvas fireworks and real-time syncing listeners.
* [x] Built secure Admin Dashboard settings page supporting credentials mapping and form variables updates.
* [x] Built Dropbox-style Memories File Manager with drag-n-drop uploads, directory structures, and slideshow checkboxes.
* [x] Documented system structure inside `ARCHITECTURE.md`.
* [x] Compiled all project files into a downloadable archive (`Khaaviya_Birthday_Project.zip`).

---

## Change History
* **16-Aug-2026**: Initial setup of countdown website structure, CSS formatting, and slideshow transitions.
* **16-Aug-2026**: Configured local audio elements and resolved Vercel 404 routing by setting repo origin to `https://github.com/lsuryaprasath1-sys/Kaaviya-.git`.
* **16-Aug-2026**: Replaced initial slideshow config with 4 real photo assets uploaded by the user.
* **16-Aug-2026**: Expanded Admin Panel with Controls tab, Themes tab, and Memories tab persisted via `localStorage`.
* **16-Aug-2026**: Added full video asset support (`videoUrl`) inside slideshow containers, carousel panels, and memory walls.
* **16-Aug-2026**: Upgraded codebase from static pages to **Next.js + Supabase Cloud backend** (PostgreSQL, Storage, Realtime, Auth), implementing the Dropbox-style Memories File Manager, administrative dashboard controllers, and real-time device synchronization.
