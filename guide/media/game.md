# Browser demo games

Mode: Experience, inside a teaching context. The game is the content; the chrome recedes.

- Board and sprites take colours from `readTokens()` (`toInt()` for Phaser/PixiJS): walls `fg`,
  floor `bg`, visited `bg-subtle`, frontier `accent-subtle`, path and the player `accent`.
- The HUD (`bs-hud`) sits above or beside the board: label + value pairs in tabular figures;
  controls as `bs-btn`, one primary (Run / Запуск).
- Show controls in words on screen (Space: step, R: reset; Пробіл: крок).
- Grid demos: square cells, 1px lines in `line`, no rounded tiles.
- Pixel art: integer scaling, `image-rendering: pixelated`; palette from tokens, not a new one.
- Motion: step animations at `--bs-duration-base`; a "speed" control instead of fast effects.
- Respect `prefers-reduced-motion`: step instantly.
- The specimen's A* board is the reference composition.
