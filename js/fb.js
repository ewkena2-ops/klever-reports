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
  function timeOf(v) { return v && v.toDate ? v.toDate() : new Date(Date.now() + (window.KLEVER_SKEW || 0)); }

  /* A filing the Chairman moved to another day (/moves, apps-script/Moves.js,
     17 Oct 2026: Getachew's Friday report came on Saturday). Read once a page
     load — one person's own, or all of them for the Chairman — and every
     filing handed out below counts at the time it was moved to. */
  var movesP = {}, codeBookP = null;
  function movesFor(person) {
    var k = person || '*';
    if (!movesP[k]) movesP[k] = ready.then(function () {
      if (!db || !user) return {};
      var q = person ? F.query(F.collection(db, 'moves'), F.where('person', '==', person)) : F.collection(db, 'moves');
      return F.getDocs(q).then(function (snap) {
        var m = {};
        snap.forEach(function (d) { var x = d.data(); if (x && x.asAt && x.asAt.toDate) m[d.id] = x; });
        return m;
      });
    })['catch'](function () { delete movesP[k]; return {}; });
    return movesP[k];
  }
  function movedAt(m, id, x, at) {
    var mv = m && m[id];
    return mv && mv.person === x.person && mv.report === x.report ? mv.asAt.toDate() : at;
  }

  /* what one person adding faces may do, with their own sign-in */
  function faceSession(dbx, u, end) {
    return {
      who: idOf(u),
      saveFace: function (person, name, descr, photo) {
        return F.setDoc(F.doc(dbx, 'faces', person), {
          person: person, name: String(name || person).slice(0, 80), descr: descr.slice(0, 12),
          photo: photo || '', n: descr.length, by: idOf(u), at: F.serverTimestamp()
        });
      },
      deleteFace: function (person) { return F.deleteDoc(F.doc(dbx, 'faces', person)); },
      token: function () { return u.getIdToken(); },
      end: end
    };
  }

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
      return ready.then(function () {
        if (!auth) return;
        /* this phone's notifications go with the person signing out: the
           next person to sign in here got them too (the bug hunt, 15 Oct 2026) */
        return pushForget().then(function () { return F.signOut(auth); });
      });
    },

    /* Reports or photos written on this phone that the server has not got
       yet: signing out keeps them in this person's queue on this phone, to go
       only when they sign in here again (the bug hunt, 15 Oct 2026) */
    unsent: function () {
      return ready.then(function () {
        if (!db || !user) return 0;
        var n = 0, done = false;
        try { n = (JSON.parse(localStorage.getItem('klever.pending') || '[]') || []).length; } catch (e) {}
        return Promise.race([
          F.waitForPendingWrites(db).then(function () { done = true; }),
          new Promise(function (r) { setTimeout(r, 2500); })
        ]).then(function () { return done ? 0 : Math.max(n, 1); });
      })['catch'](function () { return 0; });
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
        /* who it is for, besides the Chairman: they read it on their home
           page (reports are not posted in chat since 13 Oct 2026) */
        to:      (row.to || []).slice(0, 6),
        at:      F.serverTimestamp()
      });
    },

    /* The reports sent to me, newest first: the last 40, kept current. */
    watchReportsToMe: function (cb) {
      return later(function () {
      if (!user) return null;
      var q = F.query(F.collection(db, 'reports'), F.where('to', 'array-contains', idOf(user)),
                      F.orderBy('at', 'desc'), F.limit(40));
      return F.onSnapshot(q, function (snap) {
        var out = [];
        snap.forEach(function (d) { var x = d.data({ serverTimestamps: 'estimate' }); x.id = d.id; out.push(x); });
        cb(out);
      }, function () { cb([]); });
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
            out.push({ id: d.id, report: x.report, person: x.person, by: x.by, at: timeOf(x.at),
                       pending: d.metadata.hasPendingWrites });
          });
          movesFor(person).then(function (m) {
            out.forEach(function (f) { f.at = movedAt(m, f.id, f, f.at); });
            cb(out);
          });
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
        return Promise.all([F.getDocs(q), movesFor(person)]).then(function (got) {
          var out = [], m = got[1];
          got[0].forEach(function (d) {
            var x = d.data({ serverTimestamps: 'estimate' });
            out.push({ report: x.report, person: x.person,
                       at: movedAt(m, d.id, x, timeOf(x.at)).getTime(), values: x.values || {} });
          });
          return out;
        });
      });
    },

    /* A photo added in a report (the "Site photos" question, js/app.js
       photoField): one picture message in the room the report goes to, the
       same shape the chat itself sends, so it shows there like any other
       photo. `img` is what media.js shrinkImage hands back. */
    postPhoto: function (channelId, img, text, lang) {
      if (!db || !user) return Promise.reject(new Error('not signed in'));
      return F.addDoc(F.collection(db, 'channels', channelId, 'messages'), {
        who: idOf(user),
        text: String(text || '').slice(0, 4000),
        lang: lang === 'am' ? 'am' : 'en',
        kind: 'image',
        media: img.data,
        mime: 'image/jpeg',
        w: img.w,
        h: img.h,
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

    /* The days my collections did not match the salespeople's
       (apps-script/Money.js), and the fixes I have sent for them:
       cb(moneyfix docs, my fixes). */
    watchMyMoneyFix: function (cb) {
      return later(function () {
      if (!user) return null;
      var docs = null, mine = null;
      function both() { if (docs && mine) cb(docs, mine); }
      var a = F.onSnapshot(F.query(F.collection(db, 'moneyfix'), F.where('to', '==', idOf(user))), function (snap) {
        docs = [];
        snap.forEach(function (d) { var x = d.data(); x.id = d.id; docs.push(x); });
        both();
      }, function () { docs = []; both(); });
      var b = F.onSnapshot(F.query(F.collection(db, 'fixes'), F.where('person', '==', idOf(user))), function (snap) {
        mine = [];
        snap.forEach(function (d) { var x = d.data({ serverTimestamps: 'estimate' }); x.id = d.id; mine.push(x); });
        both();
      }, function () { mine = []; both(); });
      return function () { a(); b(); };
      });
    },
    /* The salespeople's payments waiting for me to say whether I issued
       their receipts (apps-script/Receipts.js), and the answers I have
       sent: cb(rcptcheck docs, my answers). */
    watchMyReceipts: function (cb) {
      return later(function () {
      if (!user) return null;
      var docs = null, mine = null;
      function both() { if (docs && mine) cb(docs, mine); }
      var a = F.onSnapshot(F.query(F.collection(db, 'rcptcheck'), F.where('to', '==', idOf(user))), function (snap) {
        docs = [];
        snap.forEach(function (d) { var x = d.data(); x.id = d.id; docs.push(x); });
        both();
      }, function () { docs = []; both(); });
      var b = F.onSnapshot(F.query(F.collection(db, 'rcptok'), F.where('person', '==', idOf(user))), function (snap) {
        mine = [];
        snap.forEach(function (d) { var x = d.data({ serverTimestamps: 'estimate' }); x.id = d.id; mine.push(x); });
        both();
      }, function () { mine = []; both(); });
      return function () { a(); b(); };
      });
    },
    /* The months' payroll the Chairman approved, for Selam to pay
       (apps-script/Payroll.js): cb(docs), newest month first. Anyone else
       is refused by the rules and gets []. */
    watchPayrollToPay: function (cb) {
      return later(function () {
      if (!user) return null;
      return F.onSnapshot(F.query(F.collection(db, 'payroll'), F.where('status', '==', 'approved')), function (snap) {
        var out = [];
        snap.forEach(function (d) { var x = d.data({ serverTimestamps: 'estimate' }); x.id = d.id; out.push(x); });
        out.sort(function (a, b) { return a.month < b.month ? 1 : -1; });
        cb(out);
      }, function () { cb([]); });
      });
    },
    /* My check-ins at the office door from a day on (apps-script/Attend.js):
       cb(docs). The scans are the script's; my reasons are mine. */
    watchMyAttend: function (fromDay, cb) {
      return later(function () {
      if (!user) return null;
      return F.onSnapshot(F.query(F.collection(db, 'attend'), F.where('person', '==', idOf(user))), function (snap) {
        var out = [];
        snap.forEach(function (d) { var x = d.data({ serverTimestamps: 'estimate' }); x.id = d.id; if (x.day >= fromDay) out.push(x); });
        cb(out);
      }, function () { cb([]); });
      });
    },
    /* Why I did not scan, or came late, for one day */
    saveAttendWhy: function (day, why, note, exists) {
      if (!db || !user) return Promise.reject(new Error('not signed in'));
      var me = idOf(user), ref = F.doc(db, 'attend', day + '_' + me);
      var x = { why: why, note: String(note || '').slice(0, 300), whyAt: F.serverTimestamp() };
      /* someone who checks in at the factory gate: the reason is the
         factory's, so Amaha's gate card reads it (bug hunt, 15 Oct 2026) */
      var P = (typeof PEOPLE !== 'undefined' ? PEOPLE : []).filter(function (p) { return p.id === me; })[0];
      var first = { person: me, day: day };
      if (P && P.gate && !P.scan) first.place = 'factory';
      return exists ? F.updateDoc(ref, x) : F.setDoc(ref, Object.assign(first, x));
    },
    /* THE FACTORY GATE (gate.html, js/gate.js, apps-script/Gate.js) */
    /* the faces the gate knows: cb([{person, name, descr, photo, n}]), or
       cb(null) when they cannot be read */
    watchFaces: function (cb) {
      return later(function () {
      if (!user) return null;
      return F.onSnapshot(F.collection(db, 'faces'), function (snap) {
        var out = [];
        snap.forEach(function (d) { var x = d.data({ serverTimestamps: 'estimate' }); x.person = x.person || d.id; out.push(x); });
        cb(out);
      }, function () { cb(null); });
      });
    },
    /* THE PRODUCTION TEAM AS AMAHA KEEPS IT (the user, 17 Oct 2026: "for
       the production team, can Amaha add new persons by himself"). The
       workers in js/forms.js are the code's; Amaha (or the Chairman) adds
       one on his page — /workers/wk-… — and marks any worker as left with
       the last day worked — /workersLeft/{id}. Decided that day: an added
       worker counts at once (his lists, the gate) and the Chairman is told;
       a left worker goes from the day after. Neither is a wage or a rule:
       the payroll stays the Sheet's, the rulebook the code's.
       cb({added: [docs], left: {id: {left, by, at}}}), or cb(null) when not
       readable (anyone but Amaha, the Chairman, the gate and the script). */
    watchWorkers: function (cb) {
      return later(function () {
      if (!user) return null;
      var added = null, left = null;
      function both() { if (added && left) cb({ added: added, left: left }); }
      var a = F.onSnapshot(F.collection(db, 'workers'), function (snap) {
        added = [];
        snap.forEach(function (d) { var x = d.data({ serverTimestamps: 'estimate' }); x.id = d.id; added.push(x); });
        both();
      }, function () { cb(null); });
      var b = F.onSnapshot(F.collection(db, 'workersLeft'), function (snap) {
        left = {};
        snap.forEach(function (d) { left[d.id] = d.data({ serverTimestamps: 'estimate' }); });
        both();
      }, function () { cb(null); });
      return function () { a(); b(); };
      });
    },
    /* a new worker: {en, am, roleEn, roleAm, from, phone} — its id made
       from the name, never one taken (`taken`: the ids already in use) */
    addWorker: function (w, taken) {
      if (!db || !user) return Promise.reject(new Error('not signed in'));
      var base = 'wk-' + (String(w.en || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'worker');
      var id = base, n = 2;
      while (taken && taken[id]) id = base + '-' + (n++);
      var x = { en: String(w.en || '').trim().slice(0, 80), roleEn: String(w.roleEn || '').trim().slice(0, 60),
                from: String(w.from || ''), by: idOf(user), at: F.serverTimestamp() };
      if (String(w.am || '').trim()) x.am = String(w.am).trim().slice(0, 80);
      if (String(w.roleAm || '').trim()) x.roleAm = String(w.roleAm).trim().slice(0, 60);
      if (String(w.phone || '').trim()) x.phone = String(w.phone).replace(/[^0-9+ ]/g, '').slice(0, 20);
      return F.setDoc(F.doc(db, 'workers', id), x).then(function () { return id; });
    },
    /* the last day a worker worked ('' takes it back) */
    setWorkerLeft: function (id, day) {
      if (!db || !user) return Promise.reject(new Error('not signed in'));
      return F.setDoc(F.doc(db, 'workersLeft', id), { left: String(day || ''), by: idOf(user), at: F.serverTimestamp() });
    },
    /* the Chairman: a worker added by mistake (kept, marked) */
    removeWorker: function (id) {
      if (!db || !user) return Promise.reject(new Error('not signed in'));
      return F.updateDoc(F.doc(db, 'workers', id), { removed: true, removedBy: 'chairman', removedAt: F.serverTimestamp() });
    },
    /* Everyone at the factory gate, as people: the code's (`gate` in PEOPLE,
       no company) and the workers added on Amaha's page (not removed), each
       with `from` and `left` — the day they started and the last day they
       worked, when known. `wk` is watchWorkers's answer (or null). */
    gateTeam: function (wk) {
      var left = (wk && wk.left) || {}, out = [], have = {};
      (typeof PEOPLE !== 'undefined' ? PEOPLE : []).forEach(function (p) {
        if (!p.gate || p.company) return;
        var q = Object.assign({}, p);
        if (p.worker && left[p.id] && left[p.id].left) q.left = left[p.id].left;
        have[p.id] = 1;
        out.push(q);
      });
      ((wk && wk.added) || []).forEach(function (w) {
        if (w.removed || have[w.id] || !/^wk-[a-z0-9-]+$/.test(w.id)) return;
        have[w.id] = 1;
        out.push({ id: w.id, en: w.en, am: w.am || w.en, roleEn: w.roleEn, roleAm: w.roleAm || w.roleEn, grp: 'production',
                   gate: 1, worker: 1, added: 1, from: w.from || null, left: (left[w.id] && left[w.id].left) || null,
                   by: w.by, at: w.at, phone: w.phone || '' });
      });
      return out;
    },
    /* at the factory on `day`: started, and not past the last day worked */
    onTeam: function (p, day) {
      return !!p && !(p.from && day < p.from) && !(p.left && day > p.left);
    },
    /* the day the gate is counted from: cb('yyyy-mm-dd' | null) */
    /* the Chairman's changes to the holidays (forms.js HOLIDAYS):
       cb({add:[{d,en,am}], remove:[d]}), or cb(null) when not readable */
    watchHolidays: function (cb) {
      return later(function () {
      if (!user) return null;
      return F.onSnapshot(F.doc(db, 'holidays', 'klever'), function (d) {
        var x = d.exists() ? d.data() : {};
        cb({ add: Array.isArray(x.add) ? x.add : [], remove: Array.isArray(x.remove) ? x.remove : [] });
      }, function () { cb(null); });
      });
    },
    saveHolidays: function (x) {
      if (!db || !user) return Promise.reject(new Error('not signed in'));
      return F.setDoc(F.doc(db, 'holidays', 'klever'), {
        add: (x.add || []).slice(0, 60).map(function (h) { return { d: String(h.d), en: String(h.en || '').slice(0, 60), am: String(h.am || h.en || '').slice(0, 60) }; }),
        remove: (x.remove || []).slice(0, 60).map(String),
        by: idOf(user), at: F.serverTimestamp()
      });
    },
    watchGateConf: function (cb) {
      return later(function () {
      if (!user) return null;
      return F.onSnapshot(F.doc(db, 'gateconf', 'factory'), function (d) {
        var x = d.exists() ? d.data() : null;
        cb(x && x.from ? x.from : null);
      }, function () { cb(null); });
      });
    },
    /* Adding faces. On the gate's tablet the Chairman or Amaha signs in
       beside the gate's own sign-in, which stays: a second Firebase app,
       kept in memory only, gone with the page. On their own phone it is
       their own sign-in. Either way: { who, saveFace, deleteFace, token, end } */
    enrolAs: function (id, password) {
      return ready.then(function () {
        if (!auth) throw new Error('offline');
        var app2 = F.getApps().filter(function (a) { return a.name === 'enrol'; })[0] || F.initializeApp(FIREBASE_CONFIG, 'enrol');
        var auth2;
        try { auth2 = F.initializeAuth(app2, { persistence: F.inMemoryPersistence }); }
        catch (e) { auth2 = F.getAuth(app2); }
        var db2 = F.getFirestore(app2);
        return F.signInWithEmailAndPassword(auth2, id + '@' + KLEVER_DOMAIN, password).then(function (cred) {
          return faceSession(db2, cred.user, function () { return F.signOut(auth2); });
        });
      });
    },
    enrolSelf: function () {
      if (!db || !user) return null;
      return faceSession(db, user, function () { return Promise.resolve(); });
    },
    /* Amaha's page: the gate's days from a day on: cb(docs) */
    watchFactory: function (fromDay, cb) {
      return later(function () {
      if (!user) return null;
      return F.onSnapshot(F.query(F.collection(db, 'attend'), F.where('place', '==', 'factory'), F.where('day', '>=', fromDay)), function (snap) {
        var out = [];
        snap.forEach(function (d) { var x = d.data({ serverTimestamps: 'estimate' }); x.id = d.id; out.push(x); });
        cb(out);
      }, function () { cb(null); });
      });
    },
    /* the pictures taken at the gate on one day: cb({person: dataUrl}) */
    watchGatePhotos: function (day, cb) {
      return later(function () {
      if (!user) return null;
      return F.onSnapshot(F.query(F.collection(db, 'gatephoto'), F.where('day', '==', day)), function (snap) {
        var out = {};
        snap.forEach(function (d) { var x = d.data(); out[d.id.slice(11)] = x.photo; });
        cb(out);
      }, function () { cb({}); });
      });
    },
    /* one picture from the gate, or null */
    gatePhoto: function (day, person) {
      if (!db || !user) return Promise.resolve(null);
      return F.getDoc(F.doc(db, 'gatephoto', day + '_' + person)).then(function (d) {
        return d.exists() ? d.data().photo || null : null;
      })['catch'](function () { return null; });
    },
    /* Amaha says why a worker (no phone) did not come, or came late */
    saveGateWhy: function (person, day, why, note, exists) {
      if (!db || !user) return Promise.reject(new Error('not signed in'));
      var ref = F.doc(db, 'attend', day + '_' + person);
      var x = { why: why, note: String(note || '').slice(0, 300), whyAt: F.serverTimestamp(), whyBy: idOf(user) };
      return exists ? F.updateDoc(ref, x) : F.setDoc(ref, Object.assign({ person: person, day: day, place: 'factory' }, x));
    },
    /* after looking at the picture: it is them (true) or not (false) */
    checkGate: function (person, day, isThem) {
      if (!db || !user) return Promise.reject(new Error('not signed in'));
      return F.updateDoc(F.doc(db, 'attend', day + '_' + person),
                         { check: isThem ? 'ok' : 'not', checkBy: idOf(user), checkAt: F.serverTimestamp() });
    },
    /* The payroll months still open for what only Selam knows — overtime,
       loans, advances, cost sharing, court (apps-script/Payroll.js):
       cb(docs). Refused for anyone else by the rules: []. */
    watchPayAdd: function (cb) {
      return later(function () {
      if (!user) return null;
      return F.onSnapshot(F.query(F.collection(db, 'payadd'), F.where('open', '==', true)), function (snap) {
        var out = [];
        snap.forEach(function (d) { var x = d.data({ serverTimestamps: 'estimate' }); x.id = d.id; out.push(x); });
        cb(out);
      }, function () { cb([]); });
      });
    },
    /* Her list for one month, whole: { personId: {ot15, …, court} } */
    savePayAdd: function (month, items) {
      if (!db || !user) return Promise.reject(new Error('not signed in'));
      return F.updateDoc(F.doc(db, 'payadd', month), { items: items, by: idOf(user), at: F.serverTimestamp() });
    },
    /* The jobs the script asks me about (apps-script/JobMoney.js — the
       money on each job, 14 Oct 2026): {to, kind, items:[{code, cust, m2}]},
       or null when there is nothing. */
    /* my filings moved to another day, by filing id: {from, to, asAt, …} */
    myMoves: function () { return ready.then(function () { return user ? movesFor(idOf(user)) : {}; }); },

    /* The code book (apps-script/Register.js, 17 Oct 2026): every KK and RBT
       job and every lead no. the reports have named, with its customer —
       {jobs: {'KK-212': {c, l, x}}, leads: {'0338': {c, j}}} — or null.
       Read once a page load; a refused or failed read is null, and asked
       again next time. */
    codeBook: function () {
      if (!codeBookP) codeBookP = ready.then(function () {
        if (!db || !user) { codeBookP = null; return null; }
        return F.getDoc(F.doc(db, 'register', 'codes')).then(function (d) { return d.exists() ? d.data() : null; });
      })['catch'](function () { codeBookP = null; return null; });
      return codeBookP;
    },

    myJobAsk: function () {
      return ready.then(function () {
        if (!db || !user) return null;
        return F.getDoc(F.doc(db, 'jobask', idOf(user))).then(function (d) {
          return d.exists() ? d.data() : null;
        })['catch'](function () { return null; });
      });
    },
    /* My answer for one day: what was really collected, payment by
       payment, and the day's list as it now stands. Filed, never changed. */
    fileMoneyFix: function (fix) {
      if (!db || !user) return Promise.reject(new Error('not signed in'));
      return F.addDoc(F.collection(db, 'fixes'), {
        day: fix.day, person: idOf(user), by: idOf(user),
        items: fix.items, list: fix.list, total: fix.total,
        at: F.serverTimestamp()
      });
    },

    /* My answers for one day's payments: issued, a different amount, or
       no such receipt. Filed, never changed. */
    fileReceipts: function (r) {
      if (!db || !user) return Promise.reject(new Error('not signed in'));
      return F.addDoc(F.collection(db, 'rcptok'), {
        day: r.day, person: idOf(user), by: idOf(user), items: r.items,
        at: F.serverTimestamp()
      });
    },
    /* A payment slip's photo, from a salesperson's payment row (the user,
       15 Oct 2026). Its id is known at once — with no signal the photo waits
       on the phone and goes later, and the row already names it — and
       `done` settles when the server has it. Read back by Selam and the
       Chairman by id. */
    postSlip: function (img, day) {
      if (!db || !user) throw new Error('not signed in');
      var ref = F.doc(F.collection(db, 'slips'));
      var done = F.setDoc(ref, {
        person: idOf(user), day: day, media: img.data, mime: 'image/jpeg',
        w: img.w, h: img.h, at: F.serverTimestamp()
      });
      return { id: ref.id, done: done };
    },
    /* one slip's picture, or null */
    getSlip: function (id) {
      if (!db || !user) return Promise.resolve(null);
      return F.getDoc(F.doc(db, 'slips', id)).then(function (d) {
        return d.exists() ? d.data().media || null : null;
      })['catch'](function () { return null; });
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
  /* at sign-out: this person's address for this phone is removed; offline,
     the removal waits in the cache and sign-out does not wait for it (the
     server keeps the newest owner of an address, Push.js) */
  function pushForget() {
    var saved = null;
    try { saved = localStorage.getItem(PUSH_KEY); localStorage.removeItem(PUSH_KEY); } catch (e) {}
    if (!saved || !db || !user || saved.indexOf(idOf(user) + '_') !== 0) return Promise.resolve();
    var gone = F.deleteDoc(F.doc(db, 'pushTokens', saved))['catch'](function () {});
    return Promise.race([gone, new Promise(function (r) { setTimeout(r, 2500); })]);
  }
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
      /* only the person who turned them on here: another person signed in
         on the same phone was signed up without a tap (bug hunt, 15 Oct 2026) */
      if (user && pushSupported() && Notification.permission === 'granted' &&
          String(localStorage.getItem(PUSH_KEY) || '').indexOf(idOf(user) + '_') === 0) {
        window.FB.pushEnable(true)['catch'](function () {});
      }
    } catch (e) {}
  });
})();
