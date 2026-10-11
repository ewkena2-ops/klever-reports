/* THE LEADS AND JOBS FROM THE KLEVER KITCHEN BOT (the Chairman, 11 Oct 2026:
   "are you sure you can track the projects and leads?" — no: the register
   knew 18 of the bot's 311 leads and 28 of its 63 jobs, because it only
   knew what someone wrote in a daily report. "Set it up yourself.")

   The bot keeps every lead from the first message: its 4-digit number, the
   customer, the salesperson, the measurement, the quotation, the deposit and
   the KK code. Its database has one door for this site
   (public.klever_report_feed on the bot's Supabase project): it reads only,
   gives no phone numbers or emails, and answers only to the secret code kept
   in /config/botfeed {url, key, token} — never in this public repository.

   Each morning (and once, the first time the watch sees it is due) the feed
   is turned into register lines, the same kind every report gives
   (Register.js regEventsOf_), and kept in /regEvents/bot_feed — replaced
   each time, so the bot's current picture is what stands. The reports keep
   adding what the bot never knows: the factory, the store, the site.

   What is left out: a lead the bot closed with no job (lost — counted, not
   listed), and the old jobs imported into the bot on 12 May and every job
   before KK-137: all finished, the Chairman said on 11 October. His word on
   each job from KK-137 on, given the same day, is kept once in
   /regEvents/seed_chairman_2026-10-11: finished jobs leave the table,
   delivered ones stand on site, those in production in production. */

var BOT_SALES_ = { bruktawit: 'Biruktayet Kassahun', biruktayet: 'Biruktayet Kassahun', tsega: 'Tsega Girma',
                   epherata: 'Ephrata Assfa', ephrata: 'Ephrata Assfa', abigiya: 'Abigiya' };
var BOT_OLD_BEFORE_ = 137;          /* KK-136 and before: finished, said the Chairman */
var BOT_IMPORTED_DAY_ = '2026-05-12';

/* "09/10/2026", "9/10/2026, 10:40", "2026-10-09T07:12:00Z" → the Addis day */
function botDay_(s) {
  var t = String(s == null ? '' : s).trim();
  if (!t) return '';
  var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(t);
  if (m) {
    var d = m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
    return regDate_(d);
  }
  var x = new Date(t);
  return isNaN(x.getTime()) ? '' : dayOf_(x);
}
function botNum_(s) { var x = Number(String(s == null ? '' : s).replace(/[^0-9.\-]/g, '')); return isNaN(x) ? null : x; }
function botKk_(s) {
  var j = regJob_(s || '');
  return /^KK-\d+$/.test(j) ? j : '';
}
function botKkNo_(j) { var m = /^KK-(\d+)$/.exec(j || ''); return m ? Number(m[1]) : null; }

/* The feed, as the bot's door gives it. Throws if it cannot be read. */
function botFeedFetch_() {
  var cfg = fsGet_('config/botfeed');
  if (!cfg || !cfg.url || !cfg.key || !cfg.token) throw new Error('/config/botfeed is not set');
  var res = UrlFetchApp.fetch(cfg.url, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { apikey: cfg.key },
    payload: JSON.stringify({ p_token: cfg.token })
  });
  if (res.getResponseCode() !== 200) {
    throw new Error('the bot’s feed answered HTTP ' + res.getResponseCode() + ': ' + res.getContentText().substring(0, 200));
  }
  var feed = JSON.parse(res.getContentText());
  if (!feed || !feed.leads) throw new Error('the bot’s feed refused the code (is /config/botfeed’s token the one the bot knows?)');
  return feed;
}

/* The feed as register lines. Pure: the test runs it on a made-up feed. */
function botEvents_(feed) {
  var out = [], counts = { leads: 0, lost: 0, old: 0, jobs: 0, payments: 0 };
  var leads = feed.leads || [];
  var kkOfLead = {}, leadOfKk = {};
  leads.forEach(function (l) {
    var kk = botKk_(l.kk);
    if (kk && l.id) { kkOfLead[l.id] = kk; leadOfKk[kk] = l.id; }
  });
  var proj = {};
  (feed.projects || []).forEach(function (p) { var kk = botKk_(p.kk); if (kk) proj[kk] = p; });
  /* the quotation of a lead: its approval dates, or the day its options went up */
  var quote = {};
  (feed.approvals || []).forEach(function (a) {
    if (!a.id) return;
    var day = botDay_(a.client) || botDay_(a.mm);
    if (day) quote[a.id] = { day: day, value: botNum_(a.total) };
  });
  (feed.options || []).forEach(function (o) {
    if (!o.id || quote[o.id]) return;
    var day = botDay_(o.at);
    if (day && (!quote[o.id] || day < quote[o.id].day)) quote[o.id] = { day: day, value: botNum_(o.total) };
  });
  /* the money in, by job */
  var pays = {};
  (feed.payments || []).forEach(function (p) {
    var raw = String(p.p || '').trim();
    var kk = /^\d{1,4}$/.test(raw) ? kkOfLead[('000' + raw).slice(-4)] : botKk_(raw);
    var day = botDay_(p.day);
    if (!kk || !day) return;
    (pays[kk] = pays[kk] || []).push({ type: String(p.type || ''), amount: botNum_(p.amount), day: day });
  });
  var oldJob = function (kk) {
    var n = botKkNo_(kk);
    return n != null && n < BOT_OLD_BEFORE_;
  };
  leads.forEach(function (l) {
    var id = String(l.id || '').trim();
    if (!/^\d{4}$/.test(id)) return;
    var kk = kkOfLead[id] || '';
    var added = botDay_(l.added);
    if ((added === BOT_IMPORTED_DAY_ && kk) || (kk && oldJob(kk))) { counts.old++; return; }
    if (String(l.status || '') === 'Closed' && !kk) { counts.lost++; return; }
    var name = String(l.name || '').trim() || ('Lead ' + id);
    var who = BOT_SALES_[String(l.sales || '').toLowerCase().trim()] ||
              (l.sales ? String(l.sales).charAt(0).toUpperCase() + String(l.sales).slice(1) : '');
    var base = function (k, day) {
      var e = { k: k, day: day, person: 'bot', lead: id, cust: name, src: 'bot' };
      if (who) e.who = who;
      return e;
    };
    counts.leads++;
    var first = added || botDay_(l.measured_at) || (quote[id] && quote[id].day) || '';
    if (!first) return;
    out.push(base('lead', first));
    var measured = l.measured ? (botDay_(l.measured_at) || '') : '';
    if (l.measured) out.push(base('predesign', measured || first));
    if (quote[id]) {
      var q = base('quote', quote[id].day);
      if (quote[id].value != null) q.value = quote[id].value;
      out.push(q);
    }
    if (!kk) return;
    /* the job: signed on its first verified advance, or its deposit day */
    counts.jobs++;
    var p = proj[kk] || {}, money = (pays[kk] || []).slice().sort(function (a, b) { return a.day < b.day ? -1 : 1; });
    var adv = money.filter(function (m) { return m.type === 'advance'; });
    var signed = (adv[0] && adv[0].day) || botDay_(p.deposit_day) || (quote[id] && quote[id].day) || first;
    var c = base('contract', signed);
    c.job = kk;
    if (botNum_(p.revenue) != null) c.value = botNum_(p.revenue);
    out.push(c);
    money.forEach(function (m) {
      if (m.type !== 'advance' && m.type !== 'final') return;
      counts.payments++;
      var e = base(m.type, m.day);
      e.job = kk;
      if (m.amount != null) e.amount = m.amount;
      out.push(e);
    });
    /* no verified payment line, but the project says the deposit was checked */
    if (!adv.length && p.deposit && botDay_(p.deposit_day)) {
      var e2 = base('advance', botDay_(p.deposit_day)); e2.job = kk; out.push(e2);
    }
    if (p.final_measure) {
      var e3 = base('measure', botDay_(p.design_day) || signed); e3.job = kk; e3.ok = 'yes'; out.push(e3);
    }
    if (p.installed) {
      var e4 = base('accepted', botDay_(p.updated) || signed); e4.job = kk; out.push(e4);
    }
  });
  return { events: out, counts: counts };
}

/* The Chairman's word on each job, 11 Oct 2026 (one by one, in this chat
   with his office): kept once as register lines of that day. */
var BOT_SEED_DAY_ = '2026-10-11';
/* from klever-kit/live/kk_status_2026-10-11.txt: 75 finished, 7 delivered or
   installing, 4 in production; the 23 not started yet are left as the bot
   and the reports show them */
var BOT_SEED_ = {
  finished: [31, 38, 61, 66, 67, 68, 69, 81, 87, 96, 101, 103, 105, 108, 109, 110, 111, 112, 114, 115, 116, 117, 118,
             119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 137, 138, 139, 140,
             142, 143, 144, 145, 147, 148, 151, 152, 153, 159, 162, 163, 164, 168, 170, 171, 172, 174, 178, 179, 181,
             182, 183, 184, 185, 186, 190, 191, 192, 196, 201],
  site: [141, 146, 149, 156, 167, 176, 180],
  production: [154, 155, 160, 188]
};
function botSeedEvents_(extra) {
  var out = [];
  var add = function (k, n, state) {
    var e = { k: k, day: BOT_SEED_DAY_, person: 'chairman', job: 'KK-' + n, src: 'chairman' };
    if (state) e.state = state;
    out.push(e);
  };
  var seed = extra || BOT_SEED_;
  (seed.finished || []).forEach(function (n) { add('finished', n); });
  (seed.site || []).forEach(function (n) { add('site', n, ''); });
  (seed.production || []).forEach(function (n) { add('production', n, ''); });
  return out;
}

/* Read the bot and keep its lines; the register is built again by the caller. */
function botFeedRefresh_() {
  var feed = botFeedFetch_();
  var got = botEvents_(feed);
  fsPut_('regEvents/bot_feed', { report: 'bot', day: todayAddis_(), at: new Date(), person: 'bot',
                                 events: got.events, counts: got.counts, feedAt: String(feed.at || '') });
  /* the Chairman's word, once */
  var seedId = 'regEvents/seed_chairman_' + BOT_SEED_DAY_;
  var had = null;
  try { had = fsGet_(seedId); } catch (e) { had = null; }
  if (!had) fsPut_(seedId, { report: 'chairman', day: BOT_SEED_DAY_, at: new Date(), person: 'chairman', events: botSeedEvents_() });
  return got.counts;
}

/* From the watch and the morning: once a day, then the register again. */
function botFeedIfDue_(from) {
  var today = todayAddis_();
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('BOTFEED_DAY') === today) return null;
  /* one try an hour: a feed that fails is not asked every ten minutes */
  var hour = today + 'T' + Utilities.formatDate(new Date(), 'Africa/Addis_Ababa', 'HH');
  if (props.getProperty('BOTFEED_TRY') === hour) return null;
  props.setProperty('BOTFEED_TRY', hour);
  var c = botFeedRefresh_();
  props.setProperty('BOTFEED_DAY', today);
  registerBuild_(today, false);
  Logger.log('bot feed (%s): %s', from || '', JSON.stringify(c));
  return c;
}
