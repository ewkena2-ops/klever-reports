# Where the reports get kept

The site has no server, so a sent report lives only in WhatsApp unless it is
also filed somewhere. This is that somewhere: a Google Sheet the Chairman owns,
fed by a small script. It is free, it needs no accounts for the team, and the
sheet is a normal spreadsheet — sort it, filter it, chart it, export it.

One sheet tab per report type. One row per submission. Columns appear as the
fields do, so a new field in `forms.js` adds a column the next time that report
is sent; nothing needs changing here.

## Setting it up — about five minutes, once

1. Make a new spreadsheet at <https://sheets.new> and name it, say,
   **Klever Reports**.
2. **Extensions → Apps Script**. Delete whatever is in `Code.gs`.
3. Paste the script below and save.
4. **Deploy → New deployment → Web app**
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
   - Deploy, then **Authorize access** and accept the warning screen — it is
     your own script asking to write to your own sheet.
5. Copy the deployment URL. It ends in `/exec`.
6. Paste it into `js/save.js` as `SAVE_URL`, commit, push. That is the only
   line that changes.

"Who has access: Anyone" is what lets a phone post without a Google login. The
URL is in the site's JavaScript, so treat it as public: anyone who finds it
could append a junk row. It cannot read the sheet, delete anything, or reach
the rest of the Google account. If junk ever appears, deploy a new version —
that changes the URL — and update `SAVE_URL`.

## The script

```javascript
/* Klever report archive.
   Receives one report and appends it as a row, on a tab named after the
   report. Unknown fields become new columns on the right. */

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

function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabs = ss.getSheets().length;
  return ContentService.createTextOutput(
    'Klever report archive is running. ' +
    tabs + ' report tab(s) in the sheet. ' +
    'Notifications go to ' + Session.getEffectiveUser().getEmail() + '.'
  );
}

function doPost(e) {
  var row;
  try {
    row = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput('bad json');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tab = String(row.reportName || 'Reports').substring(0, 90);
  var sh = ss.getSheetByName(tab);
  if (!sh) {
    sh = ss.insertSheet(tab);
    sh.appendRow(['Sent at', 'Person', 'Status', 'Due']);
    sh.setFrozenRows(1);
  }

  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var values = row.values || {};

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
  out[2] = row.late ? 'LATE' : 'On time';
  out[3] = row.due || '';
  Object.keys(values).forEach(function (k) {
    var v = values[k];
    out[head.indexOf(k)] = (v && typeof v === 'object') ? JSON.stringify(v) : v;
  });
  out[head.indexOf('Filed by')] = row.byName || row.by || '';
  out[head.indexOf('Message')] = row.text || '';

  sh.appendRow(out);
  notify_(row, ss.getUrl());
  return ContentService.createTextOutput('ok');
}

/* The Chairman should not have to open a spreadsheet to find out a report
   arrived. The subject line carries the whole story, so it reads on a lock
   screen without opening anything. */
/* The report as a document, attached to the mail. The Chairman should be able
   to forward one file to a customer or a bank without opening a spreadsheet or
   re-typing anything. Apps Script renders basic HTML to PDF; the layout is
   deliberately table-based and inline-styled, because that is all it honours. */
function reportPdf_(row) {
  var A = '#0f5c54', INK = '#141b1a', MUTE = '#5f6a66', RULE = '#cfd4cf', BAD = '#8f3020';
  var values = row.values || {};
  var esc = function (v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  var h = [];
  h.push('<div style="font-family:Helvetica,Arial,sans-serif;color:' + INK + '">');
  h.push('<table width="100%" style="border-bottom:2px solid ' + INK + ';padding-bottom:8px"><tr>' +
         '<td style="font-size:20px;font-weight:bold;letter-spacing:1px">KLEVER <span style="font-weight:normal">K&uuml;che</span></td>' +
         '<td align="right" style="font-size:9px;letter-spacing:2px;color:' + A + '">KLEVER REPORTS</td>' +
         '</tr></table>');
  h.push('<h1 style="font-size:19px;margin:18px 0 10px">' + esc(row.reportName) + '</h1>');

  var meta = [['To', row.due ? (row.to || '') : ''], ['From', row.personName],
              ['Sent', row.at ? Utilities.formatDate(new Date(row.at), 'Africa/Addis_Ababa', 'HH:mm, d MMM yyyy') : ''],
              ['Due', row.due], ['Status', row.late ? 'LATE' : 'On time']];
  h.push('<table style="font-size:10px;color:' + MUTE + '">');
  meta.forEach(function (m) {
    if (!m[1]) return;
    var val = (m[0] === 'Status' && row.late)
      ? '<b style="color:' + BAD + '">' + esc(m[1]) + '</b>'
      : '<span style="color:' + INK + '">' + esc(m[1]) + '</span>';
    h.push('<tr><td style="padding:1px 14px 1px 0;letter-spacing:1px;text-transform:uppercase">' +
           m[0] + '</td><td>' + val + '</td></tr>');
  });
  h.push('</table>');

  /* The phone sends the document already sectioned and labelled. Fall back to
     the raw field ids only if an old client posts without it. */
  var doc = row.doc && row.doc.length ? row.doc
          : [{ sec: '', rows: Object.keys(values).map(function (k) {
                return [k, typeof values[k] === 'object' ? JSON.stringify(values[k]) : values[k]];
              }) }];

  doc.forEach(function (s) {
    if (s.sec) {
      h.push('<div style="font-size:9px;font-weight:bold;letter-spacing:1.5px;color:' + A +
             ';border-bottom:1px solid ' + RULE + ';margin:18px 0 0;padding-bottom:4px">' +
             esc(s.sec).toUpperCase() + '</div>');
    }
    h.push('<table width="100%" style="border-collapse:collapse;font-size:11px">');
    s.rows.forEach(function (r) {
      if (r[1] === '' || r[1] == null) return;
      h.push('<tr>' +
        '<td style="border-bottom:1px solid ' + RULE + ';padding:5px 8px 5px 0;width:58%">' + esc(r[0]) + '</td>' +
        '<td style="border-bottom:1px solid ' + RULE + ';padding:5px 0;text-align:right">' +
        esc(r[1]).replace(new RegExp(String.fromCharCode(10), 'g'), '<br>') + '</td></tr>');
    });
    h.push('</table>');
  });

  if (row.flags && row.flags.length) {
    h.push('<div style="font-size:9px;font-weight:bold;letter-spacing:1.5px;color:' + BAD +
           ';border-bottom:1px solid ' + BAD + ';margin:18px 0 0;padding-bottom:4px">FLAGS</div>');
    h.push('<table width="100%" style="font-size:11px;color:' + BAD + '">');
    row.flags.forEach(function (fl) {
      h.push('<tr><td style="padding:4px 0">' + esc(fl) + '</td></tr>');
    });
    h.push('</table>');
  }

  h.push('<table width="100%" style="margin-top:34px;font-size:9px;color:' + MUTE + '"><tr>' +
         '<td style="border-top:1px solid ' + INK + ';padding-top:4px;width:45%">SIGNATURE &mdash; ' + esc(row.personName) + '</td>' +
         '<td width="10%"></td>' +
         '<td style="border-top:1px solid ' + INK + ';padding-top:4px;width:45%">DATE</td>' +
         '</tr></table>');
  h.push('</div>');

  var name = String(row.reportName || 'Report').replace(/[^A-Za-z0-9 -]/g, '') + ' - ' +
             String(row.personName || '').replace(/[^A-Za-z0-9 -]/g, '') + '.pdf';
  return Utilities.newBlob(h.join(''), 'text/html', name).getAs('application/pdf').setName(name);
}

function notify_(row, sheetUrl) {
  var to = Session.getEffectiveUser().getEmail();
  if (!to) return;

  var who = row.personName || row.person || 'Someone';
  var what = row.reportName || 'Report';
  var subject = (row.late ? 'LATE - ' : '') + who + ' - ' + what;

  var when = Utilities.formatDate(new Date(row.at || Date.now()),
                                  'Africa/Addis_Ababa', 'HH:mm, d MMM yyyy');
  var lines = [
    what,
    who + (row.byName && row.byName !== who ? '   (filed by ' + row.byName + ')' : ''),
    'Sent ' + when + '   ' + (row.late ? 'LATE' : 'on time'),
    'Due  ' + (row.due || ''),
    '',
    row.text || '',
    '',
    'Sheet: ' + sheetUrl
  ];

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
```

## When a permission is added later

The permission set is frozen at whatever the script needed when it was first
approved. Adding anything new — sending mail, a calendar entry, a trigger —
will fail silently at runtime, and opening the web app URL does **not**
re-prompt: it re-runs the old set. Grant it from the editor instead: open the
script, pick **authorize** in the function dropdown, Run, approve. That is the
only place Google re-asks.

## What the phones do

`js/save.js` posts the report the moment Send is tapped, then opens WhatsApp as
before. If the phone has no signal the row waits in an outbox on that phone and
goes out the next time the app is opened with a connection — so a report filled
in a basement with no bars is not lost.

Nothing else is stored on the phone but the day's draft, as before.
