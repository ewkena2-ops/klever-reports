/* Klever — Route Optimization (agent 29): each day's trips in the best order.

   WHAT IT READS. Elyas's "Tomorrow's plan" (elyas-daily, t_rows: job code,
   site, crew, m²) — the jobs Alex's truck delivers and the installers fit —
   and Ephrata's "visits booked for tomorrow" (ephrata-daily, tm_visits:
   customer, code, area, time, who goes). Both are filed in the evening for
   the next working day.

   WHERE EACH SITE IS. In this order: the "Places" tab of the Sheet, where
   anyone can write a place as the reports write it and its area or its
   latitude and longitude (the factory is a row there, "Klever factory");
   then the areas of Addis Ababa below, matched in the words of the site;
   then Google's geocoder, when the script may use it. A site none of these
   finds is listed, not guessed.

   HOW FAR. Straight-line distance × 1.4 for the roads, at 20 km/h across
   the city. These are estimates, to the nearest few minutes, and every
   reading says so. The area table is to the nearest kilometre or two.

   THE BEST ORDER. Every order is tried when there are eight stops or fewer;
   above that, the nearest stop next, then improved by swapping legs (2-opt).
   From the factory and back to it when its place is known; otherwise from
   the first stop. Elyas's own order is measured too, so the saving shows.

   WHEN. The draft is built as soon as Elyas or Ephrata files (runIfNew_,
   every ten minutes) and goes to Mahelet — Alex, the logistics provider, has
   no account, and his messages reach her — and to Elyas. At 6 AM the agent
   writes the final reading (AGENTS 'route') from the same figures.        */

var PLACES_TAB_ = 'Places';
var ROUTE_FACTORY_ = 'Klever factory';
var ROUTE_KMH_ = 20;
var ROUTE_ROAD_ = 1.4;
var ROUTE_STOP_MIN_ = { install: 30, visit: 45 };

/* [name, latitude, longitude, other spellings] — approximate centres */
var ROUTE_AREAS_ = [
  ['bole bulbula', 8.957, 38.775, ['bulbula', 'ቡልቡላ']], ['bole arabsa', 8.985, 38.885, ['arabsa']],
  ['bole michael', 8.985, 38.797, []], ['bole', 8.995, 38.790, ['ቦሌ']], ['gerji', 9.002, 38.808, ['ገርጂ']],
  ['jackros', 8.997, 38.825, []], ['goro', 8.990, 38.840, ['ጎሮ']], ['summit', 9.008, 38.842, ['ሰሚት']],
  ['cmc', 9.020, 38.835, ['ሲኤምሲ']], ['ayat', 9.030, 38.873, ['hayat', 'አያት']], ['megenagna', 9.020, 38.801, ['megenanya', 'መገናኛ']],
  ['gurd shola', 9.020, 38.817, ['gurdshola']], ['lamberet', 9.035, 38.815, []], ['kotebe', 9.035, 38.853, ['kotobe', 'ኮተቤ']],
  ['yeka abado', 9.075, 38.880, []], ['yeka', 9.040, 38.795, []], ['lemi kura', 9.010, 38.900, ['lemikura', 'ለሚ ኩራ']],
  ['legetafo', 9.050, 38.905, ['legatafo']], ['kazanchis', 9.016, 38.766, ['kasanchis', 'ካዛንቺስ']],
  ['haya hulet', 9.012, 38.785, ['22 mazoria', 'hayahulet']], ['wello sefer', 9.000, 38.772, ['welo sefer']],
  ['kirkos', 9.003, 38.758, []], ['piassa', 9.035, 38.752, ['piazza', 'piyasa', 'ፒያሳ']], ['arat kilo', 9.033, 38.763, ['4 kilo']],
  ['sidist kilo', 9.045, 38.760, ['6 kilo']], ['shiro meda', 9.065, 38.765, ['shiromeda']], ['gulele', 9.060, 38.735, []],
  ['merkato', 9.032, 38.738, ['mercato', 'መርካቶ']], ['addis ketema', 9.035, 38.725, []], ['lideta', 9.012, 38.737, []],
  ['mexico', 9.010, 38.746, ['ሜክሲኮ']], ['sarbet', 8.995, 38.745, ['sar bet', 'ሳርቤት']], ['old airport', 8.985, 38.730, ['old air port']],
  ['mekanisa', 8.975, 38.722, []], ['gofa', 8.975, 38.755, []], ['nifas silk', 8.960, 38.745, []], ['lafto', 8.950, 38.745, ['ላፍቶ']],
  ['saris', 8.958, 38.765, []], ['lebu', 8.945, 38.718, ['ለቡ']], ['jemo', 8.960, 38.705, ['ጀሞ']], ['ayer tena', 8.990, 38.700, ['ayertena']],
  ['bethel', 8.997, 38.705, []], ['tor hailoch', 9.008, 38.720, ['torhailoch']], ['kolfe', 9.025, 38.705, ['ኮልፌ']],
  ['asko', 9.050, 38.700, []], ['kality', 8.910, 38.770, ['kaliti', 'ቃሊቲ']], ['akaki', 8.880, 38.785, ['አቃቂ']],
  ['tulu dimtu', 8.890, 38.825, []], ['burayu', 9.065, 38.660, []], ['sebeta', 8.915, 38.620, []],
  ['sululta', 9.180, 38.750, []], ['gelan', 8.840, 38.830, []], ['dukem', 8.795, 38.905, []]
];

function routeNorm_(s) { return ' ' + String(s || '').toLowerCase().replace(/[^a-z0-9ሀ-፿]+/g, ' ').trim() + ' '; }

/* the place a site's words name in the area table, longest name first */
function routeArea_(words) {
  var w = routeNorm_(words);
  if (w.trim() === '') return null;
  var names = [];
  ROUTE_AREAS_.forEach(function (a) { [a[0]].concat(a[3]).forEach(function (n) { names.push({ n: n, a: a }); }); });
  names.sort(function (x, y) { return y.n.length - x.n.length; });
  for (var i = 0; i < names.length; i++) {
    if (w.indexOf(' ' + names[i].n + ' ') >= 0) return { lat: names[i].a[1], lng: names[i].a[2], area: names[i].a[0], how: 'area' };
  }
  return null;
}

/* the Places tab: [place, area, latitude, longitude, notes] */
function routePlaces_() {
  var rows = [];
  try { rows = sheetRows_(PLACES_TAB_, 5) || []; } catch (e) { rows = []; }
  var out = {};
  rows.forEach(function (r) {
    var key = routeNorm_(r[0]).trim();
    if (!key) return;
    var lat = Number(r[2]), lng = Number(r[3]);
    if (!blank_(r[2]) && !blank_(r[3]) && !isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      out[key] = { lat: lat, lng: lng, area: String(r[1] || '').trim(), how: 'places tab' };
    } else if (!blank_(r[1])) {
      var a = routeArea_(r[1]);
      if (a) out[key] = { lat: a.lat, lng: a.lng, area: a.area, how: 'places tab' };
    }
  });
  return out;
}
function routePlacesEnsure_() {
  return sheetEnsure_(PLACES_TAB_, ['Place (as the reports write it)', 'Area (e.g. Lebu, Ayat, CMC)', 'Latitude', 'Longitude', 'Notes'],
    [[ROUTE_FACTORY_, '', '', '', 'Write the factory’s area, or its latitude and longitude (in Google Maps, press and hold on the spot).']]).created;
}

/* Google's geocoder, inside Addis Ababa and around it only; null when the
   script may not use it or the answer is the whole city */
function routeGeocode_(words) {
  if (typeof Maps === 'undefined') return null;
  try {
    var g = Maps.newGeocoder().setRegion('et').setBounds(8.75, 38.55, 9.25, 39.0).geocode(String(words) + ', Addis Ababa, Ethiopia');
    var r = g && g.status === 'OK' && g.results && g.results[0];
    if (!r || !r.geometry || !r.geometry.location) return null;
    if ((r.types || []).every(function (t) { return t === 'locality' || t === 'political' || t === 'administrative_area_level_1'; })) return null;
    var lat = r.geometry.location.lat, lng = r.geometry.location.lng;
    if (lat < 8.75 || lat > 9.25 || lng < 38.55 || lng > 39.0) return null;
    return { lat: lat, lng: lng, area: r.formatted_address || '', how: 'google' };
  } catch (e) { Logger.log('geocode: %s', e.message); return null; }
}

function routeWhere_(words, places, memo) {
  var key = routeNorm_(words).trim();
  if (!key) return null;
  if (memo && memo.hasOwnProperty(key)) return memo[key];
  var hit = places[key] || routeArea_(words) || routeGeocode_(words);
  if (memo) memo[key] = hit;
  return hit;
}

function routeKm_(a, b) {
  var R = 6371, rad = Math.PI / 180;
  var dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(h)) * ROUTE_ROAD_;
}
function routeMin_(km) { return Math.round(km / ROUTE_KMH_ * 60); }
function routeLen_(seq, start, back) {
  var km = 0, prev = start;
  seq.forEach(function (p) { if (prev) km += routeKm_(prev, p); prev = p; });
  if (start && back && seq.length) km += routeKm_(seq[seq.length - 1], start);
  return km;
}

/* the shortest order: every order up to eight stops, else nearest-next + 2-opt */
function routeBest_(pts, start) {
  var n = pts.length, back = !!start;
  if (n <= 1) return pts.slice();
  var best = null, bestKm = Infinity;
  if (n <= 8) {
    var idx = pts.map(function (_, i) { return i; });
    var permute = function (k) {
      if (k === n) {
        var seq = idx.map(function (i) { return pts[i]; }), km = routeLen_(seq, start, back);
        if (km < bestKm - 1e-9) { bestKm = km; best = seq; }
        return;
      }
      for (var i = k; i < n; i++) {
        var t = idx[k]; idx[k] = idx[i]; idx[i] = t;
        permute(k + 1);
        t = idx[k]; idx[k] = idx[i]; idx[i] = t;
      }
    };
    permute(0);
    return best;
  }
  var left = pts.slice(), seq = [], cur = start || left.shift();
  if (!start) seq.push(cur);
  while (left.length) {
    var bi = 0;
    for (var i = 1; i < left.length; i++) if (routeKm_(cur, left[i]) < routeKm_(cur, left[bi])) bi = i;
    cur = left.splice(bi, 1)[0];
    seq.push(cur);
  }
  var improved = true, guard = 0;
  while (improved && guard++ < 50) {
    improved = false;
    for (var a = 0; a < seq.length - 1; a++) {
      for (var b = a + 1; b < seq.length; b++) {
        var trial = seq.slice(0, a).concat(seq.slice(a, b + 1).reverse(), seq.slice(b + 1));
        if (routeLen_(trial, start, back) < routeLen_(seq, start, back) - 1e-9) { seq = trial; improved = true; }
      }
    }
  }
  return seq;
}

/* "10:00", "10 am", "2:30 PM" → minutes after midnight; null if not a time */
function routeTime_(s) {
  var m = String(s || '').toLowerCase().match(/(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/);
  if (!m) return null;
  var h = Number(m[1]), mi = Number(m[2] || 0), ap = (m[3] || '').charAt(0);
  if (h > 23 || mi > 59) return null;
  if (ap === 'p' && h < 12) h += 12;
  if (ap === 'a' && h === 12) h = 0;
  if (!ap && h >= 1 && h <= 6) h += 12;   /* "2:00" without AM or PM is the afternoon */
  return h * 60 + mi;
}
function routeClock_(min) {
  var h = Math.floor(min / 60), m = min % 60, ap = h >= 12 ? 'PM' : 'AM', h12 = h % 12 || 12;
  return h12 + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
}
function routeR1_(x) { return Math.round(x * 10) / 10; }

/* one leg-by-leg route from a sequence of stops */
function routeLegs_(seq, start, back, stopMin) {
  var prev = start, legs = [], km = 0;
  seq.forEach(function (p, i) {
    var k = prev ? routeKm_(prev, p) : 0;
    km += k;
    legs.push({ order: i + 1, stop: p.label, place: p.site, found_as: p.where.area || '', how_found: p.where.how,
                km_from_last: prev ? routeR1_(k) : null, minutes_from_last: prev ? routeMin_(k) : null, extra: p.extra || {} });
    prev = p;
  });
  var home = start && back && seq.length ? routeKm_(seq[seq.length - 1], start) : 0;
  km += home;
  return { stops: legs, back_to_the_factory_km: start && back ? routeR1_(home) : null,
           total_km: routeR1_(km), driving_minutes: routeMin_(km), minutes_at_stops: seq.length * stopMin };
}

/* The day's plan, in figures. elyas and ephrata are the plan reports' values. */
function routePlan_(tripDay, elyas, ephrata) {
  var places = routePlaces_(), memo = {};
  var factory = places[routeNorm_(ROUTE_FACTORY_).trim()] || null;
  var start = factory ? { lat: factory.lat, lng: factory.lng } : null;
  var unknown = [];

  /* the truck: Elyas's jobs for the day, in his order */
  var jobs = rows_((elyas || {}).t_rows).filter(function (r) { return r && (r.code || r.site); }).map(function (r) {
    var code = r.code ? opsCode_(r.code) : '', site = String(r.site || '').trim();
    var w = routeWhere_(site, places, memo);
    if (!w) unknown.push({ what: (code || 'a job') + ' (Elyas’s plan)', site: site || 'no site written' });
    return { label: code || site, site: site, where: w, lat: w && w.lat, lng: w && w.lng,
             extra: { crew: a_(r, 'crew'), m2: a_(r, 'm2') } };
  });
  var placed = jobs.filter(function (j) { return j.where; });
  var truck = null;
  if (placed.length) {
    var best = routeBest_(placed, start);
    truck = routeLegs_(best, start, !!start, ROUTE_STOP_MIN_.install);
    var given = routeLen_(placed, start, !!start);
    truck.elyas_order = placed.map(function (j) { return j.label; });
    truck.best_order = best.map(function (j) { return j.label; });
    truck.elyas_order_km = routeR1_(given);
    truck.saving_km = routeR1_(Math.max(0, given - routeLen_(best, start, !!start)));
    truck.same_as_elyas = truck.elyas_order.join('|') === truck.best_order.join('|') || truck.saving_km < 0.5;
  }

  /* the visits: by the person who goes; at their times when times are given */
  var visits = rows_((ephrata || {}).tm_visits).filter(function (r) { return r && (r.cust || r.where); }).map(function (r) {
    var site = String(r.where || '').trim(), w = routeWhere_(site, places, memo);
    var label = String(r.cust || '').trim() + (r.lc ? ' (' + String(r.lc).trim() + ')' : '');
    if (!w) unknown.push({ what: (label || 'a visit') + ' (Ephrata’s visits)', site: site || 'no area written' });
    return { label: label || site, site: site, where: w, lat: w && w.lat, lng: w && w.lng, who: String(r.who || '').trim() || 'not said',
             at: routeTime_(r.time), extra: { time: String(r.time || '').trim(), who: String(r.who || '').trim() } };
  });
  var byWho = {};
  visits.filter(function (v) { return v.where; }).forEach(function (v) { (byWho[v.who] = byWho[v.who] || []).push(v); });
  var visitRoutes = Object.keys(byWho).map(function (who) {
    var vs = byWho[who];
    var timed = vs.every(function (v) { return v.at !== null; });
    var seq = timed ? vs.slice().sort(function (a, b) { return a.at - b.at; }) : routeBest_(vs, start);
    var r = routeLegs_(seq, start, false, ROUTE_STOP_MIN_.visit);
    r.who = who;
    r.ordered_by = timed ? 'the times booked' : 'the shortest way (no times were given)';
    r.cannot_make_it = [];
    if (timed) {
      for (var i = 1; i < seq.length; i++) {
        var need = ROUTE_STOP_MIN_.visit + routeMin_(routeKm_(seq[i - 1], seq[i])), gap = seq[i].at - seq[i - 1].at;
        if (gap < need) r.cannot_make_it.push({ from: seq[i - 1].label + ' at ' + routeClock_(seq[i - 1].at), to: seq[i].label + ' at ' + routeClock_(seq[i].at),
                                               minutes_between: gap, minutes_needed: need });
      }
    }
    return r;
  });

  /* a visit near a delivery: the designer could go with the truck */
  var near = [];
  visits.filter(function (v) { return v.where; }).forEach(function (v) {
    placed.forEach(function (j) {
      var k = routeKm_(v, j);
      if (k <= 3) near.push({ visit: v.label, job: j.label, km_apart: routeR1_(k) });
    });
  });

  var ready = ay_(elyas, 't_ready');
  return {
    trip_day: dayLabel_(tripDay),
    from: factory ? ROUTE_FACTORY_ : null,
    factory_place_missing: !factory,
    estimates: 'Distances are straight lines × ' + ROUTE_ROAD_ + ' for the roads, at ' + ROUTE_KMH_ + ' km/h across the city: estimates, not measured.',
    elyas_plan_filed: !!(elyas && Object.keys(elyas).length), ephrata_visits_filed: !!(ephrata && Object.keys(ephrata).length),
    truck: truck,
    visits: visitRoutes,
    visits_near_a_delivery: near,
    not_placed: unknown,
    sites_confirmed_ready: ready,
    not_ready_why: ready === false ? String((elyas || {}).t_ready_why || '').substring(0, 400) : ''
  };
}

/* the morning agent's figures: the plan reports of the day read, for the next working day */
function routeFacts_(d) {
  var trip = hrWorkday_(addDays_(d.day, 1), 1);
  var p = routePlan_(trip, vals_(d.filed, 'elyas-daily'), vals_(d.filed, 'ephrata-daily'));
  p.the_day_read = dayLabel_(d.day);
  var acts = {};
  if (p.truck && !p.truck.same_as_elyas) (acts.Mahelet = acts.Mahelet || []).push({ do: 'send Alex’s truck in this order: ' + p.truck.best_order.join(' → '), why: 'it saves ' + p.truck.saving_km + ' km' });
  if (p.factory_place_missing) (acts.Mahelet = acts.Mahelet || []).push({ do: 'write the factory’s area on the Places tab of the Sheet', why: 'routes cannot start from the factory until it is there' });
  p.not_placed.forEach(function (u) { (acts.Mahelet = acts.Mahelet || []).push({ do: 'add “' + u.site + '” to the Places tab with its area', why: u.what + ' could not be placed' }); });
  p.visits.forEach(function (v) { v.cannot_make_it.forEach(function (c) { (acts.Ephrata = acts.Ephrata || []).push({ do: 'move the visit ' + c.to + ' or send someone else', why: c.minutes_between + ' minutes after ' + c.from + ', ' + c.minutes_needed + ' needed' }); }); });
  if (p.sites_confirmed_ready === false) (acts.Elyas = acts.Elyas || []).push({ do: 'confirm each site with the customer before the truck leaves', why: p.not_ready_why || 'not every site was confirmed ready' });
  Object.keys(acts).forEach(function (k) { acts[k] = acts[k].slice(0, 4); });
  p.today_actions = acts;
  return p;
}

/* the plan in plain words, written in code — the draft sent the evening before */
function routeText_(p) {
  var L = [];
  if (p.truck) {
    L.push(p.trip_day + ' — Alex’s truck' + (p.from ? ', from the factory' : ' (the factory’s place is not set, so from the first stop)') + ':');
    p.truck.stops.forEach(function (s) {
      var x = s.extra || {};
      L.push(s.order + '. ' + s.stop + ' · ' + (s.found_as || s.place) + (x.crew !== null && x.crew !== undefined ? ' · crew ' + x.crew : '') +
             (x.m2 !== null && x.m2 !== undefined ? ' · ' + x.m2 + ' m²' : '') + (s.km_from_last !== null ? ' — ' + s.km_from_last + ' km, ~' + s.minutes_from_last + ' min' : ''));
    });
    if (p.truck.back_to_the_factory_km !== null) L.push('Back to the factory: ' + p.truck.back_to_the_factory_km + ' km.');
    L.push('About ' + p.truck.total_km + ' km and ' + p.truck.driving_minutes + ' min of driving, with ' + ROUTE_STOP_MIN_.install + ' min at each stop.');
    if (!p.truck.same_as_elyas) L.push('Elyas’s order would be ' + p.truck.elyas_order_km + ' km: this saves ' + p.truck.saving_km + ' km.');
  } else {
    L.push(p.trip_day + ' — no deliveries placed' + (p.elyas_plan_filed ? '.' : ' (Elyas’s plan not filed yet).'));
  }
  p.visits.forEach(function (v) {
    L.push('Visits, ' + v.who + ' (' + v.ordered_by + '): ' + v.stops.map(function (s) { return s.stop + ' · ' + (s.found_as || s.place) + (s.extra.time ? ' ' + s.extra.time : ''); }).join(' → ') + '.');
    v.cannot_make_it.forEach(function (c) { L.push('  Cannot make it: ' + c.to + ' is ' + c.minutes_between + ' min after ' + c.from + '; ' + c.minutes_needed + ' min are needed.'); });
  });
  p.visits_near_a_delivery.forEach(function (n) { L.push('The visit to ' + n.visit + ' is ' + n.km_apart + ' km from ' + n.job + ': it could go with the truck.'); });
  p.not_placed.forEach(function (u) { L.push('Not placed: ' + u.what + ', “' + u.site + '” — add it to the Places tab of the Sheet.'); });
  if (p.sites_confirmed_ready === false) L.push('Not every site is confirmed ready' + (p.not_ready_why ? ': ' + p.not_ready_why : '') + '.');
  L.push('Distances and times are estimates.');
  return L.join('\n');
}

/* From the watch: Elyas or Ephrata has just filed — tomorrow's route, drafted
   now, to Mahelet and Elyas; again only when it changes. */
function routeRealtime_(fresh) {
  var today = todayAddis_();
  var hit = (fresh || []).some(function (f) { return (f.report === 'elyas-daily' || f.report === 'ephrata-daily') && f.at && dayOf_(f.at) === today; });
  if (!hit) return null;
  var todays = [];
  try { todays = fsQuery_('reports', [['at', 'GREATER_THAN_OR_EQUAL', dayStart_(today)]], 'at'); } catch (e) { todays = fresh; }
  var last = function (id) { var v = null; todays.forEach(function (f) { if (f.report === id) v = f.values || {}; }); return v || {}; };
  var trip = hrWorkday_(addDays_(today, 1), 1);
  var p = routePlan_(trip, last('elyas-daily'), last('ephrata-daily'));
  if (!p.truck && !p.visits.length && !p.not_placed.length) return { stops: 0 };
  var text = routeText_(p);
  var props = PropertiesService.getScriptProperties(), key = 'ROUTE_SENT_' + trip, h = ownHash_(text);
  if (props.getProperty(key) === h) return { unchanged: true };
  ['liu', 'elyas'].forEach(function (to) {
    try {
      fsPut_('readings/' + to + '_morning_route', { to: to, agent: 'route', kind: 'morning', en: 'Tomorrow’s route (draft)', am: 'የነገ የጉዞ መስመር (ረቂቅ)',
                                                    text: text.substring(0, 4000), day: today, at: new Date() });
      pushTo_(to, 'Tomorrow’s route', p.trip_day + ': ' + (p.truck ? p.truck.stops.length + ' stop' + (p.truck.stops.length === 1 ? '' : 's') + ', about ' + p.truck.total_km + ' km' : 'visits only'), 'readings', '');
    } catch (e) { Logger.log('route to %s: %s', to, e.message); }
  });
  props.setProperty(key, h);
  return { stops: p.truck ? p.truck.stops.length : 0, visits: p.visits.length };
}
