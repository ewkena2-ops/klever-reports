/* Klever — the universe.

   One continuous 3D world, three scales of it.

   THE GROUP. Amare Holdings as a small cluster of galaxies, one for each
   company: Group Finance, the holding, a great lens-shaped galaxy at the
   centre; Klever Küche a grand four-armed spiral; Rovestone a barred
   spiral; Meri Block Board an elliptical; Real Estate & Construction a
   spiral seen nearly edge-on. Only Klever is lit from inside — the only
   company whose people file reports. The others say, honestly, that they
   are not connected yet.

   KLEVER'S GALAXY. The camera falls through it towards one star on its
   first arm.

   KLEVER. That star is the Chairman: a sun you can look into. Each
   department is a real planet on its own orbit, lit from him, with a day
   side and a night side — an ice world for operations, a ringed gas giant
   for finance, an ocean world with moving cloud for the commercial team,
   the largest giant for production, a red rock for the site. Every person
   is a moon of their department's planet. Each of today's reports is a
   beam from the moon that owes it to the people it is addressed to — teal
   on time, gold late, coral missing, faint if it is not due yet — and the
   day's money moves in gold between the customers, the bank, suppliers
   and ZamZam, as Betelhem's and Ephrata's reports record it. The sixteen
   agents are small ice worlds on the outermost orbit, lit by what they
   last found.

   And a timeline: drag it, or press play, and watch the day happen.

   Everything here is drawn from what the page is handed — who exists, what
   was due, what was filed and when, what the agents said. Nothing is made
   up to fill the picture: a report nobody filed is a dark beam, and money
   nobody reported does not flow.                                           */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TAU, ease, webglOk, makeRenderer, makeComposer, paintSky, makeStars, glowSprite, glowTexture,
         makeWorld, makeSun, ringTexture } from './space3d.js?v=31b053b3';

/* ---------------------------------------------------------------- *
 *  The shape of the company                                          *
 * ---------------------------------------------------------------- */

/* Department colours are kept clear of the four status colours. Each
   department is a planet: where it orbits, how big it is, what it is made of. */
const DEPTS = [
  { key: 'commercial', en: 'Commercial', am: 'ንግድ', color: '#56c8ff',
    orbit: 40, angle: -2.5, size: 3.1, type: 1, clouds: true, tilt: 0.41, spin: 0.06,
    pal: ['#1f6f93', '#6e8f4d', '#b49a69', '#e9e2d0'] },
  { key: 'finance', en: 'Finance and store', am: 'ፋይናንስና መጋዘን', color: '#c8a2ff',
    orbit: 28, angle: 2.75, size: 3.5, type: 2, rings: true, tilt: 0.45, spin: 0.09,
    pal: ['#c9a8d8', '#f3e8f6', '#86689a', '#b8709e'] },
  { key: 'site', en: 'Site', am: 'ተከላ', color: '#ff8fc8',
    orbit: 66, angle: 0.35, size: 2.4, type: 3, tilt: 0.3, spin: 0.05,
    pal: ['#7a3525', '#b5603c', '#e0a077', '#3a1f18'] },
  { key: 'production', en: 'Production', am: 'ምርት', color: '#9be7a0',
    orbit: 53, angle: -1.55, size: 4.8, type: 2, tilt: 0.18, spin: 0.08,
    pal: ['#bcc8a0', '#eef0da', '#7a8a5c', '#a86a3a'] },
  { key: 'lead', en: 'Operations', am: 'ኦፕሬሽን', color: '#8aa2ff',
    orbit: 22, angle: -0.75, size: 2.0, type: 0, tilt: 0.25, spin: 0.04,
    pal: ['#e6ecff', '#a9b8f0', '#4a58a0', '#ffffff'] }
];
const STATUS = {
  on: { color: '#5fe0c6', en: 'On time', am: 'በሰዓቱ' },
  late: { color: '#f0b84a', en: 'Late', am: 'ዘግይቷል' },
  missing: { color: '#ff7a5c', en: 'Missing', am: 'አልደረሰም' },
  pending: { color: '#5e706a', en: 'Not due yet', am: 'ገና ጊዜው አልደረሰም' }
};
const GOLD = new THREE.Color('#ffc75e');

/* the moons: bare rock mostly, some ice */
const MOONS = [
  { type: 3, pal: ['#6f6a66', '#9c958c', '#c9c1b4', '#3b3633'] },
  { type: 3, pal: ['#7a6450', '#a88a6a', '#d2b894', '#40322a'] },
  { type: 0, pal: ['#dfe8f0', '#a8bccc', '#4f6b80', '#ffffff'] },
  { type: 3, pal: ['#5e5a62', '#8e8896', '#bdb6c4', '#35313a'] },
  { type: 3, pal: ['#6e3a2a', '#a0583b', '#d99a70', '#3a2018'] }
];
const ICES = [
  ['#dcecff', '#8fb9e6', '#2f5f8f', '#ffffff'], ['#eef4ff', '#a7c3dc', '#3a6687', '#ffffff'],
  ['#dcf0f4', '#8bbccb', '#2c6878', '#ffffff'], ['#efeaff', '#b2a8e0', '#4b3f7c', '#ffffff']
];
const HEAT = { loud: '#ff7a5c', warm: '#f0b84a', quiet: '#8fd8c8', none: '#56706a' };

/* where the money goes, and whose report says so */
const INST = [
  { id: 'customers', en: 'Customers', am: 'ደንበኞች', angle: 1.35, orbit: 82, cluster: true, size: 3.2 },
  { id: 'bank', en: 'Klever’s bank', am: 'የክሌቨር ባንክ', angle: 2.6, orbit: 82, size: 2.8,
    w: { type: 2, rings: true, rim: '#ffd9a0', tilt: 0.5, pal: ['#e5c67e', '#fff0cf', '#9c7a3c', '#d88b4a'] } },
  { id: 'zamzam', en: 'ZamZam Bank', am: 'ዘምዘም ባንክ', angle: 2.2, orbit: 92, size: 1.8,
    w: { type: 2, rim: '#bfe8d0', tilt: 0.3, pal: ['#8fc4a4', '#e4f2e8', '#3f7a60', '#b8d8a8'] } },
  { id: 'suppliers', en: 'Suppliers', am: 'አቅራቢዎች', angle: 3.0, orbit: 92, size: 2.1,
    w: { type: 3, rim: '#e0c8a0', tilt: 0.2, pal: ['#6d5a48', '#9a8266', '#c8b08c', '#3a2e24'] } }
];
/* `sum` says which total the flow counts toward. Ephrata's collections are
   the same money Betelhem receives, seen from the sales side, so only
   Betelhem's figure counts as money in; the move to ZamZam is Klever's
   money changing banks, so it counts as neither. */
const FLOWS = [
  { from: 'customers', to: 'ephrata', report: 'ephrata-daily', field: 'collected_today', sum: null,
    en: 'Collected from customers — Ephrata’s report', am: 'ከደንበኞች የተሰበሰበ — የኤፍራታ ሪፖርት' },
  { from: 'customers', to: 'bank', report: 'betty-daily', field: 'cash_in', sum: 'in',
    en: 'Cash received — Betelhem’s report', am: 'የገባ ጥሬ ገንዘብ — የቤተልሔም ሪፖርት' },
  { from: 'bank', to: 'suppliers', report: 'betty-daily', field: 'pay_value', sum: 'out',
    en: 'Payments approved — Betelhem’s report', am: 'የጸደቁ ክፍያዎች — የቤተልሔም ሪፖርት' },
  { from: 'bank', to: 'zamzam', report: 'betty-daily', field: 'zz_transfer', sum: null,
    en: 'Moved to ZamZam — Betelhem’s report', am: 'ወደ ዘምዘም የተላለፈ — የቤተልሔም ሪፖርት' }
];

/* which department each agent watches */
const WATCH = {
  attendance: 'production', production: 'production', quality: 'production', store: 'finance',
  purchasing: 'finance', finance: 'finance', margin: 'finance', commercial: 'commercial',
  design: 'commercial', customer: 'commercial', site: 'site', compliance: 'chairman',
  penalties: 'chairman', contradictions: 'chairman', decide: 'chairman', brief: 'chairman'
};

/* The camera looks at Klever from the side away from its galaxy's core, so
   the core is the sky behind the system rather than something the camera
   flies through. Every angle above is written as if the camera stood at
   azimuth 0.4; TURN swings the whole system round to where it really
   stands, so the arrangement on screen stays the same. */
const AZ = -1.82, TURN = (0.4 - AZ);

/* ---------------------------------------------------------------- *
 *  The group: five galaxies                                          *
 * ---------------------------------------------------------------- */

/* Klever's galaxy, whose first arm carries Klever's own star */
const ARMS = 4, R0 = 260, WIND = 1.75;
function spiral(arm, r) {
  const th = arm / ARMS * TAU + Math.log(Math.max(r, R0) / R0) * WIND;
  return new THREE.Vector3(Math.cos(th) * r, 0, Math.sin(th) * r);
}
/* Klever's star sits at the world's origin, so the galaxy's centre is
   wherever puts that star on its arm */
const KC = spiral(0, 1800).multiplyScalar(-1);

/* each galaxy's place in the group, measured from Group Finance at the hub */
const COMPANIES = [
  { id: 'klever', en: 'Klever Küche', am: 'ክሌቨር ኩሽ', live: true,
    kind: 'spiral', n: 64000, radius: 3960, arms: 4, wind: WIND, rot: [0, 0, 0], boost: 1,
    inner: '#ffd9a3', outer: '#bcd4ff', dust: 1500, core: 2600, off: [-12000, 900, 6800] },
  { id: 'rovestone', en: 'Rovestone', am: 'ሮቭስቶን',
    kind: 'barred', n: 18000, radius: 3400, arms: 2, wind: 2.2, rot: [0.55, 0.4, 0.25], boost: 1.5,
    inner: '#ffe0b0', outer: '#a8c8ff', dust: 520, core: 2100, off: [11200, -1600, 6000] },
  { id: 'meri', en: 'Meri Block Board', am: 'መሪ ብሎክ ቦርድ',
    kind: 'elliptical', n: 16000, radius: 3000, rot: [0.3, 0, 0.5], boost: 1.5,
    inner: '#ffd49a', outer: '#e0a878', dust: 0, core: 2600, off: [7900, 2000, -10100] },
  { id: 'realestate', en: 'Real Estate & Construction', am: 'ሪል እስቴትና ግንባታ',
    kind: 'spiral', n: 18000, radius: 3600, arms: 3, wind: 1.35, rot: [1.2, 0.6, 0.1], boost: 1.5,
    inner: '#fff0d8', outer: '#9fbcff', dust: 520, core: 1800, off: [-10100, -1400, -8200] },
  { id: 'groupfinance', en: 'Group Finance', am: 'የቡድኑ ፋይናንስ',
    kind: 'lenticular', n: 26000, radius: 5200, rot: [0.35, 0.2, -0.15], boost: 1.5,
    inner: '#ffe2b0', outer: '#efe4d4', dust: 0, core: 4600, off: [0, 0, 0] }
];
const HUB = KC.clone().sub(new THREE.Vector3(...COMPANIES[0].off));
COMPANIES.forEach(c => { c.center = HUB.clone().add(new THREE.Vector3(...c.off)); });

function gauss() {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
}

/* the stars of one galaxy, and the dust along its arms */
function galaxyPoints(g, small) {
  const n = Math.round(g.n * (small ? 0.5 : 1));
  const R = g.radius, r0 = R * 0.065;
  const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(g.rot[0], g.rot[1], g.rot[2]));
  const inner = new THREE.Color(g.inner), outer = new THREE.Color(g.outer), pink = new THREE.Color('#ff8fae');
  const P = [], C = [], S = [], v = new THREE.Vector3();
  const armTh = (arm, r, jitter) => arm / g.arms * TAU + Math.log(Math.max(r, r0) / r0) * g.wind + jitter;
  for (let i = 0; i < n; i++) {
    const c = new THREE.Color();
    let size, u = Math.random();
    if (g.kind === 'elliptical') {
      const r = R * 0.55 * Math.pow(Math.random(), 2.1);
      v.randomDirection().multiply(new THREE.Vector3(1, 0.62, 0.8)).multiplyScalar(r);
      c.copy(inner).lerp(outer, Math.min(1, r / (R * 0.4))).multiplyScalar(0.45 + Math.random() * 0.5);
      size = 8 + Math.random() * 14;
    } else if (g.kind === 'lenticular') {
      if (u < 0.45) {
        const r = Math.abs(gauss()) * R * 0.13;
        v.randomDirection().multiplyScalar(r).multiply(new THREE.Vector3(1, 0.7, 1));
        c.copy(inner).multiplyScalar(0.55 + Math.random() * 0.45);
      } else {
        const ring = u > 0.9;
        const r = ring ? R * (0.52 + gauss() * 0.03) : R * 0.28 * -Math.log(Math.random() + 1e-4);
        const th = Math.random() * TAU;
        v.set(Math.cos(th) * r, gauss() * R * 0.008, Math.sin(th) * r);
        c.copy(inner).lerp(outer, Math.min(1, r / R)).multiplyScalar(ring ? 0.55 : 0.3 + Math.random() * 0.45);
      }
      size = 8 + Math.random() * 14;
    } else if (u < (g.kind === 'barred' ? 0.12 : 0.18)) {
      const r = Math.abs(gauss()) * R * 0.096, th = Math.random() * TAU;
      v.set(Math.cos(th) * r, gauss() * R * 0.038 * Math.max(0.2, 1 - r / (R * 0.35)), Math.sin(th) * r);
      c.copy(inner).multiplyScalar(0.28 + Math.random() * 0.3);
      size = 9 + Math.random() * 12;
    } else if (g.kind === 'barred' && u < 0.26) {
      v.set(gauss() * R * 0.07, gauss() * R * 0.01, gauss() * R * 0.022);
      v.x = Math.max(-R * 0.17, Math.min(R * 0.17, v.x * 1.6));
      c.copy(inner).multiplyScalar(0.5 + Math.random() * 0.45);
      size = 9 + Math.random() * 14;
    } else {
      const arm = i % g.arms, t = Math.pow(Math.random(), 0.72);
      const rs = g.kind === 'barred' ? R * 0.17 : r0, r = rs + t * (R - rs);
      const th = g.kind === 'barred'
        ? arm * Math.PI + Math.log(r / rs) * g.wind + gauss() * 0.14 * (1 - t * 0.5)
        : armTh(arm, r, gauss() * 0.16 * (1 - t * 0.5));
      const spread = gauss() * (R * 0.01 + r * 0.07);
      v.set(Math.cos(th) * r + Math.cos(th + Math.PI / 2) * spread, gauss() * (R * 0.0055 + R * 0.014 * (1 - t)),
            Math.sin(th) * r + Math.sin(th + Math.PI / 2) * spread);
      c.copy(inner).lerp(outer, Math.min(1, t * 1.4)).multiplyScalar(0.35 + Math.random() * 0.55);
      if (Math.random() < 0.05) c.copy(pink).multiplyScalar(0.8);
      size = 6 + Math.random() * 12;
    }
    v.applyMatrix4(m).add(g.center);
    if (g.live && v.lengthSq() < 420 * 420) continue;        /* a clear bubble round Klever's star */
    P.push(v.x, v.y, v.z); C.push(c.r, c.g, c.b); S.push(size * g.boost);
  }
  const D = [], DC = [], DS = [];
  const tints = [new THREE.Color('#7d8cff'), new THREE.Color('#9fb6ff'), new THREE.Color('#ffb48a'), new THREE.Color('#ff6f9f')];
  const dn = Math.round((g.dust || 0) * (small ? 0.6 : 1));
  for (let i = 0; i < dn; i++) {
    const arm = i % g.arms, t = Math.pow(Math.random(), 0.8);
    const rs = g.kind === 'barred' ? R * 0.17 : r0 + R * 0.05, r = rs + t * (R * 0.9 - rs);
    const th = g.kind === 'barred' ? arm * Math.PI + Math.log(r / rs) * g.wind + gauss() * 0.08 : armTh(arm, r, gauss() * 0.09);
    const spread = gauss() * (R * 0.0075 + r * 0.045);
    v.set(Math.cos(th) * r + Math.cos(th + Math.PI / 2) * spread, gauss() * R * 0.0045,
          Math.sin(th) * r + Math.sin(th + Math.PI / 2) * spread).applyMatrix4(m).add(g.center);
    const c = tints[Math.random() < 0.08 ? 3 : Math.random() < 0.25 ? 2 : Math.random() < 0.5 ? 1 : 0].clone()
      .multiplyScalar(0.05 + Math.random() * 0.05);
    D.push(v.x, v.y, v.z); DC.push(c.r, c.g, c.b); DS.push((260 + Math.random() * 420) * (R / 3960));
  }
  return { P, C, S, D, DC, DS };
}

/* ---------------------------------------------------------------- *
 *  Shaders                                                          *
 * ---------------------------------------------------------------- */

/* A star smaller than a pixel is drawn at a pixel and dimmed to match, so a
   galaxy far off keeps its light instead of vanishing. */
const GALAXY_VERT = /* glsl */`
attribute float aSize;
attribute vec3 aColor;
uniform float uScale;
uniform float uFade;
uniform float uMax;
uniform vec2 uNear;
varying vec3 vC;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float z = -mv.z;
  float sz = aSize * uScale / max(z, 1.0);
  float szc = clamp(sz, 1.3, uMax);
  vC = aColor * uFade * smoothstep(uNear.x, uNear.y, z) * min(1.0, sz / szc);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = szc;
}
`;
const GALAXY_FRAG = /* glsl */`
varying vec3 vC;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vC * a * a, a);
}
`;
/* the dust: big, faint, soft — what makes a spray of points read as a galaxy */
const DUST_FRAG = /* glsl */`
varying vec3 vC;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = exp(-d * d * 4.0) * (1.0 - smoothstep(0.8, 1.0, d));
  gl_FragColor = vec4(vC * a, a);
}
`;

const BEAM_VERT = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const BEAM_FRAG = /* glsl */`
uniform vec3 uColor;
uniform int uState;
uniform float uTime;
uniform float uArrive;
uniform float uFade;
uniform float uDim;
varying vec2 vUv;
void main(){
  float s = vUv.x;
  vec3 c; float a;
  if (uState == 0) {                 /* not due yet: a faint thread */
    c = uColor * 0.35; a = 0.22;
  } else if (uState == 3) {          /* missing: a broken line */
    float dash = step(0.45, fract(s * 16.0 - uTime * 0.3));
    c = uColor * 0.9 * dash; a = 0.7 * dash;
  } else {                           /* filed: light running to whoever it was for */
    float p = fract(s * 2.5 - uTime * 0.45);
    float pulse = smoothstep(0.0, 0.05, p) * smoothstep(0.24, 0.05, p);
    c = uColor * (0.55 + 2.6 * pulse); a = 0.9;
    float head = smoothstep(uArrive - 0.12, uArrive, s) * step(s, uArrive);
    c += vec3(1.0) * head * 2.5 * step(uArrive, 0.999);
    a *= step(s, uArrive + 0.001);
    c *= step(s, uArrive + 0.001);
  }
  gl_FragColor = vec4(c * uFade * uDim, a * uFade * uDim);
}
`;

/* ---------------------------------------------------------------- */

function money(n) { return Math.round(n).toLocaleString('en-US'); }
function num(v) { const x = Number(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isNaN(x) ? 0 : x; }
function hhmm(d) { return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
function bullets(s) { return String(s || '').replace(/^[ \t]*[*-][ \t]+/gm, '• '); }
function hash(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
}

export function mount(root, opts) {
  if (!webglOk()) throw new Error('no webgl');
  const lang = opts.lang === 'am' ? 'am' : 'en';
  const S = opts.text || {};
  const s = (k, d) => (S[k] != null ? S[k] : d);
  const L = o => (o ? (lang === 'am' && o.am ? o.am : o.en) : '');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  /* on a phone the worlds are drawn larger against their orbits, or a moon
     would be a speck */
  const BS = small ? 2.1 : 1.6;

  /* ---------- the page around the world ---------- */
  root.innerHTML = '';
  const wrap = el('div', 'obs uni');
  root.appendChild(wrap);

  const renderer = makeRenderer();
  let pr = renderer.getPixelRatio();
  const canvas = renderer.domElement;
  canvas.className = 'obs-sky obs-3d';
  canvas.setAttribute('aria-hidden', 'true');
  wrap.appendChild(canvas);
  const labels = el('div', 'obs3d-labels');
  wrap.appendChild(labels);

  const hud = el('header', 'obs-hud uni-hud');
  const hl = el('div', 'obs-hl');
  const crumbs = el('nav', 'uni-crumbs');
  const cGroup = el('button', null, s('group', 'Amare Holdings'));
  cGroup.type = 'button';
  const cSep = el('span', 'uni-sep', '›');
  const cCo = el('button', null, s('klever', 'Klever Küche'));
  cCo.type = 'button';
  crumbs.appendChild(cGroup); crumbs.appendChild(cSep); crumbs.appendChild(cCo);
  hl.appendChild(crumbs);
  const title = el('h1', 'obs-title', s('title', 'Klever, today'));
  hl.appendChild(title);
  const stats = el('p', 'uni-stats');
  hl.appendChild(stats);
  hud.appendChild(hl);
  wrap.appendChild(hud);

  const legend = el('div', 'obs-legend uni-legend');
  ['on', 'late', 'missing', 'pending'].forEach(k => {
    const sp = el('span', 'obs-leg');
    const i = el('i'); i.style.background = STATUS[k].color; i.style.boxShadow = '0 0 10px ' + STATUS[k].color;
    sp.appendChild(i); sp.appendChild(document.createTextNode(L(STATUS[k])));
    legend.appendChild(sp);
  });
  const lm = el('span', 'obs-leg');
  const im = el('i'); im.style.background = '#ffc75e'; im.style.boxShadow = '0 0 10px #ffc75e';
  lm.appendChild(im); lm.appendChild(document.createTextNode(s('money', 'Money')));
  legend.appendChild(lm);
  wrap.appendChild(legend);

  /* the timeline */
  const tbar = el('div', 'uni-time');
  const play = el('button', 'uni-play', '▶');
  play.type = 'button';
  play.setAttribute('aria-label', s('replay', 'Replay the day'));
  const tLabel = el('span', 'uni-clock', '');
  const track = el('div', 'uni-track');
  const fill = el('i', 'uni-fill');
  const head = el('b', 'uni-head');
  track.appendChild(fill); track.appendChild(head);
  const live = el('button', 'uni-live', s('live', 'Live'));
  live.type = 'button';
  tbar.appendChild(play); tbar.appendChild(tLabel); tbar.appendChild(track); tbar.appendChild(live);
  wrap.appendChild(tbar);

  const sheet = el('section', 'obs-sheet');
  sheet.hidden = true;
  sheet.setAttribute('role', 'dialog');
  wrap.appendChild(sheet);

  /* ---------- the world ---------- */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 300000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.rotateSpeed = 0.5;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.autoRotate = !reduce;
  controls.autoRotateSpeed = 0.18;
  const { composer, bloom } = makeComposer(renderer, scene, camera, 0.8, 0.55, 0.82);
  const skyRT = paintSky(renderer, scene, 0.75);
  const starMat = makeStars(scene, 4200, 30000, pr);

  /* ---------- the five galaxies ---------- */
  const galU = { uScale: { value: 400 }, uFade: { value: 1 }, uMax: { value: 3.6 }, uNear: { value: new THREE.Vector2(60, 520) } };
  const dustU = { uScale: galU.uScale, uFade: galU.uFade, uMax: { value: 140 }, uNear: { value: new THREE.Vector2(500, 1800) } };
  const starMatG = new THREE.ShaderMaterial({ vertexShader: GALAXY_VERT, fragmentShader: GALAXY_FRAG, uniforms: galU,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const dustMatG = new THREE.ShaderMaterial({ vertexShader: GALAXY_VERT, fragmentShader: DUST_FRAG, uniforms: dustU,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const pointsOf = (P, C, Sz, mat) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('aColor', new THREE.Float32BufferAttribute(C, 3));
    g.setAttribute('aSize', new THREE.Float32BufferAttribute(Sz, 1));
    const pts = new THREE.Points(g, mat);
    pts.frustumCulled = false;
    scene.add(pts);
    return pts;
  };
  const coMarks = COMPANIES.map(co => {
    const d = galaxyPoints(Object.assign({ live: co.live }, co), small);
    pointsOf(d.P, d.C, d.S, starMatG);
    if (d.D.length) pointsOf(d.D, d.DC, d.DS, dustMatG);
    const core = glowSprite('rgba(255,228,180,0.9)', 'rgba(255,190,120,0.18)', co.core);
    core.position.copy(co.center);
    scene.add(core);
    const lab = el('button', 'obs3d-label uni-co' + (co.live ? ' live' : ''));
    lab.type = 'button';
    lab.appendChild(el('b', null, L(co)));
    lab.appendChild(el('span', null, co.live ? s('coLive', 'live') : s('coOff', 'not connected yet')));
    lab.onclick = () => pick({ kind: 'company', id: co.id });
    labels.appendChild(lab);
    return { co, pos: co.center, core, lab };
  });
  /* you are here: Klever's own star, seen from the group */
  const here = glowSprite('rgba(210,255,245,1)', 'rgba(95,224,198,0.35)', 700);
  scene.add(here);

  /* ---------- Klever: a solar system ---------- */
  const klever = new THREE.Group();
  scene.add(klever);
  const sunPos = new THREE.Vector3();
  const worlds = [];
  const lineMats = [];
  function circle(R, color, op, center, euler) {
    const pts = [];
    for (let i = 0; i <= 180; i++) {
      const a = i / 180 * TAU;
      const v = new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R);
      if (euler) v.applyEuler(euler);
      if (center) v.add(center);
      pts.push(v);
    }
    const m = new THREE.LineBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0, depthWrite: false });
    m.userData.base = op;
    lineMats.push(m);
    klever.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), m));
  }

  /* the Chairman */
  const SUN_R = small ? 9.5 : 8;
  const sun = makeSun(SUN_R);
  sun.mesh.userData.pick = { kind: 'person', id: 'chairman' };
  klever.add(sun.mesh); klever.add(sun.corona); klever.add(sun.haze);

  const people = opts.people;
  const due = opts.due || [];
  const reporters = {};
  due.forEach(r => { reporters[r.person] = true; });
  const byDept = {};
  DEPTS.forEach(d => { byDept[d.key] = people.filter(p => p.grp === d.key); });
  const firstCount = {};
  people.forEach(p => { const f = L(p).split(' ')[0]; firstCount[f] = (firstCount[f] || 0) + 1; });
  const short = p => {
    const w = L(p).split(' ');
    return firstCount[w[0]] > 1 && w[1] ? w[0] + ' ' + w[1].charAt(0) + '.' : w[0];
  };
  const isLead = p => /Lead|Officer|Supervisor/.test(p.roleEn || '');
  const deptOf = k => DEPTS.find(d => d.key === k);

  /* the departments, as planets */
  const planets = {};
  DEPTS.forEach((d, di) => {
    const pos = new THREE.Vector3(Math.cos(d.angle + TURN) * d.orbit, 0, Math.sin(d.angle + TURN) * d.orbit);
    const r = d.size * BS;
    const w = makeWorld({ r, type: d.type, pal: d.pal, seed: 3 + di * 5.7, rim: d.color, rimI: 0.7,
                          clouds: d.clouds, rings: d.rings, tilt: d.tilt, spin: d.spin, segs: 72, sun: sunPos });
    w.group.position.copy(pos);
    w.surf.userData.pick = { kind: 'dept', id: d.key };
    klever.add(w.group);
    worlds.push(w);
    circle(d.orbit, d.color, 0.17);
    const lab = el('button', 'obs3d-label uni-planet');
    lab.type = 'button';
    const dot = el('i');
    lab.appendChild(dot);
    lab.appendChild(document.createTextNode(L(d)));
    lab.style.color = d.color;
    lab.onclick = () => pick({ kind: 'dept', id: d.key });
    labels.appendChild(lab);
    planets[d.key] = { d, pos, r, w, lab, dot, state: null };
  });

  /* the people, as moons of their department */
  const nodes = {};
  const chairLab = el('button', 'obs3d-label uni-person uni-sun', s('chairman', 'Chairman'));
  chairLab.type = 'button';
  chairLab.onclick = () => pick({ kind: 'person', id: 'chairman' });
  labels.appendChild(chairLab);
  nodes.chairman = { id: 'chairman', pos: sunPos.clone(), r: SUN_R, pick: sun.mesh, lab: chairLab, marker: null };

  DEPTS.forEach(d => {
    const P = planets[d.key];
    const list = byDept[d.key].slice()
      .sort((a, b) => (isLead(b) - isLead(a)) || ((reporters[b.id] ? 1 : 0) - (reporters[a.id] ? 1 : 0)));
    const near = list.filter(p => reporters[p.id] || isLead(p));
    const far = list.filter(p => !(reporters[p.id] || isLead(p)));
    const shells = [[near, P.r * 1.55 + 1.5 * BS, 0.38, 0.4], [far, P.r * 2.05 + 2.5 * BS, -0.22, 1.3]];
    shells.forEach(([grp, R, tx, ph]) => {
      if (!grp.length) return;
      const e = new THREE.Euler(tx, 0, 0.12);
      circle(R, d.color, 0.09, P.pos, e);
      grp.forEach((p, i) => {
        const a = ph + i / grp.length * TAU;
        const pos = new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R).applyEuler(e).add(P.pos);
        const rep = !!reporters[p.id];
        const r = (isLead(p) ? 0.8 : rep ? 0.66 : 0.4) * BS;
        const h = hash(p.id), mk = MOONS[h % MOONS.length];
        const w = makeWorld({ r, type: mk.type, pal: mk.pal, seed: 1 + (h % 97) * 0.37, rim: d.color, rimI: 0.45,
                              tilt: 0.3, spin: 0.03 + (h % 5) * 0.01, segs: rep ? 40 : 28, sun: sunPos });
        w.group.position.copy(pos);
        w.surf.userData.pick = { kind: 'person', id: p.id };
        klever.add(w.group);
        worlds.push(w);
        let marker = null, lab = null;
        if (rep) {
          marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTexture(), color: new THREE.Color(STATUS.pending.color),
            transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
          marker.scale.set(r * 3.6, r * 3.6, 1);
          marker.position.copy(pos);
          klever.add(marker);
          lab = el('button', 'obs3d-label uni-person', short(p));
          lab.type = 'button';
          lab.onclick = () => pick({ kind: 'person', id: p.id });
          labels.appendChild(lab);
        }
        nodes[p.id] = { id: p.id, pos, r, w, pick: w.surf, marker, lab, person: p, dept: d, state: null };
      });
    });
  });

  /* where the money lives */
  const insts = {};
  INST.forEach((it, ii) => {
    const pos = new THREE.Vector3(Math.cos(it.angle + TURN) * it.orbit, 1.5, Math.sin(it.angle + TURN) * it.orbit);
    const r = it.size * BS;
    let pickMesh, w = null, extra = [];
    if (it.cluster) {
      /* the customers: a cluster of stars, many lights close together */
      const cp = [], cc = [];
      const tints = [new THREE.Color('#dfe9ff'), new THREE.Color('#fff4dc'), new THREE.Color('#bfd6ff'), new THREE.Color('#ffd9a6')];
      for (let k = 0; k < 700; k++) {
        const v = new THREE.Vector3().randomDirection().multiplyScalar(Math.abs(gauss()) * r * 0.45);
        cp.push(v.x, v.y, v.z);
        const c = tints[k % 4].clone().multiplyScalar(0.55 + Math.random() * 0.6);
        cc.push(c.r, c.g, c.b);
      }
      const cg = new THREE.BufferGeometry();
      cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3));
      cg.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3));
      const cm = new THREE.PointsMaterial({ size: 0.34 * BS, vertexColors: true, map: glowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0.3)'),
                                            transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      const cl = new THREE.Points(cg, cm);
      cl.position.copy(pos);
      klever.add(cl);
      const glow = glowSprite('rgba(220,235,255,0.7)', 'rgba(160,190,255,0.12)', r * 5.5);
      glow.position.copy(pos);
      klever.add(glow);
      extra = [cm, glow.material];
      pickMesh = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
      pickMesh.position.copy(pos);
      klever.add(pickMesh);
    } else {
      w = makeWorld(Object.assign({ r, seed: 20 + ii * 4.1, rimI: 0.6, spin: 0.07, segs: 56, sun: sunPos }, it.w));
      w.group.position.copy(pos);
      klever.add(w.group);
      worlds.push(w);
      pickMesh = w.surf;
    }
    pickMesh.userData.pick = { kind: 'inst', id: it.id };
    const lab = el('button', 'obs3d-label uni-inst', L(it));
    lab.type = 'button';
    lab.onclick = () => pick({ kind: 'inst', id: it.id });
    labels.appendChild(lab);
    insts[it.id] = { it, pos, r, pick: pickMesh, lab, extra };
  });
  const where = id => (nodes[id] ? nodes[id].pos : insts[id] ? insts[id].pos : null);

  /* the day's report beams */
  const beams = [];
  due.forEach(r => {
    const to = (opts.recipientsOf ? opts.recipientsOf(r) : ['chairman']).filter(x => nodes[x]);
    if (!to.length) to.push('chairman');
    to.forEach(t => {
      const A = where(r.person), B = where(t);
      if (!A || !B || A === B) return;
      const mid = A.clone().add(B).multiplyScalar(0.5);
      mid.y += A.distanceTo(B) * 0.25 + 3;
      const curve = new THREE.QuadraticBezierCurve3(A.clone(), mid, B.clone());
      const u = { uColor: { value: new THREE.Color(STATUS.pending.color) }, uState: { value: 0 },
                  uTime: { value: 0 }, uArrive: { value: 1 }, uFade: { value: 0 }, uDim: { value: 1 } };
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.055 * BS, 5, false), new THREE.ShaderMaterial({
        vertexShader: BEAM_VERT, fragmentShader: BEAM_FRAG, uniforms: u,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      }));
      klever.add(mesh);
      beams.push({ r, to: t, mesh, u, state: 'pending', litAt: -1e9 });
    });
  });

  /* the day's money */
  const flows = FLOWS.map(f => {
    const A = where(f.from), B = where(f.to);
    const mid = A.clone().add(B).multiplyScalar(0.5);
    mid.y += A.distanceTo(B) * 0.28 + 6;
    const curve = new THREE.QuadraticBezierCurve3(A.clone(), mid, B.clone());
    const n = 36;
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const pm = new THREE.PointsMaterial({ color: GOLD, size: 1.3 * BS, transparent: true, opacity: 0,
                                          map: glowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0.35)'),
                                          blending: THREE.AdditiveBlending, depthWrite: false });
    const pts = new THREE.Points(pg, pm);
    pts.frustumCulled = false;
    klever.add(pts);
    const lab = el('div', 'uni-amt');
    labels.appendChild(lab);
    return { f, curve, pts, pm, n, lab, amount: 0, show: 0 };
  });

  /* the agents: small ice worlds on the outermost orbit */
  const SAT_R = 100, SAT_Y = 3;
  circle(SAT_R, '#5fe0c6', 0.12);
  const sats = (window.KleverOrbit ? window.KleverOrbit.order : Object.keys(WATCH)).map((id, i, arr) => {
    const w = makeWorld({ r: 0.8 * BS, type: 0, pal: ICES[i % ICES.length], seed: 40 + i * 3.3, rim: HEAT.none,
                          rimI: 1.1, tilt: 0.2, spin: 0.08, segs: 32, sun: sunPos });
    w.surf.userData.pick = { kind: 'agent', id };
    klever.add(w.group);
    worlds.push(w);
    const glow = glowSprite('rgba(255,255,255,0.9)', 'rgba(255,255,255,0.15)', 7 * BS);
    klever.add(glow);
    const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const lmat = new THREE.LineDashedMaterial({ color: 0x5fe0c6, dashSize: 1.2, gapSize: 1.6, transparent: true, opacity: 0 });
    const line = new THREE.Line(lg, lmat);
    line.frustumCulled = false;
    klever.add(line);
    const lab = el('button', 'obs3d-label uni-agent');
    lab.type = 'button';
    lab.textContent = (window.KleverOrbit && window.KleverOrbit.agents[id]) ? L(window.KleverOrbit.agents[id]) : id;
    lab.onclick = () => pick({ kind: 'agent', id });
    labels.appendChild(lab);
    return { id, w, glow, line, lm: lmat, lab, a0: i / arr.length * TAU, heat: 'none' };
  });

  /* ---------- the day ---------- */
  const clock = opts.clock || (() => new Date());
  const today0 = () => { const d = clock(); d.setHours(0, 0, 0, 0); return d; };
  let D = { filings: [], findings: [], instructions: [], dayStart: today0(), now: clock() };
  let T = D.now.getTime(), mode = 'live', playFrom = 0, playT0 = 0, lastTick = 0;
  const PLAY_MS = 24000;

  function deadline(r) {
    const d = new Date(D.dayStart);
    const p = String(r.dueTime || '17:30').split(':');
    d.setHours(Number(p[0]), Number(p[1]), 0, 0);
    return d.getTime();
  }
  function filingOf(r, t) {
    for (const f of D.filings) if (f.report === r.id && f.at.getTime() <= t) return f;
    return null;
  }
  function stateOf(r, t) {
    const f = filingOf(r, t);
    if (f) return f.at.getTime() <= deadline(r) ? 'on' : 'late';
    return t > deadline(r) ? 'missing' : 'pending';
  }
  function lastValues(reportId, t) {
    let v = null;
    for (const f of D.filings) if (f.report === reportId && f.at.getTime() <= t) v = f.values || {};
    return v;
  }
  const rank = { missing: 3, late: 2, pending: 1, on: 0 };
  function worstOf(reps) {
    let w = null;
    reps.forEach(r => { const st = stateOf(r, T); if (!w || rank[st] > rank[w]) w = st; });
    return w;
  }

  const DAYS = { en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                 am: ['እሑድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'] };
  const MONTHS = { en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                   am: ['ጃንዩወሪ', 'ፌብሩወሪ', 'ማርች', 'ኤፕሪል', 'ሜይ', 'ጁን', 'ጁላይ', 'ኦገስት', 'ሴፕቴምበር', 'ኦክቶበር', 'ኖቬምበር', 'ዲሴምበር'] };
  const dayName = d => DAYS[lang][d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[lang][d.getMonth()];
  const shortDate = ymd => {
    const p = String(ymd || '').split('-');
    return p.length === 3 ? Number(p[2]) + ' ' + MONTHS[lang][Number(p[1]) - 1].slice(0, lang === 'am' ? 4 : 3) : String(ymd || '');
  };
  const ymdOf = d => d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  let dayText = '';

  function applyDay(now) {
    let on = 0, late = 0, missing = 0;
    const personWorst = {};
    due.forEach(r => {
      const st = stateOf(r, T);
      if (st === 'on') on++; else if (st === 'late') late++; else if (st === 'missing') missing++;
      const w = personWorst[r.person];
      if (!w || rank[st] > rank[w]) personWorst[r.person] = st;
    });
    beams.forEach(b => {
      const st = stateOf(b.r, T);
      if (st !== b.state) {
        if ((st === 'on' || st === 'late') && b.state !== 'on' && b.state !== 'late') b.litAt = (mode === 'live' && !b.seen) ? -1e9 : now;
        b.state = st;
      }
      b.seen = true;
      b.u.uState.value = { pending: 0, on: 1, late: 2, missing: 3 }[st];
      b.u.uColor.value.set(STATUS[st].color);
    });
    Object.keys(personWorst).forEach(id => {
      const n = nodes[id];
      if (!n) return;
      n.state = personWorst[id];
      if (n.marker) n.marker.material.color.set(STATUS[n.state].color);
    });
    DEPTS.forEach(d => {
      const P = planets[d.key];
      const ids = byDept[d.key].map(p => p.id);
      P.state = worstOf(due.filter(r => ids.indexOf(r.person) !== -1));
      P.dot.style.background = P.state ? STATUS[P.state].color : 'transparent';
      P.dot.style.boxShadow = P.state ? '0 0 8px ' + STATUS[P.state].color : 'none';
    });
    let inn = 0, out = 0;
    flows.forEach(fl => {
      const v = lastValues(fl.f.report, T);
      fl.amount = v ? num(v[fl.f.field]) : 0;
      if (fl.f.sum === 'in') inn += fl.amount; else if (fl.f.sum === 'out') out += fl.amount;
    });
    dayText = dayName(D.dayStart) + '  ·  ' + s('filed', 'Filed') + ' ' + (on + late) + ' / ' + due.length +
      (late ? ' · ' + late + ' ' + s('late', 'late') : '') +
      (missing ? ' · ' + missing + ' ' + s('missing', 'missing') : '') +
      ((inn || out) ? '  ·  ' + s('in', 'in') + ' ' + money(inn) + ' · ' + s('out', 'out') + ' ' + money(out) : '');
    heading();
    tLabel.textContent = hhmm(new Date(T));
    const t0 = D.dayStart.getTime() + 6 * 3600e3, t1 = Math.max(t0 + 60e3, D.now.getTime());
    const u = Math.max(0, Math.min(1, (T - t0) / (t1 - t0)));
    fill.style.width = (u * 100) + '%';
    head.style.left = (u * 100) + '%';
    live.classList.toggle('on', mode === 'live');
    play.textContent = mode === 'play' ? '❚❚' : '▶';
  }

  /* the ticks on the timeline: every deadline, every filing */
  function drawTicks() {
    track.querySelectorAll('.uni-tick,.uni-dot').forEach(x => x.remove());
    const t0 = D.dayStart.getTime() + 6 * 3600e3, t1 = Math.max(t0 + 60e3, D.now.getTime());
    const seen = {};
    due.forEach(r => {
      const t = deadline(r);
      if (t < t0 || t > t1 || seen[t]) return;
      seen[t] = 1;
      const k = el('i', 'uni-tick');
      k.style.left = ((t - t0) / (t1 - t0) * 100) + '%';
      track.appendChild(k);
    });
    D.filings.forEach(f => {
      const t = f.at.getTime();
      if (t < t0 || t > t1) return;
      const r = due.find(x => x.id === f.report);
      const dot = el('i', 'uni-dot');
      dot.style.left = ((t - t0) / (t1 - t0) * 100) + '%';
      dot.style.background = r && t > deadline(r) ? STATUS.late.color : STATUS.on.color;
      track.appendChild(dot);
    });
  }

  function scrubTo(clientX) {
    const rect = track.getBoundingClientRect();
    const u = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const t0 = D.dayStart.getTime() + 6 * 3600e3, t1 = Math.max(t0 + 60e3, D.now.getTime());
    T = t0 + u * (t1 - t0);
    mode = u >= 0.999 ? 'live' : 'scrub';
    applyDay(performance.now());
  }
  let dragging = false;
  track.addEventListener('pointerdown', e => { dragging = true; track.setPointerCapture(e.pointerId); scrubTo(e.clientX); });
  track.addEventListener('pointermove', e => { if (dragging) scrubTo(e.clientX); });
  track.addEventListener('pointerup', () => { dragging = false; });
  play.onclick = () => {
    if (mode === 'play') { mode = 'scrub'; applyDay(performance.now()); return; }
    mode = 'play';
    playFrom = D.dayStart.getTime() + 6 * 3600e3;
    playT0 = performance.now();
    if (level !== 'company') goCompany();
  };
  live.onclick = () => { mode = 'live'; D.now = clock(); T = D.now.getTime(); applyDay(performance.now()); };

  function applyAgents() {
    const find = {};
    (D.findings || []).forEach(f => { find[f.id] = f.text || ''; });
    sats.forEach(st => {
      const h = window.KleverOrbit ? window.KleverOrbit.heatOf(find[st.id]) : 'none';
      st.heat = h;
      st.w.rimU.uColor.value.set(HEAT[h]);
      st.glow.material.color.set(HEAT[h]);
      st.lm.color.set(h === 'loud' ? '#ff7a5c' : '#5fe0c6');
      st.lab.className = 'obs3d-label uni-agent ' + h;
    });
  }

  /* ---------- the sheet ---------- */
  let picked = null;
  const stateCls = st => st === 'on' ? 'quiet' : st === 'late' ? 'warm' : st === 'missing' ? 'loud' : 'none';
  function sheetHead(ringTxt, cls, stateTxt, name, sub) {
    sheet.innerHTML = '';
    sheet.appendChild(el('div', 'obs-grab'));
    const close = el('button', 'obs-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', s('close', 'Close'));
    close.onclick = () => pick(null);
    sheet.appendChild(close);
    const top = el('div', 'obs-top');
    top.appendChild(el('span', 'obs-ring', ringTxt));
    if (stateTxt) top.appendChild(el('span', 'obs-state ' + cls, stateTxt));
    sheet.appendChild(top);
    sheet.appendChild(el('h2', null, name));
    if (sub) sheet.appendChild(el('p', 'obs-watch', sub));
  }
  function repRow(list, st, name, time) {
    const row = el('div', 'uni-rep');
    const dot = el('i'); dot.style.background = STATUS[st].color;
    row.appendChild(dot);
    row.appendChild(el('span', 'uni-rep-n', name));
    row.appendChild(el('span', 'uni-rep-t', time));
    list.appendChild(row);
  }
  function drawSheet() {
    if (!picked) { sheet.hidden = true; wrap.classList.remove('picked'); return; }
    wrap.classList.add('picked');
    const k = picked.kind, id = picked.id;
    if (k === 'person') {
      const n = nodes[id];
      const p = n.person;
      const mine = due.filter(r => r.person === id);
      const toMe = due.filter(r => (opts.recipientsOf ? opts.recipientsOf(r) : []).indexOf(id) !== -1);
      const worst = mine.length ? worstOf(mine) : null;
      sheetHead(n.dept ? L(n.dept) : s('centre', 'The centre'), stateCls(worst), worst ? L(STATUS[worst]) : null,
                p ? L(p) : s('chairman', 'Chairman'), p ? (lang === 'am' ? p.roleAm : p.roleEn) : 'Amare Feleke');
      if (mine.length) {
        sheet.appendChild(el('div', 'obs-said-k', s('files', 'Files today')));
        const list = el('div', 'uni-reps');
        mine.forEach(r => {
          const f = filingOf(r, T);
          repRow(list, stateOf(r, T), L(r), f ? hhmm(f.at) : (lang === 'am' ? r.dueAm : r.dueEn));
        });
        sheet.appendChild(list);
      }
      if (toMe.length) {
        const inCount = toMe.filter(r => filingOf(r, T)).length;
        sheet.appendChild(el('div', 'obs-said-k', s('receives', 'Addressed to them') + ' · ' + inCount + ' / ' + toMe.length));
        const list = el('div', 'uni-reps');
        toMe.forEach(r => {
          const st = stateOf(r, T), f = filingOf(r, T);
          const who = people.find(x => x.id === r.person);
          repRow(list, st, (who ? short(who) + ' · ' : '') + L(r), f ? hhmm(f.at) : L(STATUS[st]));
        });
        sheet.appendChild(list);
      }
      const ins = (D.instructions || []).filter(x => x.to === id && x.status === 'open')
        .sort((a, b) => String(a.due).localeCompare(String(b.due)));
      if (ins.length) {
        sheet.appendChild(el('div', 'obs-said-k', s('instructions', 'From the Chairman')));
        const list = el('div', 'uni-reps');
        const today = ymdOf(D.dayStart);
        ins.forEach(x => {
          const over = String(x.due) < today;
          const row = el('div', 'uni-rep uni-ins');
          const dot = el('i'); dot.style.background = over ? STATUS.missing.color : STATUS.late.color;
          row.appendChild(dot);
          row.appendChild(el('span', 'uni-rep-n', x.text));
          row.appendChild(el('span', 'uni-rep-t' + (over ? ' over' : ''), shortDate(x.due)));
          list.appendChild(row);
        });
        sheet.appendChild(list);
      }
      if (!mine.length && !toMe.length && !ins.length) sheet.appendChild(el('p', 'obs-said empty', s('nothing', 'No report of theirs today.')));
    } else if (k === 'dept') {
      const P = planets[id], d = P.d;
      const members = byDept[id];
      const ids = members.map(p => p.id);
      const reps = due.filter(r => ids.indexOf(r.person) !== -1);
      const filed = reps.filter(r => filingOf(r, T)).length;
      sheetHead(s('dept', 'Department'), stateCls(P.state), P.state ? L(STATUS[P.state]) : null, L(d),
                members.length + ' ' + s('people', 'people') + (reps.length ? '  ·  ' + s('filed', 'Filed') + ' ' + filed + ' / ' + reps.length : ''));
      if (reps.length) {
        sheet.appendChild(el('div', 'obs-said-k', s('files', 'Files today')));
        const list = el('div', 'uni-reps');
        reps.forEach(r => {
          const st = stateOf(r, T), f = filingOf(r, T);
          const who = people.find(x => x.id === r.person);
          repRow(list, st, (who ? short(who) + ' · ' : '') + L(r), f ? hhmm(f.at) : L(STATUS[st]));
        });
        sheet.appendChild(list);
      } else {
        sheet.appendChild(el('p', 'obs-said empty', s('nothing', 'No report of theirs today.')));
      }
    } else if (k === 'agent') {
      const A = window.KleverOrbit && window.KleverOrbit.agents[id];
      const st = sats.find(x => x.id === id);
      const txt = ((D.findings || []).find(f => f.id === id) || {}).text;
      sheetHead(s('agent', 'Agent in orbit'), st.heat === 'none' ? 'none' : st.heat,
                { loud: s('wantsYou', 'Wants you'), warm: s('worth', 'Worth a look'), quiet: s('quiet', 'Quiet'), none: s('noReading', 'No reading yet') }[st.heat],
                A ? L(A) : id, A ? (lang === 'am' ? A.watchAm : A.watchEn) : '');
      sheet.appendChild(el('div', 'obs-said-k', s('said', 'What it said') + (D.analysisDay ? ' · ' + D.analysisDay : '')));
      sheet.appendChild(el('div', 'obs-said' + (txt ? '' : ' empty'), txt ? bullets(txt) : s('noSaid', 'Nothing yet.')));
      if (opts.obsHref !== null) {
        const go = el('a', 'obs-open', s('openObs', 'Open in the observatory'));
        go.href = opts.obsHref || 'agents.html';
        sheet.appendChild(go);
      }
    } else if (k === 'inst') {
      const it = insts[id].it;
      sheetHead(s('outside', 'Outside Klever'), null, null, L(it), null);
      flows.filter(fl => fl.f.from === id || fl.f.to === id).forEach(fl => {
        const row = el('div', 'uni-rep');
        const dot = el('i'); dot.style.background = '#ffc75e';
        row.appendChild(dot);
        row.appendChild(el('span', 'uni-rep-n', L({ en: fl.f.en, am: fl.f.am })));
        row.appendChild(el('span', 'uni-rep-t', fl.amount ? money(fl.amount) + ' ' + s('birr', 'Birr') : s('notReported', 'not reported')));
        sheet.appendChild(row);
      });
    } else if (k === 'company') {
      const co = COMPANIES.find(c => c.id === id);
      sheetHead(s('group', 'Amare Holdings'), co.live ? 'quiet' : 'none',
                co.live ? s('coLive', 'live') : s('coOff', 'not connected yet'), L(co),
                co.live ? s('coLiveSub', 'Every person, every report and the day’s money, drawn from what was filed today.')
                        : s('coOffSub', 'No reports come from here yet. When its people file on the site, it lights up the way Klever does.'));
      if (co.live) {
        const go = el('button', 'obs-open', s('flyIn', 'Fly in'));
        go.type = 'button';
        go.onclick = () => { pick(null); goCompany(); };
        sheet.appendChild(go);
      }
    }
    sheet.hidden = false;
    sheet.scrollTop = 0;
  }

  /* ---------- camera ---------- */
  let W = 0, H = 0, level = 'group', tween = null, offY = 0, offGoal = 0;
  const views = {};
  function band() {
    const top = (document.querySelector('.top') || hud).getBoundingClientRect().bottom;
    if (picked && !sheet.hidden) return [top + 8, sheet.getBoundingClientRect().top - 8];
    return [hud.getBoundingClientRect().bottom + 6,
            (level === 'group' ? tbar : legend).getBoundingClientRect().top - 6];
  }
  /* a flat disc seen from above at elevation e: its width against the
     frame's width, its foreshortened depth (plus what stands on it)
     against the band between the head and the foot of the page */
  function fitDisc(R, e, target, lift) {
    const [y0, y1] = band();
    const tY = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const tb = tY * Math.max(80, y1 - y0) / H, tx = tY * W / H;
    const d = Math.max(R / tx, (R * Math.sin(e) + lift) / tb) * 1.1;
    const az = AZ;
    return { pos: new THREE.Vector3(Math.sin(az) * Math.cos(e) * d, Math.sin(e) * d, Math.cos(az) * Math.cos(e) * d).add(target),
             target: target.clone(), d };
  }
  function computeViews() {
    const portrait = W / H < 0.8;
    views.group = fitDisc(17000, portrait ? 1.2 : 0.62, HUB.clone(), 4500);
    views.company = fitDisc(portrait ? 84 : 90, portrait ? 1.0 : 0.56, new THREE.Vector3(0, 2, 0), 14);
    const [y0, y1] = band();
    offGoal = H / 2 - (y0 + y1) / 2;
  }
  function flyTo(v, ms, lead) {
    const o0 = camera.position.clone().sub(controls.target), o1 = v.pos.clone().sub(v.target);
    tween = { t0: controls.target.clone(), t1: v.target.clone(), lead: lead || 1,
              d0: Math.log(o0.length()), d1: Math.log(o1.length()),
              n0: o0.clone().normalize(), q: new THREE.Quaternion().setFromUnitVectors(o0.clone().normalize(), o1.clone().normalize()),
              start: performance.now(), ms: reduce ? 1 : ms };
    controls.enabled = false;
  }
  const qI = new THREE.Quaternion(), qK = new THREE.Quaternion();
  function heading() {
    title.textContent = level === 'group' ? s('group', 'Amare Holdings') : s('title', 'Klever, today');
    stats.textContent = level === 'group' ? s('groupStats', 'Five companies · one reporting live') : dayText;
  }
  function goGroup() {
    level = 'group';
    computeViews();
    flyTo(views.group, 4200);
    controls.minDistance = 3000; controls.maxDistance = views.group.d * 1.8;
    controls.autoRotateSpeed = 0.1;
    wrap.classList.add('at-group'); wrap.classList.remove('at-company');
    heading();
  }
  function goCompany() {
    level = 'company';
    computeViews();
    flyTo(views.company, 5600, level === 'group' || camera.position.length() > 5000 ? 2.2 : 1);
    controls.minDistance = 3; controls.maxDistance = views.company.d * 2.5;
    controls.autoRotateSpeed = 0.18;
    wrap.classList.add('at-company'); wrap.classList.remove('at-group');
    heading();
  }
  cGroup.onclick = () => { pick(null); goGroup(); };
  cCo.onclick = () => { pick(null); goCompany(); };

  const satPos = st => st.w.group.position;
  function pick(p) {
    picked = p;
    drawSheet();
    computeViews();
    if (!p) {
      if (level === 'company') flyTo(views.company, 1600);
      return;
    }
    if (p.kind === 'company') return;
    if (level !== 'company') {
      level = 'company'; controls.minDistance = 3;
      wrap.classList.add('at-company'); wrap.classList.remove('at-group'); heading();
    }
    let P, dist;
    if (p.kind === 'person') { const n = nodes[p.id]; P = n.pos.clone(); dist = p.id === 'chairman' ? SUN_R * 6.5 : Math.max(8, n.r * 13); }
    else if (p.kind === 'dept') { const pl = planets[p.id]; P = pl.pos.clone(); dist = pl.r * 6 + 16 * BS; }
    else if (p.kind === 'inst') { const i = insts[p.id]; P = i.pos.clone(); dist = i.r * 6 + 8; }
    else { P = satPos(sats.find(x => x.id === p.id)).clone(); dist = 9 * BS; }
    /* come at it from between the camera and the sun, so its lit face shows */
    const toCam = camera.position.clone().sub(P).setY(0).normalize();
    const toSun = P.lengthSq() > 4 ? P.clone().negate().setY(0).normalize() : toCam.clone();
    const dir = toSun.multiplyScalar(0.55).add(toCam.multiplyScalar(0.45)).normalize()
      .multiplyScalar(0.84).add(new THREE.Vector3(0, 0.5, 0)).normalize();
    flyTo({ pos: P.clone().addScaledVector(dir, dist * (H > W ? 1.35 : 1)), target: P }, 1700);
  }

  /* tapping */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null;
  canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', e => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 7) { down = null; return; }
    down = null;
    ndc.set(e.clientX / W * 2 - 1, -(e.clientY / H) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (level === 'company') {
      const objs = Object.values(nodes).map(n => n.pick)
        .concat(Object.values(planets).map(pl => pl.w.surf), Object.values(insts).map(i => i.pick), sats.map(x => x.w.surf));
      const hits = ray.intersectObjects(objs, false);
      if (hits.length) { pick(hits[0].object.userData.pick); return; }
    } else {
      let best = null, bd = 70;
      coMarks.forEach(c => {
        const v = c.pos.clone().project(camera);
        const d = Math.hypot((v.x + 1) / 2 * W - e.clientX, (1 - v.y) / 2 * H - e.clientY);
        if (d < bd) { bd = d; best = c; }
      });
      if (best) { if (best.co.live && !picked) goCompany(); else pick({ kind: 'company', id: best.co.id }); return; }
    }
    if (picked) pick(null);
  });

  /* ---------- names over the world ---------- */
  const tmp = new THREE.Vector3(), camUp = new THREE.Vector3(), anchorV = new THREE.Vector3();
  function screen(v) {
    tmp.copy(v).project(camera);
    return { x: (tmp.x + 1) / 2 * W, y: (1 - tmp.y) / 2 * H, z: tmp.z };
  }
  /* a name sits just below its world, whatever the world's size */
  const below = (pos, r) => anchorV.copy(pos).addScaledVector(camUp, -r * 1.25);
  function place(lab, v, dy, taken, prio, soft) {
    const p = screen(v);
    if (p.z > 1 || p.x < -40 || p.x > W + 40 || p.y < -20 || p.y > H + 20) {
      if (soft) return false;
      lab.style.opacity = '0'; lab.style.pointerEvents = 'none'; return false;
    }
    const w = lab.offsetWidth || 60, h = lab.offsetHeight || 18;
    const x = Math.max(6 + w / 2, Math.min(W - 6 - w / 2, p.x));
    let y = p.y + dy;
    let box = [x - w / 2, y, x + w / 2, y + h];
    const clash = b => taken.some(o => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
    let a = 1;
    if (clash(box)) {
      const up = [x - w / 2, p.y - dy - h - 8, x + w / 2, p.y - dy - 8];
      if (!clash(up)) { box = up; y = up[1]; } else if (soft) return false; else a = prio ? 0.35 : 0;
    }
    taken.push(box);
    lab.style.opacity = String(a);
    lab.style.pointerEvents = a > 0.5 ? 'auto' : 'none';
    lab.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px) translateX(-50%)';
    return a === 1;
  }
  function hide(lab) { lab.style.opacity = '0'; lab.style.pointerEvents = 'none'; }
  const placeNode = (n, taken, prio) => place(n.lab, below(n.pos, n.r), 3, taken, prio);
  function placeLabels(kFade) {
    const taken = [];
    const showCo = kFade < 0.3;
    coMarks.forEach(c => {
      if (showCo && !picked) place(c.lab, anchorV.copy(c.pos).addScaledVector(camUp, -c.co.radius * 0.6), 0, taken, true);
      else hide(c.lab);
    });
    const allNodes = Object.values(nodes).filter(n => n.lab);
    if (kFade < 0.5 || (picked && picked.kind !== 'company')) {
      /* something is picked: its name, and the names of what it touches */
      const near = {};
      let keepPlanet = null, keepInst = null, keepSat = null;
      if (picked && kFade >= 0.5) {
        if (picked.kind === 'person') {
          beams.forEach(b => { if (b.r.person === picked.id) near[b.to] = 1; if (b.to === picked.id) near[b.r.person] = 1; });
          near[picked.id] = 2;
        } else if (picked.kind === 'dept') {
          byDept[picked.id].forEach(p => { near[p.id] = 1; });
          keepPlanet = picked.id;
        } else if (picked.kind === 'inst') keepInst = picked.id;
        else if (picked.kind === 'agent') { keepSat = picked.id; keepPlanet = WATCH[picked.id]; }
      }
      const mine = [];
      allNodes.filter(n => near[n.id] === 2).forEach(n => placeNode(n, mine, true));
      allNodes.forEach(n => { if (near[n.id] === 1) placeNode(n, mine, false); else if (near[n.id] !== 2) hide(n.lab); });
      Object.values(planets).forEach(pl => { if (pl.d.key === keepPlanet) place(pl.lab, below(pl.pos, pl.r), 3, mine, true); else hide(pl.lab); });
      Object.values(insts).forEach(i => { if (i.it.id === keepInst) place(i.lab, below(i.pos, i.r), 3, mine, true); else hide(i.lab); });
      sats.forEach(x => { if (x.id === keepSat) place(x.lab, below(satPos(x), 0.8 * BS), 3, mine, true); else hide(x.lab); });
      flows.forEach(f => hide(f.lab));
      return;
    }
    /* the Chairman and anyone late or missing first, then the leads, then
       the departments, the money, and everyone else if there is room */
    const tier = n => n.id === 'chairman' ? 0 : (n.state === 'missing' || n.state === 'late') ? 1
      : (n.person && isLead(n.person)) ? 2 : 3;
    const order = allNodes.sort((a, b) => tier(a) - tier(b));
    order.filter(n => tier(n) === 0).forEach(n => placeNode(n, taken, true));
    Object.values(planets).forEach(pl => place(pl.lab, below(pl.pos, pl.r), 3, taken, true));
    Object.values(insts).forEach(i => place(i.lab, below(i.pos, i.r), 3, taken, true));
    order.filter(n => tier(n) === 1 || tier(n) === 2).forEach(n => placeNode(n, taken, true));
    /* an amount looks for room along its own stream before it gives up */
    flows.forEach(f => {
      if (!f.amount || f.show < 0.5) { hide(f.lab); return; }
      f.lab.textContent = money(f.amount) + ' ' + s('birr', 'Birr');
      if (![0.5, 0.36, 0.64, 0.26, 0.74].some(u => place(f.lab, f.curve.getPoint(u), -8, taken, false, true))) hide(f.lab);
    });
    order.filter(n => tier(n) === 3).forEach(n => placeNode(n, taken, false));
    /* on a phone the agents keep their colour but not their names */
    sats.forEach(x => { if (x.heat === 'loud' && W >= 600) place(x.lab, below(satPos(x), 0.8 * BS), 3, taken, false); else hide(x.lab); });
  }

  /* ---------- the loop ---------- */
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    renderer.setSize(W, H, false);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    composer.setSize(W, H);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    galU.uScale.value = H * pr / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    starMat.uniforms.uPR.value = pr;
    computeViews();
    if (!tween) {
      const v = level === 'group' ? views.group : views.company;
      if (!picked) { camera.position.copy(v.pos); controls.target.copy(v.target); }
    }
  }

  const watchTarget = key => key === 'chairman' ? sunPos : planets[key].pos;
  let last = 0, raf = 0, alive = true, time = 0, frames = 0, slow = 0, bloomOn = true;
  function frame(now) {
    if (!alive) return;
    const dt = last ? Math.min(0.064, (now - last) / 1000) : 0.016;
    last = now; time += dt;

    frames++;
    if (frames > 30 && frames < 260) {
      slow = slow * 0.95 + (dt > 0.034 ? 1 : 0) * 0.05;
      if (slow > 0.6 && pr > 1) { pr = 1; renderer.setPixelRatio(1); resize(); slow = 0.3; }
      else if (slow > 0.6 && bloomOn) { bloomOn = false; bloom.enabled = false; slow = 0.3; }
    }

    if (mode === 'play') {
      const u = Math.min(1, (now - playT0) / PLAY_MS);
      const t1 = D.now.getTime();
      T = playFrom + (t1 - playFrom) * u;
      if (u >= 1) { mode = 'live'; D.now = clock(); T = D.now.getTime(); }
      applyDay(now);
    } else if (now - lastTick > 1000) {
      /* once a second: the day moves on, and a deadline that passes turns
         its beam coral without anyone reloading */
      lastTick = now;
      const was = D.now.getMinutes();
      D.now = clock();
      if (mode === 'live') { T = D.now.getTime(); applyDay(now); }
      if (D.now.getMinutes() !== was) drawTicks();
    }

    if (tween) {
      const u = Math.min(1, (now - tween.start) / tween.ms), k = ease(u);
      controls.target.lerpVectors(tween.t0, tween.t1, ease(Math.min(1, u * tween.lead)));
      qK.slerpQuaternions(qI, tween.q, k);
      camera.position.copy(tween.n0).applyQuaternion(qK)
        .multiplyScalar(Math.exp(tween.d0 + (tween.d1 - tween.d0) * k)).add(controls.target);
      if (u >= 1) { tween = null; controls.enabled = true; }
    }
    starMat.userData.points.position.copy(camera.position);
    starMat.uniforms.uTime.value = time;

    /* how far into Klever the camera is: 0 out among the galaxies, 1 in the system */
    const dK = camera.position.length();
    const kf = THREE.MathUtils.clamp(1 - (dK - 400) / 1400, 0, 1);
    galU.uFade.value = 1 - 0.62 * kf;
    /* a glow that would fill the screen is not a glow any more but a fog:
       each fades out as it grows past a fraction of the frame */
    const frac = (size, dist) => size / (2 * Math.max(dist, 1) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    const shrink = (size, dist) => 1 - THREE.MathUtils.smoothstep(frac(size, dist), 0.18, 0.45);
    here.material.opacity = THREE.MathUtils.clamp((dK - 700) / 2500, 0, 1) * shrink(700, dK);
    coMarks.forEach(c => {
      const dc = camera.position.distanceTo(c.pos);
      c.core.material.opacity = 0.8 * shrink(c.co.core, dc);
    });

    klever.visible = kf > 0.01;
    if (klever.visible) {
      sun.u.uTime.value = time;
      sun.corona.material.opacity = kf;
      sun.haze.material.opacity = kf;
      worlds.forEach(w => w.update(dt, time));
      lineMats.forEach(m => { m.opacity = kf * m.userData.base; });
      Object.values(nodes).forEach(n => {
        if (!n.marker) return;
        const st = n.state;
        n.marker.material.opacity = kf * (st === 'missing' ? 0.55 + 0.4 * Math.sin(time * 3 + n.pos.x)
          : st === 'pending' || !st ? 0.35 : 0.85);
      });
      const pp = picked && (picked.kind === 'person' || picked.kind === 'dept') ? picked : null;
      const inDept = pp && pp.kind === 'dept' ? byDept[pp.id].map(p => p.id) : null;
      beams.forEach(b => {
        b.u.uTime.value = time;
        b.u.uFade.value = kf;
        b.u.uArrive.value = Math.min(1, (now - b.litAt) / 1400);
        let dim = 1;
        if (pp && pp.kind === 'person' && pp.id !== b.r.person && pp.id !== b.to) dim = 0.12;
        if (inDept && inDept.indexOf(b.r.person) === -1 && inDept.indexOf(b.to) === -1) dim = 0.12;
        b.u.uDim.value = dim;
      });
      flows.forEach(fl => {
        const on = fl.amount > 0 ? 1 : 0;
        fl.show += (on - fl.show) * Math.min(1, dt * 3);
        fl.pm.opacity = fl.show * kf;
        const n = Math.max(4, Math.min(fl.n, Math.round(Math.log10(Math.max(10, fl.amount)) * 6)));
        const pos = fl.pts.geometry.attributes.position;
        for (let i = 0; i < fl.n; i++) {
          if (i >= n) { pos.setXYZ(i, 0, -9999, 0); continue; }
          const u = ((time * 0.12) + i / n) % 1;
          const p = fl.curve.getPoint(u);
          pos.setXYZ(i, p.x, p.y, p.z);
        }
        pos.needsUpdate = true;
      });
      Object.values(insts).forEach(i => { i.extra.forEach(m => { m.opacity = kf * 0.9; }); });
      sats.forEach((st, i) => {
        const a = st.a0 + time * 0.012;
        const p = satPos(st);
        p.set(Math.cos(a) * SAT_R, SAT_Y + Math.sin(time * 0.5 + i) * 0.8, Math.sin(a) * SAT_R);
        st.glow.position.copy(p);
        st.glow.material.opacity = kf * ({ loud: 0.85, warm: 0.55, quiet: 0.3, none: 0.12 }[st.heat]);
        const tgt = watchTarget(WATCH[st.id]);
        const lp = st.line.geometry.attributes.position;
        lp.setXYZ(0, p.x, p.y, p.z);
        lp.setXYZ(1, tgt.x, tgt.y, tgt.z);
        lp.needsUpdate = true;
        st.line.computeLineDistances();
        st.lm.opacity = kf * (st.heat === 'loud' ? 0.3 : 0.03);
      });
      if (!tween && picked && picked.kind === 'agent') {
        /* an agent keeps moving; the camera goes with it */
        const st = sats.find(x => x.id === picked.id);
        const dv = satPos(st).clone().sub(controls.target).multiplyScalar(Math.min(1, dt * 4));
        controls.target.add(dv);
        camera.position.add(dv);
      }
    }

    offY += (offGoal - offY) * Math.min(1, dt * 5);
    camera.setViewOffset(W, H, 0, offY, W, H);
    controls.autoRotate = !reduce && !picked;
    controls.update();
    camUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
    placeLabels(kf);
    composer.render();
    raf = requestAnimationFrame(frame);
  }

  function onVis() {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
  }
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('resize', resize);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); if (opts.onLost) opts.onLost(); });
  function onKey(e) { if (e.key === 'Escape' && picked) pick(null); }
  document.addEventListener('keydown', onKey);

  resize();
  camera.position.copy(views.group.pos);
  controls.target.copy(views.group.target);
  controls.minDistance = 3000; controls.maxDistance = views.group.d * 1.8;
  wrap.classList.add('at-group');
  heading();
  raf = requestAnimationFrame(frame);
  requestAnimationFrame(() => canvas.classList.add('in'));
  /* the opening shot: the group for a breath, then down through Klever's
     galaxy to its star */
  let introTimer = setTimeout(() => { if (level === 'group' && !picked) goCompany(); }, reduce ? 0 : 2600);

  return {
    update(data) {
      D = Object.assign({ filings: [], findings: [], instructions: [] }, data);
      D.filings = (D.filings || []).slice().sort((a, b) => a.at - b.at);
      D.now = clock();
      D.dayStart = today0();
      if (mode === 'live') T = D.now.getTime();
      applyDay(performance.now());
      applyAgents();
      drawTicks();
      if (picked) drawSheet();
    },
    destroy() {
      alive = false;
      clearTimeout(introTimer);
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', resize);
      controls.dispose();
      skyRT.dispose();
      renderer.dispose();
    }
  };
}

window.KleverUniverse = { mount };
window.dispatchEvent(new Event('klever-universe'));
