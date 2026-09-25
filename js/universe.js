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
  function t(k) { return T[lang][k]; }

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

    var start0 = new Date();
    start0.setHours(0, 0, 0, 0);
    onSnapshot(query(collection(db, 'reports'), where('at', '>=', start0), orderBy('at', 'asc')), function (qs) {
      var out = [];
      qs.forEach(function (d) {
        var x = d.data({ serverTimestamps: 'estimate' });
        if (!x.at || !x.at.toDate) return;
        out.push({ report: x.report, person: x.person, at: x.at.toDate(), values: x.values || {}, late: !!x.late });
      });
      data.filings = out;
      push();
    }, function () {});

    onSnapshot(query(collection(db, 'analysis'), orderBy('day', 'desc'), limit(1)), function (qs) {
      if (qs.empty) { data.findings = []; data.analysisDay = null; }
      else {
        var d = qs.docs[0].data();
        data.findings = d.findings || [];
        data.analysisDay = d.dayLabel || d.day || null;
      }
      push();
    }, function () {});

    onSnapshot(query(collection(db, 'instructions'), orderBy('at', 'desc'), limit(100)), function (qs) {
      var out = [];
      qs.forEach(function (d) { out.push(d.data()); });
      data.instructions = out;
      push();
    }, function () {});

    /* a new day is a new company: at midnight, start again */
    var mid = new Date();
    mid.setHours(24, 0, 5, 0);
    setTimeout(function () { location.reload(); }, mid - new Date());
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
