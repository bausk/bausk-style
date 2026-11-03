// Data outputs for non-CSS consumers: DTCG JSON, Plotly templates, matplotlib styles, Quarto brand.yml.
import { hexToRgb } from '../lib/color.mjs';
import { fontsManifest } from '../lib/tokens.mjs';

// ---- DTCG 2025.10 ---------------------------------------------------------
const dim = (v) => {
  const m = String(v).match(/^(-?[\d.]+)(px|rem)$/);
  return m ? { value: parseFloat(m[1]), unit: m[2] } : null;
};

export function dtcg(look, scheme, contract, meta) {
  const color = {};
  for (const [k, hex] of Object.entries(look.color[scheme])) {
    color[k] = { $value: { colorSpace: 'srgb', components: hexToRgb(hex).map((c) => +c.toFixed(4)), hex }, $description: contract.color[k] };
  }
  const group = (names, fn) => Object.fromEntries(names.map((n) => [n, fn(look.values[n], n)]).filter(([, v]) => v));
  const v = look.values;
  return {
    $description: `bausk-style ${meta.version} · look "${look.id}" · ${scheme} scheme. Values that DTCG cannot express (clamp(), %, text-transform) are left out; see dist/json/.`,
    $extensions: { 'dev.bausk.style': { version: meta.version, look: look.id, scheme, status: look.status } },
    color: { $type: 'color', ...color },
    font: {
      $type: 'fontFamily',
      ...Object.fromEntries(['text', 'ui', 'display', 'mono'].map((r) => [r, { $value: [look.fonts[r].family, ...v[`font-${r}`].split(',').slice(1).map((s) => s.trim().replace(/"/g, ''))] }])),
    },
    size: { $type: 'dimension', ...group(Object.keys(contract.size), (x) => dim(x) && { $value: dim(x) }) },
    space: { $type: 'dimension', ...group(Object.keys(contract.space), (x) => dim(x) && { $value: dim(x) }) },
    weight: { $type: 'fontWeight', ...group(['weight-regular', 'weight-medium', 'weight-bold', 'weight-display'], (x) => ({ $value: Number(x) })) },
    leading: { $type: 'number', ...group(['leading-text', 'leading-ui', 'leading-tight'], (x) => ({ $value: Number(x) })) },
    shape: { $type: 'dimension', ...group(['radius', 'radius-control', 'line-w', 'line-w-strong'], (x) => ({ $value: dim(x) ?? { value: 0, unit: 'px' } })) },
    duration: { $type: 'duration', ...group(['duration-fast', 'duration-base', 'duration-slow'], (x) => ({ $value: { value: parseFloat(x), unit: 'ms' } })) },
    easing: { $type: 'cubicBezier', ...group(['ease-out', 'ease-in-out'], (x) => ({ $value: x.match(/[-\d.]+/g).map(Number) })) },
  };
}

// ---- Plotly ---------------------------------------------------------------
export function plotlyTemplate(look, scheme) {
  const t = { ...look.color[scheme], ...look.values };
  const axis = { gridcolor: t['viz-grid'], linecolor: t['viz-axis'], zerolinecolor: t['viz-axis'], tickcolor: t['viz-axis'], showline: true, ticks: 'outside', ticklen: 4, tickfont: { color: t['viz-label'] }, title: { font: { color: t['fg-muted'] } } };
  return {
    layout: {
      font: { family: t['font-ui'], color: t.fg, size: 12 },
      title: { font: { family: t['font-display'], size: 16, color: t.fg }, x: 0, xanchor: 'left' },
      paper_bgcolor: t.bg, plot_bgcolor: t.bg,
      colorway: [1, 2, 3, 4, 5, 6].map((i) => t[`viz-${i}`]),
      xaxis: axis, yaxis: axis,
      legend: { font: { color: t['fg-muted'] }, bgcolor: 'rgba(0,0,0,0)' },
      hoverlabel: { bgcolor: t['bg-inverse'], font: { color: t['fg-inverse'], family: t['font-ui'] }, bordercolor: t['bg-inverse'] },
      margin: { l: 56, r: 24, t: 48, b: 48 },
    },
    data: {
      candlestick: [{ increasing: { line: { color: t['viz-up'] }, fillcolor: t['viz-up'] }, decreasing: { line: { color: t['viz-down'] }, fillcolor: t['viz-down'] } }],
      scatter: [{ line: { width: 1.75 } }],
    },
  };
}

// ---- matplotlib -----------------------------------------------------------
const MEDIA = {
  paper:  { base: 8,  tick: 7,  title: 9,  line: 1.0, grid: 0.4, white: true },
  screen: { base: 11, tick: 10, title: 13, line: 1.6, grid: 0.6, white: false },
  slide:  { base: 20, tick: 18, title: 26, line: 3.0, grid: 1.0, white: false },
};
const nohash = (h) => h.replace('#', '');

export function mplstyle(look, scheme, medium, meta) {
  const t = look.color[scheme];
  const m = MEDIA[medium];
  const bg = m.white && scheme === 'light' ? 'ffffff' : nohash(t.bg);
  const ui = look.desktop?.ui ?? look.fonts.ui.family;
  const mono = look.desktop?.mono ?? look.fonts.mono.family;
  return `# bausk-style ${meta.version} · look ${look.id} · ${scheme} · ${medium} · generated, do not edit.
# plt.style.use("<path>/${look.id}-${scheme}-${medium}.mplstyle")  or  bausk_style.use("${look.id}", "${scheme}", "${medium}")
# Fonts: bausk_style.use() registers the bundled TTFs; with plt.style.use() alone, install them (dist/fonts/ttf/) or DejaVu is used.
font.family: sans-serif
font.sans-serif: ${ui}, DejaVu Sans
font.monospace: ${mono}, DejaVu Sans Mono
font.size: ${m.base}
axes.titlesize: ${m.title}
axes.titleweight: bold
axes.titlelocation: left
axes.labelsize: ${m.base}
xtick.labelsize: ${m.tick}
ytick.labelsize: ${m.tick}
legend.fontsize: ${m.tick}
legend.frameon: False
text.color: ${nohash(t.fg)}
axes.labelcolor: ${nohash(t['fg-muted'])}
axes.edgecolor: ${nohash(t['viz-axis'])}
axes.facecolor: ${bg}
figure.facecolor: ${bg}
savefig.facecolor: ${bg}
axes.prop_cycle: cycler('color', [${[1, 2, 3, 4, 5, 6].map((i) => `'${nohash(t[`viz-${i}`])}'`).join(', ')}])
axes.spines.top: False
axes.spines.right: False
axes.linewidth: ${(m.line * 0.6).toFixed(2)}
axes.grid: True
axes.grid.axis: y
axes.axisbelow: True
grid.color: ${nohash(t['viz-grid'])}
grid.linewidth: ${m.grid}
xtick.color: ${nohash(t['viz-axis'])}
ytick.color: ${nohash(t['viz-axis'])}
xtick.labelcolor: ${nohash(t['viz-label'])}
ytick.labelcolor: ${nohash(t['viz-label'])}
lines.linewidth: ${m.line}
lines.solid_capstyle: butt
patch.edgecolor: ${bg}
image.cmap: cividis
figure.dpi: 150
savefig.dpi: 300
savefig.bbox: tight
svg.fonttype: none
pdf.fonttype: 42
`;
}

// ---- Quarto brand.yml -----------------------------------------------------
export function brandYml(look, brand, scheme = 'light') {
  const t = look.color[scheme];
  const manifest = fontsManifest();
  const q = (s) => JSON.stringify(s);
  const fontBlocks = [...new Set(Object.values(look.fonts).map((f) => f.id))].map((id) => {
    const fam = manifest[id];
    const files = fam.faces.filter((f) => !f.unicodeRange || /U\+0000-00FF|U\+0400-045F/.test(f.unicodeRange)).map((f) => `        - path: fonts/${f.file}\n          weight: ${q(f.weight)}\n          style: ${f.style}`);
    return `    - source: file\n      family: ${q(`BS ${fam.family}`)}\n      files:\n${files.join('\n')}`;
  });
  return `# bausk-style · look "${look.id}" · ${scheme} · generated, do not edit.
# Copied into a Quarto project as _brand.yml by \`bausk-style init --media slides\`, with fonts/ next to it.
meta:
  name:
    full: ${q(brand.name.en)}
    short: ${q(brand.short.en)}
  link:
    home: ${brand.links.site}
color:
  palette:
${['fg', 'fg-muted', 'fg-subtle', 'bg', 'bg-subtle', 'line', 'accent', 'viz-1', 'viz-2', 'viz-3', 'viz-4', 'viz-5', 'viz-6'].map((k) => `    ${k}: "${t[k]}"`).join('\n')}
  foreground: fg
  background: bg
  primary: accent
  secondary: fg-muted
  tertiary: line
  success: "${t.positive}"
  info: viz-1
  warning: "${t.caution}"
  danger: "${t.negative}"
  light: bg
  dark: fg
typography:
  fonts:
${fontBlocks.join('\n')}
  base:
    family: ${q(`BS ${look.fonts.text.family}`)}
    line-height: ${look.values['leading-text']}
  headings:
    family: ${q(`BS ${look.fonts.display.family}`)}
    weight: ${look.values['weight-display']}
    line-height: ${look.values['leading-tight']}
  monospace:
    family: ${q(`BS ${look.fonts.mono.family}`)}
    size: 0.9em
  link:
    color: accent
    decoration: underline
`;
}
