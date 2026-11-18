# Mborevi Rape sound tool: speaks every clip of the inventory with Meta's MMS-TTS Guarani voice (facebook/mms-tts-grn),
# checks each one by transcribing it back with MMS speech recognition (facebook/mms-1b-all, Guarani adapter) and
# keeps the take whose transcript is closest to the text (up to 3 takes: other seed, a little slower or faster).
# Writes one JS file per grade (tp-sound-<grade>.js) that registers the clips in window.__tpClips as MP3 base64,
# plus report.json with the score of every clip.
# Usage: venv/bin/python make_sound.py inventory.json OUT_DIR
import json, sys, os, re, zlib, base64, subprocess, unicodedata, tempfile
import numpy as np
import torch
from scipy.io import wavfile
from transformers import VitsModel, AutoTokenizer, Wav2Vec2ForCTC, Wav2Vec2FeatureExtractor, Wav2Vec2CTCTokenizer, Wav2Vec2Processor

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, '..', 'hf')
inv = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
os.makedirs(OUT, exist_ok=True)
torch.set_num_threads(max(1, os.cpu_count() or 1))

import glob
# the models, from the local snapshots (downloaded once; no Hub look-ups at run time)
TTS_DIR = glob.glob(os.path.join(CACHE, 'models--facebook--mms-tts-grn', 'snapshots', '*'))[0]
ASR_DIR = glob.glob(os.path.join(CACHE, 'models--facebook--mms-1b-all', 'snapshots', '*'))[0]
tts_tok = AutoTokenizer.from_pretrained(TTS_DIR)
tts = VitsModel.from_pretrained(TTS_DIR).eval()
SR = tts.config.sampling_rate

asr_proc = Wav2Vec2Processor(
    feature_extractor=Wav2Vec2FeatureExtractor.from_pretrained(ASR_DIR),
    tokenizer=Wav2Vec2CTCTokenizer.from_pretrained(ASR_DIR, target_lang='grn'))
asr = Wav2Vec2ForCTC.from_pretrained(ASR_DIR, target_lang='grn', ignore_mismatched_sizes=True).eval()

def clean(t):
    t = unicodedata.normalize('NFC', t).replace('’', "'").replace('‘', "'")
    t = re.sub(r'[¿¡?!.,;:«»"“”()]', ' ', t)
    return re.sub(r'\s+', ' ', t).strip().lower()

def bare(t):
    t = unicodedata.normalize('NFD', clean(t))
    t = ''.join(ch for ch in t if unicodedata.category(ch) != 'Mn')
    return re.sub(r"[^a-z' ]", '', t).replace("'", '').replace(' ', '')

def cer(ref, hyp):
    a, b = bare(ref), bare(hyp)
    if not a: return 0.0
    d = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        prev, d[0] = d[0], i
        for j in range(1, len(b) + 1):
            cur = min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] != b[j - 1]))
            prev, d[j] = d[j], cur
    return d[len(b)] / len(a)

def speak(text, rate, seed):
    torch.manual_seed(seed)
    tts.speaking_rate, tts.noise_scale, tts.noise_scale_duration = rate, 0.5, 0.6
    ids = tts_tok(text, return_tensors='pt')
    with torch.no_grad():
        return tts(**ids).waveform[0].numpy().astype(np.float32)

def trim(w):
    a = np.abs(w)
    idx = np.where(a > 0.02 * (a.max() or 1))[0]
    if not len(idx): return w
    return w[max(0, idx[0] - int(0.03 * SR)): min(len(w), idx[-1] + int(0.08 * SR))]

def take(item, n):
    rate = (0.85 if item['kind'] == 'word' else 0.92) * [1.0, 0.93, 1.06][n % 3]
    seed = zlib.crc32((item['key'] + '#' + str(n)).encode())
    lead = '— ' if n >= 3 else ''   # takes 4-6 of a short word: a pause token first, which can free its first consonant
    segs = []
    # a «…» is the child's own part of the phrase (Che réra… «me llamo…»): a pause is left for it
    for i, part in enumerate(item['text'].split('…')):
        c = clean(part)
        if not c: continue
        if segs: segs.append(np.zeros(int(0.5 * SR), np.float32))
        segs.append(trim(speak(lead + c, rate, seed + i)))
    w = np.concatenate(segs) if segs else np.zeros(int(0.2 * SR), np.float32)
    w = np.concatenate([np.zeros(int(0.05 * SR), np.float32), w, np.zeros(int(0.12 * SR), np.float32)])
    return w / (np.abs(w).max() or 1) * 0.9

def hear(w):
    x = asr_proc(w, sampling_rate=SR, return_tensors='pt')
    with torch.no_grad():
        logits = asr(**x).logits
    return asr_proc.decode(torch.argmax(logits, dim=-1)[0])

def mp3(w):
    with tempfile.TemporaryDirectory() as d:
        wavfile.write(os.path.join(d, 'a.wav'), SR, (w * 32767).astype(np.int16))
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', os.path.join(d, 'a.wav'), '-ac', '1', '-ar', str(SR),
                        '-codec:a', 'libmp3lame', '-b:a', '32k', os.path.join(d, 'a.mp3')], check=True)
        return open(os.path.join(d, 'a.mp3'), 'rb').read()

report, files = [], {}
for k, item in enumerate(inv):
    size = len(bare(item['text']))
    # what may pass: a short word must come back exactly (a first letter heard wrong is another word), a longer word
    # nearly so, a sentence may differ a little
    limit = 0.0 if size <= 4 else 0.2 if size <= 12 else 0.25
    best = None
    for n in range(6 if size <= 6 else 3):
        if n == 3 and best[0] <= limit: break
        w = take(item, n)
        heard = hear(w)
        score = cer(item['text'].replace('…', ' '), heard)
        if best is None or score < best[0]: best = (score, w, heard, n)
        if score == 0 or (size > 12 and score <= 0.12): break
    score, w, heard, n = best
    if score > limit:
        report.append({'grade': item['grade'], 'key': item['key'], 'text': item['text'], 'heard': heard, 'cer': round(score, 3),
                       'takes': n + 1, 'excluded': True, 'ms': int(round(len(w) / SR * 1000)),
                       'b64': base64.b64encode(mp3(w)).decode()})
        print(f"{k + 1}/{len(inv)} {item['grade']} {item['text'][:40]!r} EXCLUDED cer={score:.2f} heard={heard[:40]!r}", flush=True)
        continue
    data = mp3(w)
    ms = int(round(len(w) / SR * 1000))
    files.setdefault(item['grade'], []).append((item['key'], base64.b64encode(data).decode(), ms))
    report.append({'grade': item['grade'], 'key': item['key'], 'text': item['text'], 'heard': heard, 'cer': round(score, 3),
                   'takes': n + 1, 'ms': ms, 'bytes': len(data), 'b64': base64.b64encode(data).decode()})
    print(f"{k + 1}/{len(inv)} {item['grade']} {item['text'][:40]!r} cer={score:.2f} heard={heard[:40]!r}", flush=True)

NOTE = ('synthetic: MMS-TTS guaraní (Meta AI, facebook/mms-tts-grn), CC BY-NC 4.0 (non-commercial use only; '
        'Pratap et al. 2023). Each clip was checked by transcribing it back with MMS speech recognition.')
for g, clips in files.items():
    lines = [f'/* Mborevi Rape: the sound of one grade ({g}), {len(clips)} clips. {NOTE}',
             '   Made by the sound tool from the lessons (tools/audio/make_sound.py): do not edit by hand. */',
             '(function () {', '  var c = window.__tpClips = window.__tpClips || {};']
    for key, b64, ms in clips:
        lines.append(f'  c[{json.dumps(key, ensure_ascii=False)}] = {{ b: "{b64}", ms: {ms}, kind: "synthetic" }};')
    lines.append('})();')
    open(os.path.join(OUT, f'tp-sound-{g}.js'), 'w').write('\n'.join(lines) + '\n')
json.dump(report, open(os.path.join(OUT, 'report.json'), 'w'), ensure_ascii=False, indent=1)
print('files:', {g: len(c) for g, c in files.items()})
