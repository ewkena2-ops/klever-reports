/* Klever — the observatory.

   The sixteen agents drawn as a star system. The Chairman's brief is the sun,
   because it reads all the others. The other fifteen orbit it in three rings:
   what needs deciding closest in, the factory in the middle, money,
   customers and people on the outside. A planet's glow is how loud its last
   reading was — a coral pulse wants him, gold is worth a look, a dim world had
   an ordinary day — read from the words the agent used, the same way the
   Chairman's page has always read them. Tap one and it says what it watches,
   which reports it reads, and what it said.

   This file only draws. It knows nothing about Firebase: agents.js feeds it
   the latest reading from the live archive. Everything is drawn on one
   canvas, once per frame, and the loop stops whenever the tab is hidden.

   The Amharic lines below are mine and have not been read by a native
   speaker.                                                                 */
(function () {
  'use strict';

  var TAU = Math.PI * 2;

  /* what each agent is for, in a sentence, and what it reads */
  var AGENTS = {
    brief: {
      en: 'The Chairman’s brief', am: 'የሊቀመንበሩ ማጠቃለያ',
      watchEn: 'Reads what the other fifteen found and writes the Chairman five lines — the thing that costs the most money first.',
      watchAm: 'ሌሎቹ አሥራ አምስቱ ያገኙትን አንብቦ ለሊቀመንበሩ አምስት መስመር ይጽፋል — ብዙ ገንዘብ የሚያስወጣውን መጀመሪያ።',
      reads: [['All fifteen agents', 'አሥራ አምስቱም ወኪሎች']]
    },
    decide: {
      en: 'What to decide', am: 'ምን መወሰን እንዳለበት',
      watchEn: 'The decisions still open, and which of them cost money or left someone unprotected today.',
      watchAm: 'ገና ያልተወሰኑ ጉዳዮች፣ እና ከእነሱ ዛሬ ገንዘብ ያስወጡ ወይም ሰውን ያለ ጥበቃ የተዉ።',
      reads: [['The decision register', 'የውሳኔዎች መዝገብ'], ['Today’s figures', 'የዛሬው አሃዞች']]
    },
    contradictions: {
      en: 'Reports that disagree', am: 'የሚጋጩ ሪፖርቶች',
      watchEn: 'Two people describing the same day with numbers that cannot both be true.',
      watchAm: 'አንድን ቀን የሚገልጹ ሁለት ሰዎች፣ ሁለቱም እውነት ሊሆኑ የማይችሉ ቁጥሮች ሲሰጡ።',
      reads: [['Amaha', 'አማሃ'], ['Mahelet', 'ማህሌት'], ['Wude', 'ውዱ'], ['Elyas', 'ኤልያስ'], ['Yordanos', 'ዮርዳኖስ']]
    },
    compliance: {
      en: 'Who reported', am: 'ማን ሪፖርት አደረገ',
      watchEn: 'Who filed, who was late, who did not — and whether it is the same people again this week.',
      watchAm: 'ማን አቀረበ፣ ማን ዘገየ፣ ማን አላቀረበም — በዚህ ሳምንትም ያው ሰዎች መሆናቸውን።',
      reads: [['The day’s ledger', 'የዕለቱ መዝገብ'], ['The week before', 'ያለፈው ሳምንት']]
    },
    penalties: {
      en: 'Penalty ledger', am: 'የቅጣት መዝገብ',
      watchEn: 'Whether a pattern is forming: the same person, the same report, the same day of the week.',
      watchAm: 'ልማድ እየተፈጠረ እንደሆነ፦ ያው ሰው፣ ያው ሪፖርት፣ ያው የሳምንቱ ቀን።',
      reads: [['Every letter’s penalty table', 'የእያንዳንዱ ደብዳቤ የቅጣት ሰንጠረዥ']]
    },
    production: {
      en: 'Production', am: 'ምርት',
      watchEn: 'Whether the factory made its 40 m², and what actually stopped it if not.',
      watchAm: 'ፋብሪካው 40 ካሬ ሜትሩን እንዳመረተ፣ ካልሆነም በትክክል ምን እንዳቆመው።',
      reads: [['Amaha’s daily production report', 'የአማሃ ዕለታዊ የምርት ሪፖርት']]
    },
    quality: {
      en: 'Quality', am: 'ጥራት',
      watchEn: 'Where the defects come from, whether it is the same place as yesterday, and any pressure to pass them.',
      watchAm: 'ጉድለቶቹ ከየት እንደሚመጡ፣ ከትናንቱ ቦታ መሆኑን፣ እና እንዲያልፉ የሚደረግ ጫና።',
      reads: [['Wude’s daily QC report', 'የውዱ ዕለታዊ የጥራት ሪፖርት']]
    },
    store: {
      en: 'Store and stock', am: 'መጋዘንና ክምችት',
      watchEn: 'What is about to run out, and whether it stops production before it is replaced.',
      watchAm: 'ሊያልቅ የተቃረበው ምን እንደሆነ፣ ከመተካቱ በፊት ምርትን ያቆም እንደሆነ።',
      reads: [['Yordanos’s daily store report', 'የዮርዳኖስ ዕለታዊ የመጋዘን ሪፖርት']]
    },
    purchasing: {
      en: 'Purchasing', am: 'ግዥ',
      watchEn: 'Prices rising fast enough to eat the 6,000 Birr/m² floor, and substitutes bought without Wude’s approval.',
      watchAm: 'የ6,000 ብር/ካሬ ሜትር ወለሉን ሊበሉ የሚችሉ የዋጋ ጭማሪዎች፣ ያለ ውዱ ፈቃድ የተገዙ ተተኪዎች።',
      reads: [['Getachew’s daily purchasing report', 'የጌታቸው ዕለታዊ የግዥ ሪፖርት']]
    },
    margin: {
      en: 'Margin watch', am: 'የትርፍ ክትትል',
      watchEn: 'Anything quietly eating the 6,000 Birr/m² floor — board price, yield per sheet, waste, material over BOM.',
      watchAm: 'የ6,000 ብር/ካሬ ሜትር ወለሉን በዝምታ የሚበላ ነገር — የቦርድ ዋጋ፣ በሉህ ምርት፣ ብክነት።',
      reads: [['Ephrata', 'ኤፍራታ'], ['Amaha', 'አማሃ'], ['Getachew', 'ጌታቸው']]
    },
    finance: {
      en: 'Finance', am: 'ፋይናንስ',
      watchEn: 'Whether the money is where it should be: the 6,000,000 reserve, ZamZam, payments over 50,000 without Kidan.',
      watchAm: 'ገንዘቡ ባለበት ቦታ መሆኑን፦ የ6,000,000 ክምችት፣ ዘምዘም፣ ያለ ኪዳን ከ50,000 በላይ ክፍያዎች።',
      reads: [['The daily finance report', 'ዕለታዊ የፋይናንስ ሪፖርት'],
              ['Her 7-day forecast', 'የ7 ቀን ትንበያዋ']]
    },
    commercial: {
      en: 'Sales', am: 'ሽያጭ',
      watchEn: 'Whether the week reaches 3,000,000 Birr, and which sources of leads actually become contracts.',
      watchAm: 'ሳምንቱ 3,000,000 ብር እንደሚደርስ፣ የትኞቹ የደንበኛ ምንጮች በእርግጥ ውል እንደሚሆኑ።',
      reads: [['Ephrata’s daily commercial report', 'የኤፍራታ ዕለታዊ የንግድ ሪፖርት'],
              ['Both salespeople', 'ሁለቱ ሻጮች']]
    },
    customer: {
      en: 'Customers', am: 'ደንበኞች',
      watchEn: 'What customers are saying, and who is still waiting for an answer.',
      watchAm: 'ደንበኞች የሚሉትን፣ እና ማን ገና መልስ እየጠበቀ እንደሆነ።',
      reads: [['The customer pulse report', 'የደንበኛ ሪፖርት (ፋይናንስ)'], ['Elyas', 'ኤልያስ'], ['Ephrata', 'ኤፍራታ']]
    },
    design: {
      en: 'Design', am: 'ዲዛይን',
      watchEn: 'Designs moving or stalled, and the customers being redrawn again and again.',
      watchAm: 'የሚንቀሳቀሱ ወይም የቆሙ ዲዛይኖች፣ ደጋግመው እንደገና የሚሳሉ ደንበኞች።',
      reads: [['All five designers', 'አምስቱም ዲዛይነሮች']]
    },
    site: {
      en: 'Installation', am: 'ተከላ',
      watchEn: 'Installation time lost to things that were not the installers’ fault — and whose measurement it was.',
      watchAm: 'የተካዮቹ ጥፋት ባልሆነ ነገር የጠፋ የተከላ ጊዜ — ልኬቱ የማን እንደነበረ።',
      reads: [['Elyas’s daily site report', 'የኤልያስ ዕለታዊ የቦታ ሪፖርት'], ['Ashenafi', 'አሸናፊ']]
    },
    attendance: {
      en: 'Attendance', am: 'መገኘት',
      watchEn: 'Who was absent or late, and how much of the day that really explains.',
      watchAm: 'ማን እንደቀረ ወይም እንደዘገየ፣ ያ በእርግጥ ከቀኑ ምን ያህሉን እንደሚያብራራ።',
      reads: [['Amaha', 'አማሃ'], ['Elyas', 'ኤልያስ']]
    }
  };

  /* three rings, closest first; a colour for each family */
  var RINGS = [
    { en: 'Oversight', am: 'ቁጥጥር', rel: 0.36, period: 90, start: 0.4,
      rgb: [150, 198, 255], ids: ['decide', 'contradictions', 'compliance', 'penalties'] },
    { en: 'The factory', am: 'ፋብሪካው', rel: 0.66, period: 140, start: 1.3,
      rgb: [95, 224, 198], ids: ['production', 'quality', 'store', 'purchasing', 'margin'] },
    { en: 'Money, customers, people', am: 'ገንዘብ፣ ደንበኞችና ሰዎች', rel: 0.96, period: 200, start: 2.2,
      rgb: [226, 204, 132], ids: ['finance', 'commercial', 'customer', 'design', 'site', 'attendance'] }
  ];
  var ORDER = ['brief'].concat(RINGS[0].ids, RINGS[1].ids, RINGS[2].ids);

  /* How loud a reading is, from the words used. The agents do not rank
     themselves; this errs quiet on purpose — a sky where everything burns
     tells him nothing. Same words the Chairman's page has always used. */
  var LOUD = /stopped|missed|ran short|ran out|below the|not reported as required|blocking|halt|ቆሟል|አልቋል/i;
  var WARM = /\blate\b|not filed|did not file|waste|rework|unanswered|delay|short of|ዘግይቷል/i;
  function heatOf(text) {
    var x = String(text || '');
    if (!x) return 'none';
    if (LOUD.test(x)) return 'loud';
    if (WARM.test(x)) return 'warm';
    return 'quiet';
  }
  function bullets(s) { return String(s || '').replace(/^[ \t]*[*-][ \t]+/gm, '• '); }

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function mix(c, d, k) { return [c[0] + (d[0] - c[0]) * k, c[1] + (d[1] - c[1]) * k, c[2] + (d[2] - c[2]) * k].map(Math.round); }
  function rand(a, b) { return a + Math.random() * (b - a); }

  var CORAL = [238, 124, 97], GOLD = [227, 181, 71], TEAL = [95, 224, 198], WHITE = [255, 255, 255];

  /* ------------------------------------------------------------------ */

  /* The parts every renderer shares: the words at the top, the legend, the
     sheet that rises when something is picked, the buttons for a keyboard,
     and what the agents last said. A renderer draws the sky behind it and
     calls select() when something in its sky is tapped. */
  function chrome(root, opts) {
    opts = opts || {};
    var lang = opts.lang === 'am' ? 'am' : 'en';
    var S = opts.text || {};
    function s(k, d) { return S[k] != null ? S[k] : d; }
    function name(id) { var a = AGENTS[id]; return a ? (lang === 'am' ? a.am : a.en) : id; }
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var said = {}, heat = {}, meta = {};
    ORDER.forEach(function (id) { heat[id] = 'none'; });

    /* ---------- the page around the sky ---------- */
    var obs = el('div', 'obs');

    var hud = el('header', 'obs-hud');
    var hl = el('div', 'obs-hl');
    hl.appendChild(el('div', 'obs-kicker', s('kicker', 'The observatory')));
    hl.appendChild(el('h1', 'obs-title', s('title', 'Sixteen agents')));
    var mLast = el('p', 'obs-meta');
    var mNext = el('p', 'obs-next');
    hl.appendChild(mLast);
    hl.appendChild(mNext);
    hud.appendChild(hl);
    if (opts.onAnalyse) {
      var run = el('button', 'obs-run', s('analyse', 'Analyse now'));
      run.type = 'button';
      run.onclick = function () {
        run.disabled = true;
        run.textContent = s('asking', 'Asking…');
        Promise.resolve(opts.onAnalyse()).then(function () {
          run.textContent = s('asked', 'Asked — within ten minutes');
          setTimeout(function () { run.disabled = false; run.textContent = s('analyse', 'Analyse now'); }, 60000);
        }, function () {
          run.disabled = false;
          run.textContent = s('analyse', 'Analyse now');
        });
      };
      hud.appendChild(run);
    }
    obs.appendChild(hud);

    var legend = el('div', 'obs-legend');
    [['loud', s('legendLoud', 'Wants you')], ['warm', s('legendWarm', 'Worth a look')],
     ['quiet', s('legendQuiet', 'Quiet')]].forEach(function (l) {
      var sp = el('span', 'obs-leg ' + l[0]);
      sp.appendChild(el('i'));
      sp.appendChild(document.createTextNode(l[1]));
      legend.appendChild(sp);
    });
    obs.appendChild(legend);

    /* the same sixteen as buttons, for a keyboard or a screen reader */
    var list = el('nav', 'obs-list');
    list.setAttribute('aria-label', s('title', 'Sixteen agents'));
    var btns = {};
    ORDER.forEach(function (id) {
      var b = el('button', null, name(id));
      b.type = 'button';
      b.onclick = function () { select(id); };
      btns[id] = b;
      list.appendChild(b);
    });
    obs.appendChild(list);

    var sheet = el('section', 'obs-sheet');
    sheet.hidden = true;
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'false');
    obs.appendChild(sheet);

    root.innerHTML = '';
    root.appendChild(obs);

    /* ---------- the sheet ---------- */
    var selected = null;
    function stateLabel(h) {
      return { loud: s('legendLoud', 'Wants you'), warm: s('legendWarm', 'Worth a look'),
               quiet: s('legendQuiet', 'Quiet'), none: s('stateNone', 'No reading yet') }[h];
    }
    function ringOf(id) {
      if (id === 'brief') return s('sun', 'The sun');
      for (var i = 0; i < RINGS.length; i++) if (RINGS[i].ids.indexOf(id) !== -1) return lang === 'am' ? RINGS[i].am : RINGS[i].en;
      return '';
    }
    function drawSheet() {
      var id = selected;
      sheet.innerHTML = '';
      if (!id) { sheet.hidden = true; return; }
      var a = AGENTS[id];
      sheet.appendChild(el('div', 'obs-grab'));
      var close = el('button', 'obs-close', '×');
      close.type = 'button';
      close.setAttribute('aria-label', s('close', 'Close'));
      close.onclick = function () { select(null); };
      sheet.appendChild(close);

      var top = el('div', 'obs-top');
      top.appendChild(el('span', 'obs-ring', ringOf(id)));
      top.appendChild(el('span', 'obs-state ' + heat[id], stateLabel(heat[id])));
      sheet.appendChild(top);
      sheet.appendChild(el('h2', null, name(id)));
      sheet.appendChild(el('p', 'obs-watch', lang === 'am' ? a.watchAm : a.watchEn));
      var reads = el('div', 'obs-reads');
      reads.appendChild(el('span', 'obs-reads-k', s('reads', 'Reads')));
      a.reads.forEach(function (r) { reads.appendChild(el('span', 'obs-chip', lang === 'am' ? r[1] : r[0])); });
      sheet.appendChild(reads);

      sheet.appendChild(el('div', 'obs-said-k', s('said', 'What it said') +
        (meta.dayLabel ? ' · ' + meta.dayLabel : '')));
      var txt = said[id];
      var p = el('div', 'obs-said' + (txt ? '' : ' empty'),
        txt ? bullets(txt) : s('noSaid', 'Nothing yet. The agents read each day at six in the morning.'));
      p.setAttribute('aria-live', 'polite');
      sheet.appendChild(p);

      var nav = el('div', 'obs-nav');
      var i = ORDER.indexOf(id);
      var prev = el('button', 'obs-step', '‹  ' + name(ORDER[(i + ORDER.length - 1) % ORDER.length]));
      var next = el('button', 'obs-step', name(ORDER[(i + 1) % ORDER.length]) + '  ›');
      prev.type = next.type = 'button';
      prev.onclick = function () { select(ORDER[(i + ORDER.length - 1) % ORDER.length]); };
      next.onclick = function () { select(ORDER[(i + 1) % ORDER.length]); };
      nav.appendChild(prev);
      nav.appendChild(next);
      sheet.appendChild(nav);
      sheet.hidden = false;
      sheet.scrollTop = 0;
    }
    var onPick = [], onData = [];
    function select(id) {
      selected = id;
      drawSheet();
      obs.classList.toggle('picked', !!id);
      onPick.forEach(function (fn) { fn(id); });
    }
    function onKey(e) {
      if (!selected) return;
      if (e.key === 'Escape') select(null);
      var i = ORDER.indexOf(selected);
      if (e.key === 'ArrowRight') select(ORDER[(i + 1) % ORDER.length]);
      if (e.key === 'ArrowLeft') select(ORDER[(i + ORDER.length - 1) % ORDER.length]);
    }
    document.addEventListener('keydown', onKey);

    /* ---------- the text at the top ---------- */
    function pad(n) { return ('0' + n).slice(-2); }
    function drawHud() {
      if (meta.dayLabel) {
        mLast.textContent = s('lastReading', 'Reading of') + ' ' + meta.dayLabel +
          /* Addis time, whatever the phone's zone */
          (meta.ranAt ? ' · ' + pad(new Date(meta.ranAt.getTime() + 3 * 3600e3).getUTCHours()) + ':' + pad(meta.ranAt.getMinutes()) : '') +
          (meta.provisional ? ' · ' + s('soFar', 'so far today') : '');
      } else {
        mLast.textContent = s('noReading', 'No reading yet');
      }
      if (meta.next) {
        var mins = Math.max(0, Math.round((meta.next - new Date()) / 60000));
        var h = Math.floor(mins / 60), m = mins % 60;
        mNext.textContent = s('nextReading', 'Next reading') + ' · 6:00 · ' +
          s('inTime', 'in') + ' ' + (h ? h + (lang === 'am' ? 'ሰ ' : 'h ') : '') + m + (lang === 'am' ? 'ደ' : 'm');
      } else {
        mNext.textContent = '';
      }
      ORDER.forEach(function (id) {
        btns[id].textContent = name(id) + ' — ' + stateLabel(heat[id]);
      });
    }
    var hudTimer = setInterval(drawHud, 30000);

    /* findings: [{id, text}], as the agents wrote them */
    function update(findings, m) {
      Object.keys(said).forEach(function (k2) { delete said[k2]; });
      ORDER.forEach(function (id) { heat[id] = 'none'; });
      (findings || []).forEach(function (f) {
        if (!AGENTS[f.id]) return;
        said[f.id] = f.text || '';
        heat[f.id] = heatOf(f.text);
      });
      /* the sun is never "loud" in itself — it is the sum of the rest */
      if (said.brief) heat.brief = 'quiet';
      meta = m || {};
      drawHud();
      if (selected) drawSheet();
      onData.forEach(function (fn) { fn(); });
    }
    drawHud();

    return {
      obs: obs, hud: hud, sheet: sheet, lang: lang, reduce: reduce,
      s: s, name: name, heat: heat, said: said,
      selected: function () { return selected; },
      select: select, update: update,
      onPick: function (fn) { onPick.push(fn); },
      onData: function (fn) { onData.push(fn); },
      destroy: function () {
        clearInterval(hudTimer);
        document.removeEventListener('keydown', onKey);
      }
    };
  }

  /* ------------------------------------------------------------------ *
   *  The flat sky: one canvas, drawn by hand. It is what shows first,
   *  and what stays if a phone cannot draw in 3D.
   * ------------------------------------------------------------------ */
  function mount(root, opts) {
    var c = chrome(root, opts);
    var lang = c.lang, s = c.s, name = c.name, reduce = c.reduce;
    var heat = c.heat, hud = c.hud, sheet = c.sheet, obs = c.obs;
    function sel() { return c.selected(); }
    function select(id) { c.select(id); }
    c.onPick(function () { layout(false); });

    var canvas = el('canvas', 'obs-sky');
    canvas.setAttribute('aria-hidden', 'true');
    obs.insertBefore(canvas, obs.firstChild);

    /* ---------- the sky ---------- */
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1, cx = 0, cy = 0, rx = 0, ry = 0, sunR = 30, k = 1;
    var goal = { cx: 0, cy: 0, rx: 0, ry: 0, k: 1 };
    var stars = [], starLayer = null, starOff = 0, nebula = null, planets = [], sunPos = { x: 0, y: 0 };
    var phase = RINGS.map(function (r) { return r.start; });
    var speed = reduce ? 0 : 1, shoot = null, nextShoot = 4000;

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      layout(true);

      /* a star for every so many pixels, three depths */
      var n = Math.min(520, Math.round(W * H / 1500));
      var faint = [];
      stars = [];
      for (var i = 0; i < n; i++) {
        var z = Math.random();
        var st = { x: Math.random() * W, y: Math.random() * H, z: z,
                   r: 0.35 + z * z * 1.3, a: 0.25 + z * 0.65, tw: rand(0.6, 2.2), ph: Math.random() * TAU,
                   warm: Math.random() < 0.12 };
        (st.r > 1.25 ? stars : faint).push(st);
      }
      starLayer = bakeStars(faint);
      nebula = makeNebula();
    }

    /* The faint stars — most of them — are painted once onto a layer of
       their own, which drifts across the sky as one; only the bright few
       with a cross of light are drawn, and twinkle, every frame. Five
       hundred little circles a frame, each with its own colour string, was
       most of what this canvas cost a phone. */
    function bakeStars(list) {
      var c = document.createElement('canvas');
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      var g = c.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      var tw = reduce ? 1 : 0.75;              /* about where a twinkle spends its time */
      list.forEach(function (st) {
        g.fillStyle = st.warm ? 'rgba(255,226,190,' + (st.a * tw) + ')' : 'rgba(225,245,240,' + (st.a * tw) + ')';
        /* a star on the seam is painted on both sides of it, so the layer tiles */
        [st.x, st.x < 2 ? st.x + W : null, st.x > W - 2 ? st.x - W : null].forEach(function (x) {
          if (x == null) return;
          g.beginPath();
          g.arc(x, st.y, st.r, 0, TAU);
          g.fill();
        });
      });
      return c;
    }

    /* Where the system sits. Normally between the text at the top and the
       legend below; with a planet open, in whatever sky the sheet leaves, so
       the tapped world stays in view with its reticle on it. A phone held
       upright is taller than it is wide, so there the orbits stand up and use
       the height — the first version laid them flat and crowded every name
       into the middle third of the screen. */
    function layout(instant) {
      var top = (document.querySelector('.top') || hud).getBoundingClientRect().bottom;
      var y0, y1;
      if (sel() && !sheet.hidden) {
        y0 = top + 14;
        y1 = sheet.getBoundingClientRect().top - 16;
      } else {
        y0 = hud.getBoundingClientRect().bottom + 18;
        y1 = H - 58;
      }
      var availW = Math.min(W / 2 - 34, 540), availH = Math.max(40, (y1 - y0) / 2 - 24);
      var gx, gy;
      if (availH > availW * 1.1) {
        gx = availW;
        gy = Math.min(availH, availW * 1.55);
      } else {
        var tilt = Math.max(0.42, Math.min(0.8, availH / availW));
        gx = Math.min(availW, availH / tilt);
        gy = gx * tilt;
      }
      goal.cx = W / 2;
      goal.cy = (y0 + y1) / 2;
      goal.rx = gx;
      goal.ry = gy;
      goal.k = Math.max(0.55, Math.min(1.5, Math.sqrt(gx * gy) / 190));
      if (instant || reduce) { cx = goal.cx; cy = goal.cy; rx = goal.rx; ry = goal.ry; k = goal.k; }
      sunR = 30 * k;
    }

    /* the clouds, painted once per size and then only moved */
    function makeNebula() {
      var c = document.createElement('canvas');
      c.width = Math.round(W * 1.2); c.height = Math.round(H * 1.2);
      var g = c.getContext('2d');
      var blobs = [
        [0.22, 0.28, 0.55, [42, 165, 142], 0.16],
        [0.78, 0.62, 0.60, [40, 70, 150], 0.18],
        [0.60, 0.18, 0.40, [120, 80, 170], 0.10],
        [0.30, 0.80, 0.45, [227, 181, 71], 0.06],
        [0.52, 0.48, 0.30, [95, 224, 198], 0.08]
      ];
      blobs.forEach(function (b) {
        var x = b[0] * c.width, y = b[1] * c.height, r = b[2] * Math.max(c.width, c.height);
        var gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, rgba(b[3], b[4]));
        gr.addColorStop(0.45, rgba(b[3], b[4] * 0.45));
        gr.addColorStop(1, rgba(b[3], 0));
        g.fillStyle = gr;
        g.fillRect(0, 0, c.width, c.height);
      });
      /* dust: a few thousand faint grains so the clouds have texture */
      var grains = Math.round(c.width * c.height / 900);
      for (var i = 0; i < grains; i++) {
        g.fillStyle = 'rgba(200,230,225,' + (Math.random() * 0.05) + ')';
        g.fillRect(Math.random() * c.width, Math.random() * c.height, 1, 1);
      }
      return c;
    }

    function place(t) {
      planets = [];
      RINGS.forEach(function (ring, ri) {
        var n = ring.ids.length;
        ring.ids.forEach(function (id, j) {
          var ang = phase[ri] + j * TAU / n;
          var a = ring.rel * rx, b = ring.rel * ry;
          var x = cx + Math.cos(ang) * a, y = cy + Math.sin(ang) * b;
          var d = Math.sin(ang);                    /* −1 behind the sun, 1 in front */
          var sc = 0.8 + 0.32 * (d + 1) / 2;
          var h = heat[id];
          var base = { loud: 12.5, warm: 10, quiet: 8, none: 7 }[h] * k;
          planets.push({ id: id, ring: ring, x: x, y: y, d: d, r: base * sc, sc: sc, heat: h });
        });
      });
      planets.sort(function (p, q) { return p.y - q.y; });
    }

    /* Where each name goes. The loudest planets choose first — a name that
       wants him must never be the one hidden — then the nearer ones. A name
       goes under its planet if there is room, above it if not, and fades if
       neither is free; the sun's disc counts as taken. */
    var FONT = 'Archivo, "Noto Sans Ethiopic", sans-serif';
    function labelSize(p) {
      return Math.round(Math.max(10, 11 * Math.min(Math.max(k, 0.9), 1.25) * (0.9 + 0.12 * p.sc)));
    }
    function assignLabels() {
      var rank = { loud: 0, warm: 1, quiet: 2, none: 3 };
      var order = planets.slice().sort(function (a, b) {
        if (a.id === sel()) return -1;
        if (b.id === sel()) return 1;
        return rank[a.heat] - rank[b.heat] || b.d - a.d;
      });
      var taken = [{ x0: cx - sunR * 1.15, y0: cy - sunR * 1.15, x1: cx + sunR * 1.15, y1: cy + sunR * 1.15 }];
      /* the ring names, at the top of each ring, are taken too */
      if (!sel()) {
        ctx.font = '700 ' + Math.round(Math.max(8.5, 9 * Math.min(k, 1.2))) + 'px ' + FONT;
        RINGS.forEach(function (ring) {
          var lab = lang === 'am' ? ring.am : ring.en.toUpperCase();
          var hw = ctx.measureText(lab).width / 2, top = cy - ring.rel * ry - 7;
          taken.push({ x0: cx - hw - 3, y0: top - 11, x1: cx + hw + 3, y1: top + 3 });
        });
      }
      function clash(b) {
        for (var i = 0; i < taken.length; i++) {
          var o = taken[i];
          if (b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0) return true;
        }
        return false;
      }
      order.forEach(function (p) {
        var fs = labelSize(p);
        ctx.font = (sel() === p.id ? '800 ' : '600 ') + fs + 'px ' + FONT;
        var w = ctx.measureText(name(p.id)).width, half = w / 2;
        var x = Math.max(8 + half, Math.min(W - 8 - half, p.x));
        var below = { x0: x - half - 3, y0: p.y + p.r + 5, x1: x + half + 3, y1: p.y + p.r + 7 + fs };
        var above = { x0: x - half - 3, y0: p.y - p.r - 9 - fs, x1: x + half + 3, y1: p.y - p.r - 5 };
        p.fs = fs; p.lx = x; p.la = 1;
        if (sel() && sel() !== p.id) { p.la = 0; return; }
        if (sel() === p.id) {
          /* in the small sky above the sheet the name reads above its world */
          p.ly = above.y0 + 2; taken.push(above); return;
        }
        if (!clash(below)) { p.ly = below.y0 + 1; taken.push(below); return; }
        if (!clash(above)) { p.ly = above.y0 + 2; taken.push(above); return; }
        p.ly = below.y0 + 1; p.la = 0.22;
      });
    }

    function drawStars(t, dt) {
      stars.forEach(function (st) {
        if (!reduce) { st.x -= st.z * 0.006 * dt; if (st.x < -2) st.x = W + 2; }
        var tw = reduce ? 1 : 0.65 + 0.35 * Math.sin(t * 0.001 * st.tw + st.ph);
        ctx.fillStyle = st.warm ? 'rgba(255,226,190,' + (st.a * tw) + ')' : 'rgba(225,245,240,' + (st.a * tw) + ')';
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, TAU);
        ctx.fill();
        if (st.r > 1.25) {             /* the bright few get a cross of light */
          ctx.strokeStyle = 'rgba(225,245,240,' + (st.a * tw * 0.35) + ')';
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(st.x - st.r * 3, st.y); ctx.lineTo(st.x + st.r * 3, st.y);
          ctx.moveTo(st.x, st.y - st.r * 3); ctx.lineTo(st.x, st.y + st.r * 3);
          ctx.stroke();
        }
      });
    }

    function drawShoot(t, dt) {
      if (reduce) return;
      nextShoot -= dt;
      if (!shoot && nextShoot <= 0) {
        shoot = { x: rand(W * 0.3, W * 1.05), y: rand(-20, H * 0.35), vx: -rand(0.7, 1.1), vy: rand(0.3, 0.5), life: 0 };
        nextShoot = rand(7000, 15000);
      }
      if (!shoot) return;
      shoot.life += dt;
      var p = shoot.life / 900;
      if (p >= 1) { shoot = null; return; }
      var x = shoot.x + shoot.vx * shoot.life, y = shoot.y + shoot.vy * shoot.life;
      var len = 140;
      var g = ctx.createLinearGradient(x, y, x - shoot.vx * len, y - shoot.vy * len);
      var a = Math.sin(p * Math.PI);
      g.addColorStop(0, 'rgba(255,255,255,' + (0.9 * a) + ')');
      g.addColorStop(1, 'rgba(95,224,198,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - shoot.vx * len, y - shoot.vy * len);
      ctx.stroke();
    }

    function drawOrbits(front) {
      RINGS.forEach(function (ring) {
        var a = ring.rel * rx, b = ring.rel * ry;
        ctx.beginPath();
        if (front) ctx.ellipse(cx, cy, a, b, 0, 0, Math.PI);
        else ctx.ellipse(cx, cy, a, b, 0, Math.PI, TAU);
        ctx.strokeStyle = rgba(ring.rgb, front ? 0.26 : 0.12);
        ctx.lineWidth = front ? 1.1 : 0.9;
        ctx.setLineDash(front ? [] : [2, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        if (!front && !sel()) {
          /* the family's name, small, at the top of its ring */
          ctx.font = '700 ' + Math.round(Math.max(8.5, 9 * Math.min(k, 1.2))) + 'px Archivo, "Noto Sans Ethiopic", sans-serif';
          ctx.fillStyle = rgba(ring.rgb, 0.5);
          ctx.textAlign = 'center';
          var label = (lang === 'am' ? ring.am : ring.en);
          if (lang !== 'am') label = label.toUpperCase();
          ctx.fillText(label, cx, cy - b - 7);
        }
      });
    }

    function drawSun(t) {
      var pulse = reduce ? 1 : 1 + 0.018 * Math.sin(t * 0.0021);
      var R = sunR * pulse;
      sunPos = { x: cx, y: cy, r: R };
      var loud = ORDER.filter(function (id) { return id !== 'brief' && heat[id] === 'loud'; }).length;
      var any = ORDER.some(function (id) { return heat[id] !== 'none'; });

      /* the glow the whole system sits in */
      var g = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * 5.2);
      g.addColorStop(0, 'rgba(95,224,198,0.34)');
      g.addColorStop(0.35, 'rgba(95,224,198,0.10)');
      g.addColorStop(1, 'rgba(95,224,198,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R * 5.2, 0, TAU); ctx.fill();

      /* the corona: slow rays that breathe */
      var rays = 28;
      for (var i = 0; i < rays; i++) {
        var ang = i * TAU / rays + (reduce ? 0 : t * 0.00004);
        var len = R * (1.55 + 0.35 * Math.sin((reduce ? 0 : t * 0.0011) + i * 1.7));
        var x1 = cx + Math.cos(ang) * R * 1.02, y1 = cy + Math.sin(ang) * R * 1.02;
        var x2 = cx + Math.cos(ang) * len, y2 = cy + Math.sin(ang) * len;
        var rg = ctx.createLinearGradient(x1, y1, x2, y2);
        rg.addColorStop(0, 'rgba(180,255,236,0.30)');
        rg.addColorStop(1, 'rgba(95,224,198,0)');
        ctx.strokeStyle = rg;
        ctx.lineWidth = i % 2 ? 1 : 2;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }

      /* the body */
      var b = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
      b.addColorStop(0, '#ffffff');
      b.addColorStop(0.28, '#d8fff5');
      b.addColorStop(0.7, '#6fe7cf');
      b.addColorStop(1, '#23907c');
      ctx.fillStyle = b;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();

      /* how many want him, in the middle of it */
      ctx.textAlign = 'center';
      ctx.fillStyle = '#032019';
      ctx.font = '800 ' + Math.round(R * 0.78) + 'px Archivo, sans-serif';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(any ? String(loud) : '—', cx, cy + R * 0.2);
      ctx.font = '800 ' + Math.max(7, Math.round(R * 0.19)) + 'px Archivo, "Noto Sans Ethiopic", sans-serif';
      var lab = any ? (loud ? s('wantYou', 'want you') : s('allQuiet', 'all quiet')) : s('awaiting', 'awaiting');
      ctx.fillText(lang === 'am' ? lab : lab.toUpperCase(), cx, cy + R * 0.5);

      if (sel() === 'brief') reticle(cx, cy, R * 1.25, t);
    }

    /* a signal leaving the sun for a planet that wants him */
    function drawBeams(t) {
      planets.forEach(function (p) {
        if (p.heat !== 'loud') return;
        var dim = sel() && sel() !== p.id ? 0.25 : 1;
        var g = ctx.createLinearGradient(cx, cy, p.x, p.y);
        g.addColorStop(0, 'rgba(238,124,97,0)');
        g.addColorStop(0.35, 'rgba(238,124,97,' + (0.28 * dim) + ')');
        g.addColorStop(1, 'rgba(238,124,97,' + (0.55 * dim) + ')');
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p.x, p.y); ctx.stroke();
        if (!reduce) {
          var u = (t / 1600 + p.x * 0.001) % 1;
          var px = cx + (p.x - cx) * u, py = cy + (p.y - cy) * u;
          var pg = ctx.createRadialGradient(px, py, 0, px, py, 6);
          pg.addColorStop(0, 'rgba(255,200,185,' + (0.95 * dim) + ')');
          pg.addColorStop(1, 'rgba(238,124,97,0)');
          ctx.fillStyle = pg;
          ctx.beginPath(); ctx.arc(px, py, 6, 0, TAU); ctx.fill();
        }
      });
    }

    function reticle(x, y, r, t) {
      var rot = reduce ? 0 : t * 0.0009;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.strokeStyle = 'rgba(95,224,198,0.9)';
      ctx.lineWidth = 1.3;
      ctx.setLineDash([5, 6]);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      for (var i = 0; i < 4; i++) {
        var a = i * Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (r + 3), Math.sin(a) * (r + 3));
        ctx.lineTo(Math.cos(a) * (r + 10), Math.sin(a) * (r + 10));
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawPlanet(p, t) {
      var dim = sel() && sel() !== p.id ? 0.32 : 1;
      var depthA = (0.6 + 0.4 * (p.d + 1) / 2) * dim;
      var x = p.x, y = p.y, r = p.r;

      /* the halo says how loud; the body says which family */
      if (p.heat === 'loud') {
        var hg = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 3.6);
        hg.addColorStop(0, rgba(CORAL, 0.55 * depthA));
        hg.addColorStop(1, rgba(CORAL, 0));
        ctx.fillStyle = hg;
        ctx.beginPath(); ctx.arc(x, y, r * 3.6, 0, TAU); ctx.fill();
        if (!reduce) {
          for (var q = 0; q < 2; q++) {
            var u = ((t / 2200) + q * 0.5 + p.x * 0.0007) % 1;
            ctx.strokeStyle = rgba(CORAL, (1 - u) * 0.55 * depthA);
            ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.arc(x, y, r * (1.3 + u * 2.8), 0, TAU); ctx.stroke();
          }
        }
      } else if (p.heat === 'warm') {
        var wg = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 2.8);
        wg.addColorStop(0, rgba(GOLD, 0.40 * depthA));
        wg.addColorStop(1, rgba(GOLD, 0));
        ctx.fillStyle = wg;
        ctx.beginPath(); ctx.arc(x, y, r * 2.8, 0, TAU); ctx.fill();
      } else if (p.heat === 'quiet') {
        var qg = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2.2);
        qg.addColorStop(0, rgba(p.ring.rgb, 0.14 * depthA));
        qg.addColorStop(1, rgba(p.ring.rgb, 0));
        ctx.fillStyle = qg;
        ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, TAU); ctx.fill();
      }

      if (p.heat === 'none') {
        /* not read yet: an outline of a world */
        ctx.strokeStyle = rgba(p.ring.rgb, 0.55 * depthA);
        ctx.setLineDash([2, 3]);
        ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = rgba(p.ring.rgb, 0.08 * depthA);
        ctx.fill();
      } else {
        /* lit from the sun's side */
        var dx = cx - x, dy = cy - y, dl = Math.sqrt(dx * dx + dy * dy) || 1;
        var lx = x + dx / dl * r * 0.45, ly = y + dy / dl * r * 0.45;
        var tint = p.heat === 'loud' ? mix(p.ring.rgb, CORAL, 0.55) : (p.heat === 'warm' ? mix(p.ring.rgb, GOLD, 0.4) : p.ring.rgb);
        var bg = ctx.createRadialGradient(lx, ly, r * 0.05, x, y, r * 1.05);
        bg.addColorStop(0, rgba(mix(tint, WHITE, 0.7), depthA));
        bg.addColorStop(0.45, rgba(tint, depthA));
        bg.addColorStop(1, rgba(mix(tint, [4, 10, 9], 0.8), depthA));
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.18 * depthA) + ')';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      if (sel() === p.id) reticle(x, y, r * 2.1 + 6, t);

      /* its name, where assignLabels put it */
      if (!p.la) return;
      var fs = p.fs;
      ctx.font = (sel() === p.id ? '800 ' : '600 ') + fs + 'px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 6;
      var col = p.heat === 'loud' ? CORAL : (p.heat === 'warm' ? GOLD : [205, 222, 216]);
      ctx.fillStyle = rgba(col, (p.heat === 'none' ? 0.55 : 0.92) * depthA * p.la);
      ctx.fillText(name(p.id), p.lx, p.ly);
      ctx.shadowBlur = 0;
      ctx.textBaseline = 'alphabetic';
    }

    var last = 0, raf = 0, alive = true;
    function frame(t) {
      if (!alive) return;
      /* thirty frames a second is plenty for a sky this slow, and half the work */
      if (last && t - last < 30) { raf = requestAnimationFrame(frame); return; }
      var dt = last ? Math.min(64, t - last) : 16;
      last = t;
      var target = (sel() || reduce) ? 0 : 1;
      speed += (target - speed) * Math.min(1, dt / 350);
      RINGS.forEach(function (ring, i) { phase[i] += speed * dt / 1000 * TAU / ring.period; });
      var f = Math.min(1, dt / 240);
      cx += (goal.cx - cx) * f; cy += (goal.cy - cy) * f;
      rx += (goal.rx - rx) * f; ry += (goal.ry - ry) * f;
      k += (goal.k - k) * f; sunR = 30 * k;

      ctx.clearRect(0, 0, W, H);
      var bgG = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.8);
      bgG.addColorStop(0, '#07130f');
      bgG.addColorStop(1, '#020506');
      ctx.fillStyle = bgG;
      ctx.fillRect(0, 0, W, H);
      if (nebula) {
        var ox = reduce ? 0 : Math.sin(t * 0.00003) * W * 0.05, oy = reduce ? 0 : Math.cos(t * 0.00002) * H * 0.04;
        ctx.globalAlpha = 1;
        ctx.drawImage(nebula, -W * 0.1 + ox, -H * 0.1 + oy, W * 1.2, H * 1.2);
      }
      if (starLayer) {
        /* the faint layer drifts left at the pace of a middling star, in
           whole device pixels so it is copied, not blurred */
        if (!reduce) starOff = W ? (starOff + 0.0025 * dt) % W : 0;
        var so = Math.round(starOff * dpr) / dpr;
        ctx.drawImage(starLayer, -so, 0, W, H);
        if (so > 0) ctx.drawImage(starLayer, W - so, 0, W, H);
      }
      drawStars(t, dt);
      drawShoot(t, dt);

      place(t);
      assignLabels();
      drawOrbits(false);
      planets.forEach(function (p) { if (p.d < 0) drawPlanet(p, t); });
      drawBeams(t);
      drawSun(t);
      drawOrbits(true);
      planets.forEach(function (p) { if (p.d >= 0) drawPlanet(p, t); });

      raf = requestAnimationFrame(frame);
    }

    /* tapping the sky */
    canvas.addEventListener('click', function (e) {
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      var dS = Math.hypot(x - sunPos.x, y - sunPos.y);
      if (dS < sunPos.r * 1.35) { select('brief'); return; }
      var best = null, bd = 1e9;
      planets.forEach(function (p) {
        var d = Math.hypot(x - p.x, y - p.y);
        if (d < Math.max(24, p.r * 2.4) && d < bd) { bd = d; best = p; }
      });
      select(best ? best.id : null);
    });

    function onVis() {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
    }
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('resize', resize);
    resize();
    raf = requestAnimationFrame(frame);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);

    return {
      update: c.update,
      select: c.select,
      destroy: function () {
        alive = false;
        cancelAnimationFrame(raf);
        document.removeEventListener('visibilitychange', onVis);
        window.removeEventListener('resize', resize);
        c.destroy();
      }
    };
  }

  window.KleverOrbit = {
    mount: mount, chrome: chrome, agents: AGENTS, rings: RINGS, order: ORDER, heatOf: heatOf
  };
})();
