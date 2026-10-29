// JS module for canvas, WebGL, game engines and chart libraries that take colours as
// values rather than CSS. Prefer readTokens() in the browser: it follows the live scheme.
export function jsModule(all, meta) {
  const data = {
    version: meta.version,
    brands: Object.fromEntries(Object.entries(all.brands).map(([id, b]) => [id, { id, status: b.status, defaultLook: b.defaultLook, name: b.name, short: b.short }])),
    looks: Object.fromEntries(Object.entries(all.looks).map(([id, l]) => [id, {
      id, name: l.name, status: l.status, reference: l.reference,
      color: l.color, values: l.values, media: l.media,
      fonts: Object.fromEntries(Object.entries(l.fonts).map(([r, f]) => [r, f.stack])),
    }])),
  };
  return `// bausk-style ${meta.version} · generated, do not edit.
const DATA = ${JSON.stringify(data, null, 1)};

export const version = DATA.version;
export const looks = DATA.looks;
export const brands = DATA.brands;

/** Look id a brand currently points to (what "default" resolves to). */
export function defaultLook(brand = 'bausk') {
  const b = brands[brand];
  if (!b || !b.defaultLook) throw new Error(\`bausk-style: brand "\${brand}" has no default look\`);
  return b.defaultLook;
}

/** Flat token map for a look and scheme: { bg: '#..', 'font-ui': '...', 'space-4': '0.75rem', ... }. */
export function tokens(look = defaultLook(), scheme = 'light') {
  const id = look === 'default' ? defaultLook() : look;
  const l = looks[id];
  if (!l) throw new Error(\`bausk-style: unknown look "\${look}"\`);
  return { ...l.values, ...Object.fromEntries(Object.entries(l.fonts).map(([r, s]) => ['font-' + r, s])), ...l.color[scheme] };
}

/** Reads the --bs-* custom properties that apply to an element (follows data-bs-scheme and OS dark mode). */
export function readTokens(el = globalThis.document?.documentElement) {
  const cs = getComputedStyle(el);
  const out = {};
  for (const name of Object.keys(tokens(Object.keys(looks)[0]))) {
    const v = cs.getPropertyValue('--bs-' + name).trim();
    if (v) out[name] = v;
  }
  return out;
}

export const cssVar = (name) => \`var(--bs-\${name})\`;

/** '#c52f15' -> 0xc52f15, for Phaser, PixiJS and three.js. */
export const toInt = (hex) => parseInt(hex.replace('#', ''), 16);

/** Categorical series colours in order. */
export const vizSeries = (t) => [1, 2, 3, 4, 5, 6].map((i) => t['viz-' + i]);

/** Options for TradingView lightweight-charts createChart(). */
export function lightweightChartsOptions(t) {
  return {
    layout: { background: { type: 'solid', color: t.bg }, textColor: t['viz-label'], fontFamily: t['font-ui'], fontSize: 11, attributionLogo: false },
    grid: { vertLines: { color: t['viz-grid'] }, horzLines: { color: t['viz-grid'] } },
    rightPriceScale: { borderColor: t['viz-axis'] },
    timeScale: { borderColor: t['viz-axis'] },
    crosshair: { vertLine: { color: t['fg-subtle'], labelBackgroundColor: t['bg-inverse'] }, horzLine: { color: t['fg-subtle'], labelBackgroundColor: t['bg-inverse'] } },
  };
}

/** Series options for a candlestick series. */
export function candleColors(t) {
  return { upColor: t['viz-up'], downColor: t['viz-down'], borderUpColor: t['viz-up'], borderDownColor: t['viz-down'], wickUpColor: t['viz-up'], wickDownColor: t['viz-down'] };
}
`;
}

export function jsTypes(contract, meta) {
  const names = Object.values(contract).filter((g) => typeof g === 'object').flatMap((g) => Object.keys(g));
  return `// bausk-style ${meta.version} · generated, do not edit.
export type Scheme = 'light' | 'dark';
export type TokenName = ${names.map((n) => `'${n}'`).join(' | ')};
export type Tokens = Record<TokenName, string>;
export interface Look { id: string; name: { en: string; uk: string }; status: 'candidate' | 'released' | 'legacy' | 'deprecated'; reference: string; color: Record<Scheme, Record<string, string>>; values: Record<string, string>; media: Record<string, unknown>; fonts: Record<'text' | 'ui' | 'display' | 'mono', string>; }
export declare const version: string;
export declare const looks: Record<string, Look>;
export declare const brands: Record<string, { id: string; status: string; defaultLook: string | null; name: Record<string, string | null>; short: Record<string, string | null> }>;
export declare function defaultLook(brand?: string): string;
export declare function tokens(look?: string, scheme?: Scheme): Tokens;
export declare function readTokens(el?: Element): Partial<Tokens>;
export declare function cssVar(name: TokenName): string;
export declare function toInt(hex: string): number;
export declare function vizSeries(t: Tokens): string[];
export declare function lightweightChartsOptions(t: Tokens): Record<string, unknown>;
export declare function candleColors(t: Tokens): Record<string, string>;
`;
}
