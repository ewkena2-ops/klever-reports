/* THE WEEKLY REPORT WRITES ITSELF (the Chairman, 11 Oct 2026: "nobody
   fills a weekly report any more — it is made from the daily reports and
   sent to the boss, like a weekly summary").

   A weekly summary in forms.js marked `built:1` is no longer a form anyone
   fills. Every answer it files is worked out from the week's daily reports:
   the m² of the week is the days' m² added up, the complaints of the week are
   the rows of the days' complaint lists, the bank at the end of the week is
   Saturday's bank figure. A question nobody's daily asks is simply not in it.

   build() takes the forms (REPORTS), a weekly report and the filings of the
   week, and returns the answers under the weekly report's own keys — the
   keys the rulebook, the agents, the registers and the Sheet have always read
   — and the message the boss receives. The script (apps-script/Weekly.js)
   files it on Sunday; the site shows the same thing to the person and to the
   Chairman before then (form.html, a built report). Pure functions: nothing
   here reads or writes the database, so Node can test it on real reports.

   The kinds are the form's own (js/app.js autoOne) — `week`, `weekDays`,
   `weekRows`, `rows`, `sum`, `pct` and the rest mean exactly what they mean
   on a form — and a few that only a built week needs:
      {week:'tbl.col', when}       each day's list column added up
      {week:'tbl', count:1, when}  each day's rows counted
      {week:'key', how:'anyyes'|'allyes'|'yesdays'|'nodays'}   a yes/no week
      {weekLast:'key'}             the latest day's answer, as filed
      {weekText:'key'}             every day's words, each with its day
      {weekPicks:'multi', map}     a "what happened" list over the week
      {weekByDay:'key', col}       a Monday-to-Saturday grid, a row a day
      {weekRows:'tbl', when}       only the daily rows that match
   `from` names the daily a week kind reads — anyone's ('amaha-daily' inside
   Mahelet's weekly), or 'sales-daily' / 'design-daily' for the person's own
   copy of a shared form. Without it, every daily of the person.            */
(function (root) {
  'use strict';

  var ADDIS_MS = 3 * 3600e3;
  var DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var DAYS_AM = ['እሁድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'];
  var MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MON_AM = ['ጃንዋሪ', 'ፌብሩዋሪ', 'ማርች', 'ኤፕሪል', 'ሜይ', 'ጁን', 'ጁላይ', 'ኦገስት', 'ሴፕቴምበር', 'ኦክቶበር', 'ኖቬምበር', 'ዲሴምበር'];

  function pad2(n) { return ('0' + n).slice(-2); }
  function msOf(at) { return at instanceof Date ? at.getTime() : Number(at); }
  /* the Addis day a moment falls on */
  function dayOf(at) {
    var a = new Date(msOf(at) + ADDIS_MS);
    return a.getUTCFullYear() + '-' + pad2(a.getUTCMonth() + 1) + '-' + pad2(a.getUTCDate());
  }
  function addDays(ymd, n) {
    var d = new Date(ymd + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate());
  }
  function dowOf(ymd) { return new Date(ymd + 'T12:00:00Z').getUTCDay(); }
  function dayStart(ymd) { return new Date(ymd + 'T00:00:00+03:00').getTime(); }
  function dayLabel(ymd, lang) {
    var d = new Date(ymd + 'T12:00:00Z');
    return (lang === 'am' ? DAYS_AM : DAYS_EN)[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' +
           (lang === 'am' ? MON_AM : MON_EN)[d.getUTCMonth()];
  }

  function has(v) { return v != null && String(v).trim() !== ''; }
  function num(v) {
    var x = String(v == null ? '' : v).replace(/[^0-9.\-]/g, '');
    return x === '' ? NaN : Number(x);
  }
  function round(x, n) { var p = Math.pow(10, n); return Math.round(x * p) / p; }

  /* The week a built report is about: the Monday to Saturday before the
     Sunday it is made on (a Sunday given is that week's own end). From the
     start of that Monday to the start of the Sunday — a daily filed late on
     Saturday night is Saturday's. */
  function weekOf(sunday) {
    var sun = addDays(sunday, (7 - dowOf(sunday)) % 7);
    return { sunday: sun, monday: addDays(sun, -6), from: dayStart(addDays(sun, -6)), to: dayStart(sun) };
  }

  function byId(reports) {
    var m = {};
    (reports || []).forEach(function (r) { m[r.id] = r; });
    return m;
  }
  /* the weekly reports that build themselves */
  function builtReports(reports) {
    return (reports || []).filter(function (r) { return r.cadence === 'weekly' && r.built; });
  }

  /* ---------------- one report's answers, worked out ---------------- */

  function Ctx(rep, reports, filings, span) {
    this.rep = rep;
    this.reports = reports;
    this.rid = byId(reports);
    this.filings = filings || [];
    this.span = span;
    this.values = {};
    this.F = {};
    this.list = [];
    var self = this;
    rep.sections.forEach(function (s) {
      s.fields.forEach(function (f) { self.F[f.id] = f; self.list.push(f); });
    });
    this.cache = {};
  }

  /* the daily reports a week kind reads */
  Ctx.prototype.sources = function (k) {
    var rep = this.rep, rid = this.rid;
    if (k.from) {
      var id = rid[k.from] ? k.from : rep.person + '-' + k.from;
      return rid[id] ? [id] : [];
    }
    return this.reports.filter(function (r) { return r.person === rep.person && r.cadence === 'daily'; })
                       .map(function (r) { return r.id; });
  };
  /* the week's filings of those reports: the last of each report on each day
     (a second filing the same day is the correction that stands), by day */
  Ctx.prototype.days = function (k) {
    var ids = this.sources(k), key = ids.join('|');
    if (this.cache[key]) return this.cache[key];
    var best = {}, span = this.span;
    this.filings.forEach(function (f) {
      if (ids.indexOf(f.report) < 0) return;
      var t = msOf(f.at);
      if (!(t >= span.from && t < span.to)) return;
      var k2 = f.report + '|' + dayOf(t);
      if (!best[k2] || t > msOf(best[k2].at)) best[k2] = f;
    });
    var out = Object.keys(best).map(function (x) {
      var f = best[x];
      return { report: f.report, day: dayOf(f.at), at: msOf(f.at), values: f.values || {} };
    }).sort(function (a, b) { return a.day < b.day ? -1 : a.day > b.day ? 1 : a.at - b.at; });
    this.cache[key] = out;
    return out;
  };

  function rowHas(r) {
    if (!r || typeof r !== 'object') return false;
    for (var c in r) if (Object.prototype.hasOwnProperty.call(r, c) && has(r[c])) return true;
    return false;
  }
  function rowIs(r, when) {
    var v = r[when.col];
    if (when.is != null) return String(v == null ? '' : v) === String(when.is);
    if (when['in']) return when['in'].indexOf(String(v == null ? '' : v)) >= 0;
    if (when.not != null) return has(v) && String(v) !== String(when.not);
    if (when.lt != null) { var l = num(v); return !isNaN(l) && l < when.lt; }
    if (when.gte != null) { var g = num(v); return !isNaN(g) && g >= when.gte; }
    if (when.pos) { var x = num(v); return !isNaN(x) && x > 0; }
    return has(v);
  }
  function rowMatches(r, when) {
    if (!when) return true;
    var tests = [].concat(when);
    for (var i = 0; i < tests.length; i++) if (!rowIs(r, tests[i])) return false;
    return true;
  }
  function rowsOf(v) { return Array.isArray(v) ? v.filter(rowHas) : []; }

  /* one day's figure for a `week` kind: an answer, a list column added up,
     or a list's rows counted */
  function dayFigure(vals, k) {
    var key = String(k.week), dot = key.indexOf('.');
    if (k.count) {
      var t = vals[key];
      if (!Array.isArray(t)) return NaN;
      return rowsOf(t).filter(function (r) { return rowMatches(r, k.when); }).length;
    }
    if (dot > 0) {
      var tbl = vals[key.slice(0, dot)], col = key.slice(dot + 1);
      if (!Array.isArray(tbl)) return NaN;
      var tot = 0, got = 0;
      rowsOf(tbl).forEach(function (r) {
        if (!rowMatches(r, k.when)) return;
        var x = num(r[col]);
        if (!isNaN(x)) { tot += x; got++; }
      });
      /* a list that was answered but held none of it is nought that day */
      return got ? tot : 0;
    }
    return num(vals[key]);
  }

  Ctx.prototype.weekFigure = function (k) {
    var days = this.days(k), how = k.how || 'sum';
    if (/^(anyyes|allyes|yesdays|nodays)$/.test(how)) {
      var said = days.map(function (d) { return String(d.values[k.week] == null ? '' : d.values[k.week]); })
                     .filter(function (s) { return s === 'yes' || s === 'no'; });
      var ny = said.filter(function (s) { return s === 'yes'; }).length, nn = said.length - ny;
      if (how === 'yesdays') return said.length ? ny : NaN;
      if (how === 'nodays') return said.length ? nn : NaN;
      if (!said.length) return '';
      if (how === 'anyyes') return ny ? 'yes' : 'no';
      return nn ? 'no' : 'yes';
    }
    var vals = [];
    days.forEach(function (d) {
      var x = dayFigure(d.values, k);
      if (!isNaN(x)) vals.push({ x: x, at: d.at });
    });
    if (!vals.length) return NaN;
    var nums = vals.map(function (v) { return v.x; });
    if (how === 'max') return round(Math.max.apply(null, nums), 3);
    if (how === 'min') return round(Math.min.apply(null, nums), 3);
    if (how === 'last') { vals.sort(function (a, b) { return b.at - a.at; }); return round(vals[0].x, 3); }
    if (how === 'over') return nums.filter(function (x) { return x > k.over; }).length;
    if (how === 'under') return nums.filter(function (x) { return x < k.under; }).length;
    var wt = 0;
    nums.forEach(function (x) { wt += x; });
    return round(how === 'avg' ? wt / nums.length : wt, 3);
  };

  Ctx.prototype.fieldShown = function (f) {
    if (!f.show) return true;
    var p = this.F[f.show.f], w = f.show.when || 'pos', v = this.values;
    if (!p || !this.fieldShown(p)) return false;
    if (w === 'any') return this.filled(p);
    if (w === 'miss') return this.targetMiss(p);
    if (w === 'yes' || w === 'no') return v[p.id] === w;
    if (w === 'is') return v[p.id] === f.show.v;
    if (w === 'has') {
      var hv = String(v[p.id] || '').split(',');
      return [].concat(f.show.v).some(function (c) { return hv.indexOf(c) >= 0; });
    }
    if (p.t === 'ratio') {
      var a = num(v[p.id + '__a']), b = num(v[p.id + '__b']);
      if (w === 'short') return !isNaN(a) && !isNaN(b) && a < b;
      return !isNaN(a) && a > 0;
    }
    var n = num(v[p.id]);
    return !isNaN(n) && n > 0;
  };
  Ctx.prototype.filled = function (f) {
    var v = this.values;
    if (f.t === 'ratio') return has(v[f.id + '__a']) && has(v[f.id + '__b']);
    if (f.t === 'table') return rowsOf(v[f.id]).length > 0;
    if (f.t === 'grid') {
      var g = v[f.id];
      if (!Array.isArray(g) || g.length < (f.rows || []).length) return false;
      return (f.rows || []).every(function (_, i) { return has(g[i] && g[i][f.cols[0].id]); });
    }
    return has(v[f.id]);
  };
  Ctx.prototype.targetValue = function (f) {
    var v = this.values;
    if (f.t === 'ratio') {
      var a = num(v[f.id + '__a']), b = num(v[f.id + '__b']);
      if (isNaN(a)) return NaN;
      if (f.tgt.v >= 50) return (!isNaN(b) && b > 0) ? a / b * 100 : NaN;
      return a;
    }
    if (f.t === 'yesno') return v[f.id] === 'yes' ? 1 : (v[f.id] === 'no' ? 0 : NaN);
    return num(v[f.id]);
  };
  Ctx.prototype.targetMiss = function (f) {
    if (f.t === 'table' || f.t === 'grid' || !f.tgt) return false;
    var x = this.targetValue(f);
    if (isNaN(x)) return false;
    return f.tgt.op === 'gte' ? x < f.tgt.v : x > f.tgt.v;
  };
  Ctx.prototype.closedAtZero = function (tf) {
    if (!tf.show) return false;
    var g = this.F[tf.show.f];
    return !!(g && this.fieldShown(g) && this.filled(g));
  };
  Ctx.prototype.rowsMatch = function (id, when) {
    var f = this.F[id], d = this.values[id];
    if (!f || !Array.isArray(d)) return [];
    return d.filter(function (r) { return rowHas(r) && rowMatches(r, when); });
  };
  Ctx.prototype.side = function (x) {
    if (typeof x === 'number') return x;
    return (x && typeof x === 'object') ? num(this.one(x)) : num(this.values[x]);
  };

  /* one worked-out answer — js/app.js autoOne, over the week */
  Ctx.prototype.one = function (k) {
    var self = this, v = this.values;
    if (!k) return NaN;
    if (k.of != null) return num(v[k.of]);
    if (k.fold != null) {
      return (Array.isArray(v[k.fold]) ? v[k.fold] : []).map(function (r) {
        r = r || {};
        var o = {};
        Object.keys(k.sum || {}).forEach(function (to) {
          var tot = 0, got = 0;
          k.sum[to].forEach(function (c) { var x = num(r[c]); if (!isNaN(x)) { tot += x; got++; } });
          if (got) o[to] = String(round(tot, 3));
        });
        Object.keys(k.join || {}).forEach(function (to) {
          var w = k.join[to].map(function (c) { return String(r[c] == null ? '' : r[c]).trim(); }).filter(Boolean);
          if (w.length) o[to] = w.join(' ');
        });
        Object.keys(k.keep || {}).forEach(function (to) { if (has(r[k.keep[to]])) o[to] = String(r[k.keep[to]]).trim(); });
        return o;
      });
    }
    if (k.picked != null) {
      var mf = this.F[k.picked];
      if (!mf || !this.fieldShown(mf) || !has(v[k.picked])) return '';
      var codes = String(v[k.picked]).split(',');
      var hit = [].concat(k.v).some(function (c) { return codes.indexOf(c) >= 0; });
      return (hit !== !!k.flip) ? 'yes' : 'no';
    }
    if (k.week != null) return this.weekFigure(k);
    if (k.weekDays) {
      var seen = {};
      this.days(k).forEach(function (d) { seen[d.day] = 1; });
      return Object.keys(seen).length || NaN;
    }
    if (k.weekLast != null) {
      var last = '';
      this.days(k).forEach(function (d) { if (has(d.values[k.weekLast])) last = d.values[k.weekLast]; });
      return last;
    }
    if (k.weekText != null) {
      var lines = [];
      this.days(k).forEach(function (d) {
        var w = d.values[k.weekText];
        if (Array.isArray(w) || !has(w)) return;
        lines.push(dayLabel(d.day, 'en') + ': ' + String(w).trim());
      });
      return lines.join('\n');
    }
    if (k.weekPicks != null) {
      var answered = false, got = [];
      this.days(k).forEach(function (d) {
        var w = d.values[k.weekPicks];
        if (!has(w)) return;
        answered = true;
        String(w).split(',').forEach(function (c) {
          c = c.trim();
          var to = k.map ? k.map[c] : c;
          [].concat(to == null ? [] : to).forEach(function (x) { if (x && x !== 'none' && got.indexOf(x) < 0) got.push(x); });
        });
      });
      if (!answered) return '';
      return got.length ? got.join(',') : 'none';
    }
    if (k.weekByDay != null) {
      var grid = this.F[this.current] || {}, rows = [], byDay = {};
      this.days(k).forEach(function (d) { if (has(d.values[k.weekByDay])) byDay[dowOf(d.day)] = d.values[k.weekByDay]; });
      for (var i = 0; i < ((grid.rows || []).length || 6); i++) {
        var o = {};
        if (byDay[i + 1] != null) o[k.col] = String(byDay[i + 1]);
        rows.push(o);
      }
      return rows;
    }
    if (k.weekRows != null) {
      var out = [], map = k.map || null, into = this.F[this.current];
      /* only the weekly list's own columns are filed — a daily column with
         no place in it would be a key nobody reads, under a name of the
         daily's */
      var keepCols = into && into.cols ? into.cols.map(function (c) { return c.id; }) : null;
      this.days(k).forEach(function (d) {
        (Array.isArray(d.values[k.weekRows]) ? d.values[k.weekRows] : []).forEach(function (r) {
          if (!rowHas(r) || !rowMatches(r, k.when)) return;
          var row = {};
          Object.keys(r).forEach(function (c) {
            /* map:{days:null} — a daily column that means something else
               than the weekly's column of the same name — is left out */
            if (map && Object.prototype.hasOwnProperty.call(map, c) && !map[c]) return;
            var to = map && map[c] ? map[c] : c;
            if (!keepCols || keepCols.indexOf(to) >= 0) row[to] = r[c];
          });
          if (k.dayCol) row[k.dayCol] = d.day;
          if (rowHas(row)) out.push(row);
        });
      });
      return out;
    }
    if (k.plus) {
      var tot = 0, got2 = 0;
      k.plus.forEach(function (x) { var y = self.side(x); if (!isNaN(y)) { tot += y; got2++; } });
      return got2 ? round(tot, 3) : NaN;
    }
    if (k.minus) {
      var ma = this.side(k.minus[0]), mb = this.side(k.minus[1]);
      return (isNaN(ma) || isNaN(mb)) ? NaN : round(ma - mb, 3);
    }
    if (k.div || k.pct) {
      var p = k.div || k.pct, x = this.side(p[0]), y = this.side(p[1]);
      if (isNaN(x) || isNaN(y) || y === 0) return NaN;
      return k.pct ? round(x / y * 100, 1) : round(x / y, 2);
    }
    if (k.grid) {
      var gp = String(k.grid).split('.'), gf = this.F[gp[0]];
      if (!gf) return NaN;
      if (!this.fieldShown(gf)) return this.closedAtZero(gf) ? 0 : NaN;
      var gt = 0, gn = 0;
      (Array.isArray(v[gp[0]]) ? v[gp[0]] : []).forEach(function (r) { var gx = num(r && r[gp[1]]); if (!isNaN(gx)) { gt += gx; gn++; } });
      return gn ? round(gt, 3) : NaN;
    }
    if (k.rows) {
      var tf = this.F[k.rows];
      if (!tf) return NaN;
      if (!this.fieldShown(tf)) return this.closedAtZero(tf) ? 0 : NaN;
      if (!rowsOf(v[k.rows]).length) return NaN;
      return this.rowsMatch(k.rows, k.when).length;
    }
    if (k.list) {
      var lp = String(k.list).split('.'), lf = this.F[lp[0]];
      if (!lf || !this.fieldShown(lf)) return '';
      var words = [];
      this.rowsMatch(lp[0], k.when).forEach(function (r) {
        var w2 = String((r && r[lp[1]]) || '').trim();
        if (w2 && words.indexOf(w2) === -1) words.push(w2);
      });
      return words.join(', ');
    }
    if (k.all || k.any) {
      var ap = String(k.all || k.any).split('.'), af = this.F[ap[0]];
      if (!af || !this.fieldShown(af)) return '';
      var ar = this.rowsMatch(ap[0], k.when);
      if (!ar.length) return '';
      var s = ar.map(function (r) { return String((r && r[ap[1]]) || ''); });
      if (k.any) return s.indexOf('yes') >= 0 ? 'yes' : (s.indexOf('no') >= 0 ? 'no' : '');
      if (s.indexOf('no') >= 0) return 'no';
      return s.indexOf('') >= 0 ? '' : 'yes';
    }
    if (k.sum) {
      var sp = String(k.sum).split('.'), sf = this.F[sp[0]];
      if (!sf) return NaN;
      if (!this.fieldShown(sf)) return this.closedAtZero(sf) ? 0 : NaN;
      if (!rowsOf(v[sp[0]]).length) return NaN;
      var st = 0, sn = 0;
      this.rowsMatch(sp[0], k.when).forEach(function (r) { var sx = num(r && r[sp[1]]); if (!isNaN(sx)) { st += sx; sn++; } });
      return sn ? round(st, 3) : NaN;
    }
    return NaN;
  };

  Ctx.prototype.set = function (key, x) {
    if (Array.isArray(x)) { this.values[key] = x; return; }
    var blank = x == null || x === '' || (typeof x === 'number' && isNaN(x));
    if (blank) { delete this.values[key]; return; }
    this.values[key] = String(x);
  };
  /* "Any defects? No" closes the count behind it at nought (zero:1) */
  Ctx.prototype.zeroClosed = function () {
    var self = this;
    this.list.forEach(function (f) {
      if (!f.zero || f.auto) return;
      var g = f.show && self.F[f.show.f];
      if (!self.fieldShown(f) && g && self.fieldShown(g) && self.filled(g)) self.values[f.id] = '0';
      else if (self.values[f.id] === '0') delete self.values[f.id];
    });
  };
  Ctx.prototype.compute = function () {
    var self = this, autos = this.list.filter(function (f) { return f.auto; });
    for (var pass = 0; pass < 4; pass++) {
      this.zeroClosed();
      autos.forEach(function (f) {
        self.current = f.id;
        if (f.t === 'ratio') {
          if (f.auto.a) self.set(f.id + '__a', self.one(f.auto.a));
          if (f.auto.b) self.set(f.id + '__b', self.one(f.auto.b));
        } else {
          self.set(f.id, self.one(f.auto));
        }
      });
    }
    this.current = null;
  };
  /* what is filed: the answers of the questions that stand open */
  Ctx.prototype.answers = function () {
    var self = this, out = {};
    Object.keys(this.values).forEach(function (k) {
      var id = k.replace(/__[ab]$/, ''), f = self.F[id];
      if (!f || !self.fieldShown(f)) return;
      var x = self.values[k];
      if (Array.isArray(x) ? !x.some(rowHas) : !has(x)) return;
      out[k] = x;
    });
    /* a count behind a list that said it did not happen is a real nought */
    this.list.forEach(function (f) {
      if (!f.zero || self.fieldShown(f)) return;
      var g = f.show && self.F[f.show.f];
      if (g && self.fieldShown(g) && self.filled(g)) out[f.id] = '0';
    });
    return out;
  };

  /* ---------------- the message the boss reads ---------------- */

  function L(o, lang) { return (lang === 'am' && o && o.am) ? o.am : (o ? o.en : ''); }
  function asked(label) {
    var m = /^([\s\S]*[?？፧])\s+([^?？፧]+)$/.exec(label || '');
    return (m && !/\(\s*[^()]+\s\/\s[^()]+\)\s*$/.test(m[2])) ? m[1] : (label || '');
  }
  function said(label) {
    label = asked(label);
    return /[?？፧]\s*$/.test(label) ? label : label + ':';
  }
  function money(n) {
    var v = String(n).replace(/[^0-9.-]/g, '');
    return (v === '' || isNaN(Number(v))) ? String(n) : Number(v).toLocaleString('en-US');
  }
  var WORDS = {
    en: { yes: 'Yes', no: 'No', birr: 'Birr', flags: 'FLAGS', total: 'Total', none: 'Nothing',
          week: 'Week', from: 'Made from {n} daily reports', fromNone: 'No daily report was sent this week',
          built: 'Worked out from the daily reports — nobody filled this in.' },
    am: { yes: 'አዎ', no: 'አይደለም', birr: 'ብር', flags: 'ማስጠንቀቂያ', total: 'ጠቅላላ', none: 'ምንም',
          week: 'ሳምንት', from: 'ከ{n} ዕለታዊ ሪፖርቶች የተሰራ', fromNone: 'በዚህ ሳምንት ምንም ዕለታዊ ሪፖርት አልተላከም',
          built: 'ከዕለታዊ ሪፖርቶቹ የተሰላ ነው — ማንም አልሞላውም።' }
  };
  function yn(f, v, lang) {
    var w = f && f[v];
    return w ? L(w, lang) : WORDS[lang][v];
  }
  function choiceText(opts, v, lang) {
    for (var i = 0; i < (opts || []).length; i++) if (opts[i].v === v) return L(opts[i], lang);
    return String(v);
  }
  function colText(c, v, lang) {
    if (!has(v)) return '—';
    if (c.t === 'yesno') return yn(c, v === 'yes' ? 'yes' : 'no', lang);
    if (c.t === 'choice') return choiceText(c.opts, v, lang);
    if (c.t === 'multi') return multiText(c, v, lang);
    if (c.t === 'money') return money(v) + ' ' + WORDS[lang].birr;
    if (c.t === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(String(v).trim())) return dayLabel(String(v).trim(), lang);
    return String(v).trim();
  }
  function multiText(f, v, lang) {
    return String(v).split(',').filter(Boolean).map(function (c) {
      if (c === 'none') return f.none ? L(f.none, lang) : WORDS[lang].none;
      return choiceText(f.opts, c, lang);
    }).join(lang === 'am' ? '፣ ' : ', ');
  }
  function fmt(f, values, lang) {
    if (f.t === 'ratio') {
      var a = values[f.id + '__a'], b = values[f.id + '__b'];
      return (has(a) || has(b)) ? (has(a) ? a : '—') + ' / ' + (has(b) ? b : '—') : '';
    }
    var v = values[f.id];
    if (!has(v)) return '';
    if (f.t === 'yesno') return yn(f, v === 'yes' ? 'yes' : 'no', lang);
    if (f.t === 'multi') return multiText(f, v, lang);
    if (f.t === 'choice') return choiceText(f.opts, v, lang);
    if (f.t === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(String(v))) return dayLabel(String(v), lang);
    if (f.t === 'money') return money(v) + ' ' + WORDS[lang].birr;
    if (f.t === 'pct') return String(v).replace(/%/g, '').trim() + '%';
    return String(v).trim();
  }
  function tableLines(f, values, lang) {
    var data = values[f.id];
    if (!Array.isArray(data) || !f.cols) return [];
    var out = [], n = 0, total = 0, money2 = f.total && f.cols.filter(function (c) { return c.id === f.total; })[0];
    out.push(f.cols.map(function (c) { return L(c, lang); }).join(' · '));
    data.forEach(function (row, i) {
      if (!rowHas(row)) return;
      n++;
      var cells = f.cols.map(function (c) { return colText(c, row[c.id], lang); });
      out.push((f.t === 'grid' && f.rows && f.rows[i] ? L(f.rows[i], lang) : String(n) + '.') + ' · ' + cells.join(' · '));
      if (money2) { var x = num(row[f.total]); if (!isNaN(x)) total += x; }
    });
    if (n && money2) out.push(WORDS[lang].total + ': ' + money(String(total)) + ' ' + WORDS[lang].birr);
    return n ? out : [];
  }

  /* the summary as one message, in the language asked */
  function message(rep, values, opts) {
    opts = opts || {};
    var lang = opts.lang === 'am' ? 'am' : 'en', W = WORDS[lang], ctx = opts.ctx;
    var shown = function (f) { return ctx ? ctx.fieldShown(f) : true; };
    var person = (opts.people || []).filter(function (p) { return p.id === rep.person; })[0] || { en: rep.person };
    var wk = opts.week;
    var out = ['*' + L(rep, lang).toUpperCase() + '*'];
    out.push(L(person, lang) + (person.roleEn ? ' · ' + (lang === 'am' ? person.roleAm : person.roleEn) : ''));
    if (wk) out.push(W.week + ' · ' + dayLabel(wk.monday, lang) + ' – ' + dayLabel(addDays(wk.sunday, -1), lang));
    out.push(opts.dailies ? W.from.replace('{n}', opts.dailies) : W.fromNone);
    out.push(W.built);
    rep.sections.forEach(function (sec) {
      var lines = [];
      sec.fields.forEach(function (f) {
        if (f.quiet || !shown(f)) return;
        if (f.t === 'table' || f.t === 'grid') {
          var tl = tableLines(f, values, lang);
          if (tl.length) { lines.push(said(L(f, lang))); lines.push.apply(lines, tl); }
          return;
        }
        var v = fmt(f, values, lang);
        if (!has(v)) return;
        lines.push(said(L(f, lang)) + (/\n/.test(v) ? '\n' + v : ' ' + v));
      });
      if (lines.length) { out.push(''); out.push('*' + L(sec, lang).toUpperCase() + '*'); out = out.concat(lines); }
    });
    var flags = [];
    if (ctx) rep.sections.forEach(function (sec) {
      sec.fields.forEach(function (f) {
        if (shown(f) && f.tgt && ctx.targetMiss(f)) flags.push('• ' + said(L(f, lang)) + ' ' + fmt(f, values, lang) + ' — ' + L(f.tgt, lang));
      });
    });
    if (flags.length) { out.push(''); out.push('*' + W.flags + '*'); out = out.concat(flags); }
    return out.join('\n');
  }

  /* the same answers as the document the email's PDF is drawn from — the
     shape js/app.js reportDoc() gives the Sheet's script: a section, then
     [question, answer] rows, a list as a table */
  function docOf(rep, values, ctx) {
    var doc = [];
    rep.sections.forEach(function (sec) {
      var rows = [];
      sec.fields.forEach(function (f) {
        if (f.quiet || (ctx && !ctx.fieldShown(f))) return;
        if (f.t === 'table' || f.t === 'grid') {
          var data = Array.isArray(values[f.id]) ? values[f.id] : [], out = [];
          data.forEach(function (row, i) {
            if (!rowHas(row)) return;
            out.push([f.t === 'grid' && f.rows && f.rows[i] ? L(f.rows[i], 'en') : String(out.length + 1)]
              .concat(f.cols.map(function (c) { return colText(c, row[c.id], 'en'); })));
          });
          if (out.length) {
            rows.push([L(f, 'en'), tableLines(f, values, 'en').join('\n'), {
              head: ['#'].concat(f.cols.map(function (c) { return L(c, 'en'); })),
              num: [false].concat(f.cols.map(function (c) { return /^(num|money|pct)$/.test(c.t || ''); })),
              rows: out
            }]);
          }
          return;
        }
        var v = fmt(f, values, 'en');
        if (!has(v)) return;
        var lab = (f.i || f.show ? '· ' : '') + asked(L(f, 'en'));
        rows.push(f.t === 'area' || String(v).length > 60 ? [lab, v, { long: true }] : [lab, v]);
      });
      if (rows.length) doc.push({ sec: L(sec, 'en'), rows: rows });
    });
    return doc;
  }
  function flagsOf(rep, values, ctx) {
    var out = [];
    rep.sections.forEach(function (sec) {
      sec.fields.forEach(function (f) {
        if (f.tgt && ctx.fieldShown(f) && ctx.targetMiss(f)) out.push(said(L(f, 'en')) + ' ' + fmt(f, values, 'en') + ' — ' + L(f.tgt, 'en'));
      });
    });
    return out;
  }

  /* ---------------- the whole of it ---------------- */

  /* One built weekly: its answers, how many daily reports it was made from,
     and its message. `week` is the Sunday it is made on (or any day of the
     week before it); `filings` are {report, person, at, values} and may hold
     anyone's — only the ones its kinds name are read. */
  function build(rep, opts) {
    var wk = weekOf(opts.sunday);
    var span = opts.span || { from: wk.from, to: wk.to };
    var ctx = new Ctx(rep, opts.reports, opts.filings, span);
    ctx.compute();
    var values = ctx.answers();
    /* the person's own dailies the week holds — the "made from" line, and
       whether there is anything to send at all */
    var own = {}, any = {};
    ctx.days({}).forEach(function (d) { own[d.report + '|' + d.day] = 1; });
    var srcs = {};
    ctx.list.forEach(function (f) {
      [f.auto, f.auto && f.auto.a, f.auto && f.auto.b].forEach(function (k) {
        if (k && k.from) srcs[k.from] = k;
      });
    });
    Object.keys(srcs).forEach(function (s) { ctx.days(srcs[s]).forEach(function (d) { any[d.report + '|' + d.day] = 1; }); });
    var dailies = Object.keys(own).length;
    return {
      report: rep.id,
      person: rep.person,
      week: wk,
      values: values,
      dailies: dailies,
      others: Object.keys(any).filter(function (x) { return !own[x]; }).length,
      text: message(rep, values, { lang: 'en', people: opts.people, week: wk, dailies: dailies, ctx: ctx }),
      textAm: message(rep, values, { lang: 'am', people: opts.people, week: wk, dailies: dailies, ctx: ctx }),
      doc: docOf(rep, values, ctx),
      flags: flagsOf(rep, values, ctx)
    };
  }

  /* The room a report is delivered to — js/app.js channelFor, for the
     script, which has no app.js: the smallest room (never #all, never a room
     kept for someone else's reports or for customers) holding the person and
     everyone the report names; the person's line to the Chairman when it
     names him alone or no room fits. Kept in step with app.js TO_IDS and
     channelFor (klever-kit/forms/weekly_channel_test.js checks them). */
  var TO_IDS = { 'Chairman': ['chairman'], 'Mahelet': ['liu'], 'Ephrata': ['ephrata'], 'Betty': ['betty'],
                 'Betelhem': ['betty'], 'Finance': ['betty'], 'Selam': ['betty'], 'Elyas': ['elyas'], 'Kidan': ['kidan'] };
  function recipientsOf(rep) {
    var out = [];
    Object.keys(TO_IDS).forEach(function (name) {
      if (String(rep.toEn || '').indexOf(name) !== -1) {
        TO_IDS[name].forEach(function (id) { if (out.indexOf(id) === -1) out.push(id); });
      }
    });
    return out;
  }
  function channelFor(rep, CH) {
    var to = recipientsOf(rep), from = rep.person;
    if (!to.length || !CH) return null;
    if (to.length === 1 && to[0] === 'chairman') return 'direct-' + from;
    var best = null;
    CH.forPerson(from).forEach(function (ch) {
      if (ch.kind === 'direct' || ch.id === 'all') return;
      if (ch.onlyFor && to.indexOf(ch.onlyFor) === -1) return;
      if (ch.noReports) return;
      if (!to.every(function (id) { return ch.members.indexOf(id) !== -1; })) return;
      if (!best || ch.members.length < best.members.length) best = ch;
    });
    return best ? best.id : 'direct-' + from;
  }
  /* a message cut for chat, which holds 4,000 characters: on line breaks,
     each part numbered (js/app.js splitForChat) */
  function splitForChat(text, max) {
    max = max || 3900;
    if (text.length <= max) return [text];
    var parts = [], cur = '';
    text.split('\n').forEach(function (line) {
      while (line.length > max) { if (cur) { parts.push(cur); cur = ''; } parts.push(line.slice(0, max)); line = line.slice(max); }
      if ((cur ? cur.length + 1 : 0) + line.length > max) { parts.push(cur); cur = line; }
      else cur = cur ? cur + '\n' + line : line;
    });
    if (cur) parts.push(cur);
    return parts.map(function (p, i) { return '(' + (i + 1) + '/' + parts.length + ')\n' + p; });
  }

  /* every daily report a built weekly reads: the person's own, and any
     named by `from` */
  function sourcesOf(rep, reports) {
    var ctx = new Ctx(rep, reports, [], { from: 0, to: 0 }), out = ctx.sources({});
    var walk = function (k) {
      if (!k || typeof k !== 'object') return;
      if (k.from) ctx.sources(k).forEach(function (id) { if (out.indexOf(id) < 0) out.push(id); });
      ['a', 'b'].forEach(function (x) { walk(k[x]); });
      ['plus', 'minus', 'div', 'pct'].forEach(function (x) { (k[x] || []).forEach(walk); });
    };
    ctx.list.forEach(function (f) { walk(f.auto); });
    return out;
  }

  var WEEKLY = { build: build, builtReports: builtReports, weekOf: weekOf, dayOf: dayOf, sourcesOf: sourcesOf,
                 channelFor: channelFor, recipientsOf: recipientsOf, splitForChat: splitForChat };
  if (typeof module !== 'undefined' && module.exports) module.exports = WEEKLY;
  else root.WEEKLY = WEEKLY;
})(typeof window !== 'undefined' ? window : this);
