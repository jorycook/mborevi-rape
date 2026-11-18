/* Mborevi Rape course engine: the kids' sibling of the Epu'ã engine (gn-course.js), for Guarani taught in Spanish.
 * The levels are the grades of the Paraguayan school system as the MEC organises Guarani teaching (Educación Inicial,
 * then the grades of the Educación Escolar Básica), not CEFR levels. The lessons are data (tp-grades.js); the pictures
 * are data (tp-pics.js); the sky (one Guarani constellation per grade) is data (tp-sky.js). This file is what every screen
 * uses to read them: the grades, the nights of each unit, the child's progress, the Milky Way path the tapir walks,
 * the games of a night, and the Guarani text helpers. It works the same on the design canvas and in the prototype. */
(function () {
  var C = window.tpCourse = window.tpCourse || {};

  /* ---------- grades ----------
     One level per school grade, in school order. Each grade is a constellation of the Guarani sky; each unit of the
     grade is one of its stars; each night (lesson) is a small star on the Milky Way between them. */
  var ORDER = [];
  var META = {};
  /* the grades come from tp-grades.js (window.__tpMeta), read when first asked for, whatever order the files load in */
  function load() {
    if (ORDER.length) return;
    (window.__tpMeta || []).forEach(function (g) { ORDER.push(g.code); META[g.code] = g; });
  }
  C.ORDER = function () { load(); return ORDER.slice(); };
  C.meta = function (g) { load(); return META[g] || META[ORDER[0]] || {}; };
  function all() { return window.__tpGrades || {}; }
  function dataOf(g) { return all()[g] || { units: [] }; }
  C.grades = function () {
    load();
    return ORDER.map(function (g) {
      var d = dataOf(g);
      var nights = 0, ready = 0;
      (d.units || []).forEach(function (u) { (u.nights || []).forEach(function (n) { nights++; if (n.words && n.words.length) ready++; }); });
      return Object.assign({}, META[g], { ready: ready > 0, written: ready, nights: nights, units: (d.units || []).length });
    });
  };
  C.gradeOf = function (id) { load(); var m = /^(pre|g\d)/.exec(id || ''); return m ? m[1] : ORDER[0]; };
  C.nextGrade = function (g) { load(); var i = ORDER.indexOf(g); return i >= 0 && i < ORDER.length - 1 ? ORDER[i + 1] : null; };

  /* ---------- Guarani text ----------
     One puso everywhere (U+0027); tildes are letters (a and ã differ); g̃ is g + U+0303, so text is counted by graphemes. */
  var PUSO = /[’‘ʼ´`ʹʻ]/g;
  C.norm = function (s) { var t = String(s == null ? '' : s); if (t.normalize) t = t.normalize('NFC'); return t.replace(PUSO, "'"); };
  C.fold = function (s) { return C.norm(s).toLowerCase().replace(/\s+/g, ' ').replace(/^[\s¿¡"«]+|[\s.,;:!?"»]+$/g, ''); };
  C.chars = function (s) {
    var t = C.norm(s);
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      try { return Array.from(new Intl.Segmenter('gn', { granularity: 'grapheme' }).segment(t), function (x) { return x.segment; }); } catch (e) {}
    }
    return t.match(/[\s\S][̀-ͯ]*/g) || [];
  };
  /* the letters of the achegety as a reader sees them: ch mb nd ng nt rr g̃ are one letter each */
  var DIGRAPHS = ['ch', 'mb', 'nd', 'ng', 'nt', 'rr'];
  C.letters = function (word) {
    var cs = C.chars(word), out = [];
    for (var i = 0; i < cs.length; i++) {
      var two = (cs[i] + (cs[i + 1] || '')).toLowerCase();
      if (DIGRAPHS.indexOf(two) >= 0) { out.push(cs[i] + cs[i + 1]); i++; } else out.push(cs[i]);
    }
    return out;
  };
  /* a stable shuffle: the same order every time for the same seed, so cards never jump between renders */
  C.shuffle = function (list, seed) {
    var out = list.slice();
    var r = C.rng(String(seed || ''));
    for (var k = out.length - 1; k > 0; k--) { var j = Math.floor(r() * (k + 1)); var t = out[k]; out[k] = out[j]; out[j] = t; }
    return out;
  };

  /* ---------- geometry: the Milky Way and the stars ---------- */
  C.rng = function (seed) {
    var h = 2166136261;
    var s = String(seed);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return function () {
      h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
      h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
      h ^= h >>> 16;
      return (h >>> 0) / 4294967296;
    };
  };
  function f1(v) { return Math.round(v * 10) / 10; }
  function cubic(p0, p1, p2, p3, t) {
    var u = 1 - t;
    return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
  }
  /* a chain of cubic curves, measured by length: at(0..1) is a point on it, d its SVG path */
  C.chain = function (segs) {
    var pts = [];
    segs.forEach(function (s, i) { for (var k = i === 0 ? 0 : 1; k <= 48; k++) pts.push(cubic(s[0], s[1], s[2], s[3], k / 48)); });
    var acc = [0];
    for (var i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var total = acc[acc.length - 1];
    function at(f) {
      var L = Math.max(0, Math.min(1, f)) * total;
      var j = 1;
      while (j < acc.length - 1 && acc[j] < L) j++;
      var a = acc[j - 1], b = acc[j];
      var t = b > a ? (L - a) / (b - a) : 0;
      return [pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * t, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * t];
    }
    var d = 'M' + f1(segs[0][0][0]) + ' ' + f1(segs[0][0][1]) + segs.map(function (s) {
      return 'C' + [s[1], s[2], s[3]].map(function (p) { return f1(p[0]) + ' ' + f1(p[1]); }).join(' ');
    }).join('');
    return { at: at, d: d, total: total };
  };
  /* a smooth curve through points (Catmull-Rom), as segments for chain() */
  C.smooth = function (P) {
    var segs = [];
    for (var i = 0; i < P.length - 1; i++) {
      var p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || P[i + 1];
      segs.push([p1, [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6], p2]);
    }
    return segs;
  };
  /* a five-point star; puffy rounds its tips (the stars on the path), plain keeps them sharp (small decorations) */
  C.starD = function (cx, cy, r, inner) {
    var k = inner || 0.5, out = [];
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + (i * Math.PI) / 5;
      var rr = i % 2 ? r * k : r;
      out.push(f1(cx + rr * Math.cos(a)) + ' ' + f1(cy + rr * Math.sin(a)));
    }
    return 'M' + out.join('L') + 'Z';
  };
  C.puffyD = function (cx, cy, r, inner) {
    var k = inner || 0.55, P = [];
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + (i * Math.PI) / 5;
      var rr = i % 2 ? r * k : r;
      P.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
    }
    function mid(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
    function p(q) { return f1(q[0]) + ' ' + f1(q[1]); }
    var d = '';
    for (var j = 0; j < 10; j += 2) {
      var tip = P[j], prev = P[(j + 9) % 10], next = P[(j + 1) % 10];
      var m1 = mid(prev, tip), m2 = mid(tip, next);
      var a1 = [tip[0] + (m1[0] - tip[0]) * 0.24, tip[1] + (m1[1] - tip[1]) * 0.24];
      var a2 = [tip[0] + (m2[0] - tip[0]) * 0.24, tip[1] + (m2[1] - tip[1]) * 0.24];
      d += (j === 0 ? 'M' : 'L') + p(prev) + 'L' + p(a1) + 'Q' + p(tip) + ' ' + p(a2);
    }
    return d + 'Z';
  };
  C.sparkleD = function (cx, cy, r) {
    var k = r * 0.22;
    return 'M' + f1(cx) + ' ' + f1(cy - r) + 'Q' + f1(cx + k) + ' ' + f1(cy - k) + ' ' + f1(cx + r) + ' ' + f1(cy) +
      'Q' + f1(cx + k) + ' ' + f1(cy + k) + ' ' + f1(cx) + ' ' + f1(cy + r) + 'Q' + f1(cx - k) + ' ' + f1(cy + k) + ' ' + f1(cx - r) + ' ' + f1(cy) +
      'Q' + f1(cx - k) + ' ' + f1(cy - k) + ' ' + f1(cx) + ' ' + f1(cy - r) + 'Z';
  };
  C.circleD = function (cx, cy, r) {
    return 'M' + f1(cx - r) + ' ' + f1(cy) + 'a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(2 * r) + ' 0a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-2 * r) + ' 0Z';
  };
  /* a field of twinkling stars that never moves between renders: one path of dots, one of sparkles */
  /* avoid: optional boxes [x0, y0, x1, y1] kept clear of stars (a title over the sky) */
  C.starfield = function (seed, w, top, h, count, avoid) {
    var r = C.rng(seed), dots = '', sparks = '', dim = '';
    for (var i = 0; i < count; i++) {
      var x = r() * w, y = top + r() * h, s = 0.7 + r() * 1.6;
      if (avoid && avoid.some(function (b) { return x > b[0] - 6 && x < b[2] + 6 && y > b[1] - 6 && y < b[3] + 6; })) continue;
      if (i % 7 === 0) sparks += C.sparkleD(x, y, s * 2.7);
      else if (i % 3 === 0) dim += C.circleD(x, y, s);
      else dots += C.circleD(x, y, s);
    }
    return { dots: dots || 'M0 0', sparks: sparks || 'M0 0', dim: dim || 'M0 0' };
  };
  /* dust inside the Milky Way band: tiny dots scattered along the curve */
  C.dust = function (band, seed, count, spread) {
    var r = C.rng(seed), a = '', b = '';
    for (var i = 0; i < count; i++) {
      var p = band.at(r());
      var off = (r() - 0.5) * (spread || 70), tilt = (r() - 0.5) * 2;
      var d = C.circleD(p[0] + off * 0.7, p[1] + off * 0.7 * tilt, 0.5 + r() * 1.2);
      if (i % 2) a += d; else b += d;
    }
    return { a: a || 'M0 0', b: b || 'M0 0' };
  };

  /* ---------- the course ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  C.units = function (g) { return dataOf(g).units || []; };
  C.unit = function (g, n) { var us = C.units(g); for (var i = 0; i < us.length; i++) if (us[i].n === n) return us[i]; return null; };
  C.nightId = function (g, u, k) { return g + 'u' + pad(u) + 'n' + k; };
  C.checkId = function (g, u) { return g + 'u' + pad(u) + 'c'; };
  /* every step of a grade in order: for each unit its nights, then its big star (the unit check) */
  C.sessions = function (g) {
    var list = [];
    C.units(g).forEach(function (u) {
      (u.nights || []).forEach(function (n, k) {
        list.push({ id: C.nightId(g, u.n, k + 1), grade: g, unit: u.n, night: k + 1, kind: 'night', ready: !!(n.words && n.words.length), gn: n.gn || '', es: n.es || '', data: n });
      });
      var nw = (u.nights || []).some(function (n) { return n.words && n.words.length; });
      list.push({ id: C.checkId(g, u.n), grade: g, unit: u.n, night: 0, kind: 'check', ready: nw, gn: 'Mbyja guasu', es: 'La estrella grande', data: u });
    });
    return list;
  };
  C.session = function (id) {
    var list = C.sessions(C.gradeOf(id));
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  };
  C.after = function (id) {
    var list = C.sessions(C.gradeOf(id));
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i + 1] || null;
    return null;
  };
  /* the words met so far in a unit, up to and including a night (the big star asks about all of them) */
  C.unitWords = function (g, n) {
    var u = C.unit(g, n);
    var out = [];
    if (u) (u.nights || []).forEach(function (x) { (x.words || []).forEach(function (w) { out.push(w); }); });
    return out;
  };

  /* ---------- the games of a night ----------
     The MEC way (Programa de estudio, 2.º grado, the three bilingual proposals): with Guarani as the mother tongue
     (L1) a child reads and writes it from 1.º grado; with Guarani as the second language (L2) 1.º grado works the four
     abilities, but reading and writing "no inciden en la promoción" there, so the app plays 1.º grado L2 by ear, with
     the vowels' letter game as the one written part (the vowels are a 1.º grado topic of the 2021 planning guide); from
     2.º grado reading and writing count. Bilingual children (BI, the third proposal, both languages as L1) read and
     write from 1.º grado. Every night has three games: meet
     the words, then two to practise them. */
  var GAMES = {
    meet: { gn: 'Ehecha ha ehendu', es: 'Mirá y escuchá', screen: 'Meet', skill: 'ahendu' },
    pick: { gn: 'Ehendu ha eiporavo', es: 'Escuchá y elegí', screen: 'Pick', skill: 'ahendu' },
    read: { gn: "Emoñe'ẽ ha eiporavo", es: 'Leé y elegí', screen: 'Pick', skill: "amoñe'ẽ" },
    pairs: { gn: 'Mbyja joja', es: 'Estrellas iguales', screen: 'Pairs', skill: "amoñe'ẽ" },
    build: { gn: "Emopu'ã ñe'ẽ", es: 'Armá la palabra', screen: 'Build', skill: 'ahai' },
    say: { gn: "Ere Mborevi'i ndive", es: "Decilo con Mborevi'i", screen: 'Say', skill: "añe'ẽ" },
    letters: { gn: 'Achegety', es: 'Las letras', screen: 'Letters', skill: 'ahai' },
    story: { gn: "Yvága mombe'u", es: 'Cuento del cielo', screen: 'Story', skill: "amoñe'ẽ" },
    yesno: { gn: 'Ehendu porã', es: '¿Sí o no?', screen: 'YesNo', skill: 'ahendu' },
    catch: { gn: 'Ejapyhy mbyja', es: 'Atrapá la estrella', screen: 'Catch', skill: 'ahendu' }
  };
  /* the four abilities of the MEC programs, said the way a child says them */
  C.SKILLS = {
    ahendu: { gn: 'Ahendu', es: 'Escucho', mec: 'comprensión oral' },
    "añe'ẽ": { gn: "Añe'ẽ", es: 'Hablo', mec: 'expresión oral' },
    "amoñe'ẽ": { gn: "Amoñe'ẽ", es: 'Leo', mec: 'comprensión escrita' },
    ahai: { gn: 'Ahai', es: 'Escribo', mec: 'expresión escrita' }
  };
  C.TRACKS = {
    L1: { gn: 'Guarani', es: 'Más guaraní', short: 'Guaraní, lengua materna (L1)', note: 'En casa se habla más guaraní: lee y escribe en guaraní desde 1.º grado.' },
    L2: { gn: "Karaiñe'ẽ", es: 'Más castellano', short: 'Guaraní como segunda lengua (L2)', note: 'En casa se habla más castellano: en 1.º grado el guaraní es sobre todo oral; leer y escribir se piden desde 2.º grado.' },
    BI: { gn: 'Mokõivéva', es: 'Las dos por igual', short: 'Las dos lenguas maternas', note: 'En casa se hablan las dos: escucha, habla, lee y escribe en guaraní desde 1.º grado.' }
  };
  C.GAMES = GAMES;
  /* is a night played by ear only? Preescolar always; 1.º grado too for a child with Guarani as second language (the
     alphabet unit still gives that child the vowels' letter game: see its nights' games) */
  C.isOral = function (s, track) {
    if (!s) return true;
    return s.grade === 'pre' || (s.grade === 'g1' && (track || 'L2') === 'L2');
  };
  /* the ability a game trains: the story, the pairs and the catch are heard when the night is oral, read otherwise */
  C.skillOf = function (key, s, track) {
    if ((key === 'story' || key === 'pairs' || key === 'catch') && C.isOral(s, track)) return 'ahendu';
    if (key === 'catch') return "amoñe'ẽ";
    return (GAMES[key] || {}).skill || 'ahendu';
  };
  /* Can a word be heard? window.__tpVoiced is the index of the voice clips (tools/audio/voiced.js writes it into
     tp-sound.js); a page without the sound engine takes every word as heard. The voice switch does not count here: a
     night's games never depend on a setting, the switch only decides whether a clip plays. */
  C.voiced = function (w) {
    var v = window.__tpVoiced;
    if (!v || typeof v !== 'object') return true;
    return !!(w && w.gn && v['w:' + C.fold(w.gn)]);
  };
  /* how many different pictures there are among the words that can be heard */
  C.heard = function (words) {
    var seen = {}, n = 0;
    (words || []).forEach(function (w) {
      if (!C.voiced(w)) return;
      var k = w.pic || w.gn;
      if (!seen[k]) { seen[k] = 1; n++; }
    });
    return n;
  };
  /* A new game at every play, the same during it: each game board mixes this into its seeds when it is made. '' for a
     board shown on its own (no act: the canvas, the screenshots), and what a test sets in window.__tpSalt. */
  C.salt = function (props) {
    if (typeof window.__tpSalt === 'string') return window.__tpSalt;
    if (!props || !props.act) return '';
    return Math.random().toString(36).slice(2, 8);
  };
  /* A word heard now (a listen button, or a word that plays as its card opens): the sound wakes; the board shows that
     it is playing (said; voiced when a clip plays) until the clip has ended, or for a moment when there is none, while
     the written stand-in shows. The timer goes in board.timers, which every game board clears when it goes. */
  C.listen = function (board, key) {
    var S = window.tpSound;
    if (S && S.unlock) S.unlock();
    var played = !!(S && S.has && S.has(key) && S.play(key));
    board.setState({ said: true, voiced: played });
    clearTimeout(board.saidT);
    board.saidT = setTimeout(function () { board.setState({ said: false }); }, played && S.ms ? Math.max(900, S.ms(key) + 300) : 1800);
    (board.timers = board.timers || []).push(board.saidT);
    return played;
  };
  /* A night's three games: meet the words, then two that change with the night's place in its unit (k), so that no
     two nights in a row are alike and every track trains the four abilities (L1 speaks on the nights with dialogues).
     A listening game needs two words that can be heard (else pairs, or read on readers' nights); build needs two words
     to build (else pairs); the second and third are never the same. had, the night's record: a game already played
     there (under an earlier rotation, or on another track) keeps a place, so that a night half played is finished
     with one more game and never asks again for one already played. */
  C.gamesFor = function (s, track, had) {
    if (!s || s.kind !== 'night') return [];
    var n = s.data || {};
    var t = track || 'L2';
    var oral = C.isOral(s, t);
    var list;
    if (n.games) list = (n.games[t] || n.games.all || []).slice();
    else {
      var k = (s.night - 1) % 3;
      var hasSay = !!(n.say && n.say.length);
      var second, third;
      if (oral) { second = ['pick', 'catch', 'yesno'][k]; third = hasSay ? 'say' : ['say', 'pairs', 'say'][k]; }
      else if (t === 'L1') { second = k === 1 ? 'catch' : 'read'; third = hasSay ? 'say' : ['build', 'pairs', 'build'][k]; }
      else if (t === 'BI') { second = ['pick', 'read', 'catch'][k]; third = hasSay ? 'say' : ['build', 'say', 'pairs'][k]; }
      else { second = ['pick', 'read', 'catch'][k]; third = hasSay ? 'say' : ['build', 'say', 'build'][k]; }
      list = ['meet', second, third];
    }
    var words = n.words || [];
    var heard = C.heard(words);
    var buildable = words.filter(function (w) { return w.syl && w.syl.length > 1; }).length;
    for (var i = 1; i < list.length; i++) {
      var g = list[i];
      var listening = g === 'pick' || g === 'yesno' || (g === 'catch' && oral);
      if (listening && heard < 2) list[i] = oral ? 'pairs' : 'read';
      else if (g === 'build' && buildable < 2) list[i] = 'pairs';
    }
    if (list.length > 2 && list[2] === list[1]) list[2] = list[1] === 'say' ? 'pairs' : 'say';
    if (had) {
      Object.keys(had).forEach(function (g) {
        if (!had[g] || g === 'meet' || g === 'ok' || !has(GAMES, g) || list.indexOf(g) >= 0) return;
        for (var j = 1; j < list.length; j++) if (!had[list[j]]) { list[j] = g; return; }
      });
    }
    return list;
  };

  /* ---------- progress ---------- */
  C.complete = function (state, s) {
    if (!s) return false;
    if (s.kind === 'check') return !!(state.checks && state.checks[s.id]);
    var had = (state.done || {})[s.id] || {};
    /* once all of a night's games were played it stays done, whatever track is chosen afterwards */
    if (had.ok) return true;
    var gs = C.gamesFor(s, state.track || 'L2', had);
    return gs.length > 0 && gs.every(function (k) { return had[k]; });
  };
  C.progress = function (state, g) {
    var list = C.sessions(g);
    var units = C.units(g).map(function (u) {
      var mine = list.filter(function (s) { return s.unit === u.n; });
      var check = mine.filter(function (s) { return s.kind === 'check'; })[0];
      return { n: u.n, gn: u.gn, es: u.es, lit: C.complete(state, check), nights: mine.filter(function (s) { return s.kind === 'night'; }).length };
    });
    var done = list.filter(function (s) { return C.complete(state, s); }).length;
    var lit = units.filter(function (u) { return u.lit; }).length;
    return { units: units, lit: lit, total: units.length, steps: list.length, done: done, shines: units.length > 0 && lit === units.length };
  };
  /* stars earned: one per game played, plus the big stars' 1 to 3 */
  C.stars = function (state) {
    var n = 0;
    Object.keys(state.done || {}).forEach(function (id) { var had = state.done[id] || {}; Object.keys(had).forEach(function (k) { if (had[k] && GAMES[k]) n++; }); });
    Object.keys(state.checks || {}).forEach(function (id) { n += (state.checks[id] && state.checks[id].stars) || 0; });
    return n;
  };
  /* the next step to play in a grade: the first one not complete that is written */
  C.next = function (state, g) {
    var list = C.sessions(g);
    for (var i = 0; i < list.length; i++) if (!C.complete(state, list[i])) return list[i].ready ? list[i] : null;
    return null;
  };
  /* words learned: every word of every night completed (of one grade, when it is given) */
  C.learned = function (state, g) {
    var out = [];
    Object.keys(state.done || {}).forEach(function (id) {
      if (g && C.gradeOf(id) !== g) return;
      var s = C.session(id);
      if (s && C.complete(state, s)) (s.data.words || []).forEach(function (w) { if (out.indexOf(w.gn) < 0) out.push(w.gn); });
    });
    return out;
  };

  /* ---------- pictures ----------
     A picture is up to six outlined fills, then cheeks (pink), shine (white), solid ink and ink lines: always the same
     ten slots, so every screen draws any picture with the same markup. */
  var NONE = 'M0 0';
  C.pic = function (key) {
    var p = (window.__tpPics || {})[key];
    var out = { has: !!p, pink: NONE, white: NONE, ink: NONE, line: NONE, lineW: 3, rule: 'nonzero' };
    for (var i = 0; i < 6; i++) out['f' + i] = { d: NONE, fill: 'none' };
    if (!p) return out;
    (p.f || []).forEach(function (l, i) { if (i < 6) out['f' + i] = { d: l.d, fill: l.fill }; });
    out.pink = p.pink || NONE; out.white = p.white || NONE; out.ink = p.ink || NONE; out.line = p.line || NONE;
    out.lineW = p.lineW || 3;
    out.rule = p.evenodd ? 'evenodd' : 'nonzero';
    return out;
  };
  /* a word as screens use it: its picture, its letters, its syllables */
  C.word = function (w) {
    if (!w) return null;
    return Object.assign({}, w, { gn: C.norm(w.gn), picKey: w.pic || w.gn, pic: C.pic(w.pic || w.gn), syl: w.syl || [C.norm(w.gn)] });
  };

  /* other words to choose from: first the unit's, then the grade's; never one with the same picture or the same word,
     nor one that holds the target or is held in it (po «cinco» and che po «mi mano» would both be right) */
  function bare(s) { return C.fold(s).replace(/[.,;:!?¿¡…"«»]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function within(a, b) { return (' ' + a + ' ').indexOf(' ' + b + ' ') >= 0; }
  /* Pictures that look alike (by picture key): never two of one group side by side. */
  C.LOOKALIKE = [['maitei', 'jajotopáta'], ['jasy', 'pyhare'], ['pyhare', 'pytũ', 'eichu', 'nandupysa', 'mborevirape'],
    ['kuarahy', "ko'ẽ", "ka'aru"], ['sy', "mbo'ehára"], ['ru', 'ramói']];
  function alike(a, b) {
    if (a === b) return true;
    for (var i = 0; i < C.LOOKALIKE.length; i++) if (C.LOOKALIKE[i].indexOf(a) >= 0 && C.LOOKALIKE[i].indexOf(b) >= 0) return true;
    return false;
  }
  /* Taken in bands, each shuffled with the seed: the words met tonight (night: its number in the unit), then the
     unit's earlier nights, then the grade's earlier units, and only if still short the nights and units to come, so
     that a child is mostly asked to tell apart words already met. opts.voiced keeps only words that can be heard. */
  C.distractors = function (word, g, unitN, n, seed, night, opts) {
    opts = opts || {};
    var bands = [[], [], [], []];
    C.units(g).forEach(function (u) {
      (u.nights || []).forEach(function (nt, k) {
        var b = u.n === unitN ? (!night ? 1 : k + 1 === night ? 0 : k + 1 < night ? 1 : 3) : u.n < unitN ? 2 : 3;
        (nt.words || []).forEach(function (w) { bands[b].push(w); });
      });
    });
    var seen = {}, out = [];
    var target = bare(word.gn), tpic = word.picKey || (typeof word.pic === 'string' ? word.pic : '') || word.gn;
    seen['p:' + tpic] = 1;
    seen['w:' + target] = 1;
    bands.forEach(function (band, bi) {
      var cands = [];
      band.forEach(function (w) {
        var k = 'p:' + (w.pic || w.gn), t = bare(w.gn);
        if (seen[k] || seen['w:' + t] || within(t, target) || within(target, t)) return;
        if (opts.voiced && !C.voiced(w)) return;
        seen[k] = 1; seen['w:' + t] = 1;
        cands.push(w);
      });
      C.shuffle(cands, seed + (bi ? 'b' + bi : 'n')).forEach(function (w) {
        if (out.length >= n) return;
        var p = w.pic || w.gn;
        if (alike(p, tpic) || out.some(function (o) { return alike(p, o.pic || o.gn); })) return;
        out.push(w);
      });
    });
    return out.slice(0, n).map(C.word);
  };

  /* ---------- the Milky Way path of the grade screen (Main) ----------
     Six places along the band: where the tapir comes from (the last big star, or the moon at the start of a grade),
     the unit's nights, its big star, and the first night after it. The tapir stands on the step being played. */
  C.MAIN_BAND = [
    [[-50, 690], [-28.7, 670.3], [32.7, 601.2], [78, 572]],
    [[78, 572], [123.3, 542.8], [185, 539.5], [222, 515]],
    [[222, 515], [259, 490.5], [309, 452.2], [300, 425]],
    [[300, 425], [291, 397.8], [194.7, 378.2], [168, 352]],
    [[168, 352], [141.3, 325.8], [122.2, 293.3], [140, 268]],
    [[140, 268], [157.8, 242.7], [226.7, 226.3], [275, 200]],
    [[275, 200], [323.3, 173.7], [404.2, 125], [430, 110]]
  ];
  /* the six places, as fractions of the band's length: (78,572) (222,515) (300,425) (168,352) (140,268) (275,200),
     clear of the header above and of tonight's card below */
  C.MAIN_STOPS = [0.1685, 0.3185, 0.439, 0.587, 0.68, 0.827];
  C.path = function (state, g) {
    var list = C.sessions(g);
    var cur = C.next(state, g);
    var curIx = cur ? list.indexOf(list.filter(function (s) { return s.id === cur.id; })[0]) : -1;
    /* the unit on screen: the one of the step being played, else (all done) the last one */
    var open = list.filter(function (s) { return !C.complete(state, s); })[0] || null;
    var unitN = cur ? cur.unit : open ? open.unit : (list.length ? list[list.length - 1].unit : 1);
    if (state.walk && state.walk.to) { var w = C.session(state.walk.to); if (w && C.gradeOf(w.id) === g) unitN = w.unit; }
    var mine = list.filter(function (s) { return s.unit === unitN; });
    var before = list.filter(function (s) { return s.unit === unitN - 1 && s.kind === 'check'; })[0] || null;
    var after = list.filter(function (s) { return s.unit === unitN + 1; })[0] || null;
    var stops = [before ? { s: before, role: 'from' } : { s: null, role: 'start' }];
    mine.forEach(function (s) { stops.push({ s: s, role: s.kind }); });
    stops.push(after ? { s: after, role: 'ahead' } : { s: null, role: 'gate' });
    return { unit: C.unit(g, unitN), stops: stops.slice(0, 6), cur: cur, curIx: curIx };
  };

  /* ---------- the sky figure of a grade ----------
     Drawn in a 100 box: the lit stars (one per unit finished), the stars still dark, the lines between lit stars,
     the other lines, and the figure's drawing, which shows in full once every star is lit. */
  C.sky = function (key) { return (window.__tpSky || {})[key] || null; };
  C.figure = function (key, lit) {
    var f = C.sky(key);
    var out = { on: NONE, off: NONE, lines: NONE, linesOn: NONE, outline: NONE, all: false, count: 0, gn: '', es: '', outlineO: 0.3, fillO: 0 };
    if (!f) return out;
    var on = '', off = '', lines = '', linesOn = '';
    f.stars.forEach(function (p, i) { var d = C.starD(p[0], p[1], i < lit ? 7.5 : 5.5, 0.5); if (i < lit) on += d; else off += d; });
    f.lines.forEach(function (l) {
      var a = f.stars[l[0]], b = f.stars[l[1]];
      var seg = 'M' + a[0] + ' ' + a[1] + 'L' + b[0] + ' ' + b[1];
      if (l[0] < lit && l[1] < lit) linesOn += seg; else lines += seg;
    });
    var all = lit >= f.stars.length;
    return { on: on || NONE, off: off || NONE, lines: lines || NONE, linesOn: linesOn || NONE, outline: f.figure, all: all, count: f.stars.length,
      gn: f.gn, es: f.es, outlineO: all ? 1 : 0.35, fillO: all ? 0.18 : 0, when: f.when, who: f.who, note: f.note };
  };
  /* a state with everything before the n-th step of a grade done: what each artboard shows on its own */
  C.sample = function (g, track, upto, extra) {
    var st = { screen: 'Main', started: true, grade: g, track: track || 'L2', done: {}, checks: {}, cur: null, game: null, walk: null };
    C.sessions(g).slice(0, upto).forEach(function (s) {
      if (s.kind === 'check') st.checks[s.id] = { score: 5, of: 5, stars: 3 };
      else { var had = { ok: 1 }; C.gamesFor(s, st.track).forEach(function (k) { had[k] = 1; }); st.done[s.id] = had; }
    });
    return Object.assign(st, extra || {});
  };

  /* the written grade to offer while a grade's nights are being written: the nearest one below, else the first */
  C.nearestReady = function (g) {
    var list = C.grades();
    var i = ORDER.indexOf(g);
    for (var k = i - 1; k >= 0; k--) if (list[k].ready) return list[k];
    for (var j = 0; j < list.length; j++) if (list[j].ready && list[j].code !== g) return list[j];
    return null;
  };

  /* ---------- state ---------- */
  C.now = function () { return window.__tpNow || Date.now(); };
  C.fresh = function () {
    return { screen: 'Welcome', started: false, grade: null, track: null, done: {}, checks: {}, cur: null, game: null, walk: null };
  };
  /* Where each screen's own back button goes; the phone's Back does the same on the site. The path (Main) and the
     first screen have none: there Back leaves. */
  C.UP = { Grade: 'Welcome', Home: 'Grade', Ready: 'Home', Tonight: 'Main', Sky: 'Main', Grownups: 'Main', Check: 'Main',
    Shine: 'Main', Meet: 'Tonight', Pick: 'Tonight', Pairs: 'Tonight', Build: 'Tonight', Say: 'Tonight', Letters: 'Tonight',
    Story: 'Tonight', YesNo: 'Tonight', Catch: 'Tonight' };
  /* The child's progress kept on this device, when the page asks for it (the site sets window.__tpSite.key; the canvas
     does not): the grade, the language of home, the nights and big stars done, the voice switch. Never the screen in
     play: a child who comes back starts on the path. Nothing leaves the device.
     - Each step is kept under its grade and its name (its unit's name, and the night's), never its number, so a unit
       put in between, taken out or replaced later does not move the stars onto other lessons. A unit or a night
       renamed, or moved to another grade, is written in window.__tpRenamed (tp-grades.js), old name → new;
       tests/test-names.js fails when a name the site has used disappears without that.
     - A step this copy of the app does not have stays in the record as it is, for a copy that has it (an older or a
       newer version of the app open at the same time, in another tab or on the home screen).
     - Progress is only ever added: what another copy kept in the meantime is kept too. The grade, the language of home
       and the voice are written by the copy that last changed them, so a copy left open does not put its own back.
     - «Empezar de cero» (the page offers it when the path keeps breaking on what was kept) sets the record aside, and
       every copy open at the time starts over with it. The record comes back the first time the app opens after it
       has changed (a new version, which may mend what broke); with the same app it stays aside. */
  var KEEP = 2, kept = '', base = null, wipes = 0;
  var FRESH = { grade: null, track: null, voice: true };
  function keyOf() { var site = window.__tpSite; return site && typeof site.key === 'string' && site.key ? site.key : ''; }
  /* does this page keep the progress? (the grown-ups' screen says where and how) */
  C.keeps = function () { return !!keyOf(); };
  function plain(x) { return !!x && typeof x === 'object' && !Array.isArray(x); }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function get(k) { return window.localStorage.getItem(k); }
  /* what a step is, in words that stay when the steps are numbered again */
  function what(s) {
    if (!s) return '';
    var u = C.unit(s.grade, s.unit);
    var un = u && u.gn ? u.gn : '';
    if (!un) return '';
    return s.kind === 'check' ? un : s.gn ? un + ' / ' + s.gn : '';
  }
  /* the name a step is kept under: 'g1:Maitei' (a unit's big star), 'g1:Maitei / Che réra' (a night) */
  C.keptName = function (s) { var w = what(s); return w ? s.grade + ':' + w : ''; };
  /* one step of the renames: the new name, null for a step taken out on purpose, undefined when there is no entry (a
     unit's entry renames its nights too) */
  function renameOf(k) {
    var renamed = plain(window.__tpRenamed) ? window.__tpRenamed : {};
    if (has(renamed, k)) return typeof renamed[k] === 'string' ? renamed[k] : null;
    var cut = k.indexOf(' / ');
    if (cut > 0 && has(renamed, k.slice(0, cut))) {
      var to = renamed[k.slice(0, cut)];
      return typeof to === 'string' ? to + k.slice(cut) : null;
    }
    return undefined;
  }
  /* the step of this copy's lessons a kept name stands for, through the renames: null when it was taken out on
     purpose, undefined when this copy does not have it */
  C.keptStep = function (name, kind) {
    var k = String(name || '');
    for (var n = 0; n < 9; n++) {
      var to = renameOf(k);
      if (to === undefined) break;
      if (to === null) return null;
      k = to;
    }
    load();
    var at = k.indexOf(':'), g = k.slice(0, at);
    if (at < 1 || ORDER.indexOf(g) < 0) return undefined;
    var list = C.sessions(g);
    for (var i = 0; i < list.length; i++) if (list[i].kind === kind && C.keptName(list[i]) === k) return list[i];
    return undefined;
  };
  function better(a, b) { return !a ? b : !b ? a : b.stars > a.stars || (b.stars === a.stars && b.score > a.score) ? b : a; }
  function games(a, b) { return Object.assign({}, a || {}, b || {}); }
  /* a night's games as kept (a game this copy does not know is kept too, for the copy that does) */
  function flagsOf(x) {
    var out = {}, any = false;
    if (plain(x)) Object.keys(x).forEach(function (k) { if (x[k] && k !== '__proto__' && k.length <= 40) { out[k] = 1; any = true; } });
    return any ? out : null;
  }
  function resultOf(c) {
    if (!plain(c)) return null;
    var n = function (x) { return typeof x === 'number' && isFinite(x) && x >= 0 ? x : 0; };
    return { score: n(c.score), of: n(c.of), stars: Math.min(3, Math.max(1, Math.round(n(c.stars)) || 1)) };
  }
  function put(map, g, name, val, join) {
    if (!val || !name || name === '__proto__' || name.length > 200) return;
    var m = has(map, g) ? map[g] : (map[g] = {});
    m[name] = join(has(m, name) ? m[name] : null, val);
  }
  /* a kept record, as this version writes it: { v, started, grade, track, voice, wipes, done: { grade: { name: games } },
     checks: { grade: { name: result } } }. The first version (steps by number, their names beside them) is read too.
     null when nothing usable is there; 'newer' for a record a newer version of the app wrote, which this one leaves be */
  function recordOf(text) {
    var o;
    try { o = JSON.parse(text || 'null'); } catch (e) { return null; }
    if (!plain(o)) return null;
    if (typeof o.v === 'number' && o.v > KEEP) return 'newer';
    if (o.v !== 1 && o.v !== KEEP) return null;
    load();
    var r = { v: KEEP, done: {}, checks: {} };
    if (o.started === true) r.started = true;
    if (typeof o.grade === 'string' && ORDER.indexOf(o.grade) >= 0) r.grade = o.grade;
    if (o.track === 'L1' || o.track === 'L2' || o.track === 'BI') r.track = o.track;
    if (o.voice === false) r.voice = false;
    if (typeof o.wipes === 'number' && isFinite(o.wipes) && o.wipes >= 1) r.wipes = Math.floor(o.wipes);
    [['done', 'night', flagsOf, games], ['checks', 'check', resultOf, better]].forEach(function (p) {
      var src = o[p[0]];
      if (!plain(src)) return;
      if (o.v === 1) {
        var names = plain(o.what) ? o.what : {};
        Object.keys(src).forEach(function (id) {
          var s = C.session(id);
          var name = has(names, id) && typeof names[id] === 'string' && names[id] ? names[id] : s && s.kind === p[1] ? what(s) : '';
          put(r[p[0]], C.gradeOf(id), name, p[2](src[id]), p[3]);
        });
      } else {
        Object.keys(src).forEach(function (g) {
          if (!/^[a-z0-9]{1,12}$/.test(g) || !plain(src[g])) return;
          Object.keys(src[g]).forEach(function (name) { put(r[p[0]], g, name, p[2](src[g][name]), p[3]); });
        });
      }
    });
    return r;
  }
  /* a record as text, always in the same order (the same record is the same text) */
  function textOf(r) {
    var o = { v: KEEP };
    if (r.started) o.started = true;
    if (r.grade) o.grade = r.grade;
    if (r.track) o.track = r.track;
    if (r.voice === false) o.voice = false;
    if (r.wipes) o.wipes = r.wipes;
    if (r.made) o.made = r.made;
    ['done', 'checks'].forEach(function (k) {
      var by = {};
      Object.keys(r[k] || {}).sort().forEach(function (g) {
        var names = Object.keys(r[k][g]).sort(), m = {};
        names.forEach(function (n) { m[n] = r[k][g][n]; });
        if (names.length) by[g] = m;
      });
      o[k] = by;
    });
    return JSON.stringify(o);
  }
  /* the steps of one record added to another; the grade, the language of home and the voice stay the first one's
     unless it has none */
  function merge(into, from) {
    ['done', 'checks'].forEach(function (k) {
      Object.keys(from[k]).forEach(function (g) {
        Object.keys(from[k][g]).forEach(function (n) { put(into[k], g, n, from[k][g][n], k === 'done' ? games : better); });
      });
    });
    if (from.started) into.started = true;
    if (!into.grade && from.grade) into.grade = from.grade;
    if (!into.track && from.track) into.track = from.track;
    if ((from.wipes || 0) > (into.wipes || 0)) into.wipes = from.wipes;
    return into;
  }
  /* a renamed step's old name gives way to its new one, and a step taken out on purpose goes (by this copy's renames:
     a copy that does not know them leaves the names as they are) */
  function tidy(r) {
    [['done', 'night', games], ['checks', 'check', better]].forEach(function (p) {
      var map = r[p[0]];
      Object.keys(map).forEach(function (g) {
        Object.keys(map[g]).forEach(function (n) {
          var s = C.keptStep(g + ':' + n, p[1]);
          if (s === undefined || (s && C.keptName(s) === g + ':' + n)) return;
          var val = map[g][n];
          delete map[g][n];
          if (s) put(map, s.grade, what(s), val, p[2]);
        });
        if (map[g] && !Object.keys(map[g]).length) delete map[g];
      });
    });
  }
  /* what a record means for this copy: the steps it has, by number (the others stay out of play) */
  function read(key) {
    var r = recordOf(get(key));
    if (!r || r === 'newer') return null;
    var out = { started: !!r.started, grade: r.grade || null, track: r.track || null, done: {}, checks: {},
      voice: r.voice !== false, wipes: r.wipes || 0 };
    Object.keys(r.done).forEach(function (g) {
      Object.keys(r.done[g]).forEach(function (n) {
        var s = C.keptStep(g + ':' + n, 'night');
        if (!s) return;
        var flags = {};
        Object.keys(r.done[g][n]).forEach(function (k) { if (k === 'ok' || has(GAMES, k)) flags[k] = 1; });
        if (Object.keys(flags).length) out.done[s.id] = games(out.done[s.id], flags);
      });
    });
    Object.keys(r.checks).forEach(function (g) {
      Object.keys(r.checks[g]).forEach(function (n) {
        var s = C.keptStep(g + ':' + n, 'check');
        if (s) out.checks[s.id] = better(out.checks[s.id], r.checks[g][n]);
      });
    });
    return out;
  }
  /* two records of progress as one: every night and game of both, the better result of each big star */
  function union(a, b) {
    var done = {}, checks = {};
    [a.done || {}, b.done || {}].forEach(function (d) {
      Object.keys(d).forEach(function (id) { done[id] = Object.assign({}, done[id] || {}, d[id]); });
    });
    [a.checks || {}, b.checks || {}].forEach(function (c) {
      Object.keys(c).forEach(function (id) { checks[id] = better(checks[id], c[id]); });
    });
    return { done: done, checks: checks };
  }
  /* which version of the app this is (the site makes it from the files it loaded): '' when the page cannot tell */
  function build() {
    var site = window.__tpSite;
    try { return site && typeof site.build === 'function' ? String(site.build() || '') : ''; } catch (e) { return ''; }
  }
  /* a record set aside by «Empezar de cero» comes back once the app has changed since; with the same app it stays
     aside, so that it does not break the path again. When the page cannot tell which version it is (a download that
     did not come through), nothing moves; a record set aside on such a visit takes the version of the next visit
     that can tell, and stays aside */
  function bringBack(key) {
    var text = get(key + '-aside');
    if (text == null) return;
    var made = build(), at = '', o = null;
    try { o = JSON.parse(text); at = String((o && o.made) || ''); } catch (e) {}
    if (!made || made === at) return;
    if (!at) {
      if (plain(o) && !(typeof o.v === 'number' && o.v > KEEP)) { o.made = made; window.localStorage.setItem(key + '-aside', JSON.stringify(o)); }
      return;
    }
    var aside = recordOf(text), now = recordOf(get(key));
    if (aside === 'newer' || now === 'newer') return;
    if (aside) window.localStorage.setItem(key, textOf(merge(now || { v: KEEP, done: {}, checks: {} }, aside)));
    window.localStorage.removeItem(key + '-aside');
  }
  C.store = function (state) {
    var key = keyOf();
    if (!key || !state) return;
    var mine = { started: !!state.started, grade: state.grade || null, track: state.track || null,
      done: state.done || {}, checks: state.checks || {}, voice: state.voice !== false };
    try {
      var text = JSON.stringify(mine);
      if (text === kept) return;
      var was = get(key), r = recordOf(was);
      /* a record a newer version of the app wrote, or «Empezar de cero» used in another copy since this one started
         (what this one holds is from before it, and the 'storage' event starts this copy over too): nothing is written */
      if (r === 'newer' || (r && (r.wipes || 0) > wipes)) return;
      var had = !!r;
      if (!r) r = { v: KEEP, done: {}, checks: {} };
      tidy(r);
      Object.keys(mine.done).forEach(function (id) {
        var s = C.session(id);
        if (s && s.kind === 'night') put(r.done, s.grade, what(s), flagsOf(mine.done[id]), games);
      });
      Object.keys(mine.checks).forEach(function (id) {
        var s = C.session(id);
        if (s && s.kind === 'check') put(r.checks, s.grade, what(s), resultOf(mine.checks[id]), better);
      });
      if (mine.started) r.started = true;
      if (wipes > (r.wipes || 0)) r.wipes = wipes;
      /* the grade, the language of home and the voice: this copy's when it changed them since it last wrote (or when
         nothing was kept), else what is kept */
      var b = base || FRESH;
      ['grade', 'track', 'voice'].forEach(function (f) { if (!had || mine[f] !== b[f]) r[f] = mine[f]; });
      var out = textOf(r);
      if (out !== was) window.localStorage.setItem(key, out);
      kept = text;
      base = { grade: mine.grade, track: mine.track, voice: mine.voice };
    } catch (e) { /* storage full, blocked or private: the game goes on, unkept */ }
  };
  /* what was kept, as the state to start from (on the path); null when nothing usable was kept */
  C.restore = function () {
    var key = keyOf();
    if (!key) return null;
    kept = '';
    base = FRESH;
    wipes = 0;
    try { bringBack(key); } catch (e) {}
    var o;
    try { o = read(key); } catch (e) { o = null; }
    if (!o) return null;
    wipes = o.wipes;
    base = { grade: o.grade, track: o.track, voice: o.voice };
    var st = C.fresh();
    st.grade = o.grade;
    st.track = o.track;
    st.done = o.done;
    st.checks = o.checks;
    if (!o.voice) st.voice = false;
    st.started = o.started || !!st.grade;
    st.screen = st.grade && st.track ? 'Main' : 'Welcome';
    return st;
  };
  /* what another copy of the app has kept since (a 'storage' event), added to this one's progress: the change to make,
     or null when there is nothing new. When «Empezar de cero» was used in the other copy, this one starts over too,
     rather than put back what was set aside */
  C.withKept = function (state) {
    var key = keyOf();
    var o;
    try { o = key && state ? read(key) : null; } catch (e) { o = null; }
    if (!o) return null;
    if (o.wipes > wipes) {
      wipes = o.wipes;
      kept = '';
      base = { grade: null, track: null, voice: o.voice };
      return Object.assign(C.fresh(), { voice: o.voice });
    }
    var both = union(state, o);
    var same = JSON.stringify(both.done) === JSON.stringify(state.done || {}) && JSON.stringify(both.checks) === JSON.stringify(state.checks || {});
    return same ? null : { done: both.done, checks: both.checks };
  };
  /* «Empezar de cero»: the kept progress is set aside (see above), and the record says so, so that every copy of the
     app starts over (the page offers it when a screen keeps breaking on what was kept) */
  C.forget = function () {
    var key = keyOf();
    kept = '';
    if (!key) return;
    var count = wipes + 1;
    try {
      var now = recordOf(get(key)), aside = recordOf(get(key + '-aside'));
      if (now === 'newer') now = null;
      count = Math.max(wipes, (now && now.wipes) || 0) + 1;
      if (now && (Object.keys(now.done).length || Object.keys(now.checks).length || now.grade)) {
        var keep = aside && aside !== 'newer' ? merge(now, aside) : now;
        keep.made = build();
        window.localStorage.setItem(key + '-aside', textOf(keep));
      }
      wipes = count;
      var mark = { v: KEEP, done: {}, checks: {}, wipes: wipes };
      if (now && now.voice === false) mark.voice = false;
      window.localStorage.setItem(key, textOf(mark));
      base = { grade: null, track: null, voice: mark.voice !== false };
    } catch (e) {
      /* the device's storage is full: the record goes all the same (set aside first, if there was room for that), and
         the mark that starts the other copies over is written in the room it leaves */
      try {
        window.localStorage.removeItem(key);
        wipes = count;
        window.localStorage.setItem(key, textOf({ v: KEEP, done: {}, checks: {}, wipes: wipes }));
      } catch (e2) {}
    }
  };
  /* what every screen reads: the grade, the step in play, its games, the stars */
  /* Mborevi'i's own lines, spoken as well as written: the clips are in the shared sound file (tp-sound-ui.js, keyed
     'u:' + the folded line), and say() plays one when it is there (false when it is not: the written line stays) */
  C.VOICE = {
    hello: "Maitei! Che réra Mborevi'i.",
    good: 'Iporãite!',
    again: "Eha'ã jey",
    star: 'Rehupyty peteĩ mbyja.',
    big: 'Mbyja guasu omimbi!',
    joy: "Vy'apavẽ!"
  };
  C.say = function (line) {
    var S = window.tpSound;
    if (!S) return false;
    /* the tap wakes the sound even when the line's clip has not arrived yet, so the next line can play */
    S.unlock();
    var k = 'u:' + C.fold(line || '');
    if (!S.has(k)) return false;
    return S.play(k);
  };
  /* Mborevi'i's lines are asked for as soon as this file and the sound have both run (whichever runs second asks: the
     sound does the same), not when the first screen draws: on a slow phone they are then there for the first tap */
  if (window.tpSound && typeof window.tpSound.need === 'function') window.tpSound.need('ui');
  C.view = function (state) {
    load();
    var g = state.grade || ORDER[0];
    /* the grade's sound file comes the first time the grade is in use; the voice switch of the grown-ups' screen
       (state.voice false: the synthetic voice is off) applies to every clip of a voice model */
    var snd = window.tpSound;
    if (snd) {
      if (typeof snd.need === 'function') { snd.need('ui'); if (state.grade) snd.need(state.grade); }
      if (typeof snd.synthetic === 'function') snd.synthetic(state.voice !== false);
    }
    var cur = (state.cur && C.session(state.cur)) || C.next(state, g);
    var had = (cur && (state.done || {})[cur.id]) || {};
    var games = cur ? C.gamesFor(cur, state.track || 'L2', had) : [];
    return Object.assign({}, state, {
      grade: g,
      gradeSet: !!state.grade,
      meta: C.meta(g),
      step: cur,
      games: games.map(function (k) { return Object.assign({ key: k, done: !!had[k] }, GAMES[k]); }),
      game: state.game || (games.filter(function (k) { return !had[k]; })[0] || null),
      stars: C.stars(state),
      progress: C.progress(state, g),
      path: C.path(state, g)
    });
  };
  C.handlers = function (get, set) {
    /* a second tap within a moment of a screen change is the same tap: the next screen keeps its button in the same
       place, and a double tap would otherwise answer it too */
    var last = 0, free = false;
    function guard() { if (free) return true; var t = Date.now(); if (t - last < 400) return false; last = t; return true; }
    function moveTo(st, to) {
      var out = { screen: to, started: st.started || to !== 'Welcome', earned: null };
      if (to === 'Main') { out.cur = null; out.game = null; } else out.walk = null;
      return out;
    }
    /* each tap that moves on wakes the sound (iPhones let a page start it only inside a tap) */
    function wake() { var S = window.tpSound; if (S && S.unlock) { try { S.unlock(); } catch (e) {} } }
    var api = {
      /* to the path: the step opened there is put down (a night played again is not tonight's); a walk only lives on
         the path */
      go: function (to) {
        if (!guard()) return;
        wake();
        set(function (st) { return moveTo(st, to); });
      },
      /* the phone's Back (on the site): what the screen's own close button does, when the screen says so (act.leave,
         set by a game or the big star while it is open: one that is over keeps its star), else one screen back, where
         the screen's own back button goes; nothing on the path. It always moves: the double-tap guard does not apply */
      leave: null,
      back: function () {
        var own = api.leave;
        api.leave = null;
        if (typeof own === 'function') {
          free = true;
          try { own(); } finally { free = false; }
          return;
        }
        set(function (st) { var to = C.UP[st.screen]; return to ? moveTo(st, to) : null; });
      },
      save: function (patch) { set(function () { return patch; }); },
      /* a grade picked on the sky: its own path comes back, kept per grade */
      grade: function (g) { if (!guard()) return; set(function (st) { return { grade: g, cur: null, game: null, walk: null, screen: st.track ? 'Main' : 'Home' }; }); },
      /* a grade picked while starting: then the language of home */
      startGrade: function (g) { if (!guard()) return; set(function () { return { grade: g, cur: null, game: null, walk: null, screen: 'Home' }; }); },
      track: function (t) { if (!guard()) return; set(function () { return { track: t, screen: 'Ready' }; }); },
      open: function (id, game) {
        if (!guard()) return;
        wake();
        set(function () {
          var s = C.session(id);
          var screen = s && s.kind === 'check' ? 'Check' : game ? (GAMES[game] || {}).screen || 'Tonight' : 'Tonight';
          return { cur: id, game: game || null, screen: screen, walk: null, earned: null };
        });
      },
      /* a game finished: its star; when it was the night's last game, back to the path and the tapir walks on. The
         next screen keeps its button where this one's was: the second tap of a double tap does not answer it too
         (the guard is set, though the star itself is never held back by it) */
      finish: function (kind) {
        if (!free) last = Date.now();
        wake();
        set(function (st) {
          var id = st.cur || (C.next(st, st.grade || ORDER[0]) || {}).id;
          if (!id) return { screen: 'Main', cur: null, game: null, earned: null };
          var s = C.session(id);
          var was = C.complete(st, s);
          var done = Object.assign({}, st.done || {});
          var had = Object.assign({}, done[id] || {});
          had[kind] = 1;
          var gs = C.gamesFor(s, st.track || 'L2', had);
          var rest = gs.filter(function (k) { return !had[k]; });
          if (!rest.length || was) had.ok = 1;
          done[id] = had;
          /* the star just earned lands on tonight's list (earned: never kept on the device) */
          var earned = { kind: kind, at: C.now() };
          /* a night played again: back to its games; there is nowhere new to walk */
          if (was) return { done: done, game: null, screen: 'Tonight', earned: earned };
          if (rest.length) return { done: done, game: rest[0], screen: 'Tonight', earned: earned };
          var nx = C.after(id);
          return { done: done, game: null, cur: null, screen: 'Main', earned: null, walk: { from: id, to: nx ? nx.id : null, at: C.now() } };
        });
      },
      /* the big star: one to three stars by the score; it always lights, a star is never taken away (the guard is
         set as for a game) */
      checked: function (score, of) {
        if (!free) last = Date.now();
        wake();
        set(function (st) {
          var id = st.cur || (C.next(st, st.grade || ORDER[0]) || {}).id;
          var checks = Object.assign({}, st.checks || {});
          var stars = of ? (score / of >= 0.9 ? 3 : score / of >= 0.6 ? 2 : 1) : 1;
          var had = checks[id];
          if (!had || had.stars <= stars) checks[id] = { score: score, of: of, stars: stars };
          /* a big star played again was already lit: nothing new lights, back to the path */
          if (had) return { checks: checks, cur: null, game: null, screen: 'Main', walk: null };
          var nx = C.after(id);
          return { checks: checks, cur: null, game: null, screen: 'Shine', walk: { from: id, to: nx ? nx.id : null, at: C.now() } };
        });
      },
      walked: function () { set(function () { return { walk: null }; }); }
    };
    return api;
  };
})();
