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
  /* yyyy-mm-dd in local time. toISOString() is UTC, and Addis is three hours
     ahead, so a draft typed at 1am was being filed under yesterday and looked
     lost the next morning. */
  function stamp() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) +
           '-' + ('0' + d.getDate()).slice(-2);
  }
  function today() {
    var d = new Date(), m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return d.getDate() + ' ' + m[d.getMonth()] + ' ' + d.getFullYear();
  }
  function clock() {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  /* daily reports are late after their time of day; weekly ones are late once
     their due day has passed (dueDay: 0=Sun .. 5=Fri) */
  function isLate(dueTime, dueDay) {
    if (!dueTime) return false;
    var p = dueTime.split(':'), d = new Date();
    var now = d.getHours() * 60 + d.getMinutes();
    var due = Number(p[0]) * 60 + Number(p[1]);
    if (dueDay == null) return now > due;
    var today = d.getDay();
    if (today < dueDay) return false;
    if (today === dueDay) return now > due;
    return true;
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

  function rebuildTop() {
    var old = document.querySelector('.top');
    if (old) old.parentNode.removeChild(old);
    buildTop();
  }

  function buildTop() {
    var top = el('div', 'top'), inner = el('div', 'top-in');
    var a = el('a'); a.href = 'index.html';
    var img = new Image(); img.src = 'assets/logo.png';
    img.alt = 'Klever Küche'; a.appendChild(img);
    inner.appendChild(a);
    inner.appendChild(el('div', 'spacer'));

    var tg = el('div', 'langtoggle');
    [['en', 'EN'], ['am', 'አማ']].forEach(function (p) {
      var b = el('button', null, p[1]);
      b.type = 'button';
      b.setAttribute('aria-pressed', lang === p[0] ? 'true' : 'false');
      b.onclick = function () {
        lang = p[0];
        store.set(LANG_KEY, lang);
        location.reload();
      };
      tg.appendChild(b);
    });
    inner.appendChild(tg);

    /* signed in? then the way out is in the bar, on every page */
    if (AUTH.who()) {
      var me = personById(AUTH.who());
      var out = el('button', 'signoutbtn');
      out.type = 'button';
      out.appendChild(el('span', 'soinit', AUTH.isChairman() ? '★' : L(me).charAt(0)));
      out.appendChild(el('span', 'sotext', t('signOut')));
      out.title = AUTH.isChairman() ? 'Chairman' : L(me);
      out.onclick = function () {
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
    tEl.textContent = msg;
    tEl.classList.add('on');
    setTimeout(function () { tEl.classList.remove('on'); }, 1900);
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
    var dow = new Date().getDay();
    return REPORTS.filter(function (r) {
      /* the two monthly reports fall due on the 1st of the following month */
      if (r.cadence === 'monthly') return new Date().getDate() === 1;
      if (r.cadence === 'weekly') return r.dueDay === dow;
      if (dow === 0) return false;
      return !(r.skipDays && r.skipDays.indexOf(dow) >= 0);
    }).sort(function (a, b) { return (a.dueTime || '').localeCompare(b.dueTime || ''); });
  }

  function minsUntil(tm) {
    if (!tm) return null;
    var p = tm.split(':'), d = new Date();
    return Number(p[0]) * 60 + Number(p[1]) - (d.getHours() * 60 + d.getMinutes());
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
    var late = [], soon = null, soonMins = 1e9;
    list.forEach(function (r) {
      var m = minsUntil(r.dueTime);
      if (m < 0) late.push(r);
      else if (m < soonMins) { soonMins = m; soon = r; }
    });
    return { all: list, late: late, next: soon, mins: soon ? soonMins : null };
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
      wrap.appendChild(el('p', 'deck-clear', t('nothingForYou')));
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

    if (st.all.length > 1) {
      var n = st.all.length - 1;
      wrap.appendChild(el('p', 'deck-more',
        n + ' ' + (lang === 'am' ? 'ሌሎች ዛሬ' : (n === 1 ? 'more today' : 'more today'))));
    }
    return wrap;
  }

  /* ---------------- the day as a run of lights ---------------- */

  function timeline(pid) {
    var list = dueToday().filter(function (r) { return !pid || r.person === pid; });
    if (list.length < 2) return null;

    var wrap = el('div', 'tl');
    list.forEach(function (r) {
      var mins = minsUntil(r.dueTime);
      var state = mins < 0 ? 'gone' : (mins <= 120 ? 'soon' : '');
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

      a.appendChild(el('span', 'tls',
        mins < 0 ? t('passed') : countdown(mins).replace(t('inTime') + ' ', '')));
      wrap.appendChild(a);
    });
    return wrap;
  }

  function letterhead(p) {
    var d = new Date(), e = toEthiopian(d);
    var head = el('header', 'lh');

    var mark = el('div', 'lh-mark');
    mark.appendChild(el('span', 'lh-k', 'KLEVER'));
    mark.appendChild(el('span', 'lh-ku', 'KÜCHE'));
    head.appendChild(mark);

    var dt = el('div', 'lh-date');
    dt.appendChild(el('span', null,
      (lang === 'am' ? DAYS_AM : DAYS_EN)[d.getDay()] + ' ' +
      d.getDate() + ' ' + MONTHS_EN[d.getMonth()] + ' ' + d.getFullYear()));
    dt.appendChild(el('span', null,
      ETH_MONTHS[e.m - 1] + ' ' + e.d + ' ቀን ' + e.y + ' ዓ.ም.'));
    head.appendChild(dt);
    return head;
  }

  /* the sentence, built from what is actually true right now */
  function sentence(st) {
    var p = el('p', 'says');
    if (!st.all.length) { p.textContent = t('nothingForYou'); return p; }

    function strong(txt) { var b = el('b', null, txt); return b; }

    if (st.next && st.late.length) {
      p.appendChild(document.createTextNode(t('sayHave') + ' '));
      p.appendChild(strong(t('sayOneDue') + ' ' + countdown(st.mins).replace(t('inTime') + ' ', '')));
      p.appendChild(document.createTextNode(' ' + t('sayAnd') + ' ' +
        (st.late.length === 1 ? t('sayOneLate') : st.late.length + ' ' + t('sayManyLate')) + '.'));
    } else if (st.next) {
      p.appendChild(document.createTextNode(t('sayHave') + ' '));
      p.appendChild(strong(t('sayOneDue') + ' ' + countdown(st.mins).replace(t('inTime') + ' ', '')));
      p.appendChild(document.createTextNode('.'));
    } else {
      p.appendChild(document.createTextNode(t('sayAllIn') + ' '));
      p.appendChild(strong(st.late.length === 1 ? t('sayOneLate') : st.late.length + ' ' + t('sayManyLate')));
      p.appendChild(document.createTextNode('.'));
    }
    return p;
  }

  /* the one number, and the one thing to press */
  function nextUp(st) {
    var box = el('section', 'next');
    var r = st.next || st.late[0];
    if (!r) return box;

    var late = !st.next;
    box.className = 'next' + (late ? ' late' : '');
    box.appendChild(el('p', 'next-k', late ? t('nextOverdue') : t('nextDue')));

    var n = el('p', 'next-n');
    if (late) {
      n.appendChild(document.createTextNode(hhmm(r.dueTime)));
    } else {
      var mins = st.mins, hh = Math.floor(mins / 60), mm = mins % 60;
      if (hh) {
        n.appendChild(document.createTextNode(String(hh)));
        n.appendChild(el('s', null, lang === 'am' ? 'ሰ' : 'h'));
        if (mm) {
          n.appendChild(document.createTextNode(' ' + mm));
          n.appendChild(el('s', null, lang === 'am' ? 'ደ' : 'm'));
        }
      } else {
        n.appendChild(document.createTextNode(String(mm || 0)));
        n.appendChild(el('s', null, lang === 'am' ? 'ደቂቃ' : 'min'));
      }
    }
    box.appendChild(n);

    box.appendChild(el('p', 'next-w', L(r)));
    box.appendChild(el('p', 'next-t',
      hhmm(r.dueTime) + ' · ' + t('to').toLowerCase() + ' ' + (lang === 'am' ? r.toAm : r.toEn)));

    var go = el('a', 'next-go', t('fillItIn'));
    go.href = 'form.html?r=' + encodeURIComponent(r.id);
    box.appendChild(go);
    return box;
  }

  /* the day as a ruled list — time, what, where it stands */
  function dayList(pid) {
    var list = dueToday().filter(function (r) { return !pid || r.person === pid; });
    if (!list.length) return null;
    var wrap = el('div', 'dayl');
    list.forEach(function (r) {
      var mins = minsUntil(r.dueTime);
      var a = el('a', 'dayln' + (mins < 0 ? ' gone' : (mins <= 120 ? ' soon' : '')));
      a.href = 'form.html?r=' + encodeURIComponent(r.id);
      a.appendChild(el('span', 'dtm', hhmm(r.dueTime)));
      var mid = el('span', 'dtx');
      mid.appendChild(el('b', null, L(r)));
      if (!pid) {
        var who = personById(r.person);
        mid.appendChild(el('span', null, who ? L(who) : r.person));
      } else {
        mid.appendChild(el('span', null, t('to').toLowerCase() + ' ' + (lang === 'am' ? r.toAm : r.toEn)));
      }
      a.appendChild(mid);
      a.appendChild(el('span', 'dfl', mins < 0 ? t('passed') : countdown(mins).replace(t('inTime') + ' ', '')));
      wrap.appendChild(a);
    });
    return wrap;
  }

  /* ---------------- sign in ---------------- */

  function signOutLink(root) {
    var a = el('a', 'signout', t('signOut'));
    a.href = '#';
    a.onclick = function (e) {
      e.preventDefault();
      AUTH.signOut().then(function () { location.href = 'index.html'; });
    };
    return a;
  }

  function renderSignIn(root) {
    document.title = t('siteTitle');
    root.innerHTML = '';
    rebuildTop();
    clearInterval(renderIndex.tick);
    root.appendChild(letterhead(null));

    var card = el('section', 'signin');
    card.appendChild(el('h1', null, t('signIn')));
    card.appendChild(el('p', 'sub', t('signInSub')));

    /* Name first, then password. Picking your own name from a list is
       easier on a phone than typing an address, and it means nobody has to
       remember that the account is really betty@klever.local. */
    var lab = el('label', 'codelab', t('chatWho'));
    card.appendChild(lab);

    var sel = document.createElement('select');
    sel.className = 'signfield';
    var optC = el('option', null, lang === 'am' ? 'ሲቀመንበር' : 'Chairman');
    optC.value = AUTH.CHAIR_ID;
    sel.appendChild(optC);
    PEOPLE.forEach(function (p) {
      if (typeof CHAT_ACCOUNTS !== 'undefined' && CHAT_ACCOUNTS.indexOf(p.id) === -1) return;
      var o = el('option', null, L(p) + ' · ' + (lang === 'am' ? p.roleAm : p.roleEn));
      o.value = p.id;
      sel.appendChild(o);
    });
    card.appendChild(sel);

    var lab2 = el('label', 'codelab', t('chatPassword'));
    card.appendChild(lab2);

    var input = document.createElement('input');
    input.type = 'password';
    input.id = 'code';
    input.className = 'signfield';
    input.autocomplete = 'current-password';
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
      AUTH.signIn(sel.value, input.value).then(function () {
        rebuildTop();
        /* on the Chairman's page the next screen belongs to chairman.js, and
           only a reload hands it over cleanly */
        if (document.body.dataset.page === 'chairman') { location.reload(); return; }
        renderIndex(root);
      })['catch'](function (e) {
        /* never say which half was wrong */
        err.textContent = (e && e.message === 'offline')
          ? t('signInOffline') : t('chatBadSignIn');
        err.hidden = false;
        go.disabled = false;
        go.textContent = t('codeGo');
        input.value = '';
        input.focus();
      });
    }
    go.onclick = attempt;
    input.onkeydown = function (e) { if (e.key === 'Enter') attempt(); };
    input.oninput = function () { err.hidden = true; };

    root.appendChild(card);
    root.appendChild(foot());
    input.focus();
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
    wrap.appendChild(el('p', 'eyebrow', t('chatTitle')));

    var a = el('a', 'chan chatcard');
    a.href = 'chat.html';
    a.appendChild(el('span', 'chinit', '✉'));
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
            ? (lang === 'am' ? 'ሰቀመንበር' : 'Chairman')
            : (p ? L(p) : m.who);
          var said = m.text || (m.kind === 'voice' ? t('chatVoice') : t('chatPhoto'));
          line.textContent = name + ': ' + said;
          line.classList.add('lastmsg');
        });
      }
    }
    return wrap;
  }

  function renderIndex(root) {
    if (!AUTH.who()) return renderSignIn(root);
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
    root.appendChild(deck(null, st));

    var tl = timeline(null);
    if (tl) {
      root.appendChild(el('p', 'eyebrow', t('dueToday')));
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
      var n = due.filter(function (r) { return r.person === p.id; }).length;
      if (n) b.appendChild(el('span', 'count', n + ' ' + t('reportsDue')));
      b.appendChild(el('span', 'arrow', '\u2192'));
      b.onclick = function () { renderPersonReports(root, p); };
      return b;
    }

    var owing = PEOPLE.filter(function (p) {
      return due.some(function (r) { return r.person === p.id; });
    });
    var rest = PEOPLE.filter(function (p) { return owing.indexOf(p) === -1; });

    if (owing.length) {
      root.appendChild(el('p', 'eyebrow', t('whoReports')));
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
    ov.appendChild(el('span', 'chinit', '▣'));
    var ow = el('span', 'who');
    ow.appendChild(el('span', 'nm', t('chOverview')));
    ow.appendChild(el('span', 'rl', t('chAnalysis')));
    ov.appendChild(ow);
    ov.appendChild(el('span', 'arrow', '→'));
    root.appendChild(el('p', 'eyebrow', t('chRaw')));
    root.appendChild(ov);

    root.appendChild(chatCard());

    /* the design sketches, reachable from the one address rather than living
       at links of their own. Chairman only — nobody else needs to see a
       half-finished idea of the thing they use every day. */
    var dz = el('a', 'designlink', t('designPreview'));
    dz.href = 'preview.html';
    root.appendChild(dz);

    root.appendChild(foot());

    /* keep the countdowns honest without reloading the page */
    clearInterval(renderIndex.tick);
    renderIndex.tick = setInterval(function () {
      if (document.querySelector('.due')) renderIndex(root);
    }, 60000);
  }

  function renderPersonReports(root, p) {
    document.title = t('siteTitle');
    root.innerHTML = '';
    if (AUTH.isChairman()) {
      var back = el('a', 'backlink', t('back'));
      back.href = '#';
      back.onclick = function (e) { e.preventDefault(); renderIndex(root); };
      root.appendChild(back);
    }

    var st = standing(p.id);
    root.appendChild(deck(p, st));

    var tl = timeline(p.id);
    if (tl) {
      root.appendChild(el('p', 'eyebrow', t('dueForYou')));
      root.appendChild(tl);
    }

    var rs = reportsFor(p.id);
    if (!rs.length) {
      root.appendChild(chatCard());
      root.appendChild(foot());
      return;
    }

    root.appendChild(el('p', 'eyebrow', t('yourReports')));
    var list = el('div', 'reports');
    rs.forEach(function (r) {
      var a = el('a', 'report');
      a.href = 'form.html?r=' + encodeURIComponent(r.id);
      a.appendChild(el('span', 'rt', L(r)));
      var meta = el('div', 'meta');
      meta.appendChild(el('span', 'due', t('due') + ' · ' + (lang === 'am' ? r.dueAm : r.dueEn)));
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

    draftKey = 'klever.draft.' + report.id + '.' + stamp();
    try { values = JSON.parse(store.get(draftKey) || '{}'); } catch (e) { values = {}; }

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

    var meta = el('div', 'fmeta');
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

    var lateNow = isLate(report.dueTime, report.dueDay);
    var stat = el('div', 'fstat' + (lateNow ? ' late' : ''));
    stat.appendChild(el('span', 'fsp', lateNow ? t('late') : t('onTime')));
    stat.appendChild(el('span', 'fsc', today() + ' · ' + clock()));
    head.appendChild(stat);

    /* the penalty is the reason the deadline matters, so it is not a footnote */
    if (report.penEn) head.appendChild(el('div', 'penalty', lang === 'am' ? report.penAm : report.penEn));
    if (report.derived) head.appendChild(el('div', 'penalty soft', t('derived')));
    root.appendChild(head);

    var prog = el('div', 'progress'); prog.appendChild(el('i'));
    root.appendChild(prog);

    /* sections */
    report.sections.forEach(function (sec) {
      var fs = el('fieldset');
      var lg = el('legend', null, L(sec));
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
  }

  function shortDate(d) {
    var m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return d.getDate() + ' ' + m[d.getMonth()];
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
          rm.title = 'remove';
          rm.onclick = function () { data.splice(i, 1); draw(); refresh(); };
          head.appendChild(rm);
        }
        card.appendChild(head);

        f.cols.forEach(function (c) {
          var cell = el('div', 'cell');
          cell.appendChild(el('label', null, L(c)));
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
            inp.type = (c.t === 'num' || c.t === 'money') ? 'number' : 'text';
            if (inp.type === 'number') inp.inputMode = 'decimal';
          }
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
    lab.htmlFor = 'f_' + f.id;
    row.appendChild(lab);

    if (f.t === 'ratio') {
      var wrap = el('div', 'ratio');
      wrap.appendChild(numInput(f.id + '__a', f));
      wrap.appendChild(el('span', 'of', '/'));
      wrap.appendChild(numInput(f.id + '__b', f));
      row.appendChild(wrap);
    } else if (f.t === 'yesno') {
      var seg = el('div', 'seg');
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
    i.type = 'number';
    i.inputMode = 'decimal';
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
    var st = el('dd', 'pd-status' + (isLate(report.dueTime, report.dueDay) ? ' late' : ''));
    st.textContent = isLate(report.dueTime, report.dueDay) ? t('late') : t('onTime');
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
    var count = el('div', 'count'); count.id = 'count';
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
    /* WhatsApp is still here for the customer-facing habit, but it is no
       longer what Send means. */
    var wa = el('button', 'btn ghost', t('whatsapp'));
    wa.type = 'button';
    wa.onclick = function () {
      window.open('https://wa.me/?text=' + encodeURIComponent(buildMessage()), '_blank');
    };

    var send = el('button', 'btn', t('send'));
    send.type = 'button'; send.id = 'send';
    send.onclick = function () {
      var txt = buildMessage();

      /* Two homes, on purpose. The Sheet is the Chairman's window on the day
         and it drives the emails; Firestore is the copy that is signed in and
         cannot be forged, which is the one the penalty ledger will answer for. */
      if (window.FB && window.FB.live() && AUTH.who()) {
        window.FB.fileReport({
          person: report.person,
          report: report.id,
          late: isLate(report.dueTime, report.dueDay),
          due: lang === 'am' ? report.dueAm : report.dueEn,
          values: values,
          flags: reportFlags(),
          text: txt,
          lang: lang
        })['catch'](function () { /* the cache will retry; the Sheet still has it */ });
      }

      ARCHIVE.file({
        at: new Date().toISOString(),
        person: report.person,
        personName: L(personById(report.person)),
        report: report.id,
        reportName: L(report),
        by: AUTH.who(),
        byName: AUTH.isChairman() ? 'Chairman' : L(personById(AUTH.who())),
        to: lang === 'am' ? report.toAm : report.toEn,
        roleName: lang === 'am' ? personById(report.person).roleAm : personById(report.person).roleEn,
        due: lang === 'am' ? report.dueAm : report.dueEn,
        doc: reportDoc(),
        flags: reportFlags(),
        late: isLate(report.dueTime, report.dueDay),
        values: values,
        text: txt
      });
      /* Deliver it. Filing it is the record; this is the part that puts it
         in front of the person who has to act on it. */
      var chan = channelFor(report, AUTH.isChairman() ? 'chairman' : AUTH.who());
      var names = lang === 'am' ? report.toAm : report.toEn;
      if (window.FB && window.FB.live() && chan) {
        send.disabled = true;
        send.textContent = t('sending');
        window.FB.deliverReport(chan, txt).then(function () {
          toast(t('sentTo').replace('{who}', names));
          send.textContent = t('sentDone');
        })['catch'](function () {
          send.disabled = false;
          send.textContent = t('send');
          toast(t('sendNotDelivered'));
        });
      } else {
        toast(t('sendNotDelivered'));
      }
    };
    inner.appendChild(count); inner.appendChild(pdf); inner.appendChild(copy);
    inner.appendChild(wa); inner.appendChild(send);
    bar.appendChild(inner);
    document.body.appendChild(bar);
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

  function targetMiss(f) {
    if (f.t === 'table' || f.t === 'grid') return false;
    if (!f.tgt || !has(values[f.id])) return false;
    var v = Number(values[f.id]);
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
          h.className = 'hint' + (miss ? ' bad' : (has(values[f.id]) ? ' good' : ''));
          h.textContent = (lang === 'am' ? f.tgt.am : f.tgt.en) +
            (miss ? ' — ' + (f.tgt.op === 'gte' ? t('below') : t('above')) : '');
        }
      }
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
    if (send) send.disabled = missing > 0;

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
    if (c.t === 'money') return money(v) + ' Birr';
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
    if (f.t === 'money') return money(v) + ' Birr';
    if (f.t === 'pct') return v + '%';
    return String(v).trim();
  }

  function buildMessage() {
    var person = personById(report.person);
    var out = [];
    out.push('*' + L(report).toUpperCase() + '*');
    out.push(L(person) + ' · ' + (lang === 'am' ? person.roleAm : person.roleEn));
    out.push(today() + ' · ' + clock() + ' · ' + (isLate(report.dueTime, report.dueDay) ? t('late') : t('onTime')));

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
    fill: function (v) { Object.keys(v).forEach(function (k) { values[k] = v[k]; }); refresh(); }
  };

  /* Yesterday's drafts, swept once a day. Without this a phone accumulates one
     key per report per day forever, and the quota error when it fills is
     swallowed by store.set and by the offline outbox both. */
  function sweepDrafts(keepStamp) {
    try {
      var kill = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('klever.draft.') === 0 && k.slice(-10) !== keepStamp) kill.push(k);
      }
      kill.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) { /* a full or blocked store is not worth taking the page down for */ }
  }

  document.addEventListener('DOMContentLoaded', function () {
    /* save.js is not loaded on every page — the Chairman's page has no forms
       to file, so it has no outbox to flush. Guard rather than assume. */
    if (typeof ARCHIVE !== 'undefined') ARCHIVE.flush();
    sweepDrafts(stamp());
    var root = document.getElementById('app');
    if (!root) return;

    /* The header goes up first, always. It used to be drawn inside the promise
       below, which meant that if Firebase never answered — no signal, a blocked
       CDN, a wedged cache — the person got a blank white page with nothing on
       it at all, not even a logo. Nothing that is not waiting on an answer
       should wait for one. */
    buildTop();
    root.appendChild(el('p', 'booting', t('connecting')));

    /* Who is signed in is Firebase's answer and it takes a moment. But a
       promise that can hang forever must not be the only thing standing
       between a person and a usable page, so it races a clock: after four
       seconds we carry on as signed-out, which shows the sign-in card rather
       than nothing. A late answer is still honoured — FB.on() re-renders. */
    var settled = window.FB ? window.FB.ready : Promise.resolve(null);
    var raced = Promise.race([
      settled,
      new Promise(function (resolve) { setTimeout(function () { resolve(null); }, 4000); })
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
        location.reload();
      });
    }

    raced.then(function (id) {
      AUTH._adopt(id);
      settledOnce = true;
      var b = root.querySelector('.booting');
      if (b) b.parentNode.removeChild(b);
      if (!AUTH.who()) { renderSignIn(root); return; }
      /* chairman.js owns #app on its own page. app.js is still loaded there
         for buildTop, renderSignIn and the shared helpers, and must draw
         nothing itself or the two race each other for the same node. */
      if (document.body.dataset.page === 'chairman') return;
      if (document.body.dataset.page === 'form') renderForm(root);
      else renderIndex(root);
    });
  });
})();
