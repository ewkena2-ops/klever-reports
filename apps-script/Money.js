/* Klever — Ephrata's collections against the salespeople's.

   The Chairman, 13 Oct 2026: "if this happens, ask Ephrata right away to
   fix it ... she types the amount for that day". On Monday 12 Oct her daily
   report listed 1,144,471 Birr collected and the two salespeople's listed
   1,699,022: Mr Eyob's advance (KK212, 533,551) was not in hers, and she had
   Yabibal (KK165) at 513,149 where Tsega had 534,149.

   WHAT HAPPENS
   · As a report comes in (runIfNew_), the day's payments are compared, one
     by one: Ephrata's collected_list against each salesperson's k_list, by
     customer code and then by amount. Three kinds of difference:
       missing — a salesperson lists it, Ephrata does not
       amount  — both list it, at different amounts
       extra   — only Ephrata lists it (asked only once every salesperson
                 owed that day has reported: before that it may simply be
                 a payment whose salesperson has not sent yet)
   · Any that she has not answered are written to /moneyfix/{day} (status
     open) and her phone is told. Her home page shows them; she types what
     was really collected for each and sends it — /fixes/{id}, filed as her,
     at the server's time, never changed after.
   · Her fix carries the day's list as she now says it stands. Every reader
     of her reports gets that list in place of the one first filed
     (moneyPatch_, from fsQuery_), so the charts, the agents, the weekly
     summary and Selam's reconciliation all read the corrected day. Her
     report itself is never touched: a filed report is filed.
   · A difference she has answered is closed even where she keeps her own
     figure — then the salesperson's report is the one that is wrong, and the
     Chairman's page shows both.                                             */

var MONEY_OWNER_ = 'ephrata';
var MONEY_REPORT_ = 'ephrata-daily';
var MONEY_TOL_ = 1;                 /* Birr: 533,550.70 and 533,551 are one payment */
var MONEY_BACK_DAYS_ = 7;           /* the first look after this went live checks the week before */
var MONEY_BACKFILL_KEY_ = 'MONEY_BACKFILL_V1';

/* "Kk141", "KK-141", "kk 0141" are one code; a lead number or a phone stays as typed, cleaned */
function moneyCode_(s) {
  s = String(s == null ? '' : s).toUpperCase().replace(/[^A-Z0-9]/g, '');
  var m = /^KK0*(\d+)$/.exec(s);
  return m ? 'KK' + m[1] : s;
}
function moneyNum_(v) {
  var s = String(v == null ? '' : v).replace(/[^0-9.\-]/g, '');
  return s === '' || isNaN(Number(s)) ? null : Number(s);
}
/* the rows of a payment list that carry an amount, with where they sit in it */
function moneyRows_(list) {
  return (Array.isArray(list) ? list : []).map(function (r, i) {
    var a = r ? moneyNum_(r.amount) : null;
    if (a === null) return null;
    return { i: i, code: moneyCode_(r.lc), lc: String(r.lc || '').trim(), cust: String(r.cust || '').trim(),
             v: a, kind: String(r.kind || '') };
  }).filter(function (x) { return x; });
}
function moneyKeyPart_(r) { return r.code || ('A' + Math.round(r.v)); }

/* The differences, in code. `eph` and each of `sales` are moneyRows_;
   `allIn`: every salesperson owed that day has reported. */
function moneyCompare_(eph, sales, allIn) {
  var used = {}, items = [];
  Object.keys(sales).sort().forEach(function (who) {
    sales[who].forEach(function (s) {
      var hit = null;
      /* the same customer code first */
      if (s.code) eph.forEach(function (e) { if (!hit && !used[e.i] && e.code === s.code) hit = e; });
      /* then the same amount, where one side wrote no code */
      if (!hit) eph.forEach(function (e) {
        if (!hit && !used[e.i] && (!e.code || !s.code) && Math.abs(e.v - s.v) <= MONEY_TOL_) hit = e;
      });
      if (hit) {
        used[hit.i] = true;
        if (Math.abs(hit.v - s.v) > MONEY_TOL_) {
          items.push({ key: 'amount:' + moneyKeyPart_(s.code ? s : hit) + ':' + who, kind: 'amount', who: who,
                       code: s.lc || hit.lc, cust: s.cust || hit.cust, sales: s.v, eph: hit.v, row: hit.i,
                       payKind: s.kind || hit.kind });
        }
        return;
      }
      items.push({ key: 'missing:' + moneyKeyPart_(s) + ':' + who, kind: 'missing', who: who,
                   code: s.lc, cust: s.cust, sales: s.v, eph: null, row: -1, payKind: s.kind });
    });
  });
  if (allIn) eph.forEach(function (e) {
    if (used[e.i]) return;
    items.push({ key: 'extra:' + moneyKeyPart_(e), kind: 'extra', who: '', code: e.lc, cust: e.cust,
                 sales: null, eph: e.v, row: e.i, payKind: e.kind });
  });
  return items;
}

/* ---------------- her fixes, read in place of what she first filed ---------------- */

/* Every fix she has sent, by day — the latest of each. Read once a run:
   fixes are filed from her phone, never by this script. */
var MONEY_FIXES_ = null;
function moneyFixes_() {
  if (MONEY_FIXES_) return MONEY_FIXES_;
  var by = {};
  try {
    fsQuery_('fixes', [['person', 'EQUAL', MONEY_OWNER_]], null)
      .filter(function (f) { return f.day && f.at && f.at.getTime; })
      .sort(function (a, b) { return a.at.getTime() - b.at.getTime(); })
      .forEach(function (f) {
        /* the day's list and total as her latest fix gives them; the answers of all of them */
        var cur = by[f.day] || (by[f.day] = { answers: {} });
        cur.at = f.at;
        cur.list = Array.isArray(f.list) ? f.list : [];
        cur.total = moneyNum_(f.total) || 0;
        (f.items || []).forEach(function (x) { if (x && x.key) cur.answers[x.key] = moneyNum_(x.amount); });
      });
  } catch (e) {
    /* unreadable: the reports read as filed */
    Logger.log('fixes: %s', e.message);
  }
  MONEY_FIXES_ = by;
  return by;
}
function moneyFresh_() { MONEY_FIXES_ = null; MONEY_BASE_ = {}; }
/* her list as it stood when she was asked to correct it (/moneyfix/{day}.baseList) */
var MONEY_BASE_ = {};
function moneyBase_(day) {
  if (!(day in MONEY_BASE_)) {
    var d = null;
    try { d = fsGet_('moneyfix/' + day); } catch (e) { d = null; }
    MONEY_BASE_[day] = (d && d.baseList) || [];
  }
  return MONEY_BASE_[day];
}

/* Called by fsQuery_ on every read of /reports: an Ephrata daily report
   filed before her fix of that day reads as the fix says the day stood —
   and so does one filed after it that only repeats the list as it was:
   reopened the same day, her phone shows the copy she first sent, without
   the fix, and sending it again (to add something else) dropped the fixed
   payments (the bug hunt, 15 Oct 2026: 533,551 Birr out of her week). A
   later filing that names a payment the fix does not is her own new word,
   and stands. */
function moneyRepeats_(filed, fixList, baseList) {
  var fixRows = moneyRows_(fixList).concat(moneyRows_(baseList || [])), used = {};
  return moneyRows_(filed).every(function (r) {
    for (var i = 0; i < fixRows.length; i++) {
      var x = fixRows[i];
      if (used[i] || Math.round(x.v) !== Math.round(r.v)) continue;
      if (r.code && x.code && r.code !== x.code) continue;
      used[i] = true;
      return true;
    }
    return false;
  });
}
function moneyPatch_(docs) {
  var mine = docs.filter(function (d) { return d.report === MONEY_REPORT_ && d.at && d.at.getTime; });
  if (!mine.length) return docs;
  var fx = moneyFixes_();
  mine.forEach(function (d) {
    var f = fx[dayOf_(d.at)];
    if (!f) return;
    if (!(d.at.getTime() < f.at.getTime()) && !moneyRepeats_((d.values || {}).collected_list, f.list, moneyBase_(dayOf_(d.at)))) return;
    var v = {};
    Object.keys(d.values || {}).forEach(function (k) { v[k] = d.values[k]; });
    v.collected_before = v.collected_today == null ? '' : String(v.collected_today);
    v.collected_list = f.list;
    v.collected_today = String(f.total);
    v.collected_any = Number(f.total) > 0 ? 'yes' : 'no';
    v.collected_fixed = 'yes';
    d.values = v;
  });
  return docs;
}

/* ---------------- the check ---------------- */

/* One day: compare, write /moneyfix/{day}, tell her phone of anything new.
   Returns the open differences (or null when there is nothing to compare). */
function moneyCheck_(day) {
  var schedule = loadSchedule_();
  var salesReps = (schedule.reports || []).filter(function (r) { return /-sales-daily$/.test(r.id); });
  var owed = dueOn_(schedule, day).filter(function (r) { return /-sales-daily$/.test(r.id); });
  var last = {};
  filedBetween_(day, addDays_(day, 1)).forEach(function (f) { last[f.report] = f; });   /* in time order: the last wins */
  var eph = last[MONEY_REPORT_];
  var prev = null;
  try { prev = fsGet_('moneyfix/' + day); } catch (e) { prev = null; }
  if (!eph) return null;
  var sales = {}, n = 0;
  salesReps.forEach(function (r) {
    if (last[r.id]) { sales[r.person] = moneyRows_(last[r.id].fields.k_list); n++; }
  });
  if (!n) return null;
  var allIn = owed.every(function (r) { return !!last[r.id]; });
  var items = moneyCompare_(moneyRows_(eph.fields.collected_list), sales, allIn);
  var fx = moneyFixes_()[day], answered = fx ? fx.answers : {};
  var open = items.filter(function (it) { return !(it.key in answered); });
  var wasOpen = prev && prev.status === 'open';
  if (!open.length) {
    if (wasOpen) {
      fsPut_('moneyfix/' + day, { day: day, to: MONEY_OWNER_, status: Object.keys(answered).length ? 'fixed' : 'ok',
                                  items: [], base: eph.at, baseList: [], opened: prev.opened || null,
                                  notified: prev.notified || [], at: new Date() });
    }
    return [];
  }
  /* her list as it stands now (fixed or as filed), for her phone to correct */
  var told = (prev && prev.notified) || [];
  var fresh = open.filter(function (it) { return told.indexOf(it.key) === -1; });
  fsPut_('moneyfix/' + day, {
    day: day, to: MONEY_OWNER_, status: 'open', items: open, allIn: allIn,
    base: eph.at, baseList: Array.isArray(eph.fields.collected_list) ? eph.fields.collected_list : [],
    opened: (wasOpen && prev.opened) || new Date(),
    notified: told.concat(fresh.map(function (it) { return it.key; })), at: new Date()
  });
  if (fresh.length) {
    try {
      pushTo_(MONEY_OWNER_, 'Collections do not match — ' + pushDay_(day),
              open.length + (open.length === 1 ? ' payment differs' : ' payments differ') +
              ' from the salespeople’s reports. Open the site and type what was really collected. ' +
              '· ገንዘቡ ከሽያጭ ባለሙያዎቹ ሪፖርት ጋር አይጣጣምም — ያስተካክሉ።',
              'moneyfix-' + day, '');
    } catch (e) { Logger.log('money push: %s', e.message); }
  }
  return open;
}

/* From runIfNew_: the days of the reports just in, where they touch money */
function moneyAfter_(fresh) {
  var days = {};
  (fresh || []).forEach(function (f) {
    if (f.at && (f.report === MONEY_REPORT_ || /-sales-daily$/.test(String(f.report || '')))) days[dayOf_(f.at)] = 1;
  });
  var keys = Object.keys(days);
  if (!keys.length) return;
  moneyFresh_();
  keys.sort().forEach(function (d) {
    try { moneyCheck_(d); } catch (e) { Logger.log('money %s: %s', d, e.message); }
  });
}

/* From the watch, every look: a day still open is looked at again, so a fix
   she sent closes it; and once, the week before this went live. */
function moneyWatch_() {
  var props = PropertiesService.getScriptProperties();
  var days = {};
  if (!props.getProperty(MONEY_BACKFILL_KEY_)) {
    var today = todayAddis_(), start = prop_('LEDGER_START', '');
    for (var k = 0; k <= MONEY_BACK_DAYS_; k++) {
      var d = addDays_(today, -k);
      if (!closed_(d) && (!start || d >= start)) days[d] = 1;
    }
  }
  /* an open day is looked at again once an hour — or at once when she has
     sent a fix since; every ten minutes it re-read the whole day each time
     (the bug hunt, 15 Oct 2026: Firestore's daily reads). A new report is
     checked as it comes in (runIfNew_). */
  var lastLook = Number(props.getProperty('MONEY_LOOK') || 0), now = new Date().getTime();
  var hourly = now - lastLook >= 3600 * 1000;
  var fixedSince = {};
  if (!hourly) {
    tryQuery_('fixes', [['at', 'GREATER_THAN', new Date(lastLook)]], null)
      .forEach(function (f) { if (f.day) fixedSince[f.day] = 1; });
  }
  tryQuery_('moneyfix', [['status', 'EQUAL', 'open']], null).forEach(function (m) {
    if (m.day && (hourly || fixedSince[m.day])) days[m.day] = 1;
  });
  if (hourly) props.setProperty('MONEY_LOOK', String(now));
  var keys = Object.keys(days);
  if (keys.length) {
    moneyFresh_();
    keys.sort().forEach(function (d) {
      try { moneyCheck_(d); } catch (e) { Logger.log('money %s: %s', d, e.message); }
    });
  }
  if (!props.getProperty(MONEY_BACKFILL_KEY_)) props.setProperty(MONEY_BACKFILL_KEY_, new Date().toISOString());
}
