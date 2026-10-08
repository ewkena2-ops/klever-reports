/* Klever — the second set of specialists, on the road in Readers.js:
   procurement, quality, customer satisfaction, maintenance, health & safety,
   and project control. Each reads only what staff already report; where a
   figure needs something nobody reports yet (import shipments, NPS, the
   maintenance plan, permits, change orders), it says so rather than guess.

   SPECIALISTS_ is read by runReaders_ at run time (rdAll_), so this file may
   load before or after Readers.js. Every figure is worked out here.        */

function spName_(s) { return creditName_(s); }
function spLower_(s) { return String(s || '').trim().toLowerCase(); }
/* the latest filing in a window, as {day, v} */
function spLatest_(byDay, from, to) {
  var ks = Object.keys(byDay || {}).filter(function (d) { return d >= from && d <= to; }).sort();
  return ks.length ? { day: ks[ks.length - 1], v: byDay[ks[ks.length - 1]] } : null;
}
function spPairs_(byDay, field, from, to) {
  var done = 0, of = 0, n = 0;
  Object.keys(byDay || {}).forEach(function (d) {
    if (d < from || d > to) return;
    var p = pair_(byDay[d], field);
    if (p && p.done !== null && p.of !== null && !p.cannot_be_right) { done += p.done; of += p.of; n++; }
  });
  return n ? { done: done, of: of, pct: of ? Math.round(done / of * 1000) / 10 : null } : null;
}
function spCount_(xs, f) {
  var c = {};
  xs.forEach(function (x) { var k = f(x); if (k) c[k] = (c[k] || 0) + 1; });
  return Object.keys(c).map(function (k) { return { what: k, n: c[k] }; }).sort(function (a, b) { return b.n - a.n; });
}

/* ------------------------------------------------------------------ *
 *  Procurement                                                        *
 * ------------------------------------------------------------------ */
function procurementFacts_(P) {
  var from = P.start, to = P.end, back = addDays_(to, -55);
  var get = rdBy_('getachew', back, to), gd = get['getachew-daily'] || {}, gw = get['getachew-weekly'] || {};
  var rec = rdRows_((rdBy_('yordanos', back, to)['yordanos-daily']) || {}, 'rec_list').map(function (x) {
    return { day: x.day, key: spName_(x.r.sup), job: x.r.code ? opsCode_(x.r.code) : '' };
  });
  var week = rdRows_(gd, 'ord_list', from, to);
  var byPaid = {}, paidL = choiceLabels_(P.schedule, 'getachew-daily', 'ord_list', 'paid');
  week.forEach(function (x) { var k = paidL[x.r.paid] || x.r.paid || 'not said'; byPaid[k] = (byPaid[k] || 0) + n_(x.r.amount); });
  var prices = rdRows_(gd, 'p_rows', from, to).filter(function (x) { return x.r.pitem; }).map(function (x) {
    return { item: String(x.r.pitem).trim(), supplier: String(x.r.psup || '').trim(), now: a_(x.r, 'pnow'), last: a_(x.r, 'plast'), change_pct: a_(x.r, 'pchg'), on: dayLabel_(x.day) };
  });
  var ups = prices.filter(function (p) { return p.change_pct !== null && p.change_pct > 10; });
  var chg = prices.filter(function (p) { return p.change_pct !== null; });
  /* lead times over eight weeks: an order, and the first receipt from that
     supplier (for the same job, where both name one) on or after it */
  var sup = {};
  rdRows_(gd, 'ord_list', back, to).forEach(function (x) {
    var k = spName_(x.r.sup);
    if (!k) return;
    var job = x.r.code ? opsCode_(x.r.code) : '', due = String(x.r.due || '').trim();
    var hit = rec.filter(function (r) { return r.key === k && r.day >= x.day && (!job || !r.job || r.job === job); })[0] || null;
    var e = sup[k] || (sup[k] = { supplier: String(x.r.sup).trim(), orders: 0, received: 0, lead_days: [], late: 0, not_received_past_due: 0 });
    e.orders++;
    if (hit) {
      e.received++;
      e.lead_days.push(hrDaysBetween_(x.day, hit.day));
      if (/^\d{4}-\d{2}-\d{2}$/.test(due) && hit.day > due) e.late++;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(due) && due < to) e.not_received_past_due++;
  });
  var suppliers = Object.keys(sup).map(function (k) {
    var e = sup[k], ld = e.lead_days;
    return { supplier: e.supplier, orders: e.orders, received: e.received,
             average_lead_days: ld.length ? Math.round(ld.reduce(function (a, x) { return a + x; }, 0) / ld.length * 10) / 10 : null,
             late: e.late, not_received_past_due: e.not_received_past_due };
  }).sort(function (a, b) { return b.orders - a.orders; });
  var allLead = [].concat.apply([], Object.keys(sup).map(function (k) { return sup[k].lead_days; }));
  var delays = rdRows_(gd, 'sup_delay_list', from, to).filter(function (x) { return x.r.item || x.r.sup; });
  var wk = spLatest_(gw, from, addDays_(to, 1));
  var last = spLatest_(gd, from, to);
  return {
    week: dayLabel_(from) + ' to ' + dayLabel_(to),
    getachew_days_reported: Object.keys(gd).filter(function (d) { return d >= from && d <= to; }).length,
    orders_this_week: week.length,
    bought_this_week_birr: week.reduce(function (a, x) { return a + n_(x.r.amount); }, 0),
    bought_by_how_paid: byPaid,
    prices_recorded: prices.length,
    prices_up_more_than_10pct: ups,
    average_price_change_pct: chg.length ? Math.round(chg.reduce(function (a, p) { return a + p.change_pct; }, 0) / chg.length * 10) / 10 : null,
    requests_with_3_quotes: spPairs_(gd, 'pr_quotes', from, to),
    supplier_lead_times_8_weeks: suppliers,
    average_lead_days_8_weeks: allLead.length ? Math.round(allLead.reduce(function (a, x) { return a + x; }, 0) / allLead.length * 10) / 10 : null,
    lead_time_method: 'an order, and the first delivery Yordanos received from that supplier on or after it (same job where both name one)',
    deliveries_late_this_week: delays.length,
    late_deliveries_that_stop_production: delays.filter(function (x) { return ay_(x.r, 'stops') === true; }).length,
    deliveries_rejected_this_week: rdRows_(gd, 'del_rej_list', from, to).filter(function (x) { return x.r.item; }).length,
    documents_outstanding: last ? a_(last.v, 'doc_missing') : null,
    weekly: wk ? { saved_against_last_price: a_(wk.v, 'g_saving'), owed_to_suppliers: a_(wk.v, 'g_cr_owed'),
                   past_its_date: a_(wk.v, 'g_cr_overdue'), due_next_week: a_(wk.v, 'g_cr_next') } : null,
    imports: impFacts_(P)
  };
}
var PROCUREMENT_ASK_ =
  'You are the Chairman’s head of procurement. In at most 130 words, short bullets: what was bought and how '+
  'it was paid; prices that rose more than 10%, by item and supplier; the slowest suppliers by lead time and '+
  'any that deliver late or not at all; late deliveries that stopped production; and imports, or say they are '+
  'not reported yet. Quote the figures as given.';

/* ------------------------------------------------------------------ *
 *  Quality                                                            *
 * ------------------------------------------------------------------ */
function qualityFacts_(P) {
  var from = P.start, to = P.end, back = addDays_(to, -27);
  var wd = rdBy_('wude', back, to), w = wd['wude-daily'] || {}, wm = (rdBy_('wude', addDays_(to, -45), to)['wude-monthly']) || {};
  var ama = rdBy_('amaha', from, to), ad = ama['amaha-daily'] || {}, aw = ama['amaha-weekly'] || {};
  var insp = rdSum_(w, 'i_total', from, to), pass = rdSum_(w, 'i_pass', from, to);
  var typeL = choiceLabels_(P.schedule, 'wude-daily', 'd_rows', 'type'), sevL = choiceLabels_(P.schedule, 'wude-daily', 'd_rows', 'sev');
  var defects = rdRows_(w, 'd_rows', from, to).filter(function (x) { return x.r.type || x.r.code; });
  var weeks = [];
  for (var i = 3; i >= 0; i--) {
    var s = addDays_(sundayOf_(to), -7 * i), m = addDays_(s, -6);
    var a = rdSum_(w, 'i_total', m, s), b = rdSum_(w, 'i_pass', m, s);
    weeks.push({ week_ending: dayLabel_(s), pass_rate_pct: a ? Math.round(b / a * 1000) / 10 : null });
  }
  var fails = {};
  rdRows_(w, 'i_jobs', back, to).forEach(function (x) {
    if (!x.r.code || ay_(x.r, 'pass') !== false) return;
    var k = opsCode_(x.r.code);
    (fails[k] = fails[k] || []).push(dayLabel_(x.day));
  });
  var mon = spLatest_(wm, addDays_(to, -45), to), causes = [];
  if (mon) {
    var labels = pmGridLabels_(P.schedule, 'wude-monthly', 'cause_grid');
    causes = rows_(mon.v.cause_grid).map(function (r, i) { return { cause: labels[i] || ('row ' + (i + 1)), reworks: a_(r, 'n'), cost: a_(r, 'cost') }; })
      .filter(function (c) { return c.reworks || c.cost; }).sort(function (a, b) { return (b.cost || 0) - (a.cost || 0); });
  }
  var req = rdSum_(w, 'r_required', from, to), done = rdSum_(w, 'r_done', from, to);
  var awk = spLatest_(aw, from, addDays_(to, 1));
  return {
    week: dayLabel_(from) + ' to ' + dayLabel_(to),
    wude_days_reported: Object.keys(w).filter(function (d) { return d >= from && d <= to; }).length,
    inspected: insp, passed: pass, failed: rdSum_(w, 'i_fail', from, to),
    pass_rate_pct: insp ? Math.round((pass || 0) / insp * 1000) / 10 : null, pass_rate_bonus_at: 98,
    pass_rate_last_4_weeks: weeks,
    defects_found: rdSum_(w, 'd_total', from, to),
    defects_reached_finished_goods: rdSum_(w, 'd_released', from, to),
    defects_by_type: spCount_(defects, function (x) { return typeL[x.r.type] || x.r.type; }),
    defects_by_severity: spCount_(defects, function (x) { return sevL[x.r.sev] || x.r.sev; }),
    critical_defects: defects.filter(function (x) { return x.r.sev === 'crit'; }).map(function (x) { return { job: x.r.code ? opsCode_(x.r.code) : '', type: typeL[x.r.type] || x.r.type || '', on: dayLabel_(x.day) }; }),
    where_defects_start_amaha: spCount_(rdRows_(ad, 'qc_defects_list', from, to), function (x) { return spLower_(x.r.stage); }),
    jobs_failed_more_than_once_4_weeks: Object.keys(fails).filter(function (k) { return fails[k].length > 1; }).map(function (k) { return { job: k, failed_on: fails[k] }; }),
    rework_needed: req, rework_finished: done, rework_still_open: req !== null ? Math.max(0, req - (done || 0)) : null,
    days_someone_pressed_wude_to_pass: rdDaysWhen_(w, 'pr_any', true, from, to),
    rework_cost_this_week: rdSum_(w, 'r_cost', from, to),
    waste_cost_this_week_amaha: awk ? a_(awk.v, 'w_cost') : null,
    last_monthly_rework_report: mon ? { as_of: dayLabel_(mon.day), cost: a_(mon.v, 'm_cost'), rate_pct: a_(mon.v, 'm_rate'), top_causes_by_cost: causes } : null
  };
}
var QUALITY_ASK_ =
  'You are the Chairman’s head of quality. In at most 130 words, short bullets: the pass rate against 98% and '+
  'its trend over four weeks; defects that reached finished goods; the commonest defect types and where they '+
  'start; any critical defect by job; jobs that failed more than once; rework still open and what rework costs '+
  'where reported, with the top causes. If anyone pressed Wude to pass a defect, say it first.';

/* ------------------------------------------------------------------ *
 *  Customer satisfaction                                              *
 * ------------------------------------------------------------------ */
function customersFacts_(P) {
  var from = P.start, to = P.end, back = addDays_(to, -55);
  var sel = rdBy_('betty', back, addDays_(to, 2)), pulse = sel['betty-pulse'] || {}, cx = sel['betty-weekly-cx'] || {};
  /* each complaint, by customer (and job): first seen, and the first day it was Resolved */
  var track = {};
  rdRows_(pulse, 'pl_list', back, to).forEach(function (x) {
    var k = spLower_(x.r.cust) + '|' + (x.r.job ? opsCode_(x.r.job) : '');
    if (k === '|') return;
    var t = track[k] || (track[k] = { customer: String(x.r.cust || '').trim(), job: x.r.job ? opsCode_(x.r.job) : '', first: x.day, resolved: null, issue: String(x.r.issue || '').trim(), last_state: '' });
    /* the state is stored as a code: open, working, closed (Resolved) */
    t.last_state = String(x.r.state || '');
    var done = t.last_state === 'closed';
    if (done && !t.resolved) t.resolved = x.day;
    if (!done) t.resolved = null;
  });
  var all = Object.keys(track).map(function (k) { return track[k]; });
  var resolved = all.filter(function (t) { return t.resolved; });
  var open = all.filter(function (t) { return !t.resolved; }).map(function (t) {
    return { customer: t.customer, job: t.job, issue: t.issue, open_since: dayLabel_(t.first), days_open: hrDaysBetween_(t.first, to) };
  }).sort(function (a, b) { return b.days_open - a.days_open; });
  var daysTo = resolved.map(function (t) { return hrDaysBetween_(t.first, t.resolved); });
  var cxw = spLatest_(cx, from, addDays_(to, 2));
  var after = { called: null, happy: 0, unhappy: 0, referrals: 0 };
  var callsDone = 0, callsOf = 0, callsN = 0;
  ['tsega', 'biruktayet'].forEach(function (id) {
    var sd = rdBy_(id, from, to)[id + '-sales-daily'] || {};
    var p = spPairs_(sd, 'fu_calls', from, to);
    if (p) { callsDone += p.done; callsOf += p.of; callsN++; }
    rdRows_(sd, 'fu_list', from, to).forEach(function (x) {
      var h = ay_(x.r, 'happy');
      if (h === true) after.happy++; else if (h === false) after.unhappy++;
    });
    after.referrals += rdSum_(sd, 'ref_logged', from, to) || 0;
  });
  if (callsN) after.called = { done: callsDone, of: callsOf, pct: callsOf ? Math.round(callsDone / callsOf * 1000) / 10 : null };
  var jobs = opsJobs_();
  var ew = spLatest_((rdBy_('elyas', from, addDays_(to, 1))['elyas-weekly']) || {}, from, addDays_(to, 1));
  return {
    week: dayLabel_(from) + ' to ' + dayLabel_(to),
    pulse_days_reported: Object.keys(pulse).filter(function (d) { return d >= from && d <= to; }).length,
    new_complaints_this_week: all.filter(function (t) { return t.first >= from && t.first <= to; }).length,
    resolved_this_week: resolved.filter(function (t) { return t.resolved >= from && t.resolved <= to; }).length,
    open_now: open.length,
    oldest_open: open.slice(0, 5),
    average_days_to_resolve_8_weeks: daysTo.length ? Math.round(daysTo.reduce(function (a, x) { return a + x; }, 0) / daysTo.length * 10) / 10 : null,
    resolved_8_weeks: daysTo.length,
    method: 'a complaint is a customer (and job) in Selam’s pulse; resolved on the first day she marks it Resolved (stored as closed)',
    sounded_happy: rdSum_(pulse, 'pl_happy', from, to), sounded_unhappy: rdSum_(pulse, 'pl_unhappy', from, to),
    days_a_customer_was_at_risk_of_cancelling: rdDaysWhen_(pulse, 'pl_risk', true, from, to),
    satisfaction_out_of_5: cxw ? a_(cxw.v, 'cx_score') : null, customers_who_scored: cxw ? a_(cxw.v, 'cx_rated') : null,
    complained_more_than_once: cxw ? a_(cxw.v, 'cx_repeat') : null,
    after_sales: after,
    site_complaints_elyas: ew ? { new: a_(ew.v, 'cs_comp'), resolved: a_(ew.v, 'cs_res'), open: a_(ew.v, 'cs_out') } : null,
    open_complaints_on_jobs_register: jobs.reduce(function (a, j) { return a + (j.openComplaints || 0); }, 0),
    nps: npsFacts_(from, to)
  };
}
var CUSTOMERS_ASK_ =
  'You are the Chairman’s head of customer satisfaction. In at most 130 words, short bullets: new, resolved '+
  'and open complaints, the oldest open ones by customer with days open, and the average days to resolve; '+
  'customers at risk of cancelling; the satisfaction score out of 5 and how many scored; after-sales calls and '+
  'how many were happy; and the NPS, or say it is not reported yet.';

/* ------------------------------------------------------------------ *
 *  Maintenance                                                        *
 * ------------------------------------------------------------------ */
function maintenanceFacts_(P) {
  var from = P.start, to = P.end, back = addDays_(to, -27);
  var ama = rdBy_('amaha', back, to), ad = ama['amaha-daily'] || {}, aw = ama['amaha-weekly'] || {};
  var ld = (rdBy_('liu', back, to)['liu-daily']) || {};
  var ev = {};
  var note = function (day, m, h, cause) {
    var k = spLower_(m);
    if (!k) return;
    var e = ev[k] || (ev[k] = { machine: String(m).trim(), days: {} });
    var d = e.days[day] || (e.days[day] = { hours: 0, causes: [] });
    d.hours = Math.max(d.hours, h || 0);
    if (cause && d.causes.indexOf(cause) < 0) d.causes.push(cause);
  };
  rdRows_(ad, 'm_rows', back, to).forEach(function (x) {
    if (ay_(x.r, 'run') === false || n_(x.r.down) > 0) note(x.day, x.r.name, n_(x.r.down), String(x.r.cause || '').trim());
  });
  rdRows_(ld, 'downtime_list', back, to).forEach(function (x) { note(x.day, x.r.machine, n_(x.r.hours), String(x.r.cause || '').trim()); });
  var machines = Object.keys(ev).map(function (k) {
    var e = ev[k], days = Object.keys(e.days).sort();
    var wk = days.filter(function (d) { return d >= from && d <= to; });
    var causes = [];
    days.forEach(function (d) { e.days[d].causes.forEach(function (c) { if (causes.indexOf(c) < 0) causes.push(c); }); });
    return { machine: e.machine, breakdown_days_this_week: wk.length,
             hours_down_this_week: wk.reduce(function (a, d) { return a + e.days[d].hours; }, 0),
             breakdown_days_4_weeks: days.length, causes: causes,
             repeat: wk.length >= 2 || days.length >= 3 };
  }).sort(function (a, b) { return b.hours_down_this_week - a.hours_down_this_week || b.breakdown_days_4_weeks - a.breakdown_days_4_weeks; });
  var awk = spLatest_(aw, from, addDays_(to, 1));
  var plan = maintPlan_(to);
  return {
    week: dayLabel_(from) + ' to ' + dayLabel_(to),
    machines: machines,
    breakdowns_this_week: machines.reduce(function (a, m) { return a + m.breakdown_days_this_week; }, 0),
    hours_down_this_week: machines.reduce(function (a, m) { return a + m.hours_down_this_week; }, 0),
    machines_breaking_down_repeatedly: machines.filter(function (m) { return m.repeat; }).map(function (m) { return m.machine; }),
    repeat_rule: 'two breakdown days in the week, or three in four weeks',
    days_machines_not_inspected_before_work: rdDaysWhen_(ad, 'm_inspect', false, from, to),
    days_a_breakdown_was_not_reported_within_30_min: rdDaysWhen_(ad, 'm_reported', false, from, to),
    uptime_pct_amaha: awk ? a_(awk.v, 'm_uptime') : null,
    plan: plan
  };
}
var MAINTENANCE_ASK_ =
  'You are the Chairman’s head of maintenance. In at most 120 words, short bullets: breakdowns and hours down '+
  'this week by machine, the machines breaking down repeatedly and their causes, whether machines are being '+
  'inspected before work and breakdowns reported in time; and from the plan, tasks overdue or due this week and '+
  'spare parts below their minimum — or say the plan has not been filled in yet.';

/* ------------------------------------------------------------------ *
 *  Health, safety & environment                                       *
 * ------------------------------------------------------------------ */
function hseFacts_(P) {
  var from = P.start, to = P.end;
  var ama = rdBy_('amaha', from, addDays_(to, 1)), ad = ama['amaha-daily'] || {}, aw = ama['amaha-weekly'] || {};
  var ed = (rdBy_('elyas', from, to)['elyas-daily']) || {};
  var said = function (byDay, yesField, whatField, want) {
    return Object.keys(byDay).sort().filter(function (d) { return d >= from && d <= to && ay_(byDay[d], yesField) === want; })
      .map(function (d) { return dayLabel_(d).split(' ')[0] + ': ' + String(byDay[d][whatField] || 'not described').trim(); });
  };
  var s5 = Object.keys(ad).filter(function (d) { return d >= from && d <= to && a_(ad[d], 'c_5s') !== null; }).map(function (d) { return a_(ad[d], 'c_5s'); });
  var awk = spLatest_(aw, from, addDays_(to, 1));
  if (awk && a_(awk.v, 'c_5s') !== null) s5.push(a_(awk.v, 'c_5s'));
  return {
    week: dayLabel_(from) + ' to ' + dayLabel_(to),
    injuries_or_no_safety_gear: said(ad, 'mp_safety', 'mp_safety_what', true),
    weekly_said_someone_was_hurt: awk ? ay_(awk.v, 'a_safety') : null,
    behaviour_incidents_factory: rdSum_(ad, 'mp_behave', from, to),
    behaviour_incidents_site: rdSum_(ed, 'a_behave', from, to),
    customer_property_damaged: said(ed, 'cl_damage', 'cl_damage_what', true),
    site_floors_not_protected: rdDaysWhen_(ed, 'cl_protect', false, from, to),
    site_not_left_clean: rdDaysWhen_(ed, 'cl_clean', false, from, to),
    factory_not_clean_at_close: rdDaysWhen_(ad, 'c_floor', false, from, to),
    machines_not_cleaned: rdDaysWhen_(ad, 'c_mach', false, from, to),
    score_5s_average: s5.length ? Math.round(s5.reduce(function (a, x) { return a + x; }, 0) / s5.length * 10) / 10 : null,
    reusable_material_thrown_away: said(ad, 'ws_thrown', 'ws_thrown_what', true),
    scrap_not_recorded: rdDaysWhen_(ad, 'ws_rec', false, from, to),
    permits_and_inspections: regDue_(to, ['permit', 'inspection', 'licence'])
  };
}
var HSE_ASK_ =
  'You are the Chairman’s health, safety and environment officer. In at most 120 words, short bullets: anyone '+
  'hurt or working without safety gear, in their words; customer property damaged; behaviour incidents; the 5S '+
  'score and cleanliness; material thrown away or scrap not recorded; and permits or inspections due or overdue '+
  'from the register — or say the register has not been filled in yet. An injury comes first.';

/* ------------------------------------------------------------------ *
 *  Project control                                                    *
 * ------------------------------------------------------------------ */
var PC_LOOKBACK_ = 180;
function projectFacts_(P) {
  var to = P.end, back = addDays_(to, -PC_LOOKBACK_);
  var jobs = opsJobs_();
  var gd = (rdBy_('getachew', back, to)['getachew-daily']) || {};
  var sd = (rdBy_('betty', back, to)['betty-daily']) || {};
  var mat = {}, asm = {};
  rdRows_(gd, 'ord_list').forEach(function (x) { if (x.r.code) { var k = opsCode_(x.r.code); mat[k] = (mat[k] || 0) + n_(x.r.amount); } });
  rdRows_(sd, 'asm_released_list').forEach(function (x) { if (x.r.code) { var k = opsCode_(x.r.code); asm[k] = (asm[k] || 0) + n_(x.r.amount); } });
  var vo = voFacts_(back, to);
  var open = jobs.filter(function (j) { return opsStatus_(j) !== 'done'; });
  var rows = open.map(function (j) {
    var k = opsCode_(j.job), m = mat[k] || 0, a = asm[k] || 0, cost = m + a;
    var value = j.value != null ? n_(j.value) + (vo.by_job[k] || 0) : null;
    return { job: j.job, customer: j.cust || '', step: j.board ? j.board.n + ' ' + j.board.en : '',
             contract_value: j.value != null ? n_(j.value) : null, change_orders: vo.by_job[k] || 0,
             materials_ordered: m, assemblers_paid: a, cost_so_far: cost,
             margin_so_far: value !== null ? value - cost : null,
             cost_pct_of_value: value ? Math.round(cost / value * 1000) / 10 : null };
  });
  var withValue = rows.filter(function (r) { return r.contract_value !== null; });
  var flow = opsFlow_(jobs, to);
  var ew = spLatest_((rdBy_('elyas', P.start, addDays_(to, 1))['elyas-weekly']) || {}, P.start, addDays_(to, 1));
  var delayed = ew ? rdRows_({ x: ew.v }, 'w_delayed_list').map(function (x) { return x.r; }) : [];
  var causeL = choiceLabels_(P.schedule, 'elyas-weekly', 'w_delayed_list', 'cause');
  return {
    week: dayLabel_(P.start) + ' to ' + dayLabel_(to),
    open_jobs: open.length,
    jobs: rows.sort(function (a, b) { return (b.cost_pct_of_value || 0) - (a.cost_pct_of_value || 0); }).slice(0, 15),
    jobs_with_no_contract_value: rows.length - withValue.length,
    jobs_over_80pct_of_value: withValue.filter(function (r) { return r.cost_pct_of_value !== null && r.cost_pct_of_value > 80; }).map(function (r) { return r.job; }),
    jobs_over_100pct_of_value: withValue.filter(function (r) { return r.cost_pct_of_value !== null && r.cost_pct_of_value > 100; }).map(function (r) { return r.job; }),
    margin_so_far_on_jobs_with_value: withValue.reduce(function (a, r) { return a + (r.margin_so_far || 0); }, 0),
    cost_method: 'materials Getachew ordered for the job’s code, and assembler payments Selam released for it, against the contract value plus change orders; other costs are not tied to a job in the reports',
    stuck_jobs: flow.stuck_count, on_hold: flow.on_hold.length, back_for_rework: flow.back_for_rework.length,
    change_orders: vo.summary,
    assemblers: ew ? { as_of: dayLabel_(ew.day), working: a_(ew.v, 'as_total'), attendance_pct: a_(ew.v, 'as_att'),
                       late_more_than_once: a_(ew.v, 'as_late'), behaviour_problems: a_(ew.v, 'as_behave'), recommended_for_removal: a_(ew.v, 'as_removal'),
                       jobs_delayed_by_cause: spCount_(delayed, function (r) { return causeL[r.cause] || r.cause; }) } : null
  };
}
var PROJECT_ASK_ =
  'You are the Chairman’s project controller. In at most 130 words, short bullets: jobs whose cost so far is '+
  'over 80% or 100% of their value, by code and customer, with the figures; the margin so far; jobs stuck, on '+
  'hold or back for rework; change orders; and the assemblers — attendance, lateness, removals and jobs they '+
  'delayed. Say plainly that cost covers only materials and assembler pay.';

/* ------------------------------------------------------------------ *
 *  The data that needs new answers (filled by later work, or empty)   *
 * ------------------------------------------------------------------ */
function impFacts_(P) {
  var gw = (rdBy_('getachew', addDays_(P.end, -13), addDays_(P.end, 1))['getachew-weekly']) || {};
  var last = spLatest_(gw, addDays_(P.end, -13), addDays_(P.end, 1));
  var rows = last ? rows_(last.v.imp_list).filter(function (r) { return r && (r.item || r.ref); }) : [];
  if (!last || blank_(last.v.imp_any)) return { note: 'Import shipments are not reported yet (Getachew’s weekly report, Imports).' };
  var stageL = choiceLabels_(P.schedule, 'getachew-weekly', 'imp_list', 'stage');
  return {
    as_of: dayLabel_(last.day),
    shipments: rows.map(function (r) {
      return { item: String(r.item || '').trim(), supplier: String(r.sup || '').trim(), ref: String(r.ref || '').trim(),
               where: stageL[r.stage] || String(r.stage || '').trim(), eta_factory: String(r.eta || '').trim(), value: a_(r, 'value'),
               late: /^\d{4}-\d{2}-\d{2}$/.test(String(r.eta || '')) && String(r.eta) < P.end && r.stage !== 'delivered' };
    }),
    at_port_or_in_customs: rows.filter(function (r) { return r.stage === 'customs' || r.stage === 'port'; }).length
  };
}
function npsFacts_(from, to) {
  var scores = [];
  ['tsega', 'biruktayet'].forEach(function (id) {
    var sd = rdBy_(id, addDays_(to, -27), to)[id + '-sales-daily'] || {};
    rdRows_(sd, 'fu_list', addDays_(to, -27), to).forEach(function (x) { var s = a_(x.r, 'score'); if (s !== null && s >= 0 && s <= 10) scores.push(s); });
  });
  if (!scores.length) return { note: 'No NPS scores yet (the 0–10 score in the salespeople’s after-sales calls).' };
  var pro = scores.filter(function (s) { return s >= 9; }).length, det = scores.filter(function (s) { return s <= 6; }).length;
  return { scores_4_weeks: scores.length, promoters: pro, detractors: det,
           nps: Math.round((pro - det) / scores.length * 100), method: '% scoring 9–10 minus % scoring 0–6, over four weeks' };
}
function voFacts_(from, to) {
  var ed = (rdBy_('ephrata', from, to)['ephrata-daily']) || {};
  var rows = rdRows_(ed, 'vo_list', from, to).filter(function (x) { return x.r.code || x.r.cust; });
  var by = {};
  /* added to the price, less taken off it */
  var net = function (r) { return n_(r.value) - n_(r.less); };
  rows.forEach(function (x) { if (x.r.code && ay_(x.r, 'ok') !== false) { var k = opsCode_(x.r.code); by[k] = (by[k] || 0) + net(x.r); } });
  var anyAsked = Object.keys(ed).some(function (d) { return !blank_(ed[d].vo_any); });
  return {
    by_job: by,
    summary: anyAsked ? { change_orders: rows.length, value_birr: rows.reduce(function (a, x) { return a + net(x.r); }, 0),
                          not_approved: rows.filter(function (x) { return ay_(x.r, 'ok') === false; }).length }
                      : { note: 'Change orders are not reported yet (Ephrata’s daily report, Change orders).' }
  };
}
function maintPlan_(to) {
  var rows = sheetRows_(MAINT_TAB_, 8);
  if (!rows || !rows.length) return { note: 'The maintenance plan has not been filled in yet (Sheet tab “' + MAINT_TAB_ + '”).' };
  var tasks = [], parts = [];
  rows.forEach(function (r) {
    var machine = String(r[0] || '').trim(), task = String(r[1] || '').trim();
    var every = n_(r[2]), lastDone = legalDay_(r[3]);
    if (machine && task && every > 0) {
      var due = lastDone ? addDays_(lastDone, every) : null;
      tasks.push({ machine: machine, task: task, every_days: every, last_done: lastDone ? dayLabel_(lastDone) : null,
                   due: due ? dayLabel_(due) : 'never done', overdue_days: due && due < to ? hrDaysBetween_(due, to) : 0,
                   due_within_7_days: !!(due && due >= to && due <= addDays_(to, 7)), never_done: !lastDone });
    }
    var part = String(r[4] || '').trim();
    if (part) {
      var have = blank_(r[5]) ? null : n_(r[5]), min = blank_(r[6]) ? null : n_(r[6]);
      parts.push({ machine: machine, part: part, on_hand: have, minimum: min, below_minimum: have !== null && min !== null && have < min });
    }
  });
  return {
    tasks: tasks.length,
    overdue: tasks.filter(function (t) { return t.overdue_days > 0 || t.never_done; }),
    due_within_7_days: tasks.filter(function (t) { return t.due_within_7_days; }),
    spare_parts_below_minimum: parts.filter(function (p) { return p.below_minimum; })
  };
}
function regDue_(to, types) {
  var rows = sheetRows_(REG_TAB_, 8);
  if (!rows || !rows.length) return { note: 'The legal & compliance register has not been filled in yet (Sheet tab “' + REG_TAB_ + '”).' };
  var items = rows.map(function (r) {
    var type = spLower_(r[1]), due = legalDay_(r[3]), status = spLower_(r[4]);
    return { item: String(r[0] || '').trim(), type: type, with_whom: String(r[2] || '').trim(), due: due, status: status, owner: String(r[5] || '').trim() };
  }).filter(function (x) { return x.item && (!types || types.some(function (t) { return x.type.indexOf(t) === 0; })); });
  var open = items.filter(function (x) { return !/^(done|closed|renewed|paid|filed|passed)/.test(x.status); });
  var label = function (x) { return { item: x.item, type: x.type, with_whom: x.with_whom, due: x.due ? dayLabel_(x.due) : null, owner: x.owner, status: x.status || 'not given' }; };
  return {
    items: items.length,
    overdue: open.filter(function (x) { return x.due && x.due < to; }).map(function (x) { var l = label(x); l.days_overdue = hrDaysBetween_(x.due, to); return l; }),
    due_within_30_days: open.filter(function (x) { return x.due && x.due >= to && x.due <= addDays_(to, 30); }).map(label),
    with_no_date: open.filter(function (x) { return !x.due; }).map(label)
  };
}

/* ------------------------------------------------------------------ *
 *  The registry                                                       *
 * ------------------------------------------------------------------ */
var SPECIALISTS_ = [
  { id: 'procurement', en: 'Import & procurement', am: 'ግዥና ገቢ ዕቃ', role: 'head of procurement', when: { week: true },
    facts: function (P) { return procurementFacts_(P); }, ask: PROCUREMENT_ASK_,
    tiles: function (f) {
      var m = function (x) { return x === null || x === undefined ? '—' : fmt_(x); };
      return [{ en: 'Bought this week', am: 'በዚህ ሳምንት የተገዛ', v: m(f.bought_this_week_birr) },
              { en: 'Prices up over 10%', am: 'ከ10% በላይ የጨመሩ', v: String(f.prices_up_more_than_10pct.length) },
              { en: 'Average lead time (days)', am: 'አማካይ የመድረሻ ጊዜ (ቀን)', v: m(f.average_lead_days_8_weeks) },
              { en: 'Late from suppliers', am: 'ከአቅራቢ የዘገዩ', v: String(f.deliveries_late_this_week) }];
    } },
  { id: 'quality', en: 'Quality', am: 'ጥራት', role: 'head of quality', when: { week: true },
    facts: function (P) { return qualityFacts_(P); }, ask: QUALITY_ASK_,
    tiles: function (f) {
      var m = function (x) { return x === null || x === undefined ? '—' : String(x); };
      return [{ en: 'Pass rate', am: 'ያለፉ', v: f.pass_rate_pct === null ? '—' : f.pass_rate_pct + '%' },
              { en: 'Defects', am: 'ጉድለቶች', v: m(f.defects_found) },
              { en: 'Reached finished goods', am: 'ወደ ተጠናቀቀ ዕቃ የደረሱ', v: m(f.defects_reached_finished_goods) },
              { en: 'Rework open', am: 'ያልተጠናቀቀ ድጋሚ ሥራ', v: m(f.rework_still_open) }];
    },
    empty: function (f) { return !f.wude_days_reported; }, emptyText: 'Wude filed no daily QC report this week, so there is nothing to read.' },
  { id: 'customers', en: 'Customer satisfaction', am: 'የደንበኞች እርካታ', role: 'head of customer satisfaction', when: { week: true },
    facts: function (P) { return customersFacts_(P); }, ask: CUSTOMERS_ASK_,
    tiles: function (f) {
      var m = function (x) { return x === null || x === undefined ? '—' : String(x); };
      return [{ en: 'New complaints', am: 'አዲስ ቅሬታዎች', v: m(f.new_complaints_this_week) },
              { en: 'Open', am: 'ያልተፈቱ', v: m(f.open_now) },
              { en: 'Days to resolve', am: 'ለመፍታት የወሰደ ቀን', v: m(f.average_days_to_resolve_8_weeks) },
              { en: 'Satisfaction /5', am: 'እርካታ /5', v: m(f.satisfaction_out_of_5) }];
    } },
  { id: 'maintenance', en: 'Maintenance', am: 'ጥገና', role: 'head of maintenance', when: { week: true },
    facts: function (P) { return maintenanceFacts_(P); }, ask: MAINTENANCE_ASK_,
    tiles: function (f) {
      return [{ en: 'Breakdowns', am: 'ብልሽቶች', v: String(f.breakdowns_this_week) },
              { en: 'Hours down', am: 'የቆመበት ሰዓት', v: String(f.hours_down_this_week) },
              { en: 'Repeat machines', am: 'ደጋግመው የሚበላሹ', v: String(f.machines_breaking_down_repeatedly.length) },
              { en: 'Uptime', am: 'የሠራበት', v: f.uptime_pct_amaha === null ? '—' : f.uptime_pct_amaha + '%' }];
    } },
  { id: 'hse', en: 'Health, safety & environment', am: 'ጤና፣ ደህንነትና አካባቢ', role: 'health, safety and environment officer', when: { week: true },
    facts: function (P) { return hseFacts_(P); }, ask: HSE_ASK_,
    tiles: function (f) {
      var m = function (x) { return x === null || x === undefined ? '—' : String(x); };
      return [{ en: 'Injury days', am: 'የጉዳት ቀናት', v: String(f.injuries_or_no_safety_gear.length) },
              { en: 'Behaviour incidents', am: 'የሥነ ምግባር ችግሮች', v: m((f.behaviour_incidents_factory || 0) + (f.behaviour_incidents_site || 0)) },
              { en: '5S score', am: '5S ውጤት', v: f.score_5s_average === null ? '—' : f.score_5s_average + '%' },
              { en: 'Property damaged', am: 'የተጎዳ ንብረት', v: String(f.customer_property_damaged.length) }];
    } },
  { id: 'projects', en: 'Project control', am: 'የፕሮጀክት ቁጥጥር', role: 'project controller', when: { week: true },
    facts: function (P) { return projectFacts_(P); }, ask: PROJECT_ASK_,
    tiles: function (f) {
      return [{ en: 'Open jobs', am: 'ክፍት ሥራዎች', v: String(f.open_jobs) },
              { en: 'Over 80% of value', am: 'ከዋጋው 80% በላይ', v: String(f.jobs_over_80pct_of_value.length) },
              { en: 'Margin so far', am: 'እስካሁን ትርፍ', v: fmt_(f.margin_so_far_on_jobs_with_value) },
              { en: 'Stuck', am: 'የቆሙ', v: String(f.stuck_jobs) }];
    },
    empty: function (f) { return !f.open_jobs; }, emptyText: 'The job register has no open jobs, so there is nothing to control yet.' }
];
