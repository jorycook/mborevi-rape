const { chromium } = require('playwright');
(async () => {
  const [src, x, y, w, h, out] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +h } });
  await p.goto('http://127.0.0.1:8766/');
  await p.setContent(`<body style="margin:0;overflow:hidden"><img src="http://127.0.0.1:8766/${src}" style="position:absolute;left:-${x}px;top:-${y}px"></body>`, { waitUntil: 'networkidle' });
  await p.screenshot({ path: out }); await b.close();
})();
