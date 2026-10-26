/* Klever — the week's schedule, at the end of the Chairman's morning brief.

   THE ASK (the user, 26 Oct 2026): "will Chairman get the brief every day
   that this week's weekly schedule and tell every this happen and this
   happen". So every morning brief ends with the week: each working day's
   jobs and m² from Mahelet's 1-Week Production Plan, and the payments from
   Ephrata's 1-Week Forecast — and for the days gone, what happened: the m²
   Amaha made and on which jobs, the money Ephrata collected, and which
   expected payments did not come. Then what to watch: a job planned before
   its final payment is recorded (the job register, Register.js), a day
   with no m², a job typed twice, a plan far beyond what the factory makes,
   what Mahelet says could stop it.

   Arithmetic and matching only, in code — no model, so it is there even on
   a morning the model does not answer. It goes where the brief goes: his
   page, the morning email (the owner's address), and the WhatsApp brief to
   the Chairman and the owner (BRIEF_NUMBERS in the agent). It reads what
   the morning already read — the week's filings (d.recent) — and reads
   Mahelet's plan or Ephrata's forecast again only when it was filed before
   them, plus the job register (one document).

   THE WEEK is the one the morning acts on: the next working day after the
   day read (that day itself on a mid-day look), so Sunday's brief — the
   reading of Saturday — is the coming week, all of it ahead.            */

var WK_NONE_ = /^(የለም|የለ|none|no|nil|n\/a|-+|—|0)$/i;
var WK_CODE_ = /\b(kk|rbt)[\s.\-=]*\d{1,5}[a-z]?\b/i;
var WK_SLOW_ = 0.8;          /* under 80% of the plan so far is behind it */
var WK_BIG_ = 1.5;           /* a plan half again more than last week made */
var WK_CONF_ = { sure: 'sure', likely: 'likely', maybe: 'not sure' };

function wkDay_(day) { return Utilities.formatDate(new Date(day + 'T12:00:00' + ADDIS_), tz_(), 'EEE d MMM'); }
function wkDow_(day) { return Utilities.formatDate(new Date(day + 'T12:00:00' + ADDIS_), tz_(), 'EEE'); }
function wkM2_(x) { return String(Math.round(x * 10) / 10); }
function wkBirr_(x) { return fmt_(Math.round(x)); }

/* one job box as typed: "Kk81 5thfloor" → KK-81 and "5thfloor"; "የለም"
   (none) → nothing; words with no code → a note. regJob_ alone reads
   "Kk81 5thfloor" as KK-815: it drops the space first. */
function wkCell_(s) {
  s = String(s == null ? '' : s).trim();
  if (!s || WK_NONE_.test(s)) return null;
  var m = WK_CODE_.exec(s);
  if (!m) return { code: '', note: s };
  var rest = (s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length)).replace(/\s+/g, ' ').trim();
  return { code: regJob_(m[0]), note: WK_NONE_.test(rest) ? '' : rest };
}

/* the last filing of each day, report by report */
function wkByDay_(d) {
  var by = {};
  (d.recent || []).concat(d.filed || []).forEach(function (f) {
    var day = f.day || (f.at ? dayOf_(f.at) : '');
    if (!day) return;
    var r = by[f.report] = by[f.report] || {};
    if (!r[day] || !r[day].at || (f.at && f.at.getTime() >= r[day].at.getTime())) r[day] = f;
  });
  return by;
}
function wkVals_(by, report, day) { var f = (by[report] || {})[day]; return f ? (f.fields || {}) : null; }

/* Mahelet's plans: those the morning read, or — when none of them is this
   week's — read again (Plant.js pmPlans_) */
function wkPlans_(d, monday, saturday) {
  var plans = (d.recent || []).filter(function (f) { return f.report === 'liu-plan' && f.at; })
    .map(function (f) { var v = f.fields || {}; return { filed: dayOf_(f.at), start: String(v.plan_start || '').trim(), v: v, at: f.at }; })
    .filter(function (p) { return /^\d{4}-\d{2}-\d{2}$/.test(p.start); });
  var ours = function (p) { return p.start >= addDays_(monday, -7) && p.start <= saturday; };
  if (!plans.some(ours)) plans = pmPlans_(monday, saturday);
  return plans;
}
/* Ephrata's forecast for a week, read as the cash flow reads it (CashFlow.js
   cfBuild_): the latest from the Saturday before it to its Friday. One sent
   on Saturday is for the coming week; one sent mid-week is for the rest of
   that week — her forecast of Tuesday 20 Oct named Wednesday to Saturday,
   and her Thursday daily expected the same payments "this week". */
function wkForecasts_(d, mondays) {
  var pick = function (list, monday) {
    var hit = null;
    list.forEach(function (f) {
      if (!f || !f.at || addDays_(cfSaturday_(dayOf_(f.at)), 2) !== monday) return;
      if (!hit || f.at.getTime() >= hit.at.getTime()) hit = f;
    });
    return hit;
  };
  var near = (d.recent || []).filter(function (f) { return f.report === 'ephrata-forecast'; })
    .map(function (f) { return { at: f.at, v: f.fields || {} }; });
  var all = null, out = {};
  mondays.forEach(function (m) {
    var hit = pick(near, m);
    if (!hit) {
      if (!all) all = tryQuery_('reports', [['report', 'EQUAL', 'ephrata-forecast']], null)
        .map(function (f) { return { at: f.at, v: f.values || {} }; });
      hit = pick(all, m);
    }
    out[m] = hit;
  });
  return out;
}
/* a forecast's payments, each with its day in the week */
function wkExpected_(fc, monday, book) {
  var out = [];
  if (fc) rows_(fc.v.f_pay).forEach(function (r) {
    var a = r ? n_(r.amount) : 0;
    if (!(a > 0)) return;
    var w = wkWho_(r.lc, r.cust, book);
    w.birr = a; w.kind = String(r.kind || ''); w.conf = WK_CONF_[r.conf] || '';
    w.day = r.day in CF_WDAY_ ? addDays_(monday, CF_WDAY_[r.day]) : '';
    w.coded = !!(w.code || w.lead);
    out.push(w);
  });
  return out;
}

/* a picked answer in English: "ዕቃ ገና አልተገዛም; ክፍያዎች አልተረጋገጡም — words"
   → "Material not bought yet; Payments not confirmed — "words"" */
function wkPicksEn_(schedule, reportId, fieldId, text) {
  text = String(text == null ? '' : text).trim();
  if (!text) return '';
  var map = {};
  ((schedule && schedule.reports) || []).forEach(function (r) {
    if (r.id !== reportId) return;
    var walk = function (fs) {
      (fs || []).forEach(function (f) {
        if (f.fields) walk(f.fields);
        if (f.id !== fieldId) return;
        (f.picks || []).forEach(function (p) {
          if (p && p.am) map[String(p.am).trim()] = p.en;
          if (p && p.en) map[String(p.en).trim()] = p.en;
        });
      });
    };
    walk(r.sections ? r.sections.map(function (s) { return { fields: s.fields }; }) : r.fields);
  });
  var cut = text.indexOf(' — ');
  var head = cut < 0 ? text : text.slice(0, cut), tail = cut < 0 ? '' : text.slice(cut + 3).trim();
  var parts = head.split(/;\s*/).map(function (p) { p = p.trim(); return map[p] || p; }).filter(Boolean);
  return { picks: parts, said: tail, text: parts.join('; ') + (tail ? ' — "' + tail + '"' : '') };
}

/* who a payment is: its job (KK, or the KK a lead no. became — the code
   book, Money.js), its lead no., the customer's first name */
function wkWho_(lc, cust, book) {
  var c = wkCell_(lc), code = c && c.code ? c.code : '';
  var raw = String(lc == null ? '' : lc).trim();
  var lead = !code && /^\d{4}$/.test(raw) ? raw : '';
  if (lead && book && book.leadJob[moneyCode_(lead)]) code = regJob_(book.leadJob[moneyCode_(lead)]);
  var isNew = function (s) { return !s || /^(new|አዲስ)$/i.test(String(s).trim()); };
  var name = !isNew(cust) ? String(cust).trim() : (c && !c.code && !isNew(c.note) ? c.note : '');
  var label = [code || lead, name].filter(Boolean).join(' ') || raw || '?';
  return { code: code, lead: lead, first: regName_(name).split(' ')[0] || '', label: label };
}
function wkSame_(a, b) {
  return !!((a.code && a.code === b.code) || (a.lead && a.lead === b.lead) || (a.first && a.first === b.first));
}
/* a job's code without noughts: the register holds KK-068 and KK-68 apart */
function wkKey_(code) { return String(code || '').replace(/-0+(?=\d)/, '-'); }
/* the register's jobs by that code; two rows of one job are one, their steps together */
function wkJobs_(rows) {
  var by = {};
  (rows || []).forEach(function (j) {
    var k = wkKey_(opsCode_(j.job)), had = by[k];
    if (!had) { by[k] = j; return; }
    by[k] = Object.assign({}, had, { cust: had.cust || j.cust, steps: Object.assign({}, j.steps || {}, had.steps || {}) });
  });
  return by;
}
/* the final payments Ephrata listed in the days read, by job: the register
   takes a final payment from Selam's reports and the bot, not from hers */
function wkEphFinals_(by, book) {
  var out = {};
  Object.keys(by['ephrata-daily'] || {}).sort().forEach(function (day) {
    rows_((by['ephrata-daily'][day].fields || {}).collected_list).forEach(function (r) {
      var a = r ? moneyNum_(r.amount) : null;
      if (!(a > 0) || String(r.kind || '') !== 'final') return;
      var w = wkWho_(r.lc, r.cust, book);
      if (w.code) out[wkKey_(w.code)] = { birr: a, day: day };
    });
  });
  return out;
}
/* what Ephrata collected, day by day (her fixes already read in — Money.js) */
function wkCame_(by, from, to, book, ephDays) {
  var came = [];
  for (var x = from; x <= to; x = addDays_(x, 1)) {
    var ev = wkVals_(by, 'ephrata-daily', x);
    if (!ev) continue;
    if (ephDays) ephDays[x] = true;
    rows_(ev.collected_list).forEach(function (r) {
      var a = r ? moneyNum_(r.amount) : null;
      if (!(a > 0)) return;
      var w = wkWho_(r.lc, r.cust, book);
      w.birr = a; w.day = x; w.kind = String(r.kind || '');
      came.push(w);
    });
  }
  return came;
}
/* each payment that came answers one expected payment: the same job or
   lead first, then the same first name */
function wkMatch_(expected, came) {
  var order = expected.slice().sort(function (a, b) { return (a.day || 'z') < (b.day || 'z') ? -1 : (a.day || 'z') > (b.day || 'z') ? 1 : b.birr - a.birr; });
  [function (e, c) { return (e.code && e.code === c.code) || (e.lead && e.lead === c.lead); }, wkSame_].forEach(function (same) {
    order.forEach(function (e) {
      if (e.got) return;
      for (var i = 0; i < came.length; i++) {
        if (came[i].used || !same(e, came[i])) continue;
        came[i].used = true; e.got = came[i];
        return;
      }
    });
  });
}

function weekSchedule_(d) {
  var today = d.provisional ? d.day : addDays_(d.day, 1);
  while (closed_(today)) today = addDays_(today, 1);
  var monday = addDays_(today, -((dow_(today) + 6) % 7)), saturday = addDays_(monday, 5);
  var upTo = d.day < saturday ? d.day : saturday;              /* the days with reports */
  var by = wkByDay_(d);
  var first = {};
  ((d.schedule && d.schedule.people) || []).forEach(function (p) { first[p.id] = String(p.en || p.id).split(' ')[0]; });
  var nm = function (id) { return first[id] || id; };

  var lastMon = addDays_(monday, -7);
  var thinWeek = upTo < monday;                                 /* Sunday's brief: none of the week has happened */
  var plans = wkPlans_(d, monday, saturday);
  var fcs = wkForecasts_(d, thinWeek ? [monday, lastMon] : [monday]);
  var fc = fcs[monday];
  var book = null;
  try { book = moneyBook_(); } catch (e) { book = null; }
  var byCode = wkJobs_(opsJobs_());

  /* ---- the money: expected, payment by payment, and what came ---- */
  var expected = wkExpected_(fc, monday, book);
  var ephDays = {}, came = wkCame_(by, monday, upTo, book, ephDays);
  wkMatch_(expected, came);

  /* ---- day by day ---- */
  var days = [], weekPlanned = 0, plannedSoFar = 0, madeSoFar = 0, amahaDays = 0, noM2 = [], twice = [], slips = [];
  var planned = {};                                             /* job → the first day it is planned */
  var planUsed = null;
  for (var i = 0; i < 6; i++) {
    var day = addDays_(monday, i), row = { day: day, closed: closed_(day), past: day <= upTo, today: day === today };
    days.push(row);
    if (row.closed) continue;
    var pd = pmPlanDay_(plans, day);
    row.plan = null;
    if (pd && pd.day_of_plan) {
      planUsed = planUsed || pd.plan;
      var pr = rows_(pd.plan.v.plan_week)[pd.day_of_plan - 1] || null;
      var jl = [], notes = [], seen = {};
      if (pr) {
        [['k1', 'm1'], ['k2', 'n2'], ['k3', 'n3']].forEach(function (p) {
          var c = wkCell_(pr[p[0]]), m2 = a_(pr, p[1]);
          if (!c && m2 === null) return;
          if (c && c.code && seen[c.code]) {
            var s0 = seen[c.code];
            if (m2 === null || s0.m2 === m2) { twice.push({ day: day, code: c.code, m2: m2 }); return; }
            s0.m2 = (s0.m2 || 0) + m2;
            return;
          }
          var j = { code: c ? c.code : '', m2: m2, note: c ? c.note : '' };
          if (j.code) seen[j.code] = j;
          if (!j.code && j.note && m2 === null) { notes.push(j.note); return; }
          jl.push(j);
        });
        if (!blank_(pr.notes)) notes.push(String(pr.notes).trim());
      } else {
        /* an older plan: the day's line as worked out (plan_days) */
        var pdRow = rows_(pd.plan.v.plan_days)[pd.day_of_plan - 1] || {};
        String(pdRow.jobs || '').split(/[,;]|\s{2,}/).forEach(function (t) {
          var c = wkCell_(t);
          if (c && c.code) jl.push({ code: c.code, m2: null, note: c.note });
        });
        if (jl.length === 1) jl[0].m2 = a_(pdRow, 'm2');
      }
      var m2 = 0, known = false;
      jl.forEach(function (j) {
        if (j.m2 !== null) { m2 += j.m2; known = true; }
        else if (j.code) noM2.push({ day: day, code: j.code });
        if (j.code && !planned[j.code]) planned[j.code] = day;
      });
      var slip = known && m2 > PM_PLAN_MAX_;
      if (slip) slips.push({ day: day, m2: m2 });
      row.plan = { jobs: jl, m2: known && !slip ? m2 : null, notes: notes, slip: slip ? m2 : null };
      if (row.plan.m2 !== null) weekPlanned += row.plan.m2;
    }
    if (row.past) {
      var am = wkVals_(by, 'amaha-daily', day);
      row.amaha = !!am;
      row.made = am ? a_(am, 'p_total') : null;
      row.madeJobs = am ? rows_(am.p_jobs).filter(function (r) { return r && (r.code || a_(r, 'done') !== null); }).map(function (r) {
        var c = wkCell_(r.code);
        return { code: c && c.code ? c.code : String(r.code || '').trim(), done: a_(r, 'done'), st: String(r.st || '') };
      }) : [];
      if (row.made !== null) { madeSoFar += row.made; amahaDays++; }
      if (row.plan && row.plan.m2 !== null) plannedSoFar += row.plan.m2;
      row.eph = !!ephDays[day];
      row.cameIn = came.filter(function (c) { return c.day === day; });
    }
    row.expected = expected.filter(function (e) { return e.day === day; });
  }

  /* last week, when none of this week has happened yet (Sunday's brief):
     what was made, and Ephrata's forecast against what she collected */
  var lastWeek = null;
  if (thinWeek) {
    var lmade = 0, ldays = 0, lowed = 0;
    for (var y = lastMon; y <= addDays_(lastMon, 5); y = addDays_(y, 1)) {
      if (closed_(y)) continue;
      lowed++;
      var la = wkVals_(by, 'amaha-daily', y);
      if (la && a_(la, 'p_total') !== null) { lmade += a_(la, 'p_total'); ldays++; }
    }
    var lfc = fcs[lastMon], lDays = {};
    var lcame = wkCame_(by, lastMon, addDays_(lastMon, 5), book, lDays);
    var lexp = wkExpected_(lfc, lastMon, book);
    wkMatch_(lexp, lcame);
    var lsum = function (l) { return l.reduce(function (a, e) { return a + e.birr; }, 0); };
    var lephs = Object.keys(lDays).length;
    if (ldays || lephs || lfc) {
      lastWeek = { from: lastMon, made: ldays ? lmade : null, amahaDays: ldays, owed: lowed,
                   collected: lephs ? lsum(lcame) : null, ephDays: lephs,
                   expected: lfc ? lsum(lexp) : null, expectedN: lexp.length,
                   paidN: lexp.filter(function (e) { return e.got; }).length,
                   notIn: lexp.filter(function (e) { return !e.got; }).sort(function (a, b) { return b.birr - a.birr; }) };
    }
  }

  /* ---- what to watch ---- */
  var watch = [];
  var fins = function (code) { return expected.filter(function (e) { return wkKey_(e.code) === wkKey_(code) && e.kind === 'fin'; })[0] || null; };
  var ephFin = wkEphFinals_(by, book);
  var unknown = [];
  Object.keys(planned).sort(function (a, b) { return planned[a] < planned[b] ? -1 : planned[a] > planned[b] ? 1 : 0; }).forEach(function (code) {
    if (!/^KK-/.test(code)) return;                             /* RBT is Rovestone's: its money is not Selam's */
    var j = byCode[wkKey_(code)];
    if (!j) { unknown.push(code); return; }
    var st = j.steps || {};
    if (st.final || !(st.contract || st.advance)) return;
    var ef = ephFin[wkKey_(code)], f = fins(code);
    watch.push(code + (j.cust ? ' (' + j.cust + ')' : '') + ', planned ' + wkDow_(planned[code]) + ': ' +
               (ef ? nm('ephrata') + ' collected its final payment (' + wkBirr_(ef.birr) + ', ' + wkDay_(ef.day) + ') but Selam has not recorded it'
                   : 'no final payment recorded by Selam' +
                     (f ? ' — ' + nm('ephrata') + ' expects ' + wkBirr_(f.birr) + (f.day ? ' on ' + wkDow_(f.day) : '')
                        : fc ? ' — not in ' + nm('ephrata') + '’s forecast' : '')));
  });
  if (!planUsed) watch.push('No 1-week plan from ' + nm('liu') + ' covers this week (due Saturday 3 PM)');
  if (!fc) watch.push('No 1-week forecast from ' + nm('ephrata') + ' for this week (due Saturday 5 PM)');
  if (unknown.length) watch.push(unknown.join(', ') + ': in no report or bot record yet, so ' + (unknown.length > 1 ? 'their' : 'its') +
                                 ' payments cannot be checked — signed before 6 Oct, or a wrong code?');
  noM2.forEach(function (n) { watch.push(wkDow_(n.day) + ': ' + n.code + ' has no m² in the plan'); });
  twice.forEach(function (t) { watch.push(wkDow_(t.day) + ': ' + t.code + ' is written twice' + (t.m2 !== null ? ' (' + wkM2_(t.m2) + ' m² each)' : '') + ' — counted once'); });
  slips.forEach(function (s) { watch.push(wkDow_(s.day) + ': ' + wkM2_(s.m2) + ' m² in one day cannot be right (a full day is about ' + PM_DAY_M2_ + ')'); });
  /* the plan against what the factory makes: said once, before the week
     starts — after that "behind the plan" says how it is going */
  var target = PM_DAY_M2_ * PM_WEEK_DAYS_;
  if (thinWeek && lastWeek && lastWeek.made !== null && weekPlanned > Math.max(target, lastWeek.made * WK_BIG_)) {
    watch.push('The plan is ' + wkM2_(weekPlanned) + ' m²; last week the factory made ' + wkM2_(lastWeek.made) + ' m² (target ' + target + ')');
  } else if (thinWeek && weekPlanned > target * 1.25) {
    watch.push('The plan is ' + wkM2_(weekPlanned) + ' m², well above the ' + target + ' m² week');
  }
  var left = days.filter(function (r) { return !r.closed && !r.past; });
  if (amahaDays && plannedSoFar && madeSoFar < plannedSoFar * WK_SLOW_) {
    var rest = 0;
    left.forEach(function (r) { if (r.plan && r.plan.m2 !== null) rest += r.plan.m2; });
    var need = rest + (plannedSoFar - madeSoFar);
    watch.push('Behind the plan by ' + wkM2_(plannedSoFar - madeSoFar) + ' m²' +
               (left.length ? '; to finish it: ' + wkM2_(need) + ' m² over ' + left.length + ' day' + (left.length > 1 ? 's' : '') +
                              ' = ' + wkM2_(need / left.length) + ' a day (a full day is about ' + PM_DAY_M2_ + ')' : ''));
  }
  if (planUsed) {
    var blk = wkPicksEn_(d.schedule, 'liu-plan', 'plan_block', planUsed.v.plan_block);
    if (blk && !(blk.picks.length === 1 && blk.picks[0] === 'Nothing in the way' && !blk.said)) watch.push(nm('liu') + ' says it could stop: ' + blk.text);
    var mats = rows_(planUsed.v.plan_mat).filter(function (m) { return m && m.mat; }).map(function (m) {
      return m.mat + (blank_(m.qty) ? '' : ' ' + String(m.qty).trim()) + (blank_(m.jobs) ? '' : ' (' + String(m.jobs).trim() + ')');
    });
    if (mats.length) watch.push('Material the plan needs: ' + mats.join('; '));
  }
  var uncoded = expected.filter(function (e) { return !e.coded; }).length;
  if (uncoded) watch.push(uncoded + ' of ' + nm('ephrata') + '’s ' + expected.length + ' expected payments have no KK code or lead no. — matched by name only');

  return { monday: monday, saturday: saturday, today: today, upTo: upTo, days: days,
           plan: planUsed ? { filed: planUsed.filed } : null,
           forecast: fc ? { filed: dayOf_(fc.at), sign: rows_(fc.v.f_sign).filter(function (s) { return s && (s.cust || s.lc); }) } : null,
           expected: expected, came: came, weekPlanned: weekPlanned, plannedSoFar: plannedSoFar, madeSoFar: madeSoFar,
           amahaDays: amahaDays, lastWeek: lastWeek, watch: watch, nm: { liu: nm('liu'), amaha: nm('amaha'), ephrata: nm('ephrata') } };
}

/* the block, in plain lines: the same on his page, in the email and on WhatsApp */
function weekText_(w) {
  var L = [], N = w.nm;
  var pay = function (e) { return e.label + ' ' + wkBirr_(e.birr) + (e.conf ? ' ' + e.conf : ''); };
  var sum = function (list) { return list.reduce(function (a, e) { return a + e.birr; }, 0); };
  L.push('THIS WEEK — ' + wkDay_(w.monday) + ' to ' + wkDay_(w.saturday));
  L.push((w.plan ? N.liu + '’s plan of ' + wkDay_(w.plan.filed) : 'No 1-week plan from ' + N.liu + ' for this week') + ' · ' +
         (w.forecast ? N.ephrata + '’s forecast of ' + wkDay_(w.forecast.filed) : 'no forecast from ' + N.ephrata + ' for this week'));
  if (w.lastWeek) {
    var lw = w.lastWeek;
    L.push('Last week: ' + (lw.made !== null ? 'made ' + wkM2_(lw.made) + ' m² of ' + (PM_DAY_M2_ * PM_WEEK_DAYS_) + (lw.amahaDays < lw.owed ? ' (' + N.amaha + ' reported ' + lw.amahaDays + ' of ' + lw.owed + ' days)' : '') : N.amaha + ' reported no m²') +
           (lw.collected !== null ? ' · ' + N.ephrata + ' collected ' + wkBirr_(lw.collected) : '') +
           (lw.expected !== null ? ' of ' + wkBirr_(lw.expected) + ' she expected (' + lw.paidN + ' of ' + lw.expectedN + ' payments came' +
                                   (lw.notIn.length ? '; not in: ' + lw.notIn.slice(0, 4).map(function (e) { return e.label + ' ' + wkBirr_(e.birr); }).join(', ') +
                                                      (lw.notIn.length > 4 ? ' and ' + (lw.notIn.length - 4) + ' more' : '') : '') + ')' : ''));
  }
  w.days.forEach(function (r) {
    L.push('');
    L.push(wkDay_(r.day) + (r.closed ? ' — closed' : r.today ? ' — TODAY' : r.past ? ' — done' : ''));
    if (r.closed) return;
    /* the plan */
    if (!r.plan) L.push('- Plan: none');
    else {
      var parts = r.plan.jobs.map(function (j) {
        return (j.code || '"' + j.note + '"') + (j.code && j.note ? ' ' + j.note : '') + (j.m2 !== null ? ' ' + wkM2_(j.m2) : ' (no m²)');
      });
      L.push('- Plan: ' + (parts.join(' + ') || 'no jobs') +
             (r.plan.m2 !== null && r.plan.jobs.length > 1 ? ' = ' + wkM2_(r.plan.m2) + ' m²' : r.plan.m2 !== null ? ' m²' : '') +
             (r.plan.notes.length ? ' · note: "' + r.plan.notes.join('; ') + '"' : ''));
    }
    /* what happened */
    if (r.past) {
      if (!r.amaha) L.push('- Made: ' + N.amaha + (r.today ? ' has not reported yet' : ' did not report'));
      else {
        var planCodes = r.plan ? r.plan.jobs.map(function (j) { return j.code; }).filter(Boolean) : [];
        var done = r.madeJobs.map(function (m) {
          return (m.code || '?') + (m.done !== null ? ' ' + wkM2_(m.done) : '') + (m.st === 'done' ? ' finished' : '');
        });
        var missed = planCodes.filter(function (c) { return !r.madeJobs.some(function (m) { return m.code === c; }); });
        L.push('- Made: ' + (r.made !== null ? wkM2_(r.made) + ' m²' : 'm² not given') +
               (r.plan && r.plan.m2 !== null ? ' of ' + wkM2_(r.plan.m2) + ' planned' : '') +
               (done.length ? ' — ' + done.join(', ') : '') +
               (missed.length ? ' · not worked on: ' + missed.join(', ') : ''));
      }
      var exp = r.expected, got = exp.filter(function (e) { return e.got; }), not = exp.filter(function (e) { return !e.got; });
      var extra = r.cameIn.filter(function (c) { return !c.used || !exp.some(function (e) { return e.got === c; }); });
      if (!r.eph && !exp.length) L.push('- Money: ' + N.ephrata + (r.today ? ' has not reported yet' : ' did not report'));
      else {
        var m = '- Money: ' + (exp.length ? 'expected ' + wkBirr_(sum(exp)) : 'none expected');
        if (!r.eph) m += ' · ' + N.ephrata + (r.today ? ' has not reported yet' : ' did not report');
        else {
          var inToday = sum(r.cameIn);
          m += ' · came in ' + wkBirr_(inToday);
          if (got.length) m += ' · paid: ' + got.map(function (e) {
            return e.label + ' ' + wkBirr_(e.got.birr) + (e.got.birr + 1 < e.birr ? ' of ' + wkBirr_(e.birr) : '') + (e.got.day !== r.day ? ' (' + wkDow_(e.got.day) + ')' : '');
          }).join(', ');
          if (not.length) m += ' · not in: ' + not.map(pay).join(', ');
          if (extra.length) m += ' · also: ' + extra.map(function (c) { return c.label + ' ' + wkBirr_(c.birr); }).join(', ');
        }
        L.push(m);
      }
    } else if (r.expected.length) {
      L.push('- Money expected: ' + wkBirr_(sum(r.expected)) + ' — ' + r.expected.map(function (e) {
        return pay(e) + (e.got ? ' (came ' + wkDow_(e.got.day) + ')' : '');
      }).join('; '));
    } else if (w.forecast) {
      L.push('- Money expected: none');
    }
  });
  /* the week in two lines */
  L.push('');
  var all = sum(w.expected), sure = sum(w.expected.filter(function (e) { return e.conf === 'sure'; }));
  var undated = w.expected.filter(function (e) { return !e.day; });
  if (w.upTo >= w.monday) {
    var dueSoFar = w.expected.filter(function (e) { return e.day && e.day <= w.upTo; });
    L.push('SO FAR: made ' + wkM2_(w.madeSoFar) + ' m²' + (w.plannedSoFar ? ' of ' + wkM2_(w.plannedSoFar) + ' planned' : '') +
           ' · money in ' + wkBirr_(sum(w.came)) + (w.forecast ? ' of ' + wkBirr_(sum(dueSoFar)) + ' expected by now' : ''));
  }
  L.push('THE WEEK: ' + wkM2_(w.weekPlanned) + ' m² planned (target ' + (PM_DAY_M2_ * PM_WEEK_DAYS_) + ')' +
         (w.forecast ? ' · ' + wkBirr_(all) + ' expected' + (sure ? ' (' + wkBirr_(sure) + ' sure)' : '') : '') +
         (undated.length ? ' · no day given: ' + undated.map(pay).join(', ') : ''));
  if (w.forecast && w.forecast.sign.length) {
    L.push('Contracts expected: ' + w.forecast.sign.map(function (s) {
      var who = [String(s.lc || '').trim(), String(s.cust || '').trim()].filter(function (x) { return x && !/^new$/i.test(x); }).join(' ');
      return (who || '?') + (n_(s.val) > 0 ? ' ' + wkBirr_(n_(s.val)) : '') + (WK_CONF_[s.conf] ? ' ' + WK_CONF_[s.conf] : '');
    }).join('; '));
  }
  if (w.watch.length) {
    L.push('');
    L.push('TO WATCH');
    w.watch.forEach(function (x) { L.push('- ' + x); });
  }
  return L.join('\n');
}

/* runOn_ (Agents.js): the block, at the end of the brief. A brief the model
   did not write keeps its place; the block is then sent on its own
   (waSendBrief_, mailAnalysis_). */
function weekIntoBrief_(results, d) {
  d.weekText = '';
  d.weekInBrief = false;
  try { d.weekText = weekText_(weekSchedule_(d)); }
  catch (e) { Logger.log('week schedule: %s %s', e.message, typeof where_ === 'function' ? where_(e) : ''); return; }
  var b = (results || []).filter(function (r) { return r.id === 'brief'; })[0];
  if (b && b.text && !aiFailed_(b.text)) {
    b.text = String(b.text).trim() + '\n\n' + d.weekText;
    d.weekInBrief = true;
  }
}

/* By hand from the editor: the block as the next brief would end, from the
   day just closed. Writes nothing, sends nothing, asks no model. */
function previewWeek(day) {
  day = day || addDays_(todayAddis_(), -1);
  var t = weekText_(weekSchedule_(gather_(closeDay_(day, { write: false }), false)));
  Logger.log(t);
  return t;
}
