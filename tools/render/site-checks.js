// Checks what the public site (index.html) does beyond drawing the screens, which the walks and parity.js cover:
// progress kept on the device (and kept right when the lessons are renumbered or two copies of the app are open), the
// phone's Back (also with the browser's own Back, which skips entries a page adds without a tap), windows too short
// for the app and phones held sideways, a board that fails to load or to draw, a slow connection, no JavaScript, the
// iPhone's silent switch (simulated), the early sound file, the share tags, a few runtime details.
// Needs a server on the repository (BASE=http://127.0.0.1:8766/ by default). Usage: node tools/render/site-checks.js
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');
const BASE = require('./url.js').BASE;
const SITE = BASE + 'index.html';
const ROOT = path.resolve(__dirname, '..', '..');
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: !!ok, detail }); console.log((ok ? 'ok   ' : 'FAIL ') + name + (detail ? ' — ' + detail : '')); };
const skip = (name, why) => console.log('skip ' + name + ' — ' + why);
const KEY = 'mborevi-rape';
const kept = (p) => p.evaluate((k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return 'unreadable'; } }, KEY);
// the App board's state, read from React's tree under the page's frame
const APPSTATE = `(() => { const el = document.getElementById('frame'); const k = Object.keys(el).find((x) => x.startsWith('__reactContainer'));
  if (!k) return null; const top = el[k]; const stack = [top && top.stateNode && top.stateNode.current || top]; const seen = new Set();
  while (stack.length) { const n = stack.pop(); if (!n || seen.has(n)) continue; seen.add(n);
    const s = n.stateNode; if (s && s.state && typeof s.state.screen === 'string' && s.act) return s.state;
    if (n.child) stack.push(n.child); if (n.sibling) stack.push(n.sibling); }
  return null; })()`;
// a board served with its logic made to throw while drawing whenever the condition holds (a page expression)
const breaking = (cond) => async (route) => {
  const r = await route.fetch(); let body = await r.text();
  body = body.replace(/(<script type="text\/x-dc"[^>]*>)([\s\S]*?)(<\/script>)/, (m, a, src, c) => a + src +
    '\nComponent.prototype.__rv = Component.prototype.renderVals;\nComponent.prototype.renderVals = function () { if (' + cond + ') throw new Error("test: breaks"); return this.__rv(); };\n' + c);
  route.fulfill({ response: r, body });
};

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
/* tonight's first game (Meet), played to its end screen */
async function playMeet(p) {
  await clickName(p, 'link', /^Jaha!/);
  for (let i = 0; i < 12 && !(await p.getByRole('link', { name: /Al juego que sigue/ }).count()); i++) await clickName(p, 'button', /Upéi/);
}

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
    check('a board that fails to load: the page offers to try again, and says to check the connection', /No se pudo abrir la app/.test(t) && /conexión/.test(t) && (await p.getByRole('button', { name: 'Probar de nuevo' }).count()) === 1, `tries ${tries}: ${t}`);
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
      Object.defineProperty(Navigator.prototype, 'platform', { get: () => 'iPhone', configurable: true });
      window.__plays = [];
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () { window.__plays.push({ src: String(this.src).slice(0, 40), len: String(this.src).length, loop: this.loop }); return play.call(this); };
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
    check('the first tap makes the audio output though the lines are not here yet', info.contexts >= 1, JSON.stringify(info));
    check('no clip can play yet: the phone is not switched to media playback (a parent\'s music goes on)', !info.plays.length, JSON.stringify(info));
    check('Mborevi\'i\'s lines are asked for before the first screen shows', uiAt > 0 && uiAt < welcomeAt, `ui file asked at ${uiAt} ms, App at ${appAt} ms, Welcome at ${welcomeAt} ms`);
    release(); await p.waitForTimeout(1500);
    /* the next tap that wants sound (every listen button calls unlock(); Playwright's evaluate counts as a tap) */
    await p.evaluate(() => window.tpSound.unlock());
    const info2 = await p.evaluate(() => ({ plays: window.__plays }));
    check('older iPhone (any iOS without audioSession): a looping silent <audio> starts with a tap once a clip can play', info2.plays.some((x) => x.loop && /^data:audio\/wav/.test(x.src)), JSON.stringify(info2.plays));
    check('the silent clip is a quarter of a second, not a few samples', info2.plays.some((x) => x.loop && x.len > 10000), info2.plays.map((x) => x.len).join(', ') + ' characters');
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

  // 10. loading: the runtime is revalidated before it runs; each engine script is revalidated once, however many
  //     boards list it
  {
    const ctx = await b.newContext(phone); const p = await ctx.newPage();
    const seen = [];
    p.on('request', (r) => { const u = r.url(); if (/runtime\/dc\.js|project\/tp-course\.js/.test(u)) seen.push(r.resourceType() + ' ' + u.replace(BASE, '')); });
    await p.goto(SITE, { waitUntil: 'networkidle' }); await p.waitForSelector('text=Epáy');
    const dc = seen.filter((x) => /dc\.js/.test(x)), course = seen.filter((x) => /tp-course/.test(x) && /^fetch/.test(x));
    check('the runtime is revalidated, then run', dc.length === 2 && /^fetch/.test(dc[0]) && /^script/.test(dc[1]), dc.join(', '));
    check('the engine is revalidated once for all the boards that list it', course.length === 1, seen.join(', '));
    await ctx.close();
  }

  // 11. runtime details on a test board: inert follows its hole, an option keeps its value, a relative url() in a
  //     board's style points next to the board
  {
    const ctx = await b.newContext(); const p = await ctx.newPage();
    const board = `<!doctype html><html><head><meta charset="utf-8"><style>.bg{background-image:url(pics/a.png)}</style></head><body><x-dc>
<div id="off" inert="{{ no }}"><button>a</button></div><div id="on" inert="{{ yes }}"><button>b</button></div><div id="bare" inert><button>c</button></div>
<select id="sel"><option value="1">one</option><option value="2" selected>two</option></select>
<div id="inl" style="background-image: url(pics/b.png); width: 4px; height: 4px"></div><div id="cls" class="bg"></div>
</x-dc><script type="text/x-dc" data-dc-script>class Component extends DCLogic { renderVals() { return { no: false, yes: true }; } }</script></body></html>`;
    await p.route('**/project/ZzTest.dc.html*', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: board }));
    await p.goto(BASE + 'runtime/board.html?b=ZzTest.dc.html'); await p.waitForSelector('body[data-ready], body[data-error]');
    const m = await p.evaluate(() => ({
      off: document.getElementById('off').hasAttribute('inert'), on: document.getElementById('on').hasAttribute('inert'), bare: document.getElementById('bare').hasAttribute('inert'),
      sel: document.getElementById('sel').value,
      inl: getComputedStyle(document.getElementById('inl')).backgroundImage, cls: getComputedStyle(document.getElementById('cls')).backgroundImage }));
    check('inert="{{ false }}" is not inert, "{{ true }}" and a bare inert are', !m.off && m.on && m.bare, JSON.stringify(m));
    check('an option keeps its value', m.sel === '2', m.sel);
    check('a relative url() in a board\'s style points next to the board', /\/project\/pics\/b\.png/.test(m.inl) && /\/project\/pics\/a\.png/.test(m.cls), m.inl + ' | ' + m.cls);
    await ctx.close();
  }

  // 12. the browser's own Back (the toolbar's and Android's, through a test extension): Chrome skips a history entry
  //     a page added without a tap, which Playwright's goBack does not; Backs in a row must still walk the screens
  {
    const ext = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-back-ext-'));
    fs.writeFileSync(path.join(ext, 'manifest.json'), JSON.stringify({ manifest_version: 3, name: 'site-checks back', version: '1', background: { service_worker: 'bg.js' }, permissions: ['tabs'] }));
    fs.writeFileSync(path.join(ext, 'bg.js'), "self.uiBack = async () => { const [t] = await chrome.tabs.query({ active: true }); try { await chrome.tabs.goBack(t.id); return 'ok'; } catch (e) { return 'refused: ' + e.message; } };");
    const run = async (label, setup, want) => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-back-prof-'));
      const ctx = await chromium.launchPersistentContext(dir, { channel: 'chromium', headless: true, viewport: { width: 390, height: 844 },
        args: ['--disable-extensions-except=' + ext, '--load-extension=' + ext] });
      try {
        let [sw] = ctx.serviceWorkers();
        if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 15000 });
        const p = ctx.pages()[0] || await ctx.newPage();
        const cdp = await ctx.newCDPSession(p);
        /* read without a user gesture, so that nothing but the taps counts as one */
        const where = async () => {
          if (!p.url().startsWith(SITE)) return 'left';
          const r = await cdp.send('Runtime.evaluate', { expression: APPSTATE + '.screen', userGesture: false, returnByValue: true });
          return r.result.value;
        };
        await p.goto(BASE + 'README.md');
        await setup(p);
        const seen = [await where()];
        for (let i = 0; i < want.length - 1 && seen[seen.length - 1] !== 'left'; i++) {
          await sw.evaluate(() => self.uiBack()); await p.waitForTimeout(900);
          seen.push(await where());
        }
        check('the browser\'s own Back, ' + label, seen.join(' → ') === want.join(' → '), seen.join(' → '));
      } finally { await ctx.close(); fs.rmSync(dir, { recursive: true, force: true }); }
    };
    await run('from a game: tonight, the path, then out', async (p) => { await toPath(p); await clickName(p, 'link', /¡Vamos!/); await clickName(p, 'link', /^Jaha!/); },
      ['Meet', 'Tonight', 'Main', 'left']);
    await run('from the start: each screen back to the Moon, then out', async (p) => {
      await p.goto(SITE, { waitUntil: 'networkidle' });
      await clickName(p, 'link', /Epáy/); await p.waitForTimeout(500); await clickName(p, 'link', /Jaha, vamos/);
      await clickName(p, 'button', /^1\.º grado/); await clickName(p, 'link', /Elegir 1\.º grado/);
      await clickName(p, 'link', /¡Vamos!/);
    }, ['Ready', 'Home', 'Grade', 'Welcome', 'left']);
    fs.rmSync(ext, { recursive: true, force: true });
  }

  // 13. Back on a game's or the big star's end screen keeps the star, as the screen's own close button does
  {
    const ctx = await b.newContext(phone); const p = await ctx.newPage();
    await toPath(p);
    await clickName(p, 'link', /¡Vamos!/);
    await playMeet(p);
    await p.goBack(); await p.waitForTimeout(800);
    const k1 = await kept(p);
    check('Back on a finished game: the star is kept', k1 && k1.done && Object.values(k1.done).some((d) => d.meet), JSON.stringify(k1 && k1.done));
    /* the big star of unit 1, with its nights done */
    await p.evaluate((k) => { const C = window.tpCourse; const st = C.sample('g1', 'L2', 3); localStorage.setItem(k, JSON.stringify({ v: 1, started: true, grade: 'g1', track: 'L2', done: st.done, checks: {} })); }, KEY);
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    await clickName(p, 'link', /¡Vamos!/);
    for (let i = 0; i < 40 && !(await p.getByText(/estrella grande brilla/).count()); i++) {
      const opts = p.locator('#frame [role="button"], #frame button').filter({ hasNotText: /Ehendu|Cerrar/ });
      const n = await opts.count();
      if (!n) break;
      await opts.nth(i % n).click().catch(() => {}); await p.waitForTimeout(500);
    }
    await p.goBack(); await p.waitForTimeout(800);
    const k2 = await kept(p);
    const st = await p.evaluate(APPSTATE);
    check('Back on the finished big star: it stays lit, and Mborevi\'i walks on', k2 && Object.keys(k2.checks || {}).length === 1 && st && st.walk, JSON.stringify(k2 && k2.checks) + ' walk ' + JSON.stringify(st && st.walk));
    await ctx.close();
  }

  // 14. progress kept before a unit was put in the middle of a grade keeps its stars on the same lessons
  {
    let old = null;
    try { old = execSync('git show cd96199~1:project/tp-grades.js', { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) {}
    if (!old) skip('progress across renumbered lessons', 'no git history here');
    else {
      const ctx = await b.newContext(phone); const p = await ctx.newPage();
      await p.route('**/project/tp-grades.js*', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: old }));
      await p.goto(SITE, { waitUntil: 'networkidle' });
      await p.evaluate(() => { const C = window.tpCourse; C.store(C.sample('g1', 'L2', C.sessions('g1').findIndex((s) => s.unit === 7))); });
      await p.unroute('**/project/tp-grades.js*');
      await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(800);
      const units = await p.evaluate((expr) => {
        const C = window.tpCourse; const st = eval(expr);
        return C.units('g1').map((u) => u.gn + ' ' + C.sessions('g1').filter((s) => s.unit === u.n && (s.kind === 'night' ? (st.done[s.id] || {}).ok : st.checks[s.id])).length);
      }, APPSTATE);
      check('lessons renumbered: the stars stay on their lessons (Papapy, Achegety), the new unit is not lit', units.join(' | ') === "Maitei 4 | Che rogaygua 4 | Che rete 4 | Che mbo'ehao 4 | Ikatúpa? 0 | Papapy 4 | Achegety 4 | Ñande yvága 0", units.join(' | '));
      await ctx.close();
    }
  }

  // 15. two copies of the app (an old tab, the home-screen app): one does not wipe what the other kept
  {
    const ctx = await b.newContext(phone);
    const a = await ctx.newPage(); await toPath(a);
    const c = await ctx.newPage(); await c.goto(SITE, { waitUntil: 'networkidle' }); await c.waitForTimeout(600);
    await clickName(c, 'link', /¡Vamos!/); await playMeet(c); await clickName(c, 'link', /Al juego que sigue/);
    await a.waitForTimeout(500);
    const seen = await a.evaluate(APPSTATE);
    check('the other copy learns of the game at once', seen && Object.values(seen.done || {}).some((d) => d.meet), JSON.stringify(seen && seen.done));
    await clickName(a, 'link', /Para grandes/); await clickName(a, 'button', /Voz sintética/);
    const k = await kept(a);
    check('a change in the other copy keeps the game played here', k && k.voice === false && Object.values(k.done || {}).some((d) => d.meet), JSON.stringify(k));
    await ctx.close();
  }

  // 16. a star is kept even when the screen after it fails to draw
  {
    const ctx = await b.newContext(phone); const p = await ctx.newPage();
    await p.route('**/project/Tonight.dc.html*', breaking('window.__boom'));
    await toPath(p);
    await clickName(p, 'link', /¡Vamos!/); await playMeet(p);
    await p.evaluate(() => { window.__boom = true; });
    await clickName(p, 'link', /Al juego que sigue/);
    const k = await kept(p);
    check('the screen after a star breaks: the star is kept', /Algo no salió bien/.test(await screenText(p)) && k && Object.values(k.done || {}).some((d) => d.meet), JSON.stringify(k && k.done));
    await ctx.close();
  }

  // 17. «Volver a empezar» draws the app again from what is loaded (offline too); Back after a failure leaves at once;
  //     a failure again while drawing anew offers to start from scratch, which wipes what is kept
  {
    const ctx = await b.newContext(phone); const p = await ctx.newPage();
    await p.route('**/project/Meet.dc.html*', breaking('window.__boom'));
    await p.goto('about:blank');
    await toPath(p);
    await clickName(p, 'link', /¡Vamos!/);
    await ctx.setOffline(true);
    await p.evaluate(() => { window.__boom = true; });
    await clickName(p, 'link', /^Jaha!/);
    const url = p.url();
    await clickName(p, 'button', /Volver a empezar/);
    const t = await screenText(p);
    check('offline, «Volver a empezar» brings the path back without the network', p.url() === url && /^1\.º grado/.test(t), p.url() + ' | ' + t);
    await clickName(p, 'link', /¡Vamos!/); await clickName(p, 'link', /^Jaha!/);
    check('a game that fails once more: no offer to wipe the progress (it was not the redraw that failed)', (await p.getByRole('button', { name: 'Empezar de cero' }).count()) === 0, await screenText(p));
    await ctx.setOffline(false);
    await p.goBack(); await p.waitForTimeout(900);
    check('Back on «Algo no salió bien» leaves at once', p.url() === 'about:blank', p.url());
    await ctx.close();
  }
  {
    const ctx = await b.newContext(phone); const p = await ctx.newPage();
    await p.route('**/project/Main.dc.html*', breaking("localStorage.getItem('zz-break-main') && this.props.app && this.props.app.gradeSet"));
    await toPath(p);
    await p.evaluate(() => localStorage.setItem('zz-break-main', '1'));
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    const first = await p.getByRole('button').allInnerTexts();
    await clickName(p, 'button', /Volver a empezar/);
    const again = await p.getByRole('button').allInnerTexts();
    check('the path breaks on what is kept: after one try, «Empezar de cero» is offered', first.join('|') === 'Volver a empezar' && again.includes('Empezar de cero'), first.join('|') + ' then ' + again.join('|'));
    await clickName(p, 'button', /Empezar de cero/);
    const k = await kept(p);
    check('«Empezar de cero» wipes the kept progress and opens on the Moon', /Epáy/.test(await screenText(p)) && (!k || !k.grade), await screenText(p) + ' | kept ' + JSON.stringify(k));
    await ctx.close();
  }

  // 18. a board with a mistake in its code: the page does not send the visitor to check the connection
  {
    const ctx = await b.newContext(phone); const p = await ctx.newPage();
    await p.route('**/project/Letters.dc.html*', async (route) => {
      const r = await route.fetch(); const body = (await r.text()).replace(/(<script type="text\/x-dc"[^>]*>)/, '$1\nconst = ;\n');
      route.fulfill({ response: r, body });
    });
    await p.goto(SITE); await p.waitForTimeout(3000);
    const t = await screenText(p);
    check('a code error: «No se pudo abrir la app», not «Revisá la conexión»', /No se pudo abrir la app/.test(t) && !/conexión/.test(t), t);
    await ctx.close();
  }

  // 19. a phone held sideways shows the whole first screen; a short window on a computer scrolls, and each new screen
  //     starts at its top
  {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage();
    await p.goto(SITE, { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
    const r = await p.getByRole('link', { name: /Epáy/ }).first().boundingBox();
    check('phone held sideways: the first button is on screen without scrolling', r && r.y >= 0 && r.y + r.height <= 390, JSON.stringify(r));
    await ctx.close();
  }
  {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 } }); const p = await ctx.newPage();
    await p.goto(SITE, { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
    await clickName(p, 'link', /Epáy/); await p.waitForTimeout(400);
    await clickName(p, 'link', /Jaha, vamos/);
    const m = await p.evaluate(() => ({ y: window.scrollY, h1: (document.querySelector('#frame h1') || {}).innerText }));
    check('short window: the next screen starts at its top', m.y === 0 && /grado/.test(m.h1 || ''), JSON.stringify(m));
    await ctx.close();
  }

  // 20. a long press on a button opens no link menu; the browser's zoom made during a visit enlarges the app
  {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 657 } }); const p = await ctx.newPage();
    await p.goto(SITE, { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
    const prevented = await p.evaluate(() => {
      const a = document.querySelector('#frame a[href]');
      const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
      a.dispatchEvent(e);
      return e.defaultPrevented;
    });
    check('a long press on a button opens no link menu (Android)', prevented);
    const m = await p.evaluate(() => {
      const w0 = document.getElementById('box').getBoundingClientRect().width;
      /* Ctrl + to 150%: the window keeps its size, its CSS pixels shrink, the device pixel ratio grows */
      const z = 1.5, iw = window.innerWidth / z, ih = window.innerHeight / z, r = window.devicePixelRatio * z;
      Object.defineProperty(window, 'innerWidth', { get: () => iw, configurable: true });
      Object.defineProperty(window, 'innerHeight', { get: () => ih, configurable: true });
      Object.defineProperty(window, 'devicePixelRatio', { get: () => r, configurable: true });
      window.dispatchEvent(new Event('resize'));
      return { before: w0, after: document.getElementById('box').getBoundingClientRect().width };
    });
    check('the browser\'s zoom enlarges the app (the page scrolls)', Math.abs(m.after * 1.5 / m.before - 1.5) < 0.02, JSON.stringify(m));
    await ctx.close();
  }

  // 21. sound: nothing starts while the page is put aside; with the voice off, the phone is not switched to media
  //     playback; an audio session the page may not set falls back to the silent <audio>; a board on its own is silent
  {
    const ctx = await b.newContext(phone); const p = await ctx.newPage();
    await p.addInitScript(() => {
      window.__contexts = 0;
      const AC = window.AudioContext;
      window.AudioContext = class extends AC { constructor(o) { super(o); window.__contexts++; } };
    });
    await p.goto(SITE, { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    await clickName(p, 'link', /Epáy/);
    const n = await p.evaluate(() => {
      const before = window.__contexts;
      Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
      window.tpCourse.say(window.tpCourse.VOICE.star);
      return { before, after: window.__contexts, any: window.tpSound.any() };
    });
    check('a line due after the page is put aside starts no sound', n.before >= 1 && n.after === n.before && n.any, JSON.stringify(n));
    await ctx.close();
  }
  {
    const ctx = await b.newContext(phone); const p = await ctx.newPage();
    await p.addInitScript((k) => { navigator.audioSession = { type: 'auto' }; localStorage.setItem(k, JSON.stringify({ v: 1, voice: false, done: {}, checks: {} })); }, KEY);
    await p.goto(SITE, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
    await clickName(p, 'link', /Epáy/);
    check('voice off: a tap leaves the audio session as it was', (await p.evaluate(() => navigator.audioSession.type)) === 'auto');
    await ctx.close();
  }
  {
    const ctx = await b.newContext(phone); const p = await ctx.newPage();
    await p.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, 'platform', { get: () => 'iPhone', configurable: true });
      navigator.audioSession = { get type() { return 'auto'; }, set type(v) {} };
      window.__plays = 0;
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () { if (this.loop) window.__plays++; return play.call(this); };
    });
    await p.goto(SITE, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
    await clickName(p, 'link', /Epáy/);
    check('an audio session the page may not set (a frame): the silent <audio> plays instead', (await p.evaluate(() => window.__plays)) >= 1);
    await ctx.close();
  }
  {
    const ctx = await b.newContext(); const p = await ctx.newPage();
    await p.addInitScript(() => { window.__contexts = 0; const AC = window.AudioContext; window.AudioContext = class extends AC { constructor(o) { super(o); window.__contexts++; } }; });
    await p.goto(BASE + 'runtime/board.html?b=Shine.dc.html'); await p.waitForSelector('body[data-ready], body[data-error]'); await p.waitForTimeout(500);
    check('the big star\'s cheer on its own (the canvas) makes no sound', (await p.evaluate(() => window.__contexts)) === 0);
    await ctx.close();
  }
  {
    /* Mborevi'i's lines are asked for when the engine runs, not when the whole app has loaded: with one board late, the
       request still goes out long before the first screen */
    const ctx = await b.newContext(phone); const p = await ctx.newPage();
    let uiAt = 0; const t0 = Date.now();
    p.on('request', (r) => { if (/tp-sound-ui\.js/.test(r.url()) && !uiAt) uiAt = Date.now() - t0; });
    await p.route('**/project/Sky.dc.html*', async (route) => { await new Promise((ok) => setTimeout(ok, 3000)); route.continue(); });
    await p.goto(SITE); await p.waitForSelector('text=Epáy', { timeout: 20000 });
    const shown = Date.now() - t0;
    check('the lines are asked for before the app has loaded (a late board does not hold them back)', uiAt > 0 && uiAt < 2500 && shown >= 3000, `asked at ${uiAt} ms, first screen at ${shown} ms`);
    await ctx.close();
  }

  // 22. a board that comes slowly but steadily (a throttled prepaid line) is waited for: only a stall gives up
  {
    const srv = http.createServer(async (req, res) => {
      try {
        const r = await fetch(BASE + req.url.slice(1));
        const buf = Buffer.from(await r.arrayBuffer());
        res.writeHead(r.status, { 'content-type': r.headers.get('content-type') || 'application/octet-stream', 'cache-control': 'no-store' });
        if (/Story\.dc\.html/.test(req.url)) {
          const n = 10, size = Math.ceil(buf.length / n);
          for (let i = 0; i < n; i++) { res.write(buf.subarray(i * size, (i + 1) * size)); await new Promise((ok) => setTimeout(ok, 2000)); }
          res.end();
        } else res.end(buf);
      } catch (e) { res.writeHead(502); res.end(); }
    });
    await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
    const ctx = await b.newContext(phone); const p = await ctx.newPage();
    await p.goto('http://127.0.0.1:' + srv.address().port + '/index.html');
    let t = '';
    for (let i = 0; i < 70 && !/Epáy|No se pudo/.test(t); i++) { await p.waitForTimeout(500); t = await screenText(p).catch(() => ''); }
    check('a board that takes 20 s to come, steadily, is waited for', /Epáy/.test(t), t);
    await ctx.close();
    srv.close();
  }

  await b.close();
  const bad = results.filter((r) => !r.ok);
  console.log(`\n${results.length - bad.length} of ${results.length} checks passed`);
  process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
