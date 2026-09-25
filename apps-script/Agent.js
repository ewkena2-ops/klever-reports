/* Klever penalty ledger — closing the day.

   WHAT IT DOES, IN ORDER
   1. Works out who owed a report on a given day, from the live schedule on
      the site.
   2. Reads the signed archive to see who actually filed, and when — by the
      server's clock, never the phone's.
   3. Adds up the penalties. This part is arithmetic, and arithmetic is done
      here in code — never by the model. A model that is asked to count rows
      will eventually miscount one, and this number is money taken off a
      person's pay.
   4. Writes the day's ledger to Firestore, where the Chairman's page and the
      monthly deductions read it, and to its own tab in the Sheet.

   The agents (Agents.js) run straight after, on the same closed day, and send
   the one email. The weekly and monthly packs (Packs.js) read what this file
   wrote.

   WHY THE PENALTIES ARE IN THIS FILE AND NOT IN THE PROMPT
   Every figure below is quoted from a signed letter, with the line it comes
   from beside it. If a figure here is wrong, a person is charged the wrong
   amount, so each one must be traceable to the paper it came from. Change one
   here only when the letter changes.

   SET UP: Project Settings -> Script Properties
     CLAUDE_KEY       your key from console.anthropic.com   (Claude — the default)
     GEMINI_KEY       your key from aistudio.google.com     (Gemini — the other choice)
     FIREBASE_WEB_KEY the apiKey from js/firebase-config.js  (required)
     LEDGER_PASSWORD  the ledger@klever.local password       (required)
     LEDGER_START     yyyy-mm-dd — nothing is charged before (recommended)
     GEMINI_MODEL     defaults to gemini-3.8-flash           (optional)
     FIREBASE_PROJECT defaults to klever-26ad1               (optional)
     SITE             defaults to the GitHub Pages URL       (optional)
   Then, from the editor, run authorizeAgent() once and setupTriggers() once.
   A deployed script's permissions are frozen at first approval, and adding
   UrlFetch or a trigger will otherwise fail silently at runtime.            */

var AGENT_DEFAULT_SITE = 'https://ewkena2-ops.github.io/klever-reports/';
var AGENT_DEFAULT_MODEL = 'gemini-3.8-flash';

/* Addis Ababa is UTC+3 all year — no daylight saving — so a fixed offset is
   exact, and it keeps the date arithmetic below free of time-zone guessing. */
var ADDIS_ = '+03:00';

/* ------------------------------------------------------------------ *
 *  The penalties, quoted from the signed letters                      *
 * ------------------------------------------------------------------ */

/* Keyed by report, not by person. The first version keyed them by person,
   which charged Mahelet the 500 of her weekly report when her 15-day plan
   was late (her letter: 5,000), and let monthly reports fall through to the
   daily figures.

   late      = filed after the deadline, on the day it was due
   miss      = not filed by the end of the day it was due
   missAgain = not filed, and the same report was not filed the time before
   A figure left out is a figure the letter does not set, and is charged as 0.

   The shared sales and design reports are keyed by their template id; the
   person's own id in front of it is stripped when looking them up. */
var PENALTY = {
  'ephrata-daily':      { late: 500,  miss: 1000,
                          src: 'Ephrata’s letter — “Daily commercial report late –500 / missing –1,000”' },
  'ephrata-weekly':     { late: 500,  miss: 500,
                          src: 'Ephrata’s letter — “Weekly commercial report late –500”; marketing is part of it: “No weekly marketing report –500”' },
  'ephrata-projection': { late: 500,  miss: 500, missAgain: 1000,
                          src: 'Ephrata’s letter — “4-week projection late –500”, “First miss –500”, “Second consecutive miss –1,000”' },

  'liu-daily':          { late: 200,  miss: 500,
                          src: 'Mahelet’s letter — “Daily operations report late –200 / missing –500”' },
  'liu-weekly':         { late: 500,
                          src: 'Mahelet’s letter — “Weekly report late –500”' },
  'liu-plan':           { late: 5000, missAgain: 10000,
                          src: 'Mahelet’s letter — “15-day production plan late –5,000”, “Two consecutive weeks without a plan –10,000”' },

  'betty-daily':        { late: 200,  miss: 500,
                          src: 'Finance’s letter — “Daily finance report late –200 / missing –500”' },
  'betty-forecast':     { late: 200,  miss: 500,
                          src: 'Finance’s letter — “Daily 7-day forecast late –200 / missing –500”' },
  'betty-pulse':        { late: 200,  miss: 500,
                          src: 'Finance’s letter — “Daily Customer Pulse Report late –200 / missing –500”' },
  'betty-weekly':       { late: 500,
                          src: 'Finance’s letter — “Weekly finance report late –500”' },
  'betty-weekly-cx':    { late: 500,
                          src: 'Finance’s letter — “Weekly Customer Experience Summary late –500”' },
  'betty-cashflow':     { late: 500,  miss: 1000,
                          src: 'Finance’s letter — “Weekly 4-week projection late –500 / missing –1,000”' },
  'betty-joblist':      { late: 500,  miss: 500,
                          src: 'Finance’s letter — “Payment-confirmed job list not sent to Mahelet by Friday 1:00 PM –500”' },

  'getachew-daily':     { late: 200,  miss: 500,
                          src: 'Getachew’s letter — “Daily purchasing report late –200 / missing –500”' },
  'getachew-weekly':    { late: 500,
                          src: 'Getachew’s letter — “Weekly purchasing summary late –500”' },

  'amaha-daily':        { late: 200,  miss: 500,
                          src: 'Amaha’s letter — “Daily production report late –200 / missing –500”' },
  'amaha-weekly':       { late: 500,
                          src: 'Amaha’s letter — “Weekly production summary late –500”' },
  /* amaha-monthly: his letter sets nothing for it */

  'wude-daily':         { late: 200,  miss: 500,
                          src: 'Wude’s letter — “Daily QC report late –200 / missing –500”' },
  'wude-weekly':        { late: 500,
                          src: 'Wude’s letter — “Weekly QC summary late –500”' },
  'wude-monthly':       { miss: 200,
                          src: 'Wude’s letter — “Failed to report rework cost –200”; the monthly report is where it is reported' },

  'elyas-daily':        { late: 200,  miss: 500,
                          src: 'Elyas’s letter — “Daily site report late –200 / missing –500”' },
  'elyas-weekly':       { late: 500,
                          src: 'Elyas’s letter — “Weekly site summary late –500”' },

  'ashenafi-daily':     { late: 100,  miss: 300,
                          src: 'Ashenafi’s letter — “Daily support report late –100 / missing –300”' },

  'sales-daily':        { late: 200,  miss: 500,
                          src: 'Salesperson letter — “Daily sales report late –200 / missing –500”' },
  'sales-weekly':       { late: 500,
                          src: 'Salesperson letter — “Weekly sales summary late –500”' },
  'design-daily':       { late: 200,  miss: 500,
                          src: 'Designer letter — “Daily design report late –200 / missing –500”' },
  'design-weekly':      { late: 500,
                          src: 'Designer letter — “Weekly design summary late –500”' }

  /* YORDANOS IS ABSENT ON PURPOSE. He files a daily and a weekly store report
     — the site has both forms — but his letter carries no penalty for filing
     either late or not at all. Every other reporter has one. Until the
     Chairman says what it is, the ledger lists him and charges nothing, which
     is what the signed paper actually says. */
};

function penaltyFor_(reportId) {
  if (PENALTY[reportId]) return PENALTY[reportId];
  var m = /-(sales|design)-(daily|weekly)$/.exec(reportId);
  return m ? PENALTY[m[1] + '-' + m[2]] || null : null;
}

/* ------------------------------------------------------------------ *
 *  Entry points                                                       *
 * ------------------------------------------------------------------ */

/* Run once from the editor. Google only shows the consent screen when a
   function is run from here — opening the web app URL re-runs the old
   permission set and will not prompt. */
function authorizeAgent() {
  UrlFetchApp.fetch(AGENT_DEFAULT_SITE + 'js/forms.js').getResponseCode();
  fsToken_();   /* fail here, in the editor, rather than silently at 6am */
  ScriptApp.getProjectTriggers();
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(),
                    'Klever agent — permission granted',
                    'The ledger can now read the schedule, the archive and call Gemini.');
}

/* Every trigger the system needs, made in one run. Existing triggers for the
   same functions are removed first, so running it twice leaves one of each
   rather than two.

     dailyRun            every morning 6–7 — closes yesterday, the agents read
                         it, one email. The brief is waiting at 7:00.
     watchForRunRequest  every 10 minutes — the “Analyse now” button
     weeklyPack          Sunday 8–9 — the week just ended
     monthlyPack         the 2nd, 8–9 — the month just ended, with the
                         deductions. The 2nd, because Amaha’s and Wude’s
                         monthly reports are due at 5 PM on the 1st.        */
function setupTriggers() {
  var mine = ['dailyRun', 'dailyLedger', 'runAgents', 'watchForRunRequest',
              'weeklyPack', 'monthlyPack'];
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (mine.indexOf(t.getHandlerFunction()) !== -1) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('dailyRun').timeBased().everyDays(1).atHour(6).create();
  ScriptApp.newTrigger('watchForRunRequest').timeBased().everyMinutes(10).create();
  ScriptApp.newTrigger('weeklyPack').timeBased()
           .onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(8).create();
  ScriptApp.newTrigger('monthlyPack').timeBased().onMonthDay(2).atHour(8).create();
  return ScriptApp.getProjectTriggers().map(function (t) {
    return t.getHandlerFunction();
  }).join(', ');
}

/* The old name, kept so a trigger made from the earlier instructions still
   does the right thing. */
function dailyLedger() { dailyRun(); }

/* Writes nothing and sends nothing — for trying it out. Pass a day
   ('2026-10-01') or leave it empty for yesterday. */
function previewLedger(day) {
  day = day || addDays_(todayAddis_(), -1);
  var c = closeDay_(day, { write: false });
  Logger.log('%s — due %s, filed %s', day, c.due.length, c.filed.length);
  c.ledger.forEach(function (l) {
    Logger.log('%s | %s | %s | %s Birr', l.name, l.reportName, l.status, l.amount);
  });
  Logger.log('total: %s Birr', c.ledger.reduce(function (a, l) { return a + l.amount; }, 0));
}

/* ------------------------------------------------------------------ *
 *  Days                                                               *
 * ------------------------------------------------------------------ */

function dayStart_(day) { return new Date(day + 'T00:00:00' + ADDIS_); }
function dayOf_(date)   { return Utilities.formatDate(date, tz_(), 'yyyy-MM-dd'); }
function todayAddis_()  { return dayOf_(new Date()); }
function addDays_(day, n) {
  return dayOf_(new Date(dayStart_(day).getTime() + n * 86400000 + 3600000));
}
/* 0 Sunday .. 6 Saturday. Noon in Addis is still the same date in UTC. */
function dow_(day) { return new Date(day + 'T12:00:00' + ADDIS_).getUTCDay(); }
function deadline_(report, day) {
  return new Date(day + 'T' + (report.dueTime || '17:30') + ':00' + ADDIS_);
}
function dayLabel_(day) {
  return Utilities.formatDate(new Date(day + 'T12:00:00' + ADDIS_), tz_(), 'EEEE d MMMM yyyy');
}

/* ------------------------------------------------------------------ *
 *  The schedule, read from the live site                              *
 * ------------------------------------------------------------------ */

/* forms.js is the only place the report schedule exists. Rather than keep a
   second copy here that would drift out of step within a month, the agent
   fetches that file and evaluates it. It is our own file on our own site;
   if that ever stops being true, this is the line to change. */
var SCHEDULE_ = null;
function loadSchedule_() {
  if (SCHEDULE_) return SCHEDULE_;
  var site = prop_('SITE', AGENT_DEFAULT_SITE);
  var src = UrlFetchApp.fetch(site + 'js/forms.js', { muteHttpExceptions: true });
  if (src.getResponseCode() !== 200) {
    throw new Error('Could not read the schedule from ' + site + ' (HTTP ' +
                    src.getResponseCode() + ')');
  }
  /* forms.js declares PEOPLE and REPORTS at the top level and nothing else */
  var read = new Function(src.getContentText() + '; return { people: PEOPLE, reports: REPORTS };');
  SCHEDULE_ = read();
  if (!SCHEDULE_.reports || !SCHEDULE_.reports.length) throw new Error('Schedule came back empty');
  return SCHEDULE_;
}

/* Everything that was owed on a day, by the rules in each report's own
   entry: daily reports skip the days their letter excuses, weekly ones land
   on their due day, monthly ones on the 1st — or on the 2nd when the 1st is
   a Sunday, which is nobody's day. The site (js/app.js dueOn) and the
   Chairman's page use this same rule. */
function dueOn_(schedule, day) {
  var dow = dow_(day);
  var first = day.slice(8) === '01' || (day.slice(8) === '02' && dow_(addDays_(day, -1)) === 0);
  if (dow === 0) return [];
  return schedule.reports.filter(function (r) {
    if (r.cadence === 'daily') return !(r.skipDays && r.skipDays.indexOf(dow) !== -1);
    if (r.cadence === 'weekly') return r.dueDay === dow;
    if (r.cadence === 'monthly') return first;
    return false;
  });
}

/* ------------------------------------------------------------------ *
 *  What actually arrived                                              *
 * ------------------------------------------------------------------ */

/* This reads Firestore, not the Sheet, for two reasons.

   The first is that it has to. The Sheet is fed by an Apps Script web app
   deployed ANYONE_ANONYMOUS whose URL ships in a public repo, so a row there
   can be written by anyone — including one backdated to look as though it beat
   a deadline. A fine calculated from a source like that is worse than no fine,
   because it looks rigorous and is not. Firestore's copy is signed in: you
   file as yourself, for yourself, at a time the server sets.

   The second is that it keeps working. A query asks for the days it needs
   and gets them, whether the archive holds a thousand reports or a million. */

function fsBase_() {
  return 'https://firestore.googleapis.com/v1/projects/' +
         prop_('FIREBASE_PROJECT', 'klever-26ad1') + '/databases/(default)';
}

/* An hour-long token for the ledger's own account — a reader of reports that
   cannot file one, touch chat, or alter anything a person wrote. Set
   LEDGER_PASSWORD in Script Properties; it is not the Chairman's password and
   must not be. Kept for the length of one run, not asked for on every read. */
var FS_TOKEN_ = null;
function fsToken_() {
  if (FS_TOKEN_) return FS_TOKEN_;
  var key = prop_('FIREBASE_WEB_KEY', '');
  var pw = prop_('LEDGER_PASSWORD', '');
  if (!key || !pw) {
    throw new Error('Set FIREBASE_WEB_KEY and LEDGER_PASSWORD in Script Properties ' +
                    '(Project Settings -> Script Properties).');
  }
  var res = UrlFetchApp.fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' +
      encodeURIComponent(key),
    { method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      payload: JSON.stringify({
        email: 'ledger@' + prop_('KLEVER_DOMAIN', 'klever.local'),
        password: pw, returnSecureToken: true }) });
  if (res.getResponseCode() !== 200) {
    /* Firebase says exactly what is wrong; repeat it rather than guessing.
       The first version of this blamed LEDGER_PASSWORD for every 400, which
       sent the reader after the wrong property when the web key was the one
       mistyped. */
    var why = '';
    try { why = JSON.parse(res.getContentText()).error.message; } catch (e) { why = ''; }
    var hint = {
      'INVALID_LOGIN_CREDENTIALS': 'LEDGER_PASSWORD is wrong.',
      'INVALID_PASSWORD':          'LEDGER_PASSWORD is wrong.',
      'EMAIL_NOT_FOUND':           'There is no ledger@klever.local account in this project.',
      'API_KEY_INVALID':           'FIREBASE_WEB_KEY is wrong.',
      'INVALID_EMAIL':             'KLEVER_DOMAIN is wrong — it should be klever.local.',
      'MISSING_PASSWORD':          'LEDGER_PASSWORD is empty.'
    }[why] || ('Firebase said: ' + (why || 'nothing useful') + '.');
    throw new Error('Ledger sign-in failed (HTTP ' + res.getResponseCode() + '). ' + hint +
                    '  Lengths now stored — key ' + key.length + ', password ' + pw.length +
                    '. They should be 39 and 21. A trailing space counts.');
  }
  FS_TOKEN_ = JSON.parse(res.getContentText()).idToken;
  return FS_TOKEN_;
}

/* Firestore wraps every value in its type. Unwrap it back into ordinary
   JavaScript so the rest of this file never has to know. */
function fsValue_(v) {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return new Date(v.timestampValue);
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fsValue_);
  if ('mapValue' in v) {
    var out = {}, f = v.mapValue.fields || {};
    Object.keys(f).forEach(function (k) { out[k] = fsValue_(f[k]); });
    return out;
  }
  return null;
}

/* ...and wrap it again on the way in */
function fsEncode_(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Object.prototype.toString.call(v) === '[object Array]') {
    return { arrayValue: { values: v.map(fsEncode_) } };
  }
  if (typeof v === 'number') {
    return v % 1 === 0 ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'object') {
    var f = {};
    Object.keys(v).forEach(function (k) { f[k] = fsEncode_(v[k]); });
    return { mapValue: { fields: f } };
  }
  return { stringValue: String(v) };
}

function fsDoc_(doc) {
  var out = {}, f = doc.fields || {};
  Object.keys(f).forEach(function (k) { out[k] = fsValue_(f[k]); });
  out._id = String(doc.name || '').split('/').pop();
  return out;
}

/* One structured query. `where` is a list of [field, op, value] and they
   are ANDed; ops are Firestore's own (GREATER_THAN_OR_EQUAL, LESS_THAN,
   EQUAL...). */
function fsQuery_(collection, where, orderBy) {
  var filters = (where || []).map(function (w) {
    return { fieldFilter: { field: { fieldPath: w[0] }, op: w[1], value: fsEncode_(w[2]) } };
  });
  var q = { from: [{ collectionId: collection }] };
  if (filters.length === 1) q.where = filters[0];
  if (filters.length > 1) q.where = { compositeFilter: { op: 'AND', filters: filters } };
  if (orderBy) q.orderBy = [{ field: { fieldPath: orderBy }, direction: 'ASCENDING' }];

  var res = UrlFetchApp.fetch(fsBase_() + '/documents:runQuery', {
    method: 'post', contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + fsToken_() },
    muteHttpExceptions: true,
    payload: JSON.stringify({ structuredQuery: q })
  });
  if (res.getResponseCode() !== 200) {
    throw new Error('Could not read ' + collection + ' (HTTP ' + res.getResponseCode() +
                    '): ' + res.getContentText().substring(0, 300));
  }
  var out = [];
  JSON.parse(res.getContentText()).forEach(function (row) {
    if (row.document) out.push(fsDoc_(row.document));   /* an empty result carries one blank entry */
  });
  return out;
}

/* Write one document whole. A second write to the same path replaces it,
   which is what re-running a day should do. */
function fsPut_(path, obj) {
  var fields = {};
  Object.keys(obj).forEach(function (k) { fields[k] = fsEncode_(obj[k]); });
  var res = UrlFetchApp.fetch(fsBase_() + '/documents/' + path, {
    method: 'patch', contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + fsToken_() },
    muteHttpExceptions: true,
    payload: JSON.stringify({ fields: fields })
  });
  if (res.getResponseCode() !== 200) {
    throw new Error('Could not write ' + path + ' (HTTP ' + res.getResponseCode() + '): ' +
                    res.getContentText().substring(0, 300));
  }
}

/* Every report filed from the start of one day to the start of another,
   oldest first. */
function filedBetween_(fromDay, toDay) {
  return fsQuery_('reports', [
    ['at', 'GREATER_THAN_OR_EQUAL', dayStart_(fromDay)],
    ['at', 'LESS_THAN', dayStart_(toDay)]
  ], 'at').map(function (f) {
    return {
      person: f.person, report: f.report, by: f.by,
      at: f.at, day: dayOf_(f.at),
      fields: f.values || {}, flags: f.flags || [], text: f.text || ''
    };
  });
}

/* The ledger lines of the days before this one, for the charges that depend
   on the last time (“second consecutive miss”) and for the agents' week. */
function ledgersBetween_(fromDay, toDay) {
  return fsQuery_('ledger', [
    ['day', 'GREATER_THAN_OR_EQUAL', fromDay],
    ['day', 'LESS_THAN', toDay]
  ], 'day');
}

/* ------------------------------------------------------------------ *
 *  The arithmetic                                                     *
 * ------------------------------------------------------------------ */

/* When a report counts, and whether it was on time.

   A daily report belongs to the day it was filed on. A weekly one filed any
   time in the six days before its due day counts — filing Thursday for
   Friday is early, not missing — and so does a monthly one filed in the week
   before the 1st. The deadline is the letter's; the time is the server's,
   set by Firestore when the report arrived. The phone's own opinion of
   whether it was late is not read at all: a phone's clock is whatever its
   owner set it to.

   Anything not in by the end of the due day is missing. `asOf` makes the
   same rule answer mid-day, for the Chairman's “Analyse now”: a report whose
   deadline has not come yet is not yet due, not missing. */
function settle_(report, day, filings, asOf) {
  var back = report.cadence === 'daily' ? 0 : (report.cadence === 'weekly' ? 6 : 7);
  var from = dayStart_(addDays_(day, -back)).getTime();
  var to = dayStart_(addDays_(day, 1)).getTime();
  var due = deadline_(report, day);

  var hit = null;
  for (var i = 0; i < filings.length; i++) {
    var f = filings[i], t = f.at.getTime();
    /* the person too: the rules now refuse a report filed by anyone else, and
       this makes sure an older one filed that way can never count */
    if (f.report === report.id && f.person === report.person && t >= from && t < to) { hit = f; break; }
  }
  if (hit) return { status: hit.at.getTime() <= due.getTime() ? 'On time' : 'LATE', at: hit.at };
  if (asOf && asOf.getTime() < due.getTime()) return { status: 'NOT DUE YET', at: null };
  return { status: 'MISSING', at: null };
}

/* One line per report that was owed, saying what happened to it and what that
   costs under that person's own letter. No model touches this.

   `before` is the ledger of the days leading up to this one, needed only for
   the two charges that depend on the previous occurrence. */
function charge_(due, filings, day, before, asOf, names) {
  var prev = {};
  (before || []).forEach(function (doc) {
    (doc.lines || []).forEach(function (l) { prev[doc.day + '|' + l.report] = l.status; });
  });

  var ledger = due.map(function (r) {
    var s = settle_(r, day, filings, asOf);
    var rule = penaltyFor_(r.id);
    var amount = 0, why = rule ? rule.src : 'No penalty for this report in this person’s letter';

    if (rule && s.status === 'LATE') amount = rule.late || 0;
    if (rule && s.status === 'MISSING') {
      amount = rule.miss || 0;
      var lastTime = addDays_(day, r.cadence === 'weekly' ? -7 : -1);
      if (rule.missAgain && prev[lastTime + '|' + r.id] === 'MISSING') {
        amount = rule.missAgain;
        why = 'Missed twice in a row. ' + why;
      }
    }
    return {
      person: r.person,
      name: (names && names[r.person]) || r.person,
      report: r.id,
      reportName: r.en,
      due: r.dueEn || '',
      status: s.status,
      at: s.at,
      amount: amount,
      why: why
    };
  });

  /* Nothing is charged before the day the team was told this was running.
     Without this the ledger charges from the moment it is switched on, and the
     first thing it would do is fine fifteen people for a day on which nobody
     had been told the system existed. Set LEDGER_START to that day
     (yyyy-mm-dd) and the figures are still calculated and still emailed —
     they simply cost nobody anything until then. */
  var start = prop_('LEDGER_START', '');
  if (start && day < start) {
    ledger.forEach(function (l) {
      if (l.amount > 0) {
        l.why = 'Not charged — before LEDGER_START (' + start + '). ' + l.why;
        l.amount = 0;
      }
    });
  }

  /* heaviest first — the Chairman reads the top of the list */
  ledger.sort(function (a, b) { return b.amount - a.amount; });
  return ledger;
}

/* Close one day: who owed what, what arrived, what it costs. With
   {write:false} it only calculates — that is how previewLedger and the
   Chairman's mid-day “Analyse now” use it. */
function closeDay_(day, opts) {
  opts = opts || {};
  var schedule = loadSchedule_();
  var names = {};
  (schedule.people || []).forEach(function (p) { names[p.id] = p.en; });

  var due = dueOn_(schedule, day);
  /* a week back, because a weekly report may have been filed early */
  var filings = filedBetween_(addDays_(day, -7), addDays_(day, 1));
  var before = ledgersBetween_(addDays_(day, -7), day);
  var ledger = charge_(due, filings, day, before, opts.asOf || null, names);

  if (opts.write !== false && due.length) {
    fsPut_('ledger/' + day, {
      day: day,
      closedAt: new Date(),
      total: ledger.reduce(function (a, l) { return a + l.amount; }, 0),
      lines: ledger.map(function (l) {
        return { person: l.person, name: l.name, report: l.report, reportName: l.reportName,
                 due: l.due, status: l.status, at: l.at, amount: l.amount, why: l.why };
      })
    });
    writeLedgerTab_(ledger, day);
  }

  return {
    day: day,
    schedule: schedule,
    names: names,
    due: due,
    filings: filings,
    filed: filings.filter(function (f) { return f.day === day; }),
    before: before,
    ledger: ledger
  };
}

/* ------------------------------------------------------------------ *
 *  Output                                                             *
 * ------------------------------------------------------------------ */

var LEDGER_TAB_ = 'Penalty Ledger';

/* The Sheet copy is the Chairman's window, not the record — the monthly
   deductions are added up from Firestore, which nobody outside can write. */
function writeLedgerTab_(ledger, day) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(LEDGER_TAB_);
  if (!sh) {
    sh = ss.insertSheet(LEDGER_TAB_);
    sh.appendRow(['Date', 'Person', 'Report', 'Due', 'Status', 'Birr', 'Under which letter']);
    sh.setFrozenRows(1);
  }
  var rows = ledger.map(function (l) {
    return [day, l.name, l.reportName, l.due, l.status, l.amount, l.why];
  });
  if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, 7).setValues(rows);
}

/* ------------------------------------------------------------------ *
 *  Small helpers                                                      *
 * ------------------------------------------------------------------ */

function prop_(name, fallback) {
  var v = PropertiesService.getScriptProperties().getProperty(name);
  return v == null || v === '' ? fallback : v;
}
function tz_() {
  return Session.getScriptTimeZone() || 'Africa/Nairobi';
}
function fmt_(n) {
  return Number(n).toLocaleString('en-US');
}
function esc_(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
