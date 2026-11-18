// Checks what the public site (index.html) does beyond drawing the screens, which the walks and parity.js cover:
// progress kept on the device, the phone's Back, windows too short for the app, a board that fails to load or to draw,
// a slow connection, no JavaScript, the iPhone's silent switch (simulated), the early sound file, the share tags.
// Needs a server on the repository (BASE=http://127.0.0.1:8766/ by default). Usage: node tools/render/site-checks.js
const { chromium } = require('playwright');
const BASE = require('./url.js').BASE;
const SITE = BASE + 'index.html';
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: !!ok, detail }); console.log((ok ? 'ok   ' : 'FAIL ') + name + (detail ? ' — ' + detail : '')); };

async function clickName(p, role, name) { await p.getByRole(role, { name }).first().click(); await p.waitForTimeout(650); }
async function toPath(p) {
  await p.goto(SITE, { waitUntil: 'networkidle' });
  await clickName(p, 'link', /Epáy/); await p.waitForTimeout(500);
  await clickName(p, 'link', /Jaha, vamos/);
  await clickName(p, 'button', /^1\.º grado/);
  await clickName(p, 'link', /Elegir 1\.º grado/);
  await clickName(p, 'link', /¡Vamos!/);
  await clickName(p, 'link', /A caminar/);
}
const screenText = (p) => p.evaluate(() => document.getElementById('frame').innerText.replace(/\s+/g, ' ').slice(0, 120));

(async () => {
  const b = await chromium.launch();
  const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true };

  // 1. progress kept: on the path, a night's first game played, then the page is opened again
  {
    const ctx = await b.newContext(phone); const p = await ctx.newPage();
    await toPath(p);
    await clickName(p, 'link', /¡Vamos!/);           // the path's card: tonight's games
    await clickName(p, 'link', /^Jaha!/);            // the first game
    for (let i = 0; i < 12 && !(await p.getByRole('link', { name: /Al juego que sigue/ }).count()); i++) await clickName(p, 'button', /Upéi/);
    await clickName(p, 'link', /Al juego que sigue/);
    const kept = await p.evaluate(() => JSON.parse(localStorage.getItem('mborevi-rape') || 'null'));
    check('progress is written on the device', kept && kept.grade === 'g1' && kept.track && Object.keys(kept.done || {}).length === 1, JSON.stringify(kept).slice(0, 140));
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    const t = await screenText(p);
    check('opened again, the child is on the path of 1.º grado', /^1\.º grado/.test(t), t);
    await clickName(p, 'link', /¡Vamos!/);
    const done = await p.getByRole('link', { name: /hecho|listo|✓|Ya jugaste/i }).count();
    const t2 = await screenText(p);
    check('tonight still shows the first game played', done > 0 || /1 de 3|1\/3/.test(t2), t2);
    // what is kept but broken, or from an old version, is not trusted
    await p.evaluate(() => localStorage.setItem('mborevi-rape', JSON.stringify({ v: 1, grade: 'g9x', track: 'XX', done: { nope: { meet: 1 }, g1u01n1: 'x' }, checks: { g1u01n1: { stars: 9 } } })));
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    check('unusable saved progress starts afresh', /Epáy/.test(await screenText(p)), await screenText(p));
    await p.evaluate(() => localStorage.setItem('mborevi-rape', '{not json'));
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    check('saved text that is not JSON starts afresh', /Epáy/.test(await screenText(p)));
    await ctx.close();
  }

  // 2. the phone's Back: one screen back, as the screen's own button; on the path it leaves the site
  {
    const ctx = await b.newContext(phone); const p = await ctx.newPage();
    await p.goto('about:blank');
    await toPath(p);
    await clickName(p, 'link', /¡Vamos!/);                    // Tonight
    await clickName(p, 'link', /^Jaha!/);                     // Meet
    const before = await screenText(p);
    await p.goBack(); await p.waitForTimeout(700);
    const t1 = await screenText(p);
    check('Back from a game goes to tonight\'s games', /Jaha!|Esta noche|NOCHE/i.test(t1) && t1 !== before && p.url().startsWith(BASE), t1);
    await p.goBack(); await p.waitForTimeout(700);
    const t2 = await screenText(p);
    check('Back from tonight goes to the path', p.url().startsWith(BASE) && /^1\.º grado/.test(t2), t2);
    await p.goBack(); await p.waitForTimeout(900);
    check('Back on the path leaves the site', p.url() === 'about:blank', p.url());
    await p.goForward(); await p.waitForTimeout(1500);
    const t3 = await screenText(p);
    check('coming forward again lands on the path, progress kept', p.url().startsWith(BASE) && /1\.º grado/.test(t3), t3);
    // the in-app back buttons leave no stray history: path → tonight → in-app back → path → Back leaves
    await clickName(p, 'link', /¡Vamos!/);
    await clickName(p, 'link', /Volver al camino/);
    await p.waitForTimeout(500);
    await p.goBack(); await p.waitForTimeout(900);
    check('after the in-app back button, Back on the path still leaves', p.url() === 'about:blank', p.url());
    await ctx.close();
  }

  // 3. windows too short for the app: nothing is cut out of reach
  for (const [w, h] of [[740, 280], [844, 390], [1366, 330]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage();
    await p.goto(SITE, { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
    const m = await p.evaluate(() => {
      const box = document.getElementById('box').getBoundingClientRect();
      const se = document.scrollingElement;
      return { top: box.top + se.scrollTop, height: box.height, scrollH: se.scrollHeight, clientH: se.clientHeight, transform: document.getElementById('frame').style.transform };
    });
    const btn = p.getByRole('link', { name: /Epáy/ }).first();
    await btn.scrollIntoViewIfNeeded();
    const r = await btn.boundingBox();
    check(`${w}x${h}: the page scrolls to the whole screen`, m.top >= -0.5 && m.scrollH >= m.top + m.height - 1 && r && r.y >= 0 && r.y + r.height <= h + 0.5, JSON.stringify(m));
    await ctx.close();
  }

  // 4. a board that cannot load: the page says so and offers to try again (it does not open with a hole)
  {
    const ctx = await b.newContext(phone); const p = await ctx.newPage();
    let tries = 0;
    await p.route('**/project/Meet.dc.html*', (route) => { tries++; route.abort(); });
    await p.goto(SITE); await p.waitForTimeout(4000);
    const t = await screenText(p);
    check('a board that fails to load: the page offers to try again', /No se pudo abrir la app/.test(t) && (await p.getByRole('button', { name: 'Probar de nuevo' }).count()) === 1, `tries ${tries}: ${t}`);
    await ctx.close();
  }

  // 5. a board that throws while drawing: a message and a way back, progress kept
  {
    const ctx = await b.newContext(phone); const p = await ctx.newPage();
    await p.route('**/project/Meet.dc.html*', async (route) => {
      const r = await route.fetch(); let body = await r.text();
      body = body.replace(/(<script type="text\/x-dc"[^>]*>)([\s\S]*?)(<\/script>)/, (m, a, src, c) => a + src +
        '\nComponent.prototype.__rv = Component.prototype.renderVals;\nComponent.prototype.renderVals = function () { if (window.__boom) throw new Error("test: Meet breaks"); return this.__rv(); };\n' + c);
      route.fulfill({ response: r, body });
    });
    await toPath(p);
    await p.evaluate(() => { window.__boom = true; });
    await clickName(p, 'link', /¡Vamos!/);
    await clickName(p, 'link', /^Jaha!/);
    const t = await screenText(p);
    const restart = p.getByRole('button', { name: 'Volver a empezar' });
    check('a board that throws: «Algo no salió bien.» and a way out', /Algo no salió bien/.test(t) && (await restart.count()) === 1, t);
    await p.unroute('**/project/Meet.dc.html*');
    if (await restart.count()) { await restart.click(); await p.waitForLoadState('networkidle'); await p.waitForTimeout(900); }
    const t2 = await screenText(p);
    check('starting again goes back to the path, progress kept', /^1\.º grado/.test(t2), t2);
    await ctx.close();
  }

  // 6. a slow connection: after 25 s the page says it is still loading, and the app replaces that when it comes
  {
    const ctx = await b.newContext(phone); const p = await ctx.newPage();
    let release; const held = new Promise((ok) => { release = ok; });
    await p.route('**/project/App.dc.html*', async (route) => { await held; route.continue(); });
    await p.goto(SITE); await p.waitForTimeout(26000);
    const t = await screenText(p);
    check('slow: «sigue cargando», not a failure', /sigue cargando/.test(t) && !/No se pudo/.test(t), t);
    release(); await p.waitForTimeout(4000);
    check('slow: the app replaces the message when it comes', /Epáy/.test(await screenText(p)), await screenText(p));
    await ctx.close();
  }

  // 7. no JavaScript: the explanation is on screen, the loading line is not
  {
    const ctx = await b.newContext({ ...phone, javaScriptEnabled: false }); const p = await ctx.newPage();
    await p.goto(SITE);
    const m = await p.evaluate(() => {
      const ns = [...document.querySelectorAll('.msg')].map((e) => { const r = e.getBoundingClientRect(); return { text: e.innerText.trim().slice(0, 40), x: r.x, w: r.width, shown: getComputedStyle(e).display !== 'none' }; });
      return ns;
    });
    const shown = m.filter((x) => x.shown);
    check('no JavaScript: only the explanation shows, inside the screen', shown.length === 1 && /JavaScript/.test(shown[0].text) && shown[0].x >= 0 && shown[0].x + shown[0].w <= 390.5, JSON.stringify(m));
    await ctx.close();
  }

  // 8. the iPhone's silent switch, simulated: newer iPhones get navigator.audioSession set to 'playback'; older ones
  //    a silent <audio> plays along; the first tap wakes the sound even before Mborevi'i's lines arrive
  {
    const ctx = await b.newContext(phone); const p = await ctx.newPage();
    await p.addInitScript(() => { navigator.audioSession = { type: 'auto' }; });
    await p.goto(SITE, { waitUntil: 'networkidle' });
    await clickName(p, 'link', /Epáy/);
    check('newer iPhone: the audio session says playback after the first tap', (await p.evaluate(() => navigator.audioSession.type)) === 'playback');
    await ctx.close();
  }
  {
    const ctx = await b.newContext(phone); const p = await ctx.newPage();
    await p.addInitScript(() => {
      window.webkitAudioContext = window.AudioContext;
      window.__plays = [];
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () { window.__plays.push({ src: String(this.src).slice(0, 40), loop: this.loop }); return play.call(this); };
      window.__contexts = 0;
      const AC = window.AudioContext;
      window.AudioContext = window.webkitAudioContext = class extends AC { constructor(o) { super(o); window.__contexts++; } };
    });
    let uiAt = 0, appAt = 0; const t0 = Date.now();
    p.on('request', (r) => { if (/tp-sound-ui\.js/.test(r.url()) && !uiAt) uiAt = Date.now() - t0; if (/App\.dc\.html/.test(r.url()) && !appAt) appAt = Date.now() - t0; });
    let release; const held = new Promise((ok) => { release = ok; });
    await p.route('**/project/tp-sound-ui.js*', async (route) => { await held; route.continue(); });
    await p.goto(SITE); await p.waitForSelector('text=Epáy'); await p.waitForTimeout(300);
    const welcomeAt = Date.now() - t0;
    await clickName(p, 'link', /Epáy/);
    const info = await p.evaluate(() => ({ plays: window.__plays, contexts: window.__contexts }));
    check('older iPhone: a looping silent <audio> starts with the first tap', info.plays.some((x) => x.loop && /^data:audio\/wav/.test(x.src)), JSON.stringify(info));
    check('the first tap makes the audio output though the lines are not here yet', info.contexts >= 1, JSON.stringify(info));
    check('Mborevi\'i\'s lines are asked for before the first screen shows', uiAt > 0 && uiAt < welcomeAt, `ui file asked at ${uiAt} ms, App at ${appAt} ms, Welcome at ${welcomeAt} ms`);
    release();
    await ctx.close();
  }

  // 9. the share tags and the files they point at
  {
    const ctx = await b.newContext(); const p = await ctx.newPage();
    await p.goto(SITE, { waitUntil: 'networkidle' });
    const tags = await p.evaluate(() => {
      const m = (s) => (document.querySelector(s) || {}).content || (document.querySelector(s) || {}).href || '';
      return { image: m('meta[property="og:image"]'), url: m('meta[property="og:url"]'), card: m('meta[name="twitter:card"]'), locale: m('meta[property="og:locale"]'),
        icons: [...document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]')].map((l) => l.getAttribute('href')) };
    });
    const local = (u) => u.replace('https://jorycook.github.io/mborevi-rape/', BASE);
    const got = [];
    for (const u of [local(tags.image), ...tags.icons.map((h) => BASE + h)]) { const r = await p.request.get(u); got.push(r.status() + ' ' + u.replace(BASE, '')); }
    const man = await (await p.request.get(BASE + 'manifest.webmanifest')).json();
    for (const i of man.icons) { const r = await p.request.get(BASE + i.src); got.push(r.status() + ' ' + i.src); }
    check('share tags and icons: every file is there', got.every((g) => g.startsWith('200')) && tags.card === 'summary_large_image' && tags.locale === 'es_PY' && /^https:\/\//.test(tags.image), got.join(', '));
    await ctx.close();
  }

  await b.close();
  const bad = results.filter((r) => !r.ok);
  console.log(`\n${results.length - bad.length} of ${results.length} checks passed`);
  process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
