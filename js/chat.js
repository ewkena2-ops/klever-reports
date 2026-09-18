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
   can quietly revise afterwards is not a record.                            */

import { initializeApp }
  from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, setDoc, addDoc, query, orderBy, limit, onSnapshot,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { shrinkImage, record, canRecord, clockOf, MAX_SECONDS } from './media.js';

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
    return p ? L(p) : id;
  }
  function initialOf(id) {
    return id === CHAIRMAN ? '★' : nameOf(id).charAt(0);
  }

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

    var tg = el('div', 'langtoggle');
    [['en', 'EN'], ['am', 'አማ']].forEach(function (p) {
      var b = el('button', null, p[1]);
      b.type = 'button';
      b.setAttribute('aria-pressed', lang === p[0] ? 'true' : 'false');
      b.onclick = function () { lang = p[0]; store.set(LANG_KEY, lang); location.reload(); };
      tg.appendChild(b);
    });
    inner.appendChild(tg);

    if (me) {
      var out = el('button', 'signoutbtn');
      out.type = 'button';
      out.appendChild(el('span', 'soinit', initialOf(me)));
      out.appendChild(el('span', 'sotext', t('signOut')));
      out.title = nameOf(me);
      out.onclick = function () { signOut(auth); };
      inner.appendChild(out);
    }

    top.appendChild(inner);
    document.body.insertBefore(top, document.body.firstChild);
    document.documentElement.lang = lang === 'am' ? 'am' : 'en';
  }

  function toast(msg) {
    var e = document.querySelector('.toast');
    if (!e) { e = el('div', 'toast'); document.body.appendChild(e); }
    e.textContent = msg;
    e.classList.add('on');
    setTimeout(function () { e.classList.remove('on'); }, 2600);
  }

  /* ---------------- screens ---------------- */

  var root = null;
  function clear() { root.innerHTML = ''; }

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
    clear(); buildTop();
    root.appendChild(el('h1', null, t('chatTitle')));
    root.appendChild(el('p', 'sub', t('chatSignInSub')));

    var form = el('form', 'signin');

    /* if they are already signed in to the reports side, start from that name
       — nobody should have to say who they are twice */
    var known = (typeof AUTH !== 'undefined' && AUTH.who()) || null;
    if (known === '*') known = CHAIRMAN;

    var wrapWho = el('label', 'chatfield');
    wrapWho.appendChild(el('span', 'codelab', t('chatWho')));
    var sel = el('select');
    var optC = el('option', null, lang === 'am' ? 'ሊቀመንበር' : 'Chairman');
    optC.value = CHAIRMAN;
    sel.appendChild(optC);
    /* only offer names that have an account — otherwise picking one gives a
       password error that looks like the person's own mistake */
    PEOPLE.forEach(function (p) {
      if (CHAT_ACCOUNTS.indexOf(p.id) === -1) return;
      var o = el('option', null, L(p) + ' · ' + (lang === 'am' ? p.roleAm : p.roleEn));
      o.value = p.id;
      sel.appendChild(o);
    });
    if (known) sel.value = known;
    wrapWho.appendChild(sel);
    form.appendChild(wrapWho);

    var wrapPw = el('label', 'chatfield');
    wrapPw.appendChild(el('span', 'codelab', t('chatPassword')));
    var pw = el('input');
    pw.type = 'password';
    pw.autocomplete = 'current-password';
    wrapPw.appendChild(pw);
    form.appendChild(wrapPw);

    var err = el('p', 'codeerr');
    err.hidden = true;
    form.appendChild(err);

    var go = el('button', 'codego', t('chatSignIn'));
    go.type = 'submit';
    form.appendChild(go);

    form.onsubmit = function (ev) {
      ev.preventDefault();
      err.hidden = true;
      go.disabled = true;
      go.textContent = t('chatSigningIn');
      signInWithEmailAndPassword(auth, sel.value + '@' + KLEVER_DOMAIN, pw.value)
        ['catch'](function () {
          /* never say which half was wrong */
          err.textContent = t('chatBadSignIn');
          err.hidden = false;
          go.disabled = false;
          go.textContent = t('chatSignIn');
          pw.value = '';
          pw.focus();
        });
    };

    root.appendChild(form);
    root.appendChild(el('p', 'codenote', t('chatNoAccount')));
  }

  /* ---------------- channel list ---------------- */

  var listStops = [];
  function stopAll() {
    listStops.forEach(function (fn) { try { fn(); } catch (e) {} });
    listStops = [];
  }

  function renderChannels() {
    stopAll();
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

    mine.forEach(function (ch) {
      var card = el('button', 'chan');
      card.type = 'button';
      card.appendChild(el('span', 'chinit', ch.kind === 'direct' ? '✉' : '#'));
      var who = el('span', 'who');
      who.appendChild(el('span', 'nm', L(ch)));
      var last = el('span', 'rl', D(ch));
      who.appendChild(last);
      card.appendChild(who);
      card.appendChild(el('span', 'arrow', '→'));
      card.onclick = function () { renderThread(ch); };

      /* one live listener per channel, just for the latest line */
      var q = query(collection(db, 'channels', ch.id, 'messages'),
                    orderBy('at', 'desc'), limit(1));
      listStops.push(onSnapshot(q, function (snap) {
        if (snap.empty) return;
        var m = snap.docs[0].data();
        last.textContent = nameOf(m.who) + ': ' + m.text;
        last.classList.add('lastmsg');
      }, function () { /* a channel we cannot read is simply left as it is */ }));

      (ch.kind === 'direct' ? wrapDirect : wrapTeam).appendChild(card);
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

  /* ---------------- one channel ---------------- */

  function renderThread(ch) {
    stopAll();
    clear(); buildTop();

    var back = el('button', 'backlink', t('back'));
    back.type = 'button';
    back.onclick = renderChannels;
    root.appendChild(back);

    var sal = el('div', 'sal thread-sal');
    sal.appendChild(el('h1', null, L(ch)));
    sal.appendChild(el('p', null, D(ch)));
    root.appendChild(sal);

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
      micBtn.appendChild(el('span', null, '\ud83c\udfa4'));
      form.appendChild(micBtn);
    }

    var box = el('textarea');
    box.rows = 1;
    box.placeholder = t('chatWrite');
    box.setAttribute('aria-label', t('chatWrite'));
    var send = el('button', 'codego chatsend', t('chatSend'));
    send.type = 'submit';
    form.appendChild(box);
    form.appendChild(send);
    root.appendChild(form);

    /* while recording, the composer is replaced by the recorder — there is
       nothing else to do until the note is sent or thrown away */
    var recBar = el('div', 'recbar');
    recBar.hidden = true;
    root.appendChild(recBar);

    /* ---- one message, whatever it carries ---- */
    function put(extra, text) {
      var row = {
        who: me, text: text || '', lang: lang, at: serverTimestamp()
      };
      if (extra) Object.keys(extra).forEach(function (k) { row[k] = extra[k]; });
      return addDoc(collection(db, 'channels', ch.id, 'messages'), row);
    }

    /* ---- a picture ---- */
    pick.onchange = function () {
      var file = pick.files && pick.files[0];
      pick.value = '';
      if (!file) return;
      pickLabel.classList.add('busy');
      var caption = box.value.trim();
      shrinkImage(file).then(function (img) {
        box.value = '';
        box.style.height = 'auto';
        return put({ kind: 'image', media: img.data, mime: 'image/jpeg',
                     w: img.w, h: img.h }, caption);
      })['catch'](function (e) {
        toast(e && e.message === 'too-big' ? t('chatTooBig') : t('chatSendFailed'));
      }).then(function () { pickLabel.classList.remove('busy'); });
    };

    /* ---- a voice note ---- */
    var live = null;
    if (micBtn) {
      micBtn.onclick = function () {
        micBtn.disabled = true;
        record(function (secs) {
          var c = recBar.querySelector('.rectime');
          if (c) c.textContent = clockOf(secs) + ' / ' + clockOf(MAX_SECONDS);
        }).then(function (handle) {
          live = handle;
          micBtn.disabled = false;
          form.hidden = true;
          recBar.hidden = false;
          recBar.innerHTML = '';
          recBar.appendChild(el('span', 'recdot'));
          recBar.appendChild(el('span', 'rectime', '0:00 / ' + clockOf(MAX_SECONDS)));
          recBar.appendChild(el('div', 'spacer'));

          var drop = el('button', 'compbtn', t('chatDiscard'));
          drop.type = 'button';
          drop.onclick = function () {
            if (live) live.cancel();
            live = null;
            recBar.hidden = true;
            form.hidden = false;
          };
          recBar.appendChild(drop);

          var done = el('button', 'codego chatsend', t('chatSend'));
          done.type = 'button';
          done.onclick = function () {
            if (!live) return;
            done.disabled = true;
            live.stop().then(function (clip) {
              live = null;
              recBar.hidden = true;
              form.hidden = false;
              return put({ kind: 'voice', media: clip.data, mime: clip.mime,
                           dur: clip.seconds }, '');
            })['catch'](function (e) {
              live = null;
              recBar.hidden = true;
              form.hidden = false;
              toast(e && e.message === 'too-long' ? t('chatTooLong') : t('chatSendFailed'));
            });
          };
          recBar.appendChild(done);
        })['catch'](function () {
          micBtn.disabled = false;
          toast(t('chatNoMic'));
        });
      };
    }

    /* grow the box with the message, up to a point */
    box.addEventListener('input', function () {
      box.style.height = 'auto';
      box.style.height = Math.min(box.scrollHeight, 160) + 'px';
    });
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
      box.style.height = 'auto';
      /* Firestore's cache takes it now and sends it when there is signal, so
         this promise is not what tells us it arrived — the listener is. */
      put(null, text)['catch'](function () {
        toast(t('chatSendFailed'));
        box.value = text;
      });
    };

    /* last 200, oldest first */
    var q = query(collection(db, 'channels', ch.id, 'messages'),
                  orderBy('at', 'desc'), limit(200));
    listStops.push(onSnapshot(q, { includeMetadataChanges: true }, function (snap) {
      var rows = snap.docs.slice().reverse();
      thread.innerHTML = '';
      var lastWho = null, lastDay = null, waiting = 0;

      rows.forEach(function (d) {
        var m = d.data();
        var when = m.at && m.at.toDate ? m.at.toDate() : new Date();
        if (d.metadata.hasPendingWrites) waiting++;

        var day = when.toDateString();
        if (day !== lastDay) {
          thread.appendChild(el('div', 'daymark', dayLabel(when)));
          lastDay = day;
          lastWho = null;
        }

        var own = m.who === me;
        var msg = el('div', 'msg' + (own ? ' own' : ''));
        if (m.who !== lastWho) {
          msg.appendChild(el('div', 'msgwho', nameOf(m.who)));
        }

        if (m.kind === 'image' && m.media) {
          var fig = el('a', 'msgimg');
          fig.href = m.media;
          fig.target = '_blank';
          fig.rel = 'noopener';
          var im = new Image();
          im.src = m.media;
          im.alt = m.text || t('chatPhoto');
          im.loading = 'lazy';
          if (m.w && m.h) { im.width = m.w; im.height = m.h; }
          fig.appendChild(im);
          msg.appendChild(fig);
        } else if (m.kind === 'voice' && m.media) {
          var au = document.createElement('audio');
          au.controls = true;
          au.preload = 'none';
          au.className = 'msgvoice';
          au.src = m.media;
          msg.appendChild(au);
          if (m.dur) msg.appendChild(el('div', 'msgdur', clockOf(m.dur)));
        }

        if (m.text) msg.appendChild(el('div', 'msgtext', m.text));
        var meta = el('div', 'msgtime', hhmm(when));
        if (d.metadata.hasPendingWrites) meta.textContent = t('chatSending');
        msg.appendChild(meta);
        thread.appendChild(msg);
        lastWho = m.who;
      });

      if (!rows.length) thread.appendChild(el('p', 'codenote', t('chatEmpty')));

      pending.hidden = waiting === 0;
      if (waiting) pending.textContent = t('chatWaiting').replace('{n}', waiting);

      thread.scrollTop = thread.scrollHeight;
      window.scrollTo(0, document.body.scrollHeight);
    }, function (e) {
      thread.innerHTML = '';
      thread.appendChild(el('p', 'codeerr', t('chatNoAccess')));
    }));
  }

  function hhmm(d) {
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  function dayLabel(d) {
    var now = new Date();
    var same = function (a, b) { return a.toDateString() === b.toDateString(); };
    if (same(d, now)) return t('chatToday');
    var y = new Date(now.getTime() - 86400000);
    if (same(d, y)) return t('chatYesterday');
    var m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return d.getDate() + ' ' + m[d.getMonth()] + ' ' + d.getFullYear();
  }

  /* ---------------- start ---------------- */

  document.addEventListener('DOMContentLoaded', function () {
    root = document.getElementById('app');
    if (!configured()) { renderUnconfigured(); return; }
    connect();
    onAuthStateChanged(auth, function (user) {
      me = idFromUser(user);
      if (me) renderChannels();
      else { stopAll(); renderSignIn(); }
    });
  });
})();
