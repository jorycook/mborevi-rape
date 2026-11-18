// a labelled sheet of screenshots taken at 2x, shown at their CSS size and captured at 2x
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [out, title, ...imgs] = process.argv.slice(2);
  const cells = imgs.map((f) => `<figure><img src="http://127.0.0.1:8766/${path.relative(require('path').resolve(__dirname, '..', '..'), path.resolve(f))}" onload="this.style.width=(this.naturalWidth/2)+'px'"><figcaption>${path.basename(f, '.png').replace(/^walk-\d+-/, '')}</figcaption></figure>`).join('');
  const html = `<html><body style="margin:0;background:#0b0820;font:700 15px Nunito,sans-serif;color:#e8e2ff"><div style="padding:18px 18px 4px;font-size:20px">${title}</div><div style="display:flex;flex-wrap:wrap;gap:18px;padding:18px;align-items:flex-start;max-width:1700px">${cells}</div>
  <style>figure{margin:0;display:flex;flex-direction:column;gap:8px}img{display:block;border-radius:6px}</style></body></html>`;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1740, height: 600 }, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:8766/');
  await p.setContent(html, { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  await p.screenshot({ path: out, fullPage: true });
  await b.close();
})();
