/* Klever — the fifteen daily agents.

   HOW THIS IS PUT TOGETHER, AND WHY
   The day's reports are read once. Every number each agent needs is then
   worked out here, in code — counts, rates, totals, who was due and who
   filed. Only after that does a model see anything, and what it sees is a
   short block of finished facts rather than a pile of raw fields.

   That split is the whole design. Arithmetic is not a thing to ask a model
   for: it will eventually get one wrong, and here the wrong ones cost people
   money or send the Chairman after the wrong person. What a model is for is
   the sentence after the number — this is the third day running, these two
   reports cannot both be true, nobody has mentioned the thing everyone is
   working around.

   Fourteen agents run at once, in one UrlFetchApp.fetchAll, because fourteen
   calls one after another would sit near the six-minute execution limit and
   eventually cross it. The fifteenth reads the other fourteen and writes the
   Chairman his brief, so it has to run after them.

   WHEN IT RUNS
   Every morning at six, on yesterday. By then the day is closed: anything
   filed before midnight is in, late or not, and the ledger has charged what
   the letters say. The brief is in the Chairman's inbox by seven. The
   “Analyse now” button on his page runs the same agents on today so far,
   and says so — nothing is charged from that run.

   A WEEK, NOT A DAY
   Each agent also sees the six days before, worked out in code: the same
   figure day by day, its average, and who has missed the same report more
   than once. A model given only today cannot say “third day running”, and
   that is most of what is worth saying.

   ADDING AN AGENT
   Add an entry to AGENTS. It needs an id, a title in both languages, a facts
   function that returns an object of already-computed numbers, and the
   question to ask about them. Nothing else in this file changes.

   SET UP: the same Script Properties as the ledger — CLAUDE_KEY and/or GEMINI_KEY (see Brain.js),
   FIREBASE_WEB_KEY, LEDGER_PASSWORD — then setupTriggers() once (Agent.js). */

/* ------------------------------------------------------------------ *
 *  Small helpers                                                      *
 * ------------------------------------------------------------------ */

function n_(v) {
  if (v == null || v === '') return 0;
  var x = Number(String(v).replace(/[^0-9.\-]/g, ''));
  return isNaN(x) ? 0 : x;
}
function blank_(v) { return v == null || String(v).trim() === ''; }
/* One answer from a report, as a number — or null when it was not given.
   A question left blank is not a zero. The first real report read here left
   "messages waiting over 2 hours" and "complaints" empty, n_() made both 0,
   and the morning email said every WhatsApp inquiry was answered and nobody
   complained. Nobody had said either. Every figure an agent is shown is read
   through this, so the same goes for a report that was never filed ({}). */
function a_(v, field) {
  var x = (v || {})[field];
  return blank_(x) ? null : n_(x);
}
/* the same for a yes/no question: true, false, or null for not answered —
   a blank is not a "no" */
function ay_(v, field) {
  var x = (v || {})[field];
  return blank_(x) ? null : yes_(x);
}
/* A two-box answer — "8 / 10" — is filed as field__a and field__b. Read
   as one number it was always 0 (answered within the hour, three quotes,
   called before arrival all read nothing). Both numbers, or null; a box left
   empty is null, and a first box bigger than the second (11 of 10) cannot be
   right and says so. */
function pair_(v, id) {
  var a = a_(v, id + '__a'), b = a_(v, id + '__b');
  if (a === null && b === null) return null;
  var out = { done: a, of: b };
  if (a !== null && b !== null && a > b) out.cannot_be_right = 'the first box is bigger than the second';
  return out;
}
/* Ephrata's expected collections: the total, by what the payment is for
   and by when, and the list itself. */
function expectedOf_(v) {
  var rows = Object.prototype.toString.call((v || {}).expected_list) === '[object Array]' ? v.expected_list : [];
  var out = { total: 0, by_type: {}, by_when: {}, payments: [] };
  rows.forEach(function (r) {
    if (!r || (!r.cust && !r.amount)) return;
    var x = n_(r.amount);
    out.total += x;
    out.by_type[r.kind || 'not said'] = (out.by_type[r.kind || 'not said'] || 0) + x;
    out.by_when[r.when || 'not said'] = (out.by_when[r.when || 'not said'] || 0) + x;
    out.payments.push({ client: r.cust || '', for: r.kind || '', birr: x, when: r.when || '' });
  });
  /* a row with only "Settlement" picked in it is a list not filled in, and
     reads as "nothing expected" if it is handed over as a total of 0 */
  return out.payments.length ? out : null;
}
function yes_(v) {
  return String(v == null ? '' : v).toLowerCase().indexOf('y') === 0;
}
/* one filed report, or null if it never arrived. If it was filed twice — a
   correction — the later one holds the figures to believe. */
function got_(filed, reportId) {
  var hit = null;
  for (var i = 0; i < filed.length; i++) if (filed[i].report === reportId) hit = filed[i];
  return hit;
}
function vals_(filed, reportId) {
  var f = got_(filed, reportId);
  return f ? (f.fields || {}) : {};
}
/* rows of a table or grid field, whatever shape they came back in */
function rows_(v) {
  if (!v) return [];
  if (Object.prototype.toString.call(v) === '[object Array]') return v;
  var out = [];
  Object.keys(v).forEach(function (k) { out.push(v[k]); });
  return out;
}
/* A number from a report that was never filed is not zero, it is unknown.
   n_() cannot tell those apart and will hand a model a confident 0, which it
   will then reason from — "Mahelet recorded zero production" when Mahelet
   recorded nothing at all. Use this wherever an absent figure would be read
   as a real one, above all when comparing two people's reports. */
function nOrNull_(filed, reportId, field) {
  var f = got_(filed, reportId);
  return f ? a_(f.fields, field) : null;
}
/* every report that was due today and did not arrive */
function notFiled_(d) {
  return d.ledger.filter(function (l) { return l.status === 'MISSING'; })
                 .map(function (l) { return l.person + ' — ' + l.report; });
}
/* Mid-day: how many are in, which are past their deadline, and which are
   still to come. The list used to be only those past their deadline, under
   "not in yet"; with one name on it the model took everyone else as filed. */
function soFar_(d) {
  var filed = 0, notDue = [], week = [];
  d.ledger.forEach(function (l) {
    if (l.status === 'On time' || l.status === 'LATE') filed++;
    else if (l.status === 'NOT DUE YET') notDue.push(l.person + ' — ' + l.report);
    else if (l.status === 'NOT IN YET') week.push(l.person + ' — ' + l.report);
  });
  return [
    'Filed so far: ' + filed + ' of the ' + d.ledger.length + ' reports due today.',
    'Past their deadline and not in: ' + (notFiled_(d).join('; ') || 'none'),
    'Not due yet — the deadline is later today, so not filed, and not late or missing either: ' +
      (notDue.join('; ') || 'none')
  ].concat(week.length ? ['Weekly, past its day but still to come this week (not missing yet): ' +
                          week.join('; ')] : []).join('\n');
}
/* Reports that arrived with questions left empty, and how many. The phone
   counts them when it sends ("18 not answered" among the flags); a report
   sent before that count existed says nothing and is taken as complete. */
/* The filings of the day that count: the last of each report. A correction is
   a second filing (nothing filed can be changed), and got_ already believes
   the later one; what was blank or wrong in the first must not be reported
   once it has been corrected. */
function latestFiled_(d) {
  var by = {}, order = [];
  (d.filed || []).forEach(function (f) {
    if (!(f.report in by)) order.push(f.report);
    by[f.report] = f;
  });
  return order.map(function (r) { return by[r]; });
}
function leftBlank_(d) {
  var out = [];
  latestFiled_(d).forEach(function (f) {
    var n = 0;
    (f.flags || []).forEach(function (x) {
      var m = /^(\d+)\s/.exec(String(x));
      if (m && /not answered|ያልተመለሱ/.test(String(x))) n = Number(m[1]);
    });
    if (n) out.push((d.names && d.names[f.person] || f.person) + ' — ' + reportName_(d, f.report) +
                    ': ' + n + ' question' + (n > 1 ? 's' : '') + ' left blank');
  });
  return out;
}
function reportName_(d, id) {
  var hit = id;
  ((d.schedule && d.schedule.reports) || []).forEach(function (r) { if (r.id === id) hit = r.en; });
  return hit;
}
/* What people wrote, as well as the figures. Every reader used to be handed
   numbers only: the first full report read (5 Oct 2026) asked the Chairman
   for a decision, left 100,000 Birr in cash in the safe overnight and named
   a 12% rise in a supplier's price — all written down, none of it a figure,
   and the AI said nothing of any of it. Each reader now also gets the
   written answers, the yes/no answers and the tables of the reports it
   covers (`said` on the agent), each answer beside its question. A follow-up
   that was not shown never arrives: the form drops it when it sends. */
function saidIn_(d, ids) {
  var out = [];
  latestFiled_(d).forEach(function (f) {
    if (ids.indexOf(f.report) === -1) return;
    var rep = null;
    ((d.schedule && d.schedule.reports) || []).forEach(function (r) { if (r.id === f.report) rep = r; });
    if (!rep) return;
    var v = f.fields || {}, lines = [];
    (rep.sections || []).forEach(function (sec) {
      (sec.fields || []).forEach(function (q) {
        var x = v[q.id];
        if (q.t === 'area' || q.t === 'text') {
          if (!blank_(x)) lines.push(q.en + ' — ' + String(x).trim());
        } else if (q.t === 'yesno' || q.t === 'choice') {
          if (!blank_(x)) lines.push(q.en + ' — ' + said_(q, x));
        } else if (q.t === 'table') {
          var rows = [];
          rows_(x).forEach(function (row) {
            var cells = [], typed = false;
            (q.cols || []).forEach(function (c) {
              if (!row || blank_(row[c.id])) return;
              cells.push(c.en + ': ' + said_(c, row[c.id]));
              /* a row with only a choice picked in it is a row not filled in */
              if (c.t !== 'choice' && c.t !== 'yesno') typed = true;
            });
            if (typed) rows.push(cells.join(', '));
          });
          if (rows.length) lines.push(q.en + ' — ' + rows.join(' | '));
        }
      });
    });
    if (lines.length) {
      out.push(((d.names && d.names[f.person]) || f.person) + ' — ' + rep.en + ':\n' +
               lines.map(function (l) { return '- ' + l; }).join('\n'));
    }
  });
  return out;
}
/* an answer as the person saw it: the words of the option they picked, Birr
   with its thousands */
function said_(q, x) {
  var hit = null;
  (q.opts || []).forEach(function (o) { if (o.v === x) hit = o.en; });
  if (hit) return hit;
  if (q.t === 'money' && !isNaN(Number(x)) && String(x).trim() !== '') return fmt_(Number(x)) + ' Birr';
  return String(x).trim();
}
function saidBlock_(agent, d) {
  var said = agent.said ? saidIn_(d, agent.said) : [];
  if (!said.length) return '';
  return '\nWHAT THEY WROTE — the written answers in the reports you cover, in their own words. ' +
    'Read them as closely as the figures: a problem they name, money not banked, a price that ' +
    'moved, help they need from someone, a customer kept waiting. Say what it means for your ' +
    'subject; do not copy it out, and leave what belongs to another subject alone. Words are ' +
    'not checked the way figures are — where words and a figure disagree, say so.\n\n' +
    said.join('\n\n');
}
/* Decisions asked of the Chairman in today's reports, word for word. Ten
   Klever forms ask "Do you need a decision from the Chairman?", and
   Rovestone's asks it too; until 5 Oct 2026 only the Rovestone reader saw
   the answer, and none of them reached his brief. */
/* A rule broken today, or someone pushing to break one: the answers that
   say so, found in code, with the person's own words. They always go in the
   Chairman's brief (his decision, 5 Oct 2026) — the full-day test had Amaha
   asking Wude to pass a chipped door, and the brief, choosing by money, left
   it out. These are about whether the work and the reports can be trusted.
   kit/facts_audit.js checks every question here is still on its form. */
var BROKEN_ = [
  { r:'wude-daily', f:'pr_any', is:'yes', say:['pr_what'], named:'pr_who', what:'Someone pressured QC to pass a defective product' },
  { r:'wude-daily', f:'d_released', pos:true, say:['d_released_what'], what:'Defective items got into finished goods' },
  { r:'wude-daily', f:'i_all', is:'no', say:['i_all_why'], what:'Jobs were released without a full QC inspection' },
  { r:'liu-daily', f:'resist', is:'yes', say:['resist_what'], what:'Someone refused or worked around an operations rule' },
  { r:'liu-daily', f:'mat_out_signed', is:'no', say:['mat_out_unsigned'], what:'Material left the store without approval' },
  { r:'yordanos-daily', f:'iss_approved', is:'no', say:['iss_approved_why'], what:'Material was issued without Mahelet\u2019s signed approval' },
  { r:'yordanos-daily', f:'sec_theft', is:'yes', say:['sec_theft_what'], what:'Something was stolen or taken out without permission' },
  { r:'amaha-daily', f:'u_any', is:'yes', say:['u_what'], what:'Something was made or sent out without all four confirmations' },
  { r:'amaha-daily', f:'ws_thrown', is:'yes', say:['ws_thrown_what'], what:'Reusable material was thrown away without being recorded' },
  { r:'amaha-daily', f:'mp_safety', is:'yes', say:['mp_safety_what'], what:'Someone was hurt, or worked without safety gear' },
  { r:'getachew-daily', f:'chq_confirmed', is:'no', say:['chq_confirmed_why'], what:'A cheque went out before Selam confirmed the funds' },
  { r:'getachew-daily', f:'chq_match', is:'no', say:['chq_match_why'], what:'A cheque was not for the approved amount or supplier' },
  { r:'getachew-daily', f:'p_subok', is:'no', when:'p_sub', say:['p_sub_what'], what:'Material was swapped for a cheaper one without Wude\u2019s approval' },
  { r:'betty-daily', f:'discrepancy', is:'yes', say:['discrepancy_what'], what:'Cash did not match' },
  { r:'betty-daily', f:'zz_confirmed', is:'no', say:['zz_confirmed_why'], what:'A cheque was written before its funds were confirmed' },
  { r:'betty-daily', f:'zz_disc', pos:true, say:['zz_disc_what'], what:'A ZamZam payment did not match' }
];
function rulesBroken_(d) {
  var out = [];
  var last = {};
  latestFiled_(d).forEach(function (f) { last[f.report] = f; });
  BROKEN_.forEach(function (b) {
    var f = last[b.r];
    if (!f) return;
    var v = f.fields || {};
    if (b.when && !yes_(v[b.when])) return;
    var hit = b.pos ? (a_(v, b.f) || 0) > 0
                    : !blank_(v[b.f]) && String(v[b.f]).trim().toLowerCase() === b.is;
    if (!hit) return;
    var words = (b.say || []).filter(function (k) { return !blank_(v[k]); })
                             .map(function (k) { return String(v[k]).trim(); });
    var hit2 = { what: b.what, reported_by: (d.names && d.names[f.person]) || f.person,
                 report: reportName_(d, b.r), their_words: words.join(' — ') || 'no detail given' };
    /* the person they name, apart from their words — appended, a name read
       as the speaker ("… I refused and failed it. — Amaha") */
    if (b.named && !blank_(v[b.named])) hit2.person_named = String(v[b.named]).trim();
    out.push(hit2);
  });
  return out;
}
/* What each person wrote about waiting on, or needing, someone else — every
   report, every department, and Rovestone. Read side by side, two people
   waiting on each other over the same thing show; in the full-day test
   Rovestone waited on Klever's drawings and Klever's designer on Rovestone's
   signed changes, both since 28 Sep, and nothing put the two together. */
var WAIT_FIELDS_ = ['need_help', 'n_support', 'k_waiting', 'd_waiting_who', 'cp_48_why', 'quotes_late_why',
                    'visits_late_why', 'b_short_what', 'shortage_hit', 'sh_flagged_who', 'pl_open_why',
                    'need_lead_what', 'need_elyas_what', 'need_chair_what', 'p_chair_what'];
function waitsOn_(d) {
  var out = [];
  latestFiled_(d).forEach(function (f) {
    var v = f.fields || {}, rep = null;
    ((d.schedule && d.schedule.reports) || []).forEach(function (r) { if (r.id === f.report) rep = r; });
    if (!rep) return;
    (rep.sections || []).forEach(function (sec) {
      (sec.fields || []).forEach(function (q) {
        if (WAIT_FIELDS_.indexOf(q.id) === -1 || blank_(v[q.id])) return;
        out.push({ who: (d.names && d.names[f.person]) || f.person, report: rep.en,
                   asked: q.en, wrote: String(v[q.id]).trim() });
      });
    });
  });
  return out;
}
function askedOfChair_(d) {
  var out = [];
  latestFiled_(d).forEach(function (f) {
    var v = f.fields || {};
    Object.keys(v).forEach(function (k) {
      /* Frewoyni's Rovestone form names it p_chair_what */
      if (/(need_chair_what|p_chair_what)$/.test(k) && !blank_(v[k])) {
        out.push({ who: (d.names && d.names[f.person]) || f.person,
                   report: reportName_(d, f.report), asks: String(v[k]).trim() });
      }
    });
  });
  return out;
}
/* Answers that cannot be right as written, found in code by the same check
   the form runs (oddFigures in forms.js) — 11 called within the hour out of
   10 new leads, sources adding up to 33 under a total of 25. A model handed
   those figures reasons from them; it is handed this list instead, and told
   the figures need checking with the person before anything is built on them. */
function oddIn_(d) {
  var odd = d.schedule && d.schedule.odd, out = [];
  if (typeof odd !== 'function') return out;
  latestFiled_(d).forEach(function (f) {
    var rep = null;
    (d.schedule.reports || []).forEach(function (r) { if (r.id === f.report) rep = r; });
    if (!rep) return;
    var found = [];
    try { found = odd(rep, f.fields || {}); } catch (e) { found = []; }
    found.forEach(function (o) {
      out.push({ who: (d.names && d.names[f.person]) || f.person, report: rep.en, what: o.en });
    });
  });
  return out;
}
/* The latest answer to any of these report/field pairs in the week, with the
   day it was given: {day: 'Sat 26 Sep', birr, from, below_floor}, or null. */
function lastKnown_(d, pairs, floor) {
  var hit = null;
  (d.recent || []).forEach(function (f) {
    if (f.day > d.day) return;
    pairs.forEach(function (p) {
      if (f.report !== p[0]) return;
      var x = a_(f.fields, p[1]);
      if (x !== null && (!hit || f.at.getTime() >= hit.at.getTime())) hit = { at: f.at, day: f.day, birr: x, rid: f.report };
    });
  });
  if (!hit) return null;
  return { day: Utilities.formatDate(new Date(hit.day + 'T12:00:00' + ADDIS_), tz_(), 'EEE d MMM'),
           birr: hit.birr, from: reportName_(d, hit.rid),
           below_floor: floor != null ? hit.birr < floor : null };
}
function pctOf_(part, whole) {
  if (part === null || whole === null || !whole) return null;
  return Math.round((part / whole) * 1000) / 10;
}

/* The same figure on each of the seven days ending today, oldest first.
   null is a day it was owed and not reported, which is not a zero — the same
   distinction as nOrNull_, carried across a week. 'not due' is a day nobody
   owed it: a Sunday, or a day the letter excuses. The first live run read a
   Sunday's null as a second missed store report; the two have to look
   different.

   Two more that are not a miss either. 'not answered' is a day the report
   came in with this question left blank. 'not tracked' is a day before the
   ledger began keeping count (no ledger for it): the first reading called
   the same run of empty days "six in a row" in one paragraph and "four" in
   the next, because the week here reached back past the first ledger and the
   compliance count did not. A miss is now only what the ledger recorded. */
function series_(d, reportId, field) {
  var rep = null;
  ((d.schedule && d.schedule.reports) || []).forEach(function (r) { if (r.id === reportId) rep = r; });
  var kept = {};
  (d.before || []).forEach(function (doc) { kept[doc.day] = true; });
  var out = [];
  for (var i = 6; i >= 0; i--) {
    var day = addDays_(d.day, -i), v = null;
    (d.recent || []).forEach(function (f) {
      if (f.report === reportId && f.day === day) {
        /* a yes/no answer counts as 1 or 0 — read as a number it was always 0 */
        var raw = (f.fields || {})[field];
        v = blank_(raw) ? 'not answered'
          : /^(yes|no)$/i.test(String(raw)) ? (yes_(raw) ? 1 : 0) : n_(raw);
      }
    });
    if (v === null && rep && !dueOn_({ reports: [rep] }, day).length) v = 'not due';
    else if (v === null && i > 0 && (!kept[day] || beforeReadStart_(d, day))) v = 'not tracked';
    out.push(v);
  }
  return out;
}
/* A reading never reaches back past a start it has passed — LEDGER_START, or
   any of the moves in STARTS_ (the restart of 3 Oct). The days before were
   cancelled, so a miss on one of them is not "the sixth day running" — which
   is what the first reading after the restart said of Selam. When the start
   moved on to Tue 6 Oct, Monday became a day before it, and its reading said
   everyone "missed five straight days from 29 Sep": it had passed the
   restart, not the start. A reading of a day before every start (the
   practice days of September) still sees its week as it was. */
function beforeReadStart_(d, day) {
  var cut = '';
  STARTS_.map(function (s) { return s.day; }).concat([prop_('LEDGER_START', '')]).forEach(function (m) {
    if (m && m <= d.day && m > cut) cut = m;
  });
  return !!cut && day < cut;
}
function isNum_(x) { return typeof x === 'number'; }
function avgKnown_(xs) {
  var k = xs.filter(isNum_);
  if (!k.length) return null;
  return Math.round(k.reduce(function (a, x) { return a + x; }, 0) / k.length * 10) / 10;
}
/* today against the days before it, so the model is handed the comparison
   rather than asked to make it */
function trend_(xs) {
  var prior = xs.slice(0, 6), today = xs[6], avg = avgKnown_(prior);
  return {
    last_7_days: xs,
    days_reported_before_today: prior.filter(isNum_).length,
    average_before_today: avg,
    today_vs_average_pct: (isNum_(today) && avg) ? Math.round((today - avg) / avg * 1000) / 10 : null
  };
}

/* Money in since Monday, from the daily reports themselves. The first live
   run added the week up in the model's head — correctly, that time. */
function sinceMonday_(d, reportId, field) {
  var dow = dow_(d.day);
  var monday = addDays_(d.day, -(dow === 0 ? 6 : dow - 1));
  var by = {}, blankDays = {};
  (d.recent || []).forEach(function (f) {
    if (f.report !== reportId || f.day < monday || f.day > d.day) return;
    var x = a_(f.fields, field);
    /* a day filed with this question blank adds nothing and is said, rather
       than counted as a day on which nothing came in */
    if (x === null) { blankDays[f.day] = true; delete by[f.day]; }
    else { by[f.day] = x; delete blankDays[f.day]; }
  });
  var days = Object.keys(by);
  return { since: monday, days_reported: days.length,
           days_filed_with_this_left_blank: Object.keys(blankDays).length,
           total: days.reduce(function (a, k) { return a + by[k]; }, 0) };
}

/* How many days until the bank falls below the reserve at this week's rate —
   worked out here, only when there are enough days to mean anything, and
   otherwise said to be unknown rather than guessed at. */
function daysToFloor_(xs, floor) {
  var pts = [];
  xs.forEach(function (x, i) { if (isNum_(x)) pts.push({ i: i, v: x }); });
  if (pts.length < 3) return { days: null, why: 'fewer than three days reported this week' };
  var first = pts[0], last = pts[pts.length - 1];
  if (last.v < floor) return { days: 0, why: 'already below' };
  var perDay = (first.v - last.v) / (last.i - first.i);
  if (perDay <= 0) return { days: null, why: 'not falling this week' };
  return { days: Math.floor((last.v - floor) / perDay),
           why: 'falling about ' + Math.round(perDay).toLocaleString('en-US') +
                ' Birr a calendar day over ' + pts.length + ' reported days' };
}

/* Who has missed or been late with the same report more than once in the
   week, from the ledger itself. A first miss is a bad day; the penalties
   agent was asked to spot a third one and, until now, was only ever shown
   one day. */
function repeats_(d) {
  var tally = {}, from = addDays_(d.day, -6);
  /* the ledger reads a day further back than a week, for "second Friday
     running"; a week here is today and the six days before it */
  var days = (d.before || []).filter(function (doc) { return doc.day >= from; }).map(function (doc) {
    return { day: doc.day, lines: (doc.lines || []).filter(function (l) {
      /* a weekly line sits in its week's Sunday; it was due on its own day */
      return !beforeReadStart_(d, l.dueDay || doc.day);
    }).map(function (l) {
      return { person: l.name || l.person, report: l.reportName || l.report, status: l.status };
    }) };
  });
  days.push({ day: d.day, lines: d.ledger });
  days.forEach(function (doc) {
    doc.lines.forEach(function (l) {
      if (l.status !== 'MISSING' && l.status !== 'LATE') return;
      var k = l.person + '|' + l.report;
      var t = tally[k] || (tally[k] = { person: l.person, report: l.report, missing: 0, late: 0, days: [] });
      if (l.status === 'MISSING') t.missing++; else t.late++;
      t.days.push(doc.day);
    });
  });
  return Object.keys(tally).map(function (k) { return tally[k]; })
    .filter(function (t) { return t.missing + t.late >= 2; })
    .sort(function (a, b) { return (b.missing + b.late) - (a.missing + a.late); });
}


/* ------------------------------------------------------------------ *
 *  What the Chairman has not decided                                  *
 * ------------------------------------------------------------------ */

/* From the control sheet of 17 September 2026, plus the two the letters
   themselves leave open. These are not abstract: each one has days on which
   it costs money or leaves somebody unprotected, and until now nothing
   connected the decision to the day.

   `bites` runs on today's figures and returns what it cost today, or null if
   today was not one of those days. It is code, not a model — whether a thing
   happened is a fact, and only what to do about it is a judgment. */

/* someone who joins later (`from` on their entry in forms.js) is not missing
   before their first day */
function startsAfter_(d, id) {
  var from = null;
  ((d.schedule && d.schedule.people) || []).forEach(function (p) { if (p.id === id) from = p.from || null; });
  return !!(from && d.day < from);
}

/* Decided, and so never to be raised as open again. */
var SETTLED = [
  { id:'assembler-rate', what:'The assembler pay rate', on:'2026-10-06',
    answer:'600 Birr per m² installed and accepted, piece rate, no base salary (the Chairman, '+
           '6 Oct 2026: "600 per m2 keep it"). Clause 4’s monthly table of 9,000–11,000 was '+
           'replaced by what 600 pays: 93,600 at 6 m² a day, 124,800 at 8, 156,000 at 10, over '+
           '26 days, plus bonuses. The assembler terms, handbook and bound files can be printed; '+
           'assembler fines and bonuses still count for nothing until the terms are signed '+
           '(ASSEMBLER_TERMS_SIGNED).' }
];

var DECISIONS = [

{ id:'yordanos-penalty', what:'What Yordanos owes for a missing store report',
  yours:true,
  detail:'Every other daily reporter has a late and a missing figure in their letter. His has '+
         'neither, so the ledger lists him and charges nothing.',
  blocks:'The penalty ledger, every day he is late or absent',
  bites: function (d) {
    var hit = null;
    d.ledger.forEach(function (l) {
      if (String(l.person).indexOf('Yordanos') === 0 &&
          (l.status === 'LATE' || l.status === 'MISSING')) hit = l.status;
    });
    if (!hit) return null;
    /* before LEDGER_START nobody pays, so "everyone else paid" is not true
       then — decided by the day, not by whether anyone else happened to be
       charged today (on a day he is the only one missing, nobody is) */
    var start = prop_('LEDGER_START', '');
    var charging = !start || d.day >= start;
    return 'Yordanos was ' + hit + ' today and was charged nothing, because his letter sets no '+
           'figure. ' + (charging ? 'Anyone else late or missing with a daily report is charged.'
                                  : 'Nobody is charged yet — charging starts ' + start +
                                    '. From then everyone else in the same position pays and he still would not.');
  } },

{ id:'rework-band', what:'The 2–5% rework dead band',
  detail:'Wude earns a bonus below 2% and is fined above 5%. Between the two, nothing in her '+
         'letter reacts at all.',
  blocks:'Wude’s letter, clause 5',
  bites: function (d) {
    var w = vals_(d.filed, 'wude-daily');
    if (!got_(d.filed, 'wude-daily')) return null;
    var r = n_(w.r_rate);
    return (r > 2 && r < 5)
      ? 'Rework was ' + r + '% today — inside the band where nothing happens. A third of the '+
        'range her letter covers has no consequence either way.'
      : null;
  } },

{ id:'protection-clause', what:'The protection clause',
  detail:'Four documents grant the right to refuse unsafe or defective work and then penalise '+
         'the refusal. The assembler contract is sharpest: clause 2 grants three refusal '+
         'rights, clause 5 makes refusing an instruction grounds for immediate removal. '+
         'Wude’s letter holds the only protection clause in the company.',
  blocks:'Assembler contract, handbook, production worker letter, cleaner letter, Ashenafi',
  bites: function (d) {
    var w = vals_(d.filed, 'wude-daily');
    var e = vals_(d.filed, 'elyas-daily');
    var why = [];
    if (yes_(w.pr_any)) why.push('someone pressured Wude to pass a defect today');
    if (yes_(e.q_rework)) why.push('work was refused and reworked at site');
    return why.length
      ? why.join('; ') + '. Wude is covered. Nobody else who did the same thing would be.'
      : null;
  } },

{ id:'assembler-timing', what:'Assembler daily update — 5:00 or 6:00 PM',
  detail:'Assemblers post at 6:00 PM. Elyas files his site report at 5:30, so he reports on a '+
         'day before his own team reports it to him. Moving it to 5:00 matches Ashenafi’s, '+
         'which is the one chain in the structure that runs the right way round.',
  blocks:'Assembler order, handbook, training, contract',
  bites: function (d) {
    var e = vals_(d.filed, 'elyas-daily');
    if (!got_(d.filed, 'elyas-daily')) return null;
    return (n_(e.a_late) > 0 || n_(e.a_early) > 0 || n_(e.a_behave) > 0)
      ? 'Elyas reported assembler problems today in a report filed half an hour before the '+
        'assemblers themselves report. He is describing a day he has not yet been told about.'
      : null;
  } },

{ id:'which-document-wins', what:'Which document wins when two disagree',
  detail:'One sentence — that signing a policy or an order amends the signer’s terms letter to '+
         'the extent of any conflict — closes eleven findings across the Rovestone policy, the '+
         'master file and the assembler order.',
  blocks:'Rovestone clause 13, master file, assembler order',
  bites: function (d) {
    var c = contradictions_(d);
    if (!c.length) return null;
    return c.length + ' pair' + (c.length > 1 ? 's' : '') + ' of reports disagreed today (' +
           c[0].about + ': ' + c[0].first + ' against ' + c[0].second + '). When two people '+
           'disagree there is at least a conversation. When two documents disagree there is '+
           'still no rule for which one governs.';
  } },

{ id:'ephrata-three', what:'Ephrata — three questions still open',
  yours:true,
  detail:'Three questions. (a) The commission floor: HER SIGNED LETTER, as amended on '+
         '17 September, pays 0.50/1.0/1.5% from a floor of THREE million. The master file, which '+
         'nobody has signed, pays 1.0/1.5/2.0% from TWO million. The letter is the document she '+
         'signed; the master file is the one that disagrees with it. (b) Is her collection '+
         'penalty 2,000 Birr or 25,000? (c) Does she run Operations and Finance, which the '+
         'organizational chart shows and her own letter forbids in as many words?',
  blocks:'Master file sections 2, 8 and 16 against her letter clauses 2, 3 and 5',
  bites: function (d) {
    var e = vals_(d.filed, 'ephrata-daily');
    if (!got_(d.filed, 'ephrata-daily')) return null;
    var wk = n_(e.week_total);
    return wk ? 'Her week stands at ' + fmt_(wk) + ' Birr. Which floor applies to it — two '+
                'million or three — is still unsettled, and the two answers pay her differently.'
              : null;
  } },

{ id:'no-letter', what:'Three people still have no letter',
  detail:'Alex, Seble Mulugeta and Kidan. Alex has no full name either, and neither do Kidan, '+
         'Kalkidan or Frewoyni, so four signature lines across the set carry short names. Alex '+
         'is named in two letters, co-signs delivery orders and has a signature line in the '+
         'Rovestone policy.',
  blocks:'Master file section 17 still records Alex as issued',
  bites: function () { return null; } },

{ id:'rovestone', what:'Rovestone, before anyone signs it',
  detail:'The 50% advance contradicts Mahelet’s and Selam’s letters, which both forbid '+
         'starting production before final payment. Only Amaha’s letter mentions Rovestone at '+
         'all, so the policy binds him and nobody else. And the authorization log has no column '+
         'for the Chairman’s approval, which is the policy’s central rule.',
  blocks:'Rovestone policy clauses 5, 6 and 13',
  bites: function (d) {
    var a = vals_(d.filed, 'amaha-daily');
    var r = n_(a.p_rove);
    return r > 0 ? fmt_(r) + ' m² of Rovestone work was produced today under a policy nobody '+
                   'has signed and which binds only Amaha.' : null;
  } },

{ id:'payroll-headcount', what:'Payroll headcount in the master file',
  detail:'It pays three salespeople and six designers. There are two salespeople, and six '+
         'designers since Ermiyas joined on 6 October 2026 (he has no terms letter yet). It '+
         'also prints Amaha’s base as 35,008 Birr where his letter says 35,000.',
  blocks:'Master file section 16 — it pays a salesperson who does not exist',
  bites: function () { return null; } }
];

/* Two people describing the same day and giving different numbers. Only pairs
   where both reports were actually filed count — an absent figure is a gap and
   not a disagreement, which is the distinction the first version of the
   contradictions agent got wrong. A difference under a tenth is rounding. */
function contradictions_(d) {
  var out = [];
  function cmp(label, aRid, aF, bRid, bF) {
    var a = nOrNull_(d.filed, aRid, aF), b = nOrNull_(d.filed, bRid, bF);
    if (a === null || b === null) return;
    if (a === 0 && b === 0) return;
    var gap = Math.abs(a - b), scale = Math.max(Math.abs(a), Math.abs(b));
    if (scale && gap / scale > 0.1) out.push({ about: label, first: a, second: b });
  }
  cmp('m² produced — Amaha against Mahelet', 'amaha-daily','p_total', 'liu-daily','m2');
  cmp('defects — Amaha against Wude', 'amaha-daily','qc_defects', 'wude-daily','d_total');
  cmp('defects — Wude against Mahelet', 'wude-daily','d_total', 'liu-daily','defects');
  cmp('waste % — Amaha against Mahelet', 'amaha-daily','w_pct', 'liu-daily','waste');
  /* jobs against jobs: Elyas's m² against Mahelet's count of jobs (6 against
     1) was reported as a disagreement */
  cmp('jobs installed — Elyas against Mahelet', 'elyas-daily','j_done', 'liu-daily','installed');
  return out;
}

/* which of them cost something today */
function decisionsBiting_(d) {
  var out = [];
  DECISIONS.forEach(function (dec) {
    var why = null;
    try { why = dec.bites(d); } catch (e) { why = null; }
    out.push({ id:dec.id, what:dec.what, detail:dec.detail, blocks:dec.blocks,
               yours: !!dec.yours, cost_today: why });
  });
  return out;
}

/* ------------------------------------------------------------------ *
 *  The agents                                                         *
 * ------------------------------------------------------------------ */

var AGENTS = [

{ id:'attendance', en:'Who was absent today', am:'ዛሬ ማን እንደቀረ',
  said:['amaha-daily', 'elyas-daily', 'liu-daily'],
  facts: function (d) {
    var amaha = vals_(d.filed, 'amaha-daily');
    var elyas = vals_(d.filed, 'elyas-daily');
    var assigned = a_(amaha, 'mp_assigned'), present = a_(amaha, 'mp_present');
    return {
      factory_assigned: assigned,
      factory_present: present,
      factory_absent: a_(amaha, 'mp_absent'),
      factory_late: a_(amaha, 'mp_late'),
      factory_attendance_pct: pctOf_(present, assigned),
      factory_behaviour_issues: a_(amaha, 'mp_behave'),
      site_assemblers_present: a_(elyas, 'a_present'),
      site_assemblers_late: a_(elyas, 'a_late'),
      site_left_early: a_(elyas, 'a_early'),
      site_behaviour_issues: a_(elyas, 'a_behave'),
      site_issues_reported_to_mahelet: ay_(elyas, 'a_reported'),
      production_target_m2_per_day: 40,
      m2_produced: a_(amaha, 'p_total'),
      /* without these it will blame the shortfall on whoever was absent, which
         is the first thing it sees and often not the reason */
      hours_lost_to_something_else: a_(amaha, 'w_lost'),
      what_else_held_the_day_up: amaha.w_block || '',
      stopped_for_missing_board: ay_(amaha, 'b_short'),
      factory_absent_last_7_days: series_(d, 'amaha-daily', 'mp_absent'),
      site_assemblers_late_last_7_days: series_(d, 'elyas-daily', 'a_late')
    };
  },
  ask:'Who is missing, and how much of the day it actually explains. The attendance bonus '+
      'needs 95%. Be careful here: if hours were also lost to a stoppage, absence is only '+
      'part of the shortfall and you must say so rather than attributing all of it to the '+
      'people who were away. If lateness or absence is concentrated rather than spread, '+
      'say so.' },

{ id:'production', en:'Production', am:'ምርት',
  said:['amaha-daily', 'liu-daily', 'amaha-weekly', 'liu-weekly', 'liu-plan', 'amaha-monthly'],
  facts: function (d) {
    var amaha = vals_(d.filed, 'amaha-daily');
    var stage = rows_(amaha.w_stage);
    return {
      m2_produced: a_(amaha, 'p_total'),
      m2_target: 40,
      m2_external: a_(amaha, 'p_ext'),
      m2_rovestone: a_(amaha, 'p_rove'),
      waste_pct: a_(amaha, 'w_pct'),
      waste_limit_pct: 20,
      material_over_bom_pct: a_(amaha, 'w_var'),
      sheets_used: a_(amaha, 'b_sheets'),
      m2_per_sheet: a_(amaha, 'b_yield'),
      m2_per_sheet_target: 2.2,
      edge_banding_m: a_(amaha, 'b_edge'),
      edge_reruns: a_(amaha, 'b_redo'),
      stopped_for_missing_board: ay_(amaha, 'b_short'),
      which_board: amaha.b_shortw || '',
      stage_holding_us_up: amaha.w_block || '',
      hours_lost: a_(amaha, 'w_lost'),
      wip_by_stage: stage,
      machines_all_reported_in_30min: ay_(amaha, 'm_reported'),
      m2_this_week: trend_(series_(d, 'amaha-daily', 'p_total')),
      waste_pct_this_week: trend_(series_(d, 'amaha-daily', 'w_pct')),
      hours_lost_last_7_days: series_(d, 'amaha-daily', 'w_lost')
    };
  },
  ask:'Did the factory make its 40 m², and if not, what actually stopped it. '+
      'Yield below 2.2 m² a sheet means the cutting plan is wasting board — say so if it is. '+
      'If one stage is holding work up, name it and say whether the queue behind it is growing. '+
      'If today is more than 15% below the average of the days before it, say so first — '+
      'that is the drop the Chairman wants to hear about the same day.' },

{ id:'quality', en:'Quality', am:'ጥራት',
  said:['wude-daily', 'wude-weekly', 'wude-monthly'],
  facts: function (d) {
    var wude = vals_(d.filed, 'wude-daily');
    return {
      inspected: a_(wude, 'i_total'), passed: a_(wude, 'i_pass'), failed: a_(wude, 'i_fail'),
      pass_rate_pct: a_(wude, 'i_rate'), pass_rate_bonus_at: 98,
      defects_found: a_(wude, 'd_total'),
      defects_released_to_finished_goods: a_(wude, 'd_released'),
      rework_rate_pct: a_(wude, 'r_rate'),
      rework_bonus_below_pct: 2, rework_penalty_above_pct: 5,
      defects_by_stage: rows_(wude.c_stage),
      worst_stage: wude.c_worst || '',
      same_stage_as_yesterday: ay_(wude, 'c_repeat'),
      amaha_told_the_cause: ay_(wude, 'c_told'),
      suppliers_fault_defects: a_(wude, 'c_sup'),
      pressured_to_pass: ay_(wude, 'pr_any'),
      pass_rate_this_week: trend_(series_(d, 'wude-daily', 'i_rate')),
      rework_pct_this_week: trend_(series_(d, 'wude-daily', 'r_rate')),
      defects_released_last_7_days: series_(d, 'wude-daily', 'd_released')
    };
  },
  ask:'Where are the defects actually coming from, and is it the same place as yesterday. '+
      'Note that rework between 2% and 5% earns no bonus and carries no penalty — if today '+
      'sits in that band, say it plainly, because nothing in the letters reacts to it. '+
      'If anyone pressured Wude to pass a defect, that is the headline.' },

{ id:'store', en:'Store and stock', am:'መጋዘንና ክምችት',
  said:['yordanos-daily', 'yordanos-weekly'],
  facts: function (d) {
    var yord = vals_(d.filed, 'yordanos-daily');
    return {
      stock_and_days_of_cover: rows_(yord.k_stock),
      anything_at_5_days_or_less: ay_(yord, 'k_low'),
      which_and_told_getachew: yord.k_which || '',
      shortages_flagged: a_(yord, 'sh_flagged'),
      production_stopped_by_shortage: ay_(yord, 'sh_stopped'),
      which_materials: yord.sh_what || '',
      discrepancies: a_(yord, 'st_disc'),
      offcut_m2_returned: a_(yord, 'k_offin'),
      offcut_m2_reissued: a_(yord, 'k_offout'),
      consumables_month_to_date: a_(yord, 'con_mtd'),
      consumables_budget: 30000,
      theft_or_unauthorized_removal: ay_(yord, 'sec_theft'),
      shortages_flagged_last_7_days: series_(d, 'yordanos-daily', 'sh_flagged'),
      production_stops_last_7_days: series_(d, 'yordanos-daily', 'sh_stopped')
    };
  },
  ask:'What is about to run out, and will it stop production before it is replaced. '+
      'Days of cover is the number that matters — anything at five days or less should '+
      'already be with Getachew. If offcuts are coming back but not going out again, the '+
      'factory is paying for board it already owns.' },

{ id:'purchasing', en:'Purchasing and prices', am:'ግዥና ዋጋ',
  said:['getachew-daily', 'getachew-weekly'],
  facts: function (d) {
    var purch = vals_(d.filed, 'getachew-daily');
    return {
      prices_paid_today: rows_(purch.p_rows),
      materials_up_more_than_10pct: a_(purch, 'p_up'),
      ephrata_and_betty_told: ay_(purch, 'p_told'),
      substitution_made: ay_(purch, 'p_sub'),
      wude_approved_substitute: ay_(purch, 'p_subok'),
      requests_with_3_or_more_quotes: pair_(purch, 'pr_quotes'),
      requests_prepared: a_(purch, 'pr_prep'),
      supplier_delays: a_(purch, 'sup_delay'),
      supplier_quality_issues: a_(purch, 'sup_quality'),
      cheque_value: a_(purch, 'chq_value'),
      /* each order today: did the supplier get a cheque, or is it on credit */
      orders_today_and_how_paid: rows_(purch.ord_list).map(function (r) {
        return { supplier: r.sup || '', job: r.code || '', material: r.item || '', amount: n_(r.amount) || null,
                 how_paid: r.paid === 'cheque' ? 'cheque given' + (r.chq ? ' (no. ' + r.chq + ')' : '')
                         : r.paid === 'credit' ? 'on credit, no cheque yet' + (r.due ? ' — to pay by ' + r.due : '')
                         : 'not said' };
      }),
      credit_owed_to_suppliers_now: a_(purch, 'cr_owed'),
      credit_paid_back_today: a_(purch, 'cr_paid'),
      credit_past_its_date: a_(purch, 'cr_overdue'),
      credit_past_its_date_list: rows_(purch.cr_overdue_list),
      credit_owed_last_7_days: series_(d, 'getachew-daily', 'cr_owed'),
      margin_floor_birr_per_m2: 6000,
      materials_up_10pct_last_7_days: series_(d, 'getachew-daily', 'p_up'),
      supplier_delays_last_7_days: series_(d, 'getachew-daily', 'sup_delay')
    };
  },
  ask:'Is anything we buy getting more expensive in a way that will eat the 6,000 Birr/m² '+
      'floor. A rise has to reach Ephrata before the next quote goes out, not after. '+
      'If a cheaper material was substituted without Wude approving it first, say so — '+
      'that is how a saving becomes a warranty claim. Say which suppliers were given a cheque '+
      'today and which are on credit with no cheque yet, how much Klever owes suppliers, and '+
      'anything past the date promised — a supplier owed too long stops delivering.' },

{ id:'finance', en:'Finance', am:'ፋይናንስ',
  said:['betty-daily', 'betty-forecast', 'betty-weekly', 'betty-cashflow', 'betty-joblist'],
  facts: function (d) {
    var fin = vals_(d.filed, 'betty-daily');
    return {
      /* a yes/no: read as a number it was 0 whatever she answered */
      cash_in: a_(fin, 'cash_in'), all_cash_banked_today: ay_(fin, 'cash_banked'), cash_in_hand: a_(fin, 'cash_hand'),
      bank_total: a_(fin, 'bank_total'), reserve_floor: 6000000,
      below_6m_reported: ay_(fin, 'below6_reported'),
      discrepancy: ay_(fin, 'discrepancy'),
      payments_approved: a_(fin, 'pay_approved'), payment_value: a_(fin, 'pay_value'),
      /* a count, not a yes/no — "1" was read as "no Kidan approval", and the
         reader called her own words "Kidan approved" a contradiction */
      payments_over_50k_sent_to_kidan: a_(fin, 'pay_kidan'),
      zamzam_transferred: a_(fin, 'zz_transfer'), zamzam_confirmed: ay_(fin, 'zz_confirmed'),
      zamzam_discrepancy: a_(fin, 'zz_disc'),
      advance_received: a_(fin, 'adv_in'), final_received: a_(fin, 'final_in'),
      board_mismatch: a_(fin, 'board_mismatch'),
      documents_missing: a_(fin, 'doc_missing'),
      bank_total_this_week: trend_(series_(d, 'betty-daily', 'bank_total')),
      morning_bank_balance_last_7_days: series_(d, 'betty-forecast', 'cf7_bank'),
      /* the last balance anyone reported this week, and when — so a reserve
         already breached is said on a day Selam did not file, rather than
         left to be spotted in a list of seven */
      last_bank_balance_reported: lastKnown_(d, [['betty-daily', 'bank_total'], ['betty-forecast', 'cf7_bank']], 6000000),
      days_until_below_6m_at_this_rate: daysToFloor_(series_(d, 'betty-forecast', 'cf7_bank'), 6000000)
    };
  },
  ask:'Is the money where it should be. The reserve floor is 6,000,000 Birr and falling '+
      'below it has to be reported the same day. A discrepancy, an unconfirmed ZamZam '+
      'transfer, or a payment over 50,000 without Kidan is a same-day problem, not a '+
      'month-end one. If days_until_below_6m_at_this_rate gives a number, say it — that is '+
      'the warning Selam’s letter fines for not giving. If it gives none, do not '+
      'estimate one. If last_bank_balance_reported is below the reserve, say so with its day '+
      'even when today’s report is missing — the last thing known is that the floor was broken.' },

{ id:'commercial', en:'Sales and commercial', am:'ሽያጭና ንግድ',
  said:['ephrata-daily', 'tsega-sales-daily', 'biruktayet-sales-daily', 'ephrata-weekly', 'ephrata-projection'],
  facts: function (d) {
    var ephrata = vals_(d.filed, 'ephrata-daily');
    var tsega = vals_(d.filed, 'tsega-sales-daily');
    var biruk = vals_(d.filed, 'biruktayet-sales-daily');
    return {
      leads_today: a_(ephrata, 'leads_total'),
      leads_by_source: { social:a_(ephrata, 'leads_social'), showroom:a_(ephrata, 'leads_showroom'),
                         referral:a_(ephrata, 'leads_referral'), agent:a_(ephrata, 'leads_agent'), other:a_(ephrata, 'leads_other') },
      new_leads_called_within_1hr: pair_(ephrata, 'resp_1hr'),
      visits_booked: a_(ephrata, 'visits_booked'), visits_done: a_(ephrata, 'visits_done'), visits_late: a_(ephrata, 'visits_late'),
      quotes_issued: a_(ephrata, 'quotes_issued'), quotes_late: a_(ephrata, 'quotes_late'),
      contracts_signed: a_(ephrata, 'contracts'), contract_value: a_(ephrata, 'contract_value'),
      collected_today: a_(ephrata, 'collected_today'),
      week_to_date: a_(ephrata, 'week_total'),
      weekly_floor: 3000000,
      /* the question is how many waited over 2 hours for an answer — late,
         not still waiting; "Ephrata must answer the pending message" was
         said of one answered that morning */
      whatsapp_answered_late_over_2_hours: a_(ephrata, 'wa_unanswered'),
      complaints_in_groups: a_(ephrata, 'wa_complaints'),
      tsega_filed: !!got_(d.filed, 'tsega-sales-daily'),
      biruktayet_filed: !!got_(d.filed, 'biruktayet-sales-daily'),
      collected_last_7_days: series_(d, 'ephrata-daily', 'collected_today'),
      collected_since_monday_from_her_daily_reports: sinceMonday_(d, 'ephrata-daily', 'collected_today'),
      left_to_reach_the_3m_floor: Math.max(0, 3000000 -
        sinceMonday_(d, 'ephrata-daily', 'collected_today').total),
      /* Monday to Saturday; the first live run said "tomorrow cannot close
         the gap" on a Thursday, with Friday and Saturday both still to come */
      working_days_left_this_week: Math.max(0, 6 - dow_(d.day)),
      leads_last_7_days: series_(d, 'ephrata-daily', 'leads_total'),
      contracts_last_7_days: series_(d, 'ephrata-daily', 'contracts'),
      /* what she expects to collect, added up in code */
      expected_collections: expectedOf_(ephrata)
    };
  },
  ask:'Compare what she expected to collect with what actually came in: an expected '+
      'payment that keeps sliding to next week is a customer who is not paying. '+
      'Is the week going to reach 3,000,000 Birr, and if not say it now rather than on '+
      'Friday. Look at where leads came from against which ones converted — if one source '+
      'produces volume and no contracts, that is money being spent for nothing. A WhatsApp '+
      'message that waited over 2 hours is a customer kept waiting; the figure counts messages '+
      'answered late, not messages still unanswered — the written answer says whether they '+
      'have been answered since.' },

{ id:'design', en:'Design', am:'ዲዛይን',
  said:['yohannis-design-daily', 'yonas-design-daily', 'abrham-g-design-daily', 'teklweld-design-daily', 'abrham-w-design-daily',
        'ermiyas-design-daily'],
  facts: function (d) {
    var ids = ['yohannis','yonas','abrham-g','teklweld','abrham-w','ermiyas'];
    var out = { designers: [], filed: 0, missing: [] };
    ids.forEach(function (id) {
      var r = got_(d.filed, id + '-design-daily');
      if (r) { out.filed++; out.designers.push({ who:id, values:r.fields }); }
      else if (!startsAfter_(d, id)) out.missing.push(id);
    });
    return out;
  },
  ask:'Are designs moving or sitting. A design that stalls holds up a job that is already '+
      'paid for in part, so a stage not moving for days matters more than a slow day. '+
      'If the same customer is being redrawn again and again, name it — revisions are the '+
      'hidden cost in this trade.' },

{ id:'site', en:'Installation and site', am:'ተከላና ቦታ',
  said:['elyas-daily', 'ashenafi-daily', 'elyas-weekly'],
  facts: function (d) {
    var elyas = vals_(d.filed, 'elyas-daily');
    var ashen = vals_(d.filed, 'ashenafi-daily');
    return {
      jobs_today: a_(elyas, 'j_total'), completed: a_(elyas, 'j_done'), in_progress: a_(elyas, 'j_wip'),
      m2_installed: a_(elyas, 'j_m2'),
      site_not_ready_count: a_(elyas, 'r_notready'),
      site_did_not_match_measurement: a_(elyas, 'r_meas'),
      whose_measurement: elyas.r_whose || '',
      hours_lost_to_site: a_(elyas, 'r_lost'),
      site_conditions: rows_(elyas.r_rows),
      customer_told_same_day: ay_(elyas, 'r_told'),
      photographed_first: ay_(elyas, 'r_photo'),
      acceptances_signed: a_(elyas, 'ac_signed'),
      complaints: a_(elyas, 'ac_complaints'),
      rework_at_site: ay_(elyas, 'q_rework'),
      customer_property_damaged: ay_(elyas, 'cl_damage'),
      ashenafi_filed: !!got_(d.filed, 'ashenafi-daily'),
      m2_installed_last_7_days: series_(d, 'elyas-daily', 'j_m2'),
      hours_lost_to_site_last_7_days: series_(d, 'elyas-daily', 'r_lost')
    };
  },
  ask:'Did installation lose time to something that was not the installers’ fault. A site '+
      'that did not match our measurement is a design or survey failure and the person '+
      'whose measurement it was should be named. Separate what Elyas can fix from what is '+
      'being handed to him already broken.' },

{ id:'customer', en:'Customers', am:'ደንበኞች',
  said:['betty-pulse', 'elyas-daily', 'ephrata-daily', 'betty-weekly-cx'],
  facts: function (d) {
    var pulse = vals_(d.filed, 'betty-pulse');
    var elyas = vals_(d.filed, 'elyas-daily');
    var ephrata = vals_(d.filed, 'ephrata-daily');
    return {
      pulse: pulse,
      complaints_at_site: a_(elyas, 'ac_complaints'),
      complaints_in_whatsapp: a_(ephrata, 'wa_complaints'),
      acceptances_signed: a_(elyas, 'ac_signed'),
      customers_called_before_arrival: pair_(elyas, 'ac_called'),
      whatsapp_answered_late_over_2_hours: a_(ephrata, 'wa_unanswered'),
      pulse_filed: !!got_(d.filed, 'betty-pulse'),
      site_complaints_last_7_days: series_(d, 'elyas-daily', 'ac_complaints'),
      whatsapp_complaints_last_7_days: series_(d, 'ephrata-daily', 'wa_complaints')
    };
  },
  ask:'What are customers actually saying, and is anyone waiting for an answer. A complaint '+
      'that appears in two places is one unhappy customer, not two — say which. Silence from '+
      'a customer mid-job is not good news.' },

{ id:'rovestone', en:'Rovestone', am:'ሮቭስቶን',
  facts: function (d) {
    var f = got_(d.filed, 'frewoyni-daily');
    if (!f) return { filed_today: false, note: 'Frewoyni (Rovestone Operations Lead) did not file her daily report.' };
    var v = f.fields || {};
    return {
      filed_today: true,
      from: 'Frewoyni, Rovestone Operations Lead — Rovestone is the sister company under the same Chairman',
      done_today: v.w_done || '',
      open_jobs: rows_(v.w_jobs),
      new_orders_to_klever: yes_(v.k_new) ? rows_(v.k_new_list) : [],
      waiting_on_klever: v.k_waiting || '',
      problem_with_klever_work: ay_(v, 'k_quality') ? (v.k_quality_what || 'yes') : null,
      money_in: a_(v, 'm_in'),
      money_out: a_(v, 'm_out'),
      paid_to_klever: a_(v, 'm_klever'),
      money_in_last_7_days: series_(d, 'frewoyni-daily', 'm_in'),
      problem: v.p_problem || '',
      decision_needed_from_the_chairman: yes_(v.p_chair) ? (v.p_chair_what || 'yes') : null,
      plan_for_tomorrow: v.t_plan || '',
      klever_rules_for_rovestone: 'Rovestone pays Klever 50% before production and 50% on delivery; every ' +
        'Rovestone order needs the Chairman’s approval; Rovestone work comes after fully paid external jobs.'
    };
  },
  ask:'Read Rovestone’s day. Say what the Chairman must act on: a decision she asked for, an order '+
      'sent to Klever that needs his approval or Klever’s capacity, money owed to Klever, a problem '+
      'with Klever’s work. If nothing needs him, say so in one line.' },

/* Meri Block Board and Real Estate & Construction (Lemi Kura), 6 Oct 2026:
   each reports the way Rovestone does; one agent reads both */
{ id:'sisters', en:'Meri Block Board and Real Estate', am:'መሪ ብሎክ ቦርድና ሪል እስቴት',
  facts: function (d) {
    function one(pid, co) {
      var f = got_(d.filed, pid + '-daily');
      if (!f) return { company: co, filed_today: false };
      var v = f.fields || {};
      return {
        company: co, filed_today: true,
        done_today: v.w_done || '',
        open_jobs: rows_(v.w_jobs),
        with_klever_today: yes_(v.k_new) ? rows_(v.k_new_list) : [],
        waiting_on_klever: v.k_waiting || '',
        problem_with_klever: ay_(v, 'k_quality') ? (v.k_quality_what || 'yes') : null,
        money_in: a_(v, 'm_in'),
        money_out: a_(v, 'm_out'),
        to_or_from_klever: a_(v, 'm_klever'),
        money_in_last_7_days: series_(d, pid + '-daily', 'm_in'),
        problem: v.p_problem || '',
        decision_needed_from_the_chairman: yes_(v.p_chair) ? (v.p_chair_what || 'yes') : null,
        plan_for_tomorrow: v.t_plan || ''
      };
    }
    return {
      about: 'Two companies of the group under the same Chairman, each reporting here from 7 Oct 2026 ' +
             '(no fines; not Klever staff). Their people’s names are not on file yet.',
      meri_block_board: one('meri', 'Meri Block Board'),
      real_estate_lemi_kura: one('lemikura', 'Real Estate & Construction (Lemi Kura project)')
    };
  },
  ask:'Read each company’s day. Say what the Chairman must act on: a decision asked of him, '+
      'anything waiting on Klever or owed between a company and Klever, a problem with Klever. '+
      'A company that did not report: say so in a few words. If nothing needs him, say so in one line.' },

{ id:'compliance', en:'Who reported and who did not', am:'ማን ሪፖርት አደረገ ማን አላደረገም',
  facts: function (d) {
    var missing = [], late = [], ontime = [];
    var waiting = [], notDue = [];
    d.ledger.forEach(function (l) {
      var row = { person:l.person, report:l.report, due:l.due };
      if (l.status === 'MISSING') missing.push(row);
      else if (l.status === 'LATE') late.push(row);
      else if (l.status === 'NOT IN YET') waiting.push(row);
      /* mid-day, a report whose deadline is still to come. It was counted
         as on time: the first reading after the restart, with one report
         in of nineteen, said "almost the entire team filed on time today" */
      else if (l.status === 'NOT DUE YET') notDue.push(row);
      else ontime.push(row);
    });
    return { due_today: d.ledger.length, filed_so_far: ontime.length + late.length,
             on_time: ontime.length,
             late: late, missing: missing,
             not_due_yet: notDue,
             weekly_reports_not_in_yet: waiting.concat(d.weekWaiting || []),
             weekly_rule: 'A weekly report counts for the week it is sent in. The week closes on Sunday at ' +
                          '9 PM: sent after its deadline but before then, it is late; not in by then, it is ' +
                          'missing. (Selam’s Monday customer summary is about the week before; its week turns ' +
                          'at the start of Sunday.) So a weekly report not in yet is not missing yet — say it ' +
                          'is still to come.',
             more_than_once_this_week: repeats_(d) };
  },
  ask:'Who did not report. This is the list nobody was keeping before, so be exact and '+
      'be short: names and what is missing. If the same person is missing repeatedly that '+
      'matters more than a busy day; if almost everyone is late, the deadline is wrong, '+
      'not the people.' },

{ id:'penalties', en:'Penalty ledger', am:'የቅጣት መዝገብ',
  facts: function (d) {
    var owed = d.ledger.filter(function (l) { return l.amount > 0; });
    return {
      total_birr: d.ledger.reduce(function (a, l) { return a + l.amount; }, 0),
      charges: owed.map(function (l) {
        return { person:l.person, report:l.report, status:l.status, birr:l.amount, under:l.why };
      }),
      note_yordanos: 'Yordanos files a daily store report but his letter sets no penalty ' +
                     'for missing it — he is listed and charged nothing until the Chairman decides.',
      more_than_once_this_week: repeats_(d),
      /* everything else the letters charged and paid today — fines for what
         happened, bonuses earned, warnings — already worked out in code */
      other_fines_and_bonuses: (d.ruleLines || []).filter(function (l) {
        return l.amount > 0 || l.wouldBe > 0 || l.kind === 'consequence';
      }).map(function (l) {
        return { person: l.name, kind: l.kind, what: l.reportName, birr: l.amount,
                 held_or_not_counted_would_be: l.wouldBe || 0, why: l.why };
      })
    };
  },
  ask:'The amounts are already calculated and correct — do not restate the arithmetic and '+
      'do not recalculate it. Say only whether a pattern is forming: the same person, the '+
      'same report, the same day of the week. A first miss is a bad day; a third is a '+
      'conversation.' },

{ id:'margin', en:'Margin watch', am:'የትርፍ ክትትል',
  said:['ephrata-daily', 'amaha-daily', 'getachew-daily'],
  facts: function (d) {
    var ephrata = vals_(d.filed, 'ephrata-daily');
    var amaha = vals_(d.filed, 'amaha-daily');
    var purch = vals_(d.filed, 'getachew-daily');
    return {
      contracts_signed: a_(ephrata, 'contracts'),
      contract_value: a_(ephrata, 'contract_value'),
      /* There used to be a Birr-per-m² figure here: today's contract value
         divided by today's production. Those are different jobs — what was
         sold today is made weeks from now — so the number meant nothing and,
         below 6,000, would have raised a false alarm. No form asks the m² of
         a contract, so the price per m² of a sale cannot be worked out yet. */
      price_per_m2_of_a_sale: 'not reported — no form asks the m² of a signed contract',
      m2_produced_today: a_(amaha, 'p_total'),
      margin_floor_birr_per_m2: 6000,
      waste_pct: a_(amaha, 'w_pct'),
      material_over_bom_pct: a_(amaha, 'w_var'),
      m2_per_sheet: a_(amaha, 'b_yield'),
      materials_up_over_10pct: a_(purch, 'p_up'),
      savings_today: a_(amaha, 'sav_today'),
      m2_per_sheet_this_week: trend_(series_(d, 'amaha-daily', 'b_yield'))
    };
  },
  ask:'Is anything quietly eating the 6,000 Birr/m² floor. Board price rising, yield '+
      'falling, waste climbing and material over BOM all do the same damage from different '+
      'directions. Say which one is moving, not all four.' },

{ id:'contradictions', en:'Reports that disagree', am:'የሚጋጩ ሪፖርቶች',
  said:['amaha-daily', 'yordanos-daily', 'liu-daily', 'wude-daily', 'elyas-daily', 'ephrata-daily', 'getachew-daily'],
  facts: function (d) {
    var N = function (rid, f) { return nOrNull_(d.filed, rid, f); };
    var amaha = vals_(d.filed, 'amaha-daily');
    var yord = vals_(d.filed, 'yordanos-daily');
    /* offcuts leaving the factory are recorded per board row, not as a total */
    var sentOut = null;
    if (got_(d.filed, 'amaha-daily')) {
      sentOut = 0;
      rows_(amaha.b_rows).forEach(function (r) { sentOut += a_(r, 'boff') || 0; });
    }
    return {
      note: 'null means that report was not filed, or that question was left blank — it does not mean zero',
      not_filed: notFiled_(d),
      amaha_m2: N('amaha-daily','p_total'),        mahelet_m2: N('liu-daily','m2'),
      amaha_defects: N('amaha-daily','qc_defects'), wude_defects: N('wude-daily','d_total'),
      mahelet_defects: N('liu-daily','defects'),
      amaha_waste_pct: N('amaha-daily','w_pct'),   mahelet_waste_pct: N('liu-daily','waste'),
      amaha_stopped_for_board: ay_(amaha, 'b_short'),
      amaha_which_board: amaha.b_shortw || '',
      yordanos_shortages: N('yordanos-daily','sh_flagged'),
      yordanos_stopped_production: ay_(yord, 'sh_stopped'),
      yordanos_which: yord.sh_what || '',
      wude_pass_rate: N('wude-daily','i_rate'),
      mahelet_qc_pass: N('liu-daily','qc_pass'), mahelet_qc_fail: N('liu-daily','qc_fail'),
      elyas_jobs_finished: N('elyas-daily','j_done'), mahelet_jobs_installed: N('liu-daily','installed'),
      offcut_m2_received_by_store: N('yordanos-daily','k_offin'),
      offcut_m2_sent_by_factory: sentOut,
      /* already checked in code: pairs that differ by more than a tenth, where
         both reports were actually filed */
      mismatches_found_in_code: contradictions_(d),
      /* and inside one report: a part bigger than its whole, sources that do
         not add up to their total (oddFigures in forms.js) */
      cannot_be_right_within_one_report: oddIn_(d),
      /* what each person says they wait on or need from someone else */
      who_is_waiting_on_whom: waitsOn_(d)
    };
  },
  ask:'These figures come from different people describing the same day. Where two of them '+
      'cannot both be true, say which two and by how much. A report can also disagree with '+
      'itself — cannot_be_right_within_one_report lists those; name each one and who has to '+
      'correct it. A null is a report that was never '+
      'filed — that is a gap, not a disagreement, and you must never describe it as somebody '+
      'having recorded zero. Do not reach: a small difference is rounding or timing. A '+
      'production figure that disagrees with the operations figure, or a factory stopped for '+
      'a board the store says it had, is worth the Chairman’s time. '+
      'who_is_waiting_on_whom is what each person wrote about waiting on, or needing, someone '+
      'else — every department, and Rovestone. Read them side by side: two people each waiting '+
      'on the other over the same job or order, or one saying a thing was sent and the other '+
      'that it never came, is a job nobody is moving. Name both people, the thing, and since when.' },

{ id:'decide', en:'What to decide', am:'ምን መወሰን እንዳለበት', last:true,
  facts: function (d) {
    return {
      open_decisions: decisionsBiting_(d),
      already_decided: SETTLED,
      note: 'cost_today is null where today was not one of the days this one costs anything. '+
            'already_decided is settled: never raise it as open or ask him to decide it again',
      asked_of_the_chairman_today: askedOfChair_(d)
    };
  },
  ask:'These are decisions the Chairman has not made. Do not list them all back — he wrote '+
      'them. Take the ones with a cost_today and give each one sentence: what it cost today, '+
      'then what to do. '+
      'Where "yours" is true, the answer is a commercial choice and not something you can '+
      'deduce — do NOT pick a side. Say what each answer would mean and leave it with him. '+
      'Everywhere else the paper contradicts itself and there is a right answer, so say it '+
      'plainly. '+
      'Never attribute a figure to a document unless the detail says so — getting which '+
      'document holds which number backwards is worse than saying nothing. '+
      'Where a decision blocks documents from being printed, say that first: time spent not '+
      'deciding it is the only cost here that compounds. At most 150 words. If nothing bit '+
      'today, name the decision nearest to biting and stop. '+
      'People also asked him for decisions in today\u2019s reports (asked_of_the_chairman_today): '+
      'give each one its own line — who asks, what, the options they give and by when — and '+
      'do not pick a side.' },

{ id:'brief', en:'The Chairman’s brief', am:'የሊቀመንበሩ ማጠቃለያ', last:true,
  facts: function (d) {
    return { date: d.dayLabel, instructions: d.instructions,
             asked_of_the_chairman_today: askedOfChair_(d),
             rules_broken_today: rulesBroken_(d) };
  },
  ask:'Below is what the other agents found today. Write the Chairman five lines at most. '+
      'Lead with the thing that costs the most money or will if nobody moves. Do not '+
      'summarise everything — leave out what is merely normal. If the day was ordinary, '+
      'say so in one line and stop. Name people only where a person has to act. '+
      'An instruction from the Chairman that is past its date and still open belongs in the '+
      'brief — name who has it and how many days over it is. '+
      'Every decision someone asked of him in today\u2019s reports (asked_of_the_chairman_today) '+
      'goes in the brief as well, on top of the five lines: who asks, what, the options they '+
      'give and by when. Do not choose for him. '+
      'Do not join two findings into one cause unless a report says that is the cause. '+
      'Everything in rules_broken_today goes in the brief too, every time, on top of the five '+
      'lines — one line each: what happened, who, in their words. It is not about today\u2019s '+
      'money; it is about whether the work and the reports can be trusted. And where the '+
      'readers found two people each waiting on the other, that job goes in: nobody is moving it.' }
];

/* ------------------------------------------------------------------ *
 *  The run                                                            *
 * ------------------------------------------------------------------ */

/* The morning trigger: close yesterday, have the agents read it, send one
   email. On a Monday that is Sunday — the close of the week, done at 9 PM
   by the watch; this only finishes what the watch did not. */
function dailyRun() { return ran_('daily', dailyRun_); }
function dailyRun_() {
  var day = addDays_(todayAddis_(), -1);
  var warn = [];
  /* A day whose close failed (forms.js unreadable, Firestore down, a quota)
     was never closed again: no fines, no rule lines, and no history for next
     week's "twice in a row". Each morning closes any of the last seven days
     that was owed something and has no ledger, oldest first, before
     yesterday. */
  var caught = [];
  try { caught = catchUp_(day); }
  catch (e) { warn.push('Catching up missed days: ' + e.message); }
  /* Last month, from the 3rd to the 6th. Not closed yet — it waited for a
     Sunday 1st, or its own run on the 2nd failed — it is closed now, and
     again each morning until it is. Closed, its Pay tab is written again from
     the stored lines, so what he cancelled on the 4th is off by the 5th.
     Done before yesterday's close, so a failure there cannot cost the month. */
  var dom = Number(todayAddis_().slice(8));
  if (dom >= 3 && dom <= 6) {
    var prevM = prevMonthStart_(todayAddis_()).slice(0, 7);
    var monthDone = null;
    try { monthDone = fsQuery_('months', [['month', 'EQUAL', prevM]], null).length > 0; }
    catch (e) { warn.push('Month: ' + e.message); }
    if (monthDone === false) {
      try { ran_('month', function () { return monthlyPack_(prevM); }); }
      catch (e) { warn.push('Month: ' + e.message); }
    } else if (monthDone) {
      try { refreshPay_(prevM); }
      catch (e) { Logger.log('pay refresh: %s', e.message); warn.push('Pay tab: ' + e.message); }
    }
  }
  /* supplier credit two days from its pay-by date: a reminder to Selam and
     Getachew (Credit.js) — every morning, Sunday too, before any return */
  try { creditReminders_(todayAddis_()); }
  catch (e) { Logger.log('credit reminders: %s', e.message); warn.push('Credit reminders: ' + e.message); }
  /* his leads and jobs: built again (a lead goes quiet by the calendar
     alone) and the morning's note written (Register.js) */
  try { registerBuild_(todayAddis_(), true); }
  catch (e) { Logger.log('register: %s', e.message); warn.push('Leads & jobs: ' + e.message); }
  /* Yesterday was Sunday: the week. The watch closed it at 9 PM and sent
     its summary if all went well; whatever it did not do is done now. The
     week's summary is its reading — the agents read working days. */
  if (dow_(day) === 0 && day >= WEEK_FROM_) {
    var wk = weekEnd_(day);
    try { bonusStanding_(day); }
    catch (e) { Logger.log('bonus standing: %s', e.message); warn.push('Bonuses so far: ' + e.message); }
    return { period: day, warn: warn.concat(wk.warn),
             note: (wk.closed ? 'closed the week' : 'the week was already closed') +
                   (wk.pack ? '; weekly summary sent' : '') +
                   (caught.length ? '; also closed ' + caught.join(', ') + ', which had been missed' : '') };
  }
  /* a week whose close or summary failed is mended on the mornings after */
  var lastSun = addDays_(day, -dow_(day));
  if (lastSun >= WEEK_FROM_) {
    try { warn = warn.concat(weekEnd_(lastSun).warn); }
    catch (e) { warn.push('Closing the week to ' + lastSun + ': ' + e.message); }
  }
  /* A day before counting starts is nobody's: it is not closed, not read and
     not mailed. 5 Oct 2026: the cards were not out, nobody could report, and
     the morning would have closed Monday and mailed him "19 due, 0 filed"
     for it. Before, a day before LEDGER_START was closed at no charge — the
     practice weeks of September, when the team was being shown the system. */
  var start = prop_('LEDGER_START', '');
  if (start && day < start) {
    return { period: day, warn: warn,
             note: 'before counting starts (' + start + ') — not closed' +
                   (caught.length ? '; also closed ' + caught.join(', ') + ', which had been missed' : '') };
  }
  var c = closeDay_(day);
  /* the month's bonuses so far, for the Bonuses section of his page */
  try { bonusStanding_(day); }
  catch (e) { Logger.log('bonus standing: %s', e.message); warn.push('Bonuses so far: ' + e.message); }
  var owed = c.ledger.reduce(function (s, l) { return s + (l.amount || 0); }, 0);
  var done = { period: day, warn: warn,
               note: (c.due.length ? c.due.length + ' due, ' + c.filed.length + ' filed, ' +
                                     fmt_(owed) + ' Birr in report fines'
                                   : 'nothing was due') +
                     (caught.length ? '; also closed ' + caught.join(', ') + ', which had been missed' : '') };
  if (!c.due.length) return done;
  runOn_(c, false);
  return done;
}

/* The days in the week before `day` that were owed a report, could be
   charged (on or after LEDGER_START) and have no ledger — closed now. */
function catchUp_(day) {
  var start = prop_('LEDGER_START', '');
  var from = addDays_(day, -7);
  if (start && from < start) from = start;
  if (from >= day) return [];
  var have = {};
  ledgersBetween_(from, day).forEach(function (d) { have[d.day] = d; });
  var schedule = loadSchedule_();
  var done = [];
  for (var d = from; d < day; d = addDays_(d, 1)) {
    /* a Sunday whose week was closed at 9 PM and whose day was never finished */
    if (have[d] && have[d].dayOpen) { closeDay_(d, { part: 'day', doc: have[d] }); done.push(d); continue; }
    if (have[d] || !owedOn_(schedule, d).length) continue;
    closeDay_(d);
    done.push(d);
  }
  return done;
}

/* The Chairman's button: today so far. Nothing is written to the ledger —
   a charge is only final once the day has closed — and everything it sends
   says so. */
function runAgents(opts) {
  var c = closeDay_(todayAddis_(), { write: false, asOf: new Date() });
  runOn_(c, true, opts);
}

/* `quiet`: the reading goes to the Chairman's page and nowhere else — no
   email, no Sheet rows. That is the run a new report sets off (runIfNew_):
   twenty emails a day would bury the one he reads in the morning. */
function runOn_(c, provisional, opts) {
  var quiet = !!(opts && opts.quiet);
  var d = gather_(c, provisional);
  var results = askAll_(d);
  if (!quiet) writeAnalysis_(results, d);
  publishAnalysis_(results, d);
  if (!quiet) mailAnalysis_(results, d);
  /* the morning's brief to his WhatsApp (Wa.js) — the closed day only, not a mid-day look */
  if (!quiet && !provisional) waSendBrief_(results, d);
}

/* Writes nothing, sends nothing, spends nothing on the model. Use this to see
   the facts each agent would be given before letting any of it near Gemini.
   Pass a day ('2026-10-01') or leave it empty for yesterday. */
function previewAgents(day) {
  day = day || addDays_(todayAddis_(), -1);
  var d = gather_(closeDay_(day, { write: false }), true);
  Logger.log('%s — %s reports filed, %s due', d.dayLabel, d.filed.length, d.ledger.length);
  AGENTS.forEach(function (a) {
    if (a.last) return;
    Logger.log('\n--- %s ---\n%s', a.en, JSON.stringify(a.facts(d), null, 1).substring(0, 1500));
  });
}

/* one read of the day, shared by all fifteen */
function gather_(c, provisional) {
  /* The ledger carries the id the site uses — liu, abrham-g, betty. Those are
     handles, not names, and "Liu did not file" is not a sentence the Chairman
     should have to translate. Mahelet is called Liu nowhere except in this
     codebase. */
  var ledger = c.ledger.map(function (l) {
    return { person: l.name, id: l.person, report: l.reportName, reportId: l.report,
             due: l.due, status: l.status, amount: l.amount, why: l.why };
  });
  return {
    day: c.day,
    when: dayStart_(c.day),
    dayLabel: dayLabel_(c.day),
    provisional: !!provisional,
    filed: c.filed,
    recent: c.filings,
    before: c.before,
    schedule: c.schedule,
    due: c.due,
    names: c.names,
    ledger: ledger,
    ruleLines: c.ruleLines || [],
    ruleErrors: c.ruleErrors || [],
    weekWaiting: c.weekWaiting || [],
    instructions: instructionsOn_(c.day, c.names)
  };
}

/* What the Chairman asked of people, as it stands at the end of the day:
   what is past its date and still open, and what was closed today. Read in
   code, so the brief is told who is late with what rather than left to spot
   it. If the collection cannot be read — the rules not yet published — the
   run goes on without it rather than losing the day. */
function instructionsOn_(day, names) {
  var all;
  try { all = fsQuery_('instructions', [], null); }
  catch (e) { return { overdue: [], closed_today: [], note: 'instructions could not be read' }; }
  var overdue = [], closed = [];
  all.forEach(function (i) {
    var who = (names && names[i.to]) || i.to;
    if (i.status === 'open' && i.due <= day) {
      overdue.push({ who: who, what: i.text, due: i.due,
                     days_over: Math.round((dayStart_(day) - dayStart_(i.due)) / 86400000) });
    }
    if (i.status === 'done' && i.doneAt && dayOf_(i.doneAt) === day) {
      closed.push({ who: who, what: i.text, due: i.due, note: i.note || '',
                    on_time: dayOf_(i.doneAt) <= i.due });
    }
  });
  overdue.sort(function (a, b) { return b.days_over - a.days_over; });
  return { overdue: overdue, closed_today: closed };
}

/* Claude or Gemini — whichever the Chairman chose; see Brain.js */
function askAll_(d) {
  var first = AGENTS.filter(function (a) { return !a.last; });
  var out = [];

  if (!brain_().key) {
    return AGENTS.map(function (a) {
      return { id:a.id, en:a.en, am:a.am,
               text:'(No model key set — CLAUDE_KEY or GEMINI_KEY. The facts below were still calculated.)',
               facts:a.last ? {} : a.facts(d) };
    });
  }

  /* fourteen at once. One after another would sit near the six-minute limit. */
  var texts = aiAskAll_(first.map(function (a) { return promptFor_(a, a.facts(d), d); }));
  first.forEach(function (a, i) {
    out.push({ id:a.id, en:a.en, am:a.am, facts:a.facts(d), text:texts[i] });
  });

  /* the decision agent reads the day; the brief reads everything, so they run
     in that order and not at the same time */
  var decide = AGENTS.filter(function (a) { return a.id === 'decide'; })[0];
  if (decide) {
    out.push({ id:decide.id, en:decide.en, am:decide.am, facts:{},
               text:aiAsk_(promptFor_(decide, decide.facts(d), d)), decision:true });
  }

  /* the brief reads everything above it */
  var brief = AGENTS.filter(function (a) { return a.id === 'brief'; })[0];
  if (brief) {
    var digest = out.map(function (r) { return '## ' + r.en + '\n' + r.text; }).join('\n\n');
    out.push({ id:brief.id, en:brief.en, am:brief.am, facts:{}, last:true,
               text:aiAsk_(promptFor_(brief, brief.facts(d), d) + '\n\n' + digest, 2000) });
  }
  return out;
}

function promptFor_(agent, facts, d) {
  return [
    'You are one of fifteen analysts reading a single day at Klever Küche, a kitchen',
    'cabinet manufacturer in Addis Ababa. Prices are in Birr; the production target is',
    '40 m² a day and the margin floor is 6,000 Birr per m².',
    '',
    'You are the ' + agent.en + ' analyst. Nobody else will cover your subject, and you',
    'should not cover theirs.',
    '',
    'Every number below was already calculated in code, from the reports as they were',
    'filed. Do not recalculate anything, and do not list numbers back — the Chairman can',
    'already see them. Write about what they mean. The arithmetic is right; an answer',
    'someone typed can still be wrong, and those found are listed below.',
    '',
    'At most 120 words, short bullets. Write plainly, the way you would say it to the',
    'Chairman standing in the factory: no adjectives doing the work of evidence, no',
    'headline labels in bold, nothing dressed up. "Edge banding stopped work for three',
    'hours" — not "edge banding is plaguing the shop floor". If your subject had an ordinary day,',
    'say so in one line rather than finding something to say.',
    '',
    'null means the figure was not given: the report never came, or it came with that',
    'question left blank. It is never zero, none, nil, "no complaints" or "all answered" —',
    'say "not reported" or "left blank", and draw nothing from it.',
    '',
    'A list of seven values runs oldest to newest; the days are ' + weekLabels_(d) + '.',
    'null in it is a day that report was owed and not filed; "not answered" is a day it',
    'came with this question blank; "not due" is a day nobody owed it (a Sunday, or a day',
    'the letter excuses); "not tracked" is a day before the ledger began keeping count, or',
    'before the restart — nothing then counts against anyone.',
    'Only null is a miss. When you count days in a row, count only those. Use the week only',
    'where it changes what today means — a third day running, a slide that started on Monday.',
    'Name a day by the label above, not by counting back.',
    '',
    'YOUR QUESTION: ' + agent.ask,
    '',
    '--- ' + d.dayLabel + (d.provisional ? ' — SO FAR TODAY, the day is not over' : '') + ' ---',
    d.provisional ? soFar_(d)
                  : 'Reports that were due today and never arrived: ' +
                    (notFiled_(d).join('; ') || 'none — everything was filed'),
    'Reports that came in with questions left blank: ' +
      (leftBlank_(d).join('; ') || 'none'),
    oddBlock_(d),
    '',
    JSON.stringify(facts, null, 1),
    saidBlock_(agent, d)
  ].join('\n');
}

/* "Tue 22 Sep, … Mon 28 Sep (today)" — the first reading called a figure
   filed at 1 AM on Saturday "Friday's", counting back along a bare list */
function weekLabels_(d) {
  var out = [];
  for (var i = 6; i >= 0; i--) {
    var day = addDays_(d.day, -i);
    out.push(Utilities.formatDate(new Date(day + 'T12:00:00' + ADDIS_), tz_(), 'EEE d MMM') +
             (i === 0 ? ' (today)' : ''));
  }
  return out.join(', ');
}

/* the answers that cannot be right, found in code — see oddIn_ */
function oddBlock_(d) {
  var odd = oddIn_(d);
  if (!odd.length) return 'Answers that cannot be right as written: none found.';
  return 'Answers that cannot be right as written, found in code — the report says one ' +
         'thing in one place and another elsewhere, or a part is bigger than its whole. Do not ' +
         'reason from these figures or from anything worked out of them; if one is in your ' +
         'subject, say it cannot be relied on until the person corrects it:\n' +
         odd.map(function (o) { return '- ' + o.who + ', ' + o.report + ': ' + o.what; }).join('\n');
}

function readReply_(res) {
  if (!res || res.getResponseCode() !== 200) {
    return '(no answer — HTTP ' + (res ? res.getResponseCode() : '?') + ')';
  }
  try {
    var b = JSON.parse(res.getContentText());
    return String(b.candidates[0].content.parts[0].text).trim();
  } catch (e) {
    return '(could not read the reply)';
  }
}

/* ------------------------------------------------------------------ *
 *  Output                                                             *
 * ------------------------------------------------------------------ */

var ANALYSIS_TAB_ = 'Daily Analysis';

function writeAnalysis_(results, d) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(ANALYSIS_TAB_);
  if (!sh) {
    sh = ss.insertSheet(ANALYSIS_TAB_);
    sh.appendRow(['Date', 'Agent', 'Finding']);
    sh.setFrozenRows(1);
  }
  var day = d.day + (d.provisional ? ' (so far)' : '');
  var rows = results.map(function (r) { return [day, r.en, cell_(r.text)]; });
  if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, 3).setValues(rows);
}

function mailAnalysis_(results, d) {
  var brief = results.filter(function (r) { return r.id === 'brief'; })[0];
  var decide = results.filter(function (r) { return r.decision; })[0];
  var rest = results.filter(function (r) { return !r.last && !r.decision; });
  var owed = d.ledger.reduce(function (a, l) { return a + l.amount; }, 0);
  var missing = d.ledger.filter(function (l) { return l.status === 'MISSING'; }).length;
  var ins = d.instructions || { overdue: [] };

  var html =
    '<div style="font-family:Helvetica,Arial,sans-serif;max-width:680px;color:#141b1a">' +
    '<h2 style="font-size:18px;margin:0 0 2px">Klever — ' +
      (d.provisional ? 'today so far' : 'the day') + '</h2>' +
    '<div style="color:#66716d;font-size:13px;margin-bottom:18px">' + esc_(d.dayLabel) +
      (d.provisional ? ' · asked for from your page — nothing below is charged yet' : '') +
    '</div>' +

    '<table width="100%" cellpadding="0" cellspacing="6" style="margin:0 -6px 18px;' +
      'font-family:monospace"><tr>' +
      tile_('FILED', d.filed.length + ' / ' + d.ledger.length) +
      tile_(d.provisional ? 'NOT IN YET' : 'NOT FILED', String(missing)) +
      tile_(d.provisional ? 'OWED SO FAR' : 'OWED', fmt_(owed) + ' Birr') +
    '</tr></table>';

  if (brief) {
    html += '<div style="background:#f3f4f1;border-left:3px solid #0f5c54;padding:14px 16px;' +
            'margin-bottom:24px;font-size:14px;line-height:1.65;white-space:pre-wrap">' +
            esc_(brief.text) + '</div>';
  }

  if (decide) {
    html += '<h3 style="font-size:14px;margin:0 0 6px;color:#8f3020;letter-spacing:.02em">' +
            'What to decide</h3>' +
            '<div style="background:#f8eae6;border-left:3px solid #8f3020;padding:14px 16px;' +
            'margin-bottom:26px;font-size:13.5px;line-height:1.65;white-space:pre-wrap">' +
            esc_(decide.text) + '</div>';
  }

  /* what he asked for and has not had — listed in code, so it is complete */
  if (ins.overdue.length) {
    html += '<h3 style="font-size:14px;margin:0 0 6px;color:#8f3020">Your instructions, past their date</h3>' +
            '<table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;margin-bottom:24px">';
    ins.overdue.forEach(function (i) {
      html += '<tr><td style="padding:6px 8px;border-bottom:1px solid #e4e7e3;width:30%"><b>' +
              esc_(i.who) + '</b></td><td style="padding:6px 8px;border-bottom:1px solid #e4e7e3">' +
              esc_(i.what) + '</td><td style="padding:6px 8px;border-bottom:1px solid #e4e7e3;' +
              'white-space:nowrap;color:#8f3020;font-family:monospace">' +
              (i.days_over ? i.days_over + (i.days_over === 1 ? ' day' : ' days') + ' over' : 'due today') +
              '</td></tr>';
    });
    html += '</table>';
  }

  rest.forEach(function (r) {
    html += '<h3 style="font-size:13.5px;margin:20px 0 4px;color:#0f5c54">' + esc_(r.en) + '</h3>' +
            '<div style="font-size:13.5px;line-height:1.6;white-space:pre-wrap;color:#3a4442">' +
            esc_(r.text) + '</div>';
  });

  /* the ledger itself — every report that was not on time, and what it cost */
  var off = d.ledger.filter(function (l) { return l.status === 'LATE' || l.status === 'MISSING'; });
  if (off.length) {
    html += '<h3 style="font-size:13.5px;margin:26px 0 6px;color:#0f5c54">' +
            (d.provisional ? 'Not in yet, and late' : 'Late and missing') + '</h3>' +
            '<table width="100%" cellpadding="0" cellspacing="0" style="font-size:12.5px">';
    off.forEach(function (l) {
      html += '<tr><td style="padding:5px 8px;border-bottom:1px solid #e4e7e3">' + esc_(l.person) +
              '</td><td style="padding:5px 8px;border-bottom:1px solid #e4e7e3;color:#66716d">' +
              esc_(l.report) + '</td><td style="padding:5px 8px;border-bottom:1px solid #e4e7e3;' +
              'color:#8f3020">' + esc_(l.status) + '</td><td align="right" style="padding:5px 8px;' +
              'border-bottom:1px solid #e4e7e3;font-family:monospace">' +
              (l.amount ? fmt_(l.amount) : '—') + '</td></tr>';
    });
    html += '<tr><td colspan="3" style="padding:7px 8px;font-weight:bold">Total</td>' +
            '<td align="right" style="padding:7px 8px;font-family:monospace;font-weight:bold">' +
            fmt_(owed) + '</td></tr></table>';
  }

  /* weekly reports past their deadline and not in: not charged yet — they
     count, as late, until the week closes on Sunday at 9 PM */
  var waiting = d.ledger.filter(function (l) { return l.status === 'NOT IN YET'; })
    .map(function (l) { return { person: l.person, report: l.report, due: l.due }; })
    .concat(d.weekWaiting || []);
  if (waiting.length) {
    html += '<h3 style="font-size:13.5px;margin:22px 0 6px;color:#8a6d1f">Weekly reports not in yet</h3>' +
            '<p style="font-size:12px;color:#66716d;margin:0 0 6px">Not charged yet. Each still counts for ' +
            'this week, as late, until its week closes — Sunday 9 PM (Selam’s Monday summary: the end of ' +
            'Saturday); after that it is missing.</p>' +
            '<table width="100%" cellpadding="0" cellspacing="0" style="font-size:12.5px">';
    waiting.forEach(function (l) {
      html += '<tr><td style="padding:5px 8px;border-bottom:1px solid #e4e7e3">' + esc_(l.person) +
              '</td><td style="padding:5px 8px;border-bottom:1px solid #e4e7e3;color:#66716d">' +
              esc_(l.report) + '</td><td style="padding:5px 8px;border-bottom:1px solid #e4e7e3;' +
              'color:#66716d;white-space:nowrap">due ' + esc_(l.due) + '</td></tr>';
    });
    html += '</table>';
  }

  /* the rest of the rulebook, in two places: fines (with the warnings and
     suspensions that go with them), then bonuses */
  var shown = (d.ruleLines || []).filter(function (l) {
    return l.amount > 0 || l.wouldBe > 0 || l.kind === 'consequence';
  });
  [['Fines under the letters', function (l) { return l.kind !== 'bonus'; }],
   ['Bonuses under the letters', function (l) { return l.kind === 'bonus'; }]].forEach(function (part) {
    var rl = shown.filter(part[1]);
    if (!rl.length) return;
    html += '<h3 style="font-size:13.5px;margin:26px 0 6px;color:#0f5c54">' + part[0] + '</h3>' +
            '<table width="100%" cellpadding="0" cellspacing="0" style="font-size:12.5px">';
    rl.forEach(function (l) {
      var colour = l.kind === 'bonus' ? '#4a6b1f' : l.kind === 'penalty' ? '#8f3020' : '#8a6d1f';
      var fig = l.kind === 'consequence' ? '' :
                l.amount ? (l.kind === 'bonus' ? '+' : '−') + fmt_(l.amount) :
                '(' + (l.kind === 'bonus' ? '+' : '−') + fmt_(l.wouldBe) + ')';
      html += '<tr><td style="padding:5px 8px;border-bottom:1px solid #e4e7e3;vertical-align:top">' + esc_(l.name) +
              '</td><td style="padding:5px 8px;border-bottom:1px solid #e4e7e3;color:#3a4442">' + esc_(l.reportName) +
              '<div style="color:#66716d;font-size:11.5px">' + esc_(l.why) + '</div></td>' +
              '<td align="right" style="padding:5px 8px;border-bottom:1px solid #e4e7e3;font-family:monospace;' +
              'white-space:nowrap;vertical-align:top;color:' + colour + '">' + fig + '</td></tr>';
    });
    html += '</table>';
  });
  if (shown.some(function (l) { return !l.amount && l.wouldBe > 0; })) {
    html += '<p style="font-size:11.5px;color:#66716d;margin:6px 0 0">A figure in brackets is ' +
            'tracked but not counted: held for your decision, or under paper not yet signed.</p>';
  }
  if (d.ruleErrors && d.ruleErrors.length) {
    html += '<p style="font-size:12px;color:#8f3020;margin:10px 0 0">Rules that could not be judged: ' +
            esc_(d.ruleErrors.join('; ')) + '</p>';
  }

  html += '<p style="color:#66716d;font-size:11.5px;margin-top:28px;line-height:1.6">' +
          'Every figure these agents were given was calculated in code from the reports ' +
          'as filed, not by the model. What the model wrote is the reading, not the ' +
          'arithmetic. Penalty amounts come from each person’s signed letter, and a charge ' +
          'can be cancelled from your page with a reason. ' + esc_(brainLine_()) +
          (d.provisional ? ' This was a mid-day run: the day closes at midnight and the ' +
                           'charges are settled in the morning.' : '') +
          '</p></div>';

  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    subject: 'Klever — ' + Utilities.formatDate(d.when, tz_(), 'EEE d MMM') +
             (d.provisional ? ' so far' : '') +
             (missing ? ' — ' + missing + ' not ' + (d.provisional ? 'in yet' : 'filed')
                      : ' — all filed') +
             (ins.overdue.length ? ' — ' + ins.overdue.length + ' instruction' +
                                   (ins.overdue.length > 1 ? 's' : '') + ' overdue' : ''),
    htmlBody: html
  });
}

/* a table cell, because mail clients drop flexbox */
function tile_(label, value) {
  return '<td width="33%" style="background:#f3f4f1;border:1px solid #e4e7e3;padding:10px 12px">' +
         '<div style="font-size:10px;letter-spacing:.12em;color:#66716d">' + label + '</div>' +
         '<div style="font-size:17px;margin-top:3px">' + esc_(value) + '</div></td>';
}

/* ------------------------------------------------------------------ *
 *  One-time setup                                                     *
 * ------------------------------------------------------------------ */

/* Sets the three Script Properties the ledger and the agents need.

   The values are passed in as arguments and are not written anywhere in this
   file, because this file lives in a public repository. The Gemini key spends
   money; it belongs in Script Properties and in Klever-Access-Codes.txt, and
   nowhere else.

   Run it once — from the editor, or remotely with:
     clasp run setKeys --params '["<gemini>","<firebase-web>","<ledger-pw>"]'

   Then setKeys can be forgotten about. Running it again just overwrites. */
function setKeys(geminiKey, firebaseWebKey, ledgerPassword) {
  var props = PropertiesService.getScriptProperties();
  if (geminiKey) props.setProperty('GEMINI_KEY', String(geminiKey));
  if (firebaseWebKey) props.setProperty('FIREBASE_WEB_KEY', String(firebaseWebKey));
  if (ledgerPassword) props.setProperty('LEDGER_PASSWORD', String(ledgerPassword));

  /* report what is set without ever printing a secret back */
  var have = props.getProperties();
  return ['GEMINI_KEY', 'FIREBASE_WEB_KEY', 'LEDGER_PASSWORD', 'GEMINI_MODEL', 'FIREBASE_PROJECT']
    .map(function (k) {
      var v = have[k];
      return k + ': ' + (v ? 'set (' + String(v).length + ' chars)' : 'NOT SET');
    }).join(String.fromCharCode(10));
}

/* What is configured, printing nothing secret. Safe to run any time. */
function checkKeys() {
  return setKeys(null, null, null);
}

/* ------------------------------------------------------------------ *
 *  Publishing the result, and the button                              *
 * ------------------------------------------------------------------ */

/* The email is a good place to read this once. It is a bad place to find it
   again three days later, and it is not on the phone of a man standing in the
   factory. So a run also writes its findings to Firestore, where the
   Chairman's own page reads them — and only his: the rules let nobody else
   near this collection, because it names people and what they owe. */
function publishAnalysis_(results, d) {
  try {
    fsPut_('analysis/' + d.day, {
      day: d.day,
      dayLabel: d.dayLabel,
      provisional: !!d.provisional,
      ranAt: new Date(),
      filed: d.filed.length,
      due: d.ledger.length,
      owed: d.ledger.reduce(function (a, l) { return a + l.amount; }, 0),
      overdueInstructions: (d.instructions && d.instructions.overdue || []).length,
      model: brain_().label,
      modelNote: brain_().note,
      findings: results.map(function (r) {
        return { id: r.id, en: r.en, am: r.am, text: String(r.text || ''),
                 kind: r.id === 'brief' ? 'brief' : (r.decision ? 'decision' : 'finding') };
      })
    });
  } catch (e) {
    /* the email still goes; a failed publish must not lose it */
    Logger.log('Could not publish to Firestore: %s', e.message);
  }
}

/* The Chairman presses "Analyse now" on his page, which writes one document.
   This runs every ten minutes, sees it, deletes it and does the run. It is
   deleted first and on purpose: if the run then fails, it fails once rather
   than retrying every ten minutes for the rest of the day with a model that
   charges for each attempt. */
function watchForRunRequest() { watch_(1000); }

/* Moves of the day counting starts (LEDGER_START), each done once by the
   watch, each only ever later — a flag says it was done, so a later choice
   of his is never overridden, and a start already later is never moved back.
   - 3 Oct 2026: the Chairman restarted reporting; the fines of 1–2 October
     were cancelled and everything counts from Monday 5 October.
   - 5 Oct 2026, evening: the sign-in cards had not been handed out and
     nobody had filed, so the close at 06:44 would have charged all nineteen
     for Monday. Counting starts Tuesday 6 October; he names the day the cards
     go out, and it moves again to that.
   - 6 Oct 2026, evening: nobody had filed on Tuesday either (0 of 19 at
     17:40), and he said "so everyone will start tomorrow". Counting starts
     Wednesday 7 October — the day Ermiyas starts too. */
var STARTS_ = [
  { day: '2026-10-05', flag: 'RESTART_APPLIED', why: 'the restart of 3 Oct' },
  { day: '2026-10-06', flag: 'START_MOVED_2026_10_06', why: 'cards not handed out on Mon 5 Oct' },
  { day: '2026-10-07', flag: 'START_MOVED_2026_10_07', why: 'nobody filed on Tue 6 Oct; everyone starts Wed 7 Oct' }
];
var RESTART_START_ = STARTS_[0].day;
function startFromRestart_() {
  try {
    var props = PropertiesService.getScriptProperties();
    STARTS_.forEach(function (s) {
      if (props.getProperty(s.flag)) return;
      var now = prop_('LEDGER_START', '');
      if (!now || now < s.day) props.setProperty('LEDGER_START', s.day);
      props.setProperty(s.flag, new Date().toISOString());
      Logger.log('LEDGER_START %s -> %s (%s)', now || 'nothing', prop_('LEDGER_START', ''), s.why);
    });
  } catch (e) { Logger.log('restart start: %s', e.message); }
}

/* The Sheet, once, at the reset of 5 Oct 2026 evening — "reset everything,
   reporting starts tomorrow". Every row dated before the start comes off the
   report tabs and the ledger's own tabs (Penalty Ledger, Penalties, Daily
   Analysis), and the "ZZ TEST" tabs of 15 Sep go. A copy of the whole Sheet
   was saved to Drive first ("Klever Reports — copy before the reset of
   5 Oct 2026"). Firestore was reset the same evening, from a backup. */
var SHEET_RESETS_ = [{ before: '2026-10-06', flag: 'SHEET_RESET_2026_10_05' }];
function sheetReset_() {
  try {
    var props = PropertiesService.getScriptProperties();
    SHEET_RESETS_.forEach(function (z) {
      if (props.getProperty(z.flag)) return;
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var tabs = {};
      (loadSchedule_().reports || []).forEach(function (r) { tabs[String(r.en).substring(0, 90)] = true; });
      ['Penalty Ledger', 'Penalties', ANALYSIS_TAB_].forEach(function (t) { tabs[t] = true; });
      var rows = 0, gone = [];
      ss.getSheets().forEach(function (sh) {
        var name = sh.getName();
        if (/^ZZ TEST/.test(name)) { ss.deleteSheet(sh); gone.push(name); return; }
        if (tabs[name]) rows += dropRowsBefore_(sh, z.before);
      });
      props.setProperty(z.flag, new Date().toISOString() + ' — ' + rows + ' rows, ' + gone.length + ' tabs');
      Logger.log('Sheet reset: %s rows before %s, tabs %s', rows, z.before, gone.join(', '));
    });
  } catch (e) { Logger.log('sheet reset: %s', e.message); }
}
/* Rows 2.. whose first column is a day before `before`, removed in runs from
   the bottom up so the row numbers above do not move. A tab left with only
   its header keeps one empty row: Sheets will not delete every row under a
   frozen header, and the next row filed lands in it. */
function dropRowsBefore_(sh, before) {
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var vals = sh.getRange(2, 1, last - 1, 1).getValues();
  var drop = vals.map(function (v) { var d = dayOfCell_(v[0]); return !!d && d < before; });
  var n = drop.filter(Boolean).length;
  if (!n) return 0;
  if (n === vals.length) {
    sh.getRange(2, 1, last - 1, Math.max(1, sh.getLastColumn())).clearContent();
    if (last > 2) sh.deleteRows(3, last - 2);
    return n;
  }
  for (var i = drop.length - 1; i >= 0; i--) {
    if (!drop[i]) continue;
    var j = i;
    while (j > 0 && drop[j - 1]) j--;
    sh.deleteRows(j + 2, i - j + 1);
    i = j;
  }
  return n;
}
/* the day of a Sheet cell: a date the Sheet made of "Sent at", or a
   yyyy-mm-dd at the start of the text ("2026-10-05 (so far)") */
function dayOfCell_(v) {
  if (v && typeof v.getTime === 'function') return Utilities.formatDate(v, tz_(), 'yyyy-MM-dd');
  var m = /^(\d{4}-\d{2}-\d{2})/.exec(String(v == null ? '' : v));
  return m ? m[1] : '';
}

/* A report has just arrived (Code.js doPost, the moment Send is pressed):
   have the agents read the day about a minute from now, instead of at the
   next ten-minute look. The reading cannot run inside doPost — the phone is
   waiting for its answer, and sixteen readings take half a minute — so a
   one-off trigger runs it straight after. One is ever pending: reports that
   arrive together are read together, and the ten-minute watch still catches
   anything this misses. Nothing here may cost the report its row, so every
   failure is swallowed. */
function readSoon_() {
  try {
    /* its own lock, not the reading's: a report that lands while a reading
       is running must still be able to book the next one */
    var lock = LockService.getUserLock();
    if (!lock.tryLock(3000)) return;
    try {
      var pending = ScriptApp.getProjectTriggers().some(function (t) {
        return t.getHandlerFunction() === 'readNow';
      });
      if (!pending) ScriptApp.newTrigger('readNow').timeBased().after(5 * 1000).create();
    } finally {
      lock.releaseLock();
    }
  } catch (e) {
    Logger.log('readSoon: %s', e.message);
  }
}
/* the one-off trigger: take itself off the list, then read what is new. It
   waits up to two minutes for a reading already running to finish, so a
   report that arrived during that reading is not left to the ten-minute watch. */
function readNow() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'readNow') ScriptApp.deleteTrigger(t);
  });
  watch_(120000);
}

function watch_(waitMs) {
  /* one at a time: a reading that outlasts ten minutes must not have a
     second one started on top of it */
  var lock = null;
  if (typeof LockService !== 'undefined') {
    lock = LockService.getScriptLock();
    if (!lock.tryLock(waitMs)) return;
  }
  try {
    /* the restart of 3 Oct 2026: reporting counts from Monday 5 October */
    startFromRestart_();
    /* and the Sheet, once (the reset of 5 Oct 2026) */
    sheetReset_();
    /* and the leads and jobs, once, from every report since counting began */
    try { registerBackfill_(); } catch (e) { Logger.log('register backfill: %s', e.message); }
    /* a question of his still waiting — the post from his page never came */
    answerWaiting_();
    /* and an order of his, for the AI to find who does it (Orders.js) */
    planWaiting_();
    /* a working morning: the AI's list of what each person should do
       today, drafted for him to check and send (Team.js) */
    try { teamPlanIfDue_(); } catch (e) { Logger.log('team plan: %s', e.message); }
    /* and an instruction of his that has not reached its person's phone (Push.js) */
    notifyWaiting_();
    /* Sunday after 9 PM: the week is over — settle it, send its summary */
    weekEndFromWatch_();
    var token = fsToken_();
    var res = UrlFetchApp.fetch(fsBase_() + '/documents/control/run', {
      headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true
    });
    if (res.getResponseCode() === 200) {
      UrlFetchApp.fetch(fsBase_() + '/documents/control/run', {
        method: 'delete', headers: { Authorization: 'Bearer ' + token },
        muteHttpExceptions: true
      });
      Logger.log('Run requested from the Chairman’s page — running now.');
      /* this reading covers everything filed so far; the new-report check
         need not run the same day again straight after it */
      markSeen_(new Date());
      ran_('reading', function () { runAgents(); return { note: 'asked for from his page' }; });
      return;
    }
    if (res.getResponseCode() !== 404) {            /* 404: nobody asked */
      Logger.log('control/run unreadable: HTTP %s', res.getResponseCode());
    }
    runIfNew_();
  } finally {
    if (lock) lock.releaseLock();
  }
}

/* Every time something new is filed, the agents read the day again.

   The morning run reads yesterday, closed. This one reads today so far, and
   it runs whenever a report has arrived since the last reading — checked in
   the same ten-minute look as the Chairman's button, so a report is read
   within ten minutes of arriving, and ten reports that land in the same ten
   minutes are read once, together. Nothing is charged (the day is not
   closed) and nothing is emailed: each report already emails him as it
   arrives (Code.js), and the reading goes to his page, marked "today so
   far". A quiet day costs one Firestore query every ten minutes and no
   model call at all.

   The newest filing already read is kept in Script Property AUTO_SEEN, and
   moved on before the run starts — so a reading that fails is not retried
   every ten minutes on the same report, paying the model each time. */
function markSeen_(when) {
  PropertiesService.getScriptProperties().setProperty('AUTO_SEEN', when.toISOString());
}
function runIfNew_() {
  var today = todayAddis_();
  var from = dayStart_(today);
  var seen = prop_('AUTO_SEEN', '');
  if (seen && new Date(seen).getTime() > from.getTime()) from = new Date(seen);
  var fresh;
  try { fresh = fsQuery_('reports', [['at', 'GREATER_THAN', from]], 'at'); }
  catch (e) { Logger.log('new-report check failed: %s', e.message); return; }
  if (!fresh.length) return;
  markSeen_(fresh[fresh.length - 1].at);
  /* Getachew's report in: a supplier credit it says is paid has its
     reminders closed now, not tomorrow morning (Credit.js) */
  if (fresh.some(function (f) { return f.report === 'getachew-daily'; })) {
    try { creditSettle_(today); } catch (e) { Logger.log('credit settle: %s', e.message); }
  }
  /* every lead and job they name, into his tables (Register.js) */
  try { registerUpdate_(fresh); } catch (e) { Logger.log('register: %s', e.message); }
  Logger.log('%s new report(s) since %s — reading today again.', fresh.length, from.toISOString());
  ran_('reading', function () {
    runAgents({ quiet: true });
    return { note: fresh.length + ' new report' + (fresh.length === 1 ? '' : 's') };
  });
}
