## Overview

A 1920s Kharkiv constructivist journal or book cover, in the tradition of Vasyl Yermilov and *Nova Generatsiia*: heavy grotesque set large, black and one red on grey uncoated paper, thick bars that divide the page, and text blocks placed against a strong left edge rather than centred. It is the loudest of the looks and made for things that must be read from across a room: slides, video titles, thumbnails, posters, and section openings.

## Colors

- **Paper** (`bg`) is a light grey uncoated stock; not cream, not white.
- **Black** (`fg`) carries text and bars.
- **Red** (`accent`) is printed solid: a block behind a word, a section slide, the current item, the one primary action. No red tints in the interface beyond selection.
- Charts follow bookkeeping: rising in black, falling in red ("in the black", "in the red"), always with ▲/▼ or a sign. Other series: grey, ink blue, mustard, olive.
- The dark scheme inverts paper and black; red stays red.

## Typography

Fixel (a Ukrainian grotesque by MacPaw) in its Display width at weight 900 for titles, set tight (`leading-tight: 0.98`) and in capitals on slides and covers. Fixel Text, slightly condensed, for interface and labels. Arsenal, a Ukrainian semi-grotesque, for reading text. IBM Plex Mono for code and data. Big type is the image; there are no illustrations for decoration.

## Layout

Asymmetric: a strong left edge, blocks of text hung from thick bars, large empty areas on the right. One element per view may break the grid (a red bar, a very large numeral that is real data). Use `--bs-measure-text` (38rem) for reading.

## Elevation & Depth

None. Blocks of solid colour overlap or abut; nothing floats.

## Shapes

Square. Main lines are heavy (3px in UI, 0.5rem bars for section heads, 6–40px on slides at 1920 width).

## Components

- `.bs-section-head` is a thick black bar with the title in display capitals.
- `.bs-mark` is a solid red block with paper-coloured text.
- `.bs-slide` has a red bar on the left edge; `.bs-slide--section` is all red.
- `.bs-nav` marks the current item with a red block.

## Do's and Don'ts

- **Do** let one thing be very large per view.
- **Do** use real numbers when a numeral is the image (a lecture number, a year, a measured value).
- **Don't** use diagonal type, rotated blocks or Soviet iconography (stars, hammers, propaganda slogans); the reference is the typographic method, not the politics.
- **Don't** set long reading text in Fixel Display or in capitals.
- **Don't** introduce a second accent; red and black do all the work.
