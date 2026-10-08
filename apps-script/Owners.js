/* Klever — each agent's reading to its owner, and the alerts that cannot
   wait for the morning.

   WHO OWNS WHAT (the Chairman, 8 Oct 2026: "owners too"). His table named an
   owner position for each agent; these are the Klever people who hold them:
   Accountant → Selam (betty), CFO → Kidan for the group and Selam for
   Klever, COO and Operations Lead → Mahelet (liu), Production Supervisor →
   Amaha, Commercial Lead → Ephrata, Site Supervisor → Elyas, Purchasing
   Officer → Getachew, Storekeeper → Yordanos, QC Officer → Wude. The
   positions nobody holds (HR Manager, Legal Counsel, Risk Officer, HSE
   Manager, Project Director, Internal Auditor) keep their readings with the
   Chairman alone — and so do the audit, risk and legal readings, which are
   about the staff themselves. He always gets everything, as before.

   READINGS go to /readings/{person}_{kind}_{agent} — the latest of each,
   written over — which the person's home page shows (js/app.js) and only
   they and the Chairman can read; one phone notification a run says which
   readings are new.

   ALERTS are instructions written by the script (by: 'alert'): they sit on
   the person's home page with the Chairman's and the reminders, reach the
   phone, and stay until the person closes them with what was done. Each is
   written once — its id comes from the report and its day, or for a
   complaint from its words — so a report filed twice never alerts twice,
   and a complaint a designer carries day after day alerts once.            */

var OWNERS_ = {
  /* the morning agents (Agents.js) */
  finance: ['betty', 'kidan'], groupcfo: ['kidan', 'betty'], production: ['amaha'],
  plantmanager: ['liu', 'amaha'], commercial: ['ephrata'], salesdirector: ['ephrata'],
  site: ['elyas'], quality: ['wude'], store: ['yordanos', 'liu'], purchasing: ['getachew'],
  customer: ['ephrata', 'betty'], gate: ['ephrata', 'betty'], reconcile: ['betty', 'kidan'],
  /* the Logistics Officer: Alex, who has no account — his messages reach Mahelet */
  route: ['liu', 'elyas'],
  /* the Sunday readers (Cfo.js, Ops.js, Readers.js and after) */
  cfo: ['kidan', 'betty'], ops: ['elyas', 'liu'], forecast: ['kidan', 'liu'],
  procurement: ['getachew', 'kidan'], customers: ['ephrata'], maintenance: ['liu'],
  budget: ['kidan'], chronic: ['liu'], vendors: ['getachew', 'kidan']
  /* no owner, so the Chairman's alone: attendance, anomaly, hr, workforce,
     legal, compliance, audit, risk, hse, projects, brief, decide */
};
/* the Sunday quality reader has the same id as the morning one; its owner */
var OWNERS_WEEK_ = { quality: ['wude'] };

function ownersOf_(id, kind) {
  if (kind === 'week' && OWNERS_WEEK_[id]) return OWNERS_WEEK_[id];
  return OWNERS_[id] || [];
}

/* items: [{id, en, am, text}] from one run. Writes each owner's copy and
   sends each owner one notification. Returns how many were written. */
function deliverReadings_(items, day, kind) {
  var per = {}, n = 0;
  (items || []).forEach(function (it) {
    if (!it || !it.text || /^\((No model key|The written reading did not come)/.test(it.text)) return;
    ownersOf_(it.id, kind).forEach(function (to) {
      try {
        fsPut_('readings/' + to + '_' + kind + '_' + it.id, {
          to: to, agent: it.id, kind: kind, en: it.en, am: it.am || '',
          text: String(it.text).substring(0, 4000), day: day, at: new Date()
        });
        (per[to] = per[to] || []).push(it.en);
        n++;
      } catch (e) { Logger.log('reading %s to %s: %s', it.id, to, e.message); }
    });
  });
  Object.keys(per).forEach(function (to) {
    try {
      pushTo_(to, kind === 'week' ? 'Your weekly AI reading' : 'Your morning AI reading',
              per[to].join(' · '), 'readings', '');
    } catch (e) { Logger.log('reading push %s: %s', to, e.message); }
  });
  return n;
}

/* One alert, once ever. */
function alertOnce_(id, to, text, day) {
  var safe = String(id).replace(/[^A-Za-z0-9_-]/g, '-').substring(0, 120);
  try { if (fsGet_('instructions/' + safe)) return false; } catch (e) { return false; }
  fsPut_('instructions/' + safe, { to: to, text: String(text).substring(0, 1000), due: day,
                                   by: 'alert', status: 'open', at: new Date() });
  try { notifyInstruction_(safe); } catch (e) { Logger.log('alert push %s: %s', safe, e.message); }
  return true;
}
function alertMany_(id, tos, text, day) {
  var sent = 0;
  tos.filter(function (t, i) { return t && tos.indexOf(t) === i; }).forEach(function (to) {
    if (alertOnce_(id + '-' + to, to, text, day)) sent++;
  });
  return sent;
}

/* a name or department as written, to the person who answers for it */
var ROUTE_WORDS_ = [
  [/factory|production|workshop|cutting|edge|assembl(y|ing) in|^amaha|^mahelet|^liu/i, 'liu'],
  [/site|install|assembler|fitting|^elyas/i, 'elyas'],
  [/finance|payment|money|refund|invoice|^selam|^betty/i, 'betty'],
  [/purchas|supplier|material|^getachew/i, 'getachew'],
  [/quality|qc|defect|^wude/i, 'wude'],
  [/design|measure|drawing|sales|quote|price|^ephrata/i, 'ephrata']
];
function routeTo_(words) {
  var w = String(words || '').trim();
  for (var i = 0; i < ROUTE_WORDS_.length; i++) if (ROUTE_WORDS_[i][0].test(w)) return ROUTE_WORDS_[i][1];
  return 'ephrata';
}

/* ------------------------------------------------------------------ *
 *  The alerts that cannot wait: on each report as it arrives          *
 * ------------------------------------------------------------------ */
function realtimeAlerts_(fresh, schedule) {
  var sent = 0;
  var names = {};
  ((schedule && schedule.people) || []).forEach(function (p) { names[p.id] = p.en; });
  (fresh || []).forEach(function (f) {
    var v = f.values || {}, rep = String(f.report || ''), who = f.person, day = f.at ? dayOf_(f.at) : todayAddis_();
    /* the report and its day, not the filing: a report sent again is the same report */
    var base = 'al-' + rep + '-' + day;
    var from = names[who] || who;
    try {
      /* 22 · Sales coordinator: leads not called within 24 hours, leads waiting
         for a visit, quotes below the margin floor */
      if (/-sales-daily$/.test(rep) || rep === 'ephrata-daily') {
        var lead = rep === 'ephrata-daily';
        var p = pair_(v, lead ? 'resp_1hr' : 'r_1hr');
        if (p && p.done !== null && p.of !== null && p.of > p.done) {
          sent += alertMany_(base + '-r1', [who, 'ephrata'], (p.of - p.done) + ' of ' + p.of + ' new leads in ' + from +
                             '’s report of ' + dayLabel_(day) + ' were not called within 24 hours. Call them now, and say here when each was called.', day);
        }
        var late = a_(v, lead ? 'visits_late' : 'v_late');
        if (late > 0) {
          sent += alertMany_(base + '-v48', [who, 'ephrata'], late + ' lead' + (late === 1 ? ' has' : 's have') + ' waited over 48 hours for a pre-measurement visit (' +
                             from + ', ' + dayLabel_(day) + '). Book each visit today and close this with the dates.', day);
        }
        var low = rows_(v.q_list).filter(function (r) { return r && !blank_(r.margin) && n_(r.margin) < SD_MARGIN_FLOOR_; });
        if (low.length) {
          sent += alertMany_(base + '-mg', ['ephrata'], 'Quoted below the 6,000 Birr/m² margin floor by ' + from + ' on ' + dayLabel_(day) + ': ' +
                             low.map(function (r) { return String(r.cust || '?').trim() + ' at ' + fmt_(n_(r.margin)); }).join('; ') +
                             '. Approve each in writing or have it corrected.', day);
        }
      }
      /* 23 · Store receipt: a delivery rejected, production stopped, a material about to run out */
      if (rep === 'yordanos-daily') {
        var rej = rows_(v.rec_list).filter(function (r) { return r && ay_(r, 'ok') === false; });
        if (rej.length) {
          sent += alertMany_(base + '-rej', ['getachew', 'liu'], 'Rejected at the store on ' + dayLabel_(day) + ': ' +
                             rej.map(function (r) { return String(r.item || 'an item').trim() + (r.sup ? ' from ' + String(r.sup).trim() : '') + (r.code ? ' (' + opsCode_(r.code) + ')' : ''); }).join('; ') +
                             '. Arrange the replacement and close this with the new delivery date.', day);
        }
        if (ay_(v, 'sh_stopped') === true) {
          sent += alertMany_(base + '-stop', ['liu', 'getachew'], 'Production stopped on ' + dayLabel_(day) + ' because something ran out (Yordanos). Say what, and when it arrives.', day);
        }
        var labels = pmGridLabels_(schedule, 'yordanos-daily', 'k_stock');
        var out = rows_(v.k_stock).map(function (r, i) { return { m: labels[i] || ('row ' + (i + 1)), d: a_(r, 'days') }; })
          .filter(function (x) { return x.d !== null && x.d <= 3; });
        if (out.length) {
          sent += alertMany_(base + '-low', ['getachew'], 'About to run out in the store (' + dayLabel_(day) + '): ' +
                             out.map(function (x) { return x.m + ' — ' + x.d + ' days left'; }).join('; ') + '. Order now and close this with the delivery date.', day);
        }
      }
      /* 26 · Complaint router: each new complaint to whoever answers for it,
         and to Ephrata and Selam, who look after customers */
      var complaint = function (key, text, routeWords) {
        var to = routeTo_(routeWords);
        /* by its words: the same complaint in tomorrow's report is not a new one */
        var id = 'al-cp-' + ownHash_(who + '|' + String(text).toLowerCase().replace(/\s+/g, ' ').trim());
        sent += alertMany_(id, [to, 'ephrata', 'betty'].filter(function (x) { return x !== who; }),
                           'Customer complaint (' + from + ', ' + dayLabel_(day) + '): ' + text + ' Deal with it and close this with what was done.', day);
      };
      if (rep === 'betty-pulse') {
        rows_(v.pl_list).forEach(function (r, i) {
          if (!r || r.state === 'closed' || !(r.cust || r.issue)) return;
          complaint(i, String(r.cust || '').trim() + (r.job ? ' (' + opsCode_(r.job) + ')' : '') + ' — ' + String(r.issue || 'not described').trim() +
                    (r.to ? '; passed to ' + String(r.to).trim() : '') + '.', (r.to || '') + ' ' + (r.issue || ''));
        });
      }
      if (rep === 'elyas-daily' && a_(v, 'ac_complaints') > 0) complaint('s', String(v.ac_complaints_what || a_(v, 'ac_complaints') + ' complaint(s) at the site').trim() + '.', 'site');
      if (rep === 'liu-daily' && a_(v, 'complaints') > 0) complaint('o', String(v.complaints_what || a_(v, 'complaints') + ' complaint(s) about operations').trim() + '.', String(v.complaints_what || 'production'));
      if (/-design-daily$/.test(rep)) {
        rows_(v.cp_list).forEach(function (r, i) {
          if (r && (r.cust || r.what)) complaint('d' + i, String(r.cust || '').trim() + ' — ' + String(r.what || 'not described').trim() + '.', 'design');
        });
      }
      if (/-sales-daily$/.test(rep) && a_(v, 'w_comp') > 0) complaint('w', String(v.w_comp_what || a_(v, 'w_comp') + ' complaint(s) about communication').trim() + '.', 'sales');
    } catch (e) {
      Logger.log('alerts for %s: %s', f._id || rep, e.message);
    }
  });
  return sent;
}

/* ------------------------------------------------------------------ *
 *  27 · Permit & licence: every morning, before each falls due        *
 * ------------------------------------------------------------------ */
/* one alert at 14 days, at 7, at 1, and once overdue */
function ownHash_(s) {
  var h = 0;
  for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
function permitAlerts_(today, schedule) {
  var rows = sheetRows_(REG_TAB_, 8);
  if (!rows || !rows.length) return 0;
  var people = ((schedule && schedule.people) || []).filter(function (p) { return !p.company || p.id === 'kidan'; });
  var whoIs = function (name) {
    var w = spLower_(name);
    if (!w) return null;
    var hit = people.filter(function (p) { return p.en.toLowerCase() === w || p.en.toLowerCase().split(' ')[0] === w.split(' ')[0]; });
    return hit.length === 1 ? hit[0].id : null;
  };
  var sent = 0;
  rows.forEach(function (r) {
    var item = String(r[0] || '').trim(), due = legalDay_(r[3]), status = spLower_(r[4]);
    if (!item || !due || /^(done|closed|renewed|paid|filed|passed)/.test(status)) return;
    var left = hrDaysBetween_(today, due);
    var bucket = left < 0 ? 'overdue' : left <= 1 ? '1day' : left <= 7 ? '7days' : left <= 14 ? '14days' : null;
    if (!bucket) return;
    var to = whoIs(r[5]);
    if (!to) return;
    var key = 'lic-' + ownHash_(item + '|' + due) + '-' + bucket;
    var text = (left < 0 ? 'Overdue by ' + (-left) + ' days: ' : 'Due in ' + left + ' day' + (left === 1 ? '' : 's') + ': ') + item +
               ' (' + String(r[1] || '').trim() + (r[2] ? ', ' + String(r[2]).trim() : '') + '), due ' + dayLabel_(due) +
               '. Renew or file it, mark it done in the Legal & Compliance Register, and close this.';
    if (alertOnce_(key + '-' + to, to, text, today)) sent++;
  });
  return sent;
}
