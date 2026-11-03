# Using bausk-style in a project

## 1. Install a version

The package is installed from git tags, so no registry account is needed. Pin a range in
`package.json`; npm resolves the newest matching tag:

```bash
npm i "github:bausk/bausk-style#semver:^1.0.0"     # once the repo is public
npm i "git+ssh://git@github.com/bausk/bausk-style.git#semver:^1.0.0"   # private repo
npm i ../bausk-style                               # local development (symlink)
```

Python (figures, notebooks, Plotly/Dash dashboards):

```bash
uv add "bausk-style @ git+https://github.com/bausk/bausk-style@v1.0.0#subdirectory=python"
```

Static sites without a build step (the Ghost theme) can link the CDN. `@1` follows the newest 1.x
release; `@1.2.0` freezes it:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/bausk/bausk-style@1/dist/css/bausk.css">
```

## 2. Initialise the project

```bash
npx bausk-style init --media dashboard --agents
```

This writes `bausk-style.json` (brand, look, scheme, media, rule switches), `DESIGN.md` (the look
in Google's DESIGN.md format, readable by any agent, plus a "Project rules" section that is yours)
and a pointer block in `AGENTS.md`/`CLAUDE.md`. With `--media slides` it also copies Quarto's
`_brand.yml` and the fonts.

## 3. Follow or freeze the look

`"look": "default"` follows the brand's default look: when a release moves the brand to a new look,
`npm update` + `npx bausk-style sync` brings it in. `"look": "kharkiv"` freezes the project on that
look for as long as the major version lasts. Import paths match: `css/bausk.css` follows,
`css/kharkiv.css` freezes.

## 4. Per stack

**Plain CSS / Ghost / Astro**

```css
@import "bausk-style/css/bausk.css";   /* tokens, fonts, base, components, signature */
```

Set the scheme on `<html data-bs-scheme="light|dark">`, or leave it off to follow the OS.
Use component classes (`bs-entry`, `bs-meta`, `bs-panel`…) and `var(--bs-*)` for anything custom.
Project CSS is unlayered, so it overrides the system without `!important`.

**React + Tailwind v4 (dashboards)**

```css
@import "tailwindcss";
@import "bausk-style/css/bausk.css";
@import "bausk-style/tailwind/bausk.css";
```

Utilities become `bg-bg text-fg border-line text-accent bg-bg-subtle text-fg-muted font-ui text-sm
rounded-control border-hair label num`. Tailwind's own palette, shadows, blur and radii are
removed, so `bg-purple-500` or `shadow-lg` simply do nothing.

**Canvas, charts, games**

```js
import { readTokens, tokens, toInt, lightweightChartsOptions, candleColors } from 'bausk-style';
const t = readTokens();                       // live values from CSS, follows the scheme
chart.applyOptions(lightweightChartsOptions(t));
series.applyOptions(candleColors(t));
const wall = toInt(t.fg);                     // 0x1b2025 for Phaser / PixiJS
```

Re-read tokens when `prefers-color-scheme` or `data-bs-scheme` changes.

**Python figures**

```python
import bausk_style as bs
bs.use("default", scheme="light", medium="paper")   # matplotlib rcParams
c = bs.colors()                                     # {'bg': '#…', 'viz-1': '#…', …}
fig.update_layout(template=bs.plotly_template())     # Plotly
```

**Quarto slides** — see [media/slides.md](media/slides.md). **PowerPoint** — see [media/pptx.md](media/pptx.md).

## 5. Check

```bash
npx bausk-style check            # CI: exits 1 on errors
npx bausk-style shot http://localhost:5173 --width 390 --out shot-390.png
```
