"""bausk-style for Python: colours, matplotlib styles and Plotly templates.

The data files are generated from the bausk-style tokens; the version here always matches
the JS package and the CSS in the same release.
"""
from __future__ import annotations

import json
from functools import lru_cache
from importlib import resources

__all__ = ["looks", "default_look", "colors", "values", "use", "register_fonts", "style_path", "figsize", "plotly_template", "version"]

_MM = 1 / 25.4


@lru_cache(maxsize=1)
def _data() -> dict:
    return json.loads(resources.files(__package__).joinpath("data/looks.json").read_text("utf-8"))


def version() -> str:
    return _data()["version"]


def looks() -> dict[str, str]:
    """Look id -> status (candidate, released, legacy, deprecated)."""
    return {k: v["status"] for k, v in _data()["looks"].items()}


def default_look(brand: str = "bausk") -> str:
    look = _data()["brands"].get(brand, {}).get("defaultLook")
    if not look:
        raise ValueError(f"brand {brand!r} has no default look")
    return look


def _resolve(look: str | None) -> str:
    look = default_look() if look in (None, "default") else look
    if look not in _data()["looks"]:
        raise ValueError(f"unknown look {look!r}; known: {', '.join(_data()['looks'])}")
    return look


def colors(look: str | None = None, scheme: str = "light") -> dict[str, str]:
    """Semantic colours as hex strings: bg, fg, accent, viz-1 … viz-6, viz-up, viz-down, …"""
    return dict(_data()["looks"][_resolve(look)]["color"][scheme])


def values(look: str | None = None) -> dict[str, str]:
    """Non-colour tokens (sizes, spacing, fonts) as CSS strings."""
    entry = _data()["looks"][_resolve(look)]
    return {**entry["values"], **{f"font-{k}": v for k, v in entry["fonts"].items()}}


def style_path(look: str | None = None, scheme: str = "light", medium: str = "screen") -> str:
    """Path to the generated .mplstyle file for plt.style.use()."""
    if medium == "paper" and scheme == "dark":
        raise ValueError("paper figures are light only")
    name = f"data/mpl/{_resolve(look)}-{scheme}-{medium}.mplstyle"
    return str(resources.files(__package__).joinpath(name))


def register_fonts(look: str | None = None) -> list[str]:
    """Make the look's bundled TTFs available to matplotlib (no system install needed)."""
    from matplotlib import font_manager

    files = (_data()["looks"][_resolve(look)].get("desktop") or {}).get("files", [])
    paths = [str(resources.files(__package__).joinpath(f"data/fonts/{f}")) for f in files]
    known = {f.fname for f in font_manager.fontManager.ttflist}
    for p in paths:
        if p not in known:
            font_manager.fontManager.addfont(p)
    return paths


def use(look: str | None = None, scheme: str = "light", medium: str = "screen") -> None:
    """Apply the look to matplotlib. medium: paper (8 pt, white), screen, slide (1920×1080 decks)."""
    import matplotlib.pyplot as plt

    register_fonts(look)
    plt.style.use(style_path(look, scheme, medium))


def figsize(width: str | float = "single", ratio: float = 0.62) -> tuple[float, float]:
    """Figure size in inches. width: "single" (85 mm), "double" (175 mm), "slide" (1920 px at 150 dpi) or mm."""
    mm = {"single": 85, "double": 175, "slide": 1920 / 150 / _MM}.get(width, width)
    w = float(mm) * _MM
    return (w, w * ratio)


def plotly_template(look: str | None = None, scheme: str = "light") -> dict:
    """Plotly template dict; pass as fig.update_layout(template=...) or register in pio.templates."""
    name = f"data/plotly/{_resolve(look)}-{scheme}.json"
    return json.loads(resources.files(__package__).joinpath(name).read_text("utf-8"))
