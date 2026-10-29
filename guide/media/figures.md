# Figures for papers and articles (matplotlib, Plotly)

```python
import bausk_style as bs
bs.use("default", scheme="light", medium="paper")   # 8 pt text, white background, vector-friendly
fig, ax = plt.subplots(figsize=bs.figsize("single"))  # 85 mm wide; "double" = 175 mm
...
fig.savefig("fig2.pdf")                              # fonts embedded (Type 42)
```

- Draw at final size; never scale a figure in the document.
- Text at final size: 8 pt (7 pt ticks). Lines 0.8–1 pt.
- Colours from `bs.colors()`; series 1–4 first; label lines directly where possible.
- Greyscale-safe: vary line style or marker too when the figure may be printed.
- Units on axes, a caption with what/unit/source; number figures (Fig. 2 / Рис. 2).
- Web figures: `medium="screen"`, export SVG; slide figures: `medium="slide"`.
- Fonts: matplotlib needs TTF/OTF files installed on the system (it cannot read woff2). Install the
  look's families once (`fc-list | grep -i <family>` to check); otherwise it falls back to DejaVu
  Sans, which is acceptable for drafts only.
- Plotly: `template=bs.plotly_template()`; candlesticks get the look's up/down colours.
