/* Klever — the bank balance, from the owner's WhatsApp (16 Oct 2026).

   The user: "start today — I report the bank balance, not Finance; Finance
   reports all transactions in and out". Selam's daily report lost its bank
   lines and became one list of every transaction (js/forms.js, betty-daily
   tx_list). The balance comes from the owner's phone — or the Chairman's —
   as a WhatsApp message:

     bank CBE 2,300,000 Awash 900,000 Abyssinia 1.2m ZamZam 3m

   It is read back with its total and the check below, and saved on YES
   (Wa.js) in /bank: one document a message, the last of a day standing. A
   bank not named keeps the figure it last had; the first message names all
   four. "bank 7,400,000" alone is the total, with no banks.

   Every reader of the bank — the morning readers, the Group CFO, the Sunday
   CFO and packs, Ask, the forecast, the checks — reads it as the filings of a
   report 'owner-bank' (bankBetween_), added to the filings they were handed.
   It is not in forms.js: nobody owes it, and no ledger line or rule comes
   from it.

   THE CHECK (bankCheck_). Each balance is set against the one before it and
   Selam's transactions in between: the earlier balance, plus what came into
   the four banks, less what went out of them, plus cash taken to a bank,
   less cash drawn out (a move between two banks is neither). A difference is
   money her list does not show — or a balance mistyped. */

var BANK_REPORT_ = 'owner-bank';
var BANK_FLOOR_ = 6000000;
var BANK_ACCOUNTS_ = [
  { id: 'cbe',   field: 'bank_cbe',   en: 'CBE',       re: /^(cbe|commercial|ንግድ)/i },
  { id: 'awash', field: 'bank_awash', en: 'Awash',     re: /^(awash|አዋሽ)/i },
  { id: 'aby',   field: 'bank_aby',   en: 'Abyssinia', re: /^(abys|abis|aby|boa|አቢሲ)/i },
  { id: 'zz',    field: 'bank_zz',    en: 'ZamZam',    re: /^(zamzam|zam|zz|ዘምዘም|ዛምዛም)/i }
];
var BANK_IDS_ = ['cbe', 'awash', 'aby', 'zz'];
/* a message that starts with one of these, and gives a figure, is a balance */
var BANK_MSG_RE_ = /^\s*(?:(?:bank|banks|balance)(?![a-z])|ባንክ)/i;

/* The figures in a message, or null when it is not a balance (no figure, or
   a question: "bank balance?" is asked, not given). */
function bankParse_(text) {
  var s = String(text || '');
  if (/\?\s*$/.test(s) || !BANK_MSG_RE_.test(s)) return null;
  s = s.replace(BANK_MSG_RE_, ' ');
  var out = { yesterday: /\byesterday\b|ትናንት/i.test(s), banks: {}, total: null, loose: [] };
  /* thousands written 2,300,000 · 2.300.000 · 2 300 000 → 2300000 */
  s = s.replace(/(\d)[,'’](?=\d{3}(?!\d))/g, '$1')
       .replace(/\b\d{1,3}(?:\.\d{3}){2,}\b/g, function (m) { return m.replace(/\./g, ''); })
       .replace(/(\d) (?=\d{3}(?!\d))/g, '$1');
  var re = /([A-Za-zሀ-፿]+)|(\d+(?:\.\d+)?)(?:\s*(k|thousand|ሺ|ሺህ|m|mn|mil|million|ሚሊዮን|ሚሊየን)(?![A-Za-zሀ-፿]))?/gi;
  var cur = null, m;
  while ((m = re.exec(s))) {
    if (m[1]) {
      var hit = null;
      BANK_ACCOUNTS_.forEach(function (b) { if (!hit && b.re.test(m[1])) hit = b.id; });
      if (hit) cur = hit;
      else if (/^(total|ጠቅላላ|ድምር)$/i.test(m[1])) cur = 'total';
      /* any other word — birr, bank, of — leaves the bank it follows */
      continue;
    }
    var x = Number(m[2]), suf = String(m[3] || '').toLowerCase();
    if (/^(k|thousand|ሺ|ሺህ)$/.test(suf)) x *= 1000;
    else if (suf) x *= 1000000;
    x = Math.round(x * 100) / 100;
    if (cur === 'total') out.total = x;
    else if (cur) { if (out.banks[cur] == null) out.banks[cur] = x; }
    else out.loose.push(x);
    cur = null;
  }
  if (!Object.keys(out.banks).length) {
    /* a figure under 1,000 with no bank before it is a date, not a balance */
    var big = out.loose.filter(function (x) { return x >= 1000; });
    if (out.total === null && big.length === 1) out.total = big[0];
    if (out.total === null) return null;
    out.totalOnly = true;
  }
  return out;
}

function bankMoney_(x) { return x === null || x === undefined ? '—' : fmt_(Math.round(x)); }
function bankDayWord_(day) {
  return Utilities.formatDate(new Date(day + 'T12:00:00' + ADDIS_), tz_(), 'EEE d MMM');
}

/* Every balance from /bank with a day in [fromDay, toDay], the last of each day */
function bankDocs_(fromDay, toDay) {
  var by = {};
  tryQuery_('bank', [['day', 'GREATER_THAN_OR_EQUAL', fromDay], ['day', 'LESS_THAN_OR_EQUAL', toDay]], 'day')
    .forEach(function (b) {
      if (!b.day) return;
      var t = b.at ? new Date(b.at).getTime() : 0;
      if (!by[b.day] || t >= by[b.day]._t) { b._t = t; by[b.day] = b; }
    });
  return Object.keys(by).sort().map(function (d) { return by[d]; });
}
/* The balances as filings of 'owner-bank', the shape filedBetween_ gives —
   from fromDay up to, not including, toDay */
function bankBetween_(fromDay, toDay) {
  return bankDocs_(fromDay, addDays_(toDay, -1)).map(bankFiling_);
}
function bankFiling_(b) {
  var f = { bank_total: b.total };
  BANK_ACCOUNTS_.forEach(function (a) { f[a.field] = b[a.id]; });
  f.given_by = b.by === 'chairman' ? 'the Chairman, on WhatsApp' : 'the owner, on WhatsApp';
  return { person: 'owner', report: BANK_REPORT_, by: b.by || 'owner', at: b.at ? new Date(b.at) : dayStart_(b.day),
           day: b.day, fields: f, flags: [], text: '' };
}
/* readers handed a list of filings get the balances of the same days */
function withBank_(filings, fromDay, toDay) {
  return (filings || []).concat(bankBetween_(fromDay, toDay));
}

/* What Selam's transactions did to the four banks, from one daily report:
   null for a report with no list of transactions (one from before 16 Oct) */
function bankNet_(v) {
  v = v || {};
  if (String(v.tx_any || '') === 'no') return { into: 0, out: 0, deposited: 0, drawn: 0, net: 0 };
  if (v.tx_list == null) return null;
  var r = { into: 0, out: 0, deposited: 0, drawn: 0 };
  rows_(v.tx_list).forEach(function (x) {
    if (!x) return;
    var a = n_(x.amount);
    if (!a) return;
    var bankFrom = BANK_IDS_.indexOf(x.via) >= 0, bankTo = BANK_IDS_.indexOf(x.via2) >= 0;
    if (x.dir === 'in' && bankFrom) r.into += a;
    else if (x.dir === 'out' && bankFrom) r.out += a;
    else if (x.dir === 'move' && x.via === 'cash' && bankTo) r.deposited += a;
    else if (x.dir === 'move' && bankFrom && x.via2 === 'cash') r.drawn += a;
  });
  r.net = r.into - r.out + r.deposited - r.drawn;
  return r;
}

/* The balance of `day` against the one before it and Selam's transactions in
   between, from a list of filings that holds both (owner-bank and
   betty-daily). null when there is no balance that day. */
function bankCheck_(day, filings) {
  var bank = {}, sel = {};
  (filings || []).forEach(function (f) {
    var d = f.day || (f.at ? dayOf_(f.at) : '');
    var box = f.report === BANK_REPORT_ ? bank : f.report === 'betty-daily' ? sel : null;
    if (!d || !box) return;
    var t = f.at ? new Date(f.at).getTime() : 0;
    if (!box[d] || t >= box[d].t) box[d] = { t: t, v: f.fields || {} };
  });
  if (!bank[day]) return null;
  var given = a_(bank[day].v, 'bank_total');
  if (given === null) return null;
  var before = Object.keys(bank).filter(function (d) { return d < day && a_(bank[d].v, 'bank_total') !== null; }).sort().pop() || null;
  var r = { day: bankDayWord_(day), balance_given: given };
  if (!before) { r.note = 'the first balance given — nothing before it to check against'; return r; }
  r.balance_before = a_(bank[before].v, 'bank_total');
  r.before_day = bankDayWord_(before);
  var into = 0, out = 0, dep = 0, drawn = 0, missing = [];
  for (var d = addDays_(before, 1); d <= day; d = addDays_(d, 1)) {
    var n = sel[d] ? bankNet_(sel[d].v) : null;
    if (!n) { if (sel[d] || !closed_(d)) missing.push(bankDayWord_(d)); continue; }
    into += n.into; out += n.out; dep += n.deposited; drawn += n.drawn;
  }
  r.into_the_banks = into; r.out_of_the_banks = out;
  r.cash_taken_to_the_bank = dep; r.cash_drawn_from_the_bank = drawn;
  if (missing.length) { r.not_checked_yet = 'Selam’s transactions are not in for ' + missing.join(', '); return r; }
  r.expected = Math.round((r.balance_before + into - out + dep - drawn) * 100) / 100;
  r.difference = Math.round((given - r.expected) * 100) / 100;
  r.matches = Math.abs(r.difference) < 1;
  return r;
}
/* the check in one line, for WhatsApp */
function bankCheckSay_(r) {
  if (!r) return '';
  if (r.note) return 'Check: ' + r.note + '.';
  var f = r.before_day + ' ' + bankMoney_(r.balance_before) +
          ' + in ' + bankMoney_(r.into_the_banks) + ' − out ' + bankMoney_(r.out_of_the_banks) +
          (r.cash_taken_to_the_bank ? ' + cash banked ' + bankMoney_(r.cash_taken_to_the_bank) : '') +
          (r.cash_drawn_from_the_bank ? ' − cash drawn ' + bankMoney_(r.cash_drawn_from_the_bank) : '');
  if (r.not_checked_yet) return 'Check: not yet — ' + r.not_checked_yet + '.';
  if (r.matches) return 'Check ✓ ' + f + ' = ' + bankMoney_(r.expected) + ' — matches Selam’s transactions.';
  return '⚠ Check: ' + f + ' = ' + bankMoney_(r.expected) + ', but this balance is ' + bankMoney_(r.balance_given) + ' — ' +
         bankMoney_(Math.abs(r.difference)) + (r.difference > 0 ? ' more' : ' less') + ' than Selam’s transactions explain. Ask her.';
}

/* Selam's daily reports and the balances from `fromDay` to `day`, as filings */
function bankCheckFilings_(fromDay, day) {
  var sel = tryQuery_('reports', [['person', 'EQUAL', 'betty'],
                                  ['at', 'GREATER_THAN_OR_EQUAL', dayStart_(fromDay)],
                                  ['at', 'LESS_THAN', dayStart_(addDays_(day, 1))]], 'at')
    .filter(function (f) { return f.report === 'betty-daily' && f.at; })
    .map(function (f) { return { report: f.report, at: f.at, day: dayOf_(f.at), fields: f.values || {} }; });
  return sel.concat(bankBetween_(addDays_(fromDay, -30), addDays_(day, 1)));
}

/* A message that is a balance: read back, with the check, and kept for YES.
   {reply, action} — or null when the message is not a balance. */
function bankPropose_(text, who) {
  var p = bankParse_(text);
  if (!p) return null;
  var day = todayAddis_();
  if (p.yesterday) day = addDays_(day, -1);
  var rec = { day: day, cbe: null, awash: null, aby: null, zz: null, total: null, given: [], carried: {}, by: who };
  var lines = [];
  if (p.totalOnly) {
    rec.total = p.total;
    rec.given = ['total'];
    lines.push('Total ' + bankMoney_(rec.total) + ' Birr (no banks named)');
  } else {
    var before = bankDocs_(addDays_(day, -60), day).filter(function (b) { return b.day <= day; });
    var last = {};
    before.forEach(function (b) { BANK_IDS_.forEach(function (id) { if (b[id] !== null && b[id] !== undefined) last[id] = { v: Number(b[id]), day: b.day }; }); });
    var missing = [];
    BANK_ACCOUNTS_.forEach(function (a) {
      if (p.banks[a.id] != null) {
        rec[a.id] = p.banks[a.id];
        rec.given.push(a.id);
        lines.push(a.en + ' ' + bankMoney_(rec[a.id]));
      } else if (last[a.id]) {
        rec[a.id] = last[a.id].v;
        rec.carried[a.id] = last[a.id].day;
        lines.push(a.en + ' ' + bankMoney_(rec[a.id]) + ' — not in this message, kept from ' + bankDayWord_(last[a.id].day));
      } else missing.push(a.en);
    });
    if (missing.length) {
      return { reply: 'Not saved: no figure for ' + missing.join(', ') + ' yet. The first time, send all four banks, e.g.\n' +
                      'bank CBE 2,300,000 Awash 900,000 Abyssinia 1,200,000 ZamZam 3,000,000\n' +
                      'አልተቀመጠም፦ መጀመሪያ አራቱንም ባንኮች ይላኩ።' };
    }
    rec.total = Math.round(BANK_IDS_.reduce(function (s, id) { return s + rec[id]; }, 0) * 100) / 100;
    if (p.total !== null && Math.abs(p.total - rec.total) >= 1) {
      return { reply: 'Not saved: you wrote total ' + bankMoney_(p.total) + ', but the four banks add up to ' +
                      bankMoney_(rec.total) + '. Please send it again.\nአልተቀመጠም፦ ድምሩ አይገጥምም — እባክዎ እንደገና ይላኩ።' };
    }
    lines.push('Total ' + bankMoney_(rec.total) + ' Birr');
  }
  lines.push(rec.total < BANK_FLOOR_ ? '⚠ Below the 6,000,000 reserve by ' + bankMoney_(BANK_FLOOR_ - rec.total)
                                     : 'Above the 6,000,000 reserve ✓');
  var small = BANK_IDS_.filter(function (id) { return rec.given.indexOf(id) >= 0 && rec[id] > 0 && rec[id] < 10000; });
  if (small.length) lines.push('Note: ' + small.map(function (id) { return bankMoney_(rec[id]); }).join(', ') +
                               ' is very small — "1.2m" is 1,200,000.');
  /* the check, as it will stand once saved */
  var check = null;
  try {
    var fl = bankCheckFilings_(addDays_(day, -14), day).filter(function (f) { return !(f.report === BANK_REPORT_ && f.day === day); });
    fl.push(bankFiling_({ day: day, total: rec.total, cbe: rec.cbe, awash: rec.awash, aby: rec.aby, zz: rec.zz, by: who, at: new Date() }));
    check = bankCheck_(day, fl);
  } catch (e) { Logger.log('bank check: %s', e.message); }
  var say = bankCheckSay_(check);
  var action = { kind: 'bank', rec: rec, say: 'Bank balance ' + bankDayWord_(day) + ': ' + bankMoney_(rec.total) + ' Birr' };
  return {
    action: action,
    reply: 'Bank balance — ' + bankDayWord_(day) + (p.yesterday ? ' (yesterday)' : '') + ':\n' + lines.join('\n') +
           (say ? '\n\n' + say : '') +
           '\n\nReply YES to save it, or NO.\nለማስቀመጥ YES፣ ለመሰረዝ NO ይበሉ።'
  };
}

/* On YES (Wa.js waExecute_) */
function bankSave_(a) {
  var r = a.rec;
  var doc = { day: r.day, total: r.total, given: r.given || [], carried: r.carried || {}, by: r.by === 'chairman' ? 'chairman' : 'owner', via: 'whatsapp' };
  BANK_IDS_.forEach(function (id) { doc[id] = r[id] === undefined ? null : r[id]; });
  return fsCreateNow_('bank', doc, 'at');
}

/* The last balance given in a list of filings, bank by bank — for "Ask your
   AI" and WhatsApp: "How much is in CBE?" */
function bankLatestOf_(filings) {
  var hit = null;
  (filings || []).forEach(function (f) {
    if (f.report !== BANK_REPORT_) return;
    if (!hit || f.day > hit.day || (f.day === hit.day && f.at >= hit.at)) hit = f;
  });
  if (!hit) return null;
  var out = { day: dayLabel_(hit.day), given_by: hit.fields.given_by };
  BANK_ACCOUNTS_.forEach(function (a) { out[a.en] = a_(hit.fields, a.field); });
  out.total = a_(hit.fields, 'bank_total');
  out.below_the_6m_reserve = out.total !== null ? out.total < BANK_FLOOR_ : null;
  return out;
}

/* For the readers: the balance of the day read, the one before, the check */
function bankFacts_(d) {
  var all = (d.recent || []).concat(d.filed || []);
  var mine = null;
  all.forEach(function (f) { if (f.report === BANK_REPORT_ && f.day === d.day) mine = f; });
  var v = mine ? mine.fields : {};
  var by = {};
  BANK_ACCOUNTS_.forEach(function (a) { by[a.en] = a_(v, a.field); });
  var last = lastKnown_(d, [[BANK_REPORT_, 'bank_total']], BANK_FLOOR_);
  if (last) last.from = 'the owner, on WhatsApp';
  return {
    given_by: 'the owner on WhatsApp (from 16 Oct 2026 Selam no longer reports the bank balance)',
    balance_tonight: a_(v, 'bank_total'),
    by_bank: by,
    reserve_floor: BANK_FLOOR_,
    last_balance_given: last,
    balance_last_7_days: series_(d, BANK_REPORT_, 'bank_total'),
    check_against_selams_transactions: bankCheck_(d.day, all)
  };
}
