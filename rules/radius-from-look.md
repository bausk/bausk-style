---
id: radius-from-look
title: Corners come from the look
severity: must
applies: [web, dashboard, game]
check: bausk-style check: radius-from-look
since: 0.1.0
---

Use `var(--bs-radius)` for surfaces and `var(--bs-radius-control)` for buttons and inputs (`rounded-surface`, `rounded-control` in Tailwind). Every current look has square surfaces. No pills, no `rounded-2xl` cards, no circles around icons.
