/* The Chairman's own page — today as it actually was, underneath the analysis.

   WHY THIS EXISTS
   The agents email him a reading of the day. A reading is an argument, and an
   argument you cannot check is just an assertion. When one of them says the
   factory lost three hours to edge banding, he should be able to put his thumb
   on the report that says so, in the words the person typed, without asking
   anybody. That is what the lower half of this page is.

   The upper half is what the agents made of it, read from Firestore rather
   than from an email, because an email is a bad place to find something again
   three days later and a worse place to find it standing in a factory.

   WHO CAN OPEN IT
   Only him. Not by hiding the link — the rules refuse /reports listing and
   /analysis to everybody else, so a curious person who finds this file gets an
   empty page and a permission error in the console.                          */

import { initializeApp, getApps }
  from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, getDoc, setDoc, query, where, orderBy, onSnapshot,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

(function () {
  'use strict';

  var LANG_KEY = 'klever.lang';
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang === 'am' || urlLang === 'en') store.set(LANG_KEY, urlLang);
  var lang = (urlLang === 'am' || urlLang === 'en' ? urlLang
              : store.get(LANG_KEY)) === 'am' ? 'am' : 'en';

  function t(k) { return T[lang][k]; }
  function L(o) { return (lang === 'am' && o && o.am) ? o.am : (o ? o.en : ''); }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function personById(id) {
    for (var i = 0; i < PEOPLE.length; i++) if (PEOPLE[i].id === id) return PEOPLE[i];
    return null;
  }
  function reportById(id) {
    for (var i = 0; i < REPORTS.length; i++) if (REPORTS[i].id === id) return REPORTS[i];
    return null;
  }
  function nameOf(id) {
    if (id === 'chairman') return lang === 'am' ? 'ሊቀመንበር' : 'Chairman';
    var p = personById(id);
    return p ? L(p) : id;
  }
  function hhmm(d) {
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) +
           '-' + ('0' + d.getDate()).slice(-2);
  }

  var app, auth, db, me = null, root = null;

  function connect() {
    if (app) return;
    app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    auth = getAuth(app);
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      });
    } catch (e) {
      /* fb.js may have initialised it already with the same settings */
      db = initializeFirestore(app, {});
    }
  }

  /* ---------------- the page ---------------- */

  function render() {
    root.innerHTML = '';
    root.appendChild(el('h1', null, t('chOverview')));
    root.appendChild(el('p', 'sub', new Date().toDateString()));

    var tiles = el('div', 'chtiles');
    var tFiled = tile(t('chFiled'), '—');
    var tMissing = tile(t('chMissing'), '—');
    var tOwed = tile(t('chOwed'), '—');
    tiles.appendChild(tFiled.box); tiles.appendChild(tMissing.box); tiles.appendChild(tOwed.box);
    root.appendChild(tiles);

    /* --- what the agents made of it --- */
    root.appendChild(el('p', 'eyebrow', t('chAnalysis')));
    var runBtn = el('button', 'seed', t('chRunNow'));
    runBtn.type = 'button';
    runBtn.onclick = function () { askForRun(runBtn); };
    root.appendChild(runBtn);

    var analysis = el('div', 'chanalysis');
    analysis.appendChild(el('p', 'codenote', t('chNoAnalysis')));
    root.appendChild(analysis);

    /* --- and the day it was made of --- */
    root.appendChild(el('p', 'eyebrow', t('chRaw')));
    var raw = el('div', 'chraw');
    raw.appendChild(el('p', 'codenote', t('chLoading')));
    root.appendChild(raw);

    watchAnalysis(analysis);
    watchReports(raw, tFiled, tMissing, tOwed);
  }

  function tile(label, value) {
    var box = el('div', 'chtile');
    box.appendChild(el('div', 'chtl', label));
    var v = el('div', 'chtv', value);
    box.appendChild(v);
    return { box: box, set: function (x) { v.textContent = x; } };
  }

  /* ---------------- the analysis ---------------- */

  function watchAnalysis(into) {
    onSnapshot(doc(db, 'analysis', today()), function (snap) {
      into.innerHTML = '';
      if (!snap.exists()) {
        into.appendChild(el('p', 'codenote', t('chNoAnalysis')));
        return;
      }
      var d = snap.data();
      var when = d.ranAt && d.ranAt.toDate ? d.ranAt.toDate() : null;
      if (when) into.appendChild(el('p', 'codenote', t('chRanAt') + ' ' + hhmm(when)));

      (d.findings || []).forEach(function (f) {
        var card = el('div', 'chfind ' + (f.kind || 'finding'));
        card.appendChild(el('div', 'chfh', lang === 'am' && f.am ? f.am : f.en));
        card.appendChild(el('div', 'chft', f.text || ''));
        into.appendChild(card);
      });
    }, function () {
      into.innerHTML = '';
      into.appendChild(el('p', 'codeerr', t('chOnlyChairman')));
    });
  }

  function askForRun(btn) {
    btn.disabled = true;
    btn.textContent = t('chAsking');
    setDoc(doc(db, 'control', 'run'), { at: serverTimestamp(), by: me })
      .then(function () {
        btn.textContent = t('chAsked');
        setTimeout(function () { btn.disabled = false; btn.textContent = t('chRunNow'); }, 60000);
      })
      ['catch'](function () {
        btn.disabled = false;
        btn.textContent = t('chRunNow');
        toast(t('chAskFailed'));
      });
  }

  /* ---------------- the raw day ---------------- */

  function watchReports(into, tFiled, tMissing, tOwed) {
    var start = new Date();
    start.setHours(0, 0, 0, 0);

    var q = query(collection(db, 'reports'),
                  where('at', '>=', start), orderBy('at', 'asc'));

    onSnapshot(q, function (snap) {
      into.innerHTML = '';
      var filed = [];
      snap.forEach(function (docu) { filed.push(docu.data()); });

      tFiled.set(String(filed.length));

      /* who owed one today, straight from the same schedule the forms use */
      var due = REPORTS.filter(function (r) {
        var dow = new Date().getDay();
        if (dow === 0) return false;
        if (r.cadence === 'daily') return !(r.skipDays && r.skipDays.indexOf(dow) !== -1);
        if (r.cadence === 'weekly') return r.dueDay === dow;
        if (r.cadence === 'monthly') return new Date().getDate() === 1;
        return false;
      });
      var got = {};
      filed.forEach(function (f) { got[f.report] = true; });
      var missing = due.filter(function (r) { return !got[r.id]; });
      tMissing.set(String(missing.length));
      tOwed.set(t('chSeeEmail'));

      if (!filed.length) {
        into.appendChild(el('p', 'codenote', t('chNothingFiled')));
      }

      filed.forEach(function (f) {
        var rep = reportById(f.report);
        var when = f.at && f.at.toDate ? f.at.toDate() : new Date();

        var card = el('details', 'chrow' + (f.late ? ' late' : ''));
        var head = el('summary');
        head.appendChild(el('span', 'chrw', nameOf(f.person)));
        head.appendChild(el('span', 'chrr', rep ? L(rep) : f.report));
        head.appendChild(el('span', 'chrt', hhmm(when) + (f.late ? ' · ' + t('late') : '')));
        card.appendChild(head);

        var body = el('div', 'chrbody');
        if (f.by && f.by !== f.person) {
          body.appendChild(el('p', 'codenote', t('chFiledBy') + ' ' + nameOf(f.by)));
        }
        body.appendChild(fieldTable(rep, f.values || {}));
        if ((f.flags || []).length) {
          var fl = el('div', 'chflags');
          fl.appendChild(el('div', 'chfl', t('flags')));
          f.flags.forEach(function (x) { fl.appendChild(el('div', null, x)); });
          body.appendChild(fl);
        }
        card.appendChild(body);
        into.appendChild(card);
      });

      if (missing.length) {
        var m = el('div', 'chmissing');
        m.appendChild(el('div', 'chfl', t('chMissingList')));
        missing.forEach(function (r) {
          var p = personById(r.person);
          m.appendChild(el('div', null, (p ? L(p) : r.person) + ' — ' + L(r)));
        });
        into.appendChild(m);
      }
    }, function () {
      into.innerHTML = '';
      into.appendChild(el('p', 'codeerr', t('chOnlyChairman')));
    });
  }

  /* every value the person typed, under the label they saw */
  function fieldTable(rep, values) {
    var wrap = el('div', 'chfields');
    var labels = {};
    if (rep) {
      (rep.sections || []).forEach(function (s) {
        (s.fields || []).forEach(function (f) {
          labels[f.id] = { label: L(f), section: L(s), f: f };
        });
      });
    }
    var lastSection = null;
    Object.keys(values).forEach(function (k) {
      var meta = labels[k];
      var v = values[k];
      if (v === '' || v == null) return;

      if (meta && meta.section !== lastSection) {
        wrap.appendChild(el('div', 'chsec', meta.section));
        lastSection = meta.section;
      }
      var row = el('div', 'chf');
      row.appendChild(el('span', 'chfk', meta ? meta.label : k));
      row.appendChild(el('span', 'chfv', flatten(v)));
      wrap.appendChild(row);
    });
    if (!wrap.childNodes.length) wrap.appendChild(el('p', 'codenote', t('chNoValues')));
    return wrap;
  }

  /* a table or grid comes back as rows of columns; show it rather than [object] */
  function flatten(v) {
    if (v == null) return '';
    if (typeof v !== 'object') return String(v);
    var rows = Object.prototype.toString.call(v) === '[object Array]'
      ? v : Object.keys(v).map(function (k) { return v[k]; });
    return rows.map(function (r) {
      if (r == null) return '';
      if (typeof r !== 'object') return String(r);
      return Object.keys(r).map(function (k) { return r[k]; })
                    .filter(function (x) { return x !== '' && x != null; }).join(' · ');
    }).filter(Boolean).join('   |   ');
  }

  function toast(msg) {
    var e = document.querySelector('.toast');
    if (!e) { e = el('div', 'toast'); document.body.appendChild(e); }
    e.textContent = msg;
    e.classList.add('on');
    setTimeout(function () { e.classList.remove('on'); }, 2600);
  }

  /* ---------------- start ---------------- */

  document.addEventListener('DOMContentLoaded', function () {
    root = document.getElementById('app');
    if (!root) return;
    if (typeof FIREBASE_CONFIG === 'undefined' || !FIREBASE_CONFIG.apiKey) return;
    connect();
    onAuthStateChanged(auth, function (u) {
      me = u && u.email ? u.email.split('@')[0].toLowerCase() : null;
      if (me !== 'chairman') {
        root.innerHTML = '';
        root.appendChild(el('h1', null, t('chOverview')));
        root.appendChild(el('p', 'codeerr', t('chOnlyChairman')));
        return;
      }
      render();
    });
  });
})();
