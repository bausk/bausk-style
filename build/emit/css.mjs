// CSS outputs: tokens only, fonts, and the full bundle (tokens + fonts + components + signature).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, fontsManifest } from '../lib/tokens.mjs';

const decl = (obj, indent = '  ') => Object.entries(obj).map(([k, v]) => `${indent}--bs-${k}: ${v};`).join('\n');

export function tokensCss(look) {
  const { light, dark } = look.color;
  return `@layer bs.tokens {
  :root, [data-bs-scheme="light"] {
  color-scheme: light;
${decl(light)}
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-bs-scheme="light"]) {
    color-scheme: dark;
${decl(dark, '    ')}
    }
  }
  [data-bs-scheme="dark"] {
  color-scheme: dark;
${decl(dark)}
  }
  :root {
${decl(look.values)}
  }
}
`;
}

// fontBase: path from the CSS file to dist/fonts/
export function fontsCss(look, fontBase = '../fonts/') {
  const manifest = fontsManifest();
  const used = [...new Set(Object.values(look.fonts).map((f) => f.id))];
  const rules = [];
  for (const id of used) {
    const fam = manifest[id];
    for (const face of fam.faces) {
      rules.push(`@font-face {
  font-family: "BS ${fam.family}";
  font-style: ${face.style}; font-weight: ${face.weight};${face.stretch ? ` font-stretch: ${face.stretch};` : ''} font-display: swap;
  src: url("${fontBase}${face.file}") format("${face.variable ? 'woff2-variations' : 'woff2'}"), url("${fontBase}${face.file}") format("woff2");${face.unicodeRange ? `\n  unicode-range: ${face.unicodeRange};` : ''}
}`);
    }
  }
  return rules.join('\n');
}

export function bundleCss(look, meta) {
  const base = readFileSync(join(ROOT, 'components', 'base.css'), 'utf8');
  return `/* bausk-style ${meta.version} · look "${look.id}" (${look.status}) · generated, do not edit.
   Source: tokens/looks/${look.id}/, components/base.css. Docs: guide/README.md */
@layer bs.tokens, bs.base, bs.components, bs.signature;

${fontsCss(look)}

${tokensCss(look)}
${base}
${look.signatureCss}`;
}

export function header(look, meta, what) {
  return `/* bausk-style ${meta.version} · look "${look.id}" · ${what} · generated, do not edit. */\n`;
}
