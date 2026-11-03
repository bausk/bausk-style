// Quarto reveal.js extension for a look: dist/quarto/<look>/_extensions/bausk/.
// Use in a deck:  format: bausk-revealjs   (bausk-style init --media slides copies it)
import { existsSync, readFileSync, mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { ROOT, fontsManifest } from '../lib/tokens.mjs';
import { tokensCss, fontsCss } from './css.mjs';

export function quartoExtension(look, brand, meta, outDir) {
  const t = look.color.light;
  const v = look.values;
  const ext = join(outDir, '_extensions', 'bausk');
  mkdirSync(join(ext, 'fonts'), { recursive: true });

  // fonts used by the look
  const manifest = fontsManifest();
  for (const id of new Set(Object.values(look.fonts).map((f) => f.id))) {
    for (const face of manifest[id].faces) {
      mkdirSync(join(ext, 'fonts', dirname(face.file)), { recursive: true });
      copyFileSync(join(ROOT, 'fonts', face.file), join(ext, 'fonts', face.file));
    }
    copyFileSync(join(ROOT, 'fonts', id, 'LICENSE.txt'), join(ext, 'fonts', id, 'LICENSE.txt'));
  }

  writeFileSync(join(ext, '_extension.yml'), `# bausk-style ${meta.version} · look "${look.id}" · generated, do not edit.
title: bausk-style (${look.id})
author: ${brand.name.en}
version: ${meta.version}
quarto-required: ">=1.6.0"
contributes:
  formats:
    revealjs:
      theme: [default, bausk.scss]
      css: [bausk.css]
      include-after-body: [deck.html]
      format-resources: [fonts]
      width: 1920
      height: 1080
      margin: 0
      center: false
      slide-number: c/t
      transition: none
      background-transition: none
      controls: false
      progress: false
      menu: false
      hash: true
      highlight-style: none
      code-line-numbers: false
`);

  // Sass needs literal colours for its defaults; the rules below use the --bs-* variables.
  const rules = existsSync(join(ROOT, 'tokens', 'looks', look.id, 'slides.scss'))
    ? readFileSync(join(ROOT, 'tokens', 'looks', look.id, 'slides.scss'), 'utf8')
    : '/* This look has no slide signature yet; Quarto defaults with the look\'s colours and fonts. */\n';
  writeFileSync(join(ext, 'bausk.scss'), `/* bausk-style ${meta.version} · look "${look.id}" · reveal.js theme · generated, do not edit. */
/*-- scss:defaults --*/
$body-bg: ${t.bg};
$body-color: ${t.fg};
$text-muted: ${t['fg-subtle']};
$link-color: ${t.accent};
$selection-bg: ${t.selection};
$border-color: ${t.line};
$font-family-sans-serif: ${v['font-text']};
$font-family-monospace: ${v['font-mono']};
$presentation-font-size-root: ${look.media.slide.body}px;
$presentation-heading-font: ${v['font-display']};
$presentation-heading-color: ${t.fg};
$presentation-heading-font-weight: ${v['weight-display']};
$presentation-heading-line-height: ${v['leading-tight']};
$presentation-heading-letter-spacing: ${v['tracking-display']};
$presentation-heading-text-transform: none;
$code-block-bg: ${t['bg-subtle']};
$code-block-border-color: ${t['bg-subtle']};
$code-color: ${t.fg};
$code-bg: ${t['bg-subtle']};

/*-- scss:rules --*/
${rules}`);

  writeFileSync(join(ext, 'bausk.css'), `/* bausk-style ${meta.version} · look "${look.id}" · fonts and tokens for the deck · generated, do not edit. */
@layer bs.tokens;
${fontsCss(look, 'fonts/')}
${tokensCss(look)}`);

  writeFileSync(join(ext, 'deck.html'), `<script>
/* bausk-style: put the deck footer and "n / N" inside every slide, so they scale with it and print to PDF.
   Footer text comes from the deck's \`footer:\` option. Add class .no-foot to a slide to hide it. */
(function () {
  function place() {
    var deck = window.Reveal; if (!deck) return;
    // Slides keep a fixed top-left composition; undo reveal's vertical centring.
    document.querySelectorAll('.reveal .slides section.center').forEach(function (s) { s.classList.remove('center'); });
    var src = document.querySelector('.reveal .footer');
    var text = src ? src.textContent.trim() : '';
    var slides = deck.getSlides();
    slides.forEach(function (s, i) {
      if (s.id === 'title-slide' && !text) return;
      var f = s.querySelector(':scope > .bs-deck-foot');
      if (!f) { f = document.createElement('div'); f.className = 'bs-deck-foot'; s.appendChild(f); }
      f.innerHTML = '<span></span><span class="bs-deck-foot__no"></span>';
      f.firstChild.textContent = text;
      f.lastChild.textContent = (i + 1) + ' / ' + slides.length;
    });
    deck.layout();
  }
  if (window.Reveal && window.Reveal.isReady && window.Reveal.isReady()) place();
  else if (window.Reveal) window.Reveal.on('ready', place);
  else window.addEventListener('load', function () { window.Reveal && window.Reveal.on('ready', place); });
})();
</script>
`);
  return ext;
}
