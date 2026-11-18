// Checks what the public site (index.html) does beyond drawing the screens, which the walks and parity.js cover:
// progress kept on the device (and kept right when lessons are put in, taken out or renamed, or two copies of the app
// are open), «Empezar de cero», the phone's Back (also with the browser's own Back, which skips entries a page adds
// without a tap), windows too short for the app and phones held sideways, a board that fails to load or to draw, a
// file missing from the site, a slow connection (also over HTTP/2, the boards one after another), no JavaScript, the
// iPhone's silent switch (simulated), the early sound file, the share tags, a few runtime details.
// Needs a server on the repository (BASE=http://127.0.0.1:8766/ by default). Usage: node tools/render/site-checks.js
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const http2 = require('http2');
const net = require('net');
const zlib = require('zlib');
const crypto = require('crypto');
const { execSync } = require('child_process');
const BASE = require('./url.js').BASE;
const SITE = BASE + 'index.html';
const ROOT = path.resolve(__dirname, '..', '..');
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: !!ok, detail }); console.log((ok ? 'ok   ' : 'FAIL ') + name + (detail ? ' — ' + detail : '')); };
const skip = (name, why) => console.log('skip ' + name + ' — ' + why);
const KEY = 'mborevi-rape';
const kept = (p, key) => p.evaluate((k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return 'unreadable'; } }, key || KEY);
/* what a kept record holds, whatever the grade and the lesson's name: each night's games, each big star's result */
const keptGames = (k) => (k && k.done ? Object.values(k.done).flatMap((g) => Object.values(g || {})) : []);
const keptStars = (k) => (k && k.checks ? Object.values(k.checks).flatMap((g) => Object.values(g || {})) : []);
/* tp-grades.js served with a change made to the lessons after it has run (js: a statement, window.__tpGrades in hand) */
const lessons = (js) => async (route) => {
  const r = await route.fetch();
  route.fulfill({ response: r, body: (await r.text()) + '\n;(function () {\n' + js + '\n})();\n' });
};

// the App board's state, read from React's tree under the page's frame
const APPSTATE = `(() => { const el = document.getElementById('frame'); const k = Object.keys(el).find((x) => x.startsWith('__reactContainer'));
  if (!k) return null; const top = el[k]; const stack = [top && top.stateNode && top.stateNode.current || top]; const seen = new Set();
  while (stack.length) { const n = stack.pop(); if (!n || seen.has(n)) continue; seen.add(n);
    const s = n.stateNode; if (s && s.state && typeof s.state.screen === 'string' && s.act) return s.state;
    if (n.child) stack.push(n.child); if (n.sibling) stack.push(n.sibling); }
  return null; })()`;
/* how many steps of each unit of 1.º grado the App shows as done */
const UNITS = `(() => { const C = window.tpCourse; const st = ${APPSTATE};
  return C.units('g1').map((u) => u.gn + ' ' + C.sessions('g1').filter((s) => s.unit === u.n && (s.kind === 'night' ? (st.done[s.id] || {}).ok : st.checks[s.id])).length).join(' | '); })()`;
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
/* unit 1's big star, its nights done, played to its end screen (from the path) */
async function playBigStar(p) {
  await p.evaluate(() => { const C = window.tpCourse; C.store(C.sample('g1', 'L2', 3)); });
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(800);
  await clickName(p, 'link', /¡Vamos!/);
  for (let i = 0; i < 40 && !(await p.getByText(/estrella grande brilla/).count()); i++) {
    const opts = p.locator('#frame [role="button"], #frame button').filter({ hasNotText: /Ehendu|Cerrar/ });
    const n = await opts.count();
    if (!n) break;
    await opts.nth(i % n).click().catch(() => {}); await p.waitForTimeout(500);
  }
}
/* tonight's first game (Meet), played to its end screen */
async function playMeet(p) {
  await clickName(p, 'link', /^Jaha!/);
  for (let i = 0; i < 12 && !(await p.getByRole('link', { name: /Al juego que sigue/ }).count()); i++) await clickName(p, 'button', /Upéi/);
}

/* A first visit over HTTP/2 on a slow line: our own server over TLS (gzip, ETag, max-age=600, as GitHub Pages serves),
   behind a relay below TLS that paces it at KBPS with 400 ms there and back, so the server's own HTTP/2 stack decides
   whose bytes go first. The certificate is made here (openssl) and trusted by its key alone. */
async function slowH2(b0) {
  const KBPS = 24, RATE = KBPS * 1000 / 8, HALF_RTT = 200, QUEUE = 32 * 1024;
  let dir;
  try {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-h2-'));
    execSync(`openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 2 -subj /CN=127.0.0.1 -addext subjectAltName=IP:127.0.0.1`, { cwd: dir, stdio: 'ignore' });
  } catch (e) { skip('a slow line over HTTP/2', 'openssl could not make a certificate'); return; }
  const cert = fs.readFileSync(path.join(dir, 'cert.pem')), key = fs.readFileSync(path.join(dir, 'key.pem'));
  const spki = crypto.createHash('sha256').update(new crypto.X509Certificate(cert).publicKey.export({ type: 'spki', format: 'der' })).digest('base64');
  const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2' };
  const gz = {};
  const server = http2.createSecureServer({ key, cert, allowHTTP1: false });
  server.on('stream', (stream, headers) => {
    stream.on('error', () => {});
    let p = decodeURIComponent(String(headers[':path']).split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT + path.sep)) { stream.respond({ ':status': 403 }); stream.end(); return; }
    fs.stat(file, (err, st) => {
      try {
        if (err || !st.isFile()) { stream.respond({ ':status': 404 }); stream.end('not found'); return; }
        const etag = '"' + st.size.toString(16) + '-' + Math.floor(st.mtimeMs).toString(16) + '"';
        const type = TYPES[path.extname(file)] || 'application/octet-stream';
        if (headers['if-none-match'] === etag) { stream.respond({ ':status': 304, etag, 'cache-control': 'max-age=600' }); stream.end(); return; }
        const text = /^(text|application\/(javascript|json|manifest))/.test(type);
        let body = fs.readFileSync(file);
        if (text) body = gz[file] || (gz[file] = zlib.gzipSync(body, { level: 9 }));
        const h = { ':status': 200, 'content-type': type, 'cache-control': 'max-age=600', etag, 'content-length': body.length };
        if (text) h['content-encoding'] = 'gzip';
        stream.respond(h);
        stream.end(body);
      } catch (e) {}
    });
  });
  const relay = net.createServer((phone) => {
    const up = net.connect(server.address().port, '127.0.0.1');
    phone.setNoDelay(true); up.setNoDelay(true);
    phone.on('data', (d) => setTimeout(() => { if (!up.destroyed) up.write(d); }, HALF_RTT));
    const q = []; let queued = 0, credit = 0, last = Date.now();
    up.on('data', (d) => { q.push(d); queued += d.length; if (queued > QUEUE) up.pause(); });
    const tick = setInterval(() => {
      const now = Date.now(); credit = Math.min(credit + RATE * (now - last) / 1000, 4096); last = now;
      while (q.length && credit >= 1) {
        const d = q[0], n = Math.min(d.length, Math.floor(credit)), piece = d.subarray(0, n);
        if (n === d.length) q.shift(); else q[0] = d.subarray(n);
        credit -= n; queued -= n;
        setTimeout(() => { if (!phone.destroyed) phone.write(piece); }, HALF_RTT);
      }
      if (queued <= QUEUE / 2 && up.isPaused()) up.resume();
    }, 10);
    const end = () => { clearInterval(tick); phone.destroy(); up.destroy(); };
    phone.on('error', end); up.on('error', end); phone.on('close', end); up.on('close', end);
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  await new Promise((ok) => relay.listen(0, '127.0.0.1', ok));
  const bh = await chromium.launch({ args: ['--ignore-certificate-errors-spki-list=' + spki] });
  try {
    const ctx = await bh.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    let cut = 0;
    p.on('requestfailed', (r) => { if (/\.dc\.html/.test(r.url())) cut++; });
    const t0 = Date.now();
    await p.goto('https://127.0.0.1:' + relay.address().port + '/index.html', { waitUntil: 'commit', timeout: 120000 });
    let t = '';
    for (let i = 0; i < 360 && !/Epáy|No se pudo/.test(t); i++) {
      await p.waitForTimeout(500);
      t = await p.evaluate(() => { const f = document.getElementById('frame'); return f ? f.innerText.replace(/\s+/g, ' ').slice(0, 110) : ''; }).catch(() => '');
    }
    const proto = await p.evaluate(() => (performance.getEntriesByType('navigation')[0] || {}).nextHopProtocol).catch(() => '?');
    check(`a slow line over HTTP/2 (${KBPS} kbit/s, the boards one after another): the app starts`, /Epáy/.test(t) && proto === 'h2',
      `${Math.round((Date.now() - t0) / 1000)} s, ${proto}, ${cut} board downloads cut off: ${t.slice(0, 60)}`);
    await ctx.close();
  } finally {
    await bh.close();
    server.close(); relay.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
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
    check('progress is written on the device, under the lesson\'s name', kept && kept.v === 2 && kept.grade === 'g1' && kept.track && keptGames(kept).length === 1 && kept.done.g1 && kept.done.g1['Maitei / Maitei'], JSON.stringify(kept).slice(0, 140));
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
    await run('from the big star\'s end: Shine, the path, then out', async (p) => { await toPath(p); await playBigStar(p); },
      ['Check', 'Shine', 'Main', 'left']);
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
    check('Back on a finished game: the star is kept', keptGames(k1).some((d) => d.meet), JSON.stringify(k1 && k1.done));
    /* the big star of unit 1, with its nights done */
    await playBigStar(p);
    await p.goBack(); await p.waitForTimeout(800);
    const k2 = await kept(p);
    const st = await p.evaluate(APPSTATE);
    check('Back on the finished big star: it lights, Shine shows it (as its close button does), and Mborevi\'i walks on', keptStars(k2).length === 1 && st && st.screen === 'Shine' && st.walk, JSON.stringify(k2 && k2.checks) + ' screen ' + (st && st.screen) + ' walk ' + JSON.stringify(st && st.walk));
    await p.goBack(); await p.waitForTimeout(800);
    const st2 = await p.evaluate(APPSTATE);
    check('…and Back on Shine goes to the path', st2 && st2.screen === 'Main', st2 && st2.screen);
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
    check('a change in the other copy keeps the game played here', k && k.voice === false && keptGames(k).some((d) => d.meet), JSON.stringify(k));
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
    check('the screen after a star breaks: the star is kept', /Algo no salió bien/.test(await screenText(p)) && keptGames(k).some((d) => d.meet), JSON.stringify(k && k.done));
    await ctx.close();
  }

  // 17. «Volver a empezar» draws the app again from what is loaded (offline too); Back after a failure leaves at once;
  //     a failure again while drawing anew offers to start from scratch, which sets what is kept aside (25 has more)
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
    const said = await screenText(p);
    await clickName(p, 'button', /Empezar de cero/);
    const k = await kept(p), aside = await kept(p, KEY + '-aside');
    check('the offer says the progress is set aside, not erased', /se guarda aparte/.test(said), said);
    check('«Empezar de cero» opens on the Moon, with the progress set aside', /Epáy/.test(await screenText(p)) && k && !k.grade && !keptGames(k).length && k.wipes === 1 && aside && aside.grade === 'g1', await screenText(p) + ' | kept ' + JSON.stringify(k) + ' | aside ' + JSON.stringify(aside).slice(0, 100));
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

  // 19. a phone held sideways in Chrome (its bars leave a window as short as 260 px) shows the whole screen: each button
  //     to go on is in the window without scrolling, and a note beside the app says to turn the phone; a short window
  //     on a computer scrolls, and each new screen starts at its top
  for (const [w, h, label] of [[800, 280, 'a 360-dp Android phone in Chrome'], [802, 293, 'Pixel 5'], [658, 320, 'Galaxy S9+']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true }); const p = await ctx.newPage();
    await p.goto(SITE, { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
    const steps = [['link', /Epáy/], ['link', /Jaha, vamos/], ['button', /^1\.º grado/], ['link', /Elegir 1\.º grado/], ['link', /¡Vamos!/],
      ['link', /A caminar/], ['link', /¡Vamos!/], ['link', /^Jaha!/], ['button', /Upéi/]];
    const cut = [];
    for (const [role, name] of steps) {
      const loc = p.getByRole(role, { name }).first();
      const r = await loc.boundingBox();
      if (!r || r.y < 0 || r.y + r.height > h + 0.5 || r.x < 0 || r.x + r.width > w + 0.5) cut.push(String(name) + ' ' + JSON.stringify(r && { y: Math.round(r.y), h: Math.round(r.height) }));
      await loc.click(); await p.waitForTimeout(700);
    }
    const turn = await p.evaluate(() => {
      const t = document.getElementById('turn'), r = t.getBoundingClientRect(), box = document.getElementById('box').getBoundingClientRect();
      return { shown: !t.hidden && r.width > 0, apart: r.left >= box.right, inside: r.right <= window.innerWidth && r.top >= 0 && r.bottom <= window.innerHeight, text: t.innerText };
    });
    check(`phone held sideways (${label}, ${w}x${h}): every button to go on is in the window`, !cut.length, cut.join(', '));
    check(`…and a note beside the app says to turn the phone`, turn.shown && turn.apart && turn.inside && /Girá el teléfono/.test(turn.text), JSON.stringify(turn));
    await ctx.close();
  }
  {
    /* upright, and on a tablet held sideways, no note */
    const notes = [];
    for (const vp of [{ width: 390, height: 844 }, { width: 1024, height: 700 }]) {
      const ctx = await b.newContext({ viewport: vp, isMobile: true, hasTouch: true }); const p = await ctx.newPage();
      await p.goto(SITE, { waitUntil: 'networkidle' }); await p.waitForTimeout(400);
      notes.push(await p.evaluate(() => !document.getElementById('turn').hidden));
      await ctx.close();
    }
    check('no note to turn the phone upright, nor on a tablet held sideways', notes.every((x) => !x), JSON.stringify(notes));
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
  {
    /* the window's outer size can read 0 while the page is still being read (about half of the loads, in Chromium): the
       first zoom made afterwards still enlarges the app */
    const ctx = await b.newContext({ viewport: { width: 1366, height: 657 } }); const p = await ctx.newPage();
    await p.addInitScript(() => {
      let reads = 0;
      Object.defineProperty(window, 'outerWidth', { get: () => (reads++ < 1 ? 0 : 1366), configurable: true });
      Object.defineProperty(window, 'outerHeight', { get: () => (reads < 2 ? 0 : 760), configurable: true });
    });
    await p.goto(SITE, { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
    const m = await p.evaluate(() => {
      const w0 = document.getElementById('box').getBoundingClientRect().width;
      const z = 1.5, iw = window.innerWidth / z, ih = window.innerHeight / z, r = window.devicePixelRatio * z;
      Object.defineProperty(window, 'innerWidth', { get: () => iw, configurable: true });
      Object.defineProperty(window, 'innerHeight', { get: () => ih, configurable: true });
      Object.defineProperty(window, 'devicePixelRatio', { get: () => r, configurable: true });
      window.dispatchEvent(new Event('resize'));
      return { before: w0, after: document.getElementById('box').getBoundingClientRect().width };
    });
    check('the zoom is kept even when the window\'s size read 0 at first', Math.abs(m.after * 1.5 / m.before - 1.5) < 0.02, JSON.stringify(m));
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

  // 22b. a first visit on a slow line over HTTP/2, as GitHub Pages serves: Chrome asks for the boards to come one after
  //      another, so the last ones get nothing for a long while though the line is busy; they are waited for, and the
  //      app starts (a server of our own, over TLS, behind a line paced at 24 kbit/s with 400 ms there and back)
  await slowH2(b);

  // 23. lessons changed after progress was kept: a unit taken out does not light the one that takes its place; a unit
  //     renamed is dark until window.__tpRenamed says so, then lit (its stars were kept meanwhile); two copies with
  //     different lessons open at once (a deploy that put a unit in) light only what was played
  {
    const ctx = await b.newContext(phone); const p = await ctx.newPage();
    await p.goto(SITE, { waitUntil: 'networkidle' });
    await p.evaluate(() => { const C = window.tpCourse; C.store(C.sample('g1', 'L2', C.sessions('g1').findIndex((s) => s.unit === 6))); });
    await p.route('**/project/tp-grades.js*', lessons('var u = window.__tpGrades.g1.units; u.splice(4, 1); u.forEach(function (x, i) { x.n = i + 1; });'));
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    const out = await p.evaluate(UNITS);
    check('a unit taken out: the unit after it is not lit in its place', out === "Maitei 4 | Che rogaygua 4 | Che rete 4 | Che mbo'ehao 4 | Papapy 0 | Achegety 0 | Ñande yvága 0", out);
    await p.unroute('**/project/tp-grades.js*');
    await p.route('**/project/tp-grades.js*', lessons("window.__tpGrades.g1.units[2].gn = 'Che retekuéra';"));
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    const dark = await p.evaluate(UNITS);
    await p.unroute('**/project/tp-grades.js*');
    await p.route('**/project/tp-grades.js*', lessons("window.__tpGrades.g1.units[2].gn = 'Che retekuéra'; window.__tpRenamed['g1:Che rete'] = 'g1:Che retekuéra';"));
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    const lit = await p.evaluate(UNITS);
    check('a unit renamed: dark until __tpRenamed says so, then lit again (and the unit taken out before is back too)', /Che retekuéra 0/.test(dark) && /Che retekuéra 4/.test(lit) && /Ikatúpa\? 4/.test(lit), dark + ' → ' + lit);
    await ctx.close();
  }
  {
    const ctx = await b.newContext(phone);
    const insert = "var u = window.__tpGrades.g1.units; u.splice(2, 0, { n: 0, gn: 'Ñañembosarái', es: 'Jugamos', nights: [{ gn: 'Ñañembosarái 1', es: 'Jugamos 1', words: u[0].nights[0].words }] }); u.forEach(function (x, i) { x.n = i + 1; });";
    const old = await ctx.newPage(); await toPath(old); /* the copy left open from before the deploy */
    const neu = await ctx.newPage();
    await neu.route('**/project/tp-grades.js*', lessons(insert));
    await neu.goto(SITE, { waitUntil: 'networkidle' }); await neu.waitForTimeout(600);
    await neu.evaluate(() => { const C = window.tpCourse; const st = C.sample('g1', 'L2', 0); st.done = { g1u03n1: { meet: 1 } }; C.store(st); });
    await old.waitForTimeout(600);
    await clickName(old, 'link', /Para grandes/); await clickName(old, 'button', /Voz sintética/); /* the old copy writes */
    const k = await kept(old);
    await neu.reload({ waitUntil: 'networkidle' }); await neu.waitForTimeout(800);
    const st = await neu.evaluate(APPSTATE);
    check('two copies with different lessons: each lights only what was played', st && st.done.g1u03n1 && !st.done.g1u04n1 && k && k.done.g1['Ñañembosarái / Ñañembosarái 1'] && !k.done.g1['Che rete / Akã ha tesa'], JSON.stringify(st && st.done) + ' | kept ' + JSON.stringify(k && k.done));
    await ctx.close();
  }

  // 24. a copy left open (an old tab on the Moon, next to the app on the home screen) does not put its own grade,
  //     language or voice back over the ones chosen in another copy
  {
    const ctx = await b.newContext(phone);
    const idle = await ctx.newPage(); await idle.goto(SITE, { waitUntil: 'networkidle' }); await idle.waitForTimeout(600);
    const a = await ctx.newPage(); await toPath(a);
    await clickName(a, 'link', /¡Vamos!/); await playMeet(a); await clickName(a, 'link', /Al juego que sigue/);
    await idle.waitForTimeout(600);
    const seen = await idle.evaluate(APPSTATE);
    let k = await kept(a);
    check('a copy left open on the Moon learns of the game, and does not undo the grade chosen in the other', k && k.grade === 'g1' && k.track && seen && Object.keys(seen.done || {}).length === 1, JSON.stringify(k));
    await a.goBack(); await a.waitForTimeout(800);
    await clickName(a, 'link', /Para grandes/); await clickName(a, 'button', /Voz sintética/);
    await idle.waitForTimeout(600);
    const third = await ctx.newPage(); await third.goto(SITE, { waitUntil: 'networkidle' }); await third.waitForTimeout(800);
    k = await kept(third);
    check('…and the next visit starts on the path, with the voice still off', /^1\.º grado/.test(await screenText(third)) && k && k.voice === false, (await screenText(third)) + ' | ' + JSON.stringify(k));
    await ctx.close();
  }

  // 25. «Empezar de cero»: a copy open at the time starts over too and puts nothing back; opened again with the same
  //     app, the progress stays aside; once the app has changed (a new version) it comes back
  {
    const ctx = await b.newContext(phone);
    const other = await ctx.newPage(); await toPath(other);
    await clickName(other, 'link', /¡Vamos!/); await playMeet(other); await clickName(other, 'link', /Al juego que sigue/);
    /* the pages from here on are served the same files (the path made to break while 'zz-break-main' is set), so that
       they are the same version of the app; only the last one is served a new version */
    const broken = breaking("localStorage.getItem('zz-break-main') && this.props.app && this.props.app.gradeSet");
    const p = await ctx.newPage();
    await p.route('**/project/Main.dc.html*', broken);
    await p.goto(SITE, { waitUntil: 'networkidle' });
    await p.evaluate(() => localStorage.setItem('zz-break-main', '1'));
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    await clickName(p, 'button', /Volver a empezar/);
    await clickName(p, 'button', /Empezar de cero/);
    await other.waitForTimeout(800);
    const o = await other.evaluate(APPSTATE);
    check('a copy open at the time of «Empezar de cero» starts over too', o && o.screen === 'Welcome' && !Object.keys(o.done || {}).length, o && o.screen);
    await clickName(other, 'link', /Epáy/);
    const k = await kept(p), aside = await kept(p, KEY + '-aside');
    check('…and puts nothing of before back', k && !keptGames(k).length && !k.grade && keptGames(aside).some((d) => d.meet), JSON.stringify(k) + ' | aside ' + JSON.stringify(aside).slice(0, 120));
    await p.evaluate(() => localStorage.removeItem('zz-break-main'));
    const same = await ctx.newPage(); await same.route('**/project/Main.dc.html*', broken);
    await same.goto(SITE, { waitUntil: 'networkidle' }); await same.waitForTimeout(800);
    const s1 = await same.evaluate(APPSTATE);
    check('opened again with the same app: the progress stays aside', s1 && s1.screen === 'Welcome' && !Object.keys(s1.done || {}).length && (await kept(same, KEY + '-aside')), s1 && s1.screen);
    const next = await ctx.newPage(); await next.route('**/project/Main.dc.html*', broken);
    await next.route('**/project/tp-sky.js*', async (route) => { const r = await route.fetch(); route.fulfill({ response: r, body: (await r.text()) + '\n/* a new version */\n' }); });
    await next.goto(SITE, { waitUntil: 'networkidle' }); await next.waitForTimeout(800);
    const s2 = await next.evaluate(APPSTATE);
    check('once the app has changed, the progress comes back: on the path, the game played', s2 && s2.screen === 'Main' && Object.keys(s2.done || {}).length === 1 && !(await kept(next, KEY + '-aside')), (s2 && s2.screen) + ' ' + JSON.stringify(s2 && s2.done));
    await ctx.close();
  }

  // 26. history after a failure: reloaded in a game, a path that fails at start lets Back leave at once (the entries
  //     above the page's own are taken back before the app starts); a game that breaks, then «Volver a empezar» and
  //     «¡Vamos!» straight away: tonight still gets its own entry, so Back goes to the path
  {
    const ctx = await b.newContext(phone); const p = await ctx.newPage();
    await p.route('**/project/Main.dc.html*', breaking("localStorage.getItem('zz-break-main') && this.props.app && this.props.app.gradeSet"));
    await p.goto('about:blank');
    await toPath(p); await clickName(p, 'link', /¡Vamos!/); await clickName(p, 'link', /^Jaha!/);
    const deep = await p.evaluate(() => history.state && history.state.tpDepth);
    await p.evaluate(() => localStorage.setItem('zz-break-main', '1'));
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(1000);
    const t = await screenText(p);
    const d = await p.evaluate(() => history.state && history.state.tpDepth);
    await p.goBack(); await p.waitForTimeout(900);
    check('reloaded in a game, the path fails at start: Back leaves at once', deep === 2 && /Algo no salió bien/.test(t) && !d && p.url() === 'about:blank', `depth ${deep} → ${d}; ${t.slice(0, 30)}; then ${p.url()}`);
    await ctx.close();
  }
  {
    const ctx = await b.newContext(phone); const p = await ctx.newPage();
    await p.route('**/project/Meet.dc.html*', breaking('window.__boom'));
    await toPath(p); await clickName(p, 'link', /¡Vamos!/);
    await p.evaluate(() => { window.__boom = true; });
    await p.getByRole('link', { name: /^Jaha!/ }).first().click(); await p.waitForTimeout(250);
    await p.evaluate(() => { window.__boom = false; });
    await p.getByRole('button', { name: /Volver a empezar/ }).click(); await p.waitForTimeout(250);
    await p.getByRole('link', { name: /¡Vamos!/ }).first().click(); await p.waitForTimeout(900);
    const st = await p.evaluate('({ d: history.state && history.state.tpDepth, s: (' + APPSTATE + ' || {}).screen })');
    await p.goBack(); await p.waitForTimeout(900);
    const back = await p.evaluate(APPSTATE);
    check('a game breaks, then «Volver a empezar» and «¡Vamos!» at once: Back from tonight goes to the path', st.d === 1 && st.s === 'Tonight' && back && back.screen === 'Main', JSON.stringify(st) + ' then ' + (back && back.screen));
    await ctx.close();
  }

  // 27. a double tap on a game's last button: the second tap does not also answer the next screen's button, which sits
  //     in the same place
  {
    const ctx = await b.newContext(phone); const p = await ctx.newPage();
    await toPath(p); await clickName(p, 'link', /¡Vamos!/); await playMeet(p);
    const r = await p.getByRole('link', { name: /Al juego que sigue/ }).first().boundingBox();
    const x = r.x + r.width / 2, y = r.y + r.height / 2;
    await p.touchscreen.tap(x, y); await p.waitForTimeout(120); await p.touchscreen.tap(x, y); await p.waitForTimeout(900);
    const st = await p.evaluate(APPSTATE);
    const under = await p.evaluate(([x, y]) => { const el = document.elementFromPoint(x, y); const a = el && el.closest('a'); return a ? a.innerText.replace(/\s+/g, ' ') : null; }, [x, y]);
    check('a double tap on «Al juego que sigue» stops on tonight\'s games (whose own button is under the same spot)', st && st.screen === 'Tonight' && !!under, (st && st.screen) + ' | under the tap: ' + under);
    await ctx.close();
  }

  // 28. a file the site does not have (a deploy that left it out) is the site's fault: «Probá de nuevo en un rato»,
  //     not «Revisá la conexión»
  for (const f of ['project/tp-sky.js', 'runtime/dc.js']) {
    const ctx = await b.newContext(phone); const p = await ctx.newPage();
    await p.route('**/' + f + '*', (r) => r.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' }));
    await p.goto(SITE);
    let t = '';
    for (let i = 0; i < 60 && !/No se pudo|Epáy/.test(t); i++) { await p.waitForTimeout(250); t = await screenText(p).catch(() => ''); }
    check(`${f} missing from the site: not sent to check the connection`, /No se pudo abrir la app/.test(t) && !/conexión/.test(t), t);
    await ctx.close();
  }

  await b.close();
  const bad = results.filter((r) => !r.ok);
  console.log(`\n${results.length - bad.length} of ${results.length} checks passed`);
  process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
