---
id: focus-and-motion
title: Visible focus, calm motion
severity: must
applies: [web, dashboard, game]
check: bausk-style check: focus-and-motion
since: 0.1.0
---

Keep the focus ring (`--bs-focus`), keyboard paths and hit areas of at least 24×24 px. Motion uses `--bs-duration-*` and `--bs-ease-*`, responds to the user (hover, open, move) and respects `prefers-reduced-motion`. No entrance animations on scroll, no bouncing, pulsing or looping decoration.
