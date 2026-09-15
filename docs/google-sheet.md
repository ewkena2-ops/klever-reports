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
  return ContentService.createTextOutput('ok');
}
```

## What the phones do

`js/save.js` posts the report the moment Send is tapped, then opens WhatsApp as
before. If the phone has no signal the row waits in an outbox on that phone and
goes out the next time the app is opened with a connection — so a report filled
in a basement with no bars is not lost.

Nothing else is stored on the phone but the day's draft, as before.
