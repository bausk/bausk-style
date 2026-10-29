// Builds the specimen page for a look. Same markup for every look, so looks can be
// compared fairly and agents have one worked example of every component.
// All numbers are generated from fixed seeds and labelled as sample data.

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function candles(n, start, seed) {
  const r = rng(seed);
  const out = [];
  let close = start;
  for (let i = 0; i < n; i++) {
    const open = close;
    close = Math.max(1, open * (1 + (r() - 0.48) * 0.018));
    const high = Math.max(open, close) * (1 + r() * 0.006);
    const low = Math.min(open, close) * (1 - r() * 0.006);
    out.push({ open, close, high, low });
  }
  return out;
}

const f2 = (x) => x.toFixed(2);

// A "nice" tick step (1, 2, 2.5 or 5 times a power of ten) for about `count` intervals.
function niceStep(range, count) {
  const raw = range / count, mag = 10 ** Math.floor(Math.log10(raw)), n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
}

function candleChart(data, { w = 640, h = 260, pad = { l: 8, r: 52, t: 10, b: 22 }, labels = [] } = {}) {
  const lo0 = Math.min(...data.map((d) => d.low)), hi0 = Math.max(...data.map((d) => d.high));
  const step = niceStep(hi0 - lo0, 5), lo = Math.floor(lo0 / step) * step, hi = Math.ceil(hi0 / step) * step;
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const x = (i) => pad.l + (i + 0.5) * (iw / data.length);
  const y = (v) => pad.t + (1 - (v - lo) / (hi - lo)) * ih;
  const bw = Math.max(2, (iw / data.length) * 0.62);
  let s = `<svg class="bs-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Candlestick chart, sample data">`;
  for (let v = lo; v <= hi + 1e-9; v += step) {
    const yy = Math.round(y(v)) + 0.5;
    s += `<line class="grid" x1="${pad.l}" x2="${w - pad.r}" y1="${yy}" y2="${yy}"/><text x="${w - pad.r + 6}" y="${yy + 4}">${v.toFixed(step < 1 ? 2 : step % 1 ? 1 : 0)}</text>`;
  }
  s += `<line class="axis" x1="${pad.l}" x2="${w - pad.r}" y1="${h - pad.b + 0.5}" y2="${h - pad.b + 0.5}"/>`;
  labels.forEach(([i, t]) => { s += `<text x="${x(i)}" y="${h - 6}" text-anchor="middle">${t}</text>`; });
  data.forEach((d, i) => {
    const c = d.close >= d.open ? 'up' : 'down';
    const top = y(Math.max(d.open, d.close)), bot = y(Math.min(d.open, d.close));
    s += `<line class="${c}" x1="${f2(x(i))}" x2="${f2(x(i))}" y1="${f2(y(d.high))}" y2="${f2(y(d.low))}" stroke-width="1"/>`;
    s += `<rect class="${c}" x="${f2(x(i) - bw / 2)}" y="${f2(top)}" width="${f2(bw)}" height="${f2(Math.max(1, bot - top))}"/>`;
  });
  const last = data[data.length - 1];
  const ly = y(last.close);
  s += `<line class="axis" x1="${pad.l}" x2="${w - pad.r}" y1="${f2(ly)}" y2="${f2(ly)}" stroke-dasharray="2 3"/>`;
  s += `<rect class="marker" x="${w - pad.r + 2}" y="${f2(ly - 8)}" width="${pad.r - 4}" height="16"/><text x="${w - pad.r + 6}" y="${f2(ly + 4)}" style="fill:var(--bs-on-accent)">${f2(last.close)}</text>`;
  return s + '</svg>';
}

function lineChart(series, { w = 640, h = 236, pad = { l: 36, r: 64, t: 12, b: 42 }, xLabel = '', yMax } = {}) {
  const n = series[0].values.length;
  const raw = yMax ?? Math.max(...series.flatMap((s) => s.values));
  const step = niceStep(raw, 4), max = Math.ceil(raw / step) * step;
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const x = (i) => pad.l + (i / (n - 1)) * iw;
  const y = (v) => pad.t + (1 - v / max) * ih;
  let s = `<svg class="bs-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Line chart, sample data">`;
  for (let v = 0; v <= max + 1e-9; v += step) {
    const yy = Math.round(y(v)) + 0.5;
    s += `<line class="grid" x1="${pad.l}" x2="${w - pad.r}" y1="${yy}" y2="${yy}"/><text x="${pad.l - 6}" y="${yy + 4}" text-anchor="end">${Math.round(v)}</text>`;
  }
  s += `<line class="axis" x1="${pad.l}" x2="${w - pad.r}" y1="${h - pad.b + 0.5}" y2="${h - pad.b + 0.5}"/>`;
  for (let i = 0; i < n; i += Math.ceil(n / 8)) s += `<text x="${x(i)}" y="${h - pad.b + 16}" text-anchor="middle">${i + 1}</text>`;
  if (xLabel) s += `<text x="${pad.l + iw / 2}" y="${h - 4}" text-anchor="middle">${xLabel}</text>`;
  // Direct labels at the line ends, pushed apart so they never overlap.
  const ends = series.map((ser) => ({ ser, y: y(ser.values[n - 1]) })).sort((a, b) => a.y - b.y);
  ends.forEach((e, i) => { if (i && e.y - ends[i - 1].y < 13) e.y = ends[i - 1].y + 13; });
  series.forEach((ser) => {
    const d = ser.values.map((v, i) => `${i ? 'L' : 'M'}${f2(x(i))},${f2(y(v))}`).join('');
    s += `<path class="line ${ser.cls}" d="${d}"/>`;
  });
  ends.forEach(({ ser, y: ly }) => { s += `<text x="${w - pad.r + 6}" y="${f2(ly + 4)}" style="fill:var(--bs-${ser.color})">${ser.label}</text>`; });
  return s + '</svg>';
}

// ---- A* on a grid -------------------------------------------------------
const WALLS = [
  '........................',
  '....#...........#.......',
  '....#...........#.......',
  '....#....#####..#.......',
  '....#........#..#..###..',
  '....#........#..#....#..',
  '.............#.......#..',
  '..######.....#####...#..',
  '.......#.............#..',
  '.......#....#........#..',
  '.......#....#...######..',
  '............#...........',
  '............#...........',
  '........................',
];

function astar(start, goal, maxSteps = Infinity) {
  const H = WALLS.length, W = WALLS[0].length;
  const key = (p) => p[1] * W + p[0];
  const h = (p) => Math.abs(p[0] - goal[0]) + Math.abs(p[1] - goal[1]);
  const open = new Map([[key(start), { p: start, g: 0, f: h(start), parent: null }]]);
  const closed = new Map();
  let steps = 0, found = null;
  while (open.size && steps < maxSteps) {
    let best = null;
    for (const n of open.values()) if (!best || n.f < best.f || (n.f === best.f && n.g > best.g)) best = n;
    open.delete(key(best.p)); closed.set(key(best.p), best); steps++;
    if (best.p[0] === goal[0] && best.p[1] === goal[1]) { found = best; break; }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const q = [best.p[0] + dx, best.p[1] + dy];
      if (q[0] < 0 || q[1] < 0 || q[0] >= W || q[1] >= H || WALLS[q[1]][q[0]] === '#' || closed.has(key(q))) continue;
      const g = best.g + 1, k = key(q), cur = open.get(k);
      if (!cur || g < cur.g) open.set(k, { p: q, g, f: g + h(q), parent: best });
    }
  }
  const path = [];
  for (let n = found; n; n = n.parent) path.unshift(n.p);
  return { path, open: [...open.values()].map((n) => n.p), closed: [...closed.values()].map((n) => n.p), steps };
}

function board({ cell = 26, showPath = true, fill = false } = {}) {
  const start = [1, 12], goal = [22, 2];
  const r = astar(start, goal);
  const H = WALLS.length, W = WALLS[0].length;
  const seen = new Set(r.closed.map((p) => p.join())), front = new Set(r.open.map((p) => p.join()));
  let s = `<svg class="bs-board" viewBox="0 0 ${W * cell} ${H * cell}"${fill ? ' preserveAspectRatio="xMidYMid slice"' : ''} role="img" aria-label="A* search on a grid: start, goal, explored cells and the shortest path">`;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = WALLS[y][x] === '#' ? 'wall' : front.has(`${x},${y}`) ? 'frontier' : seen.has(`${x},${y}`) ? 'seen' : 'open';
    s += `<rect class="${c}" x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}"/>`;
  }
  if (showPath) s += `<path class="path" d="${r.path.map((p, i) => `${i ? 'L' : 'M'}${p[0] * cell + cell / 2},${p[1] * cell + cell / 2}`).join('')}"/>`;
  s += `<rect class="start" x="${start[0] * cell + 5}" y="${start[1] * cell + 5}" width="${cell - 10}" height="${cell - 10}"/>`;
  s += `<rect class="goal" x="${goal[0] * cell + 5}" y="${goal[1] * cell + 5}" width="${cell - 10}" height="${cell - 10}"/>`;
  return { svg: s + '</svg>', stats: { steps: r.steps, open: r.open.length, closed: r.closed.length, length: r.path.length - 1 } };
}

// ---- page ----------------------------------------------------------------
function swatches(look) {
  const groups = [
    ['Surfaces and text', ['bg', 'bg-subtle', 'bg-inverse', 'fg', 'fg-muted', 'fg-subtle', 'line', 'line-strong']],
    ['Accent and state', ['accent', 'accent-strong', 'accent-subtle', 'focus', 'positive', 'negative', 'caution']],
    ['Charts', ['viz-1', 'viz-2', 'viz-3', 'viz-4', 'viz-5', 'viz-6', 'viz-up', 'viz-down', 'viz-muted']],
  ];
  return ['light', 'dark'].map((scheme) => `<div data-bs-scheme="${scheme}" class="sp-swatches">
    <p class="bs-label">${scheme === 'light' ? 'Light scheme' : 'Dark scheme'}</p>
    ${groups.map(([title, names]) => `<div class="sp-swatch-row"><span class="bs-label">${title}</span><div>${names.map((n) => `<span class="sp-swatch"><i style="background:var(--bs-${n})"></i><code>${n}</code><small class="bs-num">${look.color[scheme][n]}</small></span>`).join('')}</div></div>`).join('')}
  </div>`).join('');
}

export function renderSpecimen(look, brand, meta, allLooks) {
  const nvda = candles(64, 131.4, 7);
  const g = board();
  const thumbBoard = board({ cell: 30, fill: true });
  const matches = [
    { label: 'SIFT', cls: 's3', color: 'viz-3', values: [412, 398, 377, 401, 356, 333, 341, 302, 288, 296, 270, 251, 263, 240, 236, 228] },
    { label: 'ORB', cls: 's2', color: 'viz-2', values: [301, 276, 259, 270, 231, 214, 208, 187, 170, 175, 151, 144, 139, 128, 122, 117] },
    { label: 'AKAZE', cls: 'muted', color: 'viz-muted', values: [356, 340, 322, 335, 300, 290, 286, 260, 249, 252, 236, 220, 224, 209, 204, 199] },
  ];
  const watch = [
    ['NVDA', '132.84', '+1.62', true, 'live'], ['ASML', '701.10', '−8.45', false, 'live'], ['MSFT', '418.27', '+0.93', true, 'live'],
    ['TSM', '187.55', '+2.10', true, 'delayed 15m'], ['SPY', '581.02', '−1.18', false, 'live'], ['QQQ', '503.66', '−0.41', false, 'stale 2h'],
  ];
  const nav = allLooks.map((l) => `<a href="${l.id}.html"${l.id === look.id ? ' aria-current="page"' : ''}>${l.name.en}${l.status === 'legacy' ? ' (legacy)' : ''}</a>`).join('');
  return `<!doctype html>
<html lang="en" data-bs-scheme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${look.name.en} · bausk-style ${meta.version} specimen</title>
<link rel="stylesheet" href="../css/${look.id}.css">
<style>
  /* Specimen-only layout. Not part of the system. */
  .sp-part { margin-top: var(--bs-space-8); }
  .sp-part > .bs-section-head { margin-top: 0; }
  .sp-note { font-family: var(--bs-font-ui); font-size: var(--bs-size-sm); color: var(--bs-fg-subtle); max-width: var(--bs-measure-text); margin: 0 0 var(--bs-space-5); }
  .sp-two { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 30rem), 1fr)); gap: var(--bs-space-6); }
  .sp-three { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr)); gap: var(--bs-space-5); }
  .sp-dash { padding: var(--bs-space-5); }
  .sp-dash-top { display: flex; flex-wrap: wrap; gap: var(--bs-space-5); align-items: center; justify-content: space-between; margin-bottom: var(--bs-space-5); font-family: var(--bs-font-ui); }
  .sp-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: var(--bs-space-5); margin-bottom: var(--bs-space-5); }
  .sp-swatches { padding: var(--bs-space-5); }
  .sp-swatch-row { display: grid; grid-template-columns: 11rem 1fr; gap: var(--bs-space-4); margin-top: var(--bs-space-4); }
  .sp-swatch-row > div { display: flex; flex-wrap: wrap; gap: var(--bs-space-3) var(--bs-space-5); }
  .sp-swatch { display: grid; grid-template-columns: 1.5rem auto; column-gap: var(--bs-space-2); align-items: center; font-family: var(--bs-font-ui); font-size: var(--bs-size-xs); }
  .sp-swatch i { grid-row: span 2; width: 1.5rem; height: 1.5rem; outline: 1px solid var(--bs-line); }
  .sp-swatch small { color: var(--bs-fg-subtle); }
  .sp-type > * + * { margin-top: var(--bs-space-4); }
  .sp-frame-art { position: absolute; inset: 0; display: grid; place-items: center; background: var(--bs-bg-subtle); color: var(--bs-fg-subtle); font-family: var(--bs-font-ui); }
  .sp-hud-wrap { border: var(--bs-line-w) solid var(--bs-line-strong); max-width: 48rem; }
  .sp-hud-wrap svg { display: block; width: 100%; height: auto; }
  .sp-thumb-art svg { width: 100%; height: 100%; }
</style>
</head>
<body>
<div class="bs-page">
  <header class="bs-header">
    <div><a class="bs-header__name" href="#">${brand.name.en}</a><span class="bs-header__sub">${brand.affiliation.en}</span></div>
    <nav class="bs-nav" aria-label="Looks">${nav}<a class="bs-nav__quiet" href="index.html">All looks</a></nav>
  </header>

  <section class="sp-part" aria-labelledby="p-read">
    <div class="bs-section-head"><h2 class="bs-section-head__title" id="p-read">Read · article</h2><span class="bs-label">bausk-style ${meta.version} · ${look.id} · ${look.status}</span></div>
    <p class="sp-note">${look.reference}</p>
    <article class="bs-measure">
      <h1 class="bs-article__title">Stitching Drone Photos into a Local Map</h1>
      <p class="bs-article__standfirst">How to stitch a series of drone photos into one mosaic with OpenCV: SIFT, the ratio test, RANSAC and homographies on real data, with Python code.</p>
      <dl class="bs-meta">
        <div><dt>Author</dt><dd>${brand.name.en}</dd></div>
        <div><dt>Affiliation</dt><dd>Lviv Polytechnic</dd></div>
        <div><dt>Published</dt><dd class="bs-num">11 Oct 2026</dd></div>
        <div><dt>DOI</dt><dd><a href="#">10.5281/zenodo.XXXXXXX</a></dd></div>
        <div><dt>Language</dt><dd>EN · <a href="#">UK</a></dd></div>
        <div><dt>Sheet</dt><dd class="bs-num">1 / 12</dd></div>
      </dl>
      <div class="bs-prose">
        <p>In 2024 I worked on a prototype for drone navigation without GNSS: the camera looks down, and the program estimates from consecutive frames how far the aircraft has moved. A simpler problem appeared alongside it, and it is useful <span class="bs-mark">right now</span>. A reconnaissance platform photographs the ground in series, and after the flight the analyst gets several hundred separate images.</p>
        <h2>Matching key points</h2>
        <p>For each pair of neighbouring frames we find key points, describe them, and keep only the matches that pass Lowe's ratio test. RANSAC then rejects the matches that do not agree with a single homography.</p>
        <pre><code>ratio = 0.75
good = [m for m, n in knn if m.distance &lt; ratio * n.distance]
H, mask = cv2.findHomography(src, dst, cv2.RANSAC, 4.0)</code></pre>
      </div>
      <figure class="bs-figure">
        ${lineChart(matches, { xLabel: 'frame pair' })}
        <figcaption><span class="bs-figure__num">Fig. 2</span>Inlier matches per frame pair after RANSAC, three detectors on the same 16 frames. Sample data.</figcaption>
      </figure>
    </article>
    <div class="bs-section-head"><h2 class="bs-section-head__title">Articles</h2><a href="#">All articles →</a></div>
    <ul class="bs-entries">
      <li class="bs-entry"><span class="bs-entry__date">11 Oct 2026</span><div><h3 class="bs-entry__title"><a href="#">Stitching Drone Photos into a Local Map: A Practical Walkthrough with OpenCV</a></h3><p class="bs-entry__excerpt">SIFT, the ratio test, RANSAC and homographies on real data, with Python code.</p><div class="bs-entry__meta"><span>DOI 10.5281/zenodo.XXXXXXX</span><span>14 min read</span></div></div></li>
      <li class="bs-entry"><span class="bs-entry__date">20 Sep 2026</span><div><h3 class="bs-entry__title" lang="uk"><a href="#">Доповнена реальність без маркерів: як телефон розуміє, де стіл</a></h3><p class="bs-entry__excerpt" lang="uk">Як телефон знаходить підлогу і стіл без жодних маркерів: гомографія, ключові точки і SLAM простими словами.</p><div class="bs-entry__meta"><span>In Ukrainian</span><span>9 min read</span></div></div></li>
    </ul>
  </section>

  <section class="sp-part" aria-labelledby="p-op">
    <div class="bs-section-head"><h2 class="bs-section-head__title" id="p-op">Operate · trading dashboard, dark scheme</h2><span class="bs-label">Sample data</span></div>
    <div data-bs-scheme="dark" class="sp-dash">
      <div class="sp-dash-top">
        <div class="bs-ui"><strong>Watchlist A</strong> <span class="bs-subtle">· page 1 of 3</span></div>
        <div class="bs-segmented" role="group" aria-label="Timeframe"><button>5m</button><button aria-pressed="true">1h</button><button>4h</button><button>1D</button></div>
        <div style="display:flex;gap:var(--bs-space-3)"><input class="bs-input" placeholder="Add symbol" aria-label="Add symbol"><button class="bs-btn bs-btn--primary">Add</button></div>
      </div>
      <div class="sp-stats">
        <div class="bs-stat"><span class="bs-label">Unrealised P&amp;L</span><span class="bs-stat__value">+1\u202f284.50</span><span class="bs-stat__delta bs-up">0.84% today</span></div>
        <div class="bs-stat"><span class="bs-label">Gross exposure</span><span class="bs-stat__value">152\u202f900</span><span class="bs-stat__delta bs-subtle">USD · 6 positions</span></div>
        <div class="bs-stat"><span class="bs-label">Open orders</span><span class="bs-stat__value">3</span><span class="bs-stat__delta bs-subtle">2 limit · 1 stop</span></div>
        <div class="bs-stat"><span class="bs-label">Data feed</span><span class="bs-stat__value">IBKR</span><span class="bs-stat__delta"><span class="bs-tag is-caution">QQQ stale 2h</span></span></div>
      </div>
      <div class="sp-two">
        <div class="bs-panel">
          <div class="bs-panel__head"><span class="bs-panel__title">NVDA · 1h</span><span class="bs-tag is-positive">live</span></div>
          <div class="bs-panel__body">${candleChart(nvda, { labels: [[4, 'Mon'], [20, 'Tue'], [36, 'Wed'], [52, 'Thu']] })}</div>
        </div>
        <div class="bs-panel">
          <div class="bs-panel__head"><span class="bs-panel__title">Watchlist</span><span class="bs-subtle">6 symbols</span></div>
          <div class="bs-panel__body bs-panel__body--flush">
            <table class="bs-table">
              <thead><tr><th>Symbol</th><th class="is-num">Last</th><th class="is-num">Change</th><th>Feed</th></tr></thead>
              <tbody>${watch.map(([s, p, c, up, feed], i) => `<tr${i === 0 ? ' aria-selected="true"' : ''}><td><strong>${s}</strong></td><td class="is-num">${p}</td><td class="is-num ${up ? 'bs-up' : 'bs-down'}">${c}</td><td><span class="bs-tag${feed === 'live' ? '' : feed.startsWith('stale') ? ' is-caution' : ''}">${feed}</span></td></tr>`).join('')}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="sp-part" aria-labelledby="p-slides" lang="uk">
    <div class="bs-section-head"><h2 class="bs-section-head__title" id="p-slides">Present · lecture slides (Ukrainian)</h2><span class="bs-label">1920 × 1080</span></div>
    <div class="sp-two">
      <section class="bs-slide"><div class="bs-slide__frame">
        <h3 class="bs-slide__title">Пошук шляху: алгоритм A*</h3>
        <p class="bs-slide__lead">Евристики, допустимість і чому A* знаходить найкоротший шлях</p>
        <footer class="bs-slide__foot"><span>Програмування ШІ для ігор</span><span>Лекція 3</span><span>1 / 24</span></footer>
      </div></section>
      <section class="bs-slide"><div class="bs-slide__frame">
        <h3 class="bs-slide__title" style="font-size:calc(var(--bs-slide-title) * 0.75 * var(--px))">Як A* обирає наступну клітинку</h3>
        <div class="bs-slide__body bs-slide__cols">
          <ul><li><span class="bs-mono">f(n) = g(n) + h(n)</span></li><li>g — вартість шляху від старту</li><li>h — оцінка до цілі</li><li>Допустима h ніколи не переоцінює</li></ul>
          <div>${board({ cell: 10 }).svg}</div>
        </div>
        <footer class="bs-slide__foot"><span>Програмування ШІ для ігор</span><span>Лекція 3</span><span>7 / 24</span></footer>
      </div></section>
      <section class="bs-slide bs-slide--section"><div class="bs-slide__frame">
        <h3 class="bs-slide__title">Частина 2. Евристики</h3>
        <p class="bs-slide__lead">Манхеттенська, евклідова, октильна</p>
        <footer class="bs-slide__foot"><span>Програмування ШІ для ігор</span><span>Лекція 3</span><span>12 / 24</span></footer>
      </div></section>
    </div>
  </section>

  <section class="sp-part" aria-labelledby="p-video" lang="uk">
    <div class="bs-section-head"><h2 class="bs-section-head__title" id="p-video">Video · title card, lower third, thumbnail</h2><span class="bs-label">1920 × 1080 · 1280 × 720</span></div>
    <div class="sp-two">
      <div class="bs-video" data-bs-scheme="dark"><div class="bs-titlecard"><h3 class="bs-titlecard__title">Як дрон бачить без GPS</h3><p class="bs-titlecard__sub">Візуальна одометрія за 12 хвилин</p></div></div>
      <div class="bs-video"><div class="sp-frame-art">video frame</div><div class="bs-lowerthird"><div class="bs-lowerthird__name">${brand.name.uk}</div><div class="bs-lowerthird__role">Кафедра ПЗ, Львівська політехніка</div></div></div>
      <div class="bs-video"><div class="bs-thumb__words">Дрон без GPS</div><div class="bs-thumb__art sp-thumb-art">${thumbBoard.svg}</div></div>
    </div>
  </section>

  <section class="sp-part" aria-labelledby="p-play" lang="uk">
    <div class="bs-section-head"><h2 class="bs-section-head__title" id="p-play">Play · browser demo game</h2><span class="bs-label">A*, Manhattan heuristic</span></div>
    <div class="sp-hud-wrap">
      <div class="bs-hud"><span class="bs-hud__stat"><span class="bs-label">Крок</span><b>${g.stats.steps}</b></span><span class="bs-hud__stat"><span class="bs-label">Відкрито</span><b>${g.stats.open}</b></span><span class="bs-hud__stat"><span class="bs-label">Закрито</span><b>${g.stats.closed}</b></span><span class="bs-hud__stat"><span class="bs-label">Шлях</span><b>${g.stats.length}</b></span><span style="margin-left:auto;display:flex;gap:var(--bs-space-3)"><button class="bs-btn">Крок</button><button class="bs-btn bs-btn--primary">Запуск</button></span></div>
      ${g.svg}
    </div>
  </section>

  <section class="sp-part" aria-labelledby="p-tokens">
    <div class="bs-section-head"><h2 class="bs-section-head__title" id="p-tokens">Tokens · colour and type</h2><span class="bs-label">contract names</span></div>
    ${swatches(look)}
    <div class="sp-type" style="margin-top:var(--bs-space-7)">
      <p class="bs-label">Display · ${look.fonts.display.family}</p>
      <p style="font-family:var(--bs-font-display);font-weight:var(--bs-weight-display);font-stretch:var(--bs-display-stretch);font-size:var(--bs-size-4xl);line-height:var(--bs-leading-tight);letter-spacing:var(--bs-tracking-display);margin:0" lang="uk">Ґрунт, їжак, Євген і 2026</p>
      <p class="bs-label">Text · ${look.fonts.text.family}</p>
      <p class="bs-measure" style="margin:0" lang="uk">Щоб отримати карту ділянки, кадри зшивають попарно: знаходять ключові точки, відкидають хибні пари тестом Лоу і рахують гомографію методом RANSAC. Ґанок, їжак, єнот.</p>
      <p class="bs-label">UI · ${look.fonts.ui.family} · Mono · ${look.fonts.mono.family}</p>
      <p class="bs-ui" style="margin:0">Watchlist · Add symbol · 1h · <span class="bs-mono bs-num">132.84 −8.45 0.84%</span></p>
    </div>
  </section>
  <footer class="bs-header" style="border-bottom:0;border-top:var(--bs-line-w) solid var(--bs-line);margin-top:var(--bs-space-8)"><span class="bs-subtle bs-ui">bausk-style ${meta.version} · generated specimen · sample data is labelled as such</span></footer>
</div>
</body>
</html>
`;
}

export function renderIndex(looks, meta) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>bausk-style ${meta.version} · looks</title><link rel="stylesheet" href="../css/${looks[0].id}.css"></head>
<body><div class="bs-page"><header class="bs-header"><span class="bs-header__name">bausk-style ${meta.version}</span><span class="bs-subtle bs-ui">Specimens</span></header>
<ul class="bs-entries">${looks.map((l) => `<li class="bs-entry"><span class="bs-entry__date">${l.status}</span><div><h3 class="bs-entry__title"><a href="${l.id}.html">${l.name.en} · ${l.name.uk}</a></h3><p class="bs-entry__excerpt">${l.reference}</p></div></li>`).join('')}</ul></div></body></html>
`;
}
