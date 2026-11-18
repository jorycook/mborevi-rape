# Compares parity.js's screenshot pairs: the share of pixels that differ (any channel by more than 24) and where.
# Usage: python3 tools/render/parity_diff.py   (reads render/parity/report.json, writes *.diff.png for boards that differ)
import json, os, sys
from PIL import Image, ImageChops
S = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
OUT = os.path.join(S, 'render', 'parity')
report = json.load(open(os.path.join(OUT, 'report.json')))
worst = 0
for r in report:
    a = Image.open(r['canvas']['file']).convert('RGB')
    b = Image.open(r['ours']['file']).convert('RGB')
    if a.size != b.size:
        print(f"{r['name']:22s} SIZE {a.size} vs {b.size}"); continue
    d = ImageChops.difference(a, b).convert('L').point(lambda v: 255 if v > 24 else 0)
    n = sum(1 for v in d.getdata() if v)
    share = n / (a.size[0] * a.size[1])
    worst = max(worst, share)
    box = d.getbbox()
    errs = r['ours']['errors'] + ([r['ours']['error']] if r['ours']['error'] else [])
    print(f"{r['name']:22s} {share*100:6.2f}% differ  box={box}  errors(ours)={errs[:2]}  errors(canvas)={r['canvas']['errors'][:1]}")
    if n:
        base = r['ours']['file'].replace('.ours.png', '')
        Image.blend(a, b, 0.5).save(base + '.blend.png'); d.save(base + '.diff.png')
print(f'worst: {worst*100:.2f}%')
