---
id: bilingual-parity
title: Ukrainian and English are both first-class
severity: must
applies: [reading, slides, video, copy, web]
check: review
since: 0.1.0
---

Interfaces and documents work in both languages. Ukrainian text uses the look's fonts (all include ґ є і ї and №), Ukrainian quotes «…» and the en dash with spaces for ranges.

- Never ship machine-translated Ukrainian without review; mark it as a draft.
- Set `lang` on the page and on mixed-language fragments.
- UI strings live in one place per project, with both languages side by side.
