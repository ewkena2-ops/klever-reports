/* Klever — the observatory, in three dimensions.

   The same sixteen agents as orbit.js, as a real star system: a star you can
   look into, fifteen worlds lit from it with night sides and atmospheres,
   drawn by Three.js on the phone's own graphics chip. Every surface is
   generated in a shader — oceans and continents for the factory, banded gas
   giants for money, customers and people, ice for oversight — so nothing is
   downloaded but the engine itself.

   It shares orbit.js's chrome (the words, the sheet, the legend), so a
   planet picked here opens the same sheet. The flat sky shows first; this
   takes over when the engine has loaded, and if the phone cannot draw in 3D
   the flat sky simply stays.

   HOW A PLANET IS MADE
     surface   one sphere, its colours computed per pixel from noise
     clouds    a second, slightly larger sphere, for the ocean worlds
     rim       a fresnel shell: the thin bright edge of an atmosphere
     glow      a sprite behind it, coloured by how loud its reading was
     rings     on two of the giants
   All of it is lit from the star at the centre; nothing is lit by anything
   else, so the dark sides are dark.                                        */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const TAU = Math.PI * 2;

/* ---------------------------------------------------------------- *
 *  Shaders                                                          *
 * ---------------------------------------------------------------- */

/* 3D simplex noise — Ian McEwan, Ashima Arts (MIT) */
const NOISE = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){
  float a=0.5, s=0.0;
  for(int i=0;i<5;i++){ s+=a*snoise(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=0.5; }
  return s;
}
`;

const SURFACE_VERT = /* glsl */`
varying vec3 vObj;
varying vec3 vN;
varying vec3 vW;
void main(){
  vObj = normalize(position);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

/* one shader, three kinds of world */
const SURFACE_FRAG = /* glsl */`
uniform int uType;
uniform float uSeed;
uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform vec3 uD;
uniform vec3 uAtm;
uniform vec3 uSun;
varying vec3 vObj;
varying vec3 vN;
varying vec3 vW;
${NOISE}
void main(){
  vec3 p = vObj;
  vec3 col;
  float spec = 0.0;
  if (uType == 0) {
    /* ice: pale plains, blue cracks, a little shine */
    float n = fbm(p * 2.4 + uSeed);
    float cr = pow(1.0 - abs(snoise(p * 5.5 + uSeed * 1.7)), 12.0);
    float cr2 = pow(1.0 - abs(snoise(p * 11.0 - uSeed)), 18.0);
    col = mix(uA, uB, smoothstep(-0.45, 0.65, n));
    col = mix(col, uC, clamp(cr * 0.75 + cr2 * 0.4, 0.0, 1.0));
    spec = 0.35;
  } else if (uType == 1) {
    /* an ocean world: seas, continents, polar ice */
    float h = fbm(p * 1.7 + uSeed);
    float land = smoothstep(0.03, 0.085, h);
    vec3 ocean = mix(uA * 0.45, uA, smoothstep(-0.55, 0.05, h));
    float rough = snoise(p * 7.0 + uSeed) * 0.15;
    vec3 ground = mix(uB, uC, smoothstep(0.08, 0.42, h + rough));
    ground = mix(ground, uD, smoothstep(0.38, 0.6, h + rough) * 0.8);
    col = mix(ocean, ground, land);
    float ice = smoothstep(0.76, 0.86, abs(p.y) + 0.07 * snoise(p * 4.0 + uSeed));
    col = mix(col, vec3(0.9, 0.95, 0.98), ice);
    spec = (1.0 - land) * (1.0 - ice) * 0.85;
  } else {
    /* a gas giant: bands that are not quite straight, and one storm */
    float turb = fbm(vec3(p.x * 2.2, p.y * 10.0, p.z * 2.2) + uSeed);
    float b = sin(p.y * 17.0 + turb * 2.4 + uSeed);
    float b2 = sin(p.y * 6.5 - turb * 1.4 + uSeed * 0.5);
    col = mix(uA, uB, smoothstep(-0.7, 0.7, b));
    col = mix(col, uC, smoothstep(0.25, 0.95, b2) * 0.55);
    vec3 sp = normalize(vec3(0.72, -0.28, 0.62));
    float storm = smoothstep(0.26, 0.0, length((p - sp) * vec3(1.0, 1.9, 1.0)));
    float swirl = snoise(p * 14.0 + uSeed) * 0.5 + 0.5;
    col = mix(col, uD, storm * (0.65 + 0.35 * swirl));
    spec = 0.04;
  }

  vec3 N = normalize(vN);
  vec3 L = normalize(uSun - vW);
  vec3 V = normalize(cameraPosition - vW);
  float ndl = dot(N, L);
  float wrap = max((ndl + 0.1) / 1.1, 0.0);
  vec3 H = normalize(L + V);
  float sp2 = pow(max(dot(N, H), 0.0), 70.0) * spec * step(0.0, ndl);
  vec3 lit = col * (0.018 + 1.25 * wrap) + vec3(1.0, 0.96, 0.88) * sp2;
  /* the air at the edge catches the light */
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  lit += uAtm * rim * smoothstep(-0.2, 0.5, ndl) * 0.9;
  gl_FragColor = vec4(lit, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const CLOUD_FRAG = /* glsl */`
uniform float uSeed;
uniform float uTime;
uniform vec3 uSun;
varying vec3 vObj;
varying vec3 vN;
varying vec3 vW;
${NOISE}
void main(){
  vec3 p = vObj;
  float c = fbm(p * 2.6 + vec3(uTime * 0.004, 0.0, 0.0) + uSeed * 3.0);
  float a = smoothstep(0.08, 0.55, c) * 0.85;
  vec3 N = normalize(vN);
  vec3 L = normalize(uSun - vW);
  float wrap = max((dot(N, L) + 0.1) / 1.1, 0.0);
  gl_FragColor = vec4(vec3(1.0) * (0.02 + 1.2 * wrap), a * (0.25 + 0.75 * wrap));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const RIM_FRAG = /* glsl */`
uniform vec3 uColor;
uniform float uIntensity;
uniform vec3 uSun;
varying vec3 vN;
varying vec3 vW;
void main(){
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  vec3 L = normalize(uSun - vW);
  float rim = pow(1.0 - max(dot(N, V), 0.0), 2.6);
  float lit = smoothstep(-0.35, 0.6, dot(N, L));
  gl_FragColor = vec4(uColor * rim * uIntensity * (0.2 + 0.8 * lit), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const SUN_FRAG = /* glsl */`
uniform float uTime;
varying vec3 vObj;
varying vec3 vN;
varying vec3 vW;
${NOISE}
void main(){
  vec3 p = vObj;
  float n = fbm(p * 3.2 + vec3(0.0, uTime * 0.018, uTime * 0.01));
  float g = snoise(p * 22.0 + uTime * 0.06) * 0.5 + 0.5;
  vec3 hot = vec3(1.0, 0.94, 0.78), warm = vec3(1.0, 0.62, 0.22), deep = vec3(0.85, 0.32, 0.08);
  vec3 col = mix(warm, hot, smoothstep(-0.35, 0.55, n));
  col = mix(col, deep, smoothstep(0.35, 0.0, g) * 0.35);
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  float mu = max(dot(N, V), 0.0);
  col *= 0.5 + 0.5 * pow(mu, 0.45);
  gl_FragColor = vec4(col * 2.1, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const RING_VERT = /* glsl */`
varying vec3 vPos;
varying vec3 vW;
varying vec3 vNw;
void main(){
  vPos = position;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vNw = normalize(mat3(modelMatrix) * vec3(0.0, 0.0, 1.0));
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;
const RING_FRAG = /* glsl */`
uniform float uIn; uniform float uOut; uniform float uSeed;
uniform vec3 uA; uniform vec3 uB;
uniform vec3 uSun;
varying vec3 vPos;
varying vec3 vW;
varying vec3 vNw;
${NOISE}
void main(){
  float rr = (length(vPos.xy) - uIn) / (uOut - uIn);
  float bands = 0.55 + 0.45 * sin(rr * 70.0 + snoise(vec3(rr * 18.0, uSeed, 0.0)) * 2.5);
  float a = smoothstep(0.0, 0.06, rr) * smoothstep(1.0, 0.86, rr) * bands * 0.78;
  a *= 1.0 - 0.85 * smoothstep(0.52, 0.55, rr) * smoothstep(0.62, 0.59, rr);
  vec3 L = normalize(uSun - vW);
  float lit = 0.3 + 0.7 * abs(dot(normalize(vNw), L));
  vec3 col = mix(uA, uB, rr) * lit;
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const STAR_VERT = /* glsl */`
attribute float aSize;
attribute vec3 aColor;
attribute float aPhase;
uniform float uTime;
uniform float uPR;
varying vec3 vC;
void main(){
  vC = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPR * (0.78 + 0.22 * sin(uTime * (0.4 + aPhase) + aPhase * 6.28));
}
`;
const STAR_FRAG = /* glsl */`
varying vec3 vC;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.0, d);
  a = a * a * a;
  gl_FragColor = vec4(vC * a * 2.2, a);
}
`;

/* the sky itself — painted once straight onto the faces of a cube, then only
   looked at (see paintSky). The direction is read with its axes in the
   order the old panorama used, so every cloud is where it was. */
const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){
  vDir = (modelMatrix * vec4(position, 0.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const SKY_FRAG = /* glsl */`
varying vec3 vDir;
${NOISE}
void main(){
  vec3 d = normalize(vDir).zyx;
  vec3 bandN = normalize(vec3(0.28, 1.0, 0.36));
  float band = exp(-pow(dot(d, bandN) / 0.2, 2.0));
  float n1 = fbm(d * 2.1 + 3.1);
  float n2 = fbm(d * 4.2 - 1.7);
  float dust = fbm(d * 6.5 + 7.0);
  vec3 col = vec3(0.002, 0.004, 0.006);
  col += vec3(0.010, 0.055, 0.048) * smoothstep(-0.05, 0.85, n1);
  col += vec3(0.035, 0.015, 0.060) * smoothstep(0.05, 0.9, n2);
  col += vec3(0.11, 0.095, 0.075) * band * (0.35 + 0.65 * smoothstep(-0.3, 0.7, fbm(d * 9.0))) *
         (1.0 - smoothstep(0.0, 0.55, dust) * 0.75);
  float st = pow(max(snoise(d * 260.0), 0.0), 20.0) * 2.5;
  col += vec3(st) * (0.4 + band);
  gl_FragColor = vec4(col, 1.0);
}
`;

const BEAM_VERT = /* glsl */`
attribute float aT;
varying float vT;
void main(){ vT = aT; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const BEAM_FRAG = /* glsl */`
uniform float uTime;
uniform float uDim;
varying float vT;
void main(){
  float pulse = smoothstep(0.0, 0.08, fract(vT * 3.0 - uTime * 0.7)) * smoothstep(0.22, 0.08, fract(vT * 3.0 - uTime * 0.7));
  float fade = smoothstep(0.0, 0.25, vT);
  vec3 c = vec3(1.0, 0.45, 0.32) * (0.35 + 2.4 * pulse) * fade * uDim;
  gl_FragColor = vec4(c, 1.0);
}
`;

/* ---------------------------------------------------------------- *
 *  The worlds                                                       *
 * ---------------------------------------------------------------- */

/* colours by family; each world takes the next palette so no two look alike */
const PALETTES = {
  0: [ /* ice */
    ['#dcecff', '#8fb9e6', '#2f5f8f', '#ffffff'],
    ['#eef4ff', '#a7c3dc', '#3a6687', '#ffffff'],
    ['#dcf0f4', '#8bbccb', '#2c6878', '#ffffff'],
    ['#efeaff', '#b2a8e0', '#4b3f7c', '#ffffff']
  ],
  1: [ /* ocean worlds */
    ['#1f6f93', '#6e8f4d', '#b49a69', '#e9e2d0'],
    ['#155a7a', '#8a9a55', '#a07a4a', '#efe6d6'],
    ['#237e8c', '#5f8a5a', '#c2a676', '#f0ebe0'],
    ['#1b5f8a', '#7a7a48', '#9b6d44', '#e6dccb'],
    ['#2a7a86', '#6a9460', '#b8905e', '#eee4d2']
  ],
  2: [ /* gas giants */
    ['#d8b98a', '#f2e4c7', '#ae7a4b', '#c7744a'],
    ['#e5c67e', '#fff0cf', '#9c7a3c', '#d88b4a'],
    ['#c9a3a0', '#f1dcd4', '#8a5a58', '#b8695a'],
    ['#bcc8a0', '#eef0da', '#7a8a5c', '#a86a3a'],
    ['#d7b079', '#f7e7c4', '#a0673a', '#e19f5f'],
    ['#c3aa8f', '#efe2d0', '#7d644b', '#b36f49']
  ]
};
const FAMILY = [
  { type: 0, orbit: 22, size: 2.35, rim: '#9fd0ff', incl: 0.05 },
  { type: 1, orbit: 36, size: 2.95, rim: '#7fd8ff', incl: 0.035 },
  { type: 2, orbit: 56, size: 4.3, rim: '#ffd9a0', incl: 0.025 }
];
const RINGED = { finance: 1, commercial: 1 };
const HEAT_COLOR = { loud: '#ff7a5c', warm: '#f0b84a', quiet: null, none: '#667873' };

function glowTexture(inner, outer) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, inner);
  gr.addColorStop(0.25, outer);
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function reticleTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.strokeStyle = 'rgba(95,224,198,0.95)';
  g.lineWidth = 5;
  g.setLineDash([18, 16]);
  g.beginPath(); g.arc(128, 128, 104, 0, TAU); g.stroke();
  g.setLineDash([]);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    g.beginPath();
    g.moveTo(128 + Math.cos(a) * 112, 128 + Math.sin(a) * 112);
    g.lineTo(128 + Math.cos(a) * 126, 128 + Math.sin(a) * 126);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const col = h => new THREE.Color(h);

/* ---------------------------------------------------------------- */

/* Can this device draw in 3D? The context made to ask is handed straight
   back, so it does not hold on to the graphics chip for the page's life. */
function webglOk() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    const lose = gl && gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    return !!gl;
  } catch (e) { return false; }
}

function mount(root, opts) {
  if (!webglOk()) throw new Error('no webgl');
  const O = window.KleverOrbit;
  const c = O.chrome(root, opts);
  const reduce = c.reduce;
  const obs = c.obs, hud = c.hud, sheet = c.sheet;

  /* ---------- renderer ---------- */
  /* No antialiasing on the canvas: the picture is drawn into the composer's
     targets and only copied to the canvas, so it smoothed nothing. The
     composer's own target is multisampled instead, on a screen of ordinary
     density where jagged edges show (WebGL2 only); a phone's dense screen
     hides them and could not spare the memory. */
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  let pr = Math.min(window.devicePixelRatio || 1, 1.75);
  const PR0 = pr;
  renderer.setPixelRatio(pr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const canvas = renderer.domElement;
  canvas.className = 'obs-sky obs-3d';
  canvas.setAttribute('aria-hidden', 'true');
  obs.insertBefore(canvas, obs.firstChild);

  const labelsEl = document.createElement('div');
  labelsEl.className = 'obs3d-labels';
  obs.insertBefore(labelsEl, canvas.nextSibling);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 6000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.8;
  controls.minDistance = 7;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.autoRotate = !reduce;
  controls.autoRotateSpeed = 0.28;

  /* the size given the target here is a placeholder; resize() sets the real one */
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType, samples: renderer.capabilities.isWebGL2 && pr < 1.5 ? 4 : 0 }));
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.72, 0.5, 0.86);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ---------- the sky, painted once ---------- */
  /* Straight onto the six faces of a cube, with the same box and cube camera
     three.js uses to turn a panorama into one. It used to go into a
     2048×1024 panorama with a depth buffer, which three.js then copied onto
     a cube: two copies and a buffer nobody used, some 38 MB. The faces keep
     the 512 pixels that copy had, so the sky is as sharp, in a third of the
     memory; half-float still, because the nebula is so dark that eight bits
     would band it. */
  function paintSky() {
    const rt = new THREE.WebGLCubeRenderTarget(512, { type: THREE.HalfFloatType, depthBuffer: false });
    const box = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), new THREE.ShaderMaterial({
      vertexShader: SKY_VERT, fragmentShader: SKY_FRAG,
      side: THREE.BackSide, blending: THREE.NoBlending, depthTest: false, depthWrite: false
    }));
    new THREE.CubeCamera(1, 10, rt).update(renderer, box);
    box.geometry.dispose();
    box.material.dispose();
    scene.background = rt.texture;
    return rt;
  }
  const skyRT = paintSky();

  /* ---------- stars ---------- */
  const N = 5200;
  const sp = new Float32Array(N * 3), ss = new Float32Array(N), sc = new Float32Array(N * 3), sph = new Float32Array(N);
  const tints = [[0.72, 0.82, 1.0], [0.9, 0.94, 1.0], [1.0, 1.0, 1.0], [1.0, 0.95, 0.82], [1.0, 0.84, 0.66]];
  const bandN = new THREE.Vector3(0.28, 1.0, 0.36).normalize();
  for (let i = 0; i < N; i++) {
    let v = new THREE.Vector3().randomDirection();
    if (i < N * 0.35) {            /* a third crowd the band of the galaxy */
      v.addScaledVector(bandN, -v.dot(bandN) * (0.75 + Math.random() * 0.2)).normalize();
    }
    v.multiplyScalar(1600 + Math.random() * 600);
    sp.set([v.x, v.y, v.z], i * 3);
    const big = Math.random() < 0.04;
    ss[i] = big ? 2.4 + Math.random() * 1.6 : 0.7 + Math.random() * 1.1;
    const t = tints[(Math.random() * tints.length) | 0];
    const b = big ? 1 : 0.45 + Math.random() * 0.5;
    sc.set([t[0] * b, t[1] * b, t[2] * b], i * 3);
    sph[i] = Math.random();
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  sg.setAttribute('aSize', new THREE.BufferAttribute(ss, 1));
  sg.setAttribute('aColor', new THREE.BufferAttribute(sc, 3));
  sg.setAttribute('aPhase', new THREE.BufferAttribute(sph, 1));
  const starMat = new THREE.ShaderMaterial({
    vertexShader: STAR_VERT, fragmentShader: STAR_FRAG,
    uniforms: { uTime: { value: 0 }, uPR: { value: pr } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  scene.add(new THREE.Points(sg, starMat));

  /* ---------- the star ---------- */
  const sunU = { uTime: { value: 0 } };
  const sun = new THREE.Mesh(new THREE.SphereGeometry(6, 96, 64),
    new THREE.ShaderMaterial({ vertexShader: SURFACE_VERT, fragmentShader: SUN_FRAG, uniforms: sunU }));
  sun.userData.id = 'brief';
  scene.add(sun);
  const corona = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture('rgba(255,236,190,0.75)', 'rgba(255,170,80,0.16)'),
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true
  }));
  corona.scale.set(24, 24, 1);
  scene.add(corona);
  const haze = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture('rgba(255,210,150,0.14)', 'rgba(95,224,198,0.025)'),
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true
  }));
  haze.scale.set(90, 90, 1);
  scene.add(haze);

  /* ---------- orbits ---------- */
  O.rings.forEach((ring, ri) => {
    const R = FAMILY[ri].orbit, pts = [];
    for (let i = 0; i <= 256; i++) {
      const a = i / 256 * TAU;
      pts.push(new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R * FAMILY[ri].incl, Math.sin(a) * R));
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: new THREE.Color().setRGB(ring.rgb[0] / 255, ring.rgb[1] / 255, ring.rgb[2] / 255, THREE.SRGBColorSpace),
                                    transparent: true, opacity: 0.2 }));
    scene.add(line);
  });

  /* ---------- the worlds ---------- */
  const worlds = [];
  const sunPos = new THREE.Vector3(0, 0, 0);
  const pingGeo = new THREE.RingGeometry(0.92, 1.0, 64);
  const retTex = reticleTexture();
  O.rings.forEach((ring, ri) => {
    const fam = FAMILY[ri];
    ring.ids.forEach((id, j) => {
      const seed = ri * 7.3 + j * 3.1 + 1.0;
      const pal = PALETTES[fam.type][j % PALETTES[fam.type].length].map(col);
      const r = fam.size * (0.9 + ((j * 37) % 10) / 45);
      const group = new THREE.Group();
      const tilt = new THREE.Group();
      tilt.rotation.z = fam.type === 2 ? 0.32 + j * 0.05 : 0.2 + j * 0.07;
      group.add(tilt);

      const surf = new THREE.Mesh(new THREE.SphereGeometry(r, 72, 48), new THREE.ShaderMaterial({
        vertexShader: SURFACE_VERT, fragmentShader: SURFACE_FRAG,
        uniforms: {
          uType: { value: fam.type }, uSeed: { value: seed },
          uA: { value: pal[0] }, uB: { value: pal[1] }, uC: { value: pal[2] }, uD: { value: pal[3] },
          uAtm: { value: col(fam.rim).multiplyScalar(0.55) }, uSun: { value: sunPos }
        }
      }));
      surf.userData.id = id;
      tilt.add(surf);

      let clouds = null;
      if (fam.type === 1) {
        clouds = new THREE.Mesh(new THREE.SphereGeometry(r * 1.015, 64, 40), new THREE.ShaderMaterial({
          vertexShader: SURFACE_VERT, fragmentShader: CLOUD_FRAG,
          uniforms: { uSeed: { value: seed }, uTime: { value: 0 }, uSun: { value: sunPos } },
          transparent: true, depthWrite: false
        }));
        tilt.add(clouds);
      }

      const rimU = { uColor: { value: col(fam.rim) }, uIntensity: { value: 0.6 }, uSun: { value: sunPos } };
      const rim = new THREE.Mesh(new THREE.SphereGeometry(r * 1.045, 64, 40), new THREE.ShaderMaterial({
        vertexShader: SURFACE_VERT, fragmentShader: RIM_FRAG, uniforms: rimU,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      }));
      group.add(rim);

      if (RINGED[id]) {
        const rin = r * 1.45, rout = r * 2.35;
        const rg = new THREE.Mesh(new THREE.RingGeometry(rin, rout, 160, 1), new THREE.ShaderMaterial({
          vertexShader: RING_VERT, fragmentShader: RING_FRAG,
          uniforms: { uIn: { value: rin }, uOut: { value: rout }, uSeed: { value: seed },
                      uA: { value: pal[1] }, uB: { value: pal[2] }, uSun: { value: sunPos } },
          transparent: true, depthWrite: false, side: THREE.DoubleSide
        }));
        rg.rotation.x = Math.PI / 2;
        tilt.add(rg);
      }

      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTexture('rgba(255,255,255,0.9)', 'rgba(255,255,255,0.18)'),
        color: col(fam.rim), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.25
      }));
      glow.scale.set(r * 4.2, r * 4.2, 1);
      group.add(glow);

      const pings = [0, 1].map(() => {
        const m = new THREE.Mesh(pingGeo, new THREE.MeshBasicMaterial({
          color: col('#ff7a5c'), transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
          depthWrite: false, side: THREE.DoubleSide
        }));
        m.visible = false;
        group.add(m);
        return m;
      });

      const ret = new THREE.Sprite(new THREE.SpriteMaterial({ map: retTex, transparent: true, depthWrite: false }));
      ret.scale.set(r * 3.2, r * 3.2, 1);
      ret.material.opacity = 0.7;
      ret.visible = false;
      group.add(ret);

      /* the signal from the star, when this world wants him */
      const bg = new THREE.BufferGeometry();
      const bpos = new Float32Array(64 * 3), bt = new Float32Array(64);
      for (let i = 0; i < 64; i++) bt[i] = i / 63;
      bg.setAttribute('position', new THREE.BufferAttribute(bpos, 3));
      bg.setAttribute('aT', new THREE.BufferAttribute(bt, 1));
      const beamU = { uTime: { value: 0 }, uDim: { value: 1 } };
      const beam = new THREE.Line(bg, new THREE.ShaderMaterial({
        vertexShader: BEAM_VERT, fragmentShader: BEAM_FRAG, uniforms: beamU,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      }));
      beam.frustumCulled = false;
      beam.visible = false;
      scene.add(beam);

      scene.add(group);
      const label = document.createElement('button');
      label.type = 'button';
      label.className = 'obs3d-label';
      label.textContent = c.name(id);
      label.onclick = () => c.select(id);
      labelsEl.appendChild(label);

      worlds.push({
        id, ri, j, r, fam, group, tilt, surf, clouds, rim, rimU, glow, pings, ret, beam, beamU, label,
        spin: 0.05 + ((j * 13) % 7) * 0.012, phase0: j * TAU / ring.ids.length
      });
    });
  });

  const sunBadge = document.createElement('button');
  sunBadge.type = 'button';
  sunBadge.className = 'obs3d-sun';
  sunBadge.onclick = () => c.select('brief');
  labelsEl.appendChild(sunBadge);
  const sunRet = new THREE.Sprite(new THREE.SpriteMaterial({ map: retTex, transparent: true, depthWrite: false }));
  sunRet.scale.set(20, 20, 1);
  sunRet.visible = false;
  scene.add(sunRet);

  /* ---------- the names' bookkeeping ---------- */
  /* Each name keeps what was last written to it and its measured width.
     Reading a width just after moving another name makes the browser lay
     the page out again, once per name, every frame; so a name is measured
     only when its words change (or the fonts arrive, or the window
     changes), before anything is moved, and a style is written only when
     it changes. A hidden name also leaves the tab order, once it has faded. */
  const LS = new Map();
  function ls(lab) {
    let st = LS.get(lab);
    if (!st) {
      st = { w: 0, a: -1, x: NaN, y: NaN };
      lab.style.transition = 'opacity .25s ease, visibility .25s';
      LS.set(lab, st);
    }
    return st;
  }
  function measureLabels() {
    worlds.forEach(w => {
      const st = ls(w.label);
      if (!st.w) st.w = w.label.offsetWidth;
    });
  }
  function remeasure() { LS.forEach(st => { st.w = 0; }); }
  function setAlpha(lab, st, a) {
    if (st.a === a) return;
    st.a = a;
    lab.style.opacity = String(a);
    lab.style.pointerEvents = a > 0.5 ? 'auto' : 'none';
    lab.style.visibility = a > 0 ? 'visible' : 'hidden';
  }
  /* the loudest worlds choose where their names go first; the order only
     changes when the readings do */
  const RANK = { loud: 0, warm: 1, quiet: 2, none: 3 };
  let byHeat = worlds.slice();

  /* ---------- how loud each world is ---------- */
  function applyHeat() {
    let loud = 0, any = false;
    worlds.forEach(w => {
      const h = c.heat[w.id];
      if (h !== 'none') any = true;
      if (h === 'loud') loud++;
      const hc = HEAT_COLOR[h];
      w.rimU.uColor.value = hc ? col(hc) : col(w.fam.rim);
      w.rimU.uIntensity.value = { loud: 1.6, warm: 1.2, quiet: 0.7, none: 0.3 }[h];
      w.glow.material.color = hc ? col(hc) : col(w.fam.rim);
      w.glow.material.opacity = { loud: 0.55, warm: 0.4, quiet: 0.14, none: 0.06 }[h];
      w.glow.scale.setScalar(w.r * ({ loud: 4.8, warm: 4.2, quiet: 3.6, none: 3.2 }[h]));
      w.beam.visible = h === 'loud';
      w.pings.forEach(p => { p.visible = h === 'loud' && !reduce; });
      const cls = 'obs3d-label ' + h, name = c.name(w.id);
      if (w.label.className !== cls || w.label.textContent !== name) {
        w.label.className = cls;
        w.label.textContent = name;
        ls(w.label).w = 0;
      }
    });
    byHeat = worlds.slice().sort((a, b) => RANK[c.heat[a.id]] - RANK[c.heat[b.id]]);
    sunBadge.innerHTML = '';
    const n = document.createElement('b');
    n.textContent = any ? String(loud) : '—';
    sunBadge.appendChild(n);
    const l = document.createElement('span');
    l.textContent = any ? (loud ? c.s('wantYou', 'want you') : c.s('allQuiet', 'all quiet')) : c.s('awaiting', 'awaiting');
    sunBadge.appendChild(l);
  }
  c.onData(applyHeat);
  applyHeat();

  /* ---------- the camera ---------- */
  let W = 0, H = 0, overview = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
  let tween = null, offY = 0, offGoal = 0;
  /* whether someone has turned or zoomed the view since the last flight;
     if so, a change of window size leaves their view alone */
  let userMoved = false;
  controls.addEventListener('start', () => { userMoved = true; });
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function band() {
    const top = (document.querySelector('.top') || hud).getBoundingClientRect().bottom;
    if (c.selected() && !sheet.hidden) return [top + 10, sheet.getBoundingClientRect().top - 10];
    return [hud.getBoundingClientRect().bottom + 12, H - 52];
  }
  function fitOverview() {
    const [y0, y1] = band();
    const aspect = W / H;
    const e = aspect < 0.8 ? 0.95 : (aspect < 1.25 ? 0.72 : 0.5);      /* elevation, radians */
    const Rs = 62;
    const halfY = THREE.MathUtils.degToRad(camera.fov / 2);
    const halfYb = Math.atan(Math.tan(halfY) * (y1 - y0) / H);
    const halfX = Math.atan(Math.tan(halfY) * aspect);
    const dX = (aspect < 0.8 ? 58 : Rs) / Math.tan(halfX) + Rs * 0.1;
    const dY = Rs * Math.cos(e) + (Rs * Math.sin(e) + 7) / Math.tan(halfYb);
    const D = Math.max(dX, dY) * 1.04;
    const az = 0.55;
    overview.pos.set(Math.sin(az) * Math.cos(e) * D, Math.sin(e) * D, Math.cos(az) * Math.cos(e) * D);
    overview.target.set(0, 0, 0);
    controls.maxDistance = D * 1.6;
    offGoal = H / 2 - (y0 + y1) / 2;
  }
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    renderer.setSize(W, H, false);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    composer.setSize(W, H);
    bloom.resolution.set(W / 2, H / 2);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    fitOverview();
    /* refit the view to the new shape only if nobody has taken the camera */
    if (!c.selected() && !tween && !userMoved) { camera.position.copy(overview.pos); controls.target.copy(overview.target); }
    starMat.uniforms.uPR.value = pr;
    remeasure();
  }

  function flyTo(pos, target, ms) {
    tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target,
              start: performance.now(), ms: reduce ? 1 : ms };
    controls.enabled = false;
    userMoved = false;
  }
  function focusWorld(id) {
    if (!id) {
      fitOverview();
      flyTo(overview.pos.clone(), overview.target.clone(), 1400);
      controls.autoRotate = !reduce;
      controls.autoRotateSpeed = 0.28;
      return;
    }
    const [y0, y1] = band();
    offGoal = H / 2 - (y0 + y1) / 2;
    if (id === 'brief') {
      const dir = camera.position.clone().sub(controls.target).normalize();
      flyTo(dir.multiplyScalar(34), new THREE.Vector3(), 1400);
    } else {
      const w = worlds.find(x => x.id === id);
      const P = w.group.position.clone();
      const out = P.clone().normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const side = new THREE.Vector3().crossVectors(out, up).normalize();
      /* three-quarter lit: between the star and the world, and to one side */
      const dir = out.clone().multiplyScalar(-0.55).addScaledVector(side, 0.62).addScaledVector(up, 0.4).normalize();
      const dist = w.r * (RINGED[id] ? 10 : 8) * (H > W ? 1.3 : 1);
      flyTo(P.clone().addScaledVector(dir, dist), P, 1600);
    }
    controls.autoRotate = !reduce;
    controls.autoRotateSpeed = 0.5;
  }
  c.onPick(focusWorld);

  /* ---------- tapping ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null;
  canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', e => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 7) { down = null; return; }
    down = null;
    ndc.set(e.clientX / W * 2 - 1, -(e.clientY / H) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects([sun].concat(worlds.map(w => w.surf)), false);
    if (hits.length) { c.select(hits[0].object.userData.id); return; }
    /* a small world is a small target on a phone: take the nearest within reach */
    let best = null, bd = 30;
    worlds.forEach(w => {
      const v = w.group.position.clone().project(camera);
      const d = Math.hypot((v.x + 1) / 2 * W - e.clientX, (1 - v.y) / 2 * H - e.clientY);
      if (d < bd) { bd = d; best = w; }
    });
    c.select(best ? best.id : null);
  });

  /* ---------- names, over the sky ---------- */
  const tmp = new THREE.Vector3(), camRight = new THREE.Vector3();
  const sunS = new THREE.Vector3(), edgeV = new THREE.Vector3();
  const taken = [];                      /* the boxes already taken this frame, four numbers each */
  const badge = { x: NaN, y: NaN, shown: null };
  function clash(x0, y0, x1, y1) {
    for (let i = 0; i < taken.length; i += 4) {
      if (x0 < taken[i + 2] && x1 > taken[i] && y0 < taken[i + 3] && y1 > taken[i + 1]) return true;
    }
    return false;
  }
  function placeLabels() {
    const picked = c.selected();
    measureLabels();
    camRight.setFromMatrixColumn(camera.matrixWorld, 0);
    sunS.set(0, 0, 0).project(camera);
    edgeV.copy(camRight).multiplyScalar(6).project(camera);
    const sunX = (sunS.x + 1) / 2 * W, sunY = (1 - sunS.y) / 2 * H;
    const sunRpx = Math.abs((edgeV.x - sunS.x) / 2 * W);
    const sunDepth = camera.position.length();
    taken.length = 0;
    taken.push(sunX - sunRpx * 1.2, sunY - sunRpx * 1.2, sunX + sunRpx * 1.2, sunY + sunRpx * 1.2);

    if (badge.shown !== !picked) { badge.shown = !picked; sunBadge.style.display = picked ? 'none' : ''; }
    if (!picked) {
      const bx = Math.round(sunX), by = Math.round(sunY + sunRpx * 1.35 + 6);
      if (bx !== badge.x || by !== badge.y) {
        badge.x = bx; badge.y = by;
        sunBadge.style.transform = 'translate(' + bx + 'px,' + by + 'px) translateX(-50%)';
      }
      taken.push(sunX - 50, sunY + sunRpx * 1.35 + 6, sunX + 50, sunY + sunRpx * 1.35 + 34);
    }

    byHeat.forEach(w => {
      const st = ls(w.label);
      if (picked) { setAlpha(w.label, st, 0); return; }
      const P = w.group.position;
      const v = tmp.copy(P).project(camera);
      /* behind the camera: hidden, and not something a tap can land on */
      if (v.z > 1) { setAlpha(w.label, st, 0); return; }
      const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H;
      edgeV.copy(P).addScaledVector(camRight, w.r).project(camera);
      const rpx = Math.abs((edgeV.x - v.x) / 2 * W);
      /* behind the star from here? */
      const behind = camera.position.distanceTo(P) > sunDepth && Math.hypot(x - sunX, y - sunY) < sunRpx * 1.1;
      const lw = st.w || 80, lh = 18;
      const lx = Math.max(8 + lw / 2, Math.min(W - 8 - lw / 2, x));
      let ly = y + rpx + 5, alpha = 1;
      if (clash(lx - lw / 2, ly, lx + lw / 2, ly + lh)) {
        const up = y - rpx - 5 - lh;
        if (!clash(lx - lw / 2, up, lx + lw / 2, up + lh)) ly = up; else alpha = 0.25;
      }
      if (behind) alpha = 0;
      taken.push(lx - lw / 2, ly, lx + lw / 2, ly + lh);
      setAlpha(w.label, st, alpha);
      const rx = Math.round(lx), ry = Math.round(ly);
      if (rx !== st.x || ry !== st.y) {
        st.x = rx; st.y = ry;
        w.label.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translateX(-50%)';
      }
    });
  }

  /* ---------- keeping up ---------- */
  /* A device that cannot keep up gives things up rather than stutter:
     first multisampling, then resolution, then bloom. The average time a
     frame takes is checked every two seconds; two slow checks in a row
     (under about 29 frames a second) give up one thing. Once — after half
     a minute comfortably fast — the last thing given up comes back, and if
     that proves too much it goes again for good. None of this moves the
     camera, and it watches the whole visit, not just its first seconds. */
  function setPR(p) {
    pr = p;
    renderer.setPixelRatio(p);
    composer.setPixelRatio(p);
    starMat.uniforms.uPR.value = p;
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

  /* ---------- the loop ---------- */
  const phase = O.rings.map(r => r.start);
  let speed = reduce ? 0 : 1, last = 0, raf = 0, alive = true, time = 0, frames = 0, lost = false;

  function frame(now) {
    if (!alive || lost) return;
    const ms = last ? now - last : 0;
    const dt = last ? Math.min(0.064, ms / 1000) : 0.016;
    last = now;
    time += dt;
    /* with motion reduced, what moves by itself holds still: the stars'
       twinkle, the star's surface, the clouds, the worlds' spin, the light
       along the beams, the reticle */
    const at = reduce ? 0 : time, adt = reduce ? 0 : dt;

    frames++;
    if (frames > 60 && ms) keepUp(ms);

    const target = (c.selected() || reduce) ? 0 : 1;
    speed += (target - speed) * Math.min(1, dt * 3);
    O.rings.forEach((ring, i) => { phase[i] += speed * dt * TAU / ring.period; });

    worlds.forEach(w => {
      const a = phase[w.ri] + w.phase0, R = w.fam.orbit;
      w.group.position.set(Math.cos(a) * R, Math.sin(a) * R * w.fam.incl, Math.sin(a) * R);
      w.surf.rotation.y += adt * w.spin;
      if (w.clouds) { w.clouds.rotation.y += adt * w.spin * 1.35; w.clouds.material.uniforms.uTime.value = at; }
      const h = c.heat[w.id];
      if (h === 'loud') {
        w.rimU.uIntensity.value = 1.35 + (reduce ? 0 : 0.45 * Math.sin(time * 3.2 + w.j));
        w.pings.forEach((p, k2) => {
          p.visible = !reduce && !c.selected();
          if (!p.visible) return;
          const u = ((time / 2.4) + k2 * 0.5 + w.j * 0.13) % 1;
          p.scale.setScalar(w.r * (1.3 + u * 1.5));
          p.material.opacity = (1 - u) * 0.42;
          p.lookAt(camera.position);
        });
        w.beam.visible = !c.selected();
        const pos = w.beam.geometry.attributes.position;
        const from = tmp.copy(w.group.position).normalize().multiplyScalar(6.4);
        for (let i = 0; i < 64; i++) {
          const t = i / 63;
          pos.setXYZ(i, from.x + (w.group.position.x - from.x) * t,
                        from.y + (w.group.position.y - from.y) * t,
                        from.z + (w.group.position.z - from.z) * t);
        }
        pos.needsUpdate = true;
        w.beamU.uTime.value = at;
        w.beamU.uDim.value = c.selected() && c.selected() !== w.id ? 0.25 : 1;
      }
      w.ret.visible = c.selected() === w.id;
      if (w.ret.visible) w.ret.material.rotation = at * 0.5;
    });
    sunRet.visible = c.selected() === 'brief';
    if (sunRet.visible) sunRet.material.rotation = at * 0.4;
    sunU.uTime.value = at;
    sun.rotation.y += adt * 0.02;
    starMat.uniforms.uTime.value = at;
    const breathe = reduce ? 1 : 1 + 0.03 * Math.sin(time * 1.3);
    corona.scale.set(24 * breathe, 24 * breathe, 1);

    if (tween) {
      const u = Math.min(1, (now - tween.start) / tween.ms), k = ease(u);
      camera.position.lerpVectors(tween.p0, tween.p1, k);
      controls.target.lerpVectors(tween.t0, tween.t1, k);
      if (u >= 1) { tween = null; controls.enabled = true; }
    } else if (c.selected() && c.selected() !== 'brief') {
      /* the world has stopped, but let the camera keep it centred */
      const w = worlds.find(x => x.id === c.selected());
      controls.target.lerp(w.group.position, 0.1);
    }
    offY += (offGoal - offY) * Math.min(1, dt * 5);
    camera.setViewOffset(W, H, 0, offY, W, H);
    controls.update();
    placeLabels();
    composer.render();
    raf = requestAnimationFrame(frame);
  }

  /* ---------- when the graphics chip is taken away ---------- */
  /* A phone takes the graphics chip back when another app wants it — the
     camera, a video call — and usually hands it back when this page is
     looked at again. So losing it only pauses the sky. If it has not come
     back within three seconds of the page being on screen, the page is told
     (and falls back to the flat sky); if it does come back, the sky is
     built again — by the page, if it offers to, or by reloading when the
     page is next on screen. */
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
  /* the names are measured again once the page's fonts have arrived */
  const onFonts = () => remeasure();
  if (document.fonts) {
    document.fonts.addEventListener('loadingdone', onFonts);
    document.fonts.ready.then(onFonts);
  }
  resize();
  raf = requestAnimationFrame(frame);
  requestAnimationFrame(() => canvas.classList.add('in'));

  return {
    update: c.update,
    select: c.select,
    destroy() {
      alive = false;
      reloadOnShow = false;
      clearTimeout(lostTimer);
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextBack);
      if (document.fonts) document.fonts.removeEventListener('loadingdone', onFonts);
      controls.dispose();
      skyRT.dispose();
      renderer.dispose();
      c.destroy();
    }
  };
}

window.KleverOrbit3D = { mount };
window.dispatchEvent(new Event('klever-orbit3d'));
