// Drives the App board like a child would and screenshots the states the standalone boards never show.
const { chromium } = require('playwright');
const OUT = require('path').resolve(__dirname, '..', '..') + '/render2/walk-';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const log = [];
  p.on('pageerror', (e) => log.push('pageerror: ' + String(e).slice(0, 200)));
  const wait = (ms) => p.waitForTimeout(ms);
  const shot = async (name) => { await p.screenshot({ path: OUT + name + '.png' }); log.push('shot ' + name); };
  const click = async (role, name, opts) => { const el = p.getByRole(role, { name }).first(); await el.click(opts); await wait(650); };
  const visible = async (role, name) => (await p.getByRole(role, { name }).count()) > 0 && p.getByRole(role, { name }).first().isVisible();
  try {
    await p.goto(require('./url.js')('App.dc.html'), { waitUntil: 'networkidle' });
    await wait(1200);
    await click('link', /Epáy/); await wait(900);
    await shot('01-welcome-awake');
    await click('link', /Jaha, vamos/);
    await click('button', /^1\.º grado/);
    await click('link', /Elegir 1\.º grado/);
    await click('link', /¡Vamos!/);
    await click('link', /A caminar/);
    await shot('02-main-start');
    await click('link', /¡Vamos!/);
    await click('link', /^Jaha!/);
    // Meet: next card until the end panel
    for (let i = 0; i < 12 && !(await visible('link', /Al juego que sigue/)); i++) { await click('button', /Upéi/); }
    await shot('03-meet-done');
    await click('link', /Al juego que sigue/);
    await shot('04-tonight-one-done');
    await click('link', /^Jaha!/);
    // Pick: a first try (may be wrong), then answer every round
    const opts = p.getByRole('button', { name: /^Dibujo:/ });
    await opts.nth(0).click(); await wait(250);
    await shot('05-pick-first-try');
    for (let round = 0; round < 12 && !(await visible('link', /Seguir/)); round++) {
      const n = await opts.count();
      for (let k = 0; k < n; k++) {
        if (await visible('link', /Seguir/)) break;
        const o = opts.nth(k);
        if ((await o.getAttribute('aria-disabled')) === 'true') continue;
        await o.click(); await wait(300);
        if (round === 1 && k === 0) await shot('06-pick-feedback');
        if ((await p.getByText(/Iporãite!/).count()) > 0) { await wait(1300); break; }
      }
    }
    await shot('07-pick-done');
    await click('link', /Seguir/);
    await click('link', /^Jaha!/);
    await shot('08-third-game');
    // Say: say each phrase, then go on
    for (let i = 0; i < 10; i++) {
      if (await visible('link', /Seguir/)) break;
      if (await visible('button', /Empezar a decirlo|Decirlo otra vez/)) await click('button', /Empezar a decirlo/);
      if (await visible('button', /Terminé de decirlo/)) await click('button', /Terminé de decirlo/);
      if (i === 0) await shot('09-say-heard');
      await click('link', /Upéi/);
    }
    await shot('10-say-done');
    await click('link', /Seguir/);
    await wait(1800);
    await shot('11-main-walked');
    await click('link', /Para grandes|grandes/i).catch(async () => { await click('button', /Para grandes|grandes/i); });
    await wait(500);
    await p.evaluate(() => { document.querySelectorAll('*').forEach((el) => { const s = getComputedStyle(el); if (s.overflowY === 'auto' && el.scrollHeight > el.clientHeight) el.scrollTop = el.scrollHeight; }); });
    await wait(400);
    await shot('12-grownups-voice');
  } catch (e) {
    log.push('stopped: ' + String(e).split('\n')[0].slice(0, 300));
    await shot('zz-stopped');
  }
  console.log(log.join('\n'));
  await b.close();
})();
