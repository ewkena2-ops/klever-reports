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
     GEMINI_KEY   your key from aistudio.google.com   (required)
     GEMINI_MODEL defaults to gemini-3.8-flash        (optional)
     SITE         defaults to the GitHub Pages URL    (optional)
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

/* Weekly reports are charged separately and only on their due day. */
var WEEKLY_PENALTY = {
  ephrata: { late: 500, src: 'Ephrata — weekly commercial report late' },
  liu:     { late: 500, src: 'Mahelet — weekly report late' },
  betty:   { late: 500, src: 'Betelhem — weekly finance report late' }
};

/* ------------------------------------------------------------------ *
 *  Entry points                                                       *
 * ------------------------------------------------------------------ */

/* Run once from the editor after adding this file. Google only shows the
   consent screen when a function is run from here — opening the web app URL
   re-runs the old permission set and will not prompt. */
function authorizeAgent() {
  UrlFetchApp.fetch(AGENT_DEFAULT_SITE + 'js/forms.js').getResponseCode();
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

/* Every row filed today, across every report tab. The archive writes one tab
   per report type with 'Sent at' in column A and 'Person' in column B. */
function filedOn_(when) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var day = Utilities.formatDate(when, tz_(), 'yyyy-MM-dd');
  var out = [];

  ss.getSheets().forEach(function (sh) {
    var name = sh.getName();
    if (name === LEDGER_TAB_ || name === 'Chat') return;
    var last = sh.getLastRow();
    if (last < 2) return;

    var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    if (String(head[0]).indexOf('Sent at') === -1) return;   /* not an archive tab */

    var rows = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
    rows.forEach(function (row) {
      var at = row[0];
      if (!(at instanceof Date)) return;
      if (Utilities.formatDate(at, tz_(), 'yyyy-MM-dd') !== day) return;
      var rec = { tab: name, at: at, person: String(row[1] || ''), status: String(row[2] || ''), fields: {} };
      for (var c = 4; c < head.length; c++) {
        if (head[c] && row[c] !== '' && row[c] != null) rec.fields[head[c]] = row[c];
      }
      out.push(rec);
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
      /* the archive names a tab after the report, which is how a filing is
         matched back to what was owed */
      if (filed[i].tab === r.en || filed[i].tab.indexOf(r.en) === 0) { hit = filed[i]; break; }
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
    } else if (String(hit.status).toUpperCase().indexOf('LATE') === 0) {
      line.status = 'LATE';
      line.amount = rule && rule.late ? rule.late : 0;
    } else {
      line.status = 'On time';
      line.amount = 0;
    }
    ledger.push(line);
  });

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
      return { report: f.tab, person: f.person, at: String(f.at), values: f.fields };
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
