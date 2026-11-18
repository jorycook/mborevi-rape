// usage: node shot.js <html> <png> [width] [height] [scale]
const { chromium } = require('playwright');
(async () => {
  const [html, png, w = '900', h = '600', s = '1'] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +s });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + require('path').resolve(html));
  await page.waitForTimeout(400);
  await page.screenshot({ path: png });
  if (errs.length) console.log('ERRORS:\n' + errs.join('\n'));
  await browser.close();
})();
