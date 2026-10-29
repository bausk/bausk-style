---
id: one-accent
title: One accent, used for meaning
severity: must
applies: [all]
check: review
since: 0.1.0
---

Each surface has one accent colour (`--bs-accent`). It means: link, current item, focus, the one primary action, or "look here". Everything else is ink on paper.

- At most one primary button per view.
- Colour beyond the accent belongs to data (charts, maps, game state) and to status (`positive`, `negative`, `caution`), never to decoration.
- If the accent appears in many places on one screen, remove it from all but the most important.
