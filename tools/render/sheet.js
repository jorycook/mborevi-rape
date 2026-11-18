// contact sheet: PNGs side by side, labelled; usage: node sheet.js out.png scale a.png b.png ...
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [out, scale, ...imgs] = process.argv.slice(2);
  const cells = imgs.map((f) => `<figure><img src="http://127.0.0.1:8766/${path.relative(require('path').resolve(__dirname, '..', '..'), path.resolve(f))}"><figcaption>${path.basename(f, '.png')}</figcaption></figure>`).join('');
  const html = `<html><body style="margin:0;background:#0b0820;font:600 14px sans-serif;color:#ddd"><div style="display:flex;gap:16px;padding:16px;align-items:flex-start">${cells}</div>
  <style>figure{margin:0;display:flex;flex-direction:column;gap:6px}img{display:block;border:1px solid #333}</style></body></html>`;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 400, height: 400 }, deviceScaleFactor: +scale || 1 });
  await p.goto('http://127.0.0.1:8766/'); await p.setContent(html, { waitUntil: 'networkidle' });
  await p.waitForTimeout(300);
  await p.screenshot({ path: out, fullPage: true });
  await b.close();
})();
