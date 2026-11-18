process.chdir(require('path').join(__dirname, '..')); // paths below are from the repository root
// Plays the App board's logic end to end in Node (no rendering): onboarding, then every step of a grade, game by game,
// on one track. Usage: node flow-test.js [track] [grade]. Also checks replays and a change of home language.
global.window = global; global.document = { addEventListener() {} }; global.navigator = {};
/* the same game at every play, so that a run can be compared with the last (the site gives each play its own salt) */
window.__tpSalt = '';
['tp-sound.js', 'tp-course.js', 'tp-grades.js', 'tp-pics.js', 'tp-sky.js'].forEach((f) => require('../project/' + f));
const fs = require('fs');
const C = window.tpCourse;
let now = 1e12; Date.now = () => now; const tick = (ms) => { now += ms || 1000; };
global.DCLogic = class { constructor(p) { this.props = p || {}; this.state = {}; } setState(x) { this.state = Object.assign({}, this.state, typeof x === 'function' ? x(this.state) : x); } };
const timers = [];
global.setTimeout = (fn) => { timers.push(fn); return timers.length; }; global.clearTimeout = () => {};
const flush = () => { while (timers.length) { tick(100); timers.shift()(); } };
const load = (name) => { const s = fs.readFileSync('project/' + name + '.dc.html', 'utf8'); const js = /<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(s)[1]; return { Cls: new Function(js + '\nreturn Component;')(), src: s }; };
const holes = (src, v) => {
  const hs = [...src.replace(/<script[\s\S]*?<\/script>/g, '').matchAll(/\{\{\s*([\w.$]+)\s*\}\}/g)].map((m) => m[1]);
  const loops = {}; for (const m of src.matchAll(/<sc-for list="\{\{\s*([\w.]+)\s*\}\}" as="(\w+)"/g)) loops[m[2]] = m[1];
  const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  const miss = [];
  for (const h of hs) { if (/^(true|false|\d+)$/.test(h) || h === '$index') continue; const head = h.split('.')[0]; let val; if (loops[head]) { const arr = get(v, loops[head]) || []; if (!arr.length) continue; val = get({ [head]: arr[0] }, h); } else val = get(v, h); if (val === undefined) miss.push(h); }
  return miss;
};
const E = { preventDefault() {} };
const TRACK = process.argv[2] || 'L2';
const GRADE = process.argv[3] || 'g1';
const quiet = !!process.env.QUIET;
const problems = [];
const App = load('App');
const app = new App.Cls({});
for (const k of Object.keys(app.act)) { const f = app.act[k]; app.act[k] = (...a) => { tick(); return f(...a); }; }
const render = (name) => {
  const { Cls, src } = load(name);
  const c = new Cls({ app: C.view(app.state), act: app.act });
  if (c.componentDidMount) c.componentDidMount();
  const v = c.renderVals();
  const miss = holes(src, v);
  if (miss.length) problems.push(name + ' missing ' + miss.join(','));
  if (name !== app.state.screen) problems.push('rendered ' + name + ' while screen is ' + app.state.screen);
  return { c, v };
};
const log = (label) => { if (!quiet) console.log(label + ' -> ' + app.state.screen + (app.state.cur ? ' cur=' + app.state.cur : '') + (app.state.game ? ' game=' + app.state.game : '')); };
function playGame(scr) {
  let r = render(scr);
  for (let guard = 0; guard < 80; guard++) {
    r.v = r.c.renderVals();
    /* the story: page by page; its end card (finished) when it has one, else its last page */
    if (scr === 'Story') { if (r.v.finished || (r.v.last && !('finished' in r.v))) break; tick(); r.v.forward(E); flush(); continue; }
    if (r.v.finished) break;
    if (scr === 'Meet') { tick(); r.v.next(); }
    else if (scr === 'Pick' || scr === 'Check') { r.v.options.forEach((o) => o.pick()); flush(); }
    else if (scr === 'Pairs') { const n = r.v.cards.length; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) { r.v = r.c.renderVals(); r.v.cards[a].flip(); r.v = r.c.renderVals(); r.v.cards[b].flip(); flush(); } }
    else if (scr === 'Build' || scr === 'Letters') { for (let t = 0; t < 12; t++) { r.v = r.c.renderVals(); r.v.keys.forEach((k) => k.tap()); flush(); } }
    /* Say: the model plays by itself and «Upéi» works once it has; while «Upéi» still waits, the microphone is used */
    else if (scr === 'Say') {
      flush(); r.v = r.c.renderVals();
      if (r.v.fwdOff === 'true' && r.v.mic && r.v.mic.tap) { r.v.mic.tap(); r.v = r.c.renderVals(); if (r.v.mic && r.v.mic.tap) r.v.mic.tap(); flush(); r.v = r.c.renderVals(); }
      r.v.forward(E);
    }
    /* the new games, as Pick: every answer of the round is tapped, then the round's timers run (a tap reads the
       board's state when it comes, so the taps after the right one are ignored) */
    else if (scr === 'YesNo') { (r.v.answers || []).forEach((o) => o.pick()); flush(); }
    else if (scr === 'Catch') { (r.v.stars || []).forEach((o) => o.pick()); flush(); }
  }
  r.v = r.c.renderVals();
  if (scr !== 'Story' && !r.v.finished) problems.push('did not finish ' + scr + ' at ' + app.state.cur);
  if (r.c.componentDidUpdate) r.c.componentDidUpdate();
  return r;
}
let r;
r = render('Welcome'); r.v.main(E); r.v = r.c.renderVals(); r.v.main(E); log('wake, then too fast');
if (app.state.screen !== 'Welcome') problems.push('a double tap on Welcome skipped ahead');
tick(); r.v.main(E); log('wake + go');
r = render('Grade'); const gi = r.v.groups.flatMap((g) => g.items).find((it) => it.code === GRADE); gi.pick(); r.v = r.c.renderVals(); r.v.next(E); log('pick ' + GRADE);
r = render('Home'); r.v.options[['L1', 'L2', 'BI'].indexOf(TRACK)].pick(); r.v = r.c.renderVals(); r.v.next(E); log('track ' + TRACK);
r = render('Ready'); r.v.next(E); log('ready');
const total = C.sessions(GRADE).filter((s) => s.ready).length;
let opened = 0, shines = 0;
for (let k = 0; k < 200 && opened < total; k++) {
  if (app.state.screen !== 'Main') { problems.push('expected Main, got ' + app.state.screen); break; }
  r = render('Main');
  if (!r.v.card || !r.v.card.go) break;
  r.v.card.go(E); opened++; log('open step');
  if (app.state.screen === 'Check') {
    r = playGame('Check'); r.v.done(E); log('checked');
    if (app.state.screen === 'Shine') { shines++; r = render('Shine'); r.v.cta.go(E); log('shine ->'); }
    if (app.state.screen === 'Sky') break;
    if (app.state.walk) { r = render('Main'); app.act.walked(); }
    continue;
  }
  for (let g = 0; g < 4; g++) {
    if (app.state.screen !== 'Tonight') break;
    r = render('Tonight'); r.v.cta.go(E); log('  game');
    const scr = app.state.screen;
    r = playGame(scr);
    (r.v.done || r.v.forward)(E); log('  finished ' + scr);
    if (app.state.screen === 'Main') break;
  }
  if (app.state.walk) { r = render('Main'); app.act.walked(); }
}
const pg = C.progress(app.state, GRADE);
console.log(TRACK, GRADE, 'steps opened', opened, 'of', total, '| lit', pg.lit + '/' + pg.total, '| shines', pg.shines, '| Shine screens', shines, '| stars', C.stars(app.state), '| now on', app.state.screen);
// a replay of a finished night: back to its games, no walk, nothing lost
const doneNight = C.sessions(GRADE).find((s) => s.kind === 'night' && C.complete(app.state, s));
if (doneNight) {
  const before = C.stars(app.state);
  app.act.go('Main'); app.act.open(doneNight.id, C.gamesFor(doneNight, TRACK)[0]);
  r = playGame(app.state.screen); (r.v.done || r.v.forward)(E);
  if (app.state.walk) problems.push('a replay started a walk');
  if (app.state.screen !== 'Tonight') problems.push('a replay went to ' + app.state.screen);
  if (C.stars(app.state) !== before) problems.push('a replay changed the stars');
  // a lit big star played again: back to the path, no Shine
  const lit = C.sessions(GRADE).find((s) => s.kind === 'check' && C.complete(app.state, s));
  if (lit) {
    app.act.go('Main'); app.act.open(lit.id);
    r = playGame('Check'); r.v.done(E);
    if (app.state.screen !== 'Main' || app.state.walk) problems.push('a replayed big star went to ' + app.state.screen + (app.state.walk ? ' with a walk' : ''));
  }
  // the home language changes: nothing played is undone
  const lit0 = C.progress(app.state, GRADE).lit, done0 = C.progress(app.state, GRADE).done;
  ['L1', 'L2', 'BI'].filter((t) => t !== TRACK).forEach((t) => {
    const p = C.progress(Object.assign({}, app.state, { track: t }), GRADE);
    if (p.lit !== lit0 || p.done !== done0) problems.push('switching to ' + t + ' changed progress ' + done0 + '->' + p.done);
  });
  app.act.go('Main');
  if (app.state.cur) problems.push('back on the path the replayed step stayed open');
}
['Main', 'Sky', 'Grownups', 'Tonight'].forEach((n) => { app.act.go(n); render(n); });
console.log(problems.length ? 'PROBLEMS:\n  ' + problems.join('\n  ') : 'no problems');
