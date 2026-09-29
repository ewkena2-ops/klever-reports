/* Klever — the Chairman's charts, drawn by hand in SVG.

   WHY BY HAND
   The page already draws its sky this way, and a chart library is a hundred
   kilobytes a phone in Addis has to fetch before he sees a single bar. Four
   kinds of mark cover everything he needs: a grid of who reported, columns
   against a target, a line against a floor, and the words above each.

   THE RULES THESE FOLLOW
   · A figure that was not reported is not a zero. It is drawn as a small grey
     mark on the baseline and said in words — the same rule as the agents.
   · Colour means one thing everywhere on the site: teal is on time or met,
     gold is late, red is missing or short. It never carries the meaning
     alone — every cell has its sign (✓ ! ✕) and every chart says in words
     what the colours mean.
   · Every value can be read without hovering: the headline says the latest
     one, and "The numbers" under each chart lists them all.
   · Sizes are real pixels, measured from the page, so text is the same size
     on a phone as on a desk; a chart redraws itself when its width changes.

   Nothing here reads Firebase. chairman.js gathers the figures and hands
   them over; this file only draws.                                         */

(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  function sv(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(e);
    return e;
  }
  function el(tag, cls, txt, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    if (parent) parent.appendChild(e);
    return e;
  }
  function stext(parent, x, y, s, cls, anchor) {
    var t = sv('text', { x: x, y: y, 'class': cls || 'cg-tick', 'text-anchor': anchor || 'start' }, parent);
    t.textContent = s;
    return t;
  }

  /* 0 / 20 / 40 / 60 — round steps the eye can read */
  function niceMax(v) {
    if (!(v > 0)) return 1;
    var p = Math.pow(10, Math.floor(Math.log(v) / Math.LN10)), m = v / p;
    var step = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
    return step * p;
  }

  /* ---------------- the tooltip: one per chart ---------------- */

  function tipFor(wrap) {
    var tip = el('div', 'cg-tip', null, wrap);
    tip.setAttribute('role', 'status');
    tip.hidden = true;
    return {
      show: function (lines, x, y) {
        tip.innerHTML = '';
        lines.forEach(function (l, i) { el('div', i === 0 ? 'cg-tip-v' : 'cg-tip-k', l, tip); });
        tip.hidden = false;
        var w = wrap.clientWidth, tw = tip.offsetWidth;
        tip.style.left = Math.max(0, Math.min(w - tw, x - tw / 2)) + 'px';
        tip.style.top = Math.max(0, y - tip.offsetHeight - 10) + 'px';
      },
      hide: function () { tip.hidden = true; }
    };
  }
  /* a mark he can point at, tap, or reach with the keyboard */
  function hit(g, attrs, lines, tip, wrap, onOn, onOff) {
    var r = sv('rect', Object.assign({ 'class': 'cg-hit', tabindex: '0', role: 'img',
                                       'aria-label': lines.join(' — ') }, attrs), g);
    function on() {
      var b = r.getBoundingClientRect(), w = wrap.getBoundingClientRect();
      tip.show(lines, b.left - w.left + b.width / 2, b.top - w.top + Math.min(b.height, 40) * 0.3);
      if (onOn) onOn();
    }
    function off() { tip.hide(); if (onOff) onOff(); }
    r.addEventListener('pointerenter', on);
    r.addEventListener('pointerdown', on);
    r.addEventListener('pointerleave', off);
    r.addEventListener('focus', on);
    r.addEventListener('blur', off);
    return r;
  }

  /* "The numbers" — every value in the chart, as a table */
  function table(title, head, rows) {
    var d = el('details', 'cg-table');
    el('summary', null, title, d);
    var tb = el('table', null, null, d), tr = el('tr', null, null, el('thead', null, null, tb));
    head.forEach(function (h) { el('th', null, h, tr); });
    var body = el('tbody', null, null, tb);
    rows.forEach(function (r) {
      var row = el('tr', null, null, body);
      r.forEach(function (c, i) { el('td', i ? 'num' : null, c, row); });
    });
    return d;
  }

  /* A chart that knows its width: drawn now, and again when the page's width
     changes (a phone turned, a window resized). */
  function sized(wrap, draw) {
    var last = 0;
    function go() {
      var w = Math.round(wrap.clientWidth);
      if (!w || w === last) return;
      last = w;
      draw(w);
    }
    if (window.ResizeObserver) new ResizeObserver(go).observe(wrap);
    else window.addEventListener('resize', go);
    requestAnimationFrame(go);
  }

  /* The scale: its bottom, the target line's own value (in bold — the line is
     named in the key under the chart, never written on the plot, where the
     data would run through the words), and the top when it has room. */
  function axis(svg, o, lo, top, y, L, R, W) {
    var ticks = [lo, top];
    if (o.ref) ticks.splice(1, 0, o.ref.v);
    else ticks.splice(1, 0, (lo + top) / 2);
    ticks.forEach(function (v, i) {
      if (o.ref && i === 2 && Math.abs(y(v) - y(o.ref.v)) < 14) return;
      var isRef = o.ref && v === o.ref.v;
      if (!isRef) sv('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), 'class': v === lo ? 'cg-base' : 'cg-grid' }, svg);
      stext(svg, L - 6, y(v) + 4, (o.tick || o.fmt)(v), isRef ? 'cg-tick cg-reftick' : 'cg-tick', 'end');
    });
    if (o.ref) sv('line', { x1: L, x2: W - R, y1: y(o.ref.v), y2: y(o.ref.v), 'class': 'cg-ref' }, svg);
  }
  function legend(box, o) {
    if (!o.legend && !o.ref) return;
    var lg = el('div', 'cg-legend', null, box);
    if (o.ref) {
      var r = el('span', 'cg-key cg-refkey', null, lg);
      el('b', null, null, r);
      r.appendChild(document.createTextNode(o.ref.label));
    }
    (o.legend || []).forEach(function (l) {
      var k = el('span', 'cg-key ' + l[0], null, lg);
      el('i', null, l[2] || '', k);
      k.appendChild(document.createTextNode(l[1]));
    });
  }

  /* the words above a chart: its name, and the one thing to know */
  function head(box, o) {
    var h = el('div', 'cg-head', null, box);
    el('h3', 'cg-title', o.title, h);
    if (o.sub) el('p', 'cg-sub', o.sub, h);
    if (o.status) {
      var s = el('p', 'cg-now ' + (o.status.kind || ''), null, h);
      if (o.status.icon) el('span', 'cg-ic', o.status.icon, s);
      s.appendChild(document.createTextNode(o.status.text));
    }
  }

  /* ================= who reported: a grid of people and days ================= */

  /* opts: {title, sub, cols:[{top, bottom, title, today, tip:[...]}],
            rows:[{name, cells:[{s:'ok'|'late'|'miss'|'wait'|null, tip:[...]}]}],
            legend:[[s, icon, label]], numbers, caption} */
  var ICON = { ok: '✓', late: '!', miss: '✕', wait: '·' };

  function grid(o) {
    var box = el('section', 'cg cg-grid');
    head(box, o);
    var wrap = el('div', 'cg-plot', null, box);
    var tip = tipFor(wrap);

    sized(wrap, function (W) {
      Array.prototype.slice.call(wrap.querySelectorAll('svg')).forEach(function (s) { s.remove(); });
      var nameW = Math.min(96, Math.max(70, Math.round(W * 0.24)));
      var n = o.cols.length, gap = 3;
      var cell = Math.max(14, Math.min(24, Math.floor((W - nameW - 4) / n) - gap));
      var headH = 30, H = headH + o.rows.length * (cell + gap) + 2;
      var svg = sv('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, 'class': 'cg-svg',
                            role: 'group', 'aria-label': o.title });
      wrap.insertBefore(svg, tip.el || wrap.firstChild);
      var x0 = nameW;
      o.cols.forEach(function (c, j) {
        var cx = x0 + j * (cell + gap) + cell / 2;
        stext(svg, cx, 11, c.top, 'cg-tick' + (c.today ? ' cg-today' : ''), 'middle');
        stext(svg, cx, 24, c.bottom, 'cg-tick' + (c.today ? ' cg-today' : ''), 'middle');
        if (c.tip) hit(svg, { x: cx - cell / 2 - 1, y: 0, width: cell + 2, height: headH - 2 }, c.tip, tip, wrap);
      });
      o.rows.forEach(function (r, i) {
        var y = headH + i * (cell + gap);
        stext(svg, 0, y + cell / 2 + 4, r.name, 'cg-name');
        r.cells.forEach(function (c, j) {
          var x = x0 + j * (cell + gap);
          if (!c || !c.s) {
            sv('rect', { x: x + cell / 2 - 1.5, y: y + cell / 2 - 1.5, width: 3, height: 3, rx: 1.5, 'class': 'cg-none' }, svg);
            return;
          }
          var g = sv('g', { 'class': 'cg-cell s-' + c.s }, svg);
          sv('rect', { x: x, y: y, width: cell, height: cell, rx: 4, 'class': 'cg-sq' }, g);
          if (cell >= 14) stext(g, x + cell / 2, y + cell / 2 + 4, ICON[c.s], 'cg-ic', 'middle');
          hit(g, { x: x - 1, y: y - 1, width: cell + 2, height: cell + 2 }, c.tip, tip, wrap,
              function () { g.classList.add('on'); }, function () { g.classList.remove('on'); });
        });
      });
    });

    var lg = el('div', 'cg-legend', null, box);
    o.legend.forEach(function (l) {
      var k = el('span', 'cg-key s-' + l[0], null, lg);
      el('i', null, l[1], k);
      k.appendChild(document.createTextNode(l[2]));
    });
    if (o.caption) el('p', 'cg-cap', o.caption, box);
    if (o.numbers) box.appendChild(table(o.numbers.title, o.numbers.head, o.numbers.rows));
    return box;
  }

  /* ================= columns against a target ================= */

  /* opts: {title, sub, status, points:[{top, bottom, title, v|null, wait, partial, note}],
            ref:{v, label, good:'above'|'below'}, fmt(v), tick(v), words:{notRep, notYet, none},
            legend:[[cls, label]], numbers:{title, head, rows}} */
  function columns(o) {
    var box = el('section', 'cg cg-cols');
    head(box, o);
    var wrap = el('div', 'cg-plot', null, box);
    var tip = tipFor(wrap);
    var vals = o.points.filter(function (p) { return p.v != null; }).map(function (p) { return p.v; });

    sized(wrap, function (W) {
      Array.prototype.slice.call(wrap.querySelectorAll('svg, .cg-empty')).forEach(function (s) { s.remove(); });
      var H = 176, L = 46, R = 8, T = 14, B = 34;
      var pw = W - L - R, ph = H - T - B;
      /* a percentage stops at 100 — a pass-rate axis running to 200% would
         make 98% look like half */
      var top = o.max || niceMax(Math.max(o.ref ? o.ref.v * 1.25 : 0, Math.max.apply(null, vals.concat([0])) * 1.08));
      var y = function (v) { return T + ph - (v / top) * ph; };
      var svg = sv('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, 'class': 'cg-svg',
                            role: 'group', 'aria-label': o.title });
      wrap.insertBefore(svg, wrap.firstChild);

      axis(svg, o, 0, top, y, L, R, W);

      var n = o.points.length, band = pw / n, bw = Math.min(24, Math.max(6, band * 0.62));
      var every = Math.ceil(n / Math.max(1, Math.floor(pw / 22)));
      var lastIdx = -1;
      o.points.forEach(function (p, i) { if (p.v != null) lastIdx = i; });
      o.points.forEach(function (p, i) {
        var cx = L + band * i + band / 2;
        if (i % every === 0 || i === n - 1) {
          stext(svg, cx, H - B + 15, p.top, 'cg-tick', 'middle');
          stext(svg, cx, H - B + 28, p.bottom, 'cg-tick', 'middle');
        }
        var g = sv('g', null, svg), lines;
        if (p.v == null) {
          sv('rect', { x: cx - 5, y: y(0) - 2, width: 10, height: 2, rx: 1, 'class': p.wait ? 'cg-wait' : 'cg-none' }, g);
          lines = [p.wait ? o.words.notYet : o.words.notRep, p.title];
        } else {
          var h = Math.max(1.5, y(0) - y(p.v)), x = cx - bw / 2, yt = y(0) - h, rr = Math.min(4, bw / 2, h);
          var good = !o.ref || (o.ref.good === 'above' ? p.v >= o.ref.v : p.v <= o.ref.v);
          sv('path', { d: 'M' + x + ',' + y(0) + 'V' + (yt + rr) + 'Q' + x + ',' + yt + ' ' + (x + rr) + ',' + yt +
                          'H' + (x + bw - rr) + 'Q' + (x + bw) + ',' + yt + ' ' + (x + bw) + ',' + (yt + rr) +
                          'V' + y(0) + 'Z',
                       'class': 'cg-bar ' + (p.partial ? 'is-partial' : good ? 'is-good' : 'is-bad') }, g);
          lines = [o.fmt(p.v), p.title].concat(p.note ? [p.note] : []);
          /* the latest figure, said at its bar — short, and kept inside the card */
          if (i === lastIdx) {
            var lab = (o.lab || o.tick || o.fmt)(p.v);
            var anchor = cx > W - R - 30 ? 'end' : 'middle';
            /* just above the bar — or inside its top when the target line
               runs where the words would sit */
            var ry = o.ref ? y(o.ref.v) : -99;
            var ly = ry > yt - 15 && ry < yt - 1 && h > 22 ? yt + 13 : yt - 5;
            stext(svg, anchor === 'end' ? Math.min(W - R, cx + bw / 2) : cx, ly, lab, 'cg-val', anchor);
          }
        }
        hit(g, { x: L + band * i, y: T, width: band, height: ph + 2 }, lines, tip, wrap,
            function () { g.classList.add('on'); }, function () { g.classList.remove('on'); });
      });
    });

    legend(box, o);
    if (o.numbers) box.appendChild(table(o.numbers.title, o.numbers.head, o.numbers.rows));
    return box;
  }

  /* ================= a line against a floor ================= */

  /* opts: {title, sub, status, points:[{top, bottom, title, v|null, note}], ref:{v, label, good},
            joinGap (days a line may cross — a Sunday), fmt, tick, words, numbers} */
  function line(o) {
    var box = el('section', 'cg cg-line');
    head(box, o);
    var wrap = el('div', 'cg-plot', null, box);
    var tip = tipFor(wrap);
    var vals = o.points.filter(function (p) { return p.v != null; }).map(function (p) { return p.v; });

    sized(wrap, function (W) {
      Array.prototype.slice.call(wrap.querySelectorAll('svg, .cg-empty')).forEach(function (s) { s.remove(); });
      var H = 176, L = 46, R = 10, T = 14, B = 34;
      var pw = W - L - R, ph = H - T - B, n = o.points.length;
      /* a rate that lives near 100 is read on its own range (80–100), or 97
         and 98 look the same; a line, unlike a bar, may start above zero */
      var lo = o.min || 0;
      var top = o.max || niceMax(Math.max(o.ref ? o.ref.v * 1.25 : 0, Math.max.apply(null, vals.concat([0])) * 1.08));
      var y = function (v) { return T + ph - ((Math.max(lo, Math.min(top, v)) - lo) / (top - lo)) * ph; };
      var x = function (i) { return L + (n > 1 ? pw * i / (n - 1) : pw / 2); };
      var svg = sv('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, 'class': 'cg-svg',
                            role: 'group', 'aria-label': o.title });
      wrap.insertBefore(svg, wrap.firstChild);

      axis(svg, o, lo, top, y, L, R, W);
      var every = Math.ceil(n / Math.max(1, Math.floor(pw / (o.labelGap || 34))));
      o.points.forEach(function (p, i) {
        if (i % every === 0 || i === n - 1) {
          stext(svg, x(i), H - B + 15, p.top, 'cg-tick', 'middle');
          stext(svg, x(i), H - B + 28, p.bottom, 'cg-tick', 'middle');
        }
      });

      /* the line runs only between figures close enough in time that nothing
         owed lies between them — a week with no report is a gap, not a slope */
      var prev = -1, d = '';
      o.points.forEach(function (p, i) {
        if (p.v == null) return;
        d += (prev >= 0 && i - prev <= (o.joinGap || 2) ? 'L' : 'M') + x(i) + ',' + y(p.v);
        prev = i;
      });
      if (d) sv('path', { d: d, 'class': 'cg-path' }, svg);

      var cross = sv('line', { x1: 0, x2: 0, y1: T, y2: T + ph, 'class': 'cg-cross', visibility: 'hidden' }, svg);
      var band = n > 1 ? pw / (n - 1) : pw;
      o.points.forEach(function (p, i) {
        var g = sv('g', null, svg);
        if (p.v != null) {
          var good = !o.ref || (o.ref.good === 'above' ? p.v >= o.ref.v : p.v <= o.ref.v);
          sv('circle', { cx: x(i), cy: y(p.v), r: 4.5, 'class': 'cg-dot ' + (good ? 'is-good' : 'is-bad') }, g);
        }
        var lines = p.v != null ? [o.fmt(p.v), p.title].concat(p.note ? [p.note] : [])
                                : [o.words.notRep, p.title];
        hit(g, { x: x(i) - band / 2, y: T, width: band, height: ph + 2 }, lines, tip, wrap,
            function () { cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.setAttribute('visibility', 'visible'); },
            function () { cross.setAttribute('visibility', 'hidden'); });
      });
      /* the latest figure, said at its point */
      for (var k = n - 1; k >= 0; k--) {
        if (o.points[k].v != null) {
          var lx = x(k), anchor = lx > W - 70 ? 'end' : lx < L + 40 ? 'start' : 'middle';
          var py = y(o.points[k].v), above = py - 10;
          /* never on top of the reference line's own words or stroke */
          if (o.ref && Math.abs(above - y(o.ref.v)) < 12) above = py + 18;
          stext(svg, anchor === 'end' ? lx + 4 : lx, above, (o.lab || o.tick || o.fmt)(o.points[k].v), 'cg-val', anchor);
          break;
        }
      }
    });

    legend(box, o);
    if (o.numbers) box.appendChild(table(o.numbers.title, o.numbers.head, o.numbers.rows));
    return box;
  }

  window.KleverCharts = { grid: grid, columns: columns, line: line, niceMax: niceMax };
})();
