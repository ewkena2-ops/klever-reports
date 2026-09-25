/* Klever — the furniture every 3D page shares: the renderer, the sky, the
   stars, bloom, a soft glow texture, and the worlds themselves — a star you
   can look into, and planets and moons whose surfaces are computed per
   pixel and lit from that star, so their night sides are dark. The
   universe uses it; the observatory still carries its own copy of the
   same shaders and can move onto this one.                                 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const TAU = Math.PI * 2;
export const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* 3D simplex noise — Ian McEwan, Ashima Arts (MIT) */
export const NOISE = /* glsl */`
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

/* Can this device draw in 3D at all? The context made to ask is handed
   straight back: a browser allows only a handful at once, and a phone's
   graphics chip would otherwise keep this one for the life of the page. */
export function webglOk() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    const lose = gl && gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    return !!gl;
  } catch (e) { return false; }
}

/* No antialiasing on the canvas itself: every picture is drawn into the
   composer's targets first and only copied to the canvas at the end, so a
   multisampled canvas smoothed nothing and cost memory. The composer's
   own target is multisampled instead, where it can be (makeComposer). */
export function makeRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  return renderer;
}

/* The scene is drawn into a half-float target, bloomed, then tone-mapped
   onto the canvas. On a screen of ordinary density — where jagged edges
   show, and the graphics chip is usually a computer's — that target is
   multisampled (WebGL2 only). A phone's dense screen hides the jaggies and
   could not spare the memory, so there it is not. The size given here is
   only a placeholder: the page sets the real one before the first frame. */
export function makeComposer(renderer, scene, camera, strength, radius, threshold) {
  const size = renderer.getSize(new THREE.Vector2());
  const samples = renderer.capabilities.isWebGL2 && renderer.getPixelRatio() < 1.5 ? 4 : 0;
  const target = new THREE.WebGLRenderTarget(Math.max(1, size.x), Math.max(1, size.y),
                                             { type: THREE.HalfFloatType, samples });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), strength, radius, threshold);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  return { composer, bloom };
}

/* The sky — a nebula and a band of galaxy — painted once, straight onto the
   six faces of a cube, and afterwards only looked at. It used to be
   painted into a 2048×1024 panorama with a depth buffer, which three.js
   then copied onto a cube of its own: two copies and a buffer nobody used,
   some 38 MB on a phone. Painting the cube directly keeps the same 512
   pixels a face that copy had, so the sky is as sharp as it was, in a
   third of the memory. It stays half-float: the nebula lives in values so
   dark that eight bits would draw it in bands.

   The direction is read with its axes in the order the panorama used
   (longitude measured from +z towards +x), so every cloud is where it was. */
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
export function paintSky(renderer, scene, dim) {
  const rt = new THREE.WebGLCubeRenderTarget(512, { type: THREE.HalfFloatType, depthBuffer: false });
  /* the same box and cube camera three.js itself uses to turn a panorama
     into a cube, so the faces come out the same way round */
  const box = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), new THREE.ShaderMaterial({
    vertexShader: SKY_VERT, fragmentShader: SKY_FRAG,
    side: THREE.BackSide, blending: THREE.NoBlending, depthTest: false, depthWrite: false
  }));
  new THREE.CubeCamera(1, 10, rt).update(renderer, box);
  box.geometry.dispose();
  box.material.dispose();
  scene.background = rt.texture;
  scene.backgroundIntensity = dim == null ? 1 : dim;
  return rt;
}

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
  float a = smoothstep(0.5, 0.0, length(c));
  a = a * a * a;
  gl_FragColor = vec4(vC * a * 2.2, a);
}
`;
/* distant stars, a third of them crowding the band of the galaxy */
export function makeStars(scene, n, radius, pr) {
  const sp = new Float32Array(n * 3), ss = new Float32Array(n), sc = new Float32Array(n * 3), sph = new Float32Array(n);
  const tints = [[0.72, 0.82, 1.0], [0.9, 0.94, 1.0], [1.0, 1.0, 1.0], [1.0, 0.95, 0.82], [1.0, 0.84, 0.66]];
  const bandN = new THREE.Vector3(0.28, 1.0, 0.36).normalize();
  for (let i = 0; i < n; i++) {
    const v = new THREE.Vector3().randomDirection();
    if (i < n * 0.35) v.addScaledVector(bandN, -v.dot(bandN) * (0.75 + Math.random() * 0.2)).normalize();
    v.multiplyScalar(radius * (1 + Math.random() * 0.35));
    sp.set([v.x, v.y, v.z], i * 3);
    const big = Math.random() < 0.04;
    ss[i] = big ? 2.4 + Math.random() * 1.6 : 0.7 + Math.random() * 1.1;
    const t = tints[(Math.random() * tints.length) | 0];
    const b = big ? 1 : 0.45 + Math.random() * 0.5;
    sc.set([t[0] * b, t[1] * b, t[2] * b], i * 3);
    sph[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(ss, 1));
  g.setAttribute('aColor', new THREE.BufferAttribute(sc, 3));
  g.setAttribute('aPhase', new THREE.BufferAttribute(sph, 1));
  const mat = new THREE.ShaderMaterial({
    vertexShader: STAR_VERT, fragmentShader: STAR_FRAG,
    uniforms: { uTime: { value: 0 }, uPR: { value: pr } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  scene.add(pts);
  mat.userData.points = pts;
  return mat;
}

/* one texture per pair of colours, however many sprites share it */
const GLOWS = {};
export function glowTexture(inner, outer) {
  const key = inner + '|' + outer;
  if (GLOWS[key]) return GLOWS[key];
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
  GLOWS[key] = t;
  return t;
}

export function glowSprite(inner, outer, size, color) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(inner, outer), color: color || 0xffffff,
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true
  }));
  s.scale.set(size, size, 1);
  return s;
}

/* ---------------------------------------------------------------- *
 *  The worlds                                                       *
 * ---------------------------------------------------------------- */

export const SURFACE_VERT = /* glsl */`
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

/* one shader, four kinds of world: 0 ice, 1 ocean, 2 gas giant, 3 rock */
export const SURFACE_FRAG = /* glsl */`
uniform int uType;
uniform float uSeed;
uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform vec3 uD;
uniform vec3 uAtm;
uniform vec3 uSun;
uniform float uAmb;
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
  } else if (uType == 2) {
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
  } else {
    /* rock: maria and highlands, dust, and craters with bright rims */
    float h = fbm(p * 2.2 + uSeed);
    col = mix(uA, uB, smoothstep(-0.45, 0.45, h));
    col = mix(col, uC, smoothstep(0.2, 0.6, fbm(p * 5.0 - uSeed)) * 0.55);
    float c1 = snoise(p * 4.2 + uSeed * 2.1);
    float bowl = smoothstep(0.5, 0.72, c1);
    float lip = smoothstep(0.38, 0.5, c1) * (1.0 - smoothstep(0.5, 0.58, c1));
    col = mix(col, uD, bowl * 0.55) + lip * 0.1;
    float c2 = snoise(p * 10.0 - uSeed);
    col = mix(col, uD, smoothstep(0.55, 0.8, c2) * 0.45);
    col += smoothstep(0.42, 0.5, c2) * (1.0 - smoothstep(0.5, 0.56, c2)) * 0.06;
    spec = 0.02;
  }

  vec3 N = normalize(vN);
  vec3 L = normalize(uSun - vW);
  vec3 V = normalize(cameraPosition - vW);
  float ndl = dot(N, L);
  float wrap = max((ndl + 0.1) / 1.1, 0.0);
  vec3 H = normalize(L + V);
  float sp2 = pow(max(dot(N, H), 0.0), 70.0) * spec * step(0.0, ndl);
  vec3 lit = col * (uAmb + 1.25 * wrap) + vec3(1.0, 0.96, 0.88) * sp2;
  /* the air at the edge catches the light */
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  lit += uAtm * rim * smoothstep(-0.2, 0.5, ndl) * 0.9;
  gl_FragColor = vec4(lit, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export const CLOUD_FRAG = /* glsl */`
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

export const RIM_FRAG = /* glsl */`
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

export const SUN_FRAG = /* glsl */`
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

export const RING_VERT = /* glsl */`
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
export const RING_FRAG = /* glsl */`
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

/* unit spheres, shared by every world of the same detail */
const SPHERES = {};
function sphereGeo(segs) {
  if (!SPHERES[segs]) SPHERES[segs] = new THREE.SphereGeometry(1, segs, Math.max(12, Math.round(segs * 0.66)));
  return SPHERES[segs];
}

/* A world: its surface, clouds if it has seas, the thin bright edge of an
   atmosphere, rings if it has them — all lit from `sun`.
   o = { r, type, pal:[4 colours], seed, rim, rimI, clouds, rings, tilt, spin, segs, amb, sun } */
export function makeWorld(o) {
  const sun = o.sun || new THREE.Vector3();
  const seed = o.seed || 1;
  const segs = o.segs || 48;
  const pal = o.pal.map(c => new THREE.Color(c));
  const group = new THREE.Group();
  const tilt = new THREE.Group();
  tilt.rotation.z = o.tilt == null ? 0.2 : o.tilt;
  group.add(tilt);

  const surf = new THREE.Mesh(sphereGeo(segs), new THREE.ShaderMaterial({
    vertexShader: SURFACE_VERT, fragmentShader: SURFACE_FRAG,
    uniforms: {
      uType: { value: o.type }, uSeed: { value: seed },
      uA: { value: pal[0] }, uB: { value: pal[1] }, uC: { value: pal[2] }, uD: { value: pal[3] },
      uAtm: { value: new THREE.Color(o.rim || '#9fd0ff').multiplyScalar(0.55) },
      uSun: { value: sun }, uAmb: { value: o.amb == null ? 0.04 : o.amb }
    }
  }));
  surf.scale.setScalar(o.r);
  tilt.add(surf);

  let clouds = null;
  if (o.clouds) {
    clouds = new THREE.Mesh(sphereGeo(segs), new THREE.ShaderMaterial({
      vertexShader: SURFACE_VERT, fragmentShader: CLOUD_FRAG,
      uniforms: { uSeed: { value: seed }, uTime: { value: 0 }, uSun: { value: sun } },
      transparent: true, depthWrite: false
    }));
    clouds.scale.setScalar(o.r * 1.015);
    tilt.add(clouds);
  }

  const rimU = { uColor: { value: new THREE.Color(o.rim || '#9fd0ff') },
                 uIntensity: { value: o.rimI == null ? 0.6 : o.rimI }, uSun: { value: sun } };
  const rim = new THREE.Mesh(sphereGeo(Math.max(24, segs - 16)), new THREE.ShaderMaterial({
    vertexShader: SURFACE_VERT, fragmentShader: RIM_FRAG, uniforms: rimU,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  rim.scale.setScalar(o.r * 1.045);
  group.add(rim);

  let ring = null;
  if (o.rings) {
    const rin = o.r * 1.45, rout = o.r * 2.35;
    ring = new THREE.Mesh(new THREE.RingGeometry(rin, rout, 128, 1), new THREE.ShaderMaterial({
      vertexShader: RING_VERT, fragmentShader: RING_FRAG,
      uniforms: { uIn: { value: rin }, uOut: { value: rout }, uSeed: { value: seed },
                  uA: { value: pal[1] }, uB: { value: pal[2] }, uSun: { value: sun } },
      transparent: true, depthWrite: false, side: THREE.DoubleSide
    }));
    ring.rotation.x = Math.PI / 2;
    tilt.add(ring);
  }

  const spin = o.spin == null ? 0.05 : o.spin;
  return {
    group, tilt, surf, clouds, rim, rimU, ring,
    update(dt, time) {
      surf.rotation.y += dt * spin;
      if (clouds) { clouds.rotation.y += dt * spin * 1.25; clouds.material.uniforms.uTime.value = time; }
    }
  };
}

/* A star you can look into: a boiling surface, a corona, and a wide haze */
export function makeSun(r) {
  const u = { uTime: { value: 0 } };
  const mesh = new THREE.Mesh(sphereGeo(72), new THREE.ShaderMaterial({
    vertexShader: SURFACE_VERT, fragmentShader: SUN_FRAG, uniforms: u
  }));
  mesh.scale.setScalar(r);
  const corona = glowSprite('rgba(255,238,200,0.95)', 'rgba(255,186,100,0.34)', r * 4.6);
  const haze = glowSprite('rgba(255,210,150,0.14)', 'rgba(95,224,198,0.025)', r * 15);
  return { mesh, corona, haze, u };
}

/* a thin ring, for marking a world with a colour without hiding it */
export function ringTexture() {
  const key = 'ring|';
  if (GLOWS[key]) return GLOWS[key];
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.strokeStyle = 'rgba(255,255,255,1)';
  g.lineWidth = 9;
  g.beginPath(); g.arc(128, 128, 112, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.25)';
  g.lineWidth = 22;
  g.beginPath(); g.arc(128, 128, 112, 0, Math.PI * 2); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  GLOWS[key] = t;
  return t;
}

/* ---------------------------------------------------------------- *
 *  Asteroids                                                        *
 * ---------------------------------------------------------------- */

/* rough rocks: a subdivided icosahedron pushed in and out by a smooth
   function of position, so shared corners stay shared and nothing cracks;
   flat normals give the faceted look of real boulders */
let ROCK = null;
function rockGeo() {
  if (ROCK) return ROCK;
  const g = new THREE.IcosahedronGeometry(1, 1);
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const f = 1 + 0.32 * Math.sin(v.x * 3.1 + 1.7) * Math.sin(v.y * 2.3 + 0.4) * Math.sin(v.z * 2.9 + 2.2)
                + 0.14 * Math.sin(v.x * 7.3 - v.z * 5.1 + 0.9);
    v.multiplyScalar(f);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  ROCK = g;
  return g;
}
const ROCK_VERT = /* glsl */`
attribute float aShade;
varying vec3 vN;
varying vec3 vW;
varying float vShade;
void main(){
  mat4 m = modelMatrix * instanceMatrix;
  vec4 w = m * vec4(position, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(m) * normal);
  vShade = aShade;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;
const ROCK_FRAG = /* glsl */`
uniform vec3 uSun;
uniform vec3 uColor;
uniform float uFade;
varying vec3 vN;
varying vec3 vW;
varying float vShade;
void main(){
  vec3 N = normalize(vN);
  vec3 L = normalize(uSun - vW);
  float d = max(dot(N, L), 0.0);
  vec3 col = uColor * (0.5 + 0.5 * vShade) * (0.05 + 1.15 * d);
  gl_FragColor = vec4(col * uFade, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/* A belt of asteroids round a star at `center`, between two radii, lit
   from the star, with a haze of dust among them. It turns as one, at the
   speed its middle would orbit. */
export function makeBelt(o) {
  const center = o.center || new THREE.Vector3();
  const n = o.count, inner = o.inner, outer = o.outer, thick = o.thick || 1.2, k = o.size || 1;
  const mesh = new THREE.InstancedMesh(rockGeo(), new THREE.ShaderMaterial({
    vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG,
    uniforms: { uSun: { value: center }, uColor: { value: new THREE.Color(o.color || '#8f8272') }, uFade: { value: 1 } }
  }), n);
  const shade = new Float32Array(n), dummy = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    const t = Math.random(), r = inner + (outer - inner) * (0.5 + 0.5 * Math.sin((t - 0.5) * Math.PI)) + (Math.random() - 0.5) * 1.5;
    const a = Math.random() * Math.PI * 2;
    dummy.position.set(Math.cos(a) * r, (Math.random() + Math.random() + Math.random() - 1.5) * thick, Math.sin(a) * r);
    const big = Math.random() < 0.035;
    const sc = k * (big ? 0.9 + Math.random() * 0.8 : 0.12 + Math.pow(Math.random(), 2.2) * 0.55);
    dummy.scale.set(sc * (0.7 + Math.random() * 0.6), sc * (0.6 + Math.random() * 0.5), sc * (0.7 + Math.random() * 0.6));
    dummy.rotation.set(Math.random() * 6.3, Math.random() * 6.3, Math.random() * 6.3);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    shade[i] = Math.random();
  }
  mesh.geometry = mesh.geometry.clone();
  mesh.geometry.setAttribute('aShade', new THREE.InstancedBufferAttribute(shade, 1));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.position.copy(center);
  mesh.frustumCulled = false;

  const dn = o.dust || n * 2, dp = new Float32Array(dn * 3);
  for (let i = 0; i < dn; i++) {
    const r = inner - 1 + Math.random() * (outer - inner + 2), a = Math.random() * Math.PI * 2;
    dp.set([Math.cos(a) * r, (Math.random() - 0.5) * thick * 1.6, Math.sin(a) * r], i * 3);
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dustMat = new THREE.PointsMaterial({ color: new THREE.Color(o.dustColor || '#b8a58a'), size: 0.35 * k,
    map: glowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0.25)'), transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false });
  const dust = new THREE.Points(dg, dustMat);
  dust.position.copy(center);
  dust.frustumCulled = false;

  const om = (o.speed || 6.5) / Math.pow((inner + outer) / 2, 1.5);
  return {
    mesh, dust,
    update(dt, fade) {
      mesh.rotation.y += dt * om;
      dust.rotation.y += dt * om;
      mesh.material.uniforms.uFade.value = fade;
      dustMat.opacity = 0.5 * fade;
    }
  };
}

/* ---------------------------------------------------------------- *
 *  Bright stars                                                     *
 * ---------------------------------------------------------------- */

/* a star bright enough to catch the lens: a hot core, a soft halo and
   four thin spikes */
function spikeTexture() {
  const key = 'spike|';
  if (GLOWS[key]) return GLOWS[key];
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.06, 'rgba(255,255,255,0.85)');
  gr.addColorStop(0.2, 'rgba(255,255,255,0.18)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  [[1, 0], [0, 1]].forEach(([x, y]) => {
    const lg = g.createLinearGradient(128 - x * 128, 128 - y * 128, 128 + x * 128, 128 + y * 128);
    lg.addColorStop(0, 'rgba(255,255,255,0)');
    lg.addColorStop(0.5, 'rgba(255,255,255,0.75)');
    lg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = lg;
    if (x) g.fillRect(0, 127, 256, 2); else g.fillRect(127, 0, 2, 256);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  GLOWS[key] = t;
  return t;
}
/* Each bright star is drawn as a point exactly the size a sprite of its
   width would be at its distance — the height of the picture in pixels
   times the lens's own scale — so the sky looks as it did when each star
   was a sprite of its own, in two draws instead of eighty. */
const BRIGHT_VERT = /* glsl */`
attribute float aSize;
attribute vec3 aColor;
uniform float uHalfH;
varying vec3 vC;
void main(){
  vC = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * projectionMatrix[1][1] * uHalfH / max(-mv.z, 1.0);
}
`;
const BRIGHT_FRAG = /* glsl */`
uniform sampler2D uMap;
varying vec3 vC;
void main(){
  vec4 t = texture2D(uMap, gl_PointCoord);
  gl_FragColor = vec4(vC * t.rgb, t.a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;
/* a scattering of bright stars on the sky, a third of them along the band
   of the galaxy, one in five with spikes; the group is meant to travel
   with the camera */
export function makeBrightStars(n, radius) {
  const group = new THREE.Group();
  const tints = ['#cfe0ff', '#ffffff', '#fff2d6', '#ffd9b0', '#b9d0ff'].map(c => new THREE.Color(c));
  const bandN = new THREE.Vector3(0.28, 1.0, 0.36).normalize();
  const sets = [{ P: [], C: [], S: [] }, { P: [], C: [], S: [] }];      /* round, spiked */
  for (let i = 0; i < n; i++) {
    const v = new THREE.Vector3().randomDirection();
    if (i < n * 0.35) v.addScaledVector(bandN, -v.dot(bandN) * 0.85).normalize();
    const spike = i % 5 === 0, set = sets[spike ? 1 : 0];
    /* a sprite's opacity only ever scaled its light, so it is folded into the colour */
    const c = tints[i % tints.length].clone().multiplyScalar(0.55 + Math.random() * 0.45);
    set.S.push(radius * (spike ? 0.03 + Math.random() * 0.025 : 0.01 + Math.random() * 0.016));
    v.multiplyScalar(radius);
    set.P.push(v.x, v.y, v.z);
    set.C.push(c.r, c.g, c.b);
  }
  /* the picture's height, read as each set is drawn: the composer's target,
     whatever resolution it has been given */
  const halfH = { value: 512 }, sz = new THREE.Vector2();
  const measure = renderer => {
    const rt = renderer.getRenderTarget();
    halfH.value = (rt ? rt.height : renderer.getDrawingBufferSize(sz).y) / 2;
  };
  [glowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0.22)'), spikeTexture()].forEach((map, k) => {
    const set = sets[k];
    if (!set.S.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(set.P, 3));
    g.setAttribute('aColor', new THREE.Float32BufferAttribute(set.C, 3));
    g.setAttribute('aSize', new THREE.Float32BufferAttribute(set.S, 1));
    const pts = new THREE.Points(g, new THREE.ShaderMaterial({
      vertexShader: BRIGHT_VERT, fragmentShader: BRIGHT_FRAG,
      uniforms: { uMap: { value: map }, uHalfH: halfH },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    pts.frustumCulled = false;
    pts.onBeforeRender = measure;
    group.add(pts);
  });
  return group;
}
