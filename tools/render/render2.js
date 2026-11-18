const { chromium } = require('playwright');
const fs = require('fs');
const S = require('path').resolve(__dirname, '..', '..');
const canvas = JSON.parse(fs.readFileSync(S + '/project/canvas.json', 'utf8'));
(async () => {
  const b = await chromium.launch();
  for (const name of canvas.order) {
    const fr = canvas.boards[name];
    const p = await b.newPage({ viewport: { width: fr.w, height: fr.h }, deviceScaleFactor: 2 });
    await p.goto('http://127.0.0.1:8766/project/' + name, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1200);
    await p.screenshot({ path: S + '/render2/' + name.replace('.dc.html', '') + '.png' });
    await p.close();
  }
  await b.close();
})();
