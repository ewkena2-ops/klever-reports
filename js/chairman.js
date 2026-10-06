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
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, query, where, orderBy, limit,
  onSnapshot, serverTimestamp, writeBatch
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
  /* THE WEEK (apps-script/Agent.js): a weekly report belongs to the week it
     is sent in, which closes on Sunday at 9 PM. weekClose is the Sunday whose
     9 PM closes the week a moment falls in. */
  /* Selam's Monday summary is about the week just ended: its week turns at
     the start of Sunday, not at 9 PM */
  var WEEK_BEFORE = { 'betty-weekly-cx': true };
  function weekCut(sun, id) { return new Date(sun + 'T' + (WEEK_BEFORE[id] ? '00:00' : '21:00') + ':00' + ADDIS); }
  /* the first week under this rule (the ledger's WEEK_FROM_); a week before
     it was settled the old way — six days early to the end of its day */
  var WEEK_FROM = '2026-10-11';
  function sundayOf(day) { return addDays(day, (7 - dow(day)) % 7); }
  function weekClose(when, id) {
    var sun = sundayOf(addisYmd(when));
    return when.getTime() >= weekCut(sun, id).getTime() ? addDays(sun, 7) : sun;
  }
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
     count: a daily one only on the day, a monthly one from seven. */
  function reach(r) { return r.cadence === 'monthly' ? 7 : 0; }
  /* The time in which a filing counts for a report owed on `day`: a daily
     one that day, a monthly one from a week before; a weekly one its whole
     week, Sunday 9 PM to Sunday 9 PM — on Saturday a Friday report is still
     that Friday's, late. `day` may be its due day or the week's Sunday. */
  function windowOf(r, day) {
    if (r && r.cadence === 'weekly' && sundayOf(day) >= WEEK_FROM) {
      var sun = sundayOf(day), from = weekCut(addDays(sun, -7), r.id).getTime();
      /* the first week also keeps what the old rule counted early for it */
      if (sun === WEEK_FROM) from = Math.min(from, dayStart(addDays(addDays(sun, r.dueDay - 7), -6)).getTime());
      return { from: from, to: weekCut(sun, r.id).getTime() };
    }
    if (r && r.cadence === 'weekly') {
      return { from: dayStart(addDays(day, -6)).getTime(), to: dayStart(addDays(day, 1)).getTime() };
    }
    return { from: dayStart(addDays(day, -reach(r || { cadence: 'daily' }))).getTime(),
             to: dayStart(addDays(day, 1)).getTime() };
  }
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
  /* the due day a filing answers to — a weekly one, its own day in the week
     it was sent in */
  function dueFor(r, when) {
    if (r.cadence === 'weekly' && weekClose(when, r.id) >= WEEK_FROM) return addDays(weekClose(when, r.id), r.dueDay - 7);
    return dueDayFor(r, addisYmd(when));
  }
  function isLate(f) {
    var r = reportById(f.report);
    if (!r || !f.when) return false;
    return f.when.getTime() > deadline(r, dueFor(r, f.when)).getTime();
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
    var tBonus = tile(t('chBonusMonth'), '—');
    tiles.appendChild(tFiled.box); tiles.appendChild(tMissing.box); tiles.appendChild(tOwed.box);
    tiles.appendChild(tBonus.box);
    root.appendChild(tiles);

    /* a night job that failed or never ran says so here, above everything */
    var sysAlarm = el('div', 'chalarm');
    sysAlarm.hidden = true;
    root.appendChild(sysAlarm);

    /* --- at a glance: the same figures, drawn --- */
    root.appendChild(el('p', 'eyebrow', t('chGlance')));
    var charts = el('div', 'chcharts');
    charts.appendChild(el('p', 'codenote', t('chLoading')));
    root.appendChild(charts);

    /* --- what the agents made of it --- */
    root.appendChild(el('p', 'eyebrow', t('chAnalysis')));
    var runBtn = el('button', 'seed', t('chRunNow'));
    runBtn.type = 'button';
    runBtn.onclick = function () { askForRun(runBtn); };
    root.appendChild(runBtn);

    var analysis = el('div', 'chanalysis');
    analysis.appendChild(el('p', 'codenote', t('chNoAnalysis')));
    root.appendChild(analysis);

    /* --- his own questions, answered from the reports (apps-script/Ask.js) --- */
    root.appendChild(el('p', 'eyebrow', t('aiAskTitle')));
    var asks = el('div', 'chask');
    root.appendChild(asks);

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

    /* --- every lead and KK job, from the reports, on its own page (Register.js) --- */
    root.appendChild(el('p', 'eyebrow', t('regTitle')));
    var reg = el('div', 'chreg');
    reg.appendChild(el('p', 'codenote', t('chLoading')));
    root.appendChild(reg);
    watchRegister(reg);

    /* --- an order in a sentence; the AI finds who does it (apps-script/Orders.js) --- */
    root.appendChild(el('p', 'eyebrow', t('ordTitle')));
    var orders = el('div', 'chask chorders');
    root.appendChild(orders);

    /* --- what he asked for, and whether it happened --- */
    root.appendChild(el('p', 'eyebrow', t('chIns')));
    var ins = el('div', 'chins');
    root.appendChild(ins);

    /* --- what the letters charged, and his say over it: the fines in one
       place, the bonuses in another, and what they come to for each
       person's pay --- */
    root.appendChild(el('p', 'eyebrow', t('chCharges')));
    var charges = el('div', 'chcharges');
    charges.appendChild(el('p', 'codenote', t('chLoading')));
    root.appendChild(charges);
    root.appendChild(el('p', 'eyebrow', t('chBonusesSec')));
    var bonusBox = el('div', 'chcharges chbonus');
    bonusBox.appendChild(el('p', 'codenote', t('chLoading')));
    root.appendChild(bonusBox);
    var standing = el('div', 'chstanding');
    root.appendChild(standing);
    var payBox = el('div', 'chpaybox');
    root.appendChild(payBox);
    var record = el('div', 'chrecord');
    root.appendChild(record);

    /* --- the week --- */
    root.appendChild(el('p', 'eyebrow', t('chWeek')));
    var week = el('div', 'chweek');
    week.appendChild(el('p', 'codenote', t('chNoWeek')));
    root.appendChild(week);

    /* --- where the week's money went, read by the CFO (apps-script/Cfo.js) --- */
    root.appendChild(el('p', 'eyebrow', t('cfoTitle')));
    var cfo = el('div', 'chcfo');
    cfo.appendChild(el('p', 'codenote', t('cfoNone')));
    root.appendChild(cfo);

    /* --- and the day it was made of --- */
    root.appendChild(el('p', 'eyebrow', t('chRaw')));
    var raw = el('div', 'chraw');
    raw.appendChild(el('p', 'codenote', t('chLoading')));
    root.appendChild(raw);

    /* --- whether the night's jobs worked --- */
    root.appendChild(el('p', 'eyebrow', t('chSystem')));
    var sys = el('div', 'chhealth');
    sys.appendChild(el('p', 'codenote', t('chLoading')));
    root.appendChild(sys);

    /* --- notifications on his own phone: to test that they reach a phone --- */
    if (window.KLEVER && window.KLEVER.pushCard) {
      root.appendChild(el('p', 'eyebrow', t('pushChTitle')));
      root.appendChild(window.KLEVER.pushCard({ title: t('pushChTitle'), note: t('pushChNote') }));
    }

    watchAnalysis(analysis);
    watchOrders(orders);
    watchInstructions(ins);
    watchCharges({ fines: charges, bonus: bonusBox, pay: payBox }, tOwed, tBonus);
    watchStanding(standing);
    watchEvents(record);
    watchWeek(week, cfo);
    watchAsks(asks);
    watchReports(raw, tFiled, tMissing);
    watchCharts(charts);
    watchHealth(sys, sysAlarm);
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
      var now = Date.now(), missing = [], later = [], open = [];
      dueOn(DAY).forEach(function (r) {
        var w = windowOf(r, DAY);
        var hit = all.some(function (f) {
          var tm = f.when.getTime();
          return f.report === r.id && f.person === r.person && tm >= w.from && tm < w.to;
        });
        if (hit) return;
        if (now < deadline(r, DAY).getTime()) later.push(r);
        /* a weekly report can still come, late, until its week closes */
        else if (r.cadence === 'weekly' && sundayOf(DAY) >= WEEK_FROM) open.push(r);
        else missing.push(r);
      });
      /* and on the days after, this week's weekly reports still not in —
         Friday's on Saturday and Sunday — until the week closes */
      if (sundayOf(DAY) >= WEEK_FROM) REPORTS.forEach(function (r) {
        if (r.cadence !== 'weekly') return;
        var dd = addDays(sundayOf(DAY), r.dueDay - 7);
        if (dd >= DAY) return;
        var w = windowOf(r, dd);
        if (now >= w.to) return;
        var hit = all.some(function (f) {
          var tm = f.when.getTime();
          return f.report === r.id && f.person === r.person && tm >= w.from && tm < w.to;
        });
        if (!hit) open.push(r);
      });
      tMissing.set(String(missing.length));
      owedBox.innerHTML = '';
      if (missing.length) owedBox.appendChild(owedList('chmissing', t('chMissingList'), byDueTime(missing)));
      if (open.length) owedBox.appendChild(owedList('chmissing', t('chWeekOpenList'), byDueTime(open)));
      if (later.length) owedBox.appendChild(owedList('chlater', t('chNotDueYet'), byDueTime(later)));
    }

    onSnapshot(q, function (snap) {
      all = [];
      snap.forEach(function (docu) {
        var x = docu.data({ serverTimestamps: 'estimate' });
        x.when = x.at && x.at.toDate ? x.at.toDate() : new Date();
        all.push(x);
      });
      /* the charts' "today" column is drawn from these same filings */
      TODAY_FEED.all = all;
      TODAY_FEED.fns.forEach(function (f) { f(); });
      var filed = all.filter(function (f) { return f.when.getTime() >= start; });

      tFiled.set(String(filed.length));
      into.innerHTML = '';
      if (!filed.length) {
        into.appendChild(el('p', 'codenote', t('chNothingFiled')));
      }
      /* a second filing of the same report is a correction: it says so,
         and on time or late stays the first one's, as in the ledger */
      filed.forEach(function (f) {
        var r = reportById(f.report);
        var from = windowOf(r, r && r.cadence === 'weekly' ? dueFor(r, f.when) : DAY).from;
        var first = null, due = r ? dueFor(r, f.when) : null;
        all.forEach(function (g) {
          var tm = g.when.getTime();
          if (!first && g.report === f.report && g.person === f.person && tm >= from &&
              (!r || dueFor(r, g.when) === due)) first = g;
        });
        into.appendChild(rawCard(f, first));
      });
      into.appendChild(owedBox);
      drawOwed();
    }, failInto(into));

    setInterval(function () {
      if (!all) return;
      drawOwed();
      /* a deadline passing turns "not due yet" into "missing" without any
         new report — the charts ask whether that changed their picture */
      TODAY_FEED.fns.forEach(function (f) { f(true); });
    }, 60000);
  }

  /* ---------------- at a glance ---------------- */

  /* The figures above, and the ones the reports carry, drawn (js/charts.js
     does the drawing). Read once and kept current like the rest of the
     page: the ledger's closed days for who reported, and four people's own
     reports for the money, the output, the waste and the quality. Only
     their reports are read, and only four weeks of them — the page is
     opened on a phone, and the whole archive is not needed to draw a month.

     A figure that was not reported is shown as not reported, never as 0 —
     the same rule the agents follow. */
  var TODAY_FEED = { all: null, fns: [] };
  var CHART_PEOPLE = ['betty', 'ephrata', 'amaha', 'wude'];
  var WD = {
    en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    am: ['እ', 'ሰ', 'ማ', 'ረ', 'ሐ', 'ዓ', 'ቅ']
  };

  function tfill(k, o) {
    var s = t(k);
    Object.keys(o || {}).forEach(function (x) { s = s.split('{' + x + '}').join(o[x]); });
    return s;
  }
  /* "Mon 28 Sep" — short enough for a tooltip, in his language */
  function dayShort(day) {
    var d = new Date(day + 'T12:00:00Z');
    return lang === 'am'
      ? DAYS.am[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MONTHS.am[d.getUTCMonth()]
      : DAYS.en[d.getUTCDay()].slice(0, 3) + ' ' + d.getUTCDate() + ' ' + MONTHS.en[d.getUTCMonth()].slice(0, 3);
  }
  function monShort(day) {
    var m = MONTHS[lang][Number(day.slice(5, 7)) - 1];
    return lang === 'am' ? m : m.slice(0, 3);
  }
  /* a figure from a report, or null — a blank is not a zero */
  function fig(v) {
    if (v == null || String(v).trim() === '') return null;
    var s = String(v).replace(/[^0-9.\-]/g, '');
    return s === '' || isNaN(Number(s)) ? null : Number(s);
  }
  /* the last n working days (no Sundays), oldest first, ending with `end` */
  function workDays(end, n) {
    var out = [], d = end;
    while (out.length < n) { if (dow(d) !== 0) out.unshift(d); d = addDays(d, -1); }
    return out;
  }
  /* "Abrham G." where two people share a first name */
  function shortNames() {
    var first = {}, out = {};
    PEOPLE.forEach(function (p) { var f = L(p).split(' ')[0]; first[f] = (first[f] || 0) + 1; });
    PEOPLE.forEach(function (p) {
      var w = L(p).split(' ');
      out[p.id] = first[w[0]] > 1 && w[1] ? w[0] + ' ' + w[1].charAt(0) + '.' : w[0];
    });
    return out;
  }

  /* ---- a person's day, opened from a chart ----
     Tapping a square in "who reported", or a bar, opens what that person
     actually filed that day — the same card as the day's reports below, in
     the words they typed, already open. A report that never came says so,
     and when it was due. The panel is the observatory's: it rises from the
     bottom, and closes on ×, a tap outside it, or Escape. */
  var SHEET = null;
  function closeSheet() {
    if (!SHEET) return;
    var s = SHEET;
    SHEET = null;
    s.veil.remove();
    s.sheet.remove();
    document.removeEventListener('keydown', s.key);
    if (s.back && s.back.focus) { try { s.back.focus({ preventScroll: true }); } catch (e) {} }
  }
  function notFiledCard(r, s, day) {
    var passed = day < DAY || (day === DAY && r && Date.now() >= deadline(r, DAY).getTime());
    var waiting = s === 'wait' || (!s && !passed);
    var card = el('div', 'chrow chnotfiled' + (waiting ? '' : ' late'));
    var head = el('div', 'chnfh');
    head.appendChild(el('span', 'chrr', r ? L(r) : ''));
    head.appendChild(el('span', 'chrt', waiting ? t('chgWait') : t('chgMiss')));
    card.appendChild(head);
    if (r) card.appendChild(el('p', 'codenote', t('chgWasDue') + ' ' + L({ en: r.dueEn, am: r.dueAm })));
    return card;
  }
  function openDay(personId, day, lines, back) {
    closeSheet();
    var veil = el('div', 'chsheet-veil');
    var sheet = el('div', 'obs-sheet chsheet');
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.appendChild(el('div', 'obs-grab'));
    var x = el('button', 'obs-close', '×');
    x.type = 'button';
    x.setAttribute('aria-label', t('chClose'));
    x.onclick = closeSheet;
    sheet.appendChild(x);
    var p = personById(personId);
    var title = el('h2', 'chsheet-t', p ? L(p) : personId);
    title.id = 'chsheet-t';
    sheet.setAttribute('aria-labelledby', title.id);
    sheet.appendChild(title);
    sheet.appendChild(el('p', 'chsheet-d', (day === DAY ? t('chgToday') + ' · ' : '') + prettyDay(day)));
    var body = el('div', 'chsheet-b');
    body.appendChild(el('p', 'codenote', t('chLoading')));
    sheet.appendChild(body);
    veil.onclick = closeSheet;
    document.body.appendChild(veil);
    document.body.appendChild(sheet);
    var key = function (e) { if (e.key === 'Escape') closeSheet(); };
    document.addEventListener('keydown', key);
    SHEET = { veil: veil, sheet: sheet, back: back, key: key };
    x.focus();

    /* the week before as well: a weekly report may come in days early */
    getDocs(query(collection(db, 'reports'), where('person', '==', personId),
                  where('at', '>=', dayStart(addDays(day, -8))), where('at', '<', dayStart(addDays(day, 1)))))
      .then(function (qs) {
        if (!SHEET || SHEET.sheet !== sheet) return;
        var filed = [];
        qs.forEach(function (d) {
          var f = d.data({ serverTimestamps: 'estimate' });
          f.when = f.at && f.at.toDate ? f.at.toDate() : new Date();
          filed.push(f);
        });
        filed.sort(function (a, b) { return a.when - b.when; });
        body.innerHTML = '';
        var seen = {};
        lines.forEach(function (l) {
          if (seen[l.rid]) return;
          seen[l.rid] = true;
          var r = reportById(l.rid);
          var w = windowOf(r, day), from = w.from, to = w.to, hit = null, first = null;
          /* the answers are the last filing's — a correction is filed again —
             and on time or late is the first one's, as the ledger has it */
          filed.forEach(function (f) {
            var tm = f.when.getTime();
            if (f.report === l.rid && tm >= from && tm < to) { hit = f; if (!first) first = f; }
          });
          if (hit) {
            var card = rawCard(hit, first);
            card.open = true;
            body.appendChild(card);
          } else {
            body.appendChild(notFiledCard(r, l.s, day));
          }
        });
      }, function (e) {
        body.innerHTML = '';
        body.appendChild(el('p', 'codeerr', errText(e)));
      });
  }

  function watchCharts(box) {
    var C = window.KleverCharts;
    if (!C) { box.innerHTML = ''; return; }
    var ledgers = null, reps = null, whoSig = '';

    onSnapshot(query(collection(db, 'ledger'), where('day', '>=', addDays(DAY, -20)), orderBy('day', 'asc')),
      function (qs) {
        ledgers = [];
        qs.forEach(function (d) { ledgers.push(d.data()); });
        draw();
      }, failInto(box));
    onSnapshot(query(collection(db, 'reports'), where('person', 'in', CHART_PEOPLE),
                     where('at', '>=', dayStart(addDays(DAY, -41)))),
      function (qs) {
        reps = [];
        qs.forEach(function (d) {
          var x = d.data({ serverTimestamps: 'estimate' });
          x.when = x.at && x.at.toDate ? x.at.toDate() : new Date();
          reps.push(x);
        });
        draw();
      }, failInto(box));
    TODAY_FEED.fns.push(function (tick) {
      if (tick && todaySig() === whoSig) return;
      draw();
    });

    function todaySig() {
      return JSON.stringify(todayCells().map(function (c) { return c.person + c.s; }));
    }

    /* today, by the ledger's rules, from the filings the page already has */
    function todayCells() {
      var all = TODAY_FEED.all;
      if (!all) return [];
      var end = dayStart(addDays(DAY, 1)).getTime(), now = Date.now();
      return dueOn(DAY).map(function (r) {
        /* on time or late is the FIRST filing, as the ledger judges it
           (settle_ in Agent.js): a correction sent after the deadline does
           not turn a report that came in on time into a late one */
        var from = windowOf(r, DAY).from, hit = null;
        all.forEach(function (f) {
          var tm = f.when.getTime();
          if (f.report === r.id && f.person === r.person && tm >= from && tm < end &&
              (!hit || tm < hit.when.getTime())) hit = f;
        });
        /* a weekly report past its deadline is not in yet — it counts, late,
           until Sunday 9 PM — not missing */
        var open = !hit && r.cadence === 'weekly' && sundayOf(DAY) >= WEEK_FROM && now >= deadline(r, DAY).getTime();
        var s = hit ? (isLate(hit) ? 'late' : 'ok') : (now < deadline(r, DAY).getTime() || open ? 'wait' : 'miss');
        return { person: r.person, rid: r.id, report: L(r), s: s, w: open ? t('chNotInYet') : null, at: hit ? hit.when : null };
      });
    }

    function draw() {
      if (!ledgers || !reps) return;
      whoSig = todaySig();
      box.innerHTML = '';
      box.appendChild(whoChart());
      box.appendChild(bankChart());
      box.appendChild(collectChart());
      box.appendChild(dailyChart({ report: 'amaha-daily', field: 'p_total', title: t('chgProd'), sub: t('chgProdSub'),
        ref: { v: 40, label: t('chgTarget40'), good: 'above' }, unit: ' m²', ok: 'chgProdOk', bad: 'chgProdBad' }));
      box.appendChild(dailyChart({ report: 'amaha-daily', field: 'w_pct', title: t('chgWaste'), sub: t('chgWasteSub'),
        ref: { v: 20, label: t('chgLimit20'), good: 'below' }, unit: '%', ok: 'chgWasteOk', bad: 'chgWasteBad' }));
      /* a pass rate lives between 90 and 100: as bars from zero, 97 and 98
         look the same; as a line read from 80, the bonus line is visible */
      box.appendChild(dailyChart({ report: 'wude-daily', field: 'i_rate', title: t('chgPass'), sub: t('chgPassSub'),
        ref: { v: 98, label: t('chgTarget98'), good: 'above' }, unit: '%', min: 80, max: 100, line: true,
        ok: 'chgPassOk', bad: 'chgPassBad' }));
    }

    /* ---- who reported: the ledger's closed days, and today so far ---- */
    function whoChart() {
      var WORD = { ok: t('chgOn'), late: t('chgLate'), miss: t('chgMiss'), wait: t('chgWait') };
      var RANK = { miss: 4, late: 3, ok: 2, wait: 1 };
      function sOf(status) {
        return status === 'MISSING' ? 'miss' : status === 'LATE' ? 'late' : status === 'On time' ? 'ok'
             : status === 'NOT IN YET' ? 'wait' : null;
      }
      var days = ledgers.filter(function (d) { return d.day < DAY && (d.lines || []).length; }).slice(-10);
      var cols = days.map(function (d) {
        return { day: d.day, lines: (d.lines || []).map(function (l) {
          var at = l.at && l.at.toDate ? l.at.toDate() : null;
          return { person: l.person, rid: l.report, report: lineReport(l), s: sOf(l.status), at: at };
        }).filter(function (l) { return l.s; }) };
      });
      var tc = todayCells();
      if (tc.length) cols.push({ day: DAY, today: true, lines: tc });

      var names = shortNames(), seen = {};
      cols.forEach(function (c) { c.lines.forEach(function (l) { seen[l.person] = true; }); });
      var people = PEOPLE.filter(function (p) { return seen[p.id]; });

      var rows = people.map(function (p) {
        return { name: names[p.id], cells: cols.map(function (c) {
          var mine = c.lines.filter(function (l) { return l.person === p.id; });
          if (!mine.length) return null;
          var worst = mine.reduce(function (a, l) { return RANK[l.s] > RANK[a] ? l.s : a; }, 'wait');
          return { s: worst, tip: [L(p) + ' · ' + (c.today ? t('chgToday') : dayShort(c.day))].concat(mine.map(function (l) {
            return l.report + ' — ' + (l.w || WORD[l.s]) + (l.at ? ', ' + hhmm(l.at) : '');
          })),
            /* a tap opens what they filed that day, in their own words */
            open: function (from) { openDay(p.id, c.day, mine, from); } };
        }) };
      });
      var colsOut = cols.map(function (c) {
        var due = c.lines.filter(function (l) { return l.s !== 'wait'; }).length;
        var ok = c.lines.filter(function (l) { return l.s === 'ok'; }).length;
        return { top: WD[lang][dow(c.day)], bottom: c.today ? '•' : String(Number(c.day.slice(8))), today: !!c.today,
                 tip: [tfill('chgOnTimeOf', { ok: ok, due: due }), c.today ? t('chgToday') : dayShort(c.day)] };
      });
      var last = cols.filter(function (c) { return !c.today; }).pop(), cap = null;
      if (last) {
        var inN = last.lines.filter(function (l) { return l.s === 'ok' || l.s === 'late'; }).length;
        cap = tfill('chgWhoCap', { day: dayShort(last.day), 'in': inN, due: last.lines.length,
                                   ok: last.lines.filter(function (l) { return l.s === 'ok'; }).length });
      }
      var tally = rows.map(function (r, i) {
        var n = { ok: 0, late: 0, miss: 0 };
        r.cells.forEach(function (c) { if (c && n[c.s] != null) n[c.s]++; });
        return [L(people[i]), String(n.ok), String(n.late), String(n.miss)];
      });
      return C.grid({
        title: t('chgWho'), sub: t('chgWhoSub'), cols: colsOut, rows: rows, caption: cap,
        legend: [['ok', '✓', WORD.ok], ['late', '!', WORD.late], ['miss', '✕', WORD.miss], ['wait', '·', WORD.wait]],
        numbers: { title: t('chgNumbers'), head: [t('chgPerson'), '✓ ' + WORD.ok, '! ' + WORD.late, '✕ ' + WORD.miss], rows: tally }
      });
    }

    /* the last filing of a report on each Addis day: {day: values} */
    function byDay(reportId) {
      var out = {};
      reps.filter(function (f) { return f.report === reportId; })
          .sort(function (a, b) { return a.when - b.when; })
          .forEach(function (f) { out[addisYmd(f.when)] = f.values || {}; });
      return out;
    }

    /* ---- money in the bank, against the reserve ---- */
    function bankChart() {
      var daily = byDay('betty-daily'), fc = byDay('betty-forecast'), pts = [];
      for (var i = 27; i >= 0; i--) {
        var d = addDays(DAY, -i);
        var v = fig((daily[d] || {}).bank_total), note = t('chgFromDaily');
        if (v == null) { v = fig((fc[d] || {}).cf7_bank); note = t('chgFromForecast'); }
        pts.push({ day: d, top: String(Number(d.slice(8))), bottom: (i === 27 || d.slice(8) === '01') ? monShort(d) : '',
                   title: dayShort(d), v: v, note: v == null ? '' : note,
                   open: dow(d) === 0 ? null : (function (day) {
                     return function (from) {
                       /* her daily report is not owed on Fridays */
                       var owed = dueOn(day).some(function (r) { return r.id === 'betty-daily'; });
                       openDay('betty', day, [{ rid: 'betty-forecast' }].concat(owed ? [{ rid: 'betty-daily' }] : []), from);
                     };
                   })(d) });
      }
      var lastP = pts.filter(function (p) { return p.v != null; }).pop();
      var status = !lastP ? { kind: 'none', icon: '–', text: t('chgBankNone') }
        : lastP.v < 6000000 ? { kind: 'bad', icon: '▼', text: tfill('chgBankBelow', { v: birr(lastP.v), day: dayShort(lastP.day) }) }
        : { kind: 'good', icon: '✓', text: tfill('chgBankAbove', { v: birr(lastP.v), day: dayShort(lastP.day) }) };
      return C.line({
        title: t('chgBank'), sub: t('chgBankSub') + ' ' + t('chgTapBar'), status: status, points: pts, joinGap: 2,
        ref: { v: 6000000, label: t('chgReserve'), good: 'above' },
        fmt: function (v) { return birr(v) + ' ' + t('unBirr'); }, tick: function (v) { return short(v); },
        lab: function (v) { return short(v); },
        words: { notRep: t('chgNotRep'), none: t('chgBankNone') },
        numbers: { title: t('chgNumbers'), head: [t('chgDay'), t('chgValue')],
                   rows: pts.filter(function (p) { return p.v != null; }).map(function (p) { return [p.title + ' · ' + p.note, birr(p.v)]; }) }
      });
    }

    /* ---- collected each week, against the 3,000,000 floor ---- */
    function collectChart() {
      var eph = byDay('ephrata-daily'), monday = addDays(DAY, -((dow(DAY) + 6) % 7)), pts = [];
      for (var w = 4; w >= 0; w--) {
        var m = addDays(monday, -7 * w), sum = 0, rep = 0, owed = 0;
        for (var k = 0; k < 6; k++) {
          var d = addDays(m, k);
          if (d > DAY) break;
          owed++;
          var v = fig((eph[d] || {}).collected_today);
          if (v != null) { sum += v; rep++; }
        }
        /* "28 Sep"; in Amharic the month's name is too long for a column,
           so the week is written 28/9 */
        var wkLabel = lang === 'am' ? Number(m.slice(8)) + '/' + Number(m.slice(5, 7))
                                    : Number(m.slice(8)) + ' ' + monShort(m);
        pts.push({ day: m, top: wkLabel, bottom: w === 0 ? t('chgThisWeek') : '',
                   title: tfill('chgWeekOf', { day: dayShort(m) }), v: rep ? sum : null, partial: w === 0 && dow(DAY) !== 0,
                   note: tfill('chgDaysRep', { n: rep, m: owed }), rep: rep, owed: owed, label: w === 0 });
      }
      var now = pts[pts.length - 1];
      var status = now.v == null ? { kind: 'none', icon: '–', text: t('chgCollectNone') }
        : now.v >= 3000000 ? { kind: 'good', icon: '✓', text: tfill('chgCollectMet', { v: birr(now.v) }) }
        : { kind: 'warn', icon: '!', text: tfill('chgCollectNow', { v: birr(now.v), n: now.rep, m: now.owed }) };
      return C.columns({
        title: t('chgCollect'), sub: t('chgCollectSub'), status: status, points: pts,
        ref: { v: 3000000, label: t('chgFloor'), good: 'above' },
        fmt: function (v) { return birr(v) + ' ' + t('unBirr'); }, tick: function (v) { return short(v); },
        lab: function (v) { return short(v); },
        words: { notRep: t('chgNotRep'), notYet: t('chgNotYet'), none: t('chgNoneDays') },
        legend: [['is-good', t('chgLegendMet'), '✓'], ['is-bad', t('chgLegendShort'), '✕'],
                 ['is-partial', t('chgLegendSoFar'), ''], ['is-none', t('chgLegendNone'), '–']],
        numbers: { title: t('chgNumbers'), head: [t('chgWeek'), t('chgValue')],
                   rows: pts.map(function (p) { return [p.title + ' · ' + p.note, p.v == null ? t('chgNotRep') : birr(p.v)]; }) }
      });
    }

    /* ---- one figure a working day, against its line ---- */
    function dailyChart(o) {
      var rep = reportById(o.report), by = byDay(o.report), now = Date.now();
      var pts = workDays(DAY, 12).map(function (d) {
        var v = fig((by[d] || {})[o.field]);
        var wait = v == null && d === DAY && rep && now < deadline(rep, DAY).getTime();
        return { day: d, top: WD[lang][dow(d)], bottom: String(Number(d.slice(8))), title: dayShort(d), v: v,
                 wait: wait,
                 open: rep ? function (from) { openDay(rep.person, d, [{ rid: o.report, s: wait ? 'wait' : null }], from); } : null };
      });
      var fmt = function (v) { return (Math.round(v * 10) / 10).toLocaleString('en-US') + o.unit; };
      var lastP = pts.filter(function (p) { return p.v != null; }).pop(), status;
      if (!lastP) status = { kind: 'none', icon: '–', text: t('chgNoneDays') };
      else {
        var good = o.ref.good === 'above' ? lastP.v >= o.ref.v : lastP.v <= o.ref.v;
        var gap = Math.round(Math.abs(lastP.v - o.ref.v) * 10) / 10;
        status = { kind: good ? 'good' : 'bad', icon: good ? '✓' : '✕',
                   text: tfill('chgLatest', { v: fmt(lastP.v), day: dayShort(lastP.day),
                                              how: tfill(good ? o.ok : o.bad, { d: gap.toLocaleString('en-US') }) }) };
      }
      return C[o.line ? 'line' : 'columns']({
        title: o.title, sub: o.sub + ' ' + t('chgTapBar'), status: status, points: pts, ref: o.ref, max: o.max, min: o.min, joinGap: 1, labelGap: 22,
        fmt: fmt, tick: function (v) { return (Math.round(v * 10) / 10) + o.unit.trim().replace('m²', ''); },
        words: { notRep: t('chgNotRep'), notYet: t('chgNotYet'), none: t('chgNoneDays') },
        legend: [['is-good', t('chgLegendMet'), '✓'], ['is-bad', t('chgLegendShort'), '✕'], ['is-none', t('chgLegendNone'), '–']],
        numbers: { title: t('chgNumbers'), head: [t('chgDay'), t('chgValue')],
                   rows: pts.map(function (p) { return [p.title, p.v == null ? (p.wait ? t('chgNotYet') : t('chgNotRep')) : fmt(p.v)]; }) }
      });
    }
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

  function rawCard(f, first) {
    var rep = reportById(f.report);
    var corrected = first && first !== f;
    var late = isLate(corrected ? first : f);

    var card = el('details', 'chrow' + (late ? ' late' : ''));
    var head = el('summary');
    head.appendChild(el('span', 'chrw', nameOf(f.person)));
    head.appendChild(el('span', 'chrr', rep ? L(rep) : f.report));
    head.appendChild(el('span', 'chrt', hhmm(f.when) + (corrected ? ' · ' + t('chCorrection') : late ? ' · ' + t('late') : '')));
    card.appendChild(head);

    var body = el('div', 'chrbody');
    if (corrected) {
      body.appendChild(el('p', 'codenote', tfill('chCorrected', { a: hhmm(first.when), b: hhmm(f.when) })));
    }
    if (f.by && f.by !== f.person) {
      body.appendChild(el('p', 'codenote', t('chFiledBy') + ' ' + nameOf(f.by)));
    }
    body.appendChild(fieldTable(rep, f.values || {}));
    /* The answers that cannot be right, checked again now (oddFigures in
       forms.js): a report filed before the phone checked them carries none
       in its flags, and the Chairman should see them all the same. */
    var flags = (f.flags || []).slice();
    if (rep && typeof oddFigures === 'function') {
      oddFigures(rep, f.values || {}).forEach(function (o) {
        var fd = null;
        rep.sections.forEach(function (s) { s.fields.forEach(function (x) { if (x.id === o.f) fd = x; }); });
        var q = fd ? L(fd).replace(/\s*\([^()]*\)\s*$/, '') : o.f;
        var msg = (lang === 'am' ? o.am : o.en);
        if (!flags.some(function (x) { return x.indexOf(msg) !== -1; })) flags.push(t('toCheck') + ': ' + q + ' — ' + msg);
      });
    }
    if (flags.length) {
      var fl = el('div', 'chflags');
      fl.appendChild(el('div', 'chfl', t('flags')));
      flags.forEach(function (x) { fl.appendChild(el('div', null, x)); });
      body.appendChild(fl);
    }
    card.appendChild(body);
    return card;
  }

  /* every value the person typed, under the label they saw */
  /* The report as the person saw it: section by section, question by
     question, in the form's own order. It used to walk the stored answers in
     the database's order, which is alphabetical — "3 · Pre-measurement" came
     before "1 · Leads today", a two-box answer showed as two raw codes
     (resp_1hr__a 11, resp_1hr__b 10), and a list nobody filled in still
     showed its heading. Now a two-box answer is one line under its question,
     yes/no and choices are words, money says Birr, a list is a line per row,
     and what was left empty is left out (the flags say how much was). */
  function fieldTable(rep, values) {
    var wrap = el('div', 'chfields');
    var used = {};
    function blank(v) { return v == null || String(v).trim() === ''; }
    function optLabel(f, v) {
      for (var i = 0; i < (f.opts || []).length; i++) if (f.opts[i].v === v) return L(f.opts[i]);
      return String(v);
    }
    function show(f, v) {
      if (f.t === 'yesno') return v === 'yes' ? t('yes') : v === 'no' ? t('no') : String(v);
      if (f.t === 'choice') return optLabel(f, v);
      if (f.t === 'money') {
        var n = Number(String(v).replace(/[^0-9.\-]/g, ''));
        return (String(v).replace(/[^0-9.\-]/g, '') === '' || isNaN(n) ? String(v) : birr(n)) + ' ' + t('unBirr');
      }
      if (f.t === 'pct') return String(v).replace(/%/g, '').trim() + '%';
      return String(v);
    }
    function line(k, v, cls) {
      var r = el('div', 'chf' + (cls ? ' ' + cls : ''));
      r.appendChild(el('span', 'chfk', k));
      if (v != null) r.appendChild(el('span', 'chfv', v));
      return r;
    }
    function rowsOf(v) {
      if (!v || typeof v !== 'object') return [];
      return Object.prototype.toString.call(v) === '[object Array]' ? v : Object.keys(v).map(function (k) { return v[k]; });
    }

    ((rep && rep.sections) || []).forEach(function (s) {
      var out = [];
      (s.fields || []).forEach(function (f) {
        if (f.t === 'ratio') {
          var a = values[f.id + '__a'], b = values[f.id + '__b'];
          used[f.id + '__a'] = used[f.id + '__b'] = true;
          if (blank(a) && blank(b)) return;
          out.push(line(L(f), (blank(a) ? '—' : a) + ' / ' + (blank(b) ? '—' : b)));
          return;
        }
        var v = values[f.id];
        used[f.id] = true;
        if (f.t === 'table' || f.t === 'grid') {
          var cols = f.cols || [];
          var rows = rowsOf(v).map(function (r, i) {
            if (!r || typeof r !== 'object') return blank(r) ? null : String(r);
            var bits = cols.filter(function (c) { return !blank(r[c.id]); }).map(function (c) {
              return c.t === 'choice' ? optLabel(c, r[c.id]) : c.t === 'money' ? show(c, r[c.id]) : String(r[c.id]);
            });
            if (!bits.length) return null;
            /* a grid's rows have names of their own (the days of a plan) */
            return (f.t === 'grid' && f.rows && f.rows[i] ? L(f.rows[i]) + ': ' : '') + bits.join(' · ');
          }).filter(Boolean);
          if (!rows.length) return;
          var box = line(L(f), null, 'chftable');
          var list = el('div', 'chflist');
          rows.forEach(function (x) { list.appendChild(el('div', null, x)); });
          box.appendChild(list);
          out.push(box);
          /* a table that adds up a column shows its total, as the form did */
          if (f.total) {
            var sum = rowsOf(v).reduce(function (acc, r) {
              var x = Number(String((r || {})[f.total] == null ? '' : r[f.total]).replace(/[^0-9.\-]/g, ''));
              return acc + (isNaN(x) ? 0 : x);
            }, 0);
            out.push(line(lang === 'am' ? (f.totalAm || 'ጠቅላላ') : (f.totalEn || 'Total'), birr(sum) + ' ' + t('unBirr'), 'chftotal'));
          }
          return;
        }
        if (blank(v)) return;
        out.push(line(L(f), show(f, v)));
      });
      if (out.length) {
        wrap.appendChild(el('div', 'chsec', L(s)));
        out.forEach(function (x) { wrap.appendChild(x); });
      }
    });
    /* anything filed that the form no longer asks — kept, under its own name */
    var rest = Object.keys(values).filter(function (k) { return !used[k] && !blank(values[k]) && typeof values[k] !== 'object'; });
    if (rest.length) {
      wrap.appendChild(el('div', 'chsec', '—'));
      rest.forEach(function (k) { wrap.appendChild(line(k, String(values[k]))); });
    }
    if (!wrap.childNodes.length) wrap.appendChild(el('p', 'codenote', t('chNoValues')));
    return wrap;
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
    /* "Sun 28 Sep 2026", not the computer's "28/09/2026" */
    r2.appendChild(window.KLEVER && window.KLEVER.dressDate ? window.KLEVER.dressDate(due) : due);
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
      }).then(function (ref) {
        notifyPhones([ref.id]);
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
    head.appendChild(el('span', 'chrw', nameOf(i.to) + (i.by === 'reminder' ? ' · ' + t('chInsReminder') : '')));
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
  var STATUS = { 'On time': 'onTime', 'LATE': 'late', 'MISSING': 'chNotFiled', 'NOT DUE YET': 'chNotDueYet',
                 'NOT IN YET': 'chNotInYet' };
  function statusText(s) { return STATUS[s] ? t(STATUS[s]) : s; }
  function lineWho(l) { var p = personById(l.person); return p ? L(p) : (l.name || l.person); }
  function lineReport(l) { var r = reportById(l.report); return r ? L(r) : (l.reportName || l.report); }

  /* Report lines carry no kind — they are all fines. A rule line says
     whether it is a fine, a bonus, or a note that is not money (a warning,
     a suspension). */
  function kindOf(l) { return l.kind || 'penalty'; }
  var KIND_WORD = { penalty: 'chFine', bonus: 'chBonus', consequence: 'chNoted' };
  function ruleById(id) {
    if (typeof RULES === 'undefined') return null;
    for (var i = 0; i < RULES.length; i++) if (RULES[i].id === id) return RULES[i];
    return null;
  }
  function lineWhat(l) {
    if (!l.rule) return lineReport(l);
    var r = ruleById(l.rule);
    return r ? L(r) : (l.reportName || l.rule);
  }
  /* every line of one closed day, reports first; a closed month has only
     rule lines */
  function linesOf(d) { return (d.lines || []).concat(d.ruleLines || []); }
  /* worth showing: anything that costs or pays, a note, or a line tracked
     at nothing only because its paper is not signed yet */
  function worthShowing(l) {
    return l.amount > 0 || kindOf(l) === 'consequence' || l.wouldBe > 0;
  }
  function signed(n, kind) {
    if (kind === 'consequence') return '';
    return (kind === 'bonus' ? '+' : '−') + birr(n);
  }

  /* Last month's pay is final at the end of the 5th: until then every
     line of it can still be cancelled, and the Pay tab is written again
     each morning from the 3rd to the 6th with whatever he cancelled. */
  var PAY_FINAL_DAY = 5;

  /* Three places from the same closed days: the fines (with the warnings
     and suspensions that go with them), the bonuses, and what the month
     comes to for each person's pay. */
  function watchCharges(box, tOwed, tBonus) {
    var month = DAY.slice(0, 8) + '01';
    var early = Number(DAY.slice(8)) <= PAY_FINAL_DAY;
    var from = early ? addDays(month, -1).slice(0, 8) + '01' : month;
    var ledgers = [], months = [], waivers = {}, got = {}, wErr = null, mErr = null;
    var isFine = function (l) { return kindOf(l) !== 'bonus'; };
    var isBonus = function (l) { return kindOf(l) === 'bonus'; };

    function draw() {
      if (!got.l || !got.w || !got.m) return;
      box.fines.innerHTML = '';
      box.bonus.innerHTML = '';
      box.pay.innerHTML = '';
      /* a closed month carries its last day, so it sorts after that day */
      var docs = ledgers.concat(months.map(function (m) {
        return { day: m.day, ruleLines: m.lines || [], month: m.month, errors: m.errors || [] };
      })).sort(function (a, b) {
        return a.day < b.day ? -1 : a.day > b.day ? 1 : (a.month ? 1 : -1);
      });
      if (!docs.length) {
        box.fines.appendChild(el('p', 'codenote', t('chNoLedger')));
        box.bonus.appendChild(el('p', 'codenote', t('chNoLedger')));
        if (wErr) box.fines.appendChild(el('p', 'codeerr', errText(wErr)));
        tOwed.set('0');
        tBonus.set('0');
        return;
      }

      var per = {}, fines = 0, bonuses = 0, prev = [], pf = 0, pb = 0, prevF = false, prevB = false;
      docs.forEach(function (d) {
        var before = d.day < month;
        if (before) prev.push(d);
        linesOf(d).forEach(function (l) {
          if (!worthShowing(l)) return;
          var k = kindOf(l), off = waivers[d.day + '|' + l.report];
          if (before) {
            if (k === 'bonus') { prevB = true; if (!off) pb += l.amount || 0; }
            else { prevF = true; if (!off && k === 'penalty') pf += l.amount || 0; }
            return;
          }
          /* only what moves pay makes a row — a held or unsigned line does not */
          if (off || !(l.amount > 0) || k === 'consequence') return;
          var p = per[l.person] || (per[l.person] = { name: lineWho(l), fines: 0, bonuses: 0 });
          if (k === 'bonus') { p.bonuses += l.amount; bonuses += l.amount; }
          else { p.fines += l.amount; fines += l.amount; }
        });
      });
      tOwed.set(short(fines), exact(fines));
      tBonus.set(short(bonuses), exact(bonuses));

      var last = ledgers[ledgers.length - 1];
      function lastDay(into, pick, empty) {
        if (!last) return;
        into.appendChild(el('p', 'skysub', t('chChargesDay') + ' · ' + prettyDay(last.day)));
        var lines = linesOf(last).filter(worthShowing).filter(pick);
        if (!lines.length) into.appendChild(el('p', 'codenote', empty));
        var all = wholeDayRow(last.day, lines, waivers);
        if (all) into.appendChild(all);
        grouped(lines).forEach(function (l) {
          into.appendChild(l.group ? groupRow(last.day, l.group, waivers)
                                   : chargeRow(last.day, l, waivers[last.day + '|' + l.report]));
        });
      }
      lastDay(box.fines, isFine, t('chNoCharges'));
      if (last && last.ruleErrors && last.ruleErrors.length) {
        box.fines.appendChild(el('p', 'codeerr', t('chRuleErrors') + ' ' + last.ruleErrors.join('; ')));
      }
      if (prevF) box.fines.appendChild(lastMonth(prev, isFine, pf, 'penalty', last && last.day));
      lastDay(box.bonus, isBonus, t('chNoBonusDay'));
      if (prevB) box.bonus.appendChild(lastMonth(prev, isBonus, pb, 'bonus', last && last.day));

      /* each person's month: fines, bonuses, and the net change to pay */
      var ids = Object.keys(per).sort(function (a, b) {
        return (per[a].bonuses - per[a].fines) - (per[b].bonuses - per[b].fines);
      });
      if (ids.length) {
        var det = el('details', 'chmonth chpay');
        det.appendChild(el('summary', null, t('chByPerson') + ' · ' + signed(fines, 'penalty') +
          ' · ' + signed(bonuses, 'bonus') + ' ' + t('unBirr')));
        var head = el('div', 'chf chfhead');
        head.appendChild(el('span', 'chfk', ''));
        head.appendChild(el('span', 'chfv', t('chFines')));
        head.appendChild(el('span', 'chfv', t('chBonuses')));
        head.appendChild(el('span', 'chfv', t('chNet')));
        det.appendChild(head);
        ids.forEach(function (k) {
          var p = per[k], net = p.bonuses - p.fines;
          var r = el('div', 'chf');
          r.appendChild(el('span', 'chfk', p.name));
          r.appendChild(el('span', 'chfv fine', p.fines ? signed(p.fines, 'penalty') : '—'));
          r.appendChild(el('span', 'chfv bonus', p.bonuses ? signed(p.bonuses, 'bonus') : '—'));
          r.appendChild(el('span', 'chfv net', net ? signed(Math.abs(net), net > 0 ? 'bonus' : 'penalty') : '0'));
          det.appendChild(r);
        });
        box.pay.appendChild(det);
      }
      /* without the cancellations the figures above would be wrong */
      if (wErr) box.fines.appendChild(el('p', 'codeerr', errText(wErr)));
      if (mErr) box.bonus.appendChild(el('p', 'codeerr', errText(mErr)));
    }

    /* Last month's fines, or its bonuses — every line, each still
       cancellable until its pay is final, newest first. The day already
       shown above is not repeated. */
    function lastMonth(prev, pick, sum, kind, shown) {
      var det = el('details', 'chmonth chprev');
      det.appendChild(el('summary', null, t('chPrevMonth') + ' · ' + monthName(prev[0].day) +
        ' · ' + signed(sum, kind) + ' ' + t('unBirr')));
      det.appendChild(el('p', 'codenote', t('chPrevMonthNote')));
      prev.slice().reverse().forEach(function (d) {
        if (d.day === shown && !d.month) return;
        var lines = linesOf(d).filter(worthShowing).filter(pick);
        if (!lines.length) return;
        det.appendChild(el('div', 'chsec', d.month ? t('chMonthClosed') + ' · ' + monthName(d.day) : prettyDay(d.day)));
        var all = d.month ? null : wholeDayRow(d.day, lines, waivers);
        if (all) det.appendChild(all);
        grouped(lines).forEach(function (l) {
          det.appendChild(l.group ? groupRow(d.day, l.group, waivers)
                                  : chargeRow(d.day, l, waivers[d.day + '|' + l.report]));
        });
      });
      return det;
    }

    onSnapshot(query(collection(db, 'ledger'), where('day', '>=', from), orderBy('day', 'asc')),
      function (qs) {
        ledgers = [];
        qs.forEach(function (d) { ledgers.push(d.data()); });
        got.l = true;
        draw();
      }, failInto(box.fines));
    onSnapshot(query(collection(db, 'months'), where('month', '>=', from.slice(0, 7))),
      function (qs) {
        months = [];
        qs.forEach(function (d) { months.push(d.data()); });
        got.m = true;
        mErr = null;
        draw();
      }, function (e) { got.m = true; mErr = e; draw(); });
    onSnapshot(query(collection(db, 'waivers'), where('day', '>=', from)),
      function (qs) {
        waivers = {};
        qs.forEach(function (d) { var w = d.data(); waivers[w.day + '|' + w.report] = w; });
        got.w = true;
        wErr = null;
        draw();
      }, function (e) { got.w = true; wErr = e; draw(); });
  }

  /* This month's bonuses so far — judged each morning on the month until
     then. Nothing here is paid; the month's close on the 2nd is. */
  function watchStanding(into) {
    function part(title, rows, cls, open, value) {
      if (!rows.length) return null;
      var det = el('details', 'chmonth chsofar ' + cls);
      if (open) det.open = true;
      det.appendChild(el('summary', null, title + ' (' + rows.length + ')'));
      rows.forEach(function (x) {
        var r = el('div', 'chf chsf');
        var k = el('span', 'chfk');
        k.appendChild(el('b', null, personById(x.person) ? L(personById(x.person)) : x.name));
        var rule = ruleById(x.rule);
        k.appendChild(el('span', 'chsfw', ' · ' + (rule ? L(rule) : x.what)));
        if (x.why) k.appendChild(el('small', 'chsfy', x.why));
        r.appendChild(k);
        r.appendChild(el('span', 'chfv bonus', value(x)));
        det.appendChild(r);
      });
      return det;
    }
    onSnapshot(query(collection(db, 'standing'), orderBy('asOf', 'desc'), limit(1)), function (qs) {
      into.innerHTML = '';
      var s = null;
      qs.forEach(function (d) { s = d.data(); });
      into.appendChild(el('p', 'skysub', t('chMonthSoFar') + (s ? ' · ' + monthName(s.asOf) + ' · ' + t('chAsOf') + ' ' + prettyDay(s.asOf) : '')));
      if (!s) { into.appendChild(el('p', 'codenote', t('chNoStanding'))); return; }
      into.appendChild(el('p', 'codenote', t('chMonthSoFarNote')));
      /* the total is what would be paid: a held or unsigned bonus is listed,
         in brackets, and not added in */
      var on = s.onTrack || [], sum = on.reduce(function (a, x) { return a + (x.counted ? (x.birr || 0) : 0); }, 0);
      [part(t('chOnTrack') + ' · ' + signed(sum, 'bonus') + ' ' + t('unBirr'), on, 'on', true, function (x) {
         return x.counted ? signed(x.birr, 'bonus') : '(' + signed(x.birr, 'bonus') + ')';
       }),
       part(t('chNotOnTrack'), s.notOnTrack || [], 'off', false, function (x) { return x.birr ? signed(x.birr, 'bonus') : ''; }),
       part(t('chCantTell'), s.cannotTell || [], 'unk', false, function (x) { return x.birr ? signed(x.birr, 'bonus') : ''; })
      ].forEach(function (d) { if (d) into.appendChild(d); });
    }, failInto(into));
  }

  /* A team rule makes one line for every production worker — twenty-two
     rows saying the same thing. Four or more lines of the same rule and the
     same amount on one day are shown as one row, and cancelled together. */
  function grouped(lines) {
    var out = [], by = {}, order = [];
    lines.forEach(function (l) {
      if (!l.rule) { out.push(l); return; }
      var k = l.rule + '|' + (l.amount || 0) + '|' + (l.wouldBe || 0);
      if (!by[k]) { by[k] = []; order.push(k); }
      by[k].push(l);
    });
    order.forEach(function (k) {
      var g = by[k];
      if (g.length < 4) g.forEach(function (l) { out.push(l); });
      else out.push({ group: g });
    });
    return out;
  }

  /* A day nobody could file — the site was down, or the staff had no
     sign-in yet — leaves a missing-report fine on everyone. One by one that
     is twenty taps; this cancels every report fine of the day still standing,
     with one reason, which each cancellation carries. Rule fines (for what
     happened) are left alone: they are not about the day's filing. */
  function wholeDayRow(day, lines, waivers) {
    var open = lines.filter(function (l) {
      return !l.rule && l.amount > 0 && !waivers[day + '|' + l.report];
    });
    if (open.length < 2) return null;
    var sum = open.reduce(function (a, l) { return a + l.amount; }, 0);
    var row = el('div', 'chchg penalty chall');
    var head = el('div', 'chinsh');
    head.appendChild(el('span', 'chrw', tfill('chCancelAllHead', { n: open.length })));
    head.appendChild(el('span', 'chrt', signed(sum, 'penalty')));
    row.appendChild(head);
    row.appendChild(el('div', 'chinsn', t('chCancelAllNote')));
    var btn = el('button', 'chmini', tfill('chCancelAll', { n: open.length }));
    btn.type = 'button';
    var box = el('div', 'chcancel');
    box.hidden = true;
    var why = el('input');
    why.type = 'text';
    why.id = 'cancel-all-' + day;
    why.maxLength = 500;
    why.placeholder = t('chCancelWhy');
    var go = el('button', 'chmini bad', tfill('chCancelAllGo', { n: open.length }));
    go.type = 'button';
    box.appendChild(why);
    box.appendChild(go);
    btn.onclick = function () { btn.hidden = true; box.hidden = false; why.focus(); };
    go.onclick = function () {
      var reason = why.value.trim();
      if (reason.length < 3) { why.focus(); return; }
      go.disabled = true;
      Promise.all(open.map(function (x) {
        return addDoc(collection(db, 'waivers'), {
          day: day, report: x.report, person: x.person, reason: reason,
          amount: x.amount || 0, by: 'chairman', at: serverTimestamp()
        });
      }))['catch'](function () { go.disabled = false; toast(t('chSaveFailed')); });
    };
    row.appendChild(btn);
    row.appendChild(box);
    return row;
  }

  function groupRow(day, g, waivers) {
    var l = g[0], k = kindOf(l);
    var r = ruleById(l.rule);
    var grp = r && typeof RULE_GROUPS !== 'undefined' &&
              (r.who || []).map(function (w) { return RULE_GROUPS[w]; }).filter(Boolean)[0];
    var open = g.filter(function (x) { return !waivers[day + '|' + x.report]; });
    var pending = !l.amount && l.wouldBe > 0;
    var row = el('div', 'chchg ' + k + (open.length ? '' : ' off') + (pending ? ' pending' : ''));
    var head = el('div', 'chinsh');
    head.appendChild(el('span', 'chrw', (grp ? L(grp) : t('chPeople')) + ' ×' + g.length));
    head.appendChild(el('span', 'chrr', lineWhat(l) + ' · ' + t(KIND_WORD[k])));
    var each = pending ? l.wouldBe : l.amount;
    head.appendChild(el('span', 'chrt', (pending ? '(' : '') + signed(each, k) + ' ' + t('chEach') + (pending ? ')' : '')));
    row.appendChild(head);
    if (l.why) row.appendChild(el('div', 'chinsn', l.why));
    if (!open.length) {
      var w = waivers[day + '|' + l.report];
      row.appendChild(el('div', 'chinsn', t('chCancelled') + (w ? ': ' + w.reason : '')));
      return row;
    }
    if (pending) return row;
    var btn = el('button', 'chmini', t('chCancel') + ' (' + open.length + ')');
    btn.type = 'button';
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
    btn.onclick = function () { btn.hidden = true; box.hidden = false; why.focus(); };
    go.onclick = function () {
      var reason = why.value.trim();
      if (reason.length < 3) { why.focus(); return; }
      go.disabled = true;
      Promise.all(open.map(function (x) {
        return addDoc(collection(db, 'waivers'), {
          day: day, report: x.report, person: x.person, reason: reason,
          amount: x.amount || 0, by: 'chairman', at: serverTimestamp()
        });
      }))['catch'](function () { go.disabled = false; toast(t('chSaveFailed')); });
    };
    row.appendChild(btn);
    row.appendChild(box);
    return row;
  }

  function chargeRow(day, l, waiver) {
    var k = kindOf(l);
    var pending = !l.amount && l.wouldBe > 0;
    var row = el('div', 'chchg ' + k + (waiver ? ' off' : '') + (pending ? ' pending' : ''));
    var head = el('div', 'chinsh');
    head.appendChild(el('span', 'chrw', lineWho(l)));
    /* a line of another day — a weekly report closed with its week on the
       Sunday, or something recorded later — says its own day */
    var own = l.dueDay || (l.day && l.day !== day ? l.day : null);
    head.appendChild(el('span', 'chrr', lineWhat(l) + ' · ' +
      (l.rule ? t(KIND_WORD[k]) : statusText(l.status)) + (l.count > 1 ? ' ×' + l.count : '') +
      (own ? ' · ' + dayShort(own) : '')));
    head.appendChild(el('span', 'chrt', pending ? '(' + signed(l.wouldBe, k) + ')' : signed(l.amount, k)));
    row.appendChild(head);
    if (l.rule && l.why) row.appendChild(el('div', 'chinsn', l.why));

    if (waiver) {
      row.appendChild(el('div', 'chinsn', t('chCancelled') + ': ' + waiver.reason));
      return row;
    }
    if (pending) return row;
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
        amount: l.amount || 0, by: 'chairman', at: serverTimestamp()
      })['catch'](function () { go.disabled = false; toast(t('chSaveFailed')); });
    };
    row.appendChild(open);
    row.appendChild(box);
    return row;
  }

  /* ---------------- recording what happened ---------------- */

  /* Most rules are decided from the reports. The rest he records: who,
     which rule, which day. He never types an amount — the ledger takes it
     from the rulebook at the next morning's close, which is also when the
     line appears above. The letter's own words are shown under the rule so
     he records against what the paper says, not what he remembers. */
  function rulePeople(r) {
    var out = [];
    (r.who || []).forEach(function (w) {
      var g = (typeof RULE_GROUPS !== 'undefined') && RULE_GROUPS[w];
      if (g && g.role) {
        PEOPLE.forEach(function (p) { if (p.roleEn === g.role) out.push(p.id); });
      } else out.push(w);
    });
    return out;
  }
  function rulesFor(key) {
    if (typeof RULES === 'undefined') return [];
    return RULES.filter(function (r) {
      if (r.birr == null && r.kind !== 'consequence') return false;   /* a formula is worked out, not recorded */
      return rulePeople(r).indexOf(key) !== -1;
    });
  }

  function watchEvents(into) {
    var box = el('details', 'chmonth chrec');
    box.appendChild(el('summary', null, t('chRecord')));
    var form = el('div', 'chinsform');

    var who = el('select');
    PEOPLE.forEach(function (p) {
      var o = el('option', null, L(p) + ' — ' + (lang === 'am' ? p.roleAm : p.roleEn));
      o.value = p.id;
      who.appendChild(o);
    });
    [['assembler', t('chAnAssembler')], ['cleaner', t('chTheCleaner')]].forEach(function (x) {
      var o = el('option', null, x[1]);
      o.value = x[0];
      who.appendChild(o);
    });
    var named = el('input');
    named.type = 'text';
    named.maxLength = 60;
    named.placeholder = t('chAssemblerName');
    named.hidden = true;

    var rule = el('select');
    var said = el('p', 'chrecsrc');
    var count = el('input');
    count.type = 'number';
    count.min = '1';
    count.max = '1000';
    count.value = '1';
    count.inputMode = 'numeric';
    var day = el('input');
    day.type = 'date';
    day.value = DAY;
    day.max = DAY;
    var note = el('textarea');
    note.rows = 2;
    note.maxLength = 500;
    note.placeholder = t('chRecNote');
    var go = el('button', 'seed', t('chRecGo'));
    go.type = 'button';

    function fillRules() {
      rule.innerHTML = '';
      var list = rulesFor(who.value);
      var mine = list.filter(function (r) { return r.how === 'recorded'; });
      var auto = list.filter(function (r) { return r.how !== 'recorded'; });
      function add(into_, r) {
        var o = el('option', null, (r.kind === 'bonus' ? '+ ' : r.kind === 'penalty' ? '− ' : '• ') +
          L(r) + (r.birr ? ' · ' + birr(r.birr) : ''));
        o.value = r.id;
        into_.appendChild(o);
      }
      mine.forEach(function (r) { add(rule, r); });
      if (auto.length) {
        var g = el('optgroup');
        g.label = t('chRecAuto');
        auto.forEach(function (r) { add(g, r); });
        rule.appendChild(g);
      }
      go.disabled = !list.length;
      explain();
    }
    function explain() {
      var r = ruleById(rule.value);
      said.textContent = r ? r.src : t('chRecNone');
      var n = Math.max(1, Math.min(1000, parseInt(count.value, 10) || 1));
      if (r && r.birr) said.textContent += '  →  ' + signed(r.birr * n, r.kind) + ' ' + t('unBirr');
    }
    who.onchange = function () { named.hidden = who.value !== 'assembler'; fillRules(); };
    rule.onchange = explain;
    count.oninput = explain;

    function field(label, input) {
      var r = el('label', 'chinsf');
      r.appendChild(el('span', null, label));
      r.appendChild(input);
      return r;
    }
    form.appendChild(field(t('chRecWho'), who));
    form.appendChild(named);
    form.appendChild(field(t('chRecRule'), rule));
    form.appendChild(said);
    form.appendChild(field(t('chRecDay'), window.KLEVER && window.KLEVER.dressDate ? window.KLEVER.dressDate(day) : day));
    form.appendChild(field(t('chRecCount'), count));
    form.appendChild(note);
    form.appendChild(go);
    box.appendChild(form);
    fillRules();

    go.onclick = function () {
      var r = ruleById(rule.value);
      if (!r || !day.value) return;
      var key = who.value, name;
      if (key === 'assembler') {
        name = named.value.trim();
        if (name.length < 2) { named.focus(); return; }
        key = 'assembler:' + name.toLowerCase().replace(/\s+/g, ' ');
      } else if (key === 'cleaner') {
        name = 'Cleaner';
      } else {
        name = (personById(key) || {}).en || key;
      }
      go.disabled = true;
      addDoc(collection(db, 'events'), {
        person: key.slice(0, 80), name: name.slice(0, 80), rule: r.id, day: day.value,
        count: Math.max(1, Math.min(1000, parseInt(count.value, 10) || 1)),
        note: note.value.trim().slice(0, 500), by: 'chairman', at: serverTimestamp()
      }).then(function () {
        note.value = '';
        count.value = '1';
        go.disabled = false;
        explain();
        toast(t('chRecDone'));
      })['catch'](function () { go.disabled = false; toast(t('chSaveFailed')); });
    };

    /* what he recorded in the last fortnight, newest first */
    var list = el('div', 'chinslist');
    box.appendChild(list);
    onSnapshot(query(collection(db, 'events'), where('at', '>=', dayStart(addDays(DAY, -14)))),
      function (qs) {
        var evs = [];
        qs.forEach(function (d) { evs.push(d.data({ serverTimestamps: 'estimate' })); });
        evs.sort(function (a, b) {
          return (b.at && b.at.toMillis ? b.at.toMillis() : 0) - (a.at && a.at.toMillis ? a.at.toMillis() : 0);
        });
        list.innerHTML = '';
        if (!evs.length) { list.appendChild(el('p', 'codenote', t('chRecEmpty'))); return; }
        evs.forEach(function (e) {
          var r = ruleById(e.rule);
          var row = el('div', 'chinsrow ' + (r ? r.kind : ''));
          var h = el('div', 'chinsh');
          h.appendChild(el('span', 'chrw', personById(e.person) ? L(personById(e.person)) : e.name));
          h.appendChild(el('span', 'chrr', (r ? L(r) : e.rule) + (e.count > 1 ? ' ×' + e.count : '')));
          var when = e.at && e.at.toDate ? addisYmd(e.at.toDate()) : DAY;
          h.appendChild(el('span', 'chrt', when === DAY ? t('chRecTomorrow') : t('chRecCounted') + ' ' + when));
          row.appendChild(h);
          row.appendChild(el('div', 'chinsn', prettyDay(e.day) + (e.note ? ' — ' + e.note : '')));
          list.appendChild(row);
        });
      }, failInto(list));
    into.appendChild(box);
  }

  /* ---------------- the week ---------------- */

  function watchWeek(into, cfoInto) {
    onSnapshot(query(collection(db, 'packs'), orderBy('end', 'desc'), limit(4)), function (qs) {
      var packs = [];
      qs.forEach(function (d) { packs.push(d.data()); });
      var w = packs.filter(function (p) { return p.kind === 'week'; })[0];
      into.innerHTML = '';
      drawCfo(cfoInto, w);
      if (!w) { into.appendChild(el('p', 'codenote', t('chNoWeek'))); return; }

      into.appendChild(el('p', 'skysub', prettyDay(w.start) + ' – ' + prettyDay(w.end)));
      var tiles = el('div', 'chtiles');
      tiles.appendChild(tile(t('chOnTime'), w.onTimePct == null ? '—' : w.onTimePct + '%').box);
      /* null is a week nobody reported it (see sumOf_ in Packs.js), not a 0 */
      tiles.appendChild(tile(t('chMade'), (w.m2 == null ? '—' : short(w.m2)) + ' / ' + short(w.m2Target)).box);
      tiles.appendChild(tile(t('chCollected'), w.collected == null ? '—' : short(w.collected),
                             w.collected == null ? null : exact(w.collected)).box);
      into.appendChild(tiles);
      var f = el('div', 'chfind brief');
      f.appendChild(el('div', 'chft', w.text || ''));
      into.appendChild(f);
    }, function (e) { failInto(into)(e); failInto(cfoInto)(e); });
  }

  /* The CFO's week: three figures, the reading, and each spending line
     against its recent average. Every figure was worked out in Cfo.js; a
     null is a line Selam did not fill in, shown as a dash, never a 0. */
  function drawCfo(into, w) {
    into.innerHTML = '';
    if (!w || !w.cfoText) { into.appendChild(el('p', 'codenote', t('cfoNone'))); return; }
    var dash = function (x) { return x == null ? '—' : short(x); };
    var tiles = el('div', 'chtiles');
    tiles.appendChild(tile(t('cfoSpent'), dash(w.cfoSpent), w.cfoSpent == null ? null : exact(w.cfoSpent)).box);
    tiles.appendChild(tile(t('cfoIn'), dash(w.cfoIn), w.cfoIn == null ? null : exact(w.cfoIn)).box);
    tiles.appendChild(tile(t('cfoWeeks'), w.cfoWeeksLeft == null ? '—' : String(w.cfoWeeksLeft),
                           w.cfoWeeksNote || null).box);
    into.appendChild(tiles);
    var f = el('div', 'chfind cfo');
    f.appendChild(el('div', 'chft', w.cfoText));
    into.appendChild(f);
    var lines = (w.cfoLines || []).filter(function (l) { return l.birr != null || l.avg != null; });
    if (!lines.length) return;
    var tbl = el('div', 'chcfo-lines');
    var head = el('div', 'chf chcfo-head');
    head.appendChild(el('span', 'chfk', t('cfoLine')));
    head.appendChild(el('span', 'chfv', t('cfoThisWeek') + ' · ' + t('cfoAvg')));
    tbl.appendChild(head);
    lines.forEach(function (l) {
      var r = el('div', 'chf');
      r.appendChild(el('span', 'chfk', L(l)));
      var v = el('span', 'chfv');
      v.appendChild(document.createTextNode(l.birr == null ? '—' : birr(l.birr)));
      v.appendChild(el('span', 'chcfo-avg', ' · ' + (l.avg == null ? '—' : birr(l.avg))));
      r.appendChild(v);
      tbl.appendChild(r);
    });
    if (w.cfoSpent != null) {
      var tot = el('div', 'chf chftotal');
      tot.appendChild(el('span', 'chfk', t('cfoTotal')));
      tot.appendChild(el('span', 'chfv', birr(w.cfoSpent)));
      tbl.appendChild(tot);
    }
    into.appendChild(tbl);
  }

  /* ---------------- his questions to the AI ---------------- */

  /* The question goes into /asks first — the rules let only him write one —
     and then its id goes to the script's web app with his sign-in token,
     which answers it onto the same document (apps-script/Ask.js). If that
     post is lost, the script's ten-minute watch answers it instead. The
     answer appears here by itself: this page watches the collection. */
  function askAI(q) {
    var id = 'q' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    return setDoc(doc(db, 'asks', id), { q: q, at: serverTimestamp(), by: me, status: 'asked' })
      .then(function () {
        var u = auth.currentUser;
        return u ? u.getIdToken() : null;
      })
      .then(function (tok) {
        if (tok && window.ARCHIVE && window.ARCHIVE.on()) {
          window.ARCHIVE.post({ kind: 'ask', k: id, idToken: tok })['catch'](function () {});
        }
      });
  }

  function askCard(a) {
    var box = el('div', 'chask-item');
    box.appendChild(el('div', 'chask-q', a.q || ''));
    var when = a.at && a.at.toDate ? a.at.toDate() : null;
    if (a.status === 'answered') {
      var ans = el('div', 'chft', a.a || '');      /* 'chft' alone turns "* " into bullets */
      ans.classList.add('chask-a');
      box.appendChild(ans);
      box.appendChild(el('div', 'chask-meta', (when ? hhmm(when) + ' · ' : '') +
                         (a.model ? t('chReadBy') + ' ' + a.model : '')));
    } else if (a.status === 'failed') {
      box.appendChild(el('div', 'chask-a chask-fail', t('aiAskCouldNot') + ' ' + (a.error || '')));
      var again = el('button', 'chask-again', t('aiAskAgain'));
      again.type = 'button';
      again.onclick = function () {
        again.disabled = true;
        askAI(a.q)['catch'](function () { again.disabled = false; toast(t('aiAskFailed')); });
      };
      box.appendChild(again);
    } else {
      box.appendChild(el('div', 'chask-a chask-wait', t('aiAskThinking')));
    }
    return box;
  }

  function watchAsks(into) {
    var form = el('form', 'chask-form');
    var q = el('textarea');
    q.rows = 2;
    q.maxLength = 1000;
    q.placeholder = t('aiAskHint');
    q.setAttribute('aria-label', t('aiAskTitle'));
    var go = el('button', 'seed', t('aiAskBtn'));
    go.type = 'submit';
    form.appendChild(q);
    form.appendChild(go);
    into.appendChild(form);
    into.appendChild(el('p', 'chask-note', t('aiAskNote')));
    var list = el('div', 'chask-list');
    into.appendChild(list);

    form.onsubmit = function (e) {
      e.preventDefault();
      var text = q.value.trim();
      if (!text) { q.focus(); return; }
      go.disabled = true;
      askAI(text).then(function () {
        q.value = '';
        go.disabled = false;
      }, function () {
        go.disabled = false;
        toast(t('aiAskFailed'));
      });
    };

    onSnapshot(query(collection(db, 'asks'), orderBy('at', 'desc'), limit(10)), function (qs) {
      list.innerHTML = '';
      qs.forEach(function (d) { list.appendChild(askCard(d.data({ serverTimestamps: 'estimate' }))); });
    }, failInto(list));
  }

  /* ---------------- leads and jobs, in two lines ---------------- */

  /* The summary apps-script/Register.js writes after each report: how many
     leads are open and how many have gone quiet, how many jobs and how many
     with something wrong, the first line of the morning's note, and the way
     to the page with the tables (register.html). */
  function watchRegister(into) {
    var NS = 'http://www.w3.org/2000/svg';
    onSnapshot(doc(db, 'register', 'summary'), function (d) {
      into.innerHTML = '';
      var s = d.exists() ? d.data() : null;
      if (!s || (!s.leads && !s.jobs)) {
        into.appendChild(el('div', 'chreg-l', t('regCardNone')));
      } else {
        into.appendChild(el('div', 'chreg-l' + (s.leadsQuiet ? ' bad' : ''),
          tfill('regCardLeads', { n: s.leadsOpen || 0, q: s.leadsQuiet || 0 })));
        into.appendChild(el('div', 'chreg-l' + (s.jobProblems ? ' bad' : ''),
          tfill('regCardJobs', { n: s.jobs || 0, p: s.jobProblems || 0 })));
        if (s.note) into.appendChild(el('div', 'chord-why', bullets(String(s.note).split('\n')[0])));
      }
      var a = el('a', 'obs-open');
      a.href = 'register.html';
      var ic = document.createElementNS(NS, 'svg');
      [['viewBox', '0 0 24 24'], ['fill', 'none'], ['stroke', 'currentColor'], ['stroke-width', '1.7'],
       ['stroke-linecap', 'round'], ['aria-hidden', 'true']].forEach(function (x) { ic.setAttribute(x[0], x[1]); });
      var pth = document.createElementNS(NS, 'path');
      pth.setAttribute('d', 'M4 5.5h16v13H4zM4 10h16M4 14.5h16M10 5.5v13');
      ic.appendChild(pth);
      a.appendChild(ic);
      a.appendChild(document.createTextNode(t('regOpen')));
      into.appendChild(a);
    }, failInto(into));
  }

  /* ---------------- his orders, routed by the AI ---------------- */

  /* He writes an order in a sentence; the script (apps-script/Orders.js)
     reads each person's duties and plans who does what, by when. Nothing is
     sent until he presses Send: he can change the person, the words or the
     date, or take a task out, first. Send writes the instructions — the same
     ones he can give by hand below — and marks the order sent, in one batch,
     so either all of them are given or none is. Then a line goes into each
     person's private chat with him, and a WhatsApp button is there for each. */
  function orderAI(q) {
    var id = 'o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    return setDoc(doc(db, 'orders', id), { q: q, at: serverTimestamp(), by: me, status: 'asked' })
      .then(function () {
        var u = auth.currentUser;
        return u ? u.getIdToken() : null;
      })
      .then(function (tok) {
        if (tok && window.ARCHIVE && window.ARCHIVE.on()) {
          window.ARCHIVE.post({ kind: 'order', k: id, idToken: tok })['catch'](function () {});
        }
        return id;
      });
  }

  /* An order he answered (the AI asked him something) or tried again goes
     on as a new order; the old card leaves his list, so a question he has
     answered is not still asking. Dropped ones leave it too. */
  function retireOrder(o, next) {
    var ch = next ? { status: 'replaced', next: next, sentAt: serverTimestamp() }
                  : { status: 'dropped', sentAt: serverTimestamp() };
    return updateDoc(doc(db, 'orders', o.id), ch);
  }
  var ORDERS_HIDDEN = { replaced: true, dropped: true };

  /* the words that go to the person, in both languages, with where to close it */
  function orderMessageFor(task) {
    return 'Instruction from the Chairman · ከሊቀመንበሩ የተሰጠ መመሪያ — ' +
           (lang === 'am' ? 'እስከ ' : 'by ') + dayShort(task.due) + '\n\n' + task.what + '\n\n' +
           t('ordMsgClose') + '\n' + location.origin + location.pathname.replace(/chairman\.html.*$/, '');
  }

  /* The script sends each new instruction to its person's phone (apps-script/
     Push.js). If this post is lost, its ten-minute watch sends them anyway. */
  function notifyPhones(ids) {
    if (!ids || !ids.length) return;
    var u = auth.currentUser;
    (u ? u.getIdToken() : Promise.resolve(null)).then(function (tok) {
      if (tok && window.ARCHIVE && window.ARCHIVE.on()) {
        window.ARCHIVE.post({ kind: 'notify', k: ids.join(','), idToken: tok })['catch'](function () {});
      }
    })['catch'](function () {});
  }

  function sendOrder(o, tasks) {
    var b = writeBatch(db), sent = [];
    tasks.forEach(function (task) {
      var ref = doc(collection(db, 'instructions'));
      b.set(ref, { to: task.to, text: task.what, due: task.due, by: 'chairman', status: 'open', at: serverTimestamp() });
      sent.push({ to: task.to, what: task.what, due: task.due, ins: ref.id });
    });
    b.update(doc(db, 'orders', o.id), { status: 'sent', sentAt: serverTimestamp(), sent: sent });
    return b.commit().then(function () {
      notifyPhones(sent.map(function (s) { return s.ins; }));
      /* a line in each person's private chat with him — the instruction
         stands without it, so a failure here is not his to deal with */
      tasks.forEach(function (task) {
        try {
          addDoc(collection(db, 'channels', 'direct-' + task.to, 'messages'),
                 { who: me, text: orderMessageFor(task), lang: lang, at: serverTimestamp() })['catch'](function () {});
        } catch (e) {}
      });
    });
  }

  function orderTaskRow(task, rows, redraw) {
    var row = el('div', 'chord-row');
    var who = el('select');
    who.setAttribute('aria-label', t('chInsTo'));
    (typeof CHAT_ACCOUNTS !== 'undefined' ? CHAT_ACCOUNTS : []).forEach(function (id) {
      var op = el('option', null, nameOf(id));
      op.value = id;
      if (id === task.to) op.selected = true;
      who.appendChild(op);
    });
    who.onchange = function () { task.to = who.value; };
    var what = el('textarea');
    what.rows = 3;
    what.maxLength = 1000;
    what.value = task.what;
    what.setAttribute('aria-label', t('chInsWhat'));
    what.oninput = function () { task.what = what.value; };
    var due = el('input');
    due.type = 'date';
    due.value = task.due;
    due.min = DAY;
    due.setAttribute('aria-label', t('chInsDue'));
    due.onchange = function () { task.due = due.value; };

    var top = el('div', 'chord-top');
    top.appendChild(who);
    var x = el('button', 'chmini', '×');
    x.type = 'button';
    x.title = t('ordRemove');
    x.setAttribute('aria-label', t('ordRemove'));
    x.onclick = function () { rows.splice(rows.indexOf(task), 1); redraw(); };
    top.appendChild(x);
    row.appendChild(top);
    row.appendChild(what);
    var r2 = el('label', 'chinsf');
    r2.appendChild(el('span', null, t('chInsDue')));
    r2.appendChild(window.KLEVER && window.KLEVER.dressDate ? window.KLEVER.dressDate(due) : due);
    row.appendChild(r2);
    if (task.why) row.appendChild(el('div', 'chord-why', t('ordWhy') + ': ' + task.why));
    return row;
  }

  function orderCard(o) {
    var box = el('div', 'chask-item chord');
    box.appendChild(el('div', 'chask-q', o.q || ''));
    var when = o.at && o.at.toDate ? o.at.toDate() : null;

    if (o.status === 'planned') {
      var rows = (o.tasks || []).map(function (x) { return { to: x.to, what: x.what, due: x.due, why: x.why }; });
      var list = el('div', 'chord-list');
      box.appendChild(list);
      if (o.why) box.appendChild(el('div', 'chask-meta', o.why));
      var bar = el('div', 'chord-bar');
      var send = el('button', 'seed', '');
      send.type = 'button';
      var drop = el('button', 'chask-again', t('ordDrop'));
      drop.type = 'button';
      bar.appendChild(send);
      bar.appendChild(drop);
      box.appendChild(bar);
      box.appendChild(el('div', 'chask-meta', (when ? hhmm(when) + ' · ' : '') +
                         (o.model ? t('chReadBy') + ' ' + o.model : '')));
      var redraw = function () {
        list.innerHTML = '';
        rows.forEach(function (task) { list.appendChild(orderTaskRow(task, rows, redraw)); });
        send.textContent = tfill('ordSend', { n: rows.length });
        send.disabled = !rows.length;
      };
      redraw();
      send.onclick = function () {
        var bad = rows.filter(function (task) {
          return !task.to || !String(task.what || '').trim() || !/^\d{4}-\d{2}-\d{2}$/.test(task.due || '');
        });
        if (bad.length || !rows.length) { toast(t('ordIncomplete')); return; }
        rows.forEach(function (task) { task.what = String(task.what).trim().slice(0, 1000); });
        send.disabled = drop.disabled = true;
        sendOrder(o, rows)['catch'](function () {
          send.disabled = drop.disabled = false;
          toast(t('ordFailed'));
        });
      };
      drop.onclick = function () {
        send.disabled = drop.disabled = true;
        updateDoc(doc(db, 'orders', o.id), { status: 'dropped', sentAt: serverTimestamp() })['catch'](function () {
          send.disabled = drop.disabled = false;
          toast(t('ordFailed'));
        });
      };
    } else if (o.status === 'sent') {
      var sentAt = o.sentAt && o.sentAt.toDate ? o.sentAt.toDate() : null;
      var sentDay = sentAt ? new Date(sentAt.getTime() + 3 * 3600e3).toISOString().slice(0, 10) : null;   /* Addis */
      var earlier = !!(sentDay && DAY && sentDay < DAY);
      box.appendChild(el('div', 'chord-sent', t('ordSent') + (sentAt ? ' · ' + (earlier ? dayShort(sentDay) + ' ' : '') + hhmm(sentAt) : '')));
      /* the same words by the same day to several people are shown once,
         with everyone they went to, and one WhatsApp button for all of them */
      var groups = [], byKey = {};
      (o.sent || []).forEach(function (task) {
        var k = task.due + '\n' + task.what;
        if (!byKey[k]) { byKey[k] = { task: task, to: [] }; groups.push(byKey[k]); }
        byKey[k].to.push(nameOf(task.to));
      });
      /* sent on an earlier day: folded to who and by when, open on a tap */
      var into = box;
      if (earlier) {
        into = el('details', 'chord-old');
        into.appendChild(el('summary', null, tfill('ordSentTo', { names: groups.map(function (g) { return g.to.join(', '); }).join(' · ') })));
        box.appendChild(into);
      }
      groups.forEach(function (g) {
        var r = el('div', 'chord-done');
        r.appendChild(el('div', 'chord-to', tfill('ordSentTo', { names: g.to.join(', ') }) + ' · ' + t('chInsDue') + ' ' + dayShort(g.task.due)));
        r.appendChild(el('div', 'chord-what', g.task.what));
        var wa = el('a', 'chask-again chord-wa', t('ordWhatsApp'));
        wa.href = 'https://wa.me/?text=' + encodeURIComponent(orderMessageFor(g.task));
        wa.target = '_blank';
        wa.rel = 'noopener';
        r.appendChild(wa);
        r.appendChild(el('div', 'chord-why', tfill('ordWaPick', { names: g.to.map(function (n) { return n.split(' ')[0]; }).join(', ') })));
        into.appendChild(r);
      });
      into.appendChild(el('div', 'chask-meta', t('ordSentNote')));
    } else if (o.status === 'unclear' || o.status === 'failed') {
      var asking = o.status === 'unclear';
      box.appendChild(asking ? el('div', 'chord-ask', t('ordAsks') + ' ' + (o.question || ''))
                             : el('div', 'chask-a chask-fail', t('ordCouldNot') + ' ' + (o.error || '')));
      var more = null;
      if (asking) {
        more = el('textarea');
        more.rows = 2;
        more.maxLength = 500;
        more.setAttribute('aria-label', t('ordAnswer'));
        box.appendChild(more);
      }
      var bar2 = el('div', 'chord-bar');
      var ans = el('button', 'chask-again', t(asking ? 'ordAnswer' : 'ordAgain'));
      ans.type = 'button';
      var drop2 = el('button', 'chask-again', t('ordDrop'));
      drop2.type = 'button';
      ans.onclick = function () {
        var a = more ? more.value.trim() : '';
        if (more && !a) { more.focus(); return; }
        ans.disabled = drop2.disabled = true;
        orderAI(more ? String(o.q || '').slice(0, 480) + ' — ' + a.slice(0, 500) : o.q).then(function (id) {
          return retireOrder(o, id)['catch'](function () {});   /* the new one is asked either way */
        }, function () {
          ans.disabled = drop2.disabled = false;
          toast(t('ordFailed'));
        });
      };
      drop2.onclick = function () {
        ans.disabled = drop2.disabled = true;
        retireOrder(o, null)['catch'](function () {
          ans.disabled = drop2.disabled = false;
          toast(t('ordFailed'));
        });
      };
      bar2.appendChild(ans);
      bar2.appendChild(drop2);
      box.appendChild(bar2);
    } else {
      box.appendChild(el('div', 'chask-a chask-wait', t('ordThinking')));
    }
    return box;
  }

  function watchOrders(into) {
    var form = el('form', 'chask-form');
    var q = el('textarea');
    q.rows = 2;
    q.maxLength = 1000;
    q.placeholder = t('ordHint');
    q.setAttribute('aria-label', t('ordTitle'));
    var go = el('button', 'seed', t('ordBtn'));
    go.type = 'submit';
    form.appendChild(q);
    form.appendChild(go);
    into.appendChild(form);
    into.appendChild(el('p', 'chask-note', t('ordNote')));
    var list = el('div', 'chask-list');
    into.appendChild(list);

    form.onsubmit = function (e) {
      e.preventDefault();
      var text = q.value.trim();
      if (!text) { q.focus(); return; }
      go.disabled = true;
      orderAI(text).then(function () {
        q.value = '';
        go.disabled = false;
      }, function () {
        go.disabled = false;
        toast(t('ordFailed'));
      });
    };

    /* A card he is working on — a plan he is changing, an answer he is
       typing — is kept as it is while other orders come and go; a card is
       drawn again only when its own order moves on. */
    var cards = {};
    onSnapshot(query(collection(db, 'orders'), orderBy('at', 'desc'), limit(20)), function (qs) {
      var seen = {}, shown = 0;
      list.innerHTML = '';
      qs.forEach(function (d) {
        var o = d.data({ serverTimestamps: 'estimate' });
        o.id = d.id;
        if (ORDERS_HIDDEN[o.status] || shown >= 8) return;
        shown++;
        seen[d.id] = true;
        var c = cards[d.id];
        if (!c || c.status !== o.status) c = cards[d.id] = { status: o.status, el: orderCard(o) };
        list.appendChild(c.el);
      });
      Object.keys(cards).forEach(function (k) { if (!seen[k]) delete cards[k]; });
    }, failInto(list));
  }

  /* ---------------- did the night's jobs work ---------------- */

  /* Each scheduled job leaves one line in /health when it ends (ran_ in
     apps-script/Agent.js). A job that threw used to stop in silence — the
     weekly summary failed every Sunday and nothing said so. A line that says
     it failed, or a job whose time has come and gone with no line at all,
     goes in red at the top of the page as well as in the list. */
  var HEALTH_FROM = '2026-10-02';   /* the log starts here; nothing earlier is expected */
  var JOBS = [['daily', 'chSysDaily'], ['week', 'chSysWeek'], ['month', 'chSysMonth'],
              ['reading', 'chSysReading']];
  /* the Addis day each job should have run on by now: the morning close by
     8:00 every day, the week (it closes Sunday 9 PM) by 8:00 on Monday — the
     job's day is the Sunday — the month by 10:00 on the 2nd */
  function slotOf(job) {
    var now = new Date(Date.now() + 3 * 3600e3), h = now.getUTCHours();
    var d = utcYmd(now), s = null;
    if (job === 'daily') s = h >= 8 ? d : addDays(d, -1);
    if (job === 'week') {
      s = addDays(d, -dow(d));
      if (s === d || (dow(d) === 1 && h < 8)) s = addDays(s, -7);
    }
    if (job === 'month') {
      s = d.slice(0, 8) + '02';
      if (d < s || (d === s && h < 10)) {
        var m = new Date(s + 'T12:00:00Z');
        m.setUTCMonth(m.getUTCMonth() - 1);
        s = utcYmd(m);
      }
    }
    return s && s >= HEALTH_FROM ? s : null;
  }
  function watchHealth(into, alarm) {
    var docs = {};
    function draw() {
      into.innerHTML = '';
      alarm.innerHTML = '';
      var bad = [];
      JOBS.forEach(function (j) {
        var h = docs[j[0]], name = t(j[1]);
        var at = h && h.at && h.at.toDate ? h.at.toDate() : null;
        var slot = slotOf(j[0]);
        var late = !!slot && (!at || addisYmd(at) < slot);
        var state = h && h.ok === false ? 'bad' : late ? 'late' : h ? 'ok' : 'none';
        var row = el('div', 'chhrow ' + state);
        var top = el('div', 'chhtop');
        top.appendChild(el('span', 'chhk', name));
        top.appendChild(el('span', 'chhv',
          state === 'bad' ? t('chSysFailed') : state === 'late' ? t('chSysLate')
            : state === 'ok' ? t('chSysOk') : t('chSysNever')));
        row.appendChild(top);
        if (at) {
          row.appendChild(el('div', 'chhw', prettyDay(addisYmd(at)) + ' · ' + hhmm(at) +
                                            (h.note ? ' · ' + h.note : '')));
        }
        if (h && h.ok === false && h.error) row.appendChild(el('div', 'chhe', h.error));
        ((h && h.warn) || []).forEach(function (w) { row.appendChild(el('div', 'chhe warn', w)); });
        into.appendChild(row);
        if (state === 'bad') bad.push(tfill('chSysAlarm', { job: name, why: h.error || '' }));
        else if (state === 'late') bad.push(tfill('chSysAlarmLate', { job: name, when: prettyDay(slot) }));
      });
      into.appendChild(el('p', 'codenote', t('chSysNote')));
      alarm.hidden = !bad.length;
      bad.forEach(function (b) { alarm.appendChild(el('p', null, b)); });
    }
    onSnapshot(collection(db, 'health'), function (qs) {
      docs = {};
      qs.forEach(function (d) { docs[d.id] = d.data(); });
      draw();
    }, failInto(into));
    /* a job's hour can pass with the page open */
    setInterval(function () { if (into.isConnected) draw(); }, 5 * 60000);
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
