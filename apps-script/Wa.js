/* Klever — the Chairman on WhatsApp, and the customers who write there.

   The Chairman's choice, 7 Oct 2026. Klever's WhatsApp number (+251 95 776
   7472) is answered by a small agent on Railway (C:\Users\ewkena\AI\
   whatsapp-agent). It keeps no brain of its own for Klever's business: it
   carries each message here and carries the answer back.

   THE CHAIRMAN. His messages come here (doPost, kind 'wa-chairman') and are
   answered exactly as "Ask your AI" on his page answers (Ask.js): the same
   reports, the same rules, the same paid model — so nothing about the
   company's money goes through the agent's own free-tier model. The last
   few turns of the chat come with each message, so "and last week?" works.

   THE MORNING BRIEF. After the morning close writes the reading (runOn_ in
   Agents.js), the brief is sent to the agent, which sends it to his
   WhatsApp — at once if he wrote in the last 24 hours (WhatsApp's rule),
   otherwise the moment he next writes.

   THE CUSTOMERS. The AI no longer answers them. The agent hands each
   customer's message here (kind 'wa-customer'); it is posted in the
   "WhatsApp customers" room for Ephrata, Tsega and Biruktayet, with a
   notification to their phones, and they call the customer back.

   WHO MAY CALL THIS. The web app's address is public, so each post carries a
   secret shared with the agent. The secret cannot sit in this public
   repository or in a phone: it is the document config/wa, which only the
   script's own account can read (firestore.rules), set once by the owner. */

var WA_TEXT_MAX_ = 2000;           /* characters of one message from him */
var WA_DAILY_CAP_ = 150;           /* his messages a day, to protect the credit */
var WA_HISTORY_MAX_ = 8;           /* earlier turns handed over with a question */
var WA_SALES_ = ['ephrata', 'tsega', 'biruktayet'];

/* the shared secret and the agent's address, read once every ten minutes */
function waConfig_() {
  var cache = CacheService.getScriptCache();
  var c = cache.get('wa-config');
  if (c) return JSON.parse(c);
  var d = fsGet_('config/wa') || {};
  var out = { secret: String(d.secret || ''), url: String(d.agentUrl || '').replace(/\/+$/, '') };
  cache.put('wa-config', JSON.stringify(out), 600);
  return out;
}

/* the same length of time whether the first or the last character differs */
function waSame_(a, b) {
  a = String(a); b = String(b);
  if (!a || a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* From doPost, before anything about sign-in tokens: the agent has none. */
function waPost_(row) {
  var cfg;
  try { cfg = waConfig_(); }
  catch (e) { Logger.log('wa config: %s', e.message); return 'refused'; }
  if (!cfg.secret || !waSame_(row.secret, cfg.secret)) return 'refused';
  var out;
  if (row.kind === 'wa-chairman') out = waChairman_(row);
  else if (row.kind === 'wa-customer') out = waCustomer_(row);
  else return 'refused';
  return JSON.stringify(out);
}

/* ---------------------------------------------------------------- *
 *  The Chairman                                                      *
 * ---------------------------------------------------------------- */

var WA_SORRY_ = 'The reports could not answer just now. Please try again in a minute.\n' +
                'ሪፖርቶቹ አሁን መመለስ አልቻሉም። እባክዎ ከአንድ ደቂቃ በኋላ እንደገና ይሞክሩ።';

function waChairman_(row) {
  var text = String(row.text || '').trim().substring(0, WA_TEXT_MAX_);
  if (!text) return { ok: true, reply: 'Write your question about the reports, the banks or the team.' };
  var day = todayAddis_();
  var cache = CacheService.getScriptCache();
  var capKey = 'wa:' + day;
  var n = Number(cache.get(capKey) || 0);
  if (n >= WA_DAILY_CAP_) {
    return { ok: true, reply: 'That is ' + WA_DAILY_CAP_ + ' questions today. Ask again tomorrow, or use your page.' };
  }
  cache.put(capKey, String(n + 1), 86400);

  var reply, ok = true;
  try {
    if (/^\s*(brief|the brief|ብሪፍ|ማጠቃለያ)\s*[.!?]?\s*$/i.test(text)) reply = waLastBrief_();
    else reply = waAnswer_(text, row.history, row.customers, day);
  } catch (e) {
    Logger.log('wa chairman: %s', e.message);
    ok = false;
    reply = WA_SORRY_;
  }
  if (/^\((no answer|could not read)/.test(reply || '')) { ok = false; reply = WA_SORRY_; }
  waLog_('Chairman', text, reply);
  return { ok: ok, reply: reply };
}

/* His question, with the chat so far, through the same door as his page */
function waAnswer_(text, history, customers, day) {
  var turns = (Array.isArray(history) ? history : []).slice(-WA_HISTORY_MAX_).map(function (h) {
    var who = h && h.role === 'assistant' ? 'You' : 'Chairman';
    return who + ': ' + String((h && h.text) || '').substring(0, 600);
  });
  var q = turns.length
    ? 'Earlier in this WhatsApp chat, oldest first:\n' + turns.join('\n') + '\n\nHis new message: ' + text
    : text;
  var ctx = askContext_(day);
  /* the customers who wrote to the WhatsApp number, as the agent holds them */
  if (customers) ctx.whatsapp_customers = String(customers).substring(0, 20000);
  var prompt = askPrompt_(q, ctx) + '\n\n' + [
    'This answer is sent to his WhatsApp. Plain text: no headings, no tables, no links.',
    'whatsapp_customers is the list of customers who wrote to Klever’s WhatsApp number, from the agent’s',
    'own records; use it for questions about them.'
  ].join('\n');
  return aiAsk_(prompt, 2500);
}

/* "brief": the last one written, with its day */
function waLastBrief_() {
  var rows = tryQuery_('analysis', [], null)
    .filter(function (a) { return !a.provisional; })
    .sort(function (a, b) { return String(b.day).localeCompare(String(a.day)); });
  var a = rows[0];
  var b = a && (a.findings || []).filter(function (f) { return f.id === 'brief'; })[0];
  if (!b || !b.text) return 'There is no brief yet. The next one comes after the morning close, about 6:45.';
  return waBriefText_(a.dayLabel || a.day, b.text);
}

function waBriefText_(dayLabel, text) {
  return 'Klever brief — ' + dayLabel + '\n\n' + String(text).trim() +
         '\n\nAsk me anything about the reports, the banks or the team.';
}

/* Each question and answer kept on the Sheet, where he can read them back */
function waLog_(who, text, reply) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('WhatsApp');
    if (!sh) {
      sh = ss.insertSheet('WhatsApp');
      sh.appendRow(['At', 'From', 'Message', 'Answer']);
      sh.setFrozenRows(1);
    }
    sh.appendRow([new Date(), who, cell_(String(text)), cell_(String(reply || '').substring(0, 5000))]);
  } catch (e) {
    Logger.log('wa log: %s', e.message);
  }
}

/* The morning brief, after the morning close — never in the way of it. */
function waSendBrief_(results, d) {
  try {
    var cfg = waConfig_();
    if (!cfg.url || !cfg.secret) return;
    var b = (results || []).filter(function (r) { return r.id === 'brief'; })[0];
    if (!b || !b.text) return;
    var res = UrlFetchApp.fetch(cfg.url + '/internal/brief', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { 'X-Klever-Secret': cfg.secret },
      payload: JSON.stringify({ day: d.day, text: waBriefText_(d.dayLabel || d.day, b.text) })
    });
    Logger.log('wa brief: HTTP %s %s', res.getResponseCode(), res.getContentText().substring(0, 200));
  } catch (e) {
    Logger.log('wa brief: %s', e.message);
  }
}

/* ---------------------------------------------------------------- *
 *  The customers                                                     *
 * ---------------------------------------------------------------- */

function waCustomer_(row) {
  var phone = String(row.phone || '').replace(/[^0-9]/g, '');
  if (phone.length < 6 || phone.length > 15) return { ok: false, error: 'bad phone' };
  var name = String(row.name || '').replace(/\s+/g, ' ').trim().substring(0, 80);
  var text = String(row.text || '').trim().substring(0, 3500) || '(sent something that is not text)';
  /* one customer cannot fill the room: forty messages an hour, then quiet */
  var cache = CacheService.getScriptCache();
  var k = 'wac:' + phone + ':' + Utilities.formatDate(new Date(), 'GMT', 'yyyyMMddHH');
  var n = Number(cache.get(k) || 0);
  if (n >= 40) return { ok: true, skipped: true };
  cache.put(k, String(n + 1), 3700);

  fsCreateNow_('channels/customers/messages', { who: 'whatsapp', text: text, name: name, phone: phone }, 'at');
  /* the first message from someone in an hour rings the three phones; the rest arrive quietly */
  if (n === 0) {
    WA_SALES_.forEach(function (p) {
      try {
        pushTo_(p, 'WhatsApp customer · ' + (name || '+' + phone), text.substring(0, 160), 'wa-' + phone, 'chat.html');
      } catch (e) { Logger.log('wa push %s: %s', p, e.message); }
    });
  }
  return { ok: true };
}

/* A new document whose time field is the server's own clock — what the rules
   ask of anything that says when it was written. */
function fsCreateNow_(collectionPath, obj, timeField) {
  var base = fsBase_();
  var id = Utilities.getUuid().replace(/-/g, '').substring(0, 20);
  var fields = {};
  Object.keys(obj).forEach(function (k) { fields[k] = fsEncode_(obj[k]); });
  var res = UrlFetchApp.fetch(base + '/documents:commit', {
    method: 'post', contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + fsToken_() },
    muteHttpExceptions: true,
    payload: JSON.stringify({ writes: [{
      update: { name: base.replace(/^https:\/\/firestore\.googleapis\.com\/v1\//, '') +
                      '/documents/' + collectionPath + '/' + id, fields: fields },
      currentDocument: { exists: false },
      updateTransforms: [{ fieldPath: timeField, setToServerValue: 'REQUEST_TIME' }]
    }] })
  });
  if (res.getResponseCode() !== 200) {
    throw new Error('Could not write ' + collectionPath + ' (HTTP ' + res.getResponseCode() + '): ' +
                    res.getContentText().substring(0, 300));
  }
  return id;
}
