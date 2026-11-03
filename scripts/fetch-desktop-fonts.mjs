#!/usr/bin/env node
// Vendors static TTF files for desktop tools (matplotlib, PowerPoint, Office) into fonts/ttf/
// and records their internal family names in fonts/desktop.json. Web pages use the woff2 files
// from scripts/fetch-fonts.mjs instead.  Run: node scripts/fetch-desktop-fonts.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'fonts', 'ttf');
const GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl';
const FIXEL = 'https://raw.githubusercontent.com/MacPaw/Fixel/main';

const SOURCES = {
  fixel: {
    licence: `${FIXEL}/OFL.txt`,
    files: ['FixelText-Regular', 'FixelText-Medium', 'FixelText-SemiBold', 'FixelText-Bold', 'FixelDisplay-Bold', 'FixelDisplay-ExtraBold', 'FixelDisplay-Black']
      .map((n) => [`${FIXEL}/fonts/ttf/${n}.ttf`, `${n}.ttf`]),
  },
  arsenal: {
    licence: `${GF}/arsenal/OFL.txt`,
    files: ['Arsenal-Regular', 'Arsenal-Bold', 'Arsenal-Italic', 'Arsenal-BoldItalic'].map((n) => [`${GF}/arsenal/${n}.ttf`, `${n}.ttf`]),
  },
  'plex-mono': {
    licence: `${GF}/ibmplexmono/OFL.txt`,
    files: ['IBMPlexMono-Regular', 'IBMPlexMono-Medium', 'IBMPlexMono-Italic'].map((n) => [`${GF}/ibmplexmono/${n}.ttf`, `${n}.ttf`]),
  },
};

const manifest = {};
for (const [id, src] of Object.entries(SOURCES)) {
  const dir = join(OUT, id);
  mkdirSync(dir, { recursive: true });
  execFileSync('curl', ['-sfL', '-o', join(dir, 'LICENSE.txt'), src.licence]);
  manifest[id] = [];
  for (const [url, name] of src.files) {
    execFileSync('curl', ['-sfL', '-o', join(dir, name), url]);
    // name IDs: 1 = legacy family (what Office shows), 2 = style, 16/17 = typographic family/style
    const names = JSON.parse(execFileSync('uv', ['run', '-q', '--with', 'fonttools', 'python', '-I', '-c',
      `import json; from fontTools.ttLib import TTFont; n=TTFont(r'${join(dir, name)}')['name']; g=lambda i: (n.getDebugName(i) or ''); print(json.dumps({'family': g(1), 'style': g(2), 'typoFamily': g(16) or g(1), 'typoStyle': g(17) or g(2)}))`]).toString());
    manifest[id].push({ file: `ttf/${id}/${name}`, ...names });
    console.log(`${id}/${name}: ${names.family} · ${names.style}`);
  }
}
writeFileSync(join(ROOT, 'fonts', 'desktop.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('wrote fonts/desktop.json');
