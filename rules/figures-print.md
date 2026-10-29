---
id: figures-print
title: Figures survive print and greyscale
severity: must
applies: [figures]
check: review
since: 0.1.0
---

Paper figures use the `paper` style (white background, 8 pt text at final size), are drawn at the final column width (85 mm single, 175 mm double), export as vector (PDF/SVG) with fonts embedded, and still read in greyscale (vary line style or markers, not only hue).
