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
    MailApp.sendEmail(to, subject, lines.join(String.fromCharCode(10)));
  } catch (err) {
    /* a full mail quota must never cost the company the row that was filed */
  }
}
