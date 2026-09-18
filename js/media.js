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

/* Shrink until it fits, then stop. Starts at a size that is still worth
   looking at on a phone and steps down only as far as it has to — a photo of a
   defect is evidence, so it should degrade reluctantly. */
export function shrinkImage(file) {
  var STEPS = [
    { px: 1280, q: 0.72 },
    { px: 1280, q: 0.58 },
    { px: 1024, q: 0.55 },
    { px: 800,  q: 0.5  },
    { px: 640,  q: 0.45 }
  ];

  return loadBitmap(file).then(function (bmp) {
    var i = 0;
    function attempt() {
      if (i >= STEPS.length) {
        try { bmp.close && bmp.close(); } catch (e) {}
        return Promise.reject(new Error('too-big'));
      }
      var step = STEPS[i++];
      return draw(bmp, step.px, step.q).then(function (out) {
        if (out.data.length <= MAX_B64) {
          try { bmp.close && bmp.close(); } catch (e) {}
          return out;
        }
        return attempt();
      });
    }
    return attempt();
  });
}

function loadBitmap(file) {
  if (window.createImageBitmap) {
    /* imageOrientation matters: a phone photo carries its rotation in EXIF,
       and a canvas ignores that unless told not to */
    return createImageBitmap(file, { imageOrientation: 'from-image' })
      ['catch'](function () { return createImageBitmap(file); });
  }
  return new Promise(function (resolve, reject) {
    var img = new Image();
    img.onload = function () { resolve(img); };
    img.onerror = function () { reject(new Error('not-an-image')); };
    img.src = URL.createObjectURL(file);
  });
}

function draw(bmp, maxPx, quality) {
  var w = bmp.width, h = bmp.height;
  var scale = Math.min(1, maxPx / Math.max(w, h));
  w = Math.max(1, Math.round(w * scale));
  h = Math.max(1, Math.round(h * scale));

  var c = document.createElement('canvas');
  c.width = w; c.height = h;
  var ctx = c.getContext('2d');
  /* a white ground, so a transparent PNG does not come out black as JPEG */
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);

  return new Promise(function (resolve) {
    resolve({ data: c.toDataURL('image/jpeg', quality), w: w, h: h });
  });
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

export var MAX_SECONDS = 120;

export function canRecord() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia &&
            window.MediaRecorder);
}

function pickType() {
  for (var i = 0; i < AUDIO_TYPES.length; i++) {
    if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(AUDIO_TYPES[i])) {
      return AUDIO_TYPES[i];
    }
  }
  return '';
}

/* Returns a handle: onTick fires each second, stop() resolves with the note,
   cancel() throws it away. The microphone is released either way — a phone
   showing a recording dot after the user thought they had stopped is its own
   kind of broken. */
export function record(onTick) {
  return navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true }
  }).then(function (stream) {
    var type = pickType();
    var opts = { audioBitsPerSecond: 16000 };
    if (type) opts.mimeType = type;
    var rec = new MediaRecorder(stream, opts);
    var chunks = [];
    var started = Date.now();
    var timer = null;
    var settle = null;

    rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = function () {
      if (timer) clearInterval(timer);
      stream.getTracks().forEach(function (t) { t.stop(); });
      var secs = Math.round((Date.now() - started) / 1000);
      var blob = new Blob(chunks, { type: chunks.length ? chunks[0].type : (type || 'audio/webm') });
      if (settle) settle({ blob: blob, seconds: secs });
    };

    rec.start(250);
    if (onTick) {
      timer = setInterval(function () {
        var s = Math.round((Date.now() - started) / 1000);
        onTick(s);
        if (s >= MAX_SECONDS) rec.state === 'recording' && rec.stop();
      }, 250);
    }

    return {
      stop: function () {
        return new Promise(function (resolve, reject) {
          settle = function (out) {
            toDataUrl(out.blob).then(function (data) {
              if (data.length > MAX_B64) { reject(new Error('too-long')); return; }
              resolve({ data: data, mime: out.blob.type, seconds: out.seconds });
            })['catch'](reject);
          };
          if (rec.state === 'recording') rec.stop();
          else settle({ blob: new Blob(chunks), seconds: 0 });
        });
      },
      cancel: function () {
        settle = null;
        if (timer) clearInterval(timer);
        try { if (rec.state === 'recording') rec.stop(); } catch (e) {}
        stream.getTracks().forEach(function (t) { t.stop(); });
      }
    };
  });
}

function toDataUrl(blob) {
  return new Promise(function (resolve, reject) {
    var fr = new FileReader();
    fr.onload = function () { resolve(String(fr.result)); };
    fr.onerror = function () { reject(new Error('read-failed')); };
    fr.readAsDataURL(blob);
  });
}

/* 95 -> "1:35" */
export function clockOf(seconds) {
  var s = Math.max(0, Math.round(seconds || 0));
  return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
}
