// Renders every board twice, with the design canvas's runtime (project/X.dc.html, which loads project/support.js; only
// present locally) and with this repo's runtime (runtime/board.html?b=X.dc.html), and writes both screenshots plus a
// pixel diff report (tools/render/parity_diff.py). Usage: node tools/render/parity.js [Board.dc.html ...]
// Needs a server on 8766 at the repository root: python3 -m http.server 8766
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const S = path.resolve(__dirname, '..', '..');
const canvas = JSON.parse(fs.readFileSync(S + '/project/canvas.json', 'utf8'));
const only = process.argv.slice(2);
const OUT = S + '/render/parity/';
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const report = [];
  for (const name of canvas.order) {
    if (only.length && !only.includes(name)) continue;
    const fr = canvas.boards[name];
    const shots = {};
    for (const [kind, url] of [['canvas', 'project/' + name], ['ours', 'runtime/board.html?b=' + name]]) {
      const p = await b.newPage({ viewport: { width: fr.w, height: fr.h }, deviceScaleFactor: 1 });
      await p.emulateMedia({ reducedMotion: 'reduce' });
      const errors = [];
      p.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
      p.on('console', (m) => { if (m.type() === 'error' && !/Expected (moveto|number)|attribute d:|attribute (viewBox|width|height|transform|cx|cy|r|opacity)/.test(m.text())) errors.push(m.text().slice(0, 200)); });
      await p.goto('http://127.0.0.1:8766/' + url, { waitUntil: 'networkidle' });
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(1600);
      const file = OUT + name.replace('.dc.html', '') + '.' + kind + '.png';
      await p.screenshot({ path: file });
      shots[kind] = { file, errors, error: await p.evaluate(() => document.body.getAttribute('data-error')) };
      await p.close();
    }
    report.push({ name, w: fr.w, h: fr.h, canvas: shots.canvas, ours: shots.ours });
  }
  fs.writeFileSync(OUT + 'report.json', JSON.stringify(report, null, 1));
  await b.close();
  console.log(report.length + ' boards rendered both ways');
})();
