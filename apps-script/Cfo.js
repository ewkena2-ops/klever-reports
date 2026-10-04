/* Klever — the CFO: where the week's money went.

   WHY THIS EXISTS
   Every other reading watches money coming in and the bank against the
   6,000,000 floor. Nothing said where the money went, so nothing could say
   where it could go further — the Chairman's own example: 90,000 Birr a week
   on staff food, against paying people cash instead. Selam's Friday report
   now has "7 · Money spent this week" (forms.js, sp_*), and the Sunday
   weekly summary (Packs.js) hands this file the week.

   Same rule as everywhere else: every figure below is worked out here, in
   code — the week's lines against their recent average, cost per meal, the
   cash-instead comparison, money in against out, weeks above the floor, and
   Selam's own plan against what happened. The model is given the finished
   figures and writes the reading; it is told not to do sums of its own.  */

/* the spending lines of Selam's weekly report, and which column of her
   4-week cash projection (betty-cashflow cf_out) each one was planned in */
var CFO_LINES_ = [
  { id: 'sp_sup',   en: 'Suppliers (board and materials)', am: 'አቅራቢዎች (ቦርድና ዕቃዎች)', plan: 'sup' },
  { id: 'sp_sal',   en: 'Salaries and wages',              am: 'ደመወዝ',                 plan: 'sal' },
  { id: 'sp_asm',   en: 'Assemblers',                      am: 'ገጣጣሚዎች',               plan: 'asm' },
  { id: 'sp_food',  en: 'Staff food',                      am: 'የሠራተኞች ምግብ',           plan: 'other' },
  { id: 'sp_trans', en: 'Transport and fuel',              am: 'ትራንስፖርትና ነዳጅ',         plan: 'other' },
  { id: 'sp_rent',  en: 'Rent',                            am: 'ኪራይ',                   plan: 'other' },
  { id: 'sp_util',  en: 'Power and water',                 am: 'መብራትና ውሃ',             plan: 'other' },
  { id: 'sp_other', en: 'Other',                           am: 'ሌላ',                    plan: 'other' }
];
var CFO_PLAN_COLS_ = [
  { id: 'sup', en: 'Suppliers' }, { id: 'sal', en: 'Salaries' },
  { id: 'asm', en: 'Assemblers' }, { id: 'other', en: 'Everything else' }
];
/* Birr a person a month, paid as cash instead of food — the Chairman's own
   figure (3 Oct 2026). A Script Property CFO_FOOD_CASH changes it. */
var CFO_FOOD_CASH_ = 4000;
var CFO_HISTORY_WEEKS_ = 4;
var CFO_FLOOR_ = 6000000;

function round1_(x) { return Math.round(x * 10) / 10; }
function sumOrNull_(xs) {
  var k = xs.filter(function (x) { return x !== null; });
  return k.length ? k.reduce(function (a, x) { return a + x; }, 0) : null;
}

/* Selam's weekly reports of the weeks before this one, one per week (the
   last filed in a week counts — a second one is a correction), by the week
   each counted for: sent late on Saturday, a report is still its own week's
   (THE WEEK, Agent.js). Read by person, which the person+at index serves,
   rather than every report filed in a month. */
function cfoHistory_(P) {
  var week = weekOfP_(P);
  var rows = tryQuery_('reports', [['person', 'EQUAL', 'betty'],
                                   ['at', 'GREATER_THAN_OR_EQUAL', weekCut_(addDays_(week, -7 * (CFO_HISTORY_WEEKS_ + 1)))],
                                   ['at', 'LESS_THAN', weekCut_(addDays_(week, -7))]], 'at');
  var byWeek = {};
  rows.forEach(function (f) {
    if (f.report !== 'betty-weekly' || !f.at) return;
    byWeek[weekOf_(f.at)] = { day: dayOf_(f.at), v: f.values || {} };
  });
  return Object.keys(byWeek).sort().map(function (k) { return byWeek[k]; });
}

function cfoFacts_(P, ops) {
  ops = ops || operations_(P);
  /* her report of this week — the one that counted for it, the last if sent twice */
  var mine = filingOfWeek_(P.filings, 'betty-weekly', weekOfP_(P));
  var now = mine ? { day: mine.day, v: mine.fields || {} } : null;
  var v = now ? now.v : {};
  var hist = cfoHistory_(P);

  var lines = CFO_LINES_.map(function (L) {
    var birr = a_(v, L.id);
    var past = hist.map(function (h) { return a_(h.v, L.id); })
                   .filter(function (x) { return x !== null; });
    var avg = past.length ? Math.round(past.reduce(function (a, x) { return a + x; }, 0) / past.length) : null;
    return { id: L.id, line: L.en, am: L.am, birr: birr,
             average_of_recent_weeks: avg, weeks_in_average: past.length,
             change_pct: (birr !== null && avg) ? round1_((birr - avg) / avg * 100) : null };
  });
  var spent = sumOrNull_(lines.map(function (l) { return l.birr; }));
  var biggest = lines.reduce(function (m, l) { return l.birr !== null && (!m || l.birr > m.birr) ? l : m; }, null);

  /* money in: her weekly total if she gave it, else her daily cash-in added up */
  var fTotal = a_(v, 'f_total');
  var moneyIn = fTotal !== null ? fTotal : ops.money.cash_in;
  var inFrom = fTotal !== null ? 'Selam’s weekly report (collected in total)'
             : (ops.money.cash_in !== null ? 'Selam’s daily reports, added up' : null);
  var net = (moneyIn !== null && spent !== null) ? moneyIn - spent : null;

  var bank = a_(v, 'f_bank');
  var bankFrom = 'Selam’s weekly report (end of week)';
  if (bank === null && ops.money.bank_last) {
    bank = ops.money.bank_last.birr;
    bankFrom = 'Selam’s daily report of ' + dayLabel_(ops.money.bank_last.day);
  }
  if (bank === null) bankFrom = null;
  var weeksLeft = null, weeksNote = null;
  if (bank !== null && net !== null) {
    if (bank < CFO_FLOOR_) weeksNote = 'the bank is already below the 6,000,000 floor';
    else if (net >= 0) weeksNote = 'money in covered money out this week, so the bank is not running down';
    else weeksLeft = round1_((bank - CFO_FLOOR_) / -net);
  }

  /* food: per meal, per working day, against who came, and cash instead */
  var workDays = 0;
  for (var d = P.start; d <= P.end; d = addDays_(d, 1)) if (dow_(d) !== 0) workDays++;
  var food = a_(v, 'sp_food'), meals = a_(v, 'sp_meals');
  var factory = avgOf_(daysOf_(P, 'amaha-daily'), 'mp_present');
  var site = avgOf_(daysOf_(P, 'elyas-daily'), 'a_present');
  var mealsPerDay = (meals !== null && workDays) ? round1_(meals / workDays) : null;
  var perMonth = food !== null ? Math.round(food * 52 / 12) : null;
  var cash = Number(prop_('CFO_FOOD_CASH', CFO_FOOD_CASH_)) || CFO_FOOD_CASH_;
  var people = mealsPerDay !== null ? Math.round(mealsPerDay) : null;
  var cashMonth = people !== null ? people * cash : null;

  /* Selam's own plan: the "Week 1" of the 4-week projection that counted
     for the week before is this week (the same reading forecasts_ in
     Packs.js uses) */
  var cf = filingOfWeek_(P.filings, 'betty-cashflow', addDays_(weekOfP_(P), -7));
  var planRow = cf ? (rows_((cf.fields || {}).cf_out)[0] || null) : null;
  var plan = null;
  if (planRow) {
    plan = CFO_PLAN_COLS_.map(function (c) {
      var planned = a_(planRow, c.id);
      var actual = sumOrNull_(lines.filter(function (l, i) { return CFO_LINES_[i].plan === c.id; })
                                   .map(function (l) { return l.birr; }));
      return { what: c.en, planned: planned, actual: actual,
               off_by_pct: (planned && actual !== null) ? round1_((actual - planned) / planned * 100) : null };
    });
    var pT = sumOrNull_(plan.map(function (p) { return p.planned; }));
    plan.push({ what: 'Total', planned: pT, actual: spent,
                off_by_pct: (pT && spent !== null) ? round1_((spent - pT) / pT * 100) : null });
  }

  return {
    week: dayLabel_(P.start) + ' to ' + dayLabel_(P.end),
    weekly_report_filed: now ? dayLabel_(now.day) : null,
    spending_reported: spent !== null,
    lines: lines,
    spent_total: spent,
    biggest_line: biggest ? biggest.line : null,
    money_in: moneyIn,
    money_in_from: inFrom,
    money_in_minus_out: net,
    bank: bank,
    bank_from: bankFrom,
    reserve_floor: CFO_FLOOR_,
    weeks_above_floor_at_this_rate: weeksLeft,
    weeks_note: weeksNote,
    food: {
      birr_this_week: food,
      meals_paid_for: meals,
      birr_per_meal: (food !== null && meals) ? Math.round(food / meals) : null,
      working_days: workDays,
      meals_per_working_day: mealsPerDay,
      factory_present_per_day: factory,
      site_assemblers_present_per_day: site,
      meals_per_day_above_people_reported_present:
        (mealsPerDay !== null && (factory !== null || site !== null))
          ? round1_(mealsPerDay - (factory || 0) - (site || 0)) : null,
      present_counts_cover: 'the factory (Amaha’s daily report) and the site assemblers (Elyas’s) only — office staff are not counted daily, so a small surplus is expected',
      birr_per_month_at_this_rate: perMonth,
      cash_instead: {
        birr_per_person_per_month: cash,
        people: people,
        birr_per_month: cashMonth,
        saving_per_month: (perMonth !== null && cashMonth !== null) ? perMonth - cashMonth : null,
        note: 'people = meals per working day; the cash figures are before income tax and pension'
      }
    },
    plan_vs_actual: plan,
    plan_note: plan ? null : 'Selam did not file a 4-week cash projection the week before'
  };
}

var CFO_ASK_ =
  'You are the Chairman’s CFO. Write him the week’s money in at most 150 words, short '+
  'bullets. Lead with the single biggest saving or money risk, with its Birr amount. Then '+
  'where the money went — name any line far above its recent average. Then food: the cost '+
  'per meal, whether more meals were paid for than people came, and what paying '+
  'cash_instead would cost and save a month (say it is before tax and pension). Then money '+
  'in against money out, and how many weeks the bank stays above the 6,000,000 floor at this '+
  'rate. Then whether Selam’s own plan held. Quote the figures as given.';

function cfoRead_(facts, P) {
  if (!facts.spending_reported) {
    /* nothing to read, so no model is paid to say so */
    return 'Selam did not report the week’s spending, so there is nothing to say yet about where ' +
           'the money went. It goes in “7 · Money spent this week” of her Friday Weekly Finance Report.';
  }
  if (!brain_().key) return '(No model key set — GEMINI_KEY. The figures are still complete.)';
  var prompt = [
    'You are reading one week of Klever Küche, a kitchen cabinet maker in Addis Ababa.',
    'Prices are in Birr; the cash reserve floor is 6,000,000 Birr.',
    '',
    'Every number below was calculated in code and is correct. Quote them as given and do no',
    'arithmetic of your own. A null was not reported — it is not zero; say "not reported".',
    'Write plainly: no bold headline labels, no adjectives doing the work of evidence.',
    '',
    'YOUR TASK: ' + CFO_ASK_,
    '',
    '--- ' + P.start + ' to ' + P.end + ' ---',
    JSON.stringify(facts, null, 1)
  ].join('\n');
  return aiAsk_(prompt, 1500);
}

/* What his page and the pack keep of it (Packs.js savePack_). */
function cfoSaved_(facts, text) {
  if (!facts) return {};
  return {
    cfoText: String(text || ''),
    cfoSpent: facts.spent_total,
    cfoIn: facts.money_in,
    cfoNet: facts.money_in_minus_out,
    cfoWeeksLeft: facts.weeks_above_floor_at_this_rate,
    cfoWeeksNote: facts.weeks_note,
    cfoFoodPerMeal: facts.food.birr_per_meal,
    cfoFoodMonth: facts.food.birr_per_month_at_this_rate,
    cfoCashMonth: facts.food.cash_instead.birr_per_month,
    cfoSaving: facts.food.cash_instead.saving_per_month,
    cfoLines: facts.lines.map(function (l) {
      return { id: l.id, en: l.line, am: l.am, birr: l.birr, avg: l.average_of_recent_weeks };
    }),
    /* the whole of it, for the questions he asks later (Ask.js) */
    cfoJson: JSON.stringify(facts)
  };
}

/* The CFO's part of the Sunday email. */
function cfoMailHtml_(facts, text) {
  var cell = 'padding:5px 8px;border-bottom:1px solid #e4e7e3';
  var money = function (x) { return x === null || x === undefined ? '—' : fmt_(x); };
  var html = '<h3 style="font-size:13.5px;margin:0 0 6px;color:#0f5c54">Your CFO — the week’s money</h3>' +
    '<div style="background:#f3f4f1;border-left:3px solid #8a6d1f;padding:14px 16px;' +
    'margin-bottom:12px;font-size:14px;line-height:1.65;white-space:pre-wrap">' + esc_(text) + '</div>';
  if (!facts.spending_reported) return html;
  html += '<table width="100%" cellpadding="0" cellspacing="0" style="font-size:12.5px;margin-bottom:22px">' +
    '<tr style="color:#66716d;font-size:10.5px;letter-spacing:.08em;text-align:left">' +
    '<th style="padding:0 8px 5px">SPENT ON</th><th style="padding:0 8px 5px;text-align:right">THIS WEEK</th>' +
    '<th style="padding:0 8px 5px;text-align:right">RECENT AVERAGE</th></tr>';
  facts.lines.forEach(function (l) {
    html += '<tr><td style="' + cell + '">' + esc_(l.line) + '</td><td align="right" style="' + cell +
            ';font-family:monospace">' + money(l.birr) + '</td><td align="right" style="' + cell +
            ';font-family:monospace;color:#66716d">' + money(l.average_of_recent_weeks) + '</td></tr>';
  });
  html += '<tr><td style="padding:7px 8px;font-weight:bold">Total</td><td align="right" style="padding:7px 8px;' +
          'font-family:monospace;font-weight:bold">' + money(facts.spent_total) + '</td><td></td></tr></table>';
  return html;
}
