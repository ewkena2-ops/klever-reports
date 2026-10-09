/* Firebase for the report side — identity, and a filed report nobody can forge.

   WHY THIS EXISTS
   Reports used to be filed by POSTing to an Apps Script web app deployed as
   ANYONE_ANONYMOUS, with no check on who was calling. The six-digit code
   gated the page, not the endpoint, and the endpoint's URL ships in this
   public repo. So anyone who found it could file a report as anyone — a made
   up production figure, an entry under someone else's name, a filing
   backdated to look on time.

   That was survivable while the archive was only a record. It stops being
   survivable the moment the penalty ledger starts taking money off people for
   what those rows say: the first person charged 500 Birr for a late report
   can fairly answer that anybody could have written it.

   So a report now also goes to Firestore, signed in, where the rules say you
   file as yourself and the server sets the time. The Sheet still gets its
   copy — it is the Chairman's window on the day and it drives the emails —
   but the record that the ledger will answer for is the one here.

   OFFLINE
   Firebase keeps the signed-in session on the phone, so a person who has
   signed in once stays signed in with no network. Only a first sign-in needs
   a connection. A report written offline waits in Firestore's own cache and
   goes out when the signal returns, which is the same job js/save.js's outbox
   does for the Sheet.

   LOADED IN THE BACKGROUND
   Firebase is about 600 KB. Imported at the top of this file, it held the
   whole page back — not even the top bar or "Connecting…" drew until it had
   all arrived, which on a slow line was nine seconds of white. It is now
   fetched after the page has drawn, and everything here waits on `ready`.
   Another script on the same page (chairman.js) may have started Firebase
   first; then its app and database are used rather than a second copy.    */

(function () {
  'use strict';

  var SDK = 'https://www.gstatic.com/firebasejs/12.19.0/';
  var F = {};                       /* the Firebase functions, once loaded */
  var app = null, auth = null, db = null;
  var user = null;
  var listeners = [];

  function configured() {
    return typeof FIREBASE_CONFIG !== 'undefined'
        && FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId;
  }

  /* betty@klever.local is betty. Firebase owns this, not us. */
  function idOf(u) {
    return u && u.email ? u.email.split('@')[0].toLowerCase() : null;
  }

  var ready = new Promise(function (resolve) {
    if (!configured()) { resolve(null); return; }
    Promise.all([
      import(SDK + 'firebase-app.js'),
      import(SDK + 'firebase-auth.js'),
      import(SDK + 'firebase-firestore.js')
    ]).then(function (mods) {
      [0, 1, 2].forEach(function (i) { Object.keys(mods[i]).forEach(function (k) { F[k] = mods[i][k]; }); });
      app = F.getApps().length ? F.getApps()[0] : F.initializeApp(FIREBASE_CONFIG);
      auth = F.getAuth(app);
      try {
        db = F.initializeFirestore(app, {
          localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() })
        });
      } catch (e) {
        /* already started by another script on this page */
        db = F.getFirestore(app);
      }
      var first = true;
      F.onAuthStateChanged(auth, function (u) {
        user = u || null;
        if (first) { first = false; resolve(idOf(user)); }
        listeners.forEach(function (fn) { try { fn(idOf(user)); } catch (e) {} });
      });
    })['catch'](function () {
      /* a blocked CDN or a wedged cache must not take the whole site down —
         the forms still work, the Sheet still gets its copy */
      auth = null; db = null;
      resolve(null);
    });
  });

  /* a watch asked for before Firebase has arrived starts when it does */
  function later(start) {
    var stop = null, stopped = false;
    ready.then(function () { if (!stopped && db) stop = start(); });
    return function () { stopped = true; if (stop) try { stop(); } catch (e) {} };
  }
  function timeOf(v) { return v && v.toDate ? v.toDate() : new Date(); }

  window.FB = {
    ready: ready,
    on: function (fn) { listeners.push(fn); },

    live: function () { return !!auth; },
    who: function () { return idOf(user); },

    signIn: function (id, password) {
      return ready.then(function () {
        if (!auth) throw new Error('offline');
        return F.signInWithEmailAndPassword(auth, id + '@' + KLEVER_DOMAIN, password);
      }).then(function (cred) { return idOf(cred.user); });
    },

    signOut: function () {
      return ready.then(function () { if (auth) return F.signOut(auth); });
    },

    /* a fresh sign-in token, for the Sheet's script to check who is posting */
    token: function () {
      return ready.then(function () { return user ? user.getIdToken() : null; })['catch'](function () { return null; });
    },

    /* One filed report. `person` is whose report it is; `by` is who pressed
       Send — normally the same, but the Chairman may file on anyone's behalf
       and the row should say so rather than quietly read as theirs. The rules
       enforce both, and set the time themselves. */
    fileReport: function (row) {
      if (!db || !user) return Promise.reject(new Error('not signed in'));
      return F.addDoc(F.collection(db, 'reports'), {
        person:  row.person,
        report:  row.report,
        by:      idOf(user),
        late:    !!row.late,
        due:     row.due || '',
        values:  row.values || {},
        flags:   row.flags || [],
        text:    row.text || '',
        lang:    row.lang || 'en',
        at:      F.serverTimestamp()
      });
    },

    /* The filings since `since` — one person's, or everyone's for the
       Chairman (person null) — as [{report, person, by, at, pending}], kept
       current. The rules only answer a person about their own reports, so
       the query has to say `person ==` for the server to allow it. */
    watchFilings: function (person, since, cb) {
      return later(function () {
        var q = person
          ? F.query(F.collection(db, 'reports'), F.where('person', '==', person), F.where('at', '>=', since))
          : F.query(F.collection(db, 'reports'), F.where('at', '>=', since));
        return F.onSnapshot(q, function (snap) {
          var out = [];
          snap.forEach(function (d) {
            var x = d.data({ serverTimestamps: 'estimate' });
            out.push({ report: x.report, person: x.person, by: x.by, at: timeOf(x.at),
                       pending: d.metadata.hasPendingWrites });
          });
          cb(out);
        }, function () { /* no answer is not "nothing sent": leave the list as it is */ });
      });
    },

    /* One person's own filed reports since `since`, answers and all, as
       [{report, person, at, values}] — fetched once, not watched.

       This is what lets a weekly report add up its own week instead of
       asking someone to add up six daily reports they already filed. The
       rules hand over a person's own reports (match /reports), so this asks
       for one person by name and nothing else. */
    ownReports: function (person, since) {
      return ready.then(function () {
        if (!db) return [];
        var q = F.query(F.collection(db, 'reports'),
                        F.where('person', '==', person), F.where('at', '>=', since));
        return F.getDocs(q).then(function (snap) {
          var out = [];
          snap.forEach(function (d) {
            var x = d.data({ serverTimestamps: 'estimate' });
            out.push({ report: x.report, person: x.person,
                       at: timeOf(x.at).getTime(), values: x.values || {} });
          });
          return out;
        });
      });
    },

    /* Put the filed report in front of the people it is addressed to.

       A report that is filed and not read is a report nobody acted on. Every
       one of them names its recipients, and every one of those people has a
       channel, so the sending is a real delivery rather than a suggestion that
       the person go and find a WhatsApp group.

       It posts as the person who filed it, which the rules require anyway, so
       the message carries their name and cannot be written by anyone else. */
    deliverReport: function (channelId, text) {
      if (!db || !user) return Promise.reject(new Error('not signed in'));
      return F.addDoc(F.collection(db, 'channels', channelId, 'messages'), {
        who: idOf(user),
        text: text,
        lang: 'en',
        at: F.serverTimestamp()
      });
    },

    /* The newest thing said in any of this person's channels, for the home
       screen. One listener per channel, one document each — a person has three
       or four, so this is a handful of reads on a page load, and it is what
       makes a single link worth handing out instead of two. */
    watchLatest: function (channelIds, cb) {
      return later(function () {
      var best = null, stops = [];
      channelIds.forEach(function (cid) {
        var q = F.query(F.collection(db, 'channels', cid, 'messages'),
                        F.orderBy('at', 'desc'), F.limit(1));
        stops.push(F.onSnapshot(q, function (snap) {
          if (snap.empty) return;
          var d = snap.docs[0].data();
          var at = timeOf(d.at);
          if (best && best.at >= at) return;
          best = { channel: cid, who: d.who, text: d.text || '',
                   kind: d.kind || null, at: at };
          cb(best);
        }, function () { /* a channel we cannot read is simply skipped */ }));
      });
      return function () { stops.forEach(function (f) { try { f(); } catch (e) {} }); };
      });
    },

    /* What the Chairman has asked of this person. The rules let a person
       read only instructions addressed to them, and a query has to say so
       for the server to answer it — hence the `to` filter rather than
       reading the collection and filtering here. */
    watchMyInstructions: function (cb) {
      return later(function () {
      if (!user) return null;
      var q = F.query(F.collection(db, 'instructions'), F.where('to', '==', idOf(user)));
      return F.onSnapshot(q, function (snap) {
        var out = [];
        snap.forEach(function (d) {
          var x = d.data();
          x.id = d.id;
          out.push(x);
        });
        cb(out);
      }, function () { cb([]); });
      });
    },

    /* My agents' readings (apps-script/Owners.js): the latest of each. */
    watchMyReadings: function (cb) {
      return later(function () {
      if (!user) return null;
      var q = F.query(F.collection(db, 'readings'), F.where('to', '==', idOf(user)));
      return F.onSnapshot(q, function (snap) {
        var out = [];
        snap.forEach(function (d) { var x = d.data(); x.id = d.id; out.push(x); });
        cb(out);
      }, function () { cb([]); });
      });
    },

    /* Close one, once, with what was done. The server sets the time and the
       rules refuse anything else about the instruction being changed. */
    closeInstruction: function (id, note) {
      if (!db || !user) return Promise.reject(new Error('not signed in'));
      return F.updateDoc(F.doc(db, 'instructions', id), {
        status: 'done',
        note: String(note || '').slice(0, 1000),
        doneAt: F.serverTimestamp()
      });
    },

    /* PHONE NOTIFICATIONS. Where this phone stands:
         unsupported — its browser cannot show them
         iphone      — an iPhone, where only a site added to the home screen can
         denied      — the person blocked them for this site
         off         — not turned on here yet
         on          — turned on, and this phone's address is saved
       The address (a Firebase Cloud Messaging token) goes into /pushTokens
       under the person's own name — the rules allow nothing else — and the
       script on the server (apps-script/Push.js) sends to it. */
    pushState: function () {
      if (iphoneNotInstalled()) return Promise.resolve('iphone');
      if (!pushSupported()) return Promise.resolve('unsupported');
      if (Notification.permission === 'denied') return Promise.resolve('denied');
      if (Notification.permission !== 'granted') return Promise.resolve('off');
      var saved = null;
      try { saved = localStorage.getItem(PUSH_KEY); } catch (e) {}
      return Promise.resolve(saved && user && saved.indexOf(idOf(user) + '_') === 0 ? 'on' : 'off');
    },

    /* Ask once, register the service worker, save this phone's address.
       `quiet`: no question asked — only refresh an address already allowed
       (a phone's address can change, and each page load keeps it current). */
    pushEnable: function (quiet) {
      if (iphoneNotInstalled()) return Promise.resolve('iphone');
      if (!pushSupported()) return Promise.resolve('unsupported');
      return ready.then(function () {
        if (!db || !user) throw new Error('not signed in');
        var asked = quiet ? Promise.resolve(Notification.permission) : Notification.requestPermission();
        return asked;
      }).then(function (p) {
        if (p !== 'granted') return p === 'denied' ? 'denied' : 'off';
        return navigator.serviceWorker.register('firebase-messaging-sw.js', { scope: './' })
          .then(function (reg) {
            return messaging().then(function (x) { return x.m.getToken(x.msg, { serviceWorkerRegistration: reg }); });
          })
          .then(function (token) {
            if (!token) throw new Error('no address for this phone');
            var me = idOf(user), id = me + '_' + fnv8(token);
            var saved = null;
            try { saved = localStorage.getItem(PUSH_KEY); } catch (e) {}
            if (quiet && saved === id) return 'on';
            return F.setDoc(F.doc(db, 'pushTokens', id), {
              person: me, t: token, at: F.serverTimestamp(),
              ua: String(navigator.userAgent || '').slice(0, 300)
            }).then(function () {
              try { localStorage.setItem(PUSH_KEY, id); } catch (e) {}
              return 'on';
            });
          });
      });
    }
  };

  var PUSH_KEY = 'klever.push';          /* this phone's address id, once saved */
  function pushSupported() {
    return 'serviceWorker' in navigator && typeof window.PushManager !== 'undefined' &&
           typeof window.Notification !== 'undefined';
  }
  /* an iPhone shows a site's notifications only once it is added to the home
     screen and opened from there */
  function iphoneNotInstalled() {
    var ios = /iPhone|iPad|iPod/.test(navigator.userAgent || '');
    var standalone = window.navigator.standalone === true ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    return ios && !standalone;
  }
  /* a short, steady name for one address: the same phone saves over itself */
  function fnv8(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  }
  var MSG = null;
  function messaging() {
    if (MSG) return MSG;
    MSG = import(SDK + 'firebase-messaging.js').then(function (m) {
      return m.isSupported().then(function (ok) {
        if (!ok) throw new Error('unsupported');
        return { m: m, msg: m.getMessaging(app) };
      });
    });
    MSG['catch'](function () { MSG = null; });
    return MSG;
  }
  /* a phone that already allowed them keeps its address current, quietly */
  ready.then(function () {
    try {
      if (user && pushSupported() && Notification.permission === 'granted' && localStorage.getItem(PUSH_KEY)) {
        window.FB.pushEnable(true)['catch'](function () {});
      }
    } catch (e) {}
  });
})();
