# Copies the sound files a make_sound.py run wrote (OUT_DIR/tp-sound-*.js) into the project and writes their list and
# the voice's description into tp-sound.js (window.__tpSoundFiles, window.__tpSoundVoices), then the index of the clips
# (window.__tpVoiced, tools/audio/voiced.js).
# Usage: python3 install.py OUT_DIR
import json, os, re, shutil, sys, glob

OUT = sys.argv[1]
PROJECT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'project')
files = sorted(os.path.basename(f) for f in glob.glob(os.path.join(OUT, 'tp-sound-*.js')))
for f in files:
    shutil.copy(os.path.join(OUT, f), os.path.join(PROJECT, f))
voices = {'grn': {
    'name': 'MMS-TTS guaraní (Meta AI)',
    'kind': 'synthetic',
    'licence': 'CC BY-NC 4.0 (Meta MMS-TTS: non-commercial use only; Pratap et al. 2023)',
    'model': 'facebook/mms-tts-grn',
    'checked': 'each clip transcribed back with MMS speech recognition (facebook/mms-1b-all, Guarani adapter)'}}
p = os.path.join(PROJECT, 'tp-sound.js')
s = open(p).read()
s = re.sub(r'^window\.__tpSoundFiles = .*$', 'window.__tpSoundFiles = window.__tpSoundFiles || ' + json.dumps(files) + ';', s, count=1, flags=re.M)
s = re.sub(r'^window\.__tpSoundVoices = .*$', 'window.__tpSoundVoices = window.__tpSoundVoices || ' + json.dumps(voices, ensure_ascii=False) + ';', s, count=1, flags=re.M)
open(p, 'w').write(s)
print('installed', files, {f: os.path.getsize(os.path.join(PROJECT, f)) for f in files})
# the index of the clips the screens can count on (window.__tpVoiced)
import subprocess
subprocess.run(['node', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'voiced.js')], check=True)
