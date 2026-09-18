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
