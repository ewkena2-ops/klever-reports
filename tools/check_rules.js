/* Check js/rules.js before it goes live:   node tools/check_rules.js
   The shape of every entry, unique ids, people and groups; that every report,
   question and table column a test names exists in js/forms.js; the test
   grammar; and that every 'custom' test has its function in
   apps-script/Rules.js. A form changed without its rule is caught here, not
   at six in the morning. It must report 0 errors. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const HERE = path.join(__dirname, '..');
const FORMS = path.join(HERE, 'js/forms.js');
const APPS = fs.readFileSync(path.join(HERE, 'apps-script/Rules.js'), 'utf8');

const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(FORMS, 'utf8') + '\n;this.PEOPLE=PEOPLE;this.REPORTS=REPORTS;', ctx);
const REPORTS = ctx.REPORTS, PEOPLE = ctx.PEOPLE;
const GROUPS = { 'production-worker': 'Production Worker', sales: 'Salesperson', design: 'Designer', assembler: null, cleaner: null };
const PIDS = PEOPLE.map(p => p.id);
const KINDS = ['penalty', 'bonus', 'consequence'];
const PERS = ['event', 'day', 'week', 'month', 'quarter', 'job', 'item', 'birr', 'other'];

let errors = 0, warns = 0;
const err = (id, m) => { errors++; console.log('  ERROR ' + id + ': ' + m); };
const warn = (id, m) => { warns++; console.log('  warn  ' + id + ': ' + m); };

function membersOf(who) {
  const out = [];
  who.forEach(w => {
    if (w in GROUPS) { if (GROUPS[w]) PEOPLE.filter(p => p.roleEn === GROUPS[w]).forEach(p => out.push(p.id)); }
    else out.push(w);
  });
  return out;
}
function fieldOf(report, field) {
  const r = REPORTS.find(x => x.id === report);
  if (!r) return { err: 'no report ' + report };
  const base = field.replace(/__[ab]$/, '');
  for (const s of r.sections || []) for (const f of s.fields || []) if (f.id === base) {
    if (/__[ab]$/.test(field) && f.t !== 'ratio') return { err: field + ' has __a/__b but ' + base + ' is ' + f.t };
    if (f.t === 'ratio' && !/__[ab]$/.test(field)) return { err: base + ' is a ratio: use ' + base + '__a or ' + base + '__b' };
    return { f, r };
  }
  return { err: 'no field ' + field + ' in ' + report };
}

function checkRef(id, ref, rule, at, want) {
  const subj = JSON.stringify(ref).includes('{p}') ? membersOf(rule.who) : [null];
  if (!subj.length) { err(id, '{p} used but the rule has no people with accounts'); return; }
  const p = subj[0];
  if (typeof ref !== 'string') { err(id, 'reference must be a string: ' + JSON.stringify(ref)); return; }
  const s = ref.replace('{p}', p || '');
  const i = s.indexOf('.');
  if (i < 0) { err(id, 'bad reference ' + ref); return; }
  const got = fieldOf(s.slice(0, i), s.slice(i + 1));
  if (got.err) { err(id, got.err); return; }
  if (want && want !== got.f.t && !(want === 'num' && ['num', 'money', 'pct'].includes(got.f.t)) &&
      !(want === 'num' && got.f.t === 'ratio')) {
    err(id, ref + ' is t:' + got.f.t + ', expected ' + want);
  }
  return got;
}

function checkValue(id, v, rule, at) {
  if (typeof v === 'number') return;
  if (typeof v === 'string') {
    const g = checkRef(id, v, rule, at);
    if (g && at === 'month' && g.r.cadence !== 'monthly') err(id, v + ' is a ' + g.r.cadence + ' report: in a month test wrap it in sum/avg/min/max/last/days/yes/no');
    if (g && (at === 'day') && g.r.cadence !== 'daily') err(id, v + ' is ' + g.r.cadence + ' — a day test reads daily reports; use at:"week" with on:"<weekly id>" or at:"month"');
    if (g && (at === 'week') && g.r.cadence !== 'weekly') err(id, v + ' is ' + g.r.cadence + ' — a week test reads the weekly report');
    return;
  }
  if (v && typeof v === 'object') {
    if (v.ratio) { v.ratio.forEach(x => { const g = checkRef(id, x, rule, at); if (g && at !== 'month' && at !== 'day' && at !== 'week') {} }); return; }
    if (v.reportLines || v.ruleLines) {
      if (at !== 'month') err(id, 'reportLines/ruleLines are for month tests');
      const list = v.reportLines || v.ruleLines;
      if (!Array.isArray(list) || !list.length) { err(id, 'reportLines/ruleLines take a list'); return; }
      if (v.reportLines) list.forEach(x => { if (x !== '*' && !REPORTS.find(y => y.id === x.replace('{p}', membersOf(rule.who)[0] || ''))) err(id, 'reportLines: no report ' + x); });
      if (v.ruleLines) (global.RULE_REFS = global.RULE_REFS || []).push([id, list]);
      return;
    }
    if (v.diff) {
      if (!Array.isArray(v.diff) || v.diff.length !== 2 || v.diff.some(x => typeof x !== 'string')) { err(id, 'diff takes two plain references'); return; }
      if (at === 'month') { v.diff.forEach(x => { const g = checkRef(id, x, rule, at); if (g && g.r.cadence !== 'monthly') err(id, 'diff in a month test reads the monthly report only'); }); return; }
      v.diff.forEach(x => checkValue(id, x, rule, at)); return;
    }
    if (v.rows && !v.grid) {
      const g = checkRef(id, v.rows, rule, at);
      if (g && g.f.t !== 'table') err(id, v.rows + ' is not a table');
      if (g && v.where) checkRowCond(id, v.where, g.f);
      return;
    }
    if (v.grid) {
      const g = checkRef(id, v.grid, rule, at);
      if (g) {
        if (g.f.t !== 'grid') err(id, v.grid + ' is not a grid');
        else {
          (v.rows || []).forEach(l => { if (!g.f.rows.some(r => r.en === l)) err(id, 'grid ' + v.grid + ' has no row "' + l + '"'); });
          if (!g.f.cols.some(c => c.id === v.col)) err(id, 'grid ' + v.grid + ' has no column ' + v.col);
        }
      }
      return;
    }
    const ops = ['sum', 'avg', 'min', 'max', 'last', 'days', 'yes', 'no'].filter(k => v[k]);
    if (ops.length === 1) {
      if (at !== 'month') err(id, ops[0] + ' is only for month tests');
      const g = checkRef(id, v[ops[0]], rule, at);
      if (g && g.r.cadence === 'monthly') warn(id, 'aggregate over a monthly report — use the plain reference');
      if (g && ['sum', 'avg', 'min', 'max', 'last'].includes(ops[0]) && !['num', 'money', 'pct', 'ratio'].includes(g.f.t)) err(id, v[ops[0]] + ' is t:' + g.f.t + ', cannot ' + ops[0]);
      if (g && ['yes', 'no'].includes(ops[0]) && g.f.t !== 'yesno') err(id, v[ops[0]] + ' is not yes/no');
      return;
    }
  }
  err(id, 'cannot read value ' + JSON.stringify(v));
}

const OPS = ['<', '<=', '>', '>=', '==', '!='];
function checkCond(id, c, rule, at) {
  if (Array.isArray(c)) {
    if (c.length !== 3 || !OPS.includes(c[1])) { err(id, 'bad condition ' + JSON.stringify(c)); return; }
    checkValue(id, c[0], rule, at);
    if (typeof c[2] === 'string' && !['==', '!='].includes(c[1])) err(id, 'text compared with ' + c[1]);
    if (typeof c[2] === 'string' && typeof c[0] === 'string') {
      const s = c[0].replace('{p}', membersOf(rule.who)[0] || ''); const i = s.indexOf('.');
      const g = fieldOf(s.slice(0, i), s.slice(i + 1));
      if (g.f && g.f.t === 'yesno' && !['yes', 'no'].includes(c[2])) err(id, 'yes/no field compared with "' + c[2] + '"');
      if (g.f && g.f.t === 'choice' && !g.f.opts.some(o => o.v === c[2])) err(id, 'choice ' + c[0] + ' has no option "' + c[2] + '" (options: ' + g.f.opts.map(o => o.v).join(', ') + ')');
    }
    return;
  }
  if (c && c.all) return c.all.forEach(x => checkCond(id, x, rule, at));
  if (c && c.any) return c.any.forEach(x => checkCond(id, x, rule, at));
  if (c && c.not) return checkCond(id, c.not, rule, at);
  if (c && (c.every || c.some)) {
    const s = c.every || c.some;
    if (at !== 'month') err(id, 'every/some are for month tests');
    if (!Array.isArray(s) || s.length !== 3 || !OPS.includes(s[1])) { err(id, 'bad every/some'); return; }
    const g = checkRef(id, s[0], rule, at);
    if (g && g.r.cadence === 'monthly') err(id, 'every/some over a monthly report');
    return;
  }
  err(id, 'cannot judge ' + JSON.stringify(c));
}
function checkRowCond(id, c, fdef) {
  if (Array.isArray(c)) {
    if (c.length !== 3 || !OPS.includes(c[1])) { err(id, 'bad row condition ' + JSON.stringify(c)); return; }
    const col = (fdef.cols || []).find(x => x.id === c[0]);
    if (!col) { err(id, 'table ' + fdef.id + ' has no column ' + c[0] + ' (columns: ' + (fdef.cols || []).map(x => x.id).join(', ') + ')'); return; }
    if (col.t === 'yesno' && !['yes', 'no'].includes(c[2])) err(id, 'yes/no column ' + c[0] + ' compared with "' + c[2] + '"');
    if (col.t === 'choice' && !col.opts.some(o => o.v === c[2])) err(id, 'choice column ' + c[0] + ' has no option "' + c[2] + '"');
    return;
  }
  if (c && c.all) return c.all.forEach(x => checkRowCond(id, x, fdef));
  if (c && c.any) return c.any.forEach(x => checkRowCond(id, x, fdef));
  if (c && c.not) return checkRowCond(id, c.not, fdef);
  err(id, 'cannot judge row ' + JSON.stringify(c));
}

const seen = {};
let total = 0;
(process.argv.length > 2 ? process.argv.slice(2) : ['js/rules.js']).forEach(file => {
  const src = fs.readFileSync(path.resolve(HERE, file), 'utf8');
  let list;
  try {
    list = /const RULES\s*=/.test(src) ? vm.runInNewContext(src + '\n;RULES', {})
                                       : vm.runInNewContext('(' + src + ')');
  } catch (e) { console.log(file + ': does not parse — ' + e.message); errors++; return; }
  console.log('\n' + file + ': ' + list.length + ' rules');
  total += list.length;
  list.forEach(r => {
    const id = r.id || '(no id)';
    if (!/^[a-z0-9-]{3,80}$/.test(id)) err(id, 'id must be lowercase letters, digits and dashes');
    if (seen[id]) err(id, 'duplicate id (also in ' + seen[id] + ')'); seen[id] = file;
    ['who', 'kind', 'per', 'how', 'en', 'am', 'src'].forEach(k => { if (r[k] == null || r[k] === '') err(id, 'missing ' + k); });
    if (!Array.isArray(r.who) || !r.who.length) err(id, 'who must be a non-empty array');
    else r.who.forEach(w => { if (!(w in GROUPS) && !PIDS.includes(w)) err(id, 'unknown person or group ' + w); });
    if (!KINDS.includes(r.kind)) err(id, 'kind must be penalty, bonus or consequence');
    if (!PERS.includes(r.per)) err(id, 'per must be one of ' + PERS.join(', '));
    if (!['auto', 'recorded'].includes(r.how)) err(id, 'how must be auto or recorded');
    if (r.kind === 'consequence' && r.birr) err(id, 'a consequence carries no birr');
    if (r.kind !== 'consequence' && r.birr == null && !r.formula && !r.test) err(id, 'no birr, no formula');
    if (r.birr != null && (typeof r.birr !== 'number' || r.birr <= 0)) err(id, 'birr must be a positive number or null');
    if (r.per === 'birr' && (r.birr !== 1 || r.how !== 'recorded')) err(id, "per:'birr' means the Chairman records the amount: birr:1, how:'recorded'");
    if (r.range && (!Array.isArray(r.range) || r.range.length !== 2 || r.per !== 'birr')) err(id, "range goes with per:'birr' as [min, max]");
    if (r.en && r.en.length > 70) warn(id, 'en label longer than 70 chars');
    if (r.en && /[\u1200-\u137f]/.test(r.en)) err(id, 'en contains Ethiopic');
    if (r.am && !/[\u1200-\u137f]/.test(r.am)) err(id, 'am has no Ethiopic');
    if (r.src && !/— “.+”$/.test(r.src)) err(id, 'src must read: <Name>’s letter — “<verbatim quote>”');
    if (r.how === 'auto' && !r.test) err(id, 'auto with no test');
    if (r.how === 'recorded' && r.test) err(id, 'recorded with a test — make it auto, or drop the test');
    if (r.test === 'custom') {
      if (!APPS.includes("EVAL_['" + id + "']")) err(id, "test:'custom' but apps-script/Rules.js has no EVAL_['" + id + "']");
      return;
    }
    if (r.test) {
      const t = r.test, at = t.at;
      if (!['day', 'week', 'month'].includes(at)) { err(id, 'test.at must be day, week or month'); return; }
      if (at === 'week') {
        if (!t.on) err(id, 'week test needs on:"<weekly report id>"');
        else { const on = t.on.replace('{p}', membersOf(r.who)[0] || ''); const rr = REPORTS.find(x => x.id === on); if (!rr || rr.cadence !== 'weekly') err(id, 'on: ' + t.on + ' is not a weekly report'); }
      }
      const keys = Object.keys(t).filter(k => !['at', 'on', 'when', 'team', 'needFiled'].includes(k));
      const shapes = keys.filter(k => ['count', 'rows', 'tiers', 'rate', 'pct'].includes(k));
      keys.filter(k => !['count', 'rows', 'tiers', 'rate', 'pct'].includes(k)).forEach(k => err(id, 'unknown test key ' + k));
      if (shapes.length > 1 && !(shapes.length === 2 && shapes.includes('count') && false)) err(id, 'use one of count, rows, tiers, rate, pct');
      if (!t.when && !shapes.length) err(id, 'a test needs when, count, rows, tiers, rate or pct');
      if (t.when) checkCond(id, t.when, r, at);
      if (t.count) checkValue(id, t.count, r, at);
      if (t.rows) {
        const g = checkRef(id, t.rows.of, r, at);
        if (g && g.f.t !== 'table') err(id, t.rows.of + ' is not a table');
        if (g && at === 'day' && g.r.cadence !== 'daily') err(id, 'a day test reads daily reports');
        if (g && at === 'week' && g.r.cadence !== 'weekly') err(id, 'a week test reads the weekly report');
        if (g && t.rows.where) checkRowCond(id, t.rows.where, g.f);
        if (g && t.rows.who) {
          if (!(g.f.cols || []).some(c => c.id === t.rows.who.col)) err(id, 'no column ' + t.rows.who.col + ' to name the person');
          if (t.rows.who.group && !(t.rows.who.group in GROUPS)) err(id, 'unknown group ' + t.rows.who.group);
          if (!r.who.includes(t.rows.who.group)) err(id, 'rows.who.group must be one of the rule\'s who');
        }
        if (!t.rows.who && membersOf(r.who).length !== 1 && !JSON.stringify(t).includes('{p}')) err(id, 'rows with no who: the rule must be for exactly one person');
      }
      ['tiers', 'rate', 'pct'].forEach(k => {
        if (!t[k]) return;
        checkValue(id, t[k].of, r, at);
        if (k === 'rate' && typeof t[k].birr !== 'number') err(id, 'rate needs birr');
        if (k !== 'rate' && (!Array.isArray(t[k].steps) || !t[k].steps.length)) err(id, k + ' needs steps');
        if (k !== 'rate') t[k].steps.forEach((s, i) => { if (!Array.isArray(s) || s.length !== 2 || (i && s[0] <= t[k].steps[i - 1][0])) err(id, k + ' steps must be [[from, amount], ...] rising'); });
        if (r.birr != null) err(id, k + ' sets the amount: birr must be null');
      });
      if (t.needFiled) {
        if (at !== 'month') err(id, 'needFiled is for month tests');
        t.needFiled.forEach(x => { const rr = REPORTS.find(y => y.id === x.replace('{p}', membersOf(r.who)[0] || '')); if (!rr) err(id, 'needFiled: no report ' + x); });
      }
      if (t.team && !r.who.some(w => GROUPS[w])) err(id, 'team needs a group in who');
      const subjects = JSON.stringify(t).includes('{p}') ? membersOf(r.who) : null;
      if (!subjects && !t.rows && !t.team && membersOf(r.who).length !== 1) err(id, 'this test charges one person, but who resolves to ' + membersOf(r.who).length + ' (use {p} in report ids, rows.who, or team:true)');
    }
  });
});
/* a rule counted by another rule's test must exist */
(global.RULE_REFS || []).forEach(([id, list]) => list.forEach(x => { if (!seen[x]) err(id, 'ruleLines names no rule ' + x); }));
console.log('\n' + total + ' rules, ' + errors + ' errors, ' + warns + ' warnings');
process.exit(errors ? 1 : 0);
