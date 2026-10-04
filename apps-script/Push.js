/* Klever — the Chairman's instructions, to the person's phone.

   HOW A NOTIFICATION TRAVELS
   A person turns notifications on once, on each phone (js/fb.js): the phone's
   address — a Firebase Cloud Messaging token — is saved in /pushTokens under
   their own name. When the Chairman gives an instruction (by hand, or by
   pressing Send on an order), his page posts its id here (Code.js doPost,
   kind 'notify'); this script reads the instruction back from Firestore — what
   is there, not what the post says — and sends one notification to each of
   that person's phones through Firebase Cloud Messaging. A tap opens the
   site, where the instruction is waiting on their home page.

   Each instruction is sent once: /pushlog/{instruction id} says it was, and
   to how many phones. If the post from his page is lost, the ten-minute
   watch sends any instruction of the last hour that has no line there yet.
   A phone's address that has stopped working (the person cleared the site,
   or uninstalled the browser) is deleted, so it is not tried again.

   SENDING NEEDS ONE PERMISSION
   Firebase Cloud Messaging is called with the script owner's own Google
   sign-in, which needs the "firebase.messaging" permission listed in
   appsscript.json. Run authorizePush() once from the editor after it is
   added; until then every send fails, says so in /pushlog, and nothing else
   is affected. */

var PUSH_TEST_CAP_ = 5;                 /* test notifications a person may ask for a day */
var PUSH_WATCH_BACK_MS_ = 60 * 60 * 1000;

/* From the editor, once: grants the permission, then proves it with a call
   to Firebase that sends nothing (validate only). */
function authorizePush() {
  var r = fcmSend_({ token: 'not-a-real-phone', notification: { title: 'test', body: 'validate only' } }, true);
  var ok = r.code === 400 && /registration token/i.test(r.text);
  Logger.log(ok ? 'Notifications can be sent. Done.' : 'Not yet: HTTP ' + r.code + ' ' + r.text.substring(0, 300));
  return ok;
}

/* One message to Firebase Cloud Messaging. */
function fcmSend_(message, validateOnly) {
  var project = prop_('FIREBASE_PROJECT', 'klever-26ad1');
  var res = UrlFetchApp.fetch('https://fcm.googleapis.com/v1/projects/' + project + '/messages:send', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'x-goog-user-project': project },
    payload: JSON.stringify(validateOnly ? { validate_only: true, message: message } : { message: message })
  });
  return { code: res.getResponseCode(), text: res.getContentText() };
}

/* Every phone a person turned notifications on for. */
function pushTokensOf_(person) {
  return tryQuery_('pushTokens', [['person', 'EQUAL', person]], null);
}

/* Remove a phone's address that no longer works. */
function fsDelete_(path) {
  UrlFetchApp.fetch(fsBase_() + '/documents/' + path, {
    method: 'delete', headers: { Authorization: 'Bearer ' + fsToken_() }, muteHttpExceptions: true
  });
}

/* Send one notification to each of a person's phones. Returns {sent, failed,
   phones, error}: `error` is the first reason a send failed. */
function pushTo_(person, title, body, tag) {
  var site = prop_('SITE', AGENT_DEFAULT_SITE);
  var phones = pushTokensOf_(person);
  var out = { phones: phones.length, sent: 0, failed: 0, error: '' };
  phones.forEach(function (p) {
    var r = fcmSend_({
      token: p.t,
      notification: { title: String(title).substring(0, 120), body: String(body).substring(0, 400) },
      webpush: {
        notification: { icon: site + 'assets/icon-192.png', tag: tag || undefined },
        fcm_options: { link: site }
      }
    });
    if (r.code === 200) { out.sent++; return; }
    out.failed++;
    if (!out.error) out.error = 'HTTP ' + r.code + ': ' + r.text.substring(0, 200);
    /* this phone's address has gone: the person cleared the site or the browser */
    if (r.code === 404 || /UNREGISTERED|registration token is not a valid/i.test(r.text)) {
      try { fsDelete_('pushTokens/' + p._id); } catch (e) {}
    }
  });
  return out;
}

/* "Fri 9 Oct" */
function pushDay_(day) {
  return Utilities.formatDate(new Date(day + 'T12:00:00' + ADDIS_), tz_(), 'EEE d MMM');
}

/* One instruction to its person's phones, once. True if this run sent it. */
function notifyInstruction_(id) {
  if (!/^[A-Za-z0-9_-]{6,40}$/.test(String(id || ''))) return false;
  if (fsGet_('pushlog/' + id)) return false;
  var ins = fsGet_('instructions/' + id);
  if (!ins || ins.status !== 'open' || !ins.to) return false;
  var cache = CacheService.getScriptCache();
  if (cache.get('push:' + id)) return false;           /* being sent right now */
  cache.put('push:' + id, '1', 600);
  var r = pushTo_(ins.to, 'Klever · Instruction from the Chairman · የሊቀመንበሩ መመሪያ',
                  String(ins.text || '') + (ins.due ? ' — by ' + pushDay_(ins.due) : ''), 'ins-' + id);
  fsPut_('pushlog/' + id, { ins: id, to: ins.to, at: new Date(), phones: r.phones, sent: r.sent,
                            failed: r.failed, error: r.error });
  return true;
}

/* From doPost: the instructions his page just gave, by id. */
function notifyPost_(ids) {
  var list = String(ids || '').split(',').slice(0, 6);
  if (!list.length || !list.every(function (x) { return /^[A-Za-z0-9_-]{6,40}$/.test(x); })) return 'refused';
  var n = 0;
  list.forEach(function (id) {
    try { if (notifyInstruction_(id)) n++; } catch (e) { Logger.log('notify %s: %s', id, e.message); }
  });
  return 'ok ' + n;
}

/* The ten-minute watch's part: an instruction of the last hour that no line
   in /pushlog says was sent — his page's post never arrived. */
function notifyWaiting_() {
  try {
    var since = new Date(new Date().getTime() - PUSH_WATCH_BACK_MS_);
    tryQuery_('instructions', [['at', 'GREATER_THAN_OR_EQUAL', since]], 'at')
      .filter(function (i) { return i.status === 'open'; })
      .slice(0, 10)
      .forEach(function (i) {
        try { notifyInstruction_(i._id); } catch (e) { Logger.log('notify %s: %s', i._id, e.message); }
      });
  } catch (e) {
    Logger.log('notifyWaiting: %s', e.message);
  }
}

/* "Send me a test", from a person's own page: to their own phones only. */
function pushTestPost_(person) {
  var cache = CacheService.getScriptCache();
  var key = 'pushtest:' + person + ':' + todayAddis_();
  var n = Number(cache.get(key) || 0);
  if (n >= PUSH_TEST_CAP_) return 'too many';
  cache.put(key, String(n + 1), 86400);
  var r = pushTo_(person, 'Klever · Test · ሙከራ',
                  'Notifications work on this phone. ማሳወቂያ በዚህ ስልክ ይሠራል።', 'test');
  try {
    fsPut_('pushlog/test-' + person, { test: true, to: person, at: new Date(), phones: r.phones, sent: r.sent,
                                       failed: r.failed, error: r.error });
  } catch (e) {}
  return r.phones ? 'ok ' + r.sent : 'no phones';
}
