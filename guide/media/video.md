# Video (YouTube lectures and explainers)

A minimal, repeatable setup for someone new to video. The style system supplies the graphics;
recording and editing use standard free tools.

## Pipeline

1. **Script and slides.** Write the script; build slides in the deck toolchain. Slides are the
   main visual for lectures.
2. **Record.** OBS Studio: 1920×1080, 30 fps (60 for fast screen motion), MKV or MP4, separate
   audio track for the microphone. A cardioid USB or XLR microphone matters more than the camera.
3. **Edit.** DaVinci Resolve (free) or Kdenlive. Cut silences, add title card, lower third,
   chapter cards and the end card.
4. **Graphics from bausk-style.** Title cards, lower thirds, chapter cards and thumbnails are HTML
   in the look (`bs-video`, `bs-titlecard`, `bs-lowerthird`, `bs-thumb__words`). Export stills with
   `bausk-style shot card.html --width 1920` (PNG). For animated graphics with transparency use
   Remotion (React; it can import `bausk-style` directly). Check Remotion's licence terms before using
   it for the company: it is free for individuals and small teams and paid above that.
5. **Sound.** Normalise to about −14 LUFS integrated, true peak below −1 dBTP (YouTube plays back
   around −14). Light noise reduction; no music under speech, or at −25 dB or lower.
6. **Captions.** Generate with Whisper (local) → SRT, correct the terms, upload both Ukrainian and
   English tracks.
7. **Thumbnail.** 1280×720 PNG under 2 MB: at most four words in the display face, one real image
   from the video (a frame, a diagram, the A* board), the look's colours. No faces with exaggerated
   expressions, no arrows and circles.
8. **Upload.** Title states the content ("Visual odometry for drones without GPS, in 12 minutes"),
   chapters in the description (00:00 format), links to the article/DOI and slides.

## Specs

| Item | Value |
|---|---|
| Frame | 1920×1080 (or 3840×2160), 16:9, 30/60 fps |
| Title-safe / action-safe | 5 % / 3.5 % margins (`--bs-video-title-safe`, `--bs-video-action-safe`) |
| Smallest text | 36 px at 1080p |
| Lower third | name + role, 4–6 s, bottom-left inside title-safe |
| Title card | ≤ 3 s at the start, after a short cold open |
| Thumbnail | 1280×720, ≤ 4 words, readable at 320 px wide |
| Audio | −14 LUFS, −1 dBTP |

## Motion

Cuts, not transitions. If something moves, it is a diagram explaining something (a path being
found, a homography warping a frame), timed to the narration.
