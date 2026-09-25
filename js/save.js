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

  file: function (row) {
    if (!this.on()) return;
    row.k = row.k || Math.random().toString(36).slice(2) + Date.now().toString(36);
    var box = this.read();
    box.push(row);
    this.write(box);
    this.flush();
  },

  remove: function (k) {
    this.write(this.read().filter(function (r) { return r.k !== k; }));
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
    token.then(function (tok) {
      /* not signed in (yet): the rows wait, they are not thrown away */
      if (!tok) return;
      return Promise.all(box.map(function (row) {
        if (!row.k) { row.k = Math.random().toString(36).slice(2); }
        var body = JSON.parse(JSON.stringify(row));
        body.idToken = tok;
        return self.post(body).then(function () { self.remove(row.k); }, function () { /* next time */ });
      }));
    })['catch'](function () {}).then(function () {
      self.busy = false;
      if (self.again) { self.again = false; self.flush(); }
    });
  },

  post: function (row) {
    /* text/plain keeps the browser from sending a preflight Apps Script
       cannot answer; no-cors means we never see the reply, only whether the
       request left the phone. keepalive lets a small row finish leaving
       even as the page closes (browsers cap it at 64 KB). */
    var body = JSON.stringify(row);
    return fetch(SAVE_URL, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: body.length < 60000,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: body
    });
  }
};

window.addEventListener('online', function () { ARCHIVE.flush(); });
