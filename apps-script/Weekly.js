/* THE WEEKLY REPORTS, MADE FROM THE DAILY ONES (the Chairman, 11 Oct 2026:
   "nobody fills a weekly report — it is made automatically from the daily
   reports and sent to the boss, like a weekly summary"; and the 500 Birr
   for a weekly report late or missing is dropped).

   Every weekly summary marked built:1 in forms.js is filed here, for each
   person, from the week's daily reports — by js/weekly.js, the same code
   the site uses to show it, fetched from the live site like forms.js and
   rules.js. It is filed the way a phone files a report, so everything that
   read the weekly reports reads it unchanged:
     - /reports, by 'auto', at the server's time — the rulebook's week, the
       monthly rules, the agents, the registers, the Chairman's page
     - the report's own tab in the Sheet
     - the report's chat room, in the person's name, marked as made from the
       daily reports
     - one email to the Chairman with every weekly report of the week
   Nobody is charged for it (Agent.js: a built report is owed by nobody).

   WHEN. The week's work is Monday to Saturday; a daily report filed after
   midnight is not Saturday's. So the weekly reports are made on Sunday —
   by the morning close (dailyRun_), or by the watch if the morning missed
   it — and once more at 8 PM for any daily corrected since. A weekly report
   counts for the week it is filed in, which closes at 9 PM on Sunday: made
   after that it would count for the next week, so nothing is made from
   8:50 PM. A person who filed the weekly report by hand that week keeps
   theirs. A person with no daily report that week gets none — a summary of
   nothing would read as a report filed.                                    */

var WEEKLY_LIB_ = null;
function loadWeeklyLib_() {
  if (WEEKLY_LIB_) return WEEKLY_LIB_;
  var site = prop_('SITE', AGENT_DEFAULT_SITE);
  var get = function (path) {
    var res = UrlFetchApp.fetch(site + path, { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) {
      throw new Error('Could not read ' + path + ' from ' + site + ' (HTTP ' + res.getResponseCode() + ')');
    }
    return res.getContentText();
  };
  /* forms.js and channels.js declare their lists at the top level, and
     weekly.js hands itself to `module` */
  var read = new Function('var module = { exports: {} };\n' + get('js/forms.js') + '\n;' + get('js/channels.js') +
                          '\n;' + get('js/weekly.js') +
                          '\n; return { W: module.exports, CHANNELS: CHANNELS, PEOPLE: PEOPLE, REPORTS: REPORTS };');
  WEEKLY_LIB_ = read();
  if (!WEEKLY_LIB_.W || !WEEKLY_LIB_.W.build) throw new Error('js/weekly.js did not load');
  return WEEKLY_LIB_;
}

/* Make the week's weekly reports. `sunday` is the Sunday they are made on.
   Returns what it did: made, unchanged (made before and no daily changed
   since), own (filed by hand), empty (no daily that week). */
function buildWeeklies_(sunday, opts) {
  opts = opts || {};
  var lib = loadWeeklyLib_(), W = lib.W;
  var out = { week: sunday, made: [], unchanged: [], own: [], empty: [], errors: [] };
  var reps = W.builtReports(lib.REPORTS);
  if (!reps.length) return out;
  var now = new Date();
  if (!opts.anyTime && now.getTime() >= weekCut_(sunday).getTime() - 10 * 60e3) {
    throw new Error('Too close to 9 PM on ' + sunday + ': a weekly report made now would count for the next week.');
  }
  var wk = W.weekOf(sunday);
  /* everyone's filings of the week: the dailies it is made from (anyone's —
     Mahelet's reads Amaha's and Wude's), and the weekly reports already in */
  var filings = filedBetween_(addDays_(wk.monday, -1), addDays_(sunday, 1));
  var plain = filings.map(function (f) {
    return { person: f.person, report: f.report, by: f.by, at: f.at.getTime(), values: f.fields || {} };
  });
  var made = [];
  reps.forEach(function (rep) {
    try {
      /* someone who joins later owes nothing before their first day */
      var person = lib.PEOPLE.filter(function (p) { return p.id === rep.person; })[0];
      if (!person || (person.from && person.from > addDays_(sunday, -1))) return;
      /* this week's filings of the weekly report itself */
      var mine = filings.filter(function (f) {
        return f.report === rep.id && f.person === rep.person && weekOf_(f.at, rep.id) === weekOf_(now, rep.id);
      });
      if (mine.some(function (f) { return f.by !== 'auto'; })) { out.own.push(rep.id); return; }
      var b = W.build(rep, { reports: lib.REPORTS, people: lib.PEOPLE, filings: plain, sunday: sunday });
      if (!b.dailies && !b.others) { out.empty.push(rep.id); return; }
      /* made already, and nothing it reads came in since: not again */
      var lastAuto = mine.reduce(function (a, f) { return Math.max(a, f.at.getTime()); }, 0);
      if (lastAuto) {
        var reads = W.sourcesOf(rep, lib.REPORTS);
        var newer = plain.some(function (f) {
          return f.at > lastAuto && f.at < wk.to && reads.indexOf(f.report) >= 0;
        });
        if (!newer) { out.unchanged.push(rep.id); return; }
      }
      fileBuilt_(rep, b, person, lib);
      out.made.push(rep.id);
      made.push({ rep: rep, b: b, person: person });
    } catch (e) {
      Logger.log('weekly %s: %s', rep.id, e.message);
      out.errors.push(rep.id + ': ' + e.message);
    }
  });
  if (made.length) {
    try { mailBuilt_(made, wk); } catch (e) { out.errors.push('email: ' + e.message); }
  }
  return out;
}

/* One weekly report into the three places a phone puts one */
function fileBuilt_(rep, b, person, lib) {
  var text = b.text.substring(0, 60000);
  fsCreateNow_('reports', {
    person: rep.person, report: rep.id, by: 'auto', late: false, due: rep.dueEn || '',
    values: b.values, flags: b.flags || [], text: text, lang: 'en'
  }, 'at');
  /* the Sheet is the Chairman's window; a failure there must not stop the
     rest, and is said in the run's warnings */
  try {
    appendReportRow_({
      at: new Date().toISOString(), person: rep.person, personName: person.en, roleName: person.roleEn || '',
      report: rep.id, reportName: rep.en, to: rep.toEn || '', due: rep.dueEn || '',
      by: 'auto', byName: 'Made from the daily reports', statusText: 'Made from ' + b.dailies + ' daily reports',
      values: b.values, text: text, doc: b.doc, flags: b.flags
    });
  } catch (e) { Logger.log('weekly sheet %s: %s', rep.id, e.message); }
  try {
    var room = lib.W.channelFor(rep, lib.CHANNELS);
    if (room) lib.W.splitForChat(text, 3900).forEach(function (part) {
      fsCreateNow_('channels/' + room + '/messages', { who: rep.person, text: part, via: 'weekly', lang: 'en' }, 'at');
    });
  } catch (e) { Logger.log('weekly chat %s: %s', rep.id, e.message); }
}

/* One email for the week's weekly reports, each with its PDF — rather than
   twenty emails on a Sunday morning */
function mailBuilt_(made, wk) {
  var to = Session.getEffectiveUser().getEmail();
  if (!to) return;
  var label = function (d) { return Utilities.formatDate(new Date(d + 'T12:00:00' + ADDIS_), tz_(), 'EEE d MMM'); };
  var lines = ['The week ' + label(wk.monday) + ' – ' + label(addDays_(wk.sunday, -1)) + ': ' + made.length +
               ' weekly reports, each made from that person\'s daily reports. Nobody filled them in.', ''];
  made.forEach(function (m) {
    lines.push('— ' + m.person.en + ' · ' + m.rep.en + ' (from ' + m.b.dailies + ' daily reports)');
  });
  made.forEach(function (m) { lines.push('', '', m.b.text); });
  var files = [];
  made.forEach(function (m) {
    if (files.length >= 20) return;
    try {
      files.push(reportPdf_({
        reportName: m.rep.en, personName: m.person.en, roleName: m.person.roleEn || '', at: new Date().toISOString(),
        due: m.rep.dueEn || '', statusText: 'Made from ' + m.b.dailies + ' daily reports', to: m.rep.toEn || '',
        byName: 'Made from the daily reports', doc: m.b.doc, flags: m.b.flags
      }));
    } catch (e) { Logger.log('weekly pdf %s: %s', m.rep.id, e.message); }
  });
  MailApp.sendEmail({
    to: to,
    subject: 'Weekly reports - ' + label(wk.monday) + ' to ' + label(addDays_(wk.sunday, -1)) + ' - made from the daily reports',
    body: lines.join(String.fromCharCode(10)),
    attachments: files
  });
}

/* From the morning close on a Sunday, and from the watch on a Sunday: once
   a day (WEEKLY_BUILT), and once more from 8 PM (WEEKLY_EVENING) for a daily
   corrected since. */
function weeklyIfDue_(from) {
  var today = todayAddis_();
  if (dow_(today) !== 0 || today < WEEK_FROM_) return null;
  var now = new Date();
  if (now.getTime() >= weekCut_(today).getTime() - 10 * 60e3) return null;
  var props = PropertiesService.getScriptProperties();
  var hour = Number(Utilities.formatDate(now, 'Africa/Addis_Ababa', 'HH'));
  var first = props.getProperty('WEEKLY_BUILT') !== today;
  var evening = hour >= 20 && props.getProperty('WEEKLY_EVENING') !== today;
  if (!first && !evening) return null;
  if (first) props.setProperty('WEEKLY_BUILT', today);
  if (hour >= 20) props.setProperty('WEEKLY_EVENING', today);
  return ran_('weekly', function () {
    var got = buildWeeklies_(today);
    return { period: today, warn: got.errors,
             note: (from || '') + ' made ' + got.made.length + ', unchanged ' + got.unchanged.length +
                   ', filed by hand ' + got.own.length + ', no daily ' + got.empty.length };
  });
}
