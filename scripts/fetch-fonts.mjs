#!/usr/bin/env node
// Vendors the OFL fonts the looks use into fonts/<id>/ and writes fonts/fonts.json.
// Run once when a look adds a family:  node scripts/fetch-fonts.mjs
// Sources: Fontsource npm packages (subset woff2) and MacPaw/Fixel on GitHub.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'fonts');

// id -> where to get it. `css` lists the Fontsource stylesheets whose faces we keep.
const FAMILIES = {
  'plex-sans': { family: 'IBM Plex Sans', pkg: '@fontsource-variable/ibm-plex-sans', css: ['standard.css', 'standard-italic.css'] },
  'plex-mono': { family: 'IBM Plex Mono', pkg: '@fontsource/ibm-plex-mono', css: ['400.css', '500.css', '600.css', '400-italic.css'] },
  literata: { family: 'Literata', pkg: '@fontsource-variable/literata', css: ['opsz.css', 'opsz-italic.css'] },
  'sofia-sans-semi-condensed': { family: 'Sofia Sans Semi Condensed', pkg: '@fontsource-variable/sofia-sans-semi-condensed', css: ['wght.css', 'wght-italic.css'] },
  arsenal: { family: 'Arsenal', pkg: '@fontsource/arsenal', css: ['400.css', '700.css', '400-italic.css', '700-italic.css'] },
  'source-serif-4': { family: 'Source Serif 4', pkg: '@fontsource-variable/source-serif-4', css: ['opsz.css', 'opsz-italic.css'] },
  'source-sans-3': { family: 'Source Sans 3', pkg: '@fontsource-variable/source-sans-3', css: ['wght.css'] },
  'source-code-pro': { family: 'Source Code Pro', pkg: '@fontsource-variable/source-code-pro', css: ['wght.css'] },
  fixel: { family: 'Fixel', github: 'MacPaw/Fixel' },
};

const tmp = mkdtempSync(join(tmpdir(), 'bs-fonts-'));
const manifest = {};

function fromFontsource(id, spec) {
  const tgz = execFileSync('npm', ['pack', '-q', spec.pkg], { cwd: tmp }).toString().trim().split('\n').pop();
  const dir = join(tmp, id);
  mkdirSync(dir, { recursive: true });
  execFileSync('tar', ['-xzf', join(tmp, tgz), '-C', dir]);
  const pkgDir = join(dir, 'package');
  const version = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8')).version;
  const faces = [];
  for (const cssFile of spec.css) {
    const css = readFileSync(join(pkgDir, cssFile), 'utf8');
    for (const m of css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*{([^}]*)}/g)) {
      const name = m[1];
      const body = m[2];
      // Check the -ext subsets first: "-latin-" also matches "-latin-ext-".
      const subset = ['cyrillic-ext', 'latin-ext', 'cyrillic', 'latin'].find((s) => name.includes(`-${s}-`));
      if (!subset) continue;
      const get = (k) => (body.match(new RegExp(`${k}:\\s*([^;]+);`)) || [])[1]?.trim();
      const src = get('src').match(/url\(\.\/files\/([^)]+)\)/)[1];
      mkdirSync(join(OUT, id), { recursive: true });
      copyFileSync(join(pkgDir, 'files', src), join(OUT, id, src));
      faces.push({
        file: `${id}/${src}`,
        style: get('font-style'),
        weight: get('font-weight'),
        ...(get('font-stretch') ? { stretch: get('font-stretch') } : {}),
        unicodeRange: get('unicode-range'),
        variable: /variations/.test(get('src')),
      });
    }
  }
  const lic = ['LICENSE', 'LICENSE.md', 'LICENSE.txt'].map((f) => join(pkgDir, f)).find(existsSync);
  if (lic) copyFileSync(lic, join(OUT, id, 'LICENSE.txt'));
  return { family: spec.family, license: 'OFL-1.1', source: `${spec.pkg}@${version}`, faces };
}

function fromFixel(id) {
  const dir = join(OUT, id);
  mkdirSync(dir, { recursive: true });
  const raw = 'https://raw.githubusercontent.com/MacPaw/Fixel/main';
  execFileSync('curl', ['-sfL', '-o', join(tmp, 'FixelVariable.ttf'), `${raw}/fonts/variable/FixelVariable.ttf`]);
  execFileSync('curl', ['-sfL', '-o', join(dir, 'LICENSE.txt'), `${raw}/OFL.txt`]);
  // The upstream variable font is TTF only; compress it to woff2 with fontTools.
  execFileSync('uv', ['run', '-q', '--with', 'fonttools', '--with', 'brotli', 'python', '-I', '-c',
    `from fontTools.ttLib import TTFont; f=TTFont(r'${join(tmp, 'FixelVariable.ttf')}'); f.flavor='woff2'; f.save(r'${join(dir, 'fixel-variable.woff2')}')`]);
  return {
    family: 'Fixel', license: 'OFL-1.1', source: 'github.com/MacPaw/Fixel (main)',
    faces: [{ file: `${id}/fixel-variable.woff2`, style: 'normal', weight: '100 900', stretch: '87.5% 100%', variable: true }],
    note: 'wdth 87.5 = Fixel Text, wdth 100 = Fixel Display (use font-stretch).',
  };
}

const only = process.argv.slice(2);
const existing = existsSync(join(OUT, 'fonts.json')) ? JSON.parse(readFileSync(join(OUT, 'fonts.json'), 'utf8')) : {};
for (const [id, spec] of Object.entries(FAMILIES)) {
  if (only.length && !only.includes(id)) { if (existing[id]) manifest[id] = existing[id]; continue; }
  process.stdout.write(`${id}… `);
  manifest[id] = spec.github ? fromFixel(id) : fromFontsource(id, spec);
  console.log(`${manifest[id].faces.length} faces`);
}
writeFileSync(join(OUT, 'fonts.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('wrote fonts/fonts.json');
