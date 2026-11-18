// Makes the public site's icons and share image from the boards, so they follow the drawings: the icons are the Icon
// board's drawing (site/icon-*.png), the share image is the Welcome screen beside the app's name (site/og.png).
// Needs a server on the repository, as the other render tools do; BASE=http://127.0.0.1:8766/ by default.
// Usage: node tools/render/site-images.js     (then: python3 tools/render/site_icons.py, which rounds and sizes the icons)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const BASE = process.env.BASE || 'http://127.0.0.1:8766/';
const OUT = path.join(ROOT, 'render', 'site');

const OG = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="../runtime/fonts/fonts.css">
<style>
  html, body { margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; position: relative; color: #FFF7EC;
    background: linear-gradient(160deg, #2A1B7A 0%, #1B1255 55%, #110A38 100%); font-family: 'Nunito', sans-serif; }
  .dot { position: absolute; border-radius: 50%; background: #FFF6DD; }
  .text { position: absolute; left: 72px; top: 92px; width: 700px; }
  h1 { margin: 0; font: 800 112px/1 'Baloo 2', 'Nunito', sans-serif; letter-spacing: -1px; }
  .sub { margin: 14px 0 0; font: 800 44px/1.1 'Nunito', sans-serif; color: #FFD34E; }
  .lead { margin: 30px 0 0; font: 700 27px/1.4 'Nunito', sans-serif; color: #E6DEFF; max-width: 640px; }
  .chips { margin: 30px 0 0; display: flex; gap: 12px; }
  .chips span { padding: 8px 18px; border-radius: 999px; background: #FFF7EC; color: #2A1B3D; border: 3px solid #3B2418;
    font: 800 22px/1.2 'Nunito', sans-serif; }
  .phone { position: absolute; right: 80px; top: 26px; width: 266px; height: 576px; border-radius: 40px; overflow: hidden;
    border: 6px solid #3B2418; box-shadow: 0 10px 0 #3B2418; background: #110A38; }
  #welcome { width: 390px; height: 844px; transform: scale(0.682); transform-origin: 0 0; }
</style>
<script src="../runtime/vendor/react.production.min.js"></script>
<script src="../runtime/vendor/react-dom.production.min.js"></script>
<script src="../runtime/dc.js"></script>
</head>
<body>
<div class="text">
<h1>Mborevi Rape</h1>
<p class="sub">guaraní para chicos</p>
<p class="lead">Mborevi'i, un tapir bebé, camina por la Vía Láctea de lección en lección, con los grados del MEC del Paraguay.</p>
<div class="chips"><span>Preescolar</span><span>1.º grado</span><span>2.º grado</span></div>
</div>
<div class="phone"><div id="welcome"></div></div>
<script>
  [[40, 40, 3], [210, 24, 2], [380, 60, 3], [560, 30, 2], [700, 70, 3], [820, 36, 2], [130, 560, 2], [330, 590, 3],
   [520, 570, 2], [690, 600, 3], [40, 330, 2], [760, 300, 2], [600, 470, 2]].forEach(function (d) {
    var el = document.createElement('div');
    el.className = 'dot';
    el.style.cssText = 'left:' + d[0] + 'px;top:' + d[1] + 'px;width:' + d[2] * 2 + 'px;height:' + d[2] * 2 + 'px;opacity:' + (d[2] > 2 ? 0.9 : 0.6);
    document.body.insertBefore(el, document.body.firstChild);
  });
  DC.configure({ fonts: { 'https://fonts.googleapis.com/css2': '../runtime/fonts/fonts.css' } });
  DC.mount('../project/Welcome.dc.html', document.getElementById('welcome')).then(function () {
    document.body.setAttribute('data-ready', '1');
  }, function (e) { document.body.setAttribute('data-error', String(e && e.message || e)); });
</script>
</body>
</html>
`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'render', 'og.html'), OG);
  const b = await chromium.launch();
  const settle = async (p) => {
    await p.waitForSelector('body[data-ready], body[data-error]');
    const err = await p.getAttribute('body', 'data-error');
    if (err) throw new Error(err);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(400);
  };
  // the icon: the biggest one on the Icon board, drawn square at 400 px and shot at 512 px
  const p = await b.newPage({ viewport: { width: 1120, height: 640 }, deviceScaleFactor: 512 / 400, reducedMotion: 'reduce' });
  await p.goto(BASE + 'runtime/board.html?b=Icon.dc.html');
  await settle(p);
  await p.evaluate(() => {
    const box = document.querySelector('[role="img"][aria-label="Ícono de Mborevi Rape"]');
    Object.assign(box.style, { position: 'fixed', left: '0', top: '0', zIndex: '9', width: '400px', height: '400px',
      borderRadius: '0', boxShadow: 'none' });
    box.firstElementChild.style.transform = 'none';
  });
  await p.waitForTimeout(200);
  await p.screenshot({ path: path.join(OUT, 'icon-square-512.png'), clip: { x: 0, y: 0, width: 400, height: 400 } });
  // the share image: 1200 x 630, as link previews ask for
  const q = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await q.goto(BASE + 'render/og.html');
  await settle(q);
  await q.screenshot({ path: path.join(OUT, 'og.png') });
  await b.close();
  console.log('wrote', path.join(OUT, 'icon-square-512.png'), 'and', path.join(OUT, 'og.png'));
})().catch((e) => { console.error(e); process.exit(1); });
