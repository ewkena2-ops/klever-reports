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

   SET UP: the same Script Properties as the ledger — GEMINI_KEY,
   FIREBASE_WEB_KEY, LEDGER_PASSWORD — then setupTriggers() once (Agent.js). */

/* ------------------------------------------------------------------ *
 *  Small helpers                                                      *
 * ------------------------------------------------------------------ */

function n_(v) {
  if (v == null || v === '') return 0;
  var x = Number(String(v).replace(/[^0-9.\-]/g, ''));
  return isNaN(x) ? 0 : x;
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
  return f ? n_((f.fields || {})[field]) : null;
}
/* every report that was due today and did not arrive */
function notFiled_(d) {
  return d.ledger.filter(function (l) { return l.status === 'MISSING'; })
                 .map(function (l) { return l.person + ' — ' + l.report; });
}
function pctOf_(part, whole) {
  return whole ? Math.round((part / whole) * 1000) / 10 : 0;
}

/* The same figure on each of the seven days ending today, oldest first.
   null is a day it was owed and not reported, which is not a zero — the same
   distinction as nOrNull_, carried across a week. 'not due' is a day nobody
   owed it: a Sunday, or a day the letter excuses. The first live run read a
   Sunday's null as a second missed store report; the two have to look
   different. */
function series_(d, reportId, field) {
  var rep = null;
  ((d.schedule && d.schedule.reports) || []).forEach(function (r) { if (r.id === reportId) rep = r; });
  var out = [];
  for (var i = 6; i >= 0; i--) {
    var day = addDays_(d.day, -i), v = null;
    (d.recent || []).forEach(function (f) {
      if (f.report === reportId && f.day === day) v = n_((f.fields || {})[field]);
    });
    if (v === null && rep && !dueOn_({ reports: [rep] }, day).length) v = 'not due';
    out.push(v);
  }
  return out;
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
  var by = {};
  (d.recent || []).forEach(function (f) {
    if (f.report === reportId && f.day >= monday && f.day <= d.day) by[f.day] = n_((f.fields || {})[field]);
  });
  var days = Object.keys(by);
  return { since: monday, days_reported: days.length,
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
    return { day: doc.day, lines: (doc.lines || []).map(function (l) {
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

var DECISIONS = [

{ id:'assembler-rate', what:'The assembler pay rate',
  yours:true,
  detail:'Clause 3 says 600 Birr per m², which over a 26-day month at 8 a day is 124,800 Birr. '+
         'Clause 4 says a standard month is 9,000 to 11,000. The two are about twelve times apart.',
  blocks:'Assembler Complete File, Handbook, Contract, Elyas Complete File parts 3 and 5 — '+
         'nothing can be printed for assemblers until one figure wins',
  bites: function () {
    return 'Still blocking. This is the only open decision that stops paper leaving the building, '+
           'and it has blocked it every day since it was raised.';
  } },

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
    return hit ? 'Yordanos was ' + hit + ' today and was charged nothing, because his letter '+
                 'sets no figure. Everyone else in the same position paid.' : null;
  } },

{ id:'weekly-missing', what:'What a weekly report costs when it never arrives',
  yours:true,
  detail:'Every letter sets 500 Birr for a weekly report filed late. Most set nothing for one '+
         'that never arrives. The exceptions are Ephrata’s weekly report (–500) and projection '+
         '(–500, –1,000 the second time running) and Betelhem’s 4-week projection (–1,000) and '+
         'job list (–500). Mahelet’s 15-day plan costs 5,000 late and nothing missing, unless it '+
         'is missed two weeks running. So for most weekly reports filing an hour late costs 500 '+
         'and not filing costs nothing, which is the wrong way round and is what the ledger '+
         'charges, because it charges what the paper says. A weekly report still missing at '+
         'midnight on its due day counts as missing.',
  blocks:'Every letter with a weekly report in it — Ephrata, Mahelet, Betelhem, Amaha, Wude, '+
         'Elyas, Getachew, Yordanos, both salespeople, all five designers',
  bites: function (d) {
    var n = 0;
    d.ledger.forEach(function (l) {
      if (l.status === 'MISSING' && /Weekly|Summary|Projection|Plan/i.test(l.report) &&
          l.amount === 0) n++;
    });
    return n ? n + ' weekly report' + (n > 1 ? 's' : '') + ' never arrived today and cost '+
               'nobody anything, while filing one an hour late would have cost 500 Birr each.'
             : null;
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
    if (n_(e.q_rework) > 0) why.push('work was refused and reworked at site');
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
  detail:'The 50% advance contradicts Mahelet’s and Betelhem’s letters, which both forbid '+
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
  detail:'It pays three salespeople and six designers. There are two and five. It also prints '+
         'Amaha’s base as 35,008 Birr where his letter says 35,000.',
  blocks:'Master file section 16 — 25,008 Birr a month',
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
  cmp('m² installed — Elyas against Mahelet', 'elyas-daily','j_m2', 'liu-daily','installed');
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
  facts: function (d) {
    var amaha = vals_(d.filed, 'amaha-daily');
    var elyas = vals_(d.filed, 'elyas-daily');
    var assigned = n_(amaha.mp_assigned), present = n_(amaha.mp_present);
    return {
      factory_assigned: assigned,
      factory_present: present,
      factory_absent: n_(amaha.mp_absent),
      factory_late: n_(amaha.mp_late),
      factory_attendance_pct: pctOf_(present, assigned),
      factory_behaviour_issues: n_(amaha.mp_behave),
      site_assemblers_present: n_(elyas.a_present),
      site_assemblers_late: n_(elyas.a_late),
      site_left_early: n_(elyas.a_early),
      site_behaviour_issues: n_(elyas.a_behave),
      site_issues_reported_to_mahelet: yes_(elyas.a_reported),
      production_target_m2_per_day: 40,
      m2_produced: n_(amaha.p_total),
      /* without these it will blame the shortfall on whoever was absent, which
         is the first thing it sees and often not the reason */
      hours_lost_to_something_else: n_(amaha.w_lost),
      what_else_held_the_day_up: amaha.w_block || '',
      stopped_for_missing_board: yes_(amaha.b_short),
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
  facts: function (d) {
    var amaha = vals_(d.filed, 'amaha-daily');
    var stage = rows_(amaha.w_stage);
    return {
      m2_produced: n_(amaha.p_total),
      m2_target: 40,
      m2_external: n_(amaha.p_ext),
      m2_rovestone: n_(amaha.p_rove),
      waste_pct: n_(amaha.w_pct),
      waste_limit_pct: 20,
      material_over_bom_pct: n_(amaha.w_var),
      sheets_used: n_(amaha.b_sheets),
      m2_per_sheet: n_(amaha.b_yield),
      m2_per_sheet_target: 2.2,
      edge_banding_m: n_(amaha.b_edge),
      edge_reruns: n_(amaha.b_redo),
      stopped_for_missing_board: yes_(amaha.b_short),
      which_board: amaha.b_shortw || '',
      stage_holding_us_up: amaha.w_block || '',
      hours_lost: n_(amaha.w_lost),
      wip_by_stage: stage,
      machines_all_reported_in_30min: yes_(amaha.m_reported),
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
  facts: function (d) {
    var wude = vals_(d.filed, 'wude-daily');
    return {
      inspected: n_(wude.i_total), passed: n_(wude.i_pass), failed: n_(wude.i_fail),
      pass_rate_pct: n_(wude.i_rate), pass_rate_bonus_at: 98,
      defects_found: n_(wude.d_total),
      defects_released_to_finished_goods: n_(wude.d_released),
      rework_rate_pct: n_(wude.r_rate),
      rework_bonus_below_pct: 2, rework_penalty_above_pct: 5,
      defects_by_stage: rows_(wude.c_stage),
      worst_stage: wude.c_worst || '',
      same_stage_as_yesterday: yes_(wude.c_repeat),
      amaha_told_the_cause: yes_(wude.c_told),
      suppliers_fault_defects: n_(wude.c_sup),
      pressured_to_pass: yes_(wude.pr_any),
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
  facts: function (d) {
    var yord = vals_(d.filed, 'yordanos-daily');
    return {
      stock_and_days_of_cover: rows_(yord.k_stock),
      anything_at_5_days_or_less: yes_(yord.k_low),
      which_and_told_getachew: yord.k_which || '',
      shortages_flagged: n_(yord.sh_flagged),
      production_stopped_by_shortage: n_(yord.sh_stopped),
      which_materials: yord.sh_what || '',
      discrepancies: n_(yord.st_disc),
      offcut_m2_returned: n_(yord.k_offin),
      offcut_m2_reissued: n_(yord.k_offout),
      consumables_month_to_date: n_(yord.con_mtd),
      consumables_budget: 30000,
      theft_or_unauthorized_removal: yes_(yord.sec_theft),
      shortages_flagged_last_7_days: series_(d, 'yordanos-daily', 'sh_flagged'),
      production_stops_last_7_days: series_(d, 'yordanos-daily', 'sh_stopped')
    };
  },
  ask:'What is about to run out, and will it stop production before it is replaced. '+
      'Days of cover is the number that matters — anything at five days or less should '+
      'already be with Getachew. If offcuts are coming back but not going out again, the '+
      'factory is paying for board it already owns.' },

{ id:'purchasing', en:'Purchasing and prices', am:'ግዥና ዋጋ',
  facts: function (d) {
    var purch = vals_(d.filed, 'getachew-daily');
    return {
      prices_paid_today: rows_(purch.p_rows),
      materials_up_more_than_10pct: n_(purch.p_up),
      ephrata_and_betty_told: yes_(purch.p_told),
      substitution_made: yes_(purch.p_sub),
      wude_approved_substitute: yes_(purch.p_subok),
      requests_with_3_or_more_quotes: n_(purch.pr_quotes),
      requests_prepared: n_(purch.pr_prep),
      supplier_delays: n_(purch.sup_delay),
      supplier_quality_issues: n_(purch.sup_quality),
      cheque_value: n_(purch.chq_value),
      margin_floor_birr_per_m2: 6000,
      materials_up_10pct_last_7_days: series_(d, 'getachew-daily', 'p_up'),
      supplier_delays_last_7_days: series_(d, 'getachew-daily', 'sup_delay')
    };
  },
  ask:'Is anything we buy getting more expensive in a way that will eat the 6,000 Birr/m² '+
      'floor. A rise has to reach Ephrata before the next quote goes out, not after. '+
      'If a cheaper material was substituted without Wude approving it first, say so — '+
      'that is how a saving becomes a warranty claim.' },

{ id:'finance', en:'Finance', am:'ፋይናንስ',
  facts: function (d) {
    var fin = vals_(d.filed, 'betty-daily');
    return {
      cash_in: n_(fin.cash_in), cash_banked: n_(fin.cash_banked), cash_in_hand: n_(fin.cash_hand),
      bank_total: n_(fin.bank_total), reserve_floor: 6000000,
      below_6m_reported: yes_(fin.below6_reported),
      discrepancy: yes_(fin.discrepancy),
      payments_approved: n_(fin.pay_approved), payment_value: n_(fin.pay_value),
      kidan_approved_above_50k: yes_(fin.pay_kidan),
      zamzam_transferred: n_(fin.zz_transfer), zamzam_confirmed: yes_(fin.zz_confirmed),
      zamzam_discrepancy: n_(fin.zz_disc),
      advance_received: n_(fin.adv_in), final_received: n_(fin.final_in),
      board_mismatch: n_(fin.board_mismatch),
      documents_missing: n_(fin.doc_missing),
      bank_total_this_week: trend_(series_(d, 'betty-daily', 'bank_total')),
      morning_bank_balance_last_7_days: series_(d, 'betty-forecast', 'cf7_bank'),
      days_until_below_6m_at_this_rate: daysToFloor_(series_(d, 'betty-forecast', 'cf7_bank'), 6000000)
    };
  },
  ask:'Is the money where it should be. The reserve floor is 6,000,000 Birr and falling '+
      'below it has to be reported the same day. A discrepancy, an unconfirmed ZamZam '+
      'transfer, or a payment over 50,000 without Kidan is a same-day problem, not a '+
      'month-end one. If days_until_below_6m_at_this_rate gives a number, say it — that is '+
      'the warning Betelhem’s letter fines her for not giving. If it gives none, do not '+
      'estimate one.' },

{ id:'commercial', en:'Sales and commercial', am:'ሽያጭና ንግድ',
  facts: function (d) {
    var ephrata = vals_(d.filed, 'ephrata-daily');
    var tsega = vals_(d.filed, 'tsega-sales-daily');
    var biruk = vals_(d.filed, 'biruktayet-sales-daily');
    return {
      leads_today: n_(ephrata.leads_total),
      leads_by_source: { social:n_(ephrata.leads_social), showroom:n_(ephrata.leads_showroom),
                         referral:n_(ephrata.leads_referral), agent:n_(ephrata.leads_agent), other:n_(ephrata.leads_other) },
      answered_within_1hr: n_(ephrata.resp_1hr),
      visits_booked: n_(ephrata.visits_booked), visits_done: n_(ephrata.visits_done), visits_late: n_(ephrata.visits_late),
      quotes_issued: n_(ephrata.quotes_issued), quotes_late: n_(ephrata.quotes_late),
      contracts_signed: n_(ephrata.contracts), contract_value: n_(ephrata.contract_value),
      collected_today: n_(ephrata.collected_today),
      week_to_date: n_(ephrata.week_total),
      weekly_floor: 3000000,
      unanswered_whatsapp: n_(ephrata.wa_unanswered),
      complaints_in_groups: n_(ephrata.wa_complaints),
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
      contracts_last_7_days: series_(d, 'ephrata-daily', 'contracts')
    };
  },
  ask:'Is the week going to reach 3,000,000 Birr, and if not say it now rather than on '+
      'Friday. Look at where leads came from against which ones converted — if one source '+
      'produces volume and no contracts, that is money being spent for nothing. Unanswered '+
      'WhatsApp is a lost customer nobody has noticed yet.' },

{ id:'design', en:'Design', am:'ዲዛይን',
  facts: function (d) {
    var ids = ['yohannis','yonas','abrham-g','teklweld','abrham-w'];
    var out = { designers: [], filed: 0, missing: [] };
    ids.forEach(function (id) {
      var r = got_(d.filed, id + '-design-daily');
      if (r) { out.filed++; out.designers.push({ who:id, values:r.fields }); }
      else out.missing.push(id);
    });
    return out;
  },
  ask:'Are designs moving or sitting. A design that stalls holds up a job that is already '+
      'paid for in part, so a stage not moving for days matters more than a slow day. '+
      'If the same customer is being redrawn again and again, name it — revisions are the '+
      'hidden cost in this trade.' },

{ id:'site', en:'Installation and site', am:'ተከላና ቦታ',
  facts: function (d) {
    var elyas = vals_(d.filed, 'elyas-daily');
    var ashen = vals_(d.filed, 'ashenafi-daily');
    return {
      jobs_today: n_(elyas.j_total), completed: n_(elyas.j_done), in_progress: n_(elyas.j_wip),
      m2_installed: n_(elyas.j_m2),
      site_not_ready_count: n_(elyas.r_notready),
      site_did_not_match_measurement: n_(elyas.r_meas),
      whose_measurement: elyas.r_whose || '',
      hours_lost_to_site: n_(elyas.r_lost),
      site_conditions: rows_(elyas.r_rows),
      customer_told_same_day: yes_(elyas.r_told),
      photographed_first: yes_(elyas.r_photo),
      acceptances_signed: n_(elyas.ac_signed),
      complaints: n_(elyas.ac_complaints),
      rework_at_site: n_(elyas.q_rework),
      customer_property_damaged: yes_(elyas.cl_damage),
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
  facts: function (d) {
    var pulse = vals_(d.filed, 'betty-pulse');
    var elyas = vals_(d.filed, 'elyas-daily');
    var ephrata = vals_(d.filed, 'ephrata-daily');
    return {
      pulse: pulse,
      complaints_at_site: n_(elyas.ac_complaints),
      complaints_in_whatsapp: n_(ephrata.wa_complaints),
      acceptances_signed: n_(elyas.ac_signed),
      customers_called_before_arrival: yes_(elyas.ac_called),
      unanswered_messages: n_(ephrata.wa_unanswered),
      pulse_filed: !!got_(d.filed, 'betty-pulse'),
      site_complaints_last_7_days: series_(d, 'elyas-daily', 'ac_complaints'),
      whatsapp_complaints_last_7_days: series_(d, 'ephrata-daily', 'wa_complaints')
    };
  },
  ask:'What are customers actually saying, and is anyone waiting for an answer. A complaint '+
      'that appears in two places is one unhappy customer, not two — say which. Silence from '+
      'a customer mid-job is not good news.' },

{ id:'compliance', en:'Who reported and who did not', am:'ማን ሪፖርት አደረገ ማን አላደረገም',
  facts: function (d) {
    var missing = [], late = [], ontime = [];
    d.ledger.forEach(function (l) {
      var row = { person:l.person, report:l.report, due:l.due };
      if (l.status === 'MISSING') missing.push(row);
      else if (l.status === 'LATE') late.push(row);
      else ontime.push(row);
    });
    return { due_today: d.ledger.length, on_time: ontime.length,
             late: late, missing: missing,
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
      more_than_once_this_week: repeats_(d)
    };
  },
  ask:'The amounts are already calculated and correct — do not restate the arithmetic and '+
      'do not recalculate it. Say only whether a pattern is forming: the same person, the '+
      'same report, the same day of the week. A first miss is a bad day; a third is a '+
      'conversation.' },

{ id:'margin', en:'Margin watch', am:'የትርፍ ክትትል',
  facts: function (d) {
    var ephrata = vals_(d.filed, 'ephrata-daily');
    var amaha = vals_(d.filed, 'amaha-daily');
    var purch = vals_(d.filed, 'getachew-daily');
    var value = n_(ephrata.contract_value), m2 = n_(amaha.p_total);
    return {
      contracts_signed: n_(ephrata.contracts),
      contract_value: value,
      m2_produced_today: m2,
      birr_per_m2_signed_today: m2 ? Math.round(value / m2) : 0,
      margin_floor_birr_per_m2: 6000,
      waste_pct: n_(amaha.w_pct),
      material_over_bom_pct: n_(amaha.w_var),
      m2_per_sheet: n_(amaha.b_yield),
      materials_up_over_10pct: n_(purch.p_up),
      savings_today: n_(amaha.sav_today),
      m2_per_sheet_this_week: trend_(series_(d, 'amaha-daily', 'b_yield'))
    };
  },
  ask:'Is anything quietly eating the 6,000 Birr/m² floor. Board price rising, yield '+
      'falling, waste climbing and material over BOM all do the same damage from different '+
      'directions. Say which one is moving, not all four.' },

{ id:'contradictions', en:'Reports that disagree', am:'የሚጋጩ ሪፖርቶች',
  facts: function (d) {
    var N = function (rid, f) { return nOrNull_(d.filed, rid, f); };
    var amaha = vals_(d.filed, 'amaha-daily');
    var yord = vals_(d.filed, 'yordanos-daily');
    /* offcuts leaving the factory are recorded per board row, not as a total */
    var sentOut = null;
    if (got_(d.filed, 'amaha-daily')) {
      sentOut = 0;
      rows_(amaha.b_rows).forEach(function (r) { sentOut += n_(r.boff); });
    }
    return {
      note: 'null means that report was not filed — it does not mean zero',
      not_filed: notFiled_(d),
      amaha_m2: N('amaha-daily','p_total'),        mahelet_m2: N('liu-daily','m2'),
      amaha_defects: N('amaha-daily','qc_defects'), wude_defects: N('wude-daily','d_total'),
      mahelet_defects: N('liu-daily','defects'),
      amaha_waste_pct: N('amaha-daily','w_pct'),   mahelet_waste_pct: N('liu-daily','waste'),
      amaha_stopped_for_board: got_(d.filed,'amaha-daily') ? yes_(amaha.b_short) : null,
      amaha_which_board: amaha.b_shortw || '',
      yordanos_shortages: N('yordanos-daily','sh_flagged'),
      yordanos_stopped_production: N('yordanos-daily','sh_stopped'),
      yordanos_which: yord.sh_what || '',
      wude_pass_rate: N('wude-daily','i_rate'),
      mahelet_qc_pass: N('liu-daily','qc_pass'), mahelet_qc_fail: N('liu-daily','qc_fail'),
      elyas_installed_m2: N('elyas-daily','j_m2'), mahelet_installed: N('liu-daily','installed'),
      offcut_m2_received_by_store: N('yordanos-daily','k_offin'),
      offcut_m2_sent_by_factory: sentOut,
      /* already checked in code: pairs that differ by more than a tenth, where
         both reports were actually filed */
      mismatches_found_in_code: contradictions_(d)
    };
  },
  ask:'These figures come from different people describing the same day. Where two of them '+
      'cannot both be true, say which two and by how much. A null is a report that was never '+
      'filed — that is a gap, not a disagreement, and you must never describe it as somebody '+
      'having recorded zero. Do not reach: a small difference is rounding or timing. A '+
      'production figure that disagrees with the operations figure, or a factory stopped for '+
      'a board the store says it had, is worth the Chairman’s time.' },

{ id:'decide', en:'What to decide', am:'ምን መወሰን እንዳለበት', last:true,
  facts: function (d) {
    return {
      open_decisions: decisionsBiting_(d),
      note: 'cost_today is null where today was not one of the days this one costs anything'
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
      'today, name the decision nearest to biting and stop.' },

{ id:'brief', en:'The Chairman’s brief', am:'የሊቀመንበሩ ማጠቃለያ', last:true,
  facts: function (d) { return { date: d.dayLabel, instructions: d.instructions }; },
  ask:'Below is what the other agents found today. Write the Chairman five lines at most. '+
      'Lead with the thing that costs the most money or will if nobody moves. Do not '+
      'summarise everything — leave out what is merely normal. If the day was ordinary, '+
      'say so in one line and stop. Name people only where a person has to act. '+
      'An instruction from the Chairman that is past its date and still open belongs in the '+
      'brief — name who has it and how many days over it is.' }
];

/* ------------------------------------------------------------------ *
 *  The run                                                            *
 * ------------------------------------------------------------------ */

/* The morning trigger: close yesterday, have the agents read it, send one
   email. On a Monday that is Sunday, when nobody owes anything, and it does
   nothing at all. */
function dailyRun() {
  var day = addDays_(todayAddis_(), -1);
  var c = closeDay_(day);
  if (!c.due.length) return;
  runOn_(c, false);
}

/* The Chairman's button: today so far. Nothing is written to the ledger —
   a charge is only final once the day has closed — and everything it sends
   says so. */
function runAgents() {
  var c = closeDay_(todayAddis_(), { write: false, asOf: new Date() });
  runOn_(c, true);
}

function runOn_(c, provisional) {
  var d = gather_(c, provisional);
  var results = askAll_(d);
  writeAnalysis_(results, d);
  publishAnalysis_(results, d);
  mailAnalysis_(results, d);
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

function askAll_(d) {
  var key = prop_('GEMINI_KEY', '');
  var model = prop_('GEMINI_MODEL', AGENT_DEFAULT_MODEL);
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model +
            ':generateContent?key=' + encodeURIComponent(key);

  var first = AGENTS.filter(function (a) { return !a.last; });
  var out = [];

  if (!key) {
    return AGENTS.map(function (a) {
      return { id:a.id, en:a.en, am:a.am,
               text:'(No GEMINI_KEY set — the facts below were still calculated.)',
               facts:a.last ? {} : a.facts(d) };
    });
  }

  /* fourteen at once. One after another would sit near the six-minute limit. */
  var reqs = first.map(function (a) {
    var facts = a.facts(d);
    return {
      url: url, method: 'post', contentType: 'application/json',
      muteHttpExceptions: true,
      payload: JSON.stringify({ contents: [{ parts: [{ text: promptFor_(a, facts, d) }] }] })
    };
  });

  var res = UrlFetchApp.fetchAll(reqs);
  first.forEach(function (a, i) {
    out.push({ id:a.id, en:a.en, am:a.am, facts:a.facts(d), text:readReply_(res[i]) });
  });

  /* the decision agent reads the day; the brief reads everything, so they run
     in that order and not at the same time */
  var decide = AGENTS.filter(function (a) { return a.id === 'decide'; })[0];
  if (decide) {
    var dr = UrlFetchApp.fetch(url, {
      method:'post', contentType:'application/json', muteHttpExceptions:true,
      payload: JSON.stringify({ contents: [{ parts: [{
        text: promptFor_(decide, decide.facts(d), d) }] }] })
    });
    out.push({ id:decide.id, en:decide.en, am:decide.am, facts:{},
               text:readReply_(dr), decision:true });
  }

  /* the brief reads everything above it */
  var brief = AGENTS.filter(function (a) { return a.id === 'brief'; })[0];
  if (brief) {
    var digest = out.map(function (r) { return '## ' + r.en + '\n' + r.text; }).join('\n\n');
    var r = UrlFetchApp.fetch(url, {
      method:'post', contentType:'application/json', muteHttpExceptions:true,
      payload: JSON.stringify({ contents: [{ parts: [{
        text: promptFor_(brief, { date: d.dayLabel }, d) + '\n\n' + digest }] }] })
    });
    out.push({ id:brief.id, en:brief.en, am:brief.am, facts:{}, text:readReply_(r), last:true });
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
    'Every number below was already calculated in code and is correct. Do not recalculate',
    'anything, and do not list numbers back — the Chairman can already see them. Write',
    'about what they mean.',
    '',
    'At most 120 words, short bullets. Write plainly, the way you would say it to the',
    'Chairman standing in the factory: no adjectives doing the work of evidence, no',
    'headline labels in bold, nothing dressed up. "Edge banding stopped work for three',
    'hours" — not "edge banding is plaguing the shop floor". If your subject had an ordinary day,',
    'say so in one line rather than finding something to say. A missing report means the',
    'figure is absent, not zero — say "not reported" rather than treating it as nil.',
    '',
    'A list of seven values runs oldest to newest and the last one is today. null in it is',
    'a day that report was owed and not filed; "not due" is a day nobody owed it (a Sunday,',
    'or a day the letter excuses) and is not a miss. Use the week only where it changes',
    'what today means — a third day running, a slide that started on Monday.',
    '',
    'YOUR QUESTION: ' + agent.ask,
    '',
    '--- ' + d.dayLabel + (d.provisional ? ' — SO FAR TODAY, the day is not over' : '') + ' ---',
    (d.provisional ? 'Reports not in yet (some are not due yet, and are not late): '
                   : 'Reports that were due today and never arrived: ') +
      (notFiled_(d).join('; ') || 'none — everything was filed'),
    '',
    JSON.stringify(facts, null, 1)
  ].join('\n');
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
  var rows = results.map(function (r) { return [day, r.en, r.text]; });
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

  html += '<p style="color:#66716d;font-size:11.5px;margin-top:28px;line-height:1.6">' +
          'Every figure these agents were given was calculated in code from the reports ' +
          'as filed, not by the model. What the model wrote is the reading, not the ' +
          'arithmetic. Penalty amounts come from each person’s signed letter, and a charge ' +
          'can be cancelled from your page with a reason.' +
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
function watchForRunRequest() {
  var token = fsToken_();
  var res = UrlFetchApp.fetch(fsBase_() + '/documents/control/run', {
    headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true
  });
  if (res.getResponseCode() === 404) return;           /* nobody asked */
  if (res.getResponseCode() !== 200) {
    Logger.log('control/run unreadable: HTTP %s', res.getResponseCode());
    return;
  }
  UrlFetchApp.fetch(fsBase_() + '/documents/control/run', {
    method: 'delete', headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });
  Logger.log('Run requested from the Chairman’s page — running now.');
  runAgents();
}
