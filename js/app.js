/* Klever report site — renderer, draft autosave, WhatsApp handoff.
   No dependencies. Works from file:// and from GitHub Pages. */

(function () {
  'use strict';

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
  function clock() { var a = addis(); return pad2(a.getUTCHours()) + ':' + pad2(a.getUTCMinutes()); }
  function clockOf(date) { var a = addis(date.getTime()); return pad2(a.getUTCHours()) + ':' + pad2(a.getUTCMinutes()); }
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
    if (r.cadence === 'monthly') return dom === 1 || (dom === 2 && dowOf(addDays(ymd, -1)) === 0);
    if (r.cadence === 'weekly') return r.dueDay === dow;
    return !(r.skipDays && r.skipDays.indexOf(dow) >= 0);
  }
  /* how many days ahead of its due day a filing still counts (the ledger's
     window): a daily report only on the day, a weekly one up to six days
     early, a monthly one up to seven */
  function windowDays(r) { return r.cadence === 'daily' ? 0 : (r.cadence === 'weekly' ? 6 : 7); }

  /* The due day a filing sent now would count toward, and how it stands:
       due   — it is that day and the deadline has not passed
       late  — it is that day and the deadline has passed
       early — a later day within reach (a weekly or monthly report sent ahead)
       none  — nothing: not a due day, and no due day within reach
     This is the same answer the ledger will give when it closes the day, so
     the phone, the email, the Sheet and the fines all say the same thing. */
  function periodNow(r) {
    var d0 = stamp(), now = Date.now();
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
    return ['chairman', 'agents', 'universe'].indexOf(document.body.dataset.page) !== -1;
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
        navs.unshift(['agents.html', 'orbit', t('obKicker'), here === 'agents']);
        navs.unshift(['universe.html', 'galaxy', t('unKicker'), here === 'universe']);
        navs.unshift(['chairman.html', 'day', t('chOverview'), here === 'chairman']);
      }
      navs.forEach(function (n) {
        var fold = n[0] === 'universe.html' || n[0] === 'agents.html';
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
        navs.filter(function (n) { return n[0] === 'universe.html' || n[0] === 'agents.html'; })
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
    'Elyas': ['elyas'],
    'Kidan': []          /* Kidan has no account — he has no letter either */
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
    orbit: 'M12 9.6a2.4 2.4 0 1 1 0 4.8a2.4 2.4 0 0 1 0-4.8zM2.8 12c0-2.3 4.1-4.2 9.2-4.2s9.2 1.9 9.2 4.2-4.1 4.2-9.2 4.2-9.2-1.9-9.2-4.2zM19.2 5.6a1.1 1.1 0 1 1 0 .01',
    doc: 'M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10.5A.5.5 0 0 1 6.5 20V4a.5.5 0 0 1 .5-.5zM14 3.5V8h4M9.5 12h5M9.5 15.5h5',
    galaxy: 'M12 10.4a1.6 1.6 0 1 1 0 3.2a1.6 1.6 0 0 1 0-3.2zM12 4.5c4.4 0 7.5 3.2 7.5 7 0 3-2.4 5-5.2 5M12 19.5c-4.4 0-7.5-3.2-7.5-7 0-3 2.4-5 5.2-5',
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
    wrap.appendChild(el('p', 'deck-t',
      hhmm(r.dueTime) + '  ·  ' + (lang === 'am' ? r.toAm : r.toEn)));

    var go = el('a', 'deck-go' + (late ? ' late' : ''), t('fillItIn'));
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
      if (!open.length) return;
      wrap.appendChild(el('h2', 'eyebrow', t('insTitle')));
      open.forEach(function (i) { wrap.appendChild(insRow(i)); });
    });
    return wrap;
  }

  function daysFrom(a, b) {
    return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
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
    root.appendChild(instructionsCard());

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
    if (!values || typeof values !== 'object' || !Object.keys(values).length) {
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
      lg.appendChild(el('span', null, L(sec)));
      var lc = el('span', 'lgc');
      lc.id = 'lgc_' + si;
      lg.appendChild(lc);
      fs.appendChild(lg);
      sec.fields.forEach(function (f) { fs.appendChild(fieldRow(f)); });
      root.appendChild(fs);
    });

    var pv = el('div', 'preview'); pv.id = 'preview';
    root.appendChild(el('p', 'eyebrow', t('preview')));
    root.appendChild(pv);
    root.appendChild(foot());

    buildBar();
    refresh();
    /* the status line keeps time while the form is open */
    clearInterval(renderForm.tick);
    renderForm.tick = setInterval(drawStatus, 30000);
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
        if (v && Object.keys(v).length && (!best || day > best.day)) best = { day: day, values: v };
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

  function shortDate(d) {
    return d.getDate() + ' ' + monShort(d.getMonth());
  }

  /* repeating rows: t:'table' (person adds rows) and t:'grid' (fixed rows) */
  function repeater(f) {
    var wrap = el('div', 'repwrap');
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
          var cell = el('div', 'cell');
          var cl = el('label', null, L(c));
          cell.appendChild(cl);
          var inp;
          if (c.t === 'yesno' || c.t === 'choice') {
            inp = document.createElement('select');
            var blank = document.createElement('option');
            blank.value = ''; blank.textContent = '\u2014';
            inp.appendChild(blank);
            var opts = c.t === 'yesno'
              ? [{v:'yes', en:T.en.yes, am:T.am.yes}, {v:'no', en:T.en.no, am:T.am.no}]
              : c.opts;
            opts.forEach(function (o) {
              var op = document.createElement('option');
              op.value = o.v; op.textContent = lang === 'am' ? o.am : o.en;
              inp.appendChild(op);
            });
          } else {
            inp = document.createElement('input');
            inp.type = 'text';
            /* a number box that reads "1,500" as empty is worse than a text box
               with the number keyboard; the digits are read by num() */
            if (c.t === 'num' || c.t === 'money') inp.inputMode = 'decimal';
          }
          inp.id = 'c_' + f.id + '_' + i + '_' + c.id;
          cl.htmlFor = inp.id;
          inp.value = rowData[c.id] != null ? rowData[c.id] : '';
          inp.onchange = inp.oninput = function () { rowData[c.id] = inp.value; refresh(); };
          cell.appendChild(inp);
          card.appendChild(cell);
        });
        body.appendChild(card);
      });

      if (f.t === 'table') {
        var add = el('button', 'addrow', '+ ' + (lang === 'am' ? f.addAm : f.addEn));
        add.type = 'button';
        add.onclick = function () { data.push({}); draw(); refresh(); };
        body.appendChild(add);
      }
    }

    if (f.t === 'table' && !data.length) data.push({});
    draw();
    wrap.redraw = draw;
    return wrap;
  }

  function fieldRow(f) {
    if (f.t === 'table' || f.t === 'grid') return repeater(f);
    var row = el('div', 'fld' + (f.i ? ' indent' : '')
                 + (f.t === 'area' ? ' wide' : '')
                 /* a choice and a yes/no both hold words, and words do not fit
                    the narrow control column once they are in Amharic */
                 + (f.t === 'choice' ? ' wide' : '')
                 + (f.t === 'yesno' ? ' yn' : ''));
    var lab = el('label', null, L(f));
    lab.id = 'l_' + f.id;
    lab.htmlFor = 'f_' + f.id;
    row.appendChild(lab);

    if (f.t === 'ratio') {
      /* two boxes under one question; the wrapper carries the id, so the
         "still empty" finder and the red mark can find it */
      var wrap = el('div', 'ratio');
      wrap.id = 'f_' + f.id;
      wrap.tabIndex = -1;
      wrap.setAttribute('role', 'group');
      wrap.setAttribute('aria-labelledby', lab.id);
      lab.removeAttribute('for');
      var ia = numInput(f.id + '__a', f), ib = numInput(f.id + '__b', f);
      ia.setAttribute('aria-label', L(f) + ' — 1');
      ib.setAttribute('aria-label', L(f) + ' — 2');
      wrap.appendChild(ia);
      wrap.appendChild(el('span', 'of', '/'));
      wrap.appendChild(ib);
      row.appendChild(wrap);
    } else if (f.t === 'yesno') {
      var seg = el('div', 'seg');
      seg.id = 'f_' + f.id;
      seg.tabIndex = -1;
      seg.setAttribute('role', 'group');
      seg.setAttribute('aria-labelledby', lab.id);
      lab.removeAttribute('for');
      [['yes', t('yes')], ['no', t('no')]].forEach(function (o) {
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
      row.appendChild(di);
    } else if (f.t === 'choice') {
      var sel = document.createElement('select');
      sel.id = 'f_' + f.id;
      var blank = document.createElement('option');
      blank.value = ''; blank.textContent = '—';
      sel.appendChild(blank);
      (f.opts || []).forEach(function (o) {
        var op = document.createElement('option');
        op.value = o.v;
        op.textContent = lang === 'am' ? o.am : o.en;
        sel.appendChild(op);
      });
      sel.value = values[f.id] || '';
      sel.onchange = function () { values[f.id] = sel.value; refresh(); };
      row.appendChild(sel);
    } else if (f.t === 'text') {
      var ti = document.createElement('input');
      ti.type = 'text'; ti.id = 'f_' + f.id;
      ti.value = values[f.id] || '';
      ti.oninput = function () { values[f.id] = ti.value; refresh(); };
      row.appendChild(ti);
    } else {
      row.appendChild(numInput(f.id, f));
    }

    if (f.tgt) {
      var h = el('div', 'hint');
      h.id = 'h_' + f.id;
      h.textContent = lang === 'am' ? f.tgt.am : f.tgt.en;
      row.appendChild(h);
    }
    return row;
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
        if (fl.t === 'table' || fl.t === 'grid') {
          var tl = tableLines(fl);
          if (tl.length) rows.push([L(fl), tl.join(String.fromCharCode(10))]);
          return;
        }
        var v = fmt(fl);
        if (!has(v) || v === '— / —') return;
        rows.push([(fl.i ? '· ' : '') + L(fl), v]);
      });
      if (rows.length) doc.push({ sec: L(sec), rows: rows });
    });
    return doc;
  }

  function reportFlags() {
    var out = [];
    allFields().forEach(function (fl) {
      if (targetMiss(fl)) out.push(L(fl) + ': ' + fmt(fl) + ' — ' + (lang === 'am' ? fl.tgt.am : fl.tgt.en));
    });
    return out;
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
    doc.appendChild(meta);

    reportDoc().forEach(function (s) {
      doc.appendChild(el('h2', 'pd-sec', s.sec));
      var tbl = el('table', 'pd-tbl');
      s.rows.forEach(function (r) {
        var tr = el('tr');
        tr.appendChild(el('th', null, r[0]));
        tr.appendChild(el('td', null, r[1]));
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
    var bar = el('div', 'bar'), inner = el('div', 'bar-in');
    var count = el('button', 'count'); count.id = 'count'; count.type = 'button';
    var copy = el('button', 'btn ghost', t('copy'));
    copy.type = 'button';
    copy.onclick = function () {
      var txt = buildMessage();
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast(t('copied')); });
      else { window.prompt(t('copy'), txt); }
    };
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
      var parts = splitForChat(job.text, 3900), i = 0;
      (function next() {
        if (i >= parts.length) { toDeliver = null; toast(t('sentTo').replace('{who}', names)); return; }
        window.FB.deliverReport(job.chan, parts[i]).then(function () { i++; next(); })['catch'](function (e) {
          /* keep the parts not yet delivered, and offer to try those again */
          job.text = parts.slice(i).join('\n');
          retry.hidden = false;
          toast((e && e.code === 'permission-denied') ? t('sendRefused') : t('sendNotDelivered'));
        });
      })();
    }
    retry.onclick = deliver;

    send.onclick = function () {
      if (sending) return;
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
        values: values,
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
      drawStatus();
      window.FB.fileReport({
        person: report.person,
        report: report.id,
        late: late,
        due: report.dueEn,
        values: values,
        flags: reportFlags(),
        text: txt,
        lang: lang
      }).then(function () {
        clearTimeout(slow);
        sending = false;
        sentThisVisit = true;
        send.textContent = t('sentDone');
        clearDrafts(report.id);
        dropPending(pendKey);
        drawStatus();
      })['catch'](function (e) {
        clearTimeout(slow);
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
    inner.appendChild(count); inner.appendChild(pdf); inner.appendChild(copy);
    inner.appendChild(retry);
    inner.appendChild(send);
    bar.appendChild(inner);
    document.body.appendChild(bar);
  }

  /* a sent report is not sent twice by accident */
  var sending = false, sentThisVisit = false;

  /* a message longer than chat holds, cut at line ends into numbered parts */
  function splitForChat(txt, max) {
    if (txt.length <= max) return [txt];
    var parts = [], cur = '';
    txt.split('\n').forEach(function (line) {
      while (line.length > max) { parts.push(line.slice(0, max)); line = line.slice(max); }
      if ((cur + '\n' + line).length > max) { parts.push(cur); cur = line; }
      else cur = cur ? cur + '\n' + line : line;
    });
    if (cur) parts.push(cur);
    return parts.map(function (p, i) { return '(' + (i + 1) + '/' + parts.length + ')\n' + p; });
  }

  /* ---------------- live state ---------------- */

  function allFields() {
    var out = [];
    report.sections.forEach(function (s) { s.fields.forEach(function (f) { out.push(f); }); });
    return out;
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

  function refresh() {
    store.set(draftKey, JSON.stringify(values));

    var fields = allFields(), need = 0, done = 0;
    var firstEmpty = null;
    fields.forEach(function (f) {
      if (!f.opt) {
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
    report.sections.forEach(function (sec, si) {
      var lc = document.getElementById('lgc_' + si);
      if (!lc) return;
      var sn = 0, sd = 0;
      sec.fields.forEach(function (f) {
        if (f.opt) return;
        var u = (f.t === 'grid' && f.rows) ? f.rows.length : 1;
        sn += u;
        if (filled(f)) sd += u;
      });
      lc.textContent = sn ? sd + ' / ' + sn : '';
      lc.className = 'lgc' + (sn && sd === sn ? ' full' : '');
    });

    var missing = need - done;
    var c = document.getElementById('count');
    if (c) {
      c.innerHTML = '';
      if (missing > 0) {
        var b = el('b', null, String(missing));
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
            var target = document.querySelector('.miss') || firstEmpty;
            target.scrollIntoView({ block: 'center', behavior: 'smooth' });
            try { target.focus({ preventScroll: true }); } catch (e) {}
          };
        }
      } else {
        c.textContent = t('ready');
        c.classList.remove('findable');
        c.onclick = null;
      }
    }
    var send = document.getElementById('send');
    /* typing while a report is on its way must not re-arm Send */
    if (send && !sending && !sentThisVisit) send.disabled = missing > 0;

    var bar = document.querySelector('.progress i');
    if (bar) bar.style.width = (need ? Math.round(done / need * 100) : 0) + '%';

    var pv = document.getElementById('preview');
    if (pv) pv.textContent = buildMessage();
  }

  /* ---------------- message ---------------- */

  function gridRowLabel(f, i) {
    var base = L(f.rows[i]);
    if (f.dateFrom && has(values[f.dateFrom])) {
      var d = new Date(values[f.dateFrom]);
      if (!isNaN(d.getTime())) { d.setDate(d.getDate() + i); base += ' ' + shortDate(d); }
    }
    return base;
  }

  function colText(c, v) {
    if (!has(v)) return '\u2014';
    if (c.t === 'yesno') return v === 'yes' ? t('yes') : t('no');
    if (c.t === 'choice') {
      for (var i = 0; i < c.opts.length; i++)
        if (c.opts[i].v === v) return lang === 'am' ? c.opts[i].am : c.opts[i].en;
      return v;
    }
    if (c.t === 'money') return money(v) + ' ' + t('birr');
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
      var cells = f.cols.map(function (c) { return colText(c, row[c.id]); });
      if (f.t === 'grid') {
        out.push(gridRowLabel(f, i) + ' \u00b7 ' + cells.join(' \u00b7 '));
      } else {
        out.push(String(i + 1) + '. ' + cells.join(' \u00b7 '));
      }
    });
    return any ? out : [];
  }

  function fmt(f) {
    if (f.t === 'table' || f.t === 'grid') return '';
    if (f.t === 'ratio') {
      var a = values[f.id + '__a'], b = values[f.id + '__b'];
      return (has(a) ? a : '—') + ' / ' + (has(b) ? b : '—');
    }
    var v = values[f.id];
    if (!has(v)) return '';
    if (f.t === 'yesno') return v === 'yes' ? t('yes') : t('no');
    if (f.t === 'choice') {
      for (var oi = 0; oi < (f.opts || []).length; oi++) {
        if (f.opts[oi].v === v) return L(f.opts[oi]);
      }
      return String(v);
    }
    if (f.t === 'date') {
      var dd = new Date(v);
      return isNaN(dd.getTime()) ? String(v) : shortDate(dd) + ' ' + dd.getFullYear();
    }
    if (f.t === 'money') return money(v) + ' ' + t('birr');
    if (f.t === 'pct') return String(v).replace(/%/g, '').trim() + '%';
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

    report.sections.forEach(function (sec) {
      var lines = [];
      sec.fields.forEach(function (f) {
        if (f.t === 'table' || f.t === 'grid') {
          var tl = tableLines(f);
          if (tl.length) {
            lines.push(L(f) + ':');
            lines.push.apply(lines, tl);
          }
          return;
        }
        var v = fmt(f);
        if (!has(v) || v === '— / —') return;
        lines.push((f.i ? '  ' : '') + L(f) + ': ' + v);
      });
      if (lines.length) {
        out.push('');
        out.push('*' + L(sec).toUpperCase() + '*');
        out = out.concat(lines);
      }
    });

    var flags = [];
    allFields().forEach(function (f) {
      if (targetMiss(f)) {
        flags.push('• ' + L(f) + ': ' + fmt(f) + ' — ' +
          (lang === 'am' ? f.tgt.am : f.tgt.en));
      }
    });
    if (flags.length) {
      out.push('');
      out.push('*' + t('flags') + '*');
      out = out.concat(flags);
    }
    return out.join('\n');
  }

  /* ---------------- boot ---------------- */

  /* handle for testing and for future edits from the console */
  window.KLEVER = {
    message: function () { return buildMessage(); },
    fill: function (v) { Object.keys(v).forEach(function (k) { values[k] = v[k]; }); refresh(); },
    /* the same answers the forms use, for the pages that draw the company:
       who a report goes to, and what is owed today */
    recipientsOf: recipientsOf,
    dueToday: dueToday,
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
