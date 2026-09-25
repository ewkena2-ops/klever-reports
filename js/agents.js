/* The observatory page — the sixteen agents as a star system.

   orbit.js draws; this file only fetches. It reads the newest reading from
   /analysis (which only the Chairman may read — the rules refuse everyone
   else, so a curious person who finds this page gets the sky and nothing in
   it) and hands it over. "Analyse now" writes the same one document the
   Chairman's page writes; a trigger picks it up within ten minutes.        */

import { initializeApp, getApps }
  from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, setDoc, query, orderBy, limit, onSnapshot, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

(function () {
  'use strict';

  var LANG_KEY = 'klever.lang';
  function stored() { try { return localStorage.getItem(LANG_KEY); } catch (e) { return null; } }
  var urlLang = new URLSearchParams(location.search).get('lang');
  var lang = (urlLang === 'am' || urlLang === 'en' ? urlLang : stored()) === 'am' ? 'am' : 'en';
  function t(k) { return T[lang][k]; }

  var app, auth, db, orbit = null;

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

  /* the agents run at six every morning, Addis time (UTC+3, whatever the
     phone's own zone); the next one is the next six */
  function nextSix() {
    var n = Date.now(), a = new Date(n + 3 * 3600e3);
    var six = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate(), 6) - 3 * 3600e3;
    if (six <= n) six += 864e5;
    return new Date(six);
  }

  function strings() {
    var keys = ['kicker', 'title', 'lastReading', 'noReading', 'nextReading', 'inTime', 'soFar',
                'analyse', 'asking', 'asked', 'wantYou', 'allQuiet', 'awaiting', 'legendLoud',
                'legendWarm', 'legendQuiet', 'stateNone', 'reads', 'said', 'noSaid', 'close', 'sun'];
    var out = {};
    keys.forEach(function (k) { out[k] = t('ob' + k.charAt(0).toUpperCase() + k.slice(1)); });
    return out;
  }

  /* The flat sky first — it needs nothing but this site — and the 3D one
     the moment its engine has arrived. On a slow line that is a few seconds
     of the flat sky; on a phone that cannot draw in 3D it is the flat sky
     for good. The latest reading is kept here so either can be handed it. */
  var latest = { findings: [], meta: { next: nextSix() } }, is3d = false, rootEl = null;
  function opts() {
    return {
      lang: lang,
      text: strings(),
      onAnalyse: function () {
        return setDoc(doc(db, 'control', 'run'), { at: serverTimestamp(), by: 'chairman' });
      },
      onLost: function () { fallBack(); }
    };
  }
  function flat() {
    orbit = KleverOrbit.mount(rootEl, opts());
    orbit.update(latest.findings, latest.meta);
  }
  function fallBack() {
    if (orbit) { try { orbit.destroy(); } catch (e) {} }
    is3d = false;
    flat();
  }
  function tryDepth() {
    if (is3d || !orbit || !window.KleverOrbit3D) return;
    try { orbit.destroy(); } catch (e) {}
    try {
      orbit = window.KleverOrbit3D.mount(rootEl, opts());
      is3d = true;
      orbit.update(latest.findings, latest.meta);
    } catch (e) {
      fallBack();
    }
  }

  function start(root) {
    document.title = t('obKicker') + ' · Klever';
    rootEl = root;
    flat();
    window.addEventListener('klever-orbit3d', tryDepth);
    tryDepth();
    var q = query(collection(db, 'analysis'), orderBy('day', 'desc'), limit(1));
    onSnapshot(q, function (qs) {
      if (qs.empty) {
        latest = { findings: [], meta: { next: nextSix() } };
      } else {
        var d = qs.docs[0].data();
        latest = { findings: d.findings || [], meta: {
          dayLabel: d.dayLabel || d.day,
          ranAt: d.ranAt && d.ranAt.toDate ? d.ranAt.toDate() : null,
          provisional: !!d.provisional,
          next: nextSix()
        } };
      }
      orbit.update(latest.findings, latest.meta);
    }, function () {
      orbit.update([], { next: nextSix() });
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
          var p = document.createElement('p');
          p.className = 'codeerr';
          p.textContent = t('chOnlyChairman');
          root.appendChild(p);
        }
        return;
      }
      if (!started) { started = true; start(root); }
    });
  });
})();
