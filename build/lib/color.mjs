// Colour maths for the build and tests. No dependencies.
// sRGB <-> OKLab/OKLCH (Björn Ottosson), WCAG 2 contrast, OKLab ΔE,
// colour-vision-deficiency simulation (Machado et al. 2009, severity 1.0).

const clamp01 = (x) => Math.min(1, Math.max(0, x));

export function hexToRgb(hex) {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error(`Bad hex colour: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

export function rgbToHex(rgb) {
  return '#' + rgb.map((c) => Math.round(clamp01(c) * 255).toString(16).padStart(2, '0')).join('');
}

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function linearToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToLinear([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export const hexToOklab = (hex) => linearToOklab(hexToRgb(hex).map(toLinear));

export function hexToOklch(hex) {
  const [L, a, b] = hexToOklab(hex);
  const C = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return [L, C, C < 1e-4 ? 0 : h];
}

const inGamut = (lin) => lin.every((c) => c >= -1e-4 && c <= 1 + 1e-4);

function oklchToLinear(L, C, h) {
  const r = (h * Math.PI) / 180;
  return oklabToLinear([L, C * Math.cos(r), C * Math.sin(r)]);
}

// OKLCH -> hex. Out-of-gamut colours keep L and h and lose chroma.
export function oklchToHex(L, C, h) {
  let lin = oklchToLinear(L, C, h);
  if (!inGamut(lin)) {
    let lo = 0, hi = C;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear(L, mid, h))) lo = mid; else hi = mid;
    }
    lin = oklchToLinear(L, lo, h);
  }
  return rgbToHex(lin.map((c) => toGamma(clamp01(c))));
}

// Accepts "#rgb", "#rrggbb" or "oklch(L C H)" with L as 0..1 or a percentage.
export function parseColor(str) {
  const s = String(str).trim();
  if (s.startsWith('#')) return rgbToHex(hexToRgb(s));
  const m = s.match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*\)$/i);
  if (m) {
    const L = m[2] ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
    return oklchToHex(L, parseFloat(m[3]), parseFloat(m[4]));
  }
  throw new Error(`Unsupported colour: ${str}`);
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// Euclidean distance in OKLab, scaled so ~2 is a just-noticeable difference.
export function deltaE(a, b) {
  const p = hexToOklab(a), q = hexToOklab(b);
  return 100 * Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}

export function mix(a, b, t) {
  const p = hexToOklab(a), q = hexToOklab(b);
  const lab = p.map((v, i) => v + (q[i] - v) * t);
  return rgbToHex(oklabToLinear(lab).map((c) => toGamma(clamp01(c))));
}

const CVD = {
  protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
};

export function simulate(hex, type) {
  const m = CVD[type];
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  const out = [
    m[0] * r + m[1] * g + m[2] * b,
    m[3] * r + m[4] * g + m[5] * b,
    m[6] * r + m[7] * g + m[8] * b,
  ];
  return rgbToHex(out.map((c) => toGamma(clamp01(c))));
}

export const CVD_TYPES = Object.keys(CVD);

export function rgba(hex, alpha) {
  const [r, g, b] = hexToRgb(hex).map((c) => Math.round(c * 255));
  return `rgb(${r} ${g} ${b} / ${alpha})`;
}

export const hexToInt = (hex) => parseInt(rgbToHex(hexToRgb(hex)).slice(1), 16);

export function fmtOklch(hex) {
  const [L, C, h] = hexToOklch(hex);
  return `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(3)} ${h.toFixed(1)})`;
}
