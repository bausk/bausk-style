---
id: freshness-visible
title: Data state is visible per tile
severity: must
applies: [dashboard]
check: review
since: 0.1.0
---

Every data tile shows its state in words: live, delayed 15m, stale 2h, error, empty, loading. Stale and error use `caution`/`negative` with a text tag; never only a coloured dot. Empty states say what to do next ("Add a symbol to start").
