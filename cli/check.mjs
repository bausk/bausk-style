// `bausk-style check`: deterministic guardrails for a project.
// It catches what a reviewer would reject on sight: raw colours, Tailwind's default palette,
// shadows, gradients, glass, off-token radii and fonts, emoji icons, AI-flavoured copy,
// misspelled names and a stale DESIGN.md. Design judgement is still the agent's job.
// Suppress one finding with a comment on the same or previous line:
//   bausk-style-ignore <rule-id>: <reason>
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { pkgVersion } from './lib.mjs';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next', '.nuxt', '.svelte-kit', '.astro', 'coverage', 'vendor', '.venv', 'venv', '__pycache__', '.quarto', '_site', '_freeze', '.ref', '.shots', 'fonts']);
const STYLE = new Set(['.css', '.scss', '.sass', '.less']);
const MARKUP = new Set(['.html', '.hbs', '.vue', '.svelte', '.astro', '.jsx', '.tsx']);
const SCRIPT = new Set(['.js', '.mjs', '.cjs', '.ts', '.mts']);
const PY = new Set(['.py']);
const TEXT = new Set(['.md', '.mdx', '.qmd']);
const ALL = new Set([...STYLE, ...MARKUP, ...SCRIPT, ...PY, ...TEXT]);

const TW_COLORS = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black';
const TW_PREFIX = 'bg|text|border|border-[trblxy]|ring|ring-offset|fill|stroke|from|via|to|outline|decoration|divide|placeholder|accent|caret';

// Copy that reads as machine-written or as marketing filler. Warnings, with a suggestion.
const SLOP = [
  [/\bseamless(ly)?\b/i, 'say what actually connects to what'],
  [/\b(elevate|empower|unlock|supercharge|revolutioni[sz]e)\w*\b/i, 'name the concrete effect'],
  [/\bdelve\b/i, 'use "look at", "examine" or nothing'],
  [/\b(game[- ]changer|cutting[- ]edge|state[- ]of[- ]the[- ]art|next[- ]level|world[- ]class|best[- ]in[- ]class)\b/i, 'give the measurement instead'],
  [/\bin today'?s (fast[- ]paced|digital|ever[- ]changing)\b/i, 'delete the opener; start with the point'],
  [/\b(tapestry|testament to|plays a (crucial|pivotal|vital) role)\b/i, 'state the fact plainly'],
  [/\b(let'?s dive in|without further ado|in conclusion|in summary)\b/i, 'delete it'],
  [/\b(robust and scalable|scalable and robust)\b/i, 'say what load or failure it handles'],
  [/\bnot (just|only) [^.]{1,40}, but\b/i, 'the "not X, but Y" pivot is an AI tell; say Y'],
  [/у сучасному світі|в сучасному світі|у наш час|в епоху цифров/i, 'видаліть вступ; почніть із суті'],
  [/відіграє (ключову|важливу|вирішальну) роль/i, 'назвіть, що саме воно робить'],
  [/варто (зазначити|відзначити)|важливо зазначити|слід зазначити/i, 'просто скажіть це'],
  [/давайте (розберемося|зануримося)|зануримося в/i, 'видаліть'],
  [/безшовн|революційн|інноваційн(ий|е|а) рішенн|передов(і|ий) технолог/i, 'дайте конкретику або вимірювання'],
  [/не просто [^.]{1,40}, а /i, 'конструкція «не просто X, а Y» звучить як ШІ; скажіть Y'],
];
const NAME_ERRORS = [/\bOleksander Bausk\b/, /\bAlexander Bausk\b/, /\bAleksandr Bausk\b/, /\bOlexandr Bausk\b/, /Олександер Бауск/];
const BANNED_FONTS = /\b(Inter|Poppins|Montserrat|Space Grotesk|Lora|Playfair Display|DM Sans|Plus Jakarta Sans|Outfit|Manrope|Geist)\b/;

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walk(p, files);
    else if (ALL.has(extname(name)) && !/\.min\.|\.generated\.|DESIGN\.md$|CHANGELOG\.md$/.test(name)) files.push(p);
  }
  return files;
}

const norm = (c) => c.toLowerCase().replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/, '#$1$1$2$2$3$3');

export function check({ root, paths = [], config = {}, lookStatus = null }) {
  const findings = [];
  const add = (file, line, col, severity, rule, message) => findings.push({ file: relative(root, file) || file, line, col, severity, rule, message });
  const allow = new Set((config.check?.allowColors ?? []).map(norm));
  const off = config.rules?.off ?? {};
  const targets = paths.length ? paths : [root];
  const files = targets.flatMap((t) => (statSync(t).isDirectory() ? walk(t) : [t]));

  for (const file of files) {
    const ext = extname(file);
    const text = readFileSync(file, 'utf8');
    if (text.includes('bausk-style-ignore-file')) continue;
    const lines = text.split('\n');
    const inStyleBlock = { on: false }; // inside <style>…</style> of a markup file
    lines.forEach((line, i) => {
      const ignored = (rule) => [line, lines[i - 1] ?? ''].some((l) => l.includes(`bausk-style-ignore ${rule}`) || l.includes('bausk-style-ignore all'));
      const flag = (rule, sev, col, msg) => { if (!ignored(rule) && !off[rule]) add(file, i + 1, col + 1, sev, rule, msg); };
      if (/<style[\s>]/i.test(line)) inStyleBlock.on = true;
      const styleCtx = STYLE.has(ext) || inStyleBlock.on || /style\s*=\s*["'{]/.test(line);
      const classCtx = MARKUP.has(ext) || SCRIPT.has(ext);

      // raw colours
      if (!TEXT.has(ext)) {
        const isTokenDef = /--bs-[\w-]+\s*:/.test(line);
        const re = styleCtx
          ? /(#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color-mix)\()/g
          : PY.has(ext) || SCRIPT.has(ext) || MARKUP.has(ext)
            ? /(["'`]#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?["'`]|["'`]#[0-9a-fA-F]{3}["'`]|\b(?:fill|stroke|color|stop-color)=["']#[0-9a-fA-F]{3,8})/g
            : null;
        if (re && !isTokenDef) for (const m of line.matchAll(re)) {
          const hex = (m[0].match(/#[0-9a-fA-F]{3,8}/) || [])[0];
          if (hex && allow.has(norm(hex))) continue;
          const before = line.slice(0, m.index);
          if (styleCtx && hex && !/[:=]/.test(before)) continue; // an id selector such as #fade {, not a value
          flag('tokens-only', 'error', m.index, `raw colour ${m[0].replace(/["'`]/g, '')}: use a --bs-* token (CSS), tokens()/readTokens() (JS) or bausk_style.colors() (Python)`);
        }
      }
      // Tailwind default palette and arbitrary colours
      if (classCtx) {
        for (const m of line.matchAll(new RegExp(`\\b(?:[\\w-]+:)*(?:${TW_PREFIX})-(?:${TW_COLORS})(?:-\\d{2,3})?(?:\\/\\d+)?\\b`, 'g'))) flag('tokens-only', 'error', m.index, `Tailwind default colour "${m[0]}": use the bausk-style theme names (bg-bg, text-fg-muted, border-line, text-accent…)`);
        for (const m of line.matchAll(/\b(?:[\w-]+:)*(?:bg|text|border|fill|stroke|from|to|via)-\[(?:#|rgb|hsl|oklch)[^\]]*\]/g)) flag('tokens-only', 'error', m.index, `arbitrary colour "${m[0]}"`);
        for (const m of line.matchAll(/\b(?:[\w-]+:)*shadow(?:-(?:sm|md|lg|xl|2xl|inner))?(?=["'\s`])/g)) flag('no-decorative-depth', 'error', m.index, `"${m[0]}": no shadows in this system`);
        for (const m of line.matchAll(/\b(?:[\w-]+:)*(?:bg-gradient-to-\w+|bg-linear-[\w-]+|bg-radial|backdrop-blur(?:-\w+)?|drop-shadow(?:-\w+)?|blur-(?:sm|md|lg|xl|2xl|3xl))\b/g)) flag('no-decorative-depth', 'error', m.index, `"${m[0]}": no gradients, glass or blur`);
        for (const m of line.matchAll(/\b(?:[\w-]+:)*rounded(?:-(?:sm|md|lg|xl|2xl|3xl|full|[trblse]{1,2}(?:-\w+)?))?(?=["'\s`])/g)) flag('radius-from-look', 'error', m.index, `"${m[0]}": corners come from the look (rounded-surface, rounded-control or rounded-none)`);
        for (const m of line.matchAll(/\banimate-(?:bounce|pulse|ping)\b/g)) flag('focus-and-motion', 'warn', m.index, `"${m[0]}": decorative animation`);
      }
      // CSS properties
      if (styleCtx) {
        let m;
        if ((m = line.match(/box-shadow\s*:\s*(?!\s|none|0\b|var\(--bs-)/))) flag('no-decorative-depth', 'error', m.index, 'box-shadow: no shadows in this system');
        if ((m = line.match(/(?:linear|radial|conic)-gradient\(/))) flag('no-decorative-depth', 'error', m.index, 'gradient: no gradients in this system');
        if ((m = line.match(/backdrop-filter\s*:|filter\s*:\s*[^;]*(?:blur|drop-shadow)\(/))) flag('no-decorative-depth', 'error', m.index, 'blur/glass effect');
        if ((m = line.match(/border-radius\s*:\s*(?!\s|0\b|0px|var\(--bs-radius|inherit)([^;]+)/))) flag('radius-from-look', 'error', m.index, `border-radius ${m[1].trim()}: use var(--bs-radius) or var(--bs-radius-control)`);
        if ((m = line.match(/font-family\s*:\s*(?!\s|var\(--bs-font|inherit)([^;]+)/))) flag('tokens-only', 'warn', m.index, `font-family ${m[1].trim()}: use var(--bs-font-text|ui|display|mono)`);
        if ((m = line.match(/transition\s*:\s*[^;]*\b(\d{3,4})ms/)) && Number(m[1]) > 400) flag('focus-and-motion', 'warn', m.index, `transition ${m[1]}ms: use --bs-duration-* tokens`);
      }
      // fonts that read as defaults
      if ((styleCtx || /fonts\.googleapis|fontFamily|font-family|\.mplstyle|rcParams/.test(line)) && BANNED_FONTS.test(line) && !/--bs-/.test(line)) {
        flag('tokens-only', 'warn', line.search(BANNED_FONTS), `font "${line.match(BANNED_FONTS)[0]}" is a default of AI-generated UIs; use the look's fonts`);
      }
      // emoji as icons
      if (MARKUP.has(ext) || TEXT.has(ext)) {
        for (const m of line.matchAll(/\p{Extended_Pictographic}/gu)) {
          if ('©®™‼⁉'.includes(m[0])) continue;
          flag('no-emoji-icons', ext === '.md' ? 'warn' : 'error', m.index, `emoji "${m[0]}": use an SVG icon from the project's one icon set, or words`);
        }
      }
      // copy
      if (MARKUP.has(ext) || TEXT.has(ext) || SCRIPT.has(ext)) {
        for (const [re, tip] of SLOP) { const mm = line.match(re); if (mm) flag('copy-voice', 'warn', mm.index, `"${mm[0]}": ${tip}`); }
        for (const re of NAME_ERRORS) { const mm = line.match(re); if (mm) flag('name-spelling', 'error', mm.index, `"${mm[0]}": the name is Oleksandr Bausk / Олександр Бауск`); }
      }
      if (/<\/style>/i.test(line)) inStyleBlock.on = false;
    });
  }

  // project-level checks
  const dm = join(root, 'DESIGN.md');
  if (existsSync(dm)) {
    const m = readFileSync(dm, 'utf8').match(/Generated by bausk-style ([\w.-]+)/);
    if (m && m[1] !== pkgVersion()) add(dm, 1, 1, 'warn', 'design-md-current', `DESIGN.md was generated by bausk-style ${m[1]}, installed is ${pkgVersion()}: run \`bausk-style sync\``);
  }
  if (lookStatus === 'legacy' || lookStatus === 'deprecated') add(join(root, 'bausk-style.json'), 1, 1, 'warn', 'look-status', `the project uses a ${lookStatus} look; plan a move to the brand default`);
  return findings;
}
