# bausk-style (Python)

matplotlib and Plotly presets generated from the bausk-style tokens. Data in `bausk_style/data/` is
written by `node build/build.mjs` in the repository root; do not edit it.

```python
import bausk_style as bs
bs.use("default", scheme="light", medium="paper")
fig, ax = plt.subplots(figsize=bs.figsize("single"))
fig.update_layout(template=bs.plotly_template())   # Plotly
```
