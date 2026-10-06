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

  /* Klever's Job Tracking Board, in order, with its column numbers (as in
     apps-script/Register.js REG_BOARD_) */
  var BOARD = ['lead', 'visit', 'predesign', 'quote', 'contract', 'advance', 'measure', 'selection', 'ordered',
               'received', 'finalreq', 'final', 'production', 'made', 'qc', 'ready', 'delivered', 'accepted', 'aftersales'];
  var BOARD_N = [1, 1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  /* where a customer stands: the AI's reading where there is one, else the
     lists' own */
  function where(x) {
    var i = BOARD.indexOf(x.board ? x.board.stage : 'lead'), nx = BOARD[i + 1];
    var own = { id: BOARD[i], status: x.status || 'moving', why: x.why || '', next: nx ? t('regB_' + nx) : '',
                who: x.board ? x.board.nextWho : '', ai: false };
    if (!x.ai) return own;
    /* the AI's reading; where it left the why or the next step blank, the
       board's own (from its stage) — nothing next once it is done */
    var j = BOARD.indexOf(x.ai.stage), anx = BOARD[j + 1];
    var done = x.ai.status === 'done';
    return { id: x.ai.stage, status: x.ai.status, why: x.ai.why || own.why,
             next: x.ai.next || (done || !anx ? '' : t('regB_' + anx)),
             who: x.ai.next ? x.ai.who : (done ? '' : (x.board && x.ai.stage === x.board.stage ? x.board.nextWho : '')),
             ai: true, old: !!x.ai.old };
  }
  function stageText(id) {
    var n = BOARD_N[BOARD.indexOf(id)] || 1;
    return (n < 10 ? '0' : '') + n + ' · ' + t('regB_' + id);
  }
  function statusChip(st) { return el('span', 'regst ' + st, t('regS_' + st)); }

  var app, auth, db, root;
  var S = { summary: null, leads: null, jobs: null, tab: null, q: '' };
  /* the tab he chose; until he chooses, the problems if there are any —
     worked out each time, because the first answer can come from the
     phone's cache (empty) a moment before the real one */
  function tab() { return S.tab || (problemItems().length ? 'problems' : 'table'); }

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
    /* from a customer's star in the universe: register.html?q=KK-114 */
    var asked = new URLSearchParams(location.search).get('q');
    if (asked) { parts.search.value = asked; S.q = asked.trim().toLowerCase(); S.tab = 'table'; }
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
    var rowsNow = tableRows(), hold = 0, rework = 0;
    rowsNow.forEach(function (r) { var w = where(r.job || r.lead); if (w.status === 'hold') hold++; if (w.status === 'rework') rework++; });
    parts.tiles.appendChild(tile(t('regTileLeads'), String(open)));
    parts.tiles.appendChild(tile(t('regTileJobs'), String(jobs.length)));
    parts.tiles.appendChild(tile(t('regTileHold'), String(hold), hold > 0));
    parts.tiles.appendChild(tile(t('regTileRework'), String(rework), rework > 0));
    parts.tiles.appendChild(tile(t('regTileQuiet'), String(quiet), quiet > 0));
    parts.tiles.appendChild(tile(t('regTileBad'), String(bad), bad > 0));

    var probs = problemItems().length;
    parts.tabs.innerHTML = '';
    [['problems', t('regTabProblems'), probs], ['table', t('regTabTable'), tableRows().length],
     ['jobs', t('regTabJobs'), jobs.length], ['leads', t('regTabLeads'), leads.length]]
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
    return [x.name, x.cust, x.job, x.phone, x.sales, x.title, x.code, x.leadCode].some(function (v) {
      return v && String(v).toLowerCase().indexOf(S.q) !== -1;
    });
  }

  function chip(text, bad) { return el('span', 'regchip' + (bad ? ' bad' : ''), text); }
  /* stage and status, why, and what is next — under a card's name */
  function standingInto(card, x) {
    var w = where(x);
    var row = el('div', 'regstand');
    row.appendChild(statusChip(w.status));
    if (w.why) row.appendChild(el('span', 'regwhy', w.why));
    card.appendChild(row);
    if (w.next) card.appendChild(line('regline', t('regNext') + ': ' + w.next + (w.who ? ' — ' + w.who : '')));
    if (w.ai) card.appendChild(line('regaitag', t('regAiRead') + (w.old ? ' · ' + t('regOlder') : '')));
  }
  function line(cls, text) { return el('div', cls, text); }
  function problemsInto(card, problems, notes) {
    (problems || []).forEach(function (p) { card.appendChild(line('regprob', '⚠ ' + p.text)); });
    (notes || []).forEach(function (n) { card.appendChild(line('regnoteline', n)); });
  }

  function leadCard(l) {
    var c = el('div', 'regcard' + (l.problems && l.problems.length ? ' bad' : ''));
    var h = el('div', 'reghead');
    var nm = el('span', 'regname', l.name);
    if (l.code) nm.appendChild(el('span', 'regcode regno', ' #' + l.code));
    h.appendChild(nm);
    h.appendChild(chip(stageText(where(l).id), false));
    c.appendChild(h);
    standingInto(c, l);
    var meta = [l.phone, l.sales, l.quote != null ? t('regQuote') + ' ' + birr(l.quote) : ''].filter(Boolean).join(' · ');
    if (meta) c.appendChild(line('regmeta', meta));
    if (l.last && l.last.k !== 'expected') {
      c.appendChild(line('regline', t('regLast') + ': ' + t('regStep_' + l.last.k) + ' · ' + day(l.last.day) + ' (' + ago(l.quiet) + ')' +
                                     (l.last.by ? ' · ' + l.last.by : '')));
    }
    if (l.next) c.appendChild(line('regline', t('regSalesNext') + ': ' + l.next));
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

  function track(id) {
    var n = BOARD_N[BOARD.indexOf(id)] || 1, bar = el('div', 'regtrack');
    bar.setAttribute('aria-label', stageText(id));
    for (var k = 1; k <= 15; k++) bar.appendChild(el('span', k <= n ? 'on' : null));
    return bar;
  }

  function jobCard(j) {
    var c = el('div', 'regcard' + (j.problems && j.problems.length ? ' bad' : ''));
    var h = el('div', 'reghead');
    var nm = el('span', 'regname');
    nm.appendChild(el('span', 'regcode', j.job));
    if (j.cust) nm.appendChild(document.createTextNode(' · ' + j.cust));
    if (j.leadCode) nm.appendChild(el('span', 'regcode regno', ' #' + j.leadCode));
    h.appendChild(nm);
    var wj = where(j);
    h.appendChild(chip(stageText(wj.id), false));
    c.appendChild(h);
    c.appendChild(track(wj.id));
    standingInto(c, j);
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
    /* each board step done, with its day, in the board's order */
    var facts = BOARD.filter(function (b) { return j.steps && j.steps[b]; })
                     .map(function (b) { return t('regB_' + b) + ' ' + day(j.steps[b]); });
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

  /* ---------------- the table: one row a customer ---------------- */

  /* Each lead, with its job beside it once signed (the lead's KK code, or a
     job whose contract gave this lead's no.); then the jobs no lead names —
     the ones signed before reporting began. */
  function tableRows() {
    var byJob = {}, byLead = {}, used = {};
    (S.jobs || []).forEach(function (j) { byJob[j.job] = j; if (j.leadCode) byLead[j.leadCode] = j; });
    var rows = (S.leads || []).map(function (l) {
      var j = (l.job && byJob[l.job]) || (l.code && byLead[l.code]) || null;
      if (j) used[j.job] = true;
      return { lead: l, job: j };
    });
    (S.jobs || []).forEach(function (j) { if (!used[j.job]) rows.push({ lead: null, job: j }); });
    return rows;
  }
  function short(ymd) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd || '')) return '';
    var d = new Date(ymd + 'T12:00:00Z');
    return d.getUTCDate() + ' ' + MONTHS[lang][d.getUTCMonth()];
  }
  function num(n) { return n == null || n === 0 ? '' : Number(n).toLocaleString('en-US'); }
  function rowMatches(r) {
    return (r.lead && matches(r.lead)) || (r.job && matches(r.job));
  }
  function drawTable(rows) {
    var wrap = el('div', 'regtable-wrap');
    var tb = el('table', 'regtable');
    var head = el('tr');
    var STEP_COLS = ['lead', 'visit', 'predesign', 'quote', 'measure', 'selection', 'ordered', 'received', 'finalreq',
                     'production', 'made', 'qc', 'delivered', 'accepted', 'aftersales'];
    ['Customer', 'Stage', 'Status', 'Why', 'Next', 'Sales', 'Contract', 'Advance', 'Final']
      .forEach(function (k, i) { head.appendChild(el('th', i === 0 ? 'c' : null, t('regCol' + k))); });
    STEP_COLS.forEach(function (b) { head.appendChild(el('th', null, t('regCs_' + b))); });
    head.appendChild(el('th', null, t('regColProblems')));
    var th = el('thead'); th.appendChild(head); tb.appendChild(th);
    var body = el('tbody');
    rows.forEach(function (r) {
      var l = r.lead, j = r.job, at = (l && l.at) || {};
      var probs = ((l && l.problems) || []).concat((j && j.problems) || []);
      var tr = el('tr', probs.length ? 'bad' : null);
      function cell(text, cls) { var td = el('td', cls || null, text || '—'); if (!text) td.classList.add('dim'); tr.appendChild(td); return td; }
      var name = el('td', 'c');
      name.appendChild(document.createTextNode(l ? l.name : (j.cust || j.job)));
      var code = l && l.code ? l.code : (j && j.leadCode) || '';
      if (code) name.appendChild(el('span', 'regno', ' #' + code));
      tr.appendChild(name);
      var w = where(j || l);
      var st = el('td');
      st.appendChild(chip(stageText(w.id), probs.length > 0));
      tr.appendChild(st);
      var sc = el('td');
      sc.appendChild(statusChip(w.status));
      tr.appendChild(sc);
      cell(w.why, 'regwhycell');
      cell(w.next ? w.next + (w.who ? ' — ' + w.who : '') : '', 'regwhycell');
      cell(l ? l.sales : (j.sales || ''));
      cell(j ? j.job + (j.value != null ? ' · ' + num(j.value) : '') : (l && l.job) || '', 'regcode');
      cell(j ? num(j.advIn) : '');
      cell(j ? num(j.finalIn) : '');
      /* the day of each board step: the lead's own, then the job's */
      var days = {};
      Object.keys(at).forEach(function (k) { days[k] = at[k]; });
      if (j && j.steps) Object.keys(j.steps).forEach(function (k) { days[k] = j.steps[k]; });
      if (!days.lead && l && l.first && l.last && l.last.k !== 'expected') days.lead = l.first;
      var qcFailedNow = j && j.qcFailed && !(j.qcPassed && j.qcPassed > j.qcFailed);
      STEP_COLS.forEach(function (b) {
        if (b === 'qc' && qcFailedNow) { cell('✗ ' + short(j.qcFailed), 'bad'); return; }
        cell(short(days[b]));
      });
      var pc = cell(probs.length ? '⚠ ' + probs.length : '', probs.length ? 'bad' : null);
      if (probs.length) pc.title = probs.map(function (x) { return x.text; }).join('\n');
      /* a row opens that customer's card */
      tr.onclick = function () {
        S.tab = j ? 'jobs' : 'leads';
        S.q = String(j ? j.job : (code || l.name)).toLowerCase();
        parts.search.value = j ? j.job : (code || l.name);
        drawTop(); drawList();
        window.scrollTo(0, parts.tabs.offsetTop - 70);
      };
      body.appendChild(tr);
    });
    tb.appendChild(body);
    wrap.appendChild(tb);
    return wrap;
  }

  function drawList() {
    if (S.leads == null || S.jobs == null) return;
    parts.list.innerHTML = '';
    var items, make;
    if (tab() === 'table') {
      if (!S.leads.length && !S.jobs.length) { parts.list.appendChild(el('p', 'codenote', t('regEmpty'))); return; }
      var rows = tableRows().filter(rowMatches);
      if (!rows.length) { parts.list.appendChild(el('p', 'codenote', t('regNoMatch'))); return; }
      parts.list.appendChild(drawTable(rows));
      parts.list.appendChild(el('p', 'codenote', t('regTableHint')));
      return;
    }
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
