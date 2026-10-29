---
id: verify-by-rendering
title: Look at the result before calling it done
severity: must
applies: [all]
check: review
locked: true
since: 0.1.0
---

Render what you made at the sizes it ships: 390 px and 1440 px for web, 1920×1080 for slides and video, final column width for figures. Use `bausk-style shot`. Compare with the look's specimen. Run `bausk-style check` (and `npx impeccable detect <url>` for web if available). Report what you checked and any rule you did not follow.
