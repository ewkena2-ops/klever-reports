/* The sign-in gate.

   This used to be six digits checked against a SHA-256 in this file. That was
   honest about what it was — "a lock on a door, not a safe" — and it did the
   job it was given: stop a stranger who finds the URL, stop one person filing
   as another *in the page*.

   It stopped being enough when the archive became evidence. The six digits
   never protected the endpoint, only the page, so a report could be filed by
   anyone who read js/save.js in this public repo. A ledger that fines people
   for what those rows say needs a record that names who wrote it and can
   prove it.

   So identity is now Firebase Authentication — the same accounts, and the
   same one password per person, as the chat. One person, one password, both
   halves of the site. The six-digit codes are retired; Klever-Access-Codes.txt
   keeps them only as history.

   This object's shape has not changed, so app.js calls it exactly as before.
   What changed is that who() is answered by Firebase rather than by
   localStorage, and that signIn() is asynchronous because checking a password
   properly means asking a server.                                           */

var AUTH = {
  /* the Chairman's account is chairman@klever.local; everywhere else in this
     codebase he is '*', so translate at the boundary and nowhere else */
  CHAIR_ID: 'chairman',

  _id: null,     /* set from Firebase before the first render */

  /* WHOSE PASSWORD IS THIS. Nobody picks their name: they type their
     password and the site works out whose it is.

     Each account is known here only by a tag — the first three hex
     characters of PBKDF2-SHA256(password, 'klever-who:v2', 100,000 rounds).
     Twelve bits: enough that eighteen people almost never share one (when
     two do, both accounts are tried). The tags are public, so someone could
     use them to sort guesses offline before trying them against Firebase;
     the 100,000 rounds are there to make that as slow for them as a sign-in
     is for a phone (a fraction of a second each), which turns an offline
     short-cut into years of work. The passwords themselves are not in this
     file and never will be; this file is in a public repository.

     A password changed, or a person added? Re-make this map from the
     private list with who_tags.py (kept outside the repository). */
  WHO: /* WHO-TAGS */ { '196': ['liu'], '1cf': ['chairman'], '326': ['ashenafi'], '32f': ['teklweld'], '33f': ['tsega'], '3c3': ['amaha'], '43f': ['yohannis'], '4c4': ['wude'], '599': ['yonas'], '821': ['biruktayet'], '825': ['yordanos'], '827': ['ephrata'], '896': ['abrham-g'], '8fb': ['abrham-w'], '963': ['seble'], 'a4f': ['betty'], 'b60': ['elyas'], 'f2a': ['getachew'] },

  /* the ids a password could belong to, most likely first */
  whoIs: function (password) {
    var self = this;
    var pw = String(password || '').trim();
    if (!pw || !window.crypto || !window.crypto.subtle || !window.TextEncoder) return Promise.resolve([]);
    /* a phone may capitalise the first letter; the passwords are lower case */
    var tries = [pw];
    if (pw.toLowerCase() !== pw) tries.push(pw.toLowerCase());
    var enc = new TextEncoder();
    return Promise.all(tries.map(function (p) {
      return window.crypto.subtle.importKey('raw', enc.encode(p), 'PBKDF2', false, ['deriveBits'])
        .then(function (key) {
          return window.crypto.subtle.deriveBits(
            { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode('klever-who:v2'), iterations: 100000 }, key, 16);
        })
        .then(function (buf) {
          var b = new Uint8Array(buf);
          var tag = ('0' + b[0].toString(16)).slice(-2) + ('0' + b[1].toString(16)).slice(-2).charAt(0);
          return (self.WHO[tag] || []).map(function (id) { return { id: id, pw: p }; });
        });
    })).then(function (lists) { return [].concat.apply([], lists); });
  },

  /* Sign in with the password alone. Resolves to the person's id, or
     rejects — and, as before, never says what was wrong beyond "no". */
  signInByPassword: function (password) {
    var self = this;
    if (!window.FB) return Promise.reject(new Error('offline'));
    /* Firebase loads after the page draws; a quick typist waits for it */
    return window.FB.ready.then(function () {
      if (!window.FB.live()) throw new Error('offline');
      return self.whoIs(password);
    }).then(function (cands) {
      if (!cands.length) throw new Error('unknown');
      var i = 0;
      function next() {
        return window.FB.signIn(cands[i].id, cands[i].pw).then(function (id) {
          return self._adopt(id);
        }, function (e) {
          i++;
          if (i < cands.length) return next();
          throw e;
        });
      }
      return next();
    });
  },

  _fromFb: function (id) {
    return id === this.CHAIR_ID ? '*' : id;
  },

  /* Called once at boot, and again whenever Firebase changes its mind about
     who is signed in (a sign-out in another tab, an expired session). */
  _adopt: function (id) {
    this._id = id ? this._fromFb(id) : null;
    return this._id;
  },

  who: function () { return this._id; },

  isChairman: function () { return this._id === '*'; },

  /* Resolves to the person's id, or rejects. The caller shows the error —
     never say which half was wrong. */
  signIn: function (personId, password) {
    var self = this;
    if (!window.FB || !window.FB.live()) {
      return Promise.reject(new Error('offline'));
    }
    return window.FB.signIn(personId, password).then(function (id) {
      return self._adopt(id);
    });
  },

  signOut: function () {
    this._id = null;
    return window.FB ? window.FB.signOut() : Promise.resolve();
  },

  /* the Chairman may open anyone's form; everyone else only their own */
  mayOpen: function (report) {
    var w = this.who();
    return w === '*' || (w !== null && report.person === w);
  }
};
