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
  * Primary background audio: `music.mp3.mp3` or `music.mp3` or `assets/audio/music.mp3`.
  * Celebration background audio: `assets/audio/celebration.mp3`.
  * *Fallback*: If local audio fails, the player automatically switches to hosted Mixkit CDN tracks.
* **Images**:
  * Real photos uploaded by the user are saved at:
    * `assets/photos/photo1.jpg` (Saree elegance)
    * `assets/photos/photo2.jpg` (Birthday marquee lights)
    * `assets/photos/photo3.jpg` (Couple portrait)
    * `assets/photos/photo4.jpg` (Rainbow balloon bouquet)
  * *Fallback*: If local images fail to load, `onerror` handlers switch class states to display a styled glass gradient block and heart indicator.

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
* **Admin Login**: A lock icon next to the volume button triggers a credential form:
  * **Username**: `kaaviya`
  * **Password**: `26/12`
* **Admin Panel Settings**:
  * *Controls*: Launch celebration immediately (for previewing) or reset state.
  * *Themes*: Toggle between Velvet, Starry Gold, Sweet Lavender, and Ocean Coral.
  * *Memories Editor*: Edit URL paths, add optional Video URLs (MP4 files), change captions, and overwrite modal typewriter texts.
* **Local Storage Integration**: Active themes and memory configurations are stored in the browser's `localStorage` so changes persist on reload.
* **Video Asset Support**: Both the desktop slideshow, mobile carousel, modal popup, and memory wall support video rendering automatically if a `videoUrl` is present.

---

## Technical Decisions
* **Tech Stack**: Vanilla HTML5, CSS3, ES6 JavaScript. No framework overhead.
* **File Separation**: Clean distribution across `index.html`, `style.css`, and `script.js`.
* **Hosting**: Automated deployment on Vercel connected to the GitHub repository.
* **Repository Layout**: Pushed directly to the root of the repository to prevent 404 errors.
* **Offline Portability**: Includes a pre-configured [Khaaviya_Birthday_Project.zip](file:///D:/KHAAVIYA/Khaaviya_Birthday_Project.zip) compilation containing all files.

---

## User Preferences
* Do not use fake/placeholder images; use actual photos of Khaaviya.
* Prefer simple local image and audio paths so they can be overwritten easily.
* Autoplay audio immediately after clicking the "Reveal the Surprise" gate.
* Build should deploy on Vercel (`https://kaaviya-one.vercel.app`).

---

## Pending Tasks
* None. All requirements met.

---

## Completed Tasks
* [x] Structure HTML with Intro gate, Countdown cards, Slideshow components, and Celebration overlays.
* [x] Implement Glassmorphic CSS style files, variables, animations, and responsive media rules.
* [x] Integrate real photo uploads and map configuration keys.
* [x] Add Admin lock button and form validator (Username: `kaaviya`, Password: `26/12`).
* [x] Write script engine handling countdown ticks, autoplay transitions, typewriter modalities, and custom HTML5 canvas particles (Fireworks/Confetti).
* [x] Set up local audio handling with nested `<source>` tracks and online CDN error handlers.
* [x] Resolve Vercel 404 error by git-initializing local workspace and force-pushing files directly to the root of the `lsuryaprasath1-sys/Kaaviya-` repository.
* [x] Create Admin Theme Settings tab supporting Velvet, Starry Gold, Sweet Lavender, and Ocean Coral.
* [x] Create Admin Memories configuration forms supporting URLs, Captions, Details, and optional Video URL fields, saved in `localStorage`.
* [x] Compile all final project structures into a portable ZIP package.

---

## Change History
* **16-Aug-2026**: Initial setup of countdown website structure, CSS formatting, and slideshow transitions.
* **16-Aug-2026**: Configured local audio elements and resolved Vercel 404 routing by setting repo origin to `https://github.com/lsuryaprasath1-sys/Kaaviya-.git` and force-pushing to the main branch root.
* **16-Aug-2026**: Replaced initial slideshow config with 4 real photo assets uploaded by the user (`photo1.jpg` to `photo4.jpg`).
* **16-Aug-2026**: Expanded Admin Panel with Controls tab (Celebration trigger & reset state), Themes tab (Velvet, Starry Gold, Sweet Lavender, Ocean Coral), and Memories tab (Image URLs, Video URLs, Captions, Messages) persisted via `localStorage`.
* **16-Aug-2026**: Added full video asset support (`videoUrl`) inside slideshow containers, carousel panels, modal windows, and staggered memory wall grids.
