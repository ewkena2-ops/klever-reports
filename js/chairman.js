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
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, getDoc, setDoc, addDoc, updateDoc, query, where, orderBy, limit,
  onSnapshot, serverTimestamp
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

  /* A word not yet translated shows in English rather than as a blank
     button — i18n.js and this file are published separately. */
  function t(k) { var s = T[lang][k]; return s != null ? s : T.en[k]; }
  function L(o) { return (lang === 'am' && o && o.am) ? o.am : (o ? o.en : ''); }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = cls === 'chft' ? bullets(txt) : txt;
    return e;
  }
  /* the model writes its bullets as "* "; on his page they read as bullets */
  function bullets(s) {
    return String(s).replace(/^[ \t]*[*-][ \t]+/gm, '• ');
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
  function birr(n) { return Number(n || 0).toLocaleString('en-US'); }

  /* A tile is a third of a phone wide. Six digits and their commas do not
     fit, and a figure cut to "5,0…" is worse than no figure: it reads as
     five thousand. From a hundred thousand up it is shown short — 125k,
     1.25M — and the exact number is in the tile's tooltip. */
  function short(n) {
    n = Number(n || 0);
    var a = Math.abs(n), sign = n < 0 ? '-' : '';
    if (a < 100000) return birr(n);
    if (Math.round(a / 1000) < 1000) return sign + Math.round(a / 1000) + 'k';
    var m = a / 1e6;
    var s = m < 10 ? m.toFixed(2) : (m < 100 ? m.toFixed(1) : m.toFixed(0));
    if (s.indexOf('.') !== -1) s = s.replace(/\.?0+$/, '');
    return sign + s + 'M';
  }
  /* the exact figure, for the tooltip — only when the tile shows it short */
  function exact(n) {
    return Math.abs(Number(n || 0)) >= 100000 ? birr(n) + ' ' + t('unBirr') : null;
  }

  /* ---------------- Addis time ---------------- */

  /* Addis Ababa is three hours ahead of UTC all year — it keeps no summer
     time — so the date there is the UTC date of the moment three hours on.
     Every "which day", "which weekday" and "when was it due" on this page is
     asked in Addis, the way the ledger asks it, and never of the phone: his
     phone may be set to any zone, or be abroad with him, and a page that
     closed the day at a different midnight from the ledger's would disagree
     with it about who was late. */
  var ADDIS = '+03:00';
  var DAYS = {
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    am: ['እሑድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ']
  };
  var MONTHS = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
         'August', 'September', 'October', 'November', 'December'],
    am: ['ጃንዩወሪ', 'ፌብሩወሪ', 'ማርች', 'ኤፕሪል', 'ሜይ', 'ጁን', 'ጁላይ',
         'ኦገስት', 'ሴፕቴምበር', 'ኦክቶበር', 'ኖቬምበር', 'ዲሴምበር']
  };
  function utcYmd(d) {
    return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) +
           '-' + ('0' + d.getUTCDate()).slice(-2);
  }
  /* the Addis date of a moment — of now, when no moment is given */
  function addisYmd(d) { return utcYmd(new Date((d ? d.getTime() : Date.now()) + 3 * 3600e3)); }
  function today() { return addisYmd(); }
  /* the moment an Addis day begins */
  function dayStart(day) { return new Date(day + 'T00:00:00' + ADDIS); }
  /* a date moved by whole days, worked at noon UTC so no step lands on an edge */
  function addDays(day, n) {
    var d = new Date(day + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return utcYmd(d);
  }
  /* 0 Sunday .. 6 Saturday, of the date itself */
  function dow(day) { return new Date(day + 'T12:00:00Z').getUTCDay(); }
  function deadline(r, day) { return new Date(day + 'T' + (r.dueTime || '17:30') + ':00' + ADDIS); }
  /* a time on the Addis clock */
  function hhmm(d) {
    var a = new Date(d.getTime() + 3 * 3600e3);
    return ('0' + a.getUTCHours()).slice(-2) + ':' + ('0' + a.getUTCMinutes()).slice(-2);
  }
  function daysFrom(a, b) {
    return Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 86400000);
  }
  /* "Friday 25 September 2026", in his language */
  function prettyDay(day) {
    var d = new Date(String(day) + 'T12:00:00Z');
    if (isNaN(d.getTime())) return String(day || '');
    return DAYS[lang][d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' +
           MONTHS[lang][d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  }
  function monthName(day) {
    return MONTHS[lang][Number(day.slice(5, 7)) - 1] + ' ' + day.slice(0, 4);
  }

  /* ---------------- the schedule, by the ledger's rules ---------------- */

  /* These ask what the ledger asks (apps-script/Agent.js — dueOn_ and
     settle_), in the same way, so that this page and the charges never
     disagree about whether a report was owed, in, or late. */

  /* The 1st — or Monday the 2nd when the 1st is a Sunday, since nothing is
     ever due on a Sunday. */
  function monthlyDueOn(day) {
    var dd = day.slice(8);
    return (dd === '01' && dow(day) !== 0) || (dd === '02' && dow(day) === 1);
  }
  function dueOn(day) {
    var d = dow(day);
    if (d === 0) return [];
    return REPORTS.filter(function (r) {
      if (r.cadence === 'daily') return !(r.skipDays && r.skipDays.indexOf(d) !== -1);
      if (r.cadence === 'weekly') return r.dueDay === d;
      if (r.cadence === 'monthly') return monthlyDueOn(day);
      return false;
    });
  }
  /* How many days before its due day a report may be handed in and still
     count: a daily one only on the day, a weekly one from six days before
     (Thursday for Friday is early, not missing), a monthly one from seven. */
  function reach(r) { return r.cadence === 'weekly' ? 6 : (r.cadence === 'monthly' ? 7 : 0); }
  /* The due day a report filed on `day` answers to — the first one within
     its reach. A monthly one filed after its day answers to the day just
     gone, and is late for it. */
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
  /* Late by the server's time against the letter's deadline. The flag the
     phone sent is not read: a phone's clock is whatever its owner set it
     to, and the ledger does not trust it either. */
  function isLate(f) {
    var r = reportById(f.report);
    if (!r || !f.when) return false;
    return f.when.getTime() > deadline(r, dueDayFor(r, addisYmd(f.when))).getTime();
  }
  function byDueTime(list) {
    return list.sort(function (a, b) { return (a.dueTime || '').localeCompare(b.dueTime || ''); });
  }

  /* What went wrong, in words he can act on. Every listener used to say
     "this page is the Chairman's", which is true only of a refusal — the
     free plan's daily limit, or no signal, looked the same and sent him to
     sign in again for nothing. */
  function errText(e) {
    var c = String((e && e.code) || '').replace(/^firestore\//, '');
    if (c === 'permission-denied') return t('chOnlyChairman');
    if (c === 'resource-exhausted') return t('chQuota');
    return t('chLoadFailed');
  }
  function failInto(into) {
    return function (e) {
      into.innerHTML = '';
      into.appendChild(el('p', 'codeerr', errText(e)));
    };
  }

  var app, auth, db, me = null, root = null;

  function connect() {
    if (app) return;
    app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    auth = getAuth(app);
    /* fb.js loads first on this page and has already set Firestore up with
       its offline cache. Asking again throws — Firebase compares the options
       and a second cache object is never "the same" — and the old fallback
       asked a third time, with different options still, which threw out of
       the module and left his page blank from the day it shipped. The
       instance fb.js made is the one to use. */
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      });
    } catch (e) {
      db = getFirestore(app);
    }
  }

  /* ---------------- a new day ---------------- */

  /* The page is about one day, fixed when it is drawn. Left open overnight —
     on his desk, or in a tab on his phone — it went on showing yesterday
     under a heading he reads as today, and mixed the two as new reports
     came in. So when Addis passes midnight, or when the page comes back into
     view on a later date than it was drawn for, it starts again. A reload
     rather than a redraw: every listener was opened for one day, and
     starting clean is the one sure way to leave none of them behind. The
     only thing a reload would lose is something he is in the middle of
     typing, so it waits for him to finish. */
  var DAY = null, dayWatched = false, dayRetry = null;

  function typing() {
    var a = document.activeElement;
    if (!a || !root || !root.contains(a)) return false;
    var text = a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && a.type === 'text');
    return text && String(a.value || '').trim() !== '';
  }
  function newDay() {
    if (!DAY || today() === DAY) return false;
    if (typing()) {
      if (!dayRetry) dayRetry = setTimeout(function () { dayRetry = null; newDay(); }, 60000);
      return true;
    }
    location.reload();
    return true;
  }
  function watchDay() {
    if (dayWatched) return;
    dayWatched = true;
    (function arm() {
      var wait = dayStart(addDays(DAY, 1)).getTime() + 5000 - Date.now();
      setTimeout(function () { if (!newDay()) arm(); }, Math.max(wait, 1000));
    })();
    /* a phone asleep in a pocket runs no timers; this catches it waking */
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') newDay();
    });
  }

  /* ---------------- the page ---------------- */

  function render() {
    DAY = today();
    watchDay();

    root.innerHTML = '';
    root.appendChild(el('h1', null, t('chOverview')));
    root.appendChild(el('p', 'sub', prettyDay(DAY)));

    var tiles = el('div', 'chtiles');
    var tFiled = tile(t('chFiled'), '—');
    var tMissing = tile(t('chMissing'), '—');
    var tOwed = tile(t('chOwedMonth'), '—');
    tiles.appendChild(tFiled.box); tiles.appendChild(tMissing.box); tiles.appendChild(tOwed.box);
    root.appendChild(tiles);

    /* --- what the agents made of it --- */
    root.appendChild(el('p', 'eyebrow', t('chAnalysis')));
    var runBtn = el('button', 'seed', t('chRunNow'));
    runBtn.type = 'button';
    runBtn.onclick = function () { askForRun(runBtn); };
    root.appendChild(runBtn);

    /* --- who reads the day: Claude or Gemini, his to choose --- */
    var brain = el('div', 'chbrain');
    brain.appendChild(el('span', 'chbrain-k', t('chBrain')));
    var seg = el('div', 'chbrain-seg');
    seg.setAttribute('role', 'group');
    seg.setAttribute('aria-label', t('chBrain'));
    var brainNote = el('span', 'chbrain-d', t('chBrainDefault'));
    brainNote.hidden = true;
    var brainBtns = {};
    [['claude', 'Claude'], ['gemini', 'Gemini']].forEach(function (o) {
      var b = el('button', null, o[1]);
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.onclick = function () { chooseBrain(o[0], brainBtns, brainNote); };
      brainBtns[o[0]] = b;
      seg.appendChild(b);
    });
    brain.appendChild(seg);
    brain.appendChild(brainNote);
    root.appendChild(brain);
    root.appendChild(el('p', 'chbrain-n', t('chBrainNote')));
    watchBrain(brainBtns, brainNote);

    var analysis = el('div', 'chanalysis');
    analysis.appendChild(el('p', 'codenote', t('chNoAnalysis')));
    root.appendChild(analysis);

    /* the full sky, and the whole company, each on its own page */
    var NS = 'http://www.w3.org/2000/svg';
    function wayIn(href, d, label) {
      var a = el('a', 'obs-open');
      a.href = href;
      var ic = document.createElementNS(NS, 'svg');
      [['viewBox', '0 0 24 24'], ['fill', 'none'], ['stroke', 'currentColor'], ['stroke-width', '1.7'],
       ['stroke-linecap', 'round'], ['aria-hidden', 'true']].forEach(function (x) { ic.setAttribute(x[0], x[1]); });
      var pth = document.createElementNS(NS, 'path');
      pth.setAttribute('d', d);
      ic.appendChild(pth);
      a.appendChild(ic);
      a.appendChild(document.createTextNode(label));
      root.appendChild(a);
    }
    wayIn('agents.html', 'M12 9.6a2.4 2.4 0 1 1 0 4.8a2.4 2.4 0 0 1 0-4.8zM2.8 12c0-2.3 4.1-4.2 9.2-4.2s9.2 1.9 9.2 4.2-4.1 4.2-9.2 4.2-9.2-1.9-9.2-4.2z', t('obOpen'));
    wayIn('universe.html', 'M12 10.4a1.6 1.6 0 1 1 0 3.2a1.6 1.6 0 0 1 0-3.2zM12 4.5c4.4 0 7.5 3.2 7.5 7 0 3-2.4 5-5.2 5M12 19.5c-4.4 0-7.5-3.2-7.5-7 0-3 2.4-5 5.2-5', t('unOpen'));

    /* --- what he asked for, and whether it happened --- */
    root.appendChild(el('p', 'eyebrow', t('chIns')));
    var ins = el('div', 'chins');
    root.appendChild(ins);

    /* --- what the letters charged, and his say over it --- */
    root.appendChild(el('p', 'eyebrow', t('chCharges')));
    var charges = el('div', 'chcharges');
    charges.appendChild(el('p', 'codenote', t('chLoading')));
    root.appendChild(charges);

    /* --- the week --- */
    root.appendChild(el('p', 'eyebrow', t('chWeek')));
    var week = el('div', 'chweek');
    week.appendChild(el('p', 'codenote', t('chNoWeek')));
    root.appendChild(week);

    /* --- and the day it was made of --- */
    root.appendChild(el('p', 'eyebrow', t('chRaw')));
    var raw = el('div', 'chraw');
    raw.appendChild(el('p', 'codenote', t('chLoading')));
    root.appendChild(raw);

    watchAnalysis(analysis);
    watchInstructions(ins);
    watchCharges(charges, tOwed);
    watchWeek(week);
    watchReports(raw, tFiled, tMissing);
  }

  function tile(label, value, full) {
    var box = el('div', 'chtile');
    box.appendChild(el('div', 'chtl', label));
    var v = el('div', 'chtv');
    box.appendChild(v);
    function set(x, whole) {
      v.textContent = x;
      if (whole) v.title = whole; else v.removeAttribute('title');
    }
    set(value, full);
    return { box: box, set: set };
  }


  /* ---------------- the day as a sky ---------------- */

  /* Sixteen findings is a wall of paragraphs. As a sky it is one glance: a
     bright star wants him, a dim one had an ordinary day. Positions are fixed
     on purpose — he should come to know where Store sits the way he knows
     where a thing sits on his own desk, and a layout that rearranges itself
     every evening teaches nothing. */
  var SEATS = [
    ['decide',         200, 128, 'in'],
    ['store',          115, 152, 'mid'],
    ['production',     292, 240, 'mid'],
    ['quality',        106, 256, 'mid'],
    ['compliance',     300, 150, 'mid'],
    ['penalties',      200, 322, 'mid'],
    ['finance',         66, 200, 'out'],
    ['commercial',     334, 200, 'out'],
    ['site',           150, 352, 'out'],
    ['attendance',     258, 348, 'out'],
    ['purchasing',      86,  96, 'out'],
    ['margin',         318,  96, 'out'],
    ['design',          52, 272, 'out'],
    ['customer',       348, 272, 'out'],
    ['contradictions', 200,  52, 'out']
  ];

  var SVGNS = 'http://www.w3.org/2000/svg';
  function sv(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  /* How loud a finding is. The agents do not rank themselves, so this reads
     the words they used, and errs quiet on purpose: an evening where every
     star is lit tells him nothing at all. */
  var LOUD = /stopped|missed|ran short|ran out|below the|not reported as required|blocking|halt/;
  var WARM = /\blate\b|not filed|did not file|waste|rework|unanswered|delay|short of/;

  function heat(text) {
    var x = String(text || '').toLowerCase();
    if (!x) return 0;
    if (LOUD.test(x)) return 2;
    if (WARM.test(x)) return 1;
    return 0;
  }

  var HEAT = [
    { ring: '#2f4a45', dot: '#0f1c1a', glow: null },
    { ring: '#e0b33c', dot: '#1d1a10', glow: 'g-gold' },
    { ring: '#e2765c', dot: '#1d1211', glow: 'g-red' }
  ];

  /* A star's name is 11 units tall — the stylesheet's 7.6 came out about
     five pixels on a phone, too small to read. At that size a long name
     would run into its neighbour's, so a name wider than about twelve
     letters goes on two lines, split at the space nearest its middle.
     Ethiopic letters are counted half as wide again as Latin ones. */
  function twoLines(s) {
    s = String(s || '');
    var w = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      w += c >= 0x1200 && c <= 0x139f ? 1.5 : 1;
    }
    if (w <= 12) return [s];
    var mid = s.length / 2, best = -1;
    for (var j = 0; j < s.length; j++) {
      if (s.charAt(j) === ' ' && (best < 0 || Math.abs(j - mid) < Math.abs(best - mid))) best = j;
    }
    return best < 0 ? [s] : [s.slice(0, best), s.slice(best + 1)];
  }

  function buildSky(findings, onPick) {
    var by = {};
    (findings || []).forEach(function (f) { by[f.id] = f; });

    var svg = sv('svg', { 'class': 'sky', viewBox: '0 0 400 400', role: 'img',
                          'aria-label': t('chSkyAlt') });

    var defs = sv('defs', {});
    [['g-core', '#5fe0c6', '.9'], ['g-red', '#e2765c', '.85'], ['g-gold', '#e0b33c', '.8']]
      .forEach(function (g) {
        var rg = sv('radialGradient', { id: g[0] });
        rg.appendChild(sv('stop', { offset: '0', 'stop-color': g[1], 'stop-opacity': g[2] }));
        rg.appendChild(sv('stop', { offset: '1', 'stop-color': g[1], 'stop-opacity': '0' }));
        defs.appendChild(rg);
      });
    svg.appendChild(defs);

    [72, 122, 168].forEach(function (r, i) {
      svg.appendChild(sv('circle', { cx: 200, cy: 200, r: r, fill: 'none',
        stroke: ['#152724', '#132220', '#111d1b'][i], 'stroke-width': 1 }));
    });

    /* a spoke to each one that is loud, so the eye is led rather than hunting */
    SEATS.forEach(function (p) {
      if (heat((by[p[0]] || {}).text) !== 2) return;
      svg.appendChild(sv('line', { x1: 200, y1: 200, x2: p[1], y2: p[2],
        stroke: '#2a4a44', 'stroke-width': '.8', opacity: '.7' }));
    });

    var core = sv('g', { 'class': 'core' });
    core.appendChild(sv('circle', { cx: 200, cy: 200, r: 46, fill: 'url(#g-core)' }));
    core.appendChild(sv('circle', { cx: 200, cy: 200, r: 27, fill: '#0c1a18',
      stroke: '#3fbfa8', 'stroke-width': 1.4 }));
    var n = sv('text', { 'class': 'n', x: 200, y: 200 });
    n.textContent = String((findings || []).length || 0);
    core.appendChild(n);
    var lb = sv('text', { 'class': 'l', x: 200, y: 212 });
    lb.textContent = t('chAgents');
    core.appendChild(lb);
    core.addEventListener('click', function () {
      var b = (findings || []).filter(function (f) { return f.kind === 'brief'; })[0];
      if (b) onPick(b, 0);
    });
    svg.appendChild(core);

    SEATS.forEach(function (p) {
      var id = p[0], x = p[1], y = p[2], ring = p[3];
      var f = by[id];
      var h = f ? heat(f.text) : 0;
      var style = HEAT[h];
      var r = h ? (ring === 'in' ? 9 : 7.5) : (ring === 'out' ? 4.6 : 5.6);

      var g = sv('g', { 'class': 'node ' + (h ? 'on' : 'quiet') + (f ? '' : ' absent') });
      if (style.glow) {
        g.appendChild(sv('circle', { 'class': 'glow', cx: x, cy: y,
          r: h === 2 ? 22 : 16, fill: 'url(#' + style.glow + ')' }));
      }
      g.appendChild(sv('circle', { cx: x, cy: y, r: r, fill: style.dot,
        stroke: style.ring, 'stroke-width': h ? 1.6 : 1.1 }));
      if (h === 2) g.appendChild(sv('circle', { cx: x, cy: y, r: 3.2, fill: style.ring }));
      g.appendChild(sv('circle', { 'class': 'hit', cx: x, cy: y, r: 24 }));

      /* the size is set inline: the stylesheet's rule for these labels
         would override a font-size attribute */
      var lines = twoLines(f ? (lang === 'am' && f.am ? f.am : f.en) : id);
      var tx = sv('text', { x: x, y: y < 200 ? y - 19 - (lines.length - 1) * 12 : y + 23,
                            'font-size': 11, style: 'font-size:11px' });
      lines.forEach(function (s, k) {
        var ts = sv('tspan', { x: x, dy: k ? 12 : 0 });
        ts.textContent = s;
        tx.appendChild(ts);
      });
      g.appendChild(tx);

      if (f) g.addEventListener('click', function () { onPick(f, h); });
      svg.appendChild(g);
    });
    return svg;
  }

  /* The sky is a picture: a finger can pick a star, but a keyboard or a
     screen reader cannot, and the stars sit inside an image. The same
     findings as a row of real buttons — the brief first, then loudest
     first — open the same panel for everyone. */
  function skyList(findings, onPick) {
    var said = [t('obLegendQuiet'), t('obLegendWarm'), t('obLegendLoud')];
    var box = el('div', 'chchips');
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', t('chSkyList'));
    (findings || []).map(function (f, i) {
      var brief = f.kind === 'brief';
      return { f: f, h: brief ? 0 : heat(f.text), rank: brief ? 3 : heat(f.text), i: i };
    }).sort(function (a, b) {
      return (b.rank - a.rank) || (a.i - b.i);
    }).forEach(function (o) {
      var b = el('button', 'chchip h' + o.h + (o.f.kind === 'brief' ? ' brief' : ''));
      b.type = 'button';
      b.appendChild(el('span', 'chchip-n', lang === 'am' && o.f.am ? o.f.am : o.f.en));
      if (o.f.kind !== 'brief') b.appendChild(el('span', 'chchip-h', said[o.h]));
      b.onclick = function () { onPick(o.f, o.h); };
      box.appendChild(b);
    });
    return box;
  }

  /* ---------------- the analysis ---------------- */

  /* The newest reading, whichever day it is about. The agents run in the
     morning on yesterday, so on most mornings the latest is yesterday's; after
     he presses the button it is today's, marked as so far. */
  function watchAnalysis(into) {
    var q = query(collection(db, 'analysis'), orderBy('day', 'desc'), limit(1));
    onSnapshot(q, function (qs) {
      into.innerHTML = '';
      if (qs.empty) {
        into.appendChild(el('p', 'codenote', t('chNoAnalysis')));
        return;
      }
      var d = qs.docs[0].data();
      var dayText = /^\d{4}-\d{2}-\d{2}$/.test(d.day || '') ? prettyDay(d.day) : (d.dayLabel || d.day);
      into.appendChild(el('p', 'skysub', dayText +
        (d.provisional ? ' · ' + t('chSoFar') : '')));
      var when = d.ranAt && d.ranAt.toDate ? d.ranAt.toDate() : null;
      var finds = d.findings || [];

      var loud = finds.filter(function (f) { return heat(f.text) === 2; }).length;
      into.appendChild(el('p', 'skysub',
        finds.length + ' ' + t('chAgentsRead') + ' ' +
        (loud ? loud + ' ' + t('chWantYou') : t('chAllQuiet'))));

      var panel = el('div', 'chfind');
      /* read out when a button below changes it */
      panel.setAttribute('aria-live', 'polite');

      function pick(f, h) {
        panel.className = 'chfind ' + (f.kind === 'brief' ? 'brief'
                          : (f.kind === 'decision' ? 'decision' : 'finding'))
                          + (h === 2 ? ' loud' : '');
        panel.innerHTML = '';
        panel.appendChild(el('div', 'chfh', lang === 'am' && f.am ? f.am : f.en));
        panel.appendChild(el('div', 'chft', f.text || ''));
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      into.appendChild(buildSky(finds, pick));
      if (finds.length) into.appendChild(skyList(finds, pick));

      /* the brief is the reading of the whole day, so it is open already */
      var brief = finds.filter(function (f) { return f.kind === 'brief'; })[0];
      if (brief) {
        panel.className = 'chfind brief';
        panel.appendChild(el('div', 'chfh', lang === 'am' && brief.am ? brief.am : brief.en));
        panel.appendChild(el('div', 'chft', brief.text || ''));
      } else {
        panel.appendChild(el('div', 'chft', t('chTapStar')));
      }
      into.appendChild(panel);

      if (when) into.appendChild(el('p', 'codenote', t('chRanAt') + ' ' + hhmm(when) +
        (d.model ? ' · ' + t('chReadBy') + ' ' + d.model : '')));
      if (d.modelNote) into.appendChild(el('p', 'codenote', d.modelNote));
    }, failInto(into));
  }

  /* The choice lives in one document the morning run reads first. With no
     document the script falls back to its own AI_PROVIDER setting, which
     this page cannot see — so neither button is lit, and it says so, rather
     than naming one that may not be the one in use. */
  function showBrain(btns, p, note) {
    Object.keys(btns).forEach(function (k) { btns[k].setAttribute('aria-pressed', k === p ? 'true' : 'false'); });
    note.hidden = !!p;
  }
  function watchBrain(btns, note) {
    Object.keys(btns).forEach(function (k) { btns[k].setAttribute('aria-pressed', 'false'); });
    onSnapshot(doc(db, 'control', 'ai'), function (d) {
      var p = d.exists() ? String(d.data().provider || '') : '';
      showBrain(btns, p === 'gemini' || p === 'claude' ? p : null, note);
    }, function () {});
  }
  function chooseBrain(p, btns, note) {
    showBrain(btns, p, note);
    setDoc(doc(db, 'control', 'ai'), { provider: p, at: serverTimestamp(), by: me })
      .then(function () { toast(t('chBrainSaved')); })
      ['catch'](function () { toast(t('chSaveFailed')); });
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

  /* Today's reports as they were typed, and who still owes one. The
     listener reads a week back, not only today: a weekly report handed in
     on Thursday for Friday, or a monthly one in the last days of the month,
     is in — the ledger counts it, so this page must not call it owed. Only
     today's filings are listed. */
  function watchReports(into, tFiled, tMissing) {
    var start = dayStart(DAY).getTime();
    var end = dayStart(addDays(DAY, 1)).getTime();
    var q = query(collection(db, 'reports'),
                  where('at', '>=', dayStart(addDays(DAY, -7))), orderBy('at', 'asc'));

    var all = null;
    var owedBox = el('div');

    /* Who owed one today and has not handed it in, by the ledger's rules. A
       report whose deadline is still ahead is not owed yet — it is listed
       apart, and not counted. Drawn again every minute, because a deadline
       passing changes the answer without any new report arriving. */
    function drawOwed() {
      var now = Date.now(), missing = [], later = [];
      dueOn(DAY).forEach(function (r) {
        var from = dayStart(addDays(DAY, -reach(r))).getTime();
        var hit = all.some(function (f) {
          var tm = f.when.getTime();
          return f.report === r.id && f.person === r.person && tm >= from && tm < end;
        });
        if (hit) return;
        (now < deadline(r, DAY).getTime() ? later : missing).push(r);
      });
      tMissing.set(String(missing.length));
      owedBox.innerHTML = '';
      if (missing.length) owedBox.appendChild(owedList('chmissing', t('chMissingList'), byDueTime(missing)));
      if (later.length) owedBox.appendChild(owedList('chlater', t('chNotDueYet'), byDueTime(later)));
    }

    onSnapshot(q, function (snap) {
      all = [];
      snap.forEach(function (docu) {
        var x = docu.data({ serverTimestamps: 'estimate' });
        x.when = x.at && x.at.toDate ? x.at.toDate() : new Date();
        all.push(x);
      });
      var filed = all.filter(function (f) { return f.when.getTime() >= start; });

      tFiled.set(String(filed.length));
      into.innerHTML = '';
      if (!filed.length) {
        into.appendChild(el('p', 'codenote', t('chNothingFiled')));
      }
      filed.forEach(function (f) { into.appendChild(rawCard(f)); });
      into.appendChild(owedBox);
      drawOwed();
    }, failInto(into));

    setInterval(function () { if (all) drawOwed(); }, 60000);
  }

  function owedList(cls, title, reports) {
    var m = el('div', cls);
    m.appendChild(el('div', 'chfl', title));
    reports.forEach(function (r) {
      var p = personById(r.person);
      m.appendChild(el('div', null, (p ? L(p) : r.person) + ' — ' + L(r) + ' · ' + (r.dueTime || '17:30')));
    });
    return m;
  }

  function rawCard(f) {
    var rep = reportById(f.report);
    var late = isLate(f);

    var card = el('details', 'chrow' + (late ? ' late' : ''));
    var head = el('summary');
    head.appendChild(el('span', 'chrw', nameOf(f.person)));
    head.appendChild(el('span', 'chrr', rep ? L(rep) : f.report));
    head.appendChild(el('span', 'chrt', hhmm(f.when) + (late ? ' · ' + t('late') : '')));
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
    return card;
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

  /* ---------------- his instructions ---------------- */

  /* What he asks of people, with a date, until they close it. Three fields,
     because anything longer would not get used standing up. */
  function watchInstructions(into) {
    var form = el('div', 'chinsform');

    var what = el('textarea');
    what.rows = 2;
    what.maxLength = 1000;
    what.placeholder = t('chInsWhat');
    var to = el('select');
    (typeof CHAT_ACCOUNTS !== 'undefined' ? CHAT_ACCOUNTS : []).forEach(function (id) {
      var o = el('option', null, nameOf(id));
      o.value = id;
      to.appendChild(o);
    });
    var due = el('input');
    due.type = 'date';
    due.value = addDays(DAY, 2);
    var give = el('button', 'seed', t('chInsGive'));
    give.type = 'button';

    var r1 = el('label', 'chinsf');
    r1.appendChild(el('span', null, t('chInsTo')));
    r1.appendChild(to);
    var r2 = el('label', 'chinsf');
    r2.appendChild(el('span', null, t('chInsDue')));
    r2.appendChild(due);
    form.appendChild(what);
    form.appendChild(r1);
    form.appendChild(r2);
    form.appendChild(give);
    into.appendChild(form);

    give.onclick = function () {
      var text = what.value.trim();
      if (!text || !due.value) { what.focus(); return; }
      give.disabled = true;
      addDoc(collection(db, 'instructions'), {
        to: to.value, text: text, due: due.value,
        by: 'chairman', status: 'open', at: serverTimestamp()
      }).then(function () {
        what.value = '';
        give.disabled = false;
      })['catch'](function () {
        give.disabled = false;
        toast(t('chSaveFailed'));
      });
    };

    var list = el('div', 'chinslist');
    into.appendChild(list);

    /* Three questions rather than "the newest hundred": every open one,
       however old — an instruction given in March and never closed is the
       one he most needs to see, and it used to fall off the end — and those
       done or cancelled in the last fortnight, long enough to check and
       short enough to read. Each asks of one field only, which is all the
       indexes allow. A reopened one keeps its old doneAt or closedAt, so
       the last two keep only what is still done or still cancelled. */
    var since = dayStart(addDays(DAY, -14));
    var open = [], done = [], gone = [], got = {}, err = null;

    function rows(qs, status) {
      var out = [];
      qs.forEach(function (d) {
        var x = d.data({ serverTimestamps: 'estimate' });
        x.id = d.id;
        if (x.status === status) out.push(x);
      });
      return out;
    }
    function ms(ts) { return ts && ts.toMillis ? ts.toMillis() : 0; }

    function draw() {
      if (!got.open || !got.done || !got.gone) return;
      list.innerHTML = '';
      if (err) list.appendChild(el('p', 'codeerr', errText(err)));
      if (!open.length && !done.length && !gone.length) {
        if (!err) list.appendChild(el('p', 'codenote', t('chInsNone')));
        return;
      }
      open.sort(function (a, b) { return a.due < b.due ? -1 : (a.due > b.due ? 1 : 0); });
      done.sort(function (a, b) { return ms(b.doneAt) - ms(a.doneAt); });
      gone.sort(function (a, b) { return ms(b.closedAt) - ms(a.closedAt); });
      open.concat(done, gone).forEach(function (i) { list.appendChild(insRow(i)); });
    }
    function listen(key, q, status) {
      onSnapshot(q, function (qs) {
        var x = rows(qs, status);
        if (key === 'open') open = x; else if (key === 'done') done = x; else gone = x;
        got[key] = true;
        draw();
      }, function (e) {
        err = e;
        got[key] = true;
        draw();
      });
    }
    var col = collection(db, 'instructions');
    listen('open', query(col, where('status', '==', 'open')), 'open');
    listen('done', query(col, where('doneAt', '>=', since)), 'done');
    listen('gone', query(col, where('closedAt', '>=', since)), 'cancelled');
  }

  function insRow(i) {
    var row = el('div', 'chinsrow ' + i.status);
    var head = el('div', 'chinsh');
    head.appendChild(el('span', 'chrw', nameOf(i.to)));
    var over = daysFrom(i.due, DAY);
    var late = i.status === 'open' && over > 0;
    var state;
    if (i.status === 'done') {
      state = t('chInsDone') + ' ' + (i.doneAt && i.doneAt.toDate ? addisYmd(i.doneAt.toDate()) : '');
    } else if (i.status === 'cancelled') {
      state = t('chCancelled') + ' ' + (i.closedAt && i.closedAt.toDate ? addisYmd(i.closedAt.toDate()) : '');
    } else {
      state = late ? over + ' ' + t('chInsOver') : t('chInsDue') + ' ' + i.due;
    }
    head.appendChild(el('span', 'chrt' + (late ? ' bad' : ''), state));
    row.appendChild(head);
    row.appendChild(el('div', 'chinst', i.text));
    if (i.status === 'done' && i.note) {
      row.appendChild(el('div', 'chinsn', t('chInsSaid') + ': ' + i.note));
    }

    var act = el('button', 'chmini', i.status === 'open' ? t('chInsCancel') : t('chInsReopen'));
    act.type = 'button';
    function set(status) {
      act.disabled = true;
      updateDoc(doc(db, 'instructions', i.id), { status: status, closedAt: serverTimestamp() })
        ['catch'](function () { act.disabled = false; toast(t('chSaveFailed')); });
    }
    if (i.status === 'open') {
      /* Cancelling takes two taps. One tap, beside a thumb scrolling past,
         used to take an instruction off someone's phone without his
         meaning to; the first tap now only asks, and forgets after four
         seconds. A cancelled one stays listed for a fortnight, with Reopen. */
      var armed = null;
      act.onclick = function () {
        if (!armed) {
          act.textContent = t('chInsCancelSure');
          act.className = 'chmini bad';
          armed = setTimeout(function () {
            armed = null;
            act.textContent = t('chInsCancel');
            act.className = 'chmini';
          }, 4000);
          return;
        }
        clearTimeout(armed);
        armed = null;
        set('cancelled');
      };
    } else {
      act.onclick = function () { set('open'); };
    }
    row.appendChild(act);
    return row;
  }

  /* ---------------- the ledger ---------------- */

  /* The last closed day's charges, each with a way to cancel it — with a
     reason, kept for good beside the charge — and the month so far by
     person, which is the figure that comes off pay. The charges were worked
     out by the ledger from each person's letter; the only arithmetic here is
     taking away what he cancelled, the same subtraction the monthly pack
     does. */
  var STATUS = { 'On time': 'onTime', 'LATE': 'late', 'MISSING': 'chNotFiled', 'NOT DUE YET': 'chNotDueYet' };
  function statusText(s) { return STATUS[s] ? t(STATUS[s]) : s; }
  function lineWho(l) { var p = personById(l.person); return p ? L(p) : (l.name || l.person); }
  function lineReport(l) { var r = reportById(l.report); return r ? L(r) : (l.reportName || l.report); }

  function watchCharges(into, tOwed) {
    var month = DAY.slice(0, 8) + '01';
    /* Last month comes off pay when the monthly pack runs, at 8:00 on the
       2nd, and its last day is only closed on the morning of the 1st.
       Reading from this month's 1st alone hid that day on the 1st — the one
       day it could still be cancelled. So on the 1st and the 2nd the window
       opens a month earlier, and last month is listed on its own, apart
       from this month's total, until the pack has taken it. */
    var early = DAY.slice(8) === '01' || DAY.slice(8) === '02';
    var from = early ? addDays(month, -1).slice(0, 8) + '01' : month;
    var ledgers = [], waivers = {}, gotL = false, gotW = false, wErr = null;

    function draw() {
      if (!gotL || !gotW) return;
      into.innerHTML = '';
      if (!ledgers.length) {
        into.appendChild(el('p', 'codenote', t('chNoLedger')));
        if (wErr) into.appendChild(el('p', 'codeerr', errText(wErr)));
        tOwed.set('0');
        return;
      }

      var per = {}, total = 0, prev = [], prevTotal = 0, prevAny = false;
      ledgers.forEach(function (day) {
        var before = day.day < month;
        if (before) prev.push(day);
        (day.lines || []).forEach(function (l) {
          if (!l.amount) return;
          var off = waivers[day.day + '|' + l.report];
          if (before) {
            prevAny = true;
            if (!off) prevTotal += l.amount;
            return;
          }
          var p = per[l.person] || (per[l.person] = { name: lineWho(l), owed: 0 });
          if (!off) { p.owed += l.amount; total += l.amount; }
        });
      });
      tOwed.set(short(total), exact(total));

      var last = ledgers[ledgers.length - 1];
      into.appendChild(el('p', 'skysub', t('chChargesDay') + ' · ' + prettyDay(last.day)));
      var lines = (last.lines || []).filter(function (l) { return l.amount > 0; });
      if (!lines.length) into.appendChild(el('p', 'codenote', t('chNoCharges')));
      lines.forEach(function (l) {
        into.appendChild(chargeRow(last.day, l, waivers[last.day + '|' + l.report]));
      });

      if (prevAny) into.appendChild(lastMonth(prev, prevTotal, last.day));

      var ids = Object.keys(per).sort(function (a, b) { return per[b].owed - per[a].owed; });
      if (ids.length) {
        var box = el('details', 'chmonth');
        box.appendChild(el('summary', null, t('chByPerson') + ' · ' + birr(total) + ' ' + t('unBirr')));
        ids.forEach(function (k) {
          var r = el('div', 'chf');
          r.appendChild(el('span', 'chfk', per[k].name));
          r.appendChild(el('span', 'chfv', birr(per[k].owed)));
          box.appendChild(r);
        });
        into.appendChild(box);
      }
      /* without the cancellations the figures above would be too high */
      if (wErr) into.appendChild(el('p', 'codeerr', errText(wErr)));
    }

    /* Last month's charges, every day of it, each still cancellable until
       the pack deducts them — newest day first. The day already shown above
       as the last closed day is not repeated. */
    function lastMonth(prev, sum, shown) {
      var box = el('details', 'chmonth chprev');
      box.appendChild(el('summary', null, t('chPrevMonth') + ' · ' + monthName(prev[0].day) +
        ' · ' + birr(sum) + ' ' + t('unBirr')));
      box.appendChild(el('p', 'codenote', t('chPrevMonthNote')));
      prev.slice().reverse().forEach(function (day) {
        if (day.day === shown) return;
        var lines = (day.lines || []).filter(function (l) { return l.amount > 0; });
        if (!lines.length) return;
        box.appendChild(el('div', 'chsec', prettyDay(day.day)));
        lines.forEach(function (l) {
          box.appendChild(chargeRow(day.day, l, waivers[day.day + '|' + l.report]));
        });
      });
      return box;
    }

    onSnapshot(query(collection(db, 'ledger'), where('day', '>=', from), orderBy('day', 'asc')),
      function (qs) {
        ledgers = [];
        qs.forEach(function (d) { ledgers.push(d.data()); });
        gotL = true;
        draw();
      }, failInto(into));
    onSnapshot(query(collection(db, 'waivers'), where('day', '>=', from)),
      function (qs) {
        waivers = {};
        qs.forEach(function (d) { var w = d.data(); waivers[w.day + '|' + w.report] = w; });
        gotW = true;
        wErr = null;
        draw();
      }, function (e) { gotW = true; wErr = e; draw(); });
  }

  function chargeRow(day, l, waiver) {
    var row = el('div', 'chchg' + (waiver ? ' off' : ''));
    var head = el('div', 'chinsh');
    head.appendChild(el('span', 'chrw', lineWho(l)));
    head.appendChild(el('span', 'chrr', lineReport(l) + ' · ' + statusText(l.status)));
    head.appendChild(el('span', 'chrt', birr(l.amount)));
    row.appendChild(head);

    if (waiver) {
      row.appendChild(el('div', 'chinsn', t('chCancelled') + ': ' + waiver.reason));
      return row;
    }
    var open = el('button', 'chmini', t('chCancel'));
    open.type = 'button';
    var box = el('div', 'chcancel');
    box.hidden = true;
    var why = el('input');
    why.type = 'text';
    why.maxLength = 500;
    why.placeholder = t('chCancelWhy');
    var go = el('button', 'chmini bad', t('chCancelGo'));
    go.type = 'button';
    box.appendChild(why);
    box.appendChild(go);
    open.onclick = function () { open.hidden = true; box.hidden = false; why.focus(); };
    go.onclick = function () {
      var reason = why.value.trim();
      if (reason.length < 3) { why.focus(); return; }
      go.disabled = true;
      addDoc(collection(db, 'waivers'), {
        day: day, report: l.report, person: l.person, reason: reason,
        amount: l.amount, by: 'chairman', at: serverTimestamp()
      })['catch'](function () { go.disabled = false; toast(t('chSaveFailed')); });
    };
    row.appendChild(open);
    row.appendChild(box);
    return row;
  }

  /* ---------------- the week ---------------- */

  function watchWeek(into) {
    onSnapshot(query(collection(db, 'packs'), orderBy('end', 'desc'), limit(4)), function (qs) {
      var packs = [];
      qs.forEach(function (d) { packs.push(d.data()); });
      var w = packs.filter(function (p) { return p.kind === 'week'; })[0];
      into.innerHTML = '';
      if (!w) { into.appendChild(el('p', 'codenote', t('chNoWeek'))); return; }

      into.appendChild(el('p', 'skysub', prettyDay(w.start) + ' – ' + prettyDay(w.end)));
      var tiles = el('div', 'chtiles');
      tiles.appendChild(tile(t('chOnTime'), w.onTimePct == null ? '—' : w.onTimePct + '%').box);
      tiles.appendChild(tile(t('chMade'), short(w.m2) + ' / ' + short(w.m2Target)).box);
      tiles.appendChild(tile(t('chCollected'), short(w.collected), exact(w.collected)).box);
      into.appendChild(tiles);
      var f = el('div', 'chfind brief');
      f.appendChild(el('div', 'chft', w.text || ''));
      into.appendChild(f);
    }, failInto(into));
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
      /* signed out (a new password signs every phone out): the ordinary
         sign-in card, rather than a message with no way forward. Signing in
         reloads this page, which then opens as his. */
      if (!me && window.KLEVER && window.KLEVER.signIn) { window.KLEVER.signIn(); return; }
      if (me !== 'chairman') {
        root.innerHTML = '';
        root.appendChild(el('h1', null, t('chOverview')));
        root.appendChild(el('p', 'codeerr', t('chOnlyChairman')));
        var home = el('a', 'backlink', t('back'));
        home.href = 'index.html';
        root.appendChild(home);
        return;
      }
      render();
    });
  });
})();
