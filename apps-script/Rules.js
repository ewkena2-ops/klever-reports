/* Klever — the rulebook, applied.

   Agent.js charges the one rule every letter shares: a report late, or not
   sent. Everything else the letters set is here — the bonuses, the
   commissions, the fine for each incident, the third penalty that brings a
   suspension — so that nothing a signed letter promises or threatens is left
   to memory.

   WHERE THE RULES LIVE
   js/rules.js, on the site, is the catalogue: who each rule applies to, what
   it pays or costs, and the sentence of the letter it comes from. The
   Chairman's page reads it to offer the rules he can record; this file
   fetches the same copy at run time, the way Agent.js fetches the schedule,
   so an amount has one home. What is here is only the test of whether a rule
   applied — the part that reads the reports — in EVAL_, keyed by the rule's
   id. A catalogue rule with no test here is one a person has to record.

   THREE WAYS A LINE IS MADE
     day    decided each morning, from yesterday's reports     (EVAL_[id].day)
     week   decided when the week closes, Sunday 9 PM, on the weekly
            reports as they finally stand — kept on their due day
                                                                (EVAL_[id].week)
     month  decided on the 2nd, from the whole month            (EVAL_[id].month)
     event  recorded by the Chairman on his page, in /events    (no test here)
   Every line carries the amount from the catalogue — never from a model, and
   never typed by a person — the rule's id, and the letter's own words.

   WHAT A LINE IS WORTH BEFORE IT COUNTS
   Nothing is charged or paid before LEDGER_START, the day the team was told.
   A rule whose document is not signed (the assembler terms, while the pay
   rate is undecided) is tracked at 0 with the amount it would carry, so the
   Chairman sees what happened without anyone being charged under paper they
   never signed. Set ASSEMBLER_TERMS_SIGNED (yyyy-mm-dd) in Script Properties
   the day they are, and from then on those lines carry their amounts.

   The same rule as the rest of the project: arithmetic here, in code. The
   agents are shown the finished lines and asked what they mean.            */

/* ------------------------------------------------------------------ *
 *  The catalogue, read from the live site                             *
 * ------------------------------------------------------------------ */

var RULES_ = null;
function loadRules_() {
  if (RULES_) return RULES_;
  var site = prop_('SITE', AGENT_DEFAULT_SITE);
  var src = UrlFetchApp.fetch(site + 'js/rules.js', { muteHttpExceptions: true });
  if (src.getResponseCode() !== 200) {
    throw new Error('Could not read the rulebook from ' + site + ' (HTTP ' +
                    src.getResponseCode() + ')');
  }
  /* rules.js declares RULES and RULE_GROUPS at the top level and nothing else */
  var read = new Function(src.getContentText() + '; return { rules: RULES, groups: RULE_GROUPS };');
  var got = read();
  if (!got.rules || !got.rules.length) throw new Error('The rulebook came back empty');
  var byId = {};
  got.rules.forEach(function (r) { byId[r.id] = r; });
  RULES_ = { list: got.rules, byId: byId, groups: got.groups || {} };
  return RULES_;
}

/* Who a rule is for. `who` holds person ids and group keys; a group is
   everyone whose role on the site is that group's role — so a new production
   worker added to forms.js is covered by the production worker letter the
   day they are added. Assemblers and the cleaner have no accounts: their
   groups resolve to nobody, and their lines come from the reports that name
   them. */
function membersOf_(who, schedule) {
  var R = loadRules_(), out = [];
  (who || []).forEach(function (w) {
    var g = R.groups[w];
    if (g && g.role) {
      (schedule.people || []).forEach(function (p) {
        if (p.roleEn === g.role && out.indexOf(p.id) === -1) out.push(p.id);
      });
    } else if (!g && out.indexOf(w) === -1) {
      out.push(w);
    }
  });
  return out;
}

/* ------------------------------------------------------------------ *
 *  Reading the reports                                                *
 * ------------------------------------------------------------------ */

/* The last filing of each report on each day — a second filing the same day
   is a correction, and its figures are the ones to believe. */
function byReportDay_(filings) {
  var out = {};
  filings.forEach(function (f) {
    (out[f.report] || (out[f.report] = {}))[f.day] = f;
  });
  return out;
}

/* A figure typed into a report — "1,250", "98%", "12 m²" — or null. Text
   with no digits in it is not a figure: "no" is not 0. */
function fig_(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return v;
  if (!/[0-9]/.test(String(v))) return null;
  var x = Number(String(v).replace(/[^0-9.\-]/g, ''));
  return isNaN(x) ? null : x;
}

/* A name typed into a report, matched to a person on the site.

   Supervisors name people in free text — "Bisrat", "bisrat g.", "ብስራት". A
   line charged to the wrong person is worse than one charged to nobody, so a
   name matches only when exactly one person in the pool fits it: the full
   name, the first name, or the first name plus the start of the second. A
   name that fits nobody, or more than one, is kept as typed and marked for
   the Chairman to check. */
function matchPerson_(text, pool, schedule) {
  var raw = String(text == null ? '' : text).trim();
  if (!raw) return null;
  var norm = function (s) {
    return String(s || '').toLowerCase().replace(/[.,;:()'"’]/g, ' ').replace(/\s+/g, ' ').trim();
  };
  var t = norm(raw), words = t.split(' ');
  var people = (schedule.people || []).filter(function (p) { return !pool || pool.indexOf(p.id) !== -1; });
  var fits = people.filter(function (p) {
    var names = [norm(p.en), norm(p.am)];
    return names.some(function (n) {
      if (!n) return false;
      if (n === t) return true;
      var nw = n.split(' ');
      if (nw[0] !== words[0]) return false;
      if (words.length === 1) return true;
      return nw[1] && nw[1].indexOf(words[1]) === 0;
    });
  });
  if (fits.length === 1) return { person: fits[0].id, name: fits[0].en, matched: true };
  return { person: 'name:' + t, name: raw, matched: false,
           note: fits.length ? 'fits more than one person — check' : 'not matched to anyone on the site — check' };
}

/* What a day's tests are handed. */
function dayCtx_(day, filings, schedule) {
  var by = byReportDay_(filings);
  var ctx = {
    day: day,
    dow: dow_(day),
    schedule: schedule,
    /* the answers of one report on this day, or null if it was not filed */
    v: function (reportId) {
      var f = by[reportId] && by[reportId][day];
      return f ? (f.fields || {}) : null;
    },
    vOn: function (reportId, d) {
      var f = by[reportId] && by[reportId][d];
      return f ? (f.fields || {}) : null;
    },
    n: function (reportId, field) {
      var v = ctx.v(reportId);
      return v ? fig_(v[field]) : null;
    },
    yes: function (reportId, field) {
      var v = ctx.v(reportId);
      return v ? String(v[field] || '').toLowerCase() === 'yes' : null;
    },
    rows: function (reportId, field) {
      var v = ctx.v(reportId);
      var t = v && v[field];
      return Object.prototype.toString.call(t) === '[object Array]' ? t : [];
    },
    match: function (text, group) {
      var pool = group ? membersOf_([group], schedule) : null;
      return matchPerson_(text, pool, schedule);
    },
    reportsOf: function (person) {
      return (schedule.reports || []).filter(function (r) { return r.person === person; });
    },
    /* the filings of the last `days` days, read only when a test asks —
       the streak rules on a Friday, not every rule every day */
    history: function (days) {
      if (!ctx._hist || ctx._histDays < days) {
        ctx._hist = byReportDay_(filedBetween_(addDays_(day, -days), addDays_(day, 1)));
        ctx._histDays = days;
      }
      return ctx._hist;
    }
  };
  return ctx;
}

/* What a week's tests are handed: the due day's context, plus each weekly
   report as its week finally stood — the last filing between the close of
   the week before and Sunday 9 PM — and, for the rules that run across weeks,
   the filings as they arrived (`filings`). */
function weekCtx_(day, filings, schedule) {
  var ctx = dayCtx_(day, filings, schedule);
  var sun = sundayOf_(day);
  ctx.week = function (reportId) {
    var f = filingOfWeek_(filings, reportId, sun);
    return f ? (f.fields || {}) : null;
  };
  ctx.filings = function (days) {
    if (!ctx._raw || ctx._rawDays < days) {
      ctx._raw = filedBetween_(addDays_(day, -days), addDays_(sun, 1));
      ctx._rawDays = days;
    }
    return ctx._raw;
  };
  return ctx;
}

/* What a month's tests are handed: every working day of it, each report's
   answers day by day, and the daily lines already charged — for the rules
   that count ("three penalties in a month"). */
function monthCtx_(month, filings, ledgers, schedule) {
  var start = month + '-01';
  var next = addDays_(start, 32).slice(0, 8) + '01';
  var end = addDays_(next, -1);
  var by = byReportDay_(filings);
  var days = [];
  for (var d = start; d <= end; d = addDays_(d, 1)) days.push(d);
  var ctx = {
    month: month, start: start, end: end, days: days,
    schedule: schedule,
    ledgers: ledgers,
    workingDays: days.filter(function (x) { return dow_(x) !== 0; }),
    /* [{day, v}] for every day this report was filed in the month */
    series: function (reportId) {
      /* a weekly report: once a week — the last sent in its week — in the
         month its week ends in, where its lines are. By the day sent, a
         report corrected the next day was counted twice. */
      var rep = reportOf_(schedule, reportId);
      if (rep && rep.cadence === 'weekly') return weekSeries_(filings, rep, start, end);
      var m = by[reportId] || {};
      return Object.keys(m).filter(function (x) { return x >= start && x <= end; }).sort()
        .map(function (x) { return { day: x, v: m[x].fields || {} }; });
    },
    nums: function (reportId, field) {
      return ctx.series(reportId).map(function (s) { return fig_(s.v[field]); })
                                 .filter(function (x) { return x != null; });
    },
    sum: function (reportId, field) {
      return ctx.nums(reportId, field).reduce(function (a, x) { return a + x; }, 0);
    },
    avg: function (reportId, field) {
      var xs = ctx.nums(reportId, field);
      return xs.length ? xs.reduce(function (a, x) { return a + x; }, 0) / xs.length : null;
    },
    /* the report of the month itself — due on the 1st of the next one */
    monthly: function (reportId) {
      var m = by[reportId] || {};
      var ks = Object.keys(m).filter(function (x) { return x >= addDays_(end, -6) && x <= addDays_(next, 2); }).sort();
      return ks.length ? (m[ks[ks.length - 1]].fields || {}) : null;
    },
    /* every line already charged this month (report lines and rule lines) */
    /* `day` is the day it happened (a recorded line keeps its own); `closed`
       is the close that charged it — the day a cancellation names. Reading
       the cancellation by `day` missed every recorded line cancelled on his
       page, so a cancelled fine still cost a bonus or counted toward a
       warning. */
    lines: function (person) {
      var out = [];
      ledgers.forEach(function (doc) {
        (doc.lines || []).concat(doc.ruleLines || []).forEach(function (l) {
          if (!person || l.person === person) out.push(Object.assign({ day: doc.day }, l, { closed: doc.day }));
        });
      });
      return out;
    },
    match: function (text, group) {
      var pool = group ? membersOf_([group], schedule) : null;
      return matchPerson_(text, pool, schedule);
    },
    /* the month before, read only when a test asks ("two months running") */
    previousSeries: function (reportId) {
      var prevStart = addDays_(start, -1).slice(0, 8) + '01';
      var rep = reportOf_(schedule, reportId);
      if (rep && rep.cadence === 'weekly') {
        if (!ctx._prevRaw) ctx._prevRaw = filedBetween_(addDays_(prevStart, -7), start);
        return weekSeries_(ctx._prevRaw, rep, prevStart, addDays_(start, -1));
      }
      if (!ctx._prev) ctx._prev = byReportDay_(filedBetween_(prevStart, start));
      var m = ctx._prev[reportId] || {};
      return Object.keys(m).sort().map(function (x) { return { day: x, v: m[x].fields || {} }; });
    }
  };
  return ctx;
}

/* One weekly report's weeks that end between `from` and `to` (Sundays,
   inclusive), oldest first: [{day, week, v}] — `day` its due day in the
   week, `v` the last filing sent in the week (THE WEEK, Agent.js). */
function weekSeries_(filings, rep, from, to) {
  var byWeek = {};
  (filings || []).forEach(function (f) {
    if (f.report === rep.id && f.at) byWeek[weekOf_(f.at, rep.id)] = f;
  });
  return Object.keys(byWeek).filter(function (w) { return w >= from && w <= to; }).sort()
    .map(function (w) { return { day: dueInWeek_(rep, w), week: w, v: byWeek[w].fields || {} }; });
}

/* ------------------------------------------------------------------ *
 *  Making the lines                                                   *
 * ------------------------------------------------------------------ */

var STATUS_OF_ = { penalty: 'CHARGED', bonus: 'EARNED', consequence: 'NOTED' };

/* One line. `hit` is what a test found: {person, name?, count?, amount?,
   why}. The amount is the catalogue's, times the count — a test gives its
   own amount only for a rule whose letter sets a formula (a commission, a
   per-day figure) and must say how it got there in `why`. */
function ruleLine_(rule, hit, day, schedule) {
  var names = {};
  (schedule.people || []).forEach(function (p) { names[p.id] = p.en; });
  var count = hit.count || 1;
  var amount = hit.amount != null ? Math.round(hit.amount) : (rule.birr || 0) * count;
  if (rule.kind === 'consequence') amount = 0;
  return {
    key: rule.id + '|' + hit.person + (hit.seq ? '|' + hit.seq : ''),
    rule: rule.id,
    kind: rule.kind,
    person: hit.person,
    name: hit.name || names[hit.person] || hit.person,
    report: rule.id + '|' + hit.person + (hit.seq ? '|' + hit.seq : ''),   /* the key a cancellation names */
    reportName: rule.en,
    status: STATUS_OF_[rule.kind] || 'NOTED',
    count: count,
    amount: amount,
    why: (hit.why || '') + (hit.note ? ' (' + hit.note + ')' : ''),
    src: rule.src,
    source: hit.source || 'report',
    day: day
  };
}

/* Nothing counts before LEDGER_START, and nothing under a document that is
   not signed. The line stays, with the amount it would carry, so the
   Chairman sees it happened. */
function gate_(line, rule, day) {
  var start = prop_('LEDGER_START', '');
  var signedOn = rule.signed === false ? prop_('ASSEMBLER_TERMS_SIGNED', '') : '';
  var why = null;
  if (start && day < start) why = 'Not counted — before LEDGER_START (' + start + ').';
  else if (rule.hold) why = 'Held for your decision — ' + rule.hold;
  else if (rule.signed === false && (!signedOn || day < signedOn)) {
    why = 'Not counted — ' + (rule.unsignedWhy || 'the document this rule comes from is not signed yet') + '.';
  }
  if (why && line.amount) {
    line.wouldBe = line.amount;
    line.amount = 0;
    line.why = why + ' ' + line.why;
  } else if (why && line.kind === 'consequence') {
    /* a warning or suspension under a held rule or unsigned paper is noted,
       and says it is not to be acted on */
    line.pending = true;
    line.why = why + ' ' + line.why;
  }
  return line;
}

/* A rule a test got wrong must not take the day down with it: the rest of
   the lines are still made, and the failure is written beside them. */
function runTests_(which, ctx, day, schedule, only) {
  var R = loadRules_(), lines = [], errors = [], unjudged = [], missed = [];
  R.list.forEach(function (rule) {
    var t = EVAL_[rule.id];
    var spec = rule.test && rule.test.at === which;
    if (!(t && t[which]) && !spec) return;
    if (only && only.indexOf(rule.id) === -1) return;
    var hits;
    try {
      hits = (t && t[which]) ? (t[which](ctx, rule) || [])
                             : judge_(rule, which, ctx, schedule, unjudged, missed);
    }
    catch (e) { errors.push(rule.id + ': ' + e.message); return; }
    var members = membersOf_(rule.who, schedule);
    hits.forEach(function (h) {
      /* a test may only charge the people its rule is for — or a name it
         could not match, which is kept for the Chairman to check */
      if (members.indexOf(h.person) === -1 && String(h.person).indexOf('name:') !== 0 &&
          !(rule.who || []).some(function (w) { return R.groups[w] && !R.groups[w].role; })) {
        errors.push(rule.id + ': charged ' + h.person + ', who the rule is not for');
        return;
      }
      lines.push(gate_(ruleLine_(rule, h, day, schedule), rule, day));
    });
  });
  return { lines: lines, errors: errors, unjudged: unjudged, missed: missed };
}

/* One day's rule lines: the tests on that day's reports, and what the
   Chairman recorded for it. */
function ruleLinesForDay_(day, filings, schedule) {
  var R = loadRules_();
  var got = runTests_('day', dayCtx_(day, filings, schedule), day, schedule);
  unjudgedSaid_(got, schedule);

  /* What the Chairman recorded goes into the close of the day he recorded
     it, whatever day it happened: something from Tuesday written down on
     Thursday would otherwise wait for Tuesday's close, which ran on
     Wednesday morning, and never be counted. The line keeps the day it
     happened, and that day decides whether it counts at all. */
  var events = [];
  try {
    events = fsQuery_('events', [['at', 'GREATER_THAN_OR_EQUAL', dayStart_(day)],
                                 ['at', 'LESS_THAN', dayStart_(addDays_(day, 1))]], 'at');
  } catch (e) { got.errors.push('events: ' + e.message); }
  /* A rule counted once per day, recorded for a day whose own close already
     charged it from the report, is the same occurrence: it is not charged a
     second time, and the email says so. */
  var earlier = {};
  events.forEach(function (ev) {
    var rule = R.byId[ev.rule];
    if (!rule || rule.per !== 'day' || !ev.day || ev.day >= day || earlier[ev.day]) return;
    earlier[ev.day] = {};
    try {
      ledgersBetween_(ev.day, addDays_(ev.day, 1)).forEach(function (doc) {
        (doc.ruleLines || []).forEach(function (l) {
          if ((l.day || doc.day) === ev.day) earlier[ev.day][l.rule + '|' + l.person] = true;
        });
      });
    } catch (e) { got.errors.push('ledger ' + ev.day + ': ' + e.message); }
  });
  var seq = {};
  events.forEach(function (ev) {
    var rule = R.byId[ev.rule];
    if (!rule) { got.errors.push('recorded event ' + ev._id + ' names an unknown rule ' + ev.rule); return; }
    if (rule.per === 'day' && ev.day && earlier[ev.day] && earlier[ev.day][ev.rule + '|' + ev.person]) {
      got.errors.push('Not charged twice — ' + rule.en + ' (' + (ev.name || ev.person) + ') was recorded for ' +
                      ev.day + ', and that day’s close had already charged it from the report.');
      return;
    }
    var k = ev.rule + '|' + ev.person;
    seq[k] = (seq[k] || 0) + 1;
    var line = ruleLine_(rule, {
      person: ev.person, name: ev.name, count: ev.count || 1, seq: 'e' + seq[k],
      source: 'recorded',
      why: 'Recorded by the Chairman for ' + ev.day + (ev.note ? ': ' + ev.note : '.')
    }, ev.day || day, schedule);
    got.lines.push(gate_(line, rule, ev.day || day));
  });

  /* the same rule, person and day found twice (a report and a recording,
     or two tables) is one occurrence for a rule counted per day */
  var seen = {};
  got.lines = got.lines.filter(function (l) {
    var rule = R.byId[l.rule];
    if (!rule || rule.per !== 'day') return true;
    var k = l.rule + '|' + l.person + '|' + l.day;
    if (seen[k]) return false;
    seen[k] = true;
    return true;
  });
  sortRuleLines_(got.lines);
  return got;
}

/* What a test could not judge, said beside the lines rather than dropped. */
function unjudgedSaid_(got, schedule) {
  var R = loadRules_();
  var named = {};
  (schedule.people || []).forEach(function (p) { named[p.id] = p.en; });
  (got.unjudged || []).forEach(function (u) {
    var rule = R.byId[u.rule];
    /* A fine whose question was left blank in a report that WAS sent is not
       judged — a blank is not a "no" — but it is not dropped in silence
       either: a person could otherwise leave the one question that fines
       them empty, every day. */
    /* a follow-up question (it has `show`) is only on screen when the answer
       above it opens it; empty, it was most likely never shown — Mahelet
       issuing nothing from the store is not a blank about approvals */
    var def = u.ref && fieldDef_(schedule, u.ref.report, u.ref.field);
    var blank = rule && rule.kind === 'penalty' && / — not answered$/.test(u.why || '') && !(def && def.show);
    if (!u.bad && !blank) return;
    got.errors.push((u.bad ? 'Not judged — ' : 'Left blank, so not judged — ') + (rule ? rule.en : u.rule) +
                    ' (' + (named[u.person] || u.person || 'team') + '): ' + (u.bad || u.why));
  });
}

/* fines first, then bonuses, then notes; heaviest first within each */
function sortRuleLines_(lines) {
  return lines.sort(function (a, b) {
    var ka = a.kind === 'penalty' ? 0 : a.kind === 'bonus' ? 1 : 2;
    var kb = b.kind === 'penalty' ? 0 : b.kind === 'bonus' ? 1 : 2;
    return ka - kb || (b.amount || 0) - (a.amount || 0);
  });
}

/* The rules read from the weekly reports due on `day`, judged once their
   week has closed (Sunday 9 PM). `filings` reaches to that Sunday. The lines
   carry the due day and go into that day's document (closeWeek_). */
function ruleLinesForWeek_(day, filings, schedule) {
  var got = runTests_('week', weekCtx_(day, filings, schedule), day, schedule);
  unjudgedSaid_(got, schedule);
  sortRuleLines_(got.lines);
  return got;
}

/* ------------------------------------------------------------------ *
 *  The month                                                          *
 * ------------------------------------------------------------------ */

/* Close a month: the rules that can only be judged on all of it. Run by the
   monthly pack on the 2nd, after the 1st — the day the monthly reports are
   due — has closed. Writes /months/{yyyy-mm}; a re-run replaces it. The lines
   carry the month's last day, so a cancellation names a day like any other. */
function closeMonth_(month, opts) {
  opts = opts || {};
  var schedule = loadSchedule_();
  var start = month + '-01';
  var next = addDays_(start, 32).slice(0, 8) + '01';
  var end = addDays_(next, -1);
  var filings = filedBetween_(addDays_(start, -7), addDays_(next, 3));
  var ledgers = ledgersBetween_(start, next);
  if (opts.asOf) {
    filings = filings.filter(function (f) { return f.day <= opts.asOf; });
    ledgers = ledgers.filter(function (l) { return l.day <= opts.asOf; });
  }
  var ctx = monthCtx_(month, filings, ledgers, schedule);
  /* judged part-way through, for "this month so far": only the days that
     have happened count, so "every day filed" means every day until now */
  if (opts.asOf) {
    ctx.days = ctx.days.filter(function (d) { return d <= opts.asOf; });
    ctx.workingDays = ctx.workingDays.filter(function (d) { return d <= opts.asOf; });
  }
  /* a line the Chairman cancelled did not happen, for the rules that count */
  ctx.cancelled = {};
  tryQuery_('waivers', [['day', 'GREATER_THAN_OR_EQUAL', start], ['day', 'LESS_THAN', next]], 'day')
    .forEach(function (w) { ctx.cancelled[w.day + '|' + w.report] = w; });
  var got = runTests_('month', ctx, end, schedule);
  var doc = {
    month: month,
    day: end,
    closedAt: new Date(),
    lines: got.lines,
    errors: got.errors,
    unjudged: got.unjudged || [],
    missed: got.missed || [],
    penalty: sumKind_(got.lines, 'penalty'),
    bonus: sumKind_(got.lines, 'bonus')
  };
  if (opts.write !== false && !opts.asOf) fsPut_('months/' + month, doc);
  return doc;
}

/* ------------------------------------------------------------------ *
 *  This month so far — the bonuses                                    *
 * ------------------------------------------------------------------ */

/* Most bonuses are monthly, so without this the Chairman would see nothing
   about them until the 2nd of the next month. Each morning, after the close,
   the month's bonus rules are judged on the month so far and written to
   /standing/{yyyy-mm}: on track (and what it would pay), not on track (and
   the figures that say so), or cannot tell yet (a report it needs has not
   come, like a monthly report due on the 1st). Nothing here is paid — the
   month's own close on the 2nd is what counts. */
function bonusStanding_(asOf) {
  var month = asOf.slice(0, 7);
  var R = loadRules_();
  var schedule = loadSchedule_();
  var names = {};
  (schedule.people || []).forEach(function (p) { names[p.id] = p.en; });
  var groupName = function (rule) {
    var g = (rule.who || []).map(function (w) { return R.groups[w]; }).filter(Boolean)[0];
    return g ? g.en : (rule.who || []).map(function (w) { return names[w] || w; }).join(', ');
  };
  var isBonus = function (id) { return R.byId[id] && R.byId[id].kind === 'bonus'; };
  var m = closeMonth_(month, { write: false, asOf: asOf });
  var entry = function (x) {
    var rule = R.byId[x.rule];
    return { rule: x.rule, person: x.person || '', name: x.person ? (names[x.person] || x.person) : groupName(rule),
             what: rule.en, birr: rule.birr, why: x.why || '' };
  };
  var doc = {
    month: month,
    asOf: asOf,
    at: new Date(),
    onTrack: m.lines.filter(function (l) { return l.kind === 'bonus'; }).map(function (l) {
      return { rule: l.rule, person: l.person, name: l.name, what: l.reportName,
               birr: l.amount || l.wouldBe || 0, counted: l.amount > 0, why: l.why };
    }),
    notOnTrack: (m.missed || []).filter(function (x) { return isBonus(x.rule); }).map(entry),
    cannotTell: (m.unjudged || []).filter(function (x) { return isBonus(x.rule); }).map(entry),
    errors: m.errors
  };
  fsPut_('standing/' + month, doc);
  return doc;
}

function sumKind_(lines, kind) {
  return (lines || []).reduce(function (a, l) { return a + (l.kind === kind ? (l.amount || 0) : 0); }, 0);
}

/* Writes nothing — for trying the month out. */
function previewMonth(month) {
  month = month || addDays_(todayAddis_().slice(0, 8) + '01', -1).slice(0, 7);
  var m = closeMonth_(month, { write: false });
  m.lines.forEach(function (l) {
    Logger.log('%s | %s | %s | %s Birr | %s', l.name, l.kind, l.reportName, l.amount, l.why);
  });
  if (m.errors.length) Logger.log('errors: %s', m.errors.join('; '));
}

/* ------------------------------------------------------------------ *
 *  Pay: everything a month adds and takes                             *
 * ------------------------------------------------------------------ */

/* Person by person: report fines, other fines, bonuses, what the Chairman
   cancelled of each, the notes that are not money (a warning, a suspension),
   and the net change to pay. Read from the closed daily ledgers, the month's
   own lines, and the cancellations — never recalculated from the reports. */
function payOf_(ledgers, monthDoc, waivers, names) {
  var off = {};
  (waivers || []).forEach(function (w) { off[w.day + '|' + w.report] = w; });
  var people = {};
  function row(id, name) {
    return people[id] || (people[id] = {
      id: id, name: name || (names && names[id]) || id,
      late: 0, missing: 0, reportFines: 0, otherFines: 0, bonuses: 0,
      finesCancelled: 0, bonusesCancelled: 0, net: 0, notes: [], cancelled: [], lines: 0
    });
  }
  function take(day, l, isReport) {
    var p = row(l.person, l.name);
    if (isReport) {
      if (l.status === 'LATE') p.late++;
      if (l.status === 'MISSING') p.missing++;
    }
    if (!l.amount && l.kind !== 'consequence') return;
    var w = off[day + '|' + l.report];
    if (l.kind === 'consequence') { p.notes.push(day + ': ' + l.reportName + (w ? ' (cancelled)' : '')); return; }
    p.lines++;
    if (l.kind === 'bonus') {
      p.bonuses += l.amount;
      if (w) p.bonusesCancelled += l.amount;
    } else {
      if (isReport) p.reportFines += l.amount; else p.otherFines += l.amount;
      if (w) p.finesCancelled += l.amount;
    }
    if (w) p.cancelled.push({ day: day, what: l.reportName, birr: l.amount, kind: l.kind || 'penalty', reason: w.reason });
  }
  (ledgers || []).forEach(function (doc) {
    (doc.lines || []).forEach(function (l) { take(doc.day, l, true); });
    (doc.ruleLines || []).forEach(function (l) { take(doc.day, l, false); });
  });
  if (monthDoc) (monthDoc.lines || []).forEach(function (l) { take(monthDoc.day, l, false); });

  return Object.keys(people).map(function (k) {
    var p = people[k];
    p.net = (p.bonuses - p.bonusesCancelled) - (p.reportFines + p.otherFines - p.finesCancelled);
    return p;
  }).filter(function (p) { return p.lines || p.notes.length; })
    .sort(function (a, b) { return a.net - b.net; });
}

/* ------------------------------------------------------------------ *
 *  The tests                                                          *
 * ------------------------------------------------------------------ */

/* EVAL_[ruleId] = { day: fn(ctx, rule) -> hits } or { month: fn(ctx, rule) -> hits }
   A hit: { person, name?, count?, amount?, seq?, why }. `why` says, in figures,
   what the report said — "waste 26% on Tue 8 Oct (limit 20%)" — so the line
   can be checked without opening the report. */
var EVAL_ = {};

/* ------------------------------------------------------------------ *
 *  Reading a rule's own test                                          *
 * ------------------------------------------------------------------ */

/* Most rules carry their test in js/rules.js, as data beside the amount —
   one home for "what the letter says" and "how we know it happened". The
   shape, in full:

   test: {
     at:    'day'   judged at each morning's close, from that day's reports
            'week'  judged on the day the weekly report `on` is due, from its
                    latest filing in the six days up to it
            'month' judged when the month closes, from the whole month
     on:    'amaha-weekly'                 (week only)
     when:  COND        the rule applies only if this holds
     count: VALUE       occurrences: amount = birr × count
     rows:  { of: 'report.field', where: ROWCOND, who: { col, group } }
                        one line per matching table row; `who` names the
                        person from a column, matched to someone on the site
     tiers: { of: VALUE, steps: [[from, birr], ...] }    a banded amount
     rate:  { of: VALUE, birr: 150 }                     value × birr
     pct:   { of: VALUE, steps: [[from, percent], ...] } value × percent
     team:  true        one line for everyone the rule is for
     needFiled: ['amaha-daily']   (month) every day that report was due,
                        it was filed — a bonus paid for "zero" of something
                        is not paid for a month with gaps in the record
   }
   VALUE: 'report.field' | number
          | { sum|avg|min|max|last|days|yes|no: 'report.field' }   (month)
          | { ratio: ['report.a', 'report.b'] }      a ÷ b × 100
          | { rows: 'report.field', where: ROWCOND } number of matching rows
          | { grid: 'report.field', rows: ['label', ...], col: 'n' } sum of cells
   COND:  [VALUE, op, literal]    op < <= > >= == !=
          | { all: [COND...] } | { any: [COND...] } | { not: COND }
          | { every: [ref, op, literal] } | { some: [ref, op, literal] }  (month)
   ROWCOND: [col, op, literal] | { all: [...] } | { any: [...] } | { not: ... }
   '{p}' in a report id is the person the rule is being judged for — the
   shared sales and design reports are 'tsega-sales-daily' and so on.

   An answer that cannot be read — the report was not filed — makes the
   test unknown, and an unknown test charges and pays nothing: the missing
   report is already charged in the report ledger. It is listed as not
   judged, so a bonus lost to a gap in the record is visible.            */

function specUsesP_(spec) { return JSON.stringify(spec).indexOf('{p}') !== -1; }

function judge_(rule, which, ctx, schedule, unjudged, missed) {
  var spec = rule.test, members = membersOf_(rule.who, schedule);
  var perPerson = specUsesP_(spec);
  var subjects = perPerson ? members : [members.length === 1 ? members[0] : null];
  var hits = [];
  subjects.forEach(function (p) {
    var J = { ctx: ctx, which: which, spec: spec, p: p, rule: rule, schedule: schedule, said: [] };
    if (spec.at === 'week') {
      var wk = String(spec.on || '').replace('{p}', p || '');
      var rep = reportOf_(schedule, wk);
      if (!rep) throw new Error('no weekly report ' + wk);
      if (rep.dueDay !== ctx.dow) return;
      /* judged once per block, not every week: only on the block's last day */
      if (spec.blocks && !isBlockDay_(spec.blocks, ctx.day)) return;
    }
    if (spec.needFiled && which === 'month') {
      var gaps = spec.needFiled.map(function (r) { return r.replace('{p}', p || ''); })
        .filter(function (r) { return !filedEveryDue_(ctx, schedule, r); });
      if (gaps.length) {
        unjudged.push({ rule: rule.id, person: p, why: 'not every ' + gaps.join(', ') + ' was filed this month' });
        return;
      }
    }
    if (spec.when) {
      var ok = cond_(J, spec.when);
      if (ok === null) { unjudged.push({ rule: rule.id, person: p, bad: J.bad || null, ref: J.missingRef || null, why: J.missing || 'a report it needs was not filed' }); return; }
      /* judged and not met — kept, with the figures, for "not on track" */
      if (!ok) { if (missed) missed.push({ rule: rule.id, person: p, why: J.said.join('; ') }); return; }
    }
    var why = J.said.join('; ');
    var who = p || (members.length === 1 ? members[0] : null);

    if (spec.rows) {
      var rs = rowsOf_(J, spec.rows.of);
      if (rs === null) { unjudged.push({ rule: rule.id, person: p, bad: J.bad || null, ref: J.missingRef || null, why: J.missing || 'not filed' }); return; }
      var n = 0;
      rs.forEach(function (row) {
        if (spec.rows.where && !rowCond_(row.r, spec.rows.where)) return;
        n++;
        var h = { person: who, seq: row.day + ':' + n, why: rowWhy_(row) };
        if (spec.rows.who) {
          var raw = row.r[spec.rows.who.col];
          if (!raw) return;
          var g = spec.rows.who.group;
          var m = (g === 'assembler' || g === 'cleaner')
            ? { person: g + ':' + String(raw).toLowerCase().replace(/\s+/g, ' ').trim(), name: String(raw).trim() }
            : ctx.match(raw, g);
          if (!m) return;
          h.person = m.person; h.name = m.name; h.note = m.note;
        }
        if (!h.person) throw new Error('no person to charge');
        hits.push(h);
      });
      return;
    }

    var base = { person: who, why: why };
    if (spec.count) {
      J.said = [];
      var c = val_(J, spec.count);
      if (c === null) { unjudged.push({ rule: rule.id, person: p, bad: J.bad || null, ref: J.missingRef || null, why: J.missing || 'not filed' }); return; }
      c = Math.floor(c);
      if (c <= 0) return;
      base.count = c;
      /* when the count is the same figure the condition already showed
         ("required 20 less posted 19 = 1"), say it once */
      var cs = J.said.join('; ');
      base.why = why && cs && why.indexOf(cs) !== -1 ? why : (why ? why + '; ' : '') + cs;
    }
    if (spec.tiers || spec.rate || spec.pct) {
      var t = spec.tiers || spec.rate || spec.pct;
      J.said = [];
      var v = val_(J, t.of);
      if (v === null) { unjudged.push({ rule: rule.id, person: p, bad: J.bad || null, why: J.missing || 'not filed' }); return; }
      var amount = 0;
      if (spec.rate) amount = v * spec.rate.birr;
      else {
        var step = null;
        t.steps.forEach(function (s) { if (v >= s[0]) step = s; });
        amount = !step ? 0 : spec.tiers ? step[1] : v * step[1] / 100;
      }
      amount = Math.round(amount);
      if (amount <= 0) {
        if (missed) missed.push({ rule: rule.id, person: p, why: J.said.join('; ') + ' — below the first band' });
        return;
      }
      base.amount = amount;
      base.why = J.said.join('; ') + (spec.rate ? ' × ' + fmt_(spec.rate.birr) : '') +
                 (spec.pct ? ' × ' + t.steps.filter(function (s) { return v >= s[0]; }).pop()[1] + '%' : '') +
                 ' → ' + fmt_(amount) + ' Birr' + (why ? '; ' + why : '');
    }
    if (spec.team) {
      /* A team amount goes to every member of the group — or, with `share`,
         is divided between them. `exclude` names a table of people who were
         not there that day (the absent list): they neither pay nor share. */
      var team = members.slice();
      if (spec.exclude) {
        var gone = rowsOf_(J, spec.exclude.of) || [];
        gone.forEach(function (row) {
          var m = ctx.match(row.r[spec.exclude.col], spec.exclude.group);
          if (m && m.matched) team = team.filter(function (x) { return x !== m.person; });
        });
      }
      if (!team.length) return;
      if (spec.share) {
        var whole = base.amount != null ? base.amount : (rule.birr || 0) * (base.count || 1);
        var each = Math.round(whole / team.length);
        if (each <= 0) return;
        team.forEach(function (m) {
          hits.push(Object.assign({}, base, { person: m, amount: each,
            why: (base.why ? base.why + ' — ' : '') + fmt_(whole) + ' Birr shared by ' + team.length +
                 (spec.exclude ? ' workers present' : ' workers') + ': ' + fmt_(each) + ' each' }));
        });
        return;
      }
      team.forEach(function (m) { hits.push(Object.assign({}, base, { person: m })); });
      return;
    }
    if (!base.person) throw new Error('no person to charge');
    hits.push(base);
  });
  return hits;
}

function reportOf_(schedule, id) {
  for (var i = 0; i < (schedule.reports || []).length; i++) {
    if (schedule.reports[i].id === id) return schedule.reports[i];
  }
  return null;
}

/* A reference to a report field. A report or field that is not on the site
   is an error, not an unanswered question: if a form is changed and a rule
   still names the old field, the rule must stop loudly — in the morning
   email — rather than quietly never apply again. */
function split_(J, ref) {
  var s = String(ref).replace('{p}', J.p || '');
  var i = s.indexOf('.');
  if (i < 0) throw new Error('bad reference ' + ref);
  var out = { report: s.slice(0, i), field: s.slice(i + 1) };
  var rep = reportOf_(J.schedule, out.report);
  if (!rep) throw new Error('no report ' + out.report + ' on the site');
  var base = out.field.replace(/__[ab]$/, ''), found = false;
  (rep.sections || []).forEach(function (sec) {
    (sec.fields || []).forEach(function (f) { if (f.id === base) found = true; });
  });
  if (!found) throw new Error('no question ' + base + ' in ' + out.report);
  return out;
}

function fieldDef_(schedule, report, field) {
  var rep = reportOf_(schedule, report), base = String(field).replace(/__[ab]$/, ''), def = null;
  if (rep) (rep.sections || []).forEach(function (sec) {
    (sec.fields || []).forEach(function (f) { if (f.id === base) def = f; });
  });
  return def;
}
function fieldLabel_(J, report, field) {
  var rep = reportOf_(J.schedule, report);
  var base = field.replace(/__[ab]$/, ''), label = field;
  if (rep) (rep.sections || []).forEach(function (sec) {
    (sec.fields || []).forEach(function (f) { if (f.id === base) label = f.en; });
  });
  /* one box of a two-box answer is named by the word under it: "…posted —
     required: 20", not the whole question with "(posted / required)" on it */
  var box = boxOf_(label, field);
  label = box ? bareQuestion_(label) + ' — ' + box : String(label).replace(/\s*\?$/, '');
  return label.length > 90 ? label.slice(0, 87) + '…' : label;
}
/* "(posted / required)" at the end of a two-box question: the word for box a or b */
function boxOf_(label, field) {
  var side = /__a$/.test(field) ? 0 : /__b$/.test(field) ? 1 : -1;
  if (side < 0) return null;
  var m = /\(([^()]*?)\s\/\s([^()]*?)\)\s*$/.exec(String(label || ''));
  return m ? m[side + 1].trim() : (side ? 'second box' : 'first box');
}
function bareQuestion_(label) {
  var q = String(label || '').replace(/\s*\([^()]*\)\s*$/, '').replace(/\s*\?$/, '');
  return q.length > 70 ? q.slice(0, 67) + '…' : q;
}
/* Both boxes of one question, as one phrase: "How many required stage
   messages were posted: required 20 less posted 19". The first reading
   printed the whole question twice, once for each box. */
function samePair_(J, r1, r2) {
  if (r1.report !== r2.report) return null;
  var b1 = r1.field.replace(/__[ab]$/, ''), b2 = r2.field.replace(/__[ab]$/, '');
  if (b1 !== b2 || b1 === r1.field || b2 === r2.field) return null;
  var rep = reportOf_(J.schedule, r1.report), label = '';
  (rep ? rep.sections : []).forEach(function (sec) {
    (sec.fields || []).forEach(function (f) { if (f.id === b1) label = f.en; });
  });
  return { q: bareQuestion_(label), w1: boxOf_(label, r1.field), w2: boxOf_(label, r2.field) };
}

/* The one filing a day or week test reads: that day's; for a week test the
   latest in the six days up to the due day; for a month, the monthly
   report itself. */
function filingFor_(J, report) {
  var ctx = J.ctx;
  if (J.which === 'month') return ctx.monthly(report);
  if (J.spec.at === 'week') {
    /* a weekly report as its week finally stood — sent late on Saturday,
       or corrected, it is still this week's */
    var rep = reportOf_(J.schedule, report);
    if (rep && rep.cadence === 'weekly' && ctx.week) return ctx.week(report);
    for (var k = 0; k <= 6; k++) {
      var v = ctx.vOn(report, addDays_(ctx.day, -k));
      if (v) return v;
    }
    return null;
  }
  return ctx.v(report);
}

function val_(J, ref) {
  if (typeof ref === 'number') return ref;
  if (typeof ref === 'string') {
    var r = split_(J, ref);
    var rep = reportOf_(J.schedule, r.report);
    if (J.which === 'month' && rep && rep.cadence !== 'monthly') {
      throw new Error(ref + ' is a ' + rep.cadence + ' report: a month test needs sum, avg, min, max, last, days, yes or no');
    }
    var f = filingFor_(J, r.report);
    if (!f) { J.missing = r.report + ' not filed'; return null; }
    var raw = f[r.field];
    if (raw === '' || raw == null) {
      J.missing = fieldLabel_(J, r.report, r.field) + ' — not answered';
      J.missingRef = { report: r.report, field: r.field };
      return null;
    }
    /* Every two-box answer is part / whole. With the first box bigger (25
       posted of 20 required) "20 less 25" is below zero and the fine was
       simply never charged, and "all called" read as met — an answer that
       cannot be true settled the rule. It is not judged instead, and the
       morning email says so, so a person cannot type their way out of a fine
       or into a bonus. */
    var pm = /^(.*)__([ab])$/.exec(r.field);
    if (pm) {
      var pa = fig_(f[pm[1] + '__a']), pb = fig_(f[pm[1] + '__b']);
      if (pa !== null && pb !== null && pa > pb) {
        var pp = samePair_(J, { report: r.report, field: pm[1] + '__a' }, { report: r.report, field: pm[1] + '__b' });
        J.bad = (pp ? pp.q + ': ' + pp.w1 + ' ' + fmt_(pa) + ' is more than ' + pp.w2 + ' ' + fmt_(pb)
                    : r.field + ' ' + fmt_(pa) + ' of ' + fmt_(pb)) + ' — cannot be right as written';
        J.missing = J.bad;
        return null;
      }
    }
    var x = fig_(raw);
    J.said.push(fieldLabel_(J, r.report, r.field) + ': ' + (x === null ? raw : fmt_(x)));
    return x === null ? String(raw).toLowerCase() : x;
  }
  if (ref.ratio) {
    var q = J.said.length;
    var a = J.which === 'month' ? aggr_(J, 'sum', ref.ratio[0]) : val_(J, ref.ratio[0]);
    var b = J.which === 'month' ? aggr_(J, 'sum', ref.ratio[1]) : val_(J, ref.ratio[1]);
    if (a === null || b === null) return null;
    J.said.length = q;
    if (!b) { J.missing = 'nothing to divide by'; return null; }
    var pct = Math.round(a / b * 1000) / 10;
    var ra = split_(J, ref.ratio[0]), rb = split_(J, ref.ratio[1]), rp = samePair_(J, ra, rb);
    J.said.push(rp ? rp.q + ': ' + rp.w1 + ' ' + fmt_(a) + ' of ' + rp.w2 + ' ' + fmt_(b) + ' = ' + pct + '%'
                   : fieldLabel_(J, ra.report, ra.field) + ' ' + fmt_(a) + ' of ' + fieldLabel_(J, rb.report, rb.field) +
                     ' ' + fmt_(b) + ' = ' + pct + '%');
    return pct;
  }
  /* What the month's ledger already holds for this person: report lines
     (late, missing) or rule lines — for the bonuses that need "every report
     on time" or "no late request recorded". A line counts whether or not it
     cost money (a held or not-yet-counted line still happened); a cancelled
     one does not. */
  if (ref.reportLines || ref.ruleLines) {
    if (J.which !== 'month') throw new Error('reportLines and ruleLines are for month tests');
    var who = J.p || (membersOf_(J.rule ? J.rule.who : [], J.schedule)[0]);
    var want = (ref.reportLines || ref.ruleLines).map(function (x) { return String(x).replace('{p}', J.p || ''); });
    var status = ref.status || ['LATE', 'MISSING'];
    var cnt = J.ctx.lines(who).filter(function (l) {
      if (J.ctx.cancelled && J.ctx.cancelled[(l.closed || l.day) + '|' + l.report]) return false;
      if (ref.reportLines) return !l.rule && (want[0] === '*' || want.indexOf(l.report) !== -1) && status.indexOf(l.status) !== -1;
      return l.rule && want.indexOf(l.rule) !== -1;
    }).length;
    J.said.push((ref.reportLines ? 'reports late or missing this month' : 'recorded this month: ' + want.join(', ')) + ': ' + cnt);
    return cnt;
  }
  if (ref.diff) {
    var q2 = J.said.length;
    var d1 = val_(J, ref.diff[0]), d2 = val_(J, ref.diff[1]);
    if (d1 === null || d2 === null) return null;
    J.said.length = q2;
    var dr1 = split_(J, ref.diff[0]), dr2 = split_(J, ref.diff[1]), dp = samePair_(J, dr1, dr2);
    J.said.push(dp ? dp.q + ': ' + dp.w1 + ' ' + fmt_(d1) + ' less ' + dp.w2 + ' ' + fmt_(d2) + ' = ' + fmt_(d1 - d2)
                   : fieldLabel_(J, dr1.report, dr1.field) + ' ' + fmt_(d1) + ' less ' +
                     fieldLabel_(J, dr2.report, dr2.field) + ' ' + fmt_(d2) + ' = ' + fmt_(d1 - d2));
    return d1 - d2;
  }
  if (ref.rows && !ref.grid) {
    var rs = rowsOf_(J, ref.rows);
    if (rs === null) return null;
    var n = rs.filter(function (x) { return !ref.where || rowCond_(x.r, ref.where); }).length;
    var rr = split_(J, ref.rows);
    J.said.push(fieldLabel_(J, rr.report, rr.field) + ': ' + n + (n === 1 ? ' row' : ' rows'));
    return n;
  }
  if (ref.grid) {
    var g = split_(J, ref.grid), grep = reportOf_(J.schedule, g.report), fdef = null;
    (grep ? grep.sections : []).forEach(function (sec) {
      (sec.fields || []).forEach(function (fd) { if (fd.id === g.field) fdef = fd; });
    });
    if (!fdef) throw new Error('no grid ' + ref.grid);
    var filings = J.which === 'month' && grep.cadence !== 'monthly'
      ? J.ctx.series(g.report).map(function (s) { return s.v; })
      : [filingFor_(J, g.report)].filter(Boolean);
    if (!filings.length) { J.missing = g.report + ' not filed'; return null; }
    var tot = 0;
    filings.forEach(function (v) {
      var cells = v[g.field] || [];
      fdef.rows.forEach(function (row, i) {
        if (ref.rows.indexOf(row.en) !== -1 && cells[i]) tot += fig_(cells[i][ref.col]) || 0;
      });
    });
    J.said.push(fieldLabel_(J, g.report, g.field) + ' (' + ref.rows.join(', ') + '): ' + fmt_(tot));
    return tot;
  }
  var op = ['sum', 'avg', 'min', 'max', 'last', 'days', 'yes', 'no'].filter(function (k) { return ref[k]; })[0];
  if (op) return aggr_(J, op, ref[op]);
  throw new Error('cannot read ' + JSON.stringify(ref));
}

/* A month's figure from a daily or weekly report: every filing of the
   month, the last of each day. */
function aggr_(J, op, ref) {
  if (J.which !== 'month') throw new Error(op + ' is for month tests');
  var r = split_(J, ref);
  var series = J.ctx.series(r.report);
  if (!series.length) { J.missing = r.report + ' not filed this month'; return null; }
  var xs = series.map(function (s) { return s.v[r.field]; });
  var nums = xs.map(fig_).filter(function (x) { return x !== null; });
  var out;
  if (op === 'days') out = series.length;
  else if (op === 'yes' || op === 'no') out = xs.filter(function (x) { return String(x || '').toLowerCase() === op; }).length;
  else {
    if (!nums.length) { J.missing = fieldLabel_(J, r.report, r.field) + ' — never answered this month'; return null; }
    if (op === 'sum') out = nums.reduce(function (a, x) { return a + x; }, 0);
    if (op === 'avg') out = Math.round(nums.reduce(function (a, x) { return a + x; }, 0) / nums.length * 10) / 10;
    if (op === 'min') out = Math.min.apply(null, nums);
    if (op === 'max') out = Math.max.apply(null, nums);
    if (op === 'last') out = nums[nums.length - 1];
  }
  J.said.push(fieldLabel_(J, r.report, r.field) + ', ' +
    { sum: 'total', avg: 'average', min: 'lowest', max: 'highest', last: 'last', days: 'days filed',
      yes: 'days answered yes', no: 'days answered no' }[op] + ' for the month: ' + fmt_(out));
  return out;
}

/* table rows: [{day, r, label}] — one filing's rows, or in a month every
   filing's */
function rowsOf_(J, ref) {
  var r = split_(J, ref);
  var lists = [];
  var rep = reportOf_(J.schedule, r.report);
  if (J.which === 'month' && rep && rep.cadence !== 'monthly') {
    J.ctx.series(r.report).forEach(function (s) { lists.push({ day: s.day, v: s.v }); });
    if (!lists.length) { J.missing = r.report + ' not filed this month'; return null; }
  } else {
    var f = filingFor_(J, r.report);
    if (!f) { J.missing = r.report + ' not filed'; return null; }
    lists.push({ day: J.ctx.day || J.ctx.end, v: f });
  }
  var out = [];
  lists.forEach(function (l) {
    var t = l.v[r.field];
    if (Object.prototype.toString.call(t) !== '[object Array]') return;
    t.forEach(function (row) {
      if (row && Object.keys(row).some(function (k) { return row[k] !== '' && row[k] != null; })) {
        out.push({ day: l.day, r: row, label: fieldLabel_(J, r.report, r.field) });
      }
    });
  });
  return out;
}

function rowWhy_(row) {
  var bits = Object.keys(row.r).filter(function (k) { return row.r[k] !== '' && row.r[k] != null; })
    .map(function (k) { return k + ': ' + row.r[k]; });
  return row.label + ' (' + row.day + ') — ' + bits.join(', ');
}

function cmp_(a, op, b) {
  if (a === null || a === undefined || a === '') return null;
  if (typeof b === 'string') {
    var x = String(a).toLowerCase(), y = b.toLowerCase();
    if (op === '==') return x === y;
    if (op === '!=') return x !== y;
    throw new Error('op ' + op + ' on text');
  }
  var n = typeof a === 'number' ? a : fig_(a);
  if (n === null) return null;
  return { '<': n < b, '<=': n <= b, '>': n > b, '>=': n >= b, '==': n === b, '!=': n !== b }[op];
}

function cond_(J, c) {
  if (Object.prototype.toString.call(c) === '[object Array]') {
    var v = val_(J, c[0]);
    var r = cmp_(v, c[1], c[2]);
    if (r !== null && J.said.length) {
      J.said[J.said.length - 1] += ' (' + (r ? 'meets' : 'fails') + ' ' + c[1] + ' ' + c[2] + ')';
    }
    return r;
  }
  if (c.all) {
    var unknown = false;
    for (var i = 0; i < c.all.length; i++) {
      var x = cond_(J, c.all[i]);
      if (x === false) return false;
      if (x === null) unknown = true;
    }
    return unknown ? null : true;
  }
  if (c.any) {
    var unk = false;
    for (var k = 0; k < c.any.length; k++) {
      var y = cond_(J, c.any[k]);
      if (y === true) return true;
      if (y === null) unk = true;
    }
    return unk ? null : false;
  }
  if (c.not) { var z = cond_(J, c.not); return z === null ? null : !z; }
  /* a question left empty in a report that was filed — "no reason given" */
  if (c.blank) {
    var br = split_(J, c.blank), bf = filingFor_(J, br.report);
    if (!bf) { J.missing = br.report + ' not filed'; return null; }
    var bv = bf[br.field];
    var isBlank = bv == null || String(bv).trim() === '';
    J.said.push(fieldLabel_(J, br.report, br.field) + ': ' + (isBlank ? 'not answered' : 'answered'));
    return isBlank;
  }
  if (c.every || c.some) {
    var s = c.every || c.some;
    if (J.which !== 'month') return cond_(J, s);
    var r2 = split_(J, s[0]);
    var series = J.ctx.series(r2.report);
    if (!series.length) { J.missing = r2.report + ' not filed this month'; return null; }
    var res = series.map(function (x) { return cmp_(x.v[r2.field], s[1], s[2]); })
                    .filter(function (x) { return x !== null; });
    if (!res.length) { J.missing = fieldLabel_(J, r2.report, r2.field) + ' — never answered this month'; return null; }
    var good = res.filter(Boolean).length;
    J.said.push(fieldLabel_(J, r2.report, r2.field) + ' ' + s[1] + ' ' + s[2] + ' on ' + good + ' of ' + res.length + ' days');
    return c.every ? good === res.length : good > 0;
  }
  throw new Error('cannot judge ' + JSON.stringify(c));
}

function rowCond_(row, c) {
  if (Object.prototype.toString.call(c) === '[object Array]') return cmp_(row[c[0]], c[1], c[2]) === true;
  if (c.all) return c.all.every(function (x) { return rowCond_(row, x); });
  if (c.any) return c.any.some(function (x) { return rowCond_(row, x); });
  if (c.not) return !rowCond_(row, c.not);
  throw new Error('cannot judge row ' + JSON.stringify(c));
}

/* every working day the report was due in the month, it was filed */
function filedEveryDue_(ctx, schedule, reportId) {
  var rep = reportOf_(schedule, reportId);
  if (!rep) return false;
  if (rep.cadence !== 'daily') return true;
  var have = {};
  ctx.series(reportId).forEach(function (s) { have[s.day] = true; });
  var start = prop_('LEDGER_START', '');
  return ctx.days.every(function (d) {
    if (start && d < start) return true;
    var due = dueOn_(schedule, d).some(function (r) { return r.id === reportId; });
    return !due || !!have[d];
  });
}

/* ------------------------------------------------------------------ *
 *  The tests that are functions                                       *
 * ------------------------------------------------------------------ */

/* The few rules the test format cannot say: a streak across weeks, a count
   over the ledger itself, a job charged once however many days it runs on.
   Each one reads only what it needs, and says in `why` what it found. */

/* A penalty line that counted: it cost money, or would have under paper not
   yet signed, and the Chairman did not cancel it. */
function countedPenalty_(ctx, l, alsoPending) {
  if (l.kind !== 'penalty' && l.rule) return false;
  if (!l.rule && !(l.amount > 0)) return false;           /* a report on time, or free */
  if (ctx.cancelled && ctx.cancelled[(l.closed || l.day) + '|' + l.report]) return false;
  return l.amount > 0 || (alsoPending && l.wouldBe > 0);
}

/* The weekly filings of one report, newest first: [{day, week, v}], one per
   week. `week` is the Sunday that closed it and `day` the due day in that
   week — the ledger's rule: a weekly report belongs to the week it is sent
   in, which closes on Sunday at 9 PM — and a week sent twice (Thursday, then
   corrected on Saturday) is its last filing. Keyed by the day sent, a
   correction made a second week, and a salesperson's first report sent
   twice was charged "two weeks in a row below the floor". Nothing after the
   week of the due day being judged is read: a report sent early for the
   next week is not this one's. Read in a week's context (weekCtx_). */
function weeklyFilings_(ctx, reportId, weeks) {
  var rep = reportOf_(ctx.schedule, reportId);
  if (!rep || rep.cadence !== 'weekly') throw new Error(reportId + ' is not a weekly report');
  var thisWeek = sundayOf_(ctx.day);
  var byWeek = {};
  ctx.filings(weeks * 7 + 7).forEach(function (f) {
    if (f.report !== reportId || !f.at) return;
    var wk = weekOf_(f.at, reportId);
    if (wk <= thisWeek) byWeek[wk] = f;            /* oldest first: the last of a week wins */
  });
  return Object.keys(byWeek).sort().reverse().map(function (w) {
    return { day: dueInWeek_(rep, w), week: w, v: byWeek[w].fields || {} };
  });
}

/* ---- Selam: an assembler's payment released more than 3 days late ---- */
EVAL_['betty-asm-late-release'] = { day: function (ctx) {
  var v = ctx.v('betty-daily');
  if (!v || Object.prototype.toString.call(v.asm_released_list) !== '[object Array]') return [];
  var hits = [];
  v.asm_released_list.forEach(function (r, i) {
    var days = fig_(r.days);
    if (days === null || days <= 3) return;
    hits.push({ person: 'betty', seq: ctx.day + ':' + (i + 1), amount: 300 * (days - 3),
                why: 'Assembler payment ' + (r.code || '') + (r.who ? ' to ' + r.who : '') + ' released after ' +
                     days + ' days: 300 × ' + (days - 3) + ' days over 3' });
  });
  return hits;
} };

/* ---- Mahelet: three WhatsApp failures in one week cancel the KPI bonus ---- */
EVAL_['liu-wa-repeat-kpi-cancel'] = { month: function (ctx) {
  var rules = ['liu-wa-ops-message-late', 'liu-wa-assembler-progress', 'liu-wa-unprofessional', 'liu-wa-customer-complaint'];
  var byWeek = {};
  ctx.lines('liu').forEach(function (l) {
    if (rules.indexOf(l.rule) === -1) return;
    if (ctx.cancelled && ctx.cancelled[(l.closed || l.day) + '|' + l.report]) return;
    var d = l.day, dow = dow_(d);
    var monday = addDays_(d, dow === 0 ? -6 : 1 - dow);
    byWeek[monday] = (byWeek[monday] || 0) + (l.count || 1);
  });
  var bad = Object.keys(byWeek).filter(function (w) { return byWeek[w] >= 3; }).sort();
  if (!bad.length) return [];
  return [{ person: 'liu', why: 'WhatsApp failures: ' + bad.map(function (w) { return byWeek[w] + ' in the week of ' + w; }).join('; ') +
            ' — three in one week cancel the KPI bonus for the month. Cancel the bonus line if it was paid.' }];
} };

/* ---- Ephrata: the rolling 4-week total, and the marketing leads ---- */
/* A block day: the last day of a block of `days`, counting from `from`
   (itself a block day). Ephrata's 4-week total is judged on these only —
   every fourth Friday — so one bad period is charged once (Chairman,
   28 September 2026). */
function isBlockDay_(blocks, day) {
  if (day < blocks.from) return false;
  var n = Math.round((dayStart_(day).getTime() - dayStart_(blocks.from).getTime()) / 86400000);
  return n % blocks.days === 0;
}

/* Two blocks in a row below a threshold: this block's 4-week total, filed
   in the week to the block day, and the one filed for the block before. */
function ephrataBelow_(ctx, threshold, what) {
  var rule = loadRules_().byId['ephrata-rolling-below-12m-25000'];
  var blocks = rule && rule.test && rule.test.blocks;
  if (!blocks) throw new Error('ephrata-rolling-below-12m-25000 names no blocks');
  if (!isBlockDay_(blocks, ctx.day)) return [];
  var f = weeklyFilings_(ctx, 'ephrata-weekly', blocks.days / 7 + 1);
  var now = f.filter(function (x) { return x.day >= addDays_(ctx.day, -6); })[0];
  var prevDay = addDays_(ctx.day, -blocks.days);
  var before = f.filter(function (x) { return x.day <= prevDay && x.day >= addDays_(prevDay, -6); })[0];
  if (!now || !before) return [];
  var a = fig_(now.v.r_total), b = fig_(before.v.r_total);
  if (a === null || b === null || a >= threshold || b >= threshold) return [];
  return [{ person: 'ephrata', why: '4-week total ' + fmt_(a) + ' (block to ' + ctx.day + ') and ' + fmt_(b) +
            ' (block to ' + prevDay + ') — both below ' + fmt_(threshold) + ': ' + what }];
}
EVAL_['ephrata-rolling-review'] = { week: function (ctx) {
  return ephrataBelow_(ctx, 12000000, 'formal performance review');
} };
EVAL_['ephrata-rolling-removal'] = { week: function (ctx) {
  return ephrataBelow_(ctx, 10000000, 'removal from the role');
} };
EVAL_['ephrata-zero-mkt-leads'] = { week: function (ctx) {
  var rep = reportOf_(ctx.schedule, 'ephrata-weekly');
  if (!rep || rep.dueDay !== ctx.dow) return [];
  var f = weeklyFilings_(ctx, 'ephrata-weekly', 2);
  if (f.length < 2 || f[0].day < addDays_(ctx.day, -6)) return [];
  var a = fig_(f[0].v.w_mkt_leads), b = fig_(f[1].v.w_mkt_leads);
  if (a !== 0 || b !== 0) return [];
  return [{ person: 'ephrata', why: 'Marketing leads 0 in the week to ' + f[0].day + ' and 0 in the week to ' + f[1].day }];
} };

/* ---- Salespeople: weeks in a row below the collection floor ----
   The floor is 2,000,000 a week; for October 2026 weeks the letter lowers the
   penalty threshold to 1,000,000. Two weeks cost 1,000, three or more cost
   2,000 each week instead, and a fourth is removal. */
function salesStreak_(ctx, p) {
  var rep = reportOf_(ctx.schedule, p + '-sales-weekly');
  if (!rep || rep.dueDay !== ctx.dow) return null;
  var f = weeklyFilings_(ctx, p + '-sales-weekly', 4);
  if (!f.length || f[0].day < addDays_(ctx.day, -6)) return null;
  var n = 0, seen = [];
  for (var i = 0; i < f.length; i++) {
    if (i && f[i - 1].day > addDays_(f[i].day, 13)) break;            /* a missing week breaks the run */
    var floor = f[i].day.slice(0, 7) === '2026-10' ? 1000000 : 2000000;
    var c = fig_(f[i].v.s_coll);
    if (c === null || c >= floor) break;
    n++;
    seen.push(fmt_(c) + ' (' + f[i].day + ')');
  }
  return { n: n, why: n + ' weeks in a row below the floor: ' + seen.join(', ') };
}
EVAL_['sales-2-weeks-below-2m'] = { week: function (ctx, rule) {
  return membersOf_(rule.who, ctx.schedule).map(function (p) {
    var s = salesStreak_(ctx, p);
    return s && s.n === 2 ? { person: p, why: s.why } : null;
  }).filter(Boolean);
} };
EVAL_['sales-3-weeks-below-2m'] = { week: function (ctx, rule) {
  return membersOf_(rule.who, ctx.schedule).map(function (p) {
    var s = salesStreak_(ctx, p);
    return s && s.n >= 3 ? { person: p, why: s.why + ' — charged in place of the two-week 1,000' } : null;
  }).filter(Boolean);
} };
EVAL_['sales-4-weeks-removal'] = { week: function (ctx, rule) {
  return membersOf_(rule.who, ctx.schedule).map(function (p) {
    var s = salesStreak_(ctx, p);
    return s && s.n >= 4 ? { person: p, why: s.why } : null;
  }).filter(Boolean);
} };
EVAL_['sales-no-contracts-2-months'] = { month: function (ctx, rule) {
  return membersOf_(rule.who, ctx.schedule).map(function (p) {
    var now = ctx.series(p + '-sales-daily'), before = ctx.previousSeries(p + '-sales-daily');
    /* only answers count: a question never answered is not a month of zero */
    var said = function (s) { return s.map(function (x) { return fig_(x.v.c_signed); }).filter(function (x) { return x !== null; }); };
    var a = said(now), b = said(before);
    if (!a.length || !b.length) return null;
    var sum = function (xs) { return xs.reduce(function (t, x) { return t + x; }, 0); };
    if (sum(a) || sum(b)) return null;
    return { person: p, why: 'No contract signed in ' + ctx.month + ' (' + now.length + ' daily reports) nor the month before (' +
             before.length + ' daily reports)' };
  }).filter(Boolean);
} };

/* ---- Designers: a complaint unresolved after 7 days, charged once per job ---- */
EVAL_['design-complaint-unresolved-7d'] = { day: function (ctx, rule) {
  var hits = [];
  membersOf_(rule.who, ctx.schedule).forEach(function (p) {
    var id = p + '-design-daily', v = ctx.v(id);
    if (!v || Object.prototype.toString.call(v.cp_list) !== '[object Array]') return;
    var hist = ctx.history(21)[id] || {};
    v.cp_list.forEach(function (r) {
      var days = fig_(r.days);
      if (days === null || days <= 7) return;
      var key = String(r.code || '').trim().toLowerCase() + '|' + String(r.cust || '').trim().toLowerCase();
      /* already past 7 days in an earlier report: it was charged then */
      var before = Object.keys(hist).some(function (d) {
        if (d >= ctx.day) return false;
        return ((hist[d].fields || {}).cp_list || []).some(function (x) {
          return (String(x.code || '').trim().toLowerCase() + '|' + String(x.cust || '').trim().toLowerCase()) === key &&
                 (fig_(x.days) || 0) > 7;
        });
      });
      if (before) return;
      hits.push({ person: p, seq: key, why: 'Complaint from ' + (r.cust || '?') + ' on job ' + (r.code || '?') +
                  ' open ' + days + ' days' + (r.what ? ': ' + r.what : '') });
    });
  });
  return hits;
} };

/* ---- Production workers: the attendance bonus, and the penalty counter ---- */
EVAL_['worker-attendance-bonus'] = { month: function (ctx, rule) {
  var workers = membersOf_(rule.who, ctx.schedule);
  if (!filedEveryDue_(ctx, ctx.schedule, 'amaha-daily')) return [];
  var named = {};
  ctx.series('amaha-daily').forEach(function (s) {
    ['mp_late_list', 'mp_absent_list'].forEach(function (t) {
      (s.v[t] || []).forEach(function (r) {
        if (!r || !r.name) return;
        var m = ctx.match(r.name, 'production-worker');
        if (m && m.matched) named[m.person] = true;
        else {
          /* a name that fits two workers keeps the bonus from both until checked */
          var t2 = String(r.name).toLowerCase().trim().split(/\s+/)[0];
          workers.forEach(function (w) {
            var p = (ctx.schedule.people || []).filter(function (x) { return x.id === w; })[0];
            if (p && String(p.en).toLowerCase().split(' ')[0] === t2) named[w] = true;
          });
        }
      });
    });
  });
  return workers.filter(function (w) { return !named[w]; }).map(function (w) {
    return { person: w, why: 'No late arrival and no absence recorded in ' + ctx.month + ', every daily production report filed' };
  });
} };

function escalate_(ctx, people, steps, what, alsoPending, onlyRules, skipTeam) {
  var hits = [];
  var R = loadRules_();
  people.forEach(function (p) {
    var n = ctx.lines(p).filter(function (l) {
      if (onlyRules && onlyRules.indexOf(l.rule) === -1) return false;
      var rr = l.rule && R.byId[l.rule];
      if (skipTeam && rr && rr.test && rr.test.team) return false;
      return countedPenalty_(ctx, l, alsoPending);
    }).reduce(function (a, l) {
      /* a recorded event can be several at once (count); a Birr figure cannot */
      var r = l.rule && loadRules_().byId[l.rule];
      return a + (r && r.per !== 'birr' && l.count > 1 ? l.count : 1);
    }, 0);
    var step = null;
    steps.forEach(function (s) { if (n >= s[0]) step = s; });
    if (step) hits.push({ person: p, why: n + ' ' + what + ' in ' + ctx.month + ': ' + step[1] });
  });
  return hits;
}
/* people named in the month's lines under a group with no accounts
   (assemblers): their person ids are 'assembler:<name>' */
function namedIn_(ctx, prefix) {
  var seen = {};
  ctx.lines().forEach(function (l) { if (String(l.person).indexOf(prefix) === 0) seen[l.person] = l.name; });
  return Object.keys(seen);
}

EVAL_['worker-escalation'] = { month: function (ctx, rule) {
  return escalate_(ctx, membersOf_(rule.who, ctx.schedule),
    [[3, 'written warning'], [5, '3-day suspension without pay'], [7, 'removal from Klever']],
    'penalties counted', false, null, true);
} };
EVAL_['assembler-3-penalties-suspension'] = { month: function (ctx) {
  return escalate_(ctx, namedIn_(ctx, 'assembler:'), [[3, 'suspension']], 'penalty lines', true);
} };
EVAL_['assembler-5-penalties-removal'] = { month: function (ctx) {
  return escalate_(ctx, namedIn_(ctx, 'assembler:'), [[5, 'removal']], 'penalty lines', true);
} };
EVAL_['assembler-3-checklist-failures'] = { month: function (ctx) {
  return escalate_(ctx, namedIn_(ctx, 'assembler:'), [[3, 'suspension and retraining']], 'checklist failures', true,
    ['assembler-checklist-not-completed', 'assembler-not-reported-24h', 'assembler-started-incorrect-materials',
     'assembler-extra-materials-after-start']);
} };
/* the order to Elyas: no more than 2 penalties per assembler in a month */
EVAL_['elyas-order-penalties-per-assembler'] = { month: function (ctx) {
  var over = namedIn_(ctx, 'assembler:').map(function (a) {
    var n = ctx.lines(a).filter(function (l) { return countedPenalty_(ctx, l, true); }).length;
    return n > 2 ? a.replace('assembler:', '') + ' (' + n + ')' : null;
  }).filter(Boolean);
  return over.length ? [{ person: 'elyas', why: 'Assemblers with more than 2 penalties in ' + ctx.month + ': ' + over.join(', ') +
                          '. Elyas logs these himself, so a low count is also what not logging looks like.' }] : [];
} };
