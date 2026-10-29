// Full-page or element screenshots through headless Chromium and the DevTools protocol.
// No npm dependencies; needs Node >= 22 (global WebSocket) and a Chromium/Chrome binary:
// $BS_CHROME, else Playwright's cached Chromium, else chromium/google-chrome on PATH.
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function findChrome() {
  if (process.env.BS_CHROME && existsSync(process.env.BS_CHROME)) return process.env.BS_CHROME;
  const pw = join(homedir(), '.cache', 'ms-playwright');
  if (existsSync(pw)) {
    for (const d of readdirSync(pw).filter((d) => d.startsWith('chromium-')).sort().reverse()) {
      for (const sub of ['chrome-linux64/chrome', 'chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) {
        if (existsSync(join(pw, d, sub))) return join(pw, d, sub);
      }
    }
  }
  for (const bin of ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable']) {
    try { return execFileSync('which', [bin]).toString().trim(); } catch {}
  }
  throw new Error('No Chromium found. Set BS_CHROME or run `npx playwright install chromium`.');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// shots: [{ url, out, width=1440, height=900, selector?, scheme? ('light'|'dark') }]
export async function shoot(shots) {
  const chrome = findChrome();
  const profile = mkdtempSync(join(tmpdir(), 'bs-chrome-'));
  const port = 9300 + Math.floor(Math.random() * 600);
  const proc = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  try {
    let target;
    for (let i = 0; i < 100 && !target; i++) {
      try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page'); } catch { await sleep(100); }
    }
    if (!target) throw new Error('Chromium did not start');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let id = 0;
    const pending = new Map();
    const events = [];
    ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.id && pending.has(msg.id)) { const [res, rej] = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(msg.error.message)) : res(msg.result); }
      else if (msg.method) events.push(msg.method);
    };
    const send = (method, params = {}) => new Promise((res, rej) => { pending.set(++id, [res, rej]); ws.send(JSON.stringify({ id, method, params })); });
    const evaluate = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
    await send('Page.enable');
    const outs = [];
    for (const s of shots) {
      const width = s.width ?? 1440, height = s.height ?? 900;
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: s.scale ?? 1, mobile: width < 600 });
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: s.scheme ?? 'light' }] });
      events.length = 0;
      const url = /^[a-z]+:\/\//.test(s.url) ? s.url : pathToFileURL(resolve(s.url)).href;
      await send('Page.navigate', { url });
      for (let i = 0; i < 200 && !events.includes('Page.loadEventFired'); i++) await sleep(50);
      await evaluate('document.fonts.ready.then(() => true)');
      await sleep(150);
      let clip;
      if (s.selector) {
        clip = await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(s.selector)}).getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; })()`);
      } else {
        const h = await evaluate('document.documentElement.scrollHeight');
        clip = { x: 0, y: 0, width, height: Math.min(h, s.maxHeight ?? 16000) };
      }
      const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { ...clip, scale: 1 } });
      writeFileSync(s.out, Buffer.from(data, 'base64'));
      outs.push(s.out);
    }
    ws.close();
    return outs;
  } finally {
    proc.kill();
    await sleep(200);
    rmSync(profile, { recursive: true, force: true });
  }
}
