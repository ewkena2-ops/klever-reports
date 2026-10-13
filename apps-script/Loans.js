/* Klever — the bank loans, so every AI that reads money knows them
   (the Chairman, 13 Oct 2026, with ZamZam Bank's two repayment schedules:
   "the AI have to know about this").

   WHERE THEY ARE. Not here: this code is public. Each loan is one document
   in /loans, written by the Chairman's account — the bank, the account,
   what was borrowed, the profit, and the bank's own schedule, payment by
   payment (due date, profit, principal, amount, what the bank shows settled).
   The rules let only the Chairman write them and only he and this script's
   account read them.

   WHAT IS PAID. A payment counts as paid when the bank's paper shows it
   settled, or when it is marked paid (`paidOn` on that payment). A payment
   past its date that is neither is not assumed paid: the readers say so and
   ask Selam to confirm it with the bank.

   WHO READS IT. loansFacts_ works out every figure here, in code; the
   Group CFO (every morning), the Sunday CFO, Ask, Get advice and the Sunday
   forecast / budget / risk specialists are handed the same block.        */

var LOANS_COLL_ = 'loans';
var LOANS_AHEAD_DAYS_ = 7;        /* "due this week": the Group CFO acts on these */
var LOANS_LIST_DAYS_ = 120;       /* the payments listed by date, about a quarter and a bit */

/* every loan on file, or [] (and the reason in the log) when it cannot be read */
var LOANS_CACHE_ = null;
function loansRead_() {
  if (LOANS_CACHE_) return LOANS_CACHE_;
  try { LOANS_CACHE_ = fsQuery_(LOANS_COLL_, []) || []; }
  catch (e) { Logger.log('loans: %s', e.message); return []; }
  return LOANS_CACHE_;
}

function loanPaid_(p) {
  return !!(p && (p.paidOn || (Number(p.settled) || 0) >= (Number(p.amount) || 0) - 1));
}
function loanTail_(acct) { var s = String(acct || ''); return s.length > 7 ? '…' + s.slice(-7) : s; }
function loanName_(L) { return (L.bank || 'Bank') + ' loan ' + loanTail_(L.account); }

/* The block every money reader is handed, for the day `today` (yyyy-mm-dd,
   the day being acted on). null when no loan is on file. `loans` may be
   passed in (tests, or a reader that already has them). */
function loansFacts_(today, loans) {
  loans = loans || loansRead_();
  if (!loans.length) return null;
  var r2 = function (x) { return Math.round(x * 100) / 100; };
  var all = [], per = [];
  loans.forEach(function (L) {
    var sched = (L.schedule || []).slice().sort(function (a, b) { return String(a.due) < String(b.due) ? -1 : 1; });
    var repaid = 0, left = 0, leftN = 0, next = null, profitLeft = 0;
    sched.forEach(function (p) {
      var amt = Number(p.amount) || 0, paid = loanPaid_(p);
      var row = { loan: loanName_(L), payment: (p.n || '') + ' of ' + sched.length, due: String(p.due),
                  birr: r2(amt), profit: r2(Number(p.profit) || 0), principal: r2(Number(p.principal) || 0), paid: paid,
                  paid_on: p.paidOn || null };
      all.push(row);
      if (paid) { repaid += amt; return; }
      left += amt; leftN++; profitLeft += Number(p.profit) || 0;
      if (!next && String(p.due) >= today) next = row;
    });
    per.push({
      loan: loanName_(L), bank: L.bank || '', product: L.product || '', borrower: L.borrower || '',
      borrowed: r2(Number(L.principal) || 0), profit_charged: r2(Number(L.profit) || 0), total_to_repay: r2(Number(L.total) || repaid + left),
      repaid_so_far: r2(repaid), left_to_repay: r2(left), payments_left: leftN, profit_still_in_what_is_left: r2(profitLeft),
      last_payment_due: sched.length ? dayLabel_(String(sched[sched.length - 1].due)) : null,
      next_payment: next ? { due: dayLabel_(next.due), birr: next.birr, profit: next.profit, principal: next.principal,
                             payment: next.payment, in_days: hrDaysBetween_(today, next.due) } : null
    });
  });
  var label = function (x) {
    return { loan: x.loan, payment: x.payment, due: dayLabel_(x.due), date: x.due, birr: x.birr, in_days: hrDaysBetween_(today, x.due) };
  };
  var unpaid = all.filter(function (x) { return !x.paid; }).sort(function (a, b) { return a.due < b.due ? -1 : a.due > b.due ? 1 : 0; });
  var week = addDays_(today, LOANS_AHEAD_DAYS_ - 1), list = addDays_(today, LOANS_LIST_DAYS_), year = addDays_(today, 364);
  var pastDue = unpaid.filter(function (x) { return x.due < today; });
  var soon = unpaid.filter(function (x) { return x.due >= today && x.due <= week; });
  var sum = function (xs) { return r2(xs.reduce(function (a, x) { return a + x.birr; }, 0)); };
  return {
    what: 'Klever’s bank financing, from the bank’s own repayment schedules. Each payment is profit plus principal, ' +
          'about every three months, paid from Klever’s bank accounts; it counts against the 6,000,000 floor like any money going out.',
    loans: per,
    due_within_7_days: soon.map(label), due_within_7_days_birr: sum(soon),
    next_payments_by_date: unpaid.filter(function (x) { return x.due >= today && x.due <= list; }).map(label),
    past_their_date_not_shown_paid: pastDue.map(label), past_their_date_birr: sum(pastDue),
    past_their_date_note: pastDue.length ? 'The bank’s schedule on file shows these not settled. Do not assume they were paid or missed: Selam must confirm with the bank.' : null,
    repayments_next_12_months_birr: sum(unpaid.filter(function (x) { return x.due >= today && x.due <= year; })),
    left_to_repay_all_loans_birr: sum(unpaid)
  };
}

/* The Group CFO's actions from the loans, as [who, do, why]: money ready
   for a payment due this week (and Kidan when it would take the bank below
   the floor), a payment missing from Selam's 7-day forecast, and a past
   payment nobody has confirmed. `bank` is the last bank total (or null),
   `forecast` Selam's latest {day, going_out} (or null). */
function loansActions_(facts, bank, floor, forecast) {
  var out = [];
  if (!facts) return out;
  (facts.past_their_date_not_shown_paid || []).forEach(function (x) {
    out.push(['betty', 'confirm with ' + x.loan.split(' loan')[0] + ' that the ' + x.due + ' loan payment of ' + fmt_(x.birr) + ' Birr was made',
              x.loan + ', payment ' + x.payment + ': the bank’s schedule on file shows it not settled']);
  });
  (facts.due_within_7_days || []).forEach(function (x) {
    out.push(['betty', 'have ' + fmt_(x.birr) + ' Birr ready in the ' + x.loan.split(' loan')[0] + ' account for the loan payment due ' + x.due,
              x.loan + ', payment ' + x.payment + (x.in_days === 0 ? ', due today' : ', in ' + x.in_days + ' day' + (x.in_days === 1 ? '' : 's'))]);
    if (bank !== null && bank !== undefined && bank - x.birr < floor) {
      out.push(['kidan', 'plan the ' + fmt_(x.birr) + ' Birr loan payment due ' + x.due + ' with Selam',
                'the bank was ' + fmt_(bank) + '; after it, ' + fmt_(bank - x.birr) + ' — below the ' + fmt_(floor) + ' floor']);
    }
    if (forecast && forecast.day && forecast.going_out !== null && forecast.going_out !== undefined) {
      var end = addDays_(forecast.day, 6), dueYmd = x.date;
      if (dueYmd && dueYmd >= forecast.day && dueYmd <= end && forecast.going_out < x.birr) {
        out.push(['betty', 'put the ' + fmt_(x.birr) + ' Birr loan payment due ' + x.due + ' in the 7-day forecast',
                  'her forecast of ' + dayLabel_(forecast.day) + ' has only ' + fmt_(forecast.going_out) + ' going out in all 7 days']);
      }
    }
  });
  return out;
}
