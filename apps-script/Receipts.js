/* Klever — every payment a salesperson collects, checked against Selam's receipts.

   The user, 15 Oct 2026: "on sales add the receipt with its number, and ask
   Selam that she did confirm — receipts generated". Each payment in a
   salesperson's daily report (k_list) now carries the receipt number
   (forms.js, `rcpt`, cannot be sent without it). Selam issues Klever's
   receipts, so she is the one who can say whether it is real.

   WHAT HAPPENS
   · As a salesperson's report comes in (runIfNew_), the day's payments of
     every salesperson are written to /rcptcheck/{day}, one item each: who,
     the customer, the amount, what it was for, the receipt number — and,
     when that number was given for another payment too (that day or in the
     60 days before), which one. Her phone is told of the new ones.
   · Her home page shows each payment with three taps: "Yes, I issued it",
     "Different amount" (she types the amount on her receipt) and "No such
     receipt". What she sends is /rcptok/{id}, filed as her, at the server's
     time, never changed after; a newer answer to the same payment counts.
   · Her answers are copied onto the day's items, and the day is closed
     ('done') once every payment has one. The Chairman's page shows the days,
     what is still waiting and what she said was wrong; the Group CFO reads
     the same (rcptFacts_).
   · A photo of the customer's slip may be taken in the row (forms.js
     `slip`, 15 Oct 2026); its /slips ids ride on the item (`slips`), and
     Selam and the Chairman open the picture beside the payment.
   · No fine: no letter says one. A receipt she denies is for the Chairman.

   A report sent again the same day replaces that salesperson's payments
   (the last filing counts, as everywhere); a payment whose amount or receipt
   number changed is a new one to confirm. */

var RCPT_OWNER_ = 'betty';
var RCPT_FROM_ = '2026-10-15';      /* the first day salespeople were asked for the number */
var RCPT_DUP_DAYS_ = 60;
var RCPT_ANSWERS_ = ['yes', 'amount', 'no'];

/* "No. 0123", "no 0123" and "0123" are one number; a word with no digit in it ("none", "not yet") is no number */
function rcptNo_(s) {
  s = String(s == null ? '' : s).toUpperCase().replace(/^\s*(RECEIPT|RCPT|NO|NUMBER|#)[\s.:#-]*/g, '').replace(/[^A-Z0-9]/g, '');
  return /\d/.test(s) ? s : '';
}
/* one salesperson's payments that carry an amount */
function rcptRows_(list, who) {
  return (Array.isArray(list) ? list : []).map(function (r) {
    var a = r ? moneyNum_(r.amount) : null;
    if (a === null || a <= 0) return null;
    var typed = String(r.rcpt == null ? '' : r.rcpt).trim();
    return { who: who, cust: String(r.cust || '').trim(), code: String(r.lc || '').trim(), amount: a,
             kind: String(r.kind || ''), rcpt: typed, no: rcptNo_(typed), slips: rcptSlips_(r) };
  }).filter(function (x) { return x; });
}
/* The slip photos taken in the row (js/app.js slipCell, 15 Oct 2026): the
   /slips ids, kept beside the count under slip__ids. Selam and the Chairman
   open them by id. */
function rcptSlips_(r) {
  return String((r && r.slip__ids) || '').split(/\s+/)
    .filter(function (x) { return /^[A-Za-z0-9]{10,40}$/.test(x); }).slice(0, 4);
}
function rcptKey_(r) { return r.who + ':' + (r.no || '-') + ':' + Math.round(r.amount); }
/* what a day's items say, in an order Firestore's reading back does not change */
function rcptSig_(items) {
  return (items || []).map(function (it) {
    var d = it.dup || {};
    return [it.key, it.cust, it.code, it.kind, it.rcpt, it.ans || '', it.ansAmount == null ? '' : it.ansAmount, d.day || '', d.who || '',
            (it.slips || []).join(' ')].join('\u0001');
  }).join('\u0002');
}

/* Every answer she has sent, by day and payment: the latest of each. Read
   once a run — answers are filed from her phone, never by this script. */
var RCPT_ANS_ = null;
function rcptAnswers_() {
  if (RCPT_ANS_) return RCPT_ANS_;
  var by = {};
  try {
    fsQuery_('rcptok', [['person', 'EQUAL', RCPT_OWNER_]], null)
      .filter(function (f) { return f.day && f.at && f.at.getTime; })
      .sort(function (a, b) { return a.at.getTime() - b.at.getTime(); })
      .forEach(function (f) {
        (f.items || []).forEach(function (x) {
          if (!x || !x.key || RCPT_ANSWERS_.indexOf(x.ans) === -1) return;
          (by[f.day] = by[f.day] || {})[x.key] = { ans: x.ans, amount: x.ans === 'amount' ? moneyNum_(x.amount) : null, at: f.at };
        });
      });
  } catch (e) {
    /* unreadable: every payment waits, nothing is lost */
    Logger.log('rcptok: %s', e.message);
  }
  RCPT_ANS_ = by;
  return by;
}
function rcptFresh_() { RCPT_ANS_ = null; }

/* One day: the salespeople's payments, her answers on them, what is still
   waiting; written to /rcptcheck/{day}, her phone told of new ones.
   Returns the doc written, or null when there is nothing to check. */
function rcptCheck_(day) {
  if (day < RCPT_FROM_) return null;
  var schedule = loadSchedule_();
  var salesReps = (schedule.reports || []).filter(function (r) { return /-sales-daily$/.test(r.id); });
  var last = {};
  filedBetween_(day, addDays_(day, 1)).forEach(function (f) { last[f.report] = f; });   /* in time order: the last wins */
  var rows = [];
  salesReps.forEach(function (r) { if (last[r.id]) rows = rows.concat(rcptRows_(last[r.id].fields.k_list, r.person)); });
  var prev = null;
  try { prev = fsGet_('rcptcheck/' + day); } catch (e) { prev = null; }
  if (!rows.length && !prev) return null;

  /* the same number given for another payment: that day, or in the days before */
  var earlier = tryQuery_('rcptcheck', [['day', 'GREATER_THAN_OR_EQUAL', addDays_(day, -RCPT_DUP_DAYS_)],
                                        ['day', 'LESS_THAN', day]], null);
  var answers = rcptAnswers_()[day] || {};
  var seen = {};
  var items = rows.map(function (r) {
    var key = rcptKey_(r);
    if (seen[key]) key += ':' + (seen[key]++);   /* the same payment written twice: two items */
    else seen[key] = 1;
    var it = { key: key, who: r.who, cust: r.cust, code: r.code, amount: r.amount, kind: r.kind, rcpt: r.rcpt,
               slips: r.slips, ans: '', ansAmount: null, dup: null };
    var a = answers[key];
    if (a) { it.ans = a.ans; it.ansAmount = a.amount; }
    return it;
  });
  items.forEach(function (it, i) {
    var no = rcptNo_(it.rcpt);
    if (!no) return;
    var other = null;
    items.forEach(function (x, j) { if (!other && j !== i && rcptNo_(x.rcpt) === no) other = { day: day, x: x }; });
    earlier.forEach(function (d) {
      (d.items || []).forEach(function (x) { if (!other && x && rcptNo_(x.rcpt) === no) other = { day: d.day, x: x }; });
    });
    if (other) it.dup = { day: other.day, who: other.x.who, cust: other.x.cust || other.x.code || '', amount: Math.round(other.x.amount) };
  });

  var waiting = items.filter(function (it) { return !it.ans; });
  var told = (prev && prev.notified) || [];
  var fresh = waiting.filter(function (it) { return told.indexOf(it.key) === -1; });
  var doc = {
    day: day, to: RCPT_OWNER_, status: waiting.length ? 'open' : 'done', items: items,
    waiting: waiting.length, wrong: items.filter(function (it) { return it.ans === 'no' || it.ans === 'amount'; }).length,
    twice: items.filter(function (it) { return it.dup; }).length,
    notified: told.concat(fresh.map(function (it) { return it.key; })), at: new Date()
  };
  /* written only when something changed: the watch looks again every hour */
  var same = prev && prev.status === doc.status && rcptSig_(prev.items) === rcptSig_(items);
  if (!same) fsPut_('rcptcheck/' + day, doc);
  if (fresh.length) {
    try {
      pushTo_(RCPT_OWNER_, 'Receipts to confirm — ' + pushDay_(day),
              fresh.length + (fresh.length === 1 ? ' payment' : ' payments') +
              ' from the salespeople. Open the site and say whether you issued each receipt. ' +
              '· ከሽያጭ ባለሙያዎቹ የገቡ ክፍያዎች — ደረሰኙን እርስዎ እንደሰጡ ያረጋግጡ።',
              'rcpt-' + day, '');
    } catch (e) { Logger.log('receipt push: %s', e.message); }
  }
  return doc;
}

/* From runIfNew_: the days of the salespeople's reports just in */
function rcptAfter_(fresh) {
  var days = {};
  (fresh || []).forEach(function (f) {
    if (f.at && /-sales-daily$/.test(String(f.report || ''))) days[dayOf_(f.at)] = 1;
  });
  var keys = Object.keys(days);
  if (!keys.length) return;
  rcptFresh_();
  keys.sort().forEach(function (d) {
    try { rcptCheck_(d); } catch (e) { Logger.log('receipts %s: %s', d, e.message); }
  });
}

/* From the watch: a day still waiting on her is looked at again once an
   hour — or at once when she has answered since — so her answers reach the
   day's items and the Chairman's page. */
function rcptWatch_() {
  var props = PropertiesService.getScriptProperties();
  var now = new Date().getTime();
  var lastLook = Number(props.getProperty('RCPT_LOOK') || 0);
  var lastAns = Math.max(lastLook, Number(props.getProperty('RCPT_ANS_LOOK') || 0));
  var days = {};
  if (now - lastLook >= 3600 * 1000) {
    tryQuery_('rcptcheck', [['status', 'EQUAL', 'open']], null).forEach(function (d) { if (d.day) days[d.day] = 1; });
    props.setProperty('RCPT_LOOK', String(now));
  } else {
    tryQuery_('rcptok', [['at', 'GREATER_THAN', new Date(lastAns)]], null)
      .forEach(function (f) { if (f.day) days[f.day] = 1; });
  }
  props.setProperty('RCPT_ANS_LOOK', String(now));
  var keys = Object.keys(days);
  if (!keys.length) return;
  rcptFresh_();
  keys.sort().forEach(function (d) {
    try { rcptCheck_(d); } catch (e) { Logger.log('receipts %s: %s', d, e.message); }
  });
}

/* For the Group CFO and Ask: the last week's payments — how many Selam has
   confirmed, which still wait on her, and which she says are wrong or carry
   a number given twice. */
function rcptFacts_(day, names) {
  var docs = tryQuery_('rcptcheck', [['day', 'GREATER_THAN_OR_EQUAL', addDays_(day, -6)],
                                     ['day', 'LESS_THAN', addDays_(day, 1)]], null);
  if (!docs.length) return null;
  if (!names) {
    names = {};
    ((loadSchedule_() || {}).people || []).forEach(function (p) { names[p.id] = p.en; });
  }
  var all = 0, ok = 0, slipped = 0, waiting = [], wrong = [], twice = [];
  docs.sort(function (a, b) { return a.day < b.day ? -1 : 1; }).forEach(function (d) {
    (d.items || []).forEach(function (it) {
      all++;
      var nSlips = (it.slips || []).length;
      if (nSlips) slipped++;
      var line = { day: dayLabel_(d.day), salesperson: names[it.who] || it.who, customer: [it.cust, it.code].filter(Boolean).join(' '),
                   birr: Math.round(it.amount), receipt_no: it.rcpt || '(none given)', slip_photo: nSlips ? 'yes' : 'no' };
      if (it.ans === 'yes') ok++;
      if (!it.ans) waiting.push(line);
      if (it.ans === 'no') wrong.push(Object.assign({ selam_says: 'she issued no such receipt' }, line));
      if (it.ans === 'amount') wrong.push(Object.assign({ selam_says: 'her receipt is for ' + fmt_(it.ansAmount) + ' Birr' }, line));
      if (it.dup && it.dup.day) {
        twice.push(Object.assign({ also_given_for: (names[it.dup.who] || it.dup.who) + '’s payment from ' + (it.dup.cust || 'a customer') + ', ' +
                                   fmt_(it.dup.amount) + ' Birr, ' + dayLabel_(it.dup.day) }, line));
      }
    });
  });
  return {
    note: 'Each payment a salesperson reports carries the receipt number; Selam, who issues Klever’s receipts, confirms each.',
    payments_this_week: all, confirmed_by_selam: ok, with_a_photo_of_the_slip: slipped,
    waiting_for_selam: waiting.slice(0, 20), waiting_count: waiting.length,
    selam_says_wrong: wrong.slice(0, 20),
    receipt_number_given_twice: twice.slice(0, 20)
  };
}
