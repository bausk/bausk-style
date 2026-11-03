## Overview

A topographic survey sheet by day and a drone ground-control display by night. The person behind it works on navigation without GNSS and stitches drone photos into maps, so the vocabulary is cartographic: inks with fixed meanings, a neatline around the sheet, the legend and scale in the margin, and a magenta line for the active route.

Map colour is functional. Water is always blue, relief always brown, the route always magenta. The same discipline applies to the interface: a colour means one thing everywhere.

## Colors

- **Map white** (`bg`) is a neutral white. **Vegetation tint** (`bg-subtle`) is the pale green of forest areas and is used for wells, code blocks and panel heads.
- **Culture black** (`fg` and its steps) is the ink for text, roads and buildings.
- **Route magenta** (`accent`) marks the active route: the current page, the selected row, the highlighted series, links and focus. It is never a fill behind large areas.
- Charts use the map inks in order (`viz-1`…`viz-6`): hydrography blue, relief brown, forest green, route magenta, sand ochre, culture black. Rising is blue, falling is red, always with ▲/▼ or a sign.
- The dark scheme is the ground-station display: deep blue-grey ground, cyan for the selected object and focus, green for engaged, amber for caution, red for warning, magenta for the route. Keep those meanings exactly.

## Typography

Literata (a book face with optical sizes) for reading and titles; Sofia Sans Semi Condensed for interface, labels and map-style annotations; IBM Plex Mono for code and coordinates. Labels are spaced capitals, like map lettering. Captions are set in Literata italic, the way water names are set in italic on a map.

## Layout

Content sits inside a neatline: a thin line, a gap and a main line. Marginal information (who, when, sources, scale) goes outside or beside the content, never inside the reading column. Use `--bs-measure-text` for reading and full width for maps and dashboards.

## Elevation & Depth

Flat, like print. Layering is shown by the neatline and by the vegetation tint, never by shadow.

## Shapes

Square surfaces; controls get a 2px radius, as map symbols are slightly softened. Lines: 1px thin, 2px main.

## Components

- `.bs-meta` is the margin legend: a boxed key/value list with a double outline.
- `.bs-section-head` and `.bs-slide__frame` carry the neatline.
- `.bs-mark` is a route-magenta underline over a tint.
- `.bs-panel` heads use the vegetation tint and caps labels.

## Do's and Don'ts

- **Do** give coordinates, scales and units when they exist in the content; they are information here, not ornament.
- **Do** keep each colour's meaning fixed across the page and across media.
- **Don't** use contour-line wallpaper, map-grid backgrounds or "topographic" textures; the map vocabulary is structure and colour meaning, not texture.
- **Don't** use magenta for anything that is not the active route, current item or primary action.
- **Don't** put coordinates or ticks on things that have no position.
