/* Klever — the Chairman gives an order; the AI finds who does it.

   HOW AN ORDER TRAVELS
   He writes it on his page, in a sentence, in English or Amharic. The page
   puts it in /orders/{id} (the rules let only him write one, and only as
   "asked") and posts the id to this script's web app with his sign-in token
   (Code.js doPost, kind 'order'). The script reads the order back from
   Firestore — what he wrote there, not whatever arrived in the post — and
   asks the model who is responsible, using each person's duties from their
   signed letter (ORDER_DUTIES_). The model answers with tasks: who, what, by
   when, and why it is theirs. The code checks every task — a real person
   with an account, a real date that is not past and not a Sunday — and
   writes the plan onto the order. If the model cannot tell who should do
   it, it asks him one question instead of guessing.

   NOTHING IS SENT FROM HERE. His page shows the plan; he can change the
   person, the words or the date, or take a task out, and only when he
   presses Send does the page write the instructions — the same ones he can
   give by hand, which sit on the person's home page until they close them
   with a note, and go into his morning brief when overdue. An order with a
   wrong person or a wrong date, sent in his name to someone judged on it, is
   worse than one more tap.

   If the post never arrives, the ten-minute watch plans any order still
   waiting after two minutes (planWaiting_). */

var ORDER_DAILY_CAP_ = 60;
var ORDER_MAX_TASKS_ = 6;
var ORDER_FALLBACK_AFTER_MS_ = 2 * 60 * 1000;
var ORDER_DEFAULT_DAYS_ = 2;              /* working days, when he gives no time */

/* Who can be given a task — the people with an account — and what each one
   is responsible for, from their own signed letter. Someone without an
   account (a production worker, an assembler, the cleaner) is reached
   through the supervisor named in `covers`. Keep this in step with the
   letters and with CHAT_ACCOUNTS in js/channels.js. */
var ORDER_DUTIES_ = {
  /* Klever-Ephrata-Commercial-Lead-Terms (Amendment 1, 17 Sep 2026) */
  ephrata: { reportsTo: null, duties: [
    'the Sales and Design teams (the salespeople and the five designers)',
    'customer leads, site-visit booking and quotations within 48 hours',
    'discounts within her window and the 6,000 Birr/m² margin floor',
    'checking each Job File before it goes to Mahelet',
    'every customer WhatsApp group: templates, answers within 2 hours, commercial escalations',
    'social media (3 posts a week, the content calendar) and leads by channel',
    'the 4-week rolling sales projection and the commercial and marketing reports'],
    covers: [] },
  /* Klever-Mahelet-Operations-Lead-Terms */
  liu: { reportsTo: null, duties: [
    'operations as a whole: production, the store, purchasing, quality control, site and logistics',
    'starting production and releasing deliveries — only after Finance clears them',
    'approving material issues from the store, and telling Getachew what to buy',
    'the 15-day production plan; accepting or rejecting Job Files',
    'the 40 m² a day target, waste at most 20%, machine breakdowns',
    'operations messages to customers on WhatsApp',
    'delivery orders, signed with Alex (logistics)'],
    covers: ['Alex (logistics, no account)'] },
  /* Klever-Selam-Finance-Officer-Terms */
  betty: { reportsTo: null, duties: [
    'customer payments: final payment requests, confirming payments, refunds (only with the Chairman’s written approval)',
    'creating the Job File and the customer WhatsApp group once the advance is in',
    'the cashbook, same-day banking, reconciliations, petty cash, utility bills, canteen payments, ZamZam Bank transfers',
    'approving purchases up to 50,000 Birr (Kidan above that)',
    'cash-flow forecasts, the 6,000,000 Birr reserve, the monthly close, the tax calendar',
    'reserving and releasing assembler pay',
    'the Job Tracking Board, the payment-confirmed job list, the Customer Pulse and Customer Experience reports',
    'the cleaner (showroom, office, toilets, common areas)'],
    covers: ['the cleaner', 'Kidan (Group Finance Controller) and the accountant are reached through her'] },
  /* Selam's letter §2 — what she may hand to her assistant */
  seble: { reportsTo: 'betty', duties: [
    'Customer Pulse monitoring and the report draft',
    'moving Job Tracking Board cards after Selam checks them',
    'filing; collecting supplier invoices; petty-cash and pre-numbered receipts',
    'data entry for the advance, assembler and ZamZam registers; utility bills; the canteen weekly report',
    'chasing missing documents',
    'she may not approve payments, sign cheques, handle cash, create Job Files or send final payment requests'],
    covers: [] },
  /* Klever-Getachew-Purchasing-Officer-Terms */
  getachew: { reportsTo: 'liu', duties: [
    'buying: purchase requests per job with job code, material codes, quantities and 3 quotes',
    'placing orders and ZamZam cheques once Selam approves and confirms the funds',
    'following up supplier deliveries; the approved-supplier list',
    'reporting supplier delays, price changes and quality problems; replacing rejected materials',
    'purchase documents to Selam within 24 hours'],
    covers: [] },
  /* Klever-Yordanos-Storekeeper-Terms */
  yordanos: { reportsTo: 'liu', duties: [
    'receiving deliveries and checking them against the Job File and BOM; rejecting with photos',
    'stock records every day and the Saturday stock count',
    'issuing materials — only with Mahelet’s signed approval',
    'factory consumables (30,000 Birr a month)',
    'store security, theft reports and shortage warnings'],
    covers: [] },
  /* Klever-Amaha-Production-Supervisor-Terms */
  amaha: { reportsTo: 'liu', duties: [
    'the factory floor: the production workers and machine operators, their daily tasks, sign-in, discipline, safety gear',
    'output of 40 m² a day and waste at most 20%; material use against the BOM; offcut and scrap sorting',
    'the three in-process quality checks (after cutting, after assembly, before delivery)',
    'the machines: inspection, breakdowns reported within 30 minutes, maintenance',
    'factory cleaning and 5S (the factory, machines and tools)',
    'Rovestone work, logged separately'],
    covers: ['the 22 production workers and machine operators'] },
  /* Klever-Wude-Quality-Control-Terms */
  wude: { reportsTo: 'liu', duties: [
    'the final inspection of every job: dimensions, colour and material codes, edges, joints, hardware, finish, accessories',
    'signing the quality release — only she does',
    'rejections with photos; the Rework Register and the monthly rework cost'],
    covers: [] },
  /* Klever-Elyas-Site-Supervisor-Terms and the Assembler Management Order */
  elyas: { reportsTo: 'liu', duties: [
    'installation and all work on site; site readiness and load checks',
    'agreeing delivery times with Alex and the customer',
    'the assemblers: training, contracts, discipline, the Monday meeting, assigning jobs',
    'the site material checklist; assembler payment slips (he does not pay them)',
    'the customer walk-through and acceptance signature; installation messages on WhatsApp',
    'returning materials and tools to the store'],
    covers: ['the assemblers', 'Ashenafi (site helper)'] },
  /* Klever-Ashenafi-Site-Helper-Terms */
  ashenafi: { reportsTo: 'elyas', duties: [
    'loading and securing transport; checking materials against the delivery note',
    'carrying and positioning; protecting customer property; cleaning the site',
    'checking for visible defects; photos of finished work; returning tools to the store',
    'he may not give orders to assemblers'],
    covers: [] },
  /* Klever-Tsega-Salesperson-Terms */
  tsega: { reportsTo: 'ephrata', duties: [
    'her own customers: leads contacted within an hour, measurement booked within 48 hours',
    'quotations and discounts within her window; customer approval of price changes',
    'collecting the 50% advance, issuing the receipt, banking it the same day and telling Selam',
    'chasing final payment when Finance asks; the follow-up call after 48 hours; referrals',
    'the 2,000,000 Birr weekly collection target'],
    covers: [] },
  /* Klever-Biruktayet-Salesperson-Terms */
  biruktayet: { reportsTo: 'ephrata', duties: [
    'her own customers: leads contacted within an hour, measurement booked within 48 hours',
    'quotations and discounts within her window; customer approval of price changes',
    'collecting the 50% advance, issuing the receipt, banking it the same day and telling Selam',
    'chasing final payment when Finance asks; the follow-up call after 48 hours; referrals',
    'the 2,000,000 Birr weekly collection target'],
    covers: [] }
};
/* Rovestone, the sister company (the Rovestone Internal Order Policy) */
ORDER_DUTIES_.frewoyni = { reportsTo: null, duties: [
  'Rovestone’s own operations — she is Rovestone’s Operations Lead, not Klever staff',
  'sending Klever Rovestone’s order requests: job, material codes, m², completion date, delivery site, drawings',
  'Rovestone’s side of an order: accepting Klever’s internal price, receiving deliveries, its own installers',
  'what Rovestone owes Klever, and paying it (50% before production, 50% on delivery)'],
  covers: ['Rovestone’s staff', 'Kalkidan (Rovestone General Manager, no account)'] };

/* Group Finance, over Klever and Rovestone (6 Oct 2026). From Klever's own
   letters: payments over 50,000 Birr go to Kidan for approval, and Selam,
   Mahelet and Ephrata address reports to Kidan. Kidan has no letter. */
ORDER_DUTIES_.kidan = { reportsTo: null, duties: [
  'group finance over Klever and Rovestone — Kidan is the Group Finance Controller, not Klever staff',
  'approving payments over 50,000 Birr that Selam sends up',
  'reading Selam’s daily, weekly, cash-flow and cash-forecast reports, Mahelet’s 15-day plan and Ephrata’s projection',
  'being told the same day of a cash discrepancy or a posting error'],
  covers: [] };

/* Meri Block Board and Real Estate & Construction (Lemi Kura), 6 Oct 2026:
   one account each, reporting for their company; no letter, not Klever staff */
ORDER_DUTIES_.meri = { reportsTo: null, duties: [
  'Meri Block Board’s own work — this account reports for Meri Block Board; not Klever staff',
  'what passes between Meri Block Board and Klever: orders, deliveries, materials and payments, either way',
  'Meri Block Board’s problems, and the decisions it needs from the Chairman'],
  covers: ['Meri Block Board’s staff'] };
ORDER_DUTIES_.lemikura = { reportsTo: null, duties: [
  'Real Estate & Construction’s work, its Lemi Kura project — this account reports for it; not Klever staff',
  'what passes between Real Estate & Construction and Klever: orders, deliveries, materials and payments, either way',
  'Real Estate & Construction’s problems, and the decisions it needs from the Chairman'],
  covers: ['Real Estate & Construction’s staff'] };

/* the six designers, one letter (Klever-Designer-Terms; Ermiyas, from 6 Oct
   2026, has none yet) — a task for "the designer" of a job goes to the one
   he names */
['yohannis', 'yonas', 'abrham-g', 'teklweld', 'abrham-w', 'ermiyas'].forEach(function (id) {
  ORDER_DUTIES_[id] = { reportsTo: 'ephrata', duties: [
    'the design of their own jobs: pre-measurement visit and video, 3D pre-design and rough quote',
    'final measurement after Selam’s go-ahead; final design with options; the signed Material Selection Form',
    'production drawings to Mahelet and Amaha; board and edge codes; price changes',
    'every design complaint on their jobs (they cannot pass it on)'],
    covers: [] };
});

/* From doPost, once it knows the Chairman sent it. */
function orderPost_(id) {
  if (!/^[A-Za-z0-9_-]{6,40}$/.test(String(id || ''))) return 'refused';
  try { return planOrder_(String(id)) ? 'ok' : 'nothing to plan'; }
  catch (e) { Logger.log('order %s: %s', id, e.message); return 'failed'; }
}

/* Plan one order, if it is still waiting. True if it was planned (or failed
   and said why), false if there was nothing to do. */
function planOrder_(id) {
  var d = fsGet_('orders/' + id);
  if (!d || d.status !== 'asked') return false;
  var cache = CacheService.getScriptCache();
  if (cache.get('order:' + id)) return false;          /* already being planned */
  cache.put('order:' + id, '1', 600);

  var day = todayAddis_();
  var out = { q: d.q, at: d.at, by: d.by, status: 'planned', tasks: [], question: '', why: '',
              model: '', error: '', plannedAt: new Date() };
  var capKey = 'orders:' + day;
  var n = Number(cache.get(capKey) || 0);
  if (n >= ORDER_DAILY_CAP_) {
    out.status = 'failed';
    out.error = 'Too many orders today (' + ORDER_DAILY_CAP_ + '). Give it by hand below, or try tomorrow.';
  } else {
    cache.put(capKey, String(n + 1), 86400);
    try {
      var b = brain_();
      if (!b.key) {
        out.status = 'failed';
        out.error = 'No model key is set in the script (GEMINI_KEY).';
      } else {
        var schedule = loadSchedule_();
        var reply = aiAsk_(orderPrompt_(d.q, orderContext_(day, schedule)), 2000);
        if (/^\((no answer|could not read)/.test(reply)) {
          out.status = 'failed';
          out.error = reply;
        } else {
          var plan = orderPlan_(reply, day, schedule);
          out.model = b.label;
          if (plan.error) { out.status = 'failed'; out.error = plan.error; }
          else if (!plan.tasks.length) { out.status = 'unclear'; out.question = plan.question; }
          else { out.tasks = plan.tasks; out.why = plan.dropped.join('; '); }
        }
      }
    } catch (e) {
      out.status = 'failed';
      out.error = String((e && e.message) || e).substring(0, 300);
    }
  }
  fsPut_('orders/' + id, out);
  return true;
}

/* The ten-minute watch's part: any order waiting more than two minutes —
   the post from his page never arrived. A few at a time. */
function planWaiting_() {
  try {
    var cutoff = new Date().getTime() - ORDER_FALLBACK_AFTER_MS_;
    tryQuery_('orders', [['status', 'EQUAL', 'asked']], null)
      .filter(function (d) { return d.at && d.at.getTime() < cutoff; })
      .slice(0, 5)
      .forEach(function (d) { planOrder_(d._id); });
  } catch (e) {
    Logger.log('planWaiting: %s', e.message);
  }
}

/* "Fri 9 Oct" */
function shortDay_(day) {
  return Utilities.formatDate(new Date(day + 'T12:00:00' + ADDIS_), tz_(), 'EEE d MMM');
}
/* the working day n working days after `day` (Sunday is nobody's day) */
function workingDaysOn_(day, n) {
  var d = day;
  while (n > 0) { d = addDays_(d, 1); if (dow_(d) !== 0) n--; }
  return d;
}

/* Everything the model is given: the calendar, who does what, and what is
   already open, so it does not hand out the same thing twice. */
function orderContext_(day, schedule) {
  var people = {};
  (schedule.people || []).forEach(function (p) { people[p.id] = p; });
  var who = Object.keys(ORDER_DUTIES_).filter(function (id) { return people[id]; }).map(function (id) {
    var p = people[id], o = ORDER_DUTIES_[id];
    return { id: id, name: p.en, role: p.roleEn, duties: o.duties,
             reports_to: o.reportsTo ? (people[o.reportsTo] || {}).en || o.reportsTo : 'the Chairman',
             also_reaches: o.covers || [] };
  });
  var cal = [];
  for (var i = 0; i <= 21; i++) {
    var d = addDays_(day, i);
    cal.push(Utilities.formatDate(new Date(d + 'T12:00:00' + ADDIS_), tz_(), 'EEEE d MMMM') + ' = ' + d +
             (dow_(d) === 0 ? ' (Sunday, closed)' : '') + (i === 0 ? ' (today)' : ''));
  }
  var open = [];
  try {
    tryQuery_('instructions', [['status', 'EQUAL', 'open']], null).slice(0, 60).forEach(function (x) {
      open.push({ to: (people[x.to] || {}).en || x.to, what: String(x.text || '').substring(0, 200), due: x.due });
    });
  } catch (e) { open = []; }
  return { today: day, todayLabel: dayLabel_(day), who: who, calendar: cal, open: open,
           defaultDue: workingDaysOn_(day, ORDER_DEFAULT_DAYS_) };
}

function orderPrompt_(q, ctx) {
  return [
    'You route the Chairman’s orders at Klever Küche, a kitchen cabinet maker in Addis Ababa, to the',
    'people responsible for them. Today is ' + ctx.todayLabel + '. Monday to Saturday are working days;',
    'Sunday is closed.',
    '',
    'THE CHAIRMAN’S ORDER: ' + q,
    '',
    'Turn it into tasks, one for each person who must act. Rules:',
    '- Give each task to the person whose duties below cover it, by their id. Use only the ids listed.',
    '  Someone with no account — a production worker, an assembler, the cleaner — is reached through',
    '  the person whose also_reaches names them.',
    '- Give it to the person who does the work, not to their manager. Give it to a manager (Mahelet,',
    '  Ephrata, Selam) only when it needs their decision, or work from several of their people.',
    '- One task per person: if one person must do two things for this order, put both in their task.',
    '- Write each task as the Chairman speaking to that person ("send me", "tell me"), in the language',
    '  of the order (Amharic if the order is in Amharic), one to three sentences. Keep every name, job',
    '  code, amount and date he gave. Do not add work he did not ask for.',
    '- due: the day he gave, as yyyy-mm-dd, read from the calendar below ("Friday" is the coming',
    '  Friday). If he gave no time, use ' + ctx.defaultDue + '. Never a Sunday, never before today.',
    '- why: one short line naming the duty that makes it this person’s.',
    '- A notice for a group (a meeting, an announcement for "everyone", "all commercial", "the',
    '  factory"): give it to each person of that group with an account when they are ' + ORDER_MAX_TASKS_ + ' or',
    '  fewer; when they are more, give it to the head of each part of the group instead (Ephrata',
    '  for sales and design, Mahelet for operations and the factory, Selam for finance and the store)',
    '  and tell each to pass it to their people. Never ask him who "everyone" is. A meeting needs',
    '  its time and who comes: if he gave neither, or no time, ask for what is missing in one question.',
    '- If you cannot tell who should do it, or what he wants done, give no tasks and ask him one short',
    '  question in the language of the order. Ask only what the order cannot be carried out without;',
    '  never ask again what he already answered (his answers follow “ — ” in the order).',
    '- If the same thing is already open for that person (below), still give the task, and say so in why.',
    '- At most ' + ORDER_MAX_TASKS_ + ' tasks.',
    '',
    'Answer with JSON only — no other words, no code fence:',
    '{"tasks":[{"to":"<id>","what":"<the instruction>","due":"yyyy-mm-dd","why":"<the duty>"}],"question":""}',
    'or, when you must ask: {"tasks":[],"question":"<your question>"}',
    '',
    'THE CALENDAR:',
    ctx.calendar.join('\n'),
    '',
    'WHO DOES WHAT (from each person’s signed letter):',
    JSON.stringify(ctx.who, null, 1),
    '',
    'ALREADY OPEN — instructions he gave that are not closed yet:',
    ctx.open.length ? JSON.stringify(ctx.open, null, 1) : 'none'
  ].join('\n');
}

/* The model's answer, checked in code. A task to someone who is not a
   person with an account, or with no words, is dropped and said; a date
   that is not a date, is past, or is too far off becomes the default; a
   Sunday moves to the Monday. Two tasks for one person become one. */
function orderPlan_(reply, day, schedule, opt) {
  /* his orders: at most ORDER_MAX_TASKS_, due in two working days if he gave
     no time; the AI's morning list (Team.js): more tasks, due today */
  var max = (opt && opt.max) || ORDER_MAX_TASKS_;
  var text = String(reply || '');
  var a = text.indexOf('{'), z = text.lastIndexOf('}');
  var j = null;
  if (a !== -1 && z > a) { try { j = JSON.parse(text.substring(a, z + 1)); } catch (e) { j = null; } }
  if (!j || typeof j !== 'object') return { error: 'The AI’s answer could not be read. Try again, or give it by hand below.' };
  var names = {};
  (schedule.people || []).forEach(function (p) { names[p.id] = p.en; });
  var latest = addDays_(day, 180), dflt = (opt && opt.dflt) || workingDaysOn_(day, ORDER_DEFAULT_DAYS_);
  var byPerson = {}, order = [], dropped = [];
  (Object.prototype.toString.call(j.tasks) === '[object Array]' ? j.tasks : []).forEach(function (t) {
    if (!t || typeof t !== 'object') return;
    var to = String(t.to || '').trim().toLowerCase();
    var what = String(t.what || '').trim();
    if (!ORDER_DUTIES_[to] || !names[to]) { if (to || what) dropped.push('a task for “' + String(t.to || '?').substring(0, 40) + '”, who has no account, was left out'); return; }
    if (!what) return;
    var due = String(t.due || '').trim();
    /* not a real day (31 February rolls over to March), past, or too far off */
    if (!/^\d{4}-\d{2}-\d{2}$/.test(due) || dayOf_(new Date(due + 'T12:00:00' + ADDIS_)) !== due ||
        due < day || due > latest) due = dflt;
    if (dow_(due) === 0) due = addDays_(due, 1);
    var why = String(t.why || '').trim().substring(0, 300);
    if (byPerson[to]) {
      var b = byPerson[to];
      /* numbered things (the AI's morning list) go on their own lines */
      var sep = /\n/.test(b.what + what) || /^\s*\d+[.)]\s/.test(what) ? '\n' : ' ';
      b.what = (b.what + sep + what).substring(0, 1000);
      if (due < b.due) b.due = due;
      return;
    }
    byPerson[to] = { to: to, name: names[to], what: what.substring(0, 1000), due: due, why: why };
    order.push(to);
  });
  var tasks = order.slice(0, max).map(function (k) { return byPerson[k]; });
  if (order.length > max) dropped.push((order.length - max) + ' more task(s) were left out — at most ' + max);
  var question = String(j.question || '').trim().substring(0, 500);
  if (!tasks.length && !question) question = 'Who should do this? The AI could not tell — say who, or give it by hand below.';
  return { tasks: tasks, question: tasks.length ? '' : question, dropped: dropped };
}
