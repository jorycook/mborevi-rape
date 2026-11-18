# The app loads only the current grade's sound file, so a word or phrase a unit shares with another grade needs its
# clip in this grade's file too. This writes OUT_DIR/tp-sound-<grade>.js holding the clips of the given keys, copied
# from the project's other sound files; merge_clips.py then adds them. Keys found in no file are listed.
# Usage: python3 copy_clips.py PROJECT_DIR grade keys.json OUT_DIR
import glob, io, json, os, re, sys

project, grade, keys_file, out_dir = sys.argv[1:5]
keys = json.load(open(keys_file, encoding='utf-8'))
LINE = re.compile(r'^  c\[(".*?")\] = \{ b: ".*", ms: \d+, kind: "synthetic" \};$', re.M)
found = {}
for f in sorted(glob.glob(os.path.join(project, 'tp-sound-*.js'))):
    if os.path.basename(f) == f'tp-sound-{grade}.js':
        continue
    for m in LINE.finditer(io.open(f, encoding='utf-8').read()):
        k = json.loads(m.group(1))
        if k in keys and k not in found:
            found[k] = m.group(0)
os.makedirs(out_dir, exist_ok=True)
lines = ['/* clips copied from other grades */', '(function () {', '  var c = window.__tpClips = window.__tpClips || {};']
lines += [found[k] for k in keys if k in found] + ['})();']
io.open(os.path.join(out_dir, f'tp-sound-{grade}.js'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print(f'{len(found)} copied:', ', '.join(k for k in keys if k in found))
print('in no file:', ', '.join(k for k in keys if k not in found) or 'none')
