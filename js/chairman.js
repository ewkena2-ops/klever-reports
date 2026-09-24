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

  function t(k) { return T[lang][k]; }
  function L(o) { return (lang === 'am' && o && o.am) ? o.am : (o ? o.en : ''); }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = cls === 'chft' ? bullets(txt) : txt;
    return e;
  }
  /* the model writes its bullets as "* "; on his page they read as bullets */
  function bullets(s) {
    return String(s).replace(/^[ \t]*[*-][ \t]+/gm, '\u2022 ');
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
  function ymd(d) {
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) +
           '-' + ('0' + d.getDate()).slice(-2);
  }
  function today() { return ymd(new Date()); }
  function plusDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return ymd(d); }
  function daysFrom(a, b) {
    return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
  }
  function birr(n) { return Number(n || 0).toLocaleString('en-US'); }
  function prettyDay(day) { return new Date(day + 'T12:00:00').toDateString(); }

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

  /* ---------------- the page ---------------- */

  function render() {
    root.innerHTML = '';
    root.appendChild(el('h1', null, t('chOverview')));
    root.appendChild(el('p', 'sub', new Date().toDateString()));

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

    var analysis = el('div', 'chanalysis');
    analysis.appendChild(el('p', 'codenote', t('chNoAnalysis')));
    root.appendChild(analysis);

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

  function tile(label, value) {
    var box = el('div', 'chtile');
    box.appendChild(el('div', 'chtl', label));
    var v = el('div', 'chtv', value);
    box.appendChild(v);
    return { box: box, set: function (x) { v.textContent = x; } };
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

      var tx = sv('text', { x: x, y: y < 200 ? y - 19 : y + 23 });
      tx.textContent = f ? (lang === 'am' && f.am ? f.am : f.en) : id;
      g.appendChild(tx);

      if (f) g.addEventListener('click', function () { onPick(f, h); });
      svg.appendChild(g);
    });
    return svg;
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
      into.appendChild(el('p', 'skysub', (d.dayLabel || d.day) +
        (d.provisional ? ' · ' + t('chSoFar') : '')));
      var when = d.ranAt && d.ranAt.toDate ? d.ranAt.toDate() : null;
      var finds = d.findings || [];

      var loud = finds.filter(function (f) { return heat(f.text) === 2; }).length;
      into.appendChild(el('p', 'skysub',
        finds.length + ' ' + t('chAgentsRead') + ' ' +
        (loud ? loud + ' ' + t('chWantYou') : t('chAllQuiet'))));

      var panel = el('div', 'chfind');

      into.appendChild(buildSky(finds, function (f, h) {
        panel.className = 'chfind ' + (f.kind === 'brief' ? 'brief'
                          : (f.kind === 'decision' ? 'decision' : 'finding'))
                          + (h === 2 ? ' loud' : '');
        panel.innerHTML = '';
        panel.appendChild(el('div', 'chfh', lang === 'am' && f.am ? f.am : f.en));
        panel.appendChild(el('div', 'chft', f.text || ''));
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }));

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

      if (when) into.appendChild(el('p', 'codenote', t('chRanAt') + ' ' + hhmm(when)));
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

  function watchReports(into, tFiled, tMissing) {
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
    due.value = plusDays(2);
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

    var q = query(collection(db, 'instructions'), orderBy('at', 'desc'), limit(100));
    onSnapshot(q, function (qs) {
      list.innerHTML = '';
      var all = [];
      qs.forEach(function (d) { var x = d.data(); x.id = d.id; all.push(x); });
      var open = all.filter(function (i) { return i.status === 'open'; })
                    .sort(function (a, b) { return a.due < b.due ? -1 : (a.due > b.due ? 1 : 0); });
      /* done in the last fortnight — long enough to check, short enough to read */
      var cutoff = plusDays(-14);
      var done = all.filter(function (i) {
        return i.status === 'done' && i.doneAt && i.doneAt.toDate && ymd(i.doneAt.toDate()) >= cutoff;
      });
      if (!open.length && !done.length) {
        list.appendChild(el('p', 'codenote', t('chInsNone')));
        return;
      }
      open.forEach(function (i) { list.appendChild(insRow(i)); });
      done.forEach(function (i) { list.appendChild(insRow(i)); });
    }, function () {
      list.innerHTML = '';
      list.appendChild(el('p', 'codeerr', t('chOnlyChairman')));
    });
  }

  function insRow(i) {
    var row = el('div', 'chinsrow ' + i.status);
    var head = el('div', 'chinsh');
    head.appendChild(el('span', 'chrw', nameOf(i.to)));
    var over = daysFrom(i.due, today());
    var late = i.status === 'open' && over > 0;
    var state = i.status === 'done'
      ? t('chInsDone') + ' ' + (i.doneAt && i.doneAt.toDate ? ymd(i.doneAt.toDate()) : '')
      : (late ? over + ' ' + t('chInsOver') : t('chInsDue') + ' ' + i.due);
    head.appendChild(el('span', 'chrt' + (late ? ' bad' : ''), state));
    row.appendChild(head);
    row.appendChild(el('div', 'chinst', i.text));
    if (i.status === 'done' && i.note) {
      row.appendChild(el('div', 'chinsn', t('chInsSaid') + ': ' + i.note));
    }
    var act = el('button', 'chmini', i.status === 'done' ? t('chInsReopen') : t('chInsCancel'));
    act.type = 'button';
    act.onclick = function () {
      act.disabled = true;
      updateDoc(doc(db, 'instructions', i.id), {
        status: i.status === 'done' ? 'open' : 'cancelled',
        closedAt: serverTimestamp()
      })['catch'](function () { act.disabled = false; toast(t('chSaveFailed')); });
    };
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
  function watchCharges(into, tOwed) {
    var month = today().slice(0, 8) + '01';
    var ledgers = [], waivers = {}, gotL = false, gotW = false;

    function draw() {
      if (!gotL || !gotW) return;
      into.innerHTML = '';
      if (!ledgers.length) {
        into.appendChild(el('p', 'codenote', t('chNoLedger')));
        tOwed.set('0');
        return;
      }

      var per = {}, total = 0;
      ledgers.forEach(function (day) {
        (day.lines || []).forEach(function (l) {
          if (!l.amount) return;
          var p = per[l.person] || (per[l.person] = { name: l.name || nameOf(l.person), owed: 0 });
          if (!waivers[day.day + '|' + l.report]) { p.owed += l.amount; total += l.amount; }
        });
      });
      tOwed.set(birr(total));

      var last = ledgers[ledgers.length - 1];
      into.appendChild(el('p', 'skysub', t('chChargesDay') + ' · ' + prettyDay(last.day)));
      var lines = (last.lines || []).filter(function (l) { return l.amount > 0; });
      if (!lines.length) into.appendChild(el('p', 'codenote', t('chNoCharges')));
      lines.forEach(function (l) {
        into.appendChild(chargeRow(last.day, l, waivers[last.day + '|' + l.report]));
      });

      var ids = Object.keys(per).sort(function (a, b) { return per[b].owed - per[a].owed; });
      if (ids.length) {
        var box = el('details', 'chmonth');
        box.appendChild(el('summary', null, t('chByPerson') + ' · ' + birr(total) + ' Birr'));
        ids.forEach(function (k) {
          var r = el('div', 'chf');
          r.appendChild(el('span', 'chfk', per[k].name));
          r.appendChild(el('span', 'chfv', birr(per[k].owed)));
          box.appendChild(r);
        });
        into.appendChild(box);
      }
    }

    onSnapshot(query(collection(db, 'ledger'), where('day', '>=', month), orderBy('day', 'asc')),
      function (qs) {
        ledgers = [];
        qs.forEach(function (d) { ledgers.push(d.data()); });
        gotL = true;
        draw();
      }, function () {
        into.innerHTML = '';
        into.appendChild(el('p', 'codeerr', t('chOnlyChairman')));
      });
    onSnapshot(query(collection(db, 'waivers'), where('day', '>=', month)),
      function (qs) {
        waivers = {};
        qs.forEach(function (d) { var w = d.data(); waivers[w.day + '|' + w.report] = w; });
        gotW = true;
        draw();
      }, function () { gotW = true; draw(); });
  }

  function chargeRow(day, l, waiver) {
    var row = el('div', 'chchg' + (waiver ? ' off' : ''));
    var head = el('div', 'chinsh');
    head.appendChild(el('span', 'chrw', l.name || nameOf(l.person)));
    head.appendChild(el('span', 'chrr', (l.reportName || l.report) + ' · ' + l.status));
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
      tiles.appendChild(tile(t('chMade'), birr(w.m2) + ' / ' + birr(w.m2Target)).box);
      tiles.appendChild(tile(t('chCollected'), birr(w.collected)).box);
      into.appendChild(tiles);
      var f = el('div', 'chfind brief');
      f.appendChild(el('div', 'chft', w.text || ''));
      into.appendChild(f);
    }, function () {
      into.innerHTML = '';
      into.appendChild(el('p', 'codeerr', t('chOnlyChairman')));
    });
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
