/* Where the phone is, for the office check-in (js/app.js atScanCard, js/scan.js).

   kleverWhere() → a promise of {lat, lng, acc} — acc in metres — or of
   {err: 'denied' | 'none' | 'slow'}.

   IPHONES (26 Oct 2026, the user: "on iPhone the scan struggles — it says no
   location turned on"). It used to give up 15 seconds after the page asked,
   and those 15 seconds ran while the person was still reading "Allow
   location?" — and an iPhone indoors often needs longer than that for its
   first fix. So a phone with location on was told to turn it on. Now:
     · a quick rough fix (Wi-Fi and the mobile network, at most a minute old)
       is asked for beside the precise one, and the better of them wins;
     · the clock starts at the FIRST fix, not at the question: done at once
       within 50 m (the office counts a place to 200 m), otherwise the best
       one 2.5 seconds after the first;
     · with no fix at all: 'denied' at once when it is refused, else 'slow'
       (or 'none' when the phone says it cannot find one) after 45 seconds.
   `onWait(seconds)` is told every few seconds while nothing has come, so the
   page can say "still looking — stand near a window".                       */
(function () {
  'use strict';
  /* `first`: how long the quick scan page waits for the place before it sends
     the scan without one (js/scan.js) */
  var MS = window.KLEVER_WHERE_MS || { good: 50, after: 2500, all: 45000, tick: 5000, first: 2500 };
  window.KLEVER_WHERE_FIRST = MS.first || 2500;

  window.kleverWhere = function (onWait) {
    return new Promise(function (done) {
      var g = navigator.geolocation, best = null, ids = [], over = false;
      var tAfter = 0, tAll = 0, tTick = 0, lastErr = 0, t0 = Date.now();
      function end(x) {
        if (over) return;
        over = true;
        clearTimeout(tAfter); clearTimeout(tAll); clearInterval(tTick);
        ids.forEach(function (id) { try { g.clearWatch(id); } catch (e) {} });
        done(x);
      }
      function got(p) {
        var c = p && p.coords;
        if (!c) return;
        var x = { lat: c.latitude, lng: c.longitude, acc: Math.round(c.accuracy || 99999) };
        if (!best || x.acc < best.acc) best = x;
        if (best.acc <= MS.good) return end(best);
        if (!tAfter) tAfter = setTimeout(function () { end(best); }, MS.after);
      }
      function bad(e) {
        lastErr = (e && e.code) || 0;
        /* refused: said at once. Not found yet (2) or timed out (3): the
           watch goes on until the time is up */
        if (lastErr === 1 && !best) end({ err: 'denied' });
      }
      if (!g) return done({ err: 'none' });
      tAll = setTimeout(function () { end(best || { err: lastErr === 2 ? 'none' : 'slow' }); }, MS.all);
      if (onWait) tTick = setInterval(function () { if (!best) { try { onWait(Math.round((Date.now() - t0) / 1000)); } catch (e) {} } }, MS.tick);
      try { g.getCurrentPosition(got, bad, { enableHighAccuracy: false, maximumAge: 60000, timeout: MS.all }); } catch (e) {}
      try { ids.push(g.watchPosition(got, bad, { enableHighAccuracy: true, maximumAge: 0, timeout: MS.all })); }
      catch (e) { if (!best) end({ err: 'none' }); }
    });
  };
})();
