---
id: tokens-only
title: Use tokens, never raw values
severity: must
applies: [all]
check: bausk-style check: tokens-only
locked: true
since: 0.1.0
---

Colours, fonts, sizes, spacing, radii, line widths and durations come from `--bs-*` variables (CSS), the Tailwind theme names (`bg-bg`, `text-fg-muted`, `border-line`, `text-accent`…), `tokens()`/`readTokens()` (JS) or `bausk_style.colors()` (Python).

- No hex, `rgb()`, `hsl()` or `oklch()` literals in project code. No Tailwind default palette (`bg-slate-50`, `text-purple-600`) and no arbitrary colours (`bg-[#123456]`).
- A colour the system lacks is a request for the system (a new token), not a local literal.
- Third-party marks keep their own colours (ORCID green, a partner logo): list them in `check.allowColors` with a comment.

Why: projects only follow a new look on upgrade if they never copied the old look's values.
