# Adds the clips of a partial make_sound.py run (OUT_DIR/tp-sound-<grade>.js) to the project's sound file of that
# grade, leaving every clip already there untouched, and fixes the clip count in the file's header.
# Usage: python3 merge_clips.py OUT_DIR PROJECT_DIR grade [keys.json]
#   keys.json (optional): a JSON list of clip keys; only those are added.
import io, json, os, re, sys

out_dir, project, grade = sys.argv[1], sys.argv[2], sys.argv[3]
only = set(json.load(open(sys.argv[4], encoding='utf-8'))) if len(sys.argv) > 4 else None
name = f'tp-sound-{grade}.js'
new_src = io.open(os.path.join(out_dir, name), encoding='utf-8').read()
old_path = os.path.join(project, name)
old_src = io.open(old_path, encoding='utf-8').read()

LINE = re.compile(r'^  c\[(".*?")\] = \{ b: ".*", ms: \d+, kind: "synthetic" \};$', re.M)
old_keys = {m.group(1) for m in LINE.finditer(old_src)}
added = [m.group(0) for m in LINE.finditer(new_src)
         if m.group(1) not in old_keys and (only is None or json.loads(m.group(1)) in only)]
if not added:
    sys.exit('nothing new to add')
end = old_src.rindex('})();')
merged = old_src[:end] + '\n'.join(added) + '\n' + old_src[end:]
total = len(old_keys) + len(added)
merged, k = re.subn(r'the sound of one grade \(' + re.escape(grade) + r'\), \d+ clips', f'the sound of one grade ({grade}), {total} clips', merged, count=1)
if k != 1:
    sys.exit('header count not found')
io.open(old_path, 'w', encoding='utf-8').write(merged)
print(f'{name}: {len(old_keys)} clips kept, {len(added)} added, {total} now')
# the index of the clips the screens can count on (window.__tpVoiced)
import subprocess
subprocess.run(['node', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'voiced.js')], check=True)
