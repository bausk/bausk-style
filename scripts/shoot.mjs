#!/usr/bin/env node
// Screenshots of every specimen into .shots/ (git-ignored): full page plus each part.
import { shoot } from '../cli/shoot.mjs';
import { readdirSync, mkdirSync } from 'node:fs';
const looks = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync('dist/specimen').filter((f) => f.endsWith('.html') && f !== 'index.html').map((f) => f.replace('.html', ''));
mkdirSync('.shots', { recursive: true });
const parts = ['p-read', 'p-op', 'p-slides', 'p-video', 'p-play', 'p-tokens'];
const shots = looks.flatMap((l) => [
  { url: `dist/specimen/${l}.html`, out: `.shots/${l}.png` },
  ...parts.map((p) => ({ url: `dist/specimen/${l}.html`, out: `.shots/${l}-${p}.png`, selector: `section[aria-labelledby="${p}"]` })),
  { url: `dist/specimen/${l}.html`, out: `.shots/${l}-mobile.png`, width: 390, maxHeight: 2400 },
]);
for (const f of await shoot(shots)) console.log(f);
