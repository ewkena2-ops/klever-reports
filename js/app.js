/* Klever report site — renderer, draft autosave, WhatsApp handoff.
   No dependencies. Works from file:// and from GitHub Pages. */

(function () {
  'use strict';

  /* MOTION (12 Oct 2026, the Chairman: "upgrade the animation"; the rules
     are in css/style.css under MOTION). The first view of a page rises in
     while <html> carries `anim-in`; it is taken off after, so the home page
     redrawing itself every minute does not rise in again. */
  try {
    document.documentElement.classList.add('anim-in');
    setTimeout(function () { document.documentElement.classList.remove('anim-in'); }, 1600);
  } catch (e) {}
  /* a tap that landed: the chip or button pops once (a click, so it is the
     answer that changed, not a finger passing over) */
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('.chip, .seg button') : null;
    if (b && b.isConnected) replay(b, 'tap');
  });
  /* start a one-time animation again on the same element */
  function replay(node, cls) {
    if (!node || !node.classList) return;
    node.classList.remove(cls);
    void node.offsetWidth;
    node.classList.add(cls);
  }

  var LANG_KEY = 'klever.lang';

  /* localStorage throws in private mode and when storage is full — never let
     that take the form down; the report still works, the draft just isn't kept. */
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };

  /* ?lang=am opens straight into Amharic and remembers it */
  var urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang === 'am' || urlLang === 'en') store.set(LANG_KEY, urlLang);
  var lang = (urlLang === 'am' || urlLang === 'en' ? urlLang
              : store.get(LANG_KEY)) === 'am' ? 'am' : 'en';

  /* WHOSE PAGES THESE ARE (17 Oct 2026, the user: "for Rovestone we have to
     prepare the same as Klever — their layout and other things"). A company
     in forms.js COMPANIES has its own name and logo on its people's screens,
     its own title and footer; a word in i18n.js may have a company's own
     version under "<key>@<company>". Before sign-in the brand comes from
     ?co=rovestone, or the last one on this phone (so the home-screen app
     opens as theirs); once signed in, from the person — whatever the URL.
     The Chairman's pages are Klever's. */
  var CO_KEY = 'klever.co';
  function coOk(c) { return !!c && typeof COMPANIES !== 'undefined' && !!COMPANIES[c]; }
  var urlCo = new URLSearchParams(location.search).get('co');
  if (coOk(urlCo)) store.set(CO_KEY, urlCo);
  function coBefore() { return coOk(urlCo) ? urlCo : (coOk(store.get(CO_KEY)) ? store.get(CO_KEY) : 'klever'); }
  var BRAND = coBefore();
  function brand() {
    return (typeof COMPANIES !== 'undefined' && COMPANIES[BRAND]) ||
           { id: 'klever', en: 'Klever', logo: 'assets/logo.png', logoAlt: 'Klever Küche', mark: ['KLEVER', 'KÜCHE'] };
  }
  /* who is looking decides: called whenever the bar is drawn */
  function adoptBrand() {
    var who = typeof AUTH !== 'undefined' ? AUTH.who() : null;
    BRAND = !who ? coBefore() : (AUTH.isChairman() || typeof companyOf !== 'function') ? 'klever' : companyOf(who);
    if (who) store.set(CO_KEY, BRAND);
    var b = brand();
    try { document.body.setAttribute('data-co', BRAND); } catch (e) {}
    /* the home-screen name and icon: the page carries each company's own
       manifest and icons, stamped, as <meta name="co-…-<company>"> */
    [['link[rel="manifest"]', 'href', 'co-manifest-'], ['link[rel="apple-touch-icon"]', 'href', 'co-icon180-'],
     ['link[rel="icon"][type="image/svg+xml"]', 'href', 'co-iconsvg-'], ['meta[name="theme-color"]', 'content', 'co-theme-']]
      .forEach(function (x) {
        var n = document.querySelector(x[0]);
        if (!n) return;
        if (n.getAttribute('data-klever') == null) n.setAttribute('data-klever', n.getAttribute(x[1]) || '');
        var alt = BRAND === 'klever' ? null : document.querySelector('meta[name="' + x[2] + BRAND + '"]');
        n.setAttribute(x[1], alt ? alt.getAttribute('content') : n.getAttribute('data-klever'));
      });
    return b;
  }
  /* the company's logo, or — until it has one — its name written out */
  function brandMark(cls, co) {
    var b = (co && coOk(co) && COMPANIES[co]) || brand();
    if (b.logo) { var img = new Image(); img.src = b.logo; img.alt = b.logoAlt || b.en; if (cls) img.className = cls; return img; }
    var w = el('span', 'brandword' + (cls ? ' ' + cls : ''), b.mark ? b.mark[0] : String(b.en).toUpperCase());
    w.setAttribute('role', 'img');
    w.setAttribute('aria-label', b.logoAlt || b.en);
    return w;
  }

  function t(k) {
    var own = BRAND !== 'klever' ? T[lang][k + '@' + BRAND] : null;
    return own != null ? own : T[lang][k];
  }
  function L(o) { return (lang === 'am' && o.am) ? o.am : o.en; }

  /* A personal sign-in link, #key=<password>, signs its owner in with one
     tap. The fragment never reaches a server; it is read here and wiped from
     the address bar and history at once, so it is not left on the screen. */
  var LINK_KEY = null;
  if (/^#key=/.test(location.hash)) {
    try { LINK_KEY = decodeURIComponent(location.hash.slice(5)); } catch (e) { LINK_KEY = null; }
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ }
  }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function money(n) {
    var v = String(n).replace(/[^0-9.-]/g, '');
    if (v === '' || isNaN(Number(v))) return String(n);
    return Number(v).toLocaleString('en-US');
  }
  /* KLEVER KEEPS ADDIS ABABA'S TIME — UTC+3, no daylight saving — whatever
     the phone's own clock zone is set to. A phone left on UTC used to say a
     report was on time three hours after the ledger had marked it late, and
     the day rolled over at 3am. Every date and deadline here is Addis time:
     addis() is "now" shifted three hours, always read with getUTC*. */
  var ADDIS_MS = 3 * 3600e3;
  /* NOR THE PHONE'S CLOCK (16 Oct 2026). Mahelet's phone ran six hours
     ahead: a report she sent at 4:51 PM went out marked late ("10:51 PM"),
     and one sent at 6:59 PM was kept as the next day's, so the next day her
     form opened on yesterday's figures, already "sent". "Now" here is the
     server's: the gap between this phone's clock and the Date the site's
     own server gives one tiny request is measured on every load and taken
     off. A gap under two minutes is left alone; with no line, the gap last
     measured on this phone is used. Only on the live site: a test that
     sets the time asks for this check by name (KLEVER_CLOCK_ON). */
  var SKEW = 0, CLOCK_ON = /\.github\.io$/.test(location.hostname) || !!window.KLEVER_CLOCK_ON;
  try { if (CLOCK_ON) SKEW = Number(localStorage.getItem('klever.skew')) || 0; } catch (e) {}
  window.KLEVER_SKEW = SKEW;
  function nowMs() { return Date.now() + SKEW; }
  var CLOCK = !CLOCK_ON || !window.fetch ? Promise.resolve() : (function () {
    var t0 = Date.now();
    return fetch('js/firebase-config.js?clock=' + t0, { method: 'HEAD', cache: 'no-store' }).then(function (r) {
      var t1 = Date.now(), srv = Date.parse(r.headers.get('Date') || '');
      if (isNaN(srv) || t1 - t0 > 10000) return;
      /* the header is to the second: its middle, at the middle of the trip */
      var gap = srv + 500 - (t0 + t1) / 2;
      SKEW = Math.abs(gap) < 120000 ? 0 : Math.round(gap);
      window.KLEVER_SKEW = SKEW;
      try { localStorage.setItem('klever.skew', String(SKEW)); } catch (e) {}
    })['catch'](function () {});
  })();
  function pad2(n) { return ('0' + n).slice(-2); }
  function addis(ms) { return new Date((ms == null ? nowMs() : ms) + ADDIS_MS); }
  function ymdOf(a) { return a.getUTCFullYear() + '-' + pad2(a.getUTCMonth() + 1) + '-' + pad2(a.getUTCDate()); }
  /* yyyy-mm-dd of today, in Addis */
  function stamp() { return ymdOf(addis()); }
  function addDays(ymd, n) {
    var d = new Date(ymd + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return ymdOf(d);
  }
  function dowOf(ymd) { return new Date(ymd + 'T12:00:00Z').getUTCDay(); }
  function dayStartMs(ymd) { return new Date(ymd + 'T00:00:00+03:00').getTime(); }
  function deadlineOf(ymd, tm) { return new Date(ymd + 'T' + (tm || '17:30') + ':00+03:00').getTime(); }
  function monShort(m) {
    return lang === 'am' ? MONTHS_AM[m]
      : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m];
  }
  function today() { var a = addis(); return a.getUTCDate() + ' ' + monShort(a.getUTCMonth()) + ' ' + a.getUTCFullYear(); }
  /* a time of day as it is read: 1:57 PM in English (the Chairman, 7 Oct
     2026: "AM and PM, not 24h"); Amharic keeps 13:57, as hhmm() does */
  function clock12(h, m) {
    if (lang === 'am') return pad2(h) + ':' + pad2(m);
    return (h % 12 || 12) + ':' + pad2(m) + ' ' + (h >= 12 ? 'PM' : 'AM');
  }
  function clock() { var a = addis(); return clock12(a.getUTCHours(), a.getUTCMinutes()); }
  function clockOf(date) { var a = addis(date.getTime()); return clock12(a.getUTCHours(), a.getUTCMinutes()); }
  /* "Fri 26 Sep" for a yyyy-mm-dd */
  function dayLabel(ymd) {
    var d = new Date(ymd + 'T12:00:00Z');
    var wd = (lang === 'am' ? DAYS_AM : DAYS_EN)[d.getUTCDay()];
    return (lang === 'am' ? wd : wd.slice(0, 3)) + ' ' + d.getUTCDate() + ' ' + monShort(d.getUTCMonth());
  }

  /* IS A REPORT OWED ON A DAY — the ledger's rule, day for day
     (apps-script/Agent.js dueOn_): nothing on Sundays; a daily report except
     on its days off; a weekly one on its day; a monthly one on the 1st, or
     on the 2nd when the 1st is a Sunday. */
  function dueOn(r, ymd) {
    var dow = dowOf(ymd), dom = Number(ymd.slice(8));
    /* nothing on a Sunday or a holiday (forms.js closedDay, 15 Oct 2026) */
    if (closedDay(ymd)) return false;
    /* a report that starts on a later day (`from` on the report) is owed by
       nobody before it — the board check, added at 6 PM on 12 Oct 2026 */
    if (r.from && ymd < r.from) return false;
    /* nor after it was stopped (`until`, its last owed day — 17 Oct 2026) */
    if (r.until && ymd > r.until) return false;
    /* a weekly report made from the daily reports (built:1, js/weekly.js)
       is owed by nobody — the Chairman, 11 Oct 2026 */
    if (r.built) return false;
    /* the month's first working day */
    if (r.cadence === 'monthly') {
      for (var b = ymd.slice(0, 8) + '01'; b < ymd; b = addDays(b, 1)) if (!closedDay(b)) return false;
      return true;
    }
    if (r.cadence === 'weekly') return r.dueDay === dow;
    return !(r.skipDays && r.skipDays.indexOf(dow) >= 0);
  }
  /* how many days ahead of its due day a filing still counts (the ledger's
     window): a daily report only on the day, a monthly one up to seven */
  function windowDays(r) { return r.cadence === 'daily' ? 0 : 7; }

  /* THE WEEK (apps-script/Agent.js): a weekly report belongs to the week it
     is sent in, and the week closes on Sunday at 9 PM. Sent after its own
     deadline but before then, it is late, for its own day in that week; after
     9 PM on Sunday it is the next week's. weekClose() is the Sunday whose
     9 PM closes the week a moment falls in. */
  var WEEK_CUT = '21:00';
  /* the first week under this rule closes on Sunday 11 October 2026 (the
     ledger's WEEK_FROM_); a week before it was settled the old way */
  var WEEK_FROM = '2026-10-11';
  /* Selam's Monday customer summary is about the week just ended: sent on
     Sunday it is for the coming Monday, so its week turns at the start of
     Sunday, not at 9 PM */
  var WEEK_BEFORE = { 'betty-weekly-cx': true };
  function cutOf(id) { return WEEK_BEFORE[id] ? '00:00' : WEEK_CUT; }
  function weekClose(ms, id) {
    var day = ymdOf(addis(ms)), sun = addDays(day, (7 - dowOf(day)) % 7);
    return ms >= deadlineOf(sun, cutOf(id)) ? addDays(sun, 7) : sun;
  }

  /* The due day a filing sent now would count toward, and how it stands:
       due   — it is that day and the deadline has not passed
       late  — it is that day and the deadline has passed
       early — a later day within reach (a weekly or monthly report sent ahead)
       none  — nothing: not a due day, and no due day within reach
     A weekly report is late from its deadline until its week closes, Sunday
     9 PM: on Saturday a Friday report is late, for that Friday.
     This is the same answer the ledger will give when it closes the day, so
     the phone, the email, the Sheet and the fines all say the same thing. */
  function periodNow(r) { return periodAt(r, nowMs()); }
  /* the same, for a filing sent at a given moment */
  function periodAt(r, now) {
    var d0 = ymdOf(addis(now));
    var wsun = r.cadence === 'weekly' ? weekClose(now, r.id) : null;
    if (wsun && wsun >= WEEK_FROM) {
      var wd = addDays(wsun, r.dueDay - 7), wdl = deadlineOf(wd, r.dueTime);
      /* its day a holiday: on time until the week closes (Agent.js deadline_) */
      if (holidayOn(wd)) wdl = deadlineOf(wsun, cutOf(r.id));
      return { day: wd, deadline: wdl, state: now > wdl ? 'late' : (wd === d0 ? 'due' : 'early') };
    }
    for (var k = 0; k <= windowDays(r); k++) {
      var d = addDays(d0, k);
      if (!dueOn(r, d)) continue;
      var dl = deadlineOf(d, r.dueTime);
      if (k === 0) return { day: d, deadline: dl, state: now > dl ? 'late' : 'due' };
      return { day: d, deadline: dl, state: 'early' };
    }
    return { day: null, deadline: null, state: 'none' };
  }
  function nextDueDay(r) {
    for (var k = 1; k <= 40; k++) { var d = addDays(stamp(), k); if (dueOn(r, d)) return d; }
    return null;
  }
  function statusWord(pd) {
    return { due: t('onTime'), late: t('late'), early: t('early'), none: t('notDueToday') }[pd.state];
  }
  function statusLine(r, pd) {
    if (pd.state === 'none') {
      var nx = nextDueDay(r);
      return nx ? t('nextDue') + ' ' + dayLabel(nx) : '';
    }
    /* a weekly report past its deadline still counts, as late, until Sunday 9 PM */
    if (r.cadence === 'weekly' && pd.state === 'late') {
      return t('countsFor') + ' ' + dayLabel(pd.day) + ' · ' + t(WEEK_BEFORE[r.id] ? 'weekOpenTillSat' : 'weekOpenTill');
    }
    return t('countsFor') + ' ' + dayLabel(pd.day);
  }

  /* WHAT HAS ALREADY BEEN FILED. Watched from Firestore once signed in — the
     server's copy, plus this phone's own filings that have not reached it
     yet, which count as sent-but-waiting. A report is done for a due day when
     a filing of it, by its owner's name, falls inside that day's window. */
  var FILINGS = [], SERVER_FILINGS = [];
  /* the server's list has come at least once: before it, every day looks unsent */
  var FILINGS_IN = false;

  /* Filings sent from this phone and not yet on the server. They wait in
     Firestore's cache and go when there is signal, but its queries leave
     them out until then — their time is the server's to set — so this phone
     keeps its own note of them, dropped once the server copy is seen. */
  function pendingList() {
    try { return JSON.parse(localStorage.getItem('klever.pending') || '[]') || []; } catch (e) { return []; }
  }
  function savePending(l) { try { localStorage.setItem('klever.pending', JSON.stringify(l)); } catch (e) {} }
  function addPending(r) {
    var p = { k: Math.random().toString(36).slice(2), report: r.id, person: r.person, at: nowMs() };
    savePending(pendingList().concat([p]));
    mergeFilings();
    return p.k;
  }
  function dropPending(k) {
    savePending(pendingList().filter(function (p) { return p.k !== k; }));
    mergeFilings();
  }
  function mergeFilings() {
    var cut = nowMs() - 8 * 864e5;
    var pend = pendingList().filter(function (p) {
      if (p.at < cut) return false;
      /* the server copy is here (its time is the server's; a phone clock
         can be a few minutes out) */
      return !SERVER_FILINGS.some(function (f) {
        return f.report === p.report && f.person === p.person && !f.pending && f.at.getTime() >= p.at - 10 * 60e3;
      });
    });
    savePending(pend);
    FILINGS = SERVER_FILINGS.concat(pend.map(function (p) {
      return { report: p.report, person: p.person, at: new Date(p.at), pending: true };
    }));
  }

  function filingFor(r, day) {
    if (!day) return null;
    var from = dayStartMs(addDays(day, -windowDays(r))), to = dayStartMs(addDays(day, 1));
    /* a weekly report: anything sent in its week, Sunday 9 PM to Sunday 9 PM
       (a week before the rule: six days early to the end of its day) */
    if (r.cadence === 'weekly' && addDays(day, 7 - r.dueDay) < WEEK_FROM) from = dayStartMs(addDays(day, -6));
    else if (r.cadence === 'weekly') {
      var sun = addDays(day, 7 - r.dueDay);
      from = deadlineOf(addDays(sun, -7), cutOf(r.id));
      to = deadlineOf(sun, cutOf(r.id));
      /* the first week also keeps what the old rule counted early for it */
      if (sun === WEEK_FROM) from = Math.min(from, dayStartMs(addDays(day, -6)));
    }
    var best = null;
    FILINGS.forEach(function (f) {
      if (f.report !== r.id || f.person !== r.person) return;
      var tms = f.at.getTime();
      if (tms >= from && tms < to && (!best || tms < best.at.getTime())) best = f;
    });
    return best;
  }
  function personById(id) {
    for (var i = 0; i < PEOPLE.length; i++) if (PEOPLE[i].id === id) return PEOPLE[i];
    return null;
  }
  function reportById(id) {
    for (var i = 0; i < REPORTS.length; i++) if (REPORTS[i].id === id) return REPORTS[i];
    return null;
  }
  /* Betelhem carries seven forms — list them in the order her day and week run:
     daily before weekly, then by the day and time each is due */
  function reportsFor(pid) {
    /* a stopped report (`until` passed) is no longer theirs to fill */
    var today = stamp();
    return REPORTS.filter(function (r) { return r.person === pid && !(r.until && today > r.until); }).sort(function (a, b) {
      var rank = { daily: 0, weekly: 1, monthly: 2 };
      if (a.cadence !== b.cadence) return rank[a.cadence] - rank[b.cadence];
      var ad = a.dueDay == null ? 0 : a.dueDay, bd = b.dueDay == null ? 0 : b.dueDay;
      if (ad !== bd) return ad - bd;
      return (a.dueTime || '').localeCompare(b.dueTime || '');
    });
  }

  /* ---------------- shared chrome ---------------- */

  /* the Chairman's pages draw themselves; app.js only lends them the bar */
  function ownPage() {
    return ['chairman', 'agents', 'universe', 'register'].indexOf(document.body.dataset.page) !== -1;
  }

  function rebuildTop() {
    var old = document.querySelector('.top');
    if (old) old.parentNode.removeChild(old);
    buildTop();
  }

  function buildTop() {
    var top = el('header', 'top'), inner = el('nav', 'top-in');
    var b = adoptBrand();
    inner.setAttribute('aria-label', b.en);
    var a = el('a'); a.href = 'index.html';
    a.appendChild(brandMark());
    inner.appendChild(a);
    inner.appendChild(el('div', 'spacer'));

    var tg = el('div', 'langtoggle');
    tg.setAttribute('role', 'group');
    tg.setAttribute('aria-label', 'Language · ቋንቋ');
    [['en', 'EN'], ['am', 'አማ']].forEach(function (p) {
      var b = el('button', null, p[1]);
      b.type = 'button';
      b.lang = p[0];
      b.setAttribute('aria-pressed', lang === p[0] ? 'true' : 'false');
      b.onclick = function () {
        lang = p[0];
        store.set(LANG_KEY, lang);
        location.reload();
      };
      tg.appendChild(b);
    });
    /* signed in? then chat — and for the Chairman his own page — are one
       tap from anywhere, instead of a card at the foot of the home screen */
    if (AUTH.who()) {
      var here = document.body.dataset.page;
      var navs = [['chat.html', 'chat', t('chatOpen'), here === 'chat']];
      if (AUTH.isChairman()) {
        navs.unshift(['register.html', 'table', t('regTitle'), here === 'register']);
        navs.unshift(['universe.html', 'galaxy', t('unKicker'), here === 'universe']);
        navs.unshift(['chairman.html', 'day', t('chOverview'), here === 'chairman']);
      }
      navs.forEach(function (n) {
        var fold = n[0] === 'universe.html' || n[0] === 'register.html';
        var a2 = el('a', 'navbtn' + (n[3] ? ' on' : '') + (fold ? ' fold' : ''));
        a2.href = n[0];
        a2.title = n[2];
        a2.setAttribute('aria-label', n[2]);
        if (n[3]) a2.setAttribute('aria-current', 'page');
        a2.appendChild(icon(n[1]));
        inner.appendChild(a2);
      });
      /* Four icons, the language and the way out do not fit a 320 px phone:
         there, the two 3D pages — and below 360 px the language too — move
         into this menu. On a wider screen it is not shown at all. */
      if (AUTH.isChairman()) {
        inner.classList.add('chair');
        var more = el('details', 'navmore');
        var sum = el('summary', 'navbtn');
        sum.setAttribute('aria-label', t('moreMenu'));
        sum.title = t('moreMenu');
        sum.appendChild(icon('more'));
        more.appendChild(sum);
        var panel = el('div', 'navmenu');
        navs.filter(function (n) { return n[0] === 'universe.html' || n[0] === 'register.html'; })
          .forEach(function (n) {
            var a3 = el('a', 'navitem' + (n[3] ? ' on' : ''));
            a3.href = n[0];
            a3.appendChild(icon(n[1]));
            a3.appendChild(el('span', null, n[2]));
            panel.appendChild(a3);
          });
        var tg2 = tg.cloneNode(true);
        tg2.className = 'langtoggle infold';
        Array.prototype.forEach.call(tg2.querySelectorAll('button'), function (b, i) {
          b.onclick = tg.querySelectorAll('button')[i].onclick;
        });
        panel.appendChild(tg2);
        more.appendChild(panel);
        document.addEventListener('click', function (ev) { if (!more.contains(ev.target)) more.open = false; });
        inner.appendChild(more);
      }
    }
    inner.appendChild(tg);

    /* signed in? then the way out is in the bar, on every page */
    if (AUTH.who()) {
      /* an account no longer on the staff list (Yordanos, who left on 15
         Oct 2026; the gate tablet's) is shown by its id: looked up as a
         person, it threw here, after the bar was taken down, and the page
         stood at "Connecting… the line is slow" for good */
      var me = personById(AUTH.who()) || { en: AUTH.who(), am: AUTH.who() };
      var out = el('button', 'signoutbtn');
      out.type = 'button';
      out.appendChild(el('span', 'soinit', AUTH.isChairman() ? '★' : L(me).charAt(0)));
      out.appendChild(el('span', 'sotext', t('signOut')));
      out.title = (AUTH.isChairman() ? t('chairmanWord') : L(me)) + ' · ' + t('signOut');
      out.setAttribute('aria-label', t('signOut'));
      /* one tap used to sign out of the whole site, and on a phone the button
         is only an initial, easily taken for a picture. Ask first. */
      var armed = false, disarm = null;
      out.onclick = function () {
        if (!armed) {
          armed = true;
          out.classList.add('armed');
          out.querySelector('.sotext').textContent = t('signOutConfirm');
          toast(t('signOutConfirm'));
          disarm = setTimeout(function () {
            armed = false;
            out.classList.remove('armed');
            out.querySelector('.sotext').textContent = t('signOut');
          }, 4000);
          return;
        }
        clearTimeout(disarm);
        /* a report or photo not yet on the server stays in this person's
           queue on this phone: say so before signing out (the bug hunt,
           15 Oct 2026) */
        var check = window.FB && window.FB.unsent ? window.FB.unsent() : Promise.resolve(0);
        check.then(function (n) {
          if (n && !window.confirm(t('signOutUnsent').replace('{n}', n))) {
            armed = false;
            out.classList.remove('armed');
            out.querySelector('.sotext').textContent = t('signOut');
            return;
          }
          try { localStorage.removeItem('klever.lastUser'); } catch (e) {}
          AUTH.signOut().then(function () { location.href = 'index.html'; });
        });
      };
      inner.appendChild(out);
    }

    top.appendChild(inner);
    document.body.insertBefore(top, document.body.firstChild);
    document.documentElement.lang = lang === 'am' ? 'am' : 'en';
  }

  function toast(msg) {
    var tEl = document.querySelector('.toast');
    if (!tEl) { tEl = el('div', 'toast'); document.body.appendChild(tEl); }
    tEl.setAttribute('role', 'status');
    tEl.textContent = msg;
    tEl.classList.add('on');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { tEl.classList.remove('on'); }, Math.max(1900, msg.length * 55));
  }

  /* ---------------- index page ---------------- */

  /* The letters are dated in both calendars, so the board is too.
     1 Meskerem 2019 = 11 September 2026 — checked against Enkutatash. */
  var ETH_MONTHS = ['መስከረም','ጥቅምት','ኅዳር','ታኅሣሥ','ጥር','የካቲት','መጋቢት',
                    'ሚያዝያ','ግንቦት','ሰኔ','ሐምሌ','ነሐሴ','ጳጉሜን'];
  var ETH_MONTHS_EN = ['Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot',
                       'Sene','Hamle','Nehase','Pagume'];
  var DAYS_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var DAYS_AM = ['እሁድ','ሰኞ','ማክሰኞ','ረቡዕ','ሐሙስ','ዓርብ','ቅዳሜ'];
  var MONTHS_EN = ['January','February','March','April','May','June','July',
                   'August','September','October','November','December'];
  var MONTHS_AM = ['ጃንዋሪ','ፌብሩዋሪ','ማርች','ኤፕሪል','ሜይ','ጁን','ጁላይ',
                   'ኦገስት','ሴፕቴምበር','ኦክቶበር','ኖቬምበር','ዲሴምበር'];

  function toEthiopian(d) {
    var y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
    var a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    var jdn = day + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4)
            - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
    var k = jdn - 1723856, r = k % 1461;
    var n = (r % 365) + 365 * Math.floor(r / 1460);
    return {
      y: 4 * Math.floor(k / 1461) + Math.floor(r / 365) - Math.floor(r / 1460),
      m: Math.floor(n / 30) + 1,
      d: (n % 30) + 1
    };
  }

  /* The Ethiopian month a yyyy-mm-dd falls in, and where it began — the
     month people count their days by (office check-in, 14 Oct 2026). */
  function ethOf(ymd) {
    var p = String(ymd).split('-');
    return toEthiopian(new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])));
  }
  function ethMonthStart(ymd) { return addDays(ymd, -(ethOf(ymd).d - 1)); }
  function ethMonthName(ymd) {
    var e = ethOf(ymd);
    return (lang === 'am' ? ETH_MONTHS : ETH_MONTHS_EN)[e.m - 1] + ' ' + e.y;
  }
  /* "ሐሙስ ጥቅምት 5" · "Thu 5 Tikimt (15 Oct)" */
  function ethDayLabel(ymd) {
    var e = ethOf(ymd), dw = dowOf(ymd);
    if (lang === 'am') return DAYS_AM[dw] + ' ' + ETH_MONTHS[e.m - 1] + ' ' + e.d;
    var g = new Date(ymd + 'T12:00:00Z');
    return DAYS_EN[dw].slice(0, 3) + ' ' + e.d + ' ' + ETH_MONTHS_EN[e.m - 1] + ' (' + g.getUTCDate() + ' ' + monShort(g.getUTCMonth()) + ')';
  }

  /* A date nobody can read two ways: "Wed 9 Sep 2026", in the reader's
     language, and — as the letters carry both calendars — the Ethiopian date
     after it when asked. yyyy-mm-dd in; noon UTC keeps it the same day in
     every time zone. */
  function prettyDate(ymd, withEth) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd || '')) return ymd ? String(ymd) : '';
    var d = new Date(ymd + 'T12:00:00Z');
    var wd = (lang === 'am' ? DAYS_AM : DAYS_EN)[d.getUTCDay()];
    var s = (lang === 'am' ? wd : wd.slice(0, 3)) + ' ' + d.getUTCDate() + ' ' +
            monShort(d.getUTCMonth()) + ' ' + d.getUTCFullYear();
    if (withEth) {
      var e = toEthiopian(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      s += ' · ' + ETH_MONTHS[e.m - 1] + ' ' + e.d + ' ቀን ' + e.y;
    }
    return s;
  }

  /* The browser draws a date box in the computer's own regional style —
     "09/09/2026", day first or month first — and no page can restyle it.
     So the box shows prettyDate, and the real date input lies invisibly on
     top of it: a tap still lands on it and opens the same calendar. */
  function dressDate(inp) {
    var box = el('div', 'datebox');
    var show = el('span', 'dshow');
    box.appendChild(show);
    box.appendChild(icon('cal'));
    inp.classList.add('dnative');
    box.appendChild(inp);
    function paint() {
      /* each calendar in its own span, so a narrow phone breaks the line
         between the two dates and never inside one */
      show.textContent = '';
      var s = inp.value ? prettyDate(inp.value, true) : t('pickDate'), cut = s.indexOf(' · ');
      /* the space stays between the spans: inside a no-wrap span it is no
         place to break */
      (cut < 0 ? [s] : [s.slice(0, cut), s.slice(cut + 1)]).forEach(function (part, i) {
        if (i) show.appendChild(document.createTextNode(' '));
        show.appendChild(el('span', null, part));
      });
      box.classList.toggle('empty', !inp.value);
    }
    function pick() { try { if (inp.showPicker && !inp.disabled) inp.showPicker(); } catch (e) { /* the browser opens its own */ } }
    inp.addEventListener('click', pick);
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
    });
    inp.addEventListener('input', paint);
    inp.addEventListener('change', paint);
    box.paint = paint;
    paint();
    return box;
  }

  /* Klever runs a six-day week — 240 m² a week at 40 m² a day. */
  function dueToday() {
    var d = stamp();
    return REPORTS.filter(function (r) { return dueOn(r, d); })
      .sort(function (a, b) { return (a.dueTime || '').localeCompare(b.dueTime || ''); });
  }

  function minsUntil(tm) {
    if (!tm) return null;
    return Math.floor((deadlineOf(stamp(), tm) - nowMs()) / 60000);
  }

  function countdown(mins) {
    if (mins < 0) return t('passed');
    if (mins < 1) return t('dueNow');
    var hh = Math.floor(mins / 60), mm = mins % 60;
    var unit = lang === 'am' ? ['ሰ', 'ደ'] : ['h', 'm'];
    return t('inTime') + ' ' + (hh ? hh + unit[0] + ' ' : '') + mm + unit[1];
  }

  function hhmm(tm) {
    var p = tm.split(':'), h24 = Number(p[0]);
    /* Amharic readers get the plain 24-hour time; the report's own due line
       already gives the Ethiopian clock */
    if (lang === 'am') return pad2(h24) + ':' + p[1];
    var ap = h24 >= 12 ? 'PM' : 'AM', h12 = h24 % 12 || 12;
    return h12 + ':' + p[1] + ' ' + ap;
  }

  /* ---------------- the top of a person's day ---------------- */

  /* A letterhead, then one sentence saying where they stand, then the number
     and the button. Everything below it is reference — this is the part that
     has to work at 5:30pm with one hand.

     The sentence matters more than it looks. A list tells you what exists; a
     sentence tells you what is true. "One report due in 24 minutes and one
     that was due at five and has not arrived" is the whole day. */
  function standing(pid) {
    var list = dueToday().filter(function (r) { return !pid || r.person === pid; });
    var late = [], soon = null, soonMins = 1e9, sent = [];
    var d = stamp();
    list.forEach(function (r) {
      /* a report already filed for today is done, however late the hour */
      if (filingFor(r, d)) { sent.push(r); return; }
      var m = minsUntil(r.dueTime);
      if (m < 0) late.push(r);
      else if (m < soonMins) { soonMins = m; soon = r; }
    });
    /* a weekly report from an earlier day of this week, not sent: it still
       counts, as late, until the week closes on Sunday at 9 PM */
    REPORTS.forEach(function (r) {
      if (r.cadence !== 'weekly' || r.built || (pid && r.person !== pid) || list.indexOf(r) !== -1) return;
      var pd = periodNow(r);
      /* not a stopped report's week (`until`, 17 Oct 2026) */
      if (r.until && pd.day > r.until) return;
      if (pd.state === 'late' && pd.day !== d && !filingFor(r, pd.day)) late.push(r);
    });
    return { all: list, late: late, next: soon, mins: soon ? soonMins : null, sent: sent };
  }



  /* ---------------- who a report is addressed to ---------------- */

  /* Reports name their recipients in prose — "Mahelet + Ephrata", "Chairman,
     copied to Mahelet and Betty". Those strings are what a person reads at the
     top of the form and should stay that way; this is the machine's reading of
     the same line. */
  var TO_IDS = {
    'Chairman': ['chairman'],
    'Mahelet': ['liu'],
    'Ephrata': ['ephrata'],
    'Betty': ['betty'],
    'Betelhem': ['betty'],
    'Finance': ['betty'],
    'Selam': ['betty'],   /* her name on the site for now */
    'Elyas': ['elyas'],
    'Kidan': ['kidan']   /* an account since 6 Oct 2026 (no letter); the
                            Group Finance room is where these land */
  };

  function recipientsOf(report) {
    var out = [];
    Object.keys(TO_IDS).forEach(function (name) {
      if (report.toEn.indexOf(name) !== -1) {
        TO_IDS[name].forEach(function (id) {
          if (out.indexOf(id) === -1) out.push(id);
        });
      }
    });
    return out;
  }

  /* Who a filed report is for, besides the Chairman (who sees every report
     on his page) and the sender: they read it on their home page. */
  function reportTo(r) {
    return recipientsOf(r).filter(function (id) { return id !== 'chairman' && id !== r.person; });
  }

  /* A channel both the sender and the recipients can open.

     Sending it to #leads because that is where the recipients are only works
     if the sender is in #leads too, and most are not: fourteen reports go to
     Ephrata and they come from designers and salespeople, none of whom are
     leads. The rules would have refused every one of those sends. So look for
     a channel they actually share — for those fourteen it is #commercial,
     where Ephrata sits with the people who report to her. */
  function channelFor(report, fromId) {
    /* When the Chairman files on someone's behalf, the report travels as
       theirs: to their private line if it is for him alone, otherwise the
       room they share with its recipients. (There is no line from the
       Chairman to himself; delivery there always failed.) */
    if (fromId === 'chairman' || fromId === '*') fromId = report.person;
    var to = recipientsOf(report);
    if (!to.length || typeof CHANNELS === 'undefined') return null;

    var mine = CHANNELS.forPerson(fromId);

    /* a report to the Chairman alone belongs on the filer's private line */
    if (to.length === 1 && to[0] === 'chairman') return 'direct-' + fromId;

    /* otherwise the smallest shared room that holds every recipient — the
       smaller it is, the fewer people are shown something not addressed
       to them */
    var best = null;
    mine.forEach(function (ch) {
      if (ch.kind === 'direct') return;
      /* never #all. Alemaya's store report names the Chairman, Mahelet and
         Betelhem, and the only room holding all three that he is also in is
         everyone — so the smallest-room rule would have put his stock figures
         in front of forty people including twenty-two men on the factory
         floor. A report going to three people should not be a broadcast. */
      if (ch.id === 'all') return;
      /* a room kept for one person's reports (Group Finance, for Kidan's)
         takes nothing that is not addressed to them */
      if (ch.onlyFor && to.indexOf(ch.onlyFor) === -1) return;
      /* the WhatsApp customers' room carries customers, never a report */
      if (ch.noReports) return;
      var holdsAll = to.every(function (id) { return ch.members.indexOf(id) !== -1; });
      if (!holdsAll) return;
      if (!best || ch.members.length < best.members.length) best = ch;
    });
    if (best) return best.id;

    /* nowhere shared — the Chairman is in everything, so his line always works */
    return 'direct-' + fromId;
  }

  /* ---------------- the ring ---------------- */

  /* A number tells you how long is left. A ring tells you how much of the
     window has gone, which is the thing he actually reacts to — a quarter
     circle left reads as "now" before you have finished reading "23m". */
  var NS = 'http://www.w3.org/2000/svg';
  function svg(tag, a) {
    var e = document.createElementNS(NS, tag);
    Object.keys(a || {}).forEach(function (k) { e.setAttribute(k, a[k]); });
    return e;
  }

  /* ---------------- icons ---------------- */

  /* The line icons, drawn here rather than fetched: the top bar has to
     be up before anything has loaded, on a phone with one bar of signal. */
  var ICON = {
    chat: 'M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 17H10l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z',
    day: 'M3 12.5h4l2.5-6 5 12 2.5-6h4',
    table: 'M4 5.5h16v13H4zM4 10h16M4 14.5h16M10 5.5v13',
    orbit: 'M12 9.6a2.4 2.4 0 1 1 0 4.8a2.4 2.4 0 0 1 0-4.8zM2.8 12c0-2.3 4.1-4.2 9.2-4.2s9.2 1.9 9.2 4.2-4.1 4.2-9.2 4.2-9.2-1.9-9.2-4.2zM19.2 5.6a1.1 1.1 0 1 1 0 .01',
    doc: 'M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10.5A.5.5 0 0 1 6.5 20V4a.5.5 0 0 1 .5-.5zM14 3.5V8h4M9.5 12h5M9.5 15.5h5',
    galaxy: 'M12 10.4a1.6 1.6 0 1 1 0 3.2a1.6 1.6 0 0 1 0-3.2zM12 4.5c4.4 0 7.5 3.2 7.5 7 0 3-2.4 5-5.2 5M12 19.5c-4.4 0-7.5-3.2-7.5-7 0-3 2.4-5 5.2-5',
    cal: 'M5 6.5h14a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7.5a1 1 0 0 1 1-1zM4 10.5h16M8.5 4.5v4M15.5 4.5v4',
    more: 'M5.5 12h.01M12 12h.01M18.5 12h.01'
  };
  function icon(name) {
    var s = svg('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
                         'stroke-width': '1.7', 'stroke-linecap': 'round',
                         'stroke-linejoin': 'round', 'aria-hidden': 'true' });
    s.appendChild(svg('path', { d: ICON[name] }));
    return s;
  }

  function ring(mins, late) {
    /* the window is the last twelve hours before the deadline; beyond that
       the ring is simply full and the number does the talking */
    var span = 12 * 60;
    var left = Math.max(0, Math.min(1, mins / span));
    var R = 54, C = 2 * Math.PI * R;

    var g = svg('svg', { 'class': 'ringwrap', viewBox: '0 0 130 130',
                         'aria-hidden': 'true' });
    var defs = svg('defs', {});
    var lg = svg('linearGradient', { id: 'rg', x1: '0', y1: '0', x2: '1', y2: '1' });
    lg.appendChild(svg('stop', { offset: '0', 'stop-color': late ? '#e2765c' : '#5fe0c6' }));
    lg.appendChild(svg('stop', { offset: '1', 'stop-color': late ? '#8f3020' : '#2a9d8a' }));
    defs.appendChild(lg);
    g.appendChild(defs);

    g.appendChild(svg('circle', { cx: 65, cy: 65, r: R, fill: 'none',
      stroke: 'rgba(255,255,255,.06)', 'stroke-width': 7 }));
    g.appendChild(svg('circle', { cx: 65, cy: 65, r: R, fill: 'none',
      stroke: 'url(#rg)', 'stroke-width': 7, 'stroke-linecap': 'round',
      'stroke-dasharray': C.toFixed(1),
      'stroke-dashoffset': (C * (1 - left)).toFixed(1),
      'class': 'ringarc', style: '--c:' + C.toFixed(1),
      transform: 'rotate(-90 65 65)' }));
    return g;
  }

  /* ---------------- the top of the day ---------------- */

  function deck(p, st) {
    var wrap = el('section', 'deck');

    var who = el('div', 'deck-who');
    who.appendChild(el('span', 'deck-nm', p ? L(p) : (lang === 'am' ? 'ሊቀመንበር' : 'Chairman')));
    who.appendChild(el('span', 'deck-rl',
      p ? (lang === 'am' ? p.roleAm : p.roleEn) : 'Amare Feleke'));
    wrap.appendChild(who);

    var r = st.next || st.late[0];
    if (!r) {
      wrap.appendChild(el('p', 'deck-clear', st.sent && st.sent.length ? t('allSent') : t('nothingForYou')));
      return wrap;
    }

    var late = !st.next;
    var dial = el('div', 'dial' + (late ? ' late' : ''));
    dial.appendChild(ring(late ? 0 : st.mins, late));

    var mid = el('div', 'dial-mid');
    if (late) {
      mid.appendChild(el('span', 'dial-n', hhmm(r.dueTime)));
      mid.appendChild(el('span', 'dial-u', t('passed')));
    } else {
      var hh = Math.floor(st.mins / 60), mm = st.mins % 60;
      mid.appendChild(el('span', 'dial-n', hh ? String(hh) : String(mm)));
      mid.appendChild(el('span', 'dial-u',
        hh ? (lang === 'am' ? 'ሰዓት' : 'hours') : (lang === 'am' ? 'ደቂቃ' : 'minutes')));
      if (hh && mm) mid.appendChild(el('span', 'dial-s', mm + (lang === 'am' ? ' ደ' : 'm')));
    }
    dial.appendChild(mid);
    wrap.appendChild(dial);

    wrap.appendChild(el('p', 'deck-w', L(r)));
    /* a weekly report from an earlier day: its day, and until when it counts */
    var pdr = r.cadence === 'weekly' ? periodNow(r) : null;
    var earlier = late && pdr && pdr.day !== stamp();
    wrap.appendChild(el('p', 'deck-t',
      (earlier ? dayLabel(pdr.day) + ' ' : '') + hhmm(r.dueTime) + '  ·  ' +
      (earlier ? t(WEEK_BEFORE[r.id] ? 'weekOpenTillSat' : 'weekOpenTill') : (lang === 'am' ? r.toAm : r.toEn))));

    /* within the hour, the button breathes — the one thing on the page to do */
    var go = el('a', 'deck-go' + (late ? ' late' : (st.mins != null && st.mins <= 60 ? ' soon' : '')), t('fillItIn'));
    go.href = 'form.html?r=' + encodeURIComponent(r.id);
    wrap.appendChild(go);

    var left = st.late.length + (st.next ? 1 : 0) - 1;
    if (left > 0) {
      wrap.appendChild(el('p', 'deck-more', left + ' ' + t('moreToday')));
    }
    if (st.sent && st.sent.length) {
      wrap.appendChild(el('p', 'deck-more sent', st.sent.length + ' ' + t('sentToday')));
    }
    return wrap;
  }

  /* ---------------- the day as a run of lights ---------------- */

  function timeline(pid) {
    var list = dueToday().filter(function (r) { return !pid || r.person === pid; });
    if (list.length < 2) return null;

    var wrap = el('div', 'tl');

    /* On the Chairman's board nineteen rows was a scroll, and thirteen of
       them said the same thing: 5:30 PM. Three or more at one minute become
       one row that opens onto the names. */
    if (!pid) {
      var byTime = {};
      list.forEach(function (r) { (byTime[r.dueTime] = byTime[r.dueTime] || []).push(r); });
      Object.keys(byTime).sort().forEach(function (tm) {
        var rs = byTime[tm];
        if (rs.length < 3) { rs.forEach(function (r) { wrap.appendChild(tlRow(r, pid)); }); return; }
        var mins = minsUntil(tm);
        var nSent = rs.filter(function (r) { return filingFor(r, stamp()); }).length;
        var g = el('details', 'tlgroup ' + (nSent === rs.length ? 'sent' : (mins < 0 ? 'gone' : (mins <= 120 ? 'soon' : ''))));
        var sm = el('summary');
        var led = el('span', 'tled'); led.appendChild(el('i')); sm.appendChild(led);
        var b = el('span', 'tlbody');
        b.appendChild(el('span', 'tlt', hhmm(tm)));
        b.appendChild(el('span', 'tlw', rs.length + ' ' + t('reportsDue') +
          (nSent ? ' · ' + nSent + ' ' + t('sentShort') : '')));
        b.appendChild(el('span', 'tlp', rs.map(function (r) {
          var w = personById(r.person); return w ? L(w).split(' ')[0] : r.person;
        }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ')));
        sm.appendChild(b);
        sm.appendChild(el('span', 'tls', nSent === rs.length ? t('sentShort')
          : (mins < 0 ? t('passed') : countdown(mins).replace(t('inTime') + ' ', ''))));
        g.appendChild(sm);
        var sub = el('div', 'tlsub');
        rs.forEach(function (r) {
          var a = el('a');
          a.href = 'form.html?r=' + encodeURIComponent(r.id);
          var w = personById(r.person);
          var fr = filingFor(r, stamp());
          a.appendChild(el('span', null, L(r)));
          a.appendChild(el('span', null, (w ? L(w) : r.person) +
            (fr ? ' · ' + (fr.pending ? t('waitingToSend') : t('sentAt') + ' ' + clockOf(fr.at)) : '')));
          if (fr) a.className = 'sent';
          sub.appendChild(a);
        });
        g.appendChild(sub);
        wrap.appendChild(g);
      });
      return wrap;
    }

    list.forEach(function (r) { wrap.appendChild(tlRow(r, pid)); });
    return wrap;
  }

  function tlRow(r, pid) {
    var mins = minsUntil(r.dueTime);
    var fr = filingFor(r, stamp());
    var state = fr ? 'sent' : (mins < 0 ? 'gone' : (mins <= 120 ? 'soon' : ''));
    var a = el('a', 'tlrow ' + state);
    a.href = 'form.html?r=' + encodeURIComponent(r.id);

    var led = el('span', 'tled');
    led.appendChild(el('i'));
    a.appendChild(led);

    var b = el('span', 'tlbody');
    b.appendChild(el('span', 'tlt', hhmm(r.dueTime)));
    b.appendChild(el('span', 'tlw', L(r)));
    if (!pid) {
      var who = personById(r.person);
      b.appendChild(el('span', 'tlp', who ? L(who) : r.person));
    }
    a.appendChild(b);

    a.appendChild(el('span', 'tls', fr
      ? (fr.pending ? t('waitingToSend') : t('sentAt') + ' ' + clockOf(fr.at))
      : (mins < 0 ? t('passed') : countdown(mins).replace(t('inTime') + ' ', ''))));
    return a;
  }

  function letterhead(p) {
    /* the Addis date, read as a plain local date for the calendar sums */
    var a = addis(), d = new Date(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate()), e = toEthiopian(d);
    var head = el('header', 'lh');

    var mark = el('div', 'lh-mark'), bm = brand().mark || ['KLEVER', 'KÜCHE'];
    mark.appendChild(el('span', 'lh-k', bm[0]));
    if (bm[1]) mark.appendChild(el('span', 'lh-ku', bm[1]));
    head.appendChild(mark);

    var dt = el('div', 'lh-date');
    dt.appendChild(el('span', null,
      (lang === 'am' ? DAYS_AM : DAYS_EN)[d.getDay()] + ' ' +
      d.getDate() + ' ' + (lang === 'am' ? MONTHS_AM : MONTHS_EN)[d.getMonth()] + ' ' +
      d.getFullYear()));
    dt.appendChild(el('span', null,
      ETH_MONTHS[e.m - 1] + ' ' + e.d + ' ቀን ' + e.y + ' ዓ.ም.'));
    head.appendChild(dt);
    return head;
  }

  /* ---------------- sign in ---------------- */

  function renderSignIn(root) {
    document.title = t('siteTitle');
    root.innerHTML = '';
    /* the universe and the observatory run edge to edge; their sign-in card
       keeps the ordinary column (see .wrap.signing) */
    root.classList.add('signing');
    rebuildTop();
    setView(null);
    root.appendChild(letterhead(null));

    var card = el('section', 'signin');
    card.appendChild(el('h1', null, t('signIn')));
    card.appendChild(el('p', 'sub', t('signInSub')));

    /* The password alone. Nobody picks their name from a list: the site
       works out whose password it is (AUTH.whoIs), so a person cannot choose
       to be someone else, and nobody has to know their account is really
       betty@klever.local. */
    var lab2 = el('label', 'codelab', t('chatPassword'));
    lab2.htmlFor = 'code';
    card.appendChild(lab2);

    var input = document.createElement('input');
    input.type = 'password';
    input.id = 'code';
    input.className = 'signfield';
    input.autocomplete = 'current-password';
    input.setAttribute('autocapitalize', 'none');
    input.setAttribute('autocorrect', 'off');
    input.spellcheck = false;
    card.appendChild(input);

    var err = el('p', 'codeerr');
    err.hidden = true;
    card.appendChild(err);

    var go = el('button', 'codego', t('codeGo'));
    go.type = 'button';
    card.appendChild(go);
    card.appendChild(el('p', 'codenote', t('staySignedIn')));

    function attempt() {
      if (go.disabled) return;
      err.hidden = true;
      go.disabled = true;
      go.textContent = t('chatSigningIn');
      AUTH.signInByPassword(input.value).then(function () {
        LINK_KEY = null;
        root.classList.remove('signing');
        try { localStorage.setItem('klever.lastUser', AUTH.who() || ''); } catch (e) {}
        rebuildTop();
        watchFilings();
        /* on the Chairman's page the next screen belongs to chairman.js, and
           only a reload hands it over cleanly */
        if (ownPage()) { location.reload(); return; }
        /* signed in from a link to a report: go on to that report */
        if (document.body.dataset.page === 'form') renderForm(root);
        else renderIndex(root);
      })['catch'](function (e) {
        /* Say what actually went wrong — but never whose password it might
           have been. No signal is not a wrong password, and a wrong password
           typed again after "too many tries" only makes the wait longer. */
        var code = (e && (e.code || e.message)) || '';
        var net = code === 'offline' || code === 'auth/network-request-failed';
        err.textContent = net ? t('signInOffline')
          : (code === 'auth/too-many-requests' ? t('signInTooMany') : t('chatBadSignIn'));
        err.hidden = false;
        go.disabled = false;
        go.textContent = t('codeGo');
        /* keep what was typed when the network was the problem */
        if (!net) input.value = '';
        input.focus();
      });
    }
    go.onclick = attempt;
    input.onkeydown = function (e) { if (e.key === 'Enter') attempt(); };
    input.oninput = function () { err.hidden = true; };

    root.appendChild(card);
    root.appendChild(foot());
    input.focus();
    /* opened from a personal link: sign straight in. The key is kept until
       the sign-in works, so a link opened with no signal can be retried. */
    if (LINK_KEY) { input.value = LINK_KEY; attempt(); }
  }


  /* ---------------- chat, on the home screen ---------------- */

  /* Two links to hand out is one too many. Chat used to be a small button in
     the top bar, which is fine once you know it is there and invisible until
     then. Here it sits under the reports — duty first, conversation second —
     and carries the last thing anyone said, so the home screen is worth
     opening even on a day with nothing due. */
  var stopWatch = null;
  function chatCard() {
    if (stopWatch) { try { stopWatch(); } catch (e) {} stopWatch = null; }

    var wrap = el('div');
    wrap.appendChild(el('h2', 'eyebrow', t('chatTitle')));

    var a = el('a', 'chan chatcard');
    a.href = 'chat.html';
    var ci = el('span', 'chinit');
    ci.appendChild(icon('chat'));
    a.appendChild(ci);
    var who = el('span', 'who');
    who.appendChild(el('span', 'nm', t('chatOpen')));
    var line = el('span', 'rl', t('chatPickSub'));
    who.appendChild(line);
    a.appendChild(who);
    a.appendChild(el('span', 'arrow', '→'));
    wrap.appendChild(a);

    /* the newest message across this person's own channels */
    if (window.FB && window.FB.live() && typeof CHANNELS !== 'undefined' && AUTH.who()) {
      var mine = CHANNELS.forPerson(AUTH.isChairman() ? CHAIRMAN : AUTH.who());
      var ids = mine.map(function (c) { return c.id; });
      if (ids.length) {
        stopWatch = window.FB.watchLatest(ids, function (m) {
          var p = personById(m.who);
          var name = m.who === CHAIRMAN
            ? (lang === 'am' ? 'ሊቀመንበር' : 'Chairman')
            : (p ? L(p) : m.who);
          var said = m.text || (m.kind === 'voice' ? t('chatVoice') : t('chatPhoto'));
          line.textContent = name + ': ' + said;
          line.classList.add('lastmsg');
        });
      }
    }
    return wrap;
  }

  /* ---------------- what the Chairman asked for ---------------- */

  /* An instruction given in passing is forgotten by both people by Friday.
     Written down, with a date, it sits here — above the reports, because it
     came from him — until the person it is for says it is done. The morning
     brief tells him about any that pass their date first. */
  var stopIns = null;
  var insKept = null;
  function instructionsCard() {
    if (insKept && insKept.who === AUTH.who()) return insKept;
    if (stopIns) { try { stopIns(); } catch (e) {} stopIns = null; }
    var wrap = el('div', 'inswrap');
    if (!window.FB || !window.FB.live() || AUTH.isChairman()) return wrap;
    insKept = wrap;
    wrap.who = AUTH.who();
    stopIns = window.FB.watchMyInstructions(function onIns(all) {
      if (typingIn(wrap, function () { onIns(all); })) return;
      wrap.innerHTML = '';
      var open = all.filter(function (i) { return i.status === 'open'; })
                    .sort(function (a, b) { return a.due < b.due ? -1 : (a.due > b.due ? 1 : 0); });
      /* his, then the script's reminders (supplier credit falling due), then
         the AI's alerts (apps-script/Owners.js) */
      var kindOf = function (i) { return i.by === 'reminder' ? 'rem' : i.by === 'alert' ? 'alert' : 'his'; };
      [['his', 'insTitle'], ['rem', 'insRemTitle'], ['alert', 'insAlertTitle']].forEach(function (g) {
        var these = open.filter(function (i) { return kindOf(i) === g[0]; });
        if (!these.length) return;
        wrap.appendChild(el('h2', 'eyebrow', t(g[1])));
        these.forEach(function (i) { wrap.appendChild(insRow(i)); });
      });
    });
    return wrap;
  }

  /* ---------------- collections that do not match ----------------

     The Chairman, 13 Oct 2026: when Ephrata's collections and the
     salespeople's differ, she is asked at once and types what was really
     collected (apps-script/Money.js). One card a day, above everything
     else: each payment, both figures, a tap for either and a box for the
     real one. It goes when every box is filled; what she sends becomes the
     day's figure everywhere it is read. Her report itself stays as filed. */
  var stopMf = null, mfKept = null;
  function moneyFixCard() {
    if (mfKept && mfKept.who === AUTH.who()) return mfKept;
    if (stopMf) { try { stopMf(); } catch (e) {} stopMf = null; }
    var wrap = el('div', 'inswrap mfwrap');
    if (!window.FB || !window.FB.live() || AUTH.isChairman() || !window.FB.watchMyMoneyFix) return wrap;
    mfKept = wrap;
    wrap.who = AUTH.who();
    var sentNow = {};
    stopMf = window.FB.watchMyMoneyFix(function onMf(docs, mine) {
      if (typingIn(wrap, function () { onMf(docs, mine); })) return;
      wrap.innerHTML = '';
      /* what she has already answered, by day */
      var answered = {};
      mine.forEach(function (f) { (f.items || []).forEach(function (x) { (answered[f.day] = answered[f.day] || {})[x.key] = 1; }); });
      var open = docs.filter(function (d) {
        if (d.status !== 'open') return false;
        var a = answered[d.day] || sentNow[d.day] || {};
        return (d.items || []).some(function (it) { return !a[it.key]; });
      }).sort(function (a, b) { return a.day < b.day ? -1 : 1; });
      if (!open.length) return;
      wrap.appendChild(el('h2', 'eyebrow', t('mfTitle')));
      open.forEach(function (d) { wrap.appendChild(moneyFixRow(d, function (keys) { sentNow[d.day] = keys; })); });
    });
    return wrap;
  }
  function moneyFixRow(d, onSent) {
    var row = el('div', 'ins over mf');
    row.appendChild(el('div', 'inst', tfill_('mfDay', { day: dayLabel(d.day) })));
    row.appendChild(el('div', 'mfhow', t('mfHow')));
    var items = (d.items || []).slice(), boxes = [];
    var go = el('button', 'pushbtn insgo', t('mfSend'));
    go.type = 'button';
    function check() { go.disabled = boxes.some(function (b) { return b.value.trim() === '' || isNaN(num_(b.value)); }); }
    items.forEach(function (it) {
      var p = el('div', 'mfitem');
      var who = it.who ? personName_(it.who) : '';
      p.appendChild(el('div', 'mfcust', [it.cust, it.code].filter(Boolean).join(' · ') || t('mfNoName')));
      var said = it.kind === 'missing' ? tfill_('mfMissing', { who: who, v: money(Math.round(it.sales)) })
               : it.kind === 'amount' ? tfill_('mfAmount', { who: who, v: money(Math.round(it.sales)), mine: money(Math.round(it.eph)) })
               : tfill_('mfExtra', { mine: money(Math.round(it.eph)) });
      p.appendChild(el('div', 'mfsaid', said));
      var line = el('div', 'mfline');
      var box = el('input', 'mfbox');
      box.type = 'text'; box.inputMode = 'decimal';
      box.placeholder = t('mfType');
      box.setAttribute('aria-label', t('mfType') + ' — ' + (it.cust || it.code || ''));
      box.id = 'mf_' + d.day + '_' + boxes.length;
      box.oninput = check;
      /* one tap for either figure; 0 when it was not collected */
      /* each figure says whose it is */
      var mine = t('mfYou');
      var picks = it.kind === 'missing' ? [[who, it.sales], ['', 0]] : it.kind === 'amount' ? [[who, it.sales], [mine, it.eph]] : [[mine, it.eph], ['', 0]];
      picks.forEach(function (pk) {
        var v = pk[1];
        var b = el('button', 'mfpick', v ? (pk[0] ? pk[0] + ' ' : '') + money(Math.round(v)) : t('mfNone'));
        b.type = 'button';
        b.onclick = function () { box.value = v ? money(Math.round(v)) : '0'; check(); };
        line.appendChild(b);
      });
      line.appendChild(box);
      p.appendChild(line);
      boxes.push(box);
      row.appendChild(p);
    });
    check();
    go.onclick = function () {
      if (go.disabled) return;
      go.disabled = true;
      /* the day's list as it now stands: her rows, corrected; a payment she
         had not listed, added; one she says was not collected, taken out */
      var list = (d.baseList || []).map(function (r) { return r && typeof r === 'object' ? Object.assign({}, r) : null; });
      var answers = items.map(function (it, i) { return { key: it.key, amount: num_(boxes[i].value) }; });
      items.forEach(function (it, i) {
        var v = answers[i].amount;
        if (it.kind === 'missing') {
          if (v > 0) list.push({ cust: it.cust || '', lc: it.code || '', amount: money(v), kind: it.payKind || '' });
          return;
        }
        if (it.row >= 0 && list[it.row]) {
          if (v > 0) list[it.row].amount = money(v); else list[it.row] = null;
        }
      });
      list = list.filter(function (r) { return r; });
      var total = list.reduce(function (a, r) { var x = num_(r.amount); return a + (isNaN(x) ? 0 : x); }, 0);
      window.FB.fileMoneyFix({ day: d.day, items: answers, list: list, total: Math.round(total * 100) / 100 }).then(function () {
        onSent(answers.reduce(function (o, a) { o[a.key] = 1; return o; }, {}));
        row.innerHTML = '';
        row.className = 'ins mf done';
        row.appendChild(el('div', 'inst', tfill_('mfThanks', { day: dayLabel(d.day), v: money(Math.round(total)) })));
      }, function () {
        go.disabled = false;
        toast(t('mfFailed'));
      });
    };
    var box = el('div', 'insbox');
    box.appendChild(go);
    row.appendChild(box);
    return row;
  }
  /* ---------------- receipts to confirm ----------------

     The user, 15 Oct 2026: each payment a salesperson reports carries its
     receipt number, and Selam, who issues Klever's receipts, says whether
     she issued it (apps-script/Receipts.js). One card a day: each payment,
     three taps — issued, a different amount (she types the one on her
     receipt), no such receipt. She may send the ones she knows and leave
     the rest; those stay until answered. */
  var stopRc = null, rcKept = null;
  function receiptCard() {
    if (rcKept && rcKept.who === AUTH.who()) return rcKept;
    if (stopRc) { try { stopRc(); } catch (e) {} stopRc = null; }
    var wrap = el('div', 'inswrap mfwrap rcwrap');
    if (!window.FB || !window.FB.live() || AUTH.isChairman() || !window.FB.watchMyReceipts) return wrap;
    rcKept = wrap;
    wrap.who = AUTH.who();
    var sentNow = {};
    stopRc = window.FB.watchMyReceipts(function onRc(docs, mine) {
      if (typingIn(wrap, function () { onRc(docs, mine); })) return;
      wrap.innerHTML = '';
      /* what she has already answered, by day */
      var answered = {};
      mine.forEach(function (f) { (f.items || []).forEach(function (x) { (answered[f.day] = answered[f.day] || {})[x.key] = 1; }); });
      var open = docs.map(function (d) {
        var a = answered[d.day] || {}, s = sentNow[d.day] || {};
        var items = (d.items || []).filter(function (it) { return it && !it.ans && !a[it.key] && !s[it.key]; });
        return items.length ? { day: d.day, items: items } : null;
      }).filter(function (d) { return d; }).sort(function (a, b) { return a.day < b.day ? -1 : 1; });
      if (!open.length) return;
      wrap.appendChild(el('h2', 'eyebrow', t('rcTitle')));
      open.forEach(function (d) {
        wrap.appendChild(receiptRow(d, function (keys) {
          var s = sentNow[d.day] = sentNow[d.day] || {};
          Object.keys(keys).forEach(function (k) { s[k] = 1; });
        }));
      });
    });
    return wrap;
  }
  function receiptRow(d, onSent) {
    var row = el('div', 'ins over mf rc');
    row.appendChild(el('div', 'inst', tfill_(d.items.length === 1 ? 'rcDayOne' : 'rcDay', { day: dayLabel(d.day), n: d.items.length })));
    row.appendChild(el('div', 'mfhow', t('rcHow')));
    var picked = [];
    var go = el('button', 'pushbtn insgo', t('rcSend'));
    go.type = 'button';
    function check() {
      var any = false, bad = false;
      picked.forEach(function (p) {
        if (!p.ans) return;
        any = true;
        if (p.ans === 'amount' && !(num_(p.box.value) > 0)) bad = true;
      });
      go.disabled = !any || bad;
    }
    d.items.forEach(function (it, i) {
      var p = { it: it, ans: '', box: null };
      picked.push(p);
      var card = el('div', 'mfitem rcitem');
      card.appendChild(el('div', 'mfcust', [personName_(it.who), it.cust, it.code].filter(Boolean).join(' · ')));
      var kind = it.kind && T[lang]['rcKind_' + it.kind] ? ' · ' + t('rcKind_' + it.kind) : '';
      card.appendChild(el('div', 'mfsaid', tfill_('rcSaid', { v: money(Math.round(it.amount)), no: it.rcpt || t('rcNoNumber') }) + kind));
      if (it.dup && it.dup.day) {
        card.appendChild(el('div', 'rcdup', tfill_('rcDup', { who: personName_(it.dup.who), cust: it.dup.cust || '—',
                                                              v: money(Math.round(it.dup.amount)), day: dayLabel(it.dup.day) })));
      }
      /* the slip the salesperson photographed, to look at before answering */
      var slips = Array.isArray(it.slips) ? it.slips : [];
      card.appendChild(slips.length ? slipButtons(slips) : el('div', 'rcnoslip', t('slipNone')));
      var line = el('div', 'mfline rcline');
      var box = el('input', 'mfbox');
      box.type = 'text'; box.inputMode = 'decimal';
      box.placeholder = t('rcType');
      box.setAttribute('aria-label', t('rcType') + ' — ' + (it.cust || it.code || it.rcpt || ''));
      box.id = 'rc_' + d.day + '_' + i;
      box.hidden = true;
      box.oninput = check;
      p.box = box;
      var btns = [];
      [['yes', 'rcYes'], ['amount', 'rcAmount'], ['no', 'rcNo']].forEach(function (o) {
        var b = el('button', 'mfpick rcpick rc_' + o[0], t(o[1]));
        b.type = 'button';
        b.setAttribute('aria-pressed', 'false');
        b.onclick = function () {
          p.ans = p.ans === o[0] ? '' : o[0];
          btns.forEach(function (x) {
            var on = x === b && p.ans === o[0];
            x.classList.toggle('on', on);
            x.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          box.hidden = p.ans !== 'amount';
          if (p.ans === 'amount') { if (!box.value) box.value = money(Math.round(it.amount)); box.focus(); }
          check();
        };
        btns.push(b);
        line.appendChild(b);
      });
      line.appendChild(box);
      card.appendChild(line);
      row.appendChild(card);
    });
    check();
    go.onclick = function () {
      if (go.disabled) return;
      go.disabled = true;
      var items = picked.filter(function (p) { return p.ans; }).map(function (p) {
        return { key: p.it.key, ans: p.ans, amount: p.ans === 'amount' ? num_(p.box.value) : null };
      });
      window.FB.fileReceipts({ day: d.day, items: items }).then(function () {
        onSent(items.reduce(function (o, x) { o[x.key] = 1; return o; }, {}));
        row.innerHTML = '';
        row.className = 'ins mf done';
        row.appendChild(el('div', 'inst', tfill_('rcThanks', { n: items.length, day: dayLabel(d.day) })));
      }, function () {
        go.disabled = false;
        toast(t('rcFailed'));
      });
    };
    var box = el('div', 'insbox');
    box.appendChild(go);
    row.appendChild(box);
    return row;
  }
  function num_(v) { var x = String(v == null ? '' : v).replace(/[^0-9.\-]/g, ''); return x === '' ? NaN : Number(x); }
  function tfill_(k, o) { return t(k).replace(/\{(\w+)\}/g, function (m, n) { return o[n] != null ? o[n] : m; }); }
  function personName_(id) { var p = PEOPLE.filter(function (x) { return x.id === id; })[0]; return p ? L(p).split(' ')[0] : id; }

  /* ---------------- the payroll ----------------

     The user, 14 Oct 2026: the HR agent does the payroll; the Chairman
     approves it; then Selam is given it to pay (apps-script/Payroll.js) —
     made the way Klever's own payroll sheet makes it: gross, overtime,
     transport, tax, pension, the deductions, net. One view for both pages:
     his, with Approve; hers, once approved, with the Excel she pays from.
     Every figure is the script's — only the words are made here. */
  function birr2(n) {
    return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function monthLabel_(ym) {
    return (lang === 'am' ? MONTHS_AM : MONTHS_EN)[Number(ym.slice(5, 7)) - 1] + ' ' + ym.slice(0, 4);
  }
  function payrollView(doc, opts) {
    opts = opts || {};
    var wrap = el('div', 'pywrap');
    var tt = doc.totals || {};
    var head = el('div', 'pyhead');
    head.appendChild(el('span', 'pymonth', monthLabel_(doc.month)));
    var st;
    if (doc.status === 'approved') {
      var at = doc.approvedAt && doc.approvedAt.toDate ? doc.approvedAt.toDate() : null;
      st = t('pyApproved') + (at ? ' · ' + dayLabel(addis(at.getTime()).toISOString().slice(0, 10)) : '');
    } else if (doc.status === 'ready') st = t(opts.approve ? 'pyReady' : 'pyReadyStaff');
    else st = tfill_('pySoFar', { day: doc.upTo ? dayLabel(doc.upTo) : '—' });
    head.appendChild(el('span', 'pystate ' + (doc.status || ''), st));
    wrap.appendChild(head);
    wrap.appendChild(el('p', 'pytotal', tfill_('pyPaidTo', { n: tt.people || 0, pay: birr2(tt.net) })));
    wrap.appendChild(el('p', 'pyparts', tfill_('pyParts', {
      gross: birr2(tt.grossPay), tax: birr2(tt.tax), p7: birr2(tt.pension7), pen: birr2(tt.penalty) })));
    wrap.appendChild(el('p', 'pyparts', tfill_('pyCost11', { p11: birr2(tt.pension11), cost: birr2(tt.cost11) })));
    if (tt.carryOut > 0) wrap.appendChild(el('p', 'pyparts', tfill_('pyCarry', { v: birr2(tt.carryOut) })));
    var rows = doc.rows || [];
    var missing = rows.filter(function (r) { return r.noWage; }).map(function (r) { return r.name; });
    if (missing.length) wrap.appendChild(el('p', 'pywarn', tfill_('pyNoWage', { names: missing.join(', ') })));
    var guessed = rows.filter(function (r) { return r.startGuessed; }).map(function (r) { return r.name; });
    if (guessed.length) wrap.appendChild(el('p', 'pywarn', tfill_('pyStartGuess', { names: guessed.join(', ') })));
    if (doc.status === 'sofar') wrap.appendChild(el('p', 'codenote', t('pyNotFinal')));
    wrap.appendChild(el('p', 'codenote', t('pyHow')));

    var acts = el('div', 'pyacts');
    if (opts.approve && doc.status === 'ready') {
      /* two taps: a month's pay is not approved by a brush of the thumb */
      var ok = el('button', 'pushbtn pyapprove');
      ok.type = 'button';
      var label = function () { ok.textContent = tfill_('pyApprove', { pay: birr2(tt.net), n: tt.people || 0 }); ok.classList.remove('armed'); };
      label();
      var armed = 0;
      ok.onclick = function () {
        if (ok.disabled) return;
        if (!armed) {
          armed = setTimeout(function () { armed = 0; label(); }, 5000);
          ok.textContent = t('pyApproveSure');
          ok.classList.add('armed');
          return;
        }
        clearTimeout(armed); armed = 0;
        ok.disabled = true;
        ok.classList.remove('armed');
        ok.textContent = t('pyApproving');
        Promise.resolve().then(function () { return opts.approve(doc.month); }).then(null, function (e) {
          ok.disabled = false;
          label();
          toast(tfill_('pyApproveFail', { e: (e && e.message) || String(e) }));
        });
      };
      acts.appendChild(ok);
    }
    var xl = el('button', 'pushbtn pyxl', t('pyExcel'));
    xl.type = 'button';
    xl.onclick = function () { payrollExcel(doc); };
    acts.appendChild(xl);
    wrap.appendChild(acts);

    rows.forEach(function (r) {
      var det = el('details', 'pyrow' + (r.noWage ? ' nowage' : r.carryOut > 0 ? ' over' : ''));
      var sum = el('summary');
      sum.appendChild(el('span', 'pyname', r.name));
      sum.appendChild(el('span', 'pypay', r.noWage ? t('pyNoWageRow') : birr2(r.net)));
      det.appendChild(sum);
      function line(k, v, cls) {
        var d = el('div', 'pyline' + (cls ? ' ' + cls : ''));
        d.appendChild(el('span', 'pyk', k));
        d.appendChild(el('span', 'pyv', v));
        det.appendChild(d);
      }
      var role = [r.role, r.payOnly ? t('pyPayOnly') : '', r.noLetter ? t('pyNoLetter') : '',
                  r.account ? t('pyAccount') + ' ' + r.account : t('pyNoAccount')].filter(Boolean).join(' · ');
      det.appendChild(el('div', 'pyrole', role));
      if (!r.noWage) {
        line(t('pyBasic'), birr2(r.gross) + (r.days < 30 ? ' → ' + tfill_('pyDaysOf', { d: r.days }) + ' = ' + birr2(r.basic) : ''));
        if (r.overtime) {
          var hrs = [['ot15', '×1.5'], ['ot175', '×1.75'], ['ot2', '×2'], ['ot25', '×2.5']].filter(function (k) { return r.ot && r.ot[k[0]]; })
            .map(function (k) { return tfill_('pyHours', { h: r.ot[k[0]] }) + ' ' + k[1]; }).join(', ');
          line(t('pyOvertime'), hrs + ' = +' + birr2(r.overtime), 'plus');
        }
        line(t('pyTransport'), '+' + birr2(r.transport));
      }
      if (r.bonuses) line(t('pyBonuses'), '+' + birr2(r.bonuses), 'plus');
      if (!r.noWage) line(t('pyGrossPay'), birr2(r.grossPay), 'sub');
      if (r.absentDays) {
        line(t('pyAbsent'), (r.absentDays === 1 ? t('pyDay1') : tfill_('pyDays', { n: r.absentDays })) +
          ' (' + (r.absentOn || []).map(dayLabel).join(', ') + ')' + (r.noWage ? '' : ' −' + birr2(r.absentAmount)), 'minus');
      }
      if (!r.noWage) {
        line(t('pyTax'), '−' + birr2(r.tax), 'minus');
        if (r.pension7) line(t('pyPension7'), '−' + birr2(r.pension7), 'minus');
        [['cost', 'pyCostShare'], ['loan', 'pyLoan'], ['advance', 'pyAdvance'], ['court', 'pyCourt']].forEach(function (k) {
          if (r[k[0]]) line(t(k[1]), '−' + birr2(r[k[0]]), 'minus');
        });
      }
      if (r.fines) line(t('pyFines'), birr2(r.fines));
      if (r.carryIn) line(t('pyCarryIn'), birr2(r.carryIn));
      if (!r.noWage && (r.fines || r.carryIn)) {
        line(t('pyTaken'), '−' + birr2(r.penalty) + (r.carryOut > 0 ? ' ' + tfill_('pyCap', { v: birr2(r.cap) }) : ''), 'minus');
      }
      if (r.carryOut > 0) line(t('pyCarryOut'), birr2(r.carryOut), 'carry');
      if (!r.noWage) {
        line(t('pyPay'), birr2(r.net), 'total');
        if (r.pension11) line(t('pyKlever11'), birr2(r.pension11), 'note');
      }
      wrap.appendChild(det);
    });
    return wrap;
  }

  /* The month as an Excel file, made on the phone, in the columns of
     Klever's own payroll sheet — with its formulas, so a figure changed by
     hand works itself through — and the bank transfer list. SheetJS,
     fetched only when asked for; a CSV of the same lines if it cannot be. */
  var XLSX_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.mini.min.js';
  var xlsxLoading = null;
  function loadXlsx() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (!xlsxLoading) {
      xlsxLoading = new Promise(function (ok, bad) {
        var s = document.createElement('script');
        s.src = XLSX_SRC;
        s.async = true;
        s.onload = function () { if (window.XLSX) ok(window.XLSX); else { xlsxLoading = null; bad(new Error('no XLSX')); } };
        s.onerror = function () { xlsxLoading = null; bad(new Error('could not load')); };
        document.head.appendChild(s);
      });
    }
    return xlsxLoading;
  }
  var PY_HEAD = ['S.N', 'NAME', 'Account No.', 'DAYS', 'BASIC SALARY', 'OT hours ×1.5', 'OT hours ×1.75', 'OT hours ×2',
                 'OT hours ×2.5', 'OVERTIME AMOUNT', 'Transport Allow.', 'Bonuses & commissions', 'ABSENCE DAYS', 'GROSS SALARY',
                 'ABSENCE AMOUNT', 'GROSS SALARY TAXABLE', 'INCOME TAX', 'Pension 7%', 'Pension 11% (Klever)', 'COST SHARING',
                 'LOAN', 'SALARY ADVANCE', 'COURT DED / FAMILY ALLOTMENT', 'PENALTY', 'TOTAL DEDUCTIONS', 'NET PAY',
                 'Penalty carried to next month', 'Notes'];
  var PY_MONEY_COLS = [4, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26];
  /* the sheet's own lines: { v, f } a cell; the first three rows a title */
  function payrollSheet(doc) {
    var T0 = 5;                                       /* the first person's row, 0-based (Excel row 6) */
    var cells = [];
    var title = ['Klever Addis Trade PLC', 'PERMANENT EMPLOYEES PAYROLL SUMMARY',
                 'FOR THE MONTH OF ' + MONTHS_EN[Number(doc.month.slice(5, 7)) - 1].toUpperCase() + ' ' + doc.month.slice(0, 4) + ' G.C'];
    title.forEach(function (x) { cells.push([{ v: x }]); });
    cells.push(PY_HEAD.map(function (h) { return { v: h }; }));
    cells.push([]);
    var rows = doc.rows || [];
    rows.forEach(function (r, i) {
      var n = T0 + i + 1;                             /* Excel row number */
      var c = function (col) { return col + n; };
      if (r.noWage) {
        cells.push([{ v: i + 1 }, { v: r.name }, { v: r.account || '', s: 1 }, { v: r.days }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' },
                    { v: '' }, { v: '' }, { v: '' }, { v: r.absentDays || 0 }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' },
                    { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: 0 }, { v: '' }, { v: '' }, { v: r.carryOut || 0 },
                    { v: 'No salary on record — not paid; penalty carried' + (r.bonuses ? '; bonuses ' + r.bonuses + ' Birr kept for next month' : '') }]);
        return;
      }
      var g = r.gross, ot = r.ot || {};
      var p = r.pension !== false;
      cells.push([
        { v: i + 1 }, { v: r.name }, { v: r.account || '', s: 1 }, { v: r.days },
        { v: r.basic, f: g + '/30*' + c('D') },
        { v: ot.ot15 || 0 }, { v: ot.ot175 || 0 }, { v: ot.ot2 || 0 }, { v: ot.ot25 || 0 },
        { v: r.overtime, f: 'ROUND((' + c('F') + '*1.5+' + c('G') + '*1.75+' + c('H') + '*2+' + c('I') + '*2.5)*' + g + '/208,2)' },
        { v: r.transport, f: '600/30*' + c('D') },
        { v: r.bonuses || 0 },
        { v: r.absentDays || 0 },
        { v: r.grossPay, f: c('E') + '+' + c('J') + '+' + c('K') + '+' + c('L') },
        { v: r.absentAmount, f: 'ROUND(MIN(' + c('E') + ',' + g + '/30*' + c('M') + '),2)' },
        { v: r.taxable, f: c('N') + '-' + c('K') + '-' + c('O') },
        { v: r.tax, f: 'ROUND(IF(' + c('P') + '<=2000,0,IF(' + c('P') + '<=4000,' + c('P') + '*0.15-300,IF(' + c('P') + '<=7000,' + c('P') +
                       '*0.2-500,IF(' + c('P') + '<=10000,' + c('P') + '*0.25-850,IF(' + c('P') + '<=14000,' + c('P') + '*0.3-1350,' + c('P') +
                       '*0.35-2050))))),2)' },
        p ? { v: r.pension7, f: 'ROUND(' + c('E') + '*0.07,2)' } : { v: 0 },
        p ? { v: r.pension11, f: 'ROUND(' + c('E') + '*0.11,2)' } : { v: 0 },
        { v: r.cost || 0 }, { v: r.loan || 0 }, { v: r.advance || 0 }, { v: r.court || 0 }, { v: r.penalty || 0 },
        { v: r.deductions, f: c('Q') + '+' + c('R') + '+' + c('T') + '+' + c('U') + '+' + c('V') + '+' + c('W') + '+' + c('X') },
        { v: r.net, f: c('N') + '-' + c('Y') + '-' + c('O') },
        { v: r.carryOut || 0 },
        { v: r.carryOut ? 'Penalty over a third of the basic earned: the rest comes off next month' : '' }
      ]);
    });
    var first = T0 + 1, last = T0 + rows.length, tot = last + 1;
    var tt = doc.totals || {};
    var sumOf = function (col, v) { return { v: v || 0, f: 'SUM(' + col + first + ':' + col + last + ')' }; };
    var tline = [{ v: '' }, { v: 'Total, ' + (tt.people || 0) + ' people paid' }, { v: '' }, { v: '' }];
    'EFGHIJKLMNOPQRSTUVWXYZA'.split('').slice(0, 22).forEach(function (col) { tline.push(null); });
    var TCOL = { E: tt.basic, J: tt.overtime, K: tt.transport, L: tt.bonuses, N: tt.grossPay, O: tt.absentAmount, P: tt.taxable,
                 Q: tt.tax, R: tt.pension7, S: tt.pension11, T: tt.cost, U: tt.loan, V: tt.advance, W: tt.court, X: tt.penalty,
                 Y: tt.deductions, Z: tt.net, AA: tt.carryOut };
    var COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB'];
    tline = COLS.map(function (col, i) {
      if (i < 4) return tline[i];
      return TCOL[col] != null ? sumOf(col, TCOL[col]) : { v: '' };
    });
    cells.push(tline);
    /* the entry the accountant makes of it: what it cost, and where it went */
    var T = function (col) { return col + tot; };
    cells.push([]);
    cells.push([{ v: '' }, { v: 'Wages expense (basic less absence)' }, { v: '' }, { v: '' }, { v: prR2(tt.basic - tt.absentAmount), f: T('E') + '-' + T('O') }]);
    cells.push([{ v: '' }, { v: 'Overtime' }, { v: '' }, { v: '' }, { v: tt.overtime || 0, f: T('J') }]);
    cells.push([{ v: '' }, { v: 'Transport allowance' }, { v: '' }, { v: '' }, { v: tt.transport || 0, f: T('K') }]);
    cells.push([{ v: '' }, { v: 'Bonuses and commissions' }, { v: '' }, { v: '' }, { v: tt.bonuses || 0, f: T('L') }]);
    cells.push([{ v: '' }, { v: 'Pension 11% (Klever)' }, { v: '' }, { v: '' }, { v: tt.pension11 || 0, f: T('S') }]);
    var dr = tot + 2;
    cells.push([{ v: '' }, { v: 'Total cost' }, { v: '' }, { v: '' }, { v: tt.cost11 || 0, f: 'SUM(E' + dr + ':E' + (dr + 4) + ')' }]);
    cells.push([{ v: '' }, { v: 'Cash (net pay)' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: tt.net || 0, f: T('Z') }]);
    cells.push([{ v: '' }, { v: 'Income tax payable' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: tt.tax || 0, f: T('Q') }]);
    cells.push([{ v: '' }, { v: 'Pension payable (7% + 11%)' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' },
                { v: prR2((tt.pension7 || 0) + (tt.pension11 || 0)), f: T('R') + '+' + T('S') }]);
    cells.push([{ v: '' }, { v: 'Loans and salary advances repaid' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' },
                { v: prR2((tt.loan || 0) + (tt.advance || 0)), f: T('U') + '+' + T('V') }]);
    cells.push([{ v: '' }, { v: 'Cost sharing and court deductions' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' },
                { v: prR2((tt.cost || 0) + (tt.court || 0)), f: T('T') + '+' + T('W') }]);
    cells.push([{ v: '' }, { v: 'Penalties (other income)' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: tt.penalty || 0, f: T('X') }]);
    var cr = dr + 6;
    cells.push([{ v: '' }, { v: 'Total' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' },
                { v: tt.cost11 || 0, f: 'SUM(I' + cr + ':I' + (cr + 5) + ')' }]);
    cells.push([]);
    var appr = doc.status === 'approved' && doc.approvedAt && doc.approvedAt.toDate
      ? 'Approved by the Chairman on ' + addis(doc.approvedAt.toDate().getTime()).toISOString().slice(0, 10) : 'Approved by ______________________';
    cells.push([{ v: '' }, { v: 'Prepared by ______________________' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' },
                { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: appr }]);
    return { cells: cells, first: first, last: last, total: tot };
  }
  function prR2(x) { return Math.round((x || 0) * 100) / 100; }
  /* the bank transfer list, as the sheet's CBE / ACOUNT tabs */
  function transferSheet(doc, layout) {
    var cells = [[{ v: 'KLEVER ADDIS TRADE PLC' }], [{ v: 'PERMANENT EMPLOYEES PAYROLL SUMMARY — BANK TRANSFER' }],
                 [{ v: 'FOR THE MONTH OF ' + MONTHS_EN[Number(doc.month.slice(5, 7)) - 1].toUpperCase() + ' ' + doc.month.slice(0, 4) }],
                 [{ v: 'SN' }, { v: 'NAME' }, { v: 'ACCOUNT NUMBER' }, { v: 'NET PAY' }]];
    var n = 0, total = 0;
    (doc.rows || []).forEach(function (r, i) {
      if (r.noWage || !(r.net > 0)) return;
      n++;
      total += r.net;
      cells.push([{ v: n }, { v: r.name }, { v: r.account || 'no account on record', s: 1 },
                  { v: r.net, f: "'Payroll " + doc.month + "'!Z" + (layout.first + i) }]);
    });
    cells.push([{ v: '' }, { v: 'Total' }, { v: '' }, { v: prR2(total), f: 'SUM(D5:D' + (4 + n) + ')' }]);
    cells.push([]);
    cells.push([{ v: '' }, { v: 'Prepared by ________' }, { v: '' }, { v: 'Approved by ________' }]);
    return cells;
  }
  function toSheet(X, cells, money, widths) {
    var ws = {}, maxC = 0;
    cells.forEach(function (row, r) {
      (row || []).forEach(function (x, c) {
        if (!x || (x.v === '' && !x.f)) return;
        var cell = typeof x.v === 'number' ? { t: 'n', v: x.v } : { t: 's', v: String(x.v) };
        if (x.f) cell.f = x.f;
        if (cell.t === 'n' && money(c, r)) cell.z = '#,##0.00';
        ws[X.utils.encode_cell({ r: r, c: c })] = cell;
        if (c > maxC) maxC = c;
      });
    });
    ws['!ref'] = X.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: cells.length - 1, c: maxC } });
    ws['!cols'] = widths;
    return ws;
  }
  function payrollExcel(doc) {
    var name = 'Klever payroll ' + doc.month + (doc.status === 'sofar' ? ' (so far)' : '');
    var layout = payrollSheet(doc);
    return loadXlsx().then(function (X) {
      var wb = X.utils.book_new();
      var ws = toSheet(X, layout.cells, function (c, r) { return r >= 5 && (PY_MONEY_COLS.indexOf(c) !== -1 || c === 8); },
        PY_HEAD.map(function (h, i) { return { wch: i === 1 ? 24 : i === 2 ? 16 : i === 27 ? 50 : i < 1 ? 5 : 13 }; }));
      ws['!merges'] = [0, 1, 2].map(function (r) { return { s: { r: r, c: 0 }, e: { r: r, c: 13 } }; });
      X.utils.book_append_sheet(wb, ws, 'Payroll ' + doc.month);
      var tr = toSheet(X, transferSheet(doc, layout), function (c, r) { return c === 3 && r >= 4; },
        [{ wch: 5 }, { wch: 28 }, { wch: 18 }, { wch: 15 }]);
      X.utils.book_append_sheet(wb, tr, 'Bank transfer');
      X.writeFile(wb, name + '.xlsx');
      return 'xlsx';
    }, function () {
      var csv = layout.cells.map(function (row) {
        return (row || []).map(function (x) {
          var s = String(x && x.v != null ? x.v : '');
          return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
        }).join(',');
      }).join('\r\n');
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
      a.download = name + '.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
      return 'csv';
    });
  }

  /* Selam's card: the month the Chairman approved, newest first. The rules
     give it to her alone, so nobody else even asks. */
  var stopPy = null;
  var pyKept = null;
  /* built once for the page's life: rebuilt every minute, its open rows
     closed and its "new" marks went (the bug hunt, 15 Oct 2026) */
  function payrollCard() {
    if (pyKept && pyKept.who === AUTH.who()) return pyKept;
    if (stopPy) { try { stopPy(); } catch (e) {} stopPy = null; }
    var wrap = el('div', 'pycard');
    if (!window.FB || !window.FB.live() || AUTH.isChairman() || AUTH.who() !== 'betty' || !window.FB.watchPayrollToPay) return wrap;
    pyKept = wrap; wrap.who = AUTH.who();
    stopPy = window.FB.watchPayrollToPay(function (docs) {
      wrap.innerHTML = '';
      if (!docs.length) return;
      wrap.appendChild(el('h2', 'eyebrow', t('pyToPay')));
      wrap.appendChild(payrollView(docs[0], {}));
    });
    return wrap;
  }

  /* ---------------- office check-in at the door ----------------

     The user, 14 Oct 2026: office staff scan a QR code at the office door
     when they arrive, on Klever's WiFi only (apps-script/Attend.js). The QR
     opens this site with ?scan=office; the phone is signed in already, so
     the scan goes — with the person's sign-in — to the WhatsApp agent, the
     one server that sees which internet the phone came from; it passes the
     scan to the script, which says yes or no. Late after 8:00 AM. No scan,
     or late: this card asks why; nothing is taken from pay. */
  var ATTEND_URL = 'https://whatsapp-agent-production-bcc8.up.railway.app/attend';
  var AT_LATE = 8 * 60;
  var AT_WHY_NOSCAN = ['visit', 'sick', 'leave', 'forgot', 'holiday', 'other'];
  var AT_WHY_LATE = ['transport', 'visit', 'leave', 'other'];
  var atScanBox = null;

  /* "14 min", "8 h 23 min" */
  function atDur(m) {
    m = Math.max(0, Math.round(m || 0));
    var h = Math.floor(m / 60), r = m % 60;
    if (lang === 'am') return (h ? h + ' ሰዓት' + (r ? ' ' : '') : '') + (r || !h ? r + ' ደቂቃ' : '');
    return (h ? h + ' h' + (r ? ' ' : '') : '') + (r || !h ? r + ' min' : '');
  }
  function atScanAsked() {
    return /^(office|1)$/.test(new URLSearchParams(location.search).get('scan') || '');
  }
  /* the result of a scan, at the top of the page; the address bar loses
     ?scan= so a reload does not scan again. The page redraws itself as the
     person's reports come in, so the same box is handed back each time —
     a new one would drop the answer on the floor. */
  function atScanCard() {
    if (atScanBox && atScanBox.day !== stamp()) return el('div');   /* yesterday's answer, on a page kept open */
    if (atScanBox) return atScanBox;
    if (!atScanAsked() || !window.FB || !window.FB.live()) return el('div');
    var box = atScanBox = el('div', 'ins atscan');
    box.day = stamp();
    try {
      var q = new URLSearchParams(location.search);
      q.delete('scan');
      history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q.toString() : '') + location.hash);
    } catch (e) {}
    box.appendChild(el('div', 'inst', t('atChecking')));
    function show(kind, text, sub) {
      box.innerHTML = '';
      box.className = 'ins atscan ' + kind;
      box.appendChild(el('div', 'atbig', text));
      if (sub) box.appendChild(el('div', 'atsub', sub));
    }
    function button(label, act) {
      var b = el('button', 'mfpick atagain', label);
      b.type = 'button';
      b.onclick = function () { b.disabled = true; act(b); };
      box.appendChild(b);
      return b;
    }
    function send(loc) {
      return window.FB.token().then(function (tok) {
        if (!tok) throw { why: 'signin' };
        var body = { idToken: tok };
        if (loc) body.loc = loc;
        return fetch(ATTEND_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                   body: JSON.stringify(body) });
      }).then(function (r) {
        return r.json()['catch'](function () { return { ok: false, why: 'unavailable' }; });
      });
    }
    function failed(e) { show('bad', t(e && e.why === 'signin' ? 'atSignIn' : 'atFailed')); }
    /* Not on Klever's WiFi: where the phone is. 23 Oct 2026 the office WiFi
       had no internet and nobody could scan; the user: "mobile data, then you
       check the location". Asked only off the WiFi, so the WiFi stays one tap. */
    var placeAsked = false, lastLoc = null;
    function place() {
      placeAsked = true;
      show('wait', t('atLocAsk'), t('atLocAskSub'));
      atWhere().then(function (loc) {
        if (loc.err) {
          show('bad', t(loc.err === 'denied' ? 'atLocDenied' : 'atLocNone'), t('atLocOrWifi'));
          button(t('atTryAgain'), place);
          return;
        }
        lastLoc = loc;
        show('wait', t('atChecking'));
        return send(loc).then(answer);
      }).then(null, failed);
    }
    function answer(a) {
      var w = a.why || 'unavailable';
      if (!a.ok && w === 'not-wifi' && !placeAsked) return place();
      if (a.chairman) return chairAnswer(a, w);
      /* `queued`: taken by the check-in server while the site's database was
         out (20 Oct 2026) — it reaches the person's page once it is back */
      var saved = a.queued ? t('atSaved') : '';
      var how = a.place ? tfill_('atByPlace', { m: atMetres(a.dist) }) : '';
      if (a.ok && a.already) return show(a.late ? 'late' : 'good', tfill_('atAlready', { at: a.at }), saved);
      if (a.ok) {
        return a.late ? show('late', tfill_('atLate', { at: a.at, m: atDur(a.minsLate) }), (how ? how + ' ' : '') + (saved || t('atLateWhy')))
                      : show('good', tfill_('atOnTime', { at: a.at }), (how ? how + ' ' : '') + saved);
      }
      if (w === 'holiday') return show('bad', tfill_('atHoliday', { name: lang === 'am' && a.nameAm ? a.nameAm : (a.name || '') }));
      if (w === 'far') { show('bad', tfill_('atFar', { m: atMetres(a.dist) }), t('atFarSub')); button(t('atTryAgain'), place); return; }
      if (w === 'loc-poor') { show('bad', tfill_('atLocPoor', { m: atMetres(a.acc) }), t('atLocPoorSub')); button(t('atTryAgain'), place); return; }
      if (w === 'no-spot') return show('bad', t('atNoSpot'));
      var msg = { 'not-wifi': 'atNotWifi', 'no-wifi-set': 'atNoWifiSet', sunday: 'atSunday', 'not-office': 'atNotOffice',
                  signin: 'atSignIn' }[w] || 'atFailed';
      show('bad', t(msg), a.ip ? tfill_('atAddr', { ip: a.ip }) : '');
    }
    /* the Chairman's own scan says where his phone stands — and, at the
       office, saves its place for the days the WiFi has no internet */
    function chairAnswer(a, w) {
      var addr = tfill_('atAddr', { ip: a.ip || '—' });
      if (a.ok && !a.place) return show('good', t('atChairOk'), addr);
      if (a.ok) return show('good', tfill_('atChairNear', { m: atMetres(a.dist) }), addr);
      if (w === 'loc-poor') { show('bad', tfill_('atLocPoor', { m: atMetres(a.acc) }), t('atLocPoorSub')); button(t('atTryAgain'), place); return; }
      if (w !== 'far' && w !== 'no-spot') return show('bad', t('atFailed'));
      show(w === 'far' ? 'bad' : 'wait', w === 'far' ? tfill_('atChairFar', { m: atMetres(a.dist) }) : t('atChairNoSpot'), addr);
      if (!lastLoc) return;
      var loc = lastLoc, armed = false;
      button(t('atSpotSave'), function (b) {
        if (loc.acc > 100) { show('bad', tfill_('atSpotPoor', { m: atMetres(loc.acc) })); button(t('atTryAgain'), place); return; }
        if (!armed) { armed = true; b.disabled = false; b.textContent = t('atSure'); return; }
        window.FB.setAttendSpot(loc, 'chairman-scan').then(function () {
          show('good', t('atSpotSaved'), tfill_('atSpotSavedSub', { acc: atMetres(loc.acc) }));
        }, function (e) { show('bad', t('atSetFailed') + ' ' + ((e && e.message) || e)); });
      });
    }
    send().then(answer, failed);
    return box;
  }
  /* "35 m", "1.2 km" */
  function atMetres(m) {
    m = Math.max(0, Math.round(Number(m) || 0));
    if (m < 1000) return m + (lang === 'am' ? ' ሜትር' : ' m');
    return (m / 1000).toFixed(1) + (lang === 'am' ? ' ኪ.ሜ' : ' km');
  }
  /* Where the phone is: the best fix in a few seconds — a first fix is often
     rough — as {lat, lng, acc}, or {err: 'denied' | 'none'}. Done at once
     within 30 m, at 6 s within 100 m, else the best by 15 s. */
  function atWhere() {
    return new Promise(function (done) {
      var g = navigator.geolocation, best = null, id = null, over = false, t1 = 0, t2 = 0;
      function end(x) {
        if (over) return;
        over = true;
        clearTimeout(t1); clearTimeout(t2);
        if (id !== null) { try { g.clearWatch(id); } catch (e) {} }
        done(x);
      }
      if (!g) return done({ err: 'none' });
      t1 = setTimeout(function () { if (best && best.acc <= 100) end(best); }, 6000);
      t2 = setTimeout(function () { end(best || { err: 'none' }); }, 15000);
      try {
        id = g.watchPosition(function (p) {
          var c = p.coords, x = { lat: c.latitude, lng: c.longitude, acc: Math.round(c.accuracy || 99999) };
          if (!best || x.acc < best.acc) best = x;
          if (best.acc <= 30) end(best);
        }, function (e) {
          if (e && e.code === 1) end({ err: 'denied' });
        }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
      } catch (e) { end({ err: 'none' }); }
    });
  }

  /* the person's own days: today, and the working days of the week before
     that have no scan and no reason yet; then their Ethiopian month (the
     user, 14 Oct 2026: "the person who scans sees his month — missed, late
     or on time") */
  var stopAt = null;
  /* The factory's heads (Amaha, Wude, Alemaya) check in by face at the
     gate's tablet (js/gate.js, 14 Oct 2026): the same card, the gate's words
     ('gt…' in place of 'at…' where the place is named), and counted from the
     day the Chairman started the gate — until then a scan shows as a test
     and nothing is asked. */
  var atKind = 'at', gateFrom, stopGateConf = null, gateRedraw = null;
  function atT(k) {
    var g = atKind === 'gt' && T[lang]['gt' + k.slice(2)];
    return g || t(k);
  }
  var atKept = null;
  function attendCard(p) {
    if (atKept && p && atKept.key === p.id + '|' + stamp()) return atKept;
    if (stopAt) { try { stopAt(); } catch (e) {} stopAt = null; }
    var wrap = el('div', 'atcard');
    if (!p || !(p.scan || p.gate) || AUTH.isChairman() || !window.FB || !window.FB.live() || !window.FB.watchMyAttend) return wrap;
    /* one who starts scanning later: counted from that day (js/forms.js scanPerson) */
    if (typeof scanPerson === 'function') p = scanPerson(p);
    atKept = wrap;
    wrap.key = p.id + '|' + stamp();
    atKind = p.gate && !p.scan ? 'gt' : 'at';
    if (atKind === 'gt' && !stopGateConf && window.FB.watchGateConf) {
      stopGateConf = window.FB.watchGateConf(function (d) { gateFrom = d || null; if (gateRedraw) gateRedraw(); });
    }
    var mstart = ethMonthStart(stamp()), back = addDays(stamp(), -7);
    var docs = null;
    function draw() {
      if (!docs) return;
      if (typingIn(wrap, draw)) return;
      var from = atKind === 'gt' ? gateFrom || '9999-12-31'
                                 : typeof ATTEND_FROM === 'string' ? ATTEND_FROM : '2026-10-19';
      var by = {};
      docs.forEach(function (d) { by[d.day] = d; });
      wrap.innerHTML = '';
      var today = stamp();
      var a = addis(), nowMin = a.getUTCHours() * 60 + a.getUTCMinutes();
      var rows = [];
      for (var i = 7; i >= 1; i--) {
        var d = addDays(today, -i);
        if (d < from || (p.from && d < p.from) || dowOf(d) === 0 || atOffOn(d)) continue;
        var x = atReal(by[d]);
        if (x && (x.why || (x.scanAt && !x.late))) continue;
        rows.push(atDay(d, x, false));
      }
      if (dowOf(today) !== 0 && (!p.from || today >= p.from)) {
        /* before the first counted day, a test scan still shows — and nothing is asked */
        if (today >= from) rows.push(atDay(today, by[today], true, nowMin));
        else if (by[today] && by[today].scanAt) rows.push(atDay(today, by[today], true, nowMin));
      }
      wrap.appendChild(el('h2', 'eyebrow', atT('atTitle')));
      rows.forEach(function (r) { wrap.appendChild(r); });
      wrap.appendChild(atMonth(p, by, today, nowMin, from));
    }
    gateRedraw = atKind === 'gt' ? draw : null;
    stopAt = window.FB.watchMyAttend(mstart < back ? mstart : back, function (list) { docs = list; draw(); });
    return wrap;
  }
  /* The month so far: on time / late / missed, and each day with its reason.
     A day before the first counted one shows only if scanned, as a test. */
  /* The month so far, every day one by one with the time they checked in
     (the user, 14 Oct 2026: "instead of like this, each day one by one with
     the time they logged in"): oldest first, Sundays shown as off, the
     reason under a late or missed day; the counts in one line. A day before
     the first counted one shows only if scanned, as a test. */
  function atMonth(p, by, today, nowMin, from) {
    var start = ethMonthStart(today);
    if (p.from && p.from > start) start = p.from;
    var n = { on: 0, late: 0, missed: 0 }, rows = [];
    for (var d = start; d <= today; d = addDays(d, 1)) {
      var x = atReal(by[d]), test = d < from;
      if (test && !(x && x.scanAt)) continue;
      var st, cls, why = '';
      if (dowOf(d) === 0) { st = t('atSundayOff'); cls = 'off'; }
      else if (holidayOn(d)) { st = t('atHolidayOff') + ' · ' + L(holidayOn(d)); cls = 'off'; }
      else if (atOffOn(d)) { st = (x && x.scanAt ? '✓ ' + x.hm + ' · ' : '') + t('atOffShort') + ' · ' + L(atOffOn(d)); cls = 'off'; }
      else if (x && x.scanAt && !x.late) { st = '✓ ' + x.hm; cls = 'good'; if (!test) n.on++; }
      else if (x && x.scanAt) { st = '! ' + tfill_('atLateShortMine', { at: x.hm, m: atDur(x.minsLate) }); cls = 'late'; if (!test) n.late++; }
      else if (d === today) {
        if (nowMin <= AT_LATE && !(x && x.why)) { st = atT('atNotYetToday'); cls = 'none'; }
        else { st = t('atNotYet'); cls = 'none'; }
      }
      else { st = '✕ ' + t('atMissed'); cls = 'missed'; n.missed++; }
      if (x && x.why) why = atWhyText(x.why, x.note);
      else if (!test && (cls === 'late' || cls === 'missed')) why = t('atNoReasonYet');
      if (test) why = (why ? why + ' · ' : '') + t('atTest');
      rows.push({ day: d, text: st, why: why, cls: cls, today: d === today });
    }
    var box = el('div', 'ins atmine');
    box.appendChild(el('div', 'inst', tfill_('atMineTitle', { month: ethMonthName(today) })));
    box.appendChild(el('div', 'atcountline', tfill_('atCountLine', { on: n.on, late: n.late, missed: n.missed })));
    if (!rows.length) { box.appendChild(el('div', 'atsub', t('atMineNone'))); return box; }
    var list = el('div', 'atdays');
    rows.forEach(function (l) {
      var r = el('div', 'atdl ' + l.cls + (l.today ? ' today' : ''));
      var left = el('div', 'atdd');
      left.appendChild(el('span', null, ethDayLabel(l.day)));
      if (l.today) left.appendChild(el('span', 'attoday', t('atToday')));
      r.appendChild(left);
      r.appendChild(el('div', 'atds', l.text));
      if (l.why) r.appendChild(el('div', 'atdw', l.why));
      list.appendChild(r);
    });
    box.appendChild(list);
    return box;
  }
  /* a scan at the gate that Amaha or the Chairman said was someone else's is no scan */
  /* …unless the person's own face was seen after it (`face`, Gate.js): then that is the arrival */
  function atReal(x) {
    if (!x || x.check !== 'not') return x;
    var y = {};
    Object.keys(x).forEach(function (k) { if (['scanAt', 'hm', 'late', 'minsLate', 'how'].indexOf(k) === -1) y[k] = x[k]; });
    if (x.face && x.face.at) { y.scanAt = x.face.at; y.hm = x.face.hm; y.late = !!x.face.late; y.minsLate = x.face.minsLate || 0; y.how = 'face'; }
    return y;
  }
  /* a day the check-in is not counted (js/forms.js ATTEND_OFF, 20 Oct 2026) */
  function atOffOn(d) { return typeof attendOff === 'function' ? attendOff(d) : null; }
  function atDay(day, x, isToday, nowMin, noAsk) {
    x = atReal(x);
    var box = el('div', 'ins at');
    var label = isToday ? t('atToday') : dayLabel(day);
    if (atOffOn(day)) {
      box.className = 'ins at' + (x && x.scanAt ? ' good' : '');
      box.appendChild(el('div', 'inst', label + ' · ' + (x && x.scanAt ? '✓ ' + x.hm : atT('atScanHow'))));
      box.appendChild(el('div', 'atsub', tfill_('atOffDay', { why: L(atOffOn(day)) })));
      return box;
    }
    if (x && x.scanAt && !x.late) {
      box.className = 'ins at good';
      box.appendChild(el('div', 'inst', label + ' · ' + tfill_('atOnTime', { at: x.hm })));
      return box;
    }
    if (x && x.scanAt && x.late) {
      box.className = 'ins at late';
      box.appendChild(el('div', 'inst', label + ' · ' + tfill_('atLate', { at: x.hm, m: atDur(x.minsLate) })));
      if (x.why) box.appendChild(el('div', 'atsub', t('atWhyIs') + ' ' + atWhyText(x.why, x.note)));
      else if (!noAsk) box.appendChild(atAsk(day, true, x));
      return box;
    }
    if (isToday && nowMin <= AT_LATE && !(x && x.why)) {
      box.appendChild(el('div', 'inst', label + ' · ' + atT('atScanHow')));
      /* the WiFi without internet: mobile data, and the place is checked (23 Oct 2026) */
      if (atKind === 'at') box.appendChild(el('div', 'atsub', t('atNoNet')));
      return box;
    }
    box.className = 'ins at missing';
    box.appendChild(el('div', 'inst', label + ' · ' + t('atNoScan')));
    if (x && x.why) box.appendChild(el('div', 'atsub', t('atWhyIs') + ' ' + atWhyText(x.why, x.note)));
    else {
      if (isToday) box.appendChild(el('div', 'atsub', atT('atScanOrSay')));
      if (isToday && atKind === 'at') box.appendChild(el('div', 'atsub', t('atNoNet')));
      box.appendChild(atAsk(day, false, x));
    }
    return box;
  }
  function atWhyText(why, note) {
    return atT('atWhy_' + why) + (note ? ' — ' + note : '');
  }
  /* the reasons, a tap each; a few words for "Other" */
  function atAsk(day, late, x, save) {
    var f = el('div', 'atask');
    var picks = el('div', 'atpicks');
    var chosen = null;
    var note = el('input', 'mfbox atnote');
    note.type = 'text';
    note.maxLength = 300;
    note.placeholder = t('atNote');
    note.setAttribute('aria-label', t('atNote'));
    var go = el('button', 'pushbtn insgo', t('atSend'));
    go.type = 'button';
    go.disabled = true;
    function check() { go.disabled = !chosen || (chosen === 'other' && !note.value.trim()); }
    (late ? AT_WHY_LATE : AT_WHY_NOSCAN).forEach(function (w) {
      var b = el('button', 'mfpick', atT('atWhy_' + w));
      b.type = 'button';
      b.onclick = function () {
        chosen = w;
        Array.prototype.forEach.call(picks.children, function (c) { c.classList.toggle('on', c === b); });
        check();
      };
      picks.appendChild(b);
    });
    note.oninput = check;
    go.onclick = function () {
      if (go.disabled) return;
      go.disabled = true;
      (save || window.FB.saveAttendWhy)(day, chosen, note.value.trim(), !!x).then(function () {
        toast(t('atThanks'));
      }, function () {
        go.disabled = false;
        toast(t('atSendFailed'));
      });
    };
    f.appendChild(el('div', 'atq', t(late ? 'atWhyLate' : 'atWhyNoScan')));
    f.appendChild(picks);
    f.appendChild(note);
    var bar = el('div', 'insbox');
    bar.appendChild(go);
    f.appendChild(bar);
    return f;
  }

  /* AMAHA'S CARD: the factory gate today (the user, 14 Oct 2026: "the next
     step, for production, is a face scan — they don't have phones"). Who is
     in and when, who is not; a tapped name's picture to say yes or no to;
     and why, for the workers who have no phone to say it themselves — today
     and the working days of the week before. From /attend (place
     'factory'), /gatephoto, /faces and /gateconf (js/gate.js, Gate.js).
     One card for the page's life: the home page redraws itself as reports
     come in, and a reason half typed must not go with it. */
  var gateHeadBox = null;
  function gateHeadCard(p) {
    if (!p || p.id !== 'amaha' || AUTH.isChairman() || !window.FB || !window.FB.live() || !window.FB.watchFactory) return el('div');
    /* a page left open overnight: the new day gets a new card (the bug hunt,
       15 Oct 2026 — it kept showing yesterday as today, and saved reasons to it) */
    if (gateHeadBox && gateHeadBox.day !== stamp()) {
      (gateHeadBox.stops || []).forEach(function (s) { try { if (s) s(); } catch (e) {} });
      gateHeadBox = null;
    }
    if (gateHeadBox) return gateHeadBox;
    var wrap = gateHeadBox = el('div', 'atcard gthead');
    var today = wrap.day = stamp();
    var st = { docs: null, photos: {}, faces: null, from: undefined, wk: window.FB.watchWorkers ? undefined : null };
    function draw() {
      if (!st.docs || !st.faces || st.from === undefined || st.wk === undefined) return;
      var a = document.activeElement;
      if (a && a.tagName === 'INPUT' && wrap.contains(a)) {
        a.addEventListener('blur', function again() { a.removeEventListener('blur', again); setTimeout(draw, 200); });
        return;
      }
      drawGateHead(wrap, st, today);
    }
    /* a read that failed (null) is not "nobody came": the card waits */
    wrap.stops = [
      window.FB.watchFactory(addDays(today, -7), function (d) { if (d) { st.docs = d; draw(); } }),
      window.FB.watchGatePhotos(today, function (ph) { st.photos = ph || {}; draw(); }),
      window.FB.watchFaces(function (f) { if (f) { st.faces = f; draw(); } }),
      window.FB.watchGateConf(function (d) { st.from = d || null; draw(); })
    ].concat(window.FB.watchWorkers ? [window.FB.watchWorkers(function (wk) { st.wk = wk; draw(); })] : []);
    return wrap;
  }
  /* AMAHA'S PRODUCTION TEAM (the user, 17 Oct 2026: "for the production
     team, can Amaha add new persons by himself"). The workers at the
     factory: the code's and the ones he added (/workers, js/fb.js). He adds
     one — name, job, the day they start, a phone if they have one — and it
     counts at once: his lists, the gate. He says when one has left, with the
     last day worked (/workersLeft); they go from the day after. The Chairman
     is told on his page. Never a wage: the payroll stays the Sheet's. */
  var WORKER_JOBS = [
    { en: 'Production Worker', am: 'የምርት ሠራተኛ' }, { en: 'Machine Operator', am: 'የማሽን ኦፕሬተር' },
    { en: 'Helper', am: 'ረዳት' }, { en: 'Painter', am: 'ቀለም ቀቢ' },
    { en: 'Cleaner', am: 'የጽዳት ሠራተኛ' }, { en: 'Guard', am: 'ጥበቃ' }
  ];
  var teamBox = null;
  function teamCard(p) {
    if (!p || p.id !== 'amaha' || AUTH.isChairman() || !window.FB || !window.FB.live() || !window.FB.watchWorkers) return el('div');
    if (teamBox) return teamBox;
    var wrap = teamBox = el('div', 'atcard tmcard');
    var st = { wk: undefined, adding: false, leaving: null, form: {} };
    function draw() {
      if (st.wk === undefined) return;
      if (typingIn(wrap, draw)) return;
      drawTeam(wrap, st, draw);
    }
    wrap.redraw = draw;
    wrap.stops = [window.FB.watchWorkers(function (wk) { st.wk = wk; draw(); })];
    return wrap;
  }
  function drawTeam(wrap, st, redraw) {
    wrap.innerHTML = '';
    var today = stamp();
    wrap.appendChild(el('h2', 'eyebrow', t('tmTitle')));
    if (st.wk === null) { wrap.appendChild(el('p', 'codenote', t('tmNoRead'))); return; }
    var team = window.FB.gateTeam(st.wk).filter(function (q) { return q.worker; });
    var byName = function (a, b) { return L(a) < L(b) ? -1 : 1; };
    var now = team.filter(function (q) { return !(q.left && q.left < today); }).sort(byName);
    var gone = team.filter(function (q) { return q.left && q.left < today; }).sort(byName);
    var box = el('div', 'ins tmlist');
    box.appendChild(el('div', 'atsub', t('tmHow')));
    /* twenty-odd names: folded under one line, open while he works in it */
    var list = el('details', 'tmall');
    list.open = !!st.open || !!st.leaving;
    list.ontoggle = function () { st.open = list.open; };
    list.appendChild(el('summary', 'atcounts', tfill_('tmCount', { n: now.length })));
    now.forEach(function (q) { list.appendChild(teamRow(q, st, redraw, today)); });
    box.appendChild(list);
    wrap.appendChild(box);
    if (st.adding) wrap.appendChild(teamAdd(st, redraw, today));
    else {
      var add = el('button', 'pushbtn tmaddbtn', t('tmAdd'));
      add.type = 'button';
      add.onclick = function () { st.adding = true; st.form = {}; redraw(); };
      wrap.appendChild(add);
    }
    if (gone.length) {
      var det = el('details', 'tmgone');
      det.appendChild(el('summary', null, tfill_('tmGone', { n: gone.length })));
      gone.forEach(function (q) { det.appendChild(teamRow(q, st, redraw, today)); });
      wrap.appendChild(det);
    }
  }
  function teamRow(q, st, redraw, today) {
    var r = el('div', 'tmrow' + (q.left && q.left < today ? ' gone' : ''));
    r.id = 'tm_' + q.id;
    var w = el('div', 'tmname');
    w.appendChild(el('div', 'tmn', L(q)));
    var job = lang === 'am' ? (q.roleAm || q.roleEn) : q.roleEn;
    var notes = [job];
    if (q.added) notes.push(tfill_('tmAddedOn', { day: q.at && q.at.toDate ? dayLabel(ymdOf(addis(q.at.toDate().getTime()))) : '' }));
    if (q.from && q.from > today) notes.push(tfill_('tmStarts', { day: dayLabel(q.from) }));
    if (q.left) notes.push(tfill_('tmLastIs', { day: dayLabel(q.left) }));
    w.appendChild(el('div', 'atsub', notes.filter(Boolean).join(' · ')));
    r.appendChild(w);
    var acts = el('div', 'tmacts');
    if (q.left) {
      var back = el('button', 'mfpick', t('tmUndo'));
      back.type = 'button';
      back.onclick = function () {
        back.disabled = true;
        window.FB.setWorkerLeft(q.id, '').then(function () { toast(t('tmBackSaved')); }, function () { back.disabled = false; toast(t('tmFailed')); });
      };
      acts.appendChild(back);
    } else if (st.leaving === q.id) {
      var lab = el('label', 'atsub', t('tmLastDay'));
      var d = el('input');
      d.type = 'date';
      d.value = today;
      d.max = addDays(today, 30);
      if (q.from) d.min = q.from;
      d.id = 'tmday_' + q.id;
      lab.htmlFor = d.id;
      acts.appendChild(lab);
      acts.appendChild(dressDate(d));
      var go = el('button', 'pushbtn', t('tmMarkLeft'));
      go.type = 'button';
      go.onclick = function () {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d.value)) { d.focus(); return; }
        go.disabled = true;
        window.FB.setWorkerLeft(q.id, d.value).then(function () {
          st.leaving = null;
          toast(t('tmLeftSaved'));
          redraw();
        }, function () { go.disabled = false; toast(t('tmFailed')); });
      };
      acts.appendChild(go);
      var no = el('button', 'mfpick', t('tmCancel'));
      no.type = 'button';
      no.onclick = function () { st.leaving = null; redraw(); };
      acts.appendChild(no);
    } else {
      var lb = el('button', 'mfpick tmleft', t('tmLeftBtn'));
      lb.type = 'button';
      lb.onclick = function () { st.leaving = q.id; redraw(); };
      acts.appendChild(lb);
    }
    r.appendChild(acts);
    return r;
  }
  function teamAdd(st, redraw, today) {
    var f = st.form;
    var box = el('div', 'ins tmform');
    box.appendChild(el('div', 'inst', t('tmAddTitle')));
    function field(key, label, type) {
      var lab = el('label', 'tmlab', t(label));
      var i = el('input');
      i.type = type || 'text';
      i.id = 'tm_' + key;
      lab.htmlFor = i.id;
      i.value = f[key] || '';
      i.oninput = function () { f[key] = i.value; };
      box.appendChild(lab);
      box.appendChild(i);
      return i;
    }
    var nameIn = field('en', 'tmName');
    nameIn.autocomplete = 'off';
    field('am', 'tmNameAm').autocomplete = 'off';
    box.appendChild(el('div', 'tmlab', t('tmJob')));
    var jobs = el('div', 'chips tmjobs');
    var other = el('input');
    other.type = 'text';
    other.id = 'tm_jobOther';
    other.placeholder = t('tmJobOther');
    other.setAttribute('aria-label', t('tmJobOther'));
    other.value = f.jobOther || '';
    other.hidden = f.job !== 'other';
    other.oninput = function () { f.jobOther = other.value; };
    WORKER_JOBS.concat([{ en: 'other', am: '', other: 1 }]).forEach(function (j) {
      var b = el('button', 'chip', j.other ? t('tmOther') : L(j));
      b.type = 'button';
      b.setAttribute('data-v', j.en);
      b.setAttribute('aria-pressed', f.job === j.en ? 'true' : 'false');
      b.onclick = function () {
        f.job = j.en;
        msg.hidden = true;
        Array.prototype.forEach.call(jobs.children, function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
        other.hidden = !j.other;
        if (j.other) other.focus();
      };
      jobs.appendChild(b);
    });
    box.appendChild(jobs);
    box.appendChild(other);
    var fromLab = el('label', 'tmlab', t('tmFrom'));
    var fromIn = el('input');
    fromIn.type = 'date';
    fromIn.id = 'tm_from';
    fromLab.htmlFor = fromIn.id;
    fromIn.value = f.from || today;
    fromIn.min = addDays(today, -30);
    fromIn.max = addDays(today, 60);
    fromIn.onchange = fromIn.oninput = function () { f.from = fromIn.value; };
    box.appendChild(fromLab);
    box.appendChild(dressDate(fromIn));
    var phoneIn = field('phone', 'tmPhone');
    phoneIn.inputMode = 'tel';
    var msg = el('p', 'pywarn');
    msg.hidden = true;
    box.appendChild(msg);
    var bar = el('div', 'tmbar');
    var save = el('button', 'pushbtn', t('tmSave'));
    save.type = 'button';
    save.onclick = function () {
      var name = String(f.en || '').trim();
      var jobEn = f.job === 'other' ? String(f.jobOther || '').trim() : f.job;
      if (!name) { msg.textContent = t('tmNeedName'); msg.hidden = false; nameIn.focus(); return; }
      if (!jobEn) { msg.textContent = t('tmNeedJob'); msg.hidden = false; return; }
      var known = WORKER_JOBS.filter(function (j) { return j.en === jobEn; })[0];
      var from = /^\d{4}-\d{2}-\d{2}$/.test(fromIn.value) ? fromIn.value : today;
      var taken = {};
      PEOPLE.forEach(function (q) { taken[q.id] = 1; });
      ((st.wk && st.wk.added) || []).forEach(function (w) { taken[w.id] = 1; });
      save.disabled = true;
      window.FB.addWorker({ en: name, am: f.am, roleEn: jobEn, roleAm: known ? known.am : '', from: from, phone: f.phone }, taken).then(function () {
        toast(tfill_('tmAdded', { name: name }));
        st.adding = false;
        st.form = {};
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        redraw();
      }, function () { save.disabled = false; msg.textContent = t('tmFailed'); msg.hidden = false; });
    };
    bar.appendChild(save);
    var cancel = el('button', 'mfpick', t('tmCancel'));
    cancel.type = 'button';
    cancel.onclick = function () { st.adding = false; st.form = {}; redraw(); };
    bar.appendChild(cancel);
    box.appendChild(bar);
    return box;
  }

  /* Amaha's lists of workers — absent, late, overtime — pick from WORKERS
     (js/forms.js): with the workers he added, and without those he marked
     left before the day being reported. The last team seen is kept on the
     phone (a per-phone convenience) so the lists have it on opening. */
  function teamIntoPicks(day) {
    if (typeof WORKERS === 'undefined' || !Array.isArray(WORKERS) || !window.FB || !window.FB.gateTeam) return;
    var base = WORKERS.__code || (WORKERS.__code = WORKERS.slice());
    function apply(wk) {
      if (!wk) return;
      var team = window.FB.gateTeam(wk), byId = {};
      team.forEach(function (q) { byId[q.id] = q; });
      var out = [];
      base.forEach(function (o) {
        var q = PEOPLE.filter(function (x) { return x.en === o.v && x.worker; })[0];
        if (q && byId[q.id] && byId[q.id].left && byId[q.id].left < day) return;
        if (o.v === 'Someone else') return;
        out.push(o);
      });
      team.forEach(function (q) {
        if (!q.added || !window.FB.onTeam(q, day)) return;
        out.push({ v: q.en, en: q.en, am: q.am || q.en });
      });
      base.filter(function (o) { return o.v === 'Someone else'; }).forEach(function (o) { out.push(o); });
      WORKERS.length = 0;
      out.forEach(function (o) { WORKERS.push(o); });
    }
    try { apply(JSON.parse(localStorage.getItem('klever.team') || 'null')); } catch (e) {}
    if (!window.FB.watchWorkers) return;
    var stop = null;
    stop = window.FB.watchWorkers(function (wk) {
      if (!wk) return;
      try { localStorage.setItem('klever.team', JSON.stringify({ added: wk.added.map(function (w) {
        return { id: w.id, en: w.en, am: w.am, roleEn: w.roleEn, roleAm: w.roleAm, from: w.from, removed: !!w.removed };
      }), left: wk.left })); } catch (e) {}
      apply(wk);
      if (stop) { try { stop(); } catch (e) {} }
    });
  }

  /* everyone at the gate: `gate` in js/forms.js, the workers Amaha added
     (/workers, with the days they started and left), and the payroll-only
     people whose face was added */
  function gatePeopleOf(faces, wk) {
    var team = window.FB && window.FB.gateTeam ? window.FB.gateTeam(wk)
             : PEOPLE.filter(function (q) { return q.gate && !q.company; });
    var out = team.map(function (q) { return { id: q.id, en: q.en, am: q.am, worker: !!q.worker, from: q.from || null, left: q.left || null }; });
    var have = {};
    out.forEach(function (q) { have[q.id] = 1; });
    (faces || []).forEach(function (f) {
      if (f.person && !have[f.person]) { have[f.person] = 1; out.push({ id: f.person, en: f.name || f.person, am: '', worker: true }); }
    });
    return out;
  }
  function drawGateHead(wrap, st, today) {
    wrap.innerHTML = '';
    atKind = 'gt';
    var everyone = gatePeopleOf(st.faces, st.wk);
    /* at the factory that day: started, and not past the last day worked */
    var onDay = function (q, d) { return !(q.from && d < q.from) && !(q.left && d > q.left); };
    var people = everyone.filter(function (q) { return onDay(q, today); });
    var counting = !!st.from && today >= st.from;
    var by = {};
    st.docs.forEach(function (d) { (by[d.day] = by[d.day] || {})[d.person] = d; });
    var a = addis(), nowMin = a.getUTCHours() * 60 + a.getUTCMinutes();
    wrap.appendChild(el('h2', 'eyebrow', t('gtHeadTitle')));
    var box = el('div', 'ins gtday');
    box.appendChild(el('div', 'atsub', counting ? tfill_('gtCounting', { day: dayLabel(st.from) }) : t('gtNotCounting')));
    var go = el('a', 'pushbtn gtgo', t('gtAddFaces'));
    go.href = 'gate.html';
    box.appendChild(go);
    var faced = {};
    (st.faces || []).forEach(function (f) { faced[f.person] = 1; });
    var noFace = people.filter(function (q) { return !faced[q.id]; });
    if (noFace.length) box.appendChild(el('div', 'atsub gtnoface', tfill_('gtNoFaceYet', { names: noFace.map(L).join(', ') })));
    wrap.appendChild(box);
    var saver = function (id) {
      return function (day, why, note, exists) { return window.FB.saveGateWhy(id, day, why, note, exists); };
    };
    /* one small "Why?" a person; the reasons open on a tap — twenty
       pickers at once would bury the list */
    function askLater(day, late, x0, id) {
      var b = el('button', 'mfpick gtwhy', t(late ? 'atWhyLate' : 'atWhyNoScan'));
      b.type = 'button';
      b.onclick = function () { b.replaceWith(atAsk(day, late, x0, saver(id))); };
      return b;
    }
    function photoOf(day, id) {
      var pic = el('img', 'gtpic');
      pic.alt = '';
      if (day === today && st.photos[id]) pic.src = st.photos[id];
      else if (window.FB.gatePhoto) window.FB.gatePhoto(day, id).then(function (src) { if (src) pic.src = src; });
      return pic;
    }
    function check(q, day, x, into) {
      var c = el('div', 'gtcheck');
      var pics = el('div', 'gtpics');
      pics.appendChild(photoOf(day, q.id));
      if (x.face) pics.appendChild(photoOf(day, q.id + '_face'));
      c.appendChild(pics);
      var right = el('div');
      right.appendChild(el('div', 'atq', tfill_('gtCheckIt', { name: L(q) })));
      if (x.face) right.appendChild(el('div', 'atsub', tfill_('gtFaceToo', { name: L(q), at: x.face.hm })));
      var bar = el('div', 'atpicks');
      [[true, 'gtItIs'], [false, 'gtNotThem']].forEach(function (o) {
        var b = el('button', 'mfpick', t(o[1]));
        b.type = 'button';
        b.onclick = function () {
          b.disabled = true;
          window.FB.checkGate(q.id, day, o[0]).then(function () { toast(t('atThanks')); }, function () { b.disabled = false; toast(t('atSendFailed')); });
        };
        bar.appendChild(b);
      });
      right.appendChild(bar);
      c.appendChild(right);
      into.appendChild(c);
    }
    /* today, everyone */
    if (dowOf(today) === 0) wrap.appendChild(el('p', 'codenote', t('atSundayOff')));
    else if (holidayOn(today)) wrap.appendChild(el('p', 'codenote', t('atHolidayOff') + ' · ' + L(holidayOn(today))));
    else {
      if (atOffOn(today)) wrap.appendChild(el('p', 'codenote', tfill_('atOffDay', { why: L(atOffOn(today)) })));
      var n = { on: 0, late: 0, none: 0 };
      var list = el('div', 'ins gtlistday');
      people.forEach(function (q) {
        var x0 = (by[today] || {})[q.id], x = atReal(x0);
        var r = el('div', 'atdl');
        var left = el('div', 'atdd');
        left.appendChild(el('span', null, L(q)));
        r.appendChild(left);
        var s, cls;
        if (x && x.scanAt && !x.late) { s = '✓ ' + x.hm; cls = 'good'; n.on++; }
        else if (x && x.scanAt) { s = '! ' + tfill_('atLateShortMine', { at: x.hm, m: atDur(x.minsLate) }); cls = 'late'; n.late++; }
        else { s = nowMin <= AT_LATE ? t('gtNotIn') : '✕ ' + t('atNoScanShort'); cls = nowMin <= AT_LATE ? 'none' : 'missed'; n.none++; }
        r.className = 'atdl ' + cls;
        r.appendChild(el('div', 'atds', s));
        var notes = [];
        if (x0 && x0.how === 'tap') notes.push(t('gtByTap'));
        if (x0 && x0.check === 'ok') notes.push(t('gtCheckedOk'));
        if (x0 && x0.check === 'not') notes.push(t(x && x.scanAt ? 'gtCheckedNotFace' : 'gtCheckedNot'));
        if (x && x.why) notes.push(t('atWhyIs') + ' ' + atWhyText(x.why, x.note));
        if (notes.length) r.appendChild(el('div', 'atdw', notes.join(' · ')));
        list.appendChild(r);
        if (x0 && x0.how === 'tap' && x0.check === 'open' && q.id !== 'amaha') check(q, today, x0, list);
        if (counting && !atOffOn(today) && q.worker && !(x && x.why) && (cls === 'late' || cls === 'missed')) {
          r.appendChild(askLater(today, cls === 'late', x0, q.id));
        }
      });
      wrap.appendChild(el('p', 'atcounts', tfill_('gtHeadCounts', n)));
      wrap.appendChild(list);
    }
    /* the week before: a tapped name not looked at; a worker with no reason */
    var earlier = el('div');
    for (var i = 1; i <= 7; i++) {
      var d = addDays(today, -i);
      if (dowOf(d) === 0) continue;
      everyone.forEach(function (q) {
        if (!onDay(q, d)) return;
        var x0 = (by[d] || {})[q.id], x = atReal(x0);
        if (x0 && x0.how === 'tap' && x0.check === 'open' && q.id !== 'amaha') {
          var row = el('div', 'ins at');
          row.appendChild(el('div', 'inst', dayLabel(d) + ' · ' + L(q) + ' · ' + x0.hm));
          check(q, d, x0, row);
          earlier.appendChild(row);
        }
        if (!counting || d < st.from || atOffOn(d) || !q.worker || (x && x.why) || (x && x.scanAt && !x.late)) return;
        var late = !!(x && x.scanAt);
        var r = el('div', 'ins at ' + (late ? 'late' : 'missing'));
        r.appendChild(el('div', 'inst', dayLabel(d) + ' · ' + L(q) + ' · ' +
                         (late ? tfill_('atLateShortMine', { at: x.hm, m: atDur(x.minsLate) }) : t('atNoScanShort'))));
        r.appendChild(askLater(d, late, x0, q.id));
        earlier.appendChild(r);
      });
    }
    if (earlier.children.length) {
      wrap.appendChild(el('p', 'skysub', t('gtWorkersWhy')));
      wrap.appendChild(earlier);
    }
  }

  /* What only Selam knows, for the payroll: overtime hours, loans, salary
     advances, cost sharing, court deductions (the user, 14 Oct 2026: "on
     Selam's page, by the 5th"). One card for each month still open — this
     one, and last month until the 5th. She lists only the people who have
     any; the script reads them into the payroll (/payadd/{month}). */
  var PA_FIELDS = [['ot15', 'paOt15'], ['ot175', 'paOt175'], ['ot2', 'paOt2'], ['ot25', 'paOt25'],
                   ['loan', 'paLoan'], ['advance', 'paAdvance'], ['cost', 'paCost'], ['court', 'paCourt']];
  var stopPa = null;
  var paKept = null;
  function payAddCard() {
    if (paKept && paKept.who === AUTH.who()) return paKept;
    if (stopPa) { try { stopPa(); } catch (e) {} stopPa = null; }
    var wrap = el('div', 'pacard');
    if (!window.FB || !window.FB.live() || AUTH.isChairman() || AUTH.who() !== 'betty' || !window.FB.watchPayAdd) return wrap;
    paKept = wrap;
    wrap.who = AUTH.who();
    stopPa = window.FB.watchPayAdd(function onPa(docs) {
      if (typingIn(wrap, function () { onPa(docs); })) return;
      wrap.innerHTML = '';
      docs.slice().sort(function (a, b) { return a.month < b.month ? -1 : 1; }).forEach(function (d) {
        wrap.appendChild(payAddMonth(d));
      });
    });
    return wrap;
  }
  function payAddSummary(x) {
    var parts = [];
    var hrs = [['ot15', '×1.5'], ['ot175', '×1.75'], ['ot2', '×2'], ['ot25', '×2.5']].filter(function (k) { return x[k[0]]; })
      .map(function (k) { return tfill_('pyHours', { h: x[k[0]] }) + ' ' + k[1]; });
    if (hrs.length) parts.push(t('pyOvertime') + ' ' + hrs.join(', '));
    [['loan', 'pyLoan'], ['advance', 'pyAdvance'], ['cost', 'pyCostShare'], ['court', 'pyCourt']].forEach(function (k) {
      if (x[k[0]]) parts.push(t(k[1]) + ' ' + birr2(x[k[0]]));
    });
    return parts.join(' · ');
  }
  function payAddMonth(d) {
    var box = el('div', 'ins pa');
    var y = Number(d.month.slice(0, 4)), m = Number(d.month.slice(5, 7));
    var by = (m === 12 ? (y + 1) + '-01' : y + '-' + ('0' + (m + 1)).slice(-2)) + '-05';
    box.appendChild(el('div', 'inst', tfill_('paTitle', { month: monthLabel_(d.month) }) + ' · ' + tfill_('paBy', { day: dayLabel(by) })));
    box.appendChild(el('div', 'pahow', t('paHow')));
    var people = d.people || [];
    var nameOf = function (id) { var p = people.filter(function (x) { return x.id === id; })[0]; return p ? p.name : id; };
    var items = {};
    Object.keys(d.items || {}).forEach(function (id) { items[id] = Object.assign({}, d.items[id]); });
    var list = el('div', 'palist');
    box.appendChild(list);
    var form = el('div', 'paform');
    form.hidden = true;
    box.appendChild(form);
    var addBtn = el('button', 'pushbtn paadd', t('paAdd'));
    addBtn.type = 'button';
    box.appendChild(addBtn);

    function save(next) {
      return window.FB.savePayAdd(d.month, next).then(function () { toast(t('paSaved')); }, function (e) {
        toast(tfill_('paFailed', { e: (e && e.message) || String(e) }));
        throw e;
      });
    }
    function draw() {
      list.innerHTML = '';
      var ids = Object.keys(items).filter(function (id) { return payAddSummary(items[id]); });
      if (!ids.length) list.appendChild(el('div', 'codenote', t('paNone')));
      ids.sort(function (a, b) { return nameOf(a) < nameOf(b) ? -1 : 1; }).forEach(function (id) {
        var row = el('div', 'paline');
        var txt = el('div', 'patext');
        txt.appendChild(el('div', 'paname', nameOf(id)));
        txt.appendChild(el('div', 'pawhat', payAddSummary(items[id])));
        row.appendChild(txt);
        var ed = el('button', 'mfpick', t('paEdit'));
        ed.type = 'button';
        ed.onclick = function () { open(id); };
        row.appendChild(ed);
        var rm = el('button', 'mfpick', t('paRemove'));
        rm.type = 'button';
        rm.onclick = function () {
          var next = Object.assign({}, items);
          delete next[id];
          rm.disabled = true;
          save(next).then(function () { items = next; draw(); }, function () { rm.disabled = false; });
        };
        row.appendChild(rm);
        list.appendChild(row);
      });
    }
    function open(id) {
      form.innerHTML = '';
      form.hidden = false;
      addBtn.hidden = true;
      var who = el('select', 'pawho');
      who.setAttribute('aria-label', t('paWho'));
      var o0 = el('option', null, t('paPick'));
      o0.value = '';
      who.appendChild(o0);
      people.slice().sort(function (a, b) { return a.name < b.name ? -1 : 1; }).forEach(function (p) {
        if (p.id !== id && items[p.id] && payAddSummary(items[p.id])) return;
        var o = el('option', null, p.name);
        o.value = p.id;
        who.appendChild(o);
      });
      if (id) who.value = id;
      who.disabled = !!id;
      var lw = el('label', 'pafield');
      lw.appendChild(el('span', null, t('paWho')));
      lw.appendChild(who);
      form.appendChild(lw);
      var boxes = {};
      var cur = (id && items[id]) || {};
      PA_FIELDS.forEach(function (f) {
        var lab = el('label', 'pafield');
        lab.appendChild(el('span', null, t(f[1])));
        var b = el('input', 'mfbox');
        b.type = 'text';
        b.inputMode = 'decimal';
        b.id = 'pa_' + d.month + '_' + f[0];
        b.value = cur[f[0]] ? String(cur[f[0]]) : '';
        lab.appendChild(b);
        form.appendChild(lab);
        boxes[f[0]] = b;
      });
      var go = el('button', 'pushbtn insgo', t('paSave'));
      go.type = 'button';
      var no = el('button', 'mfpick', t('paCancel'));
      no.type = 'button';
      no.onclick = function () { form.hidden = true; form.innerHTML = ''; addBtn.hidden = false; };
      go.onclick = function () {
        var pid = who.value;
        if (!pid) { who.focus(); return; }
        var x = {};
        PA_FIELDS.forEach(function (f) {
          var v = num_(boxes[f[0]].value);
          if (!isNaN(v) && v > 0) x[f[0]] = Math.round(v * 100) / 100;
        });
        var next = Object.assign({}, items);
        if (Object.keys(x).length) next[pid] = x; else delete next[pid];
        go.disabled = true;
        save(next).then(function () { items = next; no.onclick(); draw(); }, function () { go.disabled = false; });
      };
      var bar = el('div', 'insbox');
      bar.appendChild(go);
      bar.appendChild(no);
      form.appendChild(bar);
    }
    addBtn.onclick = function () { open(null); };
    draw();
    return box;
  }

  /* The readings of the agents this person owns (apps-script/Owners.js):
     the morning's and the week's, newest first, each folded to its title. */
  /* The reports sent to me (13 Oct 2026: reports are not posted in chat).
     The people a report is addressed to read it here; what came since their
     last visit is marked. The Chairman reads every report on his own page. */
  var stopTo = null;
  var toKept = null;
  /* built once for the page's life: rebuilt every minute, its open rows
     closed and its "new" marks went (the bug hunt, 15 Oct 2026) */
  function reportsToMeCard() {
    if (toKept && toKept.who === AUTH.who()) return toKept;
    if (stopTo) { try { stopTo(); } catch (e) {} stopTo = null; }
    var wrap = el('div', 'rdwrap tome');
    if (!window.FB || !window.FB.live() || AUTH.isChairman() || !window.FB.watchReportsToMe) return wrap;
    toKept = wrap; wrap.who = AUTH.who();
    var key = 'klever.toSeen.' + AUTH.who(), seen = 0;
    try { seen = Number(localStorage.getItem(key)) || 0; } catch (e) { seen = 0; }
    stopTo = window.FB.watchReportsToMe(function (all) {
      wrap.innerHTML = '';
      if (!all.length) return;
      wrap.appendChild(el('h2', 'eyebrow', t('toMeTitle')));
      var newest = seen;
      all.slice(0, 20).forEach(function (r) {
        var when = r.at && r.at.toDate ? r.at.toDate() : null, ms = when ? when.getTime() : 0;
        if (ms > newest) newest = ms;
        var rep = reportById(r.report), who = personById(r.person);
        var card = el('details', 'rdcard' + (seen && ms > seen ? ' isnew' : ''));
        var s = el('summary', 'rdcard-s');
        s.appendChild(el('span', 'rdcard-t', (who ? L(who) : r.person) + ' · ' + (rep ? L(rep) : r.report)));
        s.appendChild(el('span', 'rdcard-d', (when ? dayLabel(ymdOf(addis(ms))) + ' · ' + clockOf(when) : '') +
                                             (r.late ? ' · ' + t('toMeLate') : '')));
        card.appendChild(s);
        card.appendChild(el('div', 'rdcard-x', r.text || ''));
        wrap.appendChild(card);
      });
      try { if (newest > seen) localStorage.setItem(key, String(newest)); } catch (e) {}
    });
    return wrap;
  }

  var stopRd = null;
  var rdKept = null;
  /* built once for the page's life: rebuilt every minute, its open rows
     closed and its "new" marks went (the bug hunt, 15 Oct 2026) */
  function readingsCard() {
    if (rdKept && rdKept.who === AUTH.who()) return rdKept;
    if (stopRd) { try { stopRd(); } catch (e) {} stopRd = null; }
    var wrap = el('div', 'rdwrap');
    if (!window.FB || !window.FB.live() || AUTH.isChairman() || !window.FB.watchMyReadings) return wrap;
    rdKept = wrap; wrap.who = AUTH.who();
    stopRd = window.FB.watchMyReadings(function (all) {
      wrap.innerHTML = '';
      if (!all.length) return;
      all.sort(function (a, b) { return String(b.day || '') < String(a.day || '') ? -1 : String(b.day || '') > String(a.day || '') ? 1 : 0; });
      wrap.appendChild(el('h2', 'eyebrow', t('rdHomeTitle')));
      all.slice(0, 8).forEach(function (r) {
        var card = el('details', 'rdcard');
        var s = el('summary', 'rdcard-s');
        s.appendChild(el('span', 'rdcard-t', L(r)));
        /* the morning's reading is of the day before, closed; the week's is to its Sunday */
        var wk = r.kind === 'week', d = /^\d{4}-\d{2}-\d{2}$/.test(String(r.day || '')) ? dayLabel(r.day) : '';
        s.appendChild(el('span', 'rdcard-d', t(wk ? 'rdHomeWeek' : 'rdHomeMorning') + (d ? (wk ? ' ' : ' · ') + d : '')));
        card.appendChild(s);
        card.appendChild(el('div', 'rdcard-x', r.text || ''));
        wrap.appendChild(card);
      });
    });
    return wrap;
  }

  function daysFrom(a, b) {
    return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
  }

  /* ---------------- a report that keeps not coming ----------------

     Ephrata's Board Check was owed on 13, 14 and 15 Oct 2026 and never came;
     the user (16 Oct): "make her send it". A report with `remind` (forms.js)
     says at the top of its person's home page, in red, the days of the last
     week it was not sent, until today's is in. The script also rings their
     phones at the `remind` time (apps-script/Push.js remindWatch_). */
  function nagCard(p) {
    var wrap = el('div', 'inswrap');
    if (AUTH.isChairman() || !FILINGS_IN) return wrap;
    var today = stamp();
    reportsFor(p.id).forEach(function (r) {
      if (!r.remind || r.cadence !== 'daily' || !dueOn(r, today) || filingFor(r, today)) return;
      var missed = [];
      for (var k = 7; k >= 1; k--) {
        var d = addDays(today, -k);
        if (dueOn(r, d) && !filingFor(r, d)) missed.push(dayLabel(d));
      }
      var passed = minsUntil(r.dueTime) < 0;
      if (!missed.length && !passed) return;
      var row = el('div', 'ins over nag');
      row.appendChild(el('div', 'inst', tfill_('nagTitle', { report: L(r) })));
      if (missed.length) row.appendChild(el('div', 'insd', tfill_('nagDays', { days: missed.join(', ') })));
      row.appendChild(el('p', 'mfhow', tfill_(passed ? 'nagPassed' : 'nagToday', { time: hhmm(r.dueTime) }) + ' ' + t('nagSeen')));
      var go = el('a', 'pushbtn nagbtn', t('fillItIn'));
      go.href = 'form.html?r=' + encodeURIComponent(r.id);
      row.appendChild(go);
      wrap.appendChild(row);
    });
    return wrap;
  }

  /* ---------------- notifications on this phone ---------------- */

  /* The Chairman's instructions reach the phone as a notification, even with
     the site closed (js/fb.js, firebase-messaging-sw.js, apps-script/Push.js).
     Each person turns it on once, on each phone they use. When it is on, the
     card is one line and a button that sends a test, so they can see it work. */
  function pushCard(opts) {
    opts = opts || {};
    var box = el('div', 'pushcard');
    if (!window.FB || !window.FB.pushState) return box;
    function draw(state) {
      box.innerHTML = '';
      box.className = 'pushcard ' + state;
      if (state === 'on') {
        box.appendChild(el('p', 'pushline', t('pushOn')));
        var test = el('button', 'pushbtn ghost', t('pushTest'));
        test.type = 'button';
        test.onclick = function () {
          test.disabled = true;
          window.FB.token().then(function (tok) {
            if (!tok || typeof ARCHIVE === 'undefined' || !ARCHIVE.on()) throw new Error('offline');
            return ARCHIVE.post({ kind: 'pushTest', idToken: tok });
          }).then(function () {
            box.appendChild(el('p', 'pushnote', t('pushTestSent')));
          }, function () {
            test.disabled = false;
            box.appendChild(el('p', 'pushnote bad', t('pushFailed')));
          });
        };
        box.appendChild(test);
        return;
      }
      box.appendChild(el('p', 'pushhead', opts.title || t('pushTitle')));
      if (state === 'iphone') { box.appendChild(el('p', 'pushnote', t('pushIphone'))); return; }
      if (state === 'unsupported') { box.appendChild(el('p', 'pushnote', t('pushNoSupport'))); return; }
      if (state === 'denied') { box.appendChild(el('p', 'pushnote', t('pushDenied'))); return; }
      box.appendChild(el('p', 'pushnote', opts.note || t('pushOffNote')));
      var go = el('button', 'pushbtn', t('pushTurnOn'));
      go.type = 'button';
      go.onclick = function () {
        go.disabled = true;
        go.textContent = t('pushWorking');
        window.FB.pushEnable().then(draw, function () {
          go.disabled = false;
          go.textContent = t('pushTurnOn');
          box.appendChild(el('p', 'pushnote bad', t('pushFailed')));
        });
      };
      box.appendChild(go);
    }
    window.FB.ready.then(function () { return window.FB.pushState(); }).then(draw, function () {});
    return box;
  }

  function insRow(i) {
    var row = el('div', 'ins');
    var over = daysFrom(i.due, stamp());
    if (over > 0) row.className += ' over';
    row.appendChild(el('div', 'inst', i.text));
    row.appendChild(el('div', 'insd',
      over > 1 ? t('insOver').replace('{n}', over) : over === 1 ? t('insOver1')
               : (over === 0 ? t('insToday') : t('insBy') + ' ' + i.due)));

    var go = el('button', 'insgo', t('insDone'));
    go.type = 'button';
    var box = el('div', 'insbox');
    box.hidden = true;
    var note = el('textarea');
    note.rows = 2;
    note.maxLength = 1000;
    note.placeholder = t('insNote');
    var send = el('button', 'insgo', t('insSend'));
    send.type = 'button';
    box.appendChild(note);
    box.appendChild(send);

    go.onclick = function () { go.hidden = true; box.hidden = false; note.focus(); };
    send.onclick = function () {
      send.disabled = true;
      window.FB.closeInstruction(i.id, note.value).then(function () {
        toast(t('insClosed'));
      })['catch'](function () {
        send.disabled = false;
        toast(t('insFailed'));
      });
    };
    row.appendChild(go);
    row.appendChild(box);
    return row;
  }

  /* THE VIEW ON SCREEN, redrawn once a minute and whenever a filing lands, so
     countdowns move and a report sent from another phone shows as sent. It
     keeps the reader's place: the scroll position and which lists are open.
     The form page is not redrawn this way — it would take the keyboard away
     from someone typing — it updates its own status line instead. */
  var currentView = null;
  function setView(fn) { currentView = fn; }
  function rerender() {
    if (!currentView || document.hidden) return;
    var y = window.scrollY;
    var open = Array.prototype.map.call(document.querySelectorAll('#app details'), function (d) { return d.open; });
    /* a box someone is typing in: its card is kept (below), and the keyboard goes back to it */
    var a = document.activeElement, sel = null;
    if (a && /^(INPUT|TEXTAREA)$/.test(a.tagName)) { try { sel = [a.selectionStart, a.selectionEnd]; } catch (e) { sel = null; } }
    currentView();
    Array.prototype.forEach.call(document.querySelectorAll('#app details'), function (d, i) { if (open[i]) d.open = true; });
    if (a && a !== document.activeElement && document.body.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) {
      try { a.focus({ preventScroll: true }); if (sel) a.setSelectionRange(sel[0], sel[1]); } catch (e) {}
    }
    window.scrollTo(0, y);
  }
  /* CARDS PEOPLE TYPE IN (the bug hunt, 15 Oct 2026): the home page redraws
     itself every minute and whenever the app is opened again, and a card
     built afresh came back empty — Ephrata's real amounts, Selam's overtime
     and loans, a note on an instruction, a reason for a missed check-in,
     gone while she checked a figure in another app. Such a card is built
     once for the page's life (as Amaha's gate card), and its own redraw,
     when its data changes, waits while someone is typing in it. */
  function typingIn(wrap, retry) {
    var a = document.activeElement;
    if (!(a && wrap.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) return false;
    wrap.retryDraw = retry;
    if (!wrap.waitingDraw) {
      wrap.waitingDraw = true;
      wrap.addEventListener('focusout', function again() {
        setTimeout(function () {
          if (wrap.contains(document.activeElement)) return;
          wrap.removeEventListener('focusout', again);
          wrap.waitingDraw = false;
          var r = wrap.retryDraw;
          wrap.retryDraw = null;
          if (r) r();
        }, 60);
      });
    }
    return true;
  }

  function renderIndex(root) {
    if (!AUTH.who()) return renderSignIn(root);
    setView(function () { renderIndex(root); });
    /* everyone but the Chairman lands straight on their own reports —
       no roster, no other people's forms */
    if (!AUTH.isChairman()) {
      var me = personById(AUTH.who());
      if (me) return renderPersonReports(root, me);
      AUTH.signOut();
      return renderSignIn(root);
    }
    document.title = t('siteTitle');
    root.innerHTML = '';
    /* the Chairman scanning the door's QR: is this phone on Klever's WiFi? */
    root.appendChild(atScanCard());
    var st = standing(null);
    root.appendChild(el('h1', 'vh', t('siteTitle')));
    root.appendChild(deck(null, st));

    var tl = timeline(null);
    if (tl) {
      root.appendChild(el('h2', 'eyebrow', t('dueToday')));
      root.appendChild(tl);
    }

    /* Thirty-nine people, of whom twenty-two file nothing at all. Listing
       every one of them buried the handful who owe him something today in a
       scroll eleven thousand pixels long. The people with something due come
       first; the rest are behind a line he can open when he wants them. */
    var due = dueToday();
    function card(p) {
      var b = el('button', 'person');
      b.type = 'button';
      b.appendChild(el('span', 'initial', L(p).charAt(0)));
      var who = el('span', 'who');
      who.appendChild(el('span', 'nm', L(p)));
      who.appendChild(el('span', 'rl', lang === 'am' ? p.roleAm : p.roleEn));
      b.appendChild(who);
      var mineToday = due.filter(function (r) { return r.person === p.id; });
      var left = mineToday.filter(function (r) { return !filingFor(r, stamp()); }).length;
      if (mineToday.length) {
        b.appendChild(el('span', 'count' + (left ? '' : ' done'),
          left ? left + ' ' + t('reportsDue') : t('allSentShort')));
      }
      b.appendChild(el('span', 'arrow', '\u2192'));
      b.onclick = function () { renderPersonReports(root, p); };
      return b;
    }

    var owing = PEOPLE.filter(function (p) {
      return due.some(function (r) { return r.person === p.id; });
    });
    var rest = PEOPLE.filter(function (p) { return owing.indexOf(p) === -1; });

    if (owing.length) {
      root.appendChild(el('h2', 'eyebrow', t('whoReports')));
      var list = el('div', 'people');
      owing.forEach(function (p) { list.appendChild(card(p)); });
      root.appendChild(list);
    }

    if (rest.length) {
      var more = el('details', 'everyone');
      var sum = el('summary');
      sum.appendChild(el('span', null, t('everyoneElse').replace('{n}', rest.length)));
      more.appendChild(sum);
      var rlist = el('div', 'people');
      rest.forEach(function (p) { rlist.appendChild(card(p)); });
      more.appendChild(rlist);
      root.appendChild(more);
    }

    /* his own page: today's filed reports, and what the agents made of them */
    var ov = el('a', 'chan chatcard');
    ov.href = 'chairman.html';
    var oi = el('span', 'chinit');
    oi.appendChild(icon('day'));
    ov.appendChild(oi);
    var ow = el('span', 'who');
    ow.appendChild(el('span', 'nm', t('chOverview')));
    ow.appendChild(el('span', 'rl', t('chAnalysis')));
    ov.appendChild(ow);
    ov.appendChild(el('span', 'arrow', '→'));
    root.appendChild(el('h2', 'eyebrow', t('chRaw')));
    root.appendChild(ov);

    root.appendChild(chatCard());

    /* the design sketches, reachable from the one address rather than living
       at links of their own. Chairman only — nobody else needs to see a
       half-finished idea of the thing they use every day. */
    var dz = el('a', 'designlink', t('designPreview'));
    dz.href = 'preview.html';
    root.appendChild(dz);

    root.appendChild(foot());
  }

  function renderPersonReports(root, p) {
    setView(function () { renderPersonReports(root, p); });
    document.title = t('siteTitle');
    root.innerHTML = '';
    root.appendChild(el('h1', 'vh', L(p)));
    if (AUTH.isChairman()) {
      var back = el('a', 'backlink', t('back'));
      back.href = '#';
      back.onclick = function (e) { e.preventDefault(); renderIndex(root); };
      root.appendChild(back);
    }

    var st = standing(p.id);
    root.appendChild(atScanCard());
    root.appendChild(deck(p, st));
    root.appendChild(nagCard(p));
    root.appendChild(attendCard(p));
    root.appendChild(gateHeadCard(p));
    root.appendChild(teamCard(p));
    root.appendChild(moneyFixCard());
    root.appendChild(receiptCard());
    root.appendChild(payrollCard());
    root.appendChild(payAddCard());
    root.appendChild(instructionsCard());
    root.appendChild(reportsToMeCard());
    root.appendChild(readingsCard());
    if (!AUTH.isChairman()) root.appendChild(pushCard());

    var tl = timeline(p.id);
    if (tl) {
      root.appendChild(el('h2', 'eyebrow', AUTH.isChairman() ? t('dueFromThem') : t('dueForYou')));
      root.appendChild(tl);
    }

    var rs = reportsFor(p.id);
    if (!rs.length) {
      root.appendChild(chatCard());
      root.appendChild(foot());
      return;
    }

    root.appendChild(el('h2', 'eyebrow', t('yourReports')));
    var list = el('div', 'reports');
    rs.forEach(function (r) {
      var a = el('a', 'report');
      a.href = 'form.html?r=' + encodeURIComponent(r.id);
      a.appendChild(el('span', 'rt', L(r)));
      var meta = el('div', 'meta');
      /* made from the daily reports: nothing to fill, only to read */
      if (r.built) {
        a.className = 'report built';
        meta.appendChild(el('span', 'due', t('builtWeekly')));
        meta.appendChild(el('span', null, t('to') + ' · ' + (lang === 'am' ? r.toAm : r.toEn)));
        a.appendChild(meta);
        list.appendChild(a);
        return;
      }
      /* already sent for the period it is due in? say so */
      var pd = periodNow(r), fr = pd.day ? filingFor(r, pd.day) : null;
      if (fr) meta.appendChild(el('span', 'sentmark',
        fr.pending ? t('waitingToSend') : t('sentAt') + ' ' + clockOf(fr.at) +
          (ymdOf(addis(fr.at.getTime())) !== stamp() ? ' · ' + dayLabel(ymdOf(addis(fr.at.getTime()))) : '')));
      meta.appendChild(el('span', 'due', lang === 'am' ? r.dueAm : r.dueEn));
      meta.appendChild(el('span', null, t('to') + ' · ' + (lang === 'am' ? r.toAm : r.toEn)));
      a.appendChild(meta);
      list.appendChild(a);
    });
    root.appendChild(list);
    root.appendChild(chatCard());
    root.appendChild(foot());
  }

  function foot() {
    var archiving = typeof ARCHIVE !== 'undefined' && ARCHIVE.on();
    return el('p', 'foot', archiving ? t('footSaved') : t('foot'));
  }

  /* ---------------- form page ---------------- */

  var values = {};      // field id -> value
  var report = null;
  var draftKey = '';

  function renderForm(root) {
    var id = new URLSearchParams(location.search).get('r');
    report = reportById(id);
    if (!report) { location.href = 'index.html'; return; }
    clearInterval(renderForm.tick);
    /* a link to someone else's form is a dead end, however it was shared */
    if (!AUTH.mayOpen(report)) {
      root.innerHTML = '';
      var b = el('a', 'backlink', t('back'));
      b.href = 'index.html';
      root.appendChild(b);
      root.appendChild(el('p', 'sub', t('notYours')));
      root.appendChild(foot());
      return;
    }
    var person = personById(report.person);
    document.title = L(report) + ' · ' + L(person);
    if (report.built) { renderBuilt(root, person); return; }
    /* what each lead no., KK and RBT code is (the code book, read once) */
    loadBook();
    /* Amaha's lists of workers: the team as he keeps it (17 Oct 2026) */
    if (report.person === 'amaha') teamIntoPicks(periodNow(report).day || stamp());

    setView(null);
    /* A draft belongs to the due day it is for, not the calendar day it was
       typed on: a weekly report started on Thursday for Friday is still
       there on Friday. It is kept on the phone for that period only (the
       user, 17 Oct 2026: "we agreed to save on the device for one day, so
       they can fill in their whole day"): an earlier period's answers, sent
       or not, never come back into a new one, and are cleared here. */
    var pd0 = periodNow(report);
    draftKey = 'klever.draft.' + report.id + '.' + (pd0.day || stamp());
    dropOtherPeriods(report.id, draftKey);
    try { values = JSON.parse(store.get(draftKey) || 'null'); } catch (e) { values = null; }
    bareCarry(values);
    /* What was sent for this period stays on this phone until the period is
       over (the user, 14 Oct 2026: "they may miss something — when they
       notice, they fill it in and send again"). Opening the form again shows
       it, to correct and send again: the last one sent holds the figures,
       the first one decides on time (apps-script/Agents.js got_, Agent.js). */
    var sentCopy = null;
    try { sentCopy = JSON.parse(store.get(sentKeyOf(draftKey)) || 'null'); } catch (e) { sentCopy = null; }
    /* a copy whose send, on the server's clock, counted for another period
       is not this one's (a phone hours out kept 6:59 PM as the next day's,
       16 Oct 2026). Copies kept before then hold the phone's own time: read
       them with today's gap. */
    var sentAt = sentCopy && sentCopy.at ? (sentCopy.srv ? sentCopy.at : sentCopy.at + SKEW) : null;
    if (sentAt && periodAt(report, sentAt).day !== pd0.day) { sentCopy = null; sentAt = null; }
    /* nor one whose send the Chairman moved to another day (/moves, 17 Oct
       2026: Getachew's Friday report, sent on Saturday, counts for Friday) —
       the form opens again to be filled for today */
    if (sentCopy && window.FB && FB.myMoves) {
      var keptKey = sentKeyOf(draftKey), keptDraft = draftKey, keptFor = pd0.day, keptRep = report.id, keptOpen = Date.now();
      FB.myMoves().then(function (m) {
        var off = Object.keys(m || {}).some(function (id) { return m[id].report === keptRep && m[id].from === keptFor; });
        if (!off) return;
        try { localStorage.removeItem(keptKey); } catch (e) {}
        /* just opened (nothing typed yet): open it again, empty — the draft
           saved on opening is that copy, so it goes too */
        if (report && report.id === keptRep && !sending && Date.now() - keptOpen < 8000) {
          try { localStorage.removeItem(keptDraft); } catch (e) {}
          location.reload();
        }
      })['catch'](function () {});
    }
    sentBefore = sentAt;
    /* an empty draft (the form was only opened) does not hide a real one */
    if (!values || typeof values !== 'object' || !hasContent(values)) {
      values = {};
      if (sentCopy && sentCopy.values && typeof sentCopy.values === 'object') {
        values = sentCopy.values;
        bareCarry(values);
      }
    }

    root.innerHTML = '';
    var back = el('a', 'backlink', t('back'));
    back.href = 'index.html';
    root.appendChild(back);

    /* The form opens the way the letters do — masthead, then who it is from
       and who it is to, then the deadline standing on its own. It is the
       document he is filling in, so it should look like one before he starts
       rather than only after he prints it. */
    root.appendChild(letterhead(person));

    var head = el('div', 'formhead');
    head.appendChild(el('h1', null, L(report)));

    var meta = el('dl', 'fmeta');
    function metaRow(k, v, cls) {
      var r = el('div', 'fmrow' + (cls ? ' ' + cls : ''));
      r.appendChild(el('dt', null, k));
      r.appendChild(el('dd', null, v));
      meta.appendChild(r);
    }
    metaRow(t('from'), L(person) + ' · ' + (lang === 'am' ? person.roleAm : person.roleEn));
    metaRow(t('to'), lang === 'am' ? report.toAm : report.toEn);
    metaRow(t('due'), lang === 'am' ? report.dueAm : report.dueEn);
    head.appendChild(meta);

    var stat = el('div', 'fstat');
    stat.id = 'fstat';
    head.appendChild(stat);
    drawStatus();
    /* sent already for this period? then a second Send would file twice */
    var already = el('div', 'penalty soft sentnote');
    already.id = 'sentnote';
    already.hidden = true;
    head.appendChild(already);
    if (sentBefore) {
      head.appendChild(el('div', 'penalty soft sentkept', tfill_('sentKept', { at: clockOf(new Date(sentBefore)) })));
    }

    /* the penalty is the reason the deadline matters, so it is not a footnote */
    if (report.penEn) head.appendChild(el('div', 'penalty', lang === 'am' ? report.penAm : report.penEn));
    if (report.derived) head.appendChild(el('div', 'penalty soft', t('derived')));
    root.appendChild(head);

    var prog = el('div', 'progress'); prog.appendChild(el('i'));
    root.appendChild(prog);

    /* sections */
    report.sections.forEach(function (sec, si) {
      var fs = el('fieldset');
      var lg = el('legend');
      /* numbered as they stand on the screen (refresh): a section that only
         opens when something happened leaves no gap in the count */
      var lt = el('span', null, L(sec));
      lt.id = 'lgt_' + si;
      lg.appendChild(lt);
      var lc = el('span', 'lgc');
      lc.id = 'lgc_' + si;
      lg.appendChild(lc);
      fs.appendChild(lg);
      sec.fields.forEach(function (f) {
        /* a figure that joins the line under its table has no row of its own */
        if (autoInLine(f)) return;
        fs.appendChild(fieldRow(f));
        /* and the line itself goes straight under that table */
        if ((f.t === 'table' || f.t === 'grid') && autoLineFields(f.id, sec).length) {
          var line = el('div', 'autoline');
          line.id = 'a_' + f.id;
          line.hidden = true;
          fs.appendChild(line);
        }
      });
      root.appendChild(fs);
    });

    var pv = el('div', 'preview'); pv.id = 'preview';
    root.appendChild(el('p', 'eyebrow', t('preview')));
    root.appendChild(pv);
    root.appendChild(foot());

    buildBar();
    refresh();
    /* opened on what was already sent: "Sent ✓" until something changes —
       an enabled "Send the correction" with nothing changed filed it twice
       (the bug hunt, 15 Oct 2026) */
    if (sentCopy && sentCopy.values && JSON.stringify(values) === JSON.stringify(sentCopy.values)) {
      lastSent = JSON.stringify(values);
      sentThisVisit = true;
      var sb = document.getElementById('send');
      if (sb) { sb.textContent = t('sentDone'); sb.disabled = true; }
    }
    /* a weekly or monthly report adds up its own week: fetch it, then the
       figures fill themselves in */
    loadWeekValues();
    loadSoFar();
    loadRecent();
    loadCarry();
    /* the status line keeps time while the form is open */
    renderForm.tick = setInterval(drawStatus, 30000);
  }

  /* A WEEKLY REPORT NOBODY FILLS (built:1 — the Chairman, 11 Oct 2026). It
     is made from the week's daily reports and sent on Sunday by the script
     (apps-script/Weekly.js). Here it is shown as it stands so far, worked out
     by the same code (js/weekly.js) from this person's own daily reports —
     the Chairman's view also reads the other people's dailies it names
     (Mahelet's reads Amaha's m²), which only he may open. Nothing to send. */
  function renderBuilt(root, person) {
    root.innerHTML = '';
    var back = el('a', 'backlink', t('back'));
    back.href = 'index.html';
    root.appendChild(back);
    root.appendChild(letterhead(person));
    var head = el('div', 'formhead');
    head.appendChild(el('h1', null, L(report)));
    var meta = el('dl', 'fmeta');
    [[t('from'), L(person) + ' · ' + (lang === 'am' ? person.roleAm : person.roleEn)],
     [t('to'), lang === 'am' ? report.toAm : report.toEn]].forEach(function (kv) {
      var r = el('div', 'fmrow');
      r.appendChild(el('dt', null, kv[0]));
      r.appendChild(el('dd', null, kv[1]));
      meta.appendChild(r);
    });
    head.appendChild(meta);
    head.appendChild(el('div', 'penalty soft', t('builtWeeklyNote')));
    root.appendChild(head);
    root.appendChild(el('p', 'eyebrow', t('builtSoFar')));
    var pv = el('div', 'preview built');
    pv.id = 'preview';
    pv.textContent = t('weekLoading');
    root.appendChild(pv);
    root.appendChild(foot());
    if (!window.WEEKLY || !window.FB || !FB.ownReports || !AUTH.who()) return;
    /* whose dailies it reads: the person's own, and for the Chairman also
       the ones its questions name */
    var whose = [report.person];
    if (AUTH.isChairman()) {
      WEEKLY.sourcesOf(report, REPORTS).forEach(function (id) {
        var r = reportById(id);
        if (r && whose.indexOf(r.person) < 0) whose.push(r.person);
      });
    }
    var since = new Date(nowMs() - 9 * 864e5);
    Promise.all(whose.map(function (p) {
      return FB.ownReports(p, since)['catch'](function () { return []; });
    })).then(function (lists) {
      var all = [].concat.apply([], lists);
      var b = WEEKLY.build(report, { reports: REPORTS, people: PEOPLE, filings: all, sunday: stamp() });
      pv.textContent = lang === 'am' ? b.textAm : b.text;
    })['catch'](function () { pv.textContent = t('sendFailed'); });
  }

  /* On time / late / early / not due, and which day it counts for — the
     same answer the ledger will give. */
  function drawStatus() {
    var box = document.getElementById('fstat');
    if (!box || !report) return;
    var pd = periodNow(report);
    /* the form was opened for another day (left open overnight): a fresh
       one for this day — it offered "Send the correction" with yesterday's
       answers, filed as today's (the bug hunt, 15 Oct 2026). The answers
       typed are kept as that day's draft. */
    if (draftKey && !sending && draftKey !== 'klever.draft.' + report.id + '.' + (pd.day || stamp())) { location.reload(); return; }
    box.className = 'fstat' + (pd.state === 'late' ? ' late' : (pd.state === 'none' ? ' none' : ''));
    box.innerHTML = '';
    box.appendChild(el('span', 'fsp', statusWord(pd)));
    box.appendChild(el('span', 'fsc', statusLine(report, pd) + ' · ' + clock()));
    var note = document.getElementById('sentnote');
    if (note) {
      var fr = pd.day ? filingFor(report, pd.day) : null;
      note.hidden = !fr;
      /* sent from this phone, its note says it may be corrected; "sending
         again files it twice" is for a phone that did not send it */
      if (fr) note.textContent = (fr.pending ? t('waitingToSend') : t('sentAt') + ' ' + clockOf(fr.at)) +
        (sentBefore ? '' : ' · ' + t('sentAgainWarn'));
    }
  }

  /* Was anything actually typed? A form with a table saves one empty row
     the moment it opens, so "has keys" is not the same as "has content". */
  function hasContent(v) {
    return Object.keys(v || {}).some(function (k) {
      var x = v[k];
      if (Array.isArray(x)) return x.some(function (row) { return row && typeof row === 'object' && hasContent(row); });
      if (x && typeof x === 'object') return hasContent(x);
      return x != null && String(x).trim() !== '';
    });
  }

  /* this report's answers kept for any other period (draft or sent copy):
     gone — a new day starts empty */
  function dropOtherPeriods(reportId, keep) {
    try {
      var kill = [], keepSent = sentKeyOf(keep);
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k === keep || k === keepSent) continue;
        if (k.indexOf('klever.draft.' + reportId + '.') === 0 || k.indexOf('klever.sent.' + reportId + '.') === 0) kill.push(k);
      }
      kill.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) { /* a blocked store just means nothing was kept */ }
  }
  function clearDrafts(reportId) {
    try {
      var kill = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('klever.draft.' + reportId + '.') === 0) kill.push(k);
      }
      kill.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) {}
  }

  /* a calendar date made at noon UTC (see gridRowLabel): read in UTC, so a
     phone set to New York does not call 5 October the 4th */
  function shortDate(d) {
    return d.getUTCDate() + ' ' + monShort(d.getUTCMonth());
  }

  /* repeating rows: t:'table' (person adds rows) and t:'grid' (fixed rows) */
  function repeater(f) {
    var wrap = el('div', 'repwrap' + (f.show ? ' follow' : ''));
    wrap.id = 'w_' + f.id;
    wrap.appendChild(el('div', 'replabel', L(f)));
    var body = el('div', 'rep');
    wrap.appendChild(body);
    /* a row that cannot be right — a code that is someone else's job, a
       receipt no. of "0" — says so under the list, as a question does under
       itself (17 Oct 2026: until now only the sent report said it) */
    var listOdd = el('div', 'hint odd listodd');
    listOdd.id = 'o_' + f.id;
    listOdd.hidden = true;
    wrap.appendChild(listOdd);

    if (!Array.isArray(values[f.id])) values[f.id] = [];
    var data = values[f.id];

    function rowLabel(i) {
      /* a credit is its supplier, what is owed and its dates */
      if (f.carry && f.carry.credit) return creditLabel(data[i] || {}, lang);
      if (f.carry) {
        var code = String((data[i] || {})[f.cols[0].id] || ''), info = CARRY_INFO[code] || {};
        var more = [info.cust, info.m2 ? info.m2 + ' m²' : ''].filter(function (x) { return x; });
        return code + (more.length ? ' · ' + more.join(' · ') : '');
      }
      return f.t === 'grid' ? gridRowLabel(f, i) : String(i + 1);
    }

    function draw() {
      body.innerHTML = '';
      if (f.t === 'grid') {
        while (data.length < f.rows.length) data.push({});
        data.length = f.rows.length;
      }
      data.forEach(function (rowData, i) {
        var card = el('div', 'reprow');
        /* rowsOn: a grid whose rows follow a tap list — only the rows tapped
           are on screen (Yordanos counts two materials, not twelve) */
        if (f.rowsOn) { card.setAttribute('data-gridrow', String(i)); card.hidden = !gridRowOn(f, i); }
        var head = el('div', 'reprowhead');
        head.appendChild(el('span', 'idx' + (f.carry ? ' carried' : ''), rowLabel(i)));
        /* a row brought from an earlier report is the job itself: it is
           answered, not taken away, and its code is its heading */
        if (f.t === 'table' && !f.carry) {
          var rm = el('button', 'rm', '\u00d7');
          rm.type = 'button';
          rm.title = t('removeRow');
          rm.setAttribute('aria-label', t('removeRow') + ' ' + rowLabel(i));
          /* a row can hold a lot; take it away only on a second tap */
          rm.onclick = function () {
            if (!rm.classList.contains('armed')) {
              rm.classList.add('armed');
              rm.textContent = t('removeRowConfirm');
              setTimeout(function () { rm.classList.remove('armed'); rm.textContent = '\u00d7'; }, 3000);
              return;
            }
            data.splice(i, 1); draw(); refresh();
          };
          head.appendChild(rm);
        }
        card.appendChild(head);

        f.cols.forEach(function (c, ci) {
          if (f.carry && ci === 0) return;
          /* words go under their label at full width; numbers and pick-lists
             stay beside it */
          /* a pick-list whose choices are long ("On credit — no cheque yet")
             goes full width too, or it reads "On credi" */
          var longPick = c.t === 'choice' && (c.opts || []).some(function (o) { return (lang === 'am' ? o.am : o.en).length > 14; });
          /* a yes/no in a list is two buttons with its answer words, like a
             yes/no question; with words longer than a box it takes the row */
          var longYn = c.t === 'yesno' && !!(c.yes || c.no);
          /* "Other" opens a box under the pick, so it takes the row too */
          var oth = c.t === 'choice' && hasOther(c) ? otherBox(rowData, c.id, function () { refresh(); if (wrap.sumUp) wrap.sumUp(); }) : null;
          var cell = el('div', 'cell' + (c.t === 'text' || c.t === 'date' || longPick || longYn || oth ? ' wide' : ''));
          var cl = el('label', null, L(c));
          cell.appendChild(cl);
          var inp;
          /* Photos of this row's job, taken in the row (the Chairman, 12 Oct
             2026: the "Site photos" question at the end of the section was
             not where Elyas looks). They go to the same room with the row's
             job code — or its customer — on them; the row keeps how many,
             and `tally` names the report's photo question that counts them
             by job, so the report says it once either way. */
          if (c.t === 'photo') {
            cell.className = 'cell wide rowphoto';
            cl.removeAttribute('for');
            var pk = document.createElement('input');
            pk.type = 'file';
            pk.accept = 'image/*';
            pk.multiple = true;
            pk.className = 'phpick';
            pk.id = 'c_' + f.id + '_' + i + '_' + c.id;
            var pb = el('label', 'btn phadd', t('photoAdd'));
            pb.appendChild(pk);
            var ptl = el('div', 'phtally');
            var pst = el('div', 'phstrip');
            var rowTally = function () { ptl.textContent = has(rowData[c.id]) ? t('photoSentSoFar') + ' ' + rowData[c.id] : ''; };
            rowTally();
            pk.onchange = function () {
              var files = Array.prototype.slice.call(pk.files || []);
              pk.value = '';
              if (!files.length) return;
              var chan = photoChan();
              if (!photoReady(chan)) return;
              var code = String(rowData.code || '').trim() || String(rowData.cust || '').trim() || PHOTO_GENERAL;
              sendPhotos(chan, files, code, '', pst, function (by) {
                var n = (Number(rowData[c.id]) || 0) + by;
                if (n > 0) rowData[c.id] = String(n); else delete rowData[c.id];
                if (c.tally) {
                  photoBump(c.tally, code, by);
                  var tr = document.getElementById('r_' + c.tally);
                  if (tr && tr.drawTally) tr.drawTally();
                }
                rowTally();
                refresh();
                if (wrap.sumUp) wrap.sumUp();
              });
            };
            cell.appendChild(pb);
            cell.appendChild(ptl);
            cell.appendChild(pst);
            card.appendChild(cell);
            return;
          }
          /* A photo of the payment slip (the user, 15 Oct 2026): kept apart
             from the chat rooms, for Selam, who confirms the receipt, and the
             Chairman (slipCell) */
          if (c.t === 'slip') {
            cell.className = 'cell wide rowphoto slipcell';
            cl.removeAttribute('for');
            slipCell(cell, rowData, c, 'c_' + f.id + '_' + i + '_' + c.id, function () {
              refresh();
              if (wrap.sumUp) wrap.sumUp();
            });
            card.appendChild(cell);
            return;
          }
          /* A colour code, picked from the pictures (the Chairman, 13 Oct
             2026). `of` names the row's material column: only a board or edge
             tape has a colour (COLOUR_ITEMS), so the box shows for those
             alone, and a colour left on a row changed to hinges goes with it. */
          if (c.t === 'colour') {
            cell.className = 'cell wide colcell';
            cl.removeAttribute('for');
            var cb = el('button', 'colpick');
            cb.type = 'button';
            cb.id = 'c_' + f.id + '_' + i + '_' + c.id;
            cb.setAttribute('aria-label', L(c));
            var drawCb = function () {
              cb.innerHTML = '';
              var v = rowData[c.id];
              if (has(v)) {
                cb.appendChild(swatch(String(v)));
                cb.appendChild(el('span', 'colcode', String(v)));
                cb.appendChild(el('span', 'colchange', t('colChange')));
              } else cb.appendChild(el('span', 'colnone', t('colPick')));
            };
            drawCb();
            cb.onclick = function () {
              colourSheet(rowData[c.id], function (v) {
                if (v) rowData[c.id] = v; else delete rowData[c.id];
                drawCb();
                refresh();
                if (wrap.sumUp) wrap.sumUp();
              });
            };
            cell.appendChild(cb);
            if (c.of) {
              var syncCol = function () {
                var on = COLOUR_ITEMS.indexOf(rowData[c.of]) !== -1;
                cell.hidden = !on;
                if (!on && has(rowData[c.id])) { delete rowData[c.id]; drawCb(); }
              };
              (card.syncs = card.syncs || []).push(syncCol);
              syncCol();
            }
            card.appendChild(cell);
            return;
          }
          /* a tap box asked only once another in the row says so (ifCol), as a
             typed one is below — Selam's one list of every transaction (16 Oct
             2026) asks "Job File opened" of an advance and "Kidan" of money
             out, never of the others. Its answer goes if that changes. */
          var tapIf = function (clear) {
            if (!c.ifCol) return;
            var syncTap = function () {
              var on = colOn(c, rowData);
              cell.hidden = !on;
              if (!on && has(rowData[c.id])) { delete rowData[c.id]; clear(); }
            };
            (card.syncs = card.syncs || []).push(syncTap);
            syncTap();
          };
          if (c.t === 'yesno') {
            var cseg = el('div', 'seg mini' + (rowData[c.id] === 'no' ? ' no' : ''));
            cseg.id = 'c_' + f.id + '_' + i + '_' + c.id;
            cseg.setAttribute('role', 'group');
            cseg.setAttribute('aria-label', L(c));
            ['yes', 'no'].forEach(function (v) {
              var yb = el('button', null, ynWord(c, v));
              yb.type = 'button';
              yb.setAttribute('data-v', v);
              yb.setAttribute('aria-pressed', rowData[c.id] === v ? 'true' : 'false');
              yb.onclick = function () {
                rowData[c.id] = v;
                cseg.className = 'seg mini' + (v === 'no' ? ' no' : '');
                Array.prototype.forEach.call(cseg.children, function (x) {
                  x.setAttribute('aria-pressed', x === yb ? 'true' : 'false');
                });
                if (card.syncs) card.syncs.forEach(function (fn) { fn(); });
                refresh();
                if (wrap.sumUp) wrap.sumUp();
              };
              cseg.appendChild(yb);
            });
            cl.removeAttribute('for');
            cell.appendChild(cseg);
            tapIf(function () {
              cseg.className = 'seg mini';
              Array.prototype.forEach.call(cseg.children, function (x) { x.setAttribute('aria-pressed', 'false'); });
            });
            card.appendChild(cell);
            return;
          }
          /* a short choice in a list is buttons too — "Complete / In
             progress" is one tap, not a menu */
          if (c.t === 'choice' && (c.opts || []).length <= 6) {
            var ccb = el('div', 'chips one mini');
            ccb.id = 'c_' + f.id + '_' + i + '_' + c.id;
            ccb.setAttribute('role', 'group');
            ccb.setAttribute('aria-label', L(c));
            c.opts.forEach(function (o) {
              var ob = el('button', 'chip', lang === 'am' ? o.am : o.en);
              ob.type = 'button';
              ob.setAttribute('data-v', o.v);
              ob.setAttribute('aria-pressed', rowData[c.id] === o.v ? 'true' : 'false');
              ob.onclick = function () {
                if (rowData[c.id] === o.v) delete rowData[c.id]; else rowData[c.id] = o.v;
                Array.prototype.forEach.call(ccb.children, function (x) {
                  x.setAttribute('aria-pressed', x.getAttribute('data-v') === rowData[c.id] ? 'true' : 'false');
                });
                if (card.syncs) card.syncs.forEach(function (fn) { fn(); });
                if (oth) oth.sync(true);
                refresh();
                if (wrap.sumUp) wrap.sumUp();
              };
              ccb.appendChild(ob);
            });
            cl.removeAttribute('for');
            cell.className = 'cell wide';
            cell.appendChild(ccb);
            if (oth) cell.appendChild(oth);
            tapIf(function () {
              Array.prototype.forEach.call(ccb.children, function (x) { x.setAttribute('aria-pressed', 'false'); });
              if (oth) oth.sync(true);
            });
            card.appendChild(cell);
            return;
          }
          if (c.t === 'choice') {
            inp = document.createElement('select');
            var blank = document.createElement('option');
            blank.value = ''; blank.textContent = '\u2014';
            inp.appendChild(blank);
            var opts = c.opts;
            opts.forEach(function (o) {
              var op = document.createElement('option');
              op.value = o.v; op.textContent = lang === 'am' ? o.am : o.en;
              inp.appendChild(op);
            });
          } else if (c.t === 'date') {
            /* a real date, both calendars shown — a date a reminder is
               counted from cannot be "Friday" (apps-script/Credit.js) */
            inp = document.createElement('input');
            inp.type = 'date';
          } else {
            inp = document.createElement('input');
            /* a time is the phone's own clock, not typed */
            inp.type = c.time ? 'time' : 'text';
            /* a number box that reads "1,500" as empty is worse than a text box
               with the number keyboard; the digits are read by num() */
            if (c.t === 'num' || c.t === 'money') inp.inputMode = 'decimal';
          }
          inp.id = 'c_' + f.id + '_' + i + '_' + c.id;
          cl.htmlFor = inp.id;
          inp.value = rowData[c.id] != null ? rowData[c.id] : '';
          /* words to tap under a word box: its usual answers (picks), or the
             codes and names this person filed lately (recentKey) */
          var tapBox = null;
          /* under a code — a lead no., a KK or an RBT job — what the code
             book says it is (the user, 17 Oct 2026) */
          var codeHint = isCodeCol(c) ? el('div', 'codehint') : null;
          if (codeHint) {
            codeHint.hidden = true;
            codeHint.setAttribute('aria-live', 'polite');
            codeHint.paint = function () { paintCodeHint(codeHint, inp.value); };
          }
          var onType = function () {
            rowData[c.id] = inp.value;
            if (tapBox) tapBox.hidden = has(inp.value);
            if (codeHint) codeHint.paint();
            if (card.syncs) card.syncs.forEach(function (fn) { fn(); });
            if (oth) oth.sync(true);
            refresh();
            if (wrap.sumUp) wrap.sumUp();
          };
          inp.onchange = inp.oninput = onType;
          cell.appendChild(c.t === 'date' ? dressDate(inp) : inp);
          if (codeHint) { cell.appendChild(codeHint); codeHint.paint(); }
          if (oth) cell.appendChild(oth);
          if (c.t === 'text' && !c.time && (c.picks || recentKey(f, c))) {
            tapBox = el('div', 'chips mini cellpicks');
            tapBox.hidden = has(inp.value);
            var fillTaps = function () {
              var words = c.picks ? c.picks.map(function (p) { return L(p); }) : (RECENT[recentKey(f, c)] || []);
              tapBox.innerHTML = '';
              words.forEach(function (w) {
                var tb = el('button', 'chip', w);
                tb.type = 'button';
                tb.onclick = function () { inp.value = w; onType(); };
                tapBox.appendChild(tb);
              });
            };
            fillTaps();
            if (!c.picks) { tapBox.setAttribute('data-recent', '1'); tapBox.refill = fillTaps; }
            cell.appendChild(tapBox);
          }
          /* a box asked only once another in the row is answered — and not
             with one of `ifNot` ("How many pieces?" once a material to cut
             again is picked, not for "Nothing new"); its answer goes if that
             changes */
          if (c.ifCol) {
            var syncIf = function () {
              var on = colOn(c, rowData);
              cell.hidden = !on;
              if (!on && has(rowData[c.id])) { delete rowData[c.id]; inp.value = ''; }
            };
            (card.syncs = card.syncs || []).push(syncIf);
            syncIf();
          }
          card.appendChild(cell);
        });
        body.appendChild(card);
      });

      if (f.t === 'table' && !f.carry) {
        var add = el('button', 'addrow', '+ ' + (lang === 'am' ? f.addAm : f.addEn));
        add.type = 'button';
        add.onclick = function () {
          data.push({}); draw(); refresh();
          var rows = body.querySelectorAll('.reprow');
          if (rows.length) rows[rows.length - 1].classList.add('fresh');
        };
        body.appendChild(add);
      }
      if (wrap.sumUp) wrap.sumUp();
    }

    /* A table whose entry names a `total` column adds it up as it is
       typed — "Total expected: 1,250,000 Birr" — so nobody has to. */
    if (f.total) {
      var tot = el('div', 'reptotal');
      wrap.appendChild(tot);
      wrap.sumUp = function () { tot.textContent = totalLine(f); };
    }

    if (f.t === 'table' && !f.carry && !data.length) data.push({});
    draw();
    wrap.redraw = draw;
    return wrap;
  }

  /* the sum of a table's `total` column, and that sum as a line of text */
  function tableTotal(f) {
    var sum = 0;
    (Array.isArray(values[f.id]) ? values[f.id] : []).forEach(function (r) {
      var x = num(r && r[f.total]);
      if (!isNaN(x)) sum += x;
    });
    return sum;
  }
  function totalLine(f) {
    return (lang === 'am' ? (f.totalAm || 'ጠቅላላ') : (f.totalEn || 'Total')) + ': ' +
           money(String(tableTotal(f))) + ' ' + t('birr');
  }

  /* "Question? (left box / right box)" → the question, and the two box words */
  function boxWords(f) {
    var m = /^([\s\S]*?)\s*\(([^()]+?)\s\/\s([^()]+?)\)\s*$/.exec(L(f) || '');
    return m ? { q: m[1], a: m[2], b: m[3] } : null;
  }

  function fieldRow(f) {
    /* a list gathered from the week's own daily reports: shown, not typed */
    if (f.t === 'table' && f.auto) {
      var gw = el('div', 'repwrap gathered' + (f.show ? ' follow' : ''));
      gw.id = 'w_' + f.id;
      gw.appendChild(el('div', 'replabel', L(f)));
      var gb = el('div', 'gatheredrows');
      gb.id = 'g_' + f.id;
      gw.appendChild(gb);
      gw.appendChild(el('div', 'hint', t('fromYourWeekRows')));
      return gw;
    }
    /* a yes/no the form reads off a "what happened today" list, or a list the
       form folds out of another (the 15-day plan's day totals): the question
       is elsewhere, so this one has nothing to show */
    if (f.quiet && f.auto) {
      var qg = el('div', 'quiet');
      qg.id = 'r_' + f.id;
      qg.hidden = true;
      return qg;
    }
    if (f.t === 'table' || f.t === 'grid') return repeater(f);
    if (f.t === 'multi') return multiField(f);
    /* a question the form answers itself: the question, the figure it worked
       out, and where it came from. Nothing to type, nothing to get wrong.
       A two-box question with only one box counted keeps its boxes — the
       counted one is locked, the other is still asked. */
    if (f.auto && !(f.t === 'ratio' && !(f.auto.a && f.auto.b))) {
      var ar = el('div', 'fld auto' + (f.i ? ' indent' : '') + (f.show ? ' follow' : ''));
      ar.id = 'r_' + f.id;
      ar.appendChild(el('label', null, L(f)));
      var av = el('div', 'autoval');
      av.id = 'av_' + f.id;
      av.textContent = '—';
      ar.appendChild(av);
      ar.appendChild(el('div', 'hint', t(f.auto.week != null ? 'fromYourWeek' : f.auto.soFar != null ? 'fromYourDays' : 'workedOut')));
      /* its line, as a typed answer has it: red below it, and before the
         day it is judged from, what is still to go */
      if (f.tgt) {
        var ah = el('div', 'hint');
        ah.id = 'h_' + f.id;
        ah.textContent = lang === 'am' ? f.tgt.am : f.tgt.en;
        ar.appendChild(ah);
      }
      return ar;
    }
    if (f.t === 'photos') return photoField(f);
    var row = el('div', 'fld' + (f.i ? ' indent' : '')
                 + (f.t === 'area' ? ' wide' : '')
                 /* a choice and a yes/no both hold words, and words do not fit
                    the narrow control column once they are in Amharic */
                 + (f.t === 'choice' ? ' wide' : '')
                 /* and a date reads "Wed 9 Sep 2026 · ጳጉሜን 4 ቀን 2018" */
                 + (f.t === 'date' ? ' wide' : '')
                 /* two boxes, each with its words under it, need the full row */
                 + (f.t === 'ratio' ? ' wide' : '')
                 + (f.t === 'yesno' ? ' yn' : '')
                 + (f.show ? ' follow' : ''));
    row.id = 'r_' + f.id;
    var lab = el('label', null, L(f));
    lab.id = 'l_' + f.id;
    lab.htmlFor = 'f_' + f.id;
    row.appendChild(lab);

    if (f.t === 'ratio' && f.ask) {
      /* TWO STEPS (the Chairman, 11 Oct 2026: "most people get confused on
         this"). Two empty boxes under one question — "posted / required" —
         and nobody knew which number went where. Now the total is asked
         first, as a question of its own, then "how many of them", with All
         and None to tap. A total of 0 files 0 of 0 and asks nothing more
         (stepsZero). A total the form already knows — the question just
         above, the rows of the list above — is not asked again: it is the
         number on the All button. The answers keep their keys: __a done,
         __b out of. The question itself stays, unseen, for screen readers
         and for the sent report. */
      lab.className = 'vh';
      lab.removeAttribute('for');
      var st = el('div', 'stepbox');
      st.id = 'f_' + f.id;
      st.tabIndex = -1;
      st.setAttribute('role', 'group');
      st.setAttribute('aria-labelledby', lab.id);
      var bCounted = !!(f.auto && f.auto.b), aCounted = !!(f.auto && f.auto.a);
      var sb = el('div', 'step');
      sb.id = 'sb_' + f.id;
      if (bCounted) sb.hidden = true;
      else {
        var lsb = el('label', null, L(f.ask.b));
        lsb.htmlFor = 'f_' + f.id + '__b';
        sb.appendChild(lsb);
        sb.appendChild(numInput(f.id + '__b', f));
      }
      st.appendChild(sb);
      var sa = el('div', 'step');
      sa.id = 'sa_' + f.id;
      var lsa = el('label', null, L(f.ask.a));
      lsa.htmlFor = 'f_' + f.id + '__a';
      sa.appendChild(lsa);
      var isa = numInput(f.id + '__a', f);
      /* the box the form counts is locked: it is an answer, not a question */
      if (aCounted) { isa.readOnly = true; isa.className = 'locked'; isa.tabIndex = -1; }
      sa.appendChild(isa);
      if (!aCounted) {
        var sc = el('div', 'chips mini');
        sc.id = 'sc_' + f.id;
        ['all', 'none'].forEach(function (k) {
          var sbt = el('button', 'chip', k === 'none' ? t('ratioNone') : t('ratioAll'));
          sbt.type = 'button';
          sbt.setAttribute('data-r', k);
          sbt.onclick = function () {
            values[f.id + '__a'] = k === 'all' ? String(num(values[f.id + '__b'])) : '0';
            isa.value = values[f.id + '__a'];
            refresh();
          };
          sc.appendChild(sbt);
        });
        sa.appendChild(sc);
      }
      st.appendChild(sa);
      row.className += ' steps';
      row.appendChild(st);
    } else if (f.t === 'ratio') {
      /* two boxes under one question; the wrapper carries the id, so the
         "still empty" finder and the red mark can find it */
      var wrap = el('div', 'ratio');
      wrap.id = 'f_' + f.id;
      wrap.tabIndex = -1;
      wrap.setAttribute('role', 'group');
      wrap.setAttribute('aria-labelledby', lab.id);
      lab.removeAttribute('for');
      var ia = numInput(f.id + '__a', f), ib = numInput(f.id + '__b', f);
      /* the box the form counts is locked: it is an answer, not a question */
      if (f.auto && f.auto.a) { ia.readOnly = true; ia.className = 'locked'; ia.tabIndex = -1; }
      if (f.auto && f.auto.b) { ib.readOnly = true; ib.className = 'locked'; ib.tabIndex = -1; }
      /* Every two-box question ends by naming its boxes — "(called within
         1 hour / all new leads today)". Blank boxes left people guessing
         which number went where, so the question loses its bracket and each
         box carries its own words underneath. */
      var words = boxWords(f);
      if (words) lab.textContent = words.q;
      ia.setAttribute('aria-label', L(f) + ' — ' + (words ? words.a : '1'));
      ib.setAttribute('aria-label', L(f) + ' — ' + (words ? words.b : '2'));
      [[ia, words && words.a], [ib, words && words.b]].forEach(function (x, i) {
        var cell = el('div', 'rbox');
        cell.appendChild(x[0]);
        if (x[1]) cell.appendChild(el('span', 'rlab', x[1]));
        wrap.appendChild(cell);
        if (!i) wrap.appendChild(el('span', 'of', '/'));
      });
      row.appendChild(wrap);
    } else if (f.t === 'yesno') {
      var seg = el('div', 'seg');
      seg.id = 'f_' + f.id;
      seg.tabIndex = -1;
      seg.setAttribute('role', 'group');
      seg.setAttribute('aria-labelledby', lab.id);
      lab.removeAttribute('for');
      [['yes', ynWord(f, 'yes')], ['no', ynWord(f, 'no')]].forEach(function (o) {
        var b = el('button', null, o[1]);
        b.type = 'button';
        b.setAttribute('aria-pressed', values[f.id] === o[0] ? 'true' : 'false');
        b.onclick = function () {
          values[f.id] = o[0];
          seg.className = 'seg' + (o[0] === 'no' ? ' no' : '');
          Array.prototype.forEach.call(seg.children, function (c) {
            c.setAttribute('aria-pressed', c === b ? 'true' : 'false');
          });
          refresh();
        };
        seg.appendChild(b);
      });
      if (values[f.id] === 'no') seg.className = 'seg no';
      row.appendChild(seg);
    } else if ((f.t === 'area' || f.t === 'text') && f.picks) {
      row.className += ' wide picks';
      lab.removeAttribute('for');
      pickField(row, f);
    } else if (f.t === 'area') {
      var ta = el('textarea');
      ta.id = 'f_' + f.id;
      ta.value = values[f.id] || '';
      ta.oninput = function () { values[f.id] = ta.value; refresh(); };
      row.appendChild(ta);
    } else if (f.t === 'date') {
      var di = document.createElement('input');
      di.type = 'date'; di.id = 'f_' + f.id;
      di.value = values[f.id] || '';
      di.onchange = di.oninput = function () { values[f.id] = di.value; redrawGrids(); refresh(); };
      row.appendChild(dressDate(di));
    } else if (f.t === 'choice') {
      /* one tap, every choice in sight — a drop-down hid them behind a
         menu that a phone opens over the whole screen */
      lab.removeAttribute('for');
      var cb = el('div', 'chips one');
      cb.id = 'f_' + f.id;
      cb.tabIndex = -1;
      cb.setAttribute('role', 'group');
      cb.setAttribute('aria-labelledby', lab.id);
      var fOth = hasOther(f) ? otherBox(values, f.id, refresh) : null;
      (f.opts || []).forEach(function (o) {
        var b = el('button', 'chip', lang === 'am' ? o.am : o.en);
        b.type = 'button';
        b.setAttribute('aria-pressed', values[f.id] === o.v ? 'true' : 'false');
        b.onclick = function () {
          if (values[f.id] === o.v) delete values[f.id]; else values[f.id] = o.v;
          Array.prototype.forEach.call(cb.children, function (c, j) {
            c.setAttribute('aria-pressed', values[f.id] === f.opts[j].v ? 'true' : 'false');
          });
          if (fOth) fOth.sync(true);
          refresh();
        };
        cb.appendChild(b);
      });
      row.appendChild(cb);
      if (fOth) row.appendChild(fOth);
    } else if (f.t === 'text') {
      var ti = document.createElement('input');
      ti.type = f.time ? 'time' : 'text'; ti.id = 'f_' + f.id;
      ti.value = values[f.id] || '';
      ti.oninput = ti.onchange = function () { values[f.id] = ti.value; refresh(); };
      row.appendChild(ti);
      /* "What comes first tomorrow?" offers today's own jobs (from:
         'p_jobs.code'), and a box with recent:1 the answers of the last
         weeks — one tap fills it, and it can still be typed */
      if (f.from || f.recent) {
        row.className += ' wide';
        var tb = el('div', 'chips mini cellpicks');
        tb.id = 't_' + f.id;
        tb.refill = function () {
          var words = [];
          [].concat(f.from || []).forEach(function (src) {
            var sp = String(src).split('.');
            (Array.isArray(values[sp[0]]) ? values[sp[0]] : []).forEach(function (r) {
              var w = String((r && r[sp[1]]) || '').trim();
              if (w && words.indexOf(w) < 0) words.push(w);
            });
          });
          (RECENT[f.id] || []).forEach(function (w) { if (words.indexOf(w) < 0 && words.length < 8) words.push(w); });
          var sig = words.join('|');
          if (tb.__sig !== sig) {
            tb.__sig = sig;
            tb.innerHTML = '';
            words.forEach(function (w) {
              var b = el('button', 'chip', w);
              b.type = 'button';
              b.onclick = function () { ti.value = w; values[f.id] = w; refresh(); };
              tb.appendChild(b);
            });
          }
          tb.hidden = has(values[f.id]) || !words.length;
        };
        if (f.recent) tb.setAttribute('data-recent', '1');
        row.appendChild(tb);
      }
    } else {
      row.appendChild(numInput(f.id, f));
    }

    if (f.tgt) {
      var h = el('div', 'hint');
      h.id = 'h_' + f.id;
      h.textContent = lang === 'am' ? f.tgt.am : f.tgt.en;
      row.appendChild(h);
    }
    /* an answer that cannot be right (see oddFigures in forms.js) says so
       here, under the question it belongs to */
    if (f.t === 'ratio' || f.parts) {
      var oh = el('div', 'hint odd');
      oh.id = 'o_' + f.id;
      oh.hidden = true;
      row.appendChild(oh);
    }
    return row;
  }

  /* The answer in words (the Chairman, 11 Oct 2026: not "አዎ / አይደለም" but
     the actual answer). "Was the cheque book locked away?" is answered
     "Locked" or "Not locked" — ተቆልፏል / አልተቆለፈም — and in Amharic a bare
     አይደለም is often simply the wrong word ("Did anyone come late?" is
     answered የለም). A yes/no question or list column may carry its own
     words, yes:{en,am} and no:{en,am}; without them it says Yes / No. What
     is filed is still yes or no. */
  function ynWord(f, v) {
    var w = f && f[v];
    return w ? L(w) : t(v);
  }

  function numInput(key, f) {
    var i = document.createElement('input');
    i.type = 'text';
    i.inputMode = 'decimal';
    i.autocomplete = 'off';
    i.id = 'f_' + key;
    i.value = values[key] != null ? values[key] : '';
    i.oninput = function () { values[key] = i.value; refresh(); };
    return i;
  }

  /* TAP, DON'T TYPE (the Chairman, 11 Oct 2026: "they are struggling so much
     with the questions"). Measured on the first 36 reports filed: the sales
     team and the designers left 0–30% of their questions empty; the factory,
     the store and purchasing left 50–96%. Every "why" box was empty — Amaha
     writes Amharic in English letters on a phone with no Amharic keyboard —
     and so was every one of the yes/no questions about things that go wrong
     once a month, which were twenty answers to give on a day when nothing
     went wrong.

     EVERYTHING THAT HAPPENED, as one list: t:'multi'. Tap what happened, or
     "nothing", and the yes/no answers the rulebook and the agents read are
     worked out from it ({picked:…} in autoOne) under the keys they always
     had. The answer is the codes, comma-separated: "absent,late" or "none". */
  function multiField(f) {
    var row = el('div', 'fld wide multi' + (f.show ? ' follow' : ''));
    row.id = 'r_' + f.id;
    var lab = el('label', null, L(f));
    lab.id = 'l_' + f.id;
    row.appendChild(lab);
    var box = el('div', 'chips');
    box.id = 'f_' + f.id;
    box.tabIndex = -1;
    box.setAttribute('role', 'group');
    box.setAttribute('aria-labelledby', lab.id);
    var order = (f.opts || []).map(function (o) { return o.v; });
    function picked() { return String(values[f.id] || '').split(',').filter(Boolean); }
    function paint() {
      var now = picked();
      Array.prototype.forEach.call(box.querySelectorAll('button'), function (b) {
        b.setAttribute('aria-pressed', now.indexOf(b.getAttribute('data-v')) >= 0 ? 'true' : 'false');
      });
    }
    function chip(o, cls) {
      var b = el('button', 'chip' + (cls ? ' ' + cls : ''), L(o));
      b.type = 'button';
      b.setAttribute('data-v', o.v);
      b.onclick = function () {
        var now = picked();
        if (o.v === 'none') now = now.indexOf('none') >= 0 ? [] : ['none'];
        else {
          now = now.filter(function (x) { return x !== 'none'; });
          var i = now.indexOf(o.v);
          if (i >= 0) now.splice(i, 1); else now.push(o.v);
          now.sort(function (a, c) { return order.indexOf(a) - order.indexOf(c); });
        }
        if (now.length) values[f.id] = now.join(','); else delete values[f.id];
        paint();
        refresh();
      };
      return b;
    }
    if (f.none) box.appendChild(chip({ v: 'none', en: f.none.en, am: f.none.am }, 'none'));
    (f.groups || [{ v: '' }]).forEach(function (g) {
      var mine = (f.opts || []).filter(function (o) { return (o.g || '') === g.v; });
      if (!mine.length) return;
      if (g.en) box.appendChild(el('div', 'chipg', L(g)));
      mine.forEach(function (o) { box.appendChild(chip(o)); });
    });
    paint();
    row.appendChild(box);
    row.appendChild(el('div', 'hint', t('tapAll')));
    return row;
  }
  function multiText(f, v) {
    return String(v).split(',').filter(Boolean).map(function (c) {
      if (c === 'none' && f.none) return L(f.none);
      for (var i = 0; i < (f.opts || []).length; i++) if (f.opts[i].v === c) return L(f.opts[i]);
      return c;
    }).join(lang === 'am' ? '፣ ' : ', ');
  }

  /* TAP THE REASON: an area or text question with `picks` — the usual
     answers as buttons, and a box under them for a few words more. What is
     filed is still one line of words under the question's own key ("Machine
     broke down; Power cut — the edge bander"), so the agents, the rulebook
     and the Chairman's page read it as they always did. The buttons tapped
     (`<id>__p`) and the words typed (`<id>__n`) live in the draft only;
     answers() leaves them out. `one:true` allows a single button. */
  function pickField(row, f) {
    var pk = f.id + '__p', nk = f.id + '__n';
    /* a draft typed before the buttons came: the words become the note */
    if (has(values[f.id]) && values[pk] == null && values[nk] == null) values[nk] = values[f.id];
    var box = el('div', 'chips');
    box.id = 'f_' + f.id;
    box.tabIndex = -1;
    box.setAttribute('role', 'group');
    box.setAttribute('aria-labelledby', 'l_' + f.id);
    function picked() { return Array.isArray(values[pk]) ? values[pk] : []; }
    function compose() {
      var words = picked().map(function (code) {
        for (var i = 0; i < f.picks.length; i++) if (f.picks[i].en === code) return L(f.picks[i]);
        return code;
      });
      var note = String(values[nk] || '').trim();
      var all = words.join('; ') + (note ? (words.length ? ' — ' : '') + note : '');
      if (all) values[f.id] = all; else delete values[f.id];
    }
    f.picks.forEach(function (o) {
      var b = el('button', 'chip', L(o));
      b.type = 'button';
      b.setAttribute('aria-pressed', picked().indexOf(o.en) >= 0 ? 'true' : 'false');
      b.onclick = function () {
        var now = picked().slice(), i = now.indexOf(o.en);
        if (f.one) now = i >= 0 ? [] : [o.en];
        else if (i >= 0) now.splice(i, 1);
        else now.push(o.en);
        values[pk] = now;
        Array.prototype.forEach.call(box.children, function (c, j) {
          c.setAttribute('aria-pressed', now.indexOf(f.picks[j].en) >= 0 ? 'true' : 'false');
        });
        compose();
        refresh();
      };
      box.appendChild(b);
    });
    row.appendChild(box);
    var note = el(f.t === 'area' ? 'textarea' : 'input', 'note');
    if (f.t === 'area') note.rows = 2; else note.type = 'text';
    note.id = 'n_' + f.id;
    note.placeholder = t('addWords');
    note.value = values[nk] || '';
    note.setAttribute('aria-label', L(f) + ' — ' + t('addWords'));
    note.oninput = function () { values[nk] = note.value; compose(); refresh(); };
    row.appendChild(note);
    row.appendChild(el('div', 'hint', f.one ? t('tapOne') : t('tapReasons')));
    compose();
  }

  /* SITE PHOTOS (the Chairman, 10 Oct 2026: "send some site photos").

     A photo goes into the room this report is delivered to the moment it is
     chosen, the way it would go on WhatsApp, with its job code written on it.
     Holding the day's photos until Send would mean keeping them in a cheap
     phone's memory all afternoon, and a closed tab would lose every one.
     With no signal the photo waits in Firebase's own store on the phone and
     goes when the signal is back, as a chat message does.

     What the answer keeps is only the tally, "KK-167 ×2, KK-170", so the
     filed report and its Sheet row say which jobs have pictures. */
  var PHOTO_GENERAL = 'General';
  function photoTally(v) {
    var out = [];
    String(v || '').split(/,\s*/).forEach(function (p) {
      var m = /^(.*?)(?:\s*×(\d+))?$/.exec(p.trim());
      if (m && m[1]) out.push({ job: m[1], n: +(m[2] || 1) });
    });
    return out;
  }
  function photoBump(key, job, by) {
    var list = photoTally(values[key]), hit = null;
    list.forEach(function (x) { if (x.job === job) hit = x; });
    if (hit) hit.n += by; else if (by > 0) list.push({ job: job, n: by });
    list = list.filter(function (x) { return x.n > 0; });
    if (list.length) {
      values[key] = list.map(function (x) { return x.job + (x.n > 1 ? ' ×' + x.n : ''); }).join(', ');
    } else delete values[key];
  }
  function photoField(f) {
    var row = el('div', 'fld wide photos' + (f.i ? ' indent' : ''));
    row.id = 'r_' + f.id;
    var lab = el('label', null, L(f));
    lab.id = 'l_' + f.id;
    lab.htmlFor = 'f_' + f.id;
    row.appendChild(lab);

    function chanNow() { return channelFor(report, AUTH.isChairman() ? 'chairman' : AUTH.who()); }
    var chan = chanNow();
    var room = chan && typeof CHANNELS !== 'undefined'
      ? CHANNELS.all().filter(function (c) { return c.id === chan; })[0] : null;
    row.appendChild(el('div', 'hint', room ? t('photoGoesTo').replace('{room}', L(room)) : t('photoNoRoom')));

    /* which job: the codes already written in the job list, or none */
    var ctl = el('div', 'phctl');
    var job = document.createElement('select');
    job.id = 'f_' + f.id;
    job.setAttribute('aria-label', t('photoJob'));
    var jp = String(f.jobsFrom || '').split('.');
    var jobsSig = null;
    function fillJobs() {
      var keep = job.value, seen = {}, codes = [];
      var rows = Array.isArray(values[jp[0]]) ? values[jp[0]] : [];
      rows.forEach(function (r) {
        var c = String((r && r[jp[1]]) || '').trim();
        if (!c || seen[c]) return;
        seen[c] = 1;
        codes.push(c);
      });
      /* rebuilt only when the list changed: a picker redrawn as it opens
         can close itself on some phones */
      if (codes.join('\n') === jobsSig) return;
      jobsSig = codes.join('\n');
      job.innerHTML = '';
      codes.forEach(function (c) {
        var o = document.createElement('option');
        o.value = c; o.textContent = c;
        job.appendChild(o);
      });
      var g = document.createElement('option');
      g.value = PHOTO_GENERAL; g.textContent = t('photoGeneral');
      job.appendChild(g);
      job.value = seen[keep] || keep === PHOTO_GENERAL ? keep : job.options[0].value;
    }
    fillJobs();
    /* the job list may have grown since the form was drawn */
    job.onfocus = fillJobs;
    job.onpointerdown = fillJobs;
    var jobBox = el('div', 'phbox');
    jobBox.appendChild(el('span', 'phlbl', t('photoJob')));
    jobBox.appendChild(job);
    ctl.appendChild(jobBox);

    var note = document.createElement('input');
    note.type = 'text';
    note.maxLength = 200;
    note.placeholder = t('photoNote');
    note.setAttribute('aria-label', t('photoNote'));
    var noteBox = el('div', 'phbox');
    noteBox.appendChild(el('span', 'phlbl', t('photoNote')));
    noteBox.appendChild(note);
    ctl.appendChild(noteBox);

    var pick = document.createElement('input');
    pick.type = 'file';
    pick.accept = 'image/*';
    pick.multiple = true;
    pick.className = 'phpick';
    var add = el('label', 'btn phadd', t('photoAdd'));
    add.appendChild(pick);
    ctl.appendChild(add);
    row.appendChild(ctl);

    var tally = el('div', 'phtally');
    function drawTally() {
      var v = values[f.id];
      tally.textContent = has(v) ? t('photoSentSoFar') + ' ' + String(v).replace(PHOTO_GENERAL, t('photoGeneral')) : '';
    }
    drawTally();
    row.appendChild(tally);
    var strip = el('div', 'phstrip');
    row.appendChild(strip);

    row.drawTally = drawTally;

    pick.onchange = function () {
      var files = Array.prototype.slice.call(pick.files || []);
      pick.value = '';
      if (!files.length) return;
      chan = chanNow();
      if (!photoReady(chan)) return;
      var code = job.value || PHOTO_GENERAL, words = note.value.trim();
      note.value = '';
      sendPhotos(chan, files, code, words, strip, function (by) {
        photoBump(f.id, code, by);
        drawTally();
        refresh();
      });
    };
    return row;
  }

  /* A colour's picture (assets/mat/<code>.webp), or a plain square for a
     code with none — one written in by hand, or KKSUV-03 */
  function swatch(code, big) {
    var known = null;
    for (var i = 0; i < COLOURS.length; i++) if (COLOURS[i].v === code) known = COLOURS[i];
    if (known && !known.noimg) {
      var im = document.createElement('img');
      im.className = 'colsw' + (big ? ' big' : '');
      im.src = 'assets/mat/' + code + '.webp';
      im.alt = '';
      im.loading = 'lazy';
      return im;
    }
    return el('span', 'colsw none' + (big ? ' big' : ''), '?');
  }
  /* The colours as pictures to tap, by range, over the form. `done(code)`
     gets the code tapped or written; '' is "no colour"; closing changes
     nothing. */
  function colourSheet(cur, done) {
    var back = el('div', 'colsheet-back');
    var sh = el('div', 'colsheet');
    sh.setAttribute('role', 'dialog');
    sh.setAttribute('aria-modal', 'true');
    sh.setAttribute('aria-label', t('colPickTitle'));
    var top = el('div', 'colsheet-top');
    top.appendChild(el('div', 'colsheet-title', t('colPickTitle')));
    var x = el('button', 'colsheet-x', '\u00d7');
    x.type = 'button';
    x.setAttribute('aria-label', t('colClose'));
    top.appendChild(x);
    sh.appendChild(top);
    var body = el('div', 'colsheet-body');
    var listed = false;
    COLOUR_GROUPS.forEach(function (g) {
      body.appendChild(el('div', 'colgroup', g));
      var grid = el('div', 'colgrid');
      COLOURS.forEach(function (c) {
        if (c.g !== g) return;
        if (c.v === cur) listed = true;
        var b = el('button', 'coltile' + (c.v === cur ? ' on' : ''));
        b.type = 'button';
        b.setAttribute('data-v', c.v);
        b.setAttribute('aria-pressed', c.v === cur ? 'true' : 'false');
        b.appendChild(swatch(c.v, true));
        b.appendChild(el('span', 'coltile-code', c.v));
        b.onclick = function () { close(c.v); };
        grid.appendChild(b);
      });
      body.appendChild(grid);
    });
    /* a code that is not in the list yet: written in */
    var own = el('div', 'colown');
    var oi = document.createElement('input');
    oi.type = 'text';
    oi.id = 'colown';
    oi.autocapitalize = 'characters';
    oi.placeholder = t('colOwn');
    oi.setAttribute('aria-label', t('colOwn'));
    if (cur && !listed) oi.value = cur;
    var ob = el('button', 'btn ghost', t('colOwnUse'));
    ob.type = 'button';
    ob.onclick = function () {
      var v = oi.value.trim().toUpperCase().replace(/[^0-9A-Z_-]/g, '').slice(0, 20);
      if (v) close(v); else oi.focus();
    };
    own.appendChild(oi);
    own.appendChild(ob);
    body.appendChild(own);
    if (cur) {
      var clr = el('button', 'colclear', t('colClear'));
      clr.type = 'button';
      clr.onclick = function () { close(''); };
      body.appendChild(clr);
    }
    sh.appendChild(body);
    back.appendChild(sh);
    document.body.appendChild(back);
    document.body.classList.add('noscroll');
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    function close(v) {
      document.removeEventListener('keydown', onKey);
      if (back.parentNode) back.parentNode.removeChild(back);
      document.body.classList.remove('noscroll');
      if (v !== undefined) done(v);
    }
    x.onclick = function () { close(); };
    back.onclick = function (e) { if (e.target === back) close(); };
    var on = body.querySelector('.coltile.on');
    if (on) on.scrollIntoView({ block: 'center' });
    x.focus();
  }

  /* the room a photo from this report goes to, or why it cannot go */
  function photoChan() { return channelFor(report, AUTH.isChairman() ? 'chairman' : AUTH.who()); }
  function photoReady(chan) {
    if (!chan || !window.FB || !window.FB.live() || !AUTH.who()) { toast(t('photoNeedsSignIn')); return false; }
    if (!window.KMEDIA) { toast(t('photoNotReady')); return false; }
    return true;
  }
  /* Photos, one at a time: shrinking a photo holds the whole picture in
     memory, and five at once is more than a cheap phone has. Each is shown
     in `strip` with how it is going, and posted into the room `chan` with
     its job code on it. `bump(+1)` counts it the moment it is queued — on a
     site with no signal it goes later by itself, and the report sent
     meanwhile should say so — and `bump(-1)` takes it back if refused. */
  /* photos written and not yet on the server: a report sent meanwhile goes
     after them on a slow line, and its time is when it arrives (bug hunt,
     15 Oct 2026) — the Send says so */
  var photosUp = 0;
  function sendPhotos(chan, files, code, words, strip, bump) {
    var chain = Promise.resolve();
    files.forEach(function (file) {
      chain = chain.then(function () { return sendPhoto(chan, file, code, words, strip, bump); });
    });
  }
  function sendPhoto(chan, file, code, words, strip, bump) {
    var item = el('div', 'phitem busy');
    var st = el('div', 'phst', t('photoShrinking'));
    item.appendChild(el('div', 'phcap', (code === PHOTO_GENERAL ? t('photoGeneral') : code) + (words ? ' · ' + words : '')));
    item.appendChild(st);
    strip.appendChild(item);
    return window.KMEDIA.shrinkImage(file).then(function (img) {
      var im = document.createElement('img');
      im.src = img.data;
      im.alt = '';
      item.insertBefore(im, item.firstChild);
      st.textContent = t('photoSending');
      var text = '📷 ' + t('photoCaption') + ' · ' + (code === PHOTO_GENERAL ? t('photoGeneral') : code)
               + (words ? ' — ' + words : '') + ' · ' + L(report);
      var p;
      try { p = window.FB.postPhoto(chan, img, text, lang); } catch (e) { p = Promise.reject(e); }
      photosUp++;
      p.then(function () { photosUp--; }, function () { photosUp--; });
      bump(1);
      /* not returned: the next photo starts shrinking now, rather than
         waiting all afternoon for a server this one cannot reach */
      p.then(function () {
        st.textContent = t('photoSent');
        item.className = 'phitem ok';
      }, function (e) {
        bump(-1);
        st.textContent = (e && e.code === 'permission-denied') ? t('sendRefused') : t('photoFailed');
        item.className = 'phitem bad';
      });
    }, function (e) {
      var why = e && e.message;
      st.textContent = why === 'too-big' ? t('chatTooBig')
                     : why === 'file-huge' ? t('chatFileHuge')
                     : why === 'not-an-image' ? t('chatCantRead') : t('photoFailed');
      item.className = 'phitem bad';
    });
  }

  /* PAYMENT SLIPS (the user, 15 Oct 2026: "does sales have a photo option
     for the slip?"). A photo picked in a salesperson's payment row goes to
     /slips as it is picked, like a site photo, so a closed tab loses
     nothing. The row keeps how many in its box and their ids under
     `<id>__ids`; the receipt check (apps-script/Receipts.js) hands the ids
     to Selam with the payment. × takes a wrong one off the row. */
  var SLIP_MAX = 4;
  var slipSeen = {};          /* id → the picture, for this page's life: a row redrawn keeps its thumbnails */
  function slipIds(row, id) {
    return String(row[id + '__ids'] || '').split(/\s+/).filter(function (x) { return /^[A-Za-z0-9]{10,40}$/.test(x); });
  }
  function slipSet(row, id, ids) {
    if (ids.length) { row[id + '__ids'] = ids.join(' '); row[id] = String(ids.length); }
    else { delete row[id + '__ids']; delete row[id]; }
  }
  function slipCell(cell, row, c, pid, changed) {
    var pk = document.createElement('input');
    pk.type = 'file';
    pk.accept = 'image/*';
    pk.className = 'phpick';
    pk.id = pid;
    var pb = el('label', 'btn phadd', t('slipAdd'));
    pb.appendChild(pk);
    var strip = el('div', 'phstrip');
    function drop(id, item) {
      slipSet(row, c.id, slipIds(row, c.id).filter(function (x) { return x !== id; }));
      if (item.parentNode) item.parentNode.removeChild(item);
      changed();
    }
    function slipItem(id, src) {
      var item = el('div', 'phitem ok slipitem');
      item.setAttribute('data-slip', id);
      if (src) {
        var im = document.createElement('img');
        im.src = src;
        im.alt = '';
        im.onclick = function () { slipView(id); };
        item.appendChild(im);
      } else {
        var v = el('button', 'slipbtn', t('slipView'));
        v.type = 'button';
        v.onclick = function () { slipView(id); };
        item.appendChild(v);
      }
      var x = el('button', 'slipx', '×');
      x.type = 'button';
      x.setAttribute('aria-label', t('slipRemove'));
      x.onclick = function () { drop(id, item); };
      item.appendChild(x);
      return item;
    }
    slipIds(row, c.id).forEach(function (id) { strip.appendChild(slipItem(id, slipSeen[id])); });
    pk.onchange = function () {
      var file = (pk.files || [])[0];
      pk.value = '';
      if (!file) return;
      if (slipIds(row, c.id).length >= SLIP_MAX) { toast(t('slipMax')); return; }
      if (!window.FB || !window.FB.live() || !AUTH.who() || !window.FB.postSlip) { toast(t('photoNeedsSignIn')); return; }
      if (!window.KMEDIA) { toast(t('photoNotReady')); return; }
      var wait = el('div', 'phitem busy');
      var st = el('div', 'phst', t('photoShrinking'));
      wait.appendChild(st);
      strip.appendChild(wait);
      window.KMEDIA.shrinkImage(file).then(function (img) {
        var r;
        try { r = window.FB.postSlip(img, addis().toISOString().slice(0, 10)); } catch (e) { r = null; }
        if (!r) { st.textContent = t('photoNeedsSignIn'); wait.className = 'phitem bad'; return; }
        slipSeen[r.id] = img.data;
        slipSet(row, c.id, slipIds(row, c.id).concat([r.id]));
        var item = slipItem(r.id, img.data);
        item.className = 'phitem busy slipitem';
        var st2 = el('div', 'phst', t('photoSending'));
        item.appendChild(st2);
        strip.replaceChild(item, wait);
        photosUp++;
        r.done.then(function () {
          photosUp--;
          st2.textContent = t('photoSent');
          item.className = 'phitem ok slipitem';
        }, function (e) {
          photosUp--;
          slipSet(row, c.id, slipIds(row, c.id).filter(function (x) { return x !== r.id; }));
          st2.textContent = (e && e.code === 'permission-denied') ? t('sendRefused') : t('photoFailed');
          item.className = 'phitem bad slipitem';
          changed();
        });
        changed();
      }, function (e) {
        var why = e && e.message;
        st.textContent = why === 'too-big' ? t('chatTooBig')
                       : why === 'file-huge' ? t('chatFileHuge')
                       : why === 'not-an-image' ? t('chatCantRead') : t('photoFailed');
        wait.className = 'phitem bad';
      });
    };
    cell.appendChild(pb);
    cell.appendChild(strip);
  }
  /* a slip's photo over the page; tap or Escape closes it */
  function slipView(id) {
    var back = el('div', 'slipview');
    back.setAttribute('role', 'dialog');
    back.setAttribute('aria-modal', 'true');
    back.setAttribute('aria-label', t('slipTitle'));
    var x = el('button', 'colsheet-x slipclose', '×');
    x.type = 'button';
    x.setAttribute('aria-label', t('colClose'));
    var msg = el('div', 'slipmsg', t('slipLoading'));
    back.appendChild(x);
    back.appendChild(msg);
    document.body.appendChild(back);
    document.body.classList.add('noscroll');
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    function close() {
      document.removeEventListener('keydown', onKey);
      if (back.parentNode) back.parentNode.removeChild(back);
      document.body.classList.remove('noscroll');
    }
    back.onclick = close;
    x.focus();
    var got = slipSeen[id] ? Promise.resolve(slipSeen[id])
            : window.FB && window.FB.getSlip ? window.FB.getSlip(id) : Promise.resolve(null);
    got.then(function (src) {
      if (!back.parentNode) return;
      if (!src || String(src).indexOf('data:image/') !== 0) { msg.textContent = t('slipGone'); return; }
      slipSeen[id] = src;
      var im = document.createElement('img');
      im.src = src;
      im.alt = t('slipTitle');
      back.replaceChild(im, msg);
    });
  }
  /* "📷 Slip 1", "📷 Slip 2" — one button a photo, for Selam's card and the Chairman's page */
  function slipButtons(ids) {
    var box = el('div', 'slipbtns');
    (ids || []).forEach(function (id, n) {
      var b = el('button', 'slipbtn', t('slipView') + (ids.length > 1 ? ' ' + (n + 1) : ''));
      b.type = 'button';
      b.onclick = function () { slipView(id); };
      box.appendChild(b);
    });
    return box;
  }

  /* a grid with dateFrom shows a date per row — redraw those when the date changes */
  function redrawGrids() {
    var nodes = document.querySelectorAll('.repwrap');
    for (var i = 0; i < nodes.length; i++) if (nodes[i].redraw) nodes[i].redraw();
  }

  /* The WhatsApp message is a message. This is the document: the same report
     on Klever letterhead, for a customer file, a printer, or a PDF a phone can
     attach to an email. Built fresh each time so it always matches the form. */
  /* The shape of the report as a document: sections, label/value rows, flags.
     The phone is the only place that knows the labels and the language, so it
     builds this once — the printed page and the emailed PDF both render it. */
  function reportDoc() {
    var doc = [];
    report.sections.forEach(function (sec) {
      var rows = [];
      sec.fields.forEach(function (fl) {
        if (!shown(fl) || fl.quiet) return;
        /* A row is [question, answer as text]. A third entry says how a
           document should lay it out: a list as a real table, a long answer
           in full under its question. Readers that only know the first two
           (an older Sheet script) still get the text. */
        if (fl.t === 'table' || fl.t === 'grid') {
          var tl = tableLines(fl);
          if (tl.length) rows.push([L(fl), tl.join(String.fromCharCode(10)), tableData(fl)]);
          return;
        }
        var v = fmt(fl);
        if (!has(v) || v === '— / —') return;
        var lab = (fl.i || fl.show ? '· ' : '') + asked(L(fl));
        rows.push(fl.t === 'area' || String(v).length > 60 ? [lab, v, { long: true }] : [lab, v]);
      });
      if (rows.length) doc.push({ sec: L(sec), rows: rows });
    });
    return doc;
  }

  function reportFlags() {
    var out = [];
    var gaps = unanswered();
    if (gaps.length) out.push(unansweredLine(gaps));
    oddNow().forEach(function (o) { out.push(t('toCheck') + ': ' + oddLine(o)); });
    liveFields().forEach(function (fl) {
      if (targetMiss(fl)) out.push(said(L(fl)) + ' ' + fmt(fl) + ' — ' + (lang === 'am' ? fl.tgt.am : fl.tgt.en));
    });
    return out;
  }

  function printTable(d) {
    var t2 = el('table', 'pd-sub');
    var hr = el('tr');
    d.head.forEach(function (h, i) { hr.appendChild(el('th', d.num[i] ? 'n' : null, h)); });
    var thead = el('thead');
    thead.appendChild(hr);
    t2.appendChild(thead);
    var tb = el('tbody');
    d.rows.forEach(function (row) {
      var tr = el('tr');
      row.forEach(function (c, i) { tr.appendChild(el('td', i === 0 ? 'k' : (d.num[i] ? 'n' : null), c)); });
      tb.appendChild(tr);
    });
    t2.appendChild(tb);
    if (d.total) {
      var ft = el('tfoot'), fr = el('tr'), fc = el('td', 'n', d.total);
      fc.colSpan = d.head.length;
      fr.appendChild(fc); ft.appendChild(fr); t2.appendChild(ft);
    }
    return t2;
  }

  function buildPrintDoc() {
    var old = document.getElementById('printdoc');
    if (old) old.parentNode.removeChild(old);

    var person = personById(report.person);
    var doc = el('div', 'printdoc');
    doc.id = 'printdoc';

    var head = el('header', 'pd-head');
    /* the company's own letterhead: its logo, or its name until it has one */
    var pco = typeof companyOf === 'function' ? companyOf(report.person) : BRAND;
    head.appendChild(brandMark('pd-logo', pco));
    var kind = el('div', 'pd-kind', coOk(pco) ? L({ en: COMPANIES[pco].titleEn, am: COMPANIES[pco].titleAm }) : t('siteTitle'));
    head.appendChild(kind);
    doc.appendChild(head);

    doc.appendChild(el('h1', 'pd-title', L(report)));

    var meta = el('dl', 'pd-meta');
    [[t('to'), lang === 'am' ? report.toAm : report.toEn],
     ['', L(person) + ' · ' + (lang === 'am' ? person.roleAm : person.roleEn)],
     [t('date'), today() + ' · ' + clock()],
     [t('due'), lang === 'am' ? report.dueAm : report.dueEn]].forEach(function (r, i) {
      if (!r[1]) return;
      meta.appendChild(el('dt', null, i === 1 ? t('from') : r[0]));
      meta.appendChild(el('dd', null, r[1]));
    });
    var pdn = periodNow(report);
    var st = el('dd', 'pd-status' + (pdn.state === 'late' ? ' late' : ''));
    st.textContent = statusWord(pdn) + (pdn.day ? ' · ' + statusLine(report, pdn) : '');
    meta.appendChild(el('dt', null, ''));
    meta.appendChild(st);
    var gapsP = unanswered();
    if (gapsP.length) {
      meta.appendChild(el('dt', null, ''));
      meta.appendChild(el('dd', 'pd-status late', unansweredLine(gapsP)));
    }
    doc.appendChild(meta);

    reportDoc().forEach(function (s) {
      doc.appendChild(el('h2', 'pd-sec', s.sec));
      var tbl = el('table', 'pd-tbl');
      s.rows.forEach(function (r) {
        var tr = el('tr'), how = r[2];
        if (how && (how.long || how.head)) {
          /* a list or a long answer takes the page's full width, under its question */
          var td = el('td', how.head ? 'pd-full pd-list' : 'pd-full');
          td.colSpan = 2;
          td.appendChild(el('div', 'pd-q', r[0]));
          if (how.head) td.appendChild(printTable(how));
          else td.appendChild(el('div', 'pd-long', r[1]));
          tr.appendChild(td);
        } else {
          tr.appendChild(el('th', null, r[0]));
          tr.appendChild(el('td', null, r[1]));
        }
        tbl.appendChild(tr);
      });
      doc.appendChild(tbl);
    });

    var flags = reportFlags();
    if (flags.length) {
      doc.appendChild(el('h2', 'pd-sec pd-flagsec', t('flags')));
      var fl2 = el('ul', 'pd-flags');
      flags.forEach(function (x) { fl2.appendChild(el('li', null, x)); });
      doc.appendChild(fl2);
    }

    var sig = el('div', 'pd-sig');
    [L(person), t('date')].forEach(function (lbl) {
      var c = el('div', 'pd-sigcell');
      c.appendChild(el('div', 'pd-sigline'));
      c.appendChild(el('div', 'pd-siglbl', lbl));
      sig.appendChild(c);
    });
    doc.appendChild(sig);

    document.body.appendChild(doc);
  }

  function buildBar() {
    /* Signing in on a form's own page draws the form twice (the sign-in
       listener routes, and so does the sign-in itself). Without this the
       second bar sat on top of the first, and the count the person saw was
       the one nothing updated. */
    Array.prototype.forEach.call(document.querySelectorAll('body > .bar'), function (b) {
      b.parentNode.removeChild(b);
    });
    var bar = el('div', 'bar'), inner = el('div', 'bar-in');
    var count = el('button', 'count'); count.id = 'count'; count.type = 'button';
    /* No PDF button (13 Oct): nobody used it. Ctrl+P, or a phone's own
       Print menu, still gives the same document */
    window.addEventListener('beforeprint', buildPrintDoc);
    var send = el('button', 'btn', t('send'));
    send.type = 'button'; send.id = 'send';
    /* Reports are not posted in chat (the Chairman, 13 Oct 2026: "it
       shouldn't be on chat"). The filing carries who it is for (`to`), and
       they read it under "Reports sent to you" on their own home page. */
    var names = lang === 'am' ? report.toAm : report.toEn;

    send.onclick = function () {
      if (sending) return;
      /* a `must` box empty: it does not go at all — say which, and go to it */
      var gaps = mustGaps();
      if (gaps.length) {
        clearTimeout(sendDisarm);
        sendArmed = false;
        marking = true;
        refresh();
        toast(t('mustFill').replace('{list}', gaps.map(mustName).join(', ')));
        var gap = document.getElementById(gaps[0].id);
        if (gap) {
          gap.scrollIntoView({ block: 'center', behavior: 'smooth' });
          try { gap.focus({ preventScroll: true }); } catch (e) {}
        }
        return;
      }
      /* not everything answered: ask once, show which, then send on the
         second tap within a few seconds */
      if ((missingNow > 0 || oddCount > 0) && !sendArmed) {
        sendArmed = true;
        marking = true;
        refresh();
        send.textContent = missingNow > 0 ? t('sendAnyway').replace('{n}', missingNow)
                                          : t('sendOddAnyway').replace('{n}', oddCount);
        toast(missingNow > 0 && oddCount > 0
                ? t('sendBothWarn').replace('{n}', missingNow).replace('{m}', oddCount)
                : missingNow > 0 ? t('sendPartialWarn').replace('{n}', missingNow)
                                 : t('sendOddWarn').replace('{n}', oddCount));
        var firstOdd = document.querySelector('.isodd');
        if (!missingNow && firstOdd) firstOdd.scrollIntoView({ block: 'center', behavior: 'smooth' });
        clearTimeout(sendDisarm);
        sendDisarm = setTimeout(function () { sendArmed = false; if (!sending) send.textContent = t(sentBefore ? 'sendCorrection' : 'send'); }, 6000);
        return;
      }
      clearTimeout(sendDisarm);
      sendArmed = false;
      sending = true;
      send.disabled = true;
      send.textContent = t('sending');
      var txt = buildMessage(), pd = periodNow(report), late = pd.state === 'late';
      if (photosUp > 0) toast(tfill_('photosStillUp', { n: photosUp }));
      /* a correction: the first one, sent on time, decides (Agent.js) — it
         was filed and emailed as LATE (the bug hunt, 15 Oct 2026) */
      var first = pd.day ? filingFor(report, pd.day) : null;
      if (late && first && !first.pending && first.at <= pd.deadline) late = false;
      if (draftKey !== 'klever.draft.' + report.id + '.' + (pd.day || stamp())) { sending = false; location.reload(); return; }
      var person = personById(report.person);

      /* Two homes, on purpose. The Sheet is the Chairman's window on the day
         and it drives the emails; Firestore is the copy that is signed in and
         cannot be forged, which is the one the penalty ledger answers for.
         The Sheet is sent English names and ids whatever language the form
         was filled in, so one report's history stays in one tab. */
      ARCHIVE.file({
        at: new Date(nowMs()).toISOString(),
        person: report.person,
        personName: person.en,
        report: report.id,
        reportName: report.en,
        by: AUTH.who() === '*' ? 'chairman' : AUTH.who(),
        byName: AUTH.isChairman() ? 'Chairman' : personById(AUTH.who()).en,
        to: report.toEn,
        roleName: person.roleEn,
        due: report.dueEn,
        doc: reportDoc(),
        flags: reportFlags(),
        late: late,
        values: answers(),
        text: txt,
        lang: lang
      });

      if (!(window.FB && window.FB.live() && AUTH.who())) {
        sending = false;
        send.textContent = t('sentDone');
        return;
      }
      /* With no signal the filing waits in this phone's store and goes when
         the signal comes back. Say so plainly, rather than "Sending…" forever:
         the time that counts is when it reaches the server. */
      var slow = setTimeout(function () {
        send.textContent = t('waitingToSend');
        toast(t('savedNotReceived'));
      }, 6000);
      var pendKey = addPending(report);
      /* The draft goes the moment Send is pressed, not when the server
         answers. Firebase keeps an unanswered filing and sends it later by
         itself; a person who left on a slow line before the answer came had
         the sent report come back the next morning as an "unsent draft",
         with yesterday's figures in today's form. Refused, it is put back. */
      var sentDraft = JSON.stringify(values);
      /* only where this browser can keep it: without IndexedDB, Firebase
         holds an unsent filing in memory, and closing the app would lose
         both it and the draft — there the draft waits for the answer */
      if (IDB_OK) clearDrafts(report.id);
      drawStatus();
      window.FB.fileReport({
        person: report.person,
        report: report.id,
        late: late,
        due: report.dueEn,
        values: answers(),
        flags: reportFlags(),
        text: txt,
        lang: lang,
        to: reportTo(report)
      }).then(function () {
        clearTimeout(slow);
        sending = false;
        sentThisVisit = true;
        lastSent = sentDraft;
        sentBefore = nowMs();
        try { store.set(sentKeyOf(draftKey), JSON.stringify({ at: sentBefore, srv: 1, values: JSON.parse(sentDraft) })); } catch (e) {}
        send.textContent = t('sentDone');
        replay(send, 'sentok');
        if (reportTo(report).length && names) toast(t('sentTo').replace('{who}', names));
        clearDrafts(report.id);
        dropPending(pendKey);
        drawStatus();
      })['catch'](function (e) {
        clearTimeout(slow);
        store.set(draftKey, sentDraft);
        dropPending(pendKey);
        drawStatus();
        sending = false;
        send.disabled = false;
        send.textContent = t(sentBefore ? 'sendCorrection' : 'send');
        toast((e && e.code === 'permission-denied') ? t('sendRefused') : t('sendFailed'));
      });
    };
    inner.appendChild(count);
    inner.appendChild(send);
    bar.appendChild(inner);
    document.body.appendChild(bar);
  }

  /* Can this browser keep an unsent filing after the app is closed? Firebase
     keeps it in IndexedDB; with none (some private modes), only in memory. */
  var IDB_OK = false;
  try {
    var idbReq = window.indexedDB && window.indexedDB.open('klever-idb-probe');
    if (idbReq) {
      idbReq.onsuccess = function () { IDB_OK = true; try { idbReq.result.close(); } catch (e) {} };
      idbReq.onerror = function () { IDB_OK = false; };
    }
  } catch (e) { IDB_OK = false; }

  /* a sent report is not sent twice by accident */
  var sending = false, sentThisVisit = false;
  /* what was last sent from this page, and when this period's report was
     first sent from this phone — a change after it is a correction */
  var lastSent = '', sentBefore = null;
  function sentKeyOf(dk) { return String(dk).replace('klever.draft.', 'klever.sent.'); }
  /* how many required questions are empty right now, and whether Send has
     asked "send it anyway?" and is waiting for the second tap */
  var missingNow = 0, oddCount = 0, sendArmed = false, sendDisarm = null;
  var lastMissing = null;   /* the count last drawn, so a change can be shown (MOTION) */

  /* ---------------- live state ---------------- */

  /* the required questions still unanswered, by name */
  /* A question the form works out is never one the person failed to answer:
     until 11 Oct 2026 a weekly report whose dailies were missing went out
     saying "25 not answered" about 22 figures nobody could have typed, and
     the HR reader told the Chairman so. */
  function unanswered() {
    return liveFields().filter(function (f) { return toAnswer(f) && !filled(f); }).map(function (f) { return L(f); });
  }
  function unansweredLine(list) {
    return t('notAnsweredCount').replace('{n}', list.length);
  }

  function allFields() {
    var out = [];
    report.sections.forEach(function (s) { s.fields.forEach(function (f) { out.push(f); }); });
    return out;
  }

  /* A follow-up question — show:{f:'<the question above>', when:…} — opens
     only when that answer needs explaining: 'pos' a count above zero, 'miss'
     a target missed, 'short' fewer than all (5 / 7), 'yes' or 'no', 'is' one
     choice (with v), 'any' answered at all. A closed follow-up is not asked,
     not counted as empty, and not sent. */
  function fieldById(id) {
    var hit = null;
    report.sections.forEach(function (s) { s.fields.forEach(function (f) { if (f.id === id) hit = f; }); });
    return hit;
  }
  function shown(f) {
    /* `askFrom`: a question not asked before that day (the user, 15 Oct
       2026: Getachew's earlier jobs and job amounts, not that day) */
    if (f.askFrom && addis().toISOString().slice(0, 10) < f.askFrom) return false;
    /* `once`: asked until an earlier report has answered it — and not while
       that is unknown (loadCarry), or it could be answered twice */
    if (f.once && ONCE_DONE[f.id] !== false) return false;
    if (f.carry && f.carry.hideEmpty && !(Array.isArray(values[f.id]) && values[f.id].length)) return false;
    if (!f.show) return true;
    var p = fieldById(f.show.f), w = f.show.when || 'pos';
    if (!p || !shown(p)) return false;
    if (w === 'any') return filled(p);
    if (w === 'miss') return targetMiss(p);
    if (w === 'yes' || w === 'no') return values[p.id] === w;
    if (w === 'is') return values[p.id] === f.show.v;
    /* opened by a tap on a "what happened" list (t:'multi') */
    if (w === 'has') {
      var hv = String(values[p.id] || '').split(',');
      return [].concat(f.show.v).some(function (c) { return hv.indexOf(c) >= 0; });
    }
    if (p.t === 'ratio') {
      var a = num(values[p.id + '__a']), b = num(values[p.id + '__b']);
      if (w === 'short') return !isNaN(a) && !isNaN(b) && a < b;
      return !isNaN(a) && a > 0;
    }
    var v = num(values[p.id]);
    return !isNaN(v) && v > 0;
  }
  function liveFields() { return allFields().filter(shown); }
  /* A box marked `must` in forms.js cannot be left empty: Send does not go,
     not even on the second tap, until it is filled (13 Oct 2026, the
     Chairman: "he must add m² — don't let him send without it"; Amaha's
     Monday report named three jobs and not one m²). On a question it is the
     answer, typed or worked out; on a list's column it is that box in every
     row with anything in it. Each gap carries the id of the box to mark. When
     a row's box is the gap, the question worked out from it is not named too. */
  function mustGaps() {
    var cells = [], whole = [];
    liveFields().forEach(function (f) {
      if (f.t === 'table') {
        (f.cols || []).forEach(function (c) {
          /* `mustFrom`: a box that may be left empty before that day (the
             user, 15 Oct 2026: Getachew's job amounts, for that day only) */
          if (!c.must || (c.mustFrom && addis().toISOString().slice(0, 10) < c.mustFrom)) return;
          (values[f.id] || []).forEach(function (row, i) {
            /* `mustDue`: a credit not due yet need not be answered (23 Oct 2026) */
            if (c.mustDue && !creditDueNow(row)) return;
            if (row && rowHasData(row, f.cols) && colOn(c, row) && !has(row[c.id])) {
              cells.push({ f: f, c: c, row: row, id: 'c_' + f.id + '_' + i + '_' + c.id, n: i + 1 });
            }
          });
        });
      }
      if (f.must && !filled(f)) {
        var src = autoTable(f);
        whole.push({ f: f, id: src ? 'w_' + src : (document.getElementById('f_' + f.id) ? 'f_' + f.id : 'w_' + f.id) });
      }
    });
    return cells.length ? cells : whole;
  }
  function mustName(g) {
    if (!g.c) return L(g.f);
    /* the row by its first box ("rbt3375"), or its number */
    var first = g.f.cols[0], v = first && g.row[first.id];
    return L(g.c) + ' (' + (has(v) && first.t !== 'choice' ? String(v).trim() : '#' + g.n) + ')';
  }
  /* Does this question put anything on the screen? A worked-out yes/no read
     off a list does not, and nor does a count that sits on the summary line
     of a list that is shut — a section holding only those is an empty
     heading, and an empty heading is a question people go looking for. */
  function drawsSomething(f) {
    if (!shown(f) || f.quiet) return false;
    /* jobs carried from earlier reports: nothing waiting, nothing to ask */
    if (f.carry) return Array.isArray(values[f.id]) && values[f.id].length > 0;
    if (autoInLine(f)) {
      var tf = fieldById(autoTable(f));
      return !!tf && shown(tf);
    }
    if (f.auto && f.t !== 'table' && document.getElementById('av_' + f.id)) return !hideBlankAuto(f);
    return true;
  }
  /* on a daily form only: a week or month figure that comes out empty says
     something (your dailies did not hold it), so there it stays as a dash */
  function hideBlankAuto(f) { return report.cadence === 'daily' && autoBlank(f); }
  function autoBlank(f) {
    var v = fmt(f);
    return v === '' || v === '— / —';
  }

  /* Answers that cannot be right — 11 called out of 10 new leads, sources
     that add up to more than the total. The check lives in forms.js, where
     the morning agents read it too. It never stops a report going; it asks
     once, like an empty question, and the sent report says what to check. */
  function oddNow() {
    if (typeof oddFigures !== 'function') return bookOdd();
    return oddFigures(report, values).filter(function (o) {
      var f = fieldById(o.f);
      return f && shown(f);
    }).concat(bookOdd());
  }
  function oddText(o) { return lang === 'am' ? o.am : o.en; }
  function oddLine(o) {
    var f = fieldById(o.f), bw = f && f.t === 'ratio' ? boxWords(f) : null;
    return said(bw ? bw.q : L(f)) + ' ' + oddText(o);
  }

  /* what is filed: the answers to the questions that were asked. A follow-up
     answered and then closed again (the 2 went back to 0) is left out. */
  function answers() {
    var out = {};
    allFields().forEach(function (f) {
      if (shown(f)) return;
      out['-' + f.id] = 1;
      out['-' + f.id + '__a'] = 1;
      out['-' + f.id + '__b'] = 1;
      out['-' + f.id + '__other'] = 1;
    });
    var keep = {};
    /* the buttons tapped and the words typed under them (pickField) are the
       draft's business; the answer is the line they make */
    Object.keys(values).forEach(function (k) { if (!out['-' + k] && !/__[pn]$/.test(k)) keep[k] = values[k]; });
    /* a grid row untapped again files nothing, whatever was typed in it; the
       rows keep their places, so row 3 is still the third material */
    allFields().forEach(function (f) {
      if (!f.rowsOn || !Array.isArray(keep[f.id])) return;
      keep[f.id] = keep[f.id].map(function (r, i) { return gridRowOn(f, i) ? r : {}; });
    });
    /* A count that only opens when its thing happened ("Edges lifted",
       tapped on the list) is nought when the list was answered without it.
       `zero:1` files that nought, so the week adds a real 0 and the rulebook
       does not read a blank as "not reported". An unanswered list files
       nothing — that is not an answer. */
    allFields().forEach(function (f) {
      if (!f.zero || shown(f)) return;
      var g = f.show && fieldById(f.show.f);
      if (g && shown(g) && filled(g)) keep[f.id] = '0';
    });
    /* "Nothing needed" (a pick marked nil:1) answers the question on the
       phone and in the message, but it is not a need: filed, it would stand
       in the morning brief's list of who is waiting on whom (Agents.js
       waitsOn_) as if it were one. Only the nil button, no words: nothing
       is filed. */
    allFields().forEach(function (f) {
      if (!f.picks || !(f.id in keep)) return;
      var p = Array.isArray(values[f.id + '__p']) ? values[f.id + '__p'] : [];
      if (!p.length || String(values[f.id + '__n'] || '').trim()) return;
      var allNil = p.every(function (code) {
        return f.picks.some(function (o) { return o.en === code && o.nil; });
      });
      if (allNil) delete keep[f.id];
    });
    return keep;
  }

  /* a list box asked only once another in the row is answered (ifCol) —
     and not with one of `ifNot`, or only with one of `ifIn` ("What did it
     all cost?" once "everything is bought" is tapped) */
  function colOn(c, row) {
    if (!c.ifCol) return true;
    var v = row && row[c.ifCol];
    return has(v) && (c.ifNot || []).indexOf(v) === -1 && (!c.ifIn || c.ifIn.indexOf(v) !== -1);
  }

  function rowHasData(row, cols) {
    for (var i = 0; i < cols.length; i++) if (has(row[cols[i].id])) return true;
    return false;
  }

  function filled(f) {
    if (f.t === 'ratio') return has(values[f.id + '__a']) && has(values[f.id + '__b']);
    if (f.t === 'table') {
      var d = values[f.id];
      return Array.isArray(d) && d.some(function (r) { return rowHasData(r, f.cols); });
    }
    if (f.t === 'grid') {
      var g = values[f.id];
      if (!Array.isArray(g) || g.length < f.rows.length) return false;
      return f.rows.every(function (_, i) { return has(g[i] && g[i][f.cols[0].id]); });
    }
    return has(values[f.id]);
  }
  function has(v) { return v != null && String(v).trim() !== ''; }

  /* the digits in what was typed: "1,500 Birr" is 1500 */
  function num(v) {
    var x = String(v == null ? '' : v).replace(/[^0-9.\-]/g, '');
    return x === '' ? NaN : Number(x);
  }
  /* ---------- the answers the form works out for itself ----------

     A question marked `auto` in forms.js is never typed. It is worked out
     from the rows already filled in beside it: the table is the answer, and
     the count, the total, the share and the week's figure all follow from
     it. Each one lands in the answer key it has always had, so the rulebook
     (js/rules.js), the morning agents and the charts read it exactly as they
     did when a person typed it in by hand.

     Nobody types a number the form can add up. "How many deliveries came in
     today?" standing above the list of today's deliveries was one answer
     asked twice, and 190 questions across the 48 forms were that shape.

     The kinds, as forms.js writes them:
        {rows:'tbl'}                      rows with anything in them
        {rows:'tbl', when:{col:'ok', is:'no'}}      ... only matching rows
        {sum:'tbl.col'}  {sum:'tbl.col', when:{}}   a column added up
        {grid:'gr.col'}                   a fixed grid's column added up
        {list:'tbl.col'}                  the column's words, each once
        {all:'tbl.col'}  {any:'tbl.col'}  a yes/no over the rows
                                          (each of these takes `when` too)
        {of:'key'}                        another answer, as it stands
        {plus:['a','b']}   {minus:['a','b']}
        {div:['a','b']}    {pct:['a','b']}
        {week:'key'}                      this week's own dailies, added up
                                          (how:'max'|'last'|'avg' to not add)
        {a:<kind>, b:<kind>}              the two boxes of a two-box question
     What a kind cannot work out reads blank, never zero — with one
     exception: a list behind a gate that was never opened ("Any defects
     today? No") is nothing happening, and there zero is the truth.

     An auto answer is never counted as an empty question. The person cannot
     fill it, and the table it is drawn from does its own asking. */

  function round(x, n) { var p = Math.pow(10, n); return Math.round(x * p) / p; }

  function rowsWithData(id) {
    var f = fieldById(id), d = values[id];
    if (!f || !f.cols || !Array.isArray(d)) return [];
    return d.filter(function (r) { return r && rowHasData(r, f.cols); });
  }
  /* `when` is one test on a column, or several that must all hold */
  function rowIs(r, when) {
    var v = r[when.col];
    if (when.is != null) return String(v == null ? '' : v) === String(when.is);
    if (when.in) return when.in.indexOf(String(v == null ? '' : v)) >= 0;
    if (when.not != null) return has(v) && String(v) !== String(when.not);
    if (when.lt != null) { var l = num(v); return !isNaN(l) && l < when.lt; }
    if (when.gte != null) { var g = num(v); return !isNaN(g) && g >= when.gte; }
    if (when.pos) { var x = num(v); return !isNaN(x) && x > 0; }
    return has(v);
  }
  function rowsMatch(id, when) {
    var rows = rowsWithData(id);
    if (!when) return rows;
    var tests = [].concat(when);
    return rows.filter(function (r) {
      for (var i = 0; i < tests.length; i++) if (!rowIs(r, tests[i])) return false;
      return true;
    });
  }

  /* A list that is shut: is it shut because the person said there was
     nothing, or because they have not answered yet? "No deliveries today"
     is nought; an unanswered gate is not an answer at all, and must not be
     filed as one. */
  function closedAtZero(tf) {
    if (!tf.show) return false;
    var g = fieldById(tf.show.f);
    return !!(g && shown(g) && filled(g));
  }
  /* one side of a share or a division: an answer key, a kind of its own, or
     a plain number (six working days in a week) */
  function autoSide(x) {
    if (typeof x === 'number') return x;
    return (x && typeof x === 'object') ? autoOne(x) : num(values[x]);
  }

  function autoOne(k) {
    if (!k) return NaN;
    if (k.of != null) return num(values[k.of]);
    /* supplier credit added up from the credit list (23 Oct 2026) */
    if (k.credit != null) return creditFigure(k.credit);
    /* a yes/no read off a "tap everything that happened" list: yes when one
       of `v` was tapped, no when the list was answered without it, blank
       while the list is unanswered. `flip` is for a question asked the right
       way round — "Was the floor clean?" is no when "Floor left dirty" was
       tapped. */
    /* rows folded out of another list, row by row: {fold:'plan_week',
       sum:{m2:['m1','n2','n3']}, join:{jobs:['k1','k2','k3']}, keep:{notes:'notes'}}
       — the day's total m² and its jobs from the jobs written one by one */
    if (k.fold != null) {
      /* `when`: only the rows that say so — Selam's advances, out of her one
         list of every transaction (16 Oct 2026) */
      var src = k.when ? rowsMatch(k.fold, k.when) : (Array.isArray(values[k.fold]) ? values[k.fold] : []);
      return src.map(function (r) {
        r = r || {};
        var o = {};
        Object.keys(k.sum || {}).forEach(function (to) {
          var tot = 0, got = 0;
          k.sum[to].forEach(function (c) { var x = num(r[c]); if (!isNaN(x)) { tot += x; got++; } });
          if (got) o[to] = String(round(tot, 3));
        });
        Object.keys(k.join || {}).forEach(function (to) {
          var w = k.join[to].map(function (c) { return String(r[c] == null ? '' : r[c]).trim(); }).filter(Boolean);
          if (w.length) o[to] = w.join(' ');
        });
        Object.keys(k.keep || {}).forEach(function (to) {
          if (has(r[k.keep[to]])) o[to] = String(r[k.keep[to]]).trim();
        });
        return o;
      });
    }
    if (k.picked != null) {
      var mf = fieldById(k.picked);
      if (!mf || !shown(mf) || !has(values[k.picked])) return '';
      var codes = String(values[k.picked]).split(',');
      var hit = [].concat(k.v).some(function (c) { return codes.indexOf(c) >= 0; });
      return (hit !== !!k.flip) ? 'yes' : 'no';
    }
    if (k.week != null) return weekFigure(k.week, k);
    if (k.soFar != null) return soFarFigure(k);
    /* how many days of the week were reported at all — the divisor of every
       "on average per working day" question */
    if (k.weekDays) return WEEKVALS ? (weekFilings(k).length || NaN) : NaN;
    /* A list the week already wrote. The weekly report used to ask for every
       contract of the week to be typed out again, each one already a row in
       the daily report that signed it. These are those rows, gathered — with
       the day they were filed on, which the typed-out version never had. */
    if (k.weekRows != null) {
      if (!WEEKVALS) return null;
      var out = [], map = k.map || null;
      weekFilings(k).forEach(function (d) {
        var day = ymdOf(addis(d.at));
        (Array.isArray((d.values || {})[k.weekRows]) ? d.values[k.weekRows] : []).forEach(function (r) {
          if (!r || typeof r !== 'object') return;
          var row = {}, any = false;
          Object.keys(r).forEach(function (c) {
            var to = map && map[c] ? map[c] : c;
            row[to] = r[c];
            if (has(r[c])) any = true;
          });
          if (!any) return;
          if (k.dayCol) row[k.dayCol] = day;
          out.push(row);
        });
      });
      return out;
    }
    if (k.plus) {
      var tot = 0, got = 0;
      k.plus.forEach(function (x) { var v = autoSide(x); if (!isNaN(v)) { tot += v; got++; } });
      return got ? round(tot, 3) : NaN;
    }
    if (k.minus) {
      var ma = autoSide(k.minus[0]), mb = autoSide(k.minus[1]);
      return (isNaN(ma) || isNaN(mb)) ? NaN : round(ma - mb, 3);
    }
    if (k.div || k.pct) {
      var p = k.div || k.pct, x = autoSide(p[0]), y = autoSide(p[1]);
      if (isNaN(x) || isNaN(y) || y === 0) return NaN;
      return k.pct ? round(x / y * 100, 1) : round(x / y, 2);
    }
    if (k.grid) {
      var g = String(k.grid).split('.'), gf = fieldById(g[0]);
      if (!gf) return NaN;
      if (!shown(gf)) return closedAtZero(gf) ? 0 : NaN;
      var gr = Array.isArray(values[g[0]]) ? values[g[0]] : [], gt = 0, gn = 0;
      gr.forEach(function (r) { var gx = num(r && r[g[1]]); if (!isNaN(gx)) { gt += gx; gn++; } });
      return gn ? round(gt, 3) : NaN;
    }
    if (k.rows) {
      var tf = fieldById(k.rows);
      if (!tf) return NaN;
      if (!shown(tf)) return closedAtZero(tf) ? 0 : NaN;
      if (!rowsWithData(k.rows).length) return NaN;
      return rowsMatch(k.rows, k.when).length;
    }
    /* the things themselves, named: "MDF 18mm, Hinges" out of the rows of a
       list, so a one-line answer that used to be typed beside the list is
       not typed at all */
    if (k.list) {
      var lp = String(k.list).split('.'), lf = fieldById(lp[0]);
      if (!lf || !shown(lf)) return '';
      var out = [];
      rowsMatch(lp[0], k.when).forEach(function (r) {
        var w = String((r && r[lp[1]]) || '').trim();
        if (w && out.indexOf(w) === -1) out.push(w);
      });
      return out.join(', ');
    }
    /* the row with the most of something, said in one line: the card longest
       in one column, out of the stuck cards (12 Oct 2026) —
       {top:'b_stuck_list', by:'days', say:['code', 'col', 'days'], unit:{…}} */
    if (k.top != null) {
      var topF = fieldById(k.top);
      if (!topF || !shown(topF)) return '';
      var topR = null, topX = -Infinity;
      rowsWithData(k.top).forEach(function (r) {
        var x = num(r && r[k.by]);
        if (!isNaN(x) && x > topX) { topX = x; topR = r; }
      });
      if (!topR) return '';
      return (k.say || []).map(function (c) {
        var col = (topF.cols || []).filter(function (cc) { return cc.id === c; })[0];
        if (!col || !has(topR[c])) return '';
        return c === k.by && k.unit ? String(topR[c]).trim() + ' ' + L(k.unit) : colText(col, topR[c], topR);
      }).filter(Boolean).join(' · ');
    }
    /* a yes/no over every row: did each one carry its approval, go to the
       right job, get its photo. Blank until the rows say — "no" is a finding
       and must not be one the form invented out of an unticked box. */
    if (k.all || k.any) {
      var ap = String(k.all || k.any).split('.'), af = fieldById(ap[0]);
      if (!af || !shown(af)) return '';
      /* `when`: only the rows the question is about ("every job worked on
         today" — not the ones nobody touched) */
      var ar = rowsMatch(ap[0], k.when);
      if (!ar.length) return '';
      var said = ar.map(function (r) { return String((r && r[ap[1]]) || ''); });
      if (k.any) return said.indexOf('yes') >= 0 ? 'yes' : (said.indexOf('no') >= 0 ? 'no' : '');
      if (said.indexOf('no') >= 0) return 'no';
      return said.indexOf('') >= 0 ? '' : 'yes';
    }
    if (k.sum) {
      var s = String(k.sum).split('.'), sf = fieldById(s[0]);
      if (!sf) return NaN;
      if (!shown(sf)) return closedAtZero(sf) ? 0 : NaN;
      if (!rowsWithData(s[0]).length) return NaN;
      var st = 0, sn = 0;
      rowsMatch(s[0], k.when).forEach(function (r) {
        var sx = num(r && r[s[1]]); if (!isNaN(sx)) { st += sx; sn++; }
      });
      /* `orZero`: the list is answered and none of its rows are of this kind
         — no advance among today's transactions is 0 advances, not a blank */
      return sn ? round(st, 3) : (k.orZero ? 0 : NaN);
    }
    return NaN;
  }

  /* WHAT THEY WROTE LATELY, to tap (11 Oct 2026, the Chairman: "make most
     questions choice"). A job code, a customer, a supplier cannot be a fixed
     list, but today's are mostly yesterday's: KK-180 was on the factory floor
     all week. The person's own reports of the last three weeks give each
     code-and-name box its recent answers as buttons; a tap fills the box. */
  var RECENT = {}, recentFor = null;
  var RECENT_COLS = /^(code|job|rcode|cust|lc|sup|psup|site|who|to|sp|owner|name|k1|k2|k3)$/;
  function recentKey(f, c) {
    if (c) return (c.t === 'text' && RECENT_COLS.test(c.id)) ? f.id + '.' + c.id : null;
    return f.recent ? f.id : null;
  }
  function loadRecent() {
    if (!report || recentFor === report.id) return;
    recentFor = report.id;
    RECENT = {};
    if (!window.FB || !FB.ownReports || !AUTH.who()) return;
    FB.ownReports(report.person, new Date(nowMs() - 21 * 864e5)).then(function (list) {
      var got = {};
      (list || []).slice().sort(function (a, b) { return b.at - a.at; }).forEach(function (d) {
        if (d.report !== report.id) return;
        var v = d.values || {};
        allFields().forEach(function (f) {
          var add = function (k, w) {
            w = String(w == null ? '' : w).trim();
            if (!w || w.length > 40) return;
            var arr = got[k] = got[k] || [];
            if (arr.length < 6 && !arr.some(function (x) { return x.toLowerCase() === w.toLowerCase(); })) arr.push(w);
          };
          if (recentKey(f)) add(f.id, v[f.id]);
          (f.cols || []).forEach(function (c) {
            var k = recentKey(f, c);
            if (k && Array.isArray(v[f.id])) v[f.id].forEach(function (r) { if (r) add(k, r[c.id]); });
          });
        });
      });
      RECENT = got;
      Array.prototype.forEach.call(document.querySelectorAll('[data-recent]'), function (b) { if (b.refill) b.refill(); });
    })['catch'](function () {});
  }

  /* JOBS CARRIED FROM EARLIER REPORTS (carry — the Chairman, 14 Oct 2026:
     "ask him, did he finish purchasing the previous jobs he mentioned?").
     Every job code this person wrote in the lists `carry.from` names, in
     their own reports of the last `days`, comes back as a row of the list,
     its code already in the first column, until a report answers it with
     one of `close.in` ("Yes — everything is bought"). A job named again
     after that comes back. Filings of the day being reported are not read:
     what is named today is asked tomorrow. */
  /* the job codes in an answer, however typed: "k.k =165", "Kk 160", "kkkk 160",
     "K.K.165, k.k 155", "RBT 3375"; in a job-code column a bare number is a
     KK job ("167") and any other code keeps its letters ("SD-12"). The same
     job written two ways is one row (KK-081 and kk81). */
  /* `parts`: keep a part's letter — one job split in parts, "KK165A",
     "kk 165 b", "KK-165-B" are KK-165A / KK-165B (the user, 17 Oct 2026).
     Only the code book asks for it: a carried row stays known by its job
     (KK-165), as it always was. A letter set apart by a space is a part only
     when no word follows it ("KK165 a delivery" is KK-165); one written on
     the number or after a hyphen always is. */
  /* a job numbered 0 is no job: Amaha wrote "0" for "no job today" (Mon 19
     Oct 2026), it became KK-0, and Getachew and Ephrata were asked for its
     money (the owner, 21 Oct 2026: "remove it") — Register.js regZero_ */
  function zeroJob(c) { return /^([A-Z]+-?)?0+[A-Z]?$/.test(String(c || '').toUpperCase().replace(/[\s._=#]+/g, '')); }
  function jobCodes(v, inCol, parts) {
    return jobCodesAll(v, inCol, parts).filter(function (c) { return !zeroJob(c); });
  }
  function jobCodesAll(v, inCol, parts) {
    var s = String(v == null ? '' : v), out = [];
    function put(c) { if (c && out.indexOf(c) === -1) out.push(c); }
    var re = /(^|[^a-z0-9])(k(?:\W{0,3}k)+|rbt)\W{0,3}0*(\d{1,5})(?!\d)/gi, m;
    while ((m = re.exec(s))) {
      var pre = /^k/i.test(m[2]) ? 'KK' : 'RBT', letter = '';
      if (parts) {
        var after = s.slice(re.lastIndex);
        var pm = /^\s?-\s?([a-z])(?![a-z])|^([a-z])(?![a-z])/i.exec(after) || /^\s+([a-z])(?![a-z])(?!\s+[a-z])/i.exec(after);
        if (pm) { letter = (pm[1] || pm[2]).toUpperCase(); re.lastIndex += pm[0].length; }
      }
      put(pre + '-' + Number(m[3]) + letter);
      /* a list runs on after its first code: "K.k=165,155" */
      if (pre !== 'KK') continue;
      var tail = s.slice(re.lastIndex), run = /^\s*(?:[,;\/&+]|and|እና)\s*0*(\d{2,3})(?!\d)/i, n;
      while ((n = run.exec(tail))) {
        put('KK-' + Number(n[1]));
        tail = tail.slice(n[0].length);
        re.lastIndex = s.length - tail.length;
      }
    }
    if (out.length || !inCol) return out;
    var t = s.toUpperCase().replace(/[–—]/g, '-').replace(/[^A-Z0-9-]/g, '');
    if (/^\d{1,3}$/.test(t)) return ['KK-' + Number(t)];
    /* "165 b" in a job column: part B of KK-165 */
    var bp = parts && /^(\d{1,3})-?([A-Z])$/.exec(t);
    if (bp) return ['KK-' + Number(bp[1]) + bp[2]];
    var c = /^([A-Z]+)-?0*(\d+(?:-\d+)*)/.exec(t);
    return c ? [c[1] + '-' + c[2]] : [];
  }

  /* ---------------- the code book ----------------

     The user, 17 Oct 2026: "if it's a lead you capture the lead code 0000,
     KK code, then RBT code — the AI has to realize that and arrange". The
     register (apps-script/Register.js) keeps every job and lead the reports
     have named, with its customer, in /register/codes:
       {jobs: {'KK-212': {c: customer, l: lead no., x: [two or more customers]}},
        leads: {'0338': {c: customer, j: 'KK-212'}}}
     Under a code typed in a list the form says what it is — "KK-212 · Mr
     Eyob · lead 0338", "Lead 0349 · new", "RBT-3375 · Rovestone job" — and a
     code whose customer is plainly someone else is one to check, like any
     answer that cannot be right: it never stops Send. Without the book (not
     made yet, not readable, no signal) the form is as it was. */
  var BOOK = null, BOOK_J = {}, bookAsked = false;
  function loadBook() {
    if (bookAsked || BOOK || !window.FB || !window.FB.codeBook) return;
    bookAsked = true;
    window.FB.codeBook().then(function (b) {
      bookAsked = false;
      if (!b || typeof b !== 'object' || (!b.jobs && !b.leads)) return;
      BOOK = b;
      /* the register keeps a code as written ("KK-081"); the form reads it
         without the nought (KK-81): look them up the same way */
      BOOK_J = {};
      Object.keys(b.jobs || {}).forEach(function (k) { BOOK_J[k.replace(/-0+(?=\d)/, '-')] = b.jobs[k]; });
      paintCodeHints();
      if (report) refresh();
    }, function () { bookAsked = false; });
  }
  /* a box that holds a code: the customer's code (4-digit lead no., or the
     KK code once paid), a job code, or one checked as a code (`codeOk`) */
  function isCodeCol(c) {
    return !!c && c.t === 'text' && !c.time && (c.id === 'lc' || c.id === 'code' || !!c.codeOk);
  }
  /* the codes in a box, each with its kind: a KK or RBT job ("RB 3375" is
     RBT too), a 4-digit lead no., a bare 1–3 digits as a KK job, or another
     lettered code ("SD-12") */
  function codesIn(v) {
    var s = String(v == null ? '' : v).trim().replace(/(^|[^a-z0-9])rb(?!t)\W{0,3}(?=\d)/gi, '$1RBT ');
    if (!s) return [];
    var kind = function (j) { return /^KK-/.test(j) ? 'kk' : /^RBT-/.test(j) ? 'rbt' : 'other'; };
    /* a part (KK-165B) carries its job (KK-165) as `p` */
    var one = function (j) { var pm = /^([A-Z]+-\d+(?:-\d+)*)[A-Z]$/.exec(j); return { kind: kind(j), id: j, p: pm ? pm[1] : '' }; };
    var out = jobCodes(s, false, true).map(one);
    if (!out.length) {
      var m = /(^|\D)(\d{4})(?!\d)/.exec(s);
      if (m) out.push({ kind: 'lead', id: m[2] });
      else out = jobCodes(s, true, true).map(one);
    }
    return out.slice(0, 3);
  }
  function bookJob(id) { return BOOK ? BOOK_J[String(id).replace(/-0+(?=\d)/, '-')] || null : null; }
  function bookLead(id) { return BOOK && BOOK.leads && BOOK.leads[id] ? BOOK.leads[id] : null; }
  function bookNames(e) { return e ? (e.x && e.x.length ? e.x : (e.c ? [e.c] : [])) : []; }
  /* one code, as the book has it, in the language given */
  function codeLine(k, lg) {
    var tx = function (key, o) { return tfillIn(lg, key, o || {}); };
    if (k.kind === 'lead') {
      var ld = bookLead(k.id), lp = [tx('cbLead', { l: k.id })];
      if (!ld) lp.push(tx('cbNewLead'));
      else { if (ld.c) lp.push(ld.c); if (ld.j) lp.push(tx('cbNow', { j: ld.j })); }
      return lp.join(' · ');
    }
    var jb = bookJob(k.id), pj = k.p ? bookJob(k.p) : null, out = [k.id];
    if (k.kind === 'rbt') out.push(tx('cbRbt'));
    /* a part of a job (17 Oct 2026): "KK-165B · part of KK-165", or, the
       register not having seen it yet, "new part of KK-165" */
    if (k.p && (jb || pj)) out.push(tx(jb ? 'cbPartOf' : 'cbNewPart', { p: k.p }));
    if (!jb && !pj) { if (k.kind !== 'rbt') out.push(tx('cbNewJob')); return out.join(' · '); }
    /* a job split in parts says which */
    if (jb && jb.s && jb.s.length) out.push(tx('cbSplit', { s: jb.s.join(', ') }));
    /* the customer: the part's own, else its job's */
    var e = jb && (jb.c || (jb.x && jb.x.length)) ? jb : (pj || jb);
    if (e.x && e.x.length > 1) out.push(tx('cbTwo', { n: e.x.length, names: e.x.join(', ') }));
    else {
      if (e.c) out.push(e.c);
      if (e.l) out.push(tx('cbLeadNo', { l: e.l }));
    }
    return out.join(' · ');
  }
  /* every customer a job's family is written for: the job, its job if it is
     a part, its parts if it has them */
  function familyNames(k) {
    var jb = bookJob(k.id), names = bookNames(jb).slice();
    var add = function (e) { bookNames(e).forEach(function (n) { if (names.indexOf(n) === -1) names.push(n); }); };
    if (k.p) add(bookJob(k.p));
    if (jb && jb.s) jb.s.forEach(function (s) { add(bookJob(s)); });
    return names;
  }
  function tfillIn(lg, k, o) {
    var s = (T[lg] && T[lg][k]) || T.en[k] || k;
    return s.replace(/\{(\w+)\}/g, function (m, n) { return o[n] != null ? o[n] : m; });
  }
  function paintCodeHint(node, v) {
    /* "0" is no job (Amaha's "no job today", 19 Oct 2026): accepted — his
       day of 0 m² needs a row — and said so; it never becomes a job */
    if (has(v) && zeroJob(v)) {
      node.hidden = false;
      node.textContent = t('cbZero');
      return;
    }
    var ks = BOOK ? codesIn(v) : [];
    node.hidden = !ks.length;
    node.textContent = ks.map(function (k) { return codeLine(k, lang); }).join('\n');
  }
  function paintCodeHints() {
    Array.prototype.forEach.call(document.querySelectorAll('.codehint'), function (n) { if (n.paint) n.paint(); });
  }
  /* "Ato Taddesse", "ato tadese", "Mr. Taddesse" are one customer: titles
     go, and a doubled letter is one (Register.js regName_, with the
     doubling that Amharic names take in Latin letters) */
  function custKey(s) {
    return String(s || '').toLowerCase()
      .replace(/[.,;:'’"()\[\]\\&_\-–—።፣፤]/g, ' ')
      .replace(/(^|\s)(ato|a\/to|w\/ro|w\/rt|wro|wrt|weizero|weizerit|dr|eng|mr|mrs|ms|miss|አቶ|አ\/ቶ|ወ\/ሮ|ወ\/ሪት|ዶ\/ር|ኢ\/ር)(?=\s|$)/g, ' ')
      .replace(/\//g, ' ').replace(/(.)\1+/g, '$1').replace(/\s+/g, ' ').trim();
  }
  /* two words a letter or two apart ("Tesfaye" / "Tesfay") — Register.js regNear_ */
  function wordNear(x, y) {
    if (x === y) return true;
    var n = Math.min(x.length, y.length);
    if (n < 4 || Math.abs(x.length - y.length) > 2) return false;
    var max = n >= 7 ? 2 : 1, prev = [], cur, i, k, j;
    for (j = 0; j <= y.length; j++) prev.push(j);
    for (i = 1; i <= x.length; i++) {
      cur = [i];
      for (k = 1; k <= y.length; k++) cur.push(Math.min(prev[k] + 1, cur[k - 1] + 1, prev[k - 1] + (x[i - 1] === y[k - 1] ? 0 : 1)));
      prev = cur;
    }
    return prev[y.length] <= max;
  }
  /* true: one customer; false: plainly two; null: cannot tell (a name in
     Ethiopic beside one in Latin letters, or nothing to compare) */
  function sameCust(a, b) {
    var x = custKey(a), y = custKey(b);
    if (!x || !y) return null;
    var eth = /[ሀ-፿]/;
    if (eth.test(x) !== eth.test(y)) return null;
    var wx = x.split(' ').filter(function (w) { return w.length >= 3; });
    var wy = y.split(' ').filter(function (w) { return w.length >= 3; });
    if (!wx.length || !wy.length) return x === y ? true : null;
    return wy.some(function (w) { return wx.some(function (v) { return wordNear(v, w); }); });
  }
  /* the one code the book has for this customer, or '' (none, or several) */
  function bookCodeFor(cust, not) {
    var hits = [];
    Object.keys((BOOK && BOOK.jobs) || {}).forEach(function (id) {
      if (id !== not && bookNames(BOOK.jobs[id]).some(function (n) { return sameCust(cust, n) === true; })) hits.push(id);
    });
    if (hits.length) return hits.length === 1 ? hits[0] : '';
    Object.keys((BOOK && BOOK.leads) || {}).forEach(function (id) {
      var e = BOOK.leads[id], to = e.j || id;
      if (id !== not && to !== not && sameCust(cust, e.c) === true && hits.indexOf(to) === -1) hits.push(to);
    });
    return hits.length === 1 ? hits[0] : '';
  }
  /* a code in a row whose customer is plainly not the book's */
  function bookOdd() {
    if (!BOOK || !report) return [];
    var out = [];
    allFields().forEach(function (f) {
      if (f.t !== 'table' || !f.cols || !shown(f)) return;
      if (!f.cols.some(function (c) { return c.id === 'cust'; })) return;
      var codeCols = f.cols.filter(isCodeCol);
      if (!codeCols.length) return;
      (Array.isArray(values[f.id]) ? values[f.id] : []).forEach(function (row, i) {
        if (!row || !has(row.cust)) return;
        var cust = String(row.cust).trim();
        codeCols.forEach(function (c) {
          codesIn(row[c.id]).forEach(function (k) {
            /* a job's family (a part and its job) is one customer's */
            var names = k.kind === 'lead' ? bookNames(bookLead(k.id)) : familyNames(k);
            if (!names.length) return;
            var verdict = names.map(function (n) { return sameCust(cust, n); });
            /* one of them, or any it cannot tell: no question */
            if (verdict.some(function (v) { return v !== false; })) return;
            var sug = bookCodeFor(cust, k.id);
            var key = (k.kind === 'lead' ? 'cbOddLead' : 'cbOddJob') + (sug ? '' : 'No');
            var fill = function (lg) {
              /* a lead no. suggested reads "lead 0349" */
              var s = /^\d{4}$/.test(sug) ? tfillIn(lg, 'cbLeadNo', { l: sug }) : sug;
              return tfillIn(lg, key, { n: i + 1, code: k.id, who: names.join(' / '), cust: cust, sug: s });
            };
            out.push({ f: f.id, en: fill('en'), am: fill('am') });
          });
        });
      });
    });
    return out;
  }
  /* a carried row with nothing answered in it yet is only the list itself:
     a draft holding no more than that is no draft */
  function bareCarry(v, rep) {
    rep = rep || report;
    if (!v || typeof v !== 'object' || !rep) return;
    rep.sections.forEach(function (s) {
      s.fields.forEach(function (f) {
        if (f.carry && Array.isArray(v[f.id])) v[f.id] = v[f.id].filter(function (r) { return carryAnswered(f, r); });
      });
    });
  }
  function carryAnswered(f, r) {
    return !!r && f.cols.some(function (c, i) { return i > 0 && has(r[c.id]); });
  }
  /* what a carried row is known by: its job codes — or, with carry.text, the
     words themselves (a lead's name, 15 Oct 2026) */
  function carryKeys(f, v) {
    if (f && f.carry && f.carry.text) {
      var w = String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
      return w ? [w] : [];
    }
    return jobCodes(v, true);
  }
  /* the job codes one filing names in a source: 'list.col', a question's
     words, or {f, col, when:{col, is|in}} — only the rows that say so (a job
     that did not pass, a defect sent for rework) */
  function carryCodes(v, src, f) {
    var s = typeof src === 'string' ? { f: src.split('.')[0], col: src.split('.')[1] } : src;
    var x = v[s.f], out = [];
    if (!s.col) return jobCodes(x, false);
    if (Array.isArray(x)) x.forEach(function (r) {
      if (!r) return;
      var w = s.when, cv = w ? r[w.col] : null;
      if (w && (w.in ? w.in.indexOf(cv) === -1 : cv !== w.is)) return;
      out = out.concat(carryKeys(f, r[s.col]));
    });
    return out;
  }
  /* the codes still open, oldest named first */
  function carryOpen(f, filings, day) {
    var c = f.carry, close = c.close || {}, open = [], first = f.cols[0].id;
    (filings || []).filter(function (d) {
      return d.report === report.id && ymdOf(addis(d.at)) < day;
    }).sort(function (a, b) { return a.at - b.at; }).forEach(function (d) {
      var v = d.values || {}, named = [], shut = [];
      (c.from || []).forEach(function (src) { named = named.concat(carryCodes(v, src, f)); });
      (c.shut || []).forEach(function (src) { shut = shut.concat(carryCodes(v, src, f)); });
      /* its own rows: answered "not yet" keeps a job open, closed shuts it */
      (Array.isArray(v[f.id]) ? v[f.id] : []).forEach(function (r) {
        if (!r) return;
        var ks = carryKeys(f, r[first]);
        if ((close.in || []).indexOf(r[close.col]) !== -1) shut = shut.concat(ks); else named = named.concat(ks);
      });
      named.forEach(function (k) { if (open.indexOf(k) === -1) open.push(k); });
      open = open.filter(function (k) { return shut.indexOf(k) === -1; });
    });
    return open;
  }
  /* the open codes into the list: rows already answered stay; a row only
     carried, whose job is no longer open, goes */
  function mergeCarry(f, open) {
    var first = f.cols[0].id;
    if (!Array.isArray(values[f.id])) values[f.id] = [];
    var data = values[f.id];
    for (var i = data.length - 1; i >= 0; i--) {
      var r = data[i];
      if (!r || !has(r[first])) { data.splice(i, 1); continue; }
      if (!carryAnswered(f, r) && open.indexOf(carryKeys(f, r[first])[0]) === -1) data.splice(i, 1);
    }
    open.forEach(function (k) {
      var there = data.some(function (r) { return carryKeys(f, r[first]).indexOf(k) !== -1; });
      if (!there) { var row = {}; row[first] = k; data.push(row); }
    });
  }
  /* read again each time the form is drawn: the draft it was drawn from
     holds only the rows already answered (bareCarry) */
  function loadCarry() {
    if (!report) return;
    var cs = allFields().filter(function (f) { return f.carry; });
    var os = allFields().filter(function (f) { return f.once; });
    if (!cs.length && !os.length) return;
    if (!window.FB || !FB.ownReports || !AUTH.who()) return;
    var days = Math.max.apply(null, cs.map(function (f) { return f.carry.days || 30; }).concat([30]));
    var day = periodNow(report).day || stamp(), was = report.id;
    var asked = cs.some(function (f) { return f.carry.ask; }) && FB.myJobAsk ? FB.myJobAsk()['catch'](function () { return null; }) : Promise.resolve(null);
    var credit = cs.some(function (f) { return f.carry.credit; }) && FB.creditAsk ? FB.creditAsk(report.person)['catch'](function () { return null; }) : Promise.resolve(null);
    Promise.all([FB.ownReports(report.person, new Date(nowMs() - days * 864e5)), asked, credit]).then(function (got) {
      if (!report || report.id !== was) return;
      var list = got[0] || [], ask = got[1], cask = got[2];
      /* answered in a report before today's — or, longer ago than the
         reports read here, as the script says (Credit.js `answered`). A
         correction of today's own report still asks it. */
      os.forEach(function (f) {
        ONCE_DONE[f.id] = list.some(function (d) {
          return d.report === report.id && ymdOf(addis(d.at)) < day && has((d.values || {})[f.id]);
        }) || !!(cask && Array.isArray(cask.answered) && cask.answered.indexOf(f.id) !== -1);
      });
      cs.forEach(function (f) {
        if (f.carry.credit) { mergeCredit(f, creditOpen(cask, list, day)); CREDIT_READY = true; }
        else mergeCarry(f, f.carry.ask ? askOpen(f, ask, list) : carryOpen(f, list, day));
        var w = document.getElementById('w_' + f.id);
        if (w && w.redraw) w.redraw();
      });
      refresh();
    })['catch'](function () {});
  }
  var ONCE_DONE = {};

  /* SUPPLIER CREDIT, ONE PURCHASE AT A TIME (carry.credit — the owner, 23
     Oct 2026: "ask the credit on today's purchase, so later we ask if that
     credit is paid"). The rows are the script's list of every credit not
     yet paid (apps-script/Credit.js, /jobask/<person>-credit), each known by
     `ref`, the filing and the row it was written in; the script reads the
     answers back by it. A report the script has not read yet counts here
     too: a credit bought in it is added, one it paid is gone. Without the
     script's list (not made yet, no signal) the list is made from this
     person's own reports of the last 30 days. A row keeps what it is owed
     for beside its answers: ref, sup, code, item, owed (Birr still owed, or
     null when the amount was never written), amount, payby, bought, old. */
  var CREDIT_READY = false;
  function creditItem(it) {
    if (!it || !it.ref) return null;
    var owed = it.left == null || it.left === '' || isNaN(Number(it.left)) ? null : Number(it.left);
    return { ref: String(it.ref), sup: String(it.sup || '').trim(), code: String(it.code || '').trim(),
             item: String(it.item || '').trim(), owed: owed,
             amount: it.amount == null || isNaN(Number(it.amount)) ? null : Number(it.amount),
             payby: /^\d{4}-\d{2}-\d{2}$/.test(String(it.due || '')) ? String(it.due) : '',
             bought: String(it.day || ''), old: !!it.old };
  }
  /* the credits one filing took: its orders on credit, and what it listed
     as owed from before */
  function creditsIn(d) {
    var v = d.values || {}, out = [], day = ymdOf(addis(d.at));
    (Array.isArray(v.ord_list) ? v.ord_list : []).forEach(function (r, i) {
      if (r && r.paid === 'credit') out.push(creditItem({ ref: d.id + '-' + i, sup: r.sup, code: r.code, item: r.item,
        left: has(r.amount) ? num(r.amount) : null, amount: has(r.amount) ? num(r.amount) : null, due: r.due, day: day }));
    });
    if (v.cr_old_any === 'yes') (Array.isArray(v.cr_old) ? v.cr_old : []).forEach(function (r, i) {
      if (r && (has(r.sup) || has(r.amount))) out.push(creditItem({ ref: d.id + '-o' + i, sup: r.sup, code: r.code,
        left: has(r.amount) ? num(r.amount) : null, amount: has(r.amount) ? num(r.amount) : null, due: r.due, day: day, old: 1 }));
    });
    return out.filter(Boolean);
  }
  function creditOpen(ask, list, day) {
    var items = [], since = 0;
    if (ask && Array.isArray(ask.items)) {
      items = ask.items.map(creditItem).filter(Boolean);
      since = ask.at && ask.at.toDate ? ask.at.toDate().getTime() : (Number(new Date(ask.at)) || 0);
    }
    /* this person's reports the script had not read, before today's; a day
       filed twice is the later filing's, as the script takes it */
    var best = {}, read = {}, alias = {};
    (list || []).forEach(function (d) {
      if (d.report !== report.id || !d.id) return;
      var dd = ymdOf(addis(d.at));
      if (dd >= day) return;
      if (!(d.at > since)) { if (!read[dd] || d.at > read[dd].at) read[dd] = d; return; }
      if (!best[dd] || d.at > best[dd].at) best[dd] = d;
    });
    /* a credit is known by the filing that stands for its day: a key given
       to an earlier filing of that day is the same row of the later one */
    (list || []).forEach(function (d) {
      var dd = ymdOf(addis(d.at)), b = best[dd] || read[dd];
      if (d.report === report.id && d.id && b && b.id !== d.id && d.at < b.at) alias[d.id] = b.id;
    });
    var keyOf = function (ref) {
      var s = String(ref || ''), cut = s.indexOf('-');
      return cut > 0 && alias[s.slice(0, cut)] ? alias[s.slice(0, cut)] + s.slice(cut) : s;
    };
    var answersOf = function (d) {
      var by = {};
      (Array.isArray(((d || {}).values || {}).cr_back) ? d.values.cr_back : []).forEach(function (r) { if (r && r.ref) by[keyOf(r.ref)] = r; });
      return by;
    };
    Object.keys(best).sort().forEach(function (dd) {
      var d = best[dd];
      /* the script's credits of a day filed again are this filing's now */
      items = items.filter(function (c) { return c.bought !== dd; });
      items = items.concat(creditsIn(d).filter(function (c) {
        return !items.some(function (x) { return x.ref === c.ref; });
      }));
      /* a day the script had read once and that was filed again since: its
         answers are in the script's list already — only what the second
         filing changed counts, or a part paid would come off twice */
      var before = read[dd] ? answersOf(read[dd]) : {}, now = answersOf(d);
      Object.keys(now).forEach(function (ref) {
        var r = now[ref], p = before[ref];
        if (p && p.now === 'paid') return;
        var paidNow = r.now === 'part' && has(r.amt) ? num(r.amt) : 0;
        if (p && p.now === 'part' && has(p.amt)) paidNow -= num(p.amt);
        for (var i = 0; i < items.length; i++) {
          var c = items[i];
          if (c.ref !== ref) continue;
          if (r.now === 'paid') { items.splice(i, 1); break; }
          if (paidNow && c.owed != null) c.owed = Math.max(0, c.owed - paidNow);
          if ((r.now === 'not' || r.now === 'part') && /^\d{4}-\d{2}-\d{2}$/.test(String(r.due || ''))) c.payby = String(r.due);
          if (c.owed === 0) items.splice(i, 1);
          break;
        }
      });
    });
    /* soonest to pay first; those with no date last, oldest first */
    return items.sort(function (a, b) {
      var x = a.payby || '9999', y = b.payby || '9999';
      return x !== y ? (x < y ? -1 : 1) : (a.bought < b.bought ? -1 : a.bought > b.bought ? 1 : 0);
    });
  }
  /* the open credits into the list: a row already answered stays; one only
     carried, no longer open, goes; each keeps its facts up to date */
  function mergeCredit(f, open) {
    if (!Array.isArray(values[f.id])) values[f.id] = [];
    var data = values[f.id], refs = open.map(function (c) { return c.ref; });
    for (var i = data.length - 1; i >= 0; i--) {
      var r = data[i];
      if (!r || !r.ref) { data.splice(i, 1); continue; }
      if (!carryAnswered(f, r) && refs.indexOf(r.ref) === -1) data.splice(i, 1);
    }
    open.forEach(function (c) {
      var row = data.filter(function (r) { return r.ref === c.ref; })[0];
      if (!row) { row = {}; data.push(row); }
      ['ref', 'sup', 'code', 'item', 'owed', 'amount', 'payby', 'bought', 'old'].forEach(function (k) { row[k] = c[k]; });
      row.what = creditLabel(row, lang);
    });
    /* in the list's own order */
    data.sort(function (a, b) {
      var x = refs.indexOf(a.ref), y = refs.indexOf(b.ref);
      return (x === -1 ? 1e9 : x) - (y === -1 ? 1e9 : y);
    });
  }
  function creditToday() { return (report && periodNow(report).day) || stamp(); }
  /* its pay-by day has come — or it has none to wait for */
  function creditDueNow(r) { return !r || !r.payby || r.payby <= creditToday(); }
  function creditLabel(r, lg) {
    var tx = function (k, o) { return tfillIn(lg, k, o || {}); }, out = [];
    out.push(r.sup || tx('crNoSup'));
    if (r.owed == null) out.push(tx('crNoAmt'));
    else if (r.amount != null && r.owed < r.amount) out.push(tx('crLeft', { v: money(r.owed), all: money(r.amount) }));
    else out.push(tx('crBirr', { v: money(r.owed) }));
    if (r.code) out.push(r.code);
    if (r.bought) out.push(tx(r.old ? 'crOld' : 'crBought', { d: dayLabel(r.bought) }));
    if (!r.payby) out.push(tx('crNoDate'));
    else {
      var today = creditToday(), late = Math.round((Date.parse(today) - Date.parse(r.payby)) / 864e5);
      out.push(tx('crPayBy', { d: dayLabel(r.payby) }) +
               (late > 1 ? ' — ' + tx('crLate', { n: late }) : late === 1 ? ' — ' + tx('crLate1')
                : late === 0 ? ' — ' + tx('crToday') : ' — ' + tx('crNotYet')));
    }
    return out.join(' · ');
  }
  /* what the list adds up to (cr_paid, cr_owed, cr_overdue): paid back
     today, on the list and off it; still owed — the list less today's
     payments, plus today's orders on credit and what was listed as owed
     from before; and how much of that is past its date as it now stands.
     Blank until the list has been read: blank is not nought. */
  function creditFigure(kind) {
    var cf = allFields().filter(function (f) { return f.carry && f.carry.credit; })[0];
    if (!cf || !CREDIT_READY) return NaN;
    var today = creditToday(), paid = 0, owed = 0, over = 0;
    var owe = function (birr, by) { if (isNaN(birr)) return; owed += birr; if (by && by < today) over += birr; };
    (Array.isArray(values[cf.id]) ? values[cf.id] : []).forEach(function (r) {
      if (!r || !r.ref) return;
      var left = r.owed == null || r.owed === '' ? NaN : Number(r.owed);
      if (r.now === 'paid') { if (!isNaN(left)) paid += left; return; }
      var by = r.payby;
      if (r.now === 'part') {
        var p = num(r.amt);
        if (!isNaN(p)) { paid += p; if (!isNaN(left)) left = Math.max(0, left - p); }
      }
      if ((r.now === 'not' || r.now === 'part') && has(r.due)) by = String(r.due);
      owe(left, by);
    });
    var of = function (id) { var g = fieldById(id); return g && shown(g) && Array.isArray(values[id]) ? values[id] : []; };
    of('ord_list').forEach(function (r) { if (r && r.paid === 'credit') owe(num(r.amount), r.due); });
    of('cr_old').forEach(function (r) { if (r) owe(num(r.amount), r.due); });
    of('cr_paid_list').forEach(function (r) { var x = num(r && r.amount); if (!isNaN(x)) paid += x; });
    return round(kind === 'paid' ? paid : kind === 'overdue' ? over : owed, 2);
  }
  /* THE SCRIPT'S QUESTIONS (carry.ask — the money on each job, 14 Oct 2026):
     the jobs apps-script/JobMoney.js asks this person about (/jobask/{me}),
     less any this person has already answered in a report — the script may
     not have read that one yet */
  var CARRY_INFO = {};
  function askOpen(f, ask, list) {
    if (!ask || ask.kind !== f.carry.ask || !Array.isArray(ask.items)) return [];
    var first = f.cols[0].id, col = (f.carry.close || {}).col, done = {};
    (list || []).forEach(function (d) {
      if (d.report !== report.id) return;
      (Array.isArray((d.values || {})[f.id]) ? d.values[f.id] : []).forEach(function (r) {
        /* the script takes a figure of 1,000 Birr or more (JobMoney.js
           JM_MIN_BIRR_) and asks again for less; the form had hidden it for
           30 days (the bug hunt, 15 Oct 2026) */
        if (r && (!col || (has(r[col]) && !(num(r[col]) < 1000)))) jobCodes(r[first], true).forEach(function (k) { done[k] = 1; });
      });
    });
    var open = [];
    ask.items.forEach(function (it) {
      var k = jobCodes(it && it.code, true)[0];
      if (!k || done[k] || open.indexOf(k) !== -1) return;
      CARRY_INFO[k] = { cust: it.cust ? String(it.cust).trim() : '', m2: it.m2 ? Math.round(Number(it.m2) * 10) / 10 : null };
      open.push(k);
    });
    return open;
  }

  /* This week's own daily reports, which the weekly report no longer asks
     anyone to add up by hand. They are this person's own filings, so the
     server hands them over (firestore.rules: your own reports); until they
     arrive the figure reads blank rather than nought. */
  var WEEKVALS = null, weekValsFor = null;
  function loadWeekValues() {
    if (!report || report.cadence === 'daily' || weekValsFor === report.id) return;
    weekValsFor = report.id;
    WEEKVALS = null;
    if (!window.FB || !FB.ownReports || !AUTH.who()) return;
    FB.ownReports(report.person, new Date(nowMs() - 40 * 864e5)).then(function (list) {
      WEEKVALS = list || [];
      refresh();
    })['catch'](function () { WEEKVALS = []; refresh(); });
  }
  /* A DAILY FIGURE FOR THE WEEK SO FAR ({soFar:'key'}, 13 Oct 2026): this
     report's own filings from Monday to yesterday — the later one where a
     day was filed twice — with today's answer on the form, so the box fills
     itself and starts again each Monday. `fixes`: a day she corrected
     (Ephrata's collections, Money.js) counts as corrected. */
  var SOFAR = null, soFarFor = null, SOFAR_FIX = {};
  function mondayOf(ymd) { return addDays(ymd, -((dowOf(ymd) + 6) % 7)); }
  function loadSoFar() {
    if (!report || report.cadence !== 'daily' || soFarFor === report.id) return;
    var ks = allFields().filter(function (f) { return f.auto && f.auto.soFar != null; });
    if (!ks.length) return;
    soFarFor = report.id;
    SOFAR = null;
    if (!window.FB || !FB.ownReports || !AUTH.who()) return;
    FB.ownReports(report.person, new Date(dayStartMs(mondayOf(stamp())))).then(function (list) {
      SOFAR = list || [];
      refresh();
    })['catch'](function () { SOFAR = []; refresh(); });
    if (ks.some(function (f) { return f.auto.fixes; }) && FB.watchMyMoneyFix) {
      FB.watchMyMoneyFix(function (docs, mine) {
        var at = {};
        SOFAR_FIX = {};
        (mine || []).forEach(function (x) {
          var w = x.at && x.at.toDate ? x.at.toDate().getTime() : 0;
          if (x.day && x.total != null && !(at[x.day] > w)) { at[x.day] = w; SOFAR_FIX[x.day] = Number(x.total); }
        });
        refresh();
      });
    }
  }
  /* The advances taken at a day's signings (contracts_list), a job listed as
     a payment too counted once. With {soFar, adv:1} the week holds them: since
     9 Oct 2026 a new contract's advance is filed only in the contracts list,
     and Ephrata's week counted her payments alone until 23 Oct (the week of
     19 Oct showed 988,261; 1,195,884 had come in). apps-script ephMoneyIn_
     reads a day the same way. */
  function signAdvance(v) {
    v = v || {};
    var rows = Array.isArray(v.contracts_list) ? v.contracts_list : null;
    if (!rows || !rows.length) { var a0 = num(v.advance); return isNaN(a0) ? 0 : a0; }
    var key = function (s) {
      var c = String(s == null ? '' : s).toUpperCase().replace(/[^A-Z0-9]/g, '');
      var m = /^KK0*(\d+)$/.exec(c);
      if (m) return 'KK' + m[1];
      return /^\d{1,3}$/.test(c) ? 'KK' + Number(c) : c;
    };
    var paid = {};
    (Array.isArray(v.collected_list) ? v.collected_list : []).forEach(function (r) {
      var k = r && key(r.lc);
      if (k) paid[k] = true;
    });
    return rows.reduce(function (s, r) {
      var a = r ? num(r.adv) : NaN;
      if (isNaN(a) || a <= 0 || (r.code && paid[key(r.code)]) || (r.lc && paid[key(r.lc)])) return s;
      return s + a;
    }, 0);
  }
  function soFarFigure(k) {
    if (SOFAR === null && !(window.FB && FB.ownReports && AUTH.who())) {
      var t0 = num(values[k.soFar]), a0 = k.adv ? signAdvance(values) : 0;
      return isNaN(t0) && !a0 ? NaN : (isNaN(t0) ? 0 : t0) + a0;
    }
    if (SOFAR === null) return NaN;
    var today = stamp(), mon = mondayOf(today), best = {};
    SOFAR.forEach(function (d) {
      if (d.report !== report.id) return;
      var day = ymdOf(addis(d.at));
      if (day < mon || day >= today) return;
      if (!best[day] || d.at > best[day].at) best[day] = d;
    });
    var sum = 0, any = false;
    Object.keys(best).forEach(function (day) {
      var v = best[day].values || {};
      var x = k.fixes && SOFAR_FIX[day] != null ? SOFAR_FIX[day] : num(v[k.soFar]);
      if (!isNaN(x)) { sum += x; any = true; }
      var a = k.adv ? signAdvance(v) : 0;
      if (a) { sum += a; any = true; }
    });
    var tv = num(values[k.soFar]);
    if (!isNaN(tv)) { sum += tv; any = true; }
    var ta = k.adv ? signAdvance(values) : 0;
    if (ta) { sum += ta; any = true; }
    return any ? round(sum, 3) : NaN;
  }
  /* a line judged only from a day of the week on (tgt.from: 4 = Thursday):
     a week's figure is not short on a Monday */
  function tgtJudged(f) {
    if (!f.tgt || f.tgt.from == null) return true;
    var dw = dowOf(stamp());
    return dw === 0 || dw >= f.tgt.from;
  }

  /* the week's own filings that count: one report, one day, and where a day
     was filed twice the later filing is the correction that stands */
  function weekFilings(k) {
    var span = autoSpan(), best = {};
    (WEEKVALS || []).forEach(function (d) {
      if (d.person !== report.person) return;
      if (k.from ? d.report !== k.from : !isFeeder(d.report)) return;
      if (!(d.at >= span.from && d.at < span.to)) return;
      var key = d.report + '|' + ymdOf(addis(d.at));
      if (!best[key] || d.at > best[key].at) best[key] = d;
    });
    return Object.keys(best).sort().map(function (x) { return best[x]; });
  }
  function weekFigure(key, k) {
    if (!WEEKVALS) return NaN;
    var vals = [];
    weekFilings(k).forEach(function (d) {
      var x = num((d.values || {})[key]);
      if (!isNaN(x)) vals.push({ x: x, at: d.at });
    });
    if (!vals.length) return NaN;
    var how = k.how || 'sum';
    var nums = vals.map(function (v) { return v.x; });
    if (how === 'max') return round(Math.max.apply(null, nums), 3);
    if (how === 'min') return round(Math.min.apply(null, nums), 3);
    if (how === 'last') { vals.sort(function (a, b) { return b.at - a.at; }); return round(vals[0].x, 3); }
    /* how many days were over a limit — "on how many days was waste above
       20%", which the week's own daily answers already say */
    if (how === 'over') return nums.filter(function (x) { return x > k.over; }).length;
    if (how === 'under') return nums.filter(function (x) { return x < k.under; }).length;
    var wt = 0;
    nums.forEach(function (x) { wt += x; });
    return round(how === 'avg' ? wt / nums.length : wt, 3);
  }
  /* a daily report of the same person feeds their weekly one; a weekly or a
     daily feeds the monthly */
  function isFeeder(id) {
    var r = reportById(id);
    if (!r || r.person !== report.person) return false;
    return report.cadence === 'monthly' ? (r.cadence === 'weekly' || r.cadence === 'daily')
                                        : r.cadence === 'daily';
  }
  /* the stretch of time a weekly or monthly figure covers: the week as the
     ledger counts it (Sunday 9 PM to Sunday 9 PM), or the calendar month */
  function autoSpan() {
    var now = nowMs();
    if (report.cadence === 'monthly') {
      /* the month the report is FOR: due on the 1st (or the 2nd) of the next
         one, it adds up the month just ended — opened on its due day it was
         adding up the new month, and filed every figure blank (the bug hunt,
         15 Oct 2026). Sent early, from the 25th, the month so far. Outside
         its window, this month so far. */
      var pd = periodNow(report);
      var base = pd.day ? addDays(pd.day, -3) : stamp();
      var first = base.slice(0, 8) + '01';
      var nextFirst = addDays(first, 32).slice(0, 8) + '01';
      return { from: dayStartMs(first), to: Math.min(dayStartMs(nextFirst), now + 864e5) };
    }
    var sun = weekClose(now, report.id);
    return { from: deadlineOf(addDays(sun, -7), cutOf(report.id)),
             to: deadlineOf(sun, cutOf(report.id)) };
  }

  /* every auto answer, worked out. Three passes, because one can stand on
     another (a share of two counts that are themselves counted from rows). */
  /* A count behind a tap-all list (zero:1) is nought while the list says it
     did not happen — nought now, not only when the report is sent, so a
     figure worked out from it (complaints still open = in − resolved) is
     right on the screen too. If the thing is then tapped, the nought the form
     put there is taken away again: the person types the real count. */
  var ZEROED = {};
  function zeroClosed() {
    allFields().forEach(function (f) {
      if (!f.zero) return;
      var g = f.show && fieldById(f.show.f);
      if (!shown(f) && g && shown(g) && filled(g)) {
        values[f.id] = '0';
        ZEROED[f.id] = 1;
      } else if (ZEROED[f.id]) {
        delete ZEROED[f.id];
        if (values[f.id] === '0') {
          delete values[f.id];
          var box = document.getElementById('f_' + f.id);
          if (box && box.value === '0') box.value = '';
        }
      }
    });
  }

  function computeAutos() {
    zeroClosed();
    var fs = allFields().filter(function (f) { return f.auto; });
    for (var pass = 0; fs.length && pass < 3; pass++) {
      fs.forEach(function (f) {
        if (f.t === 'ratio') {
          if (f.auto.a) setAuto(f.id + '__a', autoOne(f.auto.a));
          if (f.auto.b) setAuto(f.id + '__b', autoOne(f.auto.b));
        } else {
          setAuto(f.id, autoOne(f.auto));
        }
      });
    }
    stepsZero();
  }
  /* A two-step count whose total is 0 is answered: 0 of 0. Nothing was due,
     so "how many of them" is not asked. A 0 put there this way goes again if
     the total is changed to something else, so it is never taken for an
     answer the person gave. */
  var stepZeroed = {};
  function stepsZero() {
    allFields().forEach(function (f) {
      if (f.t !== 'ratio' || !f.ask || (f.auto && f.auto.a)) return;
      var ka = f.id + '__a', b = num(values[f.id + '__b']);
      if (b === 0) {
        if (values[ka] !== '0') values[ka] = '0';
        stepZeroed[f.id] = true;
      } else if (stepZeroed[f.id]) {
        if (values[ka] === '0') delete values[ka];
        stepZeroed[f.id] = false;
      }
    });
  }
  /* Still to be answered? A question the form works out is not — except a
     two-box one with only one box counted: the other box is a question, and
     it is asked once the counted one has its figure. */
  function toAnswer(f) {
    /* a carried list is answered row by row (its `must` column), and on a
       day with nothing carried there is nothing to answer */
    if (f.opt || f.carry) return false;
    if (!f.auto) return true;
    if (f.t !== 'ratio' || (f.auto.a && f.auto.b)) return false;
    return has(values[f.id + '__' + (f.auto.a ? 'a' : 'b')]);
  }
  function setAuto(key, v) {
    /* a gathered list is the answer itself, not a number to be shown */
    if (Array.isArray(v)) { values[key] = v; return; }
    var blank = v == null || v === '' || (typeof v === 'number' && isNaN(v));
    if (blank) { if (values[key] != null) delete values[key]; return; }
    values[key] = String(v);
  }

  /* which table an auto answer is drawn from — its summary line goes under
     that table rather than into a row of its own */
  function autoTable(f) {
    var k = f && f.auto;
    if (!k) return null;
    var s = k.rows || k.sum || k.grid || k.all || k.any || k.list || k.top
         || (k.a && (k.a.rows || k.a.sum || k.a.grid))
         || (k.b && (k.b.rows || k.b.sum || k.b.grid));
    return s ? String(s).split('.')[0] : null;
  }
  /* An auto answer with short words of its own ("deliveries") joins the one
     summary line under its table. Without them it keeps a read-only row, the
     whole question in front of it. */
  function autoInLine(f) { return !!(f.auto && f.sumEn && autoTable(f)); }
  function autoLineFields(tableId, sec) {
    return (sec.fields || []).filter(function (f) {
      return autoInLine(f) && autoTable(f) === tableId;
    });
  }
  function autoText(f) {
    var v = fmt(f);
    return (v === '' ? '—' : v) + ' ' + (lang === 'am' ? (f.sumAm || f.sumEn) : f.sumEn);
  }

  /* the gathered rows, a line each, in the order the week filed them */
  function drawGathered(box, f) {
    var rows = Array.isArray(values[f.id]) ? values[f.id] : [];
    var sig = rows.length + '|' + JSON.stringify(rows);
    if (box.__sig === sig) return;
    box.__sig = sig;
    box.innerHTML = '';
    if (!rows.length) {
      box.appendChild(el('div', 'gnone', WEEKVALS ? t('weekHadNone') : t('weekLoading')));
      return;
    }
    rows.forEach(function (r) {
      var line = el('div', 'grow');
      (f.cols || []).forEach(function (c) {
        if (!has(r[c.id])) return;
        var cell = el('span', 'gcell');
        cell.appendChild(el('span', 'gk', L(c)));
        cell.appendChild(el('span', 'gv', colText(c, r[c.id], r)));
        line.appendChild(cell);
      });
      box.appendChild(line);
    });
  }

  /* The value a target is checked against. A yes/no question counts yes as
     1 and no as 0. A ratio (a / b) is a percentage when its target is one
     (100% of leads called within the hour); a target of a small whole number
     is a count of the first box (all 5 reports on time). */
  function targetValue(f) {
    if (f.t === 'ratio') {
      var a = num(values[f.id + '__a']), b = num(values[f.id + '__b']);
      if (isNaN(a)) return NaN;
      if (f.tgt.v >= 50) return (!isNaN(b) && b > 0) ? a / b * 100 : NaN;
      return a;
    }
    if (f.t === 'yesno') return values[f.id] === 'yes' ? 1 : (values[f.id] === 'no' ? 0 : NaN);
    return num(values[f.id]);
  }
  function targetMiss(f) {
    if (f.t === 'table' || f.t === 'grid') return false;
    if (!f.tgt) return false;
    if (!tgtJudged(f)) return false;
    var v = targetValue(f);
    if (isNaN(v)) return false;
    return f.tgt.op === 'gte' ? v < f.tgt.v : v > f.tgt.v;
  }

  /* The red marks are off until he asks. See showMissing() below. */
  var marking = false;

  /* a grid row that follows a tap list (rowsOn): row i is on when its code
     ("r0", "r1", …) was tapped */
  function gridRowOn(f, i) {
    if (!f.rowsOn) return true;
    return String(values[f.rowsOn] || '').split(',').indexOf('r' + i) !== -1;
  }

  function refresh() {
    /* the worked-out answers first: a follow-up can hang on one of them, and
       the count of what is still empty has to know they are answered */
    computeAutos();
    store.set(draftKey, JSON.stringify(values));

    var fields = allFields(), need = 0, done = 0;
    fields.forEach(function (f) {
      if (!f.rowsOn) return;
      Array.prototype.forEach.call(document.querySelectorAll('#w_' + f.id + ' [data-gridrow]'), function (card) {
        card.hidden = !gridRowOn(f, Number(card.getAttribute('data-gridrow')));
      });
    });
    /* two-step counts (fieldRow, f.ask): "how many of them" once there is a
       total, and the All button carrying it */
    fields.forEach(function (f) {
      if (f.t !== 'ratio' || !f.ask) return;
      var sa = document.getElementById('sa_' + f.id);
      if (!sa) return;
      var bv = values[f.id + '__b'], b = num(bv), a = values[f.id + '__a'];
      var aCounted = !!(f.auto && f.auto.a), bCounted = !!(f.auto && f.auto.b);
      sa.hidden = !(b > 0 || (aCounted && has(a)) || (has(a) && !has(bv)));
      var sc = document.getElementById('sc_' + f.id);
      if (sc) {
        var ball = sc.querySelector('[data-r="all"]'), bnone = sc.querySelector('[data-r="none"]');
        var allTxt = t('ratioAll').replace('{n}', b > 0 ? String(b) : '').trim();
        if (ball.textContent !== allTxt) ball.textContent = allTxt;
        ball.setAttribute('aria-pressed', b > 0 && has(a) && num(a) === b ? 'true' : 'false');
        bnone.setAttribute('aria-pressed', b > 0 && has(a) && num(a) === 0 ? 'true' : 'false');
      }
      var ia = document.getElementById('f_' + f.id + '__a');
      if (ia && document.activeElement !== ia) {
        var want = a == null ? '' : String(a);
        if (ia.value !== want) ia.value = want;
      }
      /* a counted total with nothing counted yet: the question above is the
         one to answer, and this one has nothing to show */
      var sr = document.getElementById('r_' + f.id);
      if (sr) sr.classList.toggle('stepsnone', bCounted && sa.hidden);
      /* the follow-up mark goes on the first question shown */
      var sbx = document.getElementById('sb_' + f.id), sbl = sbx && sbx.querySelector('label');
      var sal = sa.querySelector('label'), lead = sbl && !sbx.hidden ? sbl : sal;
      [sbl, sal].forEach(function (l) { if (l) l.classList.toggle('lead', l === lead); });
    });
    var firstEmpty = null;
    /* the buttons under "what comes first tomorrow" follow today's list */
    fields.forEach(function (f) {
      if (!f.from && !f.recent) return;
      var tb = document.getElementById('t_' + f.id);
      if (tb && tb.refill) tb.refill();
    });
    fields.forEach(function (f) {
      var open = shown(f);
      if ((f.show || f.once || (f.carry && f.carry.hideEmpty)) && !f.quiet) {
        var fr = document.getElementById('r_' + f.id) || document.getElementById('w_' + f.id);
        if (fr && fr.hidden === open) {
          fr.hidden = !open;
          if (open) { fr.classList.remove('opened'); void fr.offsetWidth; fr.classList.add('opened'); }
        }
      }
      if (f.auto) {
        /* the figure the form worked out, under the table it came from */
        var av = document.getElementById('av_' + f.id);
        if (av) {
          var at = fmt(f), avWas = av.textContent;
          av.textContent = at === '' ? '—' : at;
          if (av.dataset.drawn && avWas !== av.textContent && at !== '') replay(av, 'flash');
          av.dataset.drawn = '1';
          /* a figure with nothing to work out from yet is a dash that reads
             like a question left empty — it stays out of sight until there
             is a figure to show */
          var arow = document.getElementById('r_' + f.id);
          if (arow) arow.hidden = !open || hideBlankAuto(f);
        }
        /* a two-box question with one box counted: put the figure in it */
        if (f.t === 'ratio') ['a', 'b'].forEach(function (s) {
          if (!f.auto[s]) return;
          var box = document.getElementById('f_' + f.id + '__' + s);
          var now = values[f.id + '__' + s];
          if (box && box.value !== (now == null ? '' : String(now))) box.value = now == null ? '' : now;
        });
        /* or, for a gathered list, the rows themselves */
        var gb = document.getElementById('g_' + f.id);
        if (gb) drawGathered(gb, f);
      }
      if (!open) return;
      if (toAnswer(f)) {
        /* a grid is not one answer. w_stage is seven rows of three boxes, and
           counting it as a single unit made "1 still empty" mean anything from
           one number to twenty-one. */
        var units = (f.t === 'grid' && f.rows) ? f.rows.length : 1;
        need += units;
        var ok = filled(f);
        if (ok) done += units;

        /* show which one. .miss has been in the stylesheet since it was
           written and nothing ever applied it. */
        var node = document.getElementById('f_' + f.id) ||
                   document.getElementById('w_' + f.id);
        if (node) {
          if (ok || !marking) node.classList.remove('miss');
          else node.classList.add('miss');
          if (!ok && !firstEmpty) firstEmpty = node;
        }
      }
      /* a carried list's `want` box — a figure the person may not have yet
         (Getachew's Birr per job, 17 Oct 2026) — counts as one still empty
         in each row and is marked like an empty question; unlike `must`,
         the second tap on Send sends */
      if (f.carry && f.t === 'table') (f.cols || []).forEach(function (c) {
        if (!c.want) return;
        (Array.isArray(values[f.id]) ? values[f.id] : []).forEach(function (row, i) {
          if (!row || !colOn(c, row)) return;
          var empty = !has(row[c.id]), n = document.getElementById('c_' + f.id + '_' + i + '_' + c.id);
          if (empty) { need += 1; if (n && !firstEmpty) firstEmpty = n; }
          if (n) n.classList.toggle('miss', empty && marking);
        });
      });
      if (f.tgt) {
        var h = document.getElementById('h_' + f.id);
        if (h) {
          var miss = targetMiss(f), tv = targetValue(f);
          var early = !tgtJudged(f) && !isNaN(tv) && f.tgt.op === 'gte' && tv < f.tgt.v;
          h.className = 'hint' + (miss ? ' bad' : (early ? '' : (!isNaN(tv) ? ' good' : '')));
          h.textContent = (lang === 'am' ? f.tgt.am : f.tgt.en) +
            (miss ? ' — ' + (f.tgt.op === 'gte' ? t('below') : t('above'))
                  : early ? ' — ' + t('tgtToGo').replace('{n}', money(String(round(f.tgt.v - tv, 2)))) : '');
        }
      }
    });

    /* the same count, section by section */
    var secNo = 0;
    report.sections.forEach(function (sec, si) {
      var lt = document.getElementById('lgt_' + si);
      if (lt) {
        var bare = L(sec).replace(/^\s*\d+\s*·\s*/, '');
        var on = sec.fields.some(drawsSomething);
        if (on) secNo++;
        var txt = on ? secNo + ' · ' + bare : bare;
        if (lt.textContent !== txt) lt.textContent = txt;
      }
    });
    report.sections.forEach(function (sec, si) {
      var lc = document.getElementById('lgc_' + si);
      if (!lc) return;
      var sn = 0, sd = 0;
      sec.fields.forEach(function (f) {
        if (!toAnswer(f) || !shown(f)) return;
        var u = (f.t === 'grid' && f.rows) ? f.rows.length : 1;
        sn += u;
        if (filled(f)) sd += u;
      });
      lc.textContent = sn ? sd + ' / ' + sn : '';
      lc.className = 'lgc' + (sn && sd === sn ? ' full' : '');

      /* A whole section can be shut: "Anything rejected today" has nothing
         to ask on a day when nothing was rejected. An empty heading on the
         screen is a question the person goes looking for and cannot find. */
      var box = lc.parentNode && lc.parentNode.parentNode;
      if (box && box.tagName === 'FIELDSET') {
        box.hidden = !sec.fields.some(drawsSomething);
      }

      /* "5 deliveries · 4 checked · 1 rejected", under the table it is
         counted from. Nothing typed yet, nothing to say. */
      sec.fields.forEach(function (f) {
        var line = document.getElementById('a_' + f.id);
        if (!line) return;
        var parts = autoLineFields(f.id, sec).filter(shown);
        var any = parts.some(function (x) { return fmt(x) !== ''; });
        line.hidden = !(shown(f) && any);
        line.innerHTML = '';
        if (line.hidden) return;
        parts.forEach(function (x, i) {
          if (i) line.appendChild(el('span', 'adot', '·'));
          line.appendChild(el('span', 'aval', autoText(x)));
        });
        line.appendChild(el('span', 'afrom', t('countedFromRows')));
        if (line.dataset.txt != null && line.dataset.txt !== line.textContent) replay(line, 'flash');
        line.dataset.txt = line.textContent;
      });
    });

    /* the `must` boxes still empty count as empty too, marked like the rest */
    var gapIds = {}, gapsNow = mustGaps();
    gapsNow.forEach(function (g) { gapIds[g.id] = 1; });
    Array.prototype.forEach.call(document.querySelectorAll('.mustgap'), function (n) {
      if (!marking || !gapIds[n.id]) n.classList.remove('mustgap');
    });
    gapsNow.forEach(function (g) {
      var n = document.getElementById(g.id);
      if (!n) return;
      if (marking) n.classList.add('mustgap');
      if (!firstEmpty) firstEmpty = n;
    });
    var missing = need - done + gapsNow.length;
    var c = document.getElementById('count');
    if (c) {
      c.innerHTML = '';
      if (missing > 0) {
        var b = el('b', null, String(missing));
        if (lastMissing != null && lastMissing !== missing) b.className = 'tap';
        c.appendChild(b);
        c.appendChild(document.createTextNode(' ' + t('empty')));
        /* the number alone is not help on a form ten screens long */
        c.classList.remove('findable');
        c.onclick = null;
        if (firstEmpty) {
          c.classList.add('findable');
          c.title = t('findNext');
          c.onclick = function () {
            /* first tap turns the marks on, so the rest of the hunt is visible */
            marking = true;
            refresh();
            var target = document.querySelector('.miss, .mustgap') || firstEmpty;
            target.scrollIntoView({ block: 'center', behavior: 'smooth' });
            try { target.focus({ preventScroll: true }); } catch (e) {}
          };
        }
      } else {
        c.textContent = t('ready');
        c.classList.remove('findable');
        c.onclick = null;
        if (lastMissing) replay(c, 'tap');
      }
      lastMissing = missing;
    }
    var odd = oddNow(), oddBy = {};
    odd.forEach(function (o) { (oddBy[o.f] = oddBy[o.f] || []).push(oddText(o)); });
    fields.forEach(function (f) {
      var oh = document.getElementById('o_' + f.id);
      if (!oh) return;
      var msg = oddBy[f.id];
      oh.hidden = !msg;
      /* one line each, and a capital to start it — in the sent report the
         same words follow the question, so they are written lower case */
      oh.textContent = msg ? msg.map(function (x) { return x.charAt(0).toUpperCase() + x.slice(1); }).join('\n') : '';
      var box = document.getElementById('r_' + f.id);
      if (box) box.classList.toggle('isodd', !!msg);
    });

    var send = document.getElementById('send');
    /* Send is always there — a report can go before every question is
       answered, after one "are you sure" (see buildBar). Typing while a
       report is on its way must not re-arm it, nor while it asks. */
    missingNow = missing;
    oddCount = odd.length;
    if (sentThisVisit && lastSent && JSON.stringify(values) !== lastSent) sentThisVisit = false;
    if (send && !sending && !sentThisVisit) {
      send.disabled = false;
      send.classList.toggle('partial', missing > 0 || odd.length > 0);
      if (!sendArmed) send.textContent = t(sentBefore ? 'sendCorrection' : 'send');
    }

    var bar = document.querySelector('.progress i');
    if (bar) bar.style.width = (need ? Math.round(done / need * 100) : 0) + '%';

    var pv = document.getElementById('preview');
    if (pv) pv.textContent = buildMessage();
  }

  /* ---------------- message ---------------- */

  function gridRowLabel(f, i) {
    var base = L(f.rows[i]);
    if (f.dateFrom && has(values[f.dateFrom])) {
      var d = new Date(values[f.dateFrom] + 'T12:00:00Z');
      if (!isNaN(d.getTime())) {
        if (f.workDays) {
          /* Monday to Saturday: Sundays and holidays are stepped over, a
             closed start too (as apps-script/Hr.js hrWorkday_) */
          var shut = function () { return closedDay(d.toISOString().slice(0, 10)); };
          for (var g = 0; g < 14 && shut(); g++) d.setUTCDate(d.getUTCDate() + 1);
          for (var k = 0; k < i; k++) {
            d.setUTCDate(d.getUTCDate() + 1);
            for (var g2 = 0; g2 < 14 && shut(); g2++) d.setUTCDate(d.getUTCDate() + 1);
          }
        } else {
          d.setUTCDate(d.getUTCDate() + i);
        }
        /* "Day 1 · Fri 2 Oct" — "Day 1 2 Oct" read as one number */
        var wd = (lang === 'am' ? DAYS_AM : DAYS_EN)[d.getUTCDay()];
        base += ' · ' + (lang === 'am' ? wd : wd.slice(0, 3)) + ' ' + shortDate(d);
      }
    }
    return base;
  }

  /* "Other" on a pick-list (12 Oct 2026). "Material: Other" tells the store
     and the readers nothing, so picking it opens a box to write what it is.
     The pick still files as "Other" \u2014 every count by code stays as it was \u2014
     and the words file beside it under `<id>__other`, in the row for a list. */
  function isOther(v) { return /^other$/i.test(String(v == null ? '' : v)); }
  function hasOther(q) { return (q.opts || []).some(function (o) { return isOther(o.v); }); }
  function otherBox(obj, id, changed) {
    var key = id + '__other';
    var box = document.createElement('input');
    box.type = 'text';
    box.className = 'otherbox';
    box.placeholder = t('otherWhat');
    box.setAttribute('aria-label', t('otherWhat'));
    box.value = obj[key] || '';
    box.hidden = !isOther(obj[id]);
    box.oninput = box.onchange = function () {
      if (has(box.value)) obj[key] = box.value; else delete obj[key];
      changed();
    };
    /* after a pick: open (and bring up the keyboard) on "Other", close and
       forget the words on anything else */
    box.sync = function (tapped) {
      var on = isOther(obj[id]);
      if (on && box.hidden && tapped) setTimeout(function () { box.focus(); }, 0);
      box.hidden = !on;
      if (!on) { delete obj[key]; box.value = ''; }
    };
    return box;
  }
  function otherWords(obj, id) {
    var w = obj && isOther(obj[id]) ? String(obj[id + '__other'] || '').trim() : '';
    return w ? ': ' + w : '';
  }

  function colText(c, v, row) {
    if (!has(v)) return '\u2014';
    if (c.t === 'yesno') return ynWord(c, v === 'yes' ? 'yes' : 'no');
    if (c.t === 'choice') {
      for (var i = 0; i < c.opts.length; i++)
        if (c.opts[i].v === v) return (lang === 'am' ? c.opts[i].am : c.opts[i].en) + otherWords(row, c.id);
      return v;
    }
    if (c.t === 'money') return money(v) + ' ' + t('birr');
    if (c.t === 'date') return prettyDate(String(v).trim());
    if (c.t === 'photo' || c.t === 'slip') return String(v).trim() + ' 📷';
    return String(v).trim();
  }

  /* a table becomes a header line plus one compact line per row */
  function tableLines(f) {
    var data = values[f.id];
    if (!Array.isArray(data)) return [];
    var out = [], any = false;
    out.push(f.cols.map(function (c) { return L(c); }).join(' \u00b7 '));
    data.forEach(function (row, i) {
      if (!rowHasData(row, f.cols)) return;
      any = true;
      var cells = f.cols.map(function (c) { return colText(c, row[c.id], row); });
      if (f.t === 'grid') {
        out.push(gridRowLabel(f, i) + ' \u00b7 ' + cells.join(' \u00b7 '));
      } else {
        out.push(String(i + 1) + '. ' + cells.join(' \u00b7 '));
      }
    });
    if (any && f.total) out.push(totalLine(f));
    return any ? out : [];
  }

  /* the same rows as a table for the printed report: a heading per column,
     figures marked so they line up on the right */
  function tableData(f) {
    var data = Array.isArray(values[f.id]) ? values[f.id] : [];
    var grid = f.t === 'grid';
    var out = {
      head: [grid ? '' : '#'].concat(f.cols.map(function (c) { return L(c); })),
      num: [false].concat(f.cols.map(function (c) { return /^(num|money|pct)$/.test(c.t || ''); })),
      rows: []
    };
    data.forEach(function (row, i) {
      if (!rowHasData(row, f.cols)) return;
      out.rows.push([grid ? gridRowLabel(f, i) : String(i + 1)]
        .concat(f.cols.map(function (c) { return colText(c, row[c.id], row); })));
    });
    if (out.rows.length && f.total) out.total = totalLine(f);
    return out;
  }

  /* a question already ends in its own mark; "Why?:" reads as a typo */
  function said(label) {
    label = asked(label);
    return /[?？፧]\s*$/.test(label) ? label : label + ':';
  }
  /* a word to the person filling it in — "Your best guess is fine.", "(Write
     the job in the box.)" — is not part of the report; the names of a
     two-box question's boxes, "(called / all leads)", are */
  function asked(label) {
    var m = /^([\s\S]*[?？፧])\s+([^?？፧]+)$/.exec(label);
    return (m && !/\(\s*[^()]+\s\/\s[^()]+\)\s*$/.test(m[2])) ? m[1] : label;
  }

  function fmt(f) {
    if (f.t === 'table' || f.t === 'grid') return '';
    if (f.t === 'ratio') {
      var a = values[f.id + '__a'], b = values[f.id + '__b'];
      return (has(a) ? a : '—') + ' / ' + (has(b) ? b : '—');
    }
    var v = values[f.id];
    if (!has(v)) return '';
    if (f.t === 'yesno') return ynWord(f, v === 'yes' ? 'yes' : 'no');
    if (f.t === 'multi') return multiText(f, v);
    if (f.t === 'choice') {
      for (var oi = 0; oi < (f.opts || []).length; oi++) {
        if (f.opts[oi].v === v) return L(f.opts[oi]) + otherWords(values, f.id);
      }
      return String(v);
    }
    if (f.t === 'date') return prettyDate(String(v));
    if (f.t === 'money') return money(v) + ' ' + t('birr');
    if (f.t === 'pct') return String(v).replace(/%/g, '').trim() + '%';
    if (f.t === 'photos') return String(v).replace(/\bGeneral\b/, t('photoGeneral')).trim();
    return String(v).trim();
  }

  function buildMessage() {
    var person = personById(report.person);
    var out = [];
    out.push('*' + L(report).toUpperCase() + '*');
    out.push(L(person) + ' · ' + (lang === 'am' ? person.roleAm : person.roleEn));
    var pdm = periodNow(report);
    out.push(today() + ' · ' + clock() + ' · ' + statusWord(pdm) +
      (pdm.day && pdm.day !== stamp() ? ' · ' + statusLine(report, pdm) : ''));
    var gaps = unanswered();
    if (gaps.length) out.push('⚠ ' + unansweredLine(gaps));
    var odd = oddNow();
    if (odd.length) out.push('⚠ ' + t('oddCount').replace('{n}', odd.length));

    report.sections.forEach(function (sec) {
      var lines = [];
      sec.fields.forEach(function (f) {
        /* a yes/no read off the list says nothing the list did not */
        if (!shown(f) || f.quiet) return;
        if (f.t === 'table' || f.t === 'grid') {
          var tl = tableLines(f);
          if (tl.length) {
            lines.push((f.show ? '  ↳ ' : '') + said(L(f)));
            lines.push.apply(lines, tl);
          }
          return;
        }
        var v = fmt(f);
        if (!has(v) || v === '— / —') return;
        lines.push((f.show ? '  ↳ ' : (f.i ? '  ' : '')) + said(L(f)) + ' ' + v);
      });
      if (lines.length) {
        out.push('');
        out.push('*' + L(sec).toUpperCase() + '*');
        out = out.concat(lines);
      }
    });

    var flags = odd.map(function (o) { return '• ⚠ ' + oddLine(o); });
    liveFields().forEach(function (f) {
      if (targetMiss(f)) {
        flags.push('• ' + said(L(f)) + ' ' + fmt(f) + ' — ' +
          (lang === 'am' ? f.tgt.am : f.tgt.en));
      }
    });
    if (flags.length) {
      out.push('');
      out.push('*' + t('flags') + '*');
      out = out.concat(flags);
    }
    if (gaps.length) {
      out.push('');
      out.push('*' + t('notAnswered').toUpperCase() + '*');
      gaps.slice(0, 25).forEach(function (g) { out.push('• ' + g); });
      if (gaps.length > 25) out.push('• … +' + (gaps.length - 25));
    }
    return out.join('\n');
  }

  /* ---------------- boot ---------------- */

  /* handle for testing and for future edits from the console */
  window.KLEVER = {
    message: function () { return buildMessage(); },
    fill: function (v) { Object.keys(v).forEach(function (k) { values[k] = v[k]; }); refresh(); },
    /* what Send would file, and what it would call unanswered */
    answers: function () { computeAutos(); return answers(); },
    unanswered: function () { return unanswered(); },
    /* the `must` boxes Send would stop on, by the id of each box */
    mustGapIds: function () { return mustGaps().map(function (g) { return g.id; }); },
    /* the job codes an answer names (carry) */
    jobCodes: function (v, inCol) { return jobCodes(v, inCol); },
    /* the same answers the forms use, for the pages that draw the company:
       who a report goes to, and what is owed today */
    recipientsOf: recipientsOf,
    channelFor: channelFor,
    dueToday: dueToday,
    /* the sign-in card, for the Chairman's page when nobody is signed in */
    signIn: function () { var r = document.getElementById('app'); if (r) renderSignIn(r); },
    /* the same clear dates, for the Chairman's page */
    prettyDate: prettyDate,
    /* a payment's slip photos, as buttons that open them (the Chairman's receipts) */
    slipButtons: slipButtons,
    /* the Ethiopian month (office check-in counts by it) */
    ethMonthStart: ethMonthStart,
    ethMonthName: ethMonthName,
    ethDayLabel: ethDayLabel,
    /* where this phone is, for the Chairman's "save the office's place" */
    atWhere: atWhere,
    atMetres: atMetres,
    /* a day's Ethiopian date and month, and a Gregorian month short, for
       the grids' heads (the owner, 21 Oct 2026: "we have to see also
       Ethiopian date") */
    ethDay: function (ymd) {
      var e = ethOf(ymd);
      return { d: e.d, m: e.m, y: e.y, month: (lang === 'am' ? ETH_MONTHS : ETH_MONTHS_EN)[e.m - 1] };
    },
    monShort: monShort,
    dressDate: dressDate,
    /* notifications on this phone, for his page too */
    pushCard: pushCard,
    /* the payroll, as Selam sees it, with Approve on his page (Payroll.js) */
    payrollView: payrollView,
    payrollExcel: payrollExcel,
    /* Addis time, and the ledger's rule for what is owed when */
    today: stamp,
    dayStart: dayStartMs,
    deadlineOf: deadlineOf,
    dueOn: dueOn
  };

  /* Drafts older than a week are swept. Without this a phone accumulates keys
     forever, and the quota error when it fills is swallowed by store.set and
     by the offline outbox both. A draft is also cleared the moment its report
     is confirmed filed. */
  function sweepDrafts() {
    try {
      var kill = [], oldest = addDays(stamp(), -8);
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && (k.indexOf('klever.draft.') === 0 || k.indexOf('klever.sent.') === 0) && k.slice(-10) < oldest) kill.push(k);
      }
      kill.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) { /* a full or blocked store is not worth taking the page down for */ }
  }

  /* Has anyone signed in on this phone before? Firebase keeps a signed-in
     session in the browser's IndexedDB under "firebase:authUser:…". Looking
     takes milliseconds and no network, where Firebase itself is 600 KB away
     on a slow line. The database is never created here — only read if it is
     already there — and anything unexpected counts as "yes, wait for
     Firebase", which is how it behaved before. */
  function savedSignIn() {
    try { if (localStorage.getItem('klever.lastUser')) return Promise.resolve(true); } catch (e) {}
    try {
      for (var i = 0; i < localStorage.length; i++) {
        if (String(localStorage.key(i)).indexOf('firebase:authUser:') === 0) return Promise.resolve(true);
      }
    } catch (e) {}
    if (!window.indexedDB || !indexedDB.databases) return Promise.resolve(true);
    return new Promise(function (resolve) {
      var done = false;
      function answer(v) { if (!done) { done = true; resolve(v); } }
      setTimeout(function () { answer(true); }, 1500);
      indexedDB.databases().then(function (list) {
        var there = (list || []).some(function (d) { return d && d.name === 'firebaseLocalStorageDb'; });
        if (!there) { answer(false); return; }
        var rq = indexedDB.open('firebaseLocalStorageDb');
        rq.onerror = function () { answer(true); };
        rq.onupgradeneeded = function () { answer(true); };
        rq.onsuccess = function () {
          var db = rq.result;
          try {
            if (!db.objectStoreNames.contains('firebaseLocalStorage')) { db.close(); answer(false); return; }
            var g = db.transaction('firebaseLocalStorage', 'readonly').objectStore('firebaseLocalStorage').getAllKeys();
            g.onsuccess = function () {
              db.close();
              answer((g.result || []).some(function (k) { return String(k).indexOf('firebase:authUser:') === 0; }));
            };
            g.onerror = function () { db.close(); answer(true); };
          } catch (e) { try { db.close(); } catch (e2) {} answer(true); }
        };
      })['catch'](function () { answer(true); });
    });
  }

  /* This person's filings of the last week (all of them, for the Chairman),
     so the home screen knows what has been sent. Started once signed in. */
  var stopFilings = null;
  function watchFilings() {
    if (stopFilings || !window.FB || !window.FB.watchFilings || !AUTH.who()) return;
    var since = new Date(dayStartMs(addDays(stamp(), -7)));
    /* the Chairman's changes to the holidays (forms.js HOLIDAY_EDITS) */
    if (window.FB.watchHolidays) window.FB.watchHolidays(function (x) {
      if (!x) return;
      HOLIDAY_EDITS = x;
      rerender();
      drawStatus();
    });
    stopFilings = window.FB.watchFilings(AUTH.isChairman() ? null : AUTH.who(), since, function (list) {
      SERVER_FILINGS = list;
      FILINGS_IN = true;
      mergeFilings();
      rerender();
      drawStatus();
    });
  }

  /* The bar and "Connecting…" go up the moment this script runs. The rest
     waits for DOMContentLoaded, which on the Chairman's page also waits for
     chairman.js to fetch Firebase — a blank screen for as long as that takes
     on a slow line, if the bar waited too. This script sits after #app. */
  var earlyRoot = document.getElementById('app'), earlyBoot = null;
  if (earlyRoot && !document.querySelector('.top')) {
    buildTop();
    earlyBoot = el('p', 'booting', t('connecting'));
    earlyRoot.appendChild(earlyBoot);
  }

  document.addEventListener('DOMContentLoaded', function () {
    /* save.js is not loaded on every page — the Chairman's page has no forms
       to file, so it has no outbox to flush. Guard rather than assume. */
    if (typeof ARCHIVE !== 'undefined') ARCHIVE.flush();
    sweepDrafts();
    mergeFilings();
    var root = document.getElementById('app');
    if (!root) return;
    setInterval(rerender, 60000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { rerender(); drawStatus(); } });

    /* The header goes up first, always. It used to be drawn inside the promise
       below, which meant that if Firebase never answered — no signal, a blocked
       CDN, a wedged cache — the person got a blank white page with nothing on
       it at all, not even a logo. Nothing that is not waiting on an answer
       should wait for one. */
    if (!document.querySelector('.top')) buildTop();
    var booting = earlyBoot || el('p', 'booting', t('connecting'));
    if (!booting.parentNode) root.appendChild(booting);

    /* Who is signed in is Firebase's answer and it takes a moment — on a slow
       line, the several seconds it takes to download Firebase itself. A
       promise that can hang forever must not be the only thing standing
       between a person and a usable page, so it races a clock. Someone who
       was signed in on this phone before keeps seeing "Connecting…" (with a
       word about the slow line) rather than a sign-in card they don't need;
       anyone else sees the sign-in card after four seconds. */
    var settled = window.FB ? window.FB.ready : Promise.resolve(null);
    var raced = Promise.race([
      settled,
      savedSignIn().then(function (known) {
        return new Promise(function (resolve) {
          if (known) {
            setTimeout(function () { booting.textContent = t('connectingSlow'); }, 5000);
            setTimeout(function () { resolve(null); }, 30000);
          } else {
            /* nobody has ever signed in on this phone: nothing for Firebase
               to restore, so the sign-in box need not wait for it */
            resolve(null);
          }
        });
      })
    ]);

    /* An answer that arrives after we gave up waiting, or a sign-out in another
       tab, should put the page right. It must compare like with like: Firebase
       says 'chairman' and AUTH.who() says '*', and comparing those two directly
       is never equal — which reloaded the page forever. And nothing may reload
       before the first answer has been adopted, or the very first callback
       fires against a null we have not filled in yet. */
    var settledOnce = false;
    if (window.FB && window.FB.on) {
      window.FB.on(function (id) {
        if (!settledOnce) return;
        var mapped = id ? AUTH._fromFb(id) : null;
        if (mapped === AUTH.who()) return;
        /* the Chairman's own pages hand over only on a reload */
        if (ownPage()) { location.reload(); return; }
        /* otherwise put the page right where it stands */
        AUTH._adopt(id);
        rebuildTop();
        route();
      });
    }

    function route() {
      if (!AUTH.who()) { renderSignIn(root); return; }
      /* signed in as an account that is no one on the staff list: the gate
         tablet's goes to its own page; any other (someone who has left) is
         signed out, and the sign-in card says why (15 Oct 2026) */
      if (!AUTH.isChairman() && !personById(AUTH.who())) {
        if (AUTH.who() === 'gate') { location.replace('gate.html'); return; }
        var gone = AUTH.who();
        AUTH._adopt(null);
        rebuildTop();
        renderSignIn(root);
        toast(t('accountGone'));
        if (window.FB && window.FB.signOut) window.FB.signOut()['catch'](function () {});
        try { if (localStorage.getItem('klever.lastUser') === gone) localStorage.removeItem('klever.lastUser'); } catch (e) {}
        return;
      }
      root.classList.remove('signing');
      try { localStorage.setItem('klever.lastUser', AUTH.who()); } catch (e) {}
      watchFilings();
      /* chairman.js owns #app on its own page. app.js is still loaded there
         for buildTop, renderSignIn and the shared helpers, and must draw
         nothing itself or the two race each other for the same node. */
      if (ownPage()) return;
      if (LINK_KEY) {
        /* a personal link opened on a phone where someone else is signed in */
        toast(t('linkOtherAccount'));
        LINK_KEY = null;
      }
      if (document.body.dataset.page === 'form') renderForm(root);
      else renderIndex(root);
    }

    /* and the server's clock, before any day or deadline is drawn — three
       seconds at most, so no line never means no page */
    Promise.all([raced, Promise.race([CLOCK, new Promise(function (r) { setTimeout(r, 3000); })])]).then(function (got) {
      var id = got[0];
      AUTH._adopt(id);
      settledOnce = true;
      /* the bar was drawn before Firebase answered, so it had no sign-out
         button and no chat link; draw it again now that it knows who */
      rebuildTop();
      var b = root.querySelector('.booting');
      if (b) b.parentNode.removeChild(b);
      route();
    });
  });
})();
