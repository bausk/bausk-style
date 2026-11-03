#!/usr/bin/env node
// bausk-style CLI. Run `bausk-style help`.
import { existsSync, readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { PKG_ROOT, CONFIG, MEDIA, pkgVersion, findProject, readConfig, loadIndex, resolveLookId, loadLook, effectiveRules } from './lib.mjs';
import { check } from './check.mjs';

const HELP = `bausk-style ${pkgVersion()} — house style tokens, looks, guide and checks

Usage: bausk-style <command> [options]

  brief [--media m,..]    Print the design brief for this project: look, tokens, rules,
                          what to read next and how to verify. Agents start here.
  init  [--brand bausk] [--look default|<id>] [--media m,..] [--scheme auto|light|dark] [--agents]
                          Create bausk-style.json and DESIGN.md here (and the Quarto extension
                          _extensions/bausk/ for slides). --agents adds a short pointer block to AGENTS.md/CLAUDE.md.
  sync                    Regenerate DESIGN.md and copied assets for the installed version;
                          keeps everything under "## Project rules".
  check [paths..] [--json]
                          Guardrail scan (raw colours, Tailwind palette, shadows, gradients,
                          radii, fonts, emoji, copy, name spelling). Exit 1 on errors.
  rules [--media m,..]    List the rules in force (system + look + project).
  looks                   List looks and their status.
  shot <file|url> [--out f.png] [--width 1440] [--scheme light|dark] [--selector css]
                          Screenshot a page with headless Chromium for visual review.
  video <kind> [--out f.png] [--scheme light|dark] ...
                          Render video graphics as PNG in the project's look:
                          titlecard --title --sub · chapter --title [--sub] · lowerthird --name --role
                          (transparent) · endcard --title [--sub] [--links] · thumbnail --words [--image]
  path                    Print the package directory (guide/, rules/, dist/ live there).

Media: ${MEDIA.join(', ')}`;

const args = process.argv.slice(2);
const cmd = args[0] ?? 'help';
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : def; };
const list = (v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);
const VALUED = new Set(['--media', '--brand', '--look', '--scheme', '--out', '--width', '--selector', '--title', '--sub', '--name', '--role', '--links', '--words', '--image', '--lang']);
const positional = () => {
  const out = [];
  for (let i = 1; i < args.length; i++) {
    if (VALUED.has(args[i])) { i++; continue; }
    if (!args[i].startsWith('--')) out.push(args[i]);
  }
  return out;
};

function context() {
  const projectDir = findProject();
  const config = readConfig(projectDir) ?? {};
  const index = loadIndex();
  const lookId = resolveLookId(config, index);
  return { projectDir, config, index, lookId, look: loadLook(lookId) };
}

const PROJECT_MARK = '<!-- bausk-style:project-rules — everything below this line is yours; `bausk-style sync` keeps it -->';

async function designMdFor(look, brandId, keep) {
  const { designMd } = await import('../build/emit/designmd.mjs');
  const { resolveLook, loadBrands } = await import('../build/lib/tokens.mjs');
  const brand = loadBrands()[brandId];
  const full = resolveLook(look);
  const body = designMd(full, brand, { version: pkgVersion() });
  const tail = keep ?? `## Project rules\n\nRules for this project only. They add to the bausk-style rules and the look; to switch a\nsystem rule off, use "rules.off" in bausk-style.json with a reason. Larger rules can live in\ndesign/rules/<id>.md (same format as the package's rules/).\n\n- (none yet)\n`;
  return `${body.trimEnd()}\n\n${PROJECT_MARK}\n\n${tail.trim()}\n`;
}

// Slides: the Quarto reveal.js extension for the look (fonts included). Decks use `format: bausk-revealjs`.
function copyQuarto(projectDir, lookId) {
  const src = join(PKG_ROOT, 'dist', 'quarto', lookId, '_extensions', 'bausk');
  cpSync(src, join(projectDir, '_extensions', 'bausk'), { recursive: true });
}

const AGENTS_BLOCK = `<!-- bausk-style:begin -->
## Visual style

This project uses **bausk-style** (see \`bausk-style.json\` and \`DESIGN.md\`). Before any visual or
presentational work (UI, charts, slides, figures, video, game screens, and the copy inside them), run
\`npx bausk-style brief\` and follow it. Before calling the work done, run \`npx bausk-style check\`
and look at a screenshot at the size it ships.
<!-- bausk-style:end -->`;

// Concrete entry points per medium, printed in the brief.
function toolsFor(media, lookId) {
  const T = {
    slides: `Slides: \`format: bausk-revealjs\` (extension in _extensions/bausk/, from \`bausk-style init --media slides\`). Worked deck: ${join(PKG_ROOT, 'templates', 'slides-quarto', 'lecture.qmd')}`,
    pptx: `PowerPoint: template ${join(PKG_ROOT, 'dist', 'pptx', `bausk-${lookId}.potx`)}; fonts via scripts/install-fonts-windows.ps1; check with scripts/render-pptx-windows.ps1`,
    video: 'Video: `bausk-style video titlecard|chapter|lowerthird|endcard|thumbnail ...` writes PNGs (lower third is transparent)',
    figures: 'Figures: `bausk_style.use("default", medium="paper"|"screen"|"slide")`, `bausk_style.figsize("single")`, `bausk_style.plotly_template()`',
    dashboard: 'Dashboard: Tailwind `bausk-style/tailwind/<brand|look>.css`; charts `lightweightChartsOptions(readTokens())` + `candleColors(t)` from "bausk-style"',
    game: 'Game: `readTokens()` and `toInt(hex)` from "bausk-style" for canvas/Phaser/PixiJS colours; HUD markup `bs-hud`, board `bs-board`',
    reading: 'Reading: components `bs-article__title`, `bs-meta`, `bs-prose`, `bs-figure`, `bs-entries`; CSS `bausk-style/css/<brand|look>.css`',
  };
  const lines = (media.length ? media : ['reading']).map((m) => T[m]).filter(Boolean);
  return lines.length ? `## Tools\n\n${lines.map((l) => `- ${l}`).join('\n')}\n\n` : '';
}

async function main() {
  switch (cmd) {
    case 'help': case '--help': case '-h': console.log(HELP); return;
    case 'path': console.log(PKG_ROOT); return;

    case 'looks': {
      const index = loadIndex();
      for (const [id, l] of Object.entries(index.looks)) {
        const brands = Object.entries(index.brands).filter(([, b]) => b.defaultLook === id).map(([b]) => b);
        console.log(`${id.padEnd(10)} ${l.status.padEnd(10)} ${l.name.en} / ${l.name.uk}${brands.length ? `   ← default for ${brands.join(', ')}` : ''}`);
      }
      return;
    }

    case 'rules': {
      const { projectDir, config, lookId } = context();
      const media = list(opt('media')).length ? list(opt('media')) : config.media ?? [];
      for (const r of effectiveRules({ projectDir, config, lookId, media })) {
        console.log(`${r.disabled ? 'off ' : ''}${(r.severity ?? '').padEnd(6)} ${r.id.padEnd(24)} ${r.title}${r.disabled ? `  (off: ${r.disabled})` : ''}  [${r.source}]`);
      }
      return;
    }

    case 'brief': {
      const { projectDir, config, index, lookId, look } = context();
      const media = list(opt('media')).length ? list(opt('media')) : config.media ?? [];
      const rules = effectiveRules({ projectDir, config, lookId, media });
      const prose = readFileSync(join(PKG_ROOT, 'tokens', 'looks', lookId, 'LOOK.md'), 'utf8');
      const L = look.color.light, D = look.color.dark;
      const colorRows = Object.keys(L).map((k) => `| \`--bs-${k}\` | ${L[k]} | ${D[k]} |`).join('\n');
      const v = look.values;
      const mediaGuides = (media.length ? media : ['reading']).filter((m) => existsSync(join(PKG_ROOT, 'guide', 'media', `${m}.md`)));
      const projRulesFile = projectDir && existsSync(join(projectDir, 'DESIGN.md')) ? readFileSync(join(projectDir, 'DESIGN.md'), 'utf8').split(PROJECT_MARK)[1]?.trim() : '';
      const out = `# Design brief · bausk-style ${pkgVersion()}

Project: ${projectDir ?? '(no bausk-style.json found; using defaults; run `bausk-style init`)'}
Brand: ${config.brand ?? 'bausk'} · Look: **${lookId}** (${look.status}${(config.look ?? 'default') === 'default' ? ', follows the brand default' : ', pinned'}) · Scheme: ${config.scheme ?? 'auto'} · Media: ${media.join(', ') || 'not set'}
${look.status === 'candidate' ? '\n> This look is a **candidate** (0.x). Values may still change before 1.0.\n' : ''}${look.status === 'legacy' ? '\n> This look is **legacy**: frozen, kept for existing work only. Do not start new work in it.\n' : ''}
## Precedence

1. Accessibility floors and rules marked \`must\` below.
2. Project rules (DESIGN.md "Project rules", design/rules/, bausk-style.json).
3. The look (below) and the guide.
4. Generic design skills or habits (frontend-design, impeccable, your own taste). They do not
   override this brief: spend novelty only where the look names a signature.

## The look
${prose.replace(/^## /gm, '### ')}
## Tokens (use the names, never the values)

CSS: \`@import "bausk-style/css/${(config.look ?? 'default') === 'default' ? (config.brand ?? 'bausk') : lookId}.css"\` · Tailwind v4: also \`bausk-style/tailwind/…\` · JS: \`import { tokens, readTokens } from "bausk-style"\` · Python: \`bausk_style.use("${lookId}")\`

| Token | Light | Dark |
|---|---|---|
${colorRows}

Fonts: text ${look.fonts.text.family}; ui ${look.fonts.ui.family}; display ${look.fonts.display.family}; mono ${look.fonts.mono.family}.
Sizes: ${['2xs', 'xs', 'sm', 'md', 'text', 'lg', 'xl', '2xl', '3xl', '4xl'].map((s) => `${s} ${v[`size-${s}`]}`).join(' · ')}
Space: ${[1, 2, 3, 4, 5, 6, 7, 8].map((s) => `${s}=${v[`space-${s}`]}`).join(' ')} · Measure ${v['measure-text']} · Radius ${v.radius}/${v['radius-control']} · Lines ${v['line-w']}/${v['line-w-strong']}
Components (class API, same in every look): bs-page, bs-header, bs-nav, bs-section-head, bs-entries/bs-entry, bs-article__title, bs-article__standfirst, bs-meta, bs-prose, bs-figure, bs-callout, bs-mark, bs-label, bs-table, bs-panel, bs-stat, bs-tag, bs-btn(--primary), bs-input, bs-segmented, bs-chart, bs-slide(--section), bs-video(--section), bs-titlecard, bs-lowerthird, bs-thumb__words, bs-hud, bs-board. Worked example of every one: ${join(PKG_ROOT, 'dist', 'specimen', `${lookId}.html`)}

## Rules in force${media.length ? ` (${media.join(', ')})` : ''}

${rules.map((r) => `- **${r.id}** (${r.severity}${r.disabled ? `, switched off: ${r.disabled}` : ''}${r.source !== 'system' ? `, ${r.source}` : ''}): ${r.title}`).join('\n')}

Full text: ${join(PKG_ROOT, 'rules')}/<id>.md${projectDir ? ` and ${join(projectDir, config.rulesDir ?? 'design/rules')}/` : ''}
${projRulesFile ? `\n## Project rules (from DESIGN.md)\n\n${projRulesFile.replace(/^## Project rules\s*/m, '')}\n` : ''}
${toolsFor(media, lookId)}## Read next

- ${join(PKG_ROOT, 'guide', 'anti-slop.md')}
${mediaGuides.map((m) => `- ${join(PKG_ROOT, 'guide', 'media', `${m}.md`)}`).join('\n')}
- ${join(PKG_ROOT, 'guide', 'voice.md')} (any user-facing text)

## Verify before calling it done

1. \`bausk-style check\` passes (no errors; explain any warning you keep).
2. Screenshot at shipping sizes (\`bausk-style shot <url> --width 390\` and \`--width 1440\`; slides and video at 1920×1080) and compare with the specimen.
3. For web UI, \`npx impeccable detect <url>\` if available, for generic slop the token checks cannot see.
4. In your report, name any rule you could not follow and why.
`;
      console.log(out);
      return;
    }

    case 'init': {
      const dir = process.cwd();
      if (existsSync(join(dir, CONFIG)) && !opt('force')) { console.error(`${CONFIG} already exists; use \`bausk-style sync\` (or --force)`); process.exit(1); }
      const index = loadIndex();
      const brand = opt('brand', 'bausk');
      if (!index.brands[brand] || index.brands[brand].status === 'reserved') { console.error(`brand "${brand}" is not available (${index.brands[brand]?.status ?? 'unknown'})`); process.exit(1); }
      const config = {
        $schema: 'https://raw.githubusercontent.com/bausk/bausk-style/main/bausk-style.schema.json',
        version: pkgVersion(),
        brand,
        look: opt('look', 'default'),
        scheme: opt('scheme', 'auto'),
        media: list(opt('media', '')),
        languages: ['uk', 'en'],
        rules: { off: {} },
        check: { allowColors: [] },
      };
      const lookId = resolveLookId(config, index);
      writeFileSync(join(dir, CONFIG), JSON.stringify(config, null, 2) + '\n');
      writeFileSync(join(dir, 'DESIGN.md'), await designMdFor(lookId, brand));
      const made = [CONFIG, 'DESIGN.md'];
      if (config.media.includes('slides')) { copyQuarto(dir, lookId); made.push('_extensions/bausk/'); }
      if (opt('agents')) {
        for (const f of ['AGENTS.md', 'CLAUDE.md']) {
          const p = join(dir, f);
          if (f === 'CLAUDE.md' && !existsSync(p)) continue;
          const cur = existsSync(p) ? readFileSync(p, 'utf8') : '';
          if (cur.includes('bausk-style:begin')) continue;
          writeFileSync(p, `${cur.trimEnd()}${cur ? '\n\n' : ''}${AGENTS_BLOCK}\n`);
          made.push(f);
        }
      }
      console.log(`bausk-style ${pkgVersion()}: look "${lookId}" → wrote ${made.join(', ')}`);
      if (!opt('agents')) console.log(`\nAdd this to AGENTS.md (or rerun with --agents):\n\n${AGENTS_BLOCK}`);
      return;
    }

    case 'sync': {
      const projectDir = findProject();
      if (!projectDir) { console.error(`no ${CONFIG} found; run \`bausk-style init\``); process.exit(1); }
      const config = readConfig(projectDir);
      const lookId = resolveLookId(config);
      const dmPath = join(projectDir, 'DESIGN.md');
      const keep = existsSync(dmPath) ? readFileSync(dmPath, 'utf8').split(PROJECT_MARK)[1] : undefined;
      writeFileSync(dmPath, await designMdFor(lookId, config.brand ?? 'bausk', keep));
      if (existsSync(join(projectDir, '_extensions', 'bausk')) || (config.media ?? []).includes('slides')) copyQuarto(projectDir, lookId);
      const prev = config.version;
      config.version = pkgVersion();
      writeFileSync(join(projectDir, CONFIG), JSON.stringify(config, null, 2) + '\n');
      console.log(`synced ${relative(process.cwd(), projectDir) || '.'}: ${prev} → ${pkgVersion()}, look "${lookId}"`);
      return;
    }

    case 'check': {
      const projectDir = findProject() ?? process.cwd();
      const config = readConfig(findProject()) ?? {};
      let lookStatus = null;
      try { lookStatus = loadLook(resolveLookId(config)).status; } catch {}
      const paths = positional().map((p) => resolve(p));
      const findings = check({ root: projectDir, paths, config, lookStatus });
      if (opt('json')) { console.log(JSON.stringify({ version: pkgVersion(), findings }, null, 2)); }
      else {
        for (const f of findings) console.log(`${f.file}:${f.line}:${f.col}  ${f.severity.padEnd(5)}  ${f.rule.padEnd(20)}  ${f.message}`);
        const e = findings.filter((f) => f.severity === 'error').length;
        console.log(`\nbausk-style check: ${e} errors, ${findings.length - e} warnings`);
      }
      process.exit(findings.some((f) => f.severity === 'error') ? 1 : 0);
    }

    case 'shot': {
      const { shoot } = await import('./shoot.mjs');
      const target = positional()[0];
      if (!target) { console.error('usage: bausk-style shot <file|url> [--out f.png] [--width 1440]'); process.exit(1); }
      const out = opt('out', 'bausk-style-shot.png');
      const [file] = await shoot([{ url: target, out, width: Number(opt('width', 1440)), scheme: opt('scheme', 'light'), selector: opt('selector') || undefined }]);
      console.log(resolve(file));
      return;
    }

    case 'video': {
      const { renderVideo } = await import('./video.mjs');
      const kind = positional()[0];
      const config = readConfig(findProject()) ?? {};
      const lookId = resolveLookId(config);
      const css = join(PKG_ROOT, 'dist', 'css', `${lookId}.css`);
      const get = (k) => (typeof opt(k) === 'string' ? opt(k) : undefined);
      const file = await renderVideo({
        kind, cssPath: css, out: get('out') ?? `${kind}.png`, scheme: get('scheme') ?? 'light', lang: get('lang') ?? 'uk',
        opts: { title: get('title'), sub: get('sub'), name: get('name'), role: get('role'), links: get('links'), words: get('words'), image: get('image') },
      });
      console.log(file);
      return;
    }

    default:
      console.error(`unknown command "${cmd}"\n\n${HELP}`);
      process.exit(1);
  }
}

main().catch((e) => { console.error(`bausk-style: ${e.message}`); process.exit(1); });
