/* Klever — three more morning agents' figures. The agents are entries in
   AGENTS (Agents.js): 'gate', 'reconcile', 'anomaly'. Each works out every
   figure here, in code; the morning's AI task list reads their findings.

   WORKFLOW GATE (owners: Ephrata, Selam). The job register (Register.js)
   already tests each KK job against the journey's gates — an advance within
   two working days of signing, no final measurement before the advance and
   Selam's green light, the measurement within a day of the advance, no
   production before the final payment, no delivery without Selam's
   clearance, the 48-hour follow-up call, a failed QC passed since. This
   reads those each morning, by gate, with whose move each one is.

   RECONCILIATION (owners: Selam, Kidan). Each day's figures against each
   other: the four bank lines against the total, every list against its own
   total, Ephrata's collections against Selam's money in, Getachew's cheques
   against Selam's ZamZam transfers and her approvals, the store's stock
   arithmetic. A difference is a thing to put right the same day.

   ATTENDANCE ANOMALY (owner: the HR Manager, a position nobody holds — so
   the Chairman's). Patterns no single day shows: a worker absent beside the
   Sunday again and again, absent three days running, late three times in
   two weeks, and a day with far more absences than usual.                  */

var GATE_CODES_ = {
  'no-advance':             { gate: 'Advance within 2 working days of signing', owners: ['betty', 'ephrata'] },
  'no-job-file':            { gate: 'Job File opened with the advance', owners: ['betty'] },
  'measure-before-advance': { gate: 'No final measurement before the advance (gate 1)', owners: ['ephrata', 'betty'] },
  'measure-no-green':       { gate: 'No final measurement without Selam’s green light (gate 1)', owners: ['ephrata', 'betty'] },
  'measure-late':           { gate: 'Final measurement within 24 hours of the advance', owners: ['ephrata'] },
  'prod-before-final':      { gate: 'No production before the final payment', owners: ['liu', 'betty'] },
  'not-cleared':            { gate: 'No delivery without Selam’s clearance', owners: ['betty', 'elyas'] },
  'qc-failed':              { gate: 'A failed QC passed before it moves on', owners: ['wude'] },
  'followup-late':          { gate: 'The 48-hour follow-up call after installation', owners: ['ephrata'] }
};

function gateFacts_(d) {
  var names = {};
  ((d.schedule && d.schedule.people) || []).forEach(function (p) { names[p.id] = p.en; });
  var jobs = opsJobs_();
  var breaches = [];
  jobs.forEach(function (j) {
    (j.problems || []).forEach(function (p) {
      var g = GATE_CODES_[p.code];
      if (!g) return;
      breaches.push({ job: j.job, customer: j.cust || '', gate: g.gate, what: p.text,
                      step: j.board ? j.board.n + ' ' + j.board.en : '', whose_move: j.board ? j.board.nextWho || '' : '',
                      owners: g.owners.map(function (o) { return names[o] || o; }) });
    });
  });
  var byGate = {};
  breaches.forEach(function (b) { (byGate[b.gate] = byGate[b.gate] || []).push(b); });
  var acts = {};
  breaches.forEach(function (b) {
    b.owners.forEach(function (o) {
      (acts[o] = acts[o] || []).push({ do: 'put right ' + b.job + (b.customer ? ' (' + b.customer + ')' : '') + ': ' + b.gate.toLowerCase(), why: b.what });
    });
  });
  Object.keys(acts).forEach(function (k) { acts[k] = acts[k].slice(0, 4); });
  return {
    the_day_read: dayLabel_(d.day),
    register_note: jobs.length ? null : 'The job register has no jobs yet, so no gate can be checked.',
    jobs_checked: jobs.length,
    gates_broken: breaches.length,
    by_gate: Object.keys(byGate).map(function (g) { return { gate: g, jobs: byGate[g].length, which: byGate[g] }; })
      .sort(function (a, b) { return b.jobs - a.jobs; }),
    today_actions: acts
  };
}

/* ------------------------------------------------------------------ */
function recSum_(rows, field) {
  var n = 0, any = false;
  rows_(rows).forEach(function (r) { if (r && !blank_(r[field])) { n += n_(r[field]); any = true; } });
  return any ? n : null;
}
function recCheck_(list, check, aLabel, a, bLabel, b, who, tol) {
  if (a === null || b === null || a === undefined || b === undefined) return;
  var diff = a - b;
  list.push({ check: check, a_is: aLabel, a: a, b_is: bLabel, b: b, difference: diff,
              ok: Math.abs(diff) <= (tol === undefined ? 1 : tol), who: who });
}
function reconcileFacts_(d) {
  var sel = vals_(d.filed, 'betty-daily'), eph = vals_(d.filed, 'ephrata-daily');
  var get = vals_(d.filed, 'getachew-daily'), yor = vals_(d.filed, 'yordanos-daily');
  var c = [];
  var banks = [a_(sel, 'bank_cbe'), a_(sel, 'bank_awash'), a_(sel, 'bank_aby'), a_(sel, 'bank_zz')];
  if (banks.every(function (x) { return x !== null; })) {
    recCheck_(c, 'The four bank lines against the total', 'CBE + Awash + Abyssinia + ZamZam', banks.reduce(function (a, x) { return a + x; }, 0),
              'Selam’s bank total', a_(sel, 'bank_total'), 'Selam');
  }
  recCheck_(c, 'Cash receipts listed against cash in', 'receipts listed', recSum_(sel.cash_in_list, 'amount'), 'cash in', a_(sel, 'cash_in'), 'Selam');
  recCheck_(c, 'Advances listed against advances', 'advances listed', recSum_(sel.adv_in_list, 'amount'), 'advances', a_(sel, 'adv_in'), 'Selam');
  recCheck_(c, 'Final payments listed against final payments', 'finals listed', recSum_(sel.final_in_list, 'amount'), 'final payments', a_(sel, 'final_in'), 'Selam');
  recCheck_(c, 'Payments listed against payments approved', 'payments listed', recSum_(sel.pay_list, 'amount'), 'approved', a_(sel, 'pay_value'), 'Selam');
  var ai = a_(sel, 'adv_in'), fi = a_(sel, 'final_in');
  recCheck_(c, 'Ephrata’s collections against Selam’s money in', 'Ephrata collected', a_(eph, 'collected_today'),
            'Selam’s advances + finals', ai === null && fi === null ? null : (ai || 0) + (fi || 0), 'Selam, Ephrata', 1000);
  recCheck_(c, 'Ephrata’s collections listed against her total', 'listed', recSum_(eph.collected_list, 'amount'), 'her total', a_(eph, 'collected_today'), 'Ephrata');
  recCheck_(c, 'ZamZam transfers listed against the total moved', 'transfers listed', recSum_(sel.zz_list, 'amount'), 'moved to ZamZam', a_(sel, 'zz_transfer'), 'Selam');
  recCheck_(c, 'Cheques listed against the cheques total', 'cheques listed', recSum_(get.chq_list, 'amount'), 'cheques total', a_(get, 'chq_value'), 'Getachew');
  var chq = a_(get, 'chq_value'), zz = a_(sel, 'zz_transfer');
  var cover = chq !== null && zz !== null ? { cheques_written: chq, moved_to_zamzam: zz, cheques_beyond_the_transfer: Math.max(0, chq - zz) } : null;
  var acc = a_(yor, 'rec_accepted'), rej = a_(yor, 'rec_rejected');
  recCheck_(c, 'Deliveries accepted and rejected against deliveries received', 'accepted + rejected', acc === null && rej === null ? null : (acc || 0) + (rej || 0),
            'received', a_(yor, 'rec_deliv'), 'Yordanos', 0);
  /* each cheque against an approval in Selam's list, within three days */
  var pays = [];
  (d.recent || []).concat(d.filed || []).forEach(function (f) {
    if (f.report !== 'betty-daily') return;
    rows_((f.fields || {}).pay_list).forEach(function (r) { if (r && r.to) pays.push({ day: f.day, key: creditName_(r.to), birr: n_(r.amount) }); });
  });
  var unmatched = rows_(get.chq_list).filter(function (r) { return r && r.sup && n_(r.amount) > 0; }).filter(function (r) {
    var k = creditName_(r.sup), b = n_(r.amount);
    return !pays.some(function (p) { return p.key === k && p.birr === b && Math.abs(hrDaysBetween_(p.day, d.day)) <= 3; });
  }).map(function (r) { return { cheque: String(r.no || '').trim(), to: String(r.sup).trim(), birr: n_(r.amount) }; });
  var bad = c.filter(function (x) { return !x.ok; });
  var acts = {};
  bad.forEach(function (x) {
    x.who.split(', ').forEach(function (w) {
      (acts[w] = acts[w] || []).push({ do: 'reconcile: ' + x.check.toLowerCase(), why: x.a_is + ' ' + fmt_(x.a) + ' against ' + x.b_is + ' ' + fmt_(x.b) + ' (' + (x.difference > 0 ? '+' : '') + fmt_(x.difference) + ')' });
    });
  });
  unmatched.forEach(function (u) { (acts.Getachew = acts.Getachew || []).push({ do: 'show the approval for cheque ' + (u.cheque || '(no number)') + ' to ' + u.to, why: fmt_(u.birr) + ' Birr; no matching approval in Selam’s list within three days' }); });
  if (bad.some(function (x) { return Math.abs(x.difference) > GC_KIDAN_ABOVE_; }) || unmatched.length) {
    (acts.Kidan = acts.Kidan || []).push({ do: 'review today’s differences with Selam', why: 'a difference over 50,000 Birr or a cheque with no approval' });
  }
  return {
    the_day_read: dayLabel_(d.day),
    reports: { selam: !!got_(d.filed, 'betty-daily'), ephrata: !!got_(d.filed, 'ephrata-daily'), getachew: !!got_(d.filed, 'getachew-daily'), yordanos: !!got_(d.filed, 'yordanos-daily') },
    checks_made: c.length, differences: bad.length,
    checks: c,
    cheques_against_the_zamzam_transfer: cover,
    cheques_with_no_matching_approval: unmatched,
    today_actions: acts
  };
}

/* ------------------------------------------------------------------ */
function anomalyFacts_(d) {
  rdReset_();
  var from = addDays_(d.day, -55);
  var ad = (rdBy_('amaha', from, d.day)['amaha-daily']) || {};
  var ed = (rdBy_('elyas', addDays_(d.day, -13), d.day)['elyas-daily']) || {};
  var roster = ((d.schedule && d.schedule.people) || []).filter(function (p) { return p.roleEn === 'Production Worker'; });
  var days = Object.keys(ad).sort();
  var who = {};
  var mark = function (name, day, kind, noPerm) {
    var n = hrWho_(name, roster);
    if (!n) return;
    var e = who[n.toLowerCase()] || (who[n.toLowerCase()] = { name: n, absent: [], late: [], no_permission: 0 });
    e[kind].push(day);
    if (noPerm) e.no_permission++;
  };
  days.forEach(function (day) {
    rows_(ad[day].mp_absent_list).forEach(function (r) { if (r && r.name) mark(r.name, day, 'absent', !blank_(r.ok) && !yes_(r.ok)); });
    rows_(ad[day].mp_late_list).forEach(function (r) { if (r && r.name) mark(r.name, day, 'late', false); });
  });
  var four = addDays_(d.day, -27), two = addDays_(d.day, -13);
  var flags = [];
  Object.keys(who).forEach(function (k) {
    var e = who[k];
    var a4 = e.absent.filter(function (x) { return x >= four; });
    var edge = e.absent.filter(function (x) { var w = dow_(x); return w === 1 || w === 6; });
    var l2 = e.late.filter(function (x) { return x >= two; });
    /* absent on each of the last reported days, back from the day read */
    var streak = 0;
    for (var i = days.length - 1; i >= 0 && days[i] <= d.day; i--) { if (e.absent.indexOf(days[i]) >= 0) streak++; else break; }
    var why = [];
    if (edge.length >= 2 && edge.length * 2 >= e.absent.length) why.push('absent beside the Sunday ' + edge.length + ' times in 8 weeks (Mondays and Saturdays: ' + edge.map(function (x) { return dayLabel_(x).split(' ').slice(0, 3).join(' '); }).join(', ') + ')');
    if (a4.length >= 3) why.push('absent ' + a4.length + ' days in 4 weeks' + (e.no_permission ? ', ' + e.no_permission + ' without permission' : ''));
    if (streak >= 3) why.push('absent ' + streak + ' reported days running');
    if (l2.length >= 3) why.push('late ' + l2.length + ' times in 2 weeks');
    if (why.length) flags.push({ worker: e.name, pattern: why });
  });
  /* a day with far more absences than usual */
  var count = function (day) { var x = a_(ad[day], 'mp_absent'); return x !== null ? x : rows_(ad[day].mp_absent_list).length; };
  var prior = days.filter(function (x) { return x >= four && x < d.day; });
  var avg = prior.length ? prior.reduce(function (a, x) { return a + count(x); }, 0) / prior.length : null;
  var today = ad[d.day] ? count(d.day) : null;
  var spike = today !== null && avg !== null && today >= 3 && today >= 2 * avg;
  var siteLate = {};
  Object.keys(ed).forEach(function (day) {
    rows_(ed[day].a_late_who).forEach(function (r) { if (r && r.name) { var k = spLower_(r.name); (siteLate[k] = siteLate[k] || { name: String(r.name).trim(), times: 0 }).times++; } });
  });
  return {
    the_day_read: dayLabel_(d.day),
    days_reported_8_weeks: days.length,
    workers_with_a_pattern: flags,
    absent_the_day_read: today,
    average_absent_a_day_4_weeks: avg === null ? null : Math.round(avg * 10) / 10,
    a_spike: spike,
    assemblers_late_3_times_in_2_weeks: Object.keys(siteLate).map(function (k) { return siteLate[k]; }).filter(function (x) { return x.times >= 3; }),
    names_note: 'names as Amaha and Elyas typed them, matched to the staff list only where certain'
  };
}
