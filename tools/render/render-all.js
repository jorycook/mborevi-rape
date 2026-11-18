const { chromium } = require('playwright');
const fs = require('fs');
const S = require('path').resolve(__dirname, '..', '..');
const canvas = JSON.parse(fs.readFileSync(S + '/project/canvas.json', 'utf8'));
(async () => {
  const b = await chromium.launch();
  const out = [];
  for (const name of canvas.order) {
    const fr = canvas.boards[name];
    const p = await b.newPage({ viewport: { width: fr.w, height: fr.h }, deviceScaleFactor: 1 });
    const errors = [];
    p.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
    p.on('console', (m) => { if (m.type() === 'error' && !/Expected (moveto|number)|attribute d:|attribute (viewBox|width|height|transform|cx|cy|r|opacity)/.test(m.text())) errors.push(m.text().slice(0, 200)); });
    await p.goto('http://127.0.0.1:8766/project/' + name, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1200);
    const m = await p.evaluate(() => {
      // text that overflows its box horizontally, and the document's own overflow
      const bad = [];
      document.querySelectorAll('div, span, h1, h2, button, a').forEach((el) => {
        const cs = getComputedStyle(el);
        if (el.children.length === 0 && el.textContent.trim() && el.scrollWidth > el.clientWidth + 1 && (cs.overflow === 'hidden' || cs.textOverflow === 'ellipsis')) bad.push(el.textContent.trim().slice(0, 40));
      });
      return { sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, clipped: bad.slice(0, 6) };
    });
    await p.screenshot({ path: S + '/render/' + name.replace('.dc.html', '') + '.png' });
    out.push({ name, w: fr.w, h: fr.h, ...m, errors: errors.slice(0, 4) });
    await p.close();
  }
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
