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

   A credit is paid when a later payment row in Getachew's report (section
   4, cr_paid_list) names the same supplier for the same amount; each
   payment pays one credit. A part payment, or one cheque for several
   credits, does not match: the reminder goes, and they close it saying so.
   A credit with no pay-by date gets one reminder to Getachew to agree one.

   Each reminder is written once (its id comes from the filing and the row),
   so a reminder closed or cancelled is never sent again. */

var CREDIT_REMIND_DAYS_ = 2;          /* days before the pay-by date */
var CREDIT_LOOK_BACK_DAYS_ = 200;     /* credits taken in this time are watched */

/* Getachew's daily reports, the last filing of each day (a second one the
   same day is a correction), oldest first. */
function creditFilings_(today) {
  var from = addDays_(today, -CREDIT_LOOK_BACK_DAYS_);
  var byDay = {};
  fsQuery_('reports', [['report', 'EQUAL', 'getachew-daily']], null).forEach(function (f) {
    if (!f.at) return;
    var day = dayOf_(f.at);
    if (day < from || day > today) return;
    if (!byDay[day] || byDay[day].at.getTime() <= f.at.getTime()) byDay[day] = f;
  });
  return Object.keys(byDay).sort().map(function (d) { return byDay[d]; });
}

function creditName_(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
function creditDate_(s) {
  var t = String(s || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(t) && dayOf_(new Date(t + 'T12:00:00' + ADDIS_)) === t ? t : '';
}

/* Every credit taken, and whether it has been paid. */
function creditsOwed_(filings) {
  var credits = [], payments = [];
  filings.forEach(function (f) {
    var day = dayOf_(f.at), v = f.values || {};
    rows_(v.ord_list).forEach(function (r, i) {
      if (!r || r.paid !== 'credit') return;
      credits.push({ key: f._id + '-' + i, day: day, sup: String(r.sup || '').trim(),
                     amount: n_(r.amount), item: String(r.item || '').trim(),
                     code: String(r.code || '').trim(), due: creditDate_(r.due) });
    });
    rows_(v.cr_paid_list).forEach(function (r) {
      if (!r || blank_(r.sup)) return;
      payments.push({ day: day, sup: creditName_(r.sup), amount: n_(r.amount),
                      chq: String(r.chq || '').trim(), used: false });
    });
  });
  /* the soonest due is paid first */
  credits.sort(function (a, b) { return (a.due || '9999') < (b.due || '9999') ? -1 : 1; });
  credits.forEach(function (c) {
    var p = payments.filter(function (x) {
      return !x.used && x.day >= c.day && x.sup === creditName_(c.sup) && Math.abs(x.amount - c.amount) <= 1;
    })[0];
    if (p) { p.used = true; c.paidOn = p.day; c.chq = p.chq; }
  });
  return credits;
}

/* The reminders one credit needs today: [{id, to, text, due}], or none. */
function creditRemindersFor_(c, today) {
  var what = c.sup + ', ' + fmt_(c.amount) + ' Birr' +
             (c.item || c.code ? ' (' + [c.item, c.code ? 'job ' + c.code : ''].filter(Boolean).join(', ') + ')' : '');
  var taken = pushDay_(c.day);
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
            '. Make sure Selam pays it on time, put the cheque in section 4 of your daily report, ' +
            'and close this with the cheque number.\n' +
            'የአቅራቢ ዱቤ እስከ ' + by + '፦ ' + what + '፣ ' + taken + ' በዱቤ የተገዛ። ሰላም በጊዜ መክፈሏን ያረጋግጡ፣ ' +
            'ቼኩን በዕለታዊ ሪፖርትዎ ክፍል 4 ይመዝግቡ፣ ይህንንም በቼክ ቁጥሩ ይዝጉት።' }
  ];
}

/* Each morning, from dailyRun_. Writes each reminder once and sends it to
   the phones. Returns what it did, for the run log. */
function creditReminders_(today) {
  var start = prop_('LEDGER_START', '');
  var credits = creditsOwed_(creditFilings_(today)).filter(function (c) {
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
  return { unpaid: credits.length, reminders: sent };
}
