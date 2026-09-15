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
  if (head.indexOf('Message') === -1) {
    head.push('Message');
    sh.getRange(1, head.length).setValue('Message');
  }

  var out = new Array(head.length).fill('');
  out[0] = new Date(row.at || Date.now());
  out[1] = row.personName || row.person || '';
  out[2] = row.late ? 'LATE' : 'On time';
  out[3] = row.due || '';
  Object.keys(values).forEach(function (k) {
    var v = values[k];
    out[head.indexOf(k)] = (v && typeof v === 'object') ? JSON.stringify(v) : v;
  });
  out[head.indexOf('Message')] = row.text || '';

  sh.appendRow(out);
  return ContentService.createTextOutput('ok');
}
