/* Klever — the payroll, made by the HR agent.

   THE ASK (the user, 14 Oct 2026): "since we have every payment, can the
   HR agent do the payroll here" — and then, the same day, Klever's own
   payroll sheet ("KLEVER PAYROLL SEPTEMBER Final 2026"): "can you use
   this". So it is made the way that sheet makes it, column for column:

     basic       the monthly basic salary, GROSS ÷ 30 × the days employed
                 (30 for a whole month, whatever its length)
     overtime    hours × 1.5 (day) / 1.75 (night) / 2 (rest day) / 2.5
                 (public holiday) × salary ÷ 208 — the labour law's rates,
                 which the sheet's headers give (its formula multiplied by
                 1.25 and 1.5; overtime was 0 that month)
     transport   600 ÷ 30 × the days employed, not taxed
     bonuses     the rulebook's bonuses and commissions (payOf_), taxed
     gross pay   basic + overtime + transport + bonuses
     absence     salary ÷ 30 for each day absent without permission — the
                 days come from the ledger's own lines for that fine, so a
                 fine the Chairman cancels gives the day back as well
     taxable     gross pay − transport − absence
     income tax  0 / 15 / 20 / 25 / 30 / 35 %, less 0 / 300 / 500 / 850 /
                 1,350 / 2,050 — the sheet's own brackets
     pension     7 % of basic from the person, 11 % from Klever (not for
                 anyone marked "no" in the tab — the sheet has one)
     cost sharing, loan, salary advance, court/family — what Selam enters
                 on her page by the 5th (/payadd/{month})
     penalty     the month's fines (cancellations out) and what was carried
                 from last month; no more than a third of the basic earned
                 (basic − absence) is taken — the user's word, 14 Oct; the
                 rest is carried to the next month
     net         gross pay − absence − (tax + pension 7 % + the four + penalty)

   WHO: everyone on the site who is Klever's (not Rovestone, Meri or Lemi
   Kura), and anyone the Sheet tab "Staff Wages and Letters" lists who is
   not on the site (the Chairman's own row and the others on the payroll
   sheet). The tab holds the gross, the bank account and the pension
   yes/no; it is never in this public repository. Someone with no salary
   there is listed, not paid; their fines wait.

   WHEN: the watch, once an hour: this month so far, and last month too
   until the 5th, while a line can still be cancelled and Selam can still
   enter what she must. From the 6th last month is made final — once its
   month-end lines are in (the close on the 2nd) — and the Chairman is told
   it is ready. He approves it on his page; the watch then tells Selam,
   whose page shows it with the Excel she pays from. /payroll/{yyyy-mm} is
   read by the Chairman, the ledger, and Selam once approved
   (firestore.rules); the Sheet gets the tab "Payroll yyyy-mm" when final.

   Arithmetic only, here, in code; no model.
   previewPayroll() logs this month's figures and writes nothing.          */

var PR_FIRST_ = '2026-10';              /* the first month paid from the site */
var PR_MONTH_DAYS_ = 30;                /* a month is 30 days, as on the sheet */
var PR_HOURS_ = 208;                    /* hours in a month, for overtime */
var PR_TRANSPORT_ = 600;                /* transport allowance, a month */
var PR_OT_ = { ot15: 1.5, ot175: 1.75, ot2: 2, ot25: 2.5 };
var PR_TAX_ = [[2000, 0, 0], [4000, 0.15, 300], [7000, 0.20, 500], [10000, 0.25, 850], [14000, 0.30, 1350], [Infinity, 0.35, 2050]];
var PR_FINAL_DAY_ = 6;                  /* last month's lines are final at the end of the 5th */
var PR_ABSENT_RULE_ = 'worker-absence-no-notice';
var PR_PAYER_ = 'betty';                /* Selam, the Finance Officer */
var PR_RUN_KEY_ = 'PAYROLL_RUN';
var PR_ADD_KEYS_ = ['ot15', 'ot175', 'ot2', 'ot25', 'cost', 'loan', 'advance', 'court'];

function prR2_(x) { return Math.round(x * 100) / 100; }

/* income tax on a month's taxable pay */
function prTax_(r) {
  for (var i = 0; i < PR_TAX_.length; i++) {
    if (r <= PR_TAX_[i][0]) return prR2_(Math.max(0, r * PR_TAX_[i][1] - PR_TAX_[i][2]));
  }
  return 0;
}

/* days from a to b, both yyyy-mm-dd, inclusive */
function prSpan_(a, b) {
  var t = function (d) { return Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10))); };
  return Math.round((t(b) - t(a)) / 86400000) + 1;
}

/* The days of the month someone was employed, on the sheet's 30-day
   month: 30 for all of it; otherwise the calendar days, at most 30. */
function prDaysIn_(month, started, left) {
  var start = month + '-01', end = monthEnd_(start);
  var from = started && started > start ? started : start;
  var to = left && left < end ? left : end;
  if (to < from) return 0;
  if (from === start && to === end) return PR_MONTH_DAYS_;
  return Math.min(PR_MONTH_DAYS_, prSpan_(from, to));
}

/* The days each person was charged for an absence without permission,
   cancellations out — one day however many rows named them that day. */
function prAbsentDays_(ledgers, waivers) {
  var off = {};
  (waivers || []).forEach(function (w) { off[w.day + '|' + w.report] = true; });
  var out = {};
  (ledgers || []).forEach(function (doc) {
    (doc.ruleLines || []).forEach(function (l) {
      if (l.rule !== PR_ABSENT_RULE_ || !(l.amount > 0) || off[doc.day + '|' + l.report]) return;
      var days = out[l.person] || (out[l.person] = []);
      if (days.indexOf(doc.day) === -1) days.push(doc.day);
    });
  });
  return out;
}

/* What Selam entered for one person, as numbers (never below 0) */
function prAdds_(x) {
  var out = {};
  PR_ADD_KEYS_.forEach(function (k) {
    var v = x && x[k] != null && x[k] !== '' ? Number(String(x[k]).replace(/[,\s]/g, '')) : 0;
    out[k] = isFinite(v) && v > 0 ? prR2_(Math.min(v, k.indexOf('ot') === 0 ? 400 : 10000000)) : 0;
  });
  return out;
}

/* One person's month, the sheet's columns. Pure.
   o = { gross, days, absentDays, bonuses, owed (fines + carried), pension, add } */
function prLine_(o) {
  var g = o.gross, a = prAdds_(o.add);
  var r = {};
  r.basic = prR2_(g / PR_MONTH_DAYS_ * o.days);
  r.overtime = prR2_((a.ot15 * PR_OT_.ot15 + a.ot175 * PR_OT_.ot175 + a.ot2 * PR_OT_.ot2 + a.ot25 * PR_OT_.ot25) * g / PR_HOURS_);
  r.transport = prR2_(PR_TRANSPORT_ / PR_MONTH_DAYS_ * o.days);
  r.bonuses = prR2_(o.bonuses || 0);
  r.grossPay = prR2_(r.basic + r.overtime + r.transport + r.bonuses);
  r.absentAmount = prR2_(Math.min(r.basic, g / PR_MONTH_DAYS_ * (o.absentDays || 0)));
  r.taxable = prR2_(r.grossPay - r.transport - r.absentAmount);
  r.tax = prTax_(r.taxable);
  r.pension7 = o.pension === false ? 0 : prR2_(r.basic * 0.07);
  r.pension11 = o.pension === false ? 0 : prR2_(r.basic * 0.11);
  r.cost = a.cost; r.loan = a.loan; r.advance = a.advance; r.court = a.court;
  r.ot = { ot15: a.ot15, ot175: a.ot175, ot2: a.ot2, ot25: a.ot25 };
  r.cap = Math.max(0, Math.floor((r.basic - r.absentAmount) / 3));
  var owed = prR2_(o.owed || 0);
  r.penalty = prR2_(Math.max(0, Math.min(owed, r.cap)));
  r.carryOut = prR2_(owed - r.penalty);
  r.deductions = prR2_(r.tax + r.pension7 + r.cost + r.loan + r.advance + r.court + r.penalty);
  r.net = prR2_(r.grossPay - r.deductions - r.absentAmount);
  return r;
}

var PR_SUMS_ = ['basic', 'overtime', 'transport', 'bonuses', 'grossPay', 'absentAmount', 'taxable', 'tax', 'pension7',
                'pension11', 'cost', 'loan', 'advance', 'court', 'penalty', 'deductions', 'net'];

/* The month, person by person. Pure: everything it reads is handed in.
   o = { month, staff: [{id, name, role, wage (gross), started, left, noLetter,
         account, pension, payOnly}], pay: payOf_ rows, absent: {id: [days]},
         carry: {id: Birr}, adds: {id: {ot15, …, court}} }                   */
function prBuild_(o) {
  var payBy = {};
  (o.pay || []).forEach(function (p) { payBy[p.id] = p; });
  var rows = [];
  var tot = { people: 0, noWage: 0, carryOut: 0 };
  PR_SUMS_.forEach(function (k) { tot[k] = 0; });
  (o.staff || []).forEach(function (s) {
    var days = prDaysIn_(o.month, s.started, s.left);
    var carryIn = prR2_((o.carry && o.carry[s.id]) || 0);
    /* bonuses earned while no salary was on record, kept for the month
       there is one — the fines waited, the bonuses were dropped (the bug
       hunt, 15 Oct 2026) */
    var bonusIn = prR2_((o.carryBonus && o.carryBonus[s.id]) || 0);
    if (days <= 0 && !carryIn && !bonusIn) return;
    var p = payBy[s.id] || {};
    var bonuses = prR2_((p.bonuses || 0) - (p.bonusesCancelled || 0) + bonusIn);
    var fines = prR2_((p.reportFines || 0) + (p.otherFines || 0) - (p.finesCancelled || 0));
    var absentOn = ((o.absent && o.absent[s.id]) || []).filter(function (d) {
      return (!s.started || d >= s.started) && (!s.left || d <= s.left);
    }).sort();
    var r = { id: s.id, name: s.name, role: s.role || '', noLetter: !!s.noLetter, payOnly: !!s.payOnly, startGuessed: !!s.startGuessed,
              account: s.account || '', pension: s.pension !== false, days: days,
              absentDays: absentOn.length, absentOn: absentOn, fines: fines, carryIn: carryIn };
    if (!(s.wage > 0)) {
      /* nothing to pay from, so nothing taken: the fines wait */
      r.noWage = true; r.gross = null; r.bonuses = bonuses; r.penalty = 0; r.net = null;
      r.carryOut = prR2_(carryIn + fines);
      r.bonusCarryOut = bonuses;
      tot.noWage++;
    } else {
      r.gross = s.wage;
      var l = prLine_({ gross: s.wage, days: days, absentDays: absentOn.length, bonuses: bonuses,
                        owed: carryIn + fines, pension: s.pension !== false, add: o.adds && o.adds[s.id] });
      Object.keys(l).forEach(function (k) { r[k] = l[k]; });
      tot.people++;
      PR_SUMS_.forEach(function (k) { tot[k] += r[k]; });
    }
    tot.carryOut += r.carryOut;
    rows.push(r);
  });
  Object.keys(tot).forEach(function (k) { tot[k] = prR2_(tot[k]); });
  /* what the month costs Klever: pay earned + Klever's pension */
  tot.cost11 = prR2_(tot.grossPay - tot.absentAmount + tot.pension11);
  return { rows: rows, totals: tot };
}

/* ---------------- reading and writing ---------------- */

function prPrevMonth_(month) { return prevMonthStart_(month + '-01').slice(0, 7); }

/* Klever's staff on the site (not Rovestone, Meri or Lemi Kura), then the
   people the tab lists who are not on the site — all with what the tab says
   of each. Read only: the morning chores keep the tab (Legal.js). */
function prStaff_(schedule) {
  var byId = legalStaffRead_(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LEGAL_TAB_));
  var noOwn = {}, onSite = {};
  (typeof HR_NO_OWN_LETTER_ !== 'undefined' ? HR_NO_OWN_LETTER_ : []).forEach(function (x) { noOwn[x.id] = true; });
  (schedule && schedule.people || []).forEach(function (p) { onSite[p.id] = true; });
  var out = ((schedule && schedule.people) || []).filter(function (p) { return !p.company; }).map(function (p) {
    var w = byId[p.id] || {};
    return { id: p.id, name: p.en, role: p.roleEn || '', wage: w.wage || null,
             started: w.started || (isDay_(p.from) ? p.from : null), left: w.left || null,
             /* no hiring day in the Sheet: the day reports start counting is used, and said (bug hunt, 15 Oct 2026) */
             startGuessed: !w.started && isDay_(p.from) && p.from.slice(0, 7) >= PR_FIRST_,
             noLetter: !!(p.noLetter || noOwn[p.id]), account: w.account || '', pension: w.pension !== false };
  });
  Object.keys(byId).forEach(function (id) {
    var w = byId[id];
    if (onSite[id] || !w.wage) return;
    out.push({ id: id, name: w.name || id, role: w.role || '', wage: w.wage, started: w.started || null,
               left: w.left || null, account: w.account || '', pension: w.pension !== false, payOnly: true });
  });
  return out;
}

/* What Selam entered for the month: { id: {ot15, …} } */
function prAddsOf_(month) {
  var d = null;
  try { d = fsGet_('payadd/' + month); } catch (e) { d = null; }
  return (d && d.items) || {};
}

/* Build one month, and write it unless `dry`. mode 'sofar' or 'final'. */
function payrollRun_(month, mode, dry, opt) {
  opt = opt || {};
  var start = month + '-01', end = monthEnd_(start), next = addDays_(end, 1);
  var schedule = loadSchedule_();
  var names = {};
  (schedule.people || []).forEach(function (p) { names[p.id] = p.en; });
  var ledgers = ledgersBetween_(start, next);
  var monthDoc = tryQuery_('months', [['month', 'EQUAL', month]], null)[0] || null;
  var waivers = fsQuery_('waivers', [['day', 'GREATER_THAN_OR_EQUAL', start], ['day', 'LESS_THAN', next]], 'day');
  var carry = {}, carryBonus = {}, prevM = prPrevMonth_(month), prev = null;
  if (month > PR_FIRST_) {
    try { prev = fsGet_('payroll/' + prevM); } catch (e) { prev = null; }
    ((prev && prev.rows) || []).forEach(function (r) {
      if (r.carryOut > 0) carry[r.id] = r.carryOut;
      if (r.bonusCarryOut > 0) carryBonus[r.id] = r.bonusCarryOut;
    });
  }
  var staff = prStaff_(schedule);
  var b = prBuild_({
    month: month, staff: staff,
    pay: payOf_(ledgers, monthDoc, waivers, names),
    absent: prAbsentDays_(ledgers, waivers), carry: carry, carryBonus: carryBonus, adds: prAddsOf_(month)
  });
  var days = ledgers.map(function (l) { return l.day; }).sort();
  var doc = {
    month: month, status: mode === 'final' ? 'ready' : 'sofar', final: mode === 'final',
    upTo: days.length ? days[days.length - 1] : null, monthClosed: !!monthDoc,
    carryFrom: prev ? prevM : null, builtAt: new Date(), rows: b.rows, totals: b.totals
  };
  if (dry) return doc;
  fsPut_('payroll/' + month, doc);
  if (mode === 'final') {
    try { prSheet_(doc); } catch (e) { Logger.log('payroll tab: %s', e.message); }
    if (!opt.quiet) try {
      pushTo_('chairman', 'Payroll ' + prMonthName_(month) + ' — ready to approve',
              doc.totals.people + ' people · ' + fmt_(Math.round(doc.totals.net)) + ' Birr net to pay' +
              ' (tax ' + fmt_(Math.round(doc.totals.tax)) + ', pension ' + fmt_(Math.round(doc.totals.pension7 + doc.totals.pension11)) + ')' +
              '. Open your page to approve it. · ደመወዝ ለማጽደቅ ዝግጁ ነው።', 'payroll', 'chairman.html');
    } catch (e) { Logger.log('payroll push: %s', e.message); }
  }
  return doc;
}

/* "October 2026" */
function prMonthName_(month) {
  return Utilities.formatDate(new Date(month + '-15T12:00:00' + ADDIS_), tz_(), 'MMMM yyyy');
}

/* The month in the Sheet, in the payroll sheet's own columns. */
function prSheet_(doc) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var name = 'Payroll ' + doc.month;
  var old = ss.getSheetByName(name);
  if (old) ss.deleteSheet(old);
  var sh = ss.insertSheet(name);
  var head = ['S.N', 'Name', 'Account No.', 'Basic salary, gross (month)', 'Days', 'Basic salary', 'OT hours ×1.5', 'OT hours ×1.75',
              'OT hours ×2', 'OT hours ×2.5', 'Overtime amount', 'Transport allowance', 'Bonuses & commissions', 'Absence days',
              'Gross salary', 'Absence amount', 'Gross salary taxable', 'Income tax', 'Pension 7%', 'Pension 11% (Klever)',
              'Cost sharing', 'Loan', 'Salary advance', 'Court / family', 'Penalty', 'Total deductions', 'Net pay',
              'Penalty carried to next month', 'Notes'];
  var rows = [['Klever Addis Trade PLC — permanent employees payroll — ' + prMonthName_(doc.month)], head];
  doc.rows.forEach(function (r, i) {
    if (r.noWage) {
      rows.push([i + 1, cell_(r.name), cell_(r.account), '', r.days, '', '', '', '', '', '', '', r.bonuses, r.absentDays,
                 '', '', '', '', '', '', '', '', '', '', 0, '', '', r.carryOut, 'No salary on record — not paid; penalty carried']);
      return;
    }
    rows.push([i + 1, cell_(r.name), cell_(r.account), r.gross, r.days, r.basic, r.ot.ot15, r.ot.ot175, r.ot.ot2, r.ot.ot25,
               r.overtime, r.transport, r.bonuses, r.absentDays, r.grossPay, r.absentAmount, r.taxable, r.tax, r.pension7,
               r.pension11, r.cost, r.loan, r.advance, r.court, r.penalty, r.deductions, r.net, r.carryOut,
               r.carryOut ? 'Penalty over a third of the basic earned: the rest comes off next month' : '']);
  });
  var t = doc.totals;
  rows.push(['', 'Total, ' + t.people + ' people paid', '', '', '', t.basic, '', '', '', '', t.overtime, t.transport, t.bonuses, '',
             t.grossPay, t.absentAmount, t.taxable, t.tax, t.pension7, t.pension11, t.cost, t.loan, t.advance, t.court,
             t.penalty, t.deductions, t.net, t.carryOut, '']);
  rows = rows.map(function (r) { while (r.length < head.length) r.push(''); return r; });
  sh.getRange(1, 1, rows.length, head.length).setValues(rows);
  sh.setFrozenRows(2);
}

/* Selam's page asks what to add for a month while it is open: the
   document is made here, with the people she may name; she changes only
   its items (firestore.rules). */
function prOpenAdds_(month, staff) {
  var people = staff.filter(function (s) { return s.wage > 0; }).map(function (s) { return { id: s.id, name: s.name }; });
  var d = null;
  try { d = fsGet_('payadd/' + month); } catch (e) { d = null; }
  if (!d) fsPut_('payadd/' + month, { month: month, open: true, people: people, items: {}, by: 'ledger', at: new Date() });
  else if (JSON.stringify(d.people || []) !== JSON.stringify(people) || d.open !== true) fsUpdate_('payadd/' + month, { people: people, open: true });
}
function prCloseAdds_(month) {
  try { if (fsGet_('payadd/' + month)) fsUpdate_('payadd/' + month, { open: false }); }
  catch (e) { Logger.log('payadd close: %s', e.message); }
}

/* From the watch. Selam is told of an approved month at once; the months
   themselves are built once an hour. */
function payrollWatch_() {
  prTellPayer_();
  var props = PropertiesService.getScriptProperties();
  var last = Number(props.getProperty(PR_RUN_KEY_) || 0);
  if (Date.now() - last < 3600 * 1000) return;
  props.setProperty(PR_RUN_KEY_, String(Date.now()));
  var today = todayAddis_();
  var month = today.slice(0, 7), prevM = prPrevMonth_(month);
  var staff = prStaff_(loadSchedule_());
  if (prevM >= PR_FIRST_) {
    var doc = null;
    try { doc = fsGet_('payroll/' + prevM); } catch (e) { doc = null; }
    if (doc && doc.status === 'ready') {
      /* final, not yet approved: a wage, an account or a start date he
         puts right in the Sheet tab reaches it — built again, quietly, when
         the figures differ (the bug hunt, 15 Oct 2026: a final month could
         never be corrected before approval). Approved, it is never touched. */
      var again = payrollRun_(prevM, 'final', true);
      if (JSON.stringify([again.rows, again.totals]) !== JSON.stringify([doc.rows, doc.totals])) {
        payrollRun_(prevM, 'final', false, { quiet: true });
      }
    } else if (!doc || doc.status === 'sofar') {
      var closed = tryQuery_('months', [['month', 'EQUAL', prevM]], null).length > 0;
      if (Number(today.slice(8)) >= PR_FINAL_DAY_ && closed) {
        /* what Selam entered is shut before it is read */
        prCloseAdds_(prevM);
        payrollRun_(prevM, 'final');
      } else {
        prOpenAdds_(prevM, staff);
        payrollRun_(prevM, 'sofar');
      }
    }
  }
  if (month >= PR_FIRST_) {
    prOpenAdds_(month, staff);
    payrollRun_(month, 'sofar');
  }
}

/* An approved month Selam has not been told of: told, once. */
function prTellPayer_() {
  tryQuery_('payroll', [['status', 'EQUAL', 'approved']], null).forEach(function (d) {
    if (d.sentAt) return;
    var t = d.totals || {};
    try {
      pushTo_(PR_PAYER_, 'Payroll to pay — ' + prMonthName_(d.month),
              'Approved by the Chairman: ' + (t.people || 0) + ' people · ' + fmt_(Math.round(t.net || 0)) +
              ' Birr net. Open your page for the list and the Excel. · የ' + d.month + ' ደመወዝ ጸድቋል — ዝርዝሩ በገጽዎ ላይ ነው።',
              'payroll', '');
    } catch (e) { Logger.log('payroll push to Selam: %s', e.message); }
    fsUpdate_('payroll/' + d._id, { sentAt: new Date() });
  });
}

/* For Ask: this month so far and last month, short. */
function prAskFacts_() {
  var today = todayAddis_();
  return tryQuery_('payroll', [['month', 'GREATER_THAN_OR_EQUAL', prPrevMonth_(today.slice(0, 7))]], 'month').map(function (d) {
    return {
      month: d.month,
      status: d.status === 'sofar' ? 'so far, not final (up to ' + (d.upTo || '—') + ')'
            : d.status === 'ready' ? 'final, waiting for the Chairman to approve' : 'approved',
      how: 'Klever’s payroll sheet: basic (gross ÷ 30 × days) + overtime + transport 600 + bonuses = gross; ' +
           'minus absence (gross ÷ 30 a day absent without permission), income tax, pension 7%, cost sharing, loan, ' +
           'salary advance, court, and penalty (fines, at most a third of the basic earned, the rest carried) = net. ' +
           'Klever also pays pension 11%.',
      totals: d.totals,
      people: (d.rows || []).map(function (r) {
        var x = { name: r.name, gross_salary: r.gross, days: r.days, net: r.net };
        ['overtime', 'bonuses', 'absentDays', 'tax', 'pension7', 'loan', 'advance', 'cost', 'court', 'penalty', 'carryOut']
          .forEach(function (k) { if (r[k]) x[k] = r[k]; });
        if (r.noWage) x.no_salary_on_record = true;
        if (r.payOnly) x.not_on_the_site = true;
        return x;
      })
    };
  });
}

/* By hand from the editor: this month as it stands, nothing written */
function previewPayroll() {
  var d = payrollRun_(todayAddis_().slice(0, 7), 'sofar', true);
  d.rows.forEach(function (r) {
    Logger.log('%s | gross %s × %s/30 | tax %s | pension %s | penalty %s (carried %s) | net %s',
               r.name, r.gross, r.days, r.tax, r.pension7, r.penalty, r.carryOut, r.net == null ? 'no salary' : r.net);
  });
  Logger.log(JSON.stringify(d.totals));
}
