// Tailwind v4 theme. It maps utilities onto --bs-* variables and removes Tailwind's
// default palette, radii, shadows, blurs and animations, so `bg-purple-500`,
// `rounded-2xl`, `shadow-lg` or `backdrop-blur` do not exist in a bausk-style project.
// Use with the look's CSS (which defines the variables):
//   @import "tailwindcss";
//   @import "bausk-style/css/kharkiv.css";
//   @import "bausk-style/tailwind/kharkiv.css";
export function tailwindCss(look, contract, meta) {
  const colors = Object.keys(contract.color);
  const sizes = Object.keys(contract.size);
  const lines = [
    `/* bausk-style ${meta.version} · Tailwind v4 theme · look "${look.id}" · generated, do not edit. */`,
    '@theme inline {',
    '  --color-*: initial;',
    '  --color-transparent: transparent;',
    '  --color-current: currentColor;',
    ...colors.map((c) => `  --color-${c}: var(--bs-${c});`),
    '',
    '  --font-*: initial;',
    ...['text', 'ui', 'display', 'mono'].map((r) => `  --font-${r}: var(--bs-font-${r});`),
    '',
    '  --text-*: initial;',
    ...sizes.map((s) => `  --text-${s.replace('size-', '')}: var(--bs-${s});`),
    '',
    '  --radius-*: initial;',
    '  --radius-none: 0;',
    '  --radius-surface: var(--bs-radius);',
    '  --radius-control: var(--bs-radius-control);',
    '',
    '  --shadow-*: initial;',
    '  --inset-shadow-*: initial;',
    '  --drop-shadow-*: initial;',
    '  --text-shadow-*: initial;',
    '  --blur-*: initial;',
    '  --animate-*: initial;',
    '  --animate-spin: spin 1s linear infinite;',
    '',
    '  --ease-*: initial;',
    '  --ease-out: var(--bs-ease-out);',
    '  --ease-in-out: var(--bs-ease-in-out);',
    '',
    '  --container-text: var(--bs-measure-text);',
    '  --container-wide: var(--bs-measure-wide);',
    '  --container-page: var(--bs-measure-page);',
    '',
    '  --leading-text: var(--bs-leading-text);',
    '  --leading-ui: var(--bs-leading-ui);',
    '  --leading-tight: var(--bs-leading-tight);',
    '}',
    '',
    '/* Line widths as utilities: border-hair = thin line, border-main = main line. */',
    '@utility border-hair { border-width: var(--bs-line-w); }',
    '@utility border-main { border-width: var(--bs-line-w-strong); }',
    '@utility label { font-family: var(--bs-font-ui); font-size: var(--bs-size-xs); font-weight: var(--bs-label-weight); font-stretch: var(--bs-label-stretch); text-transform: var(--bs-label-case); letter-spacing: var(--bs-tracking-label); color: var(--bs-fg-subtle); }',
    '@utility num { font-variant-numeric: tabular-nums lining-nums; }',
    '',
  ];
  return lines.join('\n');
}
