# Changelog

Format: each release lists **Looks**, **Added**, **Changed**, **Fixed**, **Deprecated** and
**Migration** (exact renames an agent can apply). Dates are absolute.

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
