// Loads palettes, looks, brands and the contract, and resolves looks to flat values.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseColor } from './color.mjs';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

export const pkg = () => readJson(join(ROOT, 'package.json'));
export const contract = () => readJson(join(ROOT, 'tokens', 'contract.json'));
export const fontsManifest = () => readJson(join(ROOT, 'fonts', 'fonts.json'));

export function contractNames(c = contract()) {
  const out = {};
  for (const [group, entries] of Object.entries(c)) {
    if (group.startsWith('$')) continue;
    for (const name of Object.keys(entries)) out[name] = group;
  }
  return out;
}

export function loadPalettes() {
  const dir = join(ROOT, 'tokens', 'palettes');
  const out = {};
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const p = readJson(join(dir, f));
    out[p.id] = { ...p, hex: Object.fromEntries(Object.entries(p.colors).map(([k, v]) => [k, parseColor(v)])) };
  }
  return out;
}

export function loadBrands() {
  const dir = join(ROOT, 'tokens', 'brands');
  return Object.fromEntries(readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => {
    const b = readJson(join(dir, f));
    return [b.id, b];
  }));
}

export function lookIds() {
  return readdirSync(join(ROOT, 'tokens', 'looks')).filter((d) => existsSync(join(ROOT, 'tokens', 'looks', d, 'look.json')));
}

const REF = /^\{([\w-]+)\.([\w-]+)\}$/;

// Returns the look with every colour reference replaced by a hex value and the
// non-colour groups flattened into one map: { color: {light, dark}, values, fonts, ... }.
export function resolveLook(id, palettes = loadPalettes()) {
  const dir = join(ROOT, 'tokens', 'looks', id);
  const look = readJson(join(dir, 'look.json'));
  const color = {};
  for (const scheme of ['light', 'dark']) {
    color[scheme] = {};
    for (const [name, ref] of Object.entries(look.color[scheme])) {
      const m = String(ref).match(REF);
      if (!m) { color[scheme][name] = parseColor(ref); continue; }
      const [, pal, key] = m;
      const hex = palettes[pal]?.hex[key];
      if (!hex) throw new Error(`${id}.${scheme}.${name}: unknown colour ${ref}`);
      color[scheme][name] = hex;
    }
  }
  const sl = look.media.slide, vi = look.media.video;
  const media = {
    'slide-margin': String(sl.margin), 'slide-title': String(sl.title), 'slide-lead': String(sl.lead),
    'slide-body': String(sl.body), 'slide-small': String(sl.small), 'slide-foot': String(sl.foot),
    'video-action-safe': String(vi.actionSafe), 'video-title-safe': String(vi.titleSafe),
  };
  const values = { ...look.size, ...look.type, ...look.space, ...look.layout, ...look.shape, ...look.motion, ...media };
  const manifest = fontsManifest();
  const fonts = {};
  for (const [role, spec] of Object.entries(look.fonts)) {
    const fam = manifest[spec.font];
    if (!fam) throw new Error(`${id}: font ${spec.font} is not in fonts/fonts.json (run scripts/fetch-fonts.mjs)`);
    fonts[role] = { id: spec.font, family: fam.family, cssFamily: `BS ${fam.family}`, stack: `"BS ${fam.family}", ${spec.fallback}` };
    values[`font-${role}`] = fonts[role].stack;
  }
  const read = (f) => (existsSync(join(dir, f)) ? readFileSync(join(dir, f), 'utf8') : '');
  return { ...look, color, values, fonts, prose: read('LOOK.md'), signatureCss: read('signature.css') };
}

export function loadAll() {
  const palettes = loadPalettes();
  const looks = Object.fromEntries(lookIds().map((id) => [id, resolveLook(id, palettes)]));
  return { palettes, looks, brands: loadBrands(), contract: contract(), pkg: pkg() };
}
