/* Klever — the week and the month.

   WHY THESE EXIST
   The daily agents read the daily reports. Nobody read the weekly ones: six
   people file thirteen weekly reports and two monthly ones, and until now
   each landed in a channel and a Sheet tab and went no further. Nor did
   anything add a month of penalties into the figure that actually comes off
   a person's pay — the daily ledger said what each day cost and stopped.

   So, twice:

     weeklyPack   Sunday morning, on the seven days just ended. Who filed and
                  who did not, the week's production, quality, money and
                  sales, whether last week's forecasts came true, what the
                  Chairman asked for and got — then the weekly reports and the
                  week's daily briefs for the model to read.
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

/* The week ending yesterday — on a Sunday run, Sunday to Saturday. */
function weeklyPack(endDay) {
  var end = endDay || addDays_(todayAddis_(), -1);
  var P = packData_(addDays_(end, -6), end);
  var facts = weekFacts_(P);
  var text = askPack_(WEEK_ASK_, facts, P);
  savePack_('week-' + end, 'week', P, facts, text);
  mailPack_('week', P, facts, text);
}

/* The calendar month before this one, or a month given as 'yyyy-mm'. */
function monthlyPack(month) {
  var start = month ? month + '-01' : prevMonthStart_(todayAddis_());
  var end = monthEnd_(start);
  var P = packData_(start, end);
  var facts = monthFacts_(P);
  writeDeductionsTab_(start.slice(0, 7), facts.deductions);
  var text = askPack_(MONTH_ASK_, facts, P);
  savePack_('month-' + start.slice(0, 7), 'month', P, facts, text);
  mailPack_('month', P, facts, text);
}

function previewWeekly(endDay) {
  var end = endDay || addDays_(todayAddis_(), -1);
  Logger.log(JSON.stringify(weekFacts_(packData_(addDays_(end, -6), end)), null, 1));
}
function previewMonthly(month) {
  var start = month ? month + '-01' : prevMonthStart_(todayAddis_());
  Logger.log(JSON.stringify(monthFacts_(packData_(start, monthEnd_(start))), null, 1));
}

/* ------------------------------------------------------------------ *
 *  Reading the period                                                 *
 * ------------------------------------------------------------------ */

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
    /* a week before the start too: last week's forecasts are judged against
       this week's money. And a day past the end, because a month's own
       reports are due on the 1st of the next one. */
    filings: filedBetween_(addDays_(start, -7), addDays_(end, 2)),
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
function sumOf_(days, field) {
  return days.reduce(function (a, x) { return a + n_(x.v[field]); }, 0);
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
  P.ledgers.forEach(function (doc) {
    (doc.lines || []).forEach(function (l) {
      if (l.status === 'NOT DUE YET') return;
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
        p.which.push({ day: doc.day, report: l.reportName || l.report, status: l.status });
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
      days_below_40: amaha.filter(function (x) { return n_(x.v.p_total) < 40; }).length,
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
   be measured in code. */
function forecasts_(P) {
  function lastBefore(reportId) {
    var hit = null;
    P.filings.forEach(function (f) {
      if (f.report === reportId && f.day < P.start && f.day >= addDays_(P.start, -7)) hit = f;
    });
    return hit;
  }
  function judge(projected, actual, what) {
    if (projected == null) return { what: what, projected: null, actual: actual,
                                     note: 'no forecast was filed the week before' };
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
    judge(cashWk1, ops.money.cash_in, 'Betelhem’s expected money in against what came in')
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

function savePack_(id, kind, P, facts, text) {
  try {
    fsPut_('packs/' + id, {
      kind: kind, start: P.start, end: P.end, ranAt: new Date(), text: String(text || ''),
      onTimePct: facts.reporting.on_time_pct,
      owed: facts.reporting.birr_owed,
      m2: facts.operations.production.m2_made,
      m2Target: facts.operations.production.m2_target,
      collected: facts.operations.sales.collected,
      overdue: facts.instructions.still_open_past_their_date.length
    });
  } catch (e) {
    Logger.log('Could not save the pack: %s', e.message);   /* the email still goes */
  }
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
    rows.push([p.name, p.late, p.missing, p.charged, p.cancelled, p.owed,
               p.cancellations.map(function (c) {
                 return c.day + ' ' + c.report + ': ' + c.reason;
               }).join('; ')]);
  });
  sh.getRange(1, 1, rows.length, 7).setValues(rows);
  sh.setFrozenRows(1);
}

function mailPack_(kind, P, facts, text) {
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
      tile_('M² MADE', fmt_(ops.production.m2_made) + ' / ' + fmt_(ops.production.m2_target)) +
      tile_('COLLECTED', fmt_(ops.sales.collected)) +
    '</tr></table>' +
    '<div style="background:#f3f4f1;border-left:3px solid #0f5c54;padding:14px 16px;' +
      'margin-bottom:24px;font-size:14px;line-height:1.65;white-space:pre-wrap">' + esc_(text) + '</div>';

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
