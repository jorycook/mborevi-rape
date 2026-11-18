// Every clip the boards can ask for, per grade: the night's words and say-phrases ('w:' + fold), the story pages
// ('s:' + story + ':' + page). Prints JSON: [{grade, key, text, kind}]
global.window = global; global.document = { addEventListener() {} }; global.navigator = {};
const P = require('path').resolve(__dirname, '..', '..', 'project') + '/';
['tp-sound.js', 'tp-course.js', 'tp-grades.js', 'tp-pics.js', 'tp-sky.js'].forEach((f) => require(P + f));
const C = window.tpCourse;
const out = []; const seen = {};
function add(grade, key, text, kind, es) {
  const id = grade + '|' + key;
  if (seen[id]) return; seen[id] = 1;
  out.push({ grade, key, text: C.norm(text), kind, es: es || '' });
}
const VOICE_ES = { hello: "¡Hola! Me llamo Mborevi'i.", good: '¡Muy bien!', again: 'Probá otra vez.', star: 'Ganaste una estrella.', big: '¡La estrella grande brilla!', joy: '¡Felicitaciones!' };
C.grades().forEach((g) => {
  C.sessions(g.code).forEach((s) => {
    if (!s.ready) return;
    if (s.kind === 'night') {
      (s.data.words || []).forEach((w) => add(g.code, 'w:' + C.fold(w.gn), w.gn, 'word', w.es));
      (s.data.say || []).forEach((p) => add(g.code, 'w:' + C.fold(p.gn), p.gn, 'phrase', p.es));
      if (s.data.story) {
        const st = (window.__tpStories || {})[s.data.story];
        if (st) st.pages.forEach((p, i) => add(g.code, 's:' + s.data.story + ':' + (i + 1), p.gn, 'story', p.es));
      }
    } else {
      C.unitWords(g.code, s.unit).forEach((w) => add(g.code, 'w:' + C.fold(w.gn), w.gn, 'word', w.es));
    }
  });
});
Object.keys(C.VOICE).forEach((k) => add('ui', 'u:' + C.fold(C.VOICE[k]), C.VOICE[k], 'line', VOICE_ES[k]));
process.stdout.write(JSON.stringify(out, null, 1));
