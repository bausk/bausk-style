# Rules

One rule per file. Front matter:

| Field | Meaning |
|---|---|
| `id` | Stable identifier. Cite it in reviews and in `rules.off`. Never reuse a retired id. |
| `title` | One line, stated as the thing to do. |
| `severity` | `must` (a defect if broken) or `should` (break it only with a reason). |
| `applies` | Media: `all`, `web`, `reading`, `dashboard`, `slides`, `pptx`, `figures`, `game`, `video`, `copy`. |
| `check` | `bausk-style check: <rule>` when automated, otherwise `review`. |
| `locked` | `true` if a project cannot switch it off. |
| `since` | Version that introduced it. |

Projects add rules in `design/rules/<id>.md` with the same format; a project rule with the same `id`
as a system rule replaces it (except locked ones). Switch a rule off in `bausk-style.json`:

```json
{ "rules": { "off": { "no-card-grids": "the pricing table is a real comparison of three plans" } } }
```

`bausk-style rules --media dashboard` prints what is in force.
