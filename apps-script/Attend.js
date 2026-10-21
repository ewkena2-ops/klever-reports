/* Klever — office check-in: a QR code at the door, Klever's WiFi only.

   THE ASK (the user, 14 Oct 2026): "we build a QR code; when they scan it
   they are marked as attended, but they have to use Klever's WiFi". His
   answers that day: office staff only (the factory stays on Amaha's lists)
   · everyone has a smartphone · on arriving only · the scan is the record ·
   late after 8:00 AM (the factory letters' hours) · when someone does not
   scan, or scans late, their page asks why; the Chairman sees it all; no
   money is taken — their letters set no fine for it · one place, the office
   · a fixed internet line.

   HOW. The QR opens the site (index.html?scan=office). Office staff are
   signed in on their phones already, so the site knows who it is. A web
   page cannot read the WiFi's name, and this script cannot see the address
   a request comes from, so the phone posts to the WhatsApp agent on
   Railway, which can: it adds the address it saw, and its shared secret,
   and passes the scan here. Everyone on Klever's WiFi reaches the internet
   from the one address the line has; a phone on mobile data, or at home,
   comes from another and is refused. An IPv6 address is matched on its
   first four groups (the line's own block), not the phone's own part.

   THE ADDRESS is kept in /attendwifi/office, which the Chairman sets on his
   page: a scan from an unknown address is not lost — it is kept in
   /attendfail, and his page shows, address by address, who tried; one tap
   says "this is Klever's WiFi". So the first morning sets it up by itself,
   and a new line or a changed address is fixed the same way.

   /attend/{yyyy-mm-dd}_{person}: the scan (time, late, minutes) written
   here; why (no scan, or late) written by the person from their page
   (firestore.rules). Read by the person, the Chairman and the ledger.     */

var AT_LATE_AFTER_ = 8 * 60;                 /* 8:00 AM */
var AT_FROM_ = '2026-10-19';                   /* the first day counted (js/forms.js ATTEND_FROM) */
var AT_PLACE_ = 'office';
var AT_WHY_ = ['visit', 'sick', 'leave', 'forgot', 'holiday', 'transport', 'other'];

/* the people who scan: `scan` in js/forms.js PEOPLE */
function atPeople_(schedule) {
  return ((schedule && schedule.people) || []).filter(function (p) { return p.scan && !p.company; });
}

/* "1.2.3.4" stays; an IPv6 address becomes its first four groups */
function atAddr_(ip) {
  var s = String(ip || '').trim().toLowerCase();
  if (!s) return '';
  if (s.indexOf(',') !== -1) s = s.split(',')[0].trim();
  var v4 = /^(?:::ffff:)?(\d{1,3}(?:\.\d{1,3}){3})$/.exec(s);
  if (v4) return v4[1];
  if (s.indexOf(':') === -1) return '';
  /* expand "::" so the first four groups are the line's */
  var halves = s.split('::');
  var head = halves[0] ? halves[0].split(':') : [];
  var tail = halves.length > 1 && halves[1] ? halves[1].split(':') : [];
  var groups = halves.length > 1 ? head.concat(new Array(Math.max(0, 8 - head.length - tail.length)).fill('0'), tail) : head;
  if (groups.length < 4) return '';
  return groups.slice(0, 4).map(function (g) { return String(parseInt(g || '0', 16).toString(16)); }).join(':') + '::/64';
}

/* the office's addresses, as the Chairman set them. A read that fails
   throws: "none set" said while the database was out sent the whole
   office to "the WiFi is not set up" (20 Oct 2026). */
function atWifi_() { return atWifiDoc_().ips; }
function atWifiDoc_() {
  var d = fsGet_('attendwifi/' + AT_PLACE_);
  var clean = function (a) { return (a || []).map(atAddr_).filter(function (x) { return x; }); };
  return { ips: clean(d && d.ips), ignored: clean(d && d.ignored), raw: (d && d.ips) || [] };
}

/* Klever's: an address saved, or one in the same block as a saved one
   (the first three numbers — 196.188.33.x). 21 Oct 2026: the line's
   address changed overnight, .67 → .79, and the whole office was refused
   until the new one was saved; the user chose to have a new address in the
   block taken by itself ("option 2"), the Chairman told on his page. An
   address he said is not ours never is. 'saved' | 'block' | ''. */
function atBlock_(a) {
  var m = /^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/.exec(String(a || ''));
  return m ? m[1] : '';
}
function atOurs_(addr, wifi, ignored) {
  if (!addr) return '';
  if (wifi.indexOf(addr) !== -1) return 'saved';
  if ((ignored || []).indexOf(addr) !== -1) return '';
  var b = atBlock_(addr);
  return b && wifi.some(function (w) { return atBlock_(w) === b; }) ? 'block' : '';
}

/* A day the check-in is not counted (js/forms.js ATTEND_OFF — 20 Oct 2026,
   the database out until 10 AM): scans are kept, never late; no one is
   asked why. */
function atOff_(schedule, day) {
  var o = (schedule && schedule.attendOff) || {};
  return o[day] || null;
}

/* What the WhatsApp agent needs to answer at the door by itself when this
   script cannot (its database out, 20 Oct 2026): the office's addresses,
   who scans, the closed days and the days not counted, the next weeks.
   It goes back with every answer to the agent, which keeps it and never
   passes it to the phone (app/attend_local.py). */
function atConf_(schedule, wifi, ignored) {
  var closed = [], off = [], day = todayAddis_();
  for (var i = 0; i < 45; i++) {
    var d = addDays_(day, i);
    if (holiday_(d)) closed.push(d);
  }
  Object.keys((schedule && schedule.attendOff) || {}).forEach(function (d) { if (d >= addDays_(day, -3)) off.push(d); });
  return { wifi: wifi, ignored: ignored || [], people: atPeople_(schedule).map(function (p) { return p.id; }), closed: closed, off: off };
}

/* minutes after midnight, Addis */
function atMinutes_(date) {
  var hm = Utilities.formatDate(date, tz_(), 'HH:mm');
  return Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));
}
function atClock_(mins) {
  var h = Math.floor(mins / 60), m = mins % 60;
  return (h % 12 || 12) + ':' + ('0' + m).slice(-2) + (h < 12 ? ' AM' : ' PM');
}

/* From doPost: { kind:'attend', secret, ip, place } with the person's own
   sign-in token, already checked (`poster`). Returns the answer as JSON.

   `queued` (Wa.js 'wa-attend', 20 Oct 2026): a scan the agent checked and
   kept at the door while this script could not take it — the person
   (their token has expired by now; the secret says it is the agent's) and
   the time it was made, `at`. It counts at that time; one made earlier than
   a scan already here (the person scanned again once the site was back)
   takes its place. */
var AT_QUEUE_MAX_MS_ = 3 * 86400000;           /* kept longer by the agent: not taken */
function attendPost_(row, poster, queued) {
  var cfg;
  try { cfg = waConfig_(); } catch (e) { return JSON.stringify({ ok: false, why: 'unavailable' }); }
  /* only the agent knows the secret, so only the agent says where a scan came from */
  if (!cfg.secret || !waSame_(row.secret, cfg.secret)) return 'refused';
  try { return attendTake_(row, poster, queued); }
  catch (e) {
    /* the database could not be read or written: the agent keeps the scan */
    Logger.log('attend %s: %s', poster, e.message);
    return JSON.stringify({ ok: false, why: 'unavailable' });
  }
}
function attendTake_(row, poster, queued) {
  var addr = atAddr_(row.ip);
  var now = new Date();
  if (queued) {
    if (!/^[a-z0-9-]{2,60}$/.test(String(poster || ''))) return JSON.stringify({ ok: false, why: 'unknown' });
    var at = Number(row.at);
    if (!isFinite(at) || at > now.getTime() + 10 * 60000 || at < now.getTime() - AT_QUEUE_MAX_MS_) {
      return JSON.stringify({ ok: false, why: 'stale' });
    }
    now = new Date(Math.min(at, now.getTime()));
  }
  var day = Utilities.formatDate(now, tz_(), 'yyyy-MM-dd'), mins = atMinutes_(now);
  var schedule = loadSchedule_();
  var w = atWifiDoc_(), wifi = w.ips;
  var conf = atConf_(schedule, wifi, w.ignored);
  function reply(o) { o.conf = conf; return JSON.stringify(o); }
  var me = (schedule.people || []).filter(function (p) { return p.id === poster; })[0];
  var scans = poster === 'chairman' || (me && me.scan && !me.company);
  if (!scans) return reply({ ok: false, why: 'not-office' });
  var ours = atOurs_(addr, wifi, w.ignored);
  if (ours === 'block') {
    /* the line's new address: saved, newest first, and said on his page */
    try {
      fsUpdate_('attendwifi/' + AT_PLACE_, { ips: [addr].concat(w.raw.filter(function (x) { return atAddr_(x) !== addr; })).slice(0, 4),
                                            auto: { ip: addr, at: new Date(), person: poster, hm: atClock_(mins), day: day } });
      conf = atConf_(schedule, [addr].concat(wifi).slice(0, 4), w.ignored);
    } catch (e) { Logger.log('attend: saving %s: %s', addr, e.message); }
  }
  if (!ours) {
    /* kept, so the Chairman can say "this is Klever's WiFi" */
    if (addr) {
      try {
        fsPut_('attendfail/' + day + '_' + poster, { person: poster, day: day, ip: addr, at: now,
                                                      hm: atClock_(mins), wifiSet: wifi.length > 0 });
      } catch (e) { Logger.log('attendfail: %s', e.message); }
    }
    return reply({ ok: false, why: wifi.length ? 'not-wifi' : 'no-wifi-set', ip: addr });
  }
  if (poster === 'chairman') return reply({ ok: true, chairman: true, ip: addr });
  if (dow_(day) === 0) return reply({ ok: false, why: 'sunday' });
  if (holiday_(day)) return reply({ ok: false, why: 'holiday', name: holiday_(day).en, nameAm: holiday_(day).am || '' });
  var path = 'attend/' + day + '_' + poster;
  var had = fsGet_(path);
  if (had && had.scanAt && !(queued && now.getTime() < new Date(had.scanAt).getTime())) {
    return reply({ ok: true, already: true, at: had.hm, late: !!had.late, minsLate: had.minsLate || 0 });
  }
  var late = mins > AT_LATE_AFTER_ && !atOff_(schedule, day);
  var scan = { person: poster, day: day, place: AT_PLACE_, scanAt: now, hm: atClock_(mins), late: late,
               minsLate: late ? mins - AT_LATE_AFTER_ : 0, ip: addr };
  /* taken at the door by the agent, handed over later — or refused at
     first, its address said to be Klever's since (attendFailWatch_) */
  if (queued) { scan.queued = true; scan.sentAt = new Date(); }
  if (queued === 'wifi') scan.wifiLater = true;
  /* a reason she gave before scanning (forgot, then came) stays */
  if (had) fsUpdate_(path, scan); else fsPut_(path, scan);
  return reply({ ok: true, at: scan.hm, late: late, minsLate: scan.minsLate });
}

/* A refused scan counts once its address is Klever's WiFi. 21 Oct 2026:
   the line's address changed overnight (196.188.33.67 → .79) and the
   five who scanned on time from 7:33 were refused until the new one was
   saved; the user: "count refused scans once fixed". So when the list of
   addresses changes (the Chairman's "This is Klever's WiFi"), the last
   three days' refused scans from an address now on it are taken as scans
   at their own time — on time if they were — and marked counted. One read
   a watch while the list stays the same. From the watch (Agents.js). */
function attendFailWatch_() {
  var props = PropertiesService.getScriptProperties();
  var w = atWifiDoc_(), wifi = w.ips;
  var key = wifi.slice().sort().join(',');
  if (!wifi.length || prop_('ATTEND_WIFI_SEEN', '') === key) return { taken: 0 };
  var since = addDays_(todayAddis_(), -3), out = { taken: 0, left: 0 };
  var fails = fsQuery_('attendfail', [['day', 'GREATER_THAN_OR_EQUAL', since]], 'day');
  fails.forEach(function (f) {
    if (f.counted || !f.person || !f.day || !atOurs_(atAddr_(f.ip), wifi, w.ignored)) return;
    var at = f.at && f.at.getTime ? f.at.getTime() : new Date(f.at).getTime();
    var res;
    try { res = JSON.parse(attendTake_({ ip: f.ip, at: at }, f.person, 'wifi')); }
    catch (e) { Logger.log('attend fail %s_%s: %s', f.day, f.person, e.message); out.left++; return; }
    if (res.why === 'unavailable') { out.left++; return; }
    fsUpdate_('attendfail/' + f.day + '_' + f.person, { counted: new Date(), countedAs: res.ok ? 'scan' : String(res.why || '') });
    if (res.ok) out.taken++;
  });
  /* tried again next watch if any could not be taken */
  if (!out.left) props.setProperty('ATTEND_WIFI_SEEN', key);
  return out;
}

/* One day, person by person: on time / late / no scan, and why. The
   office's people unless others are given (the factory gate, Gate.js). A
   scan Amaha or the Chairman said was not this person counts as none; a
   tapped name not looked at yet is said so. */
/* The arrival that counts on a day's document: the scan — or, when Amaha
   said a tapped name was someone else, the person's own face seen later
   (`face`, Gate.js), or none. */
function atEffective_(d) {
  if (!d || d.check !== 'not') return d || {};
  var f = d.face;
  return f && f.at ? { scanAt: f.at, hm: f.hm, late: !!f.late, minsLate: f.minsLate || 0, how: 'face', why: d.why, note: d.note }
                   : { why: d.why, note: d.note };
}
function attendDay_(schedule, day, docs, people) {
  var by = {};
  (docs || []).forEach(function (d) { if (d.day === day) by[d.person] = d; });
  /* from the day they started to the last day they worked (a worker Amaha
     marked as left, 17 Oct 2026) */
  return (people || atPeople_(schedule)).filter(function (p) { return (!p.from || p.from <= day) && (!p.left || p.left >= day); }).map(function (p) {
    var raw = by[p.id] || {}, d = atEffective_(raw);
    var scanned = !!d.scanAt;
    var r = { id: p.id, name: p.en,
              status: scanned ? (d.late ? 'late' : 'on time') : 'no scan',
              at: scanned ? d.hm || null : null, minutes_late: scanned && d.late ? d.minsLate : 0,
              why: d.why || null, note: d.note || null };
    if (scanned && raw.check === 'open') r.name_tapped_picture_not_checked_yet = true;
    if (raw.check === 'open' && raw.face) r.own_face_also_seen_at = raw.face.hm;
    if (raw.check === 'not') r.tapped_scan_was_someone_else = true;
    return r;
  });
}

/* The Ethiopian date of a yyyy-mm-dd — the month the office counts its
   days by (js/app.js toEthiopian, the same arithmetic) */
var AT_ETH_MONTHS_ = ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miyazya', 'Ginbot',
                      'Sene', 'Hamle', 'Nehase', 'Pagume'];
function atEth_(ymd) {
  var y = Number(ymd.slice(0, 4)), m = Number(ymd.slice(5, 7)), day = Number(ymd.slice(8, 10));
  var a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
  var jdn = day + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  var k = jdn - 1723856, r = k % 1461, n = (r % 365) + 365 * Math.floor(r / 1460);
  return { y: 4 * Math.floor(k / 1461) + Math.floor(r / 365) - Math.floor(r / 1460), m: Math.floor(n / 30) + 1, d: (n % 30) + 1 };
}

/* For the morning reading and for Ask: the day, and the month so far */
function attendFacts_(day) {
  var schedule = loadSchedule_();
  if (dow_(day) === 0) return { day: day, note: 'Sunday — no check-in' };
  if (holiday_(day)) return { day: day, note: 'Holiday (' + holiday_(day).en + ') — no check-in' };
  /* the Ethiopian month, as each person and the Chairman see it */
  var eth = atEth_(day);
  var monthStart = addDays_(day, -(eth.d - 1));
  if (monthStart < AT_FROM_) monthStart = AT_FROM_;
  if (day < AT_FROM_) return { day: day, note: 'Office check-in starts ' + AT_FROM_ };
  var docs = tryQuery_('attend', [['day', 'GREATER_THAN_OR_EQUAL', monthStart], ['day', 'LESS_THAN_OR_EQUAL', day]], 'day');
  var month = {};
  var days = [];
  for (var d = monthStart; d <= day; d = addDays_(d, 1)) if (!closed_(d) && !atOff_(schedule, d)) days.push(d);
  days.forEach(function (d) {
    attendDay_(schedule, d, docs).forEach(function (r) {
      var m = month[r.id] || (month[r.id] = { name: r.name, on_time: 0, late: 0, no_scan: 0, late_or_missing_days: [] });
      if (r.status === 'on time') m.on_time++;
      else {
        if (r.status === 'late') m.late++; else m.no_scan++;
        m.late_or_missing_days.push(d + ': ' + r.status + (r.at ? ' ' + r.at : '') + (r.why ? ' — ' + r.why + (r.note ? ' (' + r.note + ')' : '') : ' — no reason given'));
      }
    });
  });
  return {
    how: 'Office staff scan the QR at the office door on Klever WiFi when they arrive; late after 8:00 AM. ' +
         'No money is taken for it; a person who did not scan or was late says why on their page.',
    day: day, today: attendDay_(schedule, day, docs),
    today_not_counted: atOff_(schedule, day) ? 'Not counted today (' + atOff_(schedule, day).en + '): no one is late or missing' : undefined,
    month: AT_ETH_MONTHS_[eth.m - 1] + ' ' + eth.y + ' (Ethiopian calendar), counted from ' + monthStart,
    month_so_far: Object.keys(month).map(function (k) { return month[k]; })
  };
}
