/* Every round a child plays by ear asks a word that can be heard: its clip is in the voice index (window.__tpVoiced,
   written by tools/audio/voiced.js). The games are played here as the boards deal them, not as the engine is meant to:
   Pick, the big star, YesNo and Catch on every night heard by ear, every track, over a few plays (salts). Pick is also
   played on the nights the rotation gives another game (a Pick kept from before can still be opened there): where
   none of the night's words can be heard, its rounds are read, never asked by ear. Fails on a round that asks a word
   with no clip, on a round to read where a word could be heard, and on a game with no round at all. */
process.chdir(require('path').join(__dirname, '..')); // paths below are from the repository root
global.window = global; global.document = { addEventListener() {} }; global.navigator = {};
['tp-sound.js', 'tp-course.js', 'tp-grades.js', 'tp-pics.js', 'tp-sky.js'].forEach((f) => require('../project/' + f));
const fs = require('fs');
const C = window.tpCourse;
global.DCLogic = class { constructor(p) { this.props = p || {}; this.state = {}; } setState(x) { this.state = Object.assign({}, this.state, typeof x === 'function' ? x(this.state) : x); } };
const timers = []; global.setTimeout = (fn) => { timers.push(fn); return 1; }; global.clearTimeout = () => {};
const flush = () => { let n = 0; while (timers.length && n++ < 10000) timers.shift()(); };
const load = (name) => { const s = fs.readFileSync('project/' + name + '.dc.html', 'utf8'); const js = /<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(s)[1]; return new Function(js + '\nreturn Component;')(); };
const B = { Pick: load('Pick'), Check: load('Check'), YesNo: load('YesNo'), Catch: load('Catch') };
let now = 1e12; Date.now = () => now;
const act = Object.assign({}, C.handlers(() => ({}), () => {}), { finish() {}, checked() {}, go() {}, open() {} });
const SALTS = 8;
const heard = (gn) => !!window.__tpVoiced['w:' + C.fold(gn)];
const problems = [];
let rounds = 0;
const bad = (s, track, game, what) => { if (problems.length < 200) problems.push(s.id + ' ' + track + ' ' + game + ': ' + what); };

/* Pick and the big star, played round by round: every card tapped, so each round ends on its right answer. A child
   who does not read yet gets no round to read, unless none of the words can be heard (a kept Pick on a silent night) */
function playRounds(Board, app, s, track, game) {
  const c = new Board({ app, act });
  const words = game === 'check' ? C.unitWords(s.grade, s.unit) : (s.data.words || []);
  const some = words.some((w) => heard(w.gn));
  let v = c.renderVals();
  let n = 0;
  for (let i = 0; i < 30 && !v.finished; i++) {
    n++;
    if (v.listenMode) { rounds++; if (!heard(v.target.gn)) bad(s, track, game, 'asks «' + v.target.gn + '» by ear, which has no clip'); }
    else if (some) bad(s, track, game, 'gives «' + v.target.gn + '» to read to a child who does not read yet');
    now += 1000;
    v.options.forEach((o) => o.pick());
    flush();
    v = c.renderVals();
  }
  if (!n) bad(s, track, game, 'no round at all');
}

for (const g of C.ORDER()) {
  const sessions = C.sessions(g);
  for (const track of ['L1', 'L2', 'BI']) {
    sessions.forEach((s, at) => {
      if (!s.ready || !C.isOral(s, track)) return;
      for (let k = 0; k < SALTS; k++) {
        window.__tpSalt = 'ear' + k;
        const given = s.kind === 'check' ? ['check'] : C.gamesFor(s, track);
        const games = s.kind === 'check' ? ['check'] : ['pick'].concat(given.filter((x) => x === 'yesno' || x === 'catch'));
        games.forEach((game) => {
          const st = Object.assign(C.sample(g, track, at), { cur: s.id, game: game === 'check' ? null : game });
          const app = C.view(st);
          if (game === 'check') return playRounds(B.Check, app, s, track, game);
          if (game === 'pick') return playRounds(B.Pick, app, s, track, game);
          if (game === 'yesno') {
            const list = new B.YesNo({ app, act }).plan();
            if (!list.length) bad(s, track, game, 'no round at all');
            list.forEach((q) => {
              rounds++;
              if (!heard(q.said.gn)) bad(s, track, game, 'names «' + q.said.gn + '» by ear, which has no clip');
              if (!heard(q.word.gn)) bad(s, track, game, 'shows «' + q.word.gn + '», whose word has no clip to be named with');
            });
            return;
          }
          const P = new B.Catch({ app, act }).plan(app);
          if (!P.n) bad(s, track, game, 'no round at all');
          if (P.listen) P.rounds.forEach((R) => { rounds++; if (!heard(R.target.gn)) bad(s, track, game, 'asks «' + R.target.gn + '» by ear, which has no clip'); });
        });
      }
    });
  }
}

console.log(rounds + ' rounds played by ear (' + SALTS + ' plays of every night and big star heard by ear)');
console.log(problems.length ? 'PROBLEMS:\n' + problems.slice(0, 40).join('\n') + (problems.length > 40 ? '\n… ' + (problems.length - 40) + ' more' : '') : 'no problems');
process.exitCode = problems.length ? 1 : 0;
