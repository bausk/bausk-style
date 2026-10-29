---
id: color-not-alone
title: Never encode meaning by colour alone
severity: must
applies: [dashboard, figures, game, slides]
check: review
since: 0.1.0
---

Up/down values carry ▲/▼ or a sign as well as `viz-up`/`viz-down`. Series are labelled directly at the line end or in the legend in the same order. States (live, stale, error) are words in a `bs-tag`, not dots.

Check charts in a colour-vision simulation when you add series beyond four; series 5 and 6 must be labelled directly.
