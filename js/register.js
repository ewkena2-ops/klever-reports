/* The "Leads & jobs" page — every lead and every KK job, as the reports tell
   it. apps-script/Register.js builds the tables from the reports as they
   come in and checks each one; this file only shows them. The rules let the
   Chairman alone read /register, so anyone else who finds this page is told
   so and sees nothing. (6 Oct 2026: only him for now.)                     */

import { initializeApp, getApps }
  from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, onSnapshot
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

(function () {
  'use strict';

  var LANG_KEY = 'klever.lang';
  function stored() { try { return localStorage.getItem(LANG_KEY); } catch (e) { return null; } }
  var urlLang = new URLSearchParams(location.search).get('lang');
  var lang = (urlLang === 'am' || urlLang === 'en' ? urlLang : stored()) === 'am' ? 'am' : 'en';
  function t(k) { var s = T[lang][k]; return s != null ? s : T.en[k]; }
  function tf(k, o) {
    var s = t(k);
    Object.keys(o || {}).forEach(function (x) { s = s.split('{' + x + '}').join(o[x]); });
    return s;
  }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  var DAYS = { en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
               am: ['እሑድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'] };
  var MONTHS = { en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                 am: ['ጃንዩ', 'ፌብሩ', 'ማርች', 'ኤፕሪ', 'ሜይ', 'ጁን', 'ጁላይ', 'ኦገስ', 'ሴፕቴ', 'ኦክቶ', 'ኖቬም', 'ዲሴም'] };
  function day(ymd) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd || '')) return ymd || '';
    var d = new Date(ymd + 'T12:00:00Z');
    return DAYS[lang][d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MONTHS[lang][d.getUTCMonth()];
  }
  function birr(n) { return n == null ? '—' : Number(n).toLocaleString('en-US') + ' ' + t('regBirr'); }
  function ago(n) { return n <= 0 ? t('regToday') : n === 1 ? t('regYesterday') : tf('regDaysAgo', { n: n }); }
  function hhmm(ts) {
    if (!ts || !ts.toDate) return '';
    var a = new Date(ts.toDate().getTime() + 3 * 3600e3);
    return ('0' + a.getUTCHours()).slice(-2) + ':' + ('0' + a.getUTCMinutes()).slice(-2);
  }
  function bullets(s) { return String(s || '').replace(/^[ \t]*[*-][ \t]+/gm, '• '); }

  var LEAD_STAGES = ['lead', 'visit', 'predesign', 'quote', 'design', 'contract'];
  var JOB_STAGES = ['signed', 'advance', 'final', 'production', 'made', 'qc', 'delivered', 'site'];
  function stageWord(kind) { return t('regSt_' + kind); }

  var app, auth, db, root;
  var S = { summary: null, leads: null, jobs: null, tab: null, q: '' };
  /* the tab he chose; until he chooses, the problems if there are any —
     worked out each time, because the first answer can come from the
     phone's cache (empty) a moment before the real one */
  function tab() { return S.tab || (problemItems().length ? 'problems' : 'jobs'); }

  function connect() {
    app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    auth = getAuth(app);
    /* fb.js has set Firestore up on this page already; a second cache throws */
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      });
    } catch (e) {
      db = getFirestore(app);
    }
  }

  /* ---------------- the page ---------------- */

  var parts = {};
  function shell() {
    root.innerHTML = '';
    root.appendChild(el('h1', null, t('regTitle')));
    root.appendChild(el('p', 'sub', t('regSub')));
    parts.note = el('div', 'regnote');
    parts.note.hidden = true;
    root.appendChild(parts.note);
    parts.tiles = el('div', 'chtiles');
    root.appendChild(parts.tiles);
    parts.tabs = el('div', 'regtabs');
    parts.tabs.setAttribute('role', 'tablist');
    root.appendChild(parts.tabs);
    parts.search = el('input', 'regsearch');
    parts.search.type = 'search';
    parts.search.placeholder = t('regSearch');
    parts.search.setAttribute('aria-label', t('regSearch'));
    parts.search.oninput = function () { S.q = parts.search.value.trim().toLowerCase(); drawList(); };
    root.appendChild(parts.search);
    parts.list = el('div', 'reglist');
    parts.list.appendChild(el('p', 'codenote', t('chLoading')));
    root.appendChild(parts.list);
    parts.foot = el('p', 'codenote');
    root.appendChild(parts.foot);
  }

  function tile(label, value, bad) {
    var b = el('div', 'chtile' + (bad ? ' regbad' : ''));
    b.appendChild(el('div', 'chtl eyebrowish', label));
    b.appendChild(el('div', 'chtv', value));
    return b;
  }

  function problemItems() {
    var out = [];
    (S.jobs || []).forEach(function (j) {
      if (j.problems && j.problems.length) out.push({ kind: 'job', key: j.job, title: j.job + (j.cust ? ' · ' + j.cust : ''), lines: j.problems });
    });
    (S.leads || []).forEach(function (l) {
      if (l.problems && l.problems.length) out.push({ kind: 'lead', key: l.name, title: l.name + ' · ' + t('regLeadWord'), lines: l.problems });
    });
    return out;
  }

  function drawTop() {
    var s = S.summary;
    /* the morning's note, if there is one */
    parts.note.innerHTML = '';
    if (s && s.note) {
      parts.note.hidden = false;
      parts.note.appendChild(el('div', 'regnote-k', t('regNoteTitle')));
      parts.note.appendChild(el('div', 'regnote-t', bullets(s.note)));
      parts.note.appendChild(el('div', 'regnote-m', (s.noteAt ? hhmm(s.noteAt) + ' · ' : '') + (s.noteModel ? t('regReadBy') + ' ' + s.noteModel : '')));
    } else {
      parts.note.hidden = true;
    }
    parts.tiles.innerHTML = '';
    var leads = S.leads || [], jobs = S.jobs || [];
    var open = leads.filter(function (l) { return l.stageName !== 'contract'; }).length;
    var quiet = leads.filter(function (l) { return (l.problems || []).some(function (p) { return p.code === 'quiet'; }); }).length;
    var bad = jobs.filter(function (j) { return (j.problems || []).length; }).length;
    parts.tiles.appendChild(tile(t('regTileLeads'), String(open)));
    parts.tiles.appendChild(tile(t('regTileQuiet'), String(quiet), quiet > 0));
    parts.tiles.appendChild(tile(t('regTileJobs'), String(jobs.length)));
    parts.tiles.appendChild(tile(t('regTileBad'), String(bad), bad > 0));

    var probs = problemItems().length;
    parts.tabs.innerHTML = '';
    [['problems', t('regTabProblems'), probs], ['jobs', t('regTabJobs'), jobs.length], ['leads', t('regTabLeads'), leads.length]]
      .forEach(function (x) {
        var b = el('button', null, x[1] + ' ' + x[2]);
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', tab() === x[0] ? 'true' : 'false');
        if (x[0] === 'problems' && x[2]) b.className = 'hasbad';
        b.onclick = function () { S.tab = x[0]; drawTop(); drawList(); };
        parts.tabs.appendChild(b);
      });
    parts.foot.textContent = (s && s.at ? t('regUpdated') + ' ' + hhmm(s.at) + '. ' : '') +
      (s && (s.oldLeads || s.oldJobs) ? tf('regOld', { a: s.oldLeads || 0, b: s.oldJobs || 0 }) : '');
  }

  function matches(x) {
    if (!S.q) return true;
    return [x.name, x.cust, x.job, x.phone, x.sales, x.title].some(function (v) {
      return v && String(v).toLowerCase().indexOf(S.q) !== -1;
    });
  }

  function chip(text, bad) { return el('span', 'regchip' + (bad ? ' bad' : ''), text); }
  function line(cls, text) { return el('div', cls, text); }
  function problemsInto(card, problems, notes) {
    (problems || []).forEach(function (p) { card.appendChild(line('regprob', '⚠ ' + p.text)); });
    (notes || []).forEach(function (n) { card.appendChild(line('regnoteline', n)); });
  }

  function leadCard(l) {
    var c = el('div', 'regcard' + (l.problems && l.problems.length ? ' bad' : ''));
    var h = el('div', 'reghead');
    h.appendChild(el('span', 'regname', l.name));
    h.appendChild(chip(stageWord(l.stageName), false));
    c.appendChild(h);
    var meta = [l.phone, l.sales, l.quote != null ? t('regQuote') + ' ' + birr(l.quote) : ''].filter(Boolean).join(' · ');
    if (meta) c.appendChild(line('regmeta', meta));
    if (l.last && l.last.k !== 'expected') {
      c.appendChild(line('regline', t('regLast') + ': ' + t('regStep_' + l.last.k) + ' · ' + day(l.last.day) + ' (' + ago(l.quiet) + ')' +
                                     (l.last.by ? ' · ' + l.last.by : '')));
    }
    if (l.next) c.appendChild(line('regline', t('regNext') + ': ' + l.next));
    if (l.expected && l.expected.date) {
      c.appendChild(line('regline', t('regExpected') + ': ' + day(l.expected.date) +
                                     (l.expected.value != null ? ' · ' + birr(l.expected.value) : '') +
                                     (l.expected.conf ? ' · ' + l.expected.conf : '')));
    }
    if (l.job) c.appendChild(line('regline regok', tf('regSignedJob', { job: l.job })));
    problemsInto(c, l.problems);
    if (l.steps && l.steps.length > 1) {
      c.appendChild(line('regtrail', l.steps.map(function (s) { return t('regStep_' + s.k) + ' ' + day(s.day); }).join(' → ')));
    }
    return c;
  }

  function track(stage) {
    var i = JOB_STAGES.indexOf(stage), bar = el('div', 'regtrack');
    bar.setAttribute('aria-label', stageWord(stage));
    JOB_STAGES.forEach(function (s, k) { bar.appendChild(el('span', k <= i ? 'on' : null)); });
    return bar;
  }

  function jobCard(j) {
    var c = el('div', 'regcard' + (j.problems && j.problems.length ? ' bad' : ''));
    var h = el('div', 'reghead');
    var nm = el('span', 'regname');
    nm.appendChild(el('span', 'regcode', j.job));
    if (j.cust) nm.appendChild(document.createTextNode(' · ' + j.cust));
    h.appendChild(nm);
    h.appendChild(chip(stageWord(j.stageName), false));
    c.appendChild(h);
    c.appendChild(track(j.stageName));
    var money = [j.value != null ? t('regContract') + ' ' + birr(j.value) : '',
                 t('regAdvIn') + ' ' + birr(j.advIn || 0),
                 t('regFinalIn') + ' ' + birr(j.finalIn || 0)].filter(Boolean).join(' · ');
    c.appendChild(line('regmeta', money));
    if (j.plan) {
      var pl = [j.plan.start ? t('regPlanStart') + ' ' + day(j.plan.start) : '',
                j.plan.done ? t('regPlanDone') + ' ' + day(j.plan.done) : '',
                j.plan.qc ? t('regPlanQc') + ' ' + day(j.plan.qc) : '',
                j.plan.del ? t('regPlanDel') + ' ' + day(j.plan.del) : ''].filter(Boolean).join(' · ');
      if (pl) c.appendChild(line('regline', t('regPlan') + ': ' + pl));
    }
    var facts = [];
    if (j.signed) facts.push(t('regSt_signed') + ' ' + day(j.signed));
    if (j.prodFirst) facts.push(t('regProd') + ' ' + day(j.prodFirst));
    if (j.made) facts.push(t('regSt_made') + ' ' + day(j.made));
    if (j.qcPassed && !(j.qcFailed && j.qcFailed > j.qcPassed)) facts.push(t('regSt_qc') + ' ' + day(j.qcPassed));
    if (j.delivered) facts.push(t('regSt_delivered') + ' ' + day(j.delivered));
    if (j.site) facts.push(t('regSt_site') + ' ' + day(j.site));
    if (facts.length) c.appendChild(line('regtrail', facts.join(' → ')));
    problemsInto(c, j.problems, j.notes);
    return c;
  }

  function problemCard(p) {
    var c = el('button', 'regcard bad regjump');
    c.type = 'button';
    c.appendChild(el('div', 'regname', p.title));
    p.lines.forEach(function (x) { c.appendChild(line('regprob', '⚠ ' + x.text)); });
    /* to that job or lead, alone */
    c.onclick = function () {
      S.tab = p.kind === 'job' ? 'jobs' : 'leads';
      S.q = String(p.key).toLowerCase();
      parts.search.value = p.key;
      drawTop(); drawList();
      window.scrollTo(0, parts.tabs.offsetTop - 70);
    };
    return c;
  }

  function drawList() {
    if (S.leads == null || S.jobs == null) return;
    parts.list.innerHTML = '';
    var items, make;
    if (tab() === 'problems') { items = problemItems(); make = problemCard; }
    else if (tab() === 'leads') { items = S.leads; make = leadCard; }
    else { items = S.jobs; make = jobCard; }
    if (!S.leads.length && !S.jobs.length) {
      parts.list.appendChild(el('p', 'codenote', t('regEmpty')));
      return;
    }
    var shown = items.filter(matches);
    if (!shown.length) {
      parts.list.appendChild(el('p', 'codenote', S.q ? t('regNoMatch') : tab() === 'problems' ? t('regNoProblems') : t('regEmptyTab')));
      return;
    }
    shown.forEach(function (x) { parts.list.appendChild(make(x)); });
  }

  function failed(e) {
    parts.list.innerHTML = '';
    parts.list.appendChild(el('p', 'codeerr', (e && e.code === 'permission-denied') ? t('regOnly') : t('regFailed')));
  }

  function watch() {
    onSnapshot(doc(db, 'register', 'summary'), function (d) {
      S.summary = d.exists() ? d.data({ serverTimestamps: 'estimate' }) : null;
      drawTop();
    }, failed);
    onSnapshot(doc(db, 'register', 'leads'), function (d) {
      S.leads = d.exists() ? (d.data().rows || []) : [];
      drawTop(); drawList();
    }, failed);
    onSnapshot(doc(db, 'register', 'jobs'), function (d) {
      S.jobs = d.exists() ? (d.data().rows || []) : [];
      drawTop(); drawList();
    }, failed);
  }

  /* ---------------- start ---------------- */

  document.addEventListener('DOMContentLoaded', function () {
    root = document.getElementById('app');
    if (!root) return;
    if (typeof FIREBASE_CONFIG === 'undefined' || !FIREBASE_CONFIG.apiKey) return;
    connect();
    onAuthStateChanged(auth, function (u) {
      var me = u && u.email ? u.email.split('@')[0].toLowerCase() : null;
      if (!me && window.KLEVER && window.KLEVER.signIn) { window.KLEVER.signIn(); return; }
      if (me !== 'chairman') {
        root.innerHTML = '';
        root.appendChild(el('h1', null, t('regTitle')));
        root.appendChild(el('p', 'codeerr', t('regOnly')));
        var home = el('a', 'backlink', t('back'));
        home.href = 'index.html';
        root.appendChild(home);
        return;
      }
      shell();
      watch();
    });
  });
})();
