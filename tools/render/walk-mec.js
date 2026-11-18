// Drives the App board to 2.º and 3.º grado and screenshots the texts the MEC check changed.
const { chromium } = require('playwright');
const OUT = require('path').resolve(__dirname, '..', '..') + '/render/mec-';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const log = [];
  p.on('pageerror', (e) => log.push('pageerror: ' + String(e).slice(0, 200)));
  const wait = (ms) => p.waitForTimeout(ms);
  const shot = async (name) => { await p.screenshot({ path: OUT + name + '.png' }); log.push('shot ' + name); };
  const click = async (role, name) => { await p.getByRole(role, { name }).first().click(); await wait(650); };
  const scrollAll = async (to) => p.evaluate((to) => { document.querySelectorAll('*').forEach((el) => { const s = getComputedStyle(el); if (s.overflowY === 'auto' && el.scrollHeight > el.clientHeight) el.scrollTop = to === 'end' ? el.scrollHeight : to; }); }, to);
  try {
    await p.goto('http://127.0.0.1:8766/project/App.dc.html', { waitUntil: 'networkidle' });
    await wait(1200);
    await click('link', /Epáy/); await wait(600);
    await click('link', /Jaha, vamos/);
    await click('button', /^3\.º grado/); await shot('grade-g3');
    await click('button', /^2\.º grado/); await shot('grade-g2');
    await click('link', /Elegir 2\.º grado/);
    await click('link', /¡Vamos!/);
    await click('link', /A caminar/); await wait(800);
    await shot('main-g2');
    await click('link', /Para grandes|grandes/i).catch(async () => { await click('button', /Para grandes|grandes/i); });
    await wait(500); await shot('grownups-g2');
    await scrollAll(260); await wait(300); await shot('grownups-g2-b');
  } catch (e) {
    log.push('stopped: ' + String(e).split('\n')[0].slice(0, 300));
    await shot('zz-stopped');
  }
  console.log(log.join('\n'));
  await b.close();
})();
