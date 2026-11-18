# Builds the listening page's data (voces/clips.json) from a make_sound.py report and the inventory with glosses:
# one entry per clip key (a story page shared by two grades appears once), with an id derived from the key, so a
# mark made on the page stays with its clip when the sound is made again.
# Usage: python3 build_review.py OUT_DIR/report.json inventory-es.json ../../voces/clips.json
import json, sys, zlib

report = json.load(open(sys.argv[1]))
inv = json.load(open(sys.argv[2]))
gloss = {(x['grade'], x['key']): x for x in inv}
ORDER = ['pre', 'g1', 'g2', 'ui']
out, seen = [], {}
for r in sorted(report, key=lambda r: ORDER.index(r['grade'])):
    if r['key'] in seen:
        continue
    item = gloss.get((r['grade'], r['key']), {})
    cid = 'c' + format(zlib.crc32(r['key'].encode('utf-8')), '08x')
    seen[r['key']] = cid
    out.append({'id': cid, 'grade': r['grade'], 'kind': item.get('kind', ''), 'key': r['key'], 'text': r['text'],
                'es': item.get('es', ''), 'heard': r['heard'], 'cer': r['cer'],
                'status': 'held' if r.get('excluded') else 'app', 'ms': r.get('ms', 0), 'b64': r['b64']})
json.dump(out, open(sys.argv[3], 'w'), ensure_ascii=False)
print(len(out), 'clips;', sum(1 for x in out if x['status'] == 'held'), 'held;', round(len(json.dumps(out)) / 1e6, 2), 'MB')
