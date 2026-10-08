/* Klever — the Daily Group CFO's figures. The agent itself is one entry in
   AGENTS (Agents.js, id 'groupcfo'); this works out what it is handed,
   every morning on the day just closed (and on "Analyse now").

   WHAT IT ADDS. The finance analyst reads Selam's day; the Sunday CFO
   (Cfo.js) reads where the week's money went. Nobody watched the group's
   cash day by day: Klever's four banks against the 6,000,000 floor and how
   long the headroom lasts, Selam's 7-day forecast and its lowest point, the
   money due in (Ephrata's expected collections, final payments owed on
   jobs) and due out (supplier credit by its pay-by date, Credit.js), the
   same-day controls her letter and Kidan's approval rule set, and the
   three sister companies' money in and out — and what each person must do
   about it today. Every figure and action is worked out here, in code; the
   model writes the morning's words. The morning's AI task list (Team.js)
   reads this finding, so the actions it names can become tasks he sends. */

var GC_FLOOR_ = 6000000;
var GC_KIDAN_ABOVE_ = 50000;
var GC_CASH_HAND_MAX_ = 5000;
var GC_ACTIONS_ = 3;
var GC_SOON_DAYS_ = 2;
var GC_AHEAD_DAYS_ = 7;
var GC_SISTERS_ = [
  { id: 'frewoyni', company: 'Rovestone' },
  { id: 'meri', company: 'Meri Block Board' },
  { id: 'lemikura', company: 'Real Estate & Construction (Lemi Kura)' }
];

function gcLatest_(byDay, upTo) {
  var keys = Object.keys(byDay || {}).filter(function (k) { return k <= upTo; }).sort();
  return keys.length ? { day: keys[keys.length - 1], v: byDay[keys[keys.length - 1]] } : null;
}
function gcSum_(byDay, from, to, field) {
  var tot = 0, n = 0;
  Object.keys(byDay || {}).forEach(function (k) {
    if (k < from || k > to) return;
    var x = a_(byDay[k], field);
    if (x !== null) { tot += x; n++; }
  });
  return n ? tot : null;
}

function groupCfo_(d) {
  var names = {};
  ((d.schedule && d.schedule.people) || []).forEach(function (p) { names[p.id] = p.en; });
  var today = d.provisional ? d.day : addDays_(d.day, 1);
  while (dow_(today) === 0) today = addDays_(today, 1);
  var dw = dow_(d.day);
  var monday = addDays_(d.day, -(dw === 0 ? 6 : dw - 1));

  var by = {};
  (d.recent || []).concat(d.filed || []).forEach(function (f) {
    var day = f.day || (f.at ? dayOf_(f.at) : '');
    if (day) (by[f.report] = by[f.report] || {})[day] = f.fields || {};
  });
  var finD = by['betty-daily'] || {};
  var fin = finD[d.day] || null, f0 = fin || {};

  /* Klever's cash, the evening of the day read */
  var bank = a_(f0, 'bank_total');
  var banks = { cbe: a_(f0, 'bank_cbe'), awash: a_(f0, 'bank_awash'), abyssinia: a_(f0, 'bank_aby'), zamzam: a_(f0, 'bank_zz') };
  var parts = [banks.cbe, banks.awash, banks.abyssinia, banks.zamzam].filter(function (x) { return x !== null; });
  var partsSum = parts.length === 4 ? parts.reduce(function (a, x) { return a + x; }, 0) : null;
  var last = lastKnown_(d, [['betty-daily', 'bank_total'], ['betty-forecast', 'cf7_bank']], GC_FLOOR_);
  var klever = {
    selam_filed: !!fin,
    bank_total: bank,
    by_bank: banks,
    the_four_banks_add_up_to: partsSum,
    banks_differ_from_total_by: partsSum !== null && bank !== null ? partsSum - bank : null,
    reserve_floor: GC_FLOOR_,
    above_the_floor_by: bank !== null ? bank - GC_FLOOR_ : null,
    last_bank_balance_reported: last,
    cash_in: a_(f0, 'cash_in'), advances_in: a_(f0, 'adv_in'), final_payments_in: a_(f0, 'final_in'),
    cash_on_hand: a_(f0, 'cash_hand'), cash_on_hand_limit: GC_CASH_HAND_MAX_, all_cash_banked: ay_(f0, 'cash_banked'),
    payments_approved: a_(f0, 'pay_approved'), payments_approved_birr: a_(f0, 'pay_value'),
    week_so_far: { from: dayLabel_(monday), cash_in: gcSum_(finD, monday, d.day, 'cash_in'),
                   payments_approved_birr: gcSum_(finD, monday, d.day, 'pay_value') },
    bank_last_7_days: series_(d, 'betty-daily', 'bank_total'),
    days_until_below_the_floor_at_this_rate: daysToFloor_(series_(d, 'betty-daily', 'bank_total'), GC_FLOOR_)
  };

  /* Selam's latest 7-day forecast */
  var fc = gcLatest_(by['betty-forecast'], d.day), forecast = null;
  if (fc) {
    var rows = rows_(fc.v.cf7_days).slice(0, 7);
    var low = null, firstBelow = null, tin = 0, tout = 0, nin = 0, nout = 0;
    rows.forEach(function (r, i) {
      var c = a_(r, 'close'), x = a_(r, 'in'), y = a_(r, 'out');
      if (x !== null) { tin += x; nin++; }
      if (y !== null) { tout += y; nout++; }
      if (c === null) return;
      if (!low || c < low.close) low = { day: 'Day ' + (i + 1), close: c };
      if (firstBelow === null && c < GC_FLOOR_) firstBelow = 'Day ' + (i + 1);
    });
    forecast = {
      made_on: dayLabel_(fc.day), morning_bank: a_(fc.v, 'cf7_bank'),
      days_counted_from: 'Day 1 is the morning she made it',
      lowest_close_in_her_days: low, lowest_as_she_wrote_it: a_(fc.v, 'cf7_low'),
      first_day_below_the_floor: firstBelow,
      coming_in_7_days: nin ? tin : null, going_out_7_days: nout ? tout : null,
      she_expects_a_shortfall: ay_(fc.v, 'cf7_short'), shortfall_birr: a_(fc.v, 'cf7_amount'),
      she_suggests_freezing_non_essential_payments: ay_(fc.v, 'cf7_freeze')
    };
  }

  /* money due in */
  var eph = gcLatest_(by['ephrata-daily'], d.day);
  var expected = eph ? expectedOf_(eph.v) : null;
  var jobs = opsJobs_();
  var owed = jobs.filter(function (j) {
    return j.held && j.held.amount && opsStatus_(j) !== 'done' &&
           !(j.steps && j.steps.final && j.steps.final >= (j.held.day || ''));
  }).map(function (j) {
    return { job: j.job, customer: j.cust || '', owed_birr: n_(j.held.amount), expected: j.held.expect || '', since: j.held.day ? dayLabel_(j.held.day) : '' };
  }).sort(function (a, b) { return b.owed_birr - a.owed_birr; });

  /* money due out: supplier credit by its pay-by date */
  var credits = [];
  try { credits = creditsOwed_(creditFilings_(d.day)); } catch (e) { credits = []; }
  var unpaid = credits.filter(function (c) { return !c.paidOn; });
  var limit = addDays_(today, GC_AHEAD_DAYS_ - 1);
  var cr = function (c) {
    return { supplier: c.sup, birr_left: c.left, item: c.item, job: c.code ? opsCode_(c.code) : '', bought: dayLabel_(c.day),
             pay_by: c.due ? dayLabel_(c.due) : null, days: c.due ? hrDaysBetween_(today, c.due) : null };
  };
  var overdue = unpaid.filter(function (c) { return c.due && c.due < today; }).map(cr);
  var dueSoon = unpaid.filter(function (c) { return c.due && c.due >= today && c.due <= limit; }).map(cr);
  var noDate = unpaid.filter(function (c) { return !c.due; }).map(cr);
  var sumLeft = function (xs) { return xs.reduce(function (a, c) { return a + (c.birr_left || 0); }, 0); };
  var geta = gcLatest_(by['getachew-daily'], d.day);

  /* the same-day controls */
  var controls = [];
  var bigNoKidan = rows_(f0.pay_list).filter(function (r) {
    return r && n_(r.amount) > GC_KIDAN_ABOVE_ && !yes_(r.kidan);
  }).map(function (r) { return { to: String(r.to || '').trim(), for_what: String(r['for'] || '').trim(), birr: n_(r.amount) }; });
  bigNoKidan.forEach(function (p) { controls.push({ who: 'kidan', what: 'payment of ' + fmt_(p.birr) + ' Birr to ' + p.to + ' approved without Kidan (over 50,000)' }); });
  if (bank !== null && bank < GC_FLOOR_ && ay_(f0, 'below6_reported') !== true) controls.push({ who: 'betty', what: 'bank below 6,000,000 and the Chairman not told the same day' });
  if (ay_(f0, 'discrepancy') === true) controls.push({ who: 'betty', what: 'a cash discrepancy' + (ay_(f0, 'discrepancy_told') === true ? ' (the Chairman and Kidan were told)' : ', and the Chairman and Kidan were not told') });
  if (a_(f0, 'zz_disc') > 0) controls.push({ who: 'betty', what: a_(f0, 'zz_disc') + ' ZamZam discrepancies' });
  if (ay_(f0, 'zz_confirmed') === false) controls.push({ who: 'betty', what: 'a ZamZam cheque written without funds confirmed' });
  if (a_(f0, 'cash_hand') > GC_CASH_HAND_MAX_) controls.push({ who: 'betty', what: fmt_(a_(f0, 'cash_hand')) + ' Birr cash on hand overnight (limit 5,000)' });
  if (ay_(f0, 'cash_banked') === false) controls.push({ who: 'betty', what: 'not all of the day’s cash was banked' });
  if (ay_(f0, 'asm_unreserved') === true) controls.push({ who: 'betty', what: 'a job being installed without its assembler payment reserved' });
  if (klever.banks_differ_from_total_by) controls.push({ who: 'betty', what: 'the four bank lines add up to ' + fmt_(partsSum) + ', not the ' + fmt_(bank) + ' total' });

  /* the sister companies */
  var reportOf = {};
  ((d.schedule && d.schedule.reports) || []).forEach(function (r) { if (r.cadence === 'daily') reportOf[r.person] = r.id; });
  var group = GC_SISTERS_.map(function (s) {
    var rb = by[reportOf[s.id]] || {}, v = rb[d.day] || null;
    return {
      company: s.company, reports_as: names[s.id] || s.id, filed_the_day_read: !!v,
      money_in: v ? a_(v, 'm_in') : null, money_out: v ? a_(v, 'm_out') : null, with_klever: v ? a_(v, 'm_klever') : null,
      week_in: gcSum_(rb, monday, d.day, 'm_in'), week_out: gcSum_(rb, monday, d.day, 'm_out')
    };
  });

  /* today, person by person */
  var acts = {};
  var add = function (who, what, why) { (acts[who] = acts[who] || []).push({ do: what, why: why }); };
  if (bank !== null && bank < GC_FLOOR_) {
    add('betty', 'hold every non-essential payment until the bank is back above 6,000,000', 'bank ' + fmt_(bank) + ' on ' + dayLabel_(d.day) + ', ' + fmt_(GC_FLOOR_ - bank) + ' below the floor');
  }
  controls.filter(function (c) { return c.who === 'betty'; }).forEach(function (c) { add('betty', 'put right: ' + c.what, 'from her report of ' + dayLabel_(d.day)); });
  owed.forEach(function (o) { add('betty', 'chase the final payment for ' + o.job + (o.customer ? ' (' + o.customer + ')' : '') + ' — ' + fmt_(o.owed_birr) + ' Birr', 'requested ' + (o.since || 'earlier') + (o.expected ? ', expected ' + o.expected : '')); });
  bigNoKidan.forEach(function (p) { add('kidan', 'review the ' + fmt_(p.birr) + ' Birr payment to ' + p.to, 'approved by Selam on ' + dayLabel_(d.day) + ' without you; over 50,000 needs you'); });
  if (forecast && forecast.first_day_below_the_floor) {
    add('kidan', 'decide with Selam whether to freeze non-essential payments', 'her forecast of ' + forecast.made_on + ' goes below 6,000,000 on ' + forecast.first_day_below_the_floor +
        (forecast.lowest_close_in_her_days ? ' and bottoms at ' + fmt_(forecast.lowest_close_in_her_days.close) : ''));
  }
  overdue.forEach(function (c) { add('getachew', 'pay ' + c.supplier + ' ' + (c.birr_left ? fmt_(c.birr_left) + ' Birr ' : '') + 'or agree a new date with them', 'credit for ' + (c.item || 'an order') + ' was due ' + c.pay_by + ', ' + (-c.days) + ' days ago'); });
  dueSoon.filter(function (c) { return c.days <= GC_SOON_DAYS_; }).forEach(function (c) { add('getachew', 'make sure Selam has the cheque ready for ' + c.supplier + (c.birr_left ? ' (' + fmt_(c.birr_left) + ' Birr)' : ''), 'due ' + c.pay_by); });
  noDate.forEach(function (c) { add('getachew', 'agree a pay-by date with ' + c.supplier, 'credit bought ' + c.bought + ' with no date written'); });
  /* the answers are stored as codes ('today', 'tomorrow', 'final'), not the words shown */
  var whenOf = function (p) { return String(p.when || '').toLowerCase(); };
  var kindL = choiceLabels_(d.schedule, 'ephrata-daily', 'expected_list', 'kind');
  ((expected && expected.payments) || []).filter(function (p) { return whenOf(p) === 'today' || whenOf(p) === 'tomorrow'; })
    .sort(function (a, b) { return (whenOf(a) === 'today' ? 0 : 1) - (whenOf(b) === 'today' ? 0 : 1) || b.birr - a.birr; })
    .forEach(function (p) { add('ephrata', 'collect ' + fmt_(p.birr) + ' Birr from ' + p.client + (p['for'] ? ' (' + (kindL[p['for']] || p['for']) + ')' : ''), 'she expected it ' + whenOf(p) + ' in her report of ' + dayLabel_(eph.day)); });
  group.forEach(function (g, i) { if (!g.filed_the_day_read) add(GC_SISTERS_[i].id, 'send the daily report for ' + dayLabel_(d.day), g.company + '’s money in and out is not known for that day'); });

  var today_actions = {};
  ['betty', 'kidan', 'getachew', 'ephrata'].concat(GC_SISTERS_.map(function (s) { return s.id; })).forEach(function (id) {
    var list = (acts[id] || []).slice(0, GC_ACTIONS_);
    if (list.length) today_actions[names[id] || id] = list;
  });

  return {
    the_day_read: dayLabel_(d.day),
    acting_on: dayLabel_(today),
    klever: klever,
    selam_forecast: forecast || { note: 'Selam has filed no 7-day forecast this week.' },
    coming_in: {
      ephrata_expects: expected ? { as_of: dayLabel_(eph.day), total: expected.total, by_when: expected.by_when, by_type: expected.by_type } : null,
      final_payments_owed_on_jobs: owed,
      final_payments_owed_birr: owed.reduce(function (a, o) { return a + o.owed_birr; }, 0)
    },
    going_out: {
      supplier_credit_past_its_date: overdue, past_its_date_birr: sumLeft(overdue),
      supplier_credit_due_within_7_days: dueSoon, due_within_7_days_birr: sumLeft(dueSoon),
      supplier_credit_with_no_date: noDate,
      getachew_reported: geta ? { as_of: dayLabel_(geta.day), owed_now: a_(geta.v, 'cr_owed'), past_its_date: a_(geta.v, 'cr_overdue') } : null
    },
    same_day_controls_broken: controls.map(function (c) { return c.what; }),
    group: group,
    never_add: 'Klever’s figures are its own; each sister company’s are its own. Do not add them into a group total.',
    today_actions: today_actions
  };
}
