/* Klever — cash flow for the Chairman: what came in and went out, week by
   week, and what is expected in the weeks ahead, with the bank against the
   6,000,000 floor.

   THE ASK (the user, 21 Oct 2026): "Chairman also want to see cashflow".
   He chose "past + coming weeks": the last weeks as they happened, the next
   four as expected, the bank balance, and the next seven days item by item.

   WHAT HAPPENED — Selam's daily list of every transaction (betty-daily
   tx_list, from 16 Oct 2026): money in and money out, kind by kind; a move
   between our own accounts is neither. A day she did not report is not a
   zero — it is said, day by day. Nothing is filled in from anyone else's
   report: in from Ephrata's collections beside out from no one would make a
   week look better than it was.

   WHAT IS EXPECTED, each item dated:
     in   Ephrata's 1-Week Forecast (Saturday), payment by payment — the week
          after the Saturday it counts for; so money in is known one week
          ahead, and the chart says so
     out  the bank loans' payments (/loans, Loans.js), supplier credit by its
          pay-by date (Getachew's reports, Credit.js — one past its date is
          owed now), and the salaries: the month's payroll net (Payroll.js),
          on the 6th of the next month, when it is made final
   From tomorrow — or from today while Selam has not reported today.

   THE BANK — the last balance given on WhatsApp (/bank, Bank.js), carried
   forward by Selam's bank transactions reported since, then by what is
   expected, day by day: the balance each coming week should end at, and
   the first day it would go under the floor.

   WHEN — once a day (a new day moves the weeks on), and soon after a report
   it reads comes in or a balance is given (the watch, Agents.js). It reads
   a few dozen documents; the Chairman's page reads the one it writes,
   /cashflow/klever (firestore.rules: the Chairman and the ledger).
   Arithmetic only, in code; no model. previewCashFlow() writes nothing.  */

var CF_FLOOR_ = 6000000;
var CF_PAST_WEEKS_ = 3;                /* weeks before this one */
var CF_NEXT_WEEKS_ = 4;                /* weeks after this one */
var CF_DOC_ = 'cashflow/klever';
var CF_RUN_KEY_ = 'CASHFLOW_LAST_RUN';
var CF_DIRTY_KEY_ = 'CASHFLOW_DIRTY';
var CF_REPORTS_ = /^(betty-daily|ephrata-forecast|getachew-daily)$/;
var CF_WDAY_ = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5 };

function cfR2_(x) { return Math.round(x * 100) / 100; }
function cfMonday_(day) { return addDays_(day, -((dow_(day) + 6) % 7)); }
/* the Saturday a weekly report counts for: the latest one on or before it */
function cfSaturday_(day) { return addDays_(day, -((dow_(day) + 1) % 7)); }

/* Selam's day as she reported it: money in and out, kind by kind; null when
   her list is not there (she said nothing moved: zeros) */
function cfActual_(v) {
  v = v || {};
  if (String(v.tx_any || '') === 'no') return { into: 0, out: 0, inBy: {}, outBy: {} };
  if (v.tx_list == null) return null;
  var r = { into: 0, out: 0, inBy: {}, outBy: {} };
  rows_(v.tx_list).forEach(function (x) {
    if (!x) return;
    var a = n_(x.amount);
    if (!(a > 0)) return;
    if (x.dir === 'in') { r.into += a; r.inBy[x.kin || 'unsaid'] = (r.inBy[x.kin || 'unsaid'] || 0) + a; }
    else if (x.dir === 'out') { r.out += a; r.outBy[x.kout || 'unsaid'] = (r.outBy[x.kout || 'unsaid'] || 0) + a; }
  });
  return r;
}

/* The whole picture. Pure: everything it reads is handed in.
   o: {today, selam:[filings of betty-daily], eph:[filings of ephrata-forecast],
       credits: creditsOwed_(…), loans: /loans docs, payroll: [/payroll docs],
       bank: bankDocs_(…), closed(day)} — a filing is {at: Date, values}. */
function cfBuild_(o) {
  var today = o.today, closed = o.closed || closed_;
  var mon0 = cfMonday_(today);
  var last = addDays_(mon0, 7 * CF_NEXT_WEEKS_ + 6);

  /* Selam: the last filing of each day */
  var sel = {};
  (o.selam || []).forEach(function (f) {
    if (!f || !f.at) return;
    var d = dayOf_(f.at);
    if (!sel[d] || sel[d].at.getTime() <= f.at.getTime()) sel[d] = f;
  });
  var act = function (d) { return sel[d] ? cfActual_(sel[d].values) : null; };
  var expFrom = act(today) ? addDays_(today, 1) : today;

  /* ---- the expected, item by item ---- */
  var items = [], notes = { credit_no_date: { n: 0, birr: 0 }, credit_no_amount: 0, loans_past_date: { n: 0, birr: 0 } };
  /* Ephrata: the latest forecast for each week */
  var fc = {};
  (o.eph || []).forEach(function (f) {
    if (!f || !f.at) return;
    var wk = addDays_(cfSaturday_(dayOf_(f.at)), 2);
    if (!fc[wk] || fc[wk].at.getTime() <= f.at.getTime()) fc[wk] = f;
  });
  var fcWeeks = Object.keys(fc).sort();
  fcWeeks.forEach(function (wk) {
    rows_((fc[wk].values || {}).f_pay).forEach(function (r) {
      if (!r || !(r.day in CF_WDAY_)) return;
      var a = n_(r.amount), d = addDays_(wk, CF_WDAY_[r.day]);
      if (!(a > 0) || d < expFrom || d > last) return;
      items.push({ day: d, dir: 'in', birr: cfR2_(a), src: 'ephrata', kind: String(r.kind || ''),
                   who: String(r.cust || '').trim(), code: String(r.lc || '').trim(), sure: String(r.conf || '') });
    });
  });
  /* the loans */
  (o.loans || []).forEach(function (L) {
    var sched = (L.schedule || []).slice().sort(function (a, b) { return String(a.due) < String(b.due) ? -1 : 1; });
    sched.forEach(function (p, i) {
      if (loanPaid_(p)) return;
      var due = String(p.due || ''), a = Number(p.amount) || 0;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(due) || !(a > 0)) return;
      if (due < today) { notes.loans_past_date.n++; notes.loans_past_date.birr += a; return; }
      if (due < expFrom || due > last) return;
      items.push({ day: due, dir: 'out', birr: cfR2_(a), src: 'loan', who: loanName_(L),
                   what: (p.n || i + 1) + '/' + sched.length });
    });
  });
  /* supplier credit not paid yet */
  (o.credits || []).forEach(function (c) {
    if (c.paidOn) return;
    if (c.left == null) { notes.credit_no_amount++; return; }
    if (!(c.left > 1)) return;
    if (!c.due) { notes.credit_no_date.n++; notes.credit_no_date.birr += c.left; return; }
    if (c.due > last) return;
    var it = { day: c.due < expFrom ? expFrom : c.due, dir: 'out', birr: cfR2_(c.left), src: 'credit',
               who: c.sup, what: c.item, code: c.code };
    if (c.due < expFrom) it.overdue = c.due;
    items.push(it);
  });
  /* salaries: the month's net, on the 6th of the next */
  (o.payroll || []).forEach(function (p) {
    var net = p && p.totals && Number(p.totals.net);
    if (!p || !/^\d{4}-\d{2}$/.test(String(p.month)) || !(net > 0)) return;
    var y = Number(p.month.slice(0, 4)), m = Number(p.month.slice(5, 7)) + 1;
    if (m > 12) { m = 1; y++; }
    var pay = y + '-' + (m < 10 ? '0' : '') + m + '-06';
    if (pay < expFrom || pay > last) return;
    items.push({ day: pay, dir: 'out', birr: cfR2_(net), src: 'salary', what: p.month, final: !!p.final });
  });
  items.sort(function (a, b) {
    return a.day !== b.day ? (a.day < b.day ? -1 : 1) : a.dir !== b.dir ? (a.dir === 'in' ? -1 : 1) : b.birr - a.birr;
  });
  notes.credit_no_date.birr = cfR2_(notes.credit_no_date.birr);
  notes.loans_past_date.birr = cfR2_(notes.loans_past_date.birr);

  /* ---- the bank: the last balance given, carried forward ---- */
  var banks = (o.bank || []).filter(function (b) { return b && b.day && Number(b.total) > 0; })
    .sort(function (a, b) { return a.day < b.day ? -1 : a.day > b.day ? 1 : 0; });
  var given = {};
  banks.forEach(function (b) { given[b.day] = Number(b.total); });
  var base = banks.length ? banks[banks.length - 1] : null, run = null, carried = [], uncounted = [];
  if (base) {
    run = Number(base.total);
    for (var d = addDays_(base.day, 1); d <= today; d = addDays_(d, 1)) {
      if (d === today && !sel[d]) break;
      var n = sel[d] ? bankNet_(sel[d].values) : null;
      if (n) { run += n.net; carried.push(d); }
      else if (!closed(d)) uncounted.push(d);
    }
  }
  var byDay = {};
  items.forEach(function (x) { (byDay[x.day] = byDay[x.day] || []).push(x); });
  var proj = {}, below = null;
  if (base) {
    for (var e = expFrom; e <= last; e = addDays_(e, 1)) {
      (byDay[e] || []).forEach(function (x) { run += x.dir === 'in' ? x.birr : -x.birr; });
      proj[e] = run;
      /* the first day it would end under the floor — the first day itself when it is under already */
      if (below == null && run < CF_FLOOR_) below = { day: e, birr: cfR2_(run) };
    }
  }

  /* ---- the weeks ---- */
  var weeks = [];
  for (var w = -CF_PAST_WEEKS_; w <= CF_NEXT_WEEKS_; w++) {
    /* Monday to Sunday: a payment due on a Sunday belongs to its week */
    var mon = addDays_(mon0, 7 * w), sat = addDays_(mon, 5), sun = addDays_(mon, 6);
    var wk = { mon: mon, sat: sat, kind: w < 0 ? 'past' : w === 0 ? 'now' : 'next',
               in_actual: 0, out_actual: 0, in_expected: 0, out_expected: 0,
               reported: 0, owed: 0, not_reported: [], in_by: {}, out_by: {}, bank: null, bank_day: null, bank_projected: false };
    for (var k = 0; k < 7; k++) {
      var dd = addDays_(mon, k);
      if (dd <= today) {
        var a = act(dd);
        if (a) {
          if (!closed(dd)) { wk.reported++; wk.owed++; }
          wk.in_actual += a.into; wk.out_actual += a.out;
          Object.keys(a.inBy).forEach(function (x) { wk.in_by[x] = (wk.in_by[x] || 0) + a.inBy[x]; });
          Object.keys(a.outBy).forEach(function (x) { wk.out_by[x] = (wk.out_by[x] || 0) + a.outBy[x]; });
        } else if (dd < today && !closed(dd)) { wk.owed++; wk.not_reported.push(dd); }
      }
      (byDay[dd] || []).forEach(function (x) {
        if (x.dir === 'in') wk.in_expected += x.birr; else wk.out_expected += x.birr;
      });
      if (given[dd] != null) { wk.bank = given[dd]; wk.bank_day = dd; }
    }
    /* a coming week, or the rest of this one: where the bank should end */
    if (base && w >= 0 && proj[sun] != null) {
      wk.bank = cfR2_(proj[sun]); wk.bank_day = sun; wk.bank_projected = true;
    }
    ['in_actual', 'out_actual', 'in_expected', 'out_expected'].forEach(function (x) { wk[x] = cfR2_(wk[x]); });
    Object.keys(wk.in_by).forEach(function (x) { wk.in_by[x] = cfR2_(wk.in_by[x]); });
    Object.keys(wk.out_by).forEach(function (x) { wk.out_by[x] = cfR2_(wk.out_by[x]); });
    weeks.push(wk);
  }

  var ahead = { into: 0, out: 0 };
  items.forEach(function (x) { if (x.dir === 'in') ahead.into += x.birr; else ahead.out += x.birr; });
  var forecastLast = fcWeeks.length ? addDays_(fcWeeks[fcWeeks.length - 1], 5) : null;
  return {
    day: today, floor: CF_FLOOR_, expected_from: expFrom,
    weeks: weeks,
    next7: items.filter(function (x) { return x.day <= addDays_(today, 7); }),
    ahead: { in_birr: cfR2_(ahead.into), out_birr: cfR2_(ahead.out), to: last },
    bank: base ? { day: base.day, total: Number(base.total), carried_by: carried, not_counted: uncounted } : null,
    below_floor: below,
    in_known_to: forecastLast && forecastLast >= expFrom ? forecastLast : null,
    selam_today: !!act(today),
    notes: notes
  };
}

/* Everything read, built, written. Returns what was written. */
function cashFlowRun_(dry) {
  var today = todayAddis_(), mon0 = cfMonday_(today);
  var from = addDays_(mon0, -7 * CF_PAST_WEEKS_ - 7);
  var reps = fsQuery_('reports', [['person', 'EQUAL', 'betty'], ['at', 'GREATER_THAN_OR_EQUAL', dayStart_(from)]], 'at');
  var selam = reps.filter(function (f) { return f.report === 'betty-daily' && f.at; })
    .map(function (f) { return { at: f.at, values: f.values || {} }; });
  var eph = fsQuery_('reports', [['report', 'EQUAL', 'ephrata-forecast']], null)
    .filter(function (f) { return f.at && dayOf_(f.at) >= addDays_(today, -21); })
    .map(function (f) { return { at: f.at, values: f.values || {} }; });
  var credits = creditsOwed_(creditFilings_(today));
  var month = today.slice(0, 7), y = Number(month.slice(0, 4)), m = Number(month.slice(5, 7)) - 1;
  if (m < 1) { m = 12; y--; }
  var prev = y + '-' + (m < 10 ? '0' : '') + m, payroll = [];
  [prev, month].forEach(function (mm) {
    if (mm < PR_FIRST_) return;
    var p = null;
    try { p = fsGet_('payroll/' + mm); } catch (e) { p = null; }
    if (p) payroll.push(p);
  });
  var out = cfBuild_({ today: today, selam: selam, eph: eph, credits: credits, loans: loansRead_(), payroll: payroll,
                       bank: bankDocs_(addDays_(today, -40), today) });
  out.at = new Date();
  if (dry) return out;
  fsPut_(CF_DOC_, out);
  var props = PropertiesService.getScriptProperties();
  props.setProperty(CF_RUN_KEY_, String(Date.now()));
  props.deleteProperty(CF_DIRTY_KEY_);
  return out;
}

/* From the watch: once a day, and when a report or a balance it reads came in */
function cashFlowWatch_() {
  var props = PropertiesService.getScriptProperties();
  var last = Number(props.getProperty(CF_RUN_KEY_) || 0);
  if (last && !props.getProperty(CF_DIRTY_KEY_) && Utilities.formatDate(new Date(last), tz_(), 'yyyy-MM-dd') === todayAddis_()) return null;
  return cashFlowRun_();
}
/* From runIfNew_ (new filings) and bankSave_ (a balance given): run at the next watch */
function cashFlowAfter_(fresh) {
  if ((fresh || []).some(function (f) { return CF_REPORTS_.test(String(f.report || '')); })) cashFlowDirty_();
}
function cashFlowDirty_() { PropertiesService.getScriptProperties().setProperty(CF_DIRTY_KEY_, '1'); }

/* By hand from the editor: what the Chairman's page would show now */
function previewCashFlow() {
  var b = cashFlowRun_(true);
  Logger.log(JSON.stringify(b, null, 1));
  return b;
}
