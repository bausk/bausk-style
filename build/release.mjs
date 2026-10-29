#!/usr/bin/env node
// Cut a release: node build/release.mjs <version> [--tag]
// Bumps package.json and python/pyproject.toml, freezes the palettes and mappings of every
// released or legacy look in tokens/frozen.json, rebuilds, runs the tests and (with --tag)
// commits and tags v<version>. Pushing stays manual.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT, loadAll } from './lib/tokens.mjs';

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version ?? '')) { console.error('usage: node build/release.mjs <x.y.z> [--tag]'); process.exit(1); }
const run = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });

const pkgPath = join(ROOT, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
const pyPath = join(ROOT, 'python', 'pyproject.toml');
writeFileSync(pyPath, readFileSync(pyPath, 'utf8').replace(/^version = ".*"$/m, `version = "${version}"`));

const changelog = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8');
if (!changelog.includes(`## ${version}`)) { console.error(`CHANGELOG.md has no "## ${version}" entry`); process.exit(1); }

// Freeze: once a look is released or legacy, its mapping and every palette colour it uses are fixed.
const all = loadAll();
const frozenPath = join(ROOT, 'tokens', 'frozen.json');
const frozen = existsSync(frozenPath) ? JSON.parse(readFileSync(frozenPath, 'utf8')) : { palettes: {}, looks: {} };
for (const look of Object.values(all.looks)) {
  if (!['released', 'legacy'].includes(look.status)) continue;
  frozen.looks[look.id] ??= { since: version, color: look.color };
  const pal = all.palettes[look.palette];
  frozen.palettes[pal.id] = { ...pal.hex, ...(frozen.palettes[pal.id] ?? {}) };
}
writeFileSync(frozenPath, JSON.stringify(frozen, null, 2) + '\n');

run('node', ['build/build.mjs']);
run('node', ['build/test.mjs']);
if (process.argv.includes('--tag')) {
  run('git', ['add', '-A']);
  run('git', ['commit', '-m', `release ${version}`]);
  run('git', ['tag', '-a', `v${version}`, '-m', `bausk-style ${version}`]);
  console.log(`tagged v${version}; push with: git push && git push --tags`);
}
