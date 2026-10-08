/* Klever report archive.
   Receives one report and appends it as a row, on a tab named after the
   report. Unknown fields become new columns on the right. */

/* Tabs this endpoint must never write to — they belong to the ledger and the
   packs, and the figures in them come off people's pay. */
var RESERVED_TABS_ = /^(Penalty Ledger|Daily Analysis|Deductions|Penalties|Bonuses|Pay |Staff Wages)/i;

/* The few things in a report that should not wait for the morning brief.
   Checked here, in code, against the figures as filed; each one puts ALERT at
   the front of the email so it reads on a lock screen. The thresholds are the
   letters' own — the 6,000,000 Birr reserve is Betelhem's duty 19 and the
   Implementation Document's cash rule.

   This is the anonymous endpoint, so a forged row could raise a false alert.
   That costs an email, not a fine: nothing here is charged or recorded. */
var ALERTS_ = [
  { report: 'betty-forecast', test: function (v) { return has_(v.cf7_bank) && num_(v.cf7_bank) < 6000000; },
    say: function (v) { return 'Bank balance ' + money_(v.cf7_bank) + ' Birr this morning — below the 6,000,000 reserve'; } },
  { report: 'betty-forecast', test: function (v) { return yes__(v.cf7_short); },
    say: function (v) { return 'Selam expects a cash shortfall in the next 7 days' +
                               (has_(v.cf7_amount) ? ' — ' + money_(v.cf7_amount) + ' Birr short' : ''); } },
  { report: 'betty-daily', test: function (v) { return has_(v.bank_total) && num_(v.bank_total) < 6000000; },
    say: function (v) { return 'Bank total ' + money_(v.bank_total) + ' Birr — below the 6,000,000 reserve'; } },
  { report: 'betty-daily', test: function (v) { return yes__(v.discrepancy); },
    say: function () { return 'Selam reports a cash discrepancy'; } },
  { report: 'betty-cashflow', test: function (v) { return yes__(v.cf_short); },
    say: function () { return 'A cash shortfall is expected in the next 4 weeks'; } },
  { report: 'yordanos-daily', test: function (v) { return yes__(v.sec_theft); },
    say: function () { return 'Theft or unauthorized removal reported at the store'; } },
  /* a yes/no question: read as a number it was always 0, and this alert never fired */
  { report: 'yordanos-daily', test: function (v) { return yes__(v.sh_stopped); },
    say: function (v) { return 'Production stopped by a material shortage' +
                               (has_(v.sh_stopped_what) ? ' — ' + v.sh_stopped_what
                                : has_(v.sh_what) ? ' — ' + v.sh_what : ''); } },
  { report: 'amaha-daily', test: function (v) { return yes__(v.b_short); },
    say: function (v) { return 'The factory stopped for missing board' +
                               (has_(v.b_shortw) ? ' — ' + v.b_shortw : ''); } },
  { report: 'wude-daily', test: function (v) { return yes__(v.pr_any); },
    say: function () { return 'Wude reports being pressured to pass a defective product'; } },
  { report: 'wude-daily', test: function (v) { return num_(v.d_released) > 0; },
    say: function (v) { return num_(v.d_released) + ' defect(s) released to finished goods'; } },
  { report: 'elyas-daily', test: function (v) { return yes__(v.cl_damage); },
    say: function () { return 'Customer property damaged during installation'; } }
];

function has_(v) { return v != null && String(v).trim() !== ''; }
function num_(v) { var x = Number(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isNaN(x) ? 0 : x; }
function yes__(v) { return String(v == null ? '' : v).toLowerCase().indexOf('y') === 0; }
function money_(v) { return num_(v).toLocaleString('en-US'); }

function alertsFor_(row) {
  var v = row.values || {}, out = [];
  ALERTS_.forEach(function (a) {
    if (a.report !== row.report) return;
    try { if (a.test(v)) out.push(a.say(v)); } catch (e) { /* a malformed value is not an alert */ }
  });
  return out;
}

/* Opening the URL in a browser should say something useful rather than throw.
   It is also how the owner grants a newly added permission: Google shows the
   consent screen before it will run this. */
/* Run this once from the editor after adding anything that needs a new
   permission. Opening the web app URL re-runs the old permission set and will
   not prompt; running a function here does. */
function authorize() {
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(),
                    'Klever archive - permission granted',
                    'Mail is authorized. Reports will now notify you as they arrive.');
  SpreadsheetApp.getActiveSpreadsheet().getName();
}

/* This address is public (it is in js/save.js), so the answer says only that
   it is up — not where the emails go or what the Sheet holds. */
function doGet() {
  return ContentService.createTextOutput('Klever report archive is running.');
}

function doPost(e) {
  var row;
  try {
    row = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput('bad json');
  }

  /* WHO IS POSTING. This address is public, so a row is believed only as far
     as can be checked: who sent it comes from their Firebase sign-in token,
     looked up with Google; the report's name and owner come from the
     schedule; the time and whether it is late come from this server's clock.
     What the phone says about any of those is not read. */
  /* Before anything costs a call to Google: a token that is not even shaped
     like one of this project's sign-ins is refused here, and so is a flood.
     Each lookup spends one of the account's daily outgoing requests, which
     the ledger, the agents and the morning close share — a stranger posting
     junk tokens could otherwise switch the night's work off. */
  /* the WhatsApp agent (Wa.js): no sign-in token, a shared secret instead */
  if (row && /^wa-/.test(String(row.kind || ''))) {
    return ContentService.createTextOutput(waPost_(row));
  }
  if (!tokenShape_(row.idToken)) return ContentService.createTextOutput('refused');
  if (flooded_()) return ContentService.createTextOutput('busy');
  var poster = knownToken_(row.idToken);
  if (!poster) {
    /* A token can be forged in shape, so lookups are counted: past 500
       refused ones in a day, an unknown token is turned away without a call
       to Google. Tokens Google has vouched for are remembered until they
       expire, so the staff keep working through a flood. */
    if (badTokensToday_() >= 500) return ContentService.createTextOutput('busy');
    poster = posterOf_(row.idToken);
    if (poster) rememberToken_(row.idToken, poster);
    else countBadToken_();
  }
  delete row.idToken;
  if (!poster || poster === 'ledger') return ContentService.createTextOutput('refused');
  /* a question from the Chairman's page (Ask.js) — his, and nobody else's */
  if (row.kind === 'ask') {
    return ContentService.createTextOutput(poster === 'chairman' ? askPost_(row.k) : 'refused');
  }
  /* an order from his page, for the AI to find who does it (Orders.js) */
  if (row.kind === 'order') {
    return ContentService.createTextOutput(poster === 'chairman' ? orderPost_(row.k) : 'refused');
  }
  /* his new instructions, to the people's phones (Push.js) */
  if (row.kind === 'notify') {
    return ContentService.createTextOutput(poster === 'chairman' ? notifyPost_(row.k) : 'refused');
  }
  /* "Send me a test", from anyone's own page — to their own phones only */
  if (row.kind === 'pushTest') {
    return ContentService.createTextOutput(pushTestPost_(poster));
  }
  var sched;
  try { sched = loadSchedule_(); } catch (err) { return ContentService.createTextOutput('no schedule'); }
  var rep = sched.reports.filter(function (r) { return r.id === row.report; })[0];
  if (!rep) return ContentService.createTextOutput('refused');
  /* your own reports only — the Chairman may file on anyone's behalf */
  if (poster !== 'chairman' && poster !== rep.person) return ContentService.createTextOutput('refused');
  /* the same row, posted twice by a phone that lost signal mid-post */
  var cache = CacheService.getScriptCache();
  if (row.k) {
    if (cache.get('row:' + row.k)) return ContentService.createTextOutput('ok');
    cache.put('row:' + row.k, '1', 21600);
  }
  var nameOf = function (id) {
    var p = sched.people.filter(function (x) { return x.id === id; })[0];
    return p ? p.en : id;
  };
  var owner = sched.people.filter(function (x) { return x.id === rep.person; })[0] || {};
  row.person = rep.person;
  row.personName = owner.en || rep.person;
  row.roleName = owner.roleEn || '';
  row.reportName = rep.en;
  row.to = rep.toEn || row.to || '';
  row.due = rep.dueEn || '';
  row.by = poster;
  row.byName = poster === 'chairman' ? 'Chairman' : nameOf(poster);
  row.at = new Date().toISOString();
  var st = standingNow_(sched, rep);
  row.late = st.late;
  row.statusText = st.text;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tab = String(row.reportName || 'Reports').substring(0, 90);
  /* This endpoint takes anyone's POST, and it names the tab after whatever
     the caller says the report is called. Without this line a caller could
     append a row to the penalty ledger or to a month's deductions just by
     calling their "report" that. */
  if (RESERVED_TABS_.test(tab)) return ContentService.createTextOutput('refused');
  var sh = ss.getSheetByName(tab);
  if (!sh) {
    sh = ss.insertSheet(tab);
    sh.appendRow(['Sent at', 'Person', 'Status', 'Due']);
    sh.setFrozenRows(1);
  }

  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  /* An answer is put under its own name — never under one of the columns
     this server fills (an answer called "Status" used to overwrite it, so a
     late row could read "On time"), and never as a formula. */
  var values = {};
  Object.keys(row.values || {}).forEach(function (k) {
    var col = SERVER_COLS_.indexOf(k) !== -1 ? 'answer: ' + k : k;
    values[cell_(String(col))] = row.values[k];
  });

  /* any field this tab has not seen before becomes a new column */
  Object.keys(values).forEach(function (k) {
    if (head.indexOf(k) === -1) {
      head.push(k);
      sh.getRange(1, head.length).setValue(k);
    }
  });
  /* who pressed Send. Normally the same person, but the Chairman can open
     anyone's form, and a row should say so rather than quietly read as theirs. */
  ['Filed by', 'Message'].forEach(function (col) {
    if (head.indexOf(col) === -1) {
      head.push(col);
      sh.getRange(1, head.length).setValue(col);
    }
  });

  var out = new Array(head.length).fill('');
  out[0] = new Date(row.at || Date.now());
  out[1] = row.personName || row.person || '';
  out[2] = row.statusText || (row.late ? 'LATE' : 'On time');
  out[3] = row.due || '';
  Object.keys(values).forEach(function (k) {
    var v = values[k];
    out[head.indexOf(k)] = cell_((v && typeof v === 'object') ? JSON.stringify(v) : v);
  });
  out[head.indexOf('Filed by')] = row.byName || row.by || '';
  out[head.indexOf('Message')] = cell_(String(row.text || ''));

  sh.appendRow(out);
  notify_(row, ss.getUrl());
  /* and the agents read the day again, about a minute from now (Agents.js) */
  readSoon_();
  return ContentService.createTextOutput('ok');
}

var SERVER_COLS_ = ['Sent at', 'Person', 'Status', 'Due', 'Filed by', 'Message'];

/* Shaped like a sign-in token of this project, not yet expired, for a
   klever.local account. Only the shape is checked here — Google checks the
   signature in posterOf_. */
function tokenShape_(t) {
  if (typeof t !== 'string' || t.length > 4096) return false;
  var parts = t.split('.');
  if (parts.length !== 3) return false;
  var p = jwtPart_(parts[1]);
  var proj = prop_('FIREBASE_PROJECT', 'klever-26ad1');
  return !!p && p.aud === proj && p.iss === 'https://securetoken.google.com/' + proj &&
         Number(p.exp) * 1000 > new Date().getTime() - 300000 &&
         /@klever\.local$/.test(String(p.email || '').toLowerCase());
}
function jwtPart_(s) {
  var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  var bits = 0, n = 0, out = '';
  for (var i = 0; i < s.length; i++) {
    var v = A.indexOf(s.charAt(i));
    if (v < 0) { if (s.charAt(i) === '=') break; return null; }
    bits = ((bits << 6) | v) & 0xffffff;
    n += 6;
    if (n >= 8) { n -= 8; out += String.fromCharCode((bits >> n) & 255); }
  }
  try { return JSON.parse(decodeURIComponent(escape(out))); } catch (e) { return null; }
}
/* the whole token, hashed: a cached identity is only ever found again by
   the exact token Google vouched for */
function tokenKey_(t) {
  var d = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(t), Utilities.Charset.UTF_8);
  return 'tok:' + Utilities.base64EncodeWebSafe(d);
}
function knownToken_(t) {
  try { return CacheService.getScriptCache().get(tokenKey_(t)); } catch (e) { return null; }
}
function rememberToken_(t, who) {
  try {
    var p = jwtPart_(String(t).split('.')[1]) || {};
    var secs = Math.floor((Number(p.exp) * 1000 - new Date().getTime()) / 1000);
    if (secs > 30) CacheService.getScriptCache().put(tokenKey_(t), who, Math.min(secs, 21600));
  } catch (e) {}
}
function badTokensToday_() {
  try { return Number(CacheService.getScriptCache().get('badtok:' + todayAddis_()) || 0); } catch (e) { return 0; }
}
function countBadToken_() {
  try {
    var c = CacheService.getScriptCache(), k = 'badtok:' + todayAddis_();
    c.put(k, String(Number(c.get(k) || 0) + 1), 21600);
  } catch (e) {}
}

/* More posts in one minute than the whole staff could send at a deadline is
   someone else. Counted roughly (the cache is not a lock); good enough to
   stop a flood without ever stopping a real Friday at 17:30. */
function flooded_() {
  try {
    var c = CacheService.getScriptCache();
    var k = 'posts:' + Math.floor(new Date().getTime() / 60000);
    var n = Number(c.get(k) || 0) + 1;
    c.put(k, String(n), 120);
    return n > 90;
  } catch (e) { return false; }
}

/* Who a Firebase sign-in token belongs to — 'betty' for betty@klever.local —
   or null if Google does not vouch for it (forged, expired, another
   project's). One call to Google per row. */
function posterOf_(token) {
  if (!token || typeof token !== 'string') return null;
  var key = prop_('FIREBASE_WEB_KEY', '');
  if (!key) return null;
  var r = UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + key, {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify({ idToken: token }), muteHttpExceptions: true
  });
  if (r.getResponseCode() !== 200) return null;
  var u = (JSON.parse(r.getContentText()).users || [])[0];
  var m = u && u.email && /^([a-z0-9-]+)@klever\.local$/.exec(String(u.email).toLowerCase());
  return m ? m[1] : null;
}

/* How a report sent now stands — the same rule the ledger closes the day
   with, and the phone shows: late only on its due day after its deadline;
   a monthly one sent ahead counts for its coming due day. A weekly one
   counts for the week it is sent in, which closes on Sunday at 9 PM (THE
   WEEK, Agent.js): after its deadline and before then it is late, for its
   own day; after 9 PM on Sunday it is next week's, early. */
function standingNow_(sched, rep) {
  var today = todayAddis_(), now = new Date().getTime();
  if (rep.cadence === 'weekly' && weekOf_(new Date(), rep.id) >= WEEK_FROM_) {
    var d = dueInWeek_(rep, weekOf_(new Date(), rep.id));
    var label = Utilities.formatDate(new Date(d + 'T12:00:00' + ADDIS_), tz_(), 'EEE d MMM');
    if (now > deadline_(rep, d).getTime()) return { late: true, text: d === today ? 'LATE' : 'LATE, for ' + label };
    return { late: false, text: d === today ? 'On time' : 'Early, for ' + label };
  }
  var back = rep.cadence === 'daily' ? 0 : 7;
  for (var k = 0; k <= back; k++) {
    var d = addDays_(today, k);
    if (dueOn_(sched, d).indexOf(rep) === -1) continue;
    if (k === 0) {
      var late = now > deadline_(rep, d).getTime();
      return { late: late, text: late ? 'LATE' : 'On time' };
    }
    return { late: false, text: 'Early, for ' + Utilities.formatDate(new Date(d + 'T12:00:00' + ADDIS_), tz_(), 'EEE d MMM') };
  }
  return { late: false, text: 'Not due today' };
}

/* The Chairman should not have to open a spreadsheet to find out a report
   arrived. The subject line carries the whole story, so it reads on a lock
   screen without opening anything. */
/* The report as a document. Apps Script's HTML-to-PDF renderer honours tables
   and inline styles and little else — no flexbox, no grid, no stylesheet — so
   the layout is built the way a 1998 email was, on purpose. */
function reportHtml_(row) {
  var A = '#0f5c54', SOFT = '#e6f0ed', INK = '#141b1a', INK2 = '#3a4442',
      MUTE = '#6b7672', RULE = '#d7dcd7', BAD = '#8f3020', BADSOFT = '#f7eae6';

  var esc = function (v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };
  var br = function (v) {
    return esc(v).replace(new RegExp(String.fromCharCode(10), 'g'), '<br>');
  };
  /* a list from the form as a small table: a heading per column, figures right */
  var listOk = function (d) {
    return Array.isArray(d.head) && Array.isArray(d.num) && Array.isArray(d.rows) && d.rows.length &&
      d.rows.every(function (x) { return Array.isArray(x) && x.length === d.head.length; });
  };
  var listTable = function (d) {
    var cell = 'padding:4px 8px 4px 0;vertical-align:top;border-bottom:1px solid ' + RULE + ';';
    var t = ['<table width="100%" cellpadding="0" cellspacing="0" style="font-size:8.5pt;margin-top:5px">'];
    t.push('<tr>' + d.head.map(function (x, i) {
      return '<td' + (d.num[i] ? ' align="right"' : '') + ' style="' + cell +
        'border-bottom:1px solid ' + MUTE + ';font-size:7.5pt;font-weight:bold;color:' + MUTE + '">' +
        esc(x) + '</td>';
    }).join('') + '</tr>');
    d.rows.forEach(function (row) {
      t.push('<tr>' + row.map(function (x, i) {
        return '<td' + (d.num[i] ? ' align="right"' : '') + ' style="' + cell + 'color:' + (i ? INK : A) +
          (i === 0 || d.num[i] ? ';white-space:nowrap' : '') + '">' + esc(x) + '</td>';
      }).join('') + '</tr>');
    });
    if (d.total) {
      t.push('<tr><td colspan="' + d.head.length + '" align="right" style="padding:5px 0 0;' +
        'font-weight:bold;color:' + INK + '">' + esc(d.total) + '</td></tr>');
    }
    t.push('</table>');
    return t.join('');
  };
  var h = [];
  var F = 'font-family:Helvetica,Arial,sans-serif';

  h.push('<div style="' + F + ';color:' + INK + ';font-size:10.5pt;line-height:1.45">');

  /* masthead */
  h.push('<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
    '<td style="font-size:19pt;font-weight:bold;letter-spacing:0.5px;color:' + INK + '">' +
      'KLEVER <span style="font-weight:normal;font-size:13pt">K&uuml;che</span></td>' +
    '<td align="right" valign="bottom" style="font-size:7.5pt;letter-spacing:2.2px;color:' + A + '">' +
      'REPORT &middot; KLEVER K&Uuml;CHE</td>' +
    '</tr></table>');
  h.push('<div style="border-bottom:2px solid ' + INK + ';height:6px"></div>');

  /* title */
  h.push('<div style="font-size:17pt;font-weight:bold;margin:18px 0 2px;color:' + INK + '">' +
    esc(row.reportName) + '</div>');
  h.push('<div style="font-size:10pt;color:' + MUTE + ';margin-bottom:16px">' +
    esc(row.personName) + (row.roleName ? ' &middot; ' + esc(row.roleName) : '') + '</div>');

  /* the facts that decide whether a penalty applies, given their own box */
  var sent = row.at ? Utilities.formatDate(new Date(row.at), 'Africa/Addis_Ababa',
                                           'HH:mm, d MMM yyyy') : '';
  h.push('<table width="100%" cellpadding="0" cellspacing="0" style="background:' +
    (row.late ? BADSOFT : SOFT) + ';margin-bottom:20px"><tr>');
  [['SENT', sent], ['DUE', row.due], ['STATUS', row.statusText ? row.statusText.toUpperCase() : (row.late ? 'LATE' : 'ON TIME')],
   ['TO', row.to]].forEach(function (c) {
    if (!c[1]) return;
    h.push('<td width="25%" style="padding:9px 12px;vertical-align:top">' +
      '<div style="font-size:7pt;letter-spacing:1.6px;color:' + MUTE + '">' + c[0] + '</div>' +
      '<div style="font-size:9.5pt;font-weight:bold;color:' +
        (c[0] === 'STATUS' && row.late ? BAD : INK) + '">' + esc(c[1]) + '</div></td>');
  });
  h.push('</tr></table>');

  if (row.byName && row.byName !== row.personName) {
    h.push('<div style="font-size:9pt;color:' + BAD + ';margin:-12px 0 16px">Filed by ' +
      esc(row.byName) + '</div>');
  }

  /* the report itself */
  var doc = row.doc && row.doc.length ? row.doc : [];
  doc.forEach(function (s) {
    if (s.sec) {
      h.push('<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 0">' +
        '<tr><td style="background:' + SOFT + ';padding:5px 10px;font-size:7.5pt;' +
        'font-weight:bold;letter-spacing:1.6px;color:' + A + '">' +
        esc(s.sec).toUpperCase() + '</td></tr></table>');
    }
    h.push('<table width="100%" cellpadding="0" cellspacing="0" style="font-size:10pt">');
    s.rows.forEach(function (r) {
      if (r[1] === '' || r[1] == null) return;
      /* the site marks a list (r[2].head) and a long answer (r[2].long): both
         go across the page under their question. Rows without the mark — an
         older phone's — print as before. */
      var how = r[2] && typeof r[2] === 'object' ? r[2] : null;
      var full = 'border-bottom:1px solid ' + RULE + ';padding:7px 10px 9px 10px;color:' + INK2;
      if (how && listOk(how)) {
        h.push('<tr><td colspan="2" style="' + full + '">' + esc(r[0]) + listTable(how) + '</td></tr>');
        return;
      }
      if (how && (how.long || how.head)) {
        h.push('<tr><td colspan="2" style="' + full + '">' +
          '<div style="margin-bottom:4px">' + esc(r[0]) + '</div>' +
          '<div style="color:' + INK + ';border-left:2px solid ' + RULE + ';padding-left:10px">' +
            br(r[1]) + '</div></td></tr>');
        return;
      }
      h.push('<tr>' +
        '<td style="border-bottom:1px solid ' + RULE + ';padding:6px 14px 6px 10px;' +
          'width:56%;color:' + INK2 + '">' + esc(r[0]) + '</td>' +
        '<td align="right" style="border-bottom:1px solid ' + RULE + ';padding:6px 10px 6px 0;' +
          'font-weight:bold;color:' + INK + '">' + br(r[1]) + '</td></tr>');
    });
    h.push('</table>');
  });

  /* anything that broke a target, where it cannot be missed */
  if (row.flags && row.flags.length) {
    h.push('<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0">' +
      '<tr><td style="background:' + BADSOFT + ';padding:5px 10px;font-size:7.5pt;' +
      'font-weight:bold;letter-spacing:1.6px;color:' + BAD + '">' +
      'MISSED TARGETS</td></tr></table>');
    h.push('<table width="100%" cellpadding="0" cellspacing="0" style="font-size:9.5pt">');
    row.flags.forEach(function (fl) {
      h.push('<tr><td style="border-bottom:1px solid ' + RULE + ';padding:6px 10px;color:' +
        BAD + '">' + esc(fl) + '</td></tr>');
    });
    h.push('</table>');
  }

  /* signatures */
  h.push('<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:40px"><tr>' +
    '<td width="44%" style="border-top:1px solid ' + INK2 + ';padding-top:5px;font-size:7.5pt;' +
      'letter-spacing:1.4px;color:' + MUTE + '">' + esc(row.personName).toUpperCase() + '</td>' +
    '<td width="12%"></td>' +
    '<td width="44%" style="border-top:1px solid ' + INK2 + ';padding-top:5px;font-size:7.5pt;' +
      'letter-spacing:1.4px;color:' + MUTE + '">DATE</td>' +
    '</tr></table>');

  h.push('<div style="margin-top:26px;border-top:1px solid ' + RULE + ';padding-top:6px;' +
    'font-size:7.5pt;color:' + MUTE + '">Klever K&uuml;che &middot; filed through the Klever ' +
    'report site &middot; this copy is generated from the figures as they were sent</div>');

  h.push('</div>');
  return h.join('');
}

function reportPdf_(row) {
  var name = String(row.reportName || 'Report').replace(/[^A-Za-z0-9 -]/g, '').trim() + ' - ' +
             String(row.personName || '').replace(/[^A-Za-z0-9 -]/g, '').trim() + '.pdf';
  return Utilities.newBlob(reportHtml_(row), 'text/html', name)
                  .getAs('application/pdf').setName(name);
}

function notify_(row, sheetUrl) {
  var to = Session.getEffectiveUser().getEmail();
  if (!to) return;
  /* At most three mails for one report of one person in a day — a phone
     sending the same report again and again must not use up the day's mail,
     which the morning brief and the ALERTs need too. */
  /* An ALERT always goes. */
  if (!alertsFor_(row).length) try {
    var c = CacheService.getScriptCache();
    var mk = 'mail:' + row.person + '|' + row.report + '|' + todayAddis_();
    var sent = Number(c.get(mk) || 0);
    if (sent >= 3) return;
    c.put(mk, String(sent + 1), 21600);
  } catch (e) { /* no cache, no limit */ }

  var who = row.personName || row.person || 'Someone';
  var what = row.reportName || 'Report';
  var alerts = alertsFor_(row);
  var subject = (alerts.length ? 'ALERT - ' + alerts[0] + ' - ' : '') +
                (row.late ? 'LATE - ' : '') + who + ' - ' + what;

  var when = Utilities.formatDate(new Date(row.at || Date.now()),
                                  'Africa/Addis_Ababa', 'HH:mm, d MMM yyyy');
  var lines = (alerts.length ? ['NEEDS YOU NOW'].concat(alerts.map(function (a) {
    return '  - ' + a;
  })).concat(['']) : []).concat([
    what,
    who + (row.byName && row.byName !== who ? '   (filed by ' + row.byName + ')' : ''),
    'Sent ' + when + '   ' + (row.statusText || (row.late ? 'LATE' : 'on time')),
    'Due  ' + (row.due || ''),
    '',
    row.text || '',
    '',
    'Sheet: ' + sheetUrl
  ]);

  try {
    MailApp.sendEmail({
      to: to,
      subject: subject,
      body: lines.join(String.fromCharCode(10)),
      attachments: [reportPdf_(row)]
    });
  } catch (err) {
    /* a full mail quota must never cost the company the row that was filed */
  }
}
