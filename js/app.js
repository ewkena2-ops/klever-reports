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

  function t(k) { return T[lang][k]; }
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
  function pad2(n) { return ('0' + n).slice(-2); }
  function addis(ms) { return new Date((ms == null ? Date.now() : ms) + ADDIS_MS); }
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
    if (dow === 0) return false;
    /* a report that starts on a later day (`from` on the report) is owed by
       nobody before it — the board check, added at 6 PM on 12 Oct 2026 */
    if (r.from && ymd < r.from) return false;
    /* a weekly report made from the daily reports (built:1, js/weekly.js)
       is owed by nobody — the Chairman, 11 Oct 2026 */
    if (r.built) return false;
    if (r.cadence === 'monthly') return dom === 1 || (dom === 2 && dowOf(addDays(ymd, -1)) === 0);
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
  function periodNow(r) {
    var d0 = stamp(), now = Date.now();
    var wsun = r.cadence === 'weekly' ? weekClose(now, r.id) : null;
    if (wsun && wsun >= WEEK_FROM) {
      var wd = addDays(wsun, r.dueDay - 7), wdl = deadlineOf(wd, r.dueTime);
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

  /* Filings sent from this phone and not yet on the server. They wait in
     Firestore's cache and go when there is signal, but its queries leave
     them out until then — their time is the server's to set — so this phone
     keeps its own note of them, dropped once the server copy is seen. */
  function pendingList() {
    try { return JSON.parse(localStorage.getItem('klever.pending') || '[]') || []; } catch (e) { return []; }
  }
  function savePending(l) { try { localStorage.setItem('klever.pending', JSON.stringify(l)); } catch (e) {} }
  function addPending(r) {
    var p = { k: Math.random().toString(36).slice(2), report: r.id, person: r.person, at: Date.now() };
    savePending(pendingList().concat([p]));
    mergeFilings();
    return p.k;
  }
  function dropPending(k) {
    savePending(pendingList().filter(function (p) { return p.k !== k; }));
    mergeFilings();
  }
  function mergeFilings() {
    var cut = Date.now() - 8 * 864e5;
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
    return REPORTS.filter(function (r) { return r.person === pid; }).sort(function (a, b) {
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
    inner.setAttribute('aria-label', 'Klever');
    var a = el('a'); a.href = 'index.html';
    var img = new Image(); img.src = 'assets/logo.png';
    img.alt = 'Klever Küche'; a.appendChild(img);
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
      var me = personById(AUTH.who());
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
        try { localStorage.removeItem('klever.lastUser'); } catch (e) {}
        AUTH.signOut().then(function () { location.href = 'index.html'; });
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
    return Math.floor((deadlineOf(stamp(), tm) - Date.now()) / 60000);
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
      /* never #all. Yordanos's store report names the Chairman, Mahelet and
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

    var mark = el('div', 'lh-mark');
    mark.appendChild(el('span', 'lh-k', 'KLEVER'));
    mark.appendChild(el('span', 'lh-ku', 'KÜCHE'));
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
  function instructionsCard() {
    if (stopIns) { try { stopIns(); } catch (e) {} stopIns = null; }
    var wrap = el('div', 'inswrap');
    if (!window.FB || !window.FB.live() || AUTH.isChairman()) return wrap;
    stopIns = window.FB.watchMyInstructions(function (all) {
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
  var stopMf = null;
  function moneyFixCard() {
    if (stopMf) { try { stopMf(); } catch (e) {} stopMf = null; }
    var wrap = el('div', 'inswrap mfwrap');
    if (!window.FB || !window.FB.live() || AUTH.isChairman() || !window.FB.watchMyMoneyFix) return wrap;
    var sentNow = {};
    stopMf = window.FB.watchMyMoneyFix(function (docs, mine) {
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
  function num_(v) { var x = String(v == null ? '' : v).replace(/[^0-9.\-]/g, ''); return x === '' ? NaN : Number(x); }
  function tfill_(k, o) { return t(k).replace(/\{(\w+)\}/g, function (m, n) { return o[n] != null ? o[n] : m; }); }
  function personName_(id) { var p = PEOPLE.filter(function (x) { return x.id === id; })[0]; return p ? L(p).split(' ')[0] : id; }

  /* The readings of the agents this person owns (apps-script/Owners.js):
     the morning's and the week's, newest first, each folded to its title. */
  var stopRd = null;
  function readingsCard() {
    if (stopRd) { try { stopRd(); } catch (e) {} stopRd = null; }
    var wrap = el('div', 'rdwrap');
    if (!window.FB || !window.FB.live() || AUTH.isChairman() || !window.FB.watchMyReadings) return wrap;
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
    currentView();
    Array.prototype.forEach.call(document.querySelectorAll('#app details'), function (d, i) { if (open[i]) d.open = true; });
    window.scrollTo(0, y);
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
    root.appendChild(deck(p, st));
    root.appendChild(moneyFixCard());
    root.appendChild(instructionsCard());
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

    setView(null);
    /* A draft belongs to the due day it is for, not the calendar day it was
       typed on: a weekly report started on Thursday for Friday is still
       there on Friday. If there is none for this period, the newest unsent
       draft of this report from the last week comes back instead — a daily
       report typed at 23:50 is not lost at 00:05. */
    var pd0 = periodNow(report);
    draftKey = 'klever.draft.' + report.id + '.' + (pd0.day || stamp());
    var restoredFrom = null;
    try { values = JSON.parse(store.get(draftKey) || 'null'); } catch (e) { values = null; }
    /* an empty draft (the form was only opened) does not hide a real one */
    if (!values || typeof values !== 'object' || !hasContent(values)) {
      values = {};
      var older = latestDraft(report.id, draftKey);
      if (older) { values = older.values; restoredFrom = older.day; }
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
    if (restoredFrom) {
      head.appendChild(el('div', 'penalty soft', t('draftRestored').replace('{day}', dayLabel(restoredFrom))));
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
    /* a weekly or monthly report adds up its own week: fetch it, then the
       figures fill themselves in */
    loadWeekValues();
    loadRecent();
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
    var since = new Date(Date.now() - 9 * 864e5);
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
    box.className = 'fstat' + (pd.state === 'late' ? ' late' : (pd.state === 'none' ? ' none' : ''));
    box.innerHTML = '';
    box.appendChild(el('span', 'fsp', statusWord(pd)));
    box.appendChild(el('span', 'fsc', statusLine(report, pd) + ' · ' + clock()));
    var note = document.getElementById('sentnote');
    if (note) {
      var fr = pd.day ? filingFor(report, pd.day) : null;
      note.hidden = !fr;
      if (fr) note.textContent = (fr.pending ? t('waitingToSend') : t('sentAt') + ' ' + clockOf(fr.at)) +
        ' · ' + t('sentAgainWarn');
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

  /* the newest unsent draft of a report from the past week, other than `except` */
  function latestDraft(reportId, except) {
    var best = null, prefix = 'klever.draft.' + reportId + '.';
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k.indexOf(prefix) !== 0 || k === except) continue;
        var day = k.slice(prefix.length);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day < addDays(stamp(), -7)) continue;
        var v = JSON.parse(localStorage.getItem(k) || 'null');
        if (v && hasContent(v) && (!best || day > best.day)) best = { day: day, values: v };
      }
    } catch (e) { /* a blocked store just means no draft */ }
    return best;
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

    if (!Array.isArray(values[f.id])) values[f.id] = [];
    var data = values[f.id];

    function rowLabel(i) {
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
        head.appendChild(el('span', 'idx', rowLabel(i)));
        if (f.t === 'table') {
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

        f.cols.forEach(function (c) {
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
                refresh();
                if (wrap.sumUp) wrap.sumUp();
              };
              cseg.appendChild(yb);
            });
            cl.removeAttribute('for');
            cell.appendChild(cseg);
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
          var onType = function () { rowData[c.id] = inp.value; if (tapBox) tapBox.hidden = has(inp.value); if (oth) oth.sync(true); refresh(); if (wrap.sumUp) wrap.sumUp(); };
          inp.onchange = inp.oninput = onType;
          cell.appendChild(c.t === 'date' ? dressDate(inp) : inp);
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
          card.appendChild(cell);
        });
        body.appendChild(card);
      });

      if (f.t === 'table') {
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

    if (f.t === 'table' && !data.length) data.push({});
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
      ar.appendChild(el('div', 'hint', t(f.auto.week != null ? 'fromYourWeek' : 'workedOut')));
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
    var logo = new Image();
    logo.src = 'assets/logo.png';
    logo.alt = 'Klever Küche';
    logo.className = 'pd-logo';
    head.appendChild(logo);
    var kind = el('div', 'pd-kind', t('siteTitle'));
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
    var pdf = el('button', 'btn ghost', t('printBtn'));
    pdf.type = 'button';
    pdf.onclick = function () { window.print(); };
    /* Ctrl+P, or a phone's own Print menu, must give the same document */
    window.addEventListener('beforeprint', buildPrintDoc);
    var send = el('button', 'btn', t('send'));
    send.type = 'button'; send.id = 'send';
    var retry = el('button', 'btn ghost retry', t('retryDelivery'));
    retry.type = 'button';
    retry.hidden = true;

    /* Deliver it into chat. Filing is the record; this puts it in front of
       the people who have to act on it. Only this part is ever retried — a
       second press used to file the report and its Sheet row again. A long
       report goes in parts, because a chat message holds 4,000 characters. */
    var toDeliver = null;
    function deliver() {
      if (!toDeliver) return;
      var job = toDeliver, names = lang === 'am' ? report.toAm : report.toEn;
      retry.hidden = true;
      if (!job.chan || !window.FB || !window.FB.live()) { retry.hidden = false; toast(t('sendNotDelivered')); return; }
      /* cut and numbered once: a retry sends the parts still owed as they
         were, rather than cutting the numbered text again ("(1/2) (1/2)") */
      var parts = job.parts || (job.parts = splitForChat(job.text, 3900)), i = job.sent || 0;
      (function next() {
        if (i >= parts.length) { toDeliver = null; toast(t('sentTo').replace('{who}', names)); return; }
        window.FB.deliverReport(job.chan, parts[i]).then(function () { i++; job.sent = i; next(); })['catch'](function (e) {
          /* keep the parts not yet delivered, and offer to try those again */
          retry.hidden = false;
          toast((e && e.code === 'permission-denied') ? t('sendRefused') : t('sendNotDelivered'));
        });
      })();
    }
    retry.onclick = deliver;

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
        sendDisarm = setTimeout(function () { sendArmed = false; if (!sending) send.textContent = t('send'); }, 6000);
        return;
      }
      clearTimeout(sendDisarm);
      sendArmed = false;
      sending = true;
      send.disabled = true;
      send.textContent = t('sending');
      var txt = buildMessage(), pd = periodNow(report), late = pd.state === 'late';
      var person = personById(report.person);

      /* Two homes, on purpose. The Sheet is the Chairman's window on the day
         and it drives the emails; Firestore is the copy that is signed in and
         cannot be forged, which is the one the penalty ledger answers for.
         The Sheet is sent English names and ids whatever language the form
         was filled in, so one report's history stays in one tab. */
      ARCHIVE.file({
        at: new Date().toISOString(),
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

      toDeliver = { chan: channelFor(report, AUTH.isChairman() ? 'chairman' : AUTH.who()), text: txt };

      if (!(window.FB && window.FB.live() && AUTH.who())) {
        sending = false;
        send.textContent = t('sentDone');
        deliver();
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
        lang: lang
      }).then(function () {
        clearTimeout(slow);
        sending = false;
        sentThisVisit = true;
        send.textContent = t('sentDone');
        replay(send, 'sentok');
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
        send.textContent = t('send');
        toast((e && e.code === 'permission-denied') ? t('sendRefused') : t('sendFailed'));
      });
      /* delivery goes at once too: offline, it waits with the filing */
      deliver();
    };
    inner.appendChild(count); inner.appendChild(pdf);
    inner.appendChild(retry);
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
  /* how many required questions are empty right now, and whether Send has
     asked "send it anyway?" and is waiting for the second tap */
  var missingNow = 0, oddCount = 0, sendArmed = false, sendDisarm = null;
  var lastMissing = null;   /* the count last drawn, so a change can be shown (MOTION) */

  /* a message longer than chat holds, cut at line ends into numbered parts */
  function splitForChat(txt, max) {
    if (txt.length <= max) return [txt];
    var parts = [], cur = '';
    txt.split('\n').forEach(function (line) {
      /* what came before an overlong line goes first, or the answer arrives
         as part 1 and the report's own header as part 2 */
      if (line.length > max && cur) { parts.push(cur); cur = ''; }
      while (line.length > max) { parts.push(line.slice(0, max)); line = line.slice(max); }
      if ((cur + '\n' + line).length > max) { parts.push(cur); cur = line; }
      else cur = cur ? cur + '\n' + line : line;
    });
    if (cur) parts.push(cur);
    return parts.map(function (p, i) { return '(' + (i + 1) + '/' + parts.length + ')\n' + p; });
  }

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
          if (!c.must) return;
          (values[f.id] || []).forEach(function (row, i) {
            if (row && rowHasData(row, f.cols) && !has(row[c.id])) {
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
    if (typeof oddFigures !== 'function') return [];
    return oddFigures(report, values).filter(function (o) {
      var f = fieldById(o.f);
      return f && shown(f);
    });
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
    /* a yes/no read off a "tap everything that happened" list: yes when one
       of `v` was tapped, no when the list was answered without it, blank
       while the list is unanswered. `flip` is for a question asked the right
       way round — "Was the floor clean?" is no when "Floor left dirty" was
       tapped. */
    /* rows folded out of another list, row by row: {fold:'plan_week',
       sum:{m2:['m1','n2','n3']}, join:{jobs:['k1','k2','k3']}, keep:{notes:'notes'}}
       — the day's total m² and its jobs from the jobs written one by one */
    if (k.fold != null) {
      var src = Array.isArray(values[k.fold]) ? values[k.fold] : [];
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
      return sn ? round(st, 3) : NaN;
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
    FB.ownReports(report.person, new Date(Date.now() - 21 * 864e5)).then(function (list) {
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
    FB.ownReports(report.person, new Date(Date.now() - 40 * 864e5)).then(function (list) {
      WEEKVALS = list || [];
      refresh();
    })['catch'](function () { WEEKVALS = []; refresh(); });
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
    var now = Date.now();
    if (report.cadence === 'monthly') {
      var a = addis(now);
      return { from: dayStartMs(a.getUTCFullYear() + '-' + pad2(a.getUTCMonth() + 1) + '-01'),
               to: now + 864e5 };
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
    if (f.opt) return false;
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
      if (f.show && !f.quiet) {
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
      if (f.tgt) {
        var h = document.getElementById('h_' + f.id);
        if (h) {
          var miss = targetMiss(f);
          h.className = 'hint' + (miss ? ' bad' : (!isNaN(targetValue(f)) ? ' good' : ''));
          h.textContent = (lang === 'am' ? f.tgt.am : f.tgt.en) +
            (miss ? ' — ' + (f.tgt.op === 'gte' ? t('below') : t('above')) : '');
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
    if (send && !sending && !sentThisVisit) {
      send.disabled = false;
      send.classList.toggle('partial', missing > 0 || odd.length > 0);
      if (!sendArmed) send.textContent = t('send');
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
          /* Monday to Saturday: Sundays are stepped over, a Sunday start too */
          if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1);
          for (var k = 0; k < i; k++) {
            d.setUTCDate(d.getUTCDate() + 1);
            if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1);
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
    if (c.t === 'photo') return String(v).trim() + ' 📷';
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
    /* the same answers the forms use, for the pages that draw the company:
       who a report goes to, and what is owed today */
    recipientsOf: recipientsOf,
    channelFor: channelFor,
    dueToday: dueToday,
    /* the sign-in card, for the Chairman's page when nobody is signed in */
    signIn: function () { var r = document.getElementById('app'); if (r) renderSignIn(r); },
    /* the same clear dates, for the Chairman's page */
    prettyDate: prettyDate,
    dressDate: dressDate,
    /* notifications on this phone, for his page too */
    pushCard: pushCard,
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
        if (k && k.indexOf('klever.draft.') === 0 && k.slice(-10) < oldest) kill.push(k);
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
    stopFilings = window.FB.watchFilings(AUTH.isChairman() ? null : AUTH.who(), since, function (list) {
      SERVER_FILINGS = list;
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

    raced.then(function (id) {
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
