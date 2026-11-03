# Slides: Quarto + reveal.js

Mode: Read (lectures, talks) and sometimes Persuade (pitch). One idea per slide.

## Setup

```bash
npx bausk-style init --media slides     # copies the extension to _extensions/bausk/ (fonts included)
```

Deck front matter:

```yaml
---
title: "Пошук шляху: алгоритм A*"
subtitle: "Евристики, допустимість і чому A* знаходить найкоротший шлях"
author: "Олександр Бауск"
institute: "Кафедра програмного забезпечення, Львівська політехніка"
date: 2026-11-04
lang: uk
footer: "Програмування ШІ для ігор · Лекція 3"
format: bausk-revealjs
---
```

`quarto render deck.qmd` (or `quarto preview`). A worked deck is in `templates/slides-quarto/lecture.qmd`.
`bausk-style sync` refreshes the extension after an upgrade.

## What the extension does

- 1920×1080, no transitions, no progress bar or menu, the look's fonts and colours.
- Title slide: caps title, subtitle, author block at the bottom.
- `## Heading` = content slide; `# Heading` = section slide (all red in kharkiv).
- Footer and "n / N" are placed inside every slide from the `footer:` option, so they scale and print.
  Add `{.no-foot}` to a slide heading to hide them on that slide.
- Lists get the look's bullets; tables, code (IBM Plex Mono, 28 px) and captions are styled.
- `[text]{.bs-mark}` marks a phrase in the look's emphasis style.

## Writing slides

- Title states the point ("A* expands fewer cells than Dijkstra on open maps"), not the topic ("A*").
- At most six short lines, or one figure, or one code block (≤ 12 lines).
- Data slides carry a source and date line under the figure or table.
- Section slides open each part; one per part.
- Figures from Python: `bausk_style.use(medium="slide")` so they match the deck.
- Speaker notes (`::: notes`) carry the explanation; the slide carries the evidence.

## PDF

Open the HTML with `?print-pdf` in Chrome and print to PDF (1920×1080 pages), or
`npx decktape reveal deck.html deck.pdf`.

## Interactive slides

reveal.js slides are HTML: embed a demo (`<iframe>` or a script) that reads `readTokens()` from
`bausk-style`, so a game or chart on slide 7 matches the deck.

## Other Quarto formats

`dist/quarto/<look>/_brand.yml` themes Quarto HTML and Typst documents (handouts, reports) with the
look's colours and fonts. Do not combine it with the slides extension in one project folder; the
extension already carries the deck styling.
