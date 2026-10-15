/* SAID → DONE (the Chairman, 11 Oct 2026: "Amaha says 'tomorrow I will do
   this for this KK' — so how is it going?").

   Every evening people write what they will do tomorrow — "What comes first
   tomorrow?" (p1, p2, p3), Getachew's and Alemaya's "tomorrow", Elyas's plan
   for tomorrow's sites — and Mahelet's 15-day plan names the jobs the
   factory makes each day. Nothing used to look back. This does: a promise
   made on one working day is due the next, and that day's reports either
   show the job worked on or they do not.

   Pure functions over filings ({person, report, at: Date|ms, values}) and
   the forms (REPORTS), so the Chairman's page draws it and a test in Node can
   run it on real reports. Nothing here reads or writes the database.       */
(function (root) {
  'use strict';

  /* the answers that are a promise for the next working day */
  var PROMISE = { p1: 1, p2: 1, p3: 1, tomorrow: 1, t_rows: 1, n_sites: 1, pl_tomorrow: 1 };
  /* answers about later than tomorrow, or about the past week: neither a
     promise for tomorrow nor proof of work today */
  var LATER = /^(n_|next|outstanding|w_open|plan_|proj_|cf7_|fc_)/;
  /* her job is the whole factory: anyone's report can show her promise kept */
  var WHOLE = { liu: 1 };

  /* KK codes in an answer, however typed: KK-180, kk180, K.K=165, "kk 155";
     a bare three-digit number counts only in a job-code column */
  function codesIn(v, isCodeCol, isList) {
    var s = String(v == null ? '' : v), out = [], m, re = /[kK]\W{0,3}[kK]\W{0,3}0*(\d{2,3})(?!\d)/g;
    while ((m = re.exec(s))) out.push(Number(m[1]));
    /* a promise list names the first job and runs on: "K.k=165,155," —
       only numbers that run on from a code through , ; / & + or "and";
       any free-standing number used to count, so "20 sheets", "10 am" and
       "250,000 Birr" became jobs KK-020, KK-010, KK-250, KK-000 (the bug
       hunt, 15 Oct 2026) */
    if (out.length && isList) {
      var re2 = /[kK]\W{0,3}[kK]\W{0,3}0*(\d{2,3})(?!\d)/g, run = /^\s*(?:[,;\/&+]|and|እና)\s*0*(\d{2,3})(?!\d)(?!,\d{3}(?!\d))/i, mt;
      while ((mt = re2.exec(s))) {
        var tail = s.slice(re2.lastIndex), r;
        while ((r = run.exec(tail))) {
          var n = Number(r[1]);
          if (n > 0 && out.indexOf(n) < 0) out.push(n);
          tail = tail.slice(r[0].length);
        }
      }
    }
    /* a bare number counts only in a job column, and only as two or three
       digits: "0332" is a lead number, not a job */
    if (!out.length && isCodeCol) {
      var b = /^\s*(\d{2,3})\s*$/.exec(s);
      if (b) out.push(Number(b[1]));
    }
    return out;
  }
  function kk(n) { return 'KK-' + (n < 100 ? ('00' + n).slice(-3) : n); }

  var CODE_COLS = /^(code|job|rcode|kk|jobs)$/;
  /* every KK code in one filing, split into the promised and the worked-on,
     each with the question it was found under */
  function scan(f, reportsById) {
    var rep = reportsById[f.report], v = f.values || {}, promised = {}, worked = {};
    /* a list the form fills itself with earlier jobs (carry, 14 Oct 2026)
       is in every filing whatever the answer: it proves nothing was done
       (the bug hunt, 15 Oct 2026 — Getachew's and Wude's promises were always
       "kept") */
    var carried = {};
    if (rep) rep.sections.forEach(function (s) { s.fields.forEach(function (x) { if (x.carry) carried[x.id] = true; }); });
    function label(id) {
      var q = null;
      if (rep) rep.sections.forEach(function (s) { s.fields.forEach(function (x) { if (x.id === id) q = x; }); });
      return q ? { en: q.en, am: q.am } : { en: id, am: id };
    }
    Object.keys(v).forEach(function (id) {
      if (carried[id]) return;
      var val = v[id], into = PROMISE[id] ? promised : (LATER.test(id) ? null : worked);
      if (!into) return;
      var found = [];
      if (Array.isArray(val)) {
        val.forEach(function (row) {
          if (!row || typeof row !== 'object') return;
          Object.keys(row).forEach(function (c) { found = found.concat(codesIn(row[c], CODE_COLS.test(c))); });
        });
      } else {
        found = codesIn(val, id === 'p1' || id === 'p2' || id === 'p3', !!PROMISE[id]);
      }
      found.forEach(function (n) {
        (into[n] = into[n] || []).push({ person: f.person, report: f.report, field: id, label: label(id) });
      });
    });
    return { promised: promised, worked: worked };
  }

  function ymdAddis(at) {
    var t = (at instanceof Date ? at.getTime() : Number(at)) + 3 * 3600e3;
    return new Date(t).toISOString().slice(0, 10);
  }
  function addDays(day, n) {
    var d = new Date(day + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  /* the next working day: Sundays are off */
  /* a day nobody works (js/forms.js closedDay: Sundays and holidays);
     Sundays alone where that file is not loaded */
  function shut(day) {
    if (typeof closedDay === 'function') return closedDay(day);
    return new Date(day + 'T12:00:00Z').getUTCDay() === 0;
  }
  function nextWorkDay(day) {
    var n = addDays(day, 1);
    for (var g = 0; g < 14 && shut(n); g++) n = addDays(n, 1);     /* Sundays and holidays are off */
    return n;
  }

  /* Promises made on each day, checked on the next working day.
     → [{day (the day it was due), person, made (the day it was said), code,
         said: [where], state: 'done'|'again'|'none'|'nofile'|'due', done: [where]}] */
  function promises(filings, REPORTS, today) {
    var byId = {};
    REPORTS.forEach(function (r) { byId[r.id] = r; });
    /* the last filing of a report on a day is the one that stands */
    var last = {};
    filings.forEach(function (f) {
      var r = byId[f.report];
      if (!r || r.cadence !== 'daily') return;
      var day = ymdAddis(f.at), k = f.report + '|' + day;
      if (!last[k] || f.at > last[k].at) last[k] = { f: f, day: day };
    });
    var perDay = {};          // day -> person -> {promised, worked}
    Object.keys(last).forEach(function (k) {
      var x = last[k], s = scan(x.f, byId);
      var d = perDay[x.day] = perDay[x.day] || {};
      var p = d[x.f.person] = d[x.f.person] || { promised: {}, worked: {} };
      ['promised', 'worked'].forEach(function (w) {
        Object.keys(s[w]).forEach(function (n) { p[w][n] = (p[w][n] || []).concat(s[w][n]); });
      });
    });
    var out = [];
    Object.keys(perDay).sort().forEach(function (made) {
      var due = nextWorkDay(made);
      Object.keys(perDay[made]).forEach(function (person) {
        var p = perDay[made][person];
        Object.keys(p.promised).forEach(function (n) {
          var then = perDay[due] || {}, mine = then[person], done = [];
          Object.keys(then).forEach(function (who) {
            if (who !== person && !WHOLE[person]) return;
            (then[who].worked[n] || []).forEach(function (w) { done.push(w); });
          });
          var state = done.length ? 'done'
            : (due >= today ? 'due'
            : (!mine ? 'nofile'
            : (mine.promised[n] ? 'again' : 'none')));
          out.push({ day: due, made: made, person: person, code: Number(n), said: p.promised[n], state: state, done: done });
        });
      });
    });
    return out;
  }

  /* Mahelet's 15-day plan against what the factory reported making.
     → [{day, planned: [codes], m2: planned m², rows: [{code, state:'made'|'not'|'nofile'|'due', m2}], extra: [{code, m2}]}] */
  function planCheck(filings, today) {
    /* every plan of the window, oldest first: a newer one takes the days it
       covers, the older ones keep theirs — only the newest was read, so
       filing next week's plan wiped Saturday's check (the bug hunt, 15 Oct
       2026) */
    var plans = filings.filter(function (f) { return f.report === 'liu-plan' && f.values && f.values.plan_start; })
      .sort(function (a, b) { return a.at - b.at; });
    if (!plans.length) return [];
    var made = {};
    filings.forEach(function (f) {
      if (f.report !== 'amaha-daily') return;
      var day = ymdAddis(f.at);
      if (made[day] && made[day].at > f.at) return;
      var jobs = {};
      (Array.isArray(f.values && f.values.p_jobs) ? f.values.p_jobs : []).forEach(function (r) {
        codesIn(r && r.code, true).forEach(function (n) {
          var m = Number(String((r && r.done) || '').replace(/[^0-9.]/g, ''));
          jobs[n] = (jobs[n] || 0) + (isNaN(m) ? 0 : m);
        });
      });
      made[day] = { at: f.at, jobs: jobs };
    });
    var byDay = {};
    plans.forEach(function (plan) {
    var day = plan.values.plan_start;
    for (var g0 = 0; g0 < 14 && shut(day); g0++) day = addDays(day, 1);
    /* since 11 Oct the plan is written job by job (plan_week: k1/m1, k2/n2,
       k3/n3 a day); a plan filed before that has only the day's job list */
    var week = Array.isArray(plan.values.plan_week) ? plan.values.plan_week : null;
    (Array.isArray(plan.values.plan_days) ? plan.values.plan_days : []).forEach(function (row, i) {
      var d = day;
      day = nextWorkDay(day);
      var want = [];
      var wk = week && week[i];
      if (wk && (wk.k1 || wk.k2 || wk.k3)) {
        [['k1', 'm1'], ['k2', 'n2'], ['k3', 'n3']].forEach(function (p) {
          var m2 = Number(String(wk[p[1]] == null ? '' : wk[p[1]]).replace(/[^0-9.]/g, ''));
          codesIn(wk[p[0]], true).forEach(function (n) { want.push({ code: n, plan: wk[p[1]] != null && String(wk[p[1]]).trim() !== '' && !isNaN(m2) ? m2 : null }); });
        });
      } else {
        codesIn(row && row.jobs, true).forEach(function (n) { want.push({ code: n, plan: null }); });
      }
      if (!want.length) return;
      var codes = want.map(function (w) { return w.code; });
      var m = made[d], rows = want.map(function (w) {
        var n = w.code;
        if (d >= today) return { code: n, plan: w.plan, state: 'due' };
        if (!m) return { code: n, plan: w.plan, state: 'nofile' };
        if (m.jobs[n] == null) return { code: n, plan: w.plan, state: 'not' };
        var got = Math.round(m.jobs[n] * 10) / 10;
        /* listed with 0 m², or less than planned, is not "made" (bug hunt, 15 Oct 2026) */
        return { code: n, plan: w.plan, state: got === 0 || (w.plan != null && got < w.plan) ? 'short' : 'made', m2: got };
      });
      var extra = [];
      if (m) Object.keys(m.jobs).forEach(function (n) {
        if (codes.indexOf(Number(n)) < 0) extra.push({ code: Number(n), m2: Math.round(m.jobs[n] * 10) / 10 });
      });
      byDay[d] = { day: d, planned: codes, m2: row && row.m2 ? String(row.m2) : '', rows: rows, extra: extra };
    });
    });
    return Object.keys(byDay).sort().map(function (d) { return byDay[d]; });
  }

  var api = { promises: promises, planCheck: planCheck, codesIn: codesIn, kk: kk, nextWorkDay: nextWorkDay };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KleverPromises = api;
})(this);
