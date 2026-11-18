process.chdir(require('path').join(__dirname, '..')); // paths below are from the repository root
global.window = global; global.document = { addEventListener() {} }; global.navigator = {};
window.__tpSalt = ''; /* the same game at every play */
['tp-sound.js', 'tp-course.js', 'tp-grades.js', 'tp-pics.js', 'tp-sky.js'].forEach((f) => require('../project/' + f));
const fs = require('fs'); const C = window.tpCourse;
global.DCLogic = class { constructor(p) { this.props = p || {}; this.state = {}; } setState(x) { this.state = Object.assign({}, this.state, typeof x === 'function' ? x(this.state) : x); } };
const timers = []; global.setTimeout = (fn) => { timers.push(fn); return 1; }; global.clearTimeout = () => {};
const flush = () => { while (timers.length) timers.shift()(); };
const load = (name) => { const s = fs.readFileSync('project/' + name + '.dc.html', 'utf8'); const js = /<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(s)[1]; return new Function(js + '\nreturn Component;')(); };
const E = { preventDefault() {} };
let finished = [];
const act = Object.assign({}, C.handlers(() => ({}), () => {}), { finish: (k) => finished.push(k), checked: (a, b) => finished.push('checked ' + a + '/' + b), go: () => {}, open: () => {} });
let now = 1e12; Date.now = () => now;
function play(track, grade, id, game, check) {
  const st = Object.assign(C.sample(grade, track, C.sessions(grade).findIndex((s) => s.id === id)), { cur: id, game });
  const app = C.view(st);
  const scr = game ? C.GAMES[game].screen : 'Check';
  const c = new (load(scr))({ app, act });
  let v = c.renderVals();
  if (check) check(v, c);
  /* to the end: the story to its end card when it has one (finished), else to its last page */
  for (let i = 0; i < 80 && !v.finished && !(v.last && !('finished' in v)); i++) {
    now += 1000;
    if (scr === 'Meet') v.next();
    else if (scr === 'Pick' || scr === 'Check') v.options.forEach((o) => o.pick());
    else if (scr === 'Build' || scr === 'Letters') v.keys.forEach((k) => k.tap());
    else if (scr === 'Say') { v.mic.tap(); v = c.renderVals(); v.mic.tap(); v = c.renderVals(); v.forward(E); }
    else if (scr === 'Story') v.forward(E);
    else if (scr === 'YesNo') v.answers.forEach((o) => o.pick());
    else if (scr === 'Catch') v.stars.forEach((o) => o.pick());
    else if (scr === 'Pairs') { const n = v.cards.length; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) { v = c.renderVals(); v.cards[a].flip(); v = c.renderVals(); v.cards[b].flip(); flush(); } }
    flush(); v = c.renderVals();
  }
  (v.done || v.forward)(E);
  console.log(track, id, scr, '->', finished[finished.length - 1], v.finished === undefined ? '' : (v.finished ? 'finished' : (v.last ? 'last page' : 'NOT FINISHED')), v.announce ? '| ' + v.announce : '');
}
const oralPairs = (v) => { const words = v.cards.filter((c) => c.showWord).length; console.log('   pairs deck: ' + (v.hint.indexOf('iguales') >= 0 ? 'picture + picture (oral)' : 'picture + word (reading)')); };
play('L1', 'g1', 'g1u01n1', 'read');
play('L1', 'g1', 'g1u01n1', 'build');
/* the alphabet unit is unit 7 since «Ikatúpa?» was put in as unit 5 */
play('L1', 'g1', 'g1u07n1', 'letters');
play('L1', 'g1', 'g1u07n2', 'letters');
play('BI', 'g1', 'g1u07n3', 'letters');
play('L1', 'g1', 'g1u03n3', 'build');
play('BI', 'g1', 'g1u05n2', 'build');
play('L2', 'g1', 'g1u01n1', 'say');
play('L2', 'g1', 'g1u02n1', 'say');
play('L2', 'g1', 'g1u07n3', 'story');
play('L2', 'g1', 'g1u07n3', 'pairs', oralPairs);
play('L1', 'g1', 'g1u07n3', 'pairs', oralPairs);
play('L2', 'g2', 'g2u01n1', 'pick');
play('L2', 'pre', 'preu01n1', 'pick');
play('L2', 'pre', 'preu02n2', 'pairs', oralPairs);
play('L2', 'pre', 'preu06n3', 'story');
play('L1', 'g1', 'g1u04c', null, (v) => console.log('   big star mode: ' + (v.readMode ? 'read' : 'listen')));
play('L2', 'g1', 'g1u04c', null, (v) => console.log('   big star mode: ' + (v.readMode ? 'read' : 'listen')));
play('L2', 'pre', 'preu05c', null);
/* the new games: by ear and, for the catch, reading */
play('L2', 'pre', 'preu01n3', 'yesno');
play('L1', 'pre', 'preu03n3', 'yesno');
play('L2', 'g1', 'g1u05n3', 'yesno');
play('L2', 'g1', 'g1u02n2', 'catch');
play('L1', 'g1', 'g1u02n2', 'catch');
