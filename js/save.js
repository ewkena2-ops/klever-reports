/* Where a sent report goes to be kept.

   The site has no server. SAVE_URL points at a Google Apps Script web app
   sitting on the Chairman's spreadsheet — see docs/google-sheet.md. Leave it
   empty and nothing is filed anywhere: the report still goes to WhatsApp, the
   site just keeps no copy.

   Phones lose signal on site. So every row goes into an outbox on the phone
   first, and leaves it only once it has been posted — not before, or a page
   closed in the second after Send lost it for good. What is left goes out
   the next time the app is opened, or the moment the signal comes back.

   Each row carries the sender's sign-in token, fetched fresh as it goes, and
   a key of its own. The script checks the token (who is this, really?) and
   drops a key it has already had, so a row posted twice is filed once. */

const SAVE_URL = 'https://script.google.com/macros/s/AKfycbyxT8VZ4F3mI1c9bJ-88vtiZTgKQiADksJPi4WqdiW1yniv1k0SOTFNR9PxsHITrWuO/exec';

var ARCHIVE = {
  BOX: 'klever.outbox',

  on: function () { return !!SAVE_URL; },

  read: function () {
    try { return JSON.parse(localStorage.getItem(this.BOX) || '[]'); } catch (e) { return []; }
  },
  write: function (box) {
    try { localStorage.setItem(this.BOX, JSON.stringify(box.slice(-100))); } catch (e) {}
  },
  waiting: function () { return this.read().length; },

  /* who is signed in on this phone now ('' before sign-in) */
  me: function () {
    try { return window.AUTH && AUTH.who ? String(AUTH.who() || '') : ''; } catch (e) { return ''; }
  },

  file: function (row) {
    if (!this.on()) return;
    row.k = row.k || Math.random().toString(36).slice(2) + Date.now().toString(36);
    /* whose row: on a shared phone each row goes with its own filer's
       token, never the next person's (the bug hunt, 15 Oct 2026) */
    if (!row.filer) row.filer = this.me();
    var box = this.read();
    box.push(row);
    this.write(box);
    this.flush();
  },

  remove: function (k) {
    this.write(this.read().filter(function (r) { return r.k !== k; }));
  },
  /* a row the script did not take: tried again later, 25 times at most */
  retryLater: function (k) {
    this.write(this.read().map(function (r) {
      if (r.k === k) r.tries = (r.tries || 0) + 1;
      return r;
    }).filter(function (r) { return (r.tries || 0) < 25; }));
  },

  /* called on every page load and whenever the signal returns */
  busy: false, again: false,
  flush: function () {
    if (!this.on()) return;
    var self = this;
    if (this.busy) { this.again = true; return; }
    var box = this.read();
    if (!box.length) return;
    this.busy = true;
    var token = (window.FB && window.FB.token) ? window.FB.token() : Promise.resolve(null);
    var who = this.me();
    token.then(function (tok) {
      /* not signed in (yet): the rows wait, they are not thrown away */
      if (!tok) return;
      self.lastTok = tok;
      return Promise.all(box.filter(function (row) {
        /* another person's rows wait for them to sign in here again */
        return !row.filer || row.filer === who;
      }).map(function (row) {
        if (!row.k) { row.k = Math.random().toString(36).slice(2); }
        var body = JSON.parse(JSON.stringify(row));
        delete body.filer; delete body.tries;
        body.idToken = tok;
        /* only the script's own "ok" (or a "refused", which no retry
           mends) takes a row out: a "busy" or an error page left it lost
           for good (the bug hunt, 15 Oct 2026) */
        return self.post(body).then(function (r) { return r.text(); }).then(function (txt) {
          txt = String(txt || '').trim();
          if (txt === 'ok' || txt === 'refused') { self.remove(row.k); return; }
          self.retryLater(row.k);
        }, function () { self.retryLater(row.k); });
      }));
    })['catch'](function () {}).then(function () {
      self.busy = false;
      if (self.again) { self.again = false; self.flush(); }
    });
  },

  post: function (row) {
    /* text/plain keeps the browser from sending a preflight Apps Script
       cannot answer, and the script's reply is read (as gate.js does) */
    return fetch(SAVE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(row)
    });
  },

  /* the page is closing with rows still waiting: sent once more without
     waiting for the reply (keepalive lets a small row finish leaving); the
     script files a key once, so a row that also arrives later is not
     filed twice. They stay in the outbox until an "ok" is read. */
  last: function () {
    var tok = this.lastTok, who = this.me(), room = 60000;
    if (!this.on() || !tok) return;
    this.read().forEach(function (row) {
      if (row.filer && row.filer !== who) return;
      var body = JSON.parse(JSON.stringify(row));
      delete body.filer; delete body.tries;
      body.idToken = tok;
      var s = JSON.stringify(body);
      /* the browser's 64 KB for all of them together, in bytes: Amharic
         is three a letter (bug hunt, 15 Oct 2026) */
      var bytes = typeof Blob !== 'undefined' ? new Blob([s]).size : s.length * 3;
      if (bytes > room) return;
      room -= bytes;
      try {
        fetch(SAVE_URL, { method: 'POST', mode: 'no-cors', keepalive: true,
                          headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: s })['catch'](function () {});
      } catch (e) {}
    });
  }
};

window.addEventListener('online', function () { ARCHIVE.flush(); });
window.addEventListener('pagehide', function () { ARCHIVE.last(); });
