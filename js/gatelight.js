/* The factory gate in poor light (js/gate.js).

   THE PROBLEM (26 Oct 2026, the user: "the face detect on low light — it
   doesn't even see a face, so Amaha is struggling with it"). In a dim room
   the camera's picture is dark and flat; the face is there, but the face
   finders, made from well-lit photographs, do not see one.

   kleverLight.measure(video) — how bright the picture is now, from a tiny
   copy of it: { mean, lo, hi } in 0..255 (lo and hi: the darkest and the
   brightest 2 %, so a lamp in the corner does not count), and `dark`.

   kleverLight.brighten(video, m) — the picture made fit to look at: the
   dark room's grain smoothed a little (a 1-pixel blur), then its darkest
   part set to black and its brightest to white. A canvas, the same size as
   the picture (640 wide at most): the finders and the face numbers are
   worked out on it, so a dim face is read as a lit one.

   Chosen on the real engine (kit s3/gate_light_try.js, a real face with the
   light cut to 30, 18 and 10 % and a dark room's grain): the strong finder
   saw no face in any of the dark pictures as they were, and saw it in all
   five this way, the same person in four (the fifth taps their name).
   Lifting the shadows too (a gamma), or blurring more, did worse.          */
(function () {
  'use strict';
  var DARK = 70;          /* mean brightness under this: the picture is brightened */
  var probe = null, probeX = null, out = null, outX = null, lut = new Uint8ClampedArray(256), lutKey = '';

  function size(src) {
    var w = src.videoWidth || src.naturalWidth || src.width || 0, h = src.videoHeight || src.naturalHeight || src.height || 0;
    return { w: w, h: h };
  }
  function measure(src) {
    var s = size(src);
    if (!s.w || !s.h) return null;
    probe = probe || document.createElement('canvas');
    probe.width = 64; probe.height = 48;
    probeX = probeX || probe.getContext('2d', { willReadFrequently: true });
    try { probeX.drawImage(src, 0, 0, 64, 48); } catch (e) { return null; }
    var d = probeX.getImageData(0, 0, 64, 48).data, hist = new Array(256).fill(0), n = 0, sum = 0;
    for (var i = 0; i < d.length; i += 4) {
      var y = (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8;
      hist[y]++; sum += y; n++;
    }
    var cut = n * 0.02, lo = 0, hi = 255, acc = 0;
    for (var a = 0; a < 256; a++) { acc += hist[a]; if (acc > cut) { lo = a; break; } }
    acc = 0;
    for (var b = 255; b >= 0; b--) { acc += hist[b]; if (acc > cut) { hi = b; break; } }
    var mean = sum / n;
    return { mean: Math.round(mean), lo: lo, hi: hi, dark: mean < DARK };
  }
  function brighten(src, m) {
    var s = size(src);
    if (!s.w || !s.h) return src;
    m = m || measure(src);
    if (!m) return src;
    var scale = Math.min(1, 640 / s.w), w = Math.round(s.w * scale), h = Math.round(s.h * scale);
    out = out || document.createElement('canvas');
    if (out.width !== w) out.width = w;
    if (out.height !== h) out.height = h;
    outX = outX || out.getContext('2d', { willReadFrequently: true });
    /* the grain first (where the browser can blur a canvas; elsewhere it is only stretched) */
    if ('filter' in outX) outX.filter = 'blur(1px)';
    outX.drawImage(src, 0, 0, w, h);
    if ('filter' in outX) outX.filter = 'none';
    /* lo..hi stretched to 0..255 */
    var lo = m.lo, hi = Math.max(m.hi, lo + 16);
    var key = lo + ':' + hi;
    if (key !== lutKey) {
      for (var v = 0; v < 256; v++) lut[v] = Math.round(255 * Math.min(1, Math.max(0, (v - lo) / (hi - lo))));
      lutKey = key;
    }
    var img = outX.getImageData(0, 0, w, h), p = img.data;
    for (var i = 0; i < p.length; i += 4) { p[i] = lut[p[i]]; p[i + 1] = lut[p[i + 1]]; p[i + 2] = lut[p[i + 2]]; }
    outX.putImageData(img, 0, 0);
    return out;
  }
  window.kleverLight = { measure: measure, brighten: brighten, DARK: DARK };
})();
