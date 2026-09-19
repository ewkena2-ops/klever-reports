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
   does for the Sheet.                                                       */

import { initializeApp }
  from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, setDoc, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

(function () {
  'use strict';

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
    try {
      app = initializeApp(FIREBASE_CONFIG);
      auth = getAuth(app);
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      });
    } catch (e) {
      /* a blocked CDN or a wedged cache must not take the whole site down —
         the forms still work, the Sheet still gets its copy */
      resolve(null);
      return;
    }
    var first = true;
    onAuthStateChanged(auth, function (u) {
      user = u || null;
      if (first) { first = false; resolve(idOf(user)); }
      listeners.forEach(function (fn) { try { fn(idOf(user)); } catch (e) {} });
    });
  });

  window.FB = {
    ready: ready,
    on: function (fn) { listeners.push(fn); },

    live: function () { return !!auth; },
    who: function () { return idOf(user); },

    signIn: function (id, password) {
      if (!auth) return Promise.reject(new Error('offline'));
      return signInWithEmailAndPassword(auth, id + '@' + KLEVER_DOMAIN, password)
        .then(function (cred) { return idOf(cred.user); });
    },

    signOut: function () {
      if (!auth) return Promise.resolve();
      return signOut(auth);
    },

    /* One filed report. `person` is whose report it is; `by` is who pressed
       Send — normally the same, but the Chairman may file on anyone's behalf
       and the row should say so rather than quietly read as theirs. The rules
       enforce both, and set the time themselves. */
    fileReport: function (row) {
      if (!db || !user) return Promise.reject(new Error('not signed in'));
      return addDoc(collection(db, 'reports'), {
        person:  row.person,
        report:  row.report,
        by:      idOf(user),
        late:    !!row.late,
        due:     row.due || '',
        values:  row.values || {},
        flags:   row.flags || [],
        text:    row.text || '',
        lang:    row.lang || 'en',
        at:      serverTimestamp()
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
      return addDoc(collection(db, 'channels', channelId, 'messages'), {
        who: idOf(user),
        text: text,
        lang: 'en',
        at: serverTimestamp()
      });
    },

    /* The newest thing said in any of this person's channels, for the home
       screen. One listener per channel, one document each — a person has three
       or four, so this is a handful of reads on a page load, and it is what
       makes a single link worth handing out instead of two. */
    watchLatest: function (channelIds, cb) {
      if (!db) return function () {};
      var best = null, stops = [];
      channelIds.forEach(function (cid) {
        var q = query(collection(db, 'channels', cid, 'messages'),
                      orderBy('at', 'desc'), limit(1));
        stops.push(onSnapshot(q, function (snap) {
          if (snap.empty) return;
          var d = snap.docs[0].data();
          var at = d.at && d.at.toDate ? d.at.toDate() : new Date();
          if (best && best.at >= at) return;
          best = { channel: cid, who: d.who, text: d.text || '',
                   kind: d.kind || null, at: at };
          cb(best);
        }, function () { /* a channel we cannot read is simply skipped */ }));
      });
      return function () { stops.forEach(function (f) { try { f(); } catch (e) {} }); };
    }
  };
})();
