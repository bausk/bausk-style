# Slides: Quarto + reveal.js

Mode: Read (lectures, talks) and sometimes Persuade (pitch). One idea per slide.

## Setup

```bash
npx bausk-style init --media slides     # writes _brand.yml + fonts/ for the current look
```

In `_quarto.yml` or the deck's front matter:

```yaml
format:
  revealjs:
    slide-number: c/t
    width: 1920
    height: 1080
    margin: 0
    css: bausk-slides.css     # signature layer: planned for 0.2 (see below)
```

`_brand.yml` gives Quarto the palette, fonts, link colour and heading style. Status in 0.1: colours
and fonts come through; the look's slide signature (title-block footer, neatline, red bar) is
implemented in `dist/css/<look>.css` as `.bs-slide` and will ship as a Quarto extension
(`_extensions/bausk/`) once the look is chosen.

## Writing slides

- Title states the point ("A* expands fewer cells than Dijkstra on open maps"), not the topic ("A*").
- At most six short lines, or one figure, or one code block (≤ 12 lines, ≥ 28 px).
- Every slide: number n / N; data slides: source and date in the footer.
- Section slides (`.bs-slide--section`) open each part; one per part.
- Figures from Python use `bausk_style.use(..., medium="slide")` so they match the deck.
- Ukrainian decks: «лапки», correct terms, and the course name and lecture number in the footer.
- Speaker notes carry the explanation; the slide carries the evidence.

## Interactive slides

reveal.js slides are HTML: embed a demo (`<iframe>` or a small script) that uses the same tokens
(`readTokens()`), so the A* demo on slide 7 looks like the deck.
