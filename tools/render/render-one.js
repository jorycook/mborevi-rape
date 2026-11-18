const { chromium } = require('playwright');
(async () => {
  const [name, w, h] = [process.argv[2], +process.argv[3] || 390, +process.argv[4] || 844];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const errors = [];
  p.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 300)));
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text().slice(0, 300)); });
  await p.goto(require('./url.js')(name), { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: process.argv[5] || (require('path').resolve(__dirname, '..', '..') + '/render/' + name.replace('.dc.html', '') + '.png') });
  const info = await p.evaluate(() => ({ body: document.body.innerText.slice(0, 200).replace(/\s+/g, ' '), xdc: document.querySelectorAll('x-dc').length }));
  console.log(JSON.stringify({ name, info, errors: errors.slice(0, 8) }));
  await b.close();
})();
