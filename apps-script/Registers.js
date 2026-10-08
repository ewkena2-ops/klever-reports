/* Klever — what the reports do not carry, kept in the Sheet by the Chairman
   (or whoever he asks), and the specialists that read it.

   THE TABS, made by the morning run (dailyRun_) the first time, then left
   to him — nothing he types is ever overwritten:
     Budgets                      a monthly budget for each spending line,
                                  payroll, headcount and sales collected
     Legal & Compliance Register  contracts, licences, permits, inspections,
                                  court cases and tax filings, with due dates
     Maintenance Plan             each machine's tasks, how often, when last
                                  done, and its spare parts against a minimum
   plus two columns on "Staff Wages and Letters" (Legal.js): the day each
   person started and the day they left, for turnover.

   The report endpoint refuses any report named like these tabs
   (RESERVED_TABS_ in Code.js). What is read from them goes only to /packs
   (his and the ledger's) and his email.                                    */

var BUDGET_TAB_ = 'Budgets';
var REG_TAB_ = 'Legal & Compliance Register';
var MAINT_TAB_ = 'Maintenance Plan';

function sheetEnsure_(name, header, seed) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (sh) return { sh: sh, created: false };
  sh = ss.insertSheet(name);
  sh.getRange(1, 1, 1, header.length).setValues([header]);
  if (seed && seed.length) sh.getRange(2, 1, seed.length, header.length).setValues(seed);
  sh.setFrozenRows(1);
  return { sh: sh, created: true };
}
/* the rows under the header, or null when the tab does not exist */
function sheetRows_(name, cols) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) return null;
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, cols).getValues().filter(function (r) {
    return r.some(function (c) { return !blank_(c); });
  });
}
var BUDGET_EXTRA_ = [
  { key: 'payroll', en: 'Payroll (all staff, gross a month)' },
  { key: 'headcount', en: 'Headcount (people)' },
  { key: 'sales', en: 'Sales collected (target a month)' }
];
function registersEnsure_() {
  var lines = (typeof CFO_LINES_ !== 'undefined' ? CFO_LINES_ : []).map(function (L) { return [L.en, '', '']; })
    .concat(BUDGET_EXTRA_.map(function (x) { return [x.en, '', '']; }));
  return {
    budgets: sheetEnsure_(BUDGET_TAB_, ['Line', 'Monthly budget (Birr, or people)', 'Notes'], lines).created,
    register: sheetEnsure_(REG_TAB_, ['Item', 'Type (contract / licence / permit / inspection / court case / tax filing / other)',
                                      'With whom', 'Due or renewal date (yyyy-mm-dd)', 'Status (open / done / renewed …)', 'Owner', 'Notes', 'Value (Birr)'], []).created,
    maintenance: sheetEnsure_(MAINT_TAB_, ['Machine', 'Task', 'Every (days)', 'Last done (yyyy-mm-dd)', 'Spare part',
                                           'Parts on hand', 'Minimum to keep', 'Notes'], []).created
  };
}

/* the English label of each stored choice code, from the live schedule —
   answers are kept as codes ('today', 'crit'), never as the words shown */
function choiceLabels_(schedule, reportId, fieldId, colId) {
  var out = {};
  ((schedule && schedule.reports) || []).forEach(function (r) {
    if (r.id !== reportId) return;
    var walk = function (fs) {
      (fs || []).forEach(function (f) {
        if (f.fields) walk(f.fields);
        if (f.id !== fieldId) return;
        var src = colId ? ((f.cols || []).filter(function (c) { return c.id === colId; })[0] || {}).opts : f.opts;
        (src || []).forEach(function (o) { out[o.v] = o.en; });
      });
    };
    walk(r.sections ? r.sections.map(function (s) { return { fields: s.fields }; }) : r.fields);
  });
  return out;
}

/* ------------------------------------------------------------------ *
 *  Budget against actual                                              *
 * ------------------------------------------------------------------ */
function budgetRead_() {
  var rows = sheetRows_(BUDGET_TAB_, 2);
  if (!rows) return null;
  var by = {};
  rows.forEach(function (r) {
    var line = String(r[0] || '').trim();
    if (line && !blank_(r[1])) by[line] = n_(r[1]);
  });
  return by;
}
function budgetFacts_(P) {
  var from = P.end.slice(0, 8) + '01', to = P.end;
  var b = budgetRead_();
  if (!b || !Object.keys(b).length) {
    return { note: 'No budgets yet — fill in the monthly figures in the Sheet tab “' + BUDGET_TAB_ + '”.', budgets_entered: 0 };
  }
  var dim = Number(monthEnd_(from).slice(8)), dom = Number(to.slice(8));
  var share = dom / dim;
  var sw = (rdBy_('betty', from, addDays_(to, 1))['betty-weekly']) || {};
  var lines = CFO_LINES_.map(function (L) {
    var spent = rdSum_(sw, L.id, from, addDays_(to, 1));
    var month = b[L.en] !== undefined ? b[L.en] : null;
    var soFar = month === null ? null : Math.round(month * share);
    return { line: L.en, budget_month: month, budget_so_far: soFar, spent_so_far: spent,
             over_by: soFar !== null && spent !== null && spent > soFar ? spent - soFar : 0,
             pct_of_budget_so_far: soFar ? Math.round((spent || 0) / soFar * 1000) / 10 : null };
  });
  var tab = legalStaffTab_(P.schedule);
  var staff = ((P.schedule && P.schedule.people) || []).filter(function (p) { return !p.company; });
  var current = staff.filter(function (p) { var r = tab.byId[p.id] || {}; return !r.left || r.left > to; });
  var payroll = current.reduce(function (a, p) { return a + ((tab.byId[p.id] || {}).wage || 0); }, 0);
  var wagesIn = current.filter(function (p) { return (tab.byId[p.id] || {}).wage; }).length;
  var collected = rdSum_((rdBy_('ephrata', from, to)['ephrata-daily']) || {}, 'collected_today', from, to);
  var ex = function (k) { var x = BUDGET_EXTRA_.filter(function (e) { return e.key === k; })[0]; return b[x.en] !== undefined ? b[x.en] : null; };
  var salesT = ex('sales');
  var spent = sumOrNull_(lines.map(function (l) { return l.spent_so_far; }));
  var bud = sumOrNull_(lines.map(function (l) { return l.budget_so_far; }));
  return {
    month_so_far: dayLabel_(from) + ' to ' + dayLabel_(to), share_of_month: Math.round(share * 1000) / 10 + '%',
    budgets_entered: Object.keys(b).length,
    spending_lines: lines,
    spent_so_far: spent, budget_so_far: bud,
    lines_over_budget: lines.filter(function (l) { return l.over_by > 0; }).map(function (l) { return l.line; }),
    spending_from: 'Selam’s weekly reports filed this month (“7 · Money spent this week”)',
    payroll: { budget_month: ex('payroll'), wages_on_the_staff_tab: payroll, people_with_a_wage: wagesIn, current_staff: current.length,
               over_by: ex('payroll') !== null && payroll > ex('payroll') ? payroll - ex('payroll') : 0 },
    headcount: { budget: ex('headcount'), now: current.length },
    sales: { target_month: salesT, target_so_far: salesT === null ? null : Math.round(salesT * share), collected_so_far: collected,
             short_by: salesT !== null && collected !== null && collected < salesT * share ? Math.round(salesT * share - collected) : 0 }
  };
}
var BUDGET_ASK_ =
  'You are the Chairman’s group finance officer. In at most 120 words, short bullets: spending against the budget '+
  'for the month so far — the lines over budget and by how much; payroll on the staff tab against its budget, and '+
  'headcount; sales collected against the target so far. If no budgets are entered, say where to enter them.';

/* ------------------------------------------------------------------ *
 *  Workforce: overtime, turnover, payroll                             *
 * ------------------------------------------------------------------ */
function workforceFacts_(P) {
  var from = P.start, to = P.end, back = addDays_(to, -27);
  var ad = (rdBy_('amaha', back, to)['amaha-daily']) || {};
  var ot = rdRows_(ad, 'ot_list', from, to).filter(function (x) { return x.r.name; });
  var byName = {};
  ot.forEach(function (x) {
    var k = spLower_(x.r.name);
    var e = byName[k] || (byName[k] = { name: String(x.r.name).trim(), hours: 0, days: 0, not_approved: 0 });
    e.hours += n_(x.r.hours); e.days++;
    if (ay_(x.r, 'ok') === false) e.not_approved++;
  });
  var weeks = [];
  for (var i = 3; i >= 0; i--) {
    var s = addDays_(sundayOf_(to), -7 * i);
    weeks.push({ week_ending: dayLabel_(s), overtime_hours: rdSum_(ad, 'ot_hours', addDays_(s, -6), s) });
  }
  var asked = Object.keys(ad).some(function (d) { return !blank_(ad[d].ot_hours); });
  var tab = legalStaffTab_(P.schedule);
  var staff = ((P.schedule && P.schedule.people) || []).filter(function (p) { return !p.company; });
  var yearAgo = addDays_(to, -365);
  var started = staff.filter(function (p) { var r = tab.byId[p.id] || {}; return r.started && r.started > yearAgo && r.started <= to; });
  var left = staff.filter(function (p) { var r = tab.byId[p.id] || {}; return r.left && r.left > yearAgo && r.left <= to; });
  var current = staff.filter(function (p) { var r = tab.byId[p.id] || {}; return !r.left || r.left > to; });
  var dates = staff.filter(function (p) { return (tab.byId[p.id] || {}).started; }).length;
  var assigned = rdSum_(ad, 'mp_assigned', back, to), present = rdSum_(ad, 'mp_present', back, to);
  var b = budgetRead_() || {};
  var pb = b[BUDGET_EXTRA_[0].en], hb = b[BUDGET_EXTRA_[1].en];
  var payroll = current.reduce(function (a, p) { return a + ((tab.byId[p.id] || {}).wage || 0); }, 0);
  return {
    week: dayLabel_(from) + ' to ' + dayLabel_(to),
    overtime: asked ? { hours_this_week: rdSum_(ad, 'ot_hours', from, to), by_person: Object.keys(byName).map(function (k) { return byName[k]; }).sort(function (a, b2) { return b2.hours - a.hours; }),
                        not_approved: ot.filter(function (x) { return ay_(x.r, 'ok') === false; }).length, last_4_weeks: weeks }
                    : { note: 'Overtime is not reported yet (Amaha’s daily report, Manpower).' },
    turnover: dates ? { headcount_now: current.length, joined_last_12_months: started.map(function (p) { return p.en; }),
                        left_last_12_months: left.map(function (p) { return p.en; }),
                        turnover_pct_12_months: current.length ? Math.round(left.length / current.length * 1000) / 10 : null,
                        method: 'people who left in the last 12 months over the headcount now', start_dates_entered: dates }
                    : { note: 'No start or leave dates yet (Sheet tab “Staff Wages and Letters”, last two columns).', headcount_now: current.length },
    payroll: { wages_on_the_staff_tab: payroll, budget: pb === undefined ? null : pb,
               over_budget_by: pb !== undefined && payroll > pb ? payroll - pb : 0,
               headcount_budget: hb === undefined ? null : hb },
    factory_attendance_4_weeks_pct: assigned ? Math.round((present || 0) / assigned * 1000) / 10 : null
  };
}
var WORKFORCE_ASK_ =
  'You are the Chairman’s head of people. In at most 120 words, short bullets: overtime this week and who works '+
  'the most, any not approved, and the four-week trend; turnover — who joined and who left in a year, and the '+
  'rate; payroll on the staff tab against its budget, and headcount against budget; factory attendance over four '+
  'weeks. Where something is not reported yet, say where it goes.';

/* ------------------------------------------------------------------ *
 *  The legal & compliance register                                    *
 * ------------------------------------------------------------------ */
function complianceFacts_(P) {
  var r = regDue_(P.end, null);
  if (r.note) return r;
  var rows = sheetRows_(REG_TAB_, 8) || [];
  var court = rows.filter(function (x) { return spLower_(x[1]).indexOf('court') === 0 && !/^(done|closed)/.test(spLower_(x[4])); })
    .map(function (x) { return { case: String(x[0]).trim(), with_whom: String(x[2] || '').trim(), next_date: legalDay_(x[3]) ? dayLabel_(legalDay_(x[3])) : null, status: String(x[4] || '').trim() }; });
  var types = spCount_(rows, function (x) { return spLower_(x[1]).split(' ')[0]; });
  r.open_court_cases = court;
  r.by_type = types;
  return r;
}
var COMPLIANCE_ASK_ =
  'You are the Chairman’s compliance officer. In at most 110 words, short bullets: anything overdue in the register '+
  '— contracts, licences, permits, inspections, tax filings — by name, owner and days overdue; what falls due in '+
  'the next 30 days; open court cases; and items with no date. If the register is empty, say where to fill it in.';

var REGISTER_READERS_ = [
  { id: 'budget', en: 'Budget against actual', am: 'በጀትና ትክክለኛ ወጪ', role: 'group finance officer', when: { week: true },
    facts: function (P) { return budgetFacts_(P); }, ask: BUDGET_ASK_,
    tiles: function (f) {
      var m = function (x) { return x === null || x === undefined ? '—' : fmt_(x); };
      if (f.note) return [{ en: 'Budgets entered', am: 'የገባ በጀት', v: '0' }];
      return [{ en: 'Spent so far', am: 'እስካሁን የወጣ', v: m(f.spent_so_far) }, { en: 'Budget so far', am: 'እስካሁን በጀት', v: m(f.budget_so_far) },
              { en: 'Lines over', am: 'በጀት ያለፉ', v: String(f.lines_over_budget.length) }, { en: 'Payroll', am: 'ደመወዝ', v: m(f.payroll.wages_on_the_staff_tab) }];
    },
    empty: function (f) { return !!f.note; }, emptyText: 'No budgets yet — fill in the monthly figures in the Sheet tab “Budgets”.' },
  { id: 'workforce', en: 'Workforce: overtime, turnover, payroll', am: 'የሰው ኃይል፦ ትርፍ ሰዓት፣ ዝውውር፣ ደመወዝ', role: 'head of people', when: { week: true },
    facts: function (P) { return workforceFacts_(P); }, ask: WORKFORCE_ASK_,
    tiles: function (f) {
      var m = function (x) { return x === null || x === undefined ? '—' : String(x); };
      return [{ en: 'Overtime hours', am: 'የትርፍ ሰዓት', v: f.overtime.note ? '—' : m(f.overtime.hours_this_week) },
              { en: 'Headcount', am: 'የሠራተኛ ብዛት', v: m(f.turnover.headcount_now) },
              { en: 'Turnover (12 months)', am: 'ዝውውር (12 ወር)', v: f.turnover.turnover_pct_12_months == null ? '—' : f.turnover.turnover_pct_12_months + '%' },
              { en: 'Attendance (4 weeks)', am: 'ተገኝነት (4 ሳምንት)', v: f.factory_attendance_4_weeks_pct === null ? '—' : f.factory_attendance_4_weeks_pct + '%' }];
    } },
  { id: 'compliance', en: 'Legal & compliance register', am: 'የሕግና የተገዢነት መዝገብ', role: 'compliance officer', when: { week: true },
    facts: function (P) { return complianceFacts_(P); }, ask: COMPLIANCE_ASK_,
    tiles: function (f) {
      if (f.note) return [{ en: 'Items', am: 'ጉዳዮች', v: '0' }];
      return [{ en: 'Overdue', am: 'ጊዜው ያለፈ', v: String(f.overdue.length) }, { en: 'Due in 30 days', am: 'በ30 ቀን የሚደርስ', v: String(f.due_within_30_days.length) },
              { en: 'Court cases', am: 'የፍርድ ቤት ጉዳዮች', v: String(f.open_court_cases.length) }, { en: 'No date', am: 'ቀን የሌላቸው', v: String(f.with_no_date.length) }];
    },
    empty: function (f) { return !!f.note; }, emptyText: 'The legal & compliance register is empty — fill it in the Sheet tab “Legal & Compliance Register”.' }
];
