# Adds the clips of a partial make_sound.py run to the listening page's data (voces/clips.json), keeping every entry
# already there (a mark made on the page stays with its clip id), and replacing an entry only when its key was
# voiced again. Spanish glosses come from an inventory with «es» (e.g. the unit's own words and say phrases).
# Usage: python3 merge_review.py OUT_DIR/report.json inventory.json path/to/clips.json
import json, sys, zlib

report = json.load(open(sys.argv[1], encoding='utf-8'))
inv = {x['key']: x for x in json.load(open(sys.argv[2], encoding='utf-8'))}
path = sys.argv[3]
clips = json.load(open(path, encoding='utf-8'))
index = {c['key']: i for i, c in enumerate(clips)}
added = replaced = 0
for r in report:
    item = inv.get(r['key'], {})
    entry = {'id': 'c' + format(zlib.crc32(r['key'].encode('utf-8')), '08x'), 'grade': r['grade'], 'kind': item.get('kind', ''),
             'key': r['key'], 'text': r['text'], 'es': item.get('es', ''), 'heard': r['heard'], 'cer': r['cer'],
             'status': 'held' if r.get('excluded') else 'app', 'ms': r.get('ms', 0), 'b64': r['b64']}
    if r['key'] in index:
        clips[index[r['key']]] = entry; replaced += 1
    else:
        index[r['key']] = len(clips); clips.append(entry); added += 1
json.dump(clips, open(path, 'w', encoding='utf-8'), ensure_ascii=False)
print(f'{added} added, {replaced} replaced, {len(clips)} clips; {sum(1 for c in clips if c["status"] == "held")} held')
