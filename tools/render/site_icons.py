# Sizes the site's icons from the square drawing site-images.js shot (render/site/icon-square-512.png) and copies the
# share image: rounded icons for browser tabs and Android ("any"), full squares where the system rounds them itself
# (the iPhone's home screen, Android's "maskable" icon).
# Usage: python3 tools/render/site_icons.py
import os
import shutil

from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'render', 'site')
OUT = os.path.join(ROOT, 'site')
RADIUS = 58 / 260  # the corner of the Icon board's biggest icon, as a share of its side


def rounded(img, size):
    """The icon at this size with the board's round corners (drawn 4 times bigger, then reduced, for smooth edges)."""
    big = size * 4
    mask = Image.new('L', (big, big), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, big - 1, big - 1), radius=round(big * RADIUS), fill=255)
    out = img.resize((size, size), Image.LANCZOS).convert('RGBA')
    out.putalpha(mask.resize((size, size), Image.LANCZOS))
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    square = Image.open(os.path.join(SRC, 'icon-square-512.png')).convert('RGB')
    assert square.size == (512, 512), square.size
    rounded(square, 32).save(os.path.join(OUT, 'icon-32.png'), optimize=True)
    rounded(square, 192).save(os.path.join(OUT, 'icon-192.png'), optimize=True)
    rounded(square, 512).save(os.path.join(OUT, 'icon-512.png'), optimize=True)
    square.resize((180, 180), Image.LANCZOS).save(os.path.join(OUT, 'icon-180.png'), optimize=True)
    square.save(os.path.join(OUT, 'icon-maskable-512.png'), optimize=True)
    og = Image.open(os.path.join(SRC, 'og.png')).convert('RGB')
    assert og.size == (1200, 630), og.size
    og.save(os.path.join(OUT, 'og.png'), optimize=True)
    for name in sorted(os.listdir(OUT)):
        print(name, os.path.getsize(os.path.join(OUT, name)), 'bytes')


if __name__ == '__main__':
    main()
