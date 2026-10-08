/* Klever — the Daily Sales Director's figures. The agent itself is one
   entry in AGENTS (Agents.js, id 'salesdirector'); this works out what it is
   handed, every morning on the day just closed (and on "Analyse now").

   WHAT IT ADDS. The commercial analyst reads Ephrata's own day. This reads
   the sales team as a team: each of Ephrata and the two salespeople against
   their own weekly collection target (3,000,000 Birr for Ephrata's
   commission, 2,000,000 for each salesperson, from their letters and
   forms), what each remaining working day now needs; who did yesterday's
   work; four weeks of leads → visits → quotes → contracts and where the
   leads came from; and, from the leads register (Register.js), the named
   customers each one should act on today — a quote about to lapse (quotes
   carry a 15-day expiry), a signing Ephrata expects this week, a lead past
   the 48-hour visit rule, a lead gone quiet — ranked here, in code.

   Each person's figures are kept apart and never added together: Ephrata's
   daily report counts the commercial team's leads and collections, so the
   salespeople's are inside hers, not on top of them.                        */

var SD_WEEKS_ = 4;
var SD_MARGIN_FLOOR_ = 6000;
var SD_QUOTE_DAYS_ = 15;        /* the Chairman, 8 Oct 2026: was 7 */
var SD_QUOTE_WARN_DAYS_ = 3;
var SD_VISIT_HOURS_DAYS_ = 2;
var SD_ACTIONS_ = 3;
/* who the unassigned leads fall to */
var SD_LEAD_ = 'ephrata';
/* no visits: pre-measurement is Ephrata's, who assigns it (8 Oct 2026) */
var SD_SALES_F_ = { leads: 'l_total', called: 'r_1hr', quotes: 'q_issued',
                    contracts: 'c_signed', value: 'c_value', collected: 'k_today', week: 'k_week', unans: 'w_unans',
                    quoteList: 'q_list', margin: 'q_margin' };
var SD_TEAM_ = [
  { id: 'ephrata', report: 'ephrata-daily', target: 3000000,
    target_is: 'collected this week — Ephrata’s commission starts at 3,000,000 Birr',
    f: { visits: 'visits_done', visitsLate: 'visits_late', quotes: 'quotes_issued',
         contracts: 'contracts', value: 'contract_value', collected: 'collected_today', week: 'week_total', unans: 'wa_unanswered' } },
  { id: 'tsega', report: 'tsega-sales-daily', target: 2000000,
    target_is: 'collected this week, bank-confirmed — the salesperson’s weekly target', f: SD_SALES_F_ },
  { id: 'biruktayet', report: 'biruktayet-sales-daily', target: 2000000,
    target_is: 'collected this week, bank-confirmed — the salesperson’s weekly target', f: SD_SALES_F_ }
];

/* each member's daily report, the last filing of each day, from..to */
function sdHistory_(from, to) {
  var out = {};
  SD_TEAM_.forEach(function (m) {
    var by = {};
    tryQuery_('reports', [['person', 'EQUAL', m.id],
                          ['at', 'GREATER_THAN_OR_EQUAL', dayStart_(from)],
                          ['at', 'LESS_THAN', dayStart_(addDays_(to, 1))]], 'at').forEach(function (f) {
      if (f.report === m.report && f.at) by[dayOf_(f.at)] = f.values || {};
    });
    out[m.id] = by;
  });
  return out;
}
function sdSum_(byDay, days, field) {
  var k = days.filter(function (x) { return byDay[x] && !blank_(byDay[x][field]); });
  return k.length ? k.reduce(function (a, x) { return a + n_(byDay[x][field]); }, 0) : null;
}
function sdPairSum_(byDay, days, field) {
  var done = 0, of = 0, n = 0;
  days.forEach(function (x) {
    var p = byDay[x] ? pair_(byDay[x], field) : null;
    if (p && p.done !== null && p.of !== null && !p.cannot_be_right) { done += p.done; of += p.of; n++; }
  });
  return n ? { done: done, of: of, pct: of ? Math.round(done / of * 1000) / 10 : null } : null;
}
function sdPct_(a, b) { return a !== null && b ? Math.round(a / b * 1000) / 10 : null; }

function sdMember_(m, byDay, d, monday, from, left, names) {
  var f = m.f;
  var v = byDay[d.day] || null;
  var allDays = Object.keys(byDay).filter(function (x) { return x >= from && x <= d.day; }).sort();
  var weekDays = allDays.filter(function (x) { return x >= monday; });
  var collected = sdSum_(byDay, weekDays, f.collected);
  var own = null;
  weekDays.forEach(function (x) { var y = a_(byDay[x], f.week); if (y !== null) own = y; });
  var leftBirr = collected === null ? null : Math.max(0, m.target - collected);
  var working = 0;
  for (var x = from; x <= d.day; x = addDays_(x, 1)) if (dow_(x) !== 0) working++;
  var leads = sdSum_(byDay, allDays, f.leads), contracts = sdSum_(byDay, allDays, f.contracts);
  var quotes = sdSum_(byDay, allDays, f.quotes);
  var out = {
    name: names[m.id] || m.id,
    filed_the_day_read: !!v,
    the_day_read: v ? {
      leads: a_(v, f.leads), called_within_24_hours: pair_(v, f.called),
      visits_done: a_(v, f.visits), leads_waiting_over_48h_for_a_visit: a_(v, f.visitsLate),
      quotes: a_(v, f.quotes), contracts: a_(v, f.contracts), contract_value: a_(v, f.value),
      collected: a_(v, f.collected), whatsapp_answered_late_over_2h: a_(v, f.unans)
    } : null,
    week: {
      target: m.target, target_is: m.target_is,
      collected_so_far: collected,
      days_reported: weekDays.length,
      their_own_week_figure: own,
      left_to_target: leftBirr,
      working_days_left: left,
      needed_each_remaining_day: leftBirr !== null && left > 0 ? Math.ceil(leftBirr / left) : null,
      status: collected === null ? 'not reported' : collected >= m.target ? 'reached'
            : left === 0 ? 'missed' : 'open'
    },
    last_4_weeks: {
      working_days: working, days_filed: allDays.length, days_not_filed: Math.max(0, working - allDays.length),
      leads: leads, visits: sdSum_(byDay, allDays, f.visits), quotes: quotes, contracts: contracts,
      contract_value: sdSum_(byDay, allDays, f.value),
      called_within_24_hours: sdPairSum_(byDay, allDays, f.called),
      lead_to_contract_pct: sdPct_(contracts, leads),
      quote_to_contract_pct: sdPct_(contracts, quotes)
    }
  };
  /* each row carries only what that person is actually asked: pre-measurement
     is Ephrata's, the leads are the salespeople's (the Chairman, 8 Oct 2026) */
  if (!f.visits) {
    if (out.the_day_read) { delete out.the_day_read.visits_done; delete out.the_day_read.leads_waiting_over_48h_for_a_visit; }
    delete out.last_4_weeks.visits;
  }
  if (!f.leads) {
    if (out.the_day_read) delete out.the_day_read.leads;
    delete out.last_4_weeks.leads;
    delete out.last_4_weeks.lead_to_contract_pct;
  }
  if (!f.called) {
    if (out.the_day_read) delete out.the_day_read.called_within_24_hours;
    delete out.last_4_weeks.called_within_24_hours;
  }
  /* a salesperson's quotes: below the margin floor, by customer */
  if (f.quoteList && v) {
    out.the_day_read.average_margin_per_m2 = a_(v, f.margin);
    out.the_day_read.quotes_below_6000_per_m2 = rows_(v[f.quoteList]).filter(function (r) {
      return r && !blank_(r.margin) && n_(r.margin) < SD_MARGIN_FLOOR_;
    }).map(function (r) { return { customer: String(r.cust || '').trim(), margin_per_m2: n_(r.margin) }; });
  }
  return out;
}

/* Ephrata's marketing figures over the window, and what she said worked.
   The posts and the inquiries are hers; the leads they brought are counted
   from the salespeople, who log every lead (the Chairman, 8 Oct 2026). */
function sdMarketing_(hist, from, to) {
  var byDay = hist[SD_LEAD_] || {};
  var days = Object.keys(byDay).filter(function (x) { return x >= from && x <= to; }).sort();
  var teamSum = function (field) {
    var t = null;
    SD_TEAM_.forEach(function (m) {
      if (m.id === SD_LEAD_) return;
      var by = hist[m.id] || {};
      var v = sdSum_(by, Object.keys(by).filter(function (x) { return x >= from && x <= to; }).sort(), field);
      if (v !== null) t = (t === null ? 0 : t) + v;
    });
    return t;
  };
  var src = {};
  [['social', 'l_social'], ['showroom', 'l_show'], ['referral', 'l_ref'],
   ['agent', 'l_agent'], ['other', 'l_other']].forEach(function (s) { src[s[0]] = teamSum(s[1]); });
  var leads = teamSum('l_total');
  var posts = sdSum_(byDay, days, 'posts'), mkt = sdSum_(byDay, days, 'mkt_leads');
  return {
    days_reported: days.length,
    leads_total: leads,
    leads_by_source: src,
    social_share_of_leads_pct: sdPct_(src.social, leads),
    posts: posts,
    inquiries: sdSum_(byDay, days, 'inq'),
    inquiries_answered_within_1_hour: sdPairSum_(byDay, days, 'inq_1hr'),
    real_leads_from_marketing: mkt,
    real_leads_per_post: posts ? Math.round((mkt || 0) / posts * 100) / 100 : null,
    what_she_said_worked_last_7_days: days.filter(function (x) { return x > addDays_(to, -7); })
      .filter(function (x) { return !blank_(byDay[x].mkt_best); })
      .map(function (x) { return dayLabel_(x).split(' ')[0] + ': ' + String(byDay[x].mkt_best).trim(); })
  };
}

/* The open leads, each with the one most urgent thing to do about it, and
   the first few for each person. Rank: a quote about to lapse, a signing
   expected this week, one expected and missed, a lead past the 48-hour
   visit, a lapsed quote, a quiet lead. */
function sdPipeline_(today, names) {
  var rows = [];
  try { rows = (fsGet_('register/leads') || {}).rows || []; } catch (e) { rows = []; }
  var open = rows.filter(function (L) { return L.stageName !== 'contract'; });
  var at = {}, counts = { expiring: 0, lapsed: 0, expectedN: 0, expectedBirr: 0, missed: 0, quiet: 0, visit: 0 };
  var acts = {};
  var lead = names[SD_LEAD_] || SD_LEAD_;
  open.forEach(function (L) {
    at[L.stageName] = (at[L.stageName] || 0) + 1;
    var items = [];
    if (L.stageName === 'quote' && L.quoted) {
      var age = hrDaysBetween_(L.quoted, today), leftD = SD_QUOTE_DAYS_ - age;
      var ends = addDays_(L.quoted, SD_QUOTE_DAYS_);
      if (leftD >= 0 && leftD <= SD_QUOTE_WARN_DAYS_) {
        counts.expiring++;
        items.push({ rank: 1, sort: leftD, do: 'call before the quote lapses — quoted ' + dayLabel_(L.quoted) +
                     ', valid to ' + dayLabel_(ends) + (leftD === 0 ? ' (today)' : ' (' + leftD + ' days left)') });
      } else if (leftD < 0) {
        counts.lapsed++;
        items.push({ rank: 5, sort: -leftD, do: 're-quote or close — the quote of ' + dayLabel_(L.quoted) +
                     ' lapsed ' + (-leftD) + ' days ago' });
      }
    }
    if (L.expected && /^\d{4}-\d{2}-\d{2}$/.test(String(L.expected.date || ''))) {
      var ed = L.expected.date;
      if (ed >= today && ed <= addDays_(today, 6)) {
        counts.expectedN++;
        if (L.expected.value) counts.expectedBirr += n_(L.expected.value);
        items.push({ rank: 2, sort: hrDaysBetween_(today, ed), do: 'confirm the signing — Ephrata expects it by ' + dayLabel_(ed) +
                     (L.expected.value ? ' (' + fmt_(n_(L.expected.value)) + ' Birr)' : '') });
      } else if (ed < today) {
        counts.missed++;
        items.push({ rank: 3, sort: hrDaysBetween_(ed, today), do: 'find out why it has not signed — expected by ' + dayLabel_(ed) });
      }
    }
    var first = L.first || (L.last && L.last.day) || '';
    if (L.stageName === 'lead' && first && hrDaysBetween_(first, today) >= SD_VISIT_HOURS_DAYS_) {
      counts.visit++;
      items.push({ rank: 4, sort: -hrDaysBetween_(first, today), do: 'book the pre-measurement visit — lead since ' +
                   dayLabel_(first) + ', past the 48-hour rule' });
    }
    var quiet = L.last && L.last.day ? hrDaysBetween_(L.last.day, today) : 0;
    if (quiet >= REG_QUIET_DAYS_) {
      counts.quiet++;
      items.push({ rank: 6, sort: -quiet, do: 'call or close — nothing done for ' + quiet + ' days' });
    }
    if (!items.length) return;
    items.sort(function (a, b) { return a.rank - b.rank || a.sort - b.sort; });
    var who = L.sales || lead;
    (acts[who] = acts[who] || []).push({ rank: items[0].rank, sort: items[0].sort, customer: L.name,
      code: L.code || '', stage: L.stageName, quote_birr: L.quote == null ? null : L.quote,
      next_step_written: L.next || '', do: items[0].do });
  });
  var today_actions = {};
  SD_TEAM_.forEach(function (m) {
    var nm = names[m.id] || m.id;
    today_actions[nm] = (acts[nm] || []).sort(function (a, b) { return a.rank - b.rank || a.sort - b.sort; })
      .slice(0, SD_ACTIONS_).map(function (x) {
        return { customer: x.customer, code: x.code, stage: x.stage, quote_birr: x.quote_birr,
                 next_step_written: x.next_step_written, do: x.do };
      });
  });
  return {
    register_note: rows.length ? null : 'The leads register is empty — no lead has been logged in the reports yet.',
    unassigned_leads_go_to: lead,
    open_leads: open.length,
    open_leads_at_each_stage: at,
    quotes_lapsing_within_3_days: counts.expiring,
    quotes_already_lapsed: counts.lapsed,
    expected_to_sign_this_week: { leads: counts.expectedN, birr: counts.expectedBirr },
    expected_and_not_signed: counts.missed,
    leads_past_the_48_hour_visit: counts.visit,
    quiet_7_days_or_more: counts.quiet,
    today_actions: today_actions
  };
}

function salesDirector_(d) {
  var names = {};
  ((d.schedule && d.schedule.people) || []).forEach(function (p) { names[p.id] = p.en; });
  var start = prop_('LEDGER_START', '');
  var from = addDays_(d.day, -(7 * SD_WEEKS_ - 1));
  if (start && from < start) from = start;
  var dw = dow_(d.day);
  var monday = addDays_(d.day, -(dw === 0 ? 6 : dw - 1));
  var left = Math.max(0, 6 - dw);
  /* acting today: the morning reads yesterday, "Analyse now" reads today */
  var today = d.provisional ? d.day : addDays_(d.day, 1);
  var hist = sdHistory_(from, d.day);
  var pipe = sdPipeline_(today, names);
  var acts = pipe.today_actions;
  delete pipe.today_actions;
  return {
    the_day_read: dayLabel_(d.day),
    acting_on: dayLabel_(today),
    this_week: dayLabel_(monday) + ' to ' + dayLabel_(addDays_(monday, 5)) + ' (Monday to Saturday)',
    working_days_left_this_week: left,
    window_from: dayLabel_(from),
    team: SD_TEAM_.map(function (m) { return sdMember_(m, hist[m.id] || {}, d, monday, from, left, names); }),
    never_add_people_together: 'Each figure belongs to one person: the leads and the calls are the salespeople’s, pre-measurement is Ephrata’s. Her collections and contracts still cover the whole team, so do not add the three.',
    marketing: sdMarketing_(hist, from, d.day),
    pipeline: pipe,
    today_actions: acts
  };
}
