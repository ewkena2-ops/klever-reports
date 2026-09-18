/* Klever penalty ledger — the daily agent.

   WHAT IT DOES, IN ORDER
   1. Works out who owed a report today, from the live schedule on the site.
   2. Reads the archive to see who actually filed, and when.
   3. Adds up the penalties. This part is arithmetic, and arithmetic is done
      here in code — never by the model. A model that is asked to count rows
      will eventually miscount one, and this number is money taken off a
      person's pay.
   4. Asks Gemini for the one thing code cannot do: read the day's reports and
      the day's chat and say what deserves the Chairman's attention.
   5. Writes the ledger to its own tab and emails him.

   WHY THE PENALTIES ARE IN THIS FILE AND NOT IN THE PROMPT
   Every figure below is quoted from a signed letter, with the person it binds
   named beside it. If a figure here is wrong, a person is charged the wrong
   amount, so each one must be traceable to the paper it came from. Change one
   here only when the letter changes.

   SET UP: Project Settings -> Script Properties
     GEMINI_KEY       your key from aistudio.google.com     (required)
     FIREBASE_WEB_KEY the apiKey from js/firebase-config.js  (required)
     LEDGER_PASSWORD  the ledger@klever.local password       (required)
     GEMINI_MODEL     defaults to gemini-3.8-flash           (optional)
     FIREBASE_PROJECT defaults to klever-26ad1               (optional)
     SITE             defaults to the GitHub Pages URL       (optional)
   Then Triggers -> Add trigger -> dailyLedger -> Time-driven -> Day timer
   -> 6pm to 7pm. Run authorizeAgent() once from the editor first: a deployed
   script's permissions are frozen at first approval, and adding UrlFetch will
   otherwise fail silently at runtime.                                       */

var AGENT_DEFAULT_SITE = 'https://ewkena2-ops.github.io/klever-reports/';
var AGENT_DEFAULT_MODEL = 'gemini-3.8-flash';

/* ------------------------------------------------------------------ *
 *  The penalties, quoted from the signed letters                      *
 * ------------------------------------------------------------------ */

/* late  = filed after the deadline in the letter
   miss  = not filed at all that day
   Keyed by the person id the site uses. `src` is the letter it came from, so
   anyone auditing a charge can go and read it. */
var REPORT_PENALTY = {
  ephrata:    { late: 500,  miss: 1000, src: 'Ephrata, Commercial Lead — daily commercial report' },
  liu:        { late: 200,  miss: 500,  src: 'Mahelet, Operations Lead — daily operations report' },
  betty:      { late: 200,  miss: 500,  src: 'Betelhem, Finance Officer — daily finance / customer pulse' },
  getachew:   { late: 200,  miss: 500,  src: 'Getachew, Purchasing Officer — daily purchasing report' },
  amaha:      { late: 200,  miss: 500,  src: 'Amaha, Production Supervisor — daily production report' },
  wude:       { late: 200,  miss: 500,  src: 'Wude, Quality Control — daily QC report' },
  elyas:      { late: 200,  miss: 500,  src: 'Elyas, Site Supervisor — daily site report' },
  ashenafi:   { late: 100,  miss: 300,  src: 'Ashenafi, Site Helper — daily support report' },
  tsega:      { late: 200,  miss: 500,  src: 'Salesperson letter — daily sales report' },
  biruktayet: { late: 200,  miss: 500,  src: 'Salesperson letter — daily sales report' },
  yohannis:   { late: 200,  miss: 500,  src: 'Designer letter — daily design report' },
  yonas:      { late: 200,  miss: 500,  src: 'Designer letter — daily design report' },
  'abrham-g': { late: 200,  miss: 500,  src: 'Designer letter — daily design report' },
  teklweld:   { late: 200,  miss: 500,  src: 'Designer letter — daily design report' },
  'abrham-w': { late: 200,  miss: 500,  src: 'Designer letter — daily design report' }

  /* YORDANOS IS ABSENT ON PURPOSE. He files a daily store report — the site
     has the form — but his letter carries no penalty for filing it late or
     not filing it. Every other daily reporter has one. Until the Chairman
     says what it is, this agent will list him as missing and charge him
     nothing, which is what the signed paper actually says. */
};

/* Weekly reports are charged separately and only on their due day.

   NOTE THE MISSING `miss`, AND THAT IT IS NOT AN OVERSIGHT HERE.
   Every letter sets a figure for a weekly report filed LATE — 500 Birr, the
   same in all of them — and not one sets a figure for a weekly report that
   never arrives at all. Ephrata's is the single exception, and only for her
   marketing report. So under the paper as signed, filing a weekly report an
   hour late costs 500 Birr and not filing it costs nothing, which cannot be
   what was meant.

   This charges what the letters actually say, which is zero, and the decision
   register raises it on the days it costs something. Adding a number here
   before the Chairman sets one would be inventing a fine. */
var WEEKLY_PENALTY = {
  ephrata: { late: 500, src: 'Ephrata — weekly commercial report late' },
  liu:     { late: 500, src: 'Mahelet — weekly report late' },
  betty:   { late: 500, src: 'Betelhem — weekly finance report late' },
  amaha:   { late: 500, src: 'Amaha — weekly production summary late' },
  wude:    { late: 500, src: 'Wude — weekly QC summary late' }
};

/* ------------------------------------------------------------------ *
 *  Entry points                                                       *
 * ------------------------------------------------------------------ */

/* Run once from the editor after adding this file. Google only shows the
   consent screen when a function is run from here — opening the web app URL
   re-runs the old permission set and will not prompt. */
function authorizeAgent() {
  UrlFetchApp.fetch(AGENT_DEFAULT_SITE + 'js/forms.js').getResponseCode();
  fsToken_();   /* fail here, in the editor, rather than silently at 6pm */
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(),
                    'Klever agent — permission granted',
                    'The ledger can now read the schedule and call Gemini.');
}

/* The daily trigger. */
function dailyLedger() {
  var when = new Date();
  var schedule = loadSchedule_();
  var due = dueToday_(schedule, when);
  var filed = filedOn_(when);
  var ledger = charge_(due, filed, when);
  var note = askGemini_(ledger, filed, when);
  writeLedger_(ledger, when, note);
  mailLedger_(ledger, when, note);
}

/* Same thing, but writes nothing and sends nothing — for trying it out. */
function previewLedger() {
  var when = new Date();
  var schedule = loadSchedule_();
  var due = dueToday_(schedule, when);
  var filed = filedOn_(when);
  var ledger = charge_(due, filed, when);
  Logger.log('due today: %s', due.length);
  Logger.log('filed: %s', filed.length);
  ledger.forEach(function (r) {
    Logger.log('%s | %s | %s | %s Birr', r.person, r.report, r.status, r.amount);
  });
  Logger.log('total: %s Birr', ledger.reduce(function (a, r) { return a + r.amount; }, 0));
}

/* ------------------------------------------------------------------ *
 *  The schedule, read from the live site                              *
 * ------------------------------------------------------------------ */

/* forms.js is the only place the report schedule exists. Rather than keep a
   second copy here that would drift out of step within a month, the agent
   fetches that file and evaluates it. It is our own file on our own site;
   if that ever stops being true, this is the line to change. */
function loadSchedule_() {
  var site = prop_('SITE', AGENT_DEFAULT_SITE);
  var src = UrlFetchApp.fetch(site + 'js/forms.js', { muteHttpExceptions: true });
  if (src.getResponseCode() !== 200) {
    throw new Error('Could not read the schedule from ' + site + ' (HTTP ' +
                    src.getResponseCode() + ')');
  }
  var sandbox = {};
  /* forms.js declares PEOPLE and REPORTS at the top level and nothing else */
  var read = new Function(src.getContentText() + '; return { people: PEOPLE, reports: REPORTS };');
  sandbox = read();
  if (!sandbox.reports || !sandbox.reports.length) throw new Error('Schedule came back empty');
  return sandbox;
}

/* Everything that was owed today, by the rules in each report's own entry:
   daily reports skip the days their letter excuses, weekly ones land on their
   due day, monthly ones on the 1st. */
function dueToday_(schedule, when) {
  var dow = when.getDay();                 /* 0 Sun .. 6 Sat */
  var out = [];
  schedule.reports.forEach(function (r) {
    if (dow === 0) return;                 /* Sunday is nobody's reporting day */
    if (r.cadence === 'daily') {
      if (r.skipDays && r.skipDays.indexOf(dow) !== -1) return;
      out.push(r);
    } else if (r.cadence === 'weekly') {
      if (r.dueDay === dow) out.push(r);
    } else if (r.cadence === 'monthly') {
      if (when.getDate() === 1) out.push(r);
    }
  });
  return out;
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

   The second is that it keeps working. The Sheet version read every row of
   every tab each evening to find the day's thirty — about 440,000 cells after
   a year, 880,000 after two, against a six-minute execution limit. It would
   have timed out silently somewhere in year two and simply stopped emailing.
   A query asks for the day and gets the day: thirty reads whether the archive
   holds a thousand reports or a million.                                    */

function fsBase_() {
  return 'https://firestore.googleapis.com/v1/projects/' +
         prop_('FIREBASE_PROJECT', 'klever-26ad1') + '/databases/(default)';
}

/* An hour-long token for the ledger's own account — a reader that cannot file
   a report, touch chat, or alter anything. Set LEDGER_PASSWORD in Script
   Properties; it is not the Chairman's password and must not be. */
function fsToken_() {
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
  return JSON.parse(res.getContentText()).idToken;
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

/* Every report filed today. One query, one page — it does not get slower as
   the archive grows. */
function filedOn_(when) {
  var tz = tz_();
  var day = Utilities.formatDate(when, tz, 'yyyy-MM-dd');
  var midnight = new Date(when.getFullYear(), when.getMonth(), when.getDate(), 0, 0, 0);
  var from = Utilities.formatDate(midnight, 'UTC', "yyyy-MM-dd'T'HH:mm:ss'Z'");

  var res = UrlFetchApp.fetch(fsBase_() + '/documents:runQuery', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + fsToken_() },
    muteHttpExceptions: true,
    payload: JSON.stringify({ structuredQuery: {
      from: [{ collectionId: 'reports' }],
      where: { fieldFilter: { field: { fieldPath: 'at' },
                              op: 'GREATER_THAN_OR_EQUAL',
                              value: { timestampValue: from } } },
      orderBy: [{ field: { fieldPath: 'at' }, direction: 'ASCENDING' }]
    } })
  });

  if (res.getResponseCode() !== 200) {
    throw new Error('Could not read the archive (HTTP ' + res.getResponseCode() +
                    '): ' + res.getContentText().substring(0, 300));
  }

  var out = [];
  JSON.parse(res.getContentText()).forEach(function (row) {
    if (!row.document) return;        /* an empty result carries one blank entry */
    var f = row.document.fields || {};
    var at = fsValue_(f.at);
    if (!at || Utilities.formatDate(at, tz, 'yyyy-MM-dd') !== day) return;
    out.push({
      person: fsValue_(f.person),
      report: fsValue_(f.report),
      by:     fsValue_(f.by),
      late:   !!fsValue_(f.late),
      at:     at,
      fields: fsValue_(f.values) || {},
      flags:  fsValue_(f.flags) || [],
      text:   fsValue_(f.text) || ''
    });
  });
  return out;
}

/* ------------------------------------------------------------------ *
 *  The arithmetic                                                     *
 * ------------------------------------------------------------------ */

/* One line per report that was owed, saying what happened to it and what that
   costs under that person's own letter. No model touches this. */
function charge_(due, filed, when) {
  var ledger = [];

  due.forEach(function (r) {
    var hit = null;
    for (var i = 0; i < filed.length; i++) {
      /* a filed report carries the id of the report it answers, so this is an
         exact match rather than the tab-name guess the Sheet version needed */
      if (filed[i].report === r.id) { hit = filed[i]; break; }
    }

    var table = r.cadence === 'weekly' ? WEEKLY_PENALTY : REPORT_PENALTY;
    var rule = table[r.person] || null;
    var line = {
      person: r.person,
      report: r.en,
      due: r.dueEn || '',
      status: '',
      amount: 0,
      why: rule ? rule.src : 'No penalty for this report in this person’s letter',
      at: hit ? hit.at : null
    };

    if (!hit) {
      line.status = 'MISSING';
      line.amount = rule && rule.miss ? rule.miss : 0;
    } else if (hit.late) {
      line.status = 'LATE';
      line.amount = rule && rule.late ? rule.late : 0;
    } else {
      line.status = 'On time';
      line.amount = 0;
    }
    ledger.push(line);
  });

  /* Nothing is charged before the day the team was told this was running.
     Without this the ledger charges from the moment it is switched on, and the
     first thing it would have done here is fine fifteen people 8,300 Birr for
     a Friday on which nobody had been told the system existed. Set
     LEDGER_START to that day (yyyy-mm-dd) and the figures are still calculated
     and still emailed — they simply cost nobody anything until then. */
  var start = prop_('LEDGER_START', '');
  if (start) {
    var today = Utilities.formatDate(when, tz_(), 'yyyy-MM-dd');
    if (today < start) {
      ledger.forEach(function (l) {
        if (l.amount > 0) {
          l.why = 'Not charged — before LEDGER_START (' + start + '). ' + l.why;
          l.amount = 0;
        }
      });
    }
  }

  /* heaviest first — the Chairman reads the top of the list */
  ledger.sort(function (a, b) { return b.amount - a.amount; });
  return ledger;
}

/* ------------------------------------------------------------------ *
 *  The part that needs judgment                                       *
 * ------------------------------------------------------------------ */

function askGemini_(ledger, filed, when) {
  var key = prop_('GEMINI_KEY', '');
  if (!key) return '(No GEMINI_KEY set, so no analysis — the ledger above is still complete.)';

  var model = prop_('GEMINI_MODEL', AGENT_DEFAULT_MODEL);
  var prompt = [
    'You are reading one day of operating reports from Klever Kuche, a kitchen',
    'manufacturer in Addis Ababa. Prices are in Birr.',
    '',
    'The penalty ledger below was already calculated in code and is correct.',
    'Do not recalculate it, restate it, or comment on the arithmetic.',
    '',
    'Your job is the part arithmetic cannot do. Read the filed reports and say',
    'what the Chairman should know. Look for:',
    '  - a number moving in a bad direction over the day, not just a missed target',
    '  - two reports that contradict each other',
    '  - something a person wrote in a comment field that matters more than the figures',
    '  - a problem the targets would not catch because no rule covers it',
    '',
    'Write at most 150 words, in plain English, as short bullet points. If the',
    'day was ordinary, say so in one line — do not invent a concern to fill space.',
    'Never name a penalty amount; that is handled elsewhere.',
    '',
    '--- TODAY: ' + Utilities.formatDate(when, tz_(), 'EEEE d MMMM yyyy') + ' ---',
    '',
    '--- REPORTS FILED ---',
    JSON.stringify(filed.map(function (f) {
      return { report: f.report, person: f.person, at: String(f.at), values: f.fields };
    }), null, 1),
    '',
    '--- NOT FILED / LATE (for context only) ---',
    ledger.filter(function (l) { return l.status !== 'On time'; })
          .map(function (l) { return l.person + ' — ' + l.report + ' — ' + l.status; })
          .join('\n') || '(everything arrived on time)'
  ].join('\n');

  var res = UrlFetchApp.fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/' + model +
    ':generateContent?key=' + encodeURIComponent(key),
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      muteHttpExceptions: true
    });

  if (res.getResponseCode() !== 200) {
    /* the ledger is the point; a failed analysis must never cost the ledger */
    return '(Gemini returned HTTP ' + res.getResponseCode() + ' — ledger unaffected.)';
  }
  try {
    var body = JSON.parse(res.getContentText());
    var text = body.candidates[0].content.parts[0].text;
    return String(text).trim();
  } catch (e) {
    return '(Could not read Gemini’s reply — ledger unaffected.)';
  }
}

/* ------------------------------------------------------------------ *
 *  Output                                                             *
 * ------------------------------------------------------------------ */

var LEDGER_TAB_ = 'Penalty Ledger';

function writeLedger_(ledger, when, note) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(LEDGER_TAB_);
  if (!sh) {
    sh = ss.insertSheet(LEDGER_TAB_);
    sh.appendRow(['Date', 'Person', 'Report', 'Due', 'Status', 'Birr', 'Under which letter']);
    sh.setFrozenRows(1);
  }
  var day = Utilities.formatDate(when, tz_(), 'yyyy-MM-dd');
  var rows = ledger.map(function (l) {
    return [day, l.person, l.report, l.due, l.status, l.amount, l.why];
  });
  if (rows.length) {
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, 7).setValues(rows);
  }
}

function mailLedger_(ledger, when, note) {
  var owed = ledger.filter(function (l) { return l.amount > 0; });
  var total = ledger.reduce(function (a, l) { return a + l.amount; }, 0);
  var day = Utilities.formatDate(when, tz_(), 'EEEE d MMMM yyyy');

  var subject = total > 0
    ? 'Klever ledger ' + day + ' — ' + fmt_(total) + ' Birr across ' + owed.length
    : 'Klever ledger ' + day + ' — nothing owed';

  var rowsHtml = ledger.map(function (l) {
    var colour = l.status === 'On time' ? '#41631a'
               : l.status === 'LATE' ? '#8f3020' : '#8f3020';
    return '<tr>' +
      '<td style="padding:6px 10px;border-bottom:1px solid #e4e7e3">' + esc_(l.person) + '</td>' +
      '<td style="padding:6px 10px;border-bottom:1px solid #e4e7e3">' + esc_(l.report) + '</td>' +
      '<td style="padding:6px 10px;border-bottom:1px solid #e4e7e3;color:' + colour + '">' + esc_(l.status) + '</td>' +
      '<td style="padding:6px 10px;border-bottom:1px solid #e4e7e3;text-align:right;' +
          'font-family:monospace">' + (l.amount ? fmt_(l.amount) : '—') + '</td>' +
      '</tr>';
  }).join('');

  var html =
    '<div style="font-family:Helvetica,Arial,sans-serif;max-width:640px;color:#141b1a">' +
    '<h2 style="font-size:17px;margin:0 0 2px">Penalty ledger</h2>' +
    '<div style="color:#66716d;font-size:13px;margin-bottom:16px">' + esc_(day) + '</div>' +
    '<table style="border-collapse:collapse;width:100%;font-size:13.5px">' +
      '<tr style="text-align:left;color:#66716d;font-size:11px;letter-spacing:.1em">' +
        '<th style="padding:0 10px 6px">PERSON</th><th style="padding:0 10px 6px">REPORT</th>' +
        '<th style="padding:0 10px 6px">STATUS</th>' +
        '<th style="padding:0 10px 6px;text-align:right">BIRR</th></tr>' +
      rowsHtml +
      '<tr><td colspan="3" style="padding:10px;font-weight:bold">Total</td>' +
      '<td style="padding:10px;text-align:right;font-family:monospace;font-weight:bold">' +
        fmt_(total) + '</td></tr>' +
    '</table>' +
    '<h3 style="font-size:14px;margin:26px 0 6px">What stood out today</h3>' +
    '<div style="font-size:13.5px;line-height:1.6;white-space:pre-wrap;color:#3a4442">' +
      esc_(note) + '</div>' +
    '<p style="color:#66716d;font-size:11.5px;margin-top:26px;line-height:1.6">' +
      'Amounts come from each person’s signed letter and are calculated in code, not by ' +
      'the model. The note above is written by Gemini and is not a charge. ' +
      'Yordanos files a daily store report but his letter sets no penalty for missing it — ' +
      'he is listed and charged nothing until the Chairman decides.' +
    '</p></div>';

  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    subject: subject,
    htmlBody: html
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
function esc_(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
