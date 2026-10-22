/* Klever — a page nobody is looking at stops reading the database.

   WHY. The database is on Firebase's free plan: 50,000 reads a day, and
   past that every read is refused until 10:00 AM Addis (midnight in
   California). On Thu 22 Oct 2026 it was out before anyone came to work —
   171,000 reads since the morning before, with the server's own share about
   a hundred requests an hour. The rest were pages left open: two or three
   phones and computers all night, the Chairman's page among them, each
   holding some forty live views of the reports, the ledger, the scans. A
   page that loses its line for more than half an hour — a computer asleep,
   a tab Chrome put to sleep, a phone in a pocket — reads every one of them
   again when the line comes back, a few thousand reads each time, whether
   or not anybody looks (the owner: "can we prevent this from our code?").

   WHAT. Firestore's own switch, disableNetwork: the page keeps what it
   already has on screen (the offline cache) and asks for nothing more.
     - In the background (another tab, another app, the screen off) for
       two minutes: off.
     - On screen with nobody touching it for twenty minutes (a computer
       left on the Chairman's page): off, with a line at the foot of the
       page saying so.
     - Back on the moment anyone looks or touches: enableNetwork, and the
       page catches up with whatever came in.
   Never while a report or a message is still on its way
   (waitForPendingWrites first). The factory gate's tablet does not load
   this file: it must see every face, all day.

   Used by js/fb.js (every page that has it) and js/chat.js (the chat page,
   which starts its own Firestore). One page, one switch: a second attach is
   ignored. */
(function () {
  'use strict';

  var HIDDEN_MS = 2 * 60000;
  var IDLE_MS = 20 * 60000;
  var ACTIVE = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll', 'mousemove'];

  var S = null;            /* the one switch on this page */

  function attach(db, F, opt) {
    if (S) return S.api;
    if (!db || !F || typeof F.disableNetwork !== 'function' || typeof F.enableNetwork !== 'function') return null;
    opt = opt || {};
    var doc = opt.document || document, win = opt.window || window;
    var now = opt.now || function () { return Date.now(); };
    var later = opt.setTimeout || function (fn, ms) { return setTimeout(fn, ms); };
    var cancel = opt.clearTimeout || function (t) { clearTimeout(t); };
    var T = win.KLEVER_QUIET_TEST || {};            /* the kit's browser tests: shorter waits */
    var hiddenMs = opt.hiddenMs || T.hiddenMs || HIDDEN_MS, idleMs = opt.idleMs || T.idleMs || IDLE_MS;

    S = { off: false, why: '', last: now(), hideT: null, idleT: null, bar: null, pauses: 0, resumes: 0, api: null };

    function hidden() { return doc.visibilityState === 'hidden' || doc.hidden === true; }
    function still(why) { return why === 'hidden' ? hidden() : !hidden() && now() - S.last >= idleMs; }

    function show() {
      if (S.bar || !doc.body || !doc.createElement) return;
      var b = doc.createElement('div');
      b.className = 'quietbar';
      b.setAttribute('role', 'status');
      b.textContent = 'Paused to save the database — tap anywhere to update · ዳታቤዙን ለመቆጠብ ቆሟል — ለማደስ የትም ይንኩ';
      b.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9999;max-width:calc(100% - 32px);' +
        'box-sizing:border-box;padding:10px 16px;border-radius:12px;font:14px/1.35 system-ui,sans-serif;text-align:center;' +
        'background:var(--ink,#1f2328);color:var(--paper,#fff);box-shadow:0 4px 16px rgba(0,0,0,.25);cursor:pointer';
      doc.body.appendChild(b);
      S.bar = b;
    }
    function hide() {
      if (S.bar && S.bar.parentNode) S.bar.parentNode.removeChild(S.bar);
      S.bar = null;
    }

    function pause(why) {
      if (S.off || !still(why)) return;
      var go = function () {
        if (S.off || !still(why)) return;
        S.off = true; S.why = why; S.pauses++;
        Promise.resolve(F.disableNetwork(db)).then(null, function () { S.off = false; S.why = ''; });
        if (why === 'idle') show();
      };
      /* a report or a message still going out goes first */
      if (typeof F.waitForPendingWrites === 'function') {
        Promise.resolve(F.waitForPendingWrites(db)).then(go, function () {});
      } else go();
    }
    function resume() {
      hide();
      if (!S.off) return;
      S.off = false; S.why = ''; S.resumes++;
      Promise.resolve(F.enableNetwork(db)).then(null, function () {});
    }

    function armIdle() {
      if (S.idleT) cancel(S.idleT);
      var wait = Math.max(1000, idleMs - (now() - S.last));
      S.idleT = later(function () {
        S.idleT = null;
        if (hidden()) return;                   /* the hidden timer has it */
        if (now() - S.last >= idleMs) pause('idle'); else armIdle();
      }, wait);
    }
    function onVis() {
      if (S.hideT) { cancel(S.hideT); S.hideT = null; }
      if (hidden()) {
        S.hideT = later(function () { S.hideT = null; pause('hidden'); }, hiddenMs);
      } else {
        S.last = now();
        resume();
        armIdle();
      }
    }
    var lastMove = 0;
    function onActive(e) {
      var t = now();
      /* a mouse resting on the desk sends moves now and then; only a real one counts, and not more than once a second */
      if (e && e.type === 'mousemove') { if (t - lastMove < 1000) return; lastMove = t; }
      S.last = t;
      if (S.off && !hidden()) resume();
      if (!S.idleT && !hidden()) armIdle();
    }

    doc.addEventListener('visibilitychange', onVis);
    ACTIVE.forEach(function (k) { (k === 'scroll' ? win : doc).addEventListener(k, onActive, { passive: true, capture: true }); });
    if (hidden()) onVis(); else armIdle();

    S.api = {
      state: function () { return { off: S.off, why: S.why, pauses: S.pauses, resumes: S.resumes, bar: !!S.bar }; },
      resume: resume
    };
    return S.api;
  }

  window.KLEVER_QUIET = {
    attach: attach,
    state: function () { return S && S.api ? S.api.state() : null; },
    HIDDEN_MS: HIDDEN_MS, IDLE_MS: IDLE_MS,
    _reset: function () { S = null; }        /* tests only */
  };
})();
