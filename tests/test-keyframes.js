/* Every animation a board uses must be defined in its own <helmet>, and so must those of the boards it imports (on the
   design canvas an imported board's helmet may not reach the page); App.dc.html must define every one its screens use.
   Each definition must be the one in tests/keyframes.css. A name built in the logic from a prefix ('tp-hop-' + 'a')
   needs both its a and b. Usage: node tests/test-keyframes.js */
process.chdir(require('path').join(__dirname, '..'));
const fs = require('fs');
const path = require('path');
const norm = (b) => b.replace(/\s+/g, '');
const DEF = /@keyframes\s+([\w-]+)\s*(\{(?:[^{}]|\{[^{}]*\})*\})/g;
const ref = {};
for (const m of fs.readFileSync('tests/keyframes.css', 'utf8').matchAll(DEF)) ref[m[1]] = norm(m[2]);
/* names with the prefix that are not animations: Mborevi's gradient ids, made in its logic ('tp-body-' + a random tail) */
const NOT_MOTION = new Set(['tp-body-']);
const boards = {};
for (const f of fs.readdirSync('project').filter((n) => n.endsWith('.dc.html'))) {
  const src = fs.readFileSync(path.join('project', f), 'utf8');
  const name = f.replace('.dc.html', '');
  const defs = {};
  for (const m of src.matchAll(DEF)) defs[m[1]] = norm(m[2]);
  const body = src.replace(DEF, ' ').replace(/<script[^>]*\bsrc=[^>]*><\/script>/g, ' ');
  /* SVG ids (gradients, filters) share the prefix: they are not animations */
  const ids = new Set([...src.matchAll(/\bid="(tp-[^"]+)"/g)].map((m) => m[1]));
  const used = new Set();
  for (const m of body.matchAll(/\btp-[A-Za-z0-9-]+/g)) {
    const t = m[0];
    if (body.slice(m.index + t.length, m.index + t.length + 3) === '.js' || body[m.index - 1] === '#' || ids.has(t) || NOT_MOTION.has(t)) continue;
    used.add(t);
  }
  const imports = [...src.matchAll(/<dc-import\s+name="(\w+)"/g)].map((m) => m[1]);
  boards[name] = { defs, used, imports };
}
const names = (u) => {
  const out = new Set();
  for (const t of u) {
    if (t.endsWith('-')) { out.add(t + 'a'); out.add(t + 'b'); } else out.add(t);
  }
  return out;
};
function usedBy(b, seen = new Set()) {
  if (seen.has(b) || !boards[b]) return new Set();
  seen.add(b);
  const out = names(boards[b].used);
  for (const i of boards[b].imports) for (const t of usedBy(i, seen)) out.add(t);
  return out;
}
const problems = [];
for (const [b, info] of Object.entries(boards)) {
  const need = b === 'App' ? usedBy(b) : (() => { const s = names(info.used); for (const i of info.imports) for (const t of names((boards[i] || { used: [] }).used)) s.add(t); return s; })();
  for (const t of need) {
    if (!info.defs[t]) problems.push(`${b}: uses ${t}, which its helmet does not define`);
  }
  for (const [t, d] of Object.entries(info.defs)) {
    if (!ref[t]) problems.push(`${b}: defines ${t}, which tests/keyframes.css does not have`);
    else if (ref[t] !== d) problems.push(`${b}: ${t} differs from tests/keyframes.css`);
  }
}
console.log(Object.keys(boards).length + ' boards, ' + Object.keys(ref).length + ' keyframes in tests/keyframes.css');
console.log(problems.length ? problems.join('\n') : 'no problems');
process.exitCode = problems.length ? 1 : 0;
