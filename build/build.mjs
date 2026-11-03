#!/usr/bin/env node
// Builds dist/ and the Python package data from tokens/, components/ and fonts/.
//   node build/build.mjs
import { rmSync, mkdirSync, writeFileSync, copyFileSync, cpSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, loadAll, contractNames } from './lib/tokens.mjs';
import { bundleCss, tokensCss, fontsCss, header } from './emit/css.mjs';
import { tailwindCss } from './emit/tailwind.mjs';
import { jsModule, jsTypes } from './emit/js.mjs';
import { dtcg, plotlyTemplate, mplstyle, brandYml } from './emit/data.mjs';
import { designMd } from './emit/designmd.mjs';
import { quartoExtension } from './emit/quarto.mjs';
import { renderSpecimen, renderIndex } from '../specimen/specimen.mjs';

const DIST = join(ROOT, 'dist');
const all = loadAll();
const meta = { version: all.pkg.version };
const write = (rel, content) => {
  const p = join(DIST, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, typeof content === 'string' ? content : JSON.stringify(content, null, 2) + '\n');
};
const json = (o) => JSON.stringify(o, null, 2) + '\n';

rmSync(DIST, { recursive: true, force: true });

// fonts (woff2 + licence files only)
// fonts: woff2 for the web, fonts/ttf/ for desktop tools (matplotlib, PowerPoint)
for (const fam of readdirSync(join(ROOT, 'fonts'))) {
  const dir = join(ROOT, 'fonts', fam);
  if (statSync(dir).isDirectory()) cpSync(dir, join(DIST, 'fonts', fam), { recursive: true });
}

const lookList = Object.values(all.looks).sort((a, b) => (a.status === 'legacy') - (b.status === 'legacy') || a.id.localeCompare(b.id));

for (const look of lookList) {
  const id = look.id;
  write(`css/${id}.css`, bundleCss(look, meta));
  write(`css/${id}.tokens.css`, header(look, meta, 'tokens only') + `@layer bs.tokens, bs.base, bs.components, bs.signature;\n` + tokensCss(look));
  write(`css/${id}.fonts.css`, header(look, meta, '@font-face only') + fontsCss(look));
  write(`tailwind/${id}.css`, tailwindCss(look, all.contract, meta));
  write(`json/${id}.json`, json({ version: meta.version, id, name: look.name, status: look.status, reference: look.reference, color: look.color, values: look.values, media: look.media, fonts: look.fonts, desktop: look.desktop ?? null }));
  for (const scheme of ['light', 'dark']) {
    write(`dtcg/${id}.${scheme}.tokens.json`, json(dtcg(look, scheme, all.contract, meta)));
    write(`plotly/${id}-${scheme}.json`, json(plotlyTemplate(look, scheme)));
    for (const medium of ['paper', 'screen', 'slide']) {
      if (medium === 'paper' && scheme === 'dark') continue;
      write(`mpl/${id}-${scheme}-${medium}.mplstyle`, mplstyle(look, scheme, medium, meta));
    }
  }
  write(`quarto/${id}/_brand.yml`, brandYml(look, all.brands.bausk, 'light'));
  write(`quarto/${id}/_brand-dark.yml`, brandYml(look, all.brands.bausk, 'dark'));
  quartoExtension(look, all.brands.bausk, meta, join(DIST, 'quarto', id));
  write(`design/bausk.${id}.DESIGN.md`, designMd(look, all.brands.bausk, meta));
  write(`specimen/${id}.html`, renderSpecimen(look, all.brands.bausk, meta, lookList));
}
write('specimen/index.html', renderIndex(lookList, meta));

// brand entry points follow the brand's default look
for (const brand of Object.values(all.brands)) {
  if (!brand.defaultLook) continue;
  const look = all.looks[brand.defaultLook];
  const note = `/* Brand "${brand.id}" → look "${look.id}". This file follows the brand's default look and changes when a release moves it.\n   To freeze a project on this look, import css/${look.id}.css instead. */\n`;
  write(`css/${brand.id}.css`, note + bundleCss(look, meta));
  write(`tailwind/${brand.id}.css`, note + tailwindCss(look, all.contract, meta));
  write(`design/${brand.id}.DESIGN.md`, designMd(look, brand, meta));
}

write('js/index.mjs', jsModule(all, meta));
write('js/index.d.ts', jsTypes(all.contract, meta));
write('json/index.json', json({
  version: meta.version,
  contract: contractNames(all.contract),
  brands: Object.fromEntries(Object.values(all.brands).map((b) => [b.id, { status: b.status, defaultLook: b.defaultLook }])),
  looks: Object.fromEntries(lookList.map((l) => [l.id, { name: l.name, status: l.status, since: l.since, palette: l.palette }])),
}));

// Python package data
const py = join(ROOT, 'python', 'bausk_style', 'data');
rmSync(py, { recursive: true, force: true });
mkdirSync(join(py, 'mpl'), { recursive: true });
mkdirSync(join(py, 'plotly'), { recursive: true });
writeFileSync(join(py, 'looks.json'), json({ version: meta.version, brands: Object.fromEntries(Object.values(all.brands).map((b) => [b.id, { defaultLook: b.defaultLook }])), looks: Object.fromEntries(lookList.map((l) => [l.id, { name: l.name, status: l.status, color: l.color, values: l.values, media: l.media, fonts: Object.fromEntries(Object.entries(l.fonts).map(([r, f]) => [r, f.family])), desktop: l.desktop ?? null }])) }));
for (const l of lookList) for (const f of l.desktop?.files ?? []) {
  mkdirSync(dirname(join(py, 'fonts', f)), { recursive: true });
  copyFileSync(join(ROOT, 'fonts', 'ttf', f), join(py, 'fonts', f));
  const lic = join(ROOT, 'fonts', 'ttf', dirname(f), 'LICENSE.txt');
  copyFileSync(lic, join(py, 'fonts', dirname(f), 'LICENSE.txt'));
}
for (const f of readdirSync(join(DIST, 'mpl'))) copyFileSync(join(DIST, 'mpl', f), join(py, 'mpl', f));
for (const f of readdirSync(join(DIST, 'plotly'))) copyFileSync(join(DIST, 'plotly', f), join(py, 'plotly', f));

// PowerPoint templates (python-pptx through uv). Skipped with a warning when uv is missing.
for (const l of lookList.filter((x) => x.status !== 'legacy')) {
  try {
    execFileSync('uv', ['run', '-q', '--no-project', '--with', 'python-pptx', 'python', '-I', join(ROOT, 'build', 'pptx', 'make_template.py'), l.id, join(DIST, 'pptx')], { stdio: 'pipe' });
  } catch (e) {
    console.warn(`warning: PowerPoint template for ${l.id} not built (${(e.stderr?.toString() || e.message).trim().split('\n').pop()})`);
  }
}

const count = (d) => readdirSync(d, { recursive: true }).filter((f) => statSync(join(d, f)).isFile()).length;
console.log(`bausk-style ${meta.version}: ${lookList.length} looks → dist/ (${count(DIST)} files)`);
