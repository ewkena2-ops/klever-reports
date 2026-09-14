/* Klever report site — renderer, draft autosave, WhatsApp handoff.
   No dependencies. Works from file:// and from GitHub Pages. */

(function () {
  'use strict';

  var LANG_KEY = 'klever.lang';

  /* localStorage throws in private mode and when storage is full — never let
     that take the form down; the report still works, the draft just isn't kept. */
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };

  /* ?lang=am opens straight into Amharic and remembers it */
  var urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang === 'am' || urlLang === 'en') store.set(LANG_KEY, urlLang);
  var lang = (urlLang === 'am' || urlLang === 'en' ? urlLang
              : store.get(LANG_KEY)) === 'am' ? 'am' : 'en';

  function t(k) { return T[lang][k]; }
  function L(o) { return (lang === 'am' && o.am) ? o.am : o.en; }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function money(n) {
    var v = String(n).replace(/[^0-9.-]/g, '');
    if (v === '' || isNaN(Number(v))) return String(n);
    return Number(v).toLocaleString('en-US');
  }
  function today() {
    var d = new Date(), m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return d.getDate() + ' ' + m[d.getMonth()] + ' ' + d.getFullYear();
  }
  function clock() {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  /* daily reports are late after their time of day; weekly ones are late once
     their due day has passed (dueDay: 0=Sun .. 5=Fri) */
  function isLate(dueTime, dueDay) {
    if (!dueTime) return false;
    var p = dueTime.split(':'), d = new Date();
    var now = d.getHours() * 60 + d.getMinutes();
    var due = Number(p[0]) * 60 + Number(p[1]);
    if (dueDay == null) return now > due;
    var today = d.getDay();
    if (today < dueDay) return false;
    if (today === dueDay) return now > due;
    return true;
  }
  function personById(id) {
    for (var i = 0; i < PEOPLE.length; i++) if (PEOPLE[i].id === id) return PEOPLE[i];
    return null;
  }
  function reportById(id) {
    for (var i = 0; i < REPORTS.length; i++) if (REPORTS[i].id === id) return REPORTS[i];
    return null;
  }
  function reportsFor(pid) {
    return REPORTS.filter(function (r) { return r.person === pid; });
  }

  /* ---------------- shared chrome ---------------- */

  function buildTop() {
    var top = el('div', 'top'), inner = el('div', 'top-in');
    var a = el('a'); a.href = 'index.html';
    var img = new Image(); img.src = 'assets/logo.png';
    img.alt = 'Klever Küche'; a.appendChild(img);
    inner.appendChild(a);
    inner.appendChild(el('div', 'spacer'));

    var tg = el('div', 'langtoggle');
    [['en', 'EN'], ['am', 'አማ']].forEach(function (p) {
      var b = el('button', null, p[1]);
      b.type = 'button';
      b.setAttribute('aria-pressed', lang === p[0] ? 'true' : 'false');
      b.onclick = function () {
        lang = p[0];
        store.set(LANG_KEY, lang);
        location.reload();
      };
      tg.appendChild(b);
    });
    inner.appendChild(tg);
    top.appendChild(inner);
    document.body.insertBefore(top, document.body.firstChild);
    document.documentElement.lang = lang === 'am' ? 'am' : 'en';
  }

  function toast(msg) {
    var tEl = document.querySelector('.toast');
    if (!tEl) { tEl = el('div', 'toast'); document.body.appendChild(tEl); }
    tEl.textContent = msg;
    tEl.classList.add('on');
    setTimeout(function () { tEl.classList.remove('on'); }, 1900);
  }

  /* ---------------- index page ---------------- */

  function renderIndex(root) {
    document.title = t('siteTitle');
    root.innerHTML = '';
    var h = el('h1', null, t('whoReports'));
    var s = el('p', 'sub', t('pickSub'));
    root.appendChild(h); root.appendChild(s);

    var list = el('div', 'people');
    PEOPLE.forEach(function (p) {
      var b = el('button', 'person');
      b.type = 'button';
      b.appendChild(el('span', 'initial', L(p).charAt(0)));
      var who = el('span', 'who');
      who.appendChild(el('span', 'nm', L(p)));
      who.appendChild(el('span', 'rl', lang === 'am' ? p.roleAm : p.roleEn));
      b.appendChild(who);
      b.appendChild(el('span', 'arrow', '→'));
      b.onclick = function () { renderPersonReports(root, p); };
      list.appendChild(b);
    });
    root.appendChild(list);
    root.appendChild(foot());
  }

  function renderPersonReports(root, p) {
    root.innerHTML = '';
    var back = el('a', 'backlink', t('back'));
    back.href = '#';
    back.onclick = function (e) { e.preventDefault(); renderIndex(root); };
    root.appendChild(back);

    root.appendChild(el('h1', null, L(p)));
    root.appendChild(el('p', 'sub', lang === 'am' ? p.roleAm : p.roleEn));

    var rs = reportsFor(p.id);
    if (!rs.length) { root.appendChild(el('p', 'sub', t('noReports'))); root.appendChild(foot()); return; }

    root.appendChild(el('p', 'eyebrow', t('yourReports')));
    var list = el('div', 'reports');
    rs.forEach(function (r) {
      var a = el('a', 'report');
      a.href = 'form.html?r=' + encodeURIComponent(r.id);
      a.appendChild(el('span', 'rt', L(r)));
      var meta = el('div', 'meta');
      meta.appendChild(el('span', 'due', t('due') + ' · ' + (lang === 'am' ? r.dueAm : r.dueEn)));
      meta.appendChild(el('span', null, t('to') + ' · ' + (lang === 'am' ? r.toAm : r.toEn)));
      a.appendChild(meta);
      list.appendChild(a);
    });
    root.appendChild(list);
    root.appendChild(foot());
  }

  function foot() {
    var f = el('p', 'foot', t('foot'));
    return f;
  }

  /* ---------------- form page ---------------- */

  var values = {};      // field id -> value
  var report = null;
  var draftKey = '';

  function renderForm(root) {
    var id = new URLSearchParams(location.search).get('r');
    report = reportById(id);
    if (!report) { location.href = 'index.html'; return; }
    var person = personById(report.person);
    document.title = L(report) + ' · ' + L(person);

    draftKey = 'klever.draft.' + report.id + '.' + new Date().toISOString().slice(0, 10);
    try { values = JSON.parse(store.get(draftKey) || '{}'); } catch (e) { values = {}; }

    root.innerHTML = '';
    var back = el('a', 'backlink', t('back'));
    back.href = 'index.html';
    root.appendChild(back);

    /* header */
    var head = el('div', 'formhead');
    head.appendChild(el('h1', null, L(report)));
    head.appendChild(el('div', 'sub', L(person) + ' · ' + (lang === 'am' ? person.roleAm : person.roleEn)));
    var line = el('div', 'line');
    line.appendChild(el('span', null, today() + ' · ' + clock()));
    var lateNow = isLate(report.dueTime, report.dueDay);
    var pill = el('span', 'pill ' + (lateNow ? 'late' : 'ontime'), lateNow ? t('late') : t('onTime'));
    line.appendChild(pill);
    head.appendChild(line);
    head.appendChild(el('div', 'line', t('due') + ' · ' + (lang === 'am' ? report.dueAm : report.dueEn)));
    if (report.penEn) head.appendChild(el('div', 'penalty', lang === 'am' ? report.penAm : report.penEn));
    if (report.derived) head.appendChild(el('div', 'penalty', t('derived')));
    root.appendChild(head);

    var prog = el('div', 'progress'); prog.appendChild(el('i'));
    root.appendChild(prog);

    /* sections */
    report.sections.forEach(function (sec) {
      var fs = el('fieldset');
      var lg = el('legend', null, L(sec));
      fs.appendChild(lg);
      sec.fields.forEach(function (f) { fs.appendChild(fieldRow(f)); });
      root.appendChild(fs);
    });

    var pv = el('div', 'preview'); pv.id = 'preview';
    root.appendChild(el('p', 'eyebrow', t('preview')));
    root.appendChild(pv);
    root.appendChild(foot());

    buildBar();
    refresh();
  }

  function fieldRow(f) {
    var row = el('div', 'fld' + (f.i ? ' indent' : '') + (f.t === 'area' ? ' wide' : ''));
    var lab = el('label', null, L(f));
    lab.htmlFor = 'f_' + f.id;
    row.appendChild(lab);

    if (f.t === 'ratio') {
      var wrap = el('div', 'ratio');
      wrap.appendChild(numInput(f.id + '__a', f));
      wrap.appendChild(el('span', 'of', '/'));
      wrap.appendChild(numInput(f.id + '__b', f));
      row.appendChild(wrap);
    } else if (f.t === 'yesno') {
      var seg = el('div', 'seg');
      [['yes', t('yes')], ['no', t('no')]].forEach(function (o) {
        var b = el('button', null, o[1]);
        b.type = 'button';
        b.setAttribute('aria-pressed', values[f.id] === o[0] ? 'true' : 'false');
        b.onclick = function () {
          values[f.id] = o[0];
          seg.className = 'seg' + (o[0] === 'no' ? ' no' : '');
          Array.prototype.forEach.call(seg.children, function (c) {
            c.setAttribute('aria-pressed', c === b ? 'true' : 'false');
          });
          refresh();
        };
        seg.appendChild(b);
      });
      if (values[f.id] === 'no') seg.className = 'seg no';
      row.appendChild(seg);
    } else if (f.t === 'area') {
      var ta = el('textarea');
      ta.id = 'f_' + f.id;
      ta.value = values[f.id] || '';
      ta.oninput = function () { values[f.id] = ta.value; refresh(); };
      row.appendChild(ta);
    } else if (f.t === 'text') {
      var ti = document.createElement('input');
      ti.type = 'text'; ti.id = 'f_' + f.id;
      ti.value = values[f.id] || '';
      ti.oninput = function () { values[f.id] = ti.value; refresh(); };
      row.appendChild(ti);
    } else {
      row.appendChild(numInput(f.id, f));
    }

    if (f.tgt) {
      var h = el('div', 'hint');
      h.id = 'h_' + f.id;
      h.textContent = lang === 'am' ? f.tgt.am : f.tgt.en;
      row.appendChild(h);
    }
    return row;
  }

  function numInput(key, f) {
    var i = document.createElement('input');
    i.type = 'number';
    i.inputMode = 'decimal';
    i.id = 'f_' + key;
    i.value = values[key] != null ? values[key] : '';
    i.oninput = function () { values[key] = i.value; refresh(); };
    return i;
  }

  function buildBar() {
    var bar = el('div', 'bar'), inner = el('div', 'bar-in');
    var count = el('div', 'count'); count.id = 'count';
    var copy = el('button', 'btn ghost', t('copy'));
    copy.type = 'button';
    copy.onclick = function () {
      var txt = buildMessage();
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast(t('copied')); });
      else { window.prompt(t('copy'), txt); }
    };
    var send = el('button', 'btn', t('send'));
    send.type = 'button'; send.id = 'send';
    send.onclick = function () {
      var txt = buildMessage();
      window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank');
    };
    inner.appendChild(count); inner.appendChild(copy); inner.appendChild(send);
    bar.appendChild(inner);
    document.body.appendChild(bar);
  }

  /* ---------------- live state ---------------- */

  function allFields() {
    var out = [];
    report.sections.forEach(function (s) { s.fields.forEach(function (f) { out.push(f); }); });
    return out;
  }

  function filled(f) {
    if (f.t === 'ratio') return has(values[f.id + '__a']) && has(values[f.id + '__b']);
    return has(values[f.id]);
  }
  function has(v) { return v != null && String(v).trim() !== ''; }

  function targetMiss(f) {
    if (!f.tgt || !has(values[f.id])) return false;
    var v = Number(values[f.id]);
    if (isNaN(v)) return false;
    return f.tgt.op === 'gte' ? v < f.tgt.v : v > f.tgt.v;
  }

  function refresh() {
    store.set(draftKey, JSON.stringify(values));

    var fields = allFields(), need = 0, done = 0;
    fields.forEach(function (f) {
      if (!f.opt) { need++; if (filled(f)) done++; }
      if (f.tgt) {
        var h = document.getElementById('h_' + f.id);
        if (h) {
          var miss = targetMiss(f);
          h.className = 'hint' + (miss ? ' bad' : (has(values[f.id]) ? ' good' : ''));
          h.textContent = (lang === 'am' ? f.tgt.am : f.tgt.en) +
            (miss ? ' — ' + (f.tgt.op === 'gte' ? t('below') : t('above')) : '');
        }
      }
    });

    var missing = need - done;
    var c = document.getElementById('count');
    if (c) {
      c.innerHTML = '';
      if (missing > 0) {
        var b = el('b', null, String(missing));
        c.appendChild(b);
        c.appendChild(document.createTextNode(' ' + t('empty')));
      } else {
        c.textContent = t('ready');
      }
    }
    var send = document.getElementById('send');
    if (send) send.disabled = missing > 0;

    var bar = document.querySelector('.progress i');
    if (bar) bar.style.width = (need ? Math.round(done / need * 100) : 0) + '%';

    var pv = document.getElementById('preview');
    if (pv) pv.textContent = buildMessage();
  }

  /* ---------------- message ---------------- */

  function fmt(f) {
    if (f.t === 'ratio') {
      var a = values[f.id + '__a'], b = values[f.id + '__b'];
      return (has(a) ? a : '—') + ' / ' + (has(b) ? b : '—');
    }
    var v = values[f.id];
    if (!has(v)) return '';
    if (f.t === 'yesno') return v === 'yes' ? t('yes') : t('no');
    if (f.t === 'money') return money(v) + ' Birr';
    if (f.t === 'pct') return v + '%';
    return String(v).trim();
  }

  function buildMessage() {
    var person = personById(report.person);
    var out = [];
    out.push('*' + L(report).toUpperCase() + '*');
    out.push(L(person) + ' · ' + (lang === 'am' ? person.roleAm : person.roleEn));
    out.push(today() + ' · ' + clock() + ' · ' + (isLate(report.dueTime, report.dueDay) ? t('late') : t('onTime')));

    report.sections.forEach(function (sec) {
      var lines = [];
      sec.fields.forEach(function (f) {
        var v = fmt(f);
        if (!has(v) || v === '— / —') return;
        lines.push((f.i ? '  ' : '') + L(f) + ': ' + v);
      });
      if (lines.length) {
        out.push('');
        out.push('*' + L(sec).toUpperCase() + '*');
        out = out.concat(lines);
      }
    });

    var flags = [];
    allFields().forEach(function (f) {
      if (targetMiss(f)) {
        flags.push('• ' + L(f) + ': ' + fmt(f) + ' — ' +
          (lang === 'am' ? f.tgt.am : f.tgt.en));
      }
    });
    if (flags.length) {
      out.push('');
      out.push('*' + t('flags') + '*');
      out = out.concat(flags);
    }
    return out.join('\n');
  }

  /* ---------------- boot ---------------- */

  /* handle for testing and for future edits from the console */
  window.KLEVER = {
    message: function () { return buildMessage(); },
    fill: function (v) { Object.keys(v).forEach(function (k) { values[k] = v[k]; }); refresh(); }
  };

  document.addEventListener('DOMContentLoaded', function () {
    buildTop();
    var root = document.getElementById('app');
    if (!root) return;
    if (document.body.dataset.page === 'form') renderForm(root);
    else renderIndex(root);
  });
})();
