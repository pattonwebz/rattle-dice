/* Rattle — a dice app for tabletop games. Vanilla JS, no build step. */
'use strict';

/* ---------------- utils ---------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = () => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; };
const randInt = n => Math.floor(rand() * n);

/* ---------------- 3D vector & matrix helpers ---------------- */
const V = {
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  scale: (a, s) => [a[0] * s, a[1] * s, a[2] * s]
};

const I3 = () => [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const mul3 = (A, B) => {
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    let s = 0; for (let k = 0; k < 3; k++) s += A[i][k] * B[k][j]; C[i][j] = s;
  }
  return C;
};
function rotMatrix(axis, angle) { // Rodrigues
  const [x, y, z] = V.norm(axis);
  const c = Math.cos(angle), s = Math.sin(angle), t = 1 - c;
  return [
    [c + x * x * t, x * y * t - z * s, x * z * t + y * s],
    [y * x * t + z * s, c + y * y * t, y * z * t - x * s],
    [z * x * t - y * s, z * y * t + x * s, c + z * z * t]
  ];
}
function alignMatrix(n, t) { // rotation mapping unit n -> unit t
  const axis = V.cross(n, t);
  const c = V.dot(n, t);
  if (Math.hypot(axis[0], axis[1], axis[2]) < 1e-9) return c > 0 ? I3() : rotMatrix([1, 0, 0], Math.PI);
  return rotMatrix(axis, Math.acos(clamp(c, -1, 1)));
}
function toMatrix3d(M) {
  return `matrix3d(${M[0][0]},${M[1][0]},${M[2][0]},0,${M[0][1]},${M[1][1]},${M[2][1]},0,${M[0][2]},${M[1][2]},${M[2][2]},0,0,0,0,1)`;
}
const randomRot = () => rotMatrix([rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1], rand() * Math.PI * 2);

/* ---------------- polyhedron geometry ---------------- */
const PHI = (1 + Math.sqrt(5)) / 2;

function faceNormal(verts) {
  let n = V.cross(V.sub(verts[1], verts[0]), V.sub(verts[2], verts[0]));
  const cx = (verts[0][0] + verts[1][0] + verts[2][0]) / 3;
  const cy = (verts[0][1] + verts[1][1] + verts[2][1]) / 3;
  const cz = (verts[0][2] + verts[1][2] + verts[2][2]) / 3;
  if (V.dot(n, [cx, cy, cz]) < 0) n = V.scale(n, -1);
  return V.norm(n);
}

function squareFor(n) {
  let ref = [1, 0, 0];
  if (Math.abs(V.dot(n, ref)) > 0.9) ref = [0, 1, 0];
  const u = V.norm(V.cross(n, ref));
  const w = V.cross(n, u);
  const c = V.scale(n, 1);
  return [
    [c[0] - u[0] - w[0], c[1] - u[1] - w[1], c[2] - u[2] - w[2]],
    [c[0] + u[0] - w[0], c[1] + u[1] - w[1], c[2] + u[2] - w[2]],
    [c[0] + u[0] + w[0], c[1] + u[1] + w[1], c[2] + u[2] + w[2]],
    [c[0] - u[0] + w[0], c[1] - u[1] + w[1], c[2] - u[2] + w[2]]
  ];
}

function tetraFaces() {
  const s = 1 / Math.sqrt(3);
  const A = [s, s, s], B = [s, -s, -s], C = [-s, s, -s], D = [-s, -s, s];
  const faces = [[A, B, C], [A, B, D], [A, C, D], [B, C, D]];
  return faces.map((f, i) => {
    const n = faceNormal(f);
    return { value: i + 1, label: String(i + 1), n, dist: V.dot(n, f[0]), verts: f };
  });
}

function cubeFaces() {
  const dirs = [[0, 0, 1], [0, 1, 0], [1, 0, 0], [0, 0, -1], [0, -1, 0], [-1, 0, 0]];
  const vals = [1, 2, 3, 6, 5, 4]; // opposites sum to 7
  return dirs.map((d, i) => {
    const n = V.norm(d);
    const verts = squareFor(n);
    return { value: vals[i], label: String(vals[i]), n, dist: 1, verts };
  });
}

function octaFaces() {
  const T = [0, 0, 1], B = [0, 0, -1];
  const E = [[1, 0, 0], [0, 1, 0], [-1, 0, 0], [0, -1, 0]];
  const raw = [];
  for (let k = 0; k < 4; k++) {
    raw.push({ verts: [T, E[k], E[(k + 1) % 4]] });
    raw.push({ verts: [B, E[k], E[(k + 1) % 4]] });
  }
  return raw.map((f, i) => {
    const n = faceNormal(f.verts);
    const value = i < 4 ? i + 1 : 8 - (i - 4); // tops 1-4, bottoms 8-5
    return { value, label: String(value), n, dist: V.dot(n, f.verts[0]), verts: f.verts };
  });
}

function icosaDirs() {
  const out = [];
  for (const a of [1, -1]) for (const b of [1, -1]) {
    out.push([0, b, a * PHI]);
    out.push([a * PHI, 0, b]);
    out.push([b, a * PHI, 0]);
  }
  return out.map(V.norm);
}

function dodecaDirs() {
  const out = [], r = 1 / PHI;
  for (const a of [1, -1]) for (const b of [1, -1]) for (const c of [1, -1]) out.push([a, b, c]);
  for (const a of [1, -1]) for (const b of [1, -1]) {
    out.push([0, a * r, b * PHI]);
    out.push([a * r, b * PHI, 0]);
    out.push([b * PHI, 0, a * r]);
  }
  return out.map(V.norm);
}

function maxDotFaces(normals, verts) {
  return normals.map(n => {
    let max = -Infinity;
    for (const v of verts) max = Math.max(max, V.dot(v, n));
    const faceVerts = verts.filter(v => V.dot(v, n) > max - 1e-6);
    return { n, dist: max, verts: faceVerts };
  });
}

function assignOpposites(faces) {
  const taken = new Set();
  let low = 1, high = faces.length;
  const out = [];
  for (let i = 0; i < faces.length; i++) {
    if (taken.has(i)) continue;
    const n = faces[i].n;
    let opp = -1;
    for (let j = i + 1; j < faces.length; j++) {
      if (!taken.has(j) && V.dot(n, faces[j].n) < -0.999) { opp = j; break; }
    }
    taken.add(i);
    const f = faces[i];
    out[i] = { ...f, value: low, label: String(low) };
    low++;
    if (opp >= 0) {
      taken.add(opp);
      const g = faces[opp];
      out[opp] = { ...g, value: high, label: String(high) };
      high--;
    }
  }
  return out;
}

function trapezoFaces(tens) { // pentagonal trapezohedron via antiprism dual
  const n = 5, h = 0.53;
  const U = [], L = [];
  for (let k = 0; k < n; k++) {
    const a = 2 * Math.PI * k / n;
    U.push([Math.cos(a), Math.sin(a), h]);
    L.push([Math.cos(a + Math.PI / n), Math.sin(a + Math.PI / n), -h]);
  }
  const primal = [
    { v: U.slice(), kind: 'pentTop' },
    { v: L.slice(), kind: 'pentBot' }
  ];
  for (let k = 0; k < n; k++) {
    primal.push({ v: [U[k], U[(k + 1) % n], L[k]], kind: 'tT' + k });
    primal.push({ v: [L[k], L[(k + 1) % n], U[(k + 1) % n]], kind: 'tB' + k });
  }
  const dv = {};
  for (const f of primal) dv[f.kind] = faceNormal(f.v);
  const kiteKeys = [];
  for (let k = 0; k < n; k++) {
    kiteKeys.push(['pentTop', 'tT' + ((k - 1 + n) % n), 'tT' + k, 'tB' + ((k - 1 + n) % n)]);
    kiteKeys.push(['pentBot', 'tT' + k, 'tB' + ((k - 1 + n) % n), 'tB' + k]);
  }
  const faces = kiteKeys.map(keys => {
    const pts = keys.map(k => dv[k]);
    const nrm = faceNormal(pts);
    return { pts, n: nrm, dist: V.dot(nrm, pts[0]) };
  });
  // pair faces by opposing normals, assign 0-4 to one side, 9-5 to the other
  const values = new Array(faces.length).fill(-1);
  let low = 0, high = 2 * n - 1;
  for (let i = 0; i < faces.length; i++) {
    if (values[i] !== -1) continue;
    let opp = -1, best = 0;
    for (let j = i + 1; j < faces.length; j++) {
      const d = V.dot(faces[i].n, faces[j].n);
      if (d < best) { best = d; opp = j; }
    }
    values[i] = low;
    if (opp >= 0) values[opp] = high;
    low++; high--;
  }
  return faces.map((f, i) => {
    const value = values[i];
    const label = tens ? String(value * 10).padStart(2, '0') : String(value);
    return { ...f, value, label, verts: f.pts };
  });
}

function polyPoints(n, verts) {
  let ref = [1, 0, 0];
  if (Math.abs(V.dot(n, ref)) > 0.9) ref = [0, 1, 0];
  const u = V.norm(V.cross(n, ref));
  const w = V.cross(n, u);
  const pts = verts.map(v => [V.dot(v, u), V.dot(v, w)]);
  const c = [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
  const sorted = pts.map(p => ({ p, a: Math.atan2(p[1] - c[1], p[0] - c[0]) })).sort((a, b) => a.a - b.a).map(x => x.p);
  let max = 0;
  for (const p of sorted) max = Math.max(max, Math.abs(p[0]), Math.abs(p[1]));
  max *= 1.02;
  return sorted.map(p => `${((p[0] / max + 1) * 50).toFixed(2)}% ${((p[1] / max + 1) * 50).toFixed(2)}%`).join(', ');
}

const GEOMETRY = (() => {
  const base = {
    d4: { faces: tetraFaces(), panel: 0.92 },
    d6: { faces: cubeFaces(), panel: 1 },
    d8: { faces: octaFaces(), panel: 0.8 },
    d10: { faces: trapezoFaces(false), panel: 0.56 },
    d12: { faces: assignOpposites(maxDotFaces(icosaDirs(), dodecaDirs())), panel: 0.5 },
    d20: { faces: assignOpposites(maxDotFaces(dodecaDirs(), icosaDirs())), panel: 0.52 }
  };
  base.d10t = { faces: trapezoFaces(true), panel: 0.56 };
  for (const key of Object.keys(base)) {
    for (const f of base[key].faces) f.poly = polyPoints(f.n, f.verts);
  }
  return base;
})();

const DIE_TYPES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];
const TRAY_META = {
  d4: { label: 'd4' }, d6: { label: 'd6' }, d8: { label: 'd8' },
  d10: { label: 'd10' }, d12: { label: 'd12' }, d20: { label: 'd20' }, d100: { label: 'd100' }
};

/* ---------------- expression parser ---------------- */
function parseExpr(str) {
  const s = str.replace(/\s+/g, '').toLowerCase();
  if (!s) throw new Error('Enter an expression first.');
  const groups = [];
  let mod = 0, i = 0, sign = 1;
  const num = () => {
    let j = i;
    while (j < s.length && /\d/.test(s[j])) j++;
    const v = j > i ? parseInt(s.slice(i, j), 10) : 0;
    i = j;
    return v;
  };
  while (i < s.length) {
    let j = i;
    while (j < s.length && /\d/.test(s[j])) j++;
    if (s[j] === 'd') {
      const cnt = j > i ? parseInt(s.slice(i, j), 10) : 1;
      i = j + 1;
      const sides = num();
      const ops = {};
      while (i < s.length) {
        const c = s[i];
        if (c === 'k') { i++; const w = s[i]; i++; const nn = num() || 1; if (w === 'h') ops.kh = nn; else ops.kl = nn; }
        else if (c === 'd') { i++; const w = s[i]; i++; const nn = num() || 1; if (w === 'h') ops.dh = nn; else ops.dl = nn; }
        else if (c === 'r') { i++; if (s[i] === 'r') { i++; ops.rr = num() || 1; } else ops.r = num() || 1; }
        else if (c === '!') { i++; ops.explode = true; }
        else if (c === 'm') { i++; if (s[i] === 'i') { i++; ops.min = num(); } else if (s[i] === 'a') { i++; ops.max = num(); } else throw new Error('Bad modifier.'); }
        else break;
      }
      if (![4, 6, 8, 10, 12, 20, 100].includes(sides)) throw new Error(`No such die: d${sides}`);
      if (cnt < 1 || cnt > 999) throw new Error('Dice count out of range.');
      groups.push({ cnt, sides, ops, sign });
    } else {
      const v = j > i ? parseInt(s.slice(i, j), 10) : 0;
      i = j;
      mod += sign * v;
    }
    if (i < s.length) {
      const c = s[i];
      if (c === '+' || c === '-') { sign = c === '+' ? 1 : -1; i++; }
      else throw new Error(`Unexpected character "${c}".`);
    }
  }
  return { groups, mod };
}

/* ---------------- rolling ---------------- */
function rollDie(sides, ops) {
  let v = 1 + randInt(sides);
  if (ops.explode) {
    let guard = 0;
    while (v % sides === 0 && guard < 40) { v += 1 + randInt(sides); guard++; }
  }
  if (ops.r) { if (v === ops.r) v = 1 + randInt(sides); }
  if (ops.rr) { let guard = 0; while (v === ops.rr && guard < 100) { v = 1 + randInt(sides); guard++; } }
  return v;
}

function rollGroup(g) {
  if (g.sides === 100) {
    const tens = 1 + randInt(10) - 1; // 0-9
    const units = 1 + randInt(10) - 1; // 0-9
    const combined = tens * 10 + units;
    return {
      sides: 100, cnt: 1,
      dies: [
        { value: tens, type: 'd10t', kept: true, dropped: false, label: String(tens * 10).padStart(2, '0') },
        { value: units, type: 'd10', kept: true, dropped: false, label: String(units) }
      ],
      total: combined === 0 ? 100 : combined,
      combined: combined === 0 ? 100 : combined
    };
  }
  const dies = [];
  for (let k = 0; k < g.cnt; k++) {
    dies.push({ value: rollDie(g.sides, g.ops), type: 'd' + g.sides, kept: true, dropped: false });
  }
  const { kh, kl, dh, dl } = g.ops;
  if (kh || kl || dh || dl) {
    const idx = dies.map((_, i) => i).sort((a, b) => dies[a].value - dies[b].value);
    const drop = n => { for (let k = 0; k < n; k++) dies[idx[k]].dropped = true; };       // lowest
    const dropHigh = n => { for (let k = 0; k < n; k++) dies[idx[idx.length - 1 - k]].dropped = true; }; // highest
    if (kh) drop(Math.max(0, dies.length - kh));       // keep highest: drop lowest N-kh
    else if (kl) dropHigh(Math.max(0, dies.length - kl)); // keep lowest: drop highest N-kl
    else if (dh) dropHigh(dh);
    else if (dl) drop(dl);
    for (const d of dies) if (d.dropped) d.kept = false;
  }
  return { sides: g.sides, cnt: g.cnt, dies, total: dies.reduce((s, d) => s + (d.kept ? d.value : 0), 0) };
}

function rollExpression(parsed) {
  const groups = parsed.groups.map(rollGroup);
  const total = groups.reduce((s, g) => s + g.total, 0) + parsed.mod;
  return { groups, mod: parsed.mod, total };
}

function exprLabel(parsed) {
  return parsed.groups.map(g =>
    g.sides === 100 ? 'd100' : `${g.cnt}d${g.sides}${suffix(g.ops)}`
  ).join(parsed.groups.length > 1 ? ' + ' : '') + (parsed.mod ? `${parsed.mod > 0 ? ' + ' : ' − '}${Math.abs(parsed.mod)}` : '');
}
function suffix(ops) {
  let s = '';
  if (ops.kh) s += `kh${ops.kh}`;
  if (ops.kl) s += `kl${ops.kl}`;
  if (ops.dh) s += `dh${ops.dh}`;
  if (ops.dl) s += `dl${ops.dl}`;
  if (ops.r) s += `r${ops.r}`;
  if (ops.rr) s += `rr${ops.rr}`;
  if (ops.explode) s += '!';
  if (ops.min) s += `mi${ops.min}`;
  if (ops.max) s += `ma${ops.max}`;
  return s;
}

/* ---------------- die DOM building ---------------- */
function buildFaceEl(face, dieType, size) {
  const el = document.createElement('div');
  el.className = 'face';
  el.dataset.value = face.value;
  const panel = size * (GEOMETRY[dieType] ? GEOMETRY[dieType].panel : 0.8);
  el.style.width = el.style.height = panel.toFixed(1) + 'px';
  el.style.marginLeft = el.style.marginTop = (-panel / 2).toFixed(1) + 'px';
  const M = alignMatrix(face.n, [0, 0, 1]);
  const tz = face.dist * size / 2;
  el.style.transform = `${toMatrix3d(M)} translateZ(${tz.toFixed(2)}px)`;
  if (face.poly) el.style.clipPath = `polygon(${face.poly})`;
  el.innerHTML = faceHTML(face, dieType, panel);
  return el;
}

const PIPS = {
  1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]], 5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]]
};

function faceHTML(face, dieType, panel) {
  if (dieType === 'd6') {
    const pips = PIPS[face.value] || [];
    return `<span class="pips">${pips.map(p => `<i style="left:${p[0] * 50}%;top:${p[1] * 50}%"></i>`).join('')}</span>`;
  }
  const fs = Math.max(10, panel * 0.34);
  return `<span class="face-num" style="font-size:${fs.toFixed(0)}px">${face.label}</span>`;
}

function settleMatrix(face) {
  const R = alignMatrix(face.n, [0, 0, 1]);
  const spin = rotMatrix([0, 0, 1], rand() * Math.PI * 2);
  return mul3(spin, R);
}

function buildDie(type, value, size) {
  const actor = document.createElement('div');
  actor.className = 'die-actor';
  const rot = document.createElement('div');
  rot.className = 'die-rotator die-' + type;
  const g = GEOMETRY[type] || GEOMETRY.d6;
  const face = g.faces.find(f => f.value === value) || g.faces[0];
  for (const f of g.faces) rot.appendChild(buildFaceEl(f, type, size));
  actor.appendChild(rot);
  return { actor, rot, settle: settleMatrix(face), size };
}

/* ---------------- sound ---------------- */
const Sound = (() => {
  let ctx = null, enabled = true;
  function ensure() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* no audio */ } }
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }
  function noise(ms, freq, gain) {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * ms / 1000);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(ctx.destination);
    src.start(t);
  }
  return {
    ensure, setEnabled(v) { enabled = v; },
    thud() { noise(70 + rand() * 40, 450 + rand() * 350, 0.22); },
    tick() { noise(40, 1800, 0.06); }
  };
})();

/* ---------------- state ---------------- */
const state = {
  anim: 'full',
  together: false,
  sound: true,
  crit: true,
  fumble: true,
  selected: new Set(),
  rolling: false
};

const store = {
  load() {
    try {
      const s = JSON.parse(localStorage.getItem('rattle-settings') || '{}');
      Object.assign(state, {
        anim: s.anim || 'full',
        together: !!s.together,
        sound: s.sound !== false,
        crit: s.crit !== false,
        fumble: s.fumble !== false
      });
    } catch (e) { /* defaults */ }
  },
  save() {
    try {
      localStorage.setItem('rattle-settings', JSON.stringify({
        anim: state.anim, together: state.together, sound: state.sound,
        crit: state.crit, fumble: state.fumble
      }));
    } catch (e) { /* storage full */ }
  }
};

let history = [];
function loadHistory() {
  try { history = JSON.parse(localStorage.getItem('rattle-history') || '[]'); } catch (e) { history = []; }
}
function saveHistory() {
  try { localStorage.setItem('rattle-history', JSON.stringify(history.slice(0, 50))); } catch (e) { /* full */ }
}

/* ---------------- stage & animation ---------------- */
function stageSize() {
  const field = $('#dice-field');
  const r = field.getBoundingClientRect();
  return { w: Math.max(r.width, 320), h: Math.max(r.height, 200) };
}

function dieSize(count) {
  if (count <= 1) return 96;
  if (count <= 2) return 80;
  if (count <= 4) return 66;
  if (count <= 8) return 54;
  return 44;
}

function layoutPositions(count, size, { w, h }) {
  const gap = size * 0.45;
  const total = count * size + (count - 1) * gap;
  const x0 = -total / 2 + size / 2;
  const out = [];
  for (let i = 0; i < count; i++) {
    const x = x0 + i * (size + gap);
    const y = (i % 3 - 1) * size * 0.32 + (rand() - 0.5) * size * 0.4;
    out.push({ x: clamp(x, -w / 2 + size / 2, w / 2 - size / 2), y: clamp(y, -h / 2 + size / 2, h / 2 - size / 2) });
  }
  return out;
}

const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
const EASE_LAND = 'cubic-bezier(0.34, 1.4, 0.5, 1)';

function settleActor(actor, rot, settle, t) {
  rot.style.transform = toMatrix3d(settle);
  actor.style.transform = `translate(-50%, -50%) translate(${t.x}px,${t.y}px) scale(1)`;
  actor.style.opacity = '1';
}

function animateRoll(items, mode) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const eff = reduced ? 'none' : mode;
  const { w, h } = stageSize();
  const count = items.length;
  const size = dieSize(count);
  const targets = layoutPositions(count, size, { w, h });

  items.forEach((item, i) => {
    const { actor, rot, settle } = item;
    const t = targets[i];
    const actorBase = `translate(-50%, -50%)`;
    const delay = i * 90 + rand() * 70;

    if (eff === 'none') {
      settleActor(actor, rot, settle, t);
      return;
    }

    if (eff === 'minimal') {
      const m0 = randomRot(), m1 = randomRot();
      const rotAnim = rot.animate([
        { transform: toMatrix3d(m0), offset: 0, easing: 'ease-in-out' },
        { transform: toMatrix3d(m1), offset: 0.55, easing: EASE_OUT },
        { transform: toMatrix3d(settle), offset: 1 }
      ], { duration: 850 + delay, delay, fill: 'both' });
      const actorAnim = actor.animate([
        { transform: `${actorBase} translate(0px,0px) scale(0.92)`, opacity: 0, offset: 0, easing: EASE_OUT },
        { transform: `${actorBase} translate(0px,0px) scale(1.03)`, opacity: 1, offset: 0.85, easing: EASE_LAND },
        { transform: `${actorBase} translate(0px,0px) scale(1)`, opacity: 1, offset: 1 }
      ], { duration: 850 + delay, delay, fill: 'both' });
      Promise.all([rotAnim.finished, actorAnim.finished]).then(() => settleActor(actor, rot, settle, { x: 0, y: 0 })).catch(() => {});
      return;
    }

    // full
    const sx = (rand() - 0.5) * w * 0.9;
    const sy = (rand() - 0.5) * h * 0.9;
    const m0 = randomRot(), m1 = randomRot(), m2 = randomRot();
    const rotAnim = rot.animate([
      { transform: toMatrix3d(m0), offset: 0, easing: 'ease-out' },
      { transform: toMatrix3d(m1), offset: 0.4, easing: 'ease-out' },
      { transform: toMatrix3d(m2), offset: 0.75, easing: EASE_OUT },
      { transform: toMatrix3d(settle), offset: 1 }
    ], { duration: 1350 + delay, delay, fill: 'both' });
    const actorAnim = actor.animate([
      { transform: `${actorBase} translate(${sx}px,${sy}px) scale(0.5)`, opacity: 0, offset: 0, easing: 'ease-out' },
      { transform: `${actorBase} translate(${sx * 0.55}px,${sy * 0.55}px) scale(0.85)`, opacity: 1, offset: 0.2, easing: 'ease-out' },
      { transform: `${actorBase} translate(${t.x}px,${t.y}px) scale(1.1)`, offset: 0.85, easing: EASE_LAND },
      { transform: `${actorBase} translate(${t.x}px,${t.y}px) scale(1)`, offset: 1 }
    ], { duration: 1350 + delay, delay, fill: 'both' });
    Promise.all([rotAnim.finished, actorAnim.finished]).then(() => settleActor(actor, rot, settle, t)).catch(() => {});
    window.setTimeout(() => Sound.thud(), 900 + delay + rand() * 300);
  });
  return targets;
}

/* ---------------- readout ---------------- */
function fmtDie(d, type) {
  const label = d.label !== undefined ? d.label : String(d.value);
  if (d.dropped) return `<s>${label}</s>`;
  return `<b>${label}</b>`;
}

function renderReadout(parsed, roll) {
  const labelEl = $('#result-label');
  const valueEl = $('#result-value');
  const detailEl = $('#result-detail');
  const groups = roll.groups;
  const parts = groups.map(g => {
    const name = g.sides === 100 ? 'd100' : `${g.cnt}d${g.sides}${g.ops ? suffix(g.ops) : ''}`;
    const vals = g.dies.map(d => fmtDie(d, d.type)).join(' · ');
    const sum = g.sides === 100 ? g.combined : g.dies.reduce((s, d) => s + (d.kept ? d.value : 0), 0);
    return `${name}: ${vals} → ${sum}`;
  });
  const modPart = roll.mod ? `${roll.mod > 0 ? ' + ' : ' − '}${Math.abs(roll.mod)}` : '';
  labelEl.textContent = exprLabel(parsed);
  valueEl.textContent = String(roll.total);
  detailEl.innerHTML = parts.join('  ') + modPart + ` = ${roll.total}`;

  valueEl.classList.remove('is-crit', 'is-fumble', 'is-spin');
  let special = '';
  for (const g of groups) {
    if (g.sides === 20 && g.cnt === 1) {
      const v = g.dies[0].value;
      if (v === 20 && state.crit) { valueEl.classList.add('is-crit'); special = 'Natural 20'; }
      if (v === 1 && state.fumble) { valueEl.classList.add('is-fumble'); special = 'Natural 1'; }
    }
  }
  valueEl.classList.add('is-spin');
  labelEl.textContent = special || exprLabel(parsed);
  window.setTimeout(() => valueEl.classList.remove('is-spin'), 350);
}

/* ---------------- history ---------------- */
function pushHistory(parsed, roll) {
  const detail = roll.groups.map(g =>
    g.sides === 100 ? `${g.combined}` : g.dies.map(d => d.label !== undefined ? d.label : d.value).join(',')
  ).join('; ');
  history.unshift({
    expr: exprLabel(parsed),
    total: roll.total,
    detail,
    ts: Date.now()
  });
  history = history.slice(0, 50);
  saveHistory();
  renderHistory();
}

function renderHistory() {
  const list = $('#history-list');
  list.innerHTML = '';
  if (history.length === 0) {
    const li = document.createElement('li');
    li.className = 'history-empty';
    li.textContent = 'No rolls yet.';
    list.appendChild(li);
  }
  for (const h of history) {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    li.setAttribute('aria-label', `Reroll ${h.expr}`);
    const time = new Date(h.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    li.innerHTML = `<span class="history-expr">${h.expr}</span><span class="history-detail">${h.detail}</span><span class="history-total">${h.total}</span><span class="history-time">${time}</span>`;
    li.addEventListener('click', () => { $('#expr-input').value = h.expr; doRoll(h.expr); });
    li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); li.click(); } });
    list.appendChild(li);
  }
  const count = $('#history-count');
  if (count) {
    count.hidden = history.length === 0;
    count.textContent = String(history.length);
  }
}

/* ---------------- main roll flow ---------------- */
function doRoll(exprStr) {
  let parsed;
  try {
    parsed = parseExpr(exprStr);
  } catch (err) {
    showExprError(err.message);
    return;
  }
  clearExprError();
  const roll = rollExpression(parsed);
  const field = $('#dice-field');
  field.innerHTML = '';
  $('#stage-empty').hidden = true;
  $('#table-glow').classList.remove('is-lit');

  const items = [];
  let totalDice = 0;
  for (const g of roll.groups) {
    for (const d of g.dies) totalDice++;
  }
  const size = dieSize(totalDice || 1);
  for (const g of roll.groups) {
    for (const d of g.dies) items.push(buildDie(d.type, d.value, size));
  }

  // build DOM
  for (const it of items) {
    const holder = it.actor;
    holder.style.setProperty('--die-size', it.size + 'px');
    field.appendChild(holder);
  }

  // roll feedback
  $('#result-label').textContent = 'Rolling…';
  $('#result-value').textContent = '…';
  $('#result-detail').textContent = '';
  Sound.ensure();
  if (state.sound) Sound.tick();
  state.rolling = true;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const effectiveNone = state.anim === 'none' || reduced;
  const duration = effectiveNone ? 60 : (state.anim === 'minimal' ? 950 : 1500);
  const targets = animateRoll(items, state.anim);

  window.setTimeout(() => {
    state.rolling = false;
    // force final settled state so dice are always visible after a roll
    items.forEach((item, i) => {
      settleActor(item.actor, item.rot, item.settle, targets[i] || { x: 0, y: 0 });
    });
    renderReadout(parsed, roll);
    pushHistory(parsed, roll);
    $('#table-glow').classList.add('is-lit');
  }, duration + (effectiveNone ? 0 : items.length * 110) + 120);
}

/* ---------------- tray ---------------- */
function buildTray() {
  const tray = $('#die-tray');
  tray.innerHTML = '';
  for (const type of DIE_TYPES) {
    const btn = document.createElement('button');
    btn.className = 'die-btn';
    btn.dataset.type = type;
    btn.setAttribute('role', 'listitem');
    btn.setAttribute('aria-pressed', 'false');
    const label = TRAY_META[type].label;
    btn.innerHTML = `<span class="die-btn-glyph" aria-hidden="true"></span><span class="die-btn-label">${label}</span>`;
    btn.addEventListener('click', () => onTrayClick(type, btn));
    tray.appendChild(btn);
  }
}

function onTrayClick(type, btn) {
  if (state.together) {
    if (state.selected.has(type)) { state.selected.delete(type); btn.setAttribute('aria-pressed', 'false'); btn.classList.remove('is-selected'); }
    else { state.selected.add(type); btn.setAttribute('aria-pressed', 'true'); btn.classList.add('is-selected'); }
    updateRollTogetherBtn();
  } else {
    state.selected.clear();
    refreshSelection();
    doRoll(type);
  }
}

function refreshSelection() {
  $$('.die-btn').forEach(b => {
    const on = state.selected.has(b.dataset.type);
    b.classList.toggle('is-selected', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

function updateRollTogetherBtn() {
  const btn = $('#roll-together-btn');
  const n = state.selected.size;
  if (n === 0) { btn.hidden = true; return; }
  btn.hidden = false;
  btn.textContent = `Roll ${n} ${n === 1 ? 'die' : 'dice'}`;
}

/* ---------------- panels & settings ---------------- */
let panelCloseToken = 0;
function openPanel(id) {
  panelCloseToken++; // cancel any pending close re-hide
  const panel = $('#' + id);
  panel.hidden = false;
  requestAnimationFrame(() => panel.classList.add('is-open'));
  $('#scrim').hidden = false;
  $('#' + id + '-toggle')?.setAttribute('aria-expanded', 'true');
  document.body.classList.add('has-panel');
}
function closePanels() {
  const token = ++panelCloseToken;
  $$('.panel').forEach(p => { p.classList.remove('is-open'); });
  window.setTimeout(() => {
    if (token !== panelCloseToken) return;
    $$('.panel').forEach(p => { p.hidden = true; });
  }, 220);
  $('#scrim').hidden = true;
  $('#history-toggle').setAttribute('aria-expanded', 'false');
  $('#settings-toggle').setAttribute('aria-expanded', 'false');
  document.body.classList.remove('has-panel');
}

function bindSettings() {
  const animRadios = $$('input[name="anim"]');
  animRadios.forEach(r => {
    r.checked = r.value === state.anim;
    r.addEventListener('change', () => {
      if (!r.checked) return;
      state.anim = r.value;
      store.save();
      const hint = $('#anim-hint');
      hint.textContent = r.value === 'full' ? 'Full tumbles dice across the table.' :
        r.value === 'minimal' ? 'Minimal spins a die in place.' : 'None rolls instantly.';
    });
  });
  const bind = (id, key) => {
    const el = $('#' + id);
    el.checked = state[key];
    el.addEventListener('change', () => { state[key] = el.checked; store.save(); if (key === 'sound') Sound.setEnabled(el.checked); });
  };
  bind('roll-together', 'together');
  bind('sound-toggle', 'sound');
  bind('crit-toggle', 'crit');
  bind('fumble-toggle', 'fumble');
  Sound.setEnabled(state.sound);
}

function showExprError(msg) {
  const form = $('#expr-form');
  form.classList.add('has-error');
  let err = $('#expr-error');
  if (!err) {
    err = document.createElement('p');
    err.id = 'expr-error';
    err.className = 'expr-error';
    err.setAttribute('role', 'alert');
    form.appendChild(err);
  }
  err.textContent = msg;
}
function clearExprError() {
  const form = $('#expr-form');
  form.classList.remove('has-error');
  const err = $('#expr-error');
  if (err) err.remove();
}

/* ---------------- init ---------------- */
function init() {
  store.load();
  loadHistory();
  buildTray();
  renderHistory();
  bindSettings();
  refreshSelection();

  // roll-together button
  const rollBtn = document.createElement('button');
  rollBtn.className = 'btn btn-primary btn-roll-together';
  rollBtn.id = 'roll-together-btn';
  rollBtn.hidden = true;
  rollBtn.addEventListener('click', () => {
    if (state.selected.size === 0) return;
    const expr = [...state.selected].join('+');
    doRoll(expr);
  });
  $('#tray-head').appendChild(rollBtn);
  updateRollTogetherBtn();

  // expression form
  $('#expr-form').addEventListener('submit', e => {
    e.preventDefault();
    doRoll($('#expr-input').value);
  });

  // quick rolls
  const qs = $('#quick-select');
  const ql = $('#quick-list');
  qs.addEventListener('click', () => {
    const open = ql.hidden;
    ql.hidden = !open;
    qs.setAttribute('aria-expanded', String(open));
  });
  $$('#quick-list .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const expr = chip.dataset.expr;
      $('#expr-input').value = expr;
      doRoll(expr);
      ql.hidden = true;
      qs.setAttribute('aria-expanded', 'false');
    });
  });

  // panels
  $('#history-toggle').addEventListener('click', () => {
    const open = $('#history-panel').hidden;
    closePanels();
    if (open) openPanel('history-panel');
  });
  $('#settings-toggle').addEventListener('click', () => {
    const open = $('#settings-panel').hidden;
    closePanels();
    if (open) openPanel('settings-panel');
  });
  $$('[data-close-panel]').forEach(b => b.addEventListener('click', closePanels));
  $('#scrim').addEventListener('click', closePanels);
  $('#history-clear').addEventListener('click', () => {
    history = [];
    saveHistory();
    renderHistory();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePanels();
  });

  // seed an example roll so the app never opens dead
  doRoll('1d20');
}

document.addEventListener('DOMContentLoaded', init);
