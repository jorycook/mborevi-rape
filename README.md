# Mborevi Rape

A Guarani app for children, organised by the grades of Paraguay's Ministry of Education (MEC). Mborevi'i, a little
tapir, walks along the Milky Way (*Mborevi Rape*, "the tapir's path") from one lesson to the next. Each grade is a
constellation of the Guarani sky.

- **Grades, not CEFR levels:** Preescolar, then 1.º to 9.º grado of the Educación Escolar Básica, in the MEC's three
  cycles.
- **Three home-language tracks** («¿Qué se habla en casa?»), following the MEC's three bilingual proposals:
  - Más guaraní: Guarani as mother tongue (Propuesta A).
  - Más castellano: Guarani as second language (Propuesta B).
  - Las dos: both languages as mother tongues (Propuesta C).
- **Four abilities:** the games train the four abilities of the MEC programs: *Ahendu* (listen), *Añe'ẽ* (speak),
  *Amoñe'ẽ* (read) and *Ahai* (write).

Every claim the app makes about the MEC, with the document and page behind it, is in [MEC.md](MEC.md).

## Play it online

**https://jorycook.github.io/mborevi-rape/** opens the whole app, on a phone or a computer. GitHub Pages serves the
repository's `main` branch as it is, with no build step:

- `index.html` starts the App board and scales it to fit the screen. A phone held sideways shows the whole screen,
  smaller, with a note beside it to turn the phone. Any other window too short to show it at a size that can still be
  read (a split screen, a big zoom) scrolls instead, and each new screen starts at its top. A zoom made with the
  browser (Ctrl +) while the app is open enlarges it.
- `runtime/dc.js` is this project's own runtime for the `.dc.html` boards, written from the format's specification.
- React 18.3.1 runs it (`runtime/vendor/`, MIT licence in `LICENSE-react.txt`). The fonts are served by the site too
  (`runtime/fonts/`), so a visit asks nothing of any other server.

What the site adds to the boards:

- **Progress is kept on the device.** The grade, the language of home, the nights and big stars done and the voice switch
  are saved in the browser (`localStorage`, under `mborevi-rape`) as they happen; a child who comes back starts on their
  path. Nothing is sent anywhere. Clearing the site's data in the browser starts again from the Moon.
  - Each step is saved under its grade and the name of its lesson, never its number, so a unit put in between, taken
    out or replaced later does not move the stars onto other lessons. A lesson renamed, or moved to another grade, is
    written in `window.__tpRenamed` (`project/tp-grades.js`); `tests/test-names.js` fails when a name the site has used
    disappears without that.
  - Progress is only ever added: two copies of the app open at once (an old tab, the app on the home screen) do not wipe
    what the other saved, and a step one copy does not have (an older or newer version of the app) is kept as it is.
    The grade, the language of home and the voice are saved by the copy that last changed them.
  - On iPhone and iPad, Safari erases a site's saved data after about 7 days of Safari use without opening it, and an app
    added to the home screen keeps its own data apart from Safari's. The grown-ups' screen tells parents to add the app
    to the home screen before the child starts, and to open it from there.
- **The phone's Back does what the screen's own back or close button does**: a game → tonight's games → the path, and a
  game or big star that is over keeps its star (a big star lit for the first time shows Shine, its celebration, first).
  On the path and the first screen it leaves the site. The page keeps one browser history entry per step back (the big
  star has two, so that Back on its end stops on Shine), added only by a tap, because Chrome's Back skips entries a page
  adds without one.
- **When something fails**, the page says so in Spanish and offers to try again.
  - A screen that cannot load stops the start with «No se pudo abrir la app»: «Revisá la conexión a internet» when a
    request did not come through, «Probá de nuevo en un rato» when the fault is the app's own (a file the site answers
    with an error, a mistake in the code).
  - A screen that breaks while playing shows «Algo no salió bien»; «Volver a empezar» draws the app again from what is
    already loaded (offline too) and goes back to the path. If it breaks again at once, «Empezar de cero» is offered.
    It does not erase the saved progress: it sets it aside (under `mborevi-rape-aside`) and the app starts from the
    Moon. The progress comes back the first time the app opens after it has been updated, which may have mended what
    broke; with the same version it stays aside. (The page tells the version by the text of the files it loaded; a
    visit that cannot tell, because a download did not come through, leaves the progress where it is.) Any other copy
    of the app open at the time starts over too.
  - A slow connection is told apart from a failure: a download is only given up after 45 s in which nothing arrives for
    any of the page's downloads (on a slow line they come one after another, and a weak signal can pause), and after
    25 s the page says it is still loading. A download of the page's own files that breaks off is asked for again.
- **On iPhones the silent switch does not mute the voice**: the page says it plays media (`navigator.audioSession`, or a
  silent `<audio>` on older iPhones), only once a clip can actually be heard, since media playback stops other music.
- **Sharing the link** shows a picture of the app (`site/og.png`), and the browser tab and the home screen get its icon
  (`site/icon-*.png`, `manifest.webmanifest`). Both are made from the boards: `node tools/render/site-images.js`, then
  `python3 tools/render/site_icons.py`. The share tags name the address above; change them in `index.html` if the site
  moves.

Every push to `main` updates the site within a minute or two. To turn the site on, or back on: in the repository's
Settings, open Pages, choose «Deploy from a branch», then the branch `main` and the folder `/ (root)`, and save.

## See it on the canvas

The app also lives on claude.ai as a Claude Design canvas, which keeps the published copy of everything in `project/`:

- App: https://claude.ai/artifact/2gWEiYnoDjxVwaZC7dnMtx. The **App** board is the whole app, playable in place.
  The other boards show each screen on its own.
- Listening page for the voice clips: https://claude.ai/artifact/MD3owciKYk1epggzWcbMhr. A Guarani speaker can mark
  each clip as good or not.

Both are private until you share them from claude.ai.

## What is written

| Grade | Units | Status |
| --- | --- | --- |
| Preescolar | 6 | All nights written, all oral |
| 1.º grado | 8 | All nights written |
| 2.º grado | 6 | Units 1–3 written; 4–6 outlined |
| 3.º–9.º grado | 5–6 each | Outlined: titles, «what the program asks» and «in the app» texts |

There are 128 voice clips, made with a synthetic Guarani voice and each checked by speech recognition. 23 more are held
back until a person approves them on the listening page.

## Layout

```
project/          the app as published on the canvas
  *.dc.html       one board per screen (App.dc.html runs them all)
  tp-course.js    the engine: state, games per night, tracks, sounds
  tp-grades.js    grades, units, nights and words; MEC texts per grade
  tp-sky.js       the constellations and the sky stories
  tp-pics.js      the drawings
  tp-sound*.js    the voice player and the clips (MP3, base64)
  canvas.json     where the boards sit on the canvas
tests/            the app's logic run in Node, no browser, and the lesson names the site has used
index.html        the public site's start page (and manifest.webmanifest, for the home screen)
runtime/          the runtime that plays the boards in any browser (dc.js, board.html, vendor/, fonts/)
site/             the site's icons and share picture
tools/render/     screenshots and layout checks with Playwright
tools/audio/      makes the voice clips
tools/art/        draws the word pictures (writes project/tp-pics.js)
voces/            the listening page and its clips
docs/
  screens/        screenshots of the app
  mec-check.json  claim-by-claim check against the Priorización curricular 2021
  guarani-audit.json  review of every Guarani string in the app
  unit5-check.json  how the Guarani of 1.º grado, unit 5 («Ikatúpa?») was drafted and checked
  g2-unit3-check.json  the same for 2.º grado, unit 3 («Aikotevẽ»)
```

## Tests

From the repository root (made with Node 22):

```bash
node tests/test-engine.js
```

```bash
node tests/flow-test.js L2 g1
```

`flow-test.js` plays a whole grade like a child would: every night, every game, with replays and a change of home
language. Tracks: `L1`, `L2`, `BI`. Grades: `pre`, `g1`, `g2`. It prints `no problems` when all is well.

```bash
node tests/runlogic.js project/Home.dc.html
```

```bash
node tests/test-names.js
```

`test-names.js` checks that every lesson name the site has used (`tests/lesson-names.json`) is still in the lessons, or
written in `window.__tpRenamed`, since the progress a device keeps is filed under those names. After adding lessons,
`node tests/test-names.js --write` adds their names to the list (it never takes any away).

## Previewing locally

Serve the repository and open it in a browser:

```bash
python3 -m http.server 8766
```

- http://127.0.0.1:8766/ is the whole app, as on the public site.
- http://127.0.0.1:8766/runtime/board.html?b=Meet.dc.html is one board on its own.

The screenshot tools in `tools/render/` use Playwright, open the boards with this project's runtime, and write to
`render/`:

- `node tools/render/render-one.js Home.dc.html` takes a screenshot of one board.
- `node tools/render/overflow.js` reports anything a board clips.
- `node tools/render/walk-app.js` plays a night of the App board like a child would. `SITE=1 node
  tools/render/walk-site.js` does the same through the site's start page.
- `node tools/render/site-checks.js` checks what the site adds: progress kept (also across lessons put in, taken out
  and renamed, and with two copies of the app open), the phone's Back (also with Chrome's own Back button, through a
  small test extension), short windows and phones held sideways, a screen that fails to load or breaks, «Empezar de
  cero», a slow connection (also one that sends the boards one after another, over HTTP/2), no JavaScript, the
  iPhone's silent switch (simulated), the share tags. It takes about fifteen minutes.

The tools expect the server on port 8766; `BASE=http://127.0.0.1:8768/` points them at another.

With `CANVAS=1`, the tools open the boards the way the design canvas does instead. That needs the canvas's own runtime
saved locally as `project/support.js`, which is not in this repository; a Claude session can fetch it from the canvas
type. `parity.js`, then `parity_diff.py`, use it to render every board on both runtimes and compare them pixel by pixel.

## Making the voice clips

`tools/audio` speaks every word, phrase and story page with Meta's MMS-TTS Guarani voice (`facebook/mms-tts-grn`). It
then transcribes each clip back with MMS speech recognition (`facebook/mms-1b-all`, Guarani adapter) and keeps the
take that comes back closest to the text. Needs Python 3 (made with 3.13), ffmpeg and about 4 GB for the models,
which go in `tools/hf/` (git ignores it).

```bash
python3 -m venv tools/venv && tools/venv/bin/pip install -r tools/audio/requirements.txt
```

```bash
node tools/audio/inventory.js > tools/audio/inventory.json
```

```bash
tools/venv/bin/python tools/audio/make_sound.py tools/audio/inventory.json tools/audio/out
```

```bash
python3 tools/audio/install.py tools/audio/out
```

`make_sound.py` reads the models from `tools/hf/` and does not download them: fetch `facebook/mms-tts-grn` and
`facebook/mms-1b-all` (with `adapter.grn.safetensors`) into that folder first, for example with `huggingface_hub`'s
`snapshot_download(..., cache_dir='tools/hf')`. If a download stalls behind a proxy, set `HF_HUB_DISABLE_XET=1`.

`build_review.py` makes the listening page's `voces/clips.json` from a run's `report.json` and the inventory with its
Spanish glosses.

For a new unit, voice only its own words and phrases, then add them without touching the clips already made:

```bash
node tools/audio/unit_keys.js project g1 5 tools/audio/unit.json
```

```bash
tools/venv/bin/python tools/audio/make_sound.py tools/audio/unit.json tools/audio/out-unit
```

```bash
python3 tools/audio/merge_clips.py tools/audio/out-unit project g1
```

```bash
python3 tools/audio/merge_review.py tools/audio/out-unit/report.json tools/audio/unit.json voces/clips.json
```

## Pictures

The word pictures are drawn in code, in `tools/art/pics.js`, as layers in a 100×100 box. After adding or changing
one, write the app's file again:

```bash
node -e "require('./tools/art/pics.js').exportJs('project/tp-pics.js')"
```

## Licences and credits

- **Voice:** the clips in `project/tp-sound-*.js` and `voces/clips.json` were made with MMS-TTS Guarani by Meta AI
  (Pratap et al., 2023). It is licensed **CC BY-NC 4.0**, so the clips are for **non-commercial use only**.
- **React** 18.3.1 by Meta is included in `runtime/vendor/` under the MIT licence, which is in `LICENSE-react.txt` next to it.
  The runtime that plays the boards (`runtime/dc.js`) is this project's own code.
- **Fonts** (`runtime/fonts/`), all under the SIL Open Font License 1.1, whose texts are next to them: Andika by SIL
  International (its licence reserves the names "Andika" and "SIL", so its files are Google's, unmodified), Baloo 2 by
  Ek Type, and Nunito by The Nunito Project Authors (cut to the characters the app needs, by
  `tools/fonts/subset-nunito.sh`).
- **MEC documents:** they are not included. MEC.md cites them by title and page.
- **App code and content:** no licence file has been chosen yet. Add one if others should be allowed to reuse it.
