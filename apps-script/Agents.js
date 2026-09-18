/* Klever — the fifteen daily agents.

   HOW THIS IS PUT TOGETHER, AND WHY
   The day's reports are read once. Every number each agent needs is then
   worked out here, in code — counts, rates, totals, who was due and who
   filed. Only after that does a model see anything, and what it sees is a
   short block of finished facts rather than a pile of raw fields.

   That split is the whole design. Arithmetic is not a thing to ask a model
   for: it will eventually get one wrong, and here the wrong ones cost people
   money or send the Chairman after the wrong person. What a model is for is
   the sentence after the number — this is the third day running, these two
   reports cannot both be true, nobody has mentioned the thing everyone is
   working around.

   Fourteen agents run at once, in one UrlFetchApp.fetchAll, because fourteen
   calls one after another would sit near the six-minute execution limit and
   eventually cross it. The fifteenth reads the other fourteen and writes the
   Chairman his brief, so it has to run after them.

   ADDING AN AGENT
   Add an entry to AGENTS. It needs an id, a title in both languages, a facts
   function that returns an object of already-computed numbers, and the
   question to ask about them. Nothing else in this file changes.

   SET UP: the same Script Properties as the ledger — GEMINI_KEY,
   FIREBASE_WEB_KEY, LEDGER_PASSWORD. Then a daily trigger on runAgents,
   after the last report is due (6:30pm or later; Betelhem's Customer Pulse
   is due at 6:00pm).                                                        */

/* ------------------------------------------------------------------ *
 *  Small helpers                                                      *
 * ------------------------------------------------------------------ */

function n_(v) {
  if (v == null || v === '') return 0;
  var x = Number(String(v).replace(/[^0-9.\-]/g, ''));
  return isNaN(x) ? 0 : x;
}
function yes_(v) {
  return String(v == null ? '' : v).toLowerCase().indexOf('y') === 0;
}
/* the values map of one filed report, or null if it never arrived */
function got_(filed, reportId) {
  for (var i = 0; i < filed.length; i++) if (filed[i].report === reportId) return filed[i];
  return null;
}
function vals_(filed, reportId) {
  var f = got_(filed, reportId);
  return f ? (f.fields || {}) : {};
}
/* rows of a table or grid field, whatever shape they came back in */
function rows_(v) {
  if (!v) return [];
  if (Object.prototype.toString.call(v) === '[object Array]') return v;
  var out = [];
  Object.keys(v).forEach(function (k) { out.push(v[k]); });
  return out;
}
/* A number from a report that was never filed is not zero, it is unknown.
   n_() cannot tell those apart and will hand a model a confident 0, which it
   will then reason from — "Mahelet recorded zero production" when Mahelet
   recorded nothing at all. Use this wherever an absent figure would be read
   as a real one, above all when comparing two people's reports. */
function nOrNull_(filed, reportId, field) {
  var f = got_(filed, reportId);
  return f ? n_((f.fields || {})[field]) : null;
}
/* every report that was due today and did not arrive */
function notFiled_(d) {
  return d.ledger.filter(function (l) { return l.status === 'MISSING'; })
                 .map(function (l) { return l.person + ' — ' + l.report; });
}
function pctOf_(part, whole) {
  return whole ? Math.round((part / whole) * 1000) / 10 : 0;
}

/* ------------------------------------------------------------------ *
 *  The fifteen                                                        *
 * ------------------------------------------------------------------ */

var AGENTS = [

{ id:'attendance', en:'Who was absent today', am:'ዛሬ ማን እንደቀረ',
  facts: function (d) {
    var amaha = vals_(d.filed, 'amaha-daily');
    var elyas = vals_(d.filed, 'elyas-daily');
    var assigned = n_(amaha.mp_assigned), present = n_(amaha.mp_present);
    return {
      factory_assigned: assigned,
      factory_present: present,
      factory_absent: n_(amaha.mp_absent),
      factory_late: n_(amaha.mp_late),
      factory_attendance_pct: pctOf_(present, assigned),
      factory_behaviour_issues: n_(amaha.mp_behave),
      site_assemblers_present: n_(elyas.a_present),
      site_assemblers_late: n_(elyas.a_late),
      site_left_early: n_(elyas.a_early),
      site_behaviour_issues: n_(elyas.a_behave),
      site_issues_reported_to_mahelet: yes_(elyas.a_reported),
      production_target_m2_per_day: 40,
      m2_produced: n_(amaha.p_total),
      /* without these it will blame the shortfall on whoever was absent, which
         is the first thing it sees and often not the reason */
      hours_lost_to_something_else: n_(amaha.w_lost),
      what_else_held_the_day_up: amaha.w_block || '',
      stopped_for_missing_board: yes_(amaha.b_short)
    };
  },
  ask:'Who is missing, and how much of the day it actually explains. The attendance bonus '+
      'needs 95%. Be careful here: if hours were also lost to a stoppage, absence is only '+
      'part of the shortfall and you must say so rather than attributing all of it to the '+
      'people who were away. If lateness or absence is concentrated rather than spread, '+
      'say so.' },

{ id:'production', en:'Production', am:'ምርት',
  facts: function (d) {
    var amaha = vals_(d.filed, 'amaha-daily');
    var stage = rows_(amaha.w_stage);
    return {
      m2_produced: n_(amaha.p_total),
      m2_target: 40,
      m2_external: n_(amaha.p_ext),
      m2_rovestone: n_(amaha.p_rove),
      waste_pct: n_(amaha.w_pct),
      waste_limit_pct: 20,
      material_over_bom_pct: n_(amaha.w_var),
      sheets_used: n_(amaha.b_sheets),
      m2_per_sheet: n_(amaha.b_yield),
      m2_per_sheet_target: 2.2,
      edge_banding_m: n_(amaha.b_edge),
      edge_reruns: n_(amaha.b_redo),
      stopped_for_missing_board: yes_(amaha.b_short),
      which_board: amaha.b_shortw || '',
      stage_holding_us_up: amaha.w_block || '',
      hours_lost: n_(amaha.w_lost),
      wip_by_stage: stage,
      machines_all_reported_in_30min: yes_(amaha.m_reported)
    };
  },
  ask:'Did the factory make its 40 m², and if not, what actually stopped it. '+
      'Yield below 2.2 m² a sheet means the cutting plan is wasting board — say so if it is. '+
      'If one stage is holding work up, name it and say whether the queue behind it is growing.' },

{ id:'quality', en:'Quality', am:'ጥራት',
  facts: function (d) {
    var wude = vals_(d.filed, 'wude-daily');
    return {
      inspected: n_(wude.i_total), passed: n_(wude.i_pass), failed: n_(wude.i_fail),
      pass_rate_pct: n_(wude.i_rate), pass_rate_bonus_at: 98,
      defects_found: n_(wude.d_total),
      defects_released_to_finished_goods: n_(wude.d_released),
      rework_rate_pct: n_(wude.r_rate),
      rework_bonus_below_pct: 2, rework_penalty_above_pct: 5,
      defects_by_stage: rows_(wude.c_stage),
      worst_stage: wude.c_worst || '',
      same_stage_as_yesterday: yes_(wude.c_repeat),
      amaha_told_the_cause: yes_(wude.c_told),
      suppliers_fault_defects: n_(wude.c_sup),
      pressured_to_pass: yes_(wude.pr_any)
    };
  },
  ask:'Where are the defects actually coming from, and is it the same place as yesterday. '+
      'Note that rework between 2% and 5% earns no bonus and carries no penalty — if today '+
      'sits in that band, say it plainly, because nothing in the letters reacts to it. '+
      'If anyone pressured Wude to pass a defect, that is the headline.' },

{ id:'store', en:'Store and stock', am:'መጋዘንና ክምችት',
  facts: function (d) {
    var yord = vals_(d.filed, 'yordanos-daily');
    return {
      stock_and_days_of_cover: rows_(yord.k_stock),
      anything_at_5_days_or_less: yes_(yord.k_low),
      which_and_told_getachew: yord.k_which || '',
      shortages_flagged: n_(yord.sh_flagged),
      production_stopped_by_shortage: n_(yord.sh_stopped),
      which_materials: yord.sh_what || '',
      discrepancies: n_(yord.st_disc),
      offcut_m2_returned: n_(yord.k_offin),
      offcut_m2_reissued: n_(yord.k_offout),
      consumables_month_to_date: n_(yord.con_mtd),
      consumables_budget: 30000,
      theft_or_unauthorized_removal: yes_(yord.sec_theft)
    };
  },
  ask:'What is about to run out, and will it stop production before it is replaced. '+
      'Days of cover is the number that matters — anything at five days or less should '+
      'already be with Getachew. If offcuts are coming back but not going out again, the '+
      'factory is paying for board it already owns.' },

{ id:'purchasing', en:'Purchasing and prices', am:'ግዥና ዋጋ',
  facts: function (d) {
    var purch = vals_(d.filed, 'getachew-daily');
    return {
      prices_paid_today: rows_(purch.p_rows),
      materials_up_more_than_10pct: n_(purch.p_up),
      ephrata_and_betty_told: yes_(purch.p_told),
      substitution_made: yes_(purch.p_sub),
      wude_approved_substitute: yes_(purch.p_subok),
      requests_with_3_or_more_quotes: n_(purch.pr_quotes),
      requests_prepared: n_(purch.pr_prep),
      supplier_delays: n_(purch.sup_delay),
      supplier_quality_issues: n_(purch.sup_quality),
      cheque_value: n_(purch.chq_value),
      margin_floor_birr_per_m2: 6000
    };
  },
  ask:'Is anything we buy getting more expensive in a way that will eat the 6,000 Birr/m² '+
      'floor. A rise has to reach Ephrata before the next quote goes out, not after. '+
      'If a cheaper material was substituted without Wude approving it first, say so — '+
      'that is how a saving becomes a warranty claim.' },

{ id:'finance', en:'Finance', am:'ፋይናንስ',
  facts: function (d) {
    var fin = vals_(d.filed, 'betty-daily');
    return {
      cash_in: n_(fin.cash_in), cash_banked: n_(fin.cash_banked), cash_in_hand: n_(fin.cash_hand),
      bank_total: n_(fin.bank_total), reserve_floor: 6000000,
      below_6m_reported: yes_(fin.below6_reported),
      discrepancy: yes_(fin.discrepancy),
      payments_approved: n_(fin.pay_approved), payment_value: n_(fin.pay_value),
      kidan_approved_above_50k: yes_(fin.pay_kidan),
      zamzam_transferred: n_(fin.zz_transfer), zamzam_confirmed: yes_(fin.zz_confirmed),
      zamzam_discrepancy: n_(fin.zz_disc),
      advance_received: n_(fin.adv_in), final_received: n_(fin.final_in),
      board_mismatch: n_(fin.board_mismatch),
      documents_missing: n_(fin.doc_missing)
    };
  },
  ask:'Is the money where it should be. The reserve floor is 6,000,000 Birr and falling '+
      'below it has to be reported the same day. A discrepancy, an unconfirmed ZamZam '+
      'transfer, or a payment over 50,000 without Kidan is a same-day problem, not a '+
      'month-end one.' },

{ id:'commercial', en:'Sales and commercial', am:'ሽያጭና ንግድ',
  facts: function (d) {
    var ephrata = vals_(d.filed, 'ephrata-daily');
    var tsega = vals_(d.filed, 'tsega-sales-daily');
    var biruk = vals_(d.filed, 'biruktayet-sales-daily');
    return {
      leads_today: n_(ephrata.leads_total),
      leads_by_source: { social:n_(ephrata.leads_social), showroom:n_(ephrata.leads_showroom),
                         referral:n_(ephrata.leads_referral), agent:n_(ephrata.leads_agent), other:n_(ephrata.leads_other) },
      answered_within_1hr: n_(ephrata.resp_1hr),
      visits_booked: n_(ephrata.visits_booked), visits_done: n_(ephrata.visits_done), visits_late: n_(ephrata.visits_late),
      quotes_issued: n_(ephrata.quotes_issued), quotes_late: n_(ephrata.quotes_late),
      contracts_signed: n_(ephrata.contracts), contract_value: n_(ephrata.contract_value),
      collected_today: n_(ephrata.collected_today),
      week_to_date: n_(ephrata.week_total),
      weekly_floor: 3000000,
      unanswered_whatsapp: n_(ephrata.wa_unanswered),
      complaints_in_groups: n_(ephrata.wa_complaints),
      tsega_filed: !!got_(d.filed, 'tsega-sales-daily'),
      biruktayet_filed: !!got_(d.filed, 'biruktayet-sales-daily')
    };
  },
  ask:'Is the week going to reach 3,000,000 Birr, and if not say it now rather than on '+
      'Friday. Look at where leads came from against which ones converted — if one source '+
      'produces volume and no contracts, that is money being spent for nothing. Unanswered '+
      'WhatsApp is a lost customer nobody has noticed yet.' },

{ id:'design', en:'Design', am:'ዲዛይን',
  facts: function (d) {
    var ids = ['yohannis','yonas','abrham-g','teklweld','abrham-w'];
    var out = { designers: [], filed: 0, missing: [] };
    ids.forEach(function (id) {
      var r = got_(d.filed, id + '-design-daily');
      if (r) { out.filed++; out.designers.push({ who:id, values:r.fields }); }
      else out.missing.push(id);
    });
    return out;
  },
  ask:'Are designs moving or sitting. A design that stalls holds up a job that is already '+
      'paid for in part, so a stage not moving for days matters more than a slow day. '+
      'If the same customer is being redrawn again and again, name it — revisions are the '+
      'hidden cost in this trade.' },

{ id:'site', en:'Installation and site', am:'ተከላና ቦታ',
  facts: function (d) {
    var elyas = vals_(d.filed, 'elyas-daily');
    var ashen = vals_(d.filed, 'ashenafi-daily');
    return {
      jobs_today: n_(elyas.j_total), completed: n_(elyas.j_done), in_progress: n_(elyas.j_wip),
      m2_installed: n_(elyas.j_m2),
      site_not_ready_count: n_(elyas.r_notready),
      site_did_not_match_measurement: n_(elyas.r_meas),
      whose_measurement: elyas.r_whose || '',
      hours_lost_to_site: n_(elyas.r_lost),
      site_conditions: rows_(elyas.r_rows),
      customer_told_same_day: yes_(elyas.r_told),
      photographed_first: yes_(elyas.r_photo),
      acceptances_signed: n_(elyas.ac_signed),
      complaints: n_(elyas.ac_complaints),
      rework_at_site: n_(elyas.q_rework),
      customer_property_damaged: yes_(elyas.cl_damage),
      ashenafi_filed: !!got_(d.filed, 'ashenafi-daily')
    };
  },
  ask:'Did installation lose time to something that was not the installers’ fault. A site '+
      'that did not match our measurement is a design or survey failure and the person '+
      'whose measurement it was should be named. Separate what Elyas can fix from what is '+
      'being handed to him already broken.' },

{ id:'customer', en:'Customers', am:'ደንበኞች',
  facts: function (d) {
    var pulse = vals_(d.filed, 'betty-pulse');
    var elyas = vals_(d.filed, 'elyas-daily');
    var ephrata = vals_(d.filed, 'ephrata-daily');
    return {
      pulse: pulse,
      complaints_at_site: n_(elyas.ac_complaints),
      complaints_in_whatsapp: n_(ephrata.wa_complaints),
      acceptances_signed: n_(elyas.ac_signed),
      customers_called_before_arrival: yes_(elyas.ac_called),
      unanswered_messages: n_(ephrata.wa_unanswered),
      pulse_filed: !!got_(d.filed, 'betty-pulse')
    };
  },
  ask:'What are customers actually saying, and is anyone waiting for an answer. A complaint '+
      'that appears in two places is one unhappy customer, not two — say which. Silence from '+
      'a customer mid-job is not good news.' },

{ id:'compliance', en:'Who reported and who did not', am:'ማን ሪፖርት አደረገ ማን አላደረገም',
  facts: function (d) {
    var missing = [], late = [], ontime = [];
    d.ledger.forEach(function (l) {
      var row = { person:l.person, report:l.report, due:l.due };
      if (l.status === 'MISSING') missing.push(row);
      else if (l.status === 'LATE') late.push(row);
      else ontime.push(row);
    });
    return { due_today: d.ledger.length, on_time: ontime.length,
             late: late, missing: missing };
  },
  ask:'Who did not report. This is the list nobody was keeping before, so be exact and '+
      'be short: names and what is missing. If the same person is missing repeatedly that '+
      'matters more than a busy day; if almost everyone is late, the deadline is wrong, '+
      'not the people.' },

{ id:'penalties', en:'Penalty ledger', am:'የቅጣት መዝገብ',
  facts: function (d) {
    var owed = d.ledger.filter(function (l) { return l.amount > 0; });
    return {
      total_birr: d.ledger.reduce(function (a, l) { return a + l.amount; }, 0),
      charges: owed.map(function (l) {
        return { person:l.person, report:l.report, status:l.status, birr:l.amount, under:l.why };
      }),
      note_yordanos: 'Yordanos files a daily store report but his letter sets no penalty ' +
                     'for missing it — he is listed and charged nothing until the Chairman decides.'
    };
  },
  ask:'The amounts are already calculated and correct — do not restate the arithmetic and '+
      'do not recalculate it. Say only whether a pattern is forming: the same person, the '+
      'same report, the same day of the week. A first miss is a bad day; a third is a '+
      'conversation.' },

{ id:'margin', en:'Margin watch', am:'የትርፍ ክትትል',
  facts: function (d) {
    var ephrata = vals_(d.filed, 'ephrata-daily');
    var amaha = vals_(d.filed, 'amaha-daily');
    var purch = vals_(d.filed, 'getachew-daily');
    var value = n_(ephrata.contract_value), m2 = n_(amaha.p_total);
    return {
      contracts_signed: n_(ephrata.contracts),
      contract_value: value,
      m2_produced_today: m2,
      birr_per_m2_signed_today: m2 ? Math.round(value / m2) : 0,
      margin_floor_birr_per_m2: 6000,
      waste_pct: n_(amaha.w_pct),
      material_over_bom_pct: n_(amaha.w_var),
      m2_per_sheet: n_(amaha.b_yield),
      materials_up_over_10pct: n_(purch.p_up),
      savings_today: n_(amaha.sav_today)
    };
  },
  ask:'Is anything quietly eating the 6,000 Birr/m² floor. Board price rising, yield '+
      'falling, waste climbing and material over BOM all do the same damage from different '+
      'directions. Say which one is moving, not all four.' },

{ id:'contradictions', en:'Reports that disagree', am:'የሚጋጩ ሪፖርቶች',
  facts: function (d) {
    var N = function (rid, f) { return nOrNull_(d.filed, rid, f); };
    var amaha = vals_(d.filed, 'amaha-daily');
    var yord = vals_(d.filed, 'yordanos-daily');
    /* offcuts leaving the factory are recorded per board row, not as a total */
    var sentOut = null;
    if (got_(d.filed, 'amaha-daily')) {
      sentOut = 0;
      rows_(amaha.b_rows).forEach(function (r) { sentOut += n_(r.boff); });
    }
    return {
      note: 'null means that report was not filed — it does not mean zero',
      not_filed: notFiled_(d),
      amaha_m2: N('amaha-daily','p_total'),        mahelet_m2: N('liu-daily','m2'),
      amaha_defects: N('amaha-daily','qc_defects'), wude_defects: N('wude-daily','d_total'),
      mahelet_defects: N('liu-daily','defects'),
      amaha_waste_pct: N('amaha-daily','w_pct'),   mahelet_waste_pct: N('liu-daily','waste'),
      amaha_stopped_for_board: got_(d.filed,'amaha-daily') ? yes_(amaha.b_short) : null,
      amaha_which_board: amaha.b_shortw || '',
      yordanos_shortages: N('yordanos-daily','sh_flagged'),
      yordanos_stopped_production: N('yordanos-daily','sh_stopped'),
      yordanos_which: yord.sh_what || '',
      wude_pass_rate: N('wude-daily','i_rate'),
      mahelet_qc_pass: N('liu-daily','qc_pass'), mahelet_qc_fail: N('liu-daily','qc_fail'),
      elyas_installed_m2: N('elyas-daily','j_m2'), mahelet_installed: N('liu-daily','installed'),
      offcut_m2_received_by_store: N('yordanos-daily','k_offin'),
      offcut_m2_sent_by_factory: sentOut
    };
  },
  ask:'These figures come from different people describing the same day. Where two of them '+
      'cannot both be true, say which two and by how much. A null is a report that was never '+
      'filed — that is a gap, not a disagreement, and you must never describe it as somebody '+
      'having recorded zero. Do not reach: a small difference is rounding or timing. A '+
      'production figure that disagrees with the operations figure, or a factory stopped for '+
      'a board the store says it had, is worth the Chairman’s time.' },

{ id:'brief', en:'The Chairman’s brief', am:'የሊቀመንበሩ ማጠቃለያ', last:true,
  facts: function (d) { return { date: d.dayLabel }; },
  ask:'Below is what the other agents found today. Write the Chairman five lines at most. '+
      'Lead with the thing that costs the most money or will if nobody moves. Do not '+
      'summarise everything — leave out what is merely normal. If the day was ordinary, '+
      'say so in one line and stop. Name people only where a person has to act.' }
];

/* ------------------------------------------------------------------ *
 *  The run                                                            *
 * ------------------------------------------------------------------ */

function runAgents() {
  var when = new Date();
  var d = gather_(when);
  var results = askAll_(d);
  writeAnalysis_(results, when);
  mailAnalysis_(results, d, when);
}

/* Writes nothing, sends nothing, spends nothing on the model. Use this to see
   the facts each agent would be given before letting any of it near Gemini. */
function previewAgents() {
  var d = gather_(new Date());
  Logger.log('%s — %s reports filed, %s due', d.dayLabel, d.filed.length, d.ledger.length);
  AGENTS.forEach(function (a) {
    if (a.last) return;
    Logger.log('\n--- %s ---\n%s', a.en, JSON.stringify(a.facts(d), null, 1).substring(0, 1500));
  });
}

/* one read of the day, shared by all fifteen */
function gather_(when) {
  var schedule = loadSchedule_();
  var due = dueToday_(schedule, when);
  var filed = filedOn_(when);
  var ledger = charge_(due, filed, when);

  /* The ledger carries the id the site uses — liu, abrham-g, betty. Those are
     handles, not names, and "Liu did not file" is not a sentence the Chairman
     should have to translate. Mahelet is called Liu nowhere except in this
     codebase. */
  var name = {};
  (schedule.people || []).forEach(function (p) { name[p.id] = p.en; });
  ledger.forEach(function (l) { l.person = name[l.person] || l.person; });

  return {
    when: when,
    dayLabel: Utilities.formatDate(when, tz_(), 'EEEE d MMMM yyyy'),
    filed: filed,
    due: due,
    names: name,
    ledger: ledger
  };
}

function askAll_(d) {
  var key = prop_('GEMINI_KEY', '');
  var model = prop_('GEMINI_MODEL', AGENT_DEFAULT_MODEL);
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model +
            ':generateContent?key=' + encodeURIComponent(key);

  var first = AGENTS.filter(function (a) { return !a.last; });
  var out = [];

  if (!key) {
    return AGENTS.map(function (a) {
      return { id:a.id, en:a.en, am:a.am,
               text:'(No GEMINI_KEY set — the facts below were still calculated.)',
               facts:a.last ? {} : a.facts(d) };
    });
  }

  /* fourteen at once. One after another would sit near the six-minute limit. */
  var reqs = first.map(function (a) {
    var facts = a.facts(d);
    return {
      url: url, method: 'post', contentType: 'application/json',
      muteHttpExceptions: true,
      payload: JSON.stringify({ contents: [{ parts: [{ text: promptFor_(a, facts, d) }] }] })
    };
  });

  var res = UrlFetchApp.fetchAll(reqs);
  first.forEach(function (a, i) {
    out.push({ id:a.id, en:a.en, am:a.am, facts:a.facts(d), text:readReply_(res[i]) });
  });

  /* the brief reads the other fourteen */
  var brief = AGENTS.filter(function (a) { return a.last; })[0];
  if (brief) {
    var digest = out.map(function (r) { return '## ' + r.en + '\n' + r.text; }).join('\n\n');
    var r = UrlFetchApp.fetch(url, {
      method:'post', contentType:'application/json', muteHttpExceptions:true,
      payload: JSON.stringify({ contents: [{ parts: [{
        text: promptFor_(brief, { date: d.dayLabel }, d) + '\n\n' + digest }] }] })
    });
    out.push({ id:brief.id, en:brief.en, am:brief.am, facts:{}, text:readReply_(r), last:true });
  }
  return out;
}

function promptFor_(agent, facts, d) {
  return [
    'You are one of fifteen analysts reading a single day at Klever Küche, a kitchen',
    'cabinet manufacturer in Addis Ababa. Prices are in Birr; the production target is',
    '40 m² a day and the margin floor is 6,000 Birr per m².',
    '',
    'You are the ' + agent.en + ' analyst. Nobody else will cover your subject, and you',
    'should not cover theirs.',
    '',
    'Every number below was already calculated in code and is correct. Do not recalculate',
    'anything, and do not list numbers back — the Chairman can already see them. Write',
    'about what they mean.',
    '',
    'At most 120 words, short bullets. Write plainly, the way you would say it to the',
    'Chairman standing in the factory: no adjectives doing the work of evidence, no',
    'headline labels in bold, nothing dressed up. "Edge banding stopped work for three',
    'hours" — not "edge banding is plaguing the shop floor". If your subject had an ordinary day,',
    'say so in one line rather than finding something to say. A missing report means the',
    'figure is absent, not zero — say "not reported" rather than treating it as nil.',
    '',
    'YOUR QUESTION: ' + agent.ask,
    '',
    '--- ' + d.dayLabel + ' ---',
    'Reports that were due today and never arrived: ' +
      (notFiled_(d).join('; ') || 'none — everything was filed'),
    '',
    JSON.stringify(facts, null, 1)
  ].join('\n');
}

function readReply_(res) {
  if (!res || res.getResponseCode() !== 200) {
    return '(no answer — HTTP ' + (res ? res.getResponseCode() : '?') + ')';
  }
  try {
    var b = JSON.parse(res.getContentText());
    return String(b.candidates[0].content.parts[0].text).trim();
  } catch (e) {
    return '(could not read the reply)';
  }
}

/* ------------------------------------------------------------------ *
 *  Output                                                             *
 * ------------------------------------------------------------------ */

var ANALYSIS_TAB_ = 'Daily Analysis';

function writeAnalysis_(results, when) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(ANALYSIS_TAB_);
  if (!sh) {
    sh = ss.insertSheet(ANALYSIS_TAB_);
    sh.appendRow(['Date', 'Agent', 'Finding']);
    sh.setFrozenRows(1);
  }
  var day = Utilities.formatDate(when, tz_(), 'yyyy-MM-dd');
  var rows = results.map(function (r) { return [day, r.en, r.text]; });
  if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, 3).setValues(rows);
}

function mailAnalysis_(results, d, when) {
  var brief = results.filter(function (r) { return r.last; })[0];
  var rest = results.filter(function (r) { return !r.last; });
  var owed = d.ledger.reduce(function (a, l) { return a + l.amount; }, 0);
  var missing = d.ledger.filter(function (l) { return l.status === 'MISSING'; }).length;

  var html =
    '<div style="font-family:Helvetica,Arial,sans-serif;max-width:680px;color:#141b1a">' +
    '<h2 style="font-size:18px;margin:0 0 2px">Klever — the day</h2>' +
    '<div style="color:#66716d;font-size:13px;margin-bottom:18px">' + esc_(d.dayLabel) + '</div>' +

    '<div style="display:flex;gap:10px;margin-bottom:22px;font-family:monospace">' +
      tile_('FILED', d.filed.length + ' / ' + d.ledger.length) +
      tile_('NOT FILED', String(missing)) +
      tile_('OWED', fmt_(owed) + ' Birr') +
    '</div>';

  if (brief) {
    html += '<div style="background:#f3f4f1;border-left:3px solid #0f5c54;padding:14px 16px;' +
            'margin-bottom:24px;font-size:14px;line-height:1.65;white-space:pre-wrap">' +
            esc_(brief.text) + '</div>';
  }

  rest.forEach(function (r) {
    html += '<h3 style="font-size:13.5px;margin:20px 0 4px;color:#0f5c54">' + esc_(r.en) + '</h3>' +
            '<div style="font-size:13.5px;line-height:1.6;white-space:pre-wrap;color:#3a4442">' +
            esc_(r.text) + '</div>';
  });

  html += '<p style="color:#66716d;font-size:11.5px;margin-top:28px;line-height:1.6">' +
          'Every figure these fifteen were given was calculated in code from the reports ' +
          'filed today, not by the model. What the model wrote is the reading, not the ' +
          'arithmetic. Penalty amounts come from each person’s signed letter.' +
          '</p></div>';

  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    subject: 'Klever — ' + Utilities.formatDate(when, tz_(), 'EEE d MMM') +
             (missing ? ' — ' + missing + ' not filed' : ' — all filed'),
    htmlBody: html
  });
}

function tile_(label, value) {
  return '<div style="flex:1;background:#f3f4f1;border:1px solid #e4e7e3;padding:10px 12px">' +
         '<div style="font-size:10px;letter-spacing:.12em;color:#66716d">' + label + '</div>' +
         '<div style="font-size:17px;margin-top:3px">' + esc_(value) + '</div></div>';
}
