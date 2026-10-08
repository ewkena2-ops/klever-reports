/* Klever — the week and the month.

   WHY THESE EXIST
   The daily agents read the daily reports. Nobody read the weekly ones: six
   people file thirteen weekly reports and two monthly ones, and until now
   each landed in a channel and a Sheet tab and went no further. Nor did
   anything add a month of penalties into the figure that actually comes off
   a person's pay — the daily ledger said what each day cost and stopped.

   So, twice:

     weeklyPack   Sunday after 9 PM, when the week closes (weekEnd_ in
                  Agent.js), on Monday to Sunday just ended. Who filed and
                  who did not, the week's production, quality, money and
                  sales, whether last week's forecasts came true, what the
                  Chairman asked for and got — then the weekly reports and the
                  week's daily briefs for the model to read. With it, the
                  CFO's reading of where the week's money went (Cfo.js),
                  operations from plan to site (Ops.js), HR's reading of
                  the week's people (Hr.js) and the legal check of the month
                  so far (Legal.js).
     monthlyPack  the 2nd, on the month just ended. The same, plus the
                  deductions: every person's penalties for the month, less
                  any the Chairman cancelled, as a table and a Sheet tab that
                  payroll can work from.

   The same rule as everywhere else in this project: every number is worked
   out here, in code. The model is handed the finished figures and asked what
   they mean. The deductions table in particular is never shown to a model
   before it is sent — it is money.

   Both write to /packs in Firestore (the Chairman's page shows the latest
   week) and email him. previewWeekly() and previewMonthly() log the figures
   and write nothing.                                                        */

/* ------------------------------------------------------------------ *
 *  Entry points                                                       *
 * ------------------------------------------------------------------ */

/* The week that closed last — Monday to Sunday, closed at 9 PM on Sunday
   (THE WEEK, Agent.js) — or the week ending on a Sunday given as
   'yyyy-mm-dd'. It is sent by weekEnd_ once the week has closed.

   A time-driven trigger calls these with an event object as the first
   argument, not a day. Read as a day it made an invalid date, and both packs
   threw "Invalid time value" before writing or sending anything — which is
   why the Sunday 27 September summary never arrived. Only a 'yyyy-mm-dd'
   (or 'yyyy-mm') string typed in the editor counts. An old Sunday-morning
   trigger for this one now does nothing: at 8 AM on Sunday the week is not
   over. */
function weeklyPack(endDay) {
  if (!isDay_(endDay)) {
    Logger.log('The weekly summary goes when the week closes, Sunday 9 PM — nothing to do now.');
    return { note: 'the week closes on Sunday at 9 PM' };
  }
  return ran_('week', function () { return weeklyPack_(endDay); });
}
/* the Sunday that closes the week a pack reads */
function weekOfP_(P) { return P.week || sundayOf_(P.end); }
/* the Sunday whose week closed last */
function lastClosedSunday_() {
  var today = todayAddis_();
  var sun = addDays_(today, -dow_(today));
  return new Date().getTime() >= weekCut_(sun).getTime() ? sun : addDays_(sun, -7);
}
function weeklyPack_(endDay) {
  /* a week is Monday to Sunday: a day given is read as the week it is in */
  var end = endDay ? sundayOf_(endDay) : lastClosedSunday_();
  var P = packData_(addDays_(end, -6), end);
  P.week = end;
  var facts = weekFacts_(P);
  var text = askPack_(WEEK_ASK_, facts, P);
  /* the CFO's reading of the week's money (Cfo.js) — if it fails, the
     summary still goes, and says so */
  var cfo = null, cfoText = '', cfoWarn = [];
  try {
    cfo = cfoFacts_(P, facts.operations);
    cfoText = cfoRead_(cfo, P);
  } catch (e) {
    cfo = null;
    cfoWarn.push('CFO: ' + e.message);
  }
  /* and HR's reading of the week's people (Hr.js), the same way */
  var hr = null, hrText = '';
  try { hr = hrFacts_(P, facts.reporting); }
  catch (e) { cfoWarn.push('HR: ' + e.message); }
  if (hr) hrText = readOrSay_(function () { return hrRead_(hr, P); }, 'HR', cfoWarn);
  /* and the legal check of the month so far (Legal.js) */
  var legal = null, legalText = '';
  try { legal = legalFacts_(P, 'week'); }
  catch (e) { cfoWarn.push('Legal: ' + e.message); }
  if (legal) legalText = readOrSay_(function () { return legalRead_(legal, P); }, 'Legal', cfoWarn);
  /* and operations, from Mahelet's plan to the site (Ops.js) */
  var ops = null, opsText = '';
  try { ops = opsFacts_(P, facts.operations); }
  catch (e) { cfoWarn.push('Operations: ' + e.message); }
  if (ops) opsText = readOrSay_(function () { return opsRead_(ops, P); }, 'Operations', cfoWarn);
  /* and the specialists — audit, risk, forecast and the rest (Readers.js) */
  var rd = { saved: {}, html: '' };
  try { rd = runReaders_('week', P, facts, { cfo: cfo, hr: hr, legal: legal, ops: ops }, cfoWarn); }
  catch (e) { cfoWarn.push('Specialists: ' + e.message); }
  /* each owner's copy of their Sunday readings (Owners.js) */
  try {
    var mine = [];
    if (cfo && cfoText) mine.push({ id: 'cfo', en: 'Your CFO — the week’s money', am: 'የእርስዎ CFO — የሳምንቱ ገንዘብ', text: cfoText });
    if (ops && opsText) mine.push({ id: 'ops', en: 'Operations — plan to site', am: 'ኦፕሬሽን — ከዕቅድ እስከ ተከላ', text: opsText });
    ((rd.saved && rd.saved.readers) || []).forEach(function (r) { mine.push({ id: r.id, en: r.en, am: r.am, text: r.text }); });
    deliverReadings_(mine, end, 'week');
  } catch (e) { cfoWarn.push('Readings to owners: ' + e.message); }
  var extra = cfoSaved_(cfo, cfoText);
  var more = [hrSaved_(hr, hrText), legalSaved_(legal, legalText), opsSaved_(ops, opsText), rd.saved];
  more.forEach(function (m) { Object.keys(m).forEach(function (k) { extra[k] = m[k]; }); });
  var warn = savePack_('week-' + end, 'week', P, facts, text, extra).concat(cfoWarn);
  mailPack_('week', P, facts, text, cfo, cfoText, hr, hrText, legal, legalText, ops, opsText, rd.html);
  return { period: P.start + ' to ' + end, warn: warn,
           note: (facts.reporting.on_time_pct == null ? 'no reports' : facts.reporting.on_time_pct + '% on time') };
}

/* A reading whose figures are already worked out: if only the model call
   fails, the figures still go — on his page and in the email — with a line
   saying the reading did not come, rather than the whole section vanishing. */
function readOrSay_(read, who, warn) {
  try { return read(); }
  catch (e) {
    warn.push(who + ' reading: ' + e.message);
    return '(The written reading did not come — ' + e.message + '. The figures below are complete.)';
  }
}

/* The calendar month before this one, or a month given as 'yyyy-mm'. */
function monthlyPack(month) {
  if (!/^\d{4}-\d{2}$/.test(typeof month === 'string' ? month : '')) month = null;
  return ran_('month', function () { return monthlyPack_(month); });
}
function monthlyPack_(month) {
  /* The month's own reports are due on the 1st — on the 2nd when the 1st is
     a Sunday. Closed at 8:00 on that 2nd, the month would be judged before
     they could arrive, and every rule that reads them would be lost for good
     (November 2026 is the first: 1 November is a Sunday). So on such a 2nd
     the trigger waits, and the morning close of the 3rd runs the month. */
  if (!month && monthlyWaits_(todayAddis_())) {
    return { period: prevMonthStart_(todayAddis_()).slice(0, 7),
             note: 'Waiting until tomorrow morning: the 1st was a Sunday, so the monthly reports are due today.' };
  }
  var start = month ? month + '-01' : prevMonthStart_(todayAddis_());
  var end = monthEnd_(start);
  /* the rules that are judged on the whole month, closed first so the pay
     table below includes them */
  /* If the month's own rules cannot be judged, nothing is written: a Pay
     tab without them would pay no monthly bonus and look complete. The run
     fails, says so, and the morning close tries the month again (3rd–6th). */
  var monthDoc = closeMonth_(start.slice(0, 7));
  var P = packData_(start, end);
  P.monthDoc = monthDoc;
  var facts = monthFacts_(P);
  writeDeductionsTab_(start.slice(0, 7), facts.deductions);
  writePayTab_(start.slice(0, 7), facts.pay);
  var text = askPack_(MONTH_ASK_, facts, P);
  /* the legal check of the whole month, before payroll (Legal.js) */
  var legal = null, legalText = '', legalWarn = [];
  try { legal = legalFacts_(P, 'month'); }
  catch (e) { legalWarn.push('Legal: ' + e.message); }
  if (legal) legalText = readOrSay_(function () { return legalRead_(legal, P); }, 'Legal', legalWarn);
  /* the specialists that read a whole month — the audit (Readers.js) */
  var rdm = { saved: {}, html: '' };
  try { rdm = runReaders_('month', P, facts, { legal: legal }, legalWarn); }
  catch (e) { legalWarn.push('Specialists: ' + e.message); }
  var mextra = legalSaved_(legal, legalText);
  Object.keys(rdm.saved).forEach(function (k) { mextra[k] = rdm.saved[k]; });
  var warn = savePack_('month-' + start.slice(0, 7), 'month', P, facts, text, mextra).concat(legalWarn);
  mailPack_('month', P, facts, text, null, '', null, '', legal, legalText, null, '', rdm.html);
  return { period: start.slice(0, 7), warn: warn.concat((monthDoc.errors || []).map(function (e) { return 'Month rules: ' + e; })),
           note: fmt_(facts.reporting.birr_owed || 0) + ' Birr in report deductions; Pay tab written' };
}

function previewWeekly(endDay) {
  if (!isDay_(endDay)) endDay = null;
  var end = endDay ? sundayOf_(endDay) : lastClosedSunday_();
  var P = packData_(addDays_(end, -6), end);
  P.week = end;
  Logger.log(JSON.stringify(weekFacts_(P), null, 1));
}
function previewMonthly(month) {
  if (!/^\d{4}-\d{2}$/.test(typeof month === 'string' ? month : '')) month = null;
  var start = month ? month + '-01' : prevMonthStart_(todayAddis_());
  var P = packData_(start, monthEnd_(start));
  P.monthDoc = closeMonth_(start.slice(0, 7), { write: false });
  Logger.log(JSON.stringify(monthFacts_(P), null, 1));
}

/* ------------------------------------------------------------------ *
 *  Reading the period                                                 *
 * ------------------------------------------------------------------ */

/* the 2nd of a month whose 1st was a Sunday */
function monthlyWaits_(today) {
  return today.slice(8) === '02' && dow_(addDays_(today, -1)) === 0;
}

function isDay_(v) { return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v); }

function prevMonthStart_(day) {
  var y = Number(day.slice(0, 4)), m = Number(day.slice(5, 7)) - 1;
  if (m === 0) { m = 12; y--; }
  return y + '-' + ('0' + m).slice(-2) + '-01';
}
function monthEnd_(start) {
  var y = Number(start.slice(0, 4)), m = Number(start.slice(5, 7));
  var next = m === 12 ? (y + 1) + '-01-01' : y + '-' + ('0' + (m + 1)).slice(-2) + '-01';
  return addDays_(next, -1);
}

/* A collection that cannot be read — rules not yet published, a first run
   before anything exists — is an empty list, not a failed pack. */
function tryQuery_(collection, where, orderBy) {
  try { return fsQuery_(collection, where, orderBy); }
  catch (e) { Logger.log('%s: %s', collection, e.message); return []; }
}

function packData_(start, end) {
  var schedule = loadSchedule_();
  var names = {};
  (schedule.people || []).forEach(function (p) { names[p.id] = p.en; });
  var after = addDays_(end, 1);
  return {
    start: start,
    end: end,
    schedule: schedule,
    names: names,
    ledgers: ledgersBetween_(start, after),
    /* a week before the start too — from the close of the week before that,
       Sunday 9 PM — because last week's forecasts are judged against this
       week's money. And a day past the end, because a month's own reports
       are due on the 1st of the next one. */
    filings: filedBetween_(addDays_(start, -8), addDays_(end, 2)),
    waivers: tryQuery_('waivers', [['day', 'GREATER_THAN_OR_EQUAL', start],
                                   ['day', 'LESS_THAN', after]], 'day'),
    analysis: tryQuery_('analysis', [['day', 'GREATER_THAN_OR_EQUAL', start],
                                     ['day', 'LESS_THAN', after]], 'day'),
    packs: tryQuery_('packs', [['end', 'GREATER_THAN_OR_EQUAL', start],
                               ['end', 'LESS_THAN', after]], 'end'),
    instructions: tryQuery_('instructions', [], null)
  };
}

/* the figures of one report on each day it was filed in the period — the
   last filing of a day, since a second one is a correction */
function daysOf_(P, reportId) {
  var by = {};
  P.filings.forEach(function (f) {
    if (f.report === reportId && f.day >= P.start && f.day <= P.end) by[f.day] = f.fields || {};
  });
  return Object.keys(by).sort().map(function (d) { return { day: d, v: by[d] }; });
}
/* The total over the days that answered. A day filed with the question
   blank adds nothing, and a week in which nobody answered it at all is null —
   "not reported" — rather than a total of 0 that reads as a week of nothing. */
function sumOf_(days, field) {
  var k = days.filter(function (x) { return !blank_(x.v[field]); });
  if (!k.length) return null;
  return k.reduce(function (a, x) { return a + n_(x.v[field]); }, 0);
}
function avgOf_(days, field) {
  var k = days.filter(function (x) { return x.v[field] !== '' && x.v[field] != null; });
  if (!k.length) return null;
  return Math.round(k.reduce(function (a, x) { return a + n_(x.v[field]); }, 0) / k.length * 10) / 10;
}

/* ------------------------------------------------------------------ *
 *  The arithmetic                                                     *
 * ------------------------------------------------------------------ */

/* Who owed what and what it cost, person by person, from the closed ledger.
   A charge the Chairman cancelled is shown as cancelled, not dropped — the
   line and its reason stay visible to anyone checking the figure. */
function reporting_(P) {
  var cancelled = {};
  P.waivers.forEach(function (w) { cancelled[w.day + '|' + w.report] = w; });

  var people = {}, tot = { due: 0, on_time: 0, late: 0, missing: 0 };
  /* October's pack runs from the 1st; the days before the restart of 5 Oct
     were cancelled and are not anyone's record */
  var start = prop_('LEDGER_START', '');
  P.ledgers.forEach(function (doc) {
    (doc.lines || []).forEach(function (l) {
      if (l.status === 'NOT DUE YET') return;
      if (start && P.end >= start && (l.dueDay || doc.day) < start) return;
      var p = people[l.person] || (people[l.person] = {
        id: l.person, name: l.name || P.names[l.person] || l.person,
        due: 0, on_time: 0, late: 0, missing: 0,
        birr_charged: 0, birr_cancelled: 0, birr_owed: 0, cancelled: [], which: []
      });
      p.due++; tot.due++;
      if (l.status === 'On time') { p.on_time++; tot.on_time++; }
      if (l.status === 'LATE') { p.late++; tot.late++; }
      if (l.status === 'MISSING') { p.missing++; tot.missing++; }
      /* which reports, not only how many — the first live week called two
         daily reports and a 15-day plan "three daily reports" */
      if (l.status === 'LATE' || l.status === 'MISSING') {
        /* a weekly line sits in its week's Sunday; it was due on its own day */
        p.which.push({ day: l.dueDay || doc.day, report: l.reportName || l.report, status: l.status });
      }
      p.birr_charged += l.amount || 0;
      var w = cancelled[doc.day + '|' + l.report];
      if (w && l.amount) {
        p.birr_cancelled += l.amount;
        p.cancelled.push({ day: doc.day, report: l.reportName, birr: l.amount, reason: w.reason });
      }
    });
  });
  var list = Object.keys(people).map(function (k) {
    var p = people[k];
    p.birr_owed = p.birr_charged - p.birr_cancelled;
    p.on_time_pct = p.due ? Math.round(p.on_time / p.due * 1000) / 10 : null;
    return p;
  }).sort(function (a, b) {
    return (b.missing + b.late) - (a.missing + a.late) || b.birr_owed - a.birr_owed;
  });
  return {
    reports_due: tot.due,
    on_time: tot.on_time, late: tot.late, missing: tot.missing,
    on_time_pct: tot.due ? Math.round(tot.on_time / tot.due * 1000) / 10 : null,
    birr_owed: list.reduce(function (a, p) { return a + p.birr_owed; }, 0),
    birr_cancelled: list.reduce(function (a, p) { return a + p.birr_cancelled; }, 0),
    by_person: list
  };
}

function operations_(P) {
  var amaha = daysOf_(P, 'amaha-daily');
  var wude = daysOf_(P, 'wude-daily');
  var eph = daysOf_(P, 'ephrata-daily');
  var fin = daysOf_(P, 'betty-daily');
  var elyas = daysOf_(P, 'elyas-daily');

  /* the target counts the days production was owed a report, not the days it
     sent one — a day with no report is a day the 40 m² is still missing */
  var prodDays = 0;
  P.ledgers.forEach(function (doc) {
    (doc.lines || []).forEach(function (l) { if (l.report === 'amaha-daily') prodDays++; });
  });

  var banks = fin.filter(function (x) { return x.v.bank_total !== '' && x.v.bank_total != null; })
                 .map(function (x) { return { day: x.day, birr: n_(x.v.bank_total) }; });
  var low = banks.reduce(function (m, b) { return !m || b.birr < m.birr ? b : m; }, null);

  return {
    production: {
      days_owed: prodDays,
      days_reported: amaha.length,
      m2_made: sumOf_(amaha, 'p_total'),
      m2_target: prodDays * 40,
      days_below_40: amaha.filter(function (x) { return !blank_(x.v.p_total) && n_(x.v.p_total) < 40; }).length,
      average_waste_pct: avgOf_(amaha, 'w_pct'),
      waste_limit_pct: 20,
      hours_lost: sumOf_(amaha, 'w_lost'),
      m2_rovestone: sumOf_(amaha, 'p_rove'),
      days_stopped_for_board: amaha.filter(function (x) { return yes_(x.v.b_short); }).length
    },
    quality: {
      days_reported: wude.length,
      average_pass_rate_pct: avgOf_(wude, 'i_rate'),
      pass_rate_bonus_at: 98,
      average_rework_pct: avgOf_(wude, 'r_rate'),
      defects_found: sumOf_(wude, 'd_total'),
      defects_released_to_finished_goods: sumOf_(wude, 'd_released'),
      days_pressured_to_pass: wude.filter(function (x) { return yes_(x.v.pr_any); }).length
    },
    sales: {
      days_reported: eph.length,
      leads: sumOf_(eph, 'leads_total'),
      contracts: sumOf_(eph, 'contracts'),
      contract_value: sumOf_(eph, 'contract_value'),
      collected: sumOf_(eph, 'collected_today')
    },
    money: {
      days_reported: fin.length,
      cash_in: sumOf_(fin, 'cash_in'),
      payments_value: sumOf_(fin, 'pay_value'),
      bank_first: banks.length ? banks[0] : null,
      bank_last: banks.length ? banks[banks.length - 1] : null,
      bank_lowest: low,
      days_below_6m: banks.filter(function (b) { return b.birr < 6000000; }).length,
      reserve_floor: 6000000,
      days_with_a_discrepancy: fin.filter(function (x) { return yes_(x.v.discrepancy); }).length
    },
    site: {
      days_reported: elyas.length,
      m2_installed: sumOf_(elyas, 'j_m2'),
      jobs_completed: sumOf_(elyas, 'j_done'),
      hours_lost_to_site: sumOf_(elyas, 'r_lost'),
      complaints: sumOf_(elyas, 'ac_complaints'),
      days_customer_property_damaged: elyas.filter(function (x) { return yes_(x.v.cl_damage); }).length
    }
  };
}

/* Did last week's forecasts come true? Ephrata's projection and Betelhem's
   4-week cash projection are both filed at the end of one week about the
   next; their “Week 1” is this week. The blueprint Klever was shown asks for
   forecasts within 10% — this is where that gets measured, and it can only
   be measured in code. "Last week's" is the one that counted for last week
   — sent by its Sunday 9 PM, the last one if sent twice. */
function forecasts_(P) {
  function lastBefore(reportId) {
    return filingOfWeek_(P.filings, reportId, addDays_(weekOfP_(P), -7));
  }
  function judge(projected, actual, what) {
    if (projected == null) return { what: what, projected: null, actual: actual,
                                     note: 'no forecast was filed the week before' };
    if (actual == null) return { what: what, projected: projected, actual: null,
                                 note: 'what actually came in was not reported this week' };
    var err = projected ? Math.round((actual - projected) / projected * 1000) / 10 : null;
    return { what: what, projected: projected, actual: actual, off_by_pct: err,
             within_10_pct: err !== null && Math.abs(err) <= 10 };
  }

  var ops = operations_(P);
  var proj = lastBefore('ephrata-projection');
  var projWk1 = null;
  if (proj) {
    var r = rows_((proj.fields || {}).proj_weeks)[0] || {};
    projWk1 = n_(r.tot) || (n_(r.adv) + n_(r.fin));
  }
  var cash = lastBefore('betty-cashflow');
  var cashWk1 = null;
  if (cash) {
    var c = rows_((cash.fields || {}).cf_in)[0] || {};
    cashWk1 = n_(c.adv) + n_(c.final) + n_(c.other);
  }
  return [
    judge(projWk1, ops.sales.collected, 'Ephrata’s projected collections against what was collected'),
    judge(cashWk1, ops.money.cash_in, 'Selam’s expected money in against what came in')
  ];
}

function instructionsIn_(P) {
  var issued = 0, closed = 0, onTime = 0, overdue = [];
  var endT = dayStart_(addDays_(P.end, 1)).getTime(), startT = dayStart_(P.start).getTime();
  P.instructions.forEach(function (i) {
    var who = P.names[i.to] || i.to;
    if (i.at && i.at.getTime() >= startT && i.at.getTime() < endT) issued++;
    if (i.status === 'done' && i.doneAt && i.doneAt.getTime() >= startT && i.doneAt.getTime() < endT) {
      closed++;
      if (dayOf_(i.doneAt) <= i.due) onTime++;
    }
    if (i.status === 'open' && i.due <= P.end) {
      overdue.push({ who: who, what: i.text, due: i.due,
                     days_over: Math.round((dayStart_(P.end) - dayStart_(i.due)) / 86400000) });
    }
  });
  return { issued: issued, closed: closed, closed_on_time: onTime,
           still_open_past_their_date: overdue };
}

/* What the reports themselves say, for the model — weekly and monthly
   reports carry the comment fields where people write what the figures do
   not show. */
function reportsOfCadence_(P, cadence) {
  var ids = {};
  P.schedule.reports.forEach(function (r) { if (r.cadence === cadence) ids[r.id] = r; });
  /* The weekly reports of this week: each one's last filing between the
     close of last week and this Sunday 9 PM — the week it counts for, which
     is said beside it, so a late one is this week's and one sent after 9 PM
     on Sunday is not. */
  if (cadence === 'weekly') {
    return P.schedule.reports.filter(function (r) { return ids[r.id]; }).map(function (r) {
      var f = filingOfWeek_(P.filings, r.id, weekOfP_(P));
      if (!f) return null;
      return Object.assign({ who: P.names[f.person] || f.person, report: r.en, filed: f.day },
                           weekOfFiling_(r, f.at), { values: f.fields });
    }).filter(Boolean);
  }
  var from = cadence === 'monthly' ? addDays_(P.end, -6) : P.start;
  var to = cadence === 'monthly' ? addDays_(P.end, 2) : addDays_(P.end, 1);
  return P.filings.filter(function (f) {
    return ids[f.report] && f.day >= from && f.day < to;
  }).map(function (f) {
    return { who: P.names[f.person] || f.person, report: ids[f.report].en, filed: f.day,
             values: f.fields };
  });
}

function briefsIn_(P) {
  return P.analysis.filter(function (a) { return !a.provisional; }).map(function (a) {
    var b = (a.findings || []).filter(function (f) { return f.kind === 'brief'; })[0];
    return { day: a.day, brief: b ? b.text : '' };
  });
}

function weekFacts_(P) {
  var rep = reporting_(P);
  return {
    week: dayLabel_(P.start) + ' to ' + dayLabel_(P.end),
    reporting: rep,
    operations: operations_(P),
    forecasts: forecasts_(P),
    instructions: instructionsIn_(P),
    system: {
      days_closed: P.ledgers.length,
      days_the_agents_ran: briefsIn_(P).length,
      reports_on_time_pct: rep.on_time_pct,
      target_on_time_pct: 95
    },
    weekly_reports: reportsOfCadence_(P, 'weekly'),
    daily_briefs: briefsIn_(P)
  };
}

function monthFacts_(P) {
  var rep = reporting_(P);
  return {
    month: Utilities.formatDate(dayStart_(P.start), tz_(), 'MMMM yyyy'),
    reporting: rep,
    deductions: rep.by_person.filter(function (p) { return p.birr_charged > 0; })
      .map(function (p) {
        return { name: p.name, late: p.late, missing: p.missing, charged: p.birr_charged,
                 cancelled: p.birr_cancelled, owed: p.birr_owed, cancellations: p.cancelled };
      }),
    /* everything else the letters add and take this month, and the net */
    pay: payOf_(P.ledgers, P.monthDoc || null, P.waivers, P.names),
    operations: operations_(P),
    instructions: instructionsIn_(P),
    monthly_reports: reportsOfCadence_(P, 'monthly'),
    weekly_packs: P.packs.filter(function (p) { return p.kind === 'week'; })
                         .map(function (p) { return { week_ending: p.end, text: p.text }; })
  };
}

/* ------------------------------------------------------------------ *
 *  The part that needs judgment                                       *
 * ------------------------------------------------------------------ */

var WEEK_ASK_ =
  'Write the Chairman his week in at most 180 words, short bullets. Lead with what moved '+
  'the most money or will if nobody acts. Say what repeated across days rather than what '+
  'happened once. Say whether last week’s forecasts held — a forecast that misses by more '+
  'than 10% is a forecast he cannot plan on, and whose it was matters. Name anyone who '+
  'missed or was late with the same report more than once: that is a conversation, not a '+
  'fine. Read the weekly reports’ written fields for anything the figures do not show. '+
  'Each weekly report says the week it counts for; where it also gives about_week, it '+
  'describes that earlier week — say so if you use it, never present it as this week. '+
  'If the week was ordinary, say so in one line.';

var MONTH_ASK_ =
  'Write the Chairman his month in at most 220 words, short bullets. The deductions are '+
  'already calculated and are not yours to restate or check — do not list amounts. Say '+
  'what the month shows that no single week did: a trend in production, waste, quality or '+
  'money; the people whose reporting got better or worse; which of his instructions were '+
  'carried out and which were not. Read the monthly reports for anything the figures miss.';

function askPack_(ask, facts, P) {
  if (!brain_().key) return '(No model key set — CLAUDE_KEY or GEMINI_KEY. The figures above are still complete.)';
  var prompt = [
    'You are reading a period at Klever Küche, a kitchen cabinet manufacturer in Addis',
    'Ababa. Prices are in Birr; the production target is 40 m² a day, waste may not pass',
    '20%, and the cash reserve floor is 6,000,000 Birr.',
    '',
    'Every number below was calculated in code and is correct. Do not recalculate anything',
    'and do not list numbers back. Write plainly: no adjectives doing the work of evidence,',
    'no bold headline labels. A figure that is null was not reported — it is not zero.',
    '',
    'YOUR TASK: ' + ask,
    '',
    '--- ' + P.start + ' to ' + P.end + ' ---',
    JSON.stringify(facts, null, 1)
  ].join('\n');
  return aiAsk_(prompt, 2000);
}

/* ------------------------------------------------------------------ *
 *  Output                                                             *
 * ------------------------------------------------------------------ */

function savePack_(id, kind, P, facts, text, extra) {
  try {
    var doc = {
      kind: kind, start: P.start, end: P.end, ranAt: new Date(), text: String(text || ''),
      onTimePct: facts.reporting.on_time_pct,
      owed: facts.reporting.birr_owed,
      m2: facts.operations.production.m2_made,
      m2Target: facts.operations.production.m2_target,
      collected: facts.operations.sales.collected,
      overdue: facts.instructions.still_open_past_their_date.length
    };
    Object.keys(extra || {}).forEach(function (k) { doc[k] = extra[k]; });
    fsPut_('packs/' + id, doc);
  } catch (e) {
    Logger.log('Could not save the pack: %s', e.message);   /* the email still goes */
    return ['Not saved to his page: ' + e.message];
  }
  return [];
}

/* The deductions, as a tab payroll can work from. Rewritten whole on each
   run, so running the month twice gives one table, not two. The report
   endpoint refuses any report named like this tab, so nobody outside can
   append a row to it. */
function writeDeductionsTab_(month, deductions) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var name = 'Deductions ' + month;
  var old = ss.getSheetByName(name);
  if (old) ss.deleteSheet(old);
  var sh = ss.insertSheet(name);
  var rows = [['Person', 'Late', 'Missing', 'Charged (Birr)', 'Cancelled (Birr)', 'Owed (Birr)',
               'Cancelled because']];
  deductions.forEach(function (p) {
    rows.push([cell_(p.name), p.late, p.missing, p.charged, p.cancelled, p.owed,
               cell_(p.cancellations.map(function (c) {
                 return c.day + ' ' + c.report + ': ' + c.reason;
               }).join('; '))]);
  });
  sh.getRange(1, 1, rows.length, 7).setValues(rows);
  sh.setFrozenRows(1);
}

/* The Pay tab again, from what is stored — the closed days, the closed
   month and the cancellations — with no model and no mail. Run each morning
   from the 3rd to the 6th so a cancellation made before the end of the 5th
   is in the figure payroll uses. */
function refreshPay_(month) {
  var start = month + '-01';
  var end = monthEnd_(start);
  var next = addDays_(end, 1);
  var names = {};
  (loadSchedule_().people || []).forEach(function (p) { names[p.id] = p.en; });
  var monthDoc = null;
  try { monthDoc = fsQuery_('months', [['month', 'EQUAL', month]], null)[0] || null; }
  catch (e) { monthDoc = null; }
  var pay = payOf_(ledgersBetween_(start, next), monthDoc,
                   tryQuery_('waivers', [['day', 'GREATER_THAN_OR_EQUAL', start],
                                         ['day', 'LESS_THAN', next]], 'day'), names);
  writePayTab_(month, pay);
  return pay;
}

/* The one tab payroll works from: every fine and bonus of the month, what
   was cancelled, and the net change to each person's pay. */
function writePayTab_(month, pay) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var name = 'Pay ' + month;
  var old = ss.getSheetByName(name);
  if (old) ss.deleteSheet(old);
  var sh = ss.insertSheet(name);
  var rows = [['Person', 'Late reports', 'Missing reports', 'Report fines (Birr)', 'Other fines (Birr)',
               'Bonuses (Birr)', 'Fines cancelled (Birr)', 'Bonuses cancelled (Birr)',
               'Net change to pay (Birr)', 'Warnings and suspensions', 'Cancelled because']];
  (pay || []).forEach(function (p) {
    rows.push([cell_(p.name), p.late, p.missing, p.reportFines, p.otherFines, p.bonuses,
               p.finesCancelled, p.bonusesCancelled, p.net, cell_(p.notes.join('; ')),
               cell_(p.cancelled.map(function (c) { return c.day + ' ' + c.what + ': ' + c.reason; }).join('; '))]);
  });
  sh.getRange(1, 1, rows.length, 11).setValues(rows);
  sh.setFrozenRows(1);
}

function mailPack_(kind, P, facts, text, cfo, cfoText, hr, hrText, legal, legalText, opsF, opsText, readersHtml) {
  var rep = facts.reporting, ops = facts.operations, ins = facts.instructions;
  var title = kind === 'week' ? 'Klever — the week' : 'Klever — ' + facts.month;
  var cell = 'padding:5px 8px;border-bottom:1px solid #e4e7e3';

  var html =
    '<div style="font-family:Helvetica,Arial,sans-serif;max-width:680px;color:#141b1a">' +
    '<h2 style="font-size:18px;margin:0 0 2px">' + esc_(title) + '</h2>' +
    '<div style="color:#66716d;font-size:13px;margin-bottom:18px">' +
      esc_(dayLabel_(P.start)) + ' to ' + esc_(dayLabel_(P.end)) + '</div>' +
    '<table width="100%" cellpadding="0" cellspacing="6" style="margin:0 -6px 18px;font-family:monospace"><tr>' +
      tile_('ON TIME', rep.on_time_pct == null ? '—' : rep.on_time_pct + '%') +
      tile_('M² MADE', (ops.production.m2_made == null ? '—' : fmt_(ops.production.m2_made)) + ' / ' + fmt_(ops.production.m2_target)) +
      tile_('COLLECTED', ops.sales.collected == null ? '—' : fmt_(ops.sales.collected)) +
    '</tr></table>' +
    '<div style="background:#f3f4f1;border-left:3px solid #0f5c54;padding:14px 16px;' +
      'margin-bottom:24px;font-size:14px;line-height:1.65;white-space:pre-wrap">' + esc_(text) + '</div>';

  /* Each reader's own part. One that throws loses its part, says so, and
     takes nothing else with it: the summary always goes. */
  var part = function (who, make) {
    try { return make(); }
    catch (e) {
      Logger.log('%s part of the email: %s', who, e.message);
      return '<p style="font-size:12.5px;color:#8f3020;margin:0 0 18px">' + esc_(who) +
             ': this part could not be drawn (' + esc_(e.message) + '). The rest is complete.</p>';
    }
  };
  /* the week's money, read by the CFO (Cfo.js) */
  if (kind === 'week' && cfo) html += part('CFO', function () { return cfoMailHtml_(cfo, cfoText); });
  /* the week from plan to site, read by operations (Ops.js) */
  if (kind === 'week' && opsF) html += part('Operations', function () { return opsMailHtml_(opsF, opsText); });
  /* the week's people, read by HR (Hr.js) */
  if (kind === 'week' && hr) html += part('HR', function () { return hrMailHtml_(hr, hrText); });
  /* the deductions and the letters against the labour law (Legal.js) */
  if (legal) html += part('Legal check', function () { return legalMailHtml_(legal, legalText); });
  /* the specialists, each already drawn alone (Readers.js) */
  if (readersHtml) html += readersHtml;

  /* the forecasts, judged in code */
  if (facts.forecasts) {
    html += '<h3 style="font-size:13.5px;margin:0 0 6px;color:#0f5c54">Did last week’s forecasts come true</h3>' +
            '<table width="100%" cellpadding="0" cellspacing="0" style="font-size:12.5px;margin-bottom:22px">';
    facts.forecasts.forEach(function (f) {
      html += '<tr><td style="' + cell + '">' + esc_(f.what) + '</td><td align="right" style="' + cell +
              ';font-family:monospace;white-space:nowrap">' +
              (f.projected == null ? 'none filed'
                : fmt_(f.projected) + ' → ' + fmt_(f.actual) +
                  (f.off_by_pct == null ? '' : ' (' + (f.off_by_pct > 0 ? '+' : '') + f.off_by_pct + '%)')) +
              '</td></tr>';
    });
    html += '</table>';
  }

  if (ins.still_open_past_their_date.length) {
    html += '<h3 style="font-size:13.5px;margin:0 0 6px;color:#8f3020">Your instructions, past their date</h3>' +
            '<table width="100%" cellpadding="0" cellspacing="0" style="font-size:12.5px;margin-bottom:22px">';
    ins.still_open_past_their_date.forEach(function (i) {
      html += '<tr><td style="' + cell + '"><b>' + esc_(i.who) + '</b></td><td style="' + cell + '">' +
              esc_(i.what) + '</td><td style="' + cell + ';color:#8f3020;font-family:monospace;' +
              'white-space:nowrap">' + i.days_over + ' days over</td></tr>';
    });
    html += '</table>';
  }

  /* who filed — or, for the month, what each person owes */
  var rows = kind === 'month' ? facts.deductions : rep.by_person.filter(function (p) {
    return p.late || p.missing;
  });
  if (rows.length) {
    html += '<h3 style="font-size:13.5px;margin:0 0 6px;color:#0f5c54">' +
            (kind === 'month' ? 'Deductions for payroll' : 'Late and missing, by person') + '</h3>' +
            '<table width="100%" cellpadding="0" cellspacing="0" style="font-size:12.5px">' +
            '<tr style="color:#66716d;font-size:10.5px;letter-spacing:.08em;text-align:left">' +
            '<th style="padding:0 8px 5px">PERSON</th><th style="padding:0 8px 5px">LATE</th>' +
            '<th style="padding:0 8px 5px">MISSING</th>' +
            (kind === 'month' ? '<th style="padding:0 8px 5px;text-align:right">CANCELLED</th>' : '') +
            '<th style="padding:0 8px 5px;text-align:right">OWED</th></tr>';
    rows.forEach(function (p) {
      html += '<tr><td style="' + cell + '">' + esc_(p.name) + '</td><td style="' + cell + '">' + p.late +
              '</td><td style="' + cell + '">' + p.missing + '</td>' +
              (kind === 'month' ? '<td align="right" style="' + cell + ';font-family:monospace">' +
                                  (p.cancelled ? fmt_(p.cancelled) : '—') + '</td>' : '') +
              '<td align="right" style="' + cell + ';font-family:monospace">' +
              fmt_(kind === 'month' ? p.owed : p.birr_owed) + '</td></tr>';
    });
    html += '<tr><td colspan="' + (kind === 'month' ? 4 : 3) + '" style="padding:7px 8px;font-weight:bold">Total</td>' +
            '<td align="right" style="padding:7px 8px;font-family:monospace;font-weight:bold">' +
            fmt_(rep.birr_owed) + '</td></tr></table>';
    if (kind === 'month') {
      html += '<p style="font-size:12px;color:#66716d;margin:8px 0 0">The same table is in the Sheet, ' +
              'tab “Deductions ' + esc_(P.start.slice(0, 7)) + '”.</p>';
    }
  }

  /* the month's pay: every fine and bonus in the letters, not only reports */
  if (kind === 'month' && facts.pay && facts.pay.length) {
    html += '<h3 style="font-size:13.5px;margin:24px 0 6px;color:#0f5c54">Pay for the month — fines and bonuses</h3>' +
            '<table width="100%" cellpadding="0" cellspacing="0" style="font-size:12.5px">' +
            '<tr style="color:#66716d;font-size:10.5px;letter-spacing:.08em;text-align:left">' +
            '<th style="padding:0 8px 5px">PERSON</th><th style="padding:0 8px 5px;text-align:right">FINES</th>' +
            '<th style="padding:0 8px 5px;text-align:right">BONUSES</th>' +
            '<th style="padding:0 8px 5px;text-align:right">NET</th></tr>';
    facts.pay.forEach(function (p) {
      var fines = p.reportFines + p.otherFines - p.finesCancelled;
      var bon = p.bonuses - p.bonusesCancelled;
      html += '<tr><td style="' + cell + '">' + esc_(p.name) +
              (p.notes.length ? '<div style="color:#8f3020;font-size:11.5px">' + esc_(p.notes.join('; ')) + '</div>' : '') +
              '</td><td align="right" style="' + cell + ';font-family:monospace;color:#8f3020">' +
              (fines ? '−' + fmt_(fines) : '—') + '</td><td align="right" style="' + cell +
              ';font-family:monospace;color:#4a6b1f">' + (bon ? '+' + fmt_(bon) : '—') +
              '</td><td align="right" style="' + cell + ';font-family:monospace;font-weight:bold">' +
              (p.net > 0 ? '+' : p.net < 0 ? '−' : '') + fmt_(Math.abs(p.net)) + '</td></tr>';
    });
    html += '</table><p style="font-size:12px;color:#66716d;margin:8px 0 0">For payroll: the Sheet, ' +
            'tab “Pay ' + esc_(P.start.slice(0, 7)) + '”, with every cancellation and its reason. ' +
            'Anything you cancel on your page before the end of the 5th is taken off; the tab is ' +
            'final on the morning of the 6th.</p>';
    if (P.monthDoc && P.monthDoc.errors && P.monthDoc.errors.length) {
      html += '<p style="font-size:12px;color:#8f3020">Rules that could not be judged this month: ' +
              esc_(P.monthDoc.errors.join('; ')) + '</p>';
    }
  }

  html += '<p style="color:#66716d;font-size:11.5px;margin-top:28px;line-height:1.6">' +
          'Every figure here was calculated in code from the closed daily ledgers and the ' +
          'reports as filed. The model wrote only the reading at the top. Penalties are each ' +
          'person’s own letter; cancelled charges are shown, with the reason you gave. ' +
          esc_(brainLine_()) + '</p></div>';

  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    subject: title + (kind === 'week' ? ' to ' + Utilities.formatDate(dayStart_(P.end), tz_(), 'EEE d MMM') : '') +
             ' — ' + (rep.on_time_pct == null ? 'no reports' : rep.on_time_pct + '% on time') +
             (kind === 'month' ? ' — ' + fmt_(rep.birr_owed) + ' Birr in deductions' : ''),
    htmlBody: html
  });
}
