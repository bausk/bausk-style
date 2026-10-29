---
id: no-card-grids
title: No card grids as page structure
severity: should
applies: [web, reading, dashboard]
check: review
since: 0.1.0
---

Do not build pages out of identical boxes with an icon, a heading and two lines of text. Do not nest boxes in boxes.

- Lists of things: `bs-entries` rows separated by lines.
- Comparisons: a table.
- Dashboards: `bs-panel` only where a panel has its own controls or state; otherwise a heading and the content.
- A kicker or eyebrow label above a heading is not used; put kind and topic in `bs-meta` or the entry meta line.
