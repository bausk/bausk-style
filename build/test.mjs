#!/usr/bin/env node
// Release gate. Fails (exit 1) when a look breaks the contract, accessibility floors,
// chart separability, palette immutability or semver rules.
//   node build/test.mjs
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT, loadAll, contractNames } from './lib/tokens.mjs';
import { contrast, deltaE, simulate } from './lib/color.mjs';

const all = loadAll();
const failures = [];
const warnings = [];
let checks = 0;
const ok = (cond, msg, warnOnly = false) => { checks++; if (!cond) (warnOnly ? warnings : failures).push(msg); };

// ---- 1. contract: every look defines every name ---------------------------
const names = contractNames(all.contract);
for (const look of Object.values(all.looks)) {
  for (const [name, group] of Object.entries(names)) {
    if (group === 'color') for (const s of ['light', 'dark']) ok(look.color[s][name], `${look.id}/${s}: missing colour token "${name}"`);
    else ok(look.values[name] !== undefined, `${look.id}: missing token "${name}" (${group})`);
  }
  for (const s of ['light', 'dark']) for (const k of Object.keys(look.color[s])) ok(names[k] === 'color', `${look.id}/${s}: "${k}" is not in tokens/contract.json`);
  for (const p of ['LOOK.md', 'signature.css']) ok(existsSync(join(ROOT, 'tokens', 'looks', look.id, p)), `${look.id}: missing ${p}`);
  for (const sec of ['## Overview', '## Colors', '## Typography', "## Do's and Don'ts"]) ok(look.prose.includes(sec), `${look.id}: LOOK.md lacks "${sec}"`);
}

// ---- 2. accessibility floors (WCAG 2.2 contrast) ----------------------------
const floors = [
  ['fg', 'bg', 7], ['fg-muted', 'bg', 4.5], ['fg-subtle', 'bg', 4.5], ['fg-subtle', 'bg-subtle', 4.5],
  ['accent', 'bg', 4.5], ['accent', 'bg-subtle', 4.5], ['accent-strong', 'bg', 4.5], ['on-accent', 'accent', 4.5],
  ['fg-inverse', 'bg-inverse', 7], ['fg', 'accent-subtle', 4.5], ['fg', 'selection', 4.5],
  ['line-strong', 'bg', 3], ['focus', 'bg', 3], ['positive', 'bg', 4.5], ['negative', 'bg', 4.5], ['caution', 'bg', 3],
  ['viz-label', 'bg', 4.5], ['viz-axis', 'bg', 3],
  ['viz-1', 'bg', 3], ['viz-2', 'bg', 3], ['viz-3', 'bg', 3], ['viz-4', 'bg', 3], ['viz-up', 'bg', 3], ['viz-down', 'bg', 3],
];
for (const look of Object.values(all.looks)) for (const s of ['light', 'dark']) {
  const c = look.color[s];
  for (const [a, b, min] of floors) {
    const r = contrast(c[a], c[b]);
    ok(r >= min, `${look.id}/${s}: ${a} on ${b} is ${r.toFixed(2)}:1, needs ${min}:1`, look.status === 'legacy');
  }
  for (const k of ['viz-5', 'viz-6']) ok(contrast(c[k], c.bg) >= 2.5, `${look.id}/${s}: ${k} on bg is ${contrast(c[k], c.bg).toFixed(2)}:1 (< 2.5, label it directly)`, true);
}

// ---- 3. charts stay distinguishable, incl. colour-vision deficiency --------
for (const look of Object.values(all.looks)) for (const s of ['light', 'dark']) {
  const c = look.color[s];
  const first4 = [1, 2, 3, 4].map((i) => c[`viz-${i}`]);
  const all6 = [1, 2, 3, 4, 5, 6].map((i) => c[`viz-${i}`]);
  for (const [type, min4, min6] of [['none', 10, 9], ['protan', 5, 3], ['deutan', 5, 3], ['tritan', 4, 3]]) {
    const sim = (h) => (type === 'none' ? h : simulate(h, type));
    const minPair = (cols) => { let m = Infinity; for (let i = 0; i < cols.length; i++) for (let j = i + 1; j < cols.length; j++) m = Math.min(m, deltaE(sim(cols[i]), sim(cols[j]))); return m; };
    ok(minPair(first4) >= min4, `${look.id}/${s}: series 1-4 too close under ${type} (ΔE ${minPair(first4).toFixed(1)} < ${min4})`, look.status === 'legacy');
    ok(minPair(all6) >= min6, `${look.id}/${s}: series 1-6 too close under ${type} (ΔE ${minPair(all6).toFixed(1)} < ${min6})`, true);
    const ud = deltaE(sim(c['viz-up']), sim(c['viz-down']));
    ok(ud >= 15, `${look.id}/${s}: up/down too close under ${type} (ΔE ${ud.toFixed(1)})`, look.status === 'legacy');
  }
}

// ---- 4. brands point at real looks ------------------------------------------
for (const b of Object.values(all.brands)) {
  if (b.status === 'reserved') continue;
  ok(all.looks[b.defaultLook], `brand ${b.id}: defaultLook "${b.defaultLook}" does not exist`);
  ok(!['legacy', 'deprecated'].includes(all.looks[b.defaultLook]?.status), `brand ${b.id}: defaultLook "${b.defaultLook}" is ${all.looks[b.defaultLook]?.status}`);
}

// ---- 5. frozen palettes and looks do not change ------------------------------
// tokens/frozen.json is written by `node build/release.mjs` when a version is cut.
const frozenPath = join(ROOT, 'tokens', 'frozen.json');
if (existsSync(frozenPath)) {
  const frozen = JSON.parse(readFileSync(frozenPath, 'utf8'));
  for (const [pid, colors] of Object.entries(frozen.palettes ?? {})) {
    const cur = all.palettes[pid];
    ok(cur, `frozen palette "${pid}" was removed; palettes are append-only (deprecate instead)`);
    if (cur) for (const [k, hex] of Object.entries(colors)) ok(cur.hex[k] === hex, `frozen palette ${pid}.${k} changed ${hex} → ${cur.hex[k] ?? 'removed'}; add a new colour or palette instead`);
  }
  for (const [lid, snap] of Object.entries(frozen.looks ?? {})) {
    const cur = all.looks[lid];
    ok(cur, `frozen look "${lid}" was removed; mark it deprecated instead`);
    if (!cur) continue;
    for (const s of ['light', 'dark']) for (const [k, hex] of Object.entries(snap.color[s])) {
      if (cur.color[s][k] !== hex) warnings.push(`frozen look ${lid}/${s}.${k} changed ${hex} → ${cur.color[s][k]}; allowed only as a documented patch fix (CHANGELOG "Fixed")`);
    }
  }
}

// ---- 6. semver: no contract name disappears without a major bump ------------
try {
  const tags = execFileSync('git', ['tag', '--list', 'v*', '--sort=-v:refname'], { cwd: ROOT }).toString().trim().split('\n').filter(Boolean);
  if (tags.length) {
    const prev = tags[0];
    const prevContract = JSON.parse(execFileSync('git', ['show', `${prev}:tokens/contract.json`], { cwd: ROOT }).toString());
    const removed = Object.keys(contractNames(prevContract)).filter((n) => !names[n]);
    const major = (v) => Number(v.replace(/^v/, '').split('.')[0]);
    const cur = all.pkg.version;
    if (removed.length) ok(major(cur) > major(prev) || major(prev) === 0, `contract names removed since ${prev} (${removed.join(', ')}) need a major version bump (now ${cur})`);
  }
} catch { /* not a git checkout or no tags */ }

// ---- 7. dist is current -----------------------------------------------------
const distIndex = join(ROOT, 'dist', 'json', 'index.json');
ok(existsSync(distIndex) && JSON.parse(readFileSync(distIndex, 'utf8')).version === all.pkg.version, 'dist/ is missing or stale: run node build/build.mjs');

for (const w of warnings) console.log(`warn  ${w}`);
for (const f of failures) console.log(`FAIL  ${f}`);
console.log(`${checks} checks · ${failures.length} failed · ${warnings.length} warnings`);
process.exit(failures.length ? 1 : 0);
