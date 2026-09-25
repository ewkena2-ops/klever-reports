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

   THE OTHER FOUR. Each galaxy holds its company's own star, and each can
   be flown into. Its head is the sun and the people on file are planets —
   Kalkidan and Frewoyni at Rovestone, Kidan at Group Finance; Meri Block
   Board and Real Estate have no one on file yet and say so. None of them
   files on this site, so what shows there is what Klever's own reports
   say reaches them: the reports addressed to Kidan, the payments over
   50,000 sent to him, the square metres Amaha made for Rovestone. At the
   group scale the same two figures run as light between the galaxies.

   And a timeline: drag it, or press play, and watch the day happen.

   Everything here is drawn from what the page is handed — who exists, what
   was due, what was filed and when, what the agents said. Nothing is made
   up to fill the picture: a report nobody filed is a dark beam, and money
   nobody reported does not flow.                                           */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TAU, ease, webglOk, makeRenderer, makeComposer, paintSky, makeStars, glowSprite, glowTexture,
         makeWorld, makeSun, ringTexture, makeBelt, makeBrightStars } from './space3d.js?v=1d82963b';

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
    en: 'Cash received — Finance’s report', am: 'የገባ ጥሬ ገንዘብ — የፋይናንስ ሪፖርት' },
  { from: 'bank', to: 'suppliers', report: 'betty-daily', field: 'pay_value', sum: 'out',
    en: 'Payments approved — Finance’s report', am: 'የጸደቁ ክፍያዎች — የፋይናንስ ሪፖርት' },
  { from: 'bank', to: 'zamzam', report: 'betty-daily', field: 'zz_transfer', sum: null,
    en: 'Moved to ZamZam — Finance’s report', am: 'ወደ ዘምዘም የተላለፈ — የፋይናንስ ሪፖርት' }
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
  { id: 'rovestone', en: 'Rovestone', am: 'ሮቭስቶን', sys: 0.42,
    head: { en: 'Kalkidan', am: 'ቃልኪዳን', roleEn: 'General Manager', roleAm: 'ዋና ሥራ አስኪያጅ' },
    crew: [{ en: 'Frewoyni', am: 'ፍሬወይኒ', roleEn: 'Operations Lead', roleAm: 'የኦፕሬሽን ኃላፊ' }],
    kind: 'barred', n: 18000, radius: 3400, arms: 2, wind: 2.2, rot: [0.55, 0.4, 0.25], boost: 1.5,
    inner: '#ffe0b0', outer: '#a8c8ff', dust: 520, core: 2100, off: [11200, -1600, 6000] },
  { id: 'meri', en: 'Meri Block Board', am: 'መሪ ብሎክ ቦርድ', sys: 0.22,
    kind: 'elliptical', n: 16000, radius: 3000, rot: [0.3, 0, 0.5], boost: 1.5,
    inner: '#ffd49a', outer: '#e0a878', dust: 0, core: 2600, off: [7900, 2000, -10100] },
  { id: 'realestate', en: 'Real Estate & Construction', am: 'ሪል እስቴትና ግንባታ', sys: 0.42,
    kind: 'spiral', n: 18000, radius: 3600, arms: 3, wind: 1.35, rot: [1.2, 0.6, 0.1], boost: 1.5,
    inner: '#fff0d8', outer: '#9fbcff', dust: 520, core: 1800, off: [-10100, -1400, -8200] },
  { id: 'groupfinance', en: 'Group Finance', am: 'የቡድኑ ፋይናንስ', sys: 0.36,
    head: { en: 'Kidan', am: 'ኪዳን', roleEn: 'Group Finance Controller', roleAm: 'የቡድኑ ፋይናንስ ተቆጣጣሪ' },
    kind: 'lenticular', n: 26000, radius: 5200, rot: [0.35, 0.2, -0.15], boost: 1.5,
    inner: '#ffe2b0', outer: '#efe4d4', dust: 0, core: 4600, off: [0, 0, 0] }
];
const HUB = KC.clone().sub(new THREE.Vector3(...COMPANIES[0].off));
COMPANIES.forEach(c => {
  c.center = HUB.clone().add(new THREE.Vector3(...c.off));
  /* each company's own star: Klever's at the origin, the others out on
     their galaxy's disc */
  c.sysPos = c.live ? new THREE.Vector3()
    : new THREE.Vector3(c.radius * c.sys, 0, 0).applyEuler(new THREE.Euler(c.rot[0], c.rot[1], c.rot[2])).add(c.center);
});
const coById = id => COMPANIES.find(c => c.id === id);

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
    if (v.distanceToSquared(g.sysPos) < 420 * 420) continue;   /* a clear bubble round the company's star */
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

/* A beam is one shared tube, bent on the graphics chip between three
   points it is handed each frame — so it stays attached to worlds that move. */
const BEAM_VERT = /* glsl */`
attribute vec2 aTA;
uniform vec3 uA;
uniform vec3 uM;
uniform vec3 uB;
uniform float uR;
varying vec2 vUv;
void main(){
  float t = aTA.x, s = 1.0 - t;
  vec3 p = s * s * uA + 2.0 * s * t * uM + t * t * uB;
  vec3 T = normalize(2.0 * s * (uM - uA) + 2.0 * t * (uB - uM) + vec3(1e-5));
  vec3 up = abs(T.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 N = normalize(cross(T, up));
  vec3 Bn = cross(T, N);
  vec3 pos = p + (N * cos(aTA.y) + Bn * sin(aTA.y)) * uR;
  vUv = vec2(t, 0.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;
let TUBE = null;
function tubeGeo() {
  if (TUBE) return TUBE;
  const SEG = 56, RAD = 6, ta = [], idx = [];
  for (let i = 0; i <= SEG; i++) for (let j = 0; j <= RAD; j++) ta.push(i / SEG, j / RAD * Math.PI * 2);
  for (let i = 0; i < SEG; i++) for (let j = 0; j < RAD; j++) {
    const a = i * (RAD + 1) + j, b = a + RAD + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  TUBE = new THREE.BufferGeometry();
  TUBE.setAttribute('aTA', new THREE.Float32BufferAttribute(ta, 2));
  TUBE.setAttribute('position', new THREE.Float32BufferAttribute(new Array((SEG + 1) * (RAD + 1) * 3).fill(0), 3));
  TUBE.setIndex(idx);
  return TUBE;
}
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
/* Klever keeps Addis Ababa's time (UTC+3, no daylight saving), whatever the
   phone's clock zone: every hour, date and midnight here is Addis's. */
const ADDIS_MS = 3 * 3600e3;
const addisOf = d => new Date(d.getTime() + ADDIS_MS);   /* read with getUTC* */
function hhmm(d) { const a = addisOf(d); return ('0' + a.getUTCHours()).slice(-2) + ':' + ('0' + a.getUTCMinutes()).slice(-2); }
function bullets(s) { return String(s || '').replace(/^[ \t]*[*-][ \t]+/gm, '• '); }
function hash(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
}
function setAttr(e, k, v) { if (e.getAttribute(k) !== v) e.setAttribute(k, v); }

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
  const PR0 = pr;
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
  /* the track is a slider for a keyboard and a screen reader too: the
     arrows move a quarter of an hour, Home goes to six in the morning,
     End comes back to now */
  track.tabIndex = 0;
  track.setAttribute('role', 'slider');
  track.setAttribute('aria-label', s('timeline', lang === 'am' ? 'የቀኑ ሰዓት' : 'Time of day'));
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
  const skyRT = paintSky(renderer, scene, 0.5);
  const starMat = makeStars(scene, small ? 5000 : 7500, 30000, pr);
  /* a few stars bright enough to catch the lens; like the rest they are
     at infinity, so they travel with the camera */
  const bright = makeBrightStars(small ? 50 : 80, 24000);
  scene.add(bright);

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
  const lineMats = [], drawn = [];
  function circle(R, color, op, center, euler, parent, mats) {
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
    (mats || lineMats).push(m);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), m);
    (parent || klever).add(line);
    drawn.push(line.geometry);
    return line;
  }

  /* the asteroid belt, beyond the outermost department */
  const belt = makeBelt({ count: small ? 1000 : 2200, inner: 75, outer: 80.5, thick: 1.3, size: BS * 0.5, dust: small ? 2500 : 5000, center: sunPos });
  klever.add(belt.mesh);
  klever.add(belt.dust);

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
  /* who is in each department, and what they file: neither changes during
     the day, so it is worked out once rather than every frame */
  const deptIds = {}, deptReps = {};
  DEPTS.forEach(d => {
    deptIds[d.key] = new Set(byDept[d.key].map(p => p.id));
    deptReps[d.key] = due.filter(r => deptIds[d.key].has(r.person));
  });
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
    /* the moons' orbits travel with their planet */
    const shell = new THREE.Group();
    shell.position.copy(pos);
    klever.add(shell);
    const lab = el('button', 'obs3d-label uni-planet');
    lab.type = 'button';
    const dot = el('i');
    lab.appendChild(dot);
    lab.appendChild(document.createTextNode(L(d)));
    lab.style.color = d.color;
    lab.onclick = () => pick({ kind: 'dept', id: d.key });
    labels.appendChild(lab);
    /* inner worlds go round faster, as they do round a real star */
    planets[d.key] = { d, pos, r, w, lab, dot, shell, state: null,
                       a0: d.angle + TURN, om: 6.5 / Math.pow(d.orbit, 1.5) };
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
      circle(R, d.color, 0.09, null, e, P.shell);
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
        nodes[p.id] = { id: p.id, pos, r, w, pick: w.surf, marker, lab, person: p, dept: d, state: null,
                        P, R, e, a0: a, om: (tx > 0 ? 0.11 : 0.07) * (1 + (h % 7) * 0.03) };
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
      const u = { uColor: { value: new THREE.Color(STATUS.pending.color) }, uState: { value: 0 },
                  uTime: { value: 0 }, uArrive: { value: 1 }, uFade: { value: 0 }, uDim: { value: 1 },
                  uA: { value: new THREE.Vector3() }, uM: { value: new THREE.Vector3() }, uB: { value: new THREE.Vector3() },
                  uR: { value: 0.055 * BS } };
      const mesh = new THREE.Mesh(tubeGeo(), new THREE.ShaderMaterial({
        vertexShader: BEAM_VERT, fragmentShader: BEAM_FRAG, uniforms: u,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      }));
      mesh.frustumCulled = false;
      klever.add(mesh);
      beams.push({ r, to: t, A, B, mesh, u, state: 'pending', litAt: -1e9, pulseAt: 0 });
    });
  });

  /* the day's money */
  const flows = FLOWS.map(f => {
    const A = where(f.from), B = where(f.to);
    const curve = new THREE.QuadraticBezierCurve3(A.clone(), A.clone(), B.clone());
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
    return { f, A, B, curve, pts, pm, n, lab, amount: 0, show: 0 };
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
    lg.attributes.position.setUsage(THREE.DynamicDrawUsage);
    /* the dashes are measured along the line; the two distances (0 and its
       length) are rewritten in place each frame rather than handed a new
       buffer, as computeLineDistances() would */
    const ld = new THREE.BufferAttribute(new Float32Array(2), 1).setUsage(THREE.DynamicDrawUsage);
    lg.setAttribute('lineDistance', ld);
    const lmat = new THREE.LineDashedMaterial({ color: 0x5fe0c6, dashSize: 1.2, gapSize: 1.6, transparent: true, opacity: 0 });
    const line = new THREE.Line(lg, lmat);
    line.frustumCulled = false;
    klever.add(line);
    const lab = el('button', 'obs3d-label uni-agent');
    lab.type = 'button';
    lab.textContent = (window.KleverOrbit && window.KleverOrbit.agents[id]) ? L(window.KleverOrbit.agents[id]) : id;
    lab.onclick = () => pick({ kind: 'agent', id });
    labels.appendChild(lab);
    return { id, w, glow, line, ld, lm: lmat, lab, a0: i / arr.length * TAU, heat: 'none' };
  });

  /* ---------- the other four companies ---------- */
  const CREW_LOOK = [
    { type: 1, pal: ['#1d6a8a', '#7b8f52', '#b39468', '#ece4d2'], rim: '#7fd8ff', clouds: true },
    { type: 0, pal: ['#e6ecff', '#a9b8f0', '#4a58a0', '#ffffff'], rim: '#9fb4ff' }
  ];
  const minors = {};
  COMPANIES.filter(co => !co.live).forEach((co, ci) => {
    const g = new THREE.Group();
    g.visible = false;
    scene.add(g);
    const c0 = co.sysPos, mats = [];
    const sR = (co.head ? 6 : 4.2) * (small ? 1.2 : 1);
    const star = makeSun(sR);
    [star.mesh, star.corona, star.haze].forEach(o => { o.position.copy(c0); g.add(o); });
    star.mesh.userData.pick = { kind: 'head', id: co.id };
    const ws = [];
    const crew = (co.crew || []).map((p, i) => {
      const orbit = 22 + i * 12, a = 0.9 + i * 2.2;
      const pos = c0.clone().add(new THREE.Vector3(Math.cos(a) * orbit, 0, Math.sin(a) * orbit));
      const look = CREW_LOOK[i % CREW_LOOK.length];
      const r = 2.4 * BS;
      const w = makeWorld(Object.assign({ r, seed: 70 + ci * 9 + i, rimI: 0.7, tilt: 0.35, spin: 0.05, segs: 64, sun: c0 }, look));
      w.group.position.copy(pos);
      w.surf.userData.pick = { kind: 'crew', id: co.id + ':' + i };
      g.add(w.group);
      ws.push(w);
      circle(orbit, '#9fd0ff', 0.14, c0, null, g, mats);
      const lab = el('button', 'obs3d-label uni-person', L(p));
      lab.type = 'button';
      lab.onclick = () => pick({ kind: 'crew', id: co.id + ':' + i });
      labels.appendChild(lab);
      return { p, pos, r, w, lab, orbit, a0: a, om: 6.5 / Math.pow(orbit, 1.5) };
    });
    const headLab = el('button', 'obs3d-label uni-person uni-sun', co.head ? L(co.head) : s('noOne', 'No one on file yet'));
    headLab.type = 'button';
    headLab.onclick = () => pick({ kind: 'head', id: co.id });
    labels.appendChild(headLab);

    /* what reaches it from Klever today, arriving from Klever's side of the sky */
    let feed = null;
    if (co.id === 'groupfinance' || co.id === 'rovestone') {
      const toK = new THREE.Vector3().sub(c0).setY(0).normalize();
      const A = c0.clone().addScaledVector(toK, 64 * (small ? 1.2 : 1)).add(new THREE.Vector3(0, 14, 0));
      const mid = A.clone().add(c0).multiplyScalar(0.5).add(new THREE.Vector3(0, 12, 0));
      const curve = new THREE.QuadraticBezierCurve3(A, mid, c0.clone());
      const n = 30;
      const pg = new THREE.BufferGeometry();
      pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      const pm = new THREE.PointsMaterial({ color: new THREE.Color(co.id === 'rovestone' ? '#9be7a0' : '#5fe0c6'), size: 1.4 * BS,
        map: glowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0.35)'), transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false });
      const pts = new THREE.Points(pg, pm);
      pts.frustumCulled = false;
      g.add(pts);
      const lab = el('div', 'uni-amt uni-feed');
      labels.appendChild(lab);
      feed = { curve, pts, pm, n, lab, count: 0 };
    }
    const inner = (co.crew || []).length ? 33 : 17;
    const mbelt = makeBelt({ count: small ? 300 : 650, inner, outer: inner + 5, thick: 0.9, size: BS * 0.45, dust: small ? 700 : 1400, center: c0 });
    g.add(mbelt.mesh);
    g.add(mbelt.dust);
    minors[co.id] = { co, g, c0, sR, star, crew, ws, mats, feed, headLab, belt: mbelt, f: 0 };
  });

  /* the same figures between the galaxies, seen from the group */
  const links = ['groupfinance', 'rovestone'].map(id => {
    const co = coById(id);
    const A = COMPANIES[0].center.clone(), B = co.center.clone();
    const mid = A.clone().add(B).multiplyScalar(0.5);
    mid.y += A.distanceTo(B) * 0.22;
    const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
    const n = 48;
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const pm = new THREE.PointsMaterial({ color: new THREE.Color(id === 'rovestone' ? '#9be7a0' : '#5fe0c6'), size: 4,
      sizeAttenuation: false, map: glowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0.35)'), transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false });
    const pts = new THREE.Points(pg, pm);
    pts.frustumCulled = false;
    scene.add(pts);
    const lab = el('div', 'uni-amt uni-feed');
    labels.appendChild(lab);
    return { id, curve, pts, pm, n, lab };
  });

  /* a ring of light where a report has just been filed */
  const pulses = [];
  for (let i = 0; i < 14; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTexture(), transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: 0 }));
    sp.visible = false;
    klever.add(sp);
    pulses.push({ sp, t0: -1, r: 1, at: null });
  }
  let pulseI = 0;
  function flash(at, r, color, now) {
    const pu = pulses[pulseI++ % pulses.length];
    pu.at = at; pu.r = r; pu.t0 = now;
    pu.sp.material.color.set(color);
    pu.sp.visible = true;
  }

  /* everything the loop walks over, gathered once into plain lists */
  const planetList = DEPTS.map(d => planets[d.key]);
  const nodeList = Object.values(nodes);
  const labNodes = nodeList.filter(n => n.lab);
  const moonList = nodeList.filter(n => n.P);
  const markerNodes = nodeList.filter(n => n.marker);
  const instList = Object.values(insts);
  const minorList = Object.values(minors);

  /* ---------- the day ---------- */
  const clock = opts.clock || (() => new Date());
  /* Addis midnight of the clock's day */
  const today0 = () => { const a = addisOf(clock());
    return new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate()) - ADDIS_MS); };
  let D = { filings: [], findings: [], instructions: [], dayStart: today0(), now: clock() };
  let T = D.now.getTime(), mode = 'live', playFrom = 0, playT0 = 0, lastTick = 0;
  const PLAY_MS = 24000;

  function deadline(r) {
    const p = String(r.dueTime || '17:30').split(':');
    return D.dayStart.getTime() + (Number(p[0]) * 60 + Number(p[1])) * 60000;
  }
  /* The filing that counts for today: the ledger's window — a daily report
     only today, a weekly one from six days before, a monthly one from seven
     — and by the report's owner (the Chairman may file on their behalf). */
  const WINDOW = { daily: 0, weekly: 6, monthly: 7 };
  function filingOf(r, t) {
    const from = D.dayStart.getTime() - (WINDOW[r.cadence] || 0) * 864e5;
    for (const f of D.filings) {
      const ft = f.at.getTime();
      if (f.report === r.id && (!f.person || f.person === r.person) && ft >= from && ft <= t) return f;
    }
    return null;
  }
  function stateOf(r, t) {
    const f = filingOf(r, t);
    if (f) return f.at.getTime() <= deadline(r) ? 'on' : 'late';
    return t > deadline(r) ? 'missing' : 'pending';
  }
  function lastValues(reportId, t) {
    let v = null;
    /* today's figures only: the streams are the day's money and output */
    const from = D.dayStart.getTime();
    for (const f of D.filings) if (f.report === reportId && f.at.getTime() >= from && f.at.getTime() <= t) v = f.values || {};
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
  const dayName = d => { const a = addisOf(d); return DAYS[lang][a.getUTCDay()] + ' ' + a.getUTCDate() + ' ' + MONTHS[lang][a.getUTCMonth()]; };
  const shortDate = ymd => {
    const p = String(ymd || '').split('-');
    return p.length === 3 ? Number(p[2]) + ' ' + MONTHS[lang][Number(p[1]) - 1].slice(0, lang === 'am' ? 4 : 3) : String(ymd || '');
  };
  const ymdOf = d => { const a = addisOf(d); return a.getUTCFullYear() + '-' + ('0' + (a.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + a.getUTCDate()).slice(-2); };
  let dayText = '';
  const kidan = { reps: due.filter(r => /Kidan/.test(r.toEn || '')), filed: 0, pay: null }, rove = { m2: null };
  const STATE_N = { pending: 0, on: 1, late: 2, missing: 3 };

  /* This runs once a second, and every frame while the day replays, so it
     writes to the page only what has actually changed: rewriting a word
     with the same word still makes the browser redo its layout. */
  let tPct = '';
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
        if ((st === 'on' || st === 'late') && b.state !== 'on' && b.state !== 'late') {
          /* with motion reduced a filing simply shows: no light racing out, no ring */
          if (reduce || (mode === 'live' && !b.seen)) b.litAt = -1e9;
          else { b.litAt = now; b.pulseAt = now; }
        }
        b.state = st;
        b.u.uState.value = STATE_N[st];
        b.u.uColor.value.set(STATUS[st].color);
      }
      b.seen = true;
    });
    Object.keys(personWorst).forEach(id => {
      const n = nodes[id];
      if (!n || n.state === personWorst[id]) return;
      n.state = personWorst[id];
      tiersDirty = true;
      if (n.marker) n.marker.material.color.set(STATUS[n.state].color);
    });
    DEPTS.forEach(d => {
      const P = planets[d.key];
      const st = worstOf(deptReps[d.key]);
      if (P.shown && st === P.state) return;
      P.shown = true;
      P.state = st;
      P.dot.style.background = P.state ? STATUS[P.state].color : 'transparent';
      P.dot.style.boxShadow = P.state ? '0 0 8px ' + STATUS[P.state].color : 'none';
    });
    /* what reaches the other companies, from Klever's own reports */
    kidan.filed = kidan.reps.filter(r => filingOf(r, T)).length;
    const bv = lastValues('betty-daily', T), av = lastValues('amaha-daily', T);
    kidan.pay = bv && bv.pay_kidan !== '' && bv.pay_kidan != null ? num(bv.pay_kidan) : null;
    rove.m2 = av && av.p_rove !== '' && av.p_rove != null ? num(av.p_rove) : null;
    const toKidan = kidan.reps.length ? s('toKidan', 'Klever’s reports to Kidan') + ' · ' + kidan.filed + ' / ' + kidan.reps.length : '';
    const forRove = rove.m2 != null ? money(rove.m2) + ' m² · ' + s('forRove', 'made for Rovestone today') : '';
    if (minors.groupfinance) setText(minors.groupfinance.feed.lab, toKidan);
    if (minors.rovestone) setText(minors.rovestone.feed.lab, forRove);
    /* the stream to Kidan takes the colour of the worst of his reports */
    const kw = kidan.reps.length ? worstOf(kidan.reps) : 'pending';
    const kc = kw === 'on' ? '#5fe0c6' : STATUS[kw].color;
    if (minors.groupfinance) minors.groupfinance.feed.pm.color.set(kc);
    links.forEach(lk => {
      if (lk.id === 'groupfinance') lk.pm.color.set(kc);
      setText(lk.lab, lk.id === 'groupfinance' ? toKidan : forRove);
    });
    let inn = 0, out = 0;
    flows.forEach(fl => {
      const v = lastValues(fl.f.report, T);
      fl.amount = v ? num(v[fl.f.field]) : 0;
      if (fl.f.sum === 'in') inn += fl.amount; else if (fl.f.sum === 'out') out += fl.amount;
      /* a stream that stops keeps its last figure while it fades */
      if (fl.amount) setText(fl.lab, money(fl.amount) + ' ' + s('birr', 'Birr'));
    });
    dayText = dayName(D.dayStart) + '  ·  ' + s('filed', 'Filed') + ' ' + (on + late) + ' / ' + due.length +
      (late ? ' · ' + late + ' ' + s('late', 'late') : '') +
      (missing ? ' · ' + missing + ' ' + s('missing', 'missing') : '') +
      ((inn || out) ? '  ·  ' + s('in', 'in') + ' ' + money(inn) + ' · ' + s('out', 'out') + ' ' + money(out) : '');
    heading();
    const clockTxt = hhmm(new Date(T));
    setText(tLabel, clockTxt);
    const t0 = D.dayStart.getTime() + 6 * 3600e3, t1 = Math.max(t0 + 60e3, D.now.getTime());
    const u = Math.max(0, Math.min(1, (T - t0) / (t1 - t0)));
    const pct = (Math.round(u * 1000) / 10) + '%';
    if (pct !== tPct) { tPct = pct; fill.style.width = pct; head.style.left = pct; }
    const min = t => String(Math.round((t - D.dayStart.getTime()) / 60000));
    setAttr(track, 'aria-valuemin', min(Math.min(t0, T)));
    setAttr(track, 'aria-valuemax', min(t1));
    setAttr(track, 'aria-valuenow', min(T));
    setAttr(track, 'aria-valuetext', mode === 'live' ? clockTxt + ' · ' + s('live', 'Live') : clockTxt);
    live.classList.toggle('on', mode === 'live');
    setText(play, mode === 'play' ? '❚❚' : '▶');
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
    if (level !== 'company') goCompany(cur);
  };
  function goLive() { mode = 'live'; D.now = clock(); T = D.now.getTime(); applyDay(performance.now()); }
  live.onclick = goLive;
  track.addEventListener('keydown', e => {
    const t0 = D.dayStart.getTime() + 6 * 3600e3, t1 = Math.max(t0 + 60e3, D.now.getTime());
    let t;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') t = T - 15 * 60e3;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') t = T + 15 * 60e3;
    else if (e.key === 'Home') t = t0;
    else if (e.key === 'End') t = t1;
    else return;
    e.preventDefault();
    if (t >= t1) { goLive(); return; }
    T = Math.max(Math.min(t0, T), t);
    mode = 'scrub';
    applyDay(performance.now());
  });

  function applyAgents() {
    const find = {};
    (D.findings || []).forEach(f => { find[f.id] = f.text || ''; });
    sats.forEach(st => {
      const h = window.KleverOrbit ? window.KleverOrbit.heatOf(find[st.id]) : 'none';
      st.heat = h;
      st.w.rimU.uColor.value.set(HEAT[h]);
      st.glow.material.color.set(HEAT[h]);
      st.lm.color.set(h === 'loud' ? '#ff7a5c' : '#5fe0c6');
      const cls = 'obs3d-label uni-agent ' + h;
      if (st.lab.className !== cls) { st.lab.className = cls; remeasure(st.lab); }
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
  /* what Klever's reports say reaches another company today */
  function feedRows(cid) {
    if (cid === 'groupfinance') {
      if (!kidan.reps.length && kidan.pay == null) return;
      sheet.appendChild(el('div', 'obs-said-k', s('fromKlever', 'From Klever today') +
        (kidan.reps.length ? ' · ' + kidan.filed + ' / ' + kidan.reps.length : '')));
      const list = el('div', 'uni-reps');
      kidan.reps.forEach(r => {
        const st = stateOf(r, T), f = filingOf(r, T);
        const who = people.find(x => x.id === r.person);
        repRow(list, st, (who ? short(who) + ' · ' : '') + L(r), f ? hhmm(f.at) : L(STATUS[st]));
      });
      const row = el('div', 'uni-rep');
      const dot = el('i'); dot.style.background = '#ffc75e';
      row.appendChild(dot);
      row.appendChild(el('span', 'uni-rep-n', s('payKidan', 'Payments over 50,000 sent to Kidan — Finance’s report')));
      row.appendChild(el('span', 'uni-rep-t', kidan.pay != null ? money(kidan.pay) : s('notReported', 'not reported')));
      list.appendChild(row);
      sheet.appendChild(list);
    } else if (cid === 'rovestone') {
      sheet.appendChild(el('div', 'obs-said-k', s('fromKlever', 'From Klever today')));
      const list = el('div', 'uni-reps');
      const row = el('div', 'uni-rep');
      const dot = el('i'); dot.style.background = '#9be7a0';
      row.appendChild(dot);
      row.appendChild(el('span', 'uni-rep-n', s('roveM2', 'm² made for Rovestone — Amaha’s report')));
      row.appendChild(el('span', 'uni-rep-t', rove.m2 != null ? money(rove.m2) + ' m²' : s('notReported', 'not reported')));
      list.appendChild(row);
      sheet.appendChild(list);
    }
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
    } else if (k === 'head' || k === 'crew') {
      const [cid, idx] = String(id).split(':');
      const m = minors[cid], co = m.co;
      const who = k === 'head' ? co.head : co.crew[+idx];
      sheetHead(L(co), 'none', s('coOff', 'not connected yet'), who ? L(who) : L(co),
                who ? (lang === 'am' ? who.roleAm : who.roleEn) : s('noOneSub', 'No one from this company is on file yet.'));
      feedRows(cid);
      sheet.appendChild(el('p', 'obs-said empty', s('coOffSub', 'No reports come from here yet.')));
    } else if (k === 'company') {
      const co = COMPANIES.find(c => c.id === id);
      sheetHead(s('group', 'Amare Holdings'), co.live ? 'quiet' : 'none',
                co.live ? s('coLive', 'live') : s('coOff', 'not connected yet'), L(co),
                co.live ? s('coLiveSub', 'Every person, every report and the day’s money, drawn from what was filed today.')
                        : s('coOffSub', 'No reports come from here yet. When its people file on the site, it lights up the way Klever does.'));
      if (!co.live) feedRows(co.id);
      {
        const go = el('button', 'obs-open', s('flyIn', 'Fly in'));
        go.type = 'button';
        go.onclick = () => { pick(null); goCompany(co.id); };
        sheet.appendChild(go);
      }
    }
    sheet.hidden = false;
    sheet.scrollTop = 0;
  }

  /* ---------- camera ---------- */
  let W = 0, H = 0, level = 'group', cur = 'klever', tween = null, offY = 0, offGoal = 0;
  /* whether someone has turned or zoomed the view since the last flight;
     if so, a change of window size leaves their view alone */
  let userMoved = false;
  controls.addEventListener('start', () => { userMoved = true; });
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
    views.klever = fitDisc(portrait ? 84 : 90, portrait ? 1.0 : 0.56, new THREE.Vector3(0, 2, 0), 14);
    Object.values(minors).forEach(m => {
      views[m.co.id] = fitDisc((m.crew.length ? 44 : 30) * (portrait ? 1.1 : 1), portrait ? 1.0 : 0.5,
                               m.c0.clone().add(new THREE.Vector3(0, 2, 0)), 10);
    });
    views.company = views[cur];
    const [y0, y1] = band();
    offGoal = H / 2 - (y0 + y1) / 2;
  }
  /* A flight. Distance falls (or rises) exponentially and the heading turns
     smoothly; a long one also swings round as it goes and widens the lens
     at its fastest, and a jump between companies climbs out into the
     group and comes back down rather than skimming between galaxies. */
  function flyTo(v, ms, lead) {
    const o0 = camera.position.clone().sub(controls.target), o1 = v.pos.clone().sub(v.target);
    const travel = controls.target.distanceTo(v.target), reach = Math.max(o0.length(), o1.length());
    const long = ms > 3000;
    follow = v.live || null;
    tween = { t0: controls.target.clone(), t1: v.live || v.target.clone(), lead: lead || 1,
              hop: travel > reach * 8 && travel > 2000 ? travel * 0.9 : 0,
              swing: long ? 0.55 : 0, kick: long ? 11 : 0,
              d0: Math.log(o0.length()), d1: Math.log(o1.length()),
              n0: o0.clone().normalize(), q: new THREE.Quaternion().setFromUnitVectors(o0.clone().normalize(), o1.clone().normalize()),
              start: performance.now(), ms: reduce ? 1 : ms };
    controls.enabled = false;
    userMoved = false;
  }
  const qI = new THREE.Quaternion(), qK = new THREE.Quaternion();
  const Y_AXIS = new THREE.Vector3(0, 1, 0), lastF = new THREE.Vector3(), tmpF = new THREE.Vector3();
  let follow = null;
  function minorText(id) {
    const bits = [s('coOff', 'not connected yet')];
    if (id === 'groupfinance') {
      if (kidan.reps.length) bits.push(s('toKidan', 'Klever’s reports to Kidan') + ' ' + kidan.filed + ' / ' + kidan.reps.length);
      if (kidan.pay != null) bits.push(s('payKidanShort', 'payments over 50,000') + ' ' + money(kidan.pay));
    } else if (id === 'rovestone') {
      if (rove.m2 != null) bits.push(money(rove.m2) + ' m² ' + s('forRove', 'made for Rovestone today'));
    } else bits.push(s('noOne', 'No one on file yet'));
    return dayName(D.dayStart) + '  ·  ' + bits.join('  ·  ');
  }
  function heading() {
    const co = coById(cur);
    setText(cCo, L(co));
    setText(title, level === 'group' ? s('group', 'Amare Holdings') : cur === 'klever' ? s('title', 'Klever, today') : L(co));
    setText(stats, level === 'group' ? s('groupStats', 'Five companies · one reporting live') : cur === 'klever' ? dayText : minorText(cur));
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
  function goCompany(id) {
    if (id) cur = id;
    level = 'company';
    computeViews();
    const far = camera.position.distanceTo(views.company.target) > 5000;
    flyTo(views.company, far ? 5600 : 2200, far ? 2.2 : 1);
    controls.minDistance = 3; controls.maxDistance = views.company.d * 2.5;
    controls.autoRotateSpeed = 0.18;
    wrap.classList.add('at-company'); wrap.classList.remove('at-group');
    heading();
  }
  cGroup.onclick = () => { pick(null); goGroup(); };
  cCo.onclick = () => { pick(null); goCompany(cur); };

  const satPos = st => st.w.group.position;
  function pick(p) {
    picked = p;
    drawSheet();
    computeViews();
    if (!p) {
      follow = null;
      if (level === 'company') { computeViews(); flyTo(views.company, 1600); }
      return;
    }
    if (p.kind === 'company') return;
    const home = p.kind === 'head' || p.kind === 'crew' ? String(p.id).split(':')[0] : 'klever';
    if (level !== 'company' || cur !== home) {
      level = 'company'; cur = home; controls.minDistance = 3;
      wrap.classList.add('at-company'); wrap.classList.remove('at-group'); heading();
    }
    let P, dist, sunAt = sunPos, live = null;
    if (p.kind === 'head') { const m = minors[p.id]; P = m.c0.clone(); dist = m.sR * 6.5; sunAt = m.c0; }
    else if (p.kind === 'crew') { const [cid, i] = p.id.split(':'); const m = minors[cid], c = m.crew[+i]; live = c.pos; dist = c.r * 7 + 10; sunAt = m.c0; }
    else if (p.kind === 'person') { const n = nodes[p.id]; if (p.id === 'chairman') P = n.pos.clone(); else live = n.pos; dist = p.id === 'chairman' ? SUN_R * 6.5 : Math.max(8, n.r * 13); }
    else if (p.kind === 'dept') { const pl = planets[p.id]; live = pl.pos; dist = pl.r * 6 + 16 * BS; }
    else if (p.kind === 'inst') { const i = insts[p.id]; P = i.pos.clone(); dist = i.r * 6 + 8; }
    else { live = satPos(sats.find(x => x.id === p.id)); dist = 9 * BS; }
    if (live) P = live.clone();
    /* come at it from between the camera and the sun, so its lit face shows */
    const toCam = camera.position.clone().sub(P).setY(0).normalize();
    const toSun = P.distanceToSquared(sunAt) > 4 ? sunAt.clone().sub(P).setY(0).normalize() : toCam.clone();
    const dir = toSun.multiplyScalar(0.55).add(toCam.multiplyScalar(0.45)).normalize()
      .multiplyScalar(0.84).add(new THREE.Vector3(0, 0.5, 0)).normalize();
    flyTo({ pos: P.clone().addScaledVector(dir, dist * (H > W ? 1.35 : 1)), target: P, live }, 1700);
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
      Object.values(minors).forEach(m => { if (m.g.visible) { objs.push(m.star.mesh); m.crew.forEach(c => objs.push(c.w.surf)); } });
      const hits = ray.intersectObjects(objs, false);
      if (hits.length) { pick(hits[0].object.userData.pick); return; }
    } else {
      let best = null, bd = 70;
      coMarks.forEach(c => {
        const v = c.pos.clone().project(camera);
        const d = Math.hypot((v.x + 1) / 2 * W - e.clientX, (1 - v.y) / 2 * H - e.clientY);
        if (d < bd) { bd = d; best = c; }
      });
      if (best) { if (!picked) goCompany(best.co.id); else pick({ kind: 'company', id: best.co.id }); return; }
    }
    if (picked) pick(null);
  });

  /* ---------- names over the world ---------- */
  const tmp = new THREE.Vector3(), camUp = new THREE.Vector3(), anchorV = new THREE.Vector3(), curveV = new THREE.Vector3();
  const scr = { x: 0, y: 0, z: 0 };
  function screen(v) {
    tmp.copy(v).project(camera);
    scr.x = (tmp.x + 1) / 2 * W; scr.y = (1 - tmp.y) / 2 * H; scr.z = tmp.z;
    return scr;
  }

  /* Some sixty names are placed every frame. Reading a name's size just
     after moving another makes the browser lay the page out again — once
     per name, every frame — and writing a style that has not changed still
     makes it look again. So each name keeps what was last written to it and
     its measured size; a name is measured only when its words change (or
     the fonts arrive, or the window changes), all measuring is done before
     any name is moved, and nothing is written twice. A hidden name is also
     made invisible to the keyboard and to a screen reader, once it has
     faded (the visibility change waits for the fade). */
  const LS = new Map();
  function ls(lab) {
    let st = LS.get(lab);
    if (!st) {
      st = { w: 0, h: 0, a: -1, x: NaN, y: NaN };
      lab.style.transition = 'opacity .25s ease, visibility .25s';
      LS.set(lab, st);
    }
    return st;
  }
  function measureLabels() {
    for (const lab of labels.children) {
      const st = ls(lab);
      if (st.w) continue;
      const w = lab.offsetWidth;
      if (w) { st.w = w; st.h = lab.offsetHeight || 18; }
    }
  }
  function remeasure(lab) {
    if (lab) { const st = LS.get(lab); if (st) st.w = 0; }
    else LS.forEach(st => { st.w = 0; });
  }
  function setText(e, t) {
    if (e.textContent === t) return;
    e.textContent = t;
    remeasure(e);
  }
  function setAlpha(lab, st, a) {
    if (st.a === a) return;
    st.a = a;
    lab.style.opacity = String(a);
    lab.style.pointerEvents = a > 0.5 ? 'auto' : 'none';
    lab.style.visibility = a > 0 ? 'visible' : 'hidden';
  }
  function hide(lab) { setAlpha(lab, ls(lab), 0); }

  /* the boxes already taken this frame, four numbers each */
  const takenA = [], takenB = [];
  function clash(taken, x0, y0, x1, y1) {
    for (let i = 0; i < taken.length; i += 4) {
      if (x0 < taken[i + 2] && x1 > taken[i] && y0 < taken[i + 3] && y1 > taken[i + 1]) return true;
    }
    return false;
  }
  /* a name sits just below its world, whatever the world's size */
  const below = (pos, r) => anchorV.copy(pos).addScaledVector(camUp, -r * 1.25);
  function place(lab, v, dy, taken, prio, soft) {
    const p = screen(v), st = ls(lab);
    if (p.z > 1 || p.x < -40 || p.x > W + 40 || p.y < -20 || p.y > H + 20) {
      if (soft) return false;
      setAlpha(lab, st, 0); return false;
    }
    const w = st.w || 60, h = st.h || 18;
    const x = Math.max(6 + w / 2, Math.min(W - 6 - w / 2, p.x));
    let y = p.y + dy, a = 1;
    if (clash(taken, x - w / 2, y, x + w / 2, y + h)) {
      const up = p.y - dy - h - 8;
      if (!clash(taken, x - w / 2, up, x + w / 2, up + h)) y = up;
      else if (soft) return false;
      else a = prio ? 0.35 : 0;
    }
    taken.push(x - w / 2, y, x + w / 2, y + h);
    setAlpha(lab, st, a);
    const rx = Math.round(x), ry = Math.round(y);
    if (rx !== st.x || ry !== st.y) {
      st.x = rx; st.y = ry;
      lab.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translateX(-50%)';
    }
    return a === 1;
  }
  /* an amount looks for room along its own stream before it gives up */
  const ALONG_FEED = [0.5, 0.35, 0.65], ALONG_LINK = [0.5, 0.4, 0.6], ALONG_FLOW = [0.5, 0.36, 0.64, 0.26, 0.74];
  function placeAlong(lab, curve, us, taken) {
    for (let i = 0; i < us.length; i++) {
      if (place(lab, curve.getPoint(us[i], curveV), -8, taken, false, true)) return true;
    }
    return false;
  }
  const placeNode = (n, taken, prio) => place(n.lab, below(n.pos, n.r), 3, taken, prio);

  /* the Chairman and anyone late or missing first, then the leads, then
     everyone else; sorted again only when someone's state changes */
  const tier = n => n.id === 'chairman' ? 0 : (n.state === 'missing' || n.state === 'late') ? 1
    : (n.person && isLead(n.person)) ? 2 : 3;
  const tiers = [[], [], [], []];
  let tiersDirty = true;
  function sortTiers() {
    tiers.forEach(t => { t.length = 0; });
    labNodes.forEach(n => tiers[tier(n)].push(n));
    tiersDirty = false;
  }

  function placeLabels(kFade, near) {
    measureLabels();
    const taken = takenA;
    taken.length = 0;
    const showCo = near < 0.3;
    /* the other companies' systems, when the camera is in one */
    minorList.forEach(m => {
      const on = m.f > 0.5;
      const pk = picked && (picked.kind === 'head' || picked.kind === 'crew') ? picked : null;
      if (on) {
        place(m.headLab, below(m.c0, m.sR), 3, taken, true);
        m.crew.forEach(c => place(c.lab, below(c.pos, c.r), 3, taken, true));
        if (m.feed && m.feed.lab.textContent && !pk) {
          if (!placeAlong(m.feed.lab, m.feed.curve, ALONG_FEED, taken)) hide(m.feed.lab);
        } else if (m.feed) hide(m.feed.lab);
      } else {
        hide(m.headLab);
        m.crew.forEach(c => hide(c.lab));
        if (m.feed) hide(m.feed.lab);
      }
    });
    links.forEach(lk => {
      if (showCo && !picked && lk.lab.textContent) {
        if (!placeAlong(lk.lab, lk.curve, ALONG_LINK, taken)) hide(lk.lab);
      } else hide(lk.lab);
    });
    coMarks.forEach(c => {
      if (showCo && !picked) place(c.lab, anchorV.copy(c.pos).addScaledVector(camUp, -c.co.radius * 0.6), 0, taken, true);
      else hide(c.lab);
    });
    if (kFade < 0.5 || (picked && picked.kind !== 'company')) {
      /* something is picked: its name, and the names of what it touches */
      const nearIds = {};
      let keepPlanet = null, keepInst = null, keepSat = null;
      if (picked && kFade >= 0.5) {
        if (picked.kind === 'person') {
          beams.forEach(b => { if (b.r.person === picked.id) nearIds[b.to] = 1; if (b.to === picked.id) nearIds[b.r.person] = 1; });
          nearIds[picked.id] = 2;
        } else if (picked.kind === 'dept') {
          byDept[picked.id].forEach(p => { nearIds[p.id] = 1; });
          keepPlanet = picked.id;
        } else if (picked.kind === 'inst') keepInst = picked.id;
        else if (picked.kind === 'agent') { keepSat = picked.id; keepPlanet = WATCH[picked.id]; }
      }
      const mine = takenB;
      mine.length = 0;
      labNodes.forEach(n => { if (nearIds[n.id] === 2) placeNode(n, mine, true); });
      labNodes.forEach(n => { if (nearIds[n.id] === 1) placeNode(n, mine, false); else if (nearIds[n.id] !== 2) hide(n.lab); });
      planetList.forEach(pl => { if (pl.d.key === keepPlanet) place(pl.lab, below(pl.pos, pl.r), 3, mine, true); else hide(pl.lab); });
      instList.forEach(i => { if (i.it.id === keepInst) place(i.lab, below(i.pos, i.r), 3, mine, true); else hide(i.lab); });
      sats.forEach(x => { if (x.id === keepSat) place(x.lab, below(satPos(x), 0.8 * BS), 3, mine, true); else hide(x.lab); });
      flows.forEach(f => hide(f.lab));
      return;
    }
    /* the Chairman and anyone late or missing first, then the leads, then
       the departments, the money, and everyone else if there is room */
    if (tiersDirty) sortTiers();
    tiers[0].forEach(n => placeNode(n, taken, true));
    planetList.forEach(pl => place(pl.lab, below(pl.pos, pl.r), 3, taken, true));
    instList.forEach(i => place(i.lab, below(i.pos, i.r), 3, taken, true));
    tiers[1].forEach(n => placeNode(n, taken, true));
    tiers[2].forEach(n => placeNode(n, taken, true));
    flows.forEach(f => {
      if (!f.amount || f.show < 0.5) { hide(f.lab); return; }
      if (!placeAlong(f.lab, f.curve, ALONG_FLOW, taken)) hide(f.lab);
    });
    tiers[3].forEach(n => placeNode(n, taken, false));
    /* on a phone the agents keep their colour but not their names */
    sats.forEach(x => { if (x.heat === 'loud' && W >= 600) place(x.lab, below(satPos(x), 0.8 * BS), 3, taken, false); else hide(x.lab); });
  }

  /* ---------- the loop ---------- */
  /* Point sizes in the shaders are counted in pixels of the picture, so they
     follow its resolution. The largest a galaxy's star may be drawn is kept
     the same size on the glass whatever the resolution, so a device that
     has had to drop resolution sees the same sky, not bigger stars. */
  function pointScale() {
    galU.uScale.value = H * pr / (2 * Math.tan(THREE.MathUtils.degToRad(45 / 2)));
    galU.uMax.value = 3.6 * pr / PR0;
    dustU.uMax.value = 140 * pr / PR0;
    starMat.uniforms.uPR.value = pr;
  }
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    renderer.setSize(W, H, false);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    composer.setSize(W, H);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    pointScale();
    remeasure();
    computeViews();
    /* refit the frame to the new shape only if nobody has taken the camera
       since the last flight; someone who has turned the view keeps it */
    if (!tween && !picked && !userMoved) {
      const v = level === 'group' ? views.group : views.company;
      camera.position.copy(v.pos); controls.target.copy(v.target);
    }
  }

  /* ---------- keeping up ---------- */
  /* A device that cannot keep up gives things up rather than stutter:
     first multisampling, then resolution, then bloom. The average time a
     frame takes is checked every two seconds; two slow checks in a row
     (under about 29 frames a second) give up one thing. Once — after half
     a minute comfortably fast — the last thing given up comes back, and if
     that proves too much it goes again for good. None of this touches the
     camera, and it watches the whole visit, not just its first seconds. */
  function setPR(p) {
    pr = p;
    renderer.setPixelRatio(p);
    composer.setPixelRatio(p);
    pointScale();
  }
  const MSAA0 = composer.renderTarget1.samples;
  function setSamples(n) {
    [composer.renderTarget1, composer.renderTarget2].forEach(t => { t.samples = n; t.dispose(); });
  }
  const STEPS = [
    { can: () => composer.renderTarget1.samples > 0, down: () => setSamples(0), up: () => setSamples(MSAA0) },
    { can: () => pr > 1, down: () => setPR(1), up: () => setPR(PR0) },
    { can: () => bloom.enabled, down: () => { bloom.enabled = false; }, up: () => { bloom.enabled = true; } }
  ];
  const pace = { sum: 0, n: 0, slow: 0, fast: 0, given: [], tookBack: false };
  function keepUp(ms) {
    if (ms > 400) return;                   /* a stall or a return to the tab, not the pace */
    pace.sum += ms; pace.n++;
    if (pace.sum < 2000) return;
    const avg = pace.sum / pace.n;
    pace.sum = 0; pace.n = 0;
    if (avg > 35) { pace.slow++; pace.fast = 0; }
    else if (avg < 20) { pace.fast++; pace.slow = 0; }
    else { pace.slow = 0; pace.fast = 0; }
    if (pace.slow >= 2) {
      pace.slow = 0;
      const step = STEPS.find(x => x.can());
      if (step) { step.down(); pace.given.push(step); }
    } else if (pace.fast >= 15 && pace.given.length && !pace.tookBack) {
      pace.fast = 0;
      pace.tookBack = true;
      pace.given.pop().up();
    }
  }

  const watchTarget = key => key === 'chairman' ? sunPos : planets[key].pos;
  const SAT_GLOW = { loud: 0.85, warm: 0.55, quiet: 0.3, none: 0.12 };
  let last = 0, raf = 0, alive = true, time = 0, frames = 0;
  let revealed = false, revealAt = 0, drawnDone = false, orbitT = 0;
  let lost = false;
  function frame(now) {
    if (!alive || lost) return;
    const ms = last ? now - last : 0;
    const dt = last ? Math.min(0.064, ms / 1000) : 0.016;
    last = now; time += dt;
    if (!reduce) orbitT += dt;
    /* with motion reduced, what moves by itself holds still: the stars'
       twinkle, the sun's surface, the clouds, the light along the beams,
       the agents on their orbit, the money along its streams */
    const at = reduce ? 0 : time, adt = reduce ? 0 : dt;

    frames++;
    if (frames > 60 && ms) keepUp(ms);

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
      const bump = Math.sin(Math.PI * k);
      camera.position.copy(tween.n0).applyQuaternion(qK)
        .multiplyScalar(Math.exp(tween.d0 + (tween.d1 - tween.d0) * k) + tween.hop * Math.pow(bump, 0.8))
        .applyAxisAngle(Y_AXIS, tween.swing * bump).add(controls.target);
      const fov = 45 + tween.kick * bump;
      if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
      if (u >= 1) {
        tween = null; controls.enabled = true;
        if (camera.fov !== 45) { camera.fov = 45; camera.updateProjectionMatrix(); }
        if (follow) lastF.copy(follow);
      }
    } else if (follow) {
      /* the camera keeps station on a world that moves */
      tmpF.copy(follow).sub(lastF);
      controls.target.add(tmpF);
      camera.position.add(tmpF);
      lastF.copy(follow);
    }
    starMat.userData.points.position.copy(camera.position);
    bright.position.copy(camera.position);
    starMat.uniforms.uTime.value = at;

    /* how far into Klever the camera is: 0 out among the galaxies, 1 in the system */
    const dK = camera.position.length();
    const kf = THREE.MathUtils.clamp(1 - (dK - 400) / 1400, 0, 1);
    /* how far into each other company's system the camera is */
    let near = kf;
    minorList.forEach(m => {
      const dm = camera.position.distanceTo(m.c0);
      m.f = THREE.MathUtils.clamp(1 - (dm - 300) / 1100, 0, 1);
      near = Math.max(near, m.f);
      m.g.visible = m.f > 0.01;
      if (!m.g.visible) return;
      m.star.u.uTime.value = at;
      m.star.corona.material.opacity = m.f;
      m.star.haze.material.opacity = m.f;
      m.ws.forEach(w => w.update(adt, at));
      m.belt.update(adt, m.f);
      m.crew.forEach(c => {
        const a = c.a0 + c.om * orbitT;
        c.pos.set(Math.cos(a) * c.orbit, 0, Math.sin(a) * c.orbit).add(m.c0);
        c.w.group.position.copy(c.pos);
      });
      m.mats.forEach(mm => { mm.opacity = m.f * mm.userData.base; });
      if (m.feed) {
        const has = m.co.id === 'groupfinance' ? kidan.reps.length > 0 : rove.m2 != null && rove.m2 > 0;
        m.feed.pm.opacity = m.f * (has ? 0.9 : 0);
        /* a stream with nothing in it is not drawn at all */
        m.feed.pts.visible = has;
        if (has) {
          const pos = m.feed.pts.geometry.attributes.position;
          for (let i = 0; i < m.feed.n; i++) {
            const p = m.feed.curve.getPoint(((at * 0.1) + i / m.feed.n) % 1, curveV);
            pos.setXYZ(i, p.x, p.y, p.z);
          }
          pos.needsUpdate = true;
        }
      }
    });
    links.forEach(lk => {
      const has = lk.id === 'groupfinance' ? kidan.reps.length > 0 : rove.m2 != null && rove.m2 > 0;
      lk.pm.opacity = has ? 0.85 * (1 - THREE.MathUtils.smoothstep(near, 0.05, 0.3)) : 0;
      lk.pts.visible = lk.pm.opacity > 0.01;
      if (!lk.pts.visible) return;
      const pos = lk.pts.geometry.attributes.position;
      for (let i = 0; i < lk.n; i++) {
        const p = lk.curve.getPoint(((at * 0.05) + i / lk.n) % 1, curveV);
        pos.setXYZ(i, p.x, p.y, p.z);
      }
      pos.needsUpdate = true;
    });
    galU.uFade.value = 1 - 0.62 * near;
    /* a glow that would fill the screen is not a glow any more but a fog:
       each fades out as it grows past a fraction of the frame, and one that
       has faded out entirely is not drawn */
    const frac = (size, dist) => size / (2 * Math.max(dist, 1) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    const shrink = (size, dist) => 1 - THREE.MathUtils.smoothstep(frac(size, dist), 0.18, 0.45);
    here.material.opacity = THREE.MathUtils.clamp((dK - 700) / 2500, 0, 1) * shrink(700, dK);
    here.visible = here.material.opacity > 0.004;
    coMarks.forEach(c => {
      const dc = camera.position.distanceTo(c.pos);
      c.core.material.opacity = 0.8 * shrink(c.co.core, dc);
      c.core.visible = c.core.material.opacity > 0.004;
    });

    klever.visible = kf > 0.01;
    /* the first arrival: orbits draw themselves, and the day's reports go
       out one after another */
    if (!revealed && kf > 0.6) {
      revealed = true;
      revealAt = now;
      if (!reduce) {
        let i = 0;
        beams.forEach(b => {
          if (b.state === 'on' || b.state === 'late') { b.litAt = now + 700 + i * 90; b.pulseAt = b.litAt; i++; }
        });
      }
    }
    const rv = reduce || !revealed ? (revealed ? 1 : 0) : THREE.MathUtils.clamp((now - revealAt) / 2200, 0, 1);
    if (rv < 1 || !drawnDone) {
      const cnt = Math.max(2, Math.ceil(181 * ease(rv)));
      drawn.forEach(g => g.setDrawRange(0, cnt));
      drawnDone = rv >= 1;
    }
    if (klever.visible) {
      belt.update(adt, kf);
      /* the worlds move: planets round the sun, moons round their planets */
      planetList.forEach(P => {
        const a = P.a0 + P.om * orbitT;
        P.pos.set(Math.cos(a) * P.d.orbit, 0, Math.sin(a) * P.d.orbit);
        P.w.group.position.copy(P.pos);
        P.shell.position.copy(P.pos);
      });
      moonList.forEach(n => {
        const a = n.a0 + n.om * orbitT;
        n.pos.set(Math.cos(a) * n.R, 0, Math.sin(a) * n.R).applyEuler(n.e).add(n.P.pos);
        n.w.group.position.copy(n.pos);
        if (n.marker) n.marker.position.copy(n.pos);
      });
      beams.forEach(b => {
        b.u.uA.value.copy(b.A);
        b.u.uB.value.copy(b.B);
        b.u.uM.value.copy(b.A).add(b.B).multiplyScalar(0.5).y += b.A.distanceTo(b.B) * 0.25 + 3;
        if (b.pulseAt && now >= b.pulseAt) {
          const n = nodes[b.r.person];
          flash(n ? n.pos : b.A, n ? n.r : 1, STATUS[b.state === 'late' ? 'late' : 'on'].color, now);
          b.pulseAt = 0;
        }
      });
      flows.forEach(fl => {
        fl.curve.v0.copy(fl.A);
        fl.curve.v2.copy(fl.B);
        fl.curve.v1.copy(fl.A).add(fl.B).multiplyScalar(0.5).y += fl.A.distanceTo(fl.B) * 0.28 + 6;
      });
      pulses.forEach(pu => {
        if (pu.t0 < 0) return;
        const u = (now - pu.t0) / 1100;
        if (u >= 1) { pu.t0 = -1; pu.sp.visible = false; return; }
        pu.sp.position.copy(pu.at);
        const sc = pu.r * (2.4 + 9 * ease(u));
        pu.sp.scale.set(sc, sc, 1);
        pu.sp.material.opacity = kf * Math.pow(1 - u, 1.6);
      });
      sun.u.uTime.value = at;
      sun.corona.material.opacity = kf;
      sun.haze.material.opacity = kf;
      worlds.forEach(w => w.update(adt, at));
      lineMats.forEach(m => { m.opacity = kf * m.userData.base; });
      markerNodes.forEach(n => {
        const st = n.state;
        n.marker.material.opacity = kf * (st === 'missing' ? (reduce ? 0.8 : 0.55 + 0.4 * Math.sin(time * 3 + n.pos.x))
          : st === 'pending' || !st ? 0.35 : 0.85);
      });
      const pp = picked && (picked.kind === 'person' || picked.kind === 'dept') ? picked : null;
      const inDept = pp && pp.kind === 'dept' ? deptIds[pp.id] : null;
      beams.forEach(b => {
        b.u.uTime.value = at;
        b.u.uFade.value = kf;
        b.u.uArrive.value = Math.min(1, (now - b.litAt) / 1400);
        let dim = 1;
        if (pp && pp.kind === 'person' && pp.id !== b.r.person && pp.id !== b.to) dim = 0.12;
        if (inDept && !inDept.has(b.r.person) && !inDept.has(b.to)) dim = 0.12;
        b.u.uDim.value = dim;
      });
      flows.forEach(fl => {
        const on = fl.amount > 0 ? 1 : 0;
        fl.show += (on - fl.show) * Math.min(1, dt * 3);
        fl.pm.opacity = fl.show * kf;
        /* no money reported, no stream drawn */
        fl.pts.visible = fl.pm.opacity > 0.004;
        if (!fl.pts.visible) return;
        const n = Math.max(4, Math.min(fl.n, Math.round(Math.log10(Math.max(10, fl.amount)) * 6)));
        const pos = fl.pts.geometry.attributes.position;
        for (let i = 0; i < fl.n; i++) {
          if (i >= n) { pos.setXYZ(i, 0, -9999, 0); continue; }
          const p = fl.curve.getPoint(((at * 0.12) + i / n) % 1, curveV);
          pos.setXYZ(i, p.x, p.y, p.z);
        }
        pos.needsUpdate = true;
      });
      instList.forEach(i => { i.extra.forEach(m => { m.opacity = kf * 0.9; }); });
      sats.forEach((st, i) => {
        const a = st.a0 + at * 0.012;
        const p = satPos(st);
        p.set(Math.cos(a) * SAT_R, SAT_Y + Math.sin(at * 0.5 + i) * 0.8, Math.sin(a) * SAT_R);
        st.glow.position.copy(p);
        st.glow.material.opacity = kf * SAT_GLOW[st.heat];
        const tgt = watchTarget(WATCH[st.id]);
        const lp = st.line.geometry.attributes.position;
        lp.setXYZ(0, p.x, p.y, p.z);
        lp.setXYZ(1, tgt.x, tgt.y, tgt.z);
        lp.needsUpdate = true;
        st.ld.setX(1, p.distanceTo(tgt));
        st.ld.needsUpdate = true;
        st.lm.opacity = kf * (st.heat === 'loud' ? 0.3 : 0.03);
      });

    }

    offY += (offGoal - offY) * Math.min(1, dt * 5);
    camera.setViewOffset(W, H, 0, offY, W, H);
    controls.autoRotate = !reduce && !picked;
    /* in flight the flight alone steers: the controls would clamp the
       distance to the destination's limits and pull the camera down into
       whatever lies between */
    if (tween) camera.lookAt(controls.target); else controls.update();
    camUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
    placeLabels(kf, near);
    if (opts.debug) window.__uni = { p: camera.position.toArray().map(Math.round), t: controls.target.toArray().map(Math.round), fov: camera.fov, kf, near, pr, bloom: bloom.enabled, samples: composer.renderTarget1.samples,
                                   target: [composer.renderTarget1.width, composer.renderTarget1.height], canvas: [canvas.width, canvas.height] };
    composer.render();
    raf = requestAnimationFrame(frame);
  }

  /* ---------- when the graphics chip is taken away ---------- */
  /* A phone takes the graphics chip back when another app wants it — the
     camera, a video call — and usually hands it back when this page is
     looked at again. So losing it only pauses the picture. If it has not
     come back within three seconds of the page being on screen, the page is
     told it is gone (and shows what it shows without 3D); if it does come
     back, the world is built again — by the page, if it offers to, or by
     reloading when the page is next on screen. */
  let lostTimer = 0, reloadOnShow = false;
  function waitForContext() {
    clearTimeout(lostTimer);
    if (!lost || document.hidden) return;
    lostTimer = setTimeout(() => { if (lost && alive && opts.onLost) opts.onLost(); }, 3000);
  }
  function onContextLost(e) {
    e.preventDefault();
    lost = true;
    cancelAnimationFrame(raf); raf = 0;
    waitForContext();
  }
  function onContextBack() {
    if (!alive || !lost) return;
    lost = false;
    clearTimeout(lostTimer);
    if (opts.onRestore) opts.onRestore();
    else if (document.hidden) reloadOnShow = true;
    else location.reload();
  }

  function onVis() {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; clearTimeout(lostTimer); return; }
    if (reloadOnShow) { location.reload(); return; }
    if (lost) { waitForContext(); return; }
    if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
  }
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('resize', resize);
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextBack);
  function onKey(e) { if (e.key === 'Escape' && picked) pick(null); }
  document.addEventListener('keydown', onKey);
  /* the names are measured again once the page's fonts have arrived */
  const onFonts = () => remeasure();
  if (document.fonts) {
    document.fonts.addEventListener('loadingdone', onFonts);
    document.fonts.ready.then(onFonts);
  }

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
  let introTimer = setTimeout(() => { if (level === 'group' && !picked) goCompany('klever'); }, reduce ? 0 : 2600);

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
      reloadOnShow = false;
      clearTimeout(introTimer);
      clearTimeout(lostTimer);
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextBack);
      if (document.fonts) document.fonts.removeEventListener('loadingdone', onFonts);
      controls.dispose();
      skyRT.dispose();
      renderer.dispose();
    }
  };
}

window.KleverUniverse = { mount };
window.dispatchEvent(new Event('klever-universe'));
