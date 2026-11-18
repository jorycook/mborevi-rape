// The clip keys a unit needs (its words and say phrases), with their text and Spanish gloss.
// Usage: node unit_keys.js PROJECT_DIR grade unitN OUT.json
global.window = global; global.document = { addEventListener() {} }; global.navigator = {};
const [P, g, un, out] = process.argv.slice(2);
['tp-sound.js', 'tp-course.js', 'tp-grades.js'].forEach((f) => require(require('path').resolve(P, f)));
const C = window.tpCourse;
const u = window.__tpGrades[g].units.find((x) => x.n === +un);
const items = []; const seen = new Set();
const add = (t, es, kind) => { const key = 'w:' + C.fold(t); if (seen.has(key)) return; seen.add(key); items.push({ grade: g, key, text: C.norm(t), kind, es }); };
u.nights.forEach((n) => { (n.words || []).forEach((w) => add(w.gn, w.es, 'word')); (n.say || []).forEach((p) => add(p.gn, p.es, 'phrase')); });
require('fs').writeFileSync(out, JSON.stringify(items, null, 1));
console.log(items.length + ' keys');
