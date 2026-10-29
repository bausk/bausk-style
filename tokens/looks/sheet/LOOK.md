## Overview

An engineering drawing sheet from a technical university: drafting film, graphite in two line weights, a ruled title block in the lower right corner, sheets numbered *n* of *N*, and corrections made in red pencil. The person behind it is an engineer who teaches, so the page reads like a well-drawn sheet: exact, labelled, and calm.

The sheet is the substrate for everything: an article is a sheet with a title block, a slide is a sheet in a frame, a dashboard is a set of views on one sheet. Nothing on it is decorative. Every line is either a thin line (`--bs-line-w`) or a main line (`--bs-line-w-strong`), and every label names something.

## Colors

One graphite, one film, one red pencil.

- **Film** (`bg`) is a cool, faintly blue-grey white, the colour of drafting film. It is never cream and never pure white.
- **Graphite** (`fg`, `fg-muted`, `fg-subtle`) carries text and every structural line. Three steps, all readable.
- **Red pencil** (`accent`) is the corrector's pencil: links, the current item, focus, the one primary action, and annotations. If the red appears more than a few times on a screen, it has stopped meaning "look here".
- Charts use a small set of drafting pencils (`viz-1`…`viz-6`): graphite, red, blue, green, ochre, slate. Rising values are blue, falling values red; both always carry ▲/▼ or a sign.
- The dark scheme is the same sheet on a light table at night: graphite ground, pale lines, a lighter red.

## Typography

IBM Plex in one family, the way drawing lettering is one hand. Plex Sans for reading, interface and titles; titles are set slightly condensed (`display-stretch: 92%`) and semi-bold. Small labels are condensed capitals with wide tracking, like the field names in a title block. Plex Mono is for code and measured numbers only.

Reading text is 17px at 1.6 leading on a 40rem column. Sizes step clearly; never add an in-between size.

## Layout

A sheet has a frame, a field and a title block. Content sits in the field on a strict left edge; the title block holds who, when, what and which sheet. Use `--bs-measure-text` for reading, `--bs-measure-wide` for figures, `--bs-measure-page` for the frame. Dense views (dashboards) use the same rules at `--bs-row-h` row height.

## Elevation & Depth

None. There are no shadows, glows or blurs on a drawing. Overlap is shown by a main line around the front object.

## Shapes

Square corners everywhere (`radius: 0`). Lines are crisp: 1px thin, 2px main. Use dash or dash-dot patterns only where a drawing would (hidden or centre lines in diagrams), never as decoration.

## Components

- `.bs-meta` is the title block: ruled cells with a condensed caps label above each value, a main line around the whole.
- `.bs-slide` is a drawing frame with a wider binding margin on the left; `.bs-slide__foot` is a row of title-block cells ending in the sheet number.
- `.bs-mark` is a red-pencil underline.
- `.bs-panel` has a graphite outline and a caps label for its title.
- Figure numbers are labels: `FIG. 3`, `РИС. 3`.

## Do's and Don'ts

- **Do** number sheets, figures and tables; on a drawing every item can be referred to.
- **Do** label axes, units and sources; a value without a unit is a defect.
- **Do** keep red for things that need attention or action.
- **Don't** draw blueprint white-on-blue, grid-paper backgrounds or hand-drawn sketch effects; this is a finished sheet, not a sketch or a costume.
- **Don't** put boxes around paragraphs or round any corner.
- **Don't** use monospace for labels or headings to look "technical".
- **Don't** add a second accent colour to the interface; colour beyond red belongs to charts.
