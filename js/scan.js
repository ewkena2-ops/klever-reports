/* Klever — the quick office check-in page (scan.html).

   THE ASK (26 Oct 2026, the user): "when they scan, the site has to load
   faster". The door QR opened the whole site — 1.6 MB of scripts, the
   database and the person's home page — before the scan was even sent. This
   page loads the sign-in alone (Firebase's app and auth, already in the
   phone's cache from the site) and asks where the phone is at once; the scan
   goes to the same server as before (the WhatsApp agent's /attend →
   apps-script/Attend.js), with the same answers, read the same way as on the
   home page (js/app.js atScanCard — change both together).

   Sent to the whole page instead (index.html?scan=office&full=1): someone
   not signed in on this browser (an iPhone keeps the home-screen app's
   sign-in apart from Safari's), and the Chairman, whose scan can save the
   office's place.                                                         */
(function () {
  'use strict';

  var SDK = 'https://www.gstatic.com/firebasejs/12.19.0/';
  var ATTEND_URL = 'https://whatsapp-agent-production-bcc8.up.railway.app/attend';
  var IOS = /iPhone|iPad|iPod/.test(navigator.userAgent || '');

  var lang = 'en';
  try { lang = localStorage.getItem('klever.lang') === 'am' ? 'am' : 'en'; } catch (e) {}
  var urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang === 'am' || urlLang === 'en') {
    lang = urlLang;
    try { localStorage.setItem('klever.lang', urlLang); } catch (e) {}
  }
  document.documentElement.lang = lang;
  function t(k) { var v = T[lang] && T[lang][k]; return v != null ? v : (T.en[k] != null ? T.en[k] : k); }
  function tf(k, o) { return t(k).replace(/\{(\w+)\}/g, function (m, n) { return o[n] != null ? o[n] : m; }); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  var box = document.getElementById('scanbox');
  var links = document.getElementById('scanlinks');
  document.getElementById('scantitle').textContent = t('scanTitle');
  document.title = t('scanTitle') + ' · Klever';

  /* the whole site, scanning (sign-in, the Chairman's place), or just home */
  function fullUrl() {
    var q = new URLSearchParams(location.search);
    q.set('scan', 'office'); q.set('full', '1');
    return 'index.html?' + q.toString();
  }
  function homeUrl() {
    var q = new URLSearchParams(location.search);
    q.delete('scan'); q.delete('full');
    return 'index.html' + (q.toString() ? '?' + q.toString() : '');
  }

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
  /* "Open my page", under every answer */
  function homeLink(label, href) {
    links.innerHTML = '';
    var a = el('a', 'pushbtn', label);
    a.href = href;
    links.appendChild(a);
  }
  function metres(m) {
    m = Math.max(0, Math.round(Number(m) || 0));
    if (m < 1000) return m + (lang === 'am' ? ' ሜትር' : ' m');
    return (m / 1000).toFixed(1) + (lang === 'am' ? ' ኪ.ሜ' : ' km');
  }
  function dur(m) {
    m = Math.max(0, Math.round(m || 0));
    var h = Math.floor(m / 60), r = m % 60;
    if (lang === 'am') return (h ? h + ' ሰዓት' + (r ? ' ' : '') : '') + (r || !h ? r + ' ደቂቃ' : '');
    return (h ? h + ' h' + (r ? ' ' : '') : '') + (r || !h ? r + ' min' : '');
  }

  show('wait', t('atChecking'));
  /* no fix yet after 10 seconds: say it is still looking (js/where.js) */
  var waiting = false;
  function still(s) {
    var sub = waiting && s >= 10 && box.querySelector('.atsub');
    if (sub) sub.textContent = t('atLocStill');
  }
  /* asked at once, while the sign-in loads: off the WiFi it is ready when the answer comes */
  var early = window.kleverWhere ? window.kleverWhere(still) : Promise.resolve({ err: 'none' });

  /* the person signed in on this browser, or null */
  var userP = Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js')]).then(function (m) {
    var A = m[0], U = m[1];
    var app = A.getApps().length ? A.getApps()[0] : A.initializeApp(FIREBASE_CONFIG);
    var auth = U.getAuth(app);
    return new Promise(function (res) {
      var off = U.onAuthStateChanged(auth, function (u) {
        try { if (off) off(); } catch (e) {}
        res(u || null);
      });
    });
  });

  function failed() {
    show('bad', t('atFailed'));
    button(t('atTryAgain'), function () { location.reload(); });
    homeLink(t('scanOpen'), homeUrl());
  }

  userP.then(function (user) {
    if (!user) { show('bad', t('atSignIn')); homeLink(t('scanSignInBtn'), fullUrl()); return; }
    if (/^chairman@/i.test(user.email || '')) { location.replace(fullUrl()); return; }

    /* plain text, so the phone sends it straight away: JSON would first ask
       the server "may I?" — one more trip on a slow line */
    var tokP = user.getIdToken();        /* fetched now, while the place is found: an old one is renewed over the line */
    function send(loc) {
      return tokP.then(function (tok) {
        var body = { idToken: tok };
        if (loc) body.loc = loc;
        return fetch(ATTEND_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify(body) });
      }).then(function (r) {
        return r.json()['catch'](function () { return { ok: false, why: 'unavailable' }; });
      });
    }
    var placeAsked = false;
    function place(pending) {
      placeAsked = true;
      waiting = true;
      show('wait', t('atLocAsk'), t('atLocAskSub'));
      (pending && pending.then ? pending : window.kleverWhere(still)).then(function (loc) {
        waiting = false;
        if (loc.err) return locHelp(loc.err);
        show('wait', t('atChecking'));
        return send(loc).then(answer);
      }).then(null, failed);
    }
    function again() { place(); }
    function locHelp(err) {
      show('bad', t(err === 'denied' ? 'atLocDenied' : 'atLocSlow'));
      var ua = navigator.userAgent || '';
      /* opened inside a QR app's own browser (Android "wv"), which gives no location: Chrome can */
      if (/Android/.test(ua) && /; wv\)|FBAN|FBAV|Instagram|Telegram/.test(ua)) {
        box.appendChild(el('div', 'atsub', t('atHelpApp')));
        var go = el('a', 'pushbtn atagain', t('atOpenChrome'));
        go.href = 'intent://' + location.host + location.pathname + '?scan=office#Intent;scheme=https;package=com.android.chrome;end';
        box.appendChild(go);
      }
      box.appendChild(el('div', 'atsub', t('atHelpHead')));
      var ol = el('ol', 'atsteps');
      (IOS ? ['atHelpI1', 'atHelpI2', 'atHelpI3', 'atHelpBack'] : ['atHelpA1', 'atHelpA2', 'atHelpA3', 'atHelpBack'])
        .forEach(function (k) { ol.appendChild(el('li', '', t(k))); });
      box.appendChild(ol);
      button(t('atTryAgain'), again);
      homeLink(t('scanOpen'), homeUrl());
    }
    function answer(a) {
      var w = a.why || 'unavailable';
      if (!a.ok && (w === 'not-wifi' || w === 'no-wifi-set') && !placeAsked) return place(early);
      if (a.chairman) { location.replace(fullUrl()); return; }
      homeLink(t('scanOpen'), homeUrl());
      var saved = a.queued ? t('atSaved') : '';
      var how = a.place ? tf('atByPlace', { m: metres(a.dist) }) : '';
      if (a.ok && a.already) return show(a.late ? 'late' : 'good', tf('atAlready', { at: a.at }), saved);
      if (a.ok) {
        return a.late ? show('late', tf('atLate', { at: a.at, m: dur(a.minsLate) }), (how ? how + ' ' : '') + (saved || t('scanLateWhy')))
                      : show('good', tf('atOnTime', { at: a.at }), (how ? how + ' ' : '') + saved);
      }
      if (w === 'holiday') return show('bad', tf('atHoliday', { name: lang === 'am' && a.nameAm ? a.nameAm : (a.name || '') }));
      if (w === 'far') { show('bad', tf('atFar', { m: metres(a.dist) }), t('atFarSub')); button(t('atTryAgain'), again); return; }
      if (w === 'loc-poor') { show('bad', tf('atLocPoor', { m: metres(a.acc) }), t(IOS ? 'atLocPoorSubI' : 'atLocPoorSub')); button(t('atTryAgain'), again); return; }
      if (w === 'no-spot') return show('bad', t('atNoSpot'));
      var msg = { 'not-wifi': 'atNotWifi', 'no-wifi-set': 'atNoWifiSet', sunday: 'atSunday', 'not-office': 'atNotOffice',
                  signin: 'atSignIn' }[w] || 'atFailed';
      show('bad', t(msg), a.ip ? tf('atAddr', { ip: a.ip }) : '');
      if (msg === 'atFailed') button(t('atTryAgain'), function () { location.reload(); });
    }
    /* one send, not two: the place goes with the scan when the phone has it
       within a moment (off the WiFi it decides; on the WiFi it is not
       needed). No place by then: sent without, and asked for if needed. */
    var placed = null;
    early.then(function (loc) { placed = loc; });
    new Promise(function (go) {
      if (placed) return go();
      early.then(go);
      setTimeout(go, window.KLEVER_WHERE_FIRST || 2500);
    }).then(function () {
      var loc = placed && !placed.err ? placed : null;
      if (loc) placeAsked = true;
      return send(loc);
    }).then(answer, failed);
  }, failed);
})();
