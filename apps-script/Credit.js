/* Klever — supplier credit, reminded before it falls due (6 Oct 2026).

   Getachew lists each order he places in his daily report, and says whether
   a cheque was given or it was bought on credit, and — on credit — the day
   it must be paid by (getachew-daily, ord_list). Nothing used to remind
   anyone of that day. Now, each morning (dailyRun_), every credit still
   unpaid whose day is two days off or less gets a reminder: one to Selam,
   who pays, and one to Getachew, who bought. It sits on their home page
   like an instruction, reaches their phones, and stays until each closes
   it with what was done (the cheque number). Left open past its day, it is
   in his list as overdue, and in the morning brief.

   PAID. Getachew wrote each payment in his report (until 23 Oct 2026
   only this way — cr_paid_list: supplier, amount, cheque). A supplier's payments go to its
   credits, the soonest due first, each payment only to credits bought on
   or before its day — so one cheque can pay two credits, and two cheques
   one. A credit paid in full gets no reminder; one already sent is closed
   by the script (creditSettle_), with the cheque in its note, a minute or
   two after his report arrives (Agents.js runIfNew_) and again each
   morning. Supplier names are compared without case, spaces, punctuation
   or "PLC"/"trading". A credit whose amount was not written is never
   counted paid: its reminders go, and they close them by hand.
   A credit with no pay-by date gets one reminder to Getachew to agree one.

   Each reminder is written once (its id comes from the filing and the row),
   so a reminder closed or cancelled is never sent again.

   ONE CREDIT AT A TIME (the owner, 23 Oct 2026: "every day we don't have
   to ask the total — ask the credit on today's purchase, so later we ask if
   that credit is paid"). Every credit not yet paid is written for his form
   (/jobask/getachew-credit, creditAskWrite_) and comes back in his daily
   report as a row of its own (cr_back), known by its key, until he taps
   "Paid in full": a part paid takes that much off, a new date to pay
   replaces the old one. Those answers go by the key, so no supplier name has
   to match. What Klever owed before the list began he writes once (cr_old),
   and each of those is a credit like the rest. cr_paid_list stays for a
   credit paid that is not on his list. */

var CREDIT_REMIND_DAYS_ = 2;          /* days before the pay-by date */
var CREDIT_LOOK_BACK_DAYS_ = 200;     /* credits taken in this time are watched */

/* Getachew's daily reports, the last filing of each day (a second one the
   same day is a correction), oldest first. */
function creditFilings_(today) {
  var from = addDays_(today, -CREDIT_LOOK_BACK_DAYS_);
  var byDay = {}, all = {};
  fsQuery_('reports', [['report', 'EQUAL', 'getachew-daily']], null).forEach(function (f) {
    if (!f.at) return;
    var day = dayOf_(f.at);
    if (day < from || day > today) return;
    (all[day] = all[day] || []).push(f);
    if (!byDay[day] || byDay[day].at.getTime() <= f.at.getTime()) byDay[day] = f;
  });
  /* `_was`: the day's earlier filings — a credit on his list may carry the
     key one of them gave it (creditsOwed_ reads it as this filing's) */
  return Object.keys(byDay).sort().map(function (d) {
    var f = byDay[d];
    f._was = all[d].filter(function (x) { return x !== f && x._id; }).map(function (x) { return x._id; });
    return f;
  });
}

/* "Alemu Wood PLC", "alemu  wood", "Alemu-Wood" are one supplier */
function creditName_(s) {
  return String(s || '').toLowerCase()
    .replace(/[.,;:'’"()\[\]\/\\&_\-–—።፣፤]/g, ' ')
    .replace(/\b(p ?l ?c|s ?c|share company|trading|the)\b/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
function creditDate_(s) {
  var t = String(s || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(t) && dayOf_(new Date(t + 'T12:00:00' + ADDIS_)) === t ? t : '';
}

/* Every credit taken, and whether it has been paid. */
function creditsOwed_(filings) {
  var credits = [], payments = [], answers = [];
  filings.forEach(function (f) {
    var day = dayOf_(f.at), v = f.values || {};
    rows_(v.ord_list).forEach(function (r, i) {
      if (!r || r.paid !== 'credit') return;
      credits.push({ key: f._id + '-' + i, day: day, sup: String(r.sup || '').trim(),
                     amount: n_(r.amount), item: String(r.item || '').trim(),
                     code: String(r.code || '').trim(), due: creditDate_(r.due) });
    });
    /* owed before the list began, written once (23 Oct 2026) */
    if (v.cr_old_any === 'yes') rows_(v.cr_old).forEach(function (r, i) {
      if (!r || (blank_(r.sup) && blank_(r.amount))) return;
      credits.push({ key: f._id + '-o' + i, day: day, sup: String(r.sup || '').trim(),
                     amount: n_(r.amount), item: '', code: String(r.code || '').trim(),
                     due: creditDate_(r.due), old: true });
    });
    /* each credit on his list, answered by its key */
    rows_(v.cr_back).forEach(function (r) {
      if (!r || blank_(r.ref) || blank_(r.now)) return;
      answers.push({ day: day, key: String(r.ref), now: String(r.now), amount: n_(r.amt),
                     chq: String(r.chq || '').trim(), due: creditDate_(r.due) });
    });
    rows_(v.cr_paid_list).forEach(function (r) {
      if (!r || blank_(r.sup)) return;
      payments.push({ day: day, sup: creditName_(r.sup), amount: n_(r.amount),
                      chq: String(r.chq || '').trim(), used: false });
    });
  });
  /* the soonest due is paid first; then the oldest bought */
  credits.sort(function (a, b) {
    var x = a.due || '9999', y = b.due || '9999';
    return x !== y ? (x < y ? -1 : 1) : (a.day < b.day ? -1 : a.day > b.day ? 1 : 0);
  });
  credits.forEach(function (c) { c.left = c.amount > 0 ? c.amount : null; c.cheques = []; });
  /* his answers on the list first, by key, in the order given: "paid in
     full" pays what was left (or, with no amount ever written, closes it);
     a part takes off what he says; a new date replaces the old one */
  var byKey = {}, alias = {};
  credits.forEach(function (c) { byKey[c.key] = c; });
  filings.forEach(function (f) { (f._was || []).forEach(function (id) { alias[id] = f._id; }); });
  answers.forEach(function (a) {
    var cut = a.key.indexOf('-');
    if (cut > 0 && alias[a.key.slice(0, cut)]) a.key = alias[a.key.slice(0, cut)] + a.key.slice(cut);
    var c = byKey[a.key];
    if (!c || c.paidOn) return;
    if (a.now === 'paid') {
      c.cheques.push({ chq: a.chq, day: a.day, amount: c.left != null ? c.left : 0 });
      c.left = 0;
      c.paidOn = a.day;
      c.chq = c.cheques.map(function (x) { return x.chq; }).filter(Boolean).join(', ');
      return;
    }
    if (a.now === 'part' && a.amount > 0 && c.left != null) {
      var take = Math.min(a.amount, c.left);
      c.left -= take;
      c.cheques.push({ chq: a.chq, day: a.day, amount: take });
    }
    if ((a.now === 'not' || a.now === 'part') && a.due) c.due = a.due;
  });
  /* each payment, oldest first, to its supplier's credits bought by then */
  payments.forEach(function (p) {
    var money = p.amount;
    credits.forEach(function (c) {
      if (money <= 0 || c.left == null || c.left <= 1 || c.day > p.day || creditName_(c.sup) !== p.sup) return;
      var take = Math.min(money, c.left);
      c.left -= take;
      money -= take;
      c.cheques.push({ chq: p.chq, day: p.day, amount: take });
    });
  });
  credits.forEach(function (c) {
    if (c.left != null && c.left <= 1) {
      c.paidOn = c.cheques[c.cheques.length - 1].day;
      c.chq = c.cheques.map(function (x) { return x.chq; }).filter(Boolean).join(', ');
    }
  });
  return credits;
}

/* One document, only the named fields changed (the rest kept). */
function fsUpdate_(path, obj) {
  var fields = {}, mask = [];
  Object.keys(obj).forEach(function (k) {
    fields[k] = fsEncode_(obj[k]);
    mask.push('updateMask.fieldPaths=' + encodeURIComponent(k));
  });
  var res = UrlFetchApp.fetch(fsBase_() + '/documents/' + path + '?' + mask.join('&') +
                              '&currentDocument.exists=true', {
    method: 'patch', contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + fsToken_() },
    muteHttpExceptions: true,
    payload: JSON.stringify({ fields: fields })
  });
  if (res.getResponseCode() !== 200) {
    throw new Error('Could not update ' + path + ' (HTTP ' + res.getResponseCode() + '): ' +
                    res.getContentText().substring(0, 300));
  }
}

/* The reminders of credits now paid in full, closed with what paid them.
   From runIfNew_ when Getachew's report comes in, and each morning.
   Returns the ids it closed. */
function creditSettle_(today, credits) {
  credits = credits || creditsOwed_(creditFilings_(today));
  var open = {};
  tryQuery_('instructions', [['status', 'EQUAL', 'open']], null).forEach(function (i) {
    if (i.by === 'reminder') open[i._id] = i;
  });
  var closed = [];
  credits.forEach(function (c) {
    if (!c.paidOn) return;
    var how = c.cheques.map(function (x) {
      return (x.chq ? 'cheque ' + x.chq : 'no cheque number written') + ', ' + fmt_(x.amount) + ' Birr, ' + pushDay_(x.day);
    }).join('; ');
    ['cr-' + c.key + '-s', 'cr-' + c.key + '-g', 'crd-' + c.key].forEach(function (id) {
      if (!open[id]) return;
      fsUpdate_('instructions/' + id, {
        status: 'done', doneAt: new Date(),
        note: ('Paid (' + how + '), as Getachew reported. Closed by the system.\n' +
               'ተከፍሏል (' + how + ')፣ ጌታቸው እንደዘገበው። በሲስተሙ ተዘግቷል።').substring(0, 1000)
      });
      closed.push(id);
    });
  });
  return closed;
}

/* The reminders one credit needs today: [{id, to, text, due}], or none. */
function creditRemindersFor_(c, today) {
  var birr = !(c.amount > 0) ? 'amount not written'
           : c.left != null && c.left < c.amount ? fmt_(c.left) + ' Birr still owed of ' + fmt_(c.amount)
           : fmt_(c.amount) + ' Birr';
  var what = c.sup + ', ' + birr +
             (c.item || c.code ? ' (' + [c.item, c.code ? 'job ' + c.code : ''].filter(Boolean).join(', ') + ')' : '');
  /* owed from before the list began: listed that day, bought earlier */
  var taken = c.old ? 'before ' + pushDay_(c.day) : pushDay_(c.day);
  if (!c.due) {
    /* no day to count from: ask the one who bought to agree one */
    return [{ id: 'crd-' + c.key, to: 'getachew', due: workingDaysOn_(today, 1),
              text: 'Supplier credit with no pay-by date: ' + what + ', bought on credit ' + taken +
                    '. Agree the day with the supplier, tell Selam, and close this with the date.\n' +
                    'የመክፈያ ቀን የሌለው የአቅራቢ ዱቤ፦ ' + what + '፣ ' + taken + ' በዱቤ የተገዛ። ቀኑን ከአቅራቢው ጋር ይስማሙ፣ ' +
                    'ለሰላም ይንገሩ፣ ይህንንም ቀኑን ጽፈው ይዝጉት።' }];
  }
  /* two days ahead — three on a Saturday, so a Tuesday is not left to the Sunday */
  var ahead = CREDIT_REMIND_DAYS_ + (dow_(today) === 6 ? 1 : 0);
  if (c.due > addDays_(today, ahead)) return [];
  var by = pushDay_(c.due);
  return [
    { id: 'cr-' + c.key + '-s', to: 'betty', due: c.due,
      text: 'Supplier credit due ' + by + ': pay ' + what + '. Getachew bought it on credit ' + taken +
            '. When it is paid, close this with the cheque number.\n' +
            'የአቅራቢ ዱቤ እስከ ' + by + '፦ ' + what + ' ይክፈሉ። ጌታቸው ' + taken + ' በዱቤ ገዝቶታል። ' +
            'ሲከፈል በቼክ ቁጥሩ ይዝጉት።' },
    { id: 'cr-' + c.key + '-g', to: 'getachew', due: c.due,
      text: 'Supplier credit due ' + by + ': ' + what + ', bought on credit ' + taken +
            '. Make sure Selam pays it on time. When it is paid, tap “Paid in full” on it in your daily ' +
            'report’s credit list, with the cheque number, and close this with the cheque number.\n' +
            'የአቅራቢ ዱቤ እስከ ' + by + '፦ ' + what + '፣ ' + taken + ' በዱቤ የተገዛ። ሰላም በጊዜ መክፈሏን ያረጋግጡ። ' +
            'ሲከፈል በዕለታዊ ሪፖርትዎ የዱቤ ዝርዝር ላይ “ሙሉ በሙሉ ተከፍሏል” ብለው የቼክ ቁጥሩን ይጻፉ፣ ይህንንም በቼክ ቁጥሩ ይዝጉት።' }
  ];
}

/* Each morning, from dailyRun_. Writes each reminder once and sends it to
   the phones. Returns what it did, for the run log. */
function creditReminders_(today) {
  var start = prop_('LEDGER_START', '');
  var filings = creditFilings_(today), all = creditsOwed_(filings);
  /* what was paid since: its reminders closed first — a failure there does
     not stop the reminders, and is said to the run after them */
  var closed = [], settleErr = null;
  try { closed = creditSettle_(today, all); } catch (e) { settleErr = e; }
  /* his credit list for today's report */
  try { creditAskWrite_(all, filings); } catch (e) { settleErr = settleErr || e; }
  var credits = all.filter(function (c) {
    return !c.paidOn && (!start || c.day >= start);
  });
  var sent = [];
  credits.forEach(function (c) {
    creditRemindersFor_(c, today).forEach(function (r) {
      if (fsGet_('instructions/' + r.id)) return;          /* once, ever */
      fsPut_('instructions/' + r.id, { to: r.to, text: r.text.substring(0, 1000), due: r.due,
                                        by: 'reminder', status: 'open', at: new Date() });
      sent.push(r.id);
      try { notifyInstruction_(r.id); } catch (e) { Logger.log('credit push %s: %s', r.id, e.message); }
    });
  });
  if (settleErr) throw new Error('closing paid reminders / the credit list: ' + settleErr.message);
  return { unpaid: credits.length, reminders: sent, closed: closed };
}

/* The list his form asks about (getachew-daily cr_back, js/app.js
   creditOpen): every credit not yet paid, by its key, and the once-only
   question he has already answered (cr_old_any — perhaps longer ago than
   the 30 days of reports the form reads). Read by Getachew, and by the
   Chairman, who may fill the form for him (firestore.rules /jobask: `to`). */
function creditAskWrite_(credits, filings) {
  /* soonest due first, by the date as it now stands (a new one given on the
     list moves it); those with no date last, oldest first */
  var open = credits.filter(function (c) { return !c.paidOn; }).sort(function (a, b) {
    var x = a.due || '9999', y = b.due || '9999';
    return x !== y ? (x < y ? -1 : 1) : (a.day < b.day ? -1 : a.day > b.day ? 1 : 0);
  });
  var answered =(filings || []).some(function (f) { return !blank_((f.values || {}).cr_old_any); }) ? ['cr_old_any'] : [];
  fsPut_('jobask/getachew-credit', {
    to: 'getachew', kind: 'credit', at: new Date(), answered: answered,
    items: open.map(function (c) {
      return { ref: c.key, sup: c.sup, code: c.code, item: c.item, amount: c.amount > 0 ? c.amount : null,
               left: c.left, due: c.due || '', day: c.day, old: !!c.old };
    })
  });
  return open.length;
}

/* Getachew's report in (Agents.js runIfNew_): what it says is paid has its
   reminders closed now, not tomorrow morning, and his list is made again
   for his next report. */
function creditAfter_(today) {
  var filings = creditFilings_(today), all = creditsOwed_(filings);
  var closed = creditSettle_(today, all);
  creditAskWrite_(all, filings);
  return closed;
}
