/* Where a sent report goes to be kept.

   The site has no server. SAVE_URL points at a Google Apps Script web app
   sitting on the Chairman's spreadsheet — see docs/google-sheet.md. Leave it
   empty and nothing is filed anywhere: the report still goes to WhatsApp, the
   site just keeps no copy.

   Phones lose signal on site. So a send that fails is not lost — it waits in
   an outbox on that phone and goes out the next time the app is opened with a
   working connection. */

const SAVE_URL = '';

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

  post: function (row) {
    /* text/plain keeps the browser from sending a preflight Apps Script
       cannot answer; no-cors means we never see the reply, only whether the
       request left the phone. */
    return fetch(SAVE_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(row)
    });
  },

  file: function (row) {
    if (!this.on()) return;
    var self = this;
    this.post(row)['catch'](function () {
      var box = self.read();
      box.push(row);
      self.write(box);
    });
  },

  /* called on every page load: anything stranded by a dead network goes now */
  flush: function () {
    if (!this.on()) return;
    var box = this.read();
    if (!box.length) return;
    var self = this;
    this.write([]);
    box.forEach(function (row) {
      self.post(row)['catch'](function () {
        var b = self.read();
        b.push(row);
        self.write(b);
      });
    });
  }
};
