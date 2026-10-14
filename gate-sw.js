/* Klever — the factory gate's tablet keeps working without the internet.

   The bug hunt (15 Oct 2026): the gate page reloads itself once a night;
   with the line down at that hour the tablet showed the browser's own "no
   internet" page and nobody could check in all morning — the very outage
   the waiting scans were built for. This worker keeps the page, its
   scripts, the Firebase code, the face engine and its models on the tablet
   (js/gate.js puts them in the cache once they have loaded), and answers
   from there when the network does not.

   Only the gate page is in its care (registered with scope './gate').
   Firestore, sign-in and the script are never touched: they go to the
   network as always, and Firestore keeps its own copy on the tablet.      */

var CACHE = 'klever-gate-v1';

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

function keep(req, res) {
  if (res && (res.ok || res.type === 'opaque')) {
    var copy = res.clone();
    caches.open(CACHE).then(function (c) { c.put(req, copy); });
  }
  return res;
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var u = new URL(req.url);
  /* the page asking "is the line up?" must hear the truth */
  if (u.search.indexOf('gate-probe') !== -1) return;
  var same = u.origin === self.location.origin;
  var cdn = (u.hostname === 'www.gstatic.com' && u.pathname.indexOf('/firebasejs/') === 0) ||
            u.hostname === 'cdn.jsdelivr.net' || u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
  if (!same && !cdn) return;
  if (req.mode === 'navigate' || (same && /\/gate\.html$/.test(u.pathname))) {
    /* the page: the newest when the line is up, the kept one when it is not */
    e.respondWith(fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(u.origin + u.pathname, copy); });
      }
      return res;
    })['catch'](function () {
      return caches.match(u.origin + u.pathname).then(function (hit) { return hit || caches.match(req); });
    }));
    return;
  }
  if (same) {
    /* our own files carry their version in the address (stamp.py): kept copy first, refreshed behind */
    e.respondWith(caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) { return keep(req, res); });
      return hit || net;
    }));
    return;
  }
  /* Firebase, the face engine and its models, the fonts: fixed versions — kept copy first */
  e.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (res) { return keep(req, res); });
  }));
});
