/* Klever — the factory gate: a face scan on one tablet.

   THE ASK (the user, 14 Oct 2026): "the next step, for production, is a
   face scan — because they don't have phones". His answers that day: a
   tablet at the factory gate with a face scan, on our own page · the
   factory has its own WiFi line · on arriving only · everyone at the
   factory — the workers and the heads (Amaha, Wude, Alemaya) — on the
   same tablet.

   HOW. gate.html runs on the tablet, signed in as the gate's own account
   ('gate'). It knows the faces — /faces/{person}, added by the Chairman or
   Amaha: a few pictures each, kept as the numbers that describe a face,
   and one small picture — and recognises them on the tablet itself. A face
   it knows, or a name tapped when it does not, comes here with a small
   picture taken at that moment (/gatephoto). The time is the tablet's —
   a scan waits on the tablet while the line is down, for minutes or a
   whole morning, and is filed for the day and the time it was made, never
   for when it got through (the bug hunt, 15 Oct 2026: a 7:35 arrival sent
   at 10:45 had been filed as 10:45, late). Only a clock ahead of this one
   is not believed, and a scan two days old is refused. Late after 8:00 AM,
   as the office (Attend.js).

   A tapped name proves nothing by itself: it comes in with check 'open',
   and Amaha or the Chairman looks at the picture and says it is them
   ('ok') or not ('not' — then it counts as no scan). The real person's
   face, seen after someone tapped their name, is kept beside the tap
   (`face`): if Amaha says the tap was someone else, the face is the
   arrival; until then the tap stands — a person who tapped their own name
   at 7:30 and walks past the camera at noon is not made late. Workers have no
   phones, so Amaha says why for a worker who did not come or came late;
   Amaha, Wude and Alemaya say it for themselves, as the office does.

   COUNTED FROM the day the Chairman chose on his page (/gateconf/factory
   .from); before that every scan is a test. No money is taken, as at the
   office.                                                                 */

var GT_PLACE_ = 'factory';
var GT_STALE_MS_ = 48 * 3600 * 1000;    /* a scan that waited on the tablet longer is refused */
var GT_AHEAD_MS_ = 2 * 60 * 1000;       /* a tablet clock this far ahead is still believed */
var GT_PHOTO_MAX_ = 90000;              /* characters of a data: picture */

/* the day the gate is counted from, or null while it is still a test */
function gtFrom_() {
  var d = null;
  try { d = fsGet_('gateconf/' + GT_PLACE_); } catch (e) { d = null; }
  return d && /^\d{4}-\d{2}-\d{2}$/.test(String(d.from || '')) ? d.from : null;
}

/* Everyone at the gate: `gate` in js/forms.js PEOPLE, and anyone on the
   payroll only whose face was added there. */
function gtPeople_(schedule, faces) {
  var out = ((schedule && schedule.people) || []).filter(function (p) { return p.gate && !p.company; })
    .map(function (p) { return { id: p.id, en: p.en, from: p.from || null, worker: !!p.worker }; });
  var have = {};
  out.forEach(function (p) { have[p.id] = true; });
  (faces || []).forEach(function (f) {
    if (f && f.person && !have[f.person] && /^pay-[a-z0-9-]+$/.test(f.person)) {
      have[f.person] = true;
      out.push({ id: f.person, en: f.name || f.person, from: null, worker: true });
    }
  });
  return out;
}

/* who has a face at the gate: person and name only — never the pictures,
   which would be a megabyte and more to read for two words each */
function gtFaces_() {
  try {
    var res = UrlFetchApp.fetch(fsBase_() + '/documents:runQuery', {
      method: 'post', contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + fsToken_() }, muteHttpExceptions: true,
      payload: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'faces' }],
                                                   select: { fields: [{ fieldPath: 'person' }, { fieldPath: 'name' }] } } })
    });
    if (res.getResponseCode() !== 200) return [];
    var out = [];
    JSON.parse(res.getContentText()).forEach(function (row) { if (row.document) out.push(fsDoc_(row.document)); });
    return out.map(function (f) { return { person: f.person, name: f.name }; });
  } catch (e) { Logger.log('faces: %s', e.message); return []; }
}

/* the payroll-only people (Sheet "Staff Wages and Letters"), names and
   roles only — for adding a face to someone who has no place on the site */
function gtPayOnly_() {
  var byId = legalStaffRead_(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LEGAL_TAB_));
  return Object.keys(byId).filter(function (id) { return /^pay-[a-z0-9-]+$/.test(id) && !byId[id].left; })
    .map(function (id) { return { id: id, name: byId[id].name || id, role: byId[id].role || '' }; });
}

/* From doPost: { kind:'gate', person, how:'face'|'tap', dist, at, photo }
   with the gate's own sign-in (`poster`), or { kind:'gate', act:'people' }
   from whoever adds faces. Returns the answer as JSON. */
function gatePost_(row, poster) {
  if (row.act === 'people') {
    if (['gate', 'chairman', 'amaha'].indexOf(poster) === -1) return JSON.stringify({ ok: false, why: 'not-gate' });
    try { return JSON.stringify({ ok: true, people: gtPayOnly_() }); }
    catch (e) { return JSON.stringify({ ok: false, why: 'unavailable' }); }
  }
  if (poster !== 'gate') return JSON.stringify({ ok: false, why: 'not-gate' });
  var person = String(row.person || '');
  if (!/^[a-z0-9-]{2,60}$/.test(person)) return JSON.stringify({ ok: false, why: 'unknown' });
  var schedule = loadSchedule_();
  var p = (schedule.people || []).filter(function (x) { return x.id === person && x.gate && !x.company; })[0];
  var face = null;
  if (!p) { try { face = fsGet_('faces/' + person); } catch (e) { face = null; } }
  if (!p && !(face && /^pay-/.test(person))) return JSON.stringify({ ok: false, why: 'unknown' });
  var name = p ? p.en : (face.name || person);

  /* the tablet's time — when it was made, however long it waited */
  var now = new Date(), when = now, at = Number(row.at);
  /* by the tablet's own clock, when it was made and when it was sent: the
     difference is the wait, whatever the tablet's clock says — a clock 45
     minutes slow made a late arrival on time (bug hunt, 15 Oct 2026) */
  var sentAt = Number(row.sentAt);
  if (isFinite(at) && at > 0 && isFinite(sentAt) && sentAt >= at) at = now.getTime() - (sentAt - at);
  if (isFinite(at) && at > 0 && at <= now.getTime() + GT_AHEAD_MS_) {
    if (at < now.getTime() - GT_STALE_MS_) return JSON.stringify({ ok: false, why: 'stale' });
    when = new Date(Math.min(at, now.getTime()));
  }
  var waited = Math.round((now.getTime() - when.getTime()) / 60000);
  var day = Utilities.formatDate(when, tz_(), 'yyyy-MM-dd'), mins = atMinutes_(when);
  var path = 'attend/' + day + '_' + person;
  var how = row.how === 'face' ? 'face' : 'tap';
  var sunday = closed_(day);            /* or a holiday: recorded, never late */
  var photo = String(row.photo || '');
  var goodPhoto = /^data:image\/(jpeg|webp|png);base64,[A-Za-z0-9+\/=]+$/.test(photo) && photo.length <= GT_PHOTO_MAX_;
  var had = null;
  try { had = fsGet_(path); } catch (e) { had = null; }
  if (had && had.scanAt && had.check !== 'not') {
    /* the face of someone whose name was tapped earlier and not yet looked
       at: kept beside the tap, with its picture, for Amaha to compare */
    if (how === 'face' && had.how === 'tap' && had.check !== 'ok' && !had.face) {
      var fl = !sunday && mins > AT_LATE_AFTER_;
      var seen = { at: when, hm: atClock_(mins), late: fl, minsLate: fl ? mins - AT_LATE_AFTER_ : 0 };
      if (isFinite(Number(row.dist))) seen.dist = Math.round(Number(row.dist) * 1000) / 1000;
      fsUpdate_(path, { face: seen });
      if (goodPhoto) {
        try { fsPut_('gatephoto/' + day + '_' + person + '_face', { person: person, day: day, photo: photo, how: 'face', at: when }); }
        catch (e) { Logger.log('gatephoto face %s: %s', person, e.message); }
      }
    }
    return JSON.stringify({ ok: true, already: true, name: name, at: had.hm, late: !!had.late, minsLate: had.minsLate || 0 });
  }
  var late = !sunday && mins > AT_LATE_AFTER_;
  var scan = { person: person, day: day, place: GT_PLACE_, scanAt: when, hm: atClock_(mins), late: late,
               minsLate: late ? mins - AT_LATE_AFTER_ : 0, how: how, by: 'gate', sentAt: now,
               /* a tapped name waits for Amaha or the Chairman to look at the picture */
               check: how === 'tap' ? 'open' : '' };
  if (how === 'face' && isFinite(Number(row.dist))) scan.dist = Math.round(Number(row.dist) * 1000) / 1000;
  /* sent long after it was made (the line was down): said, for whoever reads it */
  if (waited > 30) scan.waited = waited;
  /* a reason given before (Amaha said "sick", then he came) stays with it;
     a scan he said was not this person is replaced */
  if (had) {
    if (had.check === 'not') { scan.checkBy = ''; scan.face = null; }
    fsUpdate_(path, scan);
  } else fsPut_(path, scan);
  if (goodPhoto) {
    try {
      fsPut_('gatephoto/' + day + '_' + person, { person: person, day: day, photo: photo, how: how, at: when });
    } catch (e) { Logger.log('gatephoto %s: %s', person, e.message); }
  }
  return JSON.stringify({ ok: true, name: name, day: day, at: scan.hm, late: late, minsLate: scan.minsLate, sunday: sunday });
}

/* For the morning reading and for Ask: the gate today, and the Ethiopian
   month so far — the same shape as the office's (Attend.js attendFacts_) */
function factoryGateFacts_(day) {
  var from = gtFrom_();
  if (!from) return { day: day, note: 'The factory gate tablet is not counted yet (the Chairman starts it on his page)' };
  if (day < from) return { day: day, note: 'The factory gate is counted from ' + from };
  if (dow_(day) === 0) return { day: day, note: 'Sunday — no check-in' };
  if (holiday_(day)) return { day: day, note: 'Holiday (' + holiday_(day).en + ') — no check-in' };
  var schedule = loadSchedule_();
  var faces = gtFaces_();
  var people = gtPeople_(schedule, faces);
  var eth = atEth_(day);
  var monthStart = addDays_(day, -(eth.d - 1));
  if (monthStart < from) monthStart = from;
  var docs = tryQuery_('attend', [['day', 'GREATER_THAN_OR_EQUAL', monthStart], ['day', 'LESS_THAN_OR_EQUAL', day]], 'day');
  var month = {};
  for (var d = monthStart; d <= day; d = addDays_(d, 1)) {
    if (closed_(d)) continue;
    attendDay_(schedule, d, docs, people).forEach(function (r) {
      var m = month[r.id] || (month[r.id] = { name: r.name, on_time: 0, late: 0, no_scan: 0, late_or_missing_days: [] });
      if (r.status === 'on time') m.on_time++;
      else {
        if (r.status === 'late') m.late++; else m.no_scan++;
        m.late_or_missing_days.push(d + ': ' + r.status + (r.at ? ' ' + r.at : '') + (r.why ? ' — ' + r.why + (r.note ? ' (' + r.note + ')' : '') : ' — no reason given'));
      }
    });
  }
  var faced = {};
  faces.forEach(function (f) { if (f && f.person) faced[f.person] = true; });
  return {
    how: 'Everyone at the factory checks in by face at the gate tablet when they arrive; late after 8:00 AM. ' +
         'A tapped name (face not recognised) waits until Amaha or the Chairman checks the picture. ' +
         'No money is taken for it; Amaha says why for workers, the heads say it for themselves.',
    day: day, today: attendDay_(schedule, day, docs, people),
    no_face_added_yet: people.filter(function (p) { return !faced[p.id]; }).map(function (p) { return p.en; }),
    month: AT_ETH_MONTHS_[eth.m - 1] + ' ' + eth.y + ' (Ethiopian calendar), counted from ' + monthStart,
    month_so_far: Object.keys(month).map(function (k) { return month[k]; })
  };
}
