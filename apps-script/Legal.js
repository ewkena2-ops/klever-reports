/* Klever — the legal check: what the letters do against the labour law.

   WHY THIS EXISTS
   The ledger fines people out of their pay, and nothing checked that
   against the law. Ethiopian labour law, as we read it, lets an employer
   deduct from wages only where a law, a collective agreement, work rules, a
   court order or the worker's written agreement allows it — and caps any
   deduction at one third of the wage. Nothing watched that cap, nor who is
   fined with no signed letter on record, nor who is working with no written
   terms at all, nor the warnings and removals the letters call for, which
   the law has its own procedure for. This reads those, every Sunday for the
   month so far (beside the CFO and HR in Packs.js weeklyPack_) and on the
   2nd for the whole month, before payroll (monthlyPack_).

   THE WAGES are not in this file and never will be: the repository is
   public. They live in the Sheet, in the tab "Staff Wages and Letters",
   which the morning run makes and keeps listing every member of staff —
   the Chairman fills in each monthly wage and the day each letter was
   signed. The report endpoint refuses that tab's name (RESERVED_TABS_ in
   Code.js), so nobody outside can write a row into it. What is read from it
   goes only to /packs (his and the ledger's alone) and his email.

   Same rule as everywhere else: every figure is worked out here, in code;
   the model writes the reading from finished figures and does no sums.
   It is not a lawyer and is told to say so: the reading is for him to take
   to one before acting.

   previewLegal() logs the figures, writes nothing, calls no model.          */

var LEGAL_TAB_ = 'Staff Wages and Letters';
var LEGAL_CAP_SHARE_ = 1 / 3;
/* warn from this share of the cap */
var LEGAL_NEAR_ = 0.8;
var LEGAL_WRITTEN_DAYS_ = 15;
var LEGAL_LAW_ = {
  deductions: 'Labour Proclamation 1156/2019, art. 59: the employer may deduct from wages only where a law, a ' +
              'collective agreement, work rules, a court order or the worker’s written agreement allows it, and ' +
              'no deduction may pass one third of the worker’s wage at any one time. For staff paid monthly this ' +
              'reads as a month’s deductions against a third of that month’s wage.',
  written: 'Labour Proclamation 1156/2019, art. 7: where the contract of employment is not in writing, the ' +
           'employer gives the worker a signed written statement of its terms within 15 days.',
  procedure: 'A warning, suspension or dismissal has to follow the procedure in the labour law and the work ' +
             'rules, whatever a letter says. Have each one checked before acting on it.',
  note: 'This is how the law reads to us, not legal advice. An Ethiopian labour lawyer should confirm it.'
};
/* the open decisions in Agents.js that are questions of law */
var LEGAL_DECISIONS_ = ['protection-clause', 'which-document-wins', 'no-letter', 'rovestone'];

function legalDay_(v) {
  if (v == null || v === '') return null;
  if (Object.prototype.toString.call(v) === '[object Date]') return isNaN(v.getTime()) ? null : dayOf_(v);
  var s = String(v).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

/* The tab: one row a member of Klever's staff. Made the first time; after
   that only new staff are added at the bottom — what the Chairman typed is
   never touched. Returns { byId: {id: {wage, signedOn}}, created }. */
function legalStaffTab_(schedule) {
  var staff = ((schedule && schedule.people) || []).filter(function (p) { return !p.company; });
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(LEGAL_TAB_);
  var created = false;
  if (!sh) {
    sh = ss.insertSheet(LEGAL_TAB_);
    sh.getRange(1, 1, 1, 6).setValues([['Id (do not change)', 'Name', 'Role', 'Monthly wage, gross (Birr)',
                                        'Terms letter signed on (yyyy-mm-dd)', 'Notes']]);
    sh.setFrozenRows(1);
    created = true;
  }
  /* two columns added on 8 Oct 2026, for turnover (Registers.js) */
  var h2 = sh.getRange(1, 7, 1, 2).getValues()[0] || [];
  if (blank_(h2[0]) || blank_(h2[1])) sh.getRange(1, 7, 1, 2).setValues([['Started on (yyyy-mm-dd)', 'Left on (yyyy-mm-dd)']]);
  var last = sh.getLastRow();
  var rows = last > 1 ? sh.getRange(2, 1, last - 1, 8).getValues() : [];
  var byId = {};
  rows.forEach(function (r) {
    var id = String(r[0] || '').trim();
    if (!id) return;
    var wage = blank_(r[3]) ? null : n_(r[3]);
    byId[id] = { wage: wage > 0 ? wage : null, signedOn: legalDay_(r[4]), started: legalDay_(r[6]), left: legalDay_(r[7]) };
  });
  staff.forEach(function (p) {
    if (byId[p.id]) return;
    sh.appendRow([p.id, cell_(p.en), cell_(p.roleEn), '', '', p.noLetter ? 'no terms letter yet' : '', p.from || '', '']);
    byId[p.id] = { wage: null, signedOn: null };
  });
  return { byId: byId, created: created };
}

/* the fines a person was charged before the day their letter was signed —
   or all of them, when no signing day is on record */
function legalBeforeSigning_(lines, id, signedOn) {
  return lines.reduce(function (a, x) {
    return x.person === id && (!signedOn || x.day < signedOn) ? a + x.amount : a;
  }, 0);
}

function legalFacts_(P, kind) {
  var all = (P.schedule && P.schedule.people) || [];
  var staff = all.filter(function (p) { return !p.company; });
  var byId = {};
  staff.forEach(function (p) { byId[p.id] = p; });
  var month = kind === 'month';
  var from = month ? P.start : P.end.slice(0, 8) + '01';
  var to = P.end;
  var ledgers = month ? P.ledgers
    : tryQuery_('ledger', [['day', 'GREATER_THAN_OR_EQUAL', from], ['day', 'LESS_THAN', addDays_(to, 1)]], 'day');
  var waivers = month ? P.waivers
    : tryQuery_('waivers', [['day', 'GREATER_THAN_OR_EQUAL', from], ['day', 'LESS_THAN', addDays_(to, 1)]], 'day');
  var monthDoc = month ? (P.monthDoc || null) : null;
  var tab = legalStaffTab_(P.schedule);

  /* every fine actually charged in the period, cancellations taken out */
  var off = {};
  (waivers || []).forEach(function (w) { off[w.day + '|' + w.report] = true; });
  var charged = [], consequences = [], unsigned = {}, held = {};
  function take(day, l) {
    if (l.kind === 'consequence') {
      if (!byId[l.person]) return;
      var why = String(l.why || '');
      consequences.push({
        day: dayLabel_(day), name: l.name || P.names[l.person] || l.person, what: l.reportName,
        counted: !/^(Not counted|Held for your decision)/.test(why) && !off[day + '|' + l.report],
        why: why.length > 220 ? why.substring(0, 220) + '…' : why
      });
      return;
    }
    if (l.kind === 'bonus') return;
    if (l.amount > 0 && !off[day + '|' + l.report]) charged.push({ person: l.person, day: day, amount: l.amount });
    if (l.wouldBe > 0) {
      var w = String(l.why || '');
      var bucket = /not signed/i.test(w) ? unsigned : /^Held for your decision/.test(w) ? held : null;
      if (bucket) {
        var k = l.reportName || l.rule || l.report;
        var e = bucket[k] || (bucket[k] = { rule: k, people: [], birr_would_be: 0 });
        var nm = l.name || P.names[l.person] || l.person;
        if (e.people.indexOf(nm) < 0) e.people.push(nm);
        e.birr_would_be += l.wouldBe;
      }
    }
  }
  (ledgers || []).forEach(function (doc) {
    (doc.lines || []).forEach(function (l) { take(doc.day, l); });
    (doc.ruleLines || []).forEach(function (l) { take(doc.day, l); });
  });
  if (monthDoc) (monthDoc.lines || []).forEach(function (l) { take(monthDoc.day, l); });

  /* each person fined, against a third of their wage */
  var fines = {};
  charged.forEach(function (x) { fines[x.person] = (fines[x.person] || 0) + x.amount; });
  var people = Object.keys(fines).filter(function (id) { return byId[id]; }).map(function (id) {
    var p = byId[id], row = tab.byId[id] || {};
    var wage = row.wage || null;
    var cap = wage ? Math.floor(wage * LEGAL_CAP_SHARE_) : null;
    var share = cap ? Math.round(fines[id] / cap * 1000) / 10 : null;
    var status = !wage ? 'wage not entered'
               : fines[id] > cap ? 'over a third' : fines[id] >= cap * LEGAL_NEAR_ ? 'near a third' : 'within';
    return {
      name: p.en, role: p.roleEn,
      fines_birr: fines[id],
      monthly_wage_birr: wage,
      one_third_birr: cap,
      share_of_one_third_pct: share,
      status: status,
      over_by_birr: cap && fines[id] > cap ? fines[id] - cap : 0,
      letter_signed_on: row.signedOn ? dayLabel_(row.signedOn) : null,
      charged_with_no_signed_letter_on_record_birr: legalBeforeSigning_(charged, id, row.signedOn)
    };
  }).sort(function (a, b) {
    return (b.share_of_one_third_pct || 0) - (a.share_of_one_third_pct || 0) || b.fines_birr - a.fines_birr;
  });

  /* working without written terms */
  var noTerms = staff.filter(function (p) { return p.noLetter; }).map(function (p) {
    var due = p.from ? addDays_(p.from, LEGAL_WRITTEN_DAYS_) : null;
    return {
      name: p.en, role: p.roleEn,
      on_the_site_from: p.from ? dayLabel_(p.from) : null,
      written_terms_due_by: due ? dayLabel_(due) : null,
      days_past_due: due && to > due ? hrDaysBetween_(due, to) : 0
    };
  }).concat((typeof HR_NO_OWN_LETTER_ !== 'undefined' ? HR_NO_OWN_LETTER_ : []).map(function (x) {
    return { name: x.name, role: x.role, note: x.why };
  }));

  /* injuries reported in the period, from Amaha's daily report */
  var safety = daysOf_(P, 'amaha-daily').filter(function (x) { return ay_(x.v, 'mp_safety') === true; })
    .map(function (x) { return dayLabel_(x.day) + ': ' + String(x.v.mp_safety_what || 'not described').trim(); });

  var decisions = (typeof DECISIONS !== 'undefined' ? DECISIONS : []).filter(function (d) {
    return LEGAL_DECISIONS_.indexOf(d.id) >= 0;
  }).map(function (d) { return { what: d.what, detail: d.detail, blocks: d.blocks || '' }; });

  var withWage = staff.filter(function (p) { return (tab.byId[p.id] || {}).wage; }).length;
  var withDate = staff.filter(function (p) { return (tab.byId[p.id] || {}).signedOn; }).length;
  var sum = function (xs, f) { return xs.reduce(function (a, x) { return a + (x[f] || 0); }, 0); };
  var list = function (o) { return Object.keys(o).map(function (k) { return o[k]; }); };
  return {
    period: dayLabel_(from) + ' to ' + dayLabel_(to),
    period_is: month ? 'the whole month, before payroll' : 'this month so far',
    law: LEGAL_LAW_,
    sheet_tab: LEGAL_TAB_,
    staff_on_the_tab: staff.length,
    wages_entered: withWage,
    signing_dates_entered: withDate,
    tab_just_made: tab.created,
    fined_people: people,
    over_a_third: people.filter(function (p) { return p.status === 'over a third'; }).map(function (p) { return p.name; }),
    near_a_third: people.filter(function (p) { return p.status === 'near a third'; }).map(function (p) { return p.name; }),
    fined_with_no_wage_entered: people.filter(function (p) { return p.status === 'wage not entered'; }).map(function (p) { return p.name; }),
    fines_birr_total: sum(people, 'fines_birr'),
    charged_with_no_signed_letter_on_record_birr: sum(people, 'charged_with_no_signed_letter_on_record_birr'),
    working_without_written_terms: noTerms,
    warnings_and_removals_the_letters_call_for: consequences,
    not_counted_because_the_paper_is_not_signed: list(unsigned),
    held_for_your_decision: list(held),
    injuries_reported: safety,
    open_legal_decisions: decisions
  };
}

var LEGAL_ASK_ =
  'You are the Chairman’s legal check. You are not a lawyer; end with one short line saying the points '+
  'should go to his labour lawyer before he acts. At most 150 words, short bullets. Lead with anyone in '+
  'over_a_third: name, fines, the third of their wage and over_by_birr, and say plainly that this is over '+
  'the limit as the law section reads it. Then anyone in near_a_third, with fines and the third of their '+
  'wage, saying they are close to it. If '+
  'fined_with_no_wage_entered has names, say whose monthly wage is needed in the sheet tab named in '+
  'sheet_tab before the one-third rule can be checked. Then fines charged with no signed letter on '+
  'record — but if signing_dates_entered is 0, say once that no signing dates are entered yet instead of '+
  'naming people. Then anyone working without written terms: the date they were due by, or their note '+
  'when there is no date. Then any warnings or removals the letters call for, saying which are not '+
  'counted (counted false) and that the procedure must be checked before acting on any. Then injuries '+
  'reported. Then the open legal decisions, one line each. Cite the law only in the words given in law. '+
  'Quote the figures as given.';

function legalRead_(facts, P) {
  if (!brain_().key) return '(No model key set — GEMINI_KEY. The figures are still complete.)';
  var prompt = [
    'You are checking one period at Klever Küche, a kitchen cabinet maker in Addis Ababa, against',
    'Ethiopian labour law as summarised below. Amounts are in Birr; fines come from each person’s',
    'terms letter and are deducted from their pay.',
    '',
    'Every number below was calculated in code and is correct. Quote them as given and do no',
    'arithmetic of your own. A null was not entered — it is not zero; say "not entered".',
    'Write plainly: no bold headline labels, no adjectives doing the work of evidence, no legal',
    'advice beyond what the law section says.',
    '',
    'YOUR TASK: ' + LEGAL_ASK_,
    '',
    '--- ' + facts.period + ' (' + facts.period_is + ') ---',
    JSON.stringify(facts, null, 1)
  ].join('\n');
  return aiAsk_(prompt, 1500);
}

/* What his page and the pack keep of it (Packs.js savePack_). */
function legalSaved_(facts, text) {
  if (!facts) return {};
  return {
    legalText: String(text || ''),
    legalOver: facts.over_a_third.length,
    legalNear: facts.near_a_third.length,
    legalNoWage: facts.fined_with_no_wage_entered.length,
    legalUnsigned: facts.charged_with_no_signed_letter_on_record_birr,
    legalRows: facts.fined_people.map(function (p) {
      return { name: p.name, fines: p.fines_birr, cap: p.one_third_birr, status: p.status };
    }),
    /* the whole of it, for the questions he asks later (Ask.js) */
    legalJson: JSON.stringify(facts)
  };
}

/* The legal check's part of the email. */
function legalMailHtml_(facts, text) {
  var cell = 'padding:5px 8px;border-bottom:1px solid #e4e7e3';
  var head = 'padding:0 8px 5px';
  var money = function (x) { return x === null || x === undefined ? '—' : fmt_(x); };
  var html = '<h3 style="font-size:13.5px;margin:0 0 6px;color:#0f5c54">Your legal check — ' +
    esc_(facts.period_is) + '</h3>' +
    '<div style="background:#f3f4f1;border-left:3px solid #8f3020;padding:14px 16px;' +
    'margin-bottom:12px;font-size:14px;line-height:1.65;white-space:pre-wrap">' + esc_(text) + '</div>';
  if (facts.fined_people.length) {
    html += '<table width="100%" cellpadding="0" cellspacing="0" style="font-size:12.5px;margin-bottom:10px">' +
      '<tr style="color:#66716d;font-size:10.5px;letter-spacing:.08em;text-align:left">' +
      '<th style="' + head + '">PERSON</th><th style="' + head + ';text-align:right">FINES</th>' +
      '<th style="' + head + ';text-align:right">A THIRD OF WAGE</th><th style="' + head + '">STATUS</th></tr>';
    facts.fined_people.forEach(function (p) {
      var colour = p.status === 'over a third' ? '#8f3020' : p.status === 'near a third' ? '#8a6d1f' : '#141b1a';
      html += '<tr><td style="' + cell + '">' + esc_(p.name) + '</td><td align="right" style="' + cell +
              ';font-family:monospace">' + money(p.fines_birr) + '</td><td align="right" style="' + cell +
              ';font-family:monospace;color:#66716d">' + money(p.one_third_birr) + '</td><td style="' + cell +
              ';color:' + colour + '">' + esc_(p.status) + '</td></tr>';
    });
    html += '</table>';
  }
  html += '<p style="font-size:12px;color:#66716d;margin:0 0 22px">Wages and signing dates come from the Sheet, tab “' +
          esc_(facts.sheet_tab) + '” (' + facts.wages_entered + ' of ' + facts.staff_on_the_tab + ' wages entered). ' +
          esc_(facts.law.note) + '</p>';
  return html;
}

/* The figures for this month up to the week that closed last, as the
   Sunday run would read them. Writes nothing but the tab, calls no model. */
function previewLegal(endDay) {
  if (!isDay_(endDay)) endDay = null;
  var end = endDay ? sundayOf_(endDay) : lastClosedSunday_();
  var P = packData_(addDays_(end, -6), end);
  P.week = end;
  Logger.log(JSON.stringify(legalFacts_(P, 'week'), null, 1));
}
