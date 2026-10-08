/* Klever — Quality Vision: the AI looks at each finished piece.

   HOW (the Chairman, 8 Oct 2026). Wude posts a photo of each finished piece
   in the "QC photos" room (js/channels.js, id 'qc' — Wude, Amaha, Mahelet),
   with its job code in the words ("KK-302 doors"). Within ten minutes the
   watch (Agents.js watch_) sends each new photo to Gemini, asks it what
   defects it can see — scratches, chips, gaps, stains, lifting edges,
   misalignment — and answers in the same room. A major or critical defect
   also goes to Wude and Amaha as an alert on their home pages. Every verdict
   is kept in /vision for the Sunday quality reader and the Chairman.

   WHAT IT IS NOT. A photo shows one side, in one light. The AI is told to
   say only what the photo shows and how sure it is, and every answer says
   to check the piece by hand: it is a second pair of eyes for Wude, not a
   replacement for her inspection.

   The script reads this one room and no other (firestore.rules), writes
   only its verdicts there, under the name 'qcvision'.                      */

var QC_ROOM_ = 'qc';
var VISION_MAX_ = 5;            /* photos a watch, to stay inside the six minutes */

/* a query inside one document's subcollection — fsQuery_ reads top-level only */
function fsQueryIn_(parent, collectionId, where, orderBy) {
  var filters = (where || []).map(function (w) {
    return { fieldFilter: { field: { fieldPath: w[0] }, op: w[1], value: fsEncode_(w[2]) } };
  });
  var q = { from: [{ collectionId: collectionId }] };
  if (filters.length === 1) q.where = filters[0];
  if (filters.length > 1) q.where = { compositeFilter: { op: 'AND', filters: filters } };
  if (orderBy) q.orderBy = [{ field: { fieldPath: orderBy }, direction: 'ASCENDING' }];
  var res = UrlFetchApp.fetch(fsBase_() + '/documents/' + parent + ':runQuery', {
    method: 'post', contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + fsToken_() }, muteHttpExceptions: true,
    payload: JSON.stringify({ structuredQuery: q })
  });
  if (res.getResponseCode() !== 200) throw new Error('Could not read ' + parent + '/' + collectionId + ' (HTTP ' + res.getResponseCode() + ')');
  var out = [];
  JSON.parse(res.getContentText()).forEach(function (row) { if (row.document) out.push(fsDoc_(row.document)); });
  return out;
}

var VISION_ASK_ =
  'You are a quality inspector at Klever Küche, a kitchen cabinet maker. Look at this photo of a finished piece ' +
  '(a cabinet, door, drawer front or panel). List only defects you can actually see: scratch, chip, gap, stain, ' +
  'edge lifting, misalignment, dent, or other. For each, say where on the piece and how serious: minor (cosmetic, ' +
  'barely visible), major (a customer would notice), critical (it must not leave the factory). If the photo is too ' +
  'dark, blurred or far away to judge, say so. Answer with JSON only, no other words:\n' +
  '{"looks_ok": true|false, "photo_good_enough": true|false, "confidence": "high|medium|low", ' +
  '"defects": [{"type": "...", "where": "...", "severity": "minor|major|critical"}], "note": "one short sentence"}';

/* the model's look at one photo — Gemini, the image inline */
function visionAsk_(mime, b64, caption) {
  var b = brain_();
  if (!b.key) return { error: 'no model key (GEMINI_KEY)' };
  var model = b.provider === 'gemini' ? b.model : prop_('GEMINI_MODEL', AGENT_DEFAULT_MODEL);
  var key = b.provider === 'gemini' ? b.key : prop_('GEMINI_KEY', '');
  var res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(key), {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ contents: [{ parts: [
      { text: VISION_ASK_ + (caption ? '\nWude wrote with it: ' + String(caption).substring(0, 300) : '') },
      { inline_data: { mime_type: mime, data: b64 } }
    ] }] })
  });
  var t = readReply_(res);
  return visionParse_(t);
}
function visionParse_(t) {
  var s = String(t || '');
  var m = s.match(/\{[\s\S]*\}/);
  if (!m) return { error: 'the answer could not be read: ' + s.substring(0, 160) };
  try {
    var j = JSON.parse(m[0]);
    var sev = { minor: 1, major: 2, critical: 3 };
    var defects = (Array.isArray(j.defects) ? j.defects : []).filter(function (x) { return x && x.type; }).map(function (x) {
      var s2 = String(x.severity || 'minor').toLowerCase();
      return { type: String(x.type).toLowerCase(), where: String(x.where || '').trim(), severity: sev[s2] ? s2 : 'minor' };
    });
    return { looks_ok: j.looks_ok === true && !defects.length, photo_good_enough: j.photo_good_enough !== false,
             confidence: ['high', 'medium', 'low'].indexOf(String(j.confidence)) >= 0 ? String(j.confidence) : 'low',
             defects: defects, note: String(j.note || '').substring(0, 300),
             worst: defects.reduce(function (a, x) { return sev[x.severity] > sev[a] ? x.severity : a; }, defects.length ? 'minor' : 'none') };
  } catch (e) {
    return { error: 'the answer was not valid JSON' };
  }
}

/* the verdict, in the words posted back to the room */
function visionWords_(job, v) {
  var who = job ? job + ': ' : '';
  if (v.error) return who + 'I could not check this photo (' + v.error + '). Please inspect it by hand.';
  if (!v.photo_good_enough) return who + 'I cannot judge this photo' + (v.note ? ': ' + v.note.replace(/\.$/, '') : ' — it is too dark, blurred or far away') + '. Please take it again, close up and in good light.';
  if (!v.defects.length) return who + 'No defect visible in this photo (' + v.confidence + ' confidence). Check the other sides by hand before release.';
  return who + v.defects.length + ' defect' + (v.defects.length > 1 ? 's' : '') + ' visible: ' +
    v.defects.map(function (d) { return d.type + (d.where ? ' — ' + d.where : '') + ' (' + d.severity + ')'; }).join('; ') +
    ' (' + v.confidence + ' confidence). Check it by hand before release.';
}

/* From the watch: every new photo in the room, checked once. */
function visionWatch_() {
  var seen = prop_('VISION_SEEN', '');
  var since = seen ? new Date(seen) : new Date(new Date().getTime() - 2 * 86400000);
  var msgs = [];
  try { msgs = fsQueryIn_('channels/' + QC_ROOM_, 'messages', [['at', 'GREATER_THAN', since]], 'at'); }
  catch (e) { Logger.log('vision read: %s', e.message); return { checked: 0, error: e.message }; }
  var all = msgs.filter(function (m) { return m.kind === 'image' && m.who !== 'qcvision' && /^data:image\/(jpeg|png|webp);base64,/.test(String(m.media || '')); });
  var photos = all.slice(0, VISION_MAX_);
  var checked = 0, flagged = 0, last = null;
  photos.forEach(function (m) {
    last = m.at;
    try { if (fsGet_('vision/' + m._id)) return; } catch (e) { return; }
    var parts = String(m.media).match(/^data:(image\/[a-z]+);base64,(.*)$/);
    var job = (String(m.text || '').match(/KK[-\s]?\d+/i) || [''])[0];
    job = job ? opsCode_(job) : '';
    var v = visionAsk_(parts[1], parts[2], m.text);
    var words = visionWords_(job, v);
    var day = m.at ? dayOf_(m.at) : todayAddis_();
    fsPut_('vision/' + m._id, { message: m._id, job: job, by: m.who || '', photoAt: m.at || null, day: day, at: new Date(),
                                ok: !!v.looks_ok, worst: v.worst || 'none', defects: v.defects || [], confidence: v.confidence || '',
                                note: v.note || '', error: v.error || '', words: words, model: brain_().label });
    try { fsCreateNow_('channels/' + QC_ROOM_ + '/messages', { who: 'qcvision', text: words }, 'at'); }
    catch (e) { Logger.log('vision post: %s', e.message); }
    if (v.worst === 'major' || v.worst === 'critical') {
      flagged++;
      alertMany_('vis-' + m._id, ['wude', 'amaha'], 'Quality Vision, ' + dayLabel_(day) + ': ' + words, day);
    }
    checked++;
  });
  /* the newest message read, photo or not, so a busy room is not re-read —
     unless photos were left for the next watch: then the last one checked */
  var newest = msgs.length ? msgs[msgs.length - 1].at : null;
  var mark = all.length > photos.length ? last : (newest || last);
  if (mark) PropertiesService.getScriptProperties().setProperty('VISION_SEEN', new Date(mark).toISOString());
  return { checked: checked, flagged: flagged };
}

/* the week's verdicts, for the Sunday quality reader */
function visionWeek_(from, to) {
  var rows = tryQuery_('vision', [['day', 'GREATER_THAN_OR_EQUAL', from], ['day', 'LESS_THAN_OR_EQUAL', to]], 'day');
  if (!rows.length) return { note: 'No photos checked this week (Wude posts them in the “QC photos” room).' };
  var byJob = {};
  rows.forEach(function (r) { if (r.job && r.worst !== 'none') (byJob[r.job] = byJob[r.job] || []).push(r.worst); });
  return {
    photos_checked: rows.length,
    with_a_defect: rows.filter(function (r) { return r.defects && r.defects.length; }).length,
    major_or_critical: rows.filter(function (r) { return r.worst === 'major' || r.worst === 'critical'; }).length,
    could_not_judge: rows.filter(function (r) { return r.error || /too dark|blurred/.test(r.words || ''); }).length,
    jobs_flagged: Object.keys(byJob).map(function (k) { return { job: k, worst: byJob[k].indexOf('critical') >= 0 ? 'critical' : byJob[k].indexOf('major') >= 0 ? 'major' : 'minor' }; })
  };
}
