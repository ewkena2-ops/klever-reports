/* Klever — the Daily COO / Plant Manager's figures. The agent itself is one
   entry in AGENTS (Agents.js, id 'plantmanager'); this works out what it is
   handed, every morning on the day just closed (and on "Analyse now").

   WHAT IT ADDS. The production analyst reads Amaha's day; quality, store
   and purchasing read theirs. Nobody ran the plant: yesterday against
   Mahelet's 15-day plan and the 40 m² a day, the week against its 240 m²,
   whether today's plan can actually be made with the machines, materials
   and people there are, which jobs are late or fall due today and
   tomorrow — and what each person on the factory side must do today. Every
   figure and every action is worked out here, in code, from the reports,
   the plan and the job register (Register.js); the model writes the
   morning's words. The morning's AI task list (Team.js) reads this
   finding, so the actions it names can become tasks he sends.           */

var PM_DAY_M2_ = 40;
var PM_WEEK_DAYS_ = 6;
var PM_ACTIONS_ = 3;
var PM_LOW_DAYS_ = 5;
/* who does what, by account id */
var PM_WHO_ = { lead: 'liu', floor: 'amaha', qc: 'wude', store: 'yordanos', buy: 'getachew', site: 'elyas', money: 'betty' };

/* the row labels of a grid question, from the live schedule */
function pmGridLabels_(schedule, reportId, fieldId) {
  var out = [];
  ((schedule && schedule.reports) || []).forEach(function (r) {
    if (r.id !== reportId) return;
    var walk = function (fs) {
      (fs || []).forEach(function (f) {
        if (f.fields) walk(f.fields);
        if (f.id === fieldId && f.rows) out = f.rows.map(function (x) { return x.en; });
      });
    };
    walk(r.sections ? r.sections.map(function (s) { return { fields: s.fields }; }) : r.fields);
  });
  return out;
}

/* Mahelet's 15-day plans filed in the weeks up to a day, oldest first —
   read once, then each day takes the one in force on it */
function pmPlans_(from, to) {
  return tryQuery_('reports', [['person', 'EQUAL', 'liu'],
                               ['at', 'GREATER_THAN_OR_EQUAL', dayStart_(addDays_(from, -OPS_PLAN_LOOKBACK_))],
                               ['at', 'LESS_THAN', dayStart_(addDays_(to, 1))]], 'at')
    .filter(function (f) { return f.report === 'liu-plan' && f.at; })
    .map(function (f) { var v = f.values || {}; return { filed: dayOf_(f.at), start: String(v.plan_start || '').trim(), v: v }; })
    .filter(function (p) { return /^\d{4}-\d{2}-\d{2}$/.test(p.start); });
}
/* the plan in force on a day — the last filed by then that has started —
   and that day's place in it (Day k is the k-th working day, Monday to
   Saturday, from its first day) */
function pmPlanDay_(plans, day) {
  var plan = null;
  plans.forEach(function (p) { if (p.start <= day && p.filed <= day) plan = p; });
  if (!plan) return null;
  var k = 0;
  for (var i = 1; i <= 15; i++) if (hrWorkday_(plan.start, i) === day) { k = i; break; }
  var row = k ? (rows_(plan.v.plan_days)[k - 1] || {}) : {};
  return { plan: plan, day_of_plan: k || null, planned_m2: k ? a_(row, 'm2') : null,
           jobs: k ? String(row.jobs || '').trim() : '' };
}

/* made on a day: Amaha's figure. He is the only one asked for it (the
   Chairman, 8 Oct 2026), so a day he did not file has no figure — null,
   which reads as "not reported", never as a day of nothing. */
function pmMade_(byReport, day) {
  return a_((byReport['amaha-daily'] || {})[day], 'p_total');
}

/* OEE, as near as the reports allow: availability from Amaha's machine rows
   (8 hours a machine, less the hours down), performance against 40 m², and
   quality from Wude's pass rate (Amaha's checkpoints when Wude did not
   inspect). Null when a part is not reported. */
function pmOee_(amaha, wude, made) {
  var rows = rows_(amaha.m_rows).filter(function (r) { return r && r.name; });
  var avail = null;
  if (rows.length) {
    var planned = rows.length * 8, down = rows.reduce(function (a, r) { return a + Math.min(8, n_(r.down)); }, 0);
    avail = (planned - down) / planned;
  }
  var perf = made === null ? null : Math.min(1, made / PM_DAY_M2_);
  var it = a_(wude, 'i_total'), ip = a_(wude, 'i_pass'), qual = null;
  if (it) qual = (ip || 0) / it;
  else {
    var p = 0, f = 0;
    rows_(amaha.qc).forEach(function (r) { p += n_(r && r.pass); f += n_(r && r.fail); });
    if (p + f) qual = p / (p + f);
  }
  var pct = function (x) { return x === null ? null : Math.round(x * 1000) / 10; };
  return { availability_pct: pct(avail), performance_pct: pct(perf), quality_pct: pct(qual),
           oee_pct: avail !== null && perf !== null && qual !== null ? pct(avail * perf * qual) : null,
           method: 'availability: 8 hours a machine less hours down (Amaha); performance: made against 40 m²; quality: Wude’s pass rate' };
}

function plantManager_(d) {
  var names = {};
  ((d.schedule && d.schedule.people) || []).forEach(function (p) { names[p.id] = p.en; });
  var nm = function (k) { return names[PM_WHO_[k]] || PM_WHO_[k]; };
  var today = d.provisional ? d.day : addDays_(d.day, 1);
  while (dow_(today) === 0) today = addDays_(today, 1);       /* Sunday is nobody's working day */
  var dw = dow_(d.day);
  var monday = addDays_(d.day, -(dw === 0 ? 6 : dw - 1));
  var left = Math.max(0, PM_WEEK_DAYS_ - dw);

  /* the week's daily reports, the last filing of each day, by report */
  var by = {};
  (d.recent || []).concat(d.filed || []).forEach(function (f) {
    var day = f.day || (f.at ? dayOf_(f.at) : '');
    if (!day) return;
    (by[f.report] = by[f.report] || {})[day] = f.fields || {};
  });
  var v = function (rep) { return (by[rep] || {})[d.day] || {}; };
  var amaha = v('amaha-daily'), liu = v('liu-daily'), wude = v('wude-daily');
  var yord = v('yordanos-daily'), geta = v('getachew-daily');

  /* yesterday, the week, today's plan */
  var plans = pmPlans_(monday, today);
  var pY = pmPlanDay_(plans, d.day), pT = pmPlanDay_(plans, today);
  var made = pmMade_(by, d.day);
  var weekMade = 0, weekPlanned = 0, known = 0, owed = 0;
  for (var x = monday; x <= d.day; x = addDays_(x, 1)) {
    if (dow_(x) === 0) continue;
    owed++;
    var m = pmMade_(by, x);
    if (m !== null) { weekMade += m; known++; }
    var px = pmPlanDay_(plans, x);
    if (px && px.planned_m2 !== null) weekPlanned += px.planned_m2;
  }
  var weekTarget = PM_DAY_M2_ * PM_WEEK_DAYS_;
  var weekLeft = Math.max(0, weekTarget - weekMade);

  /* machines down and not back */
  var machines = [];
  rows_(amaha.m_rows).forEach(function (r) {
    if (!r || !r.name) return;
    if (ay_(r, 'run') === false || n_(r.down) > 0) {
      machines.push({ machine: String(r.name).trim(), ran: ay_(r, 'run'), hours_down: a_(r, 'down'), cause: String(r.cause || '').trim(), back: '' });
    }
  });
  rows_(liu.downtime_list).forEach(function (r) {
    if (!r || !r.machine) return;
    var k = String(r.machine).trim().toLowerCase();
    var hit = machines.filter(function (mm) { return mm.machine.toLowerCase() === k; })[0];
    if (hit) { hit.back = String(r.back || '').trim(); if (!hit.cause) hit.cause = String(r.cause || '').trim(); }
    else machines.push({ machine: String(r.machine).trim(), ran: null, hours_down: a_(r, 'hours'), cause: String(r.cause || '').trim(), back: String(r.back || '').trim() });
  });

  /* materials: running out, short, late from suppliers, rejected */
  var labels = pmGridLabels_(d.schedule, 'yordanos-daily', 'k_stock');
  var low = rows_(yord.k_stock).map(function (r, i) {
    return { material: labels[i] || ('row ' + (i + 1)), on_hand: a_(r, 'qty'), days_left: a_(r, 'days') };
  }).filter(function (r) { return r.days_left !== null && r.days_left <= PM_LOW_DAYS_; })
    .sort(function (a, b) { return a.days_left - b.days_left; });
  var lateSup = rows_(geta.sup_delay_list).filter(function (r) { return r && (r.item || r.sup); }).map(function (r) {
    return { supplier: String(r.sup || '').trim(), job: r.code ? opsCode_(r.code) : '', item: String(r.item || '').trim(),
             was_due: String(r.was || '').trim(), now: String(r.now || '').trim(), stops_production: ay_(r, 'stops') === true };
  });
  var rejected = rows_(geta.del_rej_list).filter(function (r) { return r && r.item; }).map(function (r) {
    return { item: String(r.item).trim(), supplier: String(r.sup || '').trim(), job: r.code ? opsCode_(r.code) : '', why: String(r.why || '').trim() };
  });
  var shortNow = [];
  if (ay_(liu, 'shortage') === true) shortNow.push(String(liu.shortage_what || 'not named').trim());
  if (ay_(amaha, 'b_short') === true) shortNow.push('board: ' + String(amaha.b_shortw || 'not named').trim());

  /* QC */
  var failed = rows_(wude.i_jobs).filter(function (r) { return r && r.code && ay_(r, 'pass') === false; })
    .map(function (r) { return { job: opsCode_(r.code), customer: String(r.cust || '').trim(), why: String(r.why || '').trim() }; });

  /* people */
  var roster = ((d.schedule && d.schedule.people) || []).filter(function (p) { return p.roleEn === 'Production Worker'; });
  var assigned = a_(amaha, 'mp_assigned'), present = a_(amaha, 'mp_present');
  var absent = hrTally_([{ day: d.day, v: amaha }], 'mp_absent_list', roster, { col: 'ok', key: 'without_permission' });

  /* jobs: the plan's queue against the register */
  var jobs = opsJobs_();
  var byCode = {};
  jobs.forEach(function (j) { byCode[opsCode_(j.job)] = j; });
  var queue = pT ? rows_(pT.plan.v.plan_queue) : [];
  var tomorrow = addDays_(today, 1);
  while (dow_(tomorrow) === 0) tomorrow = addDays_(tomorrow, 1);
  var late = [], due = [], noFinal = [];
  queue.forEach(function (q) {
    var code = opsCode_(q && q.code);
    if (!code) return;
    var j = byCode[code] || null, st = (j && j.steps) || {};
    var job = (j && j.job) || code, cust = (q.cust || (j && j.cust) || '');
    var stepNow = j ? j.board.n + ' ' + j.board.en : 'not in the job register';
    [['done', 'made', 'production finished', PM_WHO_.floor], ['qc', 'qc', 'QC released', PM_WHO_.qc],
     ['del', 'delivered', 'delivered', PM_WHO_.site]].forEach(function (g) {
      var date = String(q[g[0]] || '').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || st[g[1]]) return;
      if (date < today) late.push({ job: job, customer: cust, should_be: g[2], by: dayLabel_(date), days_late: hrDaysBetween_(date, today), step_now: stepNow, owner: g[3] });
      else if (date === today || date === tomorrow) due.push({ job: job, customer: cust, to_be: g[2], on: dayLabel_(date), step_now: stepNow, owner: g[3] });
    });
    var start = String(q.start || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(start) && start <= tomorrow && !st.production && !st.final && !st.made) {
      noFinal.push({ job: job, customer: cust, planned_start: dayLabel_(start), step_now: stepNow });
    }
  });
  late.sort(function (a, b) { return b.days_late - a.days_late; });
  var rework = jobs.filter(function (j) { return opsStatus_(j) === 'rework'; }).map(function (j) {
    return { job: j.job, customer: j.cust || '', why: (j.ai && j.ai.why) || j.why || '' };
  });

  /* today, person by person — the order inside each list is the order to do them */
  var acts = {};
  var add = function (who, what, why) { (acts[who] = acts[who] || []).push({ do: what, why: why }); };
  if (pT && pT.planned_m2 !== null) {
    add(PM_WHO_.floor, 'make ' + pT.planned_m2 + ' m²' + (pT.jobs ? ' on ' + pT.jobs : ''),
        'Day ' + pT.day_of_plan + ' of Mahelet’s plan from ' + dayLabel_(pT.plan.start));
  } else {
    add(PM_WHO_.lead, 'set today’s m² and jobs', 'no 15-day plan covers ' + dayLabel_(today));
  }
  late.filter(function (l) { return l.should_be === 'production finished'; }).forEach(function (l) {
    add(PM_WHO_.lead, 'give ' + l.job + ' a new finish date or move it up the queue', 'planned finished by ' + l.by + ', ' + l.days_late + ' days late, now at ' + l.step_now);
  });
  machines.filter(function (mm) { return !mm.back; }).forEach(function (mm) {
    add(PM_WHO_.lead, 'get a back-in-service time for the ' + mm.machine, 'down ' + (mm.hours_down === null ? '' : mm.hours_down + ' h ') + (mm.cause ? '(' + mm.cause + ')' : '') + ', no return time given');
  });
  rework.forEach(function (r) { add(PM_WHO_.floor, 'redo ' + r.job + (r.customer ? ' (' + r.customer + ')' : ''), r.why || 'back for rework'); });
  failed.forEach(function (f) { add(PM_WHO_.qc, 're-inspect ' + f.job + ' once it is reworked', 'failed QC yesterday' + (f.why ? ': ' + f.why : '')); });
  due.filter(function (x) { return x.to_be === 'QC released'; }).forEach(function (x) { add(PM_WHO_.qc, 'inspect ' + x.job + ' for release', 'QC planned ' + x.on); });
  lateSup.filter(function (s) { return s.stops_production; }).forEach(function (s) {
    add(PM_WHO_.buy, 'get ' + s.item + (s.supplier ? ' from ' + s.supplier : '') + ' in', 'late' + (s.job ? ' for ' + s.job : '') + ', it stops production' + (s.now ? '; now promised ' + s.now : ''));
  });
  low.forEach(function (r) { add(PM_WHO_.buy, 'order ' + r.material, r.days_left + ' days of it left in the store (Yordanos)'); });
  rejected.forEach(function (r) { add(PM_WHO_.buy, 'replace the rejected ' + r.item + (r.supplier ? ' from ' + r.supplier : ''), r.why || 'rejected at the store'); });
  if (ay_(yord, 'k_low') === true && !low.length) add(PM_WHO_.store, 'tell Getachew what runs out within 5 days', 'said something will, without saying what');
  due.filter(function (x) { return x.to_be === 'delivered'; }).forEach(function (x) { add(PM_WHO_.site, 'deliver ' + x.job + (x.customer ? ' to ' + x.customer : '') + ' — confirm the site is ready', 'delivery planned ' + x.on + '; now at ' + x.step_now); });
  late.filter(function (l) { return l.should_be === 'delivered'; }).forEach(function (l) { add(PM_WHO_.site, 'give the customer of ' + l.job + ' a new delivery day', 'planned ' + l.by + ', ' + l.days_late + ' days late'); });
  noFinal.forEach(function (n2) { add(PM_WHO_.money, 'confirm the final payment for ' + n2.job + (n2.customer ? ' (' + n2.customer + ')' : '') + ' or tell Mahelet to hold it', 'production planned to start ' + n2.planned_start + '; no final payment recorded'); });

  var today_actions = {};
  ['lead', 'floor', 'qc', 'store', 'buy', 'site', 'money'].forEach(function (k) {
    today_actions[nm(k)] = (acts[PM_WHO_[k]] || []).slice(0, PM_ACTIONS_);
  });

  return {
    the_day_read: dayLabel_(d.day),
    acting_on: dayLabel_(today),
    yesterday: {
      made_m2: made, made_from: a_(amaha, 'p_total') !== null ? 'Amaha' : (made !== null ? 'Mahelet' : null),
      daily_target_m2: PM_DAY_M2_,
      planned_m2: pY ? pY.planned_m2 : null,
      short_of_plan_m2: pY && pY.planned_m2 !== null && made !== null && made < pY.planned_m2 ? pY.planned_m2 - made : 0,
      waste_pct: a_(amaha, 'w_pct'), waste_limit_pct: 20,
      hours_lost: a_(amaha, 'w_lost'), what_held_it_up: String(amaha.w_block || '').trim(),
      produced_without_the_four_confirmations: ay_(amaha, 'u_any'),
      oee: pmOee_(amaha, wude, made)
    },
    week: {
      from: dayLabel_(monday), working_days_so_far: owed, days_reported: known,
      made_m2: known ? weekMade : null, planned_m2_so_far: weekPlanned || null,
      week_target_m2: weekTarget, left_to_target_m2: known ? weekLeft : null,
      working_days_left: left,
      needed_each_remaining_day_m2: known && left > 0 ? Math.ceil(weekLeft / left) : null
    },
    today_plan: pT ? { plan_day: pT.day_of_plan, planned_m2: pT.planned_m2, jobs: pT.jobs,
                       plan_from: dayLabel_(pT.plan.start) }
                   : { note: 'No 15-day plan covers ' + dayLabel_(today) + '.' },
    can_today_be_made: {
      machines_down: machines,
      materials_short_yesterday: shortNow,
      running_out_within_5_days: low,
      supplier_deliveries_late: lateSup,
      deliveries_rejected: rejected,
      workers_present: present, workers_assigned: assigned,
      absent: absent.map(function (a) { return a.name + (a.without_permission ? ' (no permission)' : ''); })
    },
    quality: {
      inspected: a_(wude, 'i_total'), passed: a_(wude, 'i_pass'), failed: a_(wude, 'i_fail'),
      failed_jobs: failed, defects_reached_finished_goods: a_(wude, 'd_released'),
      rework_needed: a_(wude, 'r_required'), rework_finished: a_(wude, 'r_done'),
      jobs_back_for_rework: rework
    },
    jobs: {
      register_note: jobs.length ? null : 'The job register has no jobs yet.',
      late_against_the_plan: late.map(function (l) { return { job: l.job, customer: l.customer, should_be: l.should_be, by: l.by, days_late: l.days_late, step_now: l.step_now }; }),
      due_today_or_next_working_day: due.map(function (x) { return { job: x.job, customer: x.customer, to_be: x.to_be, on: x.on, step_now: x.step_now }; }),
      due_to_start_with_no_final_payment: noFinal
    },
    today_actions: today_actions
  };
}
