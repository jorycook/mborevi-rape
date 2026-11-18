#!/bin/bash
# Rebuilds runtime/fonts/nunito-{600,700,800}-normal.woff2 from Google's Nunito (the static TTFs in npm's
# @expo-google-fonts/nunito 0.4.2, Google Fonts version 3.602; SIL Open Font License 1.1, no reserved font name):
# the characters of Google's latin, latin-ext and vietnamese subsets plus every combining mark (U+0300-036F), in one
# file per weight, so that a letter and its mark (g̃ is g + U+0303) are drawn by the same font. Its @font-face rules
# are in runtime/fonts/fonts.css. Needs npm and Python with fontTools and brotli (pip install fonttools brotli).
# Usage: tools/fonts/subset-nunito.sh [python]
set -euo pipefail
PY=${1:-python3}
cd "$(dirname "$0")/../.."
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
(cd "$TMP" && npm pack --silent --ignore-scripts @expo-google-fonts/nunito@0.4.2 > /dev/null && tar xzf expo-google-fonts-nunito-0.4.2.tgz)
U='U+0000-02CC,U+02CE-02D7,U+02DA,U+02DC-036F,U+1D00-1DBF,U+1E00-1EFF,U+2000-206F,U+20A0-20C0,U+2113,U+2122,U+2191,U+2193,U+2212,U+2215,U+2C60-2C7F,U+A720-A7FF,U+FEFF,U+FFFD'
for face in 600:SemiBold 700:Bold 800:ExtraBold; do
  w=${face%%:*}; name=${face#*:}
  "$PY" -I -m fontTools.subset "$TMP/package/$w$name/Nunito_$w$name.ttf" --unicodes="$U" --layout-features='*' \
    --no-glyph-names --name-IDs='*' --hinting --flavor=woff2 --output-file="runtime/fonts/nunito-$w-normal.woff2"
done
ls -l runtime/fonts/nunito-*-normal.woff2
