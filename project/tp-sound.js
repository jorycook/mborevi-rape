/* Mborevi Rape sound: the player of the Yaoki suite and of Epu'ã (gn-sound.js), unchanged but for its names, plus
 * the loader of each grade's clips. A grade's clips are one file (tp-sound-g1.js, made by the sound tool from the
 * lessons), fetched next to this file the first time the grade is in use (tpCourse.view asks for it); each file
 * registers its clips in window.__tpClips as MP3 in base64, with their length and what made them. Every screen works
 * without them: when a clip or the browser's audio is missing, play() returns false and the screen shows its written
 * stand-in (Mborevi'i's bubble, a highlighted line). The voices of the files are listed in window.__tpSoundVoices. */
window.__tpSoundFiles = window.__tpSoundFiles || ["tp-sound-g1.js", "tp-sound-g2.js", "tp-sound-pre.js", "tp-sound-ui.js"];
window.__tpSoundVoices = window.__tpSoundVoices || {"grn": {"name": "MMS-TTS guaraní (Meta AI)", "kind": "synthetic", "licence": "CC BY-NC 4.0 (Meta MMS-TTS: non-commercial use only; Pratap et al. 2023)", "model": "facebook/mms-tts-grn", "checked": "each clip transcribed back with MMS speech recognition (facebook/mms-1b-all, Guarani adapter)"}};
(function () {
  var clips = window.__tpClips = window.__tpClips || {};
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null;
  var decoded = {};
  var current = null;
  var turn = 0;
  var gen = 0;          /* counts the audio outputs made: an answer that comes back for an old one is ignored */
  var failed = false;   /* this output could not decode a clip: stop offering sound until there is a new output */
  var stale = false;    /* the output may be dead (it went quiet, or a screen gave up on it): the next tap makes a new one */
  var ran = false;      /* this output has been seen running */
  var worked = false;   /* some output has been seen running since the page opened: this device can play sound */
  var mark = null;      /* the clip play() last started: whose turn it was, the audio clock's reading at the clip's own zero, and when it ended by itself */
  var probe = null;     /* where the audio clock stood when it was last looked at closely: wall clock and audio clock */
  var moved = false;    /* this output's clock has been seen to advance: sound is really coming out */
  var quiet = false;    /* the learner turned the synthetic voice off (synthetic(false)): a voice model's clips count as missing */

  /* the clip under a name, as far as it may be played: none while it is a voice model's and that voice is turned off */
  function clipOf(key) {
    var c = clips[key];
    return c && !(quiet && (c.kind || 'human') === 'synthetic') ? c : null;
  }

  function seen() {
    if (ctx && ctx.state === 'running') { ran = true; worked = true; }
  }

  /* give the audio output back to the phone; the next tap that wants sound makes a new one */
  function drop() {
    if (!ctx) return;
    gen++;
    if (current) { try { current.onended = null; current.stop(); } catch (e) {} }
    try {
      var closing = ctx.close();
      if (closing && typeof closing.catch === 'function') closing.catch(function () {});
    } catch (e) {}
    ctx = null;
    current = null;
    decoded = {};
    mark = null;
    probe = null;
    moved = false;
    ran = false;
    failed = false;
  }

  /* inside a tap, after a silence: start again with a new audio output */
  function renew() {
    if (stale) drop();
    stale = false;
  }

  function context() {
    if (!AC) return null;
    try {
      if (!ctx) {
        ctx = new AC();
        try { ctx.addEventListener('statechange', seen); } catch (e) {}
      }
      /* besides "suspended", iPhones report "interrupted" after a call or a spell in the background: both need waking */
      if (ctx.state !== 'running' && ctx.state !== 'closed') {
        var woke = ctx.resume();
        if (woke && typeof woke.catch === 'function') woke.catch(function () {});
      }
      seen();
    } catch (e) {
      return null;
    }
    return ctx;
  }

  function bytes(b64) {
    var text = atob(b64);
    var out = new Uint8Array(text.length);
    for (var i = 0; i < text.length; i++) out[i] = text.charCodeAt(i);
    return out.buffer;
  }

  function decode(key) {
    if (decoded[key]) return decoded[key];
    var c = context();
    var clip = clipOf(key);
    if (!c || !clip) return Promise.reject(new Error('no sound for ' + key));
    var mine = gen;
    var task = decoded[key] = new Promise(function (ok, fail) {
      try {
        var p = c.decodeAudioData(bytes(clip.b), ok, fail);
        if (p && typeof p.catch === 'function') p.catch(fail);
      } catch (e) {
        fail(e);
      }
    });
    /* a failure counts against the output that was asked, not against one made since */
    task.catch(function () { if (mine === gen) { delete decoded[key]; failed = true; } });
    return task;
  }

  var api = window.tpSound = {
    /* is there a clip under this name, and a way to play it? An output that failed gets another try once it is due to be replaced */
    has: function (key) { return !!(AC && clipOf(key) && (!failed || stale)); },
    /* length of a clip in milliseconds, known before it is decoded */
    ms: function (key) { var c = clipOf(key); return c ? c.ms : 0; },
    /* what made the clip: 'human' (a recording) or 'synthetic' (a voice model, which the screens say so about); '' when there is no clip */
    kind: function (key) { var c = clipOf(key); return c ? c.kind || 'human' : ''; },
    /* where each line of a clip put together from lines ends, in milliseconds from its start (tools/make-sound.mjs
       writes them; the next line starts a quarter of a second later); null for a clip of one recording */
    cues: function (key) { var c = clipOf(key); return c && c.cues && c.cues.length ? c.cues : null; },
    /* is there any clip at all that may be played? None until a sound file has loaded, and none while every clip is a
       voice model's and that voice is turned off */
    any: function () { for (var k in clips) if (clipOf(k)) return true; return false; },
    /* The synthetic voice, on or off: the learner's switch (gn-course.js sets it from the saved progress). Off, a clip
       made by a voice model counts as missing: has() is false, kind() is '', nothing of it plays, and every screen
       shows its written stand-in, as it does for a clip that was never made. A person's recordings are not touched.
       Called with nothing it only answers whether that voice is on. */
    synthetic: function (on) {
      if (arguments.length && !on !== quiet) {
        quiet = !on;
        /* what was decoded stays (the switch may come back on); a clip of that voice that is playing stops */
        if (quiet) this.stop();
      }
      return !quiet;
    },
    /* call from inside a tap: browsers only let sound start after one */
    unlock: function () { renew(); return !!context(); },
    /* is sound actually coming out? A browser can hold the audio back even after a tap, or fail to decode a clip.
       Ask while a clip should be playing, a moment after play(): the answer is yes once the output is running
       and its clock has been seen to move, and no again when the clock stands still */
    on: function () {
      if (!ctx || failed) return false;
      /* an output that was running and no longer is (a call, the lock screen) is replaced at the next tap */
      if (ctx.state !== 'running') { probe = null; moved = false; if (ran) stale = true; return false; }
      ran = true;
      worked = true;
      /* an iPhone can say "running" while its audio clock stands still and nothing is heard */
      var now = Date.now();
      if (!probe) probe = { wall: now, audio: ctx.currentTime };
      else if (ctx.currentTime - probe.audio > 0.05) { probe = { wall: now, audio: ctx.currentTime }; moved = true; }
      else if (now - probe.wall > 700) { moved = false; stale = true; return false; }
      return moved;
    },
    /* has sound come out at any time since the page opened? Then a silence now is an interruption, not a device without sound */
    worked: function () { return worked; },
    /* how far into its clip the sound is, in milliseconds by the audio's own clock, which stands still whenever
       nothing is heard; -1 until the clip that play() asked for has started */
    at: function () {
      if (!ctx || !mark || mark.turn !== turn) return -1;
      var ms = (ctx.currentTime - mark.audio) * 1000;
      return ms === ms ? Math.max(0, Math.round(ms)) : -1;
    },
    /* milliseconds since the clip that play() asked for came to its end by itself; -1 while it has not, or when it was stopped */
    over: function () { return mark && mark.turn === turn && mark.ended ? Math.max(0, Date.now() - mark.ended) : -1; },
    /* decode ahead of time so the first clip starts on the beat */
    ready: function (keys) {
      for (var i = 0; i < keys.length; i++) if (this.has(keys[i])) decode(keys[i]).catch(function () {});
    },
    /* start a clip, stopping whatever was playing; "from" skips that many milliseconds into it; false means it cannot be played */
    play: function (key, from) {
      var mine = ++turn;
      this.halt();
      if (!this.has(key)) return false;
      /* the clock is looked at afresh from here: it may have idled while nothing was playing */
      probe = null;
      var skip = from > 0 ? from / 1000 : 0;
      decode(key).then(function (buffer) {
        if (mine !== turn || !ctx) return;
        var node = ctx.createBufferSource();
        node.buffer = buffer;
        node.connect(ctx.destination);
        var started = mark = { turn: mine, audio: 0, ended: 0 };
        node.onended = function () {
          if (current === node) current = null;
          started.ended = Date.now();
        };
        current = node;
        var into = Math.min(skip, Math.max(0, (buffer.duration || 0) - 0.05));
        if (into > 0) node.start(0, into);
        else node.start();
        started.audio = ctx.currentTime - into;
        probe = { wall: Date.now(), audio: ctx.currentTime };
        seen();
      }).catch(function () {});
      return true;
    },
    halt: function () {
      if (!current) return;
      try { current.onended = null; current.stop(); } catch (e) {}
      current = null;
    },
    stop: function () {
      turn++;
      this.halt();
    },
    /* the screen has given up on this output (it paused, or waited in vain): the next tap makes a new one */
    retire: function () { stale = true; }
  };


  /* a grade's sound file: asked for once (again after a failure, at the next screen that wants it), from the folder
     this file came from; a screen that is open hears about it through the 'tpsound' event */
  var asked = {};
  api.need = function (grade) {
    var f = grade ? 'tp-sound-' + grade + '.js' : '';
    if (!f || (window.__tpSoundFiles || []).indexOf(f) < 0 || asked[f]) return;
    if (typeof document === 'undefined' || !document.createElement || !document.getElementsByTagName) return;
    asked[f] = 'coming';
    var base = '';
    var tags = document.getElementsByTagName('script');
    for (var i = 0; i < tags.length; i++) { var s = tags[i].getAttribute('src') || ''; if (/(^|\/)tp-sound\.js$/.test(s)) base = s.replace(/tp-sound\.js$/, ''); }
    var el = document.createElement('script');
    el.async = true;
    el.src = base + f;
    el.onload = function () { asked[f] = 'in'; try { document.dispatchEvent(new CustomEvent('tpsound', { detail: { file: f } })); } catch (e) {} };
    el.onerror = function () { delete asked[f]; try { if (el.parentNode) el.parentNode.removeChild(el); } catch (e) {} };
    (document.head || document.body || document.documentElement).appendChild(el);
  };

  /* put aside (another app, the lock screen): nothing plays on to nobody, and the audio output is handed back,
     so the phone's other sound can go on and nothing of this page keeps running in the background.
     An iPhone can leave an output silent after such a spell anyway. */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') { api.stop(); drop(); }
  });
})();
