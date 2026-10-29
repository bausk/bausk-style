---
id: no-decorative-depth
title: No shadows, gradients, glass or glow
severity: must
applies: [web, dashboard, slides, video, game]
check: bausk-style check: no-decorative-depth
since: 0.1.0
---

None of the looks defines depth effects, so none are used: no `box-shadow`, no gradients, no `backdrop-filter`, no blur, no glow, no hard offset "neo-brutalist" shadows.

Separation comes from space, lines (`--bs-line`, `--bs-line-strong`) and the subtle background (`--bs-bg-subtle`). Overlays (menus, dialogs, tooltips) use `--bs-bg-inverse` or a `--bs-line-strong` border.

A future look may define depth tokens; then this rule changes with it.
