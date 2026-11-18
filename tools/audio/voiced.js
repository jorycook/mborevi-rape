// Writes the index of every voice clip the project has (window.__tpVoiced in project/tp-sound.js) from the sound files
// themselves (project/tp-sound-*.js), so that a screen knows which words can be heard before their grade's file has
// arrived: the listening games ask only words that have a voice. install.py and merge_clips.py run it after writing
// the clip files; tests/test-engine.js fails when the index and the files differ.
// Usage: node tools/audio/voiced.js [--check]
const fs = require('fs');
const path = require('path');
const PROJECT = path.resolve(__dirname, '..', '..', 'project');
function keys() {
  const out = {};
  for (const f of fs.readdirSync(PROJECT).filter((n) => /^tp-sound-.+\.js$/.test(n)).sort()) {
    const src = fs.readFileSync(path.join(PROJECT, f), 'utf8');
    for (const m of src.matchAll(/^\s*c\[("(?:[^"\\]|\\.)*")\]\s*=\s*\{/gm)) out[JSON.parse(m[1])] = 1;
  }
  return Object.keys(out).sort().reduce((o, k) => { o[k] = 1; return o; }, {});
}
const LINE = (k) => 'window.__tpVoiced = window.__tpVoiced || ' + JSON.stringify(k) + ';';
const file = path.join(PROJECT, 'tp-sound.js');
const src = fs.readFileSync(file, 'utf8');
const line = LINE(keys());
if (process.argv.includes('--check')) {
  const m = /^window\.__tpVoiced = .*$/m.exec(src);
  if (!m || m[0] !== line) { console.error('window.__tpVoiced in project/tp-sound.js is not the index of the sound files: run node tools/audio/voiced.js'); process.exit(1); }
  console.log('the voice index matches the sound files');
} else {
  let out;
  if (/^window\.__tpVoiced = .*$/m.test(src)) out = src.replace(/^window\.__tpVoiced = .*$/m, () => line);
  else out = src.replace(/^(window\.__tpSoundVoices = .*)$/m, (all) => all + '\n' + line);
  if (out === src && !src.includes(line)) throw new Error('no window.__tpSoundVoices line to put the index after');
  fs.writeFileSync(file, out);
  console.log('wrote the index of ' + Object.keys(keys()).length + ' clips into project/tp-sound.js');
}
