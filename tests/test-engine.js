process.chdir(require('path').join(__dirname, '..')); // paths below are from the repository root
global.window = global; global.document = global.document || { addEventListener() {} }; global.navigator = global.navigator || {};
require('../project/tp-sound.js'); /* its index of the voice clips (window.__tpVoiced) */
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

/* ---------- checks: each failing one is listed, and the run fails ---------- */
const fs = require('fs');
const problems = [];
const ORAL_TRACKS = ['L1', 'L2', 'BI'];
const nights = [].concat(...C.ORDER().map((g) => C.sessions(g))).filter((s) => s.kind === 'night' && s.ready);

/* the index of the voice clips is the one the sound files hold (tools/audio/voiced.js writes it) */
try { require('child_process').execFileSync(process.execPath, ['tools/audio/voiced.js', '--check'], { stdio: 'pipe' }); }
catch (e) { problems.push(String(e.stderr || e.message).trim()); }

/* the words of the nights played by ear that have no voice yet: tests/unvoiced.json lists them, so that a new unit
   cannot add a silent word unnoticed (node tests/test-engine.js --write updates the list once clips are approved) */
const silent = {};
nights.filter((s) => ORAL_TRACKS.some((t) => C.isOral(s, t))).forEach((s) => {
  const miss = (s.data.words || []).filter((w) => !C.voiced(w)).map((w) => w.gn);
  if (miss.length) silent[C.keptName(s)] = miss;
});
const LIST = 'tests/unvoiced.json';
if (process.argv.includes('--write')) fs.writeFileSync(LIST, JSON.stringify(silent, null, 1) + '\n');
const listed = fs.existsSync(LIST) ? JSON.parse(fs.readFileSync(LIST, 'utf8')) : {};
if (JSON.stringify(listed) !== JSON.stringify(silent)) problems.push('the words of oral nights with no voice are not the ones in ' + LIST + ' (a new silent word, or a clip approved: then run with --write): ' + JSON.stringify(silent).slice(0, 300));
console.log('oral words with no voice yet:', Object.values(silent).reduce((n, l) => n + l.length, 0));

/* the rotation */
const v1 = JSON.parse(fs.readFileSync('tests/games-v1.json', 'utf8'));
nights.forEach((s) => {
  const name = C.keptName(s);
  const n = s.data;
  ['L1', 'L2', 'BI'].forEach((t) => {
    const now = C.gamesFor(s, t);
    const where = name + ' ' + t;
    if (new Set(now).size !== now.length) problems.push(where + ': the same game twice: ' + now.join('+'));
    const heard = C.heard(n.words || []);
    const listening = (g) => g === 'pick' || g === 'yesno' || (g === 'catch' && C.isOral(s, t));
    if (heard < 2 && now.some(listening)) problems.push(where + ': a listening game with fewer than 2 words that can be heard: ' + now.join('+'));
    const buildable = (n.words || []).filter((w) => w.syl && w.syl.length > 1).length;
    if (buildable < 2 && now.includes('build')) problems.push(where + ': build with fewer than 2 words to build');
    if (t === 'L1' && !n.games && n.say && n.say.length && !now.includes('say')) problems.push(where + ': L1 does not say the night\'s lines');
    /* progress made under the earlier rotation: a game played keeps its place, and a night played through stays done */
    const old = (v1[name] || {})[t] || [];
    old.slice(1).forEach((x) => {
      const had = { meet: 1 }; had[x] = 1;
      const left = C.gamesFor(s, t, had).filter((k) => !had[k]);
      if (left.length !== 1) problems.push(where + ': with meet and ' + x + ' played, ' + left.length + ' games left (' + C.gamesFor(s, t, had).join('+') + ')');
    });
    if (old.length) {
      const had = {}; old.forEach((k) => { had[k] = 1; });
      const st = { track: t, done: {} }; st.done[s.id] = had;
      if (!C.complete(st, s)) problems.push(where + ': a night played through under the earlier rotation is no longer done');
    }
  });
});
C.ORDER().forEach((g) => ['L1', 'L2', 'BI'].forEach((t) => {
  let run = 1, prev = '';
  C.sessions(g).filter((s) => s.kind === 'night' && s.ready).forEach((s) => {
    if (s.data.games) { prev = ''; run = 1; return; }
    const key = C.gamesFor(s, t).slice(1).join('+');
    run = key === prev ? run + 1 : 1;
    prev = key;
    if (run > 2) problems.push(g + ' ' + t + ': three nights in a row play ' + key + ' (up to ' + s.id + ')');
  });
}));

/* a new game at every play (the site), the same one when a test or a screenshot asks */
const saltWas = window.__tpSalt;
delete window.__tpSalt;
if (C.salt({}) !== '') problems.push('a board on its own (no act) gets a salt');
if (C.salt({ act: {} }) === C.salt({ act: {} })) problems.push('two plays get the same salt');
window.__tpSalt = saltWas;

/* the other pictures of a round: never two that look alike; tonight's words first */
nights.forEach((s) => {
  const words = (s.data.words || []).map(C.word);
  words.forEach((w, r) => {
    const opts = [w].concat(C.distractors(w, s.grade, s.unit, 2, s.id + r, s.night));
    const keys = opts.map((o) => o.picKey);
    C.LOOKALIKE.forEach((grp) => { if (keys.filter((k) => grp.indexOf(k) >= 0).length > 1) problems.push(s.id + ' round ' + (r + 1) + ': look-alike pictures together: ' + keys.join(', ')); });
    /* every word tonight that could stand next to it comes before any other: the two taken hold as many of tonight's
       as the whole ordered list does among its first two */
    const tonight = words.map((x) => x.picKey);
    const all = C.distractors(w, s.grade, s.unit, 99, s.id + r, s.night).map((o) => o.picKey);
    const could = all.filter((k) => tonight.indexOf(k) >= 0).length;
    const fromTonight = keys.slice(1).filter((k) => tonight.indexOf(k) >= 0).length;
    if (fromTonight < Math.min(2, could)) problems.push(s.id + ' round ' + (r + 1) + ': other pictures not from tonight though it has enough: ' + keys.join(', '));
  });
});

console.log(problems.length ? 'PROBLEMS:\n' + problems.slice(0, 40).join('\n') + (problems.length > 40 ? '\n… ' + (problems.length - 40) + ' more' : '') : 'no problems');
process.exitCode = problems.length ? 1 : 0;
