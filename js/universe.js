/* The universe page — all of Klever, and the group around it, in 3D.

   universe3d.js draws; this file only fetches and hands over. Three things,
   all of them the Chairman's to read and nobody else's (the rules refuse
   everyone else, so a curious person who finds this page gets an empty
   company): today's filed reports, the agents' latest reading, and the
   instructions he has given. Who owes what today, and to whom it goes, come
   from the same schedule the forms use — nothing here decides that again.

   A device that cannot draw in 3D is told so, and pointed at the two pages
   that show the same day flat.                                              */

import { initializeApp, getApps }
  from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, query, where, orderBy, limit, onSnapshot
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

(function () {
  'use strict';

  var LANG_KEY = 'klever.lang';
  function stored() { try { return localStorage.getItem(LANG_KEY); } catch (e) { return null; } }
  var urlLang = new URLSearchParams(location.search).get('lang');
  var lang = (urlLang === 'am' || urlLang === 'en' ? urlLang : stored()) === 'am' ? 'am' : 'en';
  /* a word not yet translated falls back to its English; one missing from
     both stays undefined, so universe3d's own default is used */
  function t(k) { var s = T[lang][k]; return s != null ? s : T.en[k]; }

  /* Addis Ababa is three hours ahead of UTC all year — no summer time — so
     the date there is the UTC date of the moment three hours on. The day
     this page draws begins at Addis midnight, the ledger's midnight, not
     at whatever midnight the phone happens to be set to. */
  var ADDIS = '+03:00';
  function utcYmd(d) {
    return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) +
           '-' + ('0' + d.getUTCDate()).slice(-2);
  }
  function addisYmd(d) { return utcYmd(new Date((d ? d.getTime() : Date.now()) + 3 * 3600e3)); }
  function dayStart(day) { return new Date(day + 'T00:00:00' + ADDIS); }
  function addDays(day, n) {
    var d = new Date(day + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return utcYmd(d);
  }
  function dow(day) { return new Date(day + 'T12:00:00Z').getUTCDay(); }
  function deadline(r, day) { return new Date(day + 'T' + (r.dueTime || '17:30') + ':00' + ADDIS); }

  /* Late the way the ledger judges it (apps-script/Agent.js, settle_): the
     server's time against the letter's deadline on the due day the report
     answers to — for a weekly one the next due day within six days, for a
     monthly one the 1st (the 2nd when the 1st is a Sunday) within seven,
     or the one just gone. The phone's own "late" flag is not read. */
  function monthlyDueOn(day) {
    var dd = day.slice(8);
    return (dd === '01' && dow(day) !== 0) || (dd === '02' && dow(day) === 1);
  }
  function dueDayFor(r, day) {
    var i, d;
    if (r.cadence === 'weekly') {
      for (i = 0; i <= 6; i++) { d = addDays(day, i); if (dow(d) === r.dueDay) return d; }
    } else if (r.cadence === 'monthly') {
      for (i = 0; i <= 7; i++) { d = addDays(day, i); if (monthlyDueOn(d)) return d; }
      for (i = 1; i <= 31; i++) { d = addDays(day, -i); if (monthlyDueOn(d)) return d; }
    }
    return day;
  }
  function lateFiling(reportId, at) {
    var r = null;
    for (var i = 0; i < REPORTS.length; i++) if (REPORTS[i].id === reportId) { r = REPORTS[i]; break; }
    if (!r) return false;
    return at.getTime() > deadline(r, dueDayFor(r, addisYmd(at))).getTime();
  }

  var app, auth, db;

  function connect() {
    if (app) return;
    app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    auth = getAuth(app);
    /* fb.js has already set Firestore up on this page; asking again with a
       second cache throws, so the instance it made is the one to use */
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      });
    } catch (e) {
      db = getFirestore(app);
    }
  }

  function strings() {
    var out = {};
    ['group', 'groupStats', 'klever', 'title', 'money', 'replay', 'live', 'coLive', 'coOff', 'coLiveSub', 'coOffSub',
     'flyIn', 'chairman', 'filed', 'late', 'missing', 'in', 'out', 'centre', 'files', 'receives',
     'instructions', 'nothing', 'agent', 'openObs', 'outside', 'notReported', 'birr', 'dept', 'people', 'noOne', 'noOneSub', 'fromKlever', 'toKidan', 'payKidan',
     'payKidanShort', 'roveM2', 'forRove'].forEach(function (k) {
      out[k] = t('un' + k.charAt(0).toUpperCase() + k.slice(1));
    });
    /* the words the observatory already uses for the same things */
    out.wantsYou = t('obLegendLoud');
    out.worth = t('obLegendWarm');
    out.quiet = t('obLegendQuiet');
    out.noReading = t('obStateNone');
    out.said = t('obSaid');
    out.noSaid = t('obNoSaid');
    out.close = t('obClose');
    return out;
  }

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  /* A listener that fails used to fail in silence, leaving an empty
     company that looked like a quiet day. One line says why instead —
     refused, the free plan's daily limit, or no connection. It lives on the
     body, not in the page's root, because the 3D engine clears the root
     when it mounts. */
  var errLine = null;
  function failed(e) {
    var c = String((e && e.code) || '').replace(/^firestore\//, '');
    var msg = c === 'permission-denied' ? t('chOnlyChairman')
            : (c === 'resource-exhausted' ? t('chQuota') : t('chLoadFailed'));
    if (!errLine) {
      errLine = el('p', 'codeerr unerr');
      errLine.setAttribute('role', 'alert');
      document.body.appendChild(errLine);
    }
    errLine.textContent = msg;
  }

  var data = { filings: [], findings: [], instructions: [] };
  var world = null, rootEl = null, waiting = null;

  function push() { if (world) world.update(data); }

  function flatOnly() {
    rootEl.innerHTML = '';
    var box = el('div', 'uni-nogl');
    box.appendChild(el('p', null, t('unNoGl')));
    var links = el('div', 'uni-nogl-links');
    var a1 = el('a', 'obs-open', t('chOverview')); a1.href = 'chairman.html';
    var a2 = el('a', 'obs-open', t('obOpen')); a2.href = 'agents.html';
    links.appendChild(a1); links.appendChild(a2);
    box.appendChild(links);
    rootEl.appendChild(box);
  }

  function mount() {
    if (world || !window.KleverUniverse) return;
    if (waiting) { waiting.parentNode && waiting.parentNode.removeChild(waiting); waiting = null; }
    try {
      world = window.KleverUniverse.mount(rootEl, {
        lang: lang,
        text: strings(),
        people: PEOPLE,
        due: window.KLEVER.dueToday(),
        recipientsOf: window.KLEVER.recipientsOf,
        onLost: function () { try { world.destroy(); } catch (e) {} world = null; flatOnly(); }
      });
      push();
    } catch (e) {
      world = null;
      flatOnly();
    }
  }

  function start(root) {
    document.title = t('unKicker') + ' · Klever';
    rootEl = root;
    root.innerHTML = '';
    waiting = el('p', 'uni-wait', t('unOpening'));
    root.appendChild(waiting);
    window.addEventListener('klever-universe', mount);
    mount();

    /* the engine comes from the CDN; if it never arrives, say so */
    setTimeout(function () { if (!world && waiting) flatOnly(); }, 20000);

    var DAY = addisYmd();
    /* the past week too: a weekly report filed on Wednesday for Friday is
       Friday's, and a monthly one may come in the week before the 1st */
    onSnapshot(query(collection(db, 'reports'), where('at', '>=', dayStart(addDays(DAY, -7))), orderBy('at', 'asc')), function (qs) {
      var out = [];
      qs.forEach(function (d) {
        var x = d.data({ serverTimestamps: 'estimate' });
        if (!x.at || !x.at.toDate) return;
        var at = x.at.toDate();
        out.push({ report: x.report, person: x.person, at: at, values: x.values || {},
                   late: lateFiling(x.report, at) });
      });
      data.filings = out;
      push();
    }, failed);

    onSnapshot(query(collection(db, 'analysis'), orderBy('day', 'desc'), limit(1)), function (qs) {
      if (qs.empty) { data.findings = []; data.analysisDay = null; }
      else {
        var d = qs.docs[0].data();
        data.findings = d.findings || [];
        data.analysisDay = d.dayLabel || d.day || null;
      }
      push();
    }, failed);

    /* Every open instruction, however old. The newest hundred used to be
       read and the open ones picked out, so an old one never closed fell
       off the end — the very one worth seeing. The universe draws only the
       open ones, so only they are read. */
    onSnapshot(query(collection(db, 'instructions'), where('status', '==', 'open')), function (qs) {
      var out = [];
      qs.forEach(function (d) { out.push(d.data()); });
      data.instructions = out;
      push();
    }, failed);

    /* A new day is a new company: at Addis midnight, start again — and when
       the page comes back into view on a later day than it was drawn for,
       since a phone asleep in a pocket runs no timers. */
    (function arm() {
      var wait = dayStart(addDays(DAY, 1)).getTime() + 5000 - Date.now();
      setTimeout(function () {
        if (addisYmd() !== DAY) location.reload(); else arm();
      }, Math.max(wait, 1000));
    })();
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && addisYmd() !== DAY) location.reload();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('app');
    if (!root || typeof FIREBASE_CONFIG === 'undefined' || !FIREBASE_CONFIG.apiKey) return;
    connect();
    var started = false;
    onAuthStateChanged(auth, function (u) {
      var me = u && u.email ? u.email.split('@')[0].toLowerCase() : null;
      if (me !== 'chairman') {
        /* app.js shows the sign-in card to someone signed out; a signed-in
           member of staff is told plainly whose page this is */
        if (me) {
          root.innerHTML = '';
          root.appendChild(el('p', 'codeerr', t('chOnlyChairman')));
        }
        return;
      }
      if (!started) { started = true; start(root); }
    });
  });
})();
