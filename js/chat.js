/* Klever chat — channels, live messages, no server of ours.

   WHY FIREBASE AND NOT THE APPS SCRIPT WE ALREADY HAVE
   The sheet endpoint is fine for reports: a phone posts once and walks away.
   Chat needs the opposite — every phone asking "anything new?" over and over.
   Twenty-five phones polling every thirty seconds is about 24,000 calls a day
   against a script runtime quota of ninety minutes. It runs out before lunch.
   Firestore pushes instead of being asked, so a quiet channel costs nothing.

   WHAT PROTECTS THIS
   Firebase Authentication, and firestore.rules. Not this file, and not the
   config in firebase-config.js — both of those ship to anyone who looks. A
   person signs in with an account the Chairman made; the rules then decide,
   per channel, whether that account may read it and write to it.

   MESSAGES ARE APPEND-ONLY
   No edit, no delete, by rule and not merely by the absence of a button. This
   is a company record that the penalty ledger reads. A conversation somebody
   can quietly revise afterwards is not a record.

   WHAT A CHANNEL COSTS TO OPEN
   The free plan allows 50,000 document reads a day for the whole company, and
   a photo or a voice note is one document like any other. So a channel opens
   on its newest thirty messages and no more; older ones are fetched thirty at
   a time, only when somebody taps "Load earlier".                           */

import { initializeApp }
  from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, setDoc, addDoc, query, orderBy, limit, startAfter,
  onSnapshot, getDocs, serverTimestamp, terminate, clearIndexedDbPersistence
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { shrinkImage, record, canRecord, clockOf, MAX_SECONDS } from './media.js?v=53c8b262';

(function () {
  'use strict';

  var LANG_KEY = 'klever.lang';
  var DRAFT_KEY = 'klever.chat.draft.';   /* + channel id, sessionStorage */
  var SEEN_KEY = 'klever.chat.seen.';     /* + person id, localStorage */
  var PAGE = 30;                          /* messages per channel opening */
  var MAX_TEXT = 4000;                    /* the rules refuse longer */
  var COUNT_FROM = 3500;                  /* show the counter from here */

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var session = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { sessionStorage.removeItem(k); } catch (e) {} }
  };

  var urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang === 'am' || urlLang === 'en') store.set(LANG_KEY, urlLang);
  var lang = (urlLang === 'am' || urlLang === 'en' ? urlLang
              : store.get(LANG_KEY)) === 'am' ? 'am' : 'en';

  /* a word not yet in i18n.js shows in English, and failing that as its
     key — never as "undefined" on somebody's screen */
  function t(k) {
    var s = T[lang][k];
    if (s == null) s = T.en[k];
    return s == null ? k : s;
  }
  function L(o) { return (lang === 'am' && o.am) ? o.am : o.en; }
  function D(o) { return lang === 'am' ? o.descAm : o.descEn; }
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
  function nameOf(id) {
    if (id === CHAIRMAN) return lang === 'am' ? 'ሊቀመንበር' : 'Chairman';
    var p = personById(id);
    return p ? L(p) : String(id || '');
  }
  function initialOf(id) {
    return id === CHAIRMAN ? '★' : nameOf(id).charAt(0);
  }

  /* only a picture or a sound carried inside the message itself goes into a
     src — never an address, which would tell somebody's server who read the
     channel and when */
  function isImageData(s) { return typeof s === 'string' && s.indexOf('data:image/') === 0; }
  function isAudioData(s) { return typeof s === 'string' && s.indexOf('data:audio/') === 0; }

  function msOf(ts) { return ts && typeof ts.toMillis === 'function' ? ts.toMillis() : 0; }

  /* ---------------- connection ---------------- */

  var app = null, auth = null, db = null;

  function configured() {
    return !!(FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);
  }

  function connect() {
    if (app) return;
    app = initializeApp(FIREBASE_CONFIG);
    auth = getAuth(app);
    /* the cache is what makes this usable on a site with no signal: messages
       already seen are on the phone, and a message written offline goes out
       when the phone finds the network again */
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  }

  /* the signed-in person's Klever id, taken from the account they signed in
     with — betty@klever.local is betty. Firebase owns this, not us. */
  var me = null;
  function idFromUser(user) {
    if (!user || !user.email) return null;
    return user.email.split('@')[0].toLowerCase();
  }

  /* ---------------- what is on screen ---------------- */

  var root = null;
  var view = null;          /* 'signin' | 'list' | 'thread' */
  var openId = null;        /* the channel on screen, or null */
  var listStops = [];       /* listeners and tidy-ups for the current screen */
  var recHook = null;       /* cancels a live voice recording, if there is one */
  var draftOf = null;       /* the open channel's unsent text */
  var threadWaiting = 0;    /* messages in the open channel not yet sent */
  var inFlight = 0;         /* messages written this visit, not yet confirmed */
  var leaving = false;      /* signing out; nothing more should draw */

  function clear() { root.innerHTML = ''; }

  /* Everything a screen started is stopped when it is left: listeners, the
     microphone, the picture viewer, the sign-out question. A microphone left
     running behind the channel list is the worst of these — the phone shows
     it is recording and the person has no way to stop it. */
  function stopAll() {
    listStops.forEach(function (fn) { try { fn(); } catch (e) {} });
    listStops = [];
    if (recHook) { try { recHook(); } catch (e) {} }
    recHook = null;
    draftOf = null;
    openId = null;
    threadWaiting = 0;
    closeViewer();
    viewerPushed = false;
    closeSheet();
    if (root) root.style.paddingBottom = '';
  }

  /* ---------------- chrome ---------------- */

  function buildTop() {
    var old = document.querySelector('.top');
    if (old) old.parentNode.removeChild(old);

    var top = el('div', 'top'), inner = el('div', 'top-in');
    var a = el('a'); a.href = 'index.html';
    var img = new Image(); img.src = 'assets/logo.png';
    img.alt = 'Klever Küche'; a.appendChild(img);
    inner.appendChild(a);
    inner.appendChild(el('div', 'spacer'));

    /* the same two buttons the reports side has: the Chairman's page, and
       this one, marked as where you are */
    if (me) {
      var navs = [['chat.html', 'M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 17H10l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z', t('chatOpen'), true]];
      if (me === CHAIRMAN) navs.unshift(['chairman.html', 'M3 12.5h4l2.5-6 5 12 2.5-6h4', t('chOverview'), false]);
      navs.forEach(function (n) {
        var a2 = el('a', 'navbtn' + (n[3] ? ' on' : ''));
        a2.href = n[0];
        a2.title = n[2];
        a2.setAttribute('aria-label', n[2]);
        var NS = 'http://www.w3.org/2000/svg';
        var s = document.createElementNS(NS, 'svg');
        [['viewBox', '0 0 24 24'], ['fill', 'none'], ['stroke', 'currentColor'], ['stroke-width', '1.7'],
         ['stroke-linecap', 'round'], ['stroke-linejoin', 'round'], ['aria-hidden', 'true']]
          .forEach(function (kv) { s.setAttribute(kv[0], kv[1]); });
        var pth = document.createElementNS(NS, 'path');
        pth.setAttribute('d', n[1]);
        s.appendChild(pth);
        a2.appendChild(s);
        inner.appendChild(a2);
      });
    }

    var tg = el('div', 'langtoggle');
    [['en', 'EN'], ['am', 'አማ']].forEach(function (p) {
      var b = el('button', null, p[1]);
      b.type = 'button';
      b.setAttribute('aria-pressed', lang === p[0] ? 'true' : 'false');
      b.onclick = function () { switchLang(p[0]); };
      tg.appendChild(b);
    });
    inner.appendChild(tg);

    if (me) {
      var out = el('button', 'signoutbtn');
      out.type = 'button';
      out.appendChild(el('span', 'soinit', initialOf(me)));
      out.appendChild(el('span', 'sotext', t('signOut')));
      out.title = nameOf(me);
      out.setAttribute('aria-label', t('signOut') + ' — ' + nameOf(me));
      out.setAttribute('aria-haspopup', 'dialog');
      out.onclick = askSignOut;
      inner.appendChild(out);
    }

    top.appendChild(inner);
    document.body.insertBefore(top, document.body.firstChild);
    document.documentElement.lang = lang === 'am' ? 'am' : 'en';
  }

  /* The page reloads to change language, so whatever was half-written goes
     into this tab's session first and comes back when the channel reopens.
     A ?lang= left in the address would otherwise win over the button on the
     reload and put the page straight back in the old language. */
  function switchLang(to) {
    if (to === lang) return;
    lang = to;
    store.set(LANG_KEY, lang);
    if (draftOf) {
      var d = draftOf();
      if (d.text.trim()) session.set(DRAFT_KEY + d.c, d.text);
    }
    if (recHook) { try { recHook(); } catch (e) {} }
    try {
      var u = new URL(location.href);
      u.searchParams['delete']('lang');
      history.replaceState(history.state, '', u.pathname + u.search + u.hash);
    } catch (e) {}
    location.reload();
  }

  function dropDrafts() {
    try {
      for (var i = sessionStorage.length - 1; i >= 0; i--) {
        var k = sessionStorage.key(i);
        if (k && k.indexOf(DRAFT_KEY) === 0) sessionStorage.removeItem(k);
      }
    } catch (e) {}
  }

  function toast(msg) {
    var e = document.querySelector('.toast');
    if (!e) { e = el('div', 'toast'); document.body.appendChild(e); }
    e.textContent = msg;
    e.classList.add('on');
    setTimeout(function () { e.classList.remove('on'); }, 2600);
  }

  function sendError(e) {
    var code = e && e.code;
    /* the server said no — the connection was fine, so do not blame it */
    if (code === 'permission-denied') return t('chatRejected');
    if (code === 'resource-exhausted') return t('chatQuota');
    return t('chatSendFailed');
  }
  function loadError(e) {
    var code = e && e.code;
    if (code === 'permission-denied') return t('chatNoAccess');
    if (code === 'resource-exhausted') return t('chatQuota');
    return t('chatLoadFailed');
  }

  /* ---------------- signing out ---------------- */

  /* One tap on the corner of the screen should not end the session — and
     on a phone where messages are still waiting for signal, signing out
     throws them away, so it says so first. */
  function closeSheet() {
    var s = document.querySelector('.chat-sheet');
    if (s && s.parentNode) s.parentNode.removeChild(s);
  }

  function askSignOut() {
    if (leaving) return;
    if (document.querySelector('.chat-sheet')) { closeSheet(); return; }
    var n = Math.max(inFlight, threadWaiting);
    var sheet = el('div', 'chat-sheet');
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-label', t('signOut'));
    sheet.appendChild(el('p', null, t('chatSignOutAsk')));
    if (n) sheet.appendChild(el('p', 'chat-warn', t('chatSignOutPending').replace('{n}', n)));
    var row = el('div', 'chat-sheet-row');
    var no = el('button', 'chat-pill', t('chatCancel'));
    no.type = 'button';
    no.onclick = closeSheet;
    var yes = el('button', 'chat-pill chat-pill-bad', t('signOut'));
    yes.type = 'button';
    yes.onclick = function () {
      yes.disabled = true;
      no.disabled = true;
      leave();
    };
    row.appendChild(no);
    row.appendChild(yes);
    sheet.appendChild(row);
    document.body.appendChild(sheet);
    no.focus();
  }

  /* A phone is often shared on site. Signing out has to take the messages
     with it — the offline cache holds every channel this person opened, and
     the next person to pick the phone up should not be able to read them. */
  function leave() {
    leaving = true;
    stopAll();
    dropDrafts();
    clear();
    root.appendChild(el('p', 'codenote', t('chatSigningOut')));
    function done() {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
      location.reload();
    }
    signOut(auth).then(function () {
      return terminate(db).then(function () { return clearIndexedDbPersistence(db); });
    })['catch'](function () {
      /* the cache cannot be cleared while another tab of this site still
         has it open; the account is signed out regardless, and the reload
         below starts clean */
    }).then(done);
  }

  /* ---------------- screens ---------------- */

  /* config not filled in yet — say so plainly rather than throwing */
  function renderUnconfigured() {
    clear(); buildTop();
    root.appendChild(el('h1', null, t('chatTitle')));
    var box = el('div', 'signin');
    box.appendChild(el('p', null, t('chatNoConfig')));
    var code = el('code', 'codepath', 'js/firebase-config.js');
    box.appendChild(code);
    root.appendChild(box);
  }

  function renderSignIn() {
    view = 'signin';
    clear(); buildTop();
    root.appendChild(el('h1', null, t('chatTitle')));
    root.appendChild(el('p', 'sub', t('chatSignInSub')));

    var form = el('form', 'signin');

    /* the password alone — the site works out whose it is (AUTH.whoIs) */
    var wrapPw = el('label', 'chatfield');
    wrapPw.appendChild(el('span', 'codelab', t('chatPassword')));
    var pw = el('input');
    pw.type = 'password';
    pw.autocomplete = 'current-password';
    pw.setAttribute('autocapitalize', 'none');
    pw.setAttribute('autocorrect', 'off');
    pw.spellcheck = false;
    wrapPw.appendChild(pw);
    form.appendChild(wrapPw);

    var err = el('p', 'codeerr');
    err.setAttribute('role', 'alert');
    err.hidden = true;
    form.appendChild(err);

    var go = el('button', 'codego', t('chatSignIn'));
    go.type = 'submit';
    form.appendChild(go);

    /* no signal, or Firebase has paused sign-ins from this phone: neither
       says anything about the password */
    function notTheirFault(e) {
      var code = e && e.code;
      return code === 'auth/network-request-failed' || code === 'auth/too-many-requests';
    }

    form.onsubmit = function (ev) {
      ev.preventDefault();
      err.hidden = true;
      go.disabled = true;
      go.textContent = t('chatSigningIn');
      AUTH.whoIs(pw.value).then(function (cands) {
        if (!cands.length) throw new Error('unknown');
        var i = 0;
        function next() {
          return signInWithEmailAndPassword(auth, cands[i].id + '@' + KLEVER_DOMAIN, cands[i].pw)
            ['catch'](function (e) {
              /* trying the next name would fail the same way, and each try
                 counts towards Firebase's lock-out */
              if (notTheirFault(e)) throw e;
              i++;
              if (i < cands.length) return next();
              throw e;
            });
        }
        return next();
      })
        ['catch'](function (e) {
          var code = e && e.code;
          /* never say which half was wrong */
          err.textContent = code === 'auth/network-request-failed' ? t('chatNoNet')
                          : code === 'auth/too-many-requests' ? t('chatTooManyTries')
                          : t('chatBadSignIn');
          err.hidden = false;
          go.disabled = false;
          go.textContent = t('chatSignIn');
          /* a password that never reached the server was not wrong — keep it
             so the person only has to press the button again */
          if (!notTheirFault(e)) pw.value = '';
          pw.focus();
        });
    };

    root.appendChild(form);
    root.appendChild(el('p', 'codenote', t('chatNoAccount')));
  }

  /* ---------------- where we are, in the address ---------------- */

  /* The open channel lives in the address as #c=<id>. That is what lets the
     phone's back gesture close a channel instead of leaving chat, and what
     brings the same channel back after a reload. */
  function hashChannel() {
    var m = /^#c=([A-Za-z0-9_-]{1,80})$/.exec(location.hash || '');
    return m ? m[1] : null;
  }
  function findMine(id) {
    var mine = CHANNELS.forPerson(me);
    for (var i = 0; i < mine.length; i++) if (mine[i].id === id) return mine[i];
    return null;
  }
  function baseUrl() { return location.pathname + location.search; }

  function openThread(ch) {
    try { history.pushState({ c: ch.id }, '', '#c=' + ch.id); } catch (e) {}
    renderThread(ch);
  }

  /* the in-page Back does what the phone's back does, so the two never
     disagree about where "back" is */
  function leaveThread() {
    if (history.state && history.state.c && !history.state.v) { history.back(); return; }
    try { history.replaceState(null, '', baseUrl()); } catch (e) {}
    renderChannels();
  }

  var booted = false;
  function route() {
    var id = hashChannel();
    var ch = id ? findMine(id) : null;
    if (!ch) {
      if (id) { try { history.replaceState(null, '', baseUrl()); } catch (e) {} }
      booted = true;
      renderChannels();
      return;
    }
    /* arriving straight into a channel from a link: put the list behind it
       in the history, so that back lands on the list rather than leaving.
       A reload keeps its history, so it needs nothing. */
    if (!booted && !(history.state && history.state.c === ch.id)) {
      try {
        history.replaceState(null, '', baseUrl());
        history.pushState({ c: ch.id }, '', '#c=' + ch.id);
      } catch (e) {}
    }
    booted = true;
    renderThread(ch);
  }

  window.addEventListener('popstate', function () {
    if (!me || leaving) return;
    var id = hashChannel();
    if (viewer) {
      /* back closes the picture first, and only the picture */
      viewerPushed = false;
      closeViewer();
      if (id === openId) return;
    }
    if (id && id === openId) return;
    var ch = id ? findMine(id) : null;
    if (ch) renderThread(ch);
    else if (view !== 'list') renderChannels();
  });

  /* the page going away — closed, reloaded, or swapped for another app —
     must not leave the microphone on */
  window.addEventListener('pagehide', function () {
    if (recHook) { try { recHook(); } catch (e) {} }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (viewer) { e.preventDefault(); dismissViewer(); }
    else if (document.querySelector('.chat-sheet')) closeSheet();
  });

  /* ---------------- read and unread ---------------- */

  /* When each channel was last read on this phone, per person. Only the
     time of the newest message seen is kept — nothing anybody wrote. */
  function seenMap() {
    var s = null;
    try { s = JSON.parse(store.get(SEEN_KEY + me) || 'null'); } catch (e) { s = null; }
    if (!s || typeof s !== 'object') {
      /* the first time on this phone, what is already there counts as read —
         otherwise every channel would light up at once */
      s = { _since: Date.now() };
      store.set(SEEN_KEY + me, JSON.stringify(s));
    }
    return s;
  }
  function seenOf(s, cid) { return Math.max(s[cid] || 0, s._since || 0); }
  function markSeen(cid, ms) {
    if (!ms || !me) return;
    var s = seenMap();
    if (ms > (s[cid] || 0)) {
      s[cid] = ms;
      store.set(SEEN_KEY + me, JSON.stringify(s));
    }
  }

  /* the one line under a channel's name. A photo or a voice note has no text
     of its own, so it is named instead of showing "Betty: " and nothing. */
  function previewOf(m) {
    var s = typeof m.text === 'string' ? m.text : '';
    s = s.replace(/^\*([^*\n]+)\*[ \t]*$/gm, '$1').replace(/\s+/g, ' ').trim();
    if (m.kind === 'image') return s ? t('chatPhoto') + ' · ' + s : t('chatPhoto');
    if (m.kind === 'voice') return s ? t('chatVoice') + ' · ' + s : t('chatVoice');
    return s;
  }

  /* Put these nodes in this order inside parent, moving only what is out of
     place. A node already where it belongs is not touched — which is what
     keeps a voice note playing while a new message arrives below it. */
  function place(parent, nodes) {
    var cur = parent.firstChild;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n === cur) { cur = cur.nextSibling; continue; }
      parent.insertBefore(n, cur);
    }
    while (cur) {
      var nx = cur.nextSibling;
      parent.removeChild(cur);
      cur = nx;
    }
  }

  /* ---------------- channel list ---------------- */

  function renderChannels() {
    stopAll();
    view = 'list';
    clear(); buildTop();

    /* the same masthead the reports and the forms open with */
    var lh = el('header', 'lh');
    var mk = el('div', 'lh-mark');
    mk.appendChild(el('span', 'lh-k', 'KLEVER'));
    mk.appendChild(el('span', 'lh-ku', 'KÜCHE'));
    lh.appendChild(mk);
    var dd = new Date();
    var dt = el('div', 'lh-date');
    dt.appendChild(el('span', null, nameOf(me)));
    dt.appendChild(el('span', null,
      ('0' + dd.getHours()).slice(-2) + ':' + ('0' + dd.getMinutes()).slice(-2)));
    lh.appendChild(dt);
    root.appendChild(lh);

    var sal = el('div', 'sal');
    sal.appendChild(el('h1', null, t('chatTitle')));
    sal.appendChild(el('p', null, t('chatPickSub')));
    root.appendChild(sal);

    var mine = CHANNELS.forPerson(me);

    if (me === CHAIRMAN) root.appendChild(seedButton());

    var wrapTeam = el('div', 'chanlist');
    var wrapDirect = el('div', 'chanlist');
    var teamRows = [], directRows = [];
    var seen = seenMap();

    /* busiest first: the channel somebody just wrote in rises to the top,
       and channels nobody has written in keep the order channels.js gives */
    function resort(box, rows) {
      var sorted = rows.slice().sort(function (a, b) { return (b.at - a.at) || (a.idx - b.idx); });
      place(box, sorted.map(function (r) { return r.card; }));
    }

    mine.forEach(function (ch, idx) {
      var card = el('button', 'chan');
      card.type = 'button';
      card.appendChild(el('span', 'chinit', ch.kind === 'direct' ? '✉' : '#'));
      var who = el('span', 'who');
      who.appendChild(el('span', 'nm', L(ch)));
      var last = el('span', 'rl', D(ch));
      who.appendChild(last);
      card.appendChild(who);
      var dot = el('span', 'chat-dot');
      dot.setAttribute('role', 'img');
      dot.setAttribute('aria-label', t('chatUnread'));
      dot.hidden = true;
      card.appendChild(dot);
      card.appendChild(el('span', 'arrow', '→'));
      card.onclick = function () { openThread(ch); };

      var direct = ch.kind === 'direct';
      var box = direct ? wrapDirect : wrapTeam;
      var rows = direct ? directRows : teamRows;
      var row = { card: card, idx: idx, at: 0 };
      rows.push(row);
      box.appendChild(card);

      /* one live listener per channel, just for the latest line — one read
         each, whatever the latest line carries */
      var q = query(collection(db, 'channels', ch.id, 'messages'),
                    orderBy('at', 'desc'), limit(1));
      listStops.push(onSnapshot(q, function (snap) {
        if (snap.empty) return;
        var d = snap.docs[0];
        var m = d.data({ serverTimestamps: 'estimate' });
        last.textContent = nameOf(m.who) + ': ' + previewOf(m);
        last.classList.add('lastmsg');
        row.at = msOf(m.at);
        var unread = m.who !== me && !d.metadata.hasPendingWrites && row.at > seenOf(seen, ch.id);
        dot.hidden = !unread;
        card.classList.toggle('chat-unread', unread);
        resort(box, rows);
      }, function () { /* a channel we cannot read is simply left as it is */ }));
    });

    root.appendChild(el('div', 'eyebrow', t('chatChannels')));
    root.appendChild(wrapTeam);
    if (wrapDirect.childNodes.length) {
      root.appendChild(el('div', 'eyebrow', t('chatDirect')));
      root.appendChild(wrapDirect);
    }
    root.appendChild(el('p', 'codenote', t('chatKept')));
  }

  /* The Chairman writes the channel documents once. Membership lives in
     channels.js; this copies it into Firestore, where the rules can read it.
     Safe to press again after changing a channel — it overwrites, and the
     messages inside are untouched. */
  function seedButton() {
    var b = el('button', 'seed', t('chatSeed'));
    b.type = 'button';
    b.onclick = function () {
      b.disabled = true;
      var defs = CHANNELS.all();
      Promise.all(defs.map(function (ch) {
        return setDoc(doc(db, 'channels', ch.id), {
          en: ch.en, am: ch.am, kind: ch.kind, members: ch.members
        }, { merge: true });
      })).then(function () {
        toast(t('chatSeeded').replace('{n}', defs.length));
        b.disabled = false;
      })['catch'](function (e) {
        toast(String(e && e.code || e));
        b.disabled = false;
      });
    };
    return b;
  }

  /* ---------------- the picture viewer ---------------- */

  /* A photo opens here, over the channel, rather than in a new tab: Chrome on
     Android will not open a data: address in a tab and shows a blank page. */
  var viewer = null, viewerFrom = null, viewerPushed = false, viewerOverflow = '';

  function openViewer(src, alt, from) {
    if (!isImageData(src)) return;
    closeViewer();
    var ov = el('div', 'chat-viewer');
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', alt || t('chatPhoto'));
    var im = new Image();
    im.className = 'chat-viewer-img';
    im.alt = alt || t('chatPhoto');
    im.src = src;
    var x = el('button', 'chat-viewer-x', '×');
    x.type = 'button';
    x.setAttribute('aria-label', t('chatClose'));
    x.onclick = function (e) { e.stopPropagation(); dismissViewer(); };
    /* a tap beside the picture closes it; a tap on it does not, so it can
       be pinched and looked at */
    ov.onclick = function (e) { if (e.target !== im) dismissViewer(); };
    ov.appendChild(im);
    ov.appendChild(x);
    document.body.appendChild(ov);
    viewer = ov;
    viewerFrom = from || null;
    viewerOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    /* one history step for the picture, so the back gesture closes it
       instead of closing the channel underneath */
    try {
      history.pushState({ c: openId, v: 1 }, '', location.href);
      viewerPushed = true;
    } catch (e) { viewerPushed = false; }
    x.focus();
  }

  function closeViewer() {
    if (!viewer) return;
    if (viewer.parentNode) viewer.parentNode.removeChild(viewer);
    viewer = null;
    document.body.style.overflow = viewerOverflow || '';
    var from = viewerFrom;
    viewerFrom = null;
    if (from && from.isConnected && from.focus) {
      try { from.focus({ preventScroll: true }); } catch (e) {}
    }
  }

  /* closed from the page — the button, a tap, Escape — so take back the
     history step it added */
  function dismissViewer() {
    var pushed = viewerPushed;
    viewerPushed = false;
    closeViewer();
    if (pushed && history.state && history.state.v) history.back();
  }

  function photo(m) {
    var fig = el('a', 'msgimg');
    fig.setAttribute('role', 'button');
    fig.tabIndex = 0;
    var im = new Image();
    im.src = m.media;
    im.alt = (typeof m.text === 'string' && m.text) || t('chatPhoto');
    im.loading = 'lazy';
    im.decoding = 'async';
    if (typeof m.w === 'number' && typeof m.h === 'number' && m.w > 0 && m.h > 0) {
      im.width = m.w; im.height = m.h;
    }
    fig.appendChild(im);
    /* the picture is read back from the element when tapped rather than kept
       here — thirty photos held twice over is real memory on a cheap phone */
    function open(e) {
      if (e) e.preventDefault();
      openViewer(im.getAttribute('src'), im.alt, fig);
    }
    fig.onclick = open;
    fig.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') open(e); };
    return fig;
  }

  /* A delivered report marks its title and section names as *LIKE THIS*, a
     whole line each. Those lines are shown bold, built from text — never
     from the message as markup. */
  function fillText(box, text) {
    var lines = String(text).split('\n');
    for (var i = 0; i < lines.length; i++) {
      if (i) box.appendChild(document.createTextNode('\n'));
      var line = lines[i];
      var b = /^\*([^*\n]+)\*[ \t]*$/.exec(line);
      if (b) box.appendChild(el('b', null, b[1]));
      else if (line) box.appendChild(document.createTextNode(line));
    }
  }

  function isNearBottom() {
    var de = document.documentElement;
    var y = window.pageYOffset || de.scrollTop || 0;
    return y + window.innerHeight >= de.scrollHeight - 120;
  }
  function scrollToBottom() {
    window.scrollTo(0, document.documentElement.scrollHeight);
  }

  /* ---------------- one channel ---------------- */

  function renderThread(ch) {
    stopAll();
    view = 'thread';
    openId = ch.id;
    clear(); buildTop();
    var gone = false;       /* this screen has been left */

    var back = el('button', 'backlink chat-back', t('back'));
    back.type = 'button';
    back.onclick = leaveThread;
    root.appendChild(back);

    var sal = el('div', 'sal thread-sal');
    sal.appendChild(el('h1', null, L(ch)));
    sal.appendChild(el('p', null, D(ch)));
    root.appendChild(sal);

    var more = el('button', 'chat-more', t('chatEarlier'));
    more.type = 'button';
    more.hidden = true;
    root.appendChild(more);

    var thread = el('div', 'thread');
    root.appendChild(thread);

    var pending = el('p', 'codenote');
    pending.hidden = true;
    root.appendChild(pending);

    /* composer */
    var form = el('form', 'composer');

    /* the picture button is a label over a hidden file input — on a phone that
       is what offers Camera as well as Gallery */
    var pickLabel = el('label', 'compbtn');
    pickLabel.title = t('chatPhoto');
    pickLabel.appendChild(el('span', null, '\ud83d\udcf7'));
    var pick = el('input');
    pick.type = 'file';
    pick.accept = 'image/*';
    pick.hidden = true;
    pickLabel.appendChild(pick);
    form.appendChild(pickLabel);

    var micBtn = null;
    if (canRecord()) {
      micBtn = el('button', 'compbtn');
      micBtn.type = 'button';
      micBtn.title = t('chatVoice');
      micBtn.setAttribute('aria-label', t('chatVoice'));
      micBtn.appendChild(el('span', null, '\ud83c\udfa4'));
      form.appendChild(micBtn);
    }

    var box = el('textarea');
    box.rows = 1;
    /* the rules refuse more than this; stopping the typing here is kinder
       than refusing the message after it is written */
    box.maxLength = MAX_TEXT;
    box.placeholder = t('chatWrite');
    box.setAttribute('aria-label', t('chatWrite'));
    var send = el('button', 'codego chatsend', t('chatSend'));
    send.type = 'submit';
    var count = el('span', 'chat-count');
    count.hidden = true;
    form.appendChild(box);
    form.appendChild(send);
    form.appendChild(count);
    root.appendChild(form);

    /* while recording, the composer is replaced by the recorder — there is
       nothing else to do until the note is sent or thrown away */
    var recBar = el('div', 'recbar');
    recBar.hidden = true;
    root.appendChild(recBar);

    /* ---- the box ---- */
    function grow() {
      box.style.height = 'auto';
      if (box.value) box.style.height = Math.min(box.scrollHeight, 160) + 'px';
    }
    function syncCount() {
      var n = box.value.length;
      count.hidden = n <= COUNT_FROM;
      if (!count.hidden) count.textContent = n + ' / ' + MAX_TEXT;
    }
    /* The page keeps clear of the composer by its real height: a long
       message grows the box, and the last line of the channel must not end
       up hidden behind it. */
    function fitPad() {
      if (gone) return;
      var bar = form.hidden ? recBar : form;
      var h = bar.offsetHeight;
      if (!h) return;
      var want = Math.max(110, h + 28) + 'px';
      if (root.style.paddingBottom === want) return;
      var near = isNearBottom();
      root.style.paddingBottom = want;
      if (near) scrollToBottom();
    }
    /* A message that could not go out comes back to the box — but never over
       something the person has started typing since. */
    function restore(text) {
      if (!text || gone) return;
      var cur = box.value;
      if (!cur.trim()) box.value = text;
      else if (text.length + 1 + cur.length <= MAX_TEXT) box.value = text + '\n' + cur;
      else return;
      grow(); syncCount(); fitPad();
    }

    /* a draft saved on the way through a language change */
    var saved = session.get(DRAFT_KEY + ch.id);
    if (saved) {
      session.del(DRAFT_KEY + ch.id);
      box.value = saved.slice(0, MAX_TEXT);
    }
    draftOf = function () { return { c: ch.id, text: box.value }; };

    /* ---- one message, whatever it carries ---- */
    function put(extra, text) {
      var row = {
        who: me, text: text || '', lang: lang, at: serverTimestamp()
      };
      if (extra) Object.keys(extra).forEach(function (k) { row[k] = extra[k]; });
      var p;
      try { p = addDoc(collection(db, 'channels', ch.id, 'messages'), row); }
      catch (e) { return Promise.reject(e); }
      inFlight++;
      p.then(function () { inFlight--; }, function () { inFlight--; });
      return p;
    }

    /* ---- a picture ---- */
    pick.onchange = function () {
      var file = pick.files && pick.files[0];
      pick.value = '';
      if (!file) return;
      pickLabel.classList.add('busy');
      var caption = box.value.trim();
      shrinkImage(file).then(function (img) {
        pickLabel.classList.remove('busy');
        if (gone) return;
        /* The write is queued the moment addDoc is called, and "sending…"
           under the picture shows it from there. Waiting for the server
           before freeing the button left it stuck all day on a site with
           no signal. */
        put({ kind: 'image', media: img.data, mime: 'image/jpeg',
              w: img.w, h: img.h }, caption)
          ['catch'](function (e) {
            toast(sendError(e));
            restore(caption);
          });
        if (box.value.trim() === caption) { box.value = ''; grow(); syncCount(); fitPad(); }
      }, function (e) {
        pickLabel.classList.remove('busy');
        var why = e && e.message;
        toast(why === 'too-big' ? t('chatTooBig')
            : why === 'file-huge' ? t('chatFileHuge')
            : why === 'not-an-image' ? t('chatCantRead')
            : t('chatSendFailed'));
      });
    };

    /* ---- a voice note ---- */
    var live = null;
    function closeRec() {
      recBar.hidden = true;
      recBar.innerHTML = '';
      form.hidden = false;
      fitPad();
    }
    recHook = function () {
      if (live) { try { live.cancel(); } catch (e) {} live = null; }
      if (!recBar.hidden) closeRec();
    };

    if (micBtn) {
      micBtn.onclick = function () {
        micBtn.disabled = true;
        record(function (secs) {
          var c = recBar.querySelector('.rectime');
          if (c) c.textContent = clockOf(secs) + ' / ' + clockOf(MAX_SECONDS);
        }, function () {
          /* two minutes: the recorder has stopped, and the note is kept for
             sending — only the pulsing stops, so nobody thinks it is still
             listening */
          var dot = recBar.querySelector('.recdot');
          if (dot) dot.classList.add('chat-recstop');
          var c = recBar.querySelector('.rectime');
          if (c) c.textContent = clockOf(MAX_SECONDS) + ' · ' + t('chatLimitReached');
          toast(t('chatLimitReached'));
        }).then(function (handle) {
          micBtn.disabled = false;
          /* permission took long enough for the person to leave the channel */
          if (gone) { handle.cancel(); return; }
          live = handle;
          form.hidden = true;
          recBar.hidden = false;
          recBar.innerHTML = '';
          recBar.appendChild(el('span', 'recdot'));
          recBar.appendChild(el('span', 'rectime', '0:00 / ' + clockOf(MAX_SECONDS)));
          recBar.appendChild(el('div', 'spacer'));

          var drop = el('button', 'chat-pill', t('chatDiscard'));
          drop.type = 'button';
          drop.onclick = function () {
            if (live) live.cancel();
            live = null;
            closeRec();
          };
          recBar.appendChild(drop);

          var done = el('button', 'codego chatsend', t('chatSend'));
          done.type = 'button';
          done.onclick = function () {
            if (!live) return;
            var h = live;
            live = null;
            done.disabled = true;
            drop.disabled = true;
            h.stop().then(function (clip) {
              closeRec();
              if (gone) return;
              if (!isAudioData(clip.data)) throw new Error('bad-audio');
              put({ kind: 'voice', media: clip.data, mime: clip.mime,
                    dur: clip.seconds }, '')
                ['catch'](function (e) { toast(sendError(e)); });
            })['catch'](function (e) {
              closeRec();
              var why = e && e.message;
              toast(why === 'too-long' ? t('chatTooLong')
                  : why === 'empty' ? t('chatVoiceEmpty')
                  : t('chatSendFailed'));
            });
          };
          recBar.appendChild(done);
          fitPad();
        })['catch'](function () {
          micBtn.disabled = false;
          if (!gone) toast(t('chatNoMic'));
        });
      };
    }

    box.addEventListener('input', function () { grow(); syncCount(); fitPad(); });
    /* Enter sends, Shift+Enter makes a new line — on a phone the keyboard's
       own return key still just makes a line, which is what people expect */
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && !matchMedia('(pointer:coarse)').matches) {
        e.preventDefault();
        form.requestSubmit();
      }
    });

    form.onsubmit = function (ev) {
      ev.preventDefault();
      var text = box.value.trim();
      if (!text) return;
      box.value = '';
      grow(); syncCount(); fitPad();
      /* Firestore's cache takes it now and sends it when there is signal, so
         this promise is not what tells us it arrived — the listener is. It
         rejects only when the server refuses the message. */
      put(null, text)['catch'](function (e) {
        toast(sendError(e));
        restore(text);
      });
    };

    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () { fitPad(); });
      ro.observe(form);
      ro.observe(recBar);
    }
    window.addEventListener('resize', fitPad);
    grow(); syncCount(); fitPad();

    /* ---- the messages ----

       The thread is drawn once and then changed in place: a new message is
       slotted in where it belongs and nothing else is rebuilt. Rebuilding
       on every change stopped a voice note mid-play and threw a reader who
       had scrolled up back to the bottom.

       A message that slides out of the newest-thirty window when a new one
       arrives stays on screen; the reader was looking at it. */

    var items = new Map();   /* message id -> what is drawn for it */
    var marks = {};          /* day -> its separator */
    var seq = 0;
    var oldest = null;       /* the oldest message held: where "Load earlier" starts */
    var liveIds = null;      /* ids in the last live window */
    var synced = false;      /* the server has answered at least once */
    var painted = false;
    var hasMore = false;
    var loadingMore = false;
    var newestMs = 0;
    var note = el('p', 'codenote');
    var errNote = null;
    var coll = collection(db, 'channels', ch.id, 'messages');

    function readItem(it, d) {
      var m = d.data({ serverTimestamps: 'estimate' });
      it.pending = d.metadata.hasPendingWrites;
      it.atMs = msOf(m.at);
      it.when = it.atMs ? new Date(it.atMs) : new Date();
      it.day = it.when.toDateString();
      return m;
    }
    function paintTime(it) {
      var s = it.pending ? t('chatSending') : hhmm(it.when);
      if (it.meta.textContent !== s) it.meta.textContent = s;
    }
    function noteOldest(d, it) {
      if (it.pending || !it.atMs) return;
      if (!oldest || it.atMs < oldest.ms || (it.atMs === oldest.ms && it.id < oldest.id)) {
        oldest = { ms: it.atMs, id: it.id, snap: d };
      }
    }
    /* docs arrive newest first; the last one the server has confirmed is
       the oldest */
    function oldestIn(docs) {
      for (var i = docs.length - 1; i >= 0; i--) {
        var d = docs[i];
        if (d.metadata.hasPendingWrites) continue;
        var ms = msOf(d.get('at'));
        if (ms) return { ms: ms, id: d.id, snap: d };
      }
      return null;
    }

    function buildMsg(it, m) {
      var own = it.who === me;
      var msg = el('div', 'msg' + (own ? ' own' : ''));
      var whoEl = el('div', 'msgwho', nameOf(it.who));
      msg.appendChild(whoEl);

      if (m.kind === 'image' && isImageData(m.media)) {
        msg.appendChild(photo(m));
      } else if (m.kind === 'voice' && isAudioData(m.media)) {
        var au = document.createElement('audio');
        au.controls = true;
        au.preload = 'none';
        au.className = 'msgvoice';
        au.src = m.media;
        msg.appendChild(au);
        if (typeof m.dur === 'number' && m.dur > 0) msg.appendChild(el('div', 'msgdur', clockOf(m.dur)));
      }

      if (typeof m.text === 'string' && m.text) {
        var tx = el('div', 'msgtext');
        fillText(tx, m.text);
        msg.appendChild(tx);
      }
      var meta = el('div', 'msgtime');
      msg.appendChild(meta);
      it.el = msg;
      it.whoEl = whoEl;
      it.meta = meta;
    }

    function addItem(d) {
      var it = { id: d.id, seq: seq++ };
      var m = readItem(it, d);
      it.who = String(m.who || '');
      buildMsg(it, m);
      paintTime(it);
      items.set(it.id, it);
      noteOldest(d, it);
      return it;
    }
    function dropItem(id) {
      var it = items.get(id);
      if (!it) return;
      if (it.el.parentNode) it.el.parentNode.removeChild(it.el);
      items['delete'](id);
    }
    /* let go of everything the server's window does not hold, except what
       is still waiting to be sent */
    function dropOutside(ids) {
      var out = [];
      items.forEach(function (it, id) { if (!ids[id] && !it.pending) out.push(id); });
      out.forEach(dropItem);
    }

    /* sent messages by the server's clock; unsent ones after them, in the
       order they were written */
    function order(a, b) {
      if (a.pending !== b.pending) return a.pending ? 1 : -1;
      if (a.pending) return (a.atMs - b.atMs) || (a.seq - b.seq);
      return (a.atMs - b.atMs) || (a.id < b.id ? -1 : (a.id > b.id ? 1 : 0));
    }

    function relayout() {
      var list = [];
      items.forEach(function (it) { list.push(it); });
      list.sort(order);
      var nodes = [], used = {}, lastDay = null, lastWho = null;
      list.forEach(function (it) {
        if (it.day !== lastDay) {
          var mk = marks[it.day];
          if (!mk) mk = marks[it.day] = el('div', 'daymark');
          var lbl = dayLabel(it.when);
          if (mk.textContent !== lbl) mk.textContent = lbl;
          used[it.day] = true;
          nodes.push(mk);
          lastDay = it.day;
          lastWho = null;
        }
        /* the name once per run of messages from the same person */
        it.whoEl.hidden = it.who === lastWho;
        lastWho = it.who;
        nodes.push(it.el);
      });
      Object.keys(marks).forEach(function (k) {
        if (used[k]) return;
        if (marks[k].parentNode) marks[k].parentNode.removeChild(marks[k]);
        delete marks[k];
      });
      if (!list.length && !errNote) {
        note.textContent = synced ? t('chatEmpty') : t('chatLoading');
        nodes.push(note);
      }
      if (errNote) nodes.push(errNote);
      place(thread, nodes);
    }

    function syncMore() {
      more.hidden = !(synced && hasMore && oldest && !errNote);
    }

    listStops.push(function () {
      gone = true;
      markSeen(ch.id, newestMs);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', fitPad);
    });

    /* the newest thirty, live */
    listStops.push(onSnapshot(query(coll, orderBy('at', 'desc'), limit(PAGE)),
                              { includeMetadataChanges: true }, function (snap) {
      if (gone) return;
      var near = !painted || isNearBottom();
      var stick = false;
      var now = {};
      snap.docs.forEach(function (d) { now[d.id] = true; });

      /* was anything from the last window still in this one? */
      var had = false, kept = false;
      if (liveIds) Object.keys(liveIds).forEach(function (id) {
        var it = items.get(id);
        if (it && !it.pending) { had = true; if (now[id]) kept = true; }
      });

      snap.docChanges({ includeMetadataChanges: true }).forEach(function (c) {
        var d = c.doc, it = items.get(d.id);
        if (c.type === 'removed') {
          /* sliding out of the window is no reason to vanish from the
             screen. But a message that never reached the server and is now
             gone was refused by it — that one goes. */
          if (it && it.pending) dropItem(d.id);
          return;
        }
        if (!it) {
          it = addItem(d);
          if (it.pending && it.who === me) stick = true;
        } else {
          /* only the time and the "sending…" change; the picture or the
             voice note already drawn is left alone */
          readItem(it, d);
          paintTime(it);
          noteOldest(d, it);
        }
      });

      if (!snap.metadata.fromCache && !synced) {
        /* The server's first answer. What the phone's cache showed before it
           can have holes — the channel list caches each channel's newest
           line on its own — so whatever the server's window does not hold is
           let go, and "Load earlier" counts back from here. */
        synced = true;
        dropOutside(now);
        oldest = oldestIn(snap.docs);
        hasMore = snap.size >= PAGE;
      } else if (synced && had && !kept) {
        /* Back after a long time without signal, and thirty or more new
           messages pushed out everything that was here: there may be a hole
           between them and what came before. Start again from the new
           window; "Load earlier" fills in behind it. */
        dropOutside(now);
        oldest = oldestIn(snap.docs);
        hasMore = true;
      }
      liveIds = now;

      var waiting = 0;
      snap.docs.forEach(function (d) { if (d.metadata.hasPendingWrites) waiting++; });
      threadWaiting = waiting;
      pending.hidden = waiting === 0;
      if (waiting) pending.textContent = t('chatWaiting').replace('{n}', waiting);

      for (var i = 0; i < snap.docs.length; i++) {
        if (snap.docs[i].metadata.hasPendingWrites) continue;
        var ms = msOf(snap.docs[i].get('at'));
        if (ms > newestMs) newestMs = ms;
        break;
      }
      if (document.visibilityState !== 'hidden') markSeen(ch.id, newestMs);

      relayout();
      syncMore();

      /* follow the conversation only for a reader who is already at the
         bottom, or who has just written something */
      if (!painted && items.size) { painted = true; scrollToBottom(); }
      else if (stick || near) scrollToBottom();
    }, function (e) {
      if (gone) return;
      if (e && e.code === 'permission-denied') {
        /* no longer a member: what the cache still held goes too */
        var all = [];
        items.forEach(function (it, id) { all.push(id); });
        all.forEach(dropItem);
      }
      errNote = el('p', 'codeerr', loadError(e));
      relayout();
      syncMore();
    }));

    /* older messages, thirty at a time, once — they cannot change, so there
       is nothing to keep listening to */
    more.onclick = function () {
      if (loadingMore || !oldest) return;
      loadingMore = true;
      more.disabled = true;
      more.textContent = t('chatLoading');
      var anchor = thread.querySelector('.msg');
      var top0 = anchor ? anchor.getBoundingClientRect().top : 0;
      getDocs(query(coll, orderBy('at', 'desc'), startAfter(oldest.snap), limit(PAGE)))
        .then(function (res) {
          if (gone) return;
          res.docs.forEach(function (d) { if (!items.has(d.id)) addItem(d); });
          var o = oldestIn(res.docs);
          if (o) oldest = o;
          hasMore = res.size >= PAGE;
          relayout();
          /* keep the message the reader was looking at where it was, rather
             than letting the new ones push it down the page */
          if (anchor && anchor.parentNode) {
            var dy = anchor.getBoundingClientRect().top - top0;
            if (dy) window.scrollBy(0, dy);
          }
        }, function (e) {
          if (!gone) toast(loadError(e));
        })
        .then(function () {
          loadingMore = false;
          more.disabled = false;
          more.textContent = t('chatEarlier');
          syncMore();
        });
    };
  }

  function hhmm(d) {
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  var MONTHS = {
    en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    /* Gregorian months, in Amharic — the dates themselves stay Gregorian,
       as everywhere else on the site */
    am: ['ጃንዩወሪ','ፌብሩወሪ','ማርች','ኤፕሪል','ሜይ','ጁን','ጁላይ','ኦገስት','ሴፕቴምበር','ኦክቶበር','ኖቬምበር','ዲሴምበር']
  };
  function dayLabel(d) {
    var now = new Date();
    var same = function (a, b) { return a.toDateString() === b.toDateString(); };
    if (same(d, now)) return t('chatToday');
    var y = new Date(now.getTime() - 86400000);
    if (same(d, y)) return t('chatYesterday');
    var m = lang === 'am' ? MONTHS.am : MONTHS.en;
    return d.getDate() + ' ' + m[d.getMonth()] + ' ' + d.getFullYear();
  }

  /* ---------------- start ---------------- */

  document.addEventListener('DOMContentLoaded', function () {
    root = document.getElementById('app');
    /* the page's own "Connecting…", put up before Firebase arrived */
    var boot = root && root.querySelector('.booting');
    if (boot) boot.parentNode.removeChild(boot);
    if (!configured()) { renderUnconfigured(); return; }
    connect();
    onAuthStateChanged(auth, function (user) {
      if (leaving) return;
      me = idFromUser(user);
      if (me) route();
      else { stopAll(); renderSignIn(); }
    });
  });
})();
