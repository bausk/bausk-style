# Video (YouTube lectures and explainers)

A minimal, repeatable setup for someone new to video. The style system supplies the graphics;
recording and editing use standard free tools.

## Graphics from the command line

```bash
bausk-style video titlecard  --title "Як дрон бачить без GPS" --sub "Візуальна одометрія за 12 хвилин" --out title.png
bausk-style video chapter    --title "2. Евристики" --sub "Манхеттенська, евклідова, октильна" --out ch2.png
bausk-style video lowerthird --name "Олександр Бауск" --role "Кафедра ПЗ, Львівська політехніка" --out lower.png
bausk-style video endcard    --title "Дякую" --sub "Стаття і код на bausk.dev" --links "bausk.dev · orcid.org/0009-0007-6714-8009" --out end.png
bausk-style video thumbnail  --words "Дрон без GPS" --image frame.png --out thumb.png
```

All are 1920×1080 PNGs except the thumbnail (1280×720). The lower third has a transparent
background: put it on a track above the footage. Default scheme is light (paper, black, the full red);
`--scheme dark` gives the inverted variant. Thumbnails refuse more than four words.

## Pipeline

1. **Script and slides.** Write the script; build slides with the Quarto extension. Slides are the
   main visual for lectures.
2. **Record.** OBS Studio: 1920×1080, 30 fps (60 for fast screen motion), MKV or MP4, the microphone on
   its own audio track. A decent USB or XLR microphone matters more than the camera.
3. **Edit.** DaVinci Resolve (free) or Kdenlive. Cut silences; add the title card (≤ 3 s, after a short
   cold open), lower third (4–6 s, with a short fade), chapter cards and the end card.
4. **Animated graphics (optional).** For moving diagrams use Remotion (React; it can import
   `bausk-style` and `readTokens()`) or Manim for maths. Remotion is free for individuals and small
   teams and paid above that; check its licence before using it for the company.
5. **Sound.** Normalise to about −14 LUFS integrated, true peak below −1 dBTP (YouTube plays back
   around −14). Light noise reduction; no music under speech, or at −25 dB or lower.
6. **Captions.** Generate with Whisper (local) → SRT, correct the terms, upload Ukrainian and English tracks.
7. **Thumbnail.** At most four words, one real image from the video (a frame, a diagram), the look's
   colours. No exaggerated faces, arrows or circles.
8. **Upload.** Title states the content ("Visual odometry for drones without GPS, in 12 minutes"),
   chapters in the description (00:00 format), links to the article/DOI and the slides.

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
