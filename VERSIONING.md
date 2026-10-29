# Versioning

bausk-style separates three things that change at different speeds:

| Layer | What it is | How it changes |
|---|---|---|
| **Contract** | Token names (`tokens/contract.json`), component classes (`bs-*`), CLI commands, file paths in `dist/`, the Python and JS APIs | Additive in minor releases. Removing or renaming anything is a **major** release, with the old name kept as a deprecated alias for one major and a migration note. |
| **Palettes** | Named colours (`tokens/palettes/*.json`) | **Frozen once released.** A released colour never changes value and is never removed. New colours or new palettes are added instead. Enforced by `tokens/frozen.json` in the test suite. |
| **Looks** | A mapping of contract names to palette colours, fonts, sizes and signature CSS, plus LOOK.md | **Frozen once released**, except documented patch fixes (contrast, a rendering bug). Evolution means a **new look id** (e.g. `sheet-2027`). Old looks stay available until the next major, marked `legacy` or `deprecated`. |
| **Guide and rules** | `guide/`, `rules/` | May change in any minor release. Rule ids are never reused. |

Brands point at a look (`tokens/brands/<brand>.json → defaultLook`). Moving a brand to a new look
is a **minor** release (a "look release").

## What a project gets on upgrade

- A project with `"look": "default"` (and importing `css/<brand>.css`) takes the brand's new look on
  `npm update` + `bausk-style sync`. Nothing breaks structurally, because the contract did not change;
  the release's specimen shows how every component looks before you upgrade.
- A project with `"look": "<id>"` (importing `css/<id>.css`) keeps that exact look for the whole major
  version, even when the brand moves on.
- A major release can retire legacy looks and renamed tokens. `CHANGELOG.md` lists every removed name
  and its replacement under **Migration**, written so an agent can apply it.

## Pre-1.0

`0.x` is exploration: candidate looks may change or disappear and nothing is frozen except the
`folio` legacy look. 1.0.0 picks the brand's default look, marks it `released` and freezes its palette.

## Cutting a release

```bash
node build/release.mjs 0.2.0     # bumps versions, freezes released/legacy looks, builds, tests
git push && git push --tags      # projects pin "#semver:^0.2.0"
```
