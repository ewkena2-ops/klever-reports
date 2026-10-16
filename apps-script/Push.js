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
  return tryQuery_('pushTokens', [['person', 'EQUAL', person]], null).filter(function (p) {
    /* the same phone saved since by someone else who signed in on it is
       theirs now: the old owner's copy is removed, not sent to (the bug
       hunt, 15 Oct 2026) */
    if (!p.t) return false;
    var mine = p.at ? new Date(p.at).getTime() : 0;
    var later = tryQuery_('pushTokens', [['t', 'EQUAL', p.t]], null).filter(function (q) {
      return q.person !== person && q.at && new Date(q.at).getTime() > mine;
    });
    if (!later.length) return true;
    try { fsDelete_('pushTokens/' + p._id); } catch (e) {}
    return false;
  });
}

/* Remove a phone's address that no longer works. */
function fsDelete_(path) {
  UrlFetchApp.fetch(fsBase_() + '/documents/' + path, {
    method: 'delete', headers: { Authorization: 'Bearer ' + fsToken_() }, muteHttpExceptions: true
  });
}

/* Send one notification to each of a person's phones. Returns {sent, failed,
   phones, error}: `error` is the first reason a send failed. */
/* `page`: where a tap opens, under the site (a customer on WhatsApp opens the
   chat); the site's front page if left out */
function pushTo_(person, title, body, tag, page) {
  var site = prop_('SITE', AGENT_DEFAULT_SITE);
  var phones = pushTokensOf_(person);
  var out = { phones: phones.length, sent: 0, failed: 0, error: '' };
  phones.forEach(function (p) {
    var r = fcmSend_({
      token: p.t,
      notification: { title: String(title).substring(0, 120), body: String(body).substring(0, 400) },
      webpush: {
        notification: { icon: site + 'assets/icon-192.png', tag: tag || undefined },
        fcm_options: { link: site + (page || '') }
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
/* An alert's id is up to 120 characters ('al-<report>-<day>-<kind>-<person>',
   Owners.js alertOnce_): held to 40, Getachew's, Biruktayet's and Ephrata's
   copies never rang (the bug hunt, 15 Oct 2026). The characters allowed
   still keep a path out. */
var PUSH_ID_RE_ = /^[A-Za-z0-9_-]{6,120}$/;
function notifyInstruction_(id) {
  if (!PUSH_ID_RE_.test(String(id || ''))) return false;
  if (fsGet_('pushlog/' + id)) return false;
  var ins = fsGet_('instructions/' + id);
  if (!ins || ins.status !== 'open' || !ins.to) return false;
  var cache = CacheService.getScriptCache();
  if (cache.get('push:' + id)) return false;           /* being sent right now */
  cache.put('push:' + id, '1', 600);
  var r = pushTo_(ins.to, ins.by === 'reminder' ? 'Klever · Reminder · ማስታወሻ'   /* Credit.js */
                       : ins.by === 'alert' ? 'Klever · Alert from your AI · ከAIዎ የመጣ ማንቂያ'   /* Owners.js, Vision.js */
                                            : 'Klever · Instruction from the Chairman · የሊቀመንበሩ መመሪያ',
                  String(ins.text || '') + (ins.due ? ' — by ' + pushDay_(ins.due) : ''), 'ins-' + id);
  fsPut_('pushlog/' + id, { ins: id, to: ins.to, at: new Date(), phones: r.phones, sent: r.sent,
                            failed: r.failed, error: r.error });
  return true;
}

/* From doPost: the instructions his page just gave, by id. */
/* The AI's morning list sends up to 20 at once (Team.js TEAM_MAX_TASKS_):
   only the first 6 used to ring (the bug hunt, 15 Oct 2026). */
function notifyPost_(ids) {
  var list = String(ids || '').split(',').slice(0, 20);
  if (!list.length || !list.every(function (x) { return PUSH_ID_RE_.test(x); })) return 'refused';
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
    /* up to ten sent a run — counted among those not sent yet, not the
       first ten of the hour: a batch with one time stamp kept handing back
       the same ten, and the rest never rang */
    var sent = 0;
    tryQuery_('instructions', [['at', 'GREATER_THAN_OR_EQUAL', since]], 'at')
      .filter(function (i) { return i.status === 'open'; })
      .forEach(function (i) {
        if (sent >= 10) return;
        try { if (notifyInstruction_(i._id)) sent++; } catch (e) { Logger.log('notify %s: %s', i._id, e.message); }
      });
  } catch (e) {
    Logger.log('notifyWaiting: %s', e.message);
  }
}

/* A REPORT THAT KEEPS NOT COMING (16 Oct 2026). Ephrata's Board Check was
   owed on 13, 14 and 15 Oct and never came; the user: "make her send it".
   A daily report with `remind` (forms.js, a time) rings its person's phones
   at that time on a day it is owed and not yet in — once that day, even
   when they have no phone to ring (Script Property REMIND_<report> holds the
   day done; /pushlog/remind-<report>-<day> what was sent). Their home page
   says the days it was not sent (js/app.js nagCard). */
function remindWatch_() {
  var day = todayAddis_();
  var now = Utilities.formatDate(new Date(), tz_(), 'HH:mm');
  var props = PropertiesService.getScriptProperties();
  var waiting = remindList_().filter(function (r) {
    return now >= r.remind && props.getProperty('REMIND_' + r.id) !== day;
  });
  if (!waiting.length) return;
  var owed = dueOn_({ reports: waiting }, day);
  waiting.forEach(function (r) {
    try {
      if (owed.indexOf(r) !== -1) remindOne_(r, day);
      props.setProperty('REMIND_' + r.id, day);
    } catch (e) { Logger.log('remind %s: %s', r.id, e.message); }
  });
}
/* The reports with `remind`, from forms.js — read for this at most every
   six hours, not on every ten-minute look */
function remindList_() {
  var cache = CacheService.getScriptCache();
  try { var hit = JSON.parse(cache.get('remind:list') || 'null'); if (hit) return hit; } catch (e) {}
  var list = loadSchedule_().reports.filter(function (r) { return r.remind && r.cadence === 'daily'; })
    .map(function (r) {
      return { id: r.id, person: r.person, cadence: r.cadence, dueTime: r.dueTime, remind: r.remind,
               from: r.from || null, skipDays: r.skipDays || null, en: r.en, am: r.am };
    });
  cache.put('remind:list', JSON.stringify(list), 6 * 3600);
  return list;
}
function remindOne_(r, day) {
  var id = 'remind-' + r.id + '-' + day;
  var filed = fsQuery_('reports', [['person', 'EQUAL', r.person], ['at', 'GREATER_THAN_OR_EQUAL', dayStart_(day)]], 'at')
    .some(function (f) { return f.report === r.id; });
  if (filed) return;
  var due = deadline_(r, day), clock = atClock_(atMinutes_(due));   /* "4:00 PM" (Attend.js) */
  var late = Date.now() >= due.getTime();
  var res = pushTo_(r.person, 'Klever · ' + r.en + ' · ' + r.am,
                    late ? 'Due at ' + clock + ' and not sent yet — send it now. · እስከ ' + clock + ' መላክ ነበረበት — አሁኑኑ ይላኩ።'
                         : 'Due at ' + clock + ' today, not sent yet. · ዛሬ እስከ ' + clock + ' ድረስ ይላኩ — ገና አልተላከም።',
                    id, 'form.html?r=' + encodeURIComponent(r.id));
  fsPut_('pushlog/' + id, { to: r.person, report: r.id, day: day, at: new Date(), phones: res.phones,
                            sent: res.sent, failed: res.failed, error: res.error });
  Logger.log('remind %s: %s phone(s), %s rang', r.id, res.phones, res.sent);
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
