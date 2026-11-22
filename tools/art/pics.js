// Word pictures for Mborevi Rape: each picture is drawn in a 100x100 box as layers.
// Usage: node -e "require('./tools/art/pics.js').exportJs('project/tp-pics.js')" writes the app's pictures;
// node tools/art/pics.js writes a preview sheet (pics.html) next to this file.
// Layer slots (drawing order): f0..f5 = filled shapes outlined in ink; pink = cheeks/tongue (no outline);
// white = highlights (no outline); ink = solid ink shapes (eyes, noses); line = ink strokes only (mouths, details).
const INK = '#2A1B3D';
const n = (v) => +(+v).toFixed(1);
const C = (cx, cy, r) => `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0Z`;
const E = (cx, cy, rx, ry) => `M${n(cx - rx)} ${n(cy)}a${n(rx)} ${n(ry)} 0 1 0 ${n(2 * rx)} 0a${n(rx)} ${n(ry)} 0 1 0 ${n(-2 * rx)} 0Z`;
const RR = (x, y, w, h, r) => `M${n(x + r)} ${n(y)}h${n(w - 2 * r)}a${n(r)} ${n(r)} 0 0 1 ${n(r)} ${n(r)}v${n(h - 2 * r)}a${n(r)} ${n(r)} 0 0 1 ${n(-r)} ${n(r)}h${n(-(w - 2 * r))}a${n(r)} ${n(r)} 0 0 1 ${n(-r)} ${n(-r)}v${n(-(h - 2 * r))}a${n(r)} ${n(r)} 0 0 1 ${n(r)} ${n(-r)}Z`;
const P = (pts) => 'M' + pts.map((p) => n(p[0]) + ' ' + n(p[1])).join('L') + 'Z';
function STAR(cx, cy, r, inner = 0.5) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * inner : r;
    pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
  }
  return P(pts);
}
// cute face helpers (eyes + smile), returns {ink, line, pink, white}
function face(cx, cy, s = 1, o = {}) {
  const ex = 7 * s, ey = 0;
  const r = 3.2 * s;
  const ink = o.closed ? '' : C(cx - ex, cy + ey, r) + C(cx + ex, cy + ey, r);
  const white = o.closed ? '' : C(cx - ex + r * 0.35, cy - r * 0.35, r * 0.38) + C(cx + ex + r * 0.35, cy - r * 0.35, r * 0.38);
  let line = `M${n(cx - 3 * s)} ${n(cy + 5 * s)}q${n(3 * s)} ${n(3 * s)} ${n(6 * s)} 0`;
  if (o.closed) line += `M${n(cx - ex - 3 * s)} ${n(cy)}q${n(3 * s)} ${n(3 * s)} ${n(6 * s)} 0M${n(cx + ex - 3 * s)} ${n(cy)}q${n(3 * s)} ${n(3 * s)} ${n(6 * s)} 0`;
  const pink = o.noCheeks ? '' : E(cx - ex - 3.5 * s, cy + 5 * s, 3.2 * s, 2 * s) + E(cx + ex + 3.5 * s, cy + 5 * s, 3.2 * s, 2 * s);
  return { ink, white, line, pink };
}
const join = (...xs) => xs.filter(Boolean).join('');

const PICS = {};
function pic(key, layers, det = {}) {
  PICS[key] = { f: layers.map(([fill, d]) => ({ fill, d })), pink: det.pink || '', white: det.white || '', ink: det.ink || '', line: det.line || '' };
}

/* ---------- sky ---------- */
{
  // kuarahy: sun with rays and a face
  let rays = '';
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const x = 50 + Math.cos(a) * 38, y = 52 + Math.sin(a) * 38;
    rays += `M${n(50 + Math.cos(a) * 28)} ${n(52 + Math.sin(a) * 28)}L${n(x)} ${n(y)}`;
  }
  const f = face(50, 52, 1.1);
  pic('kuarahy', [['#FFB547', C(50, 52, 24)]], { ...f, line: rays + f.line });
  PICS.kuarahy.lineW = 5;
}
{
  // jasy: crescent moon with a sleepy face
  const d = 'M62 14C40 16 26 34 28 56C30 76 48 90 68 88C56 82 48 68 48 52C48 36 54 22 62 14Z';
  pic('jasy', [['#FFE7A3', d]], { ink: '', line: 'M37 50q3 3 6 0M40 63q3 3 6 0', pink: E(34, 58, 3.4, 2.2), white: '' });
}
{
  const f = face(50, 54, 0.9);
  pic('mbyja', [['#FFD34E', STAR(50, 52, 40, 0.5)]], f);
}
{
  const d = 'M24 70C12 70 8 58 16 52C14 40 28 34 36 40C40 28 60 26 66 38C78 34 90 44 86 56C94 60 90 72 80 70Z';
  const f = face(50, 56, 0.85);
  pic('arai', [['#F4F1FF', d]], f);
}
{
  const cloud = 'M24 52C12 52 8 40 16 34C14 22 28 16 36 22C40 10 60 8 66 20C78 16 90 26 86 38C94 42 90 54 80 52Z';
  const drops = 'M30 64c-3 5-5 8-5 10a5 5 0 0 0 10 0c0-2-2-5-5-10ZM50 70c-3 5-5 8-5 10a5 5 0 0 0 10 0c0-2-2-5-5-10ZM70 64c-3 5-5 8-5 10a5 5 0 0 0 10 0c0-2-2-5-5-10Z';
  pic('ama', [['#C9D8F5', cloud], ['#5AB8FF', drops]], { line: 'M40 38q3 3 6 0M56 38q3 3 6 0' });
}

/* ---------- animals ---------- */
{
  // jagua (dog): head with floppy ears
  const head = 'M26 50C26 30 38 22 50 22C62 22 74 30 74 50C74 68 64 80 50 80C36 80 26 68 26 50Z';
  const earL = 'M30 30C20 28 12 40 16 56C18 64 26 64 28 56C30 48 32 40 30 30Z';
  const earR = 'M70 30C80 28 88 40 84 56C82 64 74 64 72 56C70 48 68 40 70 30Z';
  const snout = E(50, 62, 13, 10);
  pic('jagua', [['#D9A066', head], ['#8C5A3C', earL + earR], ['#F6E2C6', snout]], {
    ink: C(40, 48, 3.6) + C(60, 48, 3.6) + E(50, 57, 4.6, 3.4),
    white: C(41.2, 46.8, 1.3) + C(61.2, 46.8, 1.3),
    line: 'M50 61v4M44 66q6 5 12 0',
    pink: E(50, 72, 3.4, 3.6) + E(33, 58, 3.4, 2) + E(67, 58, 3.4, 2),
  });
}
{
  // mbarakaja (cat)
  const head = 'M24 54C24 38 34 30 50 30C66 30 76 38 76 54C76 70 64 80 50 80C36 80 24 70 24 54Z';
  const ears = 'M28 42L26 16L46 32ZM72 42L74 16L54 32Z';
  pic('mbarakaja', [['#9E9AB8', ears], ['#B8B3D1', head]], {
    pink: 'M31 34L30 22L40 31ZM69 34L70 22L60 31Z' + E(34, 62, 3.6, 2.2) + E(66, 62, 3.6, 2.2),
    ink: C(40, 52, 3.6) + C(60, 52, 3.6) + 'M47 58h6l-3 3.5Z',
    white: C(41.2, 50.8, 1.3) + C(61.2, 50.8, 1.3),
    line: 'M50 61.5v2.5M45 65q2.5 3 5 0q2.5 3 5 0M30 58l-12-2M30 63l-12 2M70 58l12-2M70 63l12 2',
  });
}
{
  // ryguasu (hen)
  const body = 'M24 58C24 42 36 32 50 34C56 24 70 22 74 32C80 36 82 46 76 52C80 64 70 80 50 80C34 80 24 72 24 58Z';
  const comb = 'M60 26C58 18 64 14 67 20C69 13 76 14 75 22C80 20 82 26 78 30Z';
  const wing = 'M34 58C34 50 44 48 50 54C54 60 50 68 42 68C38 68 34 64 34 58Z';
  const beak = 'M78 40L90 44L78 48Z';
  pic('ryguasu', [['#E8463F', comb], ['#FFF6E8', body], ['#F2DCC0', wing], ['#FFB547', beak + 'M44 80l-2 10M56 80l2 10']], {
    ink: C(68, 38, 3.2), white: C(69, 37, 1.2), pink: E(66, 46, 3, 2), line: 'M38 90h8M54 90h8',
  });
}
{
  // vaka (cow)
  const head = 'M28 46C28 30 38 24 50 24C62 24 72 30 72 46C72 56 68 60 68 62L32 62C32 60 28 56 28 46Z';
  const muzzle = RR(30, 56, 40, 26, 13);
  const horns = 'M30 30C22 26 18 18 22 12C26 18 32 20 36 24ZM70 30C78 26 82 18 78 12C74 18 68 20 64 24Z';
  const ears = E(22, 40, 9, 5) + E(78, 40, 9, 5);
  const spot = 'M52 26C60 24 68 30 66 38C62 42 54 40 52 34Z';
  pic('vaka', [['#F2E6C9', horns], ['#FFFFFF', ears], ['#FFFFFF', head], ['#3B2A4A', spot], ['#FFB3C6', muzzle]], {
    ink: C(40, 42, 3.6) + C(60, 42, 3.6) + E(42, 68, 2.4, 3.2) + E(58, 68, 2.4, 3.2),
    white: C(41.2, 40.8, 1.3) + C(61.2, 40.8, 1.3),
    line: 'M44 75q6 4 12 0',
  });
}
{
  // kavaju (horse) — side head
  const head = 'M30 70C24 56 28 34 40 24C48 18 58 18 64 24C72 32 80 48 82 60C84 70 76 78 68 76C62 74 58 68 54 68L44 84L30 84Z';
  const mane = 'M40 24C36 16 44 10 48 18C50 10 58 10 58 18C60 14 66 16 64 24C56 22 46 22 40 24ZM36 30C28 34 26 48 28 60L34 50C34 42 36 36 36 30Z';
  const ear = 'M46 22L44 8L54 18Z';
  pic('kavaju', [['#8C5A3C', mane + ear], ['#C98B5A', head]], {
    ink: C(56, 40, 3.4) + E(74, 66, 2, 2.8),
    white: C(57.2, 38.8, 1.2),
    pink: E(66, 52, 3.4, 2.2),
    line: 'M66 72q4 2 8 0',
  });
}
{
  // guyra (bird) — round little bird
  const body = 'M22 56C22 38 36 28 52 28C66 28 78 38 78 54C78 70 66 80 50 80C34 80 22 72 22 56Z';
  const wing = 'M30 56C34 46 48 46 54 56C50 66 36 68 30 56Z';
  const tail = 'M24 56L8 48L12 62Z';
  const beak = 'M76 48L90 52L76 58Z';
  pic('guyra', [['#3FA7F5', tail], ['#6EC6FF', body], ['#3FA7F5', wing], ['#FFB547', beak + 'M44 80l-2 10M56 80l2 10']], {
    ink: C(64, 46, 3.6), white: C(65.2, 44.8, 1.3), pink: E(64, 56, 3.2, 2), line: 'M38 90h8M54 90h8',
  });
}
{
  // pira (fish)
  const body = 'M20 50C30 30 62 26 78 50C62 74 30 70 20 50Z';
  const tail = 'M74 50L92 34L90 66Z';
  const fin = 'M44 34C48 24 58 26 60 34Z';
  pic('pira', [['#FF9A5B', tail + fin], ['#FFC15B', body]], {
    ink: C(34, 46, 3.6), white: C(35.2, 44.8, 1.3), pink: E(36, 56, 3, 1.8),
    line: 'M24 54q3 2 6 0M50 40q6 10 0 20M60 42q5 8 0 16',
  });
}
{
  // panambi (butterfly)
  const wings = 'M50 46C42 26 18 18 16 34C14 46 30 50 48 50C30 54 18 62 24 74C30 84 46 74 50 56C54 74 70 84 76 74C82 62 70 54 52 50C70 50 86 46 84 34C82 18 58 26 50 46Z';
  const body = RR(46, 34, 8, 38, 4);
  pic('panambi', [['#FF8FC0', wings], ['#4A3A6A', body]], {
    white: C(30, 36, 5) + C(70, 36, 5) + C(32, 66, 3.6) + C(68, 66, 3.6),
    line: 'M48 34C46 26 42 22 38 20M52 34C54 26 58 22 62 20',
    ink: C(38, 20, 2.2) + C(62, 20, 2.2),
  });
}
{
  // kururu (toad)
  const body = 'M16 70C16 50 30 40 50 40C70 40 84 50 84 70C84 78 76 82 50 82C24 82 16 78 16 70Z';
  const eyes = C(34, 40, 11) + C(66, 40, 11);
  pic('kururu', [['#7CC46A', eyes + body]], {
    white: C(34, 40, 6.5) + C(66, 40, 6.5),
    ink: C(35, 41, 3.6) + C(67, 41, 3.6),
    line: 'M34 64q16 12 32 0',
    pink: E(28, 60, 4, 2.4) + E(72, 60, 4, 2.4),
  });
}
{
  // jaguarete (jaguar)
  const ears = C(28, 32, 10) + C(72, 32, 10);
  const head = 'M20 54C20 34 34 26 50 26C66 26 80 34 80 54C80 72 66 82 50 82C34 82 20 72 20 54Z';
  const snout = E(50, 66, 13, 9);
  const spots = C(34, 44, 3) + C(66, 44, 3) + C(50, 36, 3.2) + C(30, 60, 2.6) + C(70, 60, 2.6) + C(42, 32, 2.2) + C(58, 32, 2.2);
  pic('jaguarete', [['#F2B544', ears + head], ['#FFF0D2', snout]], {
    pink: C(28, 32, 4.6) + C(72, 32, 4.6),
    ink: spots + C(41, 52, 3.4) + C(59, 52, 3.4) + 'M45 60h10l-5 5Z',
    white: C(42.2, 50.8, 1.2) + C(60.2, 50.8, 1.2),
    line: 'M50 65v3M44 70q3 3 6 0q3 3 6 0',
  });
}
{
  // tatu (armadillo) — side view
  const shell = 'M18 66C18 44 34 30 54 30C72 30 84 44 84 66Z';
  const head = 'M80 58C86 52 96 54 96 62C96 68 88 70 80 68Z';
  const ear = 'M82 54L80 44L88 52Z';
  const tail = 'M18 64L4 70L18 68Z';
  const legs = RR(26, 64, 10, 12, 4) + RR(64, 64, 10, 12, 4);
  pic('tatu', [['#B79A86', legs + tail + head + ear], ['#C9B2A0', shell]], {
    line: 'M34 34v32M46 31v35M58 31v35M70 35v31M18 52h66',
    ink: C(88, 59, 2.4),
    pink: E(87, 65, 2.4, 1.6),
  });
}
{
  // ka'i (monkey)
  const ears = C(22, 50, 10) + C(78, 50, 10);
  const head = C(50, 50, 30);
  const facePatch = 'M30 52C30 40 40 36 50 42C60 36 70 40 70 52C70 66 62 74 50 74C38 74 30 66 30 52Z';
  pic('ka\'i', [['#8C5A3C', ears + head], ['#F2D2AE', facePatch]], {
    pink: C(22, 50, 5) + C(78, 50, 5) + E(36, 62, 3.4, 2) + E(64, 62, 3.4, 2),
    ink: C(42, 52, 3.4) + C(58, 52, 3.4) + E(47, 60, 1.2, 1.2) + E(53, 60, 1.2, 1.2),
    white: C(43.2, 50.8, 1.2) + C(59.2, 50.8, 1.2),
    line: 'M42 66q8 6 16 0',
  });
}
{
  // ñandu (rhea)
  const body = 'M18 58C18 44 32 38 48 40C58 42 64 48 66 56C66 66 56 72 40 72C26 72 18 66 18 58Z';
  const neck = 'M58 48C62 36 64 24 70 16C74 10 82 12 82 18C82 24 76 26 74 32C70 42 70 52 66 56Z';
  const beak = 'M80 16L92 20L80 22Z';
  const legs = 'M36 72L32 92M50 72L54 92';
  pic('ñandu guasu', [['#B8A68E', body], ['#C9B8A0', neck], ['#FFB547', beak]], {
    ink: C(76, 16, 2.4), white: C(76.8, 15.2, 0.9),
    line: legs + 'M28 92h8M50 92h8M28 56q10-8 22 0',
  });
}
{
  // guasu (deer)
  const head = 'M32 52C32 38 40 30 50 30C60 30 68 38 68 52C68 66 60 80 50 80C40 80 32 66 32 52Z';
  const ears = 'M34 40C24 40 16 34 18 30C24 28 32 32 36 36ZM66 40C76 40 84 34 82 30C76 28 68 32 64 36Z';
  const antlers = 'M42 30C40 22 36 18 30 16M38 22L32 24M58 30C60 22 64 18 70 16M62 22L68 24';
  pic('guasu', [['#B9773F', ears], ['#D08F55', head], ['#FFF0D2', E(50, 68, 9, 8)]], {
    ink: C(42, 50, 3.4) + C(58, 50, 3.4) + E(50, 64, 3.6, 2.6),
    white: C(43.2, 48.8, 1.2) + C(59.2, 48.8, 1.2) + C(44, 40, 1.8) + C(56, 40, 1.8) + C(50, 36, 1.6),
    line: antlers + 'M46 71q4 3 8 0',
    pink: E(37, 60, 3, 1.8) + E(63, 60, 3, 1.8),
  });
  PICS.guasu.lineW = 3.4;
}

/* ---------- people ---------- */
function person(key, skin, hair, shirt, o = {}) {
  const head = C(50, 42, 20);
  const body = 'M22 92C22 72 34 64 50 64C66 64 78 72 78 92Z';
  let hairD = o.hair || 'M30 40C28 24 40 18 50 18C62 18 72 24 70 40C64 32 54 28 44 32C40 34 34 36 30 40Z';
  const f = face(50, 44, 0.85);
  const layers = [];
  if (o.back) layers.push([hair, o.back]);
  layers.push([shirt, body]);
  layers.push([skin, head]);
  layers.push([hair, hairD]);
  if (o.extra) layers.push(o.extra);
  pic(key, layers, { ...f, line: f.line + (o.line || '') });
}
person('sy', '#E0A47A', '#3B2A4A', '#FF8FAB', { back: 'M28 44C24 64 26 74 34 76L66 76C74 74 76 64 72 44Z' });
person('ru', '#C98B5A', '#2A1B3D', '#6EC6FF', { hair: 'M30 38C30 24 40 20 50 20C60 20 70 24 70 38C66 30 58 28 50 28C42 28 34 30 30 38Z', line: 'M42 52q8 4 16 0' });
person('jarýi', '#E0A47A', '#E8E4F2', '#B48CFF', { back: 'M30 40C26 52 28 60 34 62L66 62C72 60 74 52 70 40Z', extra: ['#E8E4F2', C(50, 18, 8)], line: 'M36 42h10M54 42h10' });
person('ramói', '#C98B5A', '#E8E4F2', '#7CC46A', { hair: 'M30 36C32 30 36 28 40 30C36 32 32 36 30 40ZM70 36C68 30 64 28 60 30C64 32 68 36 70 40Z', line: 'M36 42h10M54 42h10M40 56q10 6 20 0' });
person('mitã', '#E0A47A', '#3B2A4A', '#FFD34E', { hair: 'M30 40C28 24 40 16 50 18C58 14 70 22 70 40C66 30 58 26 50 30C44 26 34 30 30 40Z' });

/* ---------- food ---------- */
{
  // chipa: ring bread
  const ring = 'M14 54C14 36 32 26 50 26C68 26 86 36 86 54C86 72 68 80 50 80C32 80 14 72 14 54ZM34 54C34 60 42 64 50 64C58 64 66 60 66 54C66 48 58 44 50 44C42 44 34 48 34 54Z';
  pic('chipa', [['#F2C27A', ring]], {
    white: E(30, 40, 6, 3) + E(64, 36, 5, 2.4),
    line: 'M22 62q4 2 8 0M70 66q4 2 8 0M44 72q4 2 8 0',
  });
  PICS.chipa.evenodd = true;
}
{
  // mandi'o (cassava root)
  const root = 'M14 64C10 56 18 46 30 42C50 36 70 30 84 34C92 36 92 46 84 50C70 58 50 66 30 70C22 72 16 70 14 64Z';
  const cut = E(16, 60, 6, 8);
  pic('mandi\'o', [['#9C6A45', root], ['#FFF6E2', cut]], { line: 'M40 44l4 20M58 38l3 20M74 34l2 16', white: '' });
}
{
  // avati (corn)
  const husk = 'M50 92C36 80 28 62 32 44C38 56 44 66 50 72C56 66 62 56 68 44C72 62 64 80 50 92Z';
  const cob = 'M50 76C38 70 34 50 38 30C40 18 46 10 50 10C54 10 60 18 62 30C66 50 62 70 50 76Z';
  let kern = '';
  for (let y = 22; y < 70; y += 9) for (let x = 42; x <= 58; x += 8) kern += `M${x} ${y}h0.1`;
  pic('avati', [['#FFD34E', cob], ['#7CC46A', husk]], { line: kern + 'M44 26v40M50 18v52M56 26v40' });
  PICS.avati.lineW = 2;
}
{
  // y (water): a drop with a face
  const drop = 'M50 10C40 30 24 46 24 62C24 78 36 88 50 88C64 88 76 78 76 62C76 46 60 30 50 10Z';
  const f = face(50, 62, 0.9);
  pic('y', [['#5AB8FF', drop]], { ...f, white: f.white + E(36, 56, 3, 6) });
}
{
  // kamby (milk): glass of milk
  const glass = 'M28 18L72 18L66 88L34 88Z';
  const milk = 'M31 40L69 40L66 88L34 88Z';
  pic('kamby', [['#E6F3FF', glass], ['#FFFFFF', milk]], { line: 'M31 40q10 5 19 0q10-5 19 0', white: RR(36, 46, 5, 30, 2.5) });
}
{
  // mbujape (bread loaf)
  const loaf = 'M14 70C10 52 22 36 50 36C78 36 90 52 86 70C84 76 78 78 50 78C22 78 16 76 14 70Z';
  pic('mbujape', [['#E5A15A', loaf]], { line: 'M32 48l8 12M46 44l8 14M60 46l8 12', white: E(30, 46, 6, 3) });
}
{
  // narã (orange)
  const fruit = C(50, 56, 30);
  const leaf = 'M52 26C56 14 70 12 74 16C70 26 60 28 52 26Z';
  pic('narã', [['#7CC46A', leaf], ['#FF9A3D', fruit]], { white: E(38, 44, 6, 4), line: 'M50 26v-6', ink: C(46, 60, 1.2) + C(58, 66, 1.2) + C(60, 50, 1.2) });
}
{
  // pakova (banana)
  const b = 'M16 40C24 70 56 84 82 66C88 62 86 56 80 58C58 68 34 60 24 38C22 34 14 34 16 40Z';
  pic('pakova', [['#FFD34E', b]], { line: 'M20 40C28 60 50 70 76 62', ink: 'M80 58L88 54L86 62Z' });
}
{
  // mbeju (round flat cake)
  const cake = E(50, 58, 38, 18);
  const top = E(50, 52, 38, 18);
  pic('mbeju', [['#E5C08A', cake], ['#F7DFB0', top]], { ink: C(36, 50, 1.4) + C(52, 46, 1.4) + C(64, 54, 1.4) + C(44, 58, 1.4), line: 'M28 46q6-6 12-4' });
}

/* ---------- nature ---------- */
{
  const petals = C(50, 26, 12) + C(70, 40, 12) + C(64, 62, 12) + C(36, 62, 12) + C(30, 40, 12);
  const stem = 'M48 70h4v24h-4Z';
  const leaf = 'M52 84C60 74 72 74 76 78C70 86 60 88 52 84Z';
  const f = face(50, 46, 0.6);
  pic('yvoty', [['#7CC46A', stem + leaf], ['#FF8FC0', petals], ['#FFD34E', C(50, 46, 12)]], f);
}
{
  const trunk = 'M44 60h12v32H44Z';
  const crown = 'M50 8C66 8 76 20 74 32C86 36 88 54 76 60C72 70 58 72 50 66C42 72 28 70 24 60C12 54 14 36 26 32C24 20 34 8 50 8Z';
  pic('yvyra', [['#9C6A45', trunk], ['#5CB85C', crown]], { white: E(36, 26, 5, 3) + E(60, 22, 4, 2.4), ink: C(36, 44, 2.6) + C(62, 40, 2.6) + C(48, 54, 2.6) });
}
{
  // óga (house)
  const wall = 'M22 46h56v44H22Z';
  const roof = 'M14 50L50 14L86 50Z';
  const door = RR(42, 62, 16, 28, 6);
  const win = RR(28, 56, 10, 10, 2) + RR(62, 56, 10, 10, 2);
  pic('óga', [['#FFF0D2', wall], ['#E8463F', roof], ['#9C6A45', door], ['#9FD8FF', win]], { ink: C(54, 77, 1.6) });
}
{
  // mbo'ehao (school) with a little bell tower and flag
  const wall = 'M14 50h72v40H14Z';
  const tower = 'M38 26h24v24H38Z';
  const roof = 'M34 28L50 12L66 28Z';
  const door = RR(43, 66, 14, 24, 6);
  const wins = RR(20, 58, 12, 12, 2) + RR(68, 58, 12, 12, 2);
  pic('mbo\'ehao', [['#FFF0D2', wall + tower], ['#3FA7F5', roof], ['#9C6A45', door], ['#9FD8FF', wins]], {
    ink: C(50, 38, 4.2), line: 'M50 12V2M50 2h10l-3 3 3 3H50',
  });
}
{
  // kuatiañe'ẽ (book)
  const left = 'M12 26C24 22 38 22 50 30V84C38 76 24 76 12 80Z';
  const right = 'M88 26C76 22 62 22 50 30V84C62 76 76 76 88 80Z';
  pic('aranduka', [['#FFFFFF', left + right], ['#6EC6FF', 'M8 82C24 78 38 80 50 88C62 80 76 78 92 82V88C76 84 62 86 50 94C38 86 24 84 8 88Z']], {
    line: 'M20 38c8-2 16-1 22 3M20 48c8-2 16-1 22 3M20 58c8-2 16-1 22 3M58 41c6-4 14-5 22-3M58 51c6-4 14-5 22-3M58 61c6-4 14-5 22-3',
  });
}
{
  // haiha (pencil), diagonal
  const body = 'M22 70L66 26L78 38L34 82Z';
  const tip = 'M22 70L34 82L14 88Z';
  const eraser = 'M66 26L72 20C76 16 82 22 84 24C86 28 82 32 78 38Z';
  pic('haiha', [['#FFD34E', body], ['#F2C27A', tip], ['#FF8FAB', eraser]], { ink: 'M14 88L18 78L24 84Z', line: 'M28 76L72 32' });
}
{
  // apyka (chair)
  const seat = RR(24, 50, 52, 10, 3);
  const back = RR(24, 14, 10, 40, 3);
  const legs = RR(26, 58, 8, 32, 2) + RR(66, 58, 8, 32, 2);
  pic('apyka', [['#B9773F', legs + back], ['#D08F55', seat]], { line: 'M30 22v20' });
}
{
  // pelota
  const ball = C(50, 52, 34);
  pic('pelota', [['#FFFFFF', ball]], {
    ink: 'M50 38L61 46L57 59L43 59L39 46Z',
    line: 'M50 38V18M61 46L80 40M57 59L68 76M43 59L32 76M39 46L20 40',
  });
}

/* ---------- greetings and ideas ---------- */
function hand(cx, cy, s, fill) {
  // an open hand, palm facing us, fingers up
  const d = `M${cx - 16 * s} ${cy + 20 * s}C${cx - 22 * s} ${cy + 6 * s} ${cx - 26 * s} ${cy - 4 * s} ${cx - 22 * s} ${cy - 8 * s}C${cx - 18 * s} ${cy - 12 * s} ${cx - 14 * s} ${cy - 6 * s} ${cx - 12 * s} ${cy - 2 * s}` +
    `L${cx - 12 * s} ${cy - 22 * s}C${cx - 12 * s} ${cy - 28 * s} ${cx - 4 * s} ${cy - 28 * s} ${cx - 4 * s} ${cy - 22 * s}L${cx - 4 * s} ${cy - 26 * s}C${cx - 4 * s} ${cy - 32 * s} ${cx + 4 * s} ${cy - 32 * s} ${cx + 4 * s} ${cy - 26 * s}` +
    `L${cx + 4 * s} ${cy - 23 * s}C${cx + 4 * s} ${cy - 29 * s} ${cx + 12 * s} ${cy - 29 * s} ${cx + 12 * s} ${cy - 23 * s}L${cx + 12 * s} ${cy - 16 * s}C${cx + 12 * s} ${cy - 21 * s} ${cx + 19 * s} ${cy - 21 * s} ${cx + 19 * s} ${cy - 16 * s}` +
    `L${cx + 19 * s} ${cy + 4 * s}C${cx + 19 * s} ${cy + 18 * s} ${cx + 10 * s} ${cy + 26 * s} ${cx} ${cy + 26 * s}C${cx - 8 * s} ${cy + 26 * s} ${cx - 13 * s} ${cy + 24 * s} ${cx - 16 * s} ${cy + 20 * s}Z`;
  return d;
}
{
  pic('maitei', [['#F2C08F', hand(52, 52, 1.25)]], { line: 'M16 30q-6 8 0 16M24 22q-8 14 0 30M84 22q6 8 0 16', pink: E(52, 66, 7, 4) });
  PICS.maitei.lineW = 3.4;
}
{
  // iporã: thumbs up
  const d = 'M30 48h12l10-22c2-6 12-4 12 4l-2 14h16c6 0 10 6 8 12l-6 22c-2 5-6 8-11 8H42c-2 0-4-1-5-2H30Z';
  pic('iporã', [['#F2C08F', d], ['#6EC6FF', RR(16, 46, 18, 44, 5)]], { line: 'M62 60h18M60 72h16', white: '' });
}
{
  const heart = 'M50 86C30 72 12 58 12 38C12 24 22 16 32 16C40 16 46 20 50 28C54 20 60 16 68 16C78 16 88 24 88 38C88 58 70 72 50 86Z';
  const f = face(50, 46, 0.95);
  pic('aguyje', [['#FF6F91', heart]], { ...f, pink: E(30, 54, 4, 2.4) + E(70, 54, 4, 2.4), white: f.white + E(28, 30, 5, 3) });
}
{
  // jajotopáta: two waving hands (see you!)
  pic('jajotopáta', [['#F2C08F', hand(32, 54, 0.85)], ['#E0A47A', hand(70, 50, 0.85)]], { line: 'M10 36q-5 7 0 14M92 30q5 7 0 14' });
}
{
  // ko'ẽ (dawn): sun rising behind a hill
  const sun = C(50, 62, 22);
  const hill = 'M2 70C24 56 42 60 52 66C64 58 84 56 98 66V98H2Z';
  let rays = '';
  for (let i = 0; i < 5; i++) { const a = Math.PI + (i + 0.5) * Math.PI / 5; rays += `M${n(50 + Math.cos(a) * 28)} ${n(62 + Math.sin(a) * 28)}L${n(50 + Math.cos(a) * 38)} ${n(62 + Math.sin(a) * 38)}`; }
  pic("ko'ẽ", [['#FFD34E', sun], ['#7CC46A', hill]], { line: rays, ink: C(43, 54, 2.6) + C(57, 54, 2.6), pink: '' });
  PICS["ko'ẽ"].lineW = 4;
}
{
  // ka'aru (afternoon): orange sun low, over water
  const sun = C(50, 56, 22);
  const sea = 'M2 66h96v32H2Z';
  pic("ka'aru", [['#FF9A3D', sun], ['#7FB2F0', sea]], { line: 'M14 76h20M44 80h26M66 88h18M22 90h16', ink: '', white: '' });
}
{
  // pyhare (night): moon and stars on a dark round sky
  const sky = C(50, 50, 42);
  const moon = 'M60 22C46 24 36 36 38 52C40 66 52 76 66 74C58 70 52 60 52 48C52 38 56 28 60 22Z';
  pic('pyhare', [['#2E2272', sky], ['#FFE7A3', moon], ['#FFD34E', STAR(72, 34, 7) + STAR(30, 66, 5) + STAR(74, 64, 4)]], {});
}
{
  // réra (name): a name badge
  pic('réra', [['#FFFFFF', RR(10, 26, 80, 52, 12)], ['#FF8FAB', RR(10, 26, 80, 16, 8)]], { line: 'M24 58h32M24 68h20', ink: C(74, 62, 6) });
}
{
  // porandu (question): speech bubble with a question mark
  const bub = 'M20 18h60c8 0 12 4 12 12v32c0 8-4 12-12 12H44L28 88l2-14h-10c-8 0-12-4-12-12V30c0-8 4-12 12-12Z';
  pic('porandu', [['#B8F0E0', bub]], { line: 'M42 36c0-8 16-8 16 0c0 6-8 6-8 14', ink: C(50, 60, 3) });
  PICS.porandu.lineW = 4.4;
}
{
  // ñe'ẽ (word, language): speech bubble with little lines
  const bub = 'M20 18h60c8 0 12 4 12 12v32c0 8-4 12-12 12H44L28 88l2-14h-10c-8 0-12-4-12-12V30c0-8 4-12 12-12Z';
  pic("ñe'ẽ", [['#FFF0D2', bub]], { line: 'M26 36h48M26 48h40M26 60h28' });
}

/* ---------- body ---------- */
{
  // akã (head): a child's head
  const head = C(50, 52, 30);
  const hair = 'M22 48C20 26 36 16 50 16C64 16 80 26 78 48C72 36 60 30 50 34C40 30 28 36 22 48Z';
  const f = face(50, 56, 1);
  pic('akã', [['#E0A47A', C(20, 56, 6) + C(80, 56, 6)], ['#E0A47A', head], ['#3B2A4A', hair]], f);
}
{
  // resa (eye)
  const white = 'M8 50C24 24 76 24 92 50C76 76 24 76 8 50Z';
  pic('resa', [['#FFFFFF', white], ['#6B4A2E', C(50, 50, 18)]], { ink: C(50, 50, 9), white: C(56, 44, 5), line: 'M20 30l-6-8M34 22l-3-9M50 20v-10M66 22l3-9M80 30l6-8' });
}
{
  // tĩ (nose)
  const nose = 'M44 14C46 30 40 50 30 62C24 70 28 80 38 80C42 80 46 78 50 76C54 78 58 80 62 80C72 80 76 70 70 62C62 54 56 40 56 14Z';
  pic('tĩ', [['#E8AE84', nose]], { ink: E(40, 72, 4, 3) + E(60, 72, 4, 3), white: E(50, 30, 2.4, 6) });
}
{
  // juru (mouth): smiling mouth with teeth and tongue
  const lips = 'M10 40C30 52 70 52 90 40C84 70 68 84 50 84C32 84 16 70 10 40Z';
  pic('juru', [['#E8505B', lips], ['#7A2E3B', 'M20 48C36 56 64 56 80 48C74 68 64 76 50 76C36 76 26 68 20 48Z'], ['#FFFFFF', 'M24 50C38 56 62 56 76 50L74 58C60 62 40 62 26 58Z'], ['#FF8FAB', E(50, 70, 12, 6)]], {});
}
{
  // nambi (ear)
  const ear = 'M40 14C62 10 80 26 78 48C76 62 66 66 62 76C58 86 46 90 38 84C32 80 36 72 42 68C48 64 50 58 46 54C42 50 40 44 44 38C30 40 26 30 40 14Z';
  pic('nambi', [['#E8AE84', ear]], { line: 'M50 28C62 28 68 38 64 50C62 56 56 58 56 64' });
}
pic('po', [['#E8AE84', hand(50, 52, 1.3)]], { line: 'M38 62q12 8 24 0' });
{
  // py (foot): a little foot from below, with toes
  const sole = 'M30 40C28 24 40 18 52 20C66 22 72 34 70 50C68 66 66 80 54 86C42 92 32 84 32 72C32 60 32 52 30 40Z';
  const toes = C(36, 18, 6) + C(48, 13, 5.4) + C(59, 14, 4.8) + C(68, 19, 4.2) + C(74, 27, 3.8);
  pic('py', [['#E8AE84', toes], ['#E8AE84', sole]], { pink: E(52, 60, 9, 12) });
}

/* ---------- more animals ---------- */
{
  // ype (duck)
  const body = 'M14 60C14 46 28 42 44 46C50 34 64 26 76 32C86 38 84 52 76 56C80 66 72 82 48 82C26 82 14 74 14 60Z';
  const wing = 'M30 60C36 52 50 54 54 62C48 70 36 70 30 60Z';
  const bill = 'M80 42C90 40 98 44 96 48C92 52 86 50 80 50Z';
  pic('ype', [['#FFFFFF', body], ['#E8E4F2', wing], ['#FFB547', bill]], { ink: C(70, 40, 3.4), white: C(71.2, 38.8, 1.2), pink: E(68, 50, 3, 1.8), line: 'M30 88q18 6 36 0' });
}
{
  // urukure'a (owl)
  const body = 'M22 50C22 26 36 14 50 14C64 14 78 26 78 50C78 74 66 88 50 88C34 88 22 74 22 50Z';
  const tufts = 'M26 26L22 8L38 18ZM74 26L78 8L62 18Z';
  const belly = E(50, 66, 18, 18);
  pic("urukure'a", [['#9C6A45', tufts], ['#B9895C', body], ['#F2DCC0', belly], ['#FFFFFF', C(38, 40, 11) + C(62, 40, 11)]], {
    ink: C(38, 41, 5.4) + C(62, 41, 5.4), white: C(40, 39, 1.8) + C(64, 39, 1.8),
    line: 'M44 60l4 4 4-4 4 4M42 72l4 4 4-4 4 4 4-4', pink: '',
  });
  PICS["urukure'a"].f.push(['#FFB547', 'M46 48L54 48L50 56Z']);
  PICS["urukure'a"].f[4] = { fill: '#FFB547', d: 'M46 48L54 48L50 56Z' };
}
{
  // tapi'i: the mascot's own head, moved into the 100 box (absolute M/C/Z paths only)
  const tx = (x, y) => [(x - 104) * 1.0, (y - 34) * 1.0];
  const move = (d) => d.replace(/([MC])([^MCZ]+)/g, (m, cmd, nums) => {
    const v = nums.trim().split(/[\s,]+/).map(Number);
    const out = [];
    for (let i = 0; i < v.length; i += 2) { const q = tx(v[i], v[i + 1]); out.push(n(q[0]) + ' ' + n(q[1])); }
    return cmd + out.join(' ');
  });
  const HEAD = 'M120 104C111 90 114 66 134 56C150 48 168 52 176 62C186 65 197 74 198 86C199 94 193 99 187 97C183 95 182 91 178 91C176 100 167 110 153 112C138 114 125 111 120 104Z';
  const [ex, ey] = tx(132, 50);
  const ear = `M${n(ex - 11)} ${n(ey)}a11 15 0 1 0 22 0a11 15 0 1 0 -22 0Z`;
  const [ix, iy] = tx(158, 78);
  const [cx2, cy2] = tx(153, 92);
  const [nx2, ny2] = tx(193.5, 90);
  const [mx, my] = tx(158, 98.5);
  pic("mborevi", [['#A0704E', ear], ['#A0704E', move(HEAD)]], {
    pink: E(ex, ey + 1.5, 6, 9.5) + E(cx2, cy2, 7.2, 4.4),
    ink: E(ix, iy, 7, 8.2) + E(nx2, ny2, 1.7, 2.4),
    white: C(ix + 2.6, iy - 3.6, 2.8) + C(ix - 2.4, iy + 3.6, 1.4) + C(30, 40, 2.6) + C(24, 56, 2.2) + C(38, 28, 2),
    line: `M${n(mx)} ${n(my)}q5 5 10 0M${n(78)} ${n(46)}C${n(82)} ${n(47)} ${n(85)} ${n(50)} ${n(86)} ${n(54)}`,
  });
}

/* ---------- colours: a paint blob with a face ---------- */
{
  const blob = 'M50 14C64 12 72 22 80 28C90 34 92 48 86 58C82 66 88 76 80 84C72 92 60 86 50 88C38 90 26 92 18 82C10 72 16 62 14 52C12 40 14 28 26 20C34 14 42 15 50 14Z';
  const cols = { 'pytã': '#F0504F', "sa'yju": '#FFD34E', 'hovy': '#3F8CF0', 'morotĩ': '#FFFFFF', 'hũ': '#2B2338' };
  Object.keys(cols).forEach((k) => {
    const dark = k === 'hũ';
    const f = face(50, 54, 1.05);
    pic('c-' + k, [[cols[k], blob]], dark ? { ink: '', white: C(43, 54, 3.4) + C(57, 54, 3.4), line: '', pink: f.pink } : { ...f, white: f.white + E(32, 30, 6, 3.4) });
    if (dark) { PICS['c-' + k].ink = C(43.6, 54.6, 1.6) + C(57.6, 54.6, 1.6); PICS['c-' + k].lineDark = 'M46 60q4 3 8 0'; }
  });
}

/* ---------- numbers: count the stars ---------- */
{
  const LAY = {
    1: [[50, 50, 30]],
    2: [[30, 50, 20], [70, 50, 20]],
    3: [[50, 28, 17], [28, 66, 17], [72, 66, 17]],
    4: [[30, 30, 16], [70, 30, 16], [30, 70, 16], [70, 70, 16]],
    5: [[28, 28, 14], [72, 28, 14], [50, 50, 14], [28, 72, 14], [72, 72, 14]],
    6: [[24, 32, 13], [50, 32, 13], [76, 32, 13], [24, 68, 13], [50, 68, 13], [76, 68, 13]],
    7: [[24, 26, 12], [50, 26, 12], [76, 26, 12], [50, 50, 12], [24, 74, 12], [50, 74, 12], [76, 74, 12]],
    8: [[18, 32, 11], [40, 32, 11], [62, 32, 11], [84, 32, 11], [18, 68, 11], [40, 68, 11], [62, 68, 11], [84, 68, 11]],
    9: [[24, 24, 11], [50, 24, 11], [76, 24, 11], [24, 50, 11], [50, 50, 11], [76, 50, 11], [24, 76, 11], [50, 76, 11], [76, 76, 11]],
    10: [[14, 34, 9.5], [32, 34, 9.5], [50, 34, 9.5], [68, 34, 9.5], [86, 34, 9.5], [14, 66, 9.5], [32, 66, 9.5], [50, 66, 9.5], [68, 66, 9.5], [86, 66, 9.5]],
  };
  Object.keys(LAY).forEach((k) => { if (+k <= 5) pic('n' + k, [['#FFD34E', LAY[k].map(([x, y, r]) => STAR(x, y, r, 0.52)).join('')]], {}); });
  /* six to ten as ten-frames: a full top row of five gold stars, and the rest from the left on the row below, in
     Mborevi'i's pink, so that eight (five and three) and ten (five and five) cannot be taken for each other */
  const ROW = [14, 32, 50, 68, 86];
  for (let k = 6; k <= 10; k++) {
    const top = ROW.map((x) => STAR(x, 34, 9.5, 0.52)).join('');
    const rest = ROW.slice(0, k - 5).map((x) => STAR(x, 66, 9.5, 0.52)).join('');
    pic('n' + k, [['#FFD34E', top], ['#FFC2D4', rest]], {});
  }
}

/* ---------- school ---------- */
person("mbo'ehára", '#E0A47A', '#3B2A4A', '#7CC46A', { back: 'M30 44C28 56 30 62 34 64L66 64C70 62 72 56 70 44Z', line: 'M33 41h12M55 41h12M45 41h10' });
{
  // irũ (friend): two children side by side
  const b1 = 'M6 94C6 78 14 72 28 72C42 72 50 78 50 94Z', b2 = 'M50 94C50 78 58 72 72 72C86 72 94 78 94 94Z';
  pic('irũ', [['#FF8FAB', b1], ['#6EC6FF', b2], ['#E0A47A', C(28, 50, 16)], ['#C98B5A', C(72, 50, 16)], ['#3B2A4A', 'M14 46C14 34 22 30 28 30C36 30 42 34 42 46C38 40 32 38 28 40C24 38 18 40 14 46Z'], ['#2A1B3D', 'M58 46C58 34 66 30 72 30C80 30 86 34 86 46C80 40 76 38 72 40C68 38 62 40 58 46Z']], {
    ink: C(23, 52, 2.2) + C(33, 52, 2.2) + C(67, 52, 2.2) + C(77, 52, 2.2),
    line: 'M25 57q3 2.5 6 0M69 57q3 2.5 6 0M44 82q6-6 12 0',
    pink: E(19, 57, 2.6, 1.6) + E(37, 57, 2.6, 1.6) + E(63, 57, 2.6, 1.6) + E(81, 57, 2.6, 1.6),
  });
}
pic('kuatia', [['#FFFFFF', 'M22 10h40l18 18v62H22Z'], ['#E8E4F2', 'M62 10v18h18Z']], { line: 'M32 40h36M32 52h36M32 64h30M32 76h20' });

/* ---------- letters: words that show a sound ---------- */
{
  // eichu: the Pleiades, a little cluster of seven stars
  const pts = [[30, 40, 9], [50, 30, 8], [68, 40, 9], [44, 54, 7], [62, 60, 8], [36, 72, 7], [56, 78, 6]];
  pic('eichu', [['#2E2272', C(50, 54, 44)], ['#FFE7A3', pts.map(([x, y, r]) => STAR(x, y, r)).join('')]], {});
}
{
  const stone = 'M14 70C10 56 22 40 40 36C58 32 80 40 86 56C90 68 82 78 64 80C44 82 18 82 14 70Z';
  const f = face(50, 60, 0.8);
  pic('ita', [['#B7B3C9', stone]], { ...f, white: f.white + E(34, 48, 6, 3) });
}
{
  // tapỹi: a little thatched hut
  const wall = 'M24 52h52v38H24Z';
  const roof = 'M8 56C24 40 36 24 50 14C64 24 76 40 92 56Z';
  pic('tapỹi', [['#E5C08A', wall], ['#C9A04E', roof], ['#9C6A45', RR(42, 64, 16, 26, 6)]], { line: 'M30 44l-6 8M42 32l-6 12M58 32l6 12M70 44l6 8' });
}
{
  // pytũ (dark): a dark sky with a sleepy star
  pic('pytũ', [['#1B1452', C(50, 50, 42)], ['#FFE7A3', STAR(50, 50, 18)]], { line: 'M44 50q3 3 6 0M52 50q3 3 6 0', ink: '' });
}
{
  // so'o (meat): a piece of meat on the bone
  const meat = 'M30 30C46 18 70 24 76 40C82 56 70 70 54 72C40 74 26 66 22 52C20 44 24 36 30 30Z';
  const bone = 'M64 66L80 82C84 78 90 80 90 86C90 90 86 92 84 90C86 94 82 98 78 96C74 94 74 90 76 86L60 70Z';
  pic("so'o", [['#FFF6E2', bone], ['#C0673E', meat]], { white: E(40, 38, 8, 4), line: 'M36 54q10 6 22 0' });
}
{
  // ára (day): a sunny day — sun over a cloud in a blue sky
  pic('ára', [['#9FD8FF', C(50, 50, 42)], ['#FFD34E', C(60, 40, 16)], ['#FFFFFF', 'M20 70C12 70 10 62 16 58C16 50 26 48 30 52C34 44 46 44 50 52C58 50 64 56 60 62C66 66 62 72 56 70Z']], {});
}

/* ---------- school things and the sky's names ---------- */
pic('okẽ', [['#B9773F', RR(26, 10, 48, 84, 6)], ['#D08F55', RR(32, 16, 36, 30, 3) + RR(32, 52, 36, 34, 3)]], { ink: C(64, 54, 3) });
pic('ovetã', [['#9FD8FF', RR(14, 14, 72, 72, 6)], ['#FFFFFF', 'M14 50h72v4H14ZM48 14h4v72h-4Z'], ['#FF8FAB', 'M8 10h18v80H8ZM74 10h18v80H74Z']], { white: 'M22 22l12 12M26 20l6 6', line: '' });
{
  // mborevi rape: the Milky Way across a round night sky
  const sky = C(50, 50, 42);
  const band = 'M14 74C30 60 40 64 52 50C62 38 74 34 88 24L90 34C78 42 70 48 60 60C48 74 36 74 18 84Z';
  let dots = '';
  [[24, 72], [34, 66], [44, 60], [52, 52], [60, 44], [70, 38], [80, 32], [40, 70], [64, 50]].forEach(([x, y]) => { dots += C(x, y, 1.6); });
  pic('mborevirape', [['#2E2272', sky], ['#E8DDFF', band]], { white: dots, ink: '' });
  PICS.mborevirape.f[1].fill = '#CBBCFF';
}
{
  // ñandu pysã: the Southern Cross as the rhea's footprint
  const sky = C(50, 50, 42);
  const st = (x, y, r) => STAR(x, y, r, 0.5);
  pic('nandupysa', [['#2E2272', sky], ['#FFD34E', st(50, 20, 8) + st(50, 80, 8) + st(26, 48, 7) + st(74, 46, 7) + st(64, 62, 4.5)]], { line: '' });
}
/* ---------- the country and the house ---------- */
{
  // poyvi: the flag of Paraguay (red, white, blue) on a pole, with its round emblem
  const pole = RR(12, 8, 6, 86, 3);
  const red = 'M18 16h66v18H18Z', white = 'M18 34h66v18H18Z', blue = 'M18 52h66v18H18Z';
  pic('poyvi', [['#B9773F', pole], ['#E8463F', red], ['#FFFFFF', white], ['#3F6FD0', blue]], { line: C(51, 43, 6.5), ink: '', white: '' });
  PICS.poyvi.lineW = 2.2;
}
{
  // tupa: a bed with a pillow and a blanket
  const frame = RR(8, 44, 84, 30, 6) + RR(8, 30, 12, 56, 4) + RR(80, 40, 12, 46, 4);
  const blanket = 'M24 52C40 46 70 46 80 50V72H24Z';
  const pillow = 'M22 42C22 36 40 34 44 40C46 46 26 48 22 42Z';
  pic('tupa', [['#B9773F', frame], ['#FFFFFF', pillow], ['#8EC5FF', blanket]], { line: 'M32 60h40M30 66h44', ink: '' });
}
/* ---------- body (shown on a child's face) ---------- */
// these reuse the child; the lesson highlights a part with a glow ring defined per word
/* ---------- asking for help (1.º grado, unit 5) ---------- */
// turns a path made only of absolute M/L/C/Z pairs (like hand()) about a point, by deg degrees
function turn(d, cx, cy, deg) {
  const a = (deg * Math.PI) / 180, co = Math.cos(a), si = Math.sin(a);
  return d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (m, x, y) => {
    const X = +x - cx, Y = +y - cy;
    return n(cx + X * co - Y * si) + ' ' + n(cy + X * si + Y * co);
  });
}
{
  // pytyvõ: «ayudame»: a big hand reaches down to a small one reaching up
  // the big hand wears the green of the teacher's top (mbo'ehára): it is the teacher who helps
  const hx = 66, hy = 34, hs = 0.86;
  const big = turn(hand(hx, hy, hs), hx, hy, 222);
  const sleeve = turn(P([[hx - 18 * hs, hy + 20 * hs], [hx + 21 * hs, hy + 20 * hs], [hx + 21 * hs, hy + 32 * hs], [hx - 18 * hs, hy + 32 * hs]]), hx, hy, 222);
  const small = turn(hand(30, 72, 0.7), 30, 72, 42);
  pic('pytyvõ', [['#E8AE84', big], ['#7CC46A', sleeve], ['#F2C08F', small]], { line: 'M40 36l-4 -6M48 32l-1 -7M30 46l-6 -3' });
}
/* ---------- basic needs (2.º grado, unit 3) ---------- */
{
  // baño: a friendly toilet, seen from the side: tank, seat, bowl and foot
  const f = face(48, 60, 0.7);
  pic('baño', [['#BFE6FF', RR(58, 12, 26, 34, 5)], ['#FFFFFF', 'M18 44h70c0 20-14 32-34 32h-6c-17 0-30-12-30-32Z'], ['#FFFFFF', 'M38 74h26l-4 16H42Z'], ['#9AD3FF', RR(14, 38, 76, 8, 4)]],
    { ...f, ink: f.ink + RR(64, 18, 9, 4, 2), white: f.white + E(30, 52, 4, 2.5) });
}
{
  // ejapyhy: «tomá»: a hand from the right holds out a blue notebook to an open hand waiting below
  const give = turn(hand(80, 36, 0.72), 80, 36, 268);
  const take = turn(hand(34, 78, 0.7), 34, 78, 10);
  const pages = 'M20 20L62 20L62 52L20 52Z', cover = 'M16 18L58 18L58 50L16 50Z', label = 'M24 26L48 26L48 34L24 34Z';
  pic('ejapyhy', [['#F2C08F', take], ['#FFFFFF', pages], ['#6EC6FF', cover], ['#FFFFFF', label], ['#E8AE84', give]],
    { line: 'M18 56l-3 6M27 58l-1 6M36 57l1 6' });
}
{
  // karu: «comer»: the child of mitã, with a bowl and a spoon, licking its lips
  const head = C(50, 36, 18);
  const body = 'M24 92C24 74 35 66 50 66C65 66 76 74 76 92Z';
  const hairD = 'M32 34C30 20 41 13 50 15C57 11 68 18 68 34C64 26 57 23 50 26C45 23 36 26 32 34Z';
  const bowl = 'M24 68L76 68C76 82 66 90 50 90C34 90 24 82 24 68Z';
  const f = face(50, 38, 0.78);
  pic('karu', [['#FFD34E', body], ['#E0A47A', head], ['#3B2A4A', hairD], ['#FF8FAB', bowl], ['#D9D6E8', E(80, 44, 5, 7)]],
    { ink: f.ink, white: f.white + E(36, 74, 5, 2.5), pink: f.pink + E(55, 46.5, 3.2, 2.2), line: 'M43 44q7 6 14 0M74 66L79 51' });
}
{
  // mbogueha: an eraser, a little worn at one corner, with crumbs
  const er = turn(P([[24, 40], [76, 40], [80, 46], [80, 62], [28, 62], [24, 56]]), 52, 51, -16);
  const band = turn(P([[24, 40], [42, 40], [42, 62], [28, 62], [24, 56]]), 52, 51, -16);
  const f = face(62, 50, 0.6);
  pic('mbogueha', [['#FF8FAB', er], ['#6EC6FF', band]],
    { ...f, white: f.white + E(52, 42, 5, 2), pink: E(80, 76, 2.6, 1.7) + E(87, 71, 2, 1.4) + E(73, 80, 1.8, 1.2) });
}
module.exports = { PICS, INK, C, E, RR, P, STAR };
function exportJs(file) {
  const out = {};
  Object.keys(PICS).forEach((k) => { const p = PICS[k]; const o = { f: p.f.map((l) => ({ fill: l.fill, d: l.d })) }; ['pink', 'white', 'ink', 'line'].forEach((x) => { if (p[x]) o[x] = p[x]; }); if (p.lineW) o.lineW = p.lineW; if (p.evenodd) o.evenodd = true; out[k] = o; });
  require('fs').writeFileSync(file, '/* Mborevi Rape word pictures: made by tools/art/pics.js, drawn in a 100x100 box as ten layers (see tpCourse.pic) */\nwindow.__tpPics = ' + JSON.stringify(out) + ';\n');
}
module.exports.exportJs = exportJs;

if (require.main === module) {
  const keys = Object.keys(PICS);
  const svg = (k) => {
    const p = PICS[k];
    const lw = p.lineW || 3;
    return `<svg viewBox="0 0 100 100" width="120" height="120">` +
      p.f.map((l) => `<path d="${l.d}" fill="${l.fill}" stroke="${INK}" stroke-width="3" stroke-linejoin="round" ${p.evenodd ? 'fill-rule="evenodd"' : ''}/>`).join('') +
      `<path d="${p.pink || 'M0 0'}" fill="#FF8FAB" opacity=".75"/>` +
      `<path d="${p.white || 'M0 0'}" fill="#FFFFFF"/>` +
      `<path d="${p.ink || 'M0 0'}" fill="${INK}"/>` +
      `<path d="${p.line || 'M0 0'}" fill="none" stroke="${INK}" stroke-width="${lw}" stroke-linecap="round" stroke-linejoin="round"/>` +
      `</svg>`;
  };
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#FFF7EC;display:grid;grid-template-columns:repeat(8,1fr);gap:8px;padding:12px;font-family:sans-serif;width:1100px}div{background:#fff;border:2px solid #eee;border-radius:16px;text-align:center;font-size:13px;padding:4px}</style></head><body>` +
    keys.map((k) => `<div>${svg(k)}<br>${k}</div>`).join('') + `</body></html>`;
  require('fs').writeFileSync(__dirname + '/pics.html', html);
  console.log(keys.length + ' pictures');
}
