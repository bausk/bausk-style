---
id: game-readable
title: Game screens follow the same tokens
severity: should
applies: [game]
check: review
since: 0.1.0
---

Game colours come from `tokens()` / `toInt()` so a look change reaches the game. The HUD uses the UI font and tabular figures. Game objects keep at least 3:1 contrast with the board. Pixel art scales by whole numbers with `image-rendering: pixelated`. Controls are listed on screen in words.
