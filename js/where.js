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
       one 2.5 seconds after the first within 200 m (see below);
     · with no fix at all: 'denied' at once when it is refused, else 'slow'
       (or 'none' when the phone says it cannot find one) after 45 seconds.
   `onWait(seconds)` is told every few seconds while nothing usable has come,
   so the page can say "still looking — stand near a window".

   A ROUGH FIX IS NOT SENT (9 Nov 2026, the user: "he was here, why did it put
   him 1 km away"). Yonas at 8:05 was placed 59 m from the office, but the
   phone was only sure to ±1,414 m — its first quick guess from the towers,
   before the GPS woke. 2.5 seconds later the page sent it and the office
   refused it (it takes a place sure to 200 m); the same phone was sure to
   13–28 m on other days. So the 2.5 seconds only start at a fix the office
   can use (`ok`); with only rough ones the phone keeps looking up to `poor`
   after the first, and only then is the rough one sent (and refused, with
   "try again").                                                            */
(function () {
  'use strict';
  /* `first`: how long the quick scan page waits for the place before it sends
     the scan without one (js/scan.js). `ok`: the office's own limit
     (apps-script/Attend.js AT_ACC_M_) */
  var MS = Object.assign({ good: 50, ok: 200, after: 2500, poor: 30000, all: 45000, tick: 5000, first: 2500 }, window.KLEVER_WHERE_MS || {});
  window.KLEVER_WHERE_FIRST = MS.first;

  window.kleverWhere = function (onWait) {
    return new Promise(function (done) {
      var g = navigator.geolocation, best = null, ids = [], over = false;
      var tAfter = 0, tPoor = 0, tAll = 0, tTick = 0, lastErr = 0, t0 = Date.now();
      function end(x) {
        if (over) return;
        over = true;
        clearTimeout(tAfter); clearTimeout(tPoor); clearTimeout(tAll); clearInterval(tTick);
        ids.forEach(function (id) { try { g.clearWatch(id); } catch (e) {} });
        done(x);
      }
      function got(p) {
        var c = p && p.coords;
        if (!c) return;
        var x = { lat: c.latitude, lng: c.longitude, acc: Math.round(c.accuracy || 99999) };
        if (!best || x.acc < best.acc) best = x;
        if (best.acc <= MS.good) return end(best);
        if (best.acc <= MS.ok) {
          if (!tAfter) tAfter = setTimeout(function () { end(best); }, MS.after);
        } else if (!tPoor) tPoor = setTimeout(function () { end(best); }, MS.poor);
      }
      function bad(e) {
        lastErr = (e && e.code) || 0;
        /* refused: said at once. Not found yet (2) or timed out (3): the
           watch goes on until the time is up */
        if (lastErr === 1 && !best) end({ err: 'denied' });
      }
      if (!g) return done({ err: 'none' });
      tAll = setTimeout(function () { end(best || { err: lastErr === 2 ? 'none' : 'slow' }); }, MS.all);
      if (onWait) tTick = setInterval(function () { if (!best || best.acc > MS.ok) { try { onWait(Math.round((Date.now() - t0) / 1000)); } catch (e) {} } }, MS.tick);
      try { g.getCurrentPosition(got, bad, { enableHighAccuracy: false, maximumAge: 60000, timeout: MS.all }); } catch (e) {}
      try { ids.push(g.watchPosition(got, bad, { enableHighAccuracy: true, maximumAge: 0, timeout: MS.all })); }
      catch (e) { if (!best) end({ err: 'none' }); }
    });
  };
})();
