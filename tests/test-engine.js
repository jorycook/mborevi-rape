process.chdir(require('path').join(__dirname, '..')); // paths below are from the repository root
global.window = global;
require('../project/tp-course.js');
require('../project/tp-grades.js');
require('../project/tp-pics.js');
const C = window.tpCourse;
console.log('grades', C.ORDER().join(','));
console.log(C.grades().map(g => g.code + ':' + g.units + 'u/' + g.written + 'w').join(' '));
const st = C.fresh(); st.grade = 'g1'; st.track = 'L1';
let v = C.view(st);
console.log('step', v.step.id, v.games.map(g => g.key).join(','), 'path stops', v.path.stops.map(x => x.role + ':' + (x.s ? x.s.id : '-')).join(' '));
// missing pics
const missing = new Set();
C.ORDER().forEach(g => C.sessions(g).forEach(s => (s.data.words || []).forEach(w => { if (!window.__tpPics[w.pic]) missing.add(w.pic + ' (' + w.gn + ')'); })));
console.log('missing pics:', [...missing].join(', ') || 'none');
// play through g1 with handlers
let state = Object.assign(C.fresh(), { grade: 'g1', track: 'L2', screen: 'Main' });
const H = C.handlers(() => state, (fn) => { state = Object.assign({}, state, fn(state)); });
for (let i = 0; i < 40; i++) {
  const nx = C.next(state, 'g1'); if (!nx) break;
  if (nx.kind === 'check') { state.cur = nx.id; H.checked(4, 5); }
  else { state.cur = nx.id; C.gamesFor(nx, state.track).forEach(k => H.finish(k)); }
}
console.log('after play:', 'stars', C.stars(state), 'progress', JSON.stringify(C.progress(state, 'g1')).slice(0, 160), 'learned', C.learned(state).length);
// games per track
['L1','L2','BI'].forEach(t => console.log(t, C.sessions('g1').filter(s=>s.kind==='night').map(s => C.gamesFor(s, t).join('+')).join(' | ')));
console.log('pre', C.sessions('pre').filter(s=>s.kind==='night').map(s => C.gamesFor(s, 'L2').join('+')).join(' | '));
// letters / normalization check of g̃
const t = 'Tereg̃uahẽ porãite'; console.log([...t].map(c => c.codePointAt(0).toString(16)).join(' '));
console.log(C.letters("mbo'ehára").join('·'), C.letters('Tereg̃uahẽ').join('·'));
