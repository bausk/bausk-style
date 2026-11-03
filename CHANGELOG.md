# Changelog

Format: each release lists **Looks**, **Added**, **Changed**, **Fixed**, **Deprecated** and
**Migration** (exact renames an agent can apply). Dates are absolute.

## 0.2.0 — 2026-11-04

The brand look is chosen: `kharkiv`. Decks, PowerPoint, figures and video graphics now ship for it.

### Looks
- `kharkiv` is the default look of the `bausk` brand (still `candidate`; 1.0.0 freezes it).
- `kharkiv`: article titles are set in sentence case; capitals stay for short titles (slides, covers,
  thumbnails, section heads).
- `sheet` and `survey` moved to `tokens/archive/` (not built, not available to projects).

### Added
- Quarto reveal.js extension per look (`dist/quarto/<look>/_extensions/bausk/`, `format: bausk-revealjs`):
  red bar, caps titles, section slides, footer and n / N inside each slide. `init --media slides` copies it.
- PowerPoint template and sample deck (`dist/pptx/bausk-kharkiv.potx`, `…-sample.pptx`), built with python-pptx.
- Desktop TTFs (`fonts/ttf/`, `fonts/desktop.json`); `bausk_style.use()` registers them with matplotlib;
  `scripts/install-fonts-windows.ps1` installs them for Office without admin rights.
- `bausk-style video titlecard|chapter|lowerthird|endcard|thumbnail` renders video graphics as PNG
  (the lower third with transparency); `.bs-video--section`.
- `bausk-style brief` prints a Tools section per medium.
- `scripts/render-pptx-windows.ps1` renders a deck to PNG through PowerPoint for review.
- `shot`: element and transparent captures, and a script hook (used to step through reveal.js decks).

### Changed
- matplotlib styles name the desktop families (Fixel Text, IBM Plex Mono).
- Specimen dark-scheme opacity tricks removed; section text uses full colour.

### Migration
- Projects that pinned `"look": "sheet"` or `"look": "survey"` (0.1.0 only): switch to `"default"` or `"kharkiv"`.

## 0.1.0 — 2026-10-29

First version: the system, three candidate looks and the frozen legacy look.

### Looks
- `sheet` (Аркуш), candidate: engineering drawing sheet. Temporary brand default until 1.0.
- `survey` (Планшет), candidate: topographic survey sheet / ground-station display.
- `kharkiv` (Харків), candidate: 1920s Kharkiv constructivist book design.
- `folio` (Фоліо), legacy: the bausk.dev Ghost theme as built on 2026-10-12, frozen.

### Added
- Token contract (colour, font, size, type, space, layout, shape, motion, media) and DTCG 2025.10 output.
- Outputs: CSS (tokens, fonts, components, signature), Tailwind v4 theme without the default palette,
  JS module with chart/game helpers, Plotly templates, matplotlib styles, Quarto `_brand.yml`,
  DESIGN.md in Google's format, specimens.
- Guide, 24 rules, CLI (`brief`, `init`, `sync`, `check`, `rules`, `looks`, `shot`), agent skill.
- Python package `bausk_style`.

### Migration
- None.
