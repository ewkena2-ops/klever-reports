/* Klever — HR: the week's people.

   WHY THIS EXISTS
   Three of the daily agents touch people — who was absent, who reported,
   what the ledger charged — and each reads one day and stops. Nothing looked
   at a person across weeks: who is slipping, who has got better, who is
   working with no terms letter (so nothing they miss costs anything), who is
   new and what their first weeks still lack. The CFO reads the week's money
   on Sunday; this reads the week's people beside it, in the same Sunday
   summary (Packs.js weeklyPack_), on his page and in his email.

   Same rule as everywhere else: every figure below is worked out here, in
   code — on-time rates this week and in each of the four before, who moved
   and by how much, fines and bonuses, absences and lateness by name, the
   fines a missing letter let go, the days a new person has been here. The
   model is handed the finished figures and writes the reading; it is told
   to do no sums of its own.

   Only Klever's own staff are read. The accounts that report for Rovestone,
   Meri Block Board and Lemi Kura (`company` in forms.js) are not Klever
   employees and have no terms letters; the weekly summary already says
   whether they filed.

   previewHr() logs the figures and writes nothing, calls no model.          */

var HR_HISTORY_WEEKS_ = 4;
/* a move of this many points in on-time %, against the average of the weeks
   before, is "better" or "worse"; less is the same */
var HR_MOVE_PTS_ = 15;
/* new for this many days after the first day on the site */
var HR_NEW_DAYS_ = 30;
/* The longest probation Ethiopian law allows: sixty working days (Labour
   Proclamation 1156/2019, art. 11). Whether a letter uses probation at all
   is the letter's business; this only says when the longest one would end. */
var HR_PROBATION_DAYS_ = 60;
var HR_PROBATION_WARN_DAYS_ = 14;
var HR_ATTENDANCE_TARGET_ = 95;

/* People who work for Klever without a terms letter of their own and are not
   marked `noLetter` in forms.js, because they file nothing that could be
   fined. Take a line out when the letter is written. */
var HR_NO_OWN_LETTER_ = [
  { id: 'seble', name: 'Seble Mulugeta', role: 'Finance Assistant',
    why: 'no letter of her own; her duties are written inside the Finance Officer’s letter' },
  { id: 'alex', name: 'Alex', role: 'co-signs delivery orders with Mahelet',
    why: 'no full name on file and no letter written yet; not on the site' }
];

function hrPct_(k, n) { return n ? Math.round(k / n * 1000) / 10 : null; }
function hrAvg_(xs) {
  var k = xs.filter(function (x) { return x !== null && x !== undefined; });
  return k.length ? round1_(k.reduce(function (a, x) { return a + x; }, 0) / k.length) : null;
}
function hrDaysBetween_(a, b) {
  return Math.round((dayStart_(b).getTime() - dayStart_(a).getTime()) / 86400000);
}
/* the nth working day from `from`, counting `from` as the first. Klever
   works Monday to Saturday; public holidays are not taken out. */
function hrWorkday_(from, n) {
  var d = from, k = 0;
  for (var guard = 0; guard < 400; guard++) {
    if (dow_(d) !== 0) { k++; if (k === n) return d; }
    d = addDays_(d, 1);
  }
  return d;
}

/* Each of the four weeks before this one, person by person: due, on time,
   late, missing — counted the way reporting_ (Packs.js) counts the week
   itself. Lines from before LEDGER_START are nobody's record (the restart
   cancelled them), so those weeks come back empty, not as zeros. */
function hrHistory_(P) {
  var week = weekOfP_(P);
  var start = prop_('LEDGER_START', '');
  var weeks = [], at = {};
  for (var i = HR_HISTORY_WEEKS_; i >= 1; i--) {
    var w = { week: addDays_(week, -7 * i), by: {} };
    weeks.push(w);
    at[w.week] = w;
  }
  var docs = tryQuery_('ledger', [['day', 'GREATER_THAN_OR_EQUAL', addDays_(weeks[0].week, -6)],
                                  ['day', 'LESS_THAN', addDays_(week, -6)]], 'day');
  docs.forEach(function (doc) {
    var w = at[sundayOf_(doc.day)];
    if (!w) return;
    (doc.lines || []).forEach(function (l) {
      if (l.status === 'NOT DUE YET') return;
      if (start && (l.dueDay || doc.day) < start) return;
      var p = w.by[l.person] || (w.by[l.person] = { due: 0, on_time: 0, late: 0, missing: 0 });
      p.due++;
      if (l.status === 'On time') p.on_time++;
      if (l.status === 'LATE') p.late++;
      if (l.status === 'MISSING') p.missing++;
    });
  });
  return weeks;
}

/* What this week's late and missing reports would have cost someone with no
   terms letter, had there been one — at the first-miss rate of the report's
   own penalty, plus the rule lines held back for the same reason. */
function hrNotCharged_(P, id) {
  var start = prop_('LEDGER_START', '');
  var birr = 0;
  P.ledgers.forEach(function (doc) {
    (doc.lines || []).forEach(function (l) {
      if (l.person !== id || l.status === 'NOT DUE YET') return;
      if (start && (l.dueDay || doc.day) < start) return;
      var rule = penaltyFor_(l.report);
      if (!rule) return;
      if (l.status === 'LATE') birr += rule.late || 0;
      if (l.status === 'MISSING') birr += rule.miss || 0;
    });
    (doc.ruleLines || []).forEach(function (l) {
      if (l.person === id && l.wouldBe > 0 && /no terms letter/.test(l.why || '')) birr += l.wouldBe;
    });
  });
  return birr;
}

/* A name as typed in a report, matched to the staff list when it can be
   done without guessing: the full name, or a first name only one worker
   has. Otherwise it stays as typed. */
function hrWho_(typed, roster) {
  var t = String(typed || '').trim().replace(/\s+/g, ' ');
  if (!t) return '';
  var low = t.toLowerCase();
  var full = roster.filter(function (p) { return p.en.toLowerCase() === low; });
  if (full.length === 1) return full[0].en;
  if (low.indexOf(' ') < 0) {
    var first = roster.filter(function (p) { return p.en.toLowerCase().split(' ')[0] === low; });
    if (first.length === 1) return first[0].en;
  }
  return t;
}
/* rows of a who-list across the week's reports, counted by person */
function hrTally_(days, field, roster, flag) {
  var by = {};
  days.forEach(function (x) {
    rows_(x.v[field]).forEach(function (r) {
      var who = hrWho_(r && r.name, roster);
      if (!who) return;
      var k = who.toLowerCase();
      var e = by[k] || (by[k] = { name: who, times: 0, days: [] });
      e.times++;
      e.days.push(dayLabel_(x.day).split(' ')[0]);
      if (flag) {
        var key = flag.key, v = r ? r[flag.col] : null;
        if (!blank_(v) && !yes_(v)) e[key] = (e[key] || 0) + 1;
      }
    });
  });
  return Object.keys(by).map(function (k) { return by[k]; })
    .sort(function (a, b) { return b.times - a.times || (a.name < b.name ? -1 : 1); });
}
/* the written answers of a week, with the day they were given */
function hrSaid_(days, field) {
  return days.filter(function (x) { return !blank_(x.v[field]); })
    .map(function (x) { return dayLabel_(x.day).split(' ')[0] + ': ' + String(x.v[field]).trim(); });
}

/* Factory attendance in each of the weeks before, from Amaha's daily report:
   people present over people assigned. Read by person, which the person+at
   index serves. */
function hrAttendanceHistory_(P) {
  var week = weekOfP_(P);
  var from = addDays_(week, -7 * HR_HISTORY_WEEKS_ - 6);
  var rows = tryQuery_('reports', [['person', 'EQUAL', 'amaha'],
                                   ['at', 'GREATER_THAN_OR_EQUAL', dayStart_(from)],
                                   ['at', 'LESS_THAN', dayStart_(addDays_(week, -6))]], 'at');
  var byDay = {};
  rows.forEach(function (f) {
    if (f.report === 'amaha-daily' && f.at) byDay[dayOf_(f.at)] = f.values || {};
  });
  var out = [];
  for (var i = HR_HISTORY_WEEKS_; i >= 1; i--) {
    var sun = addDays_(week, -7 * i);
    var days = Object.keys(byDay).filter(function (d) { return sundayOf_(d) === sun; })
      .map(function (d) { return { day: d, v: byDay[d] }; });
    var a = sumOf_(days, 'mp_assigned'), p = sumOf_(days, 'mp_present');
    out.push(a ? hrPct_(p || 0, a) : null);
  }
  return out;
}

function hrAttendance_(P, roster) {
  var amaha = daysOf_(P, 'amaha-daily');
  var elyas = daysOf_(P, 'elyas-daily');
  var assigned = sumOf_(amaha, 'mp_assigned'), present = sumOf_(amaha, 'mp_present');
  var pct = assigned ? hrPct_(present || 0, assigned) : null;
  var before = hrAttendanceHistory_(P);
  var absent = hrTally_(amaha, 'mp_absent_list', roster, { col: 'ok', key: 'without_permission' });
  var late = hrTally_(amaha, 'mp_late_list', roster, { col: 'valid', key: 'without_a_valid_reason' });
  var siteLate = hrTally_(elyas, 'a_late_who', [], null);
  var safety = amaha.filter(function (x) { return ay_(x.v, 'mp_safety') === true; });
  return {
    factory_days_reported: amaha.length,
    factory_assigned: assigned,
    factory_present: present,
    factory_attendance_pct: pct,
    attendance_bonus_needs_pct: HR_ATTENDANCE_TARGET_,
    factory_attendance_pct_weeks_before: before,
    absent_by_name: absent,
    late_by_name: late,
    absent_more_than_once: absent.filter(function (x) { return x.times > 1; }).map(function (x) { return x.name; }),
    late_more_than_once: late.filter(function (x) { return x.times > 1; }).map(function (x) { return x.name; }),
    names_note: 'names are as Amaha and Elyas typed them, matched to the staff list only where it was certain',
    behaviour_issues_factory: sumOf_(amaha, 'mp_behave'),
    behaviour_factory_said: hrSaid_(amaha, 'mp_behave_what'),
    days_someone_was_hurt_or_unprotected: safety.length,
    safety_said: hrSaid_(amaha, 'mp_safety_what'),
    site_days_reported: elyas.length,
    site_assemblers_late_by_name: siteLate,
    site_left_early: sumOf_(elyas, 'a_early'),
    behaviour_issues_site: sumOf_(elyas, 'a_behave')
  };
}

function hrFacts_(P, rep) {
  rep = rep || reporting_(P);
  var all = (P.schedule && P.schedule.people) || [];
  var staff = all.filter(function (p) { return !p.company; });
  var byId = {};
  staff.forEach(function (p) { byId[p.id] = p; });
  var roster = staff.filter(function (p) { return p.roleEn === 'Production Worker'; });
  var hist = hrHistory_(P);
  var money = {};
  payOf_(P.ledgers, null, P.waivers, P.names).forEach(function (m) { money[m.id] = m; });
  var start = prop_('LEDGER_START', '');

  var people = rep.by_person.filter(function (r) { return byId[r.id]; }).map(function (r) {
    var p = byId[r.id];
    var before = hist.map(function (h) {
      var x = h.by[r.id];
      return x && x.due ? hrPct_(x.on_time, x.due) : null;
    });
    var avg = hrAvg_(before);
    var change = (r.on_time_pct !== null && avg !== null) ? round1_(r.on_time_pct - avg) : null;
    var trend = change === null ? null
              : change <= -HR_MOVE_PTS_ ? 'worse' : change >= HR_MOVE_PTS_ ? 'better' : 'about the same';
    var count = {};
    r.which.forEach(function (w) { count[w.report] = (count[w.report] || 0) + 1; });
    var m = money[r.id];
    return {
      id: r.id, name: r.name, role: p.roleEn,
      reports_due: r.due, on_time: r.on_time, late: r.late, missing: r.missing,
      on_time_pct: r.on_time_pct,
      on_time_pct_weeks_before: before,
      average_of_weeks_before: avg,
      change_in_points: change,
      trend: trend,
      late_or_missing: r.which,
      same_report_late_or_missing_more_than_once: Object.keys(count).filter(function (k) { return count[k] > 1; })
        .map(function (k) { return { report: k, times: count[k] }; }),
      fines_birr: m ? m.reportFines + m.otherFines - m.finesCancelled : 0,
      bonuses_birr: m ? m.bonuses - m.bonusesCancelled : 0,
      net_birr: m ? m.net : 0,
      has_terms_letter: !p.noLetter,
      not_charged_for_want_of_a_letter_birr: p.noLetter ? hrNotCharged_(P, r.id) : null
    };
  });

  /* who is slipping, who got better, who was clean — decided here, with the
     reason in figures, so the reading cannot name the wrong person */
  var slipping = [], better = [], clean = [];
  people.forEach(function (p) {
    var why = [];
    if (p.trend === 'worse') {
      why.push('on time ' + p.on_time_pct + '% this week against ' + p.average_of_weeks_before +
               '% in the weeks before (' + p.change_in_points + ' points)');
    }
    p.same_report_late_or_missing_more_than_once.forEach(function (x) {
      why.push(x.report + ' late or missing ' + x.times + ' times this week');
    });
    if (p.missing >= 3) why.push(p.missing + ' reports missing this week');
    if (why.length) slipping.push({ name: p.name, because: why });
    if (p.trend === 'better') {
      better.push({ name: p.name, because: 'on time ' + p.on_time_pct + '% this week against ' +
                    p.average_of_weeks_before + '% in the weeks before (+' + p.change_in_points + ' points)' });
    }
    if (p.reports_due && p.on_time === p.reports_due) clean.push(p.name);
  });

  /* no terms letter */
  var noLetter = staff.filter(function (p) { return p.noLetter; }).map(function (p) {
    var mine = people.filter(function (x) { return x.id === p.id; })[0];
    return {
      name: p.en, role: p.roleEn,
      on_the_site_from: p.from ? dayLabel_(p.from) : null,
      reports_due_this_week: mine ? mine.reports_due : 0,
      late_or_missing_this_week: mine ? mine.late + mine.missing : 0,
      birr_not_charged_this_week: mine ? mine.not_charged_for_want_of_a_letter_birr : 0,
      note: 'nothing this person misses costs anything until a letter is signed'
    };
  }).concat(HR_NO_OWN_LETTER_.map(function (x) {
    return { name: x.name, role: x.role, note: x.why };
  }));

  /* new staff, and the longest probation the law allows */
  var newStaff = [], probation = [];
  staff.forEach(function (p) {
    if (!p.from || p.from > P.end) return;
    var days = hrDaysBetween_(p.from, P.end) + 1;
    var ends = hrWorkday_(p.from, HR_PROBATION_DAYS_);
    var left = hrDaysBetween_(P.end, ends);
    if (left >= 0 && left <= HR_PROBATION_WARN_DAYS_) {
      probation.push({ name: p.en, started: dayLabel_(p.from), longest_probation_ends: dayLabel_(ends),
                       days_left: left });
    }
    if (days > HR_NEW_DAYS_) return;
    var filed = tryQuery_('reports', [['person', 'EQUAL', p.id],
                                      ['at', 'GREATER_THAN_OR_EQUAL', dayStart_(p.from)],
                                      ['at', 'LESS_THAN', dayStart_(addDays_(P.end, 1))]], 'at');
    var mine = people.filter(function (x) { return x.id === p.id; })[0];
    newStaff.push({
      name: p.en, role: p.roleEn,
      on_the_site_from: dayLabel_(p.from),
      days_since: days,
      reports_filed_since: filed.length,
      first_report: filed.length && filed[0].at ? dayLabel_(dayOf_(filed[0].at)) : null,
      this_week: mine ? { due: mine.reports_due, on_time: mine.on_time, late: mine.late, missing: mine.missing } : null,
      still_to_do: [
        p.noLetter ? 'terms letter — none written yet' : null,
        filed.length ? null : 'has not filed a report yet (check the sign-in card works)'
      ].filter(function (x) { return x; }),
      longest_probation_ends: dayLabel_(ends),
      probation_note: 'sixty working days (Labour Proclamation 1156/2019), Sundays skipped, holidays not; ' +
                      'counted from the first day on the site — the real first day may be a day earlier'
    });
  });

  var due = people.reduce(function (a, p) { return a + p.reports_due; }, 0);
  var onTime = people.reduce(function (a, p) { return a + p.on_time; }, 0);
  /* the weeks before, for Klever's staff only — as this week is counted */
  var weeksBefore = hist.map(function (h) {
    var d = 0, k = 0;
    Object.keys(h.by).forEach(function (id) {
      if (byId[id]) { d += h.by[id].due; k += h.by[id].on_time; }
    });
    return d ? hrPct_(k, d) : null;
  });
  return {
    week: dayLabel_(P.start) + ' to ' + dayLabel_(P.end),
    counting_started: start ? dayLabel_(start) : null,
    history_note: weeksBefore.some(function (x) { return x !== null; }) ? null
      : 'no earlier week has been counted yet, so nobody can be called better or worse',
    klever_staff_with_reports: people.length,
    reports_due: due,
    on_time_pct: hrPct_(onTime, due),
    on_time_pct_weeks_before: weeksBefore,
    people: people,
    slipping: slipping,
    better: better,
    on_time_all_week: clean,
    fines_birr_total: people.reduce(function (a, p) { return a + p.fines_birr; }, 0),
    bonuses_birr_total: people.reduce(function (a, p) { return a + p.bonuses_birr; }, 0),
    no_terms_letter: noLetter,
    new_staff: newStaff,
    probation_ending_within_two_weeks: probation,
    attendance: hrAttendance_(P, roster)
  };
}

var HR_ASK_ =
  'You are the Chairman’s head of HR. Write him the week’s people in at most 150 words, short '+
  'bullets. Lead with the one person or gap that most needs him this week, and why, in figures. '+
  'Then who is slipping and who got better: name them with the figures given in slipping and '+
  'better, and no one else. A first miss is a bad day; the same report missed again is a '+
  'conversation, not a fine — say which it is. If history_note is set, say there is nothing to '+
  'compare with yet instead of calling anyone better or worse. Then anyone working with no '+
  'terms letter, and the fines not charged this week because of it. Then new staff: what their first weeks '+
  'still lack; and only if probation_ending_within_two_weeks has anyone in it, that date (say it '+
  'applies only if their letter uses probation). Then attendance: the factory rate against the 95% the bonus '+
  'needs, and anyone absent or late more than once, and anything said about behaviour or safety. '+
  'End with one line naming who was on time all week. Quote the figures as given.';

function hrRead_(facts, P) {
  if (!facts.reports_due && !facts.attendance.factory_days_reported) {
    /* nothing to read, so no model is paid to say so */
    return 'No reports were due from Klever staff this week and Amaha filed no attendance, ' +
           'so there is nothing to say about the week’s people yet.';
  }
  if (!brain_().key) return '(No model key set — GEMINI_KEY. The figures are still complete.)';
  var prompt = [
    'You are reading one week of the people at Klever Küche, a kitchen cabinet maker in Addis',
    'Ababa. Fines and bonuses are in Birr and come from each person’s terms letter.',
    '',
    'Every number below was calculated in code and is correct. Quote them as given and do no',
    'arithmetic of your own. A null was not reported — it is not zero; say "not reported".',
    'Write plainly: no bold headline labels, no adjectives doing the work of evidence. Call',
    'people by the names given.',
    '',
    'YOUR TASK: ' + HR_ASK_,
    '',
    '--- ' + P.start + ' to ' + P.end + ' ---',
    JSON.stringify(facts, null, 1)
  ].join('\n');
  return aiAsk_(prompt, 1500);
}

/* What his page and the pack keep of it (Packs.js savePack_). */
function hrSaved_(facts, text) {
  if (!facts) return {};
  return {
    hrText: String(text || ''),
    hrOnTimePct: facts.on_time_pct,
    hrSlipping: facts.slipping.length,
    hrNoLetter: facts.no_terms_letter.length,
    hrAttendPct: facts.attendance.factory_attendance_pct,
    hrPeople: facts.people.map(function (p) {
      return { name: p.name, due: p.reports_due, onTime: p.on_time, late: p.late, missing: p.missing,
               pct: p.on_time_pct, before: p.average_of_weeks_before, trend: p.trend };
    }),
    /* the whole of it, for the questions he asks later (Ask.js) */
    hrJson: JSON.stringify(facts)
  };
}

/* HR's part of the Sunday email. */
function hrMailHtml_(facts, text) {
  var cell = 'padding:5px 8px;border-bottom:1px solid #e4e7e3';
  var head = 'padding:0 8px 5px';
  var pct = function (x) { return x === null || x === undefined ? '—' : x + '%'; };
  var html = '<h3 style="font-size:13.5px;margin:0 0 6px;color:#0f5c54">Your HR — the week’s people</h3>' +
    '<div style="background:#f3f4f1;border-left:3px solid #2aa58e;padding:14px 16px;' +
    'margin-bottom:12px;font-size:14px;line-height:1.65;white-space:pre-wrap">' + esc_(text) + '</div>';
  if (facts.people.length) {
    html += '<table width="100%" cellpadding="0" cellspacing="0" style="font-size:12.5px;margin-bottom:16px">' +
      '<tr style="color:#66716d;font-size:10.5px;letter-spacing:.08em;text-align:left">' +
      '<th style="' + head + '">PERSON</th><th style="' + head + ';text-align:right">ON TIME</th>' +
      '<th style="' + head + ';text-align:right">WEEKS BEFORE</th><th style="' + head + ';text-align:right">FINES</th>' +
      '<th style="' + head + ';text-align:right">BONUSES</th></tr>';
    facts.people.forEach(function (p) {
      var colour = p.trend === 'worse' ? '#8f3020' : p.trend === 'better' ? '#0f5c54' : '#141b1a';
      html += '<tr><td style="' + cell + '">' + esc_(p.name) + (p.has_terms_letter ? '' : ' <span style="color:#8f3020">(no letter)</span>') +
              '</td><td align="right" style="' + cell + ';font-family:monospace;color:' + colour + '">' +
              p.on_time + '/' + p.reports_due + ' · ' + pct(p.on_time_pct) +
              '</td><td align="right" style="' + cell + ';font-family:monospace;color:#66716d">' + pct(p.average_of_weeks_before) +
              '</td><td align="right" style="' + cell + ';font-family:monospace">' + (p.fines_birr ? fmt_(p.fines_birr) : '—') +
              '</td><td align="right" style="' + cell + ';font-family:monospace">' + (p.bonuses_birr ? fmt_(p.bonuses_birr) : '—') +
              '</td></tr>';
    });
    html += '</table>';
  }
  var list = function (title, rows) {
    if (!rows.length) return '';
    return '<p style="font-size:12.5px;margin:0 0 4px;font-weight:bold">' + esc_(title) + '</p>' +
      '<ul style="font-size:12.5px;margin:0 0 14px;padding-left:18px">' +
      rows.map(function (r) { return '<li>' + esc_(r) + '</li>'; }).join('') + '</ul>';
  };
  html += list('No terms letter', facts.no_terms_letter.map(function (x) {
    return x.name + ' (' + x.role + ') — ' + x.note +
           (x.birr_not_charged_this_week ? '; ' + fmt_(x.birr_not_charged_this_week) + ' Birr not charged this week' : '');
  }));
  html += list('New staff', facts.new_staff.map(function (x) {
    return x.name + ', ' + x.role + ', on the site from ' + x.on_the_site_from +
           (x.still_to_do.length ? ' — still to do: ' + x.still_to_do.join('; ') : ' — nothing outstanding');
  }));
  html += list('Probation ending soon', facts.probation_ending_within_two_weeks.map(function (x) {
    return x.name + ': the longest probation the law allows ends ' + x.longest_probation_ends;
  }));
  var a = facts.attendance;
  html += list('Absent or late more than once', a.absent_by_name.filter(function (x) { return x.times > 1; })
    .map(function (x) { return x.name + ' — absent ' + x.times + ' days (' + x.days.join(', ') + ')'; })
    .concat(a.late_by_name.filter(function (x) { return x.times > 1; })
    .map(function (x) { return x.name + ' — late ' + x.times + ' times (' + x.days.join(', ') + ')'; })));
  return html + '<div style="margin-bottom:22px"></div>';
}

/* The figures for the week that closed last, or the week ending on a Sunday
   given as 'yyyy-mm-dd'. Writes nothing and calls no model. */
function previewHr(endDay) {
  if (!isDay_(endDay)) endDay = null;
  var end = endDay ? sundayOf_(endDay) : lastClosedSunday_();
  var P = packData_(addDays_(end, -6), end);
  P.week = end;
  Logger.log(JSON.stringify(hrFacts_(P), null, 1));
}
