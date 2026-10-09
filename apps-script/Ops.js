/* Klever — Operations: the week from plan to site.

   WHY THIS EXISTS
   The daily agents read Mahelet's figures one day at a time — production
   against Amaha's, defects against Wude's — and the job register keeps every
   KK job's step. Nothing put the week together: did the factory make what
   Mahelet's 15-day plan said it would, which jobs have slipped past her
   dates, where jobs are piling up on the board and whose move it is, and
   what actually lost the hours. This reads that every Sunday, beside the
   CFO, HR and the legal check (Packs.js weeklyPack_).

   WHERE IT COMES FROM
   - the plan: the 15-Day Production Plan in force this week (liu-plan) —
     its daily m² (plan_days, Day 1..15 counted Monday to Saturday from
     plan_start; Sundays are not working days) and its queue of jobs with
     start, done, QC and delivery dates (plan_queue)
   - what happened: Amaha's daily m² (Mahelet's when Amaha did not file),
     Mahelet's daily report (downtime, shortages, QC failures, deliveries),
     Elyas's site figures, and the job register (/register/jobs, Register.js),
     which already knows each job's step and the day it reached it

   Same rule as everywhere else: every figure is worked out here, in code;
   the model writes the reading from finished figures and does no sums.

   previewOps() logs the figures, writes nothing, calls no model.            */

var OPS_DAY_M2_ = 40;
/* an open job with no new step for this many days is stuck */
var OPS_STUCK_DAYS_ = 5;
var OPS_LIST_MAX_ = 8;
/* how far back to look for the plan in force */
var OPS_PLAN_LOOKBACK_ = 21;

/* a job code the way the register writes it ("kk 102" is KK-102) */
function opsCode_(s) { return regJob_(s); }

/* The 15-day plan in force this week: the last one filed whose first day is
   on or before the week's last day. One filed for next week starts after it. */
function opsPlan_(P) {
  var rows = tryQuery_('reports', [['person', 'EQUAL', 'liu'],
                                   ['at', 'GREATER_THAN_OR_EQUAL', dayStart_(addDays_(P.start, -OPS_PLAN_LOOKBACK_))],
                                   ['at', 'LESS_THAN', dayStart_(addDays_(P.end, 1))]], 'at');
  var hit = null;
  rows.forEach(function (f) {
    if (f.report !== 'liu-plan' || !f.at) return;
    var v = f.values || {};
    var start = String(v.plan_start || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || start > P.end) return;
    hit = { filed: dayOf_(f.at), start: start, v: v };
  });
  return hit;
}

/* WHAT THE PLAN NEEDS, AGAINST WHAT THE STORE HAS (the Chairman, 8 Oct
   2026: "she'll plan the production date before they even get bought").
   Mahelet's plan now names the material each job needs; Yordanos counts
   the same twelve on his shelf. What the plan needs and the store has not
   got is what Getachew must buy, and the job's planned start says by when. */
function opsPlanMaterials_(P, plan) {
  if (!plan) return null;
  var want = rows_(plan.v.plan_mat).filter(function (r) { return r && r.mat && !blank_(r.qty); });
  if (!want.length) return { note: 'The plan does not say what materials its jobs need (Mahelet’s 15-day plan, “Materials”).' };
  /* when each job is due to start, from the queue above it */
  var starts = {};
  rows_(plan.v.plan_queue).forEach(function (q) {
    if (q && q.code && q.start) starts[opsCode_(q.code)] = String(q.start).trim();
  });
  /* the store's latest count of the same twelve */
  var yord = daysOf_(P, 'yordanos-daily');
  var labels = pmGridLabels_(loadSchedule_(), 'yordanos-daily', 'k_stock');
  var onHand = null, counted = null;
  for (var i = yord.length - 1; i >= 0 && onHand === null; i--) {
    var grid = rows_(yord[i].v.k_stock);
    if (!grid.length) continue;
    var any = false, map = {};
    grid.forEach(function (r, k) {
      var q = a_(r, 'qty');
      if (q === null) q = a_(r, 'onhand');
      if (q !== null && labels[k]) { map[labels[k]] = q; any = true; }
    });
    if (any) { onHand = map; counted = yord[i].day; }
  }
  var need = {};
  want.forEach(function (r) {
    var m = String(r.mat).trim();
    (need[m] = need[m] || { material: m, needed: 0, jobs: [], firstStart: null });
    need[m].needed += n_(r.qty);
    /* the job codes as she wrote them in the one cell: "KK-500, kk 501" */
    (String(r.jobs || '').match(/KK[-\s]?\d+/gi) || []).forEach(function (j) {
      var code = opsCode_(j);
      if (need[m].jobs.indexOf(code) < 0) need[m].jobs.push(code);
      var st = starts[code];
      if (st && (!need[m].firstStart || st < need[m].firstStart)) need[m].firstStart = st;
    });
  });
  var lines = Object.keys(need).map(function (m) {
    var x = need[m];
    x.on_hand = onHand ? (onHand[m] === undefined ? null : onHand[m]) : null;
    x.short_by = x.on_hand === null ? null : Math.max(0, Math.round((x.needed - x.on_hand) * 100) / 100);
    /* the first of those jobs is the day to buy against */
    x.first_job_starts = x.firstStart ? dayLabel_(x.firstStart) : null;
    delete x.firstStart;
    return x;
  }).sort(function (a2, b2) { return (b2.short_by || 0) - (a2.short_by || 0); });
  return {
    store_counted_on: counted ? dayLabel_(counted) : null,
    materials: lines,
    to_buy: lines.filter(function (x) { return x.short_by; }),
    not_counted_by_the_store: lines.filter(function (x) { return x.on_hand === null; }).map(function (x) { return x.material; })
  };
}

/* Plan against what was made, day by day, for the working days of the week
   the plan covers. Made = Amaha's p_total; Mahelet's m2 if Amaha did not file. */
function opsPlanDays_(P, plan) {
  if (!plan) return null;
  var grid = rows_(plan.v.plan_days);
  var amaha = {}, liu = {};
  daysOf_(P, 'amaha-daily').forEach(function (x) { amaha[x.day] = x.v; });
  daysOf_(P, 'liu-daily').forEach(function (x) { liu[x.day] = x.v; });
  var days = [];
  for (var k = 1; k <= 15; k++) {
    var d = hrWorkday_(plan.start, k);
    if (d < P.start || d > P.end) continue;
    var planned = a_(grid[k - 1] || {}, 'm2');
    /* Amaha alone reports what was made (the Chairman, 8 Oct 2026) */
    var made = a_(amaha[d], 'p_total'), from = made === null ? null : 'Amaha';
    days.push({ day: dayLabel_(d), iso: d, plan_day: k, planned_m2: planned, made_m2: made, made_from: from,
                jobs_planned: String((grid[k - 1] || {}).jobs || '').trim(),
                short_by_m2: planned !== null && made !== null && made < planned ? planned - made : 0 });
  }
  var both = days.filter(function (x) { return x.planned_m2 !== null && x.made_m2 !== null; });
  var planned = sumOrNull_(both.map(function (x) { return x.planned_m2; }));
  var made = sumOrNull_(both.map(function (x) { return x.made_m2; }));
  return {
    plan_filed: dayLabel_(plan.filed),
    plan_starts: dayLabel_(plan.start),
    days: days,
    days_compared: both.length,
    planned_m2: planned,
    made_m2: made,
    plan_met_pct: planned ? Math.round(made / planned * 1000) / 10 : null,
    days_short: both.filter(function (x) { return x.made_m2 < x.planned_m2; }).length,
    days_not_reported: days.filter(function (x) { return x.made_m2 === null; }).length
  };
}

/* The job register as the morning left it — [] if it was never built */
function opsJobs_() {
  try {
    var d = fsGet_('register/jobs');
    return (d && d.rows) || [];
  } catch (e) {
    return [];
  }
}
function opsStatus_(j) { return j.ai && j.ai.status ? j.ai.status : j.status; }

/* Mahelet's queue against her own dates: production due done and not made,
   delivery due and not delivered, by the register's steps. */
function opsQueue_(plan, jobs, end) {
  if (!plan) return null;
  var byCode = {};
  jobs.forEach(function (j) { byCode[opsCode_(j.job)] = j; });
  var prod = [], deliv = [], n = 0;
  rows_(plan.v.plan_queue).forEach(function (q) {
    var code = opsCode_(q && q.code);
    if (!code) return;
    n++;
    var j = byCode[code] || null;
    var steps = (j && j.steps) || {};
    var now = j ? j.board.n + ' ' + j.board.en : 'not in the job register';
    var done = String(q.done || '').trim(), del = String(q.del || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(done) && done <= end && !steps.made) {
      prod.push({ job: (j && j.job) || code, customer: q.cust || (j && j.cust) || '', planned_done: dayLabel_(done),
                  days_late: hrDaysBetween_(done, end), step_now: now });
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(del) && del <= end && !steps.delivered) {
      deliv.push({ job: (j && j.job) || code, customer: q.cust || (j && j.cust) || '', planned_delivery: dayLabel_(del),
                   days_late: hrDaysBetween_(del, end), step_now: now,
                   why: j && j.reasons && j.reasons.length ? j.reasons[0] : '' });
    }
  });
  var late = function (a, b) { return b.days_late - a.days_late; };
  return { jobs_in_queue: n, production_behind_plan: prod.sort(late), delivery_behind_plan: deliv.sort(late) };
}

/* Where the open jobs sit on the board, which are held or back for rework,
   and the ones longest at their step. */
function opsFlow_(jobs, end) {
  var open = jobs.filter(function (j) { return opsStatus_(j) !== 'done'; });
  var at = {};
  open.forEach(function (j) {
    var k = j.board ? j.board.n + ' ' + j.board.en : 'unknown';
    at[k] = (at[k] || 0) + 1;
  });
  var byStep = Object.keys(at).map(function (k) { return { step: k, jobs: at[k] }; })
    .sort(function (a, b) { return parseInt(a.step, 10) - parseInt(b.step, 10) || (a.step < b.step ? -1 : 1); });
  var pick = function (st) {
    return open.filter(function (j) { return opsStatus_(j) === st; }).map(function (j) {
      return { job: j.job, customer: j.cust || '', step: j.board ? j.board.n + ' ' + j.board.en : '',
               why: (j.ai && j.ai.why) || j.why || '' };
    });
  };
  var stuck = open.map(function (j) {
    var since = (j.steps || {})[j.stageName] || '';
    return { j: j, since: since, days: /^\d{4}-\d{2}-\d{2}$/.test(since) && since <= end ? hrDaysBetween_(since, end) : null };
  }).filter(function (x) { return x.days !== null && x.days >= OPS_STUCK_DAYS_; })
    .sort(function (a, b) { return b.days - a.days; })
    .map(function (x) {
      var b = x.j.board || {};
      return { job: x.j.job, customer: x.j.cust || '', step: b.n + ' ' + b.en, since: dayLabel_(x.since),
               days_at_this_step: x.days, next_step: b.next || '', whose_move: b.nextWho || '',
               status: opsStatus_(x.j), why: (x.j.ai && x.j.ai.why) || x.j.why || '' };
    });
  return {
    jobs_in_register: jobs.length,
    open_jobs: open.length,
    open_jobs_by_step: byStep,
    on_hold: pick('hold'),
    back_for_rework: pick('rework'),
    stuck_count: stuck.length,
    stuck_longest: stuck.slice(0, OPS_LIST_MAX_),
    waiting_for_final_payment: open.filter(function (j) {
      return (j.reasons || []).some(function (r) { return /final payment/i.test(r); });
    }).length
  };
}

/* What lost the week, in hours or days, each from the report that measures it */
function opsBottlenecks_(P, ops) {
  var liu = daysOf_(P, 'liu-daily');
  var machines = {};
  liu.forEach(function (x) {
    rows_(x.v.downtime_list).forEach(function (r) {
      var m = String((r && r.machine) || '').trim();
      if (!m) return;
      var e = machines[m.toLowerCase()] || (machines[m.toLowerCase()] = { machine: m, hours: 0, causes: [] });
      e.hours += n_(r.hours);
      if (r.cause && e.causes.indexOf(String(r.cause).trim()) < 0) e.causes.push(String(r.cause).trim());
    });
  });
  var short = liu.filter(function (x) { return ay_(x.v, 'shortage') === true; });
  return {
    machine_downtime_hours: sumOf_(liu, 'downtime'),
    machines_that_stopped: Object.keys(machines).map(function (k) { return machines[k]; })
      .sort(function (a, b) { return b.hours - a.hours; }),
    factory_hours_lost_to_other_causes: ops.production.hours_lost,
    what_held_the_factory_up: hrSaid_(daysOf_(P, 'amaha-daily'), 'w_block'),
    days_stopped_for_board: ops.production.days_stopped_for_board,
    days_a_material_was_short: short.length,
    materials_short: short.map(function (x) { return dayLabel_(x.day).split(' ')[0] + ': ' + String(x.v.shortage_what || 'not named').trim(); }),
    site_hours_lost: ops.site.hours_lost_to_site,
    /* Wude's own count: quality is hers (the Chairman, 8 Oct 2026) */
    jobs_failed_qc: sumOf_(daysOf_(P, 'wude-daily'), 'i_fail'),
    job_files_returned_incomplete: sumOf_(liu, 'jf_rej'),
    /* purchasing is Getachew's (the Chairman, 8 Oct 2026): the deliveries
       he last reported late, with the supplier and the job */
    supplier_deliveries_late_last_day: (function () {
      var g = daysOf_(P, 'getachew-daily');
      if (!g.length) return null;
      return rows_(g[g.length - 1].v.sup_delay_list)
        .filter(function (r) { return r && (r.item || r.sup || r.code); }).length;
    })()
  };
}

/* Mahelet reports what leaves the factory; Elyas reports what happens at
   the site, job by job (the Chairman, 8 Oct 2026). */
function opsDelivery_(P) {
  var liu = daysOf_(P, 'liu-daily'), ely = daysOf_(P, 'elyas-daily');
  /* on time, from Elyas's own row for each job */
  var onA = 0, onB = 0, known = false;
  ely.forEach(function (x) {
    rows_(x.v.j_rows).forEach(function (r) {
      var ok = ay_(r, 'ontime');
      if (ok === null) return;
      known = true; onB++; if (ok) onA++;
    });
  });
  return {
    days_reported: liu.length,
    days_reported_by_the_site: ely.length,
    jobs_delivered: sumOf_(liu, 'delivered'),
    jobs_installed: sumOf_(ely, 'j_done'),
    m2_installed: sumOf_(ely, 'j_m2'),
    on_time: known ? onA : null,
    of_all: known ? onB : null,
    on_time_pct: onB ? Math.round(onA / onB * 1000) / 10 : null,
    jobs_the_site_was_not_ready_for: sumOf_(ely, 'r_notready'),
    hours_lost_because_a_site_was_not_ready: sumOf_(ely, 'r_lost'),
    customer_acceptances_signed: sumOf_(ely, 'ac_signed'),
    operations_complaints: sumOf_(ely, 'ac_complaints')
  };
}

function opsFacts_(P, ops) {
  ops = ops || operations_(P);
  var plan = opsPlan_(P);
  var jobs = opsJobs_();
  var liu = daysOf_(P, 'liu-daily');
  return {
    week: dayLabel_(P.start) + ' to ' + dayLabel_(P.end),
    plan_note: plan ? null : 'No 15-Day Production Plan covering this week was filed, so plan against made cannot be judged.',
    plan_against_made: opsPlanDays_(P, plan),
    what_the_plan_needs_and_the_store_has_not: opsPlanMaterials_(P, plan),
    production: {
      m2_made: ops.production.m2_made, m2_target: ops.production.m2_target,
      daily_target_m2: OPS_DAY_M2_, days_below_40: ops.production.days_below_40,
      average_waste_pct: ops.production.average_waste_pct
    },
    jobs_against_mahelets_dates: opsQueue_(plan, jobs, P.end),
    register_note: jobs.length ? null : 'The job register has no jobs yet, so the board cannot be read.',
    job_flow: opsFlow_(jobs, P.end),
    bottlenecks: opsBottlenecks_(P, ops),
    delivery_and_installation: opsDelivery_(P),
    mahelet_said: {
      /* one question now asks the problem, its cause and what is being done
         (9 Oct 2026), so there is no separate `cause` to read */
      problems: hrSaid_(liu, 'problem'),
      help_needed: hrSaid_(liu, 'need_help'),
      decisions_asked_of_the_chairman: hrSaid_(liu.filter(function (x) { return ay_(x.v, 'need_chair') === true; }), 'need_chair_what')
    }
  };
}

var OPS_ASK_ =
  'You are the Chairman’s head of operations. Write him the week from plan to site in at most 150 '+
  'words, short bullets. Lead with the one thing most likely to make a customer’s delivery late, with '+
  'the job code and the figures. Then the plan against what was made: plan_met_pct and the days short; '+
  'if plan_note is set, say the plan was not filed instead. Then the jobs behind Mahelet’s own dates — '+
  'production and delivery — by job code with days late. Then where open jobs are piling up and the '+
  'ones stuck longest, with whose move it is. Then what lost the most this week, comparing the hours '+
  'and days given, and what Mahelet said caused it. Then deliveries and installations on time. Then any '+
  'decision Mahelet asked of him. Quote the figures as given.';

function opsRead_(facts, P) {
  var d = facts.delivery_and_installation;
  if (!facts.plan_against_made && !facts.job_flow.jobs_in_register && !d.days_reported &&
      facts.production.m2_made === null) {
    /* nothing to read, so no model is paid to say so */
    return 'No 15-day plan, no daily operations reports, no production figures and no jobs in the register ' +
           'this week, so there is nothing to say about operations yet.';
  }
  if (!brain_().key) return '(No model key set — GEMINI_KEY. The figures are still complete.)';
  var prompt = [
    'You are reading one week of operations at Klever Küche, a kitchen cabinet maker in Addis Ababa:',
    'from Mahelet’s 15-day production plan through the factory, QC, delivery and installation.',
    'The factory target is 40 m² a working day.',
    '',
    'Every number below was calculated in code and is correct. Quote them as given and do no',
    'arithmetic of your own. A null was not reported — it is not zero; say "not reported".',
    'Write plainly: no bold headline labels, no adjectives doing the work of evidence.',
    '',
    'YOUR TASK: ' + OPS_ASK_,
    '',
    '--- ' + P.start + ' to ' + P.end + ' ---',
    JSON.stringify(facts, null, 1)
  ].join('\n');
  return aiAsk_(prompt, 1500);
}

/* What his page and the pack keep of it (Packs.js savePack_). */
function opsSaved_(facts, text) {
  if (!facts) return {};
  var pd = facts.plan_against_made, q = facts.jobs_against_mahelets_dates, fl = facts.job_flow;
  return {
    opsText: String(text || ''),
    opsPlanPct: pd ? pd.plan_met_pct : null,
    opsBehind: q ? q.production_behind_plan.length + q.delivery_behind_plan.length : null,
    opsStuck: fl.stuck_count,
    opsHold: fl.on_hold.length,
    opsDays: pd ? pd.days.map(function (x) {
      return { day: x.iso, planned: x.planned_m2, made: x.made_m2 };
    }) : [],
    /* the whole of it, for the questions he asks later (Ask.js) */
    opsJson: JSON.stringify(facts)
  };
}

/* Operations' part of the Sunday email. */
function opsMailHtml_(facts, text) {
  var cell = 'padding:5px 8px;border-bottom:1px solid #e4e7e3';
  var head = 'padding:0 8px 5px';
  var num = function (x) { return x === null || x === undefined ? '—' : fmt_(x); };
  var html = '<h3 style="font-size:13.5px;margin:0 0 6px;color:#0f5c54">Your operations — plan to site</h3>' +
    '<div style="background:#f3f4f1;border-left:3px solid #3b6fb0;padding:14px 16px;' +
    'margin-bottom:12px;font-size:14px;line-height:1.65;white-space:pre-wrap">' + esc_(text) + '</div>';
  var pd = facts.plan_against_made;
  if (pd && pd.days.length) {
    html += '<table width="100%" cellpadding="0" cellspacing="0" style="font-size:12.5px;margin-bottom:14px">' +
      '<tr style="color:#66716d;font-size:10.5px;letter-spacing:.08em;text-align:left">' +
      '<th style="' + head + '">DAY</th><th style="' + head + ';text-align:right">PLANNED M²</th>' +
      '<th style="' + head + ';text-align:right">MADE M²</th></tr>';
    pd.days.forEach(function (x) {
      var short = x.planned_m2 !== null && x.made_m2 !== null && x.made_m2 < x.planned_m2;
      html += '<tr><td style="' + cell + '">' + esc_(x.day) + '</td><td align="right" style="' + cell +
              ';font-family:monospace;color:#66716d">' + num(x.planned_m2) + '</td><td align="right" style="' + cell +
              ';font-family:monospace' + (short ? ';color:#8f3020' : '') + '">' + num(x.made_m2) + '</td></tr>';
    });
    html += '</table>';
  }
  var list = function (title, rows) {
    if (!rows.length) return '';
    return '<p style="font-size:12.5px;margin:0 0 4px;font-weight:bold">' + esc_(title) + '</p>' +
      '<ul style="font-size:12.5px;margin:0 0 14px;padding-left:18px">' +
      rows.map(function (r) { return '<li>' + esc_(r) + '</li>'; }).join('') + '</ul>';
  };
  var q = facts.jobs_against_mahelets_dates;
  if (q) {
    html += list('Behind Mahelet’s dates', q.delivery_behind_plan.map(function (x) {
      return x.job + ' ' + x.customer + ' — delivery planned ' + x.planned_delivery + ', ' + x.days_late + ' days late, now at ' + x.step_now;
    }).concat(q.production_behind_plan.map(function (x) {
      return x.job + ' ' + x.customer + ' — production due done ' + x.planned_done + ', ' + x.days_late + ' days late, now at ' + x.step_now;
    })));
  }
  html += list('Stuck longest', facts.job_flow.stuck_longest.map(function (x) {
    return x.job + ' ' + x.customer + ' — ' + x.days_at_this_step + ' days at ' + x.step +
           (x.whose_move ? '; next: ' + x.next_step + ' (' + x.whose_move + ')' : '');
  }));
  return html + '<div style="margin-bottom:22px"></div>';
}

/* The figures for the week that closed last, or the week ending on a Sunday
   given as 'yyyy-mm-dd'. Writes nothing and calls no model. */
function previewOps(endDay) {
  if (!isDay_(endDay)) endDay = null;
  var end = endDay ? sundayOf_(endDay) : lastClosedSunday_();
  var P = packData_(addDays_(end, -6), end);
  P.week = end;
  Logger.log(JSON.stringify(opsFacts_(P), null, 1));
}
