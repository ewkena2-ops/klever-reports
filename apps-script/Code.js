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
  [['SENT', sent], ['DUE', row.due], ['STATUS', row.late ? 'LATE' : 'ON TIME'],
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
