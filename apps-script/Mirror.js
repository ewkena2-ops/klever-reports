/* THE SHEET'S COPY REACHES THE DATABASE (5 Nov 2026, the owner: "on Klever,
   Yonas Abate shows that he sent the report on his phone, but on the
   Chairman's dashboard it says ✗ — why?").

   Send puts a report in two places: a row on the Sheet (this script, which
   also mails the Chairman) and a filing in Firestore /reports, written by the
   phone itself — and the board, the ledger and every reader go by the
   filing. On a very slow line the first gets through and the second does not:
   it waits on the phone, and Safari closing the page loses it. Yonas sent on
   time on Mon 2, Tue 3 and Thu 5 November, the Sheet has all three, Firestore
   none, and the ledger charged him 500 Birr for each "missing" day.

   So every report this script receives is noted on the tab below, and the
   watch looks at each note once the phone has had ten minutes: the database
   has the phone's own filing — the note goes; it has not — this script files
   the copy itself, at the time it received the row. The row is believed as
   far as doPost believes it: the sender's sign-in token, the report's owner
   from the schedule, the time from this server's clock. The rules let only
   the ledger's account file such a copy, marked via 'sheet', for the person
   whose report it is (or the Chairman's, on their behalf), up to three days
   back. A phone whose own filing turns up later still files it; it reads as
   a correction, the copy's time counts. */

var MIRROR_TAB_ = 'Database copies';
var MIRROR_HEAD_ = ['Received', 'Person', 'Report', 'State', 'Note'];
var MIRROR_WAIT_MS_ = 10 * 60e3;      /* the phone's own filing has this long */
var MIRROR_SLACK_MS_ = 15 * 60e3;     /* a phone's clock and a slow post: its filing may say a little earlier */
var MIRROR_GIVE_UP_MS_ = 3 * 864e5;   /* the rules take a copy up to three days back */
var MIRROR_KEEP_MS_ = 7 * 864e5;      /* a copy made stays noted this long */
var MIRROR_CHUNK_ = 45000;            /* a cell holds 50,000 characters */
/* each part of the copy starts with this, so the Sheet never reads a part as
   a number, a date or a formula ("1.50" would come back "1.5") */
var MIRROR_MARK_ = '~';

function mirrorSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(MIRROR_TAB_);
  if (!sh) {
    sh = ss.insertSheet(MIRROR_TAB_);
    sh.appendRow(MIRROR_HEAD_.concat(['Copy']));
    sh.setFrozenRows(1);
  }
  return sh;
}

/* What the phone files, as this script has it */
function mirrorCopyOf_(row) {
  return {
    person: row.person, report: row.report, by: row.by, late: !!row.late, due: row.due || '',
    values: row.values && typeof row.values === 'object' ? row.values : {},
    flags: (Object.prototype.toString.call(row.flags) === '[object Array]' ? row.flags : []).slice(0, 200).map(String),
    text: String(row.text || '').substring(0, 60000),
    lang: row.lang === 'am' ? 'am' : 'en',
    at: row.at
  };
}

/* TIMES ON THE SHEET. This spreadsheet keeps Los Angeles's clock. A date
   written into a cell is put down as that clock shows it, and comes back as
   though that clock were UTC's: Yonas's report, in at 14:15:31Z, read back
   as 06:15:31Z, and the first copy of it was filed at 9:15 AM Addis instead
   of 5:15 PM (5 Nov 2026; measured, both ways round, on the live Sheet). So
   the time a note goes by is the exact one in the copy, never a cell's; the
   Received column is words for the eye; and a date read off a report's tab
   is put right here. */
function wallMs_(d, tz) {
  var m = /(\d+)-(\d+)-(\d+) (\d+):(\d+)/.exec(Utilities.formatDate(d, tz, 'yyyy-MM-dd HH:mm'));
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) + ((d.getTime() % 60000) + 60000) % 60000;
}
function sheetTz_() {
  try { return SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone() || tz_(); } catch (e) { return tz_(); }
}
function sheetTime_(d, sheetTz) {
  var wall = d.getTime();                                /* the spreadsheet's clock, read as UTC's */
  var off = wallMs_(new Date(wall), sheetTz) - wall;     /* that clock, ahead of UTC by */
  return new Date(wall - off);
}
function mirrorAtOf_(r) {
  try {
    var c = JSON.parse(r.slice(MIRROR_HEAD_.length).map(function (p) {
      p = String(p == null ? '' : p);
      return p.charAt(0) === MIRROR_MARK_ ? p.substring(1) : p;
    }).join(''));
    return { copy: c, at: new Date(c.at).getTime() };
  } catch (e) { return { copy: null, at: NaN }; }
}

/* doPost, after the row is on its tab. A failure here costs no report. */
function mirrorNote_(row) {
  try {
    var json = JSON.stringify(mirrorCopyOf_(row));
    var parts = [];
    for (var i = 0; i < json.length; i += MIRROR_CHUNK_) parts.push(MIRROR_MARK_ + json.substring(i, i + MIRROR_CHUNK_));
    var seen = Utilities.formatDate(new Date(row.at), tz_(), 'yyyy-MM-dd HH:mm:ss') + ' Addis';
    mirrorSheet_().appendRow([seen, row.person, row.report, 'waiting', ''].concat(parts));
  } catch (e) { Logger.log('mirror note %s: %s', row && row.report, e.message); }
}

/* the phone's own filings of one person since a time: [{report, at}] — two
   fields each, none of the readers' patches */
function mirrorFiledSince_(person, since) {
  var rows = fsRun_('reports', {
    from: [{ collectionId: 'reports' }],
    select: { fields: [{ fieldPath: 'report' }, { fieldPath: 'at' }] },
    where: { compositeFilter: { op: 'AND', filters: [
      { fieldFilter: { field: { fieldPath: 'person' }, op: 'EQUAL', value: { stringValue: person } } },
      { fieldFilter: { field: { fieldPath: 'at' }, op: 'GREATER_THAN_OR_EQUAL', value: { timestampValue: since.toISOString() } } }
    ] } }
  });
  return rows.filter(function (r) { return r.document; }).map(function (r) { return fsDoc_(r.document); });
}

/* who it is for, besides the Chairman and the sender — as the phone works it out */
function mirrorTo_(report) {
  try {
    var rep = loadSchedule_().reports.filter(function (r) { return r.id === report; })[0];
    if (!rep) return [];
    return loadWeeklyLib_().W.recipientsOf(rep)
      .filter(function (id) { return id !== 'chairman' && id !== rep.person; }).slice(0, 6);
  } catch (e) { return []; }
}

/* One filing, at the time given (not the server's): the rules take that from
   the ledger's account only, via 'sheet', and no further back than three days */
function mirrorFile_(copy) {
  var base = fsBase_();
  var id = Utilities.getUuid().replace(/-/g, '').substring(0, 20);
  var doc = {
    person: copy.person, report: copy.report, by: copy.by, late: !!copy.late, due: copy.due || '',
    values: copy.values || {}, flags: copy.flags || [], text: copy.text || '', lang: copy.lang || 'en',
    to: mirrorTo_(copy.report), at: new Date(copy.at), via: 'sheet'
  };
  var fields = {};
  Object.keys(doc).forEach(function (k) { fields[k] = fsEncode_(doc[k]); });
  var res = UrlFetchApp.fetch(base + '/documents:commit', {
    method: 'post', contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + fsToken_() },
    muteHttpExceptions: true,
    payload: JSON.stringify({ writes: [{
      update: { name: base.replace(/^https:\/\/firestore\.googleapis\.com\/v1\//, '') + '/documents/reports/' + id, fields: fields },
      currentDocument: { exists: false }
    }] })
  });
  if (res.getResponseCode() !== 200) {
    throw new Error('HTTP ' + res.getResponseCode() + ': ' + res.getContentText().substring(0, 200));
  }
  return id;
}

/* The watch (every ten minutes) and the morning close, before it reads the
   day. `opts.now`: the Chairman asked (mirrorPost_) — the ten minutes are not
   waited. Returns what it did. */
function mirrorWatch_(opts) {
  opts = opts || {};
  var out = { checked: 0, inDb: 0, copied: [], failed: [], gaveUp: 0 };
  var cache = CacheService.getScriptCache();
  if (cache.get('mirror:busy')) return out;
  cache.put('mirror:busy', '1', 300);
  try {
    var sh = mirrorSheet_();
    var n = sh.getLastRow();
    if (n < 2) return out;
    var width = Math.max(sh.getLastColumn(), MIRROR_HEAD_.length + 1);
    var rows = sh.getRange(2, 1, n - 1, width).getValues();
    var now = Date.now(), drop = [], seen = {};
    rows.forEach(function (r, i) {
      var parsed = mirrorAtOf_(r), at = parsed.at;
      var state = String(r[3] || '');
      if (state === 'copied' || state === 'gave up') {
        if (now - at > MIRROR_KEEP_MS_) drop.push(i + 2);
        return;
      }
      if (!(at > 0)) { drop.push(i + 2); return; }
      if (!opts.now && now - at < MIRROR_WAIT_MS_) return;
      if (now - at > MIRROR_GIVE_UP_MS_) {
        sh.getRange(i + 2, 4, 1, 2).setValues([['gave up', 'older than three days: the rules take no copy']]);
        out.gaveUp++;
        return;
      }
      out.checked++;
      var person = String(r[1]), report = String(r[2]);
      var key = person + '|' + Math.floor((at - MIRROR_SLACK_MS_) / 60e3);
      try {
        var filed = seen[key] || (seen[key] = mirrorFiledSince_(person, new Date(at - MIRROR_SLACK_MS_)));
        if (filed.some(function (f) { return f.report === report; })) { out.inDb++; drop.push(i + 2); return; }
        var id = mirrorFile_(parsed.copy);
        sh.getRange(i + 2, 4, 1, 2).setValues([['copied', 'filed ' + id + ' at ' +
          Utilities.formatDate(new Date(), tz_(), 'd MMM HH:mm') + ' — the phone\'s own had not come']]);
        out.copied.push(person + ' ' + report + ' ' + Utilities.formatDate(new Date(at), tz_(), 'd MMM HH:mm'));
        Logger.log('mirror: copied %s %s (%s)', person, report, id);
      } catch (e) {
        sh.getRange(i + 2, 5).setValue(String(e.message).substring(0, 300));
        out.failed.push(person + ' ' + report + ': ' + e.message);
      }
    });
    /* bottom up, so a row still to go keeps its place; a row doPost adds
       meanwhile comes after all of these */
    drop.sort(function (a, b) { return b - a; }).forEach(function (rn) { sh.deleteRow(rn); });
  } finally {
    cache.remove('mirror:busy');
  }
  return out;
}

/* A report the Sheet had before this file existed: noted again from its row on
   the report's tab. Answers come back as the phone filed them — as text, a
   list or table as it was — but a value the Sheet turned into a number or a
   date is written back as one would type it. Rows already noted are skipped. */
function mirrorFromSheet_(reportId, from, dry) {
  var sched = loadSchedule_();
  var rep = sched.reports.filter(function (r) { return r.id === reportId; })[0];
  if (!rep) throw new Error('no report ' + reportId);
  var owner = sched.people.filter(function (p) { return p.id === rep.person; })[0] || {};
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(String(rep.en).substring(0, 90));
  if (!sh || sh.getLastRow() < 2) return 0;
  var data = sh.getDataRange().getValues(), head = data[0];
  var col = function (name) { return head.indexOf(name); };
  var noted = {}, sec = function (ms) { return Math.round(ms / 1000); };
  var m = mirrorSheet_();
  if (m.getLastRow() >= 2) {
    m.getRange(2, 1, m.getLastRow() - 1, Math.max(m.getLastColumn(), MIRROR_HEAD_.length + 1)).getValues().forEach(function (r) {
      noted[String(r[2]) + '|' + sec(mirrorAtOf_(r).at)] = 1;
    });
  }
  var stz = sheetTz_();
  var asText = function (v) {
    if (v instanceof Date) return Utilities.formatDate(v, tz_(), 'yyyy-MM-dd');
    if (typeof v === 'string' && /^[\[{]/.test(v)) { try { return JSON.parse(v); } catch (e) { return v; } }
    if (typeof v === 'string' && v.charAt(0) === "'") return v.substring(1);
    return String(v);
  };
  var n = 0, found = [];
  data.slice(1).forEach(function (r) {
    if (!(r[0] instanceof Date)) return;
    var at = sheetTime_(r[0], stz);
    if (!(at.getTime() >= from.getTime())) return;
    if (String(r[1]) !== String(owner.en || rep.person)) return;
    if (noted[rep.id + '|' + sec(at.getTime())]) return;
    /* looked at only: the times as they would be filed, nothing noted */
    if (dry) { found.push({ cell: r[0].toISOString(), at: at.toISOString(), status: String(r[2] || '') }); return; }
    var values = {};
    head.forEach(function (h, i) {
      if (i < 4 || h === 'Filed by' || h === 'Message' || r[i] === '' || r[i] == null) return;
      values[String(h).replace(/^answer: /, '')] = asText(r[i]);
    });
    var by = String(r[col('Filed by')] || '') === 'Chairman' ? 'chairman' : rep.person;
    var status = String(r[2] || '');
    mirrorNote_({
      person: rep.person, report: rep.id, by: by, late: /^LATE/i.test(status), due: rep.dueEn || '',
      values: values, flags: [], text: String(r[col('Message')] || '').replace(/^'/, ''), lang: 'en',
      at: at.toISOString()
    });
    n++;
  });
  return dry ? found : n;
}

/* The Chairman's account asks (doPost kind 'mirror'): note a report's rows
   from the Sheet since a time, then look at everything noted at once. */
function mirrorPost_(row) {
  if (row.dry && row.report && row.from) {
    return JSON.stringify({ dry: mirrorFromSheet_(String(row.report), new Date(row.from), true),
                            sheetTz: sheetTz_(), scriptTz: tz_() });
  }
  var noted = 0;
  if (row.report && row.from) noted = mirrorFromSheet_(String(row.report), new Date(row.from));
  var done = mirrorWatch_({ now: true });
  done.noted = noted;
  done.sheetTz = sheetTz_();
  done.scriptTz = tz_();
  return JSON.stringify(done);
}
