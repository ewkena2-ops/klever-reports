/* Klever — the factory gate's tablet (gate.html).

   THE ASK (the user, 14 Oct 2026): "the next step, for production, is a face
   scan — because they don't have phones". One tablet at the factory gate, on
   the factory's WiFi; on arriving only; everyone at the factory, the heads
   too. apps-script/Gate.js has the rest of the story.

   ON THE TABLET this page is signed in as the gate's own account and stays
   open all day. The camera looks; a face it knows is checked in — name,
   time, on time or late, in big letters, Amharic and English — and a small
   picture goes with it. A face it does not know: "tap your name", a picture
   is taken, and Amaha or the Chairman looks at it later. A scan that cannot
   go out (the line is down) waits on the tablet and goes when it can, with
   the time it was made.

   FACES are recognised here, on the tablet: face-api (TensorFlow, in the
   browser) turns a face into 128 numbers, and two pictures of one person
   give numbers close together. Each person's numbers — five pictures' worth,
   taken when their face was added — come from /faces. Adding faces: the
   Chairman or Amaha, on the tablet (signed in beside the gate, which stays
   signed in) or on their own phone.

   IN TESTS window.faceapi is put there first, and nothing is loaded.        */

(function () {
  'use strict';

  var LIB = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/dist/face-api.js';
  var MODELS = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/';
  var POST = typeof SAVE_URL === 'string' ? SAVE_URL : '';

  /* HOW ALIKE. The distance between two faces' numbers: 0 is the same
     picture; one person's pictures sit around 0.3, two people's above 0.6.
     A face is taken as someone when it is nearer to them than NEAR, nearer
     by CLEAR than to anyone else, in LOOKS looks running. Anything less
     sure is not guessed at: the person taps their name. */
  var NEAR = 0.45, CLEAR = 0.06, LOOKS = 2;
  var CLOSE = 0.16;              /* a face this wide (of the picture) is at the gate, not walking past */
  var SHOW_MS = 4500;            /* the answer stays on the screen */
  var NAMES_AFTER_MS = 4000;     /* a face seen this long and not known: "tap your name" */
  var NAMES_IDLE_MS = 40000;     /* the list of names closes by itself */
  var AGAIN_MS = 60000;          /* the same face, just checked in, is let be */
  var SAMPLES = 5;               /* pictures taken when a face is added */
  var ENROL_IDLE_MS = 10 * 60000;
  var LATE = 8 * 60;             /* late after 8:00 AM (Attend.js AT_LATE_AFTER_) */
  var QKEY = 'klever.gate.queue', DKEY = 'klever.gate.done.';
  var ENROLLERS = ['chairman', 'amaha'];

  var ETH_AM = ['መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜን'];
  var ETH_EN = ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'];
  var DAYS_AM = ['እሁድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'];
  var DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  var root = null, video = null;
  var faces = [];              /* [{person, name, photo, vecs:[Float32Array]}] */
  var payOnly = null;          /* the payroll-only people, for adding a face */
  var mode = 'boot', sub = '';
  var session = null;          /* whoever is adding faces */
  var queue = [];
  var engineOk = null;         /* null: loading · true · false: could not load */
  var startedAt = Date.now();

  /* ---------------- small things ---------------- */

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function fill(s, v) {
    return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v && v[k] != null ? v[k] : m; });
  }
  function word(k, v) {
    var en = (T.en && T.en[k]) || k;
    return { am: fill((T.am && T.am[k]) || en, v), en: fill(en, v) };
  }
  /* both languages at once: Amharic first and big, English under it */
  function two(k, v, cls) {
    var w = typeof k === 'string' ? word(k, v) : k;
    var d = el('div', 'gtw' + (cls ? ' ' + cls : ''));
    d.appendChild(el('div', 'gtam', w.am));
    if (w.en && w.en !== w.am) d.appendChild(el('div', 'gten', w.en));
    return d;
  }
  function btn(k, cls, fn, v) {
    var b = el('button', 'gtbtn' + (cls ? ' ' + cls : ''));
    b.type = 'button';
    var w = typeof k === 'string' ? word(k, v) : k;
    b.appendChild(el('span', 'gtbam', w.am));
    if (w.en !== w.am) b.appendChild(el('span', 'gtben', w.en));
    b.onclick = fn;
    return b;
  }
  function pad2(n) { return ('0' + n).slice(-2); }
  function addis(ms) { return new Date((ms == null ? Date.now() : ms) + 3 * 3600000); }
  function dayOf(ms) { return addis(ms).toISOString().slice(0, 10); }
  function minsOf(ms) { var a = addis(ms); return a.getUTCHours() * 60 + a.getUTCMinutes(); }
  function clockEn(m) { var h = Math.floor(m / 60), x = m % 60; return (h % 12 || 12) + ':' + pad2(x) + ' ' + (h < 12 ? 'AM' : 'PM'); }
  /* the time as people here say it: 7:52 in the morning is "ጠዋት 1:52" */
  function clockAm(m) {
    var h = Math.floor(m / 60), x = m % 60;
    var part = h >= 6 && h < 12 ? 'ጠዋት' : h >= 12 && h < 18 ? 'ከሰዓት' : h >= 18 ? 'ማታ' : 'ሌሊት';
    return part + ' ' + (((h + 6) % 12) || 12) + ':' + pad2(x);
  }
  function clock(m) { return { am: clockAm(m), en: clockEn(m) }; }
  function durOf(m) {
    var h = Math.floor(m / 60), r = m % 60;
    return { am: (h ? h + ' ሰዓት' + (r ? ' ' : '') : '') + (r || !h ? r + ' ደቂቃ' : ''),
             en: (h ? h + ' h' + (r ? ' ' : '') : '') + (r || !h ? r + ' min' : '') };
  }
  /* the Ethiopian date of a yyyy-mm-dd (apps-script/Attend.js atEth_) */
  function eth(ymd) {
    var y = Number(ymd.slice(0, 4)), m = Number(ymd.slice(5, 7)), day = Number(ymd.slice(8, 10));
    var a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    var jdn = day + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
    var k = jdn - 1723856, r = k % 1461, n = (r % 365) + 365 * Math.floor(r / 1460);
    return { y: 4 * Math.floor(k / 1461) + Math.floor(r / 365) - Math.floor(r / 1460), m: Math.floor(n / 30) + 1, d: (n % 30) + 1 };
  }
  function dateLine(ms) {
    var d = dayOf(ms), e = eth(d), g = new Date(d + 'T12:00:00Z'), w = g.getUTCDay();
    return { am: DAYS_AM[w] + ' ' + ETH_AM[e.m - 1] + ' ' + e.d + ' ' + e.y,
             en: DAYS_EN[w] + ' ' + g.getUTCDate() + ' ' + MON_EN[g.getUTCMonth()] + ' · ' + e.d + ' ' + ETH_EN[e.m - 1] };
  }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function toast(k, v) {
    var t = el('div', 'gttoast');
    t.appendChild(two(k, v));
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3500);
  }

  /* ---------------- the numbers of a face ---------------- */

  function toB64(f32) {
    var b = new Uint8Array(f32.buffer, f32.byteOffset, f32.byteLength), s = '';
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  }
  function fromB64(s) {
    var bin = atob(String(s || '')), b = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
    return new Float32Array(b.buffer, 0, Math.floor(b.length / 4));
  }
  function dist(a, b) {
    var s = 0;
    for (var i = 0; i < a.length; i++) { var d = a[i] - b[i]; s += d * d; }
    return Math.sqrt(s);
  }
  /* the nearest person to a face, how near, and how much nearer than the next */
  function nearest(vec, list, skip) {
    var rank = [];
    (list || []).forEach(function (f) {
      if (f.person === skip) return;
      var m = Infinity;
      (f.vecs || []).forEach(function (v) { if (v.length === vec.length) m = Math.min(m, dist(vec, v)); });
      if (isFinite(m)) rank.push({ person: f.person, d: m });
    });
    if (!rank.length) return null;
    rank.sort(function (a, b) { return a.d - b.d; });
    return { person: rank[0].person, d: rank[0].d, gap: rank.length > 1 ? rank[1].d - rank[0].d : Infinity };
  }
  function sure(m) { return !!m && m.d < NEAR && m.gap > CLEAR; }
  function readFaces(list) {
    return (list || []).map(function (f) {
      return { person: f.person, name: f.name || f.person, photo: f.photo || '',
               vecs: (f.descr || []).map(fromB64).filter(function (v) { return v.length === 128; }) };
    });
  }

  /* ---------------- who is at the gate ---------------- */

  function gatePeople() {
    var out = (typeof PEOPLE !== 'undefined' ? PEOPLE : []).filter(function (p) { return p.gate && !p.company; })
      .map(function (p) { return { id: p.id, name: p.en, am: p.am || p.en, worker: !!p.worker }; });
    var have = {};
    out.forEach(function (p) { have[p.id] = 1; });
    faces.forEach(function (f) {
      if (have[f.person]) return;
      have[f.person] = 1;
      out.push({ id: f.person, name: f.name, am: f.name, worker: true });
    });
    return out.sort(function (a, b) { return a.name < b.name ? -1 : 1; });
  }
  function personOf(id) {
    return gatePeople().filter(function (p) { return p.id === id; })[0] || { id: id, name: id, am: id };
  }
  function faceOf(id) { return faces.filter(function (f) { return f.person === id; })[0] || null; }
  function avatar(id, cls) {
    var f = faceOf(id), p = personOf(id);
    if (f && f.photo) { var i = el('img', 'gtav' + (cls ? ' ' + cls : '')); i.src = f.photo; i.alt = ''; return i; }
    var a = el('div', 'gtav gtini' + (cls ? ' ' + cls : ''), (p.am || p.name || '?').slice(0, 1));
    return a;
  }

  /* ---------------- the camera and the face engine ---------------- */

  function camera() {
    if (video && video.srcObject && video.videoWidth) return Promise.resolve(video);
    video = video || el('video', 'gtvideo');
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Promise.reject(new Error('no camera'));
    return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
      .then(function (st) {
        video.srcObject = st;
        var p = video.play();
        return p && p.then ? p['catch'](function () {}) : null;
      })
      .then(function () {
        return new Promise(function (res) {
          (function wait(n) { if (video.videoWidth || n > 100) res(video); else setTimeout(function () { wait(n + 1); }, 100); })(0);
        });
      });
  }
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.async = true; s.crossOrigin = 'anonymous';
      s.onload = res; s.onerror = function () { rej(new Error('could not load ' + src)); };
      document.head.appendChild(s);
    });
  }
  var engine = null;
  function loadEngine() {
    if (engine) return engine;
    engine = (window.faceapi ? Promise.resolve() : loadScript(LIB)).then(function () {
      var fa = window.faceapi;
      return Promise.resolve(fa.tf && fa.tf.ready ? fa.tf.ready() : null).then(function () {
        return Promise.all([fa.nets.tinyFaceDetector.loadFromUri(MODELS),
                            fa.nets.faceLandmark68Net.loadFromUri(MODELS),
                            fa.nets.faceRecognitionNet.loadFromUri(MODELS)]);
      });
    }).then(function () {
      engineOk = true;
      /* the stronger finder, after: the gate works without it meanwhile */
      var ssd = window.faceapi.nets.ssdMobilenetv1;
      if (ssd && !ssd.isLoaded) ssd.loadFromUri(MODELS)['catch'](function () {});
      return window.faceapi;
    }, function (e) {
      engineOk = false; engine = null; throw e;
    });
    return engine;
  }
  /* Every face in the picture now, with its numbers. Two ways to find a
     face: the small finder is quick but misses a face turned, tilted or in
     poor light (tried on real faces, 14 Oct 2026); the stronger one finds
     those but is slower. At the gate ('fast') the quick one looks every
     time and the stronger one when it saw nothing, at most every 1.5 s;
     adding a face, or checking a tapped name's picture ('best'), uses the
     stronger one. */
  var lastStrong = 0;
  function look(size, how) {
    var fa = window.faceapi;
    if (!fa || !engineOk || !video || !video.videoWidth) return Promise.resolve([]);
    var ssd = fa.nets.ssdMobilenetv1;
    var strong = function () {
      lastStrong = Date.now();
      return Promise.resolve(fa.detectAllFaces(video, new fa.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks().withFaceDescriptors()).then(function (r) { return r || []; });
    };
    var haveStrong = !!(ssd && ssd.isLoaded && fa.SsdMobilenetv1Options);
    if (how === 'best' && haveStrong) return strong();
    return Promise.resolve(fa.detectAllFaces(video, new fa.TinyFaceDetectorOptions({ inputSize: size || 320, scoreThreshold: 0.45 }))
      .withFaceLandmarks().withFaceDescriptors()).then(function (r) {
        r = r || [];
        if (r.length || !haveStrong || Date.now() - lastStrong < 1500) return r;
        return strong();
      });
  }
  /* a small square picture around a face (or the middle of the picture) */
  function snap(box, size) {
    size = size || 200;
    var vw = video.videoWidth || 640, vh = video.videoHeight || 480, cx, cy, s;
    if (box) { cx = box.x + box.width / 2; cy = box.y + box.height / 2; s = Math.max(box.width, box.height) * 1.7; }
    else { cx = vw / 2; cy = vh / 2; s = Math.min(vw, vh); }
    s = Math.min(s, vw, vh);
    var x = Math.max(0, Math.min(vw - s, cx - s / 2)), y = Math.max(0, Math.min(vh - s, cy - s / 2));
    var c = document.createElement('canvas');
    c.width = c.height = size;
    try { c.getContext('2d').drawImage(video, x, y, s, s, 0, 0, size, size); } catch (e) { return ''; }
    return c.toDataURL('image/jpeg', 0.72);
  }
  function showCamera(into) {
    if (!video) return;
    into.appendChild(video);
    var p = video.play();
    if (p && p['catch']) p['catch'](function () {});
  }
  function biggest(found, min) {
    var vw = (video && video.videoWidth) || 640;
    return (found || []).filter(function (f) { return f.detection.box.width / vw >= (min || CLOSE); })
      .sort(function (a, b) { return b.detection.box.width - a.detection.box.width; })[0] || null;
  }

  /* ---------------- scans that wait to go out ---------------- */

  function saveQueue() { store(QKEY, queue.slice(-200)); }
  function doneOf(day) { return store(DKEY + day) || {}; }
  /* yesterday's list of who came is of no use today */
  function sweepDone() {
    try {
      var today = DKEY + dayOf();
      for (var i = localStorage.length - 1; i >= 0; i--) {
        var k = localStorage.key(i);
        if (k && k.indexOf(DKEY) === 0 && k !== today) localStorage.removeItem(k);
      }
    } catch (e) {}
  }
  var pumping = false, retry = null;
  function pump() {
    if (pumping || !queue.length || !POST || !window.FB) return;
    pumping = true;
    var item = queue[0];
    window.FB.token().then(function (tok) {
      if (!tok) throw new Error('signin');
      return fetch(POST, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                           body: JSON.stringify({ kind: 'gate', idToken: tok, person: item.person, how: item.how,
                                                  dist: item.dist, at: item.at, photo: item.photo }) });
    }).then(function (r) { return r.text(); }).then(function (txt) {
      var a = null;
      try { a = JSON.parse(txt); } catch (e) { a = null; }
      if (a && a.why === 'not-gate') problem('gtNotGate');
      if (!a || (!a.ok && a.why !== 'unknown')) throw new Error(String(txt).slice(0, 80));
      queue.shift();
      saveQueue();
      pumping = false;
      drawQueue();
      if (queue.length) pump();
    })['catch'](function () {
      pumping = false;
      drawQueue();
      clearTimeout(retry);
      retry = setTimeout(pump, 20000);
    });
  }

  /* ---------------- the gate ---------------- */

  var K = {};                  /* the kiosk's parts */
  var streak = null, seenSince = 0, lastFace = 0, letBe = {}, looking = false, namesTimer = null;

  function kiosk() {
    mode = 'kiosk';
    sub = 'idle';
    root.innerHTML = '';
    var screen = el('div', 'gtscreen');
    var cam = el('div', 'gtcam');
    K.ring = el('div', 'gtring');
    cam.appendChild(K.ring);
    screen.appendChild(cam);
    var side = el('div', 'gtside');
    K.clock = el('div', 'gtclock');
    side.appendChild(K.clock);
    K.say = el('div', 'gtsay');
    side.appendChild(K.say);
    K.answer = el('div', 'gtanswer');
    side.appendChild(K.answer);
    K.tap = btn('gtTapName', 'gttap', function () { names(); });
    side.appendChild(K.tap);
    K.queue = el('div', 'gtqueue');
    side.appendChild(K.queue);
    screen.appendChild(side);
    var corner = el('button', 'gtcorner', '⚙');
    corner.type = 'button';
    corner.setAttribute('aria-label', word('gtFacesBtn').en);
    corner.onclick = function () { enrolSignIn(); };
    screen.appendChild(corner);
    root.appendChild(screen);
    showCamera(cam);
    cam.appendChild(K.ring);
    K.layer = el('div', 'gtlayer');
    root.appendChild(K.layer);
    tickClock();
    drawQueue();
    idleWords();
    loop();
  }
  function tickClock() {
    if (!K.clock || mode !== 'kiosk') return;
    var m = minsOf(), d = dateLine();
    K.clock.innerHTML = '';
    K.clock.appendChild(el('div', 'gttime', clockAm(m)));
    K.clock.appendChild(el('div', 'gttime2', clockEn(m)));
    K.clock.appendChild(two(d, null, 'gtdate'));
  }
  var said = '';
  function say(k, v) {
    if (!K.say) return;
    var key = k + JSON.stringify(v || {});
    if (key === said) return;
    said = key;
    K.say.innerHTML = '';
    K.say.className = 'gtsay ' + k;
    K.say.appendChild(two(k, v));
    if (K.tap) K.tap.classList.toggle('glow', k === 'gtUnknown' || k === 'gtNoFacesYet' || k === 'gtNoEngine');
  }
  function idleWords() {
    said = '';
    say(engineOk === false ? 'gtNoEngine' : engineOk === null ? 'gtStarting' : faces.length ? 'gtLook' : 'gtNoFacesYet');
  }
  function drawQueue() {
    if (!K.queue) return;
    K.queue.innerHTML = '';
    if (queue.length) K.queue.appendChild(two('gtWaiting', { n: queue.length }));
  }
  function problem(k) {
    toast(k);
  }

  /* look, again and again, while the gate is waiting */
  function loop() {
    if (mode !== 'kiosk') return;
    if (sub !== 'idle' || looking || document.hidden || !engineOk || !video || !video.videoWidth) {
      setTimeout(loop, 400);
      return;
    }
    looking = true;
    look(320).then(function (found) { looking = false; seen(found); }, function () { looking = false; })
      .then(function () { setTimeout(loop, Date.now() - lastFace > 120000 ? 900 : 200); });
  }
  function seen(found) {
    if (mode !== 'kiosk' || sub !== 'idle') return;
    if (!found.length) {
      /* a face the finder lost for a moment is still there: only after a
         second and a half with none is the gate empty again */
      if (Date.now() - lastFace < 1500) return;
      streak = null; seenSince = 0;
      K.ring.className = 'gtring';
      say(faces.length ? 'gtLook' : 'gtNoFacesYet');
      return;
    }
    lastFace = Date.now();
    var big = biggest(found);
    if (!big) { streak = null; K.ring.className = 'gtring far'; say('gtCloser'); return; }
    if (!seenSince) seenSince = Date.now();
    var m = nearest(big.descriptor, faces);
    if (sure(m)) {
      if (letBe[m.person] > Date.now()) return;
      streak = streak && streak.person === m.person ? { person: m.person, n: streak.n + 1 } : { person: m.person, n: 1 };
      if (streak.n < LOOKS) { K.ring.className = 'gtring near'; say('gtHold'); return; }
      var who = m.person, photo = snap(big.detection.box);
      streak = null; seenSince = 0;
      letBe[who] = Date.now() + AGAIN_MS;
      checkIn(who, 'face', m.d, photo);
      return;
    }
    streak = null;
    K.ring.className = 'gtring near';
    say(Date.now() - seenSince > NAMES_AFTER_MS || !faces.length ? 'gtUnknown' : 'gtHold');
  }

  /* one person in: kept on the tablet at once, sent when it can be */
  function checkIn(person, how, d, photo) {
    var now = Date.now(), day = dayOf(now), m = minsOf(now);
    var done = doneOf(day);
    if (done[person]) { answer(person, { already: true, m: done[person].m }); return; }
    var sunday = new Date(day + 'T12:00:00Z').getUTCDay() === 0;
    var late = !sunday && m > LATE;
    done[person] = { m: m, late: late, how: how };
    store(DKEY + day, done);
    queue.push({ person: person, how: how, dist: d == null ? null : Math.round(d * 1000) / 1000, at: now, photo: photo || '' });
    saveQueue();
    drawQueue();
    pump();
    answer(person, { m: m, late: late, mins: late ? m - LATE : 0, how: how, sunday: sunday });
  }
  /* the answer, big, for a few seconds */
  function answer(person, a) {
    sub = 'answer';
    closeLayer();
    var p = personOf(person);
    var box = el('div', 'gtresult ' + (a.already ? 'again' : a.late ? 'late' : 'good'));
    box.appendChild(avatar(person, 'big'));
    var txt = el('div', 'gtresulttxt');
    txt.appendChild(two({ am: p.am || p.name, en: p.name }, null, 'gtname'));
    var c = clock(a.m);
    if (a.already) txt.appendChild(two({ am: fill(word('gtAlready').am, { at: c.am }), en: fill(word('gtAlready').en, { at: c.en }) }, null, 'gtstatus'));
    else if (a.sunday) txt.appendChild(two({ am: '✓ ' + c.am + ' — ' + word('gtSunday').am, en: '✓ ' + c.en + ' — ' + word('gtSunday').en }, null, 'gtstatus'));
    else if (a.late) {
      var l = durOf(a.mins);
      txt.appendChild(two({ am: fill(word('gtLate').am, { at: c.am, m: l.am }), en: fill(word('gtLate').en, { at: c.en, m: l.en }) }, null, 'gtstatus'));
    } else txt.appendChild(two({ am: fill(word('gtOnTime').am, { at: c.am }), en: fill(word('gtOnTime').en, { at: c.en }) }, null, 'gtstatus'));
    if (a.how === 'tap') txt.appendChild(two('gtTapNote', null, 'gtsmall'));
    box.appendChild(txt);
    K.answer.innerHTML = '';
    K.answer.appendChild(box);
    K.ring.className = 'gtring ' + (a.already ? 'again' : a.late ? 'late' : 'good');
    say('gtWelcome');
    clearTimeout(K.answerTimer);
    K.answerTimer = setTimeout(function () {
      if (mode !== 'kiosk') return;
      K.answer.innerHTML = '';
      sub = 'idle';
      K.ring.className = 'gtring';
      idleWords();
    }, SHOW_MS);
  }

  /* ---------------- "tap your name" ---------------- */

  function closeLayer() {
    clearTimeout(namesTimer);
    if (K.layer) { K.layer.innerHTML = ''; K.layer.className = 'gtlayer'; }
  }
  function names() {
    if (mode !== 'kiosk') return;
    sub = 'names';
    closeLayer();
    K.layer.className = 'gtlayer on';
    var head = el('div', 'gtlayerhead');
    head.appendChild(two('gtNamesTitle'));
    head.appendChild(btn('gtBack', 'gtghost', back));
    K.layer.appendChild(head);
    var grid = el('div', 'gtnames');
    gatePeople().forEach(function (p) {
      var b = el('button', 'gtnamebtn');
      b.type = 'button';
      b.appendChild(avatar(p.id));
      var n = el('span', 'gtnamewords');
      n.appendChild(el('span', 'gtbam', p.am || p.name));
      if (p.am && p.am !== p.name) n.appendChild(el('span', 'gtben', p.name));
      b.appendChild(n);
      b.onclick = function () { confirmTap(p); };
      grid.appendChild(b);
    });
    K.layer.appendChild(grid);
    idleNames();
    K.layer.onpointerdown = idleNames;
  }
  function idleNames() {
    clearTimeout(namesTimer);
    namesTimer = setTimeout(back, NAMES_IDLE_MS);
  }
  function back() {
    closeLayer();
    if (mode !== 'kiosk') return;
    sub = 'idle';
    idleWords();
  }
  /* "is this you?" — with the picture taken now; a face must be in it */
  function confirmTap(p) {
    var found = engineOk ? null : [];
    var go = function () {
      var big = biggest(found || [], 0.08);
      if (engineOk && !big) { toast('gtNoFaceSeen'); return; }
      var photo = snap(big ? big.detection.box : null, 240);
      closeLayer();
      sub = 'confirm';
      K.layer.className = 'gtlayer on';
      var box = el('div', 'gtconfirm');
      box.appendChild(two('gtIsThisYou'));
      var pic = el('img', 'gtsnap');
      pic.src = photo;
      pic.alt = '';
      box.appendChild(pic);
      box.appendChild(two({ am: p.am || p.name, en: p.name }, null, 'gtname'));
      var row = el('div', 'gtrow');
      row.appendChild(btn('gtYesMe', 'gtyes', function () { closeLayer(); checkIn(p.id, 'tap', null, photo); }));
      row.appendChild(btn('gtNotMe', 'gtghost', back));
      box.appendChild(row);
      K.layer.appendChild(box);
      idleNames();
    };
    if (engineOk) look(416, 'best').then(function (f) { found = f; go(); }, function () { found = []; go(); });
    else go();
  }

  /* ---------------- adding faces ---------------- */

  /* on the tablet: the Chairman or Amaha signs in beside the gate */
  function enrolSignIn() {
    if (mode !== 'kiosk') return;
    sub = 'signin';
    closeLayer();
    K.layer.className = 'gtlayer on';
    var box = el('div', 'gtform');
    box.appendChild(two('gtWhoAdds'));
    var who = 'amaha';
    var picks = el('div', 'gtrow');
    [['amaha', 'gtAmaha'], ['chairman', 'gtChairman']].forEach(function (x) {
      var b = btn(x[1], 'gtpick' + (x[0] === who ? ' on' : ''), function () {
        who = x[0];
        Array.prototype.forEach.call(picks.children, function (c) { c.classList.toggle('on', c === b); });
      });
      picks.appendChild(b);
    });
    box.appendChild(picks);
    var pw = passwordBox();
    box.appendChild(pw);
    var row = el('div', 'gtrow');
    var go = btn('gtSignIn', 'gtyes', function () {
      if (!pw.value) return;
      go.disabled = true;
      window.FB.enrolAs(who, pw.value).then(function (s) {
        enrolStart(s);
      }, function () {
        go.disabled = false;
        toast('gtSignInFailed');
      });
    });
    row.appendChild(go);
    row.appendChild(btn('gtCancel', 'gtghost', back));
    box.appendChild(row);
    K.layer.appendChild(box);
    pw.focus();
  }
  function passwordBox() {
    var pw = el('input', 'gtinput');
    pw.type = 'password';
    pw.autocomplete = 'current-password';
    pw.placeholder = word('gtPassword').am + ' · ' + word('gtPassword').en;
    pw.setAttribute('aria-label', word('gtPassword').en);
    return pw;
  }

  var idleEnrol = null, E = {};
  function touch() {
    clearTimeout(idleEnrol);
    if (mode === 'enrol' && window.FB.who() === 'gate') idleEnrol = setTimeout(enrolEnd, ENROL_IDLE_MS);
  }
  function enrolStart(s) {
    session = s;
    mode = 'enrol';
    sub = 'list';
    touch();
    if (payOnly === null) {
      payOnly = [];
      s.token().then(function (tok) {
        return fetch(POST, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                             body: JSON.stringify({ kind: 'gate', act: 'people', idToken: tok }) });
      }).then(function (r) { return r.json(); }).then(function (a) {
        if (a && a.ok) { payOnly = a.people || []; if (mode === 'enrol' && sub === 'list') enrolList(); }
      })['catch'](function () { payOnly = null; });
    }
    enrolList();
  }
  function enrolEnd() {
    clearTimeout(idleEnrol);
    var s = session;
    session = null;
    if (s) { try { s.end(); } catch (e) {} }
    if (window.FB.who() === 'gate') kiosk();
    else location.href = 'index.html';
  }
  function enrolList() {
    if (!session) return;
    sub = 'list';
    root.innerHTML = '';
    var page = el('div', 'gtenrol');
    page.onpointerdown = touch;
    var head = el('div', 'gtenrolhead');
    head.appendChild(two('gtFacesTitle'));
    head.appendChild(two('gtFacesWho', { who: session.who === 'chairman' ? word('gtChairman').en : word('gtAmaha').en }, 'gtsmall'));
    head.appendChild(btn('gtDone', 'gtghost', enrolEnd));
    page.appendChild(head);
    if (window.FB.who() !== 'gate') {
      page.appendChild(two('gtOwnPhone', null, 'gtnote'));
      page.appendChild(btn('gtSignOut', 'gtghost', function () {
        session = null;
        window.FB.signOut().then(function () { setTimeout(start, 300); });
      }));
    }
    if (engineOk === false) page.appendChild(two('gtNoEngine', null, 'gtnote bad'));
    var all = gatePeople().filter(function (p) { return !/^pay-/.test(p.id); });
    var n = all.filter(function (p) { return faceOf(p.id); }).length;
    page.appendChild(two('gtFacesCount', { n: n, all: all.length }, 'gtcount'));
    var list = el('div', 'gtlist');
    all.slice().sort(function (a, b) { return (faceOf(a.id) ? 1 : 0) - (faceOf(b.id) ? 1 : 0) || (a.name < b.name ? -1 : 1); })
      .forEach(function (p) { list.appendChild(enrolRow(p)); });
    page.appendChild(list);
    /* the payroll-only people: their face added means they are at the gate */
    var extra = (payOnly || []).concat(faces.filter(function (f) { return /^pay-/.test(f.person); })
      .map(function (f) { return { id: f.person, name: f.name }; }));
    var seenIds = {};
    extra = extra.filter(function (x) { if (seenIds[x.id]) return false; seenIds[x.id] = 1; return true; });
    if (extra.length) {
      page.appendChild(two('gtOthers', null, 'gtsub'));
      var l2 = el('div', 'gtlist');
      extra.forEach(function (x) { l2.appendChild(enrolRow({ id: x.id, name: x.name, am: x.name, role: x.role })); });
      page.appendChild(l2);
    }
    root.appendChild(page);
  }
  function enrolRow(p) {
    var f = faceOf(p.id);
    var r = el('div', 'gtlrow' + (f ? ' has' : ''));
    r.appendChild(f ? avatar(p.id) : el('div', 'gtav gtini none', '✕'));
    var w = el('div', 'gtlname');
    w.appendChild(el('div', 'gtbam', p.am || p.name));
    if (p.am && p.am !== p.name) w.appendChild(el('div', 'gtben', p.name));
    if (p.role) w.appendChild(el('div', 'gtben', p.role));
    r.appendChild(w);
    var acts = el('div', 'gtlacts');
    acts.appendChild(btn(f ? 'gtAgain' : 'gtAddFace', f ? 'gtghost' : 'gtyes', function () { enrolPerson(p); }));
    if (f) {
      var rm = btn('gtRemove', 'gtghost danger', null);
      var armed = 0;
      rm.onclick = function () {
        if (!armed) {
          armed = setTimeout(function () { armed = 0; rm.classList.remove('armed'); }, 5000);
          rm.classList.add('armed');
          toast('gtSure');
          return;
        }
        clearTimeout(armed);
        rm.disabled = true;
        session.deleteFace(p.id).then(function () { setTimeout(enrolList, 300); }, function () { rm.disabled = false; toast('gtSaveFailed'); });
      };
      acts.appendChild(rm);
    }
    r.appendChild(acts);
    return r;
  }
  var STEPS = ['gtStep1', 'gtStep2', 'gtStep3', 'gtStep4', 'gtStep5'];
  function enrolPerson(p) {
    sub = 'capture';
    touch();
    root.innerHTML = '';
    var page = el('div', 'gtenrol cap');
    page.appendChild(two({ am: fill(word('gtEnrolFor').am, { name: p.am || p.name }), en: fill(word('gtEnrolFor').en, { name: p.name }) }, null, 'gtsub'));
    var cam = el('div', 'gtcam');
    var ring = el('div', 'gtring');
    page.appendChild(cam);
    var step = el('div', 'gtsay');
    page.appendChild(step);
    var dots = el('div', 'gtdots');
    page.appendChild(dots);
    page.appendChild(two('gtEnrolHow', null, 'gtnote'));
    var row = el('div', 'gtrow');
    row.appendChild(btn('gtCancel', 'gtghost', function () { stop = true; enrolList(); }));
    page.appendChild(row);
    root.appendChild(page);
    showCamera(cam);
    cam.appendChild(ring);
    var shots = [], stop = false, last = 0, warned = 0;
    function draw() {
      step.innerHTML = '';
      step.appendChild(two(STEPS[Math.min(shots.length, STEPS.length - 1)]));
      dots.innerHTML = '';
      for (var i = 0; i < SAMPLES; i++) dots.appendChild(el('span', 'gtdot' + (i < shots.length ? ' on' : '')));
    }
    draw();
    if (!engineOk) { step.innerHTML = ''; step.appendChild(two('gtNoEngine')); return; }
    (function next() {
      if (stop || sub !== 'capture') return;
      look(416, 'best').then(function (found) {
        if (stop || sub !== 'capture') return;
        if (found.length > 1) {
          ring.className = 'gtring late';
          if (Date.now() - warned > 3000) { warned = Date.now(); toast('gtOneFace'); }
        } else {
          var big = biggest(found, 0.2);
          if (big && big.detection.score >= 0.55 && Date.now() - last > 700) {
            last = Date.now();
            shots.push({ vec: big.descriptor, photo: shots.length ? '' : snap(big.detection.box, 160) });
            ring.className = 'gtring good';
            draw();
          } else ring.className = 'gtring' + (found.length ? ' near' : '');
        }
        if (shots.length >= SAMPLES) { judge(p, shots); return; }
        setTimeout(next, 150);
      }, function () { setTimeout(next, 500); });
    })();
  }
  /* the pictures must be of one person, and not of someone already known */
  function judge(p, shots) {
    var spread = 0;
    for (var i = 0; i < shots.length; i++) for (var j = i + 1; j < shots.length; j++) spread = Math.max(spread, dist(shots[i].vec, shots[j].vec));
    if (spread > 0.6) { toast('gtEnrolMixed'); setTimeout(function () { enrolPerson(p); }, 1500); return; }
    var like = null;
    shots.forEach(function (s) {
      var m = nearest(s.vec, faces, p.id);
      if (m && m.d < 0.4 && (!like || m.d < like.d)) like = m;
    });
    var save = function () {
      sub = 'saving';
      session.saveFace(p.id, p.name, shots.map(function (s) { return toB64(new Float32Array(s.vec)); }), shots[0].photo)
        .then(function () { toast('gtSaved', { name: p.am || p.name }); enrolList(); },
              function () { toast('gtSaveFailed'); enrolList(); });
    };
    if (!like) { save(); return; }
    sub = 'like';
    root.innerHTML = '';
    var page = el('div', 'gtenrol');
    var other = personOf(like.person);
    page.appendChild(two({ am: fill(word('gtEnrolLike').am, { name: other.am || other.name, who: p.am || p.name }),
                           en: fill(word('gtEnrolLike').en, { name: other.name, who: p.name }) }, null, 'gtsub'));
    var pics = el('div', 'gtrow');
    var a = el('img', 'gtsnap'); a.src = shots[0].photo; a.alt = '';
    pics.appendChild(a);
    pics.appendChild(avatar(like.person, 'big'));
    page.appendChild(pics);
    var row = el('div', 'gtrow');
    row.appendChild(btn('gtSaveAnyway', 'gtyes', save));
    row.appendChild(btn('gtCancel', 'gtghost', enrolList));
    page.appendChild(row);
    root.appendChild(page);
  }

  /* ---------------- signing in ---------------- */

  function signInPage() {
    mode = 'signin';
    root.innerHTML = '';
    var box = el('div', 'gtform solo');
    box.appendChild(two('gtSignInTitle', null, 'gtsub'));
    box.appendChild(two('gtSignInSub', null, 'gtnote'));
    var who = 'gate';
    var picks = el('div', 'gtrow');
    [['gate', 'gtGateAcct'], ['amaha', 'gtAmaha'], ['chairman', 'gtChairman']].forEach(function (x) {
      var b = btn(x[1], 'gtpick' + (x[0] === who ? ' on' : ''), function () {
        who = x[0];
        Array.prototype.forEach.call(picks.children, function (c) { c.classList.toggle('on', c === b); });
      });
      picks.appendChild(b);
    });
    box.appendChild(picks);
    var pw = passwordBox();
    box.appendChild(pw);
    var go = btn('gtSignIn', 'gtyes', function () {
      if (!pw.value) return;
      go.disabled = true;
      window.FB.signIn(who, pw.value).then(function () {
        (function wait(n) { if (window.FB.who() === who || n > 30) start(); else setTimeout(function () { wait(n + 1); }, 100); })(0);
      }, function () {
        go.disabled = false;
        toast('gtSignInFailed');
      });
    });
    pw.onkeydown = function (e) { if (e.key === 'Enter') go.onclick(); };
    box.appendChild(go);
    root.appendChild(box);
  }
  function message(k, extra) {
    mode = 'message';
    root.innerHTML = '';
    var box = el('div', 'gtform solo');
    box.appendChild(two(k, null, 'gtsub'));
    if (extra) box.appendChild(extra);
    root.appendChild(box);
  }

  /* ---------------- start ---------------- */

  var stopFaces = null;
  function start() {
    root.innerHTML = '';
    root.appendChild(two('gtStarting', null, 'gtsub gtwait'));
    var who = window.FB.who();
    if (!window.FB.live() && !who) { message('gtOffline'); return; }
    if (!who) { signInPage(); return; }
    if (who !== 'gate' && ENROLLERS.indexOf(who) === -1) {
      var a = el('a', 'gtbtn gtghost', '← Klever');
      a.href = 'index.html';
      message('gtNotForYou', a);
      return;
    }
    if (!stopFaces) {
      stopFaces = window.FB.watchFaces(function (list) {
        if (list === null) return;
        faces = readFaces(list);
        if (mode === 'enrol' && sub === 'list') enrolList();
        if (mode === 'kiosk' && sub === 'idle') idleWords();
      });
    }
    (function tryEngine() {
      loadEngine().then(function () {
        if (mode === 'kiosk' && sub === 'idle') idleWords();
      }, function () {
        /* tapping names still works; the engine is tried again */
        if (mode === 'kiosk' && sub === 'idle') idleWords();
        setTimeout(tryEngine, 120000);
      });
    })();
    camera().then(function () {
      if (who === 'gate') {
        kiosk();
        awake();
      } else {
        var s = window.FB.enrolSelf();
        if (s) enrolStart(s); else signInPage();
      }
    }, function () {
      message('gtNoCamera');
    });
  }

  /* the screen stays on; once a night the page starts afresh */
  function awake() {
    try {
      if (navigator.wakeLock) {
        navigator.wakeLock.request('screen').then(null, function () {});
        document.addEventListener('visibilitychange', function () {
          if (!document.hidden) navigator.wakeLock.request('screen').then(null, function () {});
        });
      }
    } catch (e) {}
    document.addEventListener('pointerdown', function full() {
      document.removeEventListener('pointerdown', full);
      try { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen()['catch'](function () {}); } catch (e) {}
    });
  }
  setInterval(function () {
    tickClock();
    var m = minsOf();
    if (mode === 'kiosk' && sub === 'idle' && m >= 180 && m < 190 && Date.now() - startedAt > 3600000) location.reload();
  }, 15000);
  window.addEventListener('online', pump);

  window.GATE = {
    nearest: nearest, sure: sure, dist: dist, toB64: toB64, fromB64: fromB64, readFaces: readFaces,
    dayOf: dayOf, minsOf: minsOf, eth: eth, clockAm: clockAm, clockEn: clockEn,
    state: function () { return { mode: mode, sub: sub, queue: queue.length, faces: faces.length, engine: engineOk }; }
  };

  function boot() {
    root = document.getElementById('gate');
    if (!root) return;
    document.documentElement.lang = 'am';
    queue = store(QKEY) || [];
    sweepDone();
    if (!window.FB) { setTimeout(boot, 100); return; }
    window.FB.ready.then(function () { start(); setTimeout(pump, 1500); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
