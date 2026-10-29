# Dashboards (Operate)

Mode: the user completes a task, repeatedly, often under time pressure. Scanability and
consistency beat expression. The look shows in the details: lines, labels, type, the accent.

## Layout

- A top bar with the scope (watchlist, account), the global controls (timeframe as `bs-segmented`,
  add symbol as `bs-input` + one `bs-btn--primary`).
- A row of `bs-stat` for the few numbers that decide what to do next. Only real values; no hero metric.
- A grid (`bs-grid`) of `bs-panel`s, each with a head (title, state tag, local controls) and a body.
- Tables (`bs-table`) for lists of instruments, orders, fills. Row height `--bs-row-h`.

## Trading specifics

- Up/down: `--bs-viz-up` / `--bs-viz-down` plus ▲/▼ or sign (`bs-up`, `bs-down`). Never colour only.
  The pair is chosen per look to stay apart for colour-blind readers; do not swap in green/red.
- Prices and quantities: tabular figures, right-aligned, fixed decimals per instrument, thin-space thousands.
- Time: show the exchange timezone and the data timestamp ("as of 14:02 ET").
- Freshness per tile in words: live, delayed 15m, stale 2h, error, empty (`bs-tag` with `is-caution` / `is-negative`).
- Charts: TradingView lightweight-charts via `lightweightChartsOptions(readTokens())` and
  `candleColors(t)`; gridlines `--bs-viz-grid`; last price marker in the accent.
- Selected symbol: `aria-selected="true"` row (accent-subtle) and the chart title; one selection at a time.
- Dense but not cramped: 12–13 px labels are fine in tables; nothing below `--bs-size-2xs`.

## Scheme

Offer both schemes and remember the user's choice (`data-bs-scheme` on `<html>`). Default to the
OS setting. Test both: the dark scheme has its own accent and chart values.

## States to design

Loading (skeleton rows with fixed height, no shimmer), empty (what to do), error (what failed, when it
retries, what is on screen), stale, disconnected, market closed.
