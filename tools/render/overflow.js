// For each phone board: how far anything visible reaches past the root's padded content box (bottom/right), and the
// biggest offenders. A clipped CTA or card shows up here even though the root hides its overflow.
const { chromium } = require('playwright');
const fs = require('fs');
const S = require('path').resolve(__dirname, '..', '..');
const canvas = JSON.parse(fs.readFileSync(S + '/project/canvas.json', 'utf8'));
const only = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  for (const name of canvas.order) {
    if (only.length && !only.includes(name)) continue;
    const fr = canvas.boards[name];
    const p = await b.newPage({ viewport: { width: fr.w, height: fr.h }, deviceScaleFactor: 1 });
    await p.goto(require('./url.js')(name), { waitUntil: 'networkidle' });
    await p.waitForTimeout(1000);
    const r = await p.evaluate(() => {
      let root = null;
      for (const el of document.body.querySelectorAll('div')) { const cs = getComputedStyle(el); if (el.getBoundingClientRect().width >= 380 && (cs.overflow === 'hidden' || cs.overflowY === 'hidden')) { root = el; break; } }
      if (!root) return { note: 'no clipped root' };
      const rr = root.getBoundingClientRect(); const cs = getComputedStyle(root);
      const bottom = rr.bottom - parseFloat(cs.paddingBottom), right = rr.right;
      const offenders = [];
      root.querySelectorAll('*').forEach((el) => {
        const b = el.getBoundingClientRect();
        if (!b.width || !b.height) return;
        const st = getComputedStyle(el);
        if (st.visibility === 'hidden' || st.position === 'absolute' && st.pointerEvents === 'none') return;
        if (el.closest('svg') && el.tagName !== 'svg') return;
        const over = Math.max(b.bottom - bottom, b.right - right);
        if (over > 1) offenders.push({ over: Math.round(over), tag: el.tagName, text: (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40) });
      });
      offenders.sort((a, b) => b.over - a.over);
      return { pad: cs.paddingBottom, offenders: offenders.slice(0, 4) };
    });
    console.log(name, JSON.stringify(r));
    await p.close();
  }
  await b.close();
})();
