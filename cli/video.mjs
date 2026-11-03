// `bausk-style video <kind>`: renders video graphics as PNG in the project's look.
//   titlecard  --title --sub                       1920×1080, opaque
//   chapter    --title [--sub]                     1920×1080, opaque (section colours)
//   lowerthird --name --role                       1920×1080, transparent PNG to lay over footage
//   endcard    --title [--sub] [--links "a · b"]   1920×1080, opaque
//   thumbnail  --words [--image path]             1280×720, opaque; at most four words
// Common: --out file.png  --scheme light|dark (default light)  --lang uk|en
import { writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { shoot } from './shoot.mjs';

const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export const KINDS = ['titlecard', 'chapter', 'lowerthird', 'endcard', 'thumbnail'];

export async function renderVideo({ kind, cssPath, out, scheme = 'light', lang = 'uk', opts }) {
  if (!KINDS.includes(kind)) throw new Error(`video kind must be one of: ${KINDS.join(', ')}`);
  const words = (opts.words ?? '').trim();
  if (kind === 'thumbnail' && words.split(/\s+/).length > 4) throw new Error('thumbnail: at most four words (rule video-safe-areas)');
  const transparent = kind === 'lowerthird';
  let body;
  switch (kind) {
    case 'titlecard':
      body = `<div class="bs-video"><div class="bs-titlecard"><h1 class="bs-titlecard__title">${esc(opts.title)}</h1>${opts.sub ? `<p class="bs-titlecard__sub">${esc(opts.sub)}</p>` : ''}</div></div>`;
      break;
    case 'chapter':
      // Chapter cards always use the light-scheme colours: the full brand red, not the lightened dark-scheme accent.
      body = `<div class="bs-video bs-video--section" data-bs-scheme="light"><div class="bs-titlecard"><h1 class="bs-titlecard__title">${esc(opts.title)}</h1>${opts.sub ? `<p class="bs-titlecard__sub">${esc(opts.sub)}</p>` : ''}</div></div>`;
      break;
    case 'endcard':
      body = `<div class="bs-video"><div class="bs-titlecard"><h1 class="bs-titlecard__title">${esc(opts.title)}</h1>${opts.sub ? `<p class="bs-titlecard__sub">${esc(opts.sub)}</p>` : ''}${opts.links ? `<p class="bs-titlecard__sub bs-num">${esc(opts.links)}</p>` : ''}</div></div>`;
      break;
    case 'lowerthird':
      body = `<div class="bs-video" style="background:transparent"><div class="bs-lowerthird"><div class="bs-lowerthird__name">${esc(opts.name)}</div><div class="bs-lowerthird__role">${esc(opts.role)}</div></div></div>`;
      break;
    case 'thumbnail': {
      const img = opts.image ? `<div class="bs-thumb__art"><img src="${pathToFileURL(resolve(opts.image)).href}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"></div>` : '';
      body = `<div class="bs-video"><div class="bs-thumb__words"${img ? '' : ' style="width:88%"'}>${esc(words)}</div>${img}</div>`;
      break;
    }
  }
  const [w, h] = kind === 'thumbnail' ? [1280, 720] : [1920, 1080];
  const html = `<!doctype html><html lang="${lang}" data-bs-scheme="${scheme}"${transparent ? ' style="background:transparent"' : ''}><head><meta charset="utf-8">
<link rel="stylesheet" href="${pathToFileURL(cssPath).href}">
<style>html,body{margin:0;padding:0}${transparent ? 'html,body{background:transparent!important}' : ''}.bs-video{width:${w}px}</style>
</head><body>${body}</body></html>`;
  const dir = mkdtempSync(join(tmpdir(), 'bs-video-'));
  try {
    const file = join(dir, 'frame.html');
    writeFileSync(file, html);
    if (opts.image && !existsSync(resolve(opts.image))) throw new Error(`image not found: ${opts.image}`);
    await shoot([{ url: file, out, width: w, height: h, selector: '.bs-video', transparent }]);
    return resolve(out);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
