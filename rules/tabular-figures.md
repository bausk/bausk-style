---
id: tabular-figures
title: Numbers line up
severity: must
applies: [dashboard, reading, figures]
check: review
since: 0.1.0
---

Numbers in tables, stats and HUDs use tabular lining figures (`bs-num`, `bs-table .is-num`), are right-aligned in columns, keep a fixed number of decimals per column and show the unit once (in the header or label).

Thousands use a narrow no-break space in both languages (1 284.50); the decimal separator follows the page language (2.5 in English, 2,5 in Ukrainian prose; data tables may keep the point).
