# PowerPoint

For decks that colleagues edit in Office, and for venues that require .pptx.

## Files

- `dist/pptx/bausk-<look>.potx`: the template. Double-click to start a new deck from it, or in
  PowerPoint use Design → Browse for Themes / File → New → Personal.
- `dist/pptx/bausk-<look>-sample.pptx`: a four-slide example (title, content, section, two content).

Layouts: **Title**, **Title and Content**, **Section** (all red), **Two Content**, **Title Only**,
**Blank**, **Figure** (picture + caption). Theme colours: Dark 1/Light 1 = ink/paper, Accent 1–6 =
the chart series in order (so charts made in PowerPoint follow the look), hyperlink = red.
Theme fonts: Fixel Display Black (headings), Arsenal (body).

## Fonts

PowerPoint can only use installed fonts. On Windows, once per machine and user:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install-fonts-windows.ps1
```

It installs `fonts/ttf/**` for the current user (no admin). Send the TTFs along with a deck to anyone
who needs to edit it, or export to PDF for viewing.

## Rules when editing

- Use the layouts; do not add free text boxes for titles or bullets.
- Footer: Insert → Header & Footer → Footer (course · lecture), Apply to All. The slide number is
  always on. PowerPoint has no "total slides" field, so the footer shows n only.
- No shadows, gradients, rounded shapes or WordArt. Shapes you add should be plain rectangles in the
  theme colours.
- Figures: export from Python with `bausk_style.use(medium="slide")`, paste as PNG/SVG.

## Verify

`scripts/render-pptx-windows.ps1 -Deck deck.pptx -Out shots` renders every slide to PNG with
PowerPoint itself, for the same visual check as the web specimens.

## Rebuilding the template

`node build/build.mjs` regenerates it through `build/pptx/make_template.py` (python-pptx via uv).
