/* Klever — which model reads the day.

   Two are wired in and neither is torn out: Claude (Anthropic) and Gemini
   (Google). The Chairman chooses on his own page, which writes one document,
   /control/ai { provider: 'claude' | 'gemini' }. Each run reads that choice
   first; if it cannot, it falls back to the Script Property AI_PROVIDER, and
   then to Claude.

   A choice without a key does not stop the morning. If Claude is chosen and
   CLAUDE_KEY is not set, the run uses Gemini and says so in the email and on
   his page, and the other way round. Only with neither key does the reading
   go missing — the figures are still calculated either way, because the
   arithmetic was never the model's.

   SET UP: Project Settings -> Script Properties
     CLAUDE_KEY     your key from console.anthropic.com         (for Claude)
     CLAUDE_MODEL   defaults to claude-sonnet-5                  (optional)
     GEMINI_KEY     your key from aistudio.google.com            (for Gemini)
     GEMINI_MODEL   defaults to gemini-3.8-flash                 (optional)
     AI_PROVIDER    claude or gemini — used only if his page's
                    choice cannot be read                         (optional)
   Keys live in Script Properties and in Klever-Access-Codes.txt, never in
   this file: this file is in a public repository.                         */

var BRAIN_DEFAULT_CLAUDE = 'claude-sonnet-5';
var BRAIN_ANTHROPIC_VERSION = '2023-06-01';
var BRAIN_ = null;   /* resolved once per run */

/* Which model this run uses, and why. */
function brain_() {
  if (BRAIN_) return BRAIN_;
  var chosen = '';
  try {
    var res = UrlFetchApp.fetch(fsBase_() + '/documents/control/ai', {
      headers: { Authorization: 'Bearer ' + fsToken_() }, muteHttpExceptions: true
    });
    if (res.getResponseCode() === 200) {
      var d = fsDoc_(JSON.parse(res.getContentText()));
      chosen = String(d.provider || '').toLowerCase();
    }
  } catch (e) {
    Logger.log('Could not read the choice of model: %s', e.message);
  }
  if (chosen !== 'claude' && chosen !== 'gemini') chosen = String(prop_('AI_PROVIDER', 'claude')).toLowerCase();
  if (chosen !== 'claude' && chosen !== 'gemini') chosen = 'claude';

  var keys = { claude: prop_('CLAUDE_KEY', ''), gemini: prop_('GEMINI_KEY', '') };
  var use = chosen, note = '';
  if (!keys[use]) {
    var other = use === 'claude' ? 'gemini' : 'claude';
    if (keys[other]) {
      note = (use === 'claude' ? 'Claude' : 'Gemini') + ' was chosen but its key is not set, so ' +
             (other === 'claude' ? 'Claude' : 'Gemini') + ' read the day instead.';
      use = other;
    }
  }
  var model = use === 'claude' ? prop_('CLAUDE_MODEL', BRAIN_DEFAULT_CLAUDE)
                               : prop_('GEMINI_MODEL', AGENT_DEFAULT_MODEL);
  BRAIN_ = {
    chosen: chosen, provider: use, model: model, key: keys[use] || '', note: note,
    label: (use === 'claude' ? 'Claude' : 'Gemini') + ' (' + model + ')'
  };
  return BRAIN_;
}

/* One request, in the shape the chosen provider expects. */
function aiRequest_(prompt, maxTokens) {
  var b = brain_();
  if (b.provider === 'claude') {
    return {
      url: 'https://api.anthropic.com/v1/messages', method: 'post', contentType: 'application/json',
      muteHttpExceptions: true,
      headers: { 'x-api-key': b.key, 'anthropic-version': BRAIN_ANTHROPIC_VERSION },
      payload: JSON.stringify({
        model: b.model, max_tokens: maxTokens || 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    };
  }
  return {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/' + b.model +
         ':generateContent?key=' + encodeURIComponent(b.key),
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  };
}

/* The text of one reply, whichever provider wrote it. */
function aiRead_(res) {
  if (brain_().provider !== 'claude') return readReply_(res);
  if (!res || res.getResponseCode() !== 200) {
    var why = '';
    try { why = JSON.parse(res.getContentText()).error.message; } catch (e) {}
    return '(no answer — HTTP ' + (res ? res.getResponseCode() : '?') + (why ? ': ' + why : '') + ')';
  }
  try {
    var b = JSON.parse(res.getContentText());
    return (b.content || []).filter(function (c) { return c.type === 'text'; })
      .map(function (c) { return c.text; }).join('\n').trim();
  } catch (e) {
    return '(could not read the reply)';
  }
}

function aiAsk_(prompt, maxTokens) {
  var r = aiRequest_(prompt, maxTokens);
  var url = r.url;
  delete r.url;
  return aiRead_(UrlFetchApp.fetch(url, r));
}
function aiAskAll_(prompts, maxTokens) {
  return UrlFetchApp.fetchAll(prompts.map(function (p) { return aiRequest_(p, maxTokens); })).map(aiRead_);
}

/* For the emails and the Chairman's page: who read this, and any fallback. */
function brainLine_() {
  var b = brain_();
  return 'Read by ' + b.label + '.' + (b.note ? ' ' + b.note : '');
}

/* What is configured for the models, printing nothing secret. */
function checkBrain() {
  BRAIN_ = null;
  var b = brain_();
  var have = PropertiesService.getScriptProperties().getProperties();
  return ['Chosen: ' + b.chosen, 'This run would use: ' + b.label + (b.note ? ' — ' + b.note : '')]
    .concat(['CLAUDE_KEY', 'CLAUDE_MODEL', 'GEMINI_KEY', 'GEMINI_MODEL', 'AI_PROVIDER'].map(function (k) {
      var v = have[k];
      return k + ': ' + (v ? (/KEY$/.test(k) ? 'set (' + String(v).length + ' chars)' : v) : 'not set');
    })).join(String.fromCharCode(10));
}

/* One tiny question to the chosen model, to prove the key works. */
function testBrain() {
  BRAIN_ = null;
  var b = brain_();
  if (!b.key) return 'No key for ' + b.provider + ' or the other model. Set CLAUDE_KEY or GEMINI_KEY.';
  return b.label + ' says: ' + aiAsk_('Reply with exactly: Klever is connected.', 30);
}
