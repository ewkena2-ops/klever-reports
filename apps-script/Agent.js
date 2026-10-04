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

   late      = filed after the deadline: a daily or monthly report on the day
               it was due; a weekly one any time before its week closes, on
               Sunday at 9 PM (see THE WEEK below)
   miss      = not filed: a daily or monthly report by the end of the day it
               was due; a weekly one by Sunday 9 PM
   missAgain = not filed, and the same report was not filed the time before
   A figure left out is a figure the letter does not set, and is charged as 0.

   A weekly report never sent costs what it would cost late (the Chairman,
   4 October 2026). Most letters set only “late –500” for a weekly report, and
   charging a report never sent at 0 made not sending it the cheaper choice.

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
  'liu-weekly':         { late: 500,  miss: 500,
                          src: 'Mahelet’s letter — “Weekly report late –500”; never sent: the same 500 (the Chairman, 4 Oct 2026)' },
  'liu-plan':           { late: 5000, missAgain: 10000,
                          src: 'Mahelet’s letter — “15-day production plan late –5,000”, “Two consecutive weeks without a plan –10,000”' },

  'betty-daily':        { late: 200,  miss: 500,
                          src: 'Selam’s letter — “Daily finance report late –200 / missing –500”' },
  'betty-forecast':     { late: 200,  miss: 500,
                          src: 'Selam’s letter — “Daily 7-day forecast late –200 / missing –500”' },
  'betty-pulse':        { late: 200,  miss: 500,
                          src: 'Selam’s letter — “Daily Customer Pulse Report late –200 / missing –500”' },
  'betty-weekly':       { late: 500,  miss: 500,
                          src: 'Selam’s letter — “Weekly finance report late –500”; never sent: the same 500 (the Chairman, 4 Oct 2026)' },
  'betty-weekly-cx':    { late: 500,  miss: 500,
                          src: 'Selam’s letter — “Weekly Customer Experience Summary late –500”; never sent: the same 500 (the Chairman, 4 Oct 2026)' },
  'betty-cashflow':     { late: 500,  miss: 1000,
                          src: 'Selam’s letter — “Weekly 4-week projection late –500 / missing –1,000”' },
  'betty-joblist':      { late: 500,  miss: 500,
                          src: 'Selam’s letter — “Payment-confirmed job list not sent to Mahelet by Friday 1:00 PM –500”' },

  'getachew-daily':     { late: 200,  miss: 500,
                          src: 'Getachew’s letter — “Daily purchasing report late –200 / missing –500”' },
  'getachew-weekly':    { late: 500,  miss: 500,
                          src: 'Getachew’s letter — “Weekly purchasing summary late –500”; never sent: the same 500 (the Chairman, 4 Oct 2026)' },

  'amaha-daily':        { late: 200,  miss: 500,
                          src: 'Amaha’s letter — “Daily production report late –200 / missing –500”' },
  'amaha-weekly':       { late: 500,  miss: 500,
                          src: 'Amaha’s letter — “Weekly production summary late –500”; never sent: the same 500 (the Chairman, 4 Oct 2026)' },
  /* amaha-monthly: his letter sets nothing for it */

  'wude-daily':         { late: 200,  miss: 500,
                          src: 'Wude’s letter — “Daily QC report late –200 / missing –500”' },
  'wude-weekly':        { late: 500,  miss: 500,
                          src: 'Wude’s letter — “Weekly QC summary late –500”; never sent: the same 500 (the Chairman, 4 Oct 2026)' },
  'wude-monthly':       { miss: 200,
                          src: 'Wude’s letter — “Failed to report rework cost –200”; the monthly report is where it is reported' },

  'elyas-daily':        { late: 200,  miss: 500,
                          src: 'Elyas’s letter — “Daily site report late –200 / missing –500”' },
  'elyas-weekly':       { late: 500,  miss: 500,
                          src: 'Elyas’s letter — “Weekly site summary late –500”; never sent: the same 500 (the Chairman, 4 Oct 2026)' },

  'ashenafi-daily':     { late: 100,  miss: 300,
                          src: 'Ashenafi’s letter — “Daily support report late –100 / missing –300”' },

  'sales-daily':        { late: 200,  miss: 500,
                          src: 'Salesperson letter — “Daily sales report late –200 / missing –500”' },
  'sales-weekly':       { late: 500,  miss: 500,
                          src: 'Salesperson letter — “Weekly sales summary late –500”; never sent: the same 500 (the Chairman, 4 Oct 2026)' },
  'design-daily':       { late: 200,  miss: 500,
                          src: 'Designer letter — “Daily design report late –200 / missing –500”' },
  'design-weekly':      { late: 500,  miss: 500,
                          src: 'Designer letter — “Weekly design summary late –500”; never sent: the same 500 (the Chairman, 4 Oct 2026)' }

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
     watchForRunRequest  every 10 minutes — the “Analyse now” button, and,
                         after the week closes on Sunday at 9 PM, the week's
                         weekly reports settled and its summary (weekEnd_)
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
  /* no weeklyPack trigger: the week closes at 9 PM on Sunday and the watch
     sends its summary then. An old Sunday-morning one is removed above. */
  ScriptApp.newTrigger('monthlyPack').timeBased().onMonthDay(2).atHour(8).create();
  return ScriptApp.getProjectTriggers().map(function (t) {
    return t.getHandlerFunction();
  }).join(', ');
}

/* The old name, kept so a trigger made from the earlier instructions still
   does the right thing. */
function dailyLedger() { dailyRun(); }

/* ------------------------------------------------------------------ *
 *  Did it run                                                         *
 * ------------------------------------------------------------------ *
   A scheduled job that throws stops without a word: the Sunday 27 September
   weekly summary failed on every run and nothing anywhere said so. So each
   job — the morning close, the weekly and monthly summaries, the readings —
   leaves one line in /health/{job} when it ends, saying whether it worked,
   and the Chairman's page reads those lines. A failed close, summary or
   month also emails him at once, because a page is only read when opened.
   The error is thrown on afterwards, so Google's own failure notice still
   goes out as well. */
var JOB_NAMES_ = {
  daily:   'the morning close (yesterday’s fines and the agents’ reading)',
  week:    'the weekly summary',
  month:   'the monthly summary (the Pay tab for payroll)',
  reading: 'a reading of the day'
};
function ran_(job, fn) {
  var t0 = new Date();
  var out;
  try {
    out = fn() || {};
  } catch (e) {
    var msg = String((e && e.message) || e).substring(0, 500);
    health_(job, { ok: false, error: msg, ms: new Date().getTime() - t0.getTime() });
    if (job !== 'reading') failMail_(job, msg);
    throw e;
  }
  health_(job, { ok: true, ms: new Date().getTime() - t0.getTime(),
                 note: String(out.note || '').substring(0, 300),
                 warn: (out.warn || []).map(function (w) { return String(w).substring(0, 300); }),
                 period: out.period || '' });
  return out;
}
function health_(job, o) {
  o.job = job;
  o.at = new Date();
  try { fsPut_('health/' + job, o); }
  catch (e) { Logger.log('health %s: %s', job, e.message); }
}
function failMail_(job, msg) {
  try {
    MailApp.sendEmail({
      to: Session.getEffectiveUser().getEmail(),
      subject: 'FAILED - Klever - ' + (JOB_NAMES_[job] || job),
      htmlBody:
        '<div style="font-family:Helvetica,Arial,sans-serif;max-width:620px;color:#141b1a">' +
        '<h2 style="font-size:17px;color:#8f3020;margin:0 0 10px">' + esc_(JOB_NAMES_[job] || job) +
        ' did not finish</h2>' +
        '<p style="font-size:14px;line-height:1.6">It stopped at ' +
        esc_(Utilities.formatDate(new Date(), tz_(), 'EEE d MMM, HH:mm')) + ' with this error:</p>' +
        '<pre style="background:#f3f4f1;padding:12px;white-space:pre-wrap;font-size:12.5px">' +
        esc_(msg) + '</pre>' +
        '<p style="font-size:13px;line-height:1.6;color:#66716d">Nothing it would have written can be ' +
        'trusted for this run. It can be run again by hand from the script editor ' +
        '(choose the function, press Run). The same line is on your page, under “System”.</p></div>'
    });
  } catch (e) {
    Logger.log('failure mail: %s', e.message);
  }
}

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
  c.ruleLines.forEach(function (l) {
    Logger.log('%s | %s | %s | %s Birr | %s', l.name, l.kind, l.reportName, l.amount, l.why);
  });
  if (c.ruleErrors.length) Logger.log('rulebook errors: %s', c.ruleErrors.join('; '));
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
 *  The week                                                           *
 * ------------------------------------------------------------------ */

/* THE WEEK closes on Sunday at 9 PM (the Chairman, 4 October 2026).

   A weekly report belongs to the week it is sent in. Sent after its own
   deadline but before Sunday 9 PM, it is that week's report, late; not in
   by then, it is missing; and anything sent after 9 PM on Sunday is the next
   week's. Before this, a report due Friday and sent on Saturday counted as
   the NEXT week's, early: it was charged as missing for its own week, its
   figures were read as the next week's, and it covered the next week too.

   Every part reads the week from here — the fines, the rules, the Sunday
   summary, the CFO and the Chairman's questions — and the site has the same
   rule (js/app.js and js/chairman.js), so the phone, the page and the pay
   all name the same week.

   One report turns at a different hour. Selam's Monday customer summary
   (WEEK_BEFORE_) is due on Monday and is ABOUT the week before — the week
   that has just ended. Written on Sunday evening it is that summary, early,
   not a late copy of the one due six days before; so its week turns at the
   start of Sunday instead of 9 PM. */
var WEEK_CUT_ = '21:00';
/* reports whose content is the week before the one they are due in */
var WEEK_BEFORE_ = { 'betty-weekly-cx': true };
function cutTime_(reportId) { return reportId && WEEK_BEFORE_[reportId] ? '00:00' : WEEK_CUT_; }
/* the moment the week ending on `sunday` closes (for a report, if given) */
function weekCut_(sunday, reportId) { return new Date(sunday + 'T' + cutTime_(reportId) + ':00' + ADDIS_); }
/* the Sunday that closes the week a moment falls in (for a report, if given) */
function weekOf_(at, reportId) {
  var day = dayOf_(at);
  var sun = addDays_(day, (7 - dow_(day)) % 7);
  return at.getTime() >= weekCut_(sun, reportId).getTime() ? addDays_(sun, 7) : sun;
}
/* the Sunday that closes the week a day is in (a Sunday is its own) */
function sundayOf_(day) { return addDays_(day, (7 - dow_(day)) % 7); }
/* the day a weekly report falls due in the week closing on `sunday` */
function dueInWeek_(report, sunday) { return addDays_(sunday, report.dueDay - 7); }
/* The time in which a filing counts for a weekly report in the week closing
   on `sunday`: [from, to). The first week under the rule (WEEK_FROM_) also
   takes what the rule before it counted early for a day in it — sent on
   Saturday 3 October, a report the phone then said was "early, for Monday
   5 October" is that — so nobody is charged for trusting the phone. */
function weekWindow_(report, sunday) {
  var from = weekCut_(addDays_(sunday, -7), report.id).getTime();
  var to = weekCut_(sunday, report.id).getTime();
  if (sunday === WEEK_FROM_) {
    from = Math.min(from, dayStart_(addDays_(dueInWeek_(report, sunday), -6)).getTime());
  }
  return { from: from, to: to };
}
/* "Mon 5 Oct – Sun 11 Oct" */
function weekLabel_(sunday) {
  var f = function (d) { return Utilities.formatDate(new Date(d + 'T12:00:00' + ADDIS_), tz_(), 'EEE d MMM'); };
  return f(addDays_(sunday, -6)) + ' – ' + f(sunday);
}
/* What a weekly filing is for, in words a reader cannot mistake: the week it
   counts for and, where it differs, the week it is about. */
function weekOfFiling_(report, at) {
  var sun = weekOf_(at, report.id);
  var out = { counts_for_week: weekLabel_(sun), due: dayLabel_(dueInWeek_(report, sun)) };
  if (WEEK_BEFORE_[report.id]) out.about_week = weekLabel_(addDays_(sun, -7));
  return out;
}
/* The last filing of a weekly report in the week closing on `sunday` — a
   second one in the same week is a correction — or null. `filings` oldest
   first, as every query here returns them. */
function filingOfWeek_(filings, reportId, sunday) {
  var hit = null;
  (filings || []).forEach(function (f) {
    if (f.report === reportId && f.at && weekOf_(f.at, reportId) === sunday) hit = f;
  });
  return hit;
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
  /* forms.js declares PEOPLE and REPORTS at the top level, and oddFigures —
     the check for answers that cannot be right, shared with the form */
  var read = new Function(src.getContentText() + '; return { people: PEOPLE, reports: REPORTS, ' +
                          'odd: typeof oddFigures === "function" ? oddFigures : null };');
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

   A daily report belongs to the day it was filed on, and a monthly one
   filed in the week before the 1st counts. The deadline is the letter's; the
   time is the server's, set by Firestore when the report arrived. The
   phone's own opinion of whether it was late is not read at all: a phone's
   clock is whatever its owner set it to.

   Anything not in by the end of the due day is missing. `asOf` makes the
   same rule answer mid-day, for the Chairman's “Analyse now”: a report whose
   deadline has not come yet is not yet due, not missing.

   A weekly report counts for its week (THE WEEK, above): from the close of
   the week before, Sunday 9 PM, to its own week's close. Its deadline is on
   its own day in that week; after it, and until the week closes, it is late
   — and before the week has closed, one not in is NOT IN YET rather than
   missing, because it can still come. `day` may be its due day or the
   Sunday that closes its week. */
function settle_(report, day, filings, asOf) {
  var from, to, due, sun = null;
  if (report.cadence === 'weekly' && sundayOf_(day) < WEEK_FROM_) {
    /* a week before the rule: as it was settled then — six days early to
       the end of its due day, and missing at midnight */
    from = dayStart_(addDays_(day, -6)).getTime();
    to = dayStart_(addDays_(day, 1)).getTime();
    due = deadline_(report, day);
  } else if (report.cadence === 'weekly') {
    sun = sundayOf_(day);
    var w = weekWindow_(report, sun);
    from = w.from;
    to = w.to;
    due = deadline_(report, dueInWeek_(report, sun));
  } else {
    var back = report.cadence === 'daily' ? 0 : 7;
    from = dayStart_(addDays_(day, -back)).getTime();
    to = dayStart_(addDays_(day, 1)).getTime();
    due = deadline_(report, day);
  }

  var hit = null;
  for (var i = 0; i < filings.length; i++) {
    var f = filings[i], t = f.at.getTime();
    /* the person too: the rules now refuse a report filed by anyone else, and
       this makes sure an older one filed that way can never count */
    if (f.report === report.id && f.person === report.person && t >= from && t < to) { hit = f; break; }
  }
  if (hit) return { status: hit.at.getTime() <= due.getTime() ? 'On time' : 'LATE', at: hit.at };
  if (asOf && asOf.getTime() < due.getTime()) return { status: 'NOT DUE YET', at: null };
  if (sun && (asOf || new Date()).getTime() < to) return { status: 'NOT IN YET', at: null };
  return { status: 'MISSING', at: null };
}

/* One line per report that was owed, saying what happened to it and what that
   costs under that person's own letter. No model touches this.

   `before` is the ledger of the days leading up to this one, needed only for
   the two charges that depend on the previous occurrence. */
function charge_(due, filings, day, before, asOf, names, waivers) {
  var start = prop_('LEDGER_START', '');
  /* The previous miss counts toward "twice in a row" only if it could itself
     have been charged — on or after LEDGER_START — and the Chairman has not
     cancelled it. Without this, a plan missed in the week before anyone was
     told the system was running made the first real miss cost double
     (Mahelet: 10,000 instead of 5,000), and cancelling the first miss did
     not stop the second from being doubled. */
  var off = {};
  (waivers || []).forEach(function (w) { off[w.day + '|' + w.report] = true; });
  var prev = {};
  (before || []).forEach(function (doc) {
    (doc.lines || []).forEach(function (l) {
      /* a week's lines sit in its Sunday; the day that decides is their own */
      if (start && (l.dueDay || doc.day) < start) return;
      if (!off[doc.day + '|' + l.report]) prev[doc.day + '|' + l.report] = l.status;
    });
  });

  var ledger = due.map(function (r) {
    var s = settle_(r, day, filings, asOf);
    var rule = penaltyFor_(r.id);
    var amount = 0, why = rule ? rule.src : 'No penalty for this report in this person’s letter';
    /* the day it was due — for a weekly report closed with its week, its own
       day in that week, not the Sunday */
    var dueDay = r.cadence === 'weekly' ? dueInWeek_(r, sundayOf_(day)) : day;

    if (rule && s.status === 'LATE') amount = rule.late || 0;
    if (s.status === 'NOT IN YET') {
      why = 'Not in yet. It still counts for this week, as late, if it comes by ' +
            (WEEK_BEFORE_[r.id] ? 'the end of Saturday' : 'Sunday 9 PM') + '; after that it is missing. ' + why;
    }
    if (rule && s.status === 'MISSING') {
      amount = rule.miss || 0;
      var lastTime = addDays_(day, r.cadence === 'weekly' ? -7 : -1);
      /* last week's line is on last week's Sunday — or, for the week before
         WEEK_FROM_, on its own due day, where the old way kept it */
      var lastOld = r.cadence === 'weekly' ? dueInWeek_(r, sundayOf_(lastTime)) : lastTime;
      if (rule.missAgain && (prev[lastTime + '|' + r.id] === 'MISSING' || prev[lastOld + '|' + r.id] === 'MISSING')) {
        amount = rule.missAgain;
        why = 'Missed twice in a row. ' + why;
      }
    }
    /* Nothing is charged before the day the team was told this was running.
       Without this the ledger charges from the moment it is switched on, and
       the first thing it would do is fine fifteen people for a day on which
       nobody had been told the system existed. Set LEDGER_START to that day
       (yyyy-mm-dd) and the figures are still calculated and still emailed —
       they simply cost nobody anything until then. */
    if (start && dueDay < start && amount > 0) {
      why = 'Not charged — before LEDGER_START (' + start + '). ' + why;
      amount = 0;
    }
    var line = {
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
    if (r.cadence === 'weekly') {
      line.dueDay = dueDay;
      line.week = weekLabel_(sundayOf_(day));
    }
    return line;
  });

  /* heaviest first — the Chairman reads the top of the list */
  ledger.sort(function (a, b) { return b.amount - a.amount; });
  return ledger;
}

/* What the ledger settles on a day. A daily report on its day and a monthly
   one on the 1st, as dueOn_ has it; a weekly report on the Sunday its week
   closes, every weekly report of the week at once, once 9 PM has passed —
   it can come, late, until then. The site still shows a weekly report as due
   on its own day (dueOn_ and js/app.js); this is only when it is settled.

   Weeks before WEEK_FROM_ were settled the old way, on the due day, and
   stay as they were: a day of those is closed again (a catch-up, a replay)
   exactly as it was. */
var WEEK_FROM_ = '2026-10-11';             /* the first Sunday that closes a week */
function owedOn_(schedule, day) {
  var newWay = sundayOf_(day) >= WEEK_FROM_;
  if (dow_(day) === 0) {
    return newWay ? schedule.reports.filter(function (r) { return r.cadence === 'weekly'; }) : [];
  }
  return dueOn_(schedule, day).filter(function (r) { return !newWay || r.cadence !== 'weekly'; });
}

/* Close one day: who owed what, what arrived, what it costs. With
   {write:false} it only calculates — that is how previewLedger and the
   Chairman's mid-day “Analyse now” use it.

   On a Sunday it closes the week: every weekly report of the week, and the
   rules read from them (Rules.js, ruleLinesForWeek_), judged on each report
   as its week finally stood — sent late on Saturday, or corrected, it is
   judged as it was last sent. Those lines carry their own due day and sit in
   the Sunday's document, so they count in the month the week ends in.

   A Sunday closes in two parts. {part:'week'} — at 9 PM, from the watch —
   settles the week and leaves the day open (dayOpen); {part:'day', doc} —
   on Monday morning — adds the rest of Sunday as any day is closed: what
   the Chairman recorded that day, at any hour, and the rules on reports
   sent that day. Without the second part, a fine he recorded at 10 PM on
   Sunday was in no close at all. With no part given, both at once. */
function closeDay_(day, opts) {
  opts = opts || {};
  var schedule = loadSchedule_();
  var names = {};
  (schedule.people || []).forEach(function (p) { names[p.id] = p.en; });

  var due = owedOn_(schedule, day);
  var isWeek = dow_(day) === 0 && due.length > 0;
  var part = isWeek ? (opts.part || 'all') : 'all';
  var now = opts.asOf || new Date();
  if (isWeek && part !== 'day' && opts.write !== false && now.getTime() < weekCut_(day).getTime()) {
    throw new Error('The week to ' + day + ' closes at 9 PM that Sunday; it cannot be closed before then.');
  }
  if (part === 'day' && !opts.doc) throw new Error('Closing the rest of ' + day + ' needs the week’s document');
  /* a week back, because a weekly report or a monthly one may come early;
     closing a week, two — the first week under the rule reaches back six
     days before its due day (weekWindow_) */
  var filings = filedBetween_(addDays_(day, isWeek ? -13 : -7), addDays_(day, 1));
  /* closing a week, the week before it in full — "missed twice in a row" */
  var back = isWeek ? -13 : -7;
  var before = ledgersBetween_(addDays_(day, back), day);
  var waivers = tryQuery_('waivers', [['day', 'GREATER_THAN_OR_EQUAL', addDays_(day, back)],
                                      ['day', 'LESS_THAN', day]], 'day');
  /* A weekly report already settled on its own day — by the code before
     this rule, for a week that straddled the change — is not charged again. */
  if (isWeek) {
    var old = {};
    before.forEach(function (doc) {
      if (doc.day <= addDays_(day, -7)) return;
      (doc.lines || []).forEach(function (l) { old[l.report] = true; });
    });
    due = due.filter(function (r) { return !old[r.id]; });
  }
  var ledger = part === 'day' ? (opts.doc.lines || [])
             : charge_(due, filings, day, before, opts.asOf || null, names, waivers);

  /* Every other rule in the letters — the fines for what happened, the
     bonuses — from Rules.js. Kept apart from `ledger`, which the agents
     and the packs read as "the reports that were owed". If the rulebook
     cannot be read, the report ledger still closes, and the failure is
     written down beside it rather than losing the day. */
  var rules = { lines: [], errors: [] };
  if (part !== 'week') {
    try { rules = ruleLinesForDay_(day, filings, schedule); }
    catch (e) { rules.errors.push('rulebook: ' + e.message); }
  }
  var dayLines = rules.lines;
  /* a week before WEEK_FROM_ had its weekly rules judged on the due day */
  var oldWay = !isWeek && due.some(function (r) { return r.cadence === 'weekly'; });
  if ((isWeek && part !== 'day') || oldWay) {
    var days = {};
    if (oldWay) days[day] = true;
    else due.forEach(function (r) { days[dueInWeek_(r, day)] = true; });
    Object.keys(days).sort().forEach(function (d) {
      try {
        var wk = ruleLinesForWeek_(d, filings, schedule);
        rules.lines = rules.lines.concat(wk.lines);
        rules.errors = rules.errors.concat(wk.errors);
      } catch (e) { rules.errors.push('rulebook (week of ' + d + '): ' + e.message); }
    });
    sortRuleLines_(rules.lines);
  }
  /* the rest of a Sunday joins the week already closed in its document */
  if (part === 'day') {
    rules.lines = sortRuleLines_((opts.doc.ruleLines || []).concat(dayLines));
    rules.errors = (opts.doc.ruleErrors || []).concat(rules.errors);
  }

  if (opts.write !== false && (due.length || rules.lines.length)) {
    var doc = {
      day: day,
      closedAt: part === 'day' && opts.doc.closedAt ? opts.doc.closedAt : new Date(),
      total: ledger.reduce(function (a, l) { return a + (l.amount || 0); }, 0),
      lines: ledger.map(function (l) {
        var o = { person: l.person, name: l.name, report: l.report, reportName: l.reportName,
                  due: l.due, status: l.status, at: l.at || null, amount: l.amount, why: l.why };
        if (l.dueDay) { o.dueDay = l.dueDay; o.week = l.week; }
        return o;
      }),
      ruleLines: rules.lines,
      rulePenalty: sumKind_(rules.lines, 'penalty'),
      ruleBonus: sumKind_(rules.lines, 'bonus'),
      ruleErrors: rules.errors
    };
    if (isWeek) {
      doc.dayOpen = part === 'week';
      doc.weekClosedAt = part === 'day' && opts.doc.weekClosedAt ? opts.doc.weekClosedAt : new Date();
    }
    fsPut_('ledger/' + day, doc);
    /* the Sheet gets each line once: the week's with the week, the rest of
       the Sunday with the rest */
    if (part !== 'day') writeLedgerTab_(ledger, day);
    writeRulesTab_(part === 'day' ? dayLines : rules.lines, day);
  }

  return {
    day: day,
    schedule: schedule,
    names: names,
    due: due,
    filings: filings,
    filed: filings.filter(function (f) { return f.day === day; }),
    before: before,
    ledger: ledger,
    ruleLines: rules.lines,
    ruleErrors: rules.errors,
    weekWaiting: weekWaiting_(schedule, day, filings, names, opts.asOf || null)
  };
}

/* The weekly reports of this week whose deadline had passed — by the end of
   `day`, or by the moment of a reading (`asOf`) — and that had not come —
   not charged: they count, as late, until the week closes. Said in the daily
   reading so a Friday report is not forgotten until the week has closed. A
   report whose deadline is still ahead is not waiting; one whose week has
   already turned (Selam's Monday summary turns at the start of Sunday) is
   missing, not waiting. */
function weekWaiting_(schedule, day, filings, names, asOf) {
  if (dow_(day) === 0 || sundayOf_(day) < WEEK_FROM_) return [];
  var sun = sundayOf_(day);
  var until = (asOf || dayStart_(addDays_(day, 1))).getTime();
  return schedule.reports.filter(function (r) {
    if (r.cadence !== 'weekly') return false;
    var dd = dueInWeek_(r, sun), w = weekWindow_(r, sun);
    if (dd > day || deadline_(r, dd).getTime() > until || until >= w.to) return false;
    return !filings.some(function (f) {
      var t = f.at.getTime();
      return f.report === r.id && f.person === r.person && t >= w.from && t < until;
    });
  }).map(function (r) {
    return { person: (names && names[r.person]) || r.person, report: r.en, due: r.dueEn || '' };
  });
}

/* ------------------------------------------------------------------ *
 *  Closing the week                                                   *
 * ------------------------------------------------------------------ */

/* Sunday 9 PM: the week is over. Its weekly reports are settled (the
   Sunday's close) and its summary is written and sent. The ten-minute watch
   does this within ten minutes of 9 PM; the Monday morning close does
   whatever of it the watch did not, and so does each morning after, so a
   failure is mended the next day. Returns what it did. Throws if the week
   could not be closed; a summary that fails is said in `warn` (and ran_ has
   already mailed it). */
function weekEnd_(sunday) {
  var out = { week: sunday, closed: false, dayClosed: false, pack: false, warn: [] };
  if (sunday < WEEK_FROM_) return out;
  var now = new Date().getTime();
  if (now < weekCut_(sunday).getTime()) return out;
  /* on Sunday night the week; from Monday the rest of Sunday too */
  var dayOver = now >= dayStart_(addDays_(sunday, 1)).getTime();
  var doc = ledgersBetween_(sunday, addDays_(sunday, 1))[0];
  if (!doc) {
    closeDay_(sunday, { part: dayOver ? 'all' : 'week' });
    out.closed = true;
    out.dayClosed = dayOver;
  } else if (doc.dayOpen && dayOver) {
    closeDay_(sunday, { part: 'day', doc: doc });
    out.dayClosed = true;
  }
  /* A summary sent is not sent again. If whether it was sent cannot be
     read, it is not sent: a second email and a second model bill are worse
     than a summary a morning late. */
  var packs;
  try { packs = fsQuery_('packs', [['end', 'EQUAL', sunday]], null); }
  catch (e) {
    out.warn.push('Weekly summary: could not check whether it was sent (' + e.message + ') — not sent again');
    return out;
  }
  if (!packs.some(function (p) { return p.kind === 'week'; })) {
    try { ran_('week', function () { return weeklyPack_(sunday); }); out.pack = true; }
    catch (e) { out.warn.push('Weekly summary: ' + e.message); }
  }
  return out;
}

/* From the watch: once a week, after 9 PM on Sunday. WEEK_TRIED keeps a
   failure to one try here — each try mails him when it fails and pays the
   model — and the Monday morning close tries again. */
function weekEndFromWatch_() {
  var today = todayAddis_();
  if (dow_(today) !== 0 || today < WEEK_FROM_) return;
  if (new Date().getTime() < weekCut_(today).getTime()) return;
  if (prop_('WEEK_TRIED', '') === today) return;
  PropertiesService.getScriptProperties().setProperty('WEEK_TRIED', today);
  try { weekEnd_(today); }
  catch (e) { Logger.log('week end: %s', e.message); }
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

/* The rest of the rulebook's lines, a row each, in two tabs: "Penalties"
   (fines, and the warnings and suspensions that go with them) and
   "Bonuses". Same window, not the record — the record is Firestore. */
var PENALTY_TAB_ = 'Penalties';
var BONUS_TAB_ = 'Bonuses';
function writeRulesTab_(lines, day) {
  if (!lines || !lines.length) return;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  [[PENALTY_TAB_, function (l) { return l.kind !== 'bonus'; }],
   [BONUS_TAB_, function (l) { return l.kind === 'bonus'; }]].forEach(function (t) {
    var mine = lines.filter(t[1]);
    if (!mine.length) return;
    var sh = ss.getSheetByName(t[0]);
    if (!sh) {
      sh = ss.insertSheet(t[0]);
      sh.appendRow(['Date', 'Person', t[0] === BONUS_TAB_ ? 'Bonus' : 'Fine or warning', 'Birr',
                    'Not counted yet (would be)', 'Why', 'Under which letter']);
      sh.setFrozenRows(1);
    }
    var rows = mine.map(function (l) {
      return [day, cell_(l.name), l.reportName, l.kind === 'consequence' ? '' : l.amount, l.wouldBe || '',
              cell_(l.why), l.src];
    });
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, 7).setValues(rows);
  });
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
/* A cell written into the Sheet from something a person (or the model)
   typed. A leading = + @ makes Sheets read it as a formula — a HYPERLINK to
   anywhere, or worse — so such a value is stored as text. A minus is left
   alone in front of a number, which is just a negative figure. */
function cell_(v) {
  if (typeof v !== 'string') return v;
  return /^[=+@\t\r]/.test(v) || /^-[^0-9.\s]/.test(v) ? "'" + v : v;
}
function esc_(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
