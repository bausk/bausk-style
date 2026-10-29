# bausk-style

Oleksandr Bausk's house style, built to be used by coding agents as well as by people: design
tokens, interchangeable looks, a small component layer, a guidebook, rules with ids, guardrail
checks, and an agent skill. One source produces CSS, a Tailwind v4 theme, a JS module, Python
(matplotlib, Plotly), Quarto `_brand.yml`, DTCG tokens and a DESIGN.md in Google's format.

Used for: the bausk.dev blog and articles, the trading dashboard, browser demo games, lecture and
research slides, paper figures, YouTube graphics.

## Status: 0.1.0, choosing a look

Three candidate looks and one legacy look. Open the specimens (`dist/specimen/*.html`) to compare
them on the same content: an article, a trading dashboard, lecture slides, video graphics and an A* game.

| Look | Reference | Status |
|---|---|---|
| `sheet` · Аркуш | Engineering drawing sheet: graphite, title block, red pencil | candidate, brand default for now |
| `survey` · Планшет | Topographic survey sheet by day, drone ground station by night | candidate |
| `kharkiv` · Харків | 1920s Kharkiv constructivist book design: black, one red, heavy grotesque | candidate |
| `folio` · Фоліо | bausk.dev Ghost theme as of 2026-10-12 | legacy, frozen |

## How it stays stable while looks evolve

- Projects use **names** (`--bs-accent`, `bs-panel`, `tokens().accent`), never values.
- **Palettes and released looks are frozen**; evolution is a new look id, so nothing a project
  depends on changes under it.
- A brand points at a look. Projects either **follow** the brand (`"look": "default"`, import
  `css/bausk.css`) and get the new look on upgrade, or **freeze** a look (`"look": "sheet"`).
- The guide and rules ship **in the same package**, so an agent working in a project reads the
  instructions that match that project's version.

Details: [VERSIONING.md](VERSIONING.md).

## Use it in a project

```bash
npm i "github:bausk/bausk-style#semver:^0.1.0"   # or: npm i ../bausk-style
npx bausk-style init --media dashboard --agents   # bausk-style.json, DESIGN.md, AGENTS.md pointer
npx bausk-style brief                             # what an agent reads first
npx bausk-style check                             # guardrails; exit 1 on errors
```

Per-stack instructions (CSS, Tailwind, canvas and charts, Python, Quarto, PowerPoint):
[guide/consuming.md](guide/consuming.md).

## For agents

Install the skill once: `scripts/install-skill.sh` (links `skill/bausk-style` into
`~/.agents/skills` and `~/.claude/skills`). The skill's launcher runs the CLI version that matches
each project. Start every visual task with `bstyle brief --media <m>`.

## Develop

```bash
node build/build.mjs        # tokens → dist/ and python data
node build/test.mjs         # contract, contrast, colour-blind separation, frozen palettes, semver
node scripts/shoot.mjs      # screenshots of every specimen into .shots/
node build/release.mjs 0.2.0 --tag
```

Rules for changing the system: [AGENTS.md](AGENTS.md).

## Licences

Code: MIT. Fonts in `fonts/` and `dist/fonts/`: SIL Open Font License 1.1 (IBM Plex, Literata,
Sofia Sans Semi Condensed, Arsenal, Source Serif 4 / Sans 3 / Code Pro, Fixel by MacPaw); each
family's licence file sits next to it.
