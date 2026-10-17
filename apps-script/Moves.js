/* A FILING THAT COUNTS FOR ANOTHER DAY (the user, 17 Oct 2026: "Getachew
   reported today but it is yesterday's report — make it yesterday, and
   today he did not report"). His form had refused to send on Fri 16 Oct
   (a Birr box he could not fill); he sent that day's report on Sat 17 Oct
   at 11:07, and by its time it counted as Saturday's.

   A filing's time is the server's and a filing is never changed
   (firestore.rules). So the Chairman writes /moves/{the filing's id}:
   {person, report, from, to, asAt, why, by, at} — `asAt` is the time it is
   to count as. Every read of /reports goes through fsQuery_ (Agent.js),
   which hands the filings here: a moved one takes `asAt` as its `at` and
   keeps the time it really came as `sentAt`. filedBetween_ also fetches a
   filing moved INTO its days from outside them, and the morning catch-up
   (Agents.js catchUp_) closes again a day that was closed before a filing
   was moved into it or out of it. The phones read the same (js/fb.js). */

var MOVES_ = null;   /* once a run */
function moves_() {
  if (MOVES_) return MOVES_;
  var m = {};
  /* a read that fails throws: a day closed without its moves would charge
     what the Chairman has put right (as the waivers, the bug hunt 15 Oct) */
  fsQuery_('moves', [], null).forEach(function (x) {
    if (x._id && x.asAt && x.asAt.getTime && x.person && x.report) m[x._id] = x;
  });
  MOVES_ = m;
  return m;
}

/* the filings read, with a moved one's time put where it now counts */
function movePatch_(docs) {
  var m = moves_();
  if (!Object.keys(m).length) return docs;
  docs.forEach(function (d) {
    var x = d && m[d._id];
    /* only for the filing it names, of that person and that report */
    if (!x || d.person !== x.person || d.report !== x.report || !d.at || !d.at.getTime || d.sentAt) return;
    d.sentAt = d.at;
    d.at = x.asAt;
  });
  return docs;
}

/* the filings moved to a time in [fromMs, toMs) that a read by time did not
   find (they came outside it), patched; `have` is what was found */
function movedInto_(fromMs, toMs, have) {
  var m = moves_(), there = {}, out = [];
  (have || []).forEach(function (d) { there[d._id] = 1; });
  Object.keys(m).forEach(function (id) {
    var t = m[id].asAt.getTime();
    if (there[id] || t < fromMs || t >= toMs) return;
    var d = fsGet_('reports/' + id);
    if (!d) return;
    d._id = id;
    movePatch_([d]);
    if (typeof moneyPatch_ === 'function') moneyPatch_([d]);
    if (d.sentAt) out.push(d);
  });
  return out;
}

/* the days closed before a filing was moved into or out of them: closed again */
function movedDaysToRedo_(have) {
  var m = moves_(), redo = {};
  Object.keys(m).forEach(function (id) {
    var x = m[id], made = x.at && x.at.getTime ? x.at.getTime() : 0;
    [x.to, x.from].forEach(function (d) {
      var doc = d && have[d];
      if (!doc) return;
      var closed = doc.closedAt && doc.closedAt.getTime ? doc.closedAt.getTime() : 0;
      if (closed < made) redo[d] = true;
    });
  });
  return redo;
}

/* The ten-minute watch: a day closed before a filing was moved into or out
   of it is closed again now, not at the next morning — the Chairman sees
   it the same hour (the user, 17 Oct 2026, on Getachew's Friday). Moves of
   the last fortnight only. */
var MOVES_WATCH_DAYS_ = 14;
function movesWatch_() {
  var m = moves_(), days = {}, since = Date.now() - MOVES_WATCH_DAYS_ * 864e5;
  Object.keys(m).forEach(function (id) {
    var x = m[id];
    if (!(x.at && x.at.getTime && x.at.getTime() >= since)) return;
    [x.to, x.from].forEach(function (d) { if (d) days[d] = 1; });
  });
  var list = Object.keys(days).sort();
  if (!list.length) return [];
  var have = {};
  ledgersBetween_(list[0], addDays_(list[list.length - 1], 1)).forEach(function (d) { have[d.day] = d; });
  var redo = movedDaysToRedo_(have), done = [];
  Object.keys(redo).sort().forEach(function (d) {
    /* a Sunday whose week is closed and whose day is not: the morning's */
    if (!days[d] || have[d].dayOpen) return;
    closeDay_(d);
    done.push(d);
  });
  return done;
}
