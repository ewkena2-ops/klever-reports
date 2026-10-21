/* Klever — the money on each job (the Chairman, 14 Oct 2026: "on the week
   and the 15-day schedule we have to know how much Getachew is going to buy
   for that job, all of it, and the total contract — so it shows the net on
   that job; we have the m², we pay the installers 780 with the 30%
   included").

   WHICH JOBS. The KK jobs on Mahelet's 15-day plan (its days, and its
   queue) and the KK jobs Amaha reported making in the last seven days. A
   Rovestone job (RBT) is the sister company's order, not a Klever contract,
   and is left out.

   FOR EACH JOB
     contract   the contract value in the contract lists (Ephrata's and the
                salespeople's), or the total Ephrata typed when she was asked
                for it — the latest word stands; the register's figure if
                there is no other.
     materials  what Getachew said, once, all the material for the job will
                cost (mat_plan) — until he says everything is bought, when
                what it all cost (fu_jobs, "Yes — everything is bought")
                takes its place. His request and order rows are not added up:
                on 12–13 Oct his "Amount" held sheets, not Birr, and a
                request and its order were the same purchase twice.
     m²         made so far (Amaha's m² per job row, the last report of
                each day) and still to make (the plan's m² for that job on
                the days from today; a plan day naming one job gives it the
                day's m²) — or all the plan gives the job, when that is more
                (a day planned and not reported made still counts).
     installers m² × 780 Birr (600 Birr/m² with the 30% on it).
     net        contract − materials − installers.

   WHAT IS ASKED. A job with no contract figure is asked of Ephrata, and a
   job with no material figure of Getachew: on their own daily reports,
   six at a time, the jobs still ahead on the plan first (/jobask/{person}, read by the
   form — js/app.js carry.ask). Each is told on their phone of a job newly
   asked.

   WHAT IS WRITTEN. /jobmoney/summary for the Chairman's page, lowest net
   first; /jobask/ephrata and /jobask/getachew. Run after a report that
   bears on it comes in (runIfNew_), and once an hour from the watch. */

var JM_INSTALL_PER_M2_ = 780;      /* Birr: 600 a m² with the 30% (the Chairman, 14 Oct 2026) */
var JM_BACK_DAYS_ = 60;            /* how far back the reports are read */
var JM_MADE_DAYS_ = 7;             /* "this week": jobs made in the last seven days */
var JM_ASK_MAX_ = 6;               /* jobs asked at a time, so a backlog is not one evening's work */
var JM_MIN_BIRR_ = 1000;           /* a job's contract or material under this is a count typed in the
                                      Birr box (his "20" on 12 Oct was sheets), not a figure: asked again */
var JM_ASKS_ = { contract: 'ephrata', material: 'getachew' };
/* jobs never to be asked about again: the owner, 21 Oct 2026, "don't ask
   Getachew about KK164" (he said its buying was done on 19 Oct and gave
   1,757,900 on 20 Oct) */
var JM_NO_ASK_ = { contract: [], material: ['KK-164'] };
var JM_RUN_KEY_ = 'JOBMONEY_LAST_RUN';

/* The job codes an answer names, however typed — the same reading as the
   forms (js/app.js jobCodes): "k.k =165", "kkkk 160", "K.k=165,155",
   "RBT 3375"; in a job-code column a bare number is a KK job. */
function jmCodes_(v, inCol) {
  /* a job numbered 0 is no job (Register.js regZero_, 21 Oct 2026) */
  return jmCodesAll_(v, inCol).filter(function (c) { return !regZero_(c); });
}
function jmCodesAll_(v, inCol) {
  var s = String(v == null ? '' : v), out = [];
  function put(c) { if (c && out.indexOf(c) === -1) out.push(c); }
  var re = /(^|[^a-z0-9])(k(?:\W{0,3}k)+|rbt)\W{0,3}0*(\d{1,5})(?!\d)/gi, m;
  while ((m = re.exec(s))) {
    var pre = /^k/i.test(m[2]) ? 'KK' : 'RBT';
    put(pre + '-' + Number(m[3]));
    if (pre !== 'KK') continue;
    var tail = s.slice(re.lastIndex), run = /^\s*(?:[,;\/&+]|and|እና)\s*0*(\d{2,3})(?!\d)/i, n;
    while ((n = run.exec(tail))) {
      put('KK-' + Number(n[1]));
      tail = tail.slice(n[0].length);
      re.lastIndex = s.length - tail.length;
    }
  }
  if (out.length || !inCol) return out;
  var t = s.toUpperCase().replace(/[–—]/g, '-').replace(/[^A-Z0-9-]/g, '');
  if (/^\d{1,3}$/.test(t)) return ['KK-' + Number(t)];
  var c = /^([A-Z]+)-?0*(\d+(?:-\d+)*)/.exec(t);
  return c ? [c[1] + '-' + c[2]] : [];
}
function jmOne_(v) { var c = jmCodes_(v, true); return c.length === 1 ? c[0] : null; }
function jmMoney_(v) {
  var s = String(v == null ? '' : v).replace(/[^0-9.\-]/g, '');
  var x = s === '' ? NaN : Number(s);
  return isNaN(x) ? null : x;
}
function jmAt_(f) { return f.at && f.at.getTime ? f.at.getTime() : Number(f.at) || 0; }
function jmR2_(x) { return Math.round(x * 100) / 100; }

/* THE ARITHMETIC — pure: the filings ({report, person, at, values}), the
   register's job rows and today. */
function jmBuild_(filings, regRows, today) {
  var list = (filings || []).slice().sort(function (a, b) { return jmAt_(a) - jmAt_(b); });
  /* the last filing of each report on each day: a correction replaces */
  var lastOf = {};
  list.forEach(function (f) { lastOf[f.report + '|' + dayOf_(new Date(jmAt_(f)))] = f; });
  var dayLast = Object.keys(lastOf).map(function (k) { return lastOf[k]; })
    .sort(function (a, b) { return jmAt_(a) - jmAt_(b); });

  /* the plan: the last one filed with a first day */
  var plan = null;
  list.forEach(function (f) {
    if (f.report !== 'liu-plan') return;
    var st = String((f.values || {}).plan_start || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(st)) plan = { start: st, filed: dayOf_(new Date(jmAt_(f))), v: f.values || {} };
  });

  var jobs = {}, order = [];
  function job(code) {
    if (!jobs[code]) {
      jobs[code] = { code: code, first: null, m2Made: 0, m2Left: 0, m2Plan: 0, m2Known: false, made7: false };
      order.push(code);
    }
    return jobs[code];
  }
  function seen(code, day) {
    var j = job(code);
    if (!j.first || day < j.first) j.first = day;
    return j;
  }

  /* once Amaha has reported today, today's m² are in what was made: the
     plan's today is no longer still to make — it was counted twice every
     evening (the bug hunt, 15 Oct 2026) */
  var leftFrom = dayLast.some(function (f) { return f.report === 'amaha-daily' && dayOf_(new Date(jmAt_(f))) === today; })
    ? addDays_(today, 1) : today;
  if (plan) {
    var week = rows_(plan.v.plan_week), days = rows_(plan.v.plan_days);
    for (var k = 1; k <= 15; k++) {
      var d = hrWorkday_(plan.start, k), wk = week[k - 1] || {}, named = false;
      [['k1', 'm1'], ['k2', 'n2'], ['k3', 'n3']].forEach(function (p) {
        var cs = jmCodes_(wk[p[0]], true);
        if (!cs.length) return;
        named = true;
        var m2 = jmMoney_(wk[p[1]]);
        cs.forEach(function (c) {
          var j = seen(c, d);
          if (cs.length === 1 && m2 !== null && m2 > 0 && m2 <= PM_PLAN_MAX_) {
            j.m2Plan += m2; j.m2Known = true;
            if (d >= leftFrom) j.m2Left += m2;
          }
        });
      });
      if (named) continue;
      /* a plan filed before it asked job by job: the day's jobs, and its
         m² only when it names one job */
      var row = days[k - 1] || {}, cs2 = jmCodes_(row.jobs, false), dm2 = jmMoney_(row.m2);
      cs2.forEach(function (c) {
        var j = seen(c, d);
        if (cs2.length === 1 && dm2 !== null && dm2 > 0 && dm2 <= PM_PLAN_MAX_) {
          j.m2Plan += dm2; j.m2Known = true;
          if (d >= leftFrom) j.m2Left += dm2;
        }
      });
    }
    rows_(plan.v.plan_queue).forEach(function (q) {
      jmCodes_(q && q.code, false).concat(jmCodes_(q && q.code, true)).forEach(function (c) { seen(c, plan.start); });
    });
  }

  /* made: Amaha's m² per job row, the last report of each day */
  var made = {};
  dayLast.forEach(function (f) {
    if (f.report !== 'amaha-daily') return;
    var day = dayOf_(new Date(jmAt_(f)));
    rows_((f.values || {}).p_jobs).forEach(function (r) {
      var c = jmOne_(r && r.code), m2 = jmMoney_(r && r.done);
      if (!c || m2 === null) return;
      (made[c] = made[c] || { m2: 0, last: day }).m2 += m2;
      if (day > made[c].last) made[c].last = day;
    });
  });
  Object.keys(made).forEach(function (c) {
    if (made[c].last < addDays_(today, -JM_MADE_DAYS_) && !jobs[c]) return;
    var j = seen(c, made[c].last);
    j.m2Made = made[c].m2; j.m2Known = true;
    if (made[c].last >= addDays_(today, -JM_MADE_DAYS_)) j.made7 = true;
  });

  /* the figures, the latest word standing */
  var contract = {}, cust = {}, matPlan = {}, matAct = {}, matDone = {};
  (regRows || []).forEach(function (r) {
    var c = jmOne_(r && (r.job || r.code));
    if (!c) return;
    if (r.cust) cust[c] = String(r.cust).trim();
    var v = jmMoney_(r.value);
    if (v !== null && v >= JM_MIN_BIRR_) contract[c] = { v: v, from: 'register', at: 0 };
  });
  var CONTRACT_LISTS_ = { 'ephrata-daily': 'contracts_list', 'ephrata-weekly': 'w_contracts_list' };
  list.forEach(function (f) {
    var v = f.values || {}, at = jmAt_(f), lists = [];
    if (CONTRACT_LISTS_[f.report]) lists.push(CONTRACT_LISTS_[f.report]);
    if (/-sales-daily$/.test(f.report)) lists.push('c_list');
    if (/-sales-weekly$/.test(f.report)) lists.push('s_contracts_list');
    lists.forEach(function (fid) {
      rows_(v[fid]).forEach(function (r) {
        var c = jmOne_(r && r.code), x = jmMoney_(r && r.value);
        if (!c) return;
        if (r.cust && String(r.cust).trim()) cust[c] = String(r.cust).trim();
        if (x !== null && x >= JM_MIN_BIRR_) contract[c] = { v: x, from: 'contract', at: at };
      });
    });
    if (f.report === 'ephrata-daily') {
      rows_(v.ct_jobs).forEach(function (r) {
        var c = jmOne_(r && r.code), x = jmMoney_(r && r.value);
        if (c && x !== null && x >= JM_MIN_BIRR_) contract[c] = { v: x, from: 'ephrata', at: at };
      });
    }
    if (f.report === 'getachew-daily') {
      rows_(v.mat_plan).forEach(function (r) {
        var c = jmOne_(r && r.code), x = jmMoney_(r && r.amount);
        if (c && x !== null && x >= JM_MIN_BIRR_) matPlan[c] = x;
      });
      rows_(v.fu_jobs).forEach(function (r) {
        var c = jmOne_(r && r.code);
        if (!c || !r.buy) return;
        matDone[c] = r.buy === 'done';
        var x = jmMoney_(r.cost);
        if (r.buy === 'done' && x !== null && x >= JM_MIN_BIRR_) matAct[c] = x;
      });
    }
  });

  var rows = order.filter(function (c) { return /^KK-/.test(c); }).map(function (c) {
    var j = jobs[c], ct = contract[c] || null;
    var mat = matAct[c] != null ? matAct[c] : (matPlan[c] != null ? matPlan[c] : null);
    var m2 = j.m2Known ? jmR2_(Math.max(j.m2Made + j.m2Left, j.m2Plan)) : null;
    var inst = m2 !== null ? Math.round(m2 * JM_INSTALL_PER_M2_) : null;
    var net = ct && mat !== null && inst !== null ? Math.round(ct.v - mat - inst) : null;
    var wait = [];
    if (!ct) wait.push('contract');
    if (mat === null) wait.push('material');
    if (m2 === null) wait.push('m2');
    return {
      code: c, cust: cust[c] || '', first: j.first || '', madeThisWeek: j.made7,
      contract: ct ? ct.v : null, contractFrom: ct ? ct.from : '',
      matPlan: matPlan[c] != null ? matPlan[c] : null, matBought: matAct[c] != null ? matAct[c] : null,
      matAllBought: !!matDone[c], material: mat, materialFrom: matAct[c] != null ? 'bought' : (matPlan[c] != null ? 'plan' : ''),
      m2Made: jmR2_(j.m2Made), m2Left: jmR2_(j.m2Left), m2Plan: jmR2_(j.m2Plan), m2: m2, installers: inst,
      net: net, netPct: net !== null && ct.v ? Math.round(net / ct.v * 1000) / 10 : null, waitFor: wait
    };
  });
  /* lowest net first; the jobs still waiting for a figure after them */
  rows.sort(function (a, b) {
    if ((a.net === null) !== (b.net === null)) return a.net === null ? 1 : -1;
    if (a.net !== null) return a.net - b.net;
    return a.first < b.first ? -1 : a.first > b.first ? 1 : 0;
  });

  /* what to ask: the jobs still ahead on the plan first, soonest first —
     the buying to plan — then those already under way or made, the latest
     first */
  function rank(r) { return r.first >= today ? '0' + r.first : '1' + (99999999 - Number(String(r.first).replace(/-/g, '') || 0)); }
  var soon = rows.slice().sort(function (a, b) { var x = rank(a), y = rank(b); return x < y ? -1 : x > y ? 1 : 0; });
  var asks = {
    contract: soon.filter(function (r) { return r.contract === null && JM_NO_ASK_.contract.indexOf(r.code) === -1; }).slice(0, JM_ASK_MAX_)
      .map(function (r) { return { code: r.code, cust: r.cust, first: r.first }; }),
    material: soon.filter(function (r) { return r.material === null && JM_NO_ASK_.material.indexOf(r.code) === -1; }).slice(0, JM_ASK_MAX_)
      .map(function (r) { return { code: r.code, cust: r.cust, first: r.first, m2: r.m2 }; })
  };
  return { plan: plan ? { start: plan.start, filed: plan.filed } : null, rows: rows, asks: asks };
}

/* ---------------- reading and writing ---------------- */

function jobMoneyRun_() {
  var today = todayAddis_();
  var filings = fsQuery_('reports', [['at', 'GREATER_THAN_OR_EQUAL', dayStart_(addDays_(today, -JM_BACK_DAYS_))]], 'at');
  var reg = [];
  try { var rd = fsGet_('register/jobs'); reg = (rd && rd.rows) || []; } catch (e) { reg = []; }
  var b = jmBuild_(filings, reg, today);
  fsPut_('jobmoney/summary', { at: new Date(), day: today, rate: JM_INSTALL_PER_M2_, plan: b.plan, rows: b.rows });
  Object.keys(JM_ASKS_).forEach(function (kind) {
    var who = JM_ASKS_[kind], items = b.asks[kind], prev = null;
    try { prev = fsGet_('jobask/' + who); } catch (e) { prev = null; }
    var told = (prev && prev.notified) || [];
    var fresh = items.filter(function (it) { return told.indexOf(it.code) === -1; });
    fsPut_('jobask/' + who, { to: who, kind: kind, items: items, at: new Date(),
                              notified: told.concat(fresh.map(function (it) { return it.code; })).slice(-200) });
    if (!fresh.length) return;
    var codes = fresh.map(function (it) { return it.code; }).join(', ');
    try {
      if (kind === 'contract') {
        pushTo_(who, 'Contract totals needed — ' + codes,
                'Jobs on the plan with no contract total. Your next daily report asks for each. · ' +
                'በዕቅዱ ላይ ያሉ ሥራዎች የውል ዋጋ ይጠየቃል — በዕለታዊ ሪፖርትዎ ይሙሉ።', 'jobask-contract', '');
      } else {
        pushTo_(who, 'Material cost needed — ' + codes,
                'Jobs on the plan: how much will all their material cost? Your next daily report asks for each. · ' +
                'በዕቅዱ ላይ ላሉ ሥራዎች የዕቃው ጠቅላላ ዋጋ ይጠየቃል — በዕለታዊ ሪፖርትዎ ይሙሉ።', 'jobask-material', '');
      }
    } catch (e) { Logger.log('jobask push: %s', e.message); }
  });
  PropertiesService.getScriptProperties().setProperty(JM_RUN_KEY_, String(Date.now()));
  return b;
}

/* From runIfNew_: a report that bears on a job's money */
function jobMoneyAfter_(fresh) {
  var hit = (fresh || []).some(function (f) {
    var r = String(f.report || '');
    return /^(liu-plan|getachew-daily|ephrata-daily|ephrata-weekly|amaha-daily)$/.test(r) || /-sales-(daily|weekly)$/.test(r);
  });
  if (hit) jobMoneyRun_();
}

/* From the watch: once an hour, so a new day moves the plan on */
/* Once a day, so a new day moves the plan on; a report it reads runs it as
   it comes in. It read 60 days of every report each hour, for nothing new
   most hours (the bug hunt, 15 Oct 2026: Firestore's daily reads). */
function jobMoneyWatch_() {
  var last = Number(PropertiesService.getScriptProperties().getProperty(JM_RUN_KEY_) || 0);
  if (last && Utilities.formatDate(new Date(last), tz_(), 'yyyy-MM-dd') === todayAddis_()) return;
  jobMoneyRun_();
}

/* By hand from the editor: what the Chairman's page would show now */
function previewJobMoney() {
  var b = jobMoneyRun_();
  Logger.log(JSON.stringify(b, null, 1));
}
