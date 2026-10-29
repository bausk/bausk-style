// Shared helpers for the CLI: package root, project config, rules.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const pkgVersion = () => JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8')).version;
export const CONFIG = 'bausk-style.json';

export const MEDIA = ['reading', 'dashboard', 'slides', 'pptx', 'figures', 'game', 'video', 'web'];

// Walks up from `start` to the first directory containing bausk-style.json.
export function findProject(start = process.cwd()) {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, CONFIG))) return dir;
    const up = dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

export function readConfig(projectDir) {
  if (!projectDir) return null;
  return JSON.parse(readFileSync(join(projectDir, CONFIG), 'utf8'));
}

export function loadIndex() {
  return JSON.parse(readFileSync(join(PKG_ROOT, 'dist', 'json', 'index.json'), 'utf8'));
}

export function resolveLookId(config, index = loadIndex()) {
  const brand = config?.brand ?? 'bausk';
  const look = config?.look ?? 'default';
  if (look !== 'default') return look;
  const b = index.brands[brand];
  if (!b?.defaultLook) throw new Error(`brand "${brand}" has no default look yet`);
  return b.defaultLook;
}

export function loadLook(id) {
  const p = join(PKG_ROOT, 'dist', 'json', `${id}.json`);
  if (!existsSync(p)) throw new Error(`unknown look "${id}"`);
  return JSON.parse(readFileSync(p, 'utf8'));
}

// ---- rules: markdown files with a small front-matter block -----------------
export function parseRule(text, file) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing front matter`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('[')) v = v.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
    meta[kv[1]] = v;
  }
  return { ...meta, applies: meta.applies ?? ['all'], body: m[2].trim(), file };
}

export function loadRules(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('_') && f !== 'README.md')
    .map((f) => parseRule(readFileSync(join(dir, f), 'utf8'), join(dir, f)));
}

// System rules + look rules + project rules, filtered by media, with project switches applied.
export function effectiveRules({ projectDir, config, lookId, media = [] }) {
  const system = loadRules(join(PKG_ROOT, 'rules')).map((r) => ({ ...r, source: 'system' }));
  const look = loadRules(join(PKG_ROOT, 'tokens', 'looks', lookId, 'rules')).map((r) => ({ ...r, source: `look:${lookId}` }));
  const project = projectDir ? loadRules(join(projectDir, config?.rulesDir ?? 'design/rules')).map((r) => ({ ...r, source: 'project' })) : [];
  const off = config?.rules?.off ?? {};
  const byId = new Map();
  for (const r of [...system, ...look, ...project]) byId.set(r.id, r); // later sources replace earlier ones with the same id
  const wanted = new Set(media.length ? [...media, 'all'] : null);
  const out = [];
  for (const r of byId.values()) {
    const applies = Array.isArray(r.applies) ? r.applies : [r.applies];
    if (media.length && !applies.some((a) => wanted.has(a) || (a === 'web' && media.some((m) => ['reading', 'dashboard', 'game'].includes(m))))) continue;
    if (off[r.id]) {
      if (r.severity === 'must' && r.source === 'system' && r.locked === 'true') { out.push({ ...r, note: `cannot be switched off (${off[r.id]})` }); continue; }
      out.push({ ...r, disabled: off[r.id] });
      continue;
    }
    out.push(r);
  }
  const rank = { must: 0, should: 1 };
  return out.sort((a, b) => (rank[a.severity] ?? 2) - (rank[b.severity] ?? 2) || a.id.localeCompare(b.id));
}
