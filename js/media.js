/* Pictures and voice notes, small enough to live inside the message.

   WHY NOT FIREBASE STORAGE
   Storage needs the paid Blaze plan — since February 2026 a Spark project gets
   403 on every bucket. Klever is on Spark, and attaching a card to send a photo
   of a chipped door is the wrong trade. So the media travels inside the message
   document itself.

   WHAT THAT COSTS US
   A Firestore document is capped at 1 MiB, and base64 inflates bytes by about a
   third. So everything here is built around a budget: get under MAX_B64 or do
   not send. In practice that is not tight — a site photo shrunk to 1280px lands
   near 200KB, and a minute of speech at 16kbps is about 120KB. What it does
   rule out is documents: a supplier's PDF will not fit, and should go by email
   until somebody decides Storage is worth the card.

   THE OTHER REASON TO KEEP THEM SMALL
   Every phone that opens a channel downloads every message in it. A 3MB photo
   is not just a storage problem, it is somebody's data bundle on a site with
   one bar of signal.                                                        */

/* the rules refuse anything larger; keep a margin under the 1 MiB document cap */
export var MAX_B64 = 700000;

/* ---------------------------------------------------------------- *
 *  Pictures                                                         *
 * ---------------------------------------------------------------- */

/* The largest file we will even try to open. Anything bigger is a RAW file
   or a scan, and decoding it can take all the memory a budget phone has —
   the tab dies and the person thinks the chat is broken. Better to say no
   before starting. */
var MAX_FILE = 25 * 1024 * 1024;

/* Decode no larger than this on the long side. The biggest step below is
   1280, so this leaves room; the point is never to hold a 48-megapixel
   bitmap in memory only to throw most of it away. */
var DECODE_PX = 1600;

/* Shrink until it fits, then stop. Starts at a size that is still worth
   looking at on a phone and steps down only as far as it has to — a photo of a
   defect is evidence, so it should degrade reluctantly.

   Rejects with one of three reasons the chat turns into words:
     file-huge     over MAX_FILE, not attempted
     not-an-image  the phone cannot read it (HEIC on Android, a PDF, a
                   broken file)
     too-big       read fine, but will not fit even at the smallest step */
export function shrinkImage(file) {
  var STEPS = [
    { px: 1280, q: 0.72 },
    { px: 1280, q: 0.58 },
    { px: 1024, q: 0.55 },
    { px: 800,  q: 0.5  },
    { px: 640,  q: 0.45 }
  ];

  if (!file) return Promise.reject(new Error('not-an-image'));
  if (file.size > MAX_FILE) return Promise.reject(new Error('file-huge'));

  return loadBitmap(file).then(function (bmp) {
    var i = 0;
    function done() { try { if (bmp.close) bmp.close(); } catch (e) {} }
    function attempt() {
      if (i >= STEPS.length) {
        done();
        return Promise.reject(new Error('too-big'));
      }
      var step = STEPS[i++];
      var out;
      try { out = draw(bmp, step.px, step.q); }
      catch (e) { done(); return Promise.reject(new Error('not-an-image')); }
      /* a canvas that could not be drawn hands back "data:," rather than
         failing; that is not a picture, and the rules would refuse it */
      if (out.data.indexOf('data:image/jpeg;base64,') !== 0) {
        done();
        return Promise.reject(new Error('not-an-image'));
      }
      if (out.data.length <= MAX_B64) {
        done();
        return Promise.resolve(out);
      }
      return attempt();
    }
    return attempt();
  });
}

/* Read the picture's size first, cheaply: an <img> learns its dimensions
   without decoding every pixel, and it already knows which way up the
   phone was held. */
function probe(file) {
  return new Promise(function (resolve, reject) {
    var url;
    try { url = URL.createObjectURL(file); }
    catch (e) { reject(new Error('not-an-image')); return; }
    var img = new Image();
    img.decoding = 'async';
    img.onload = function () {
      /* the picture is loaded; the address is no longer needed, and a
         forgotten one keeps the whole file in memory until the tab closes */
      URL.revokeObjectURL(url);
      var w = img.naturalWidth, h = img.naturalHeight;
      if (!w || !h) { reject(new Error('not-an-image')); return; }
      resolve({ img: img, w: w, h: h });
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      reject(new Error('not-an-image'));
    };
    img.src = url;
  });
}

function loadBitmap(file) {
  return probe(file).then(function (p) {
    if (!window.createImageBitmap) return p.img;
    /* Decode straight to a sensible size. Only the width is given, so the
       browser keeps the proportions itself — whichever way round it applies
       the phone's rotation, the result is never larger than DECODE_PX and
       never stretched. imageOrientation matters: a phone photo carries its
       rotation in EXIF, and a canvas ignores that unless told not to. */
    var scale = Math.min(1, DECODE_PX / Math.max(p.w, p.h));
    var opts = { imageOrientation: 'from-image', resizeQuality: 'medium' };
    if (scale < 1) opts.resizeWidth = Math.max(1, Math.round(p.w * scale));
    return createImageBitmap(file, opts)['catch'](function () {
      /* an older browser that does not take these options: the <img>
         already holds the picture, the right way up */
      return p.img;
    });
  });
}

function draw(bmp, maxPx, quality) {
  var w0 = bmp.naturalWidth || bmp.width, h0 = bmp.naturalHeight || bmp.height;
  var scale = Math.min(1, maxPx / Math.max(w0, h0));
  var w = Math.max(1, Math.round(w0 * scale));
  var h = Math.max(1, Math.round(h0 * scale));

  var c = document.createElement('canvas');
  c.width = w; c.height = h;
  var ctx = c.getContext('2d');
  if (!ctx) throw new Error('not-an-image');
  /* a white ground, so a transparent PNG does not come out black as JPEG */
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  var data = c.toDataURL('image/jpeg', quality);
  /* hand the pixels back now rather than whenever the collector gets round
     to it — on an old phone that decides whether the next step fits */
  c.width = 0; c.height = 0;
  return { data: data, w: w, h: h };
}

/* ---------------------------------------------------------------- *
 *  Voice                                                            *
 * ---------------------------------------------------------------- */

/* Opus where the browser has it, which is everywhere except older Safari.
   16kbps mono is speech-grade — about 2KB a second, so two minutes fits with
   room to spare. Nobody is recording music. */
var AUDIO_TYPES = [
  'audio/webm;codecs=opus',
  'audio/ogg;codecs=opus',
  'audio/webm',
  'audio/mp4'
];

/* What to call a note when the recorder does not say what it made. The
   rules only take data:audio/..., so a note with no type at all
   (application/octet-stream) is refused — a name from this list is not. */
var FALLBACK_TYPES = [
  'audio/webm;codecs=opus',
  'audio/ogg;codecs=opus',
  'audio/mp4'
];

export var MAX_SECONDS = 120;

export function canRecord() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia &&
            window.MediaRecorder);
}

function firstSupported(list) {
  for (var i = 0; i < list.length; i++) {
    if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(list[i])) {
      return list[i];
    }
  }
  return '';
}

function pickType() { return firstSupported(AUDIO_TYPES); }

/* Tidy a type into the one shape the rules accept:
   audio/<name>[;codecs=<one codec>]. Browsers disagree on the rest —
   Firefox writes "audio/ogg; codecs=opus", Safari may quote the codec —
   and a stray space or quote is enough for the server to refuse the note. */
function cleanMime(raw) {
  var s = String(raw || '').toLowerCase().replace(/[\s"']/g, '');
  if (!s) return '';
  var parts = s.split(';');
  /* an audio-only recording is sometimes labelled video/webm */
  var base = parts[0].replace(/^video\//, 'audio/');
  if (!/^audio\/[a-z0-9.+-]+$/.test(base)) return '';
  var codec = '';
  for (var i = 1; i < parts.length; i++) {
    if (parts[i].indexOf('codecs=') === 0) {
      var c = parts[i].slice(7).split(',')[0];
      if (/^[a-z0-9.]+$/.test(c)) codec = c;
    }
  }
  var out = base + (codec ? ';codecs=' + codec : '');
  if (out.length <= 80) return out;
  return base.length <= 80 ? base : '';
}

function mimeFor(rec, chunks) {
  return cleanMime(rec && rec.mimeType) ||
         cleanMime(chunks.length ? chunks[0].type : '') ||
         cleanMime(firstSupported(FALLBACK_TYPES)) ||
         'audio/webm';
}

/* Returns a handle: onTick fires with the seconds so far, stop() resolves
   with the note, cancel() throws it away. The microphone is released either
   way — a phone showing a recording dot after the user thought they had
   stopped is its own kind of broken.

   At MAX_SECONDS the recording stops by itself, but it is KEPT: onLimit
   fires, the microphone is released, and stop() then hands over the two
   minutes already said. Throwing away what somebody just spent two minutes
   explaining is worse than any length limit. */
export function record(onTick, onLimit) {
  return navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true }
  }).then(function (stream) {
    function release() {
      if (timer) { clearInterval(timer); timer = null; }
      stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} });
    }

    var type = pickType();
    var opts = { audioBitsPerSecond: 16000 };
    if (type) opts.mimeType = type;
    var rec;
    try { rec = new MediaRecorder(stream, opts); }
    catch (e) {
      try { rec = new MediaRecorder(stream); }
      catch (e2) { release(); throw e2; }
    }

    var chunks = [];
    var started = Date.now();
    var timer = null;
    var settle = null;      /* set by stop(): where the finished note goes */
    var finished = null;    /* the note, once the recorder has stopped */
    var dropped = false;    /* cancel() was called */
    var capped = false;     /* stopped itself at MAX_SECONDS */

    function elapsed() {
      return Math.min(MAX_SECONDS, Math.round((Date.now() - started) / 1000));
    }

    rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = function () {
      release();
      if (dropped) { chunks = []; return; }
      var mime = mimeFor(rec, chunks);
      finished = { blob: new Blob(chunks, { type: mime }), mime: mime, seconds: elapsed() };
      if (settle) settle(finished);
      else if (capped && onLimit) onLimit(finished.seconds);
    };

    rec.start(250);
    timer = setInterval(function () {
      var s = Math.round((Date.now() - started) / 1000);
      if (onTick) onTick(Math.min(s, MAX_SECONDS));
      if (s >= MAX_SECONDS && rec.state === 'recording') {
        capped = true;
        clearInterval(timer);
        timer = null;
        rec.stop();
      }
    }, 250);

    return {
      stop: function () {
        return new Promise(function (resolve, reject) {
          settle = function (out) {
            settle = null;
            if (!out.blob.size) { reject(new Error('empty')); return; }
            toDataUrl(out.blob, out.mime).then(function (data) {
              if (data.length > MAX_B64) { reject(new Error('too-long')); return; }
              resolve({ data: data, mime: out.mime, seconds: out.seconds });
            }, reject);
          };
          if (finished) { settle(finished); return; }
          if (rec.state !== 'inactive') {
            try { rec.stop(); return; } catch (e) {}
          }
          /* the recorder is already gone (it failed) — send what it left */
          var mime = mimeFor(rec, chunks);
          release();
          settle({ blob: new Blob(chunks, { type: mime }), mime: mime, seconds: elapsed() });
        });
      },
      cancel: function () {
        dropped = true;
        settle = null;
        finished = null;
        try { if (rec.state !== 'inactive') rec.stop(); } catch (e) {}
        release();
        chunks = [];
      },
      capped: function () { return capped; }
    };
  });
}

/* The data URL is put together here rather than taken from FileReader as it
   comes, so its type is always the tidied one above and it always starts
   data:audio/ — which is what the rules check, character for character. */
function toDataUrl(blob, mime) {
  return new Promise(function (resolve, reject) {
    var fr = new FileReader();
    fr.onload = function () {
      var s = String(fr.result || '');
      var at = s.indexOf('base64,');
      var b64 = at === -1 ? '' : s.slice(at + 7);
      if (!b64) { reject(new Error('empty')); return; }
      resolve('data:' + mime + ';base64,' + b64);
    };
    fr.onerror = function () { reject(new Error('read-failed')); };
    fr.readAsDataURL(blob);
  });
}

/* 95 -> "1:35" */
export function clockOf(seconds) {
  var s = Math.max(0, Math.round(seconds || 0));
  return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
}
