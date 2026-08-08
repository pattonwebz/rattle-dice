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
  // A real d4 reads its value from the top vertex. Each vertex touches 3
  // faces, and the vertex's value is the number of the face it does NOT
  // touch:
  //   vertex A (touches f0,f1,f2) -> value 4
  //   vertex B (touches f0,f1,f3) -> value 3
  //   vertex C (touches f0,f2,f3) -> value 2
  //   vertex D (touches f1,f2,f3) -> value 1
  // Each face displays the value of each of its 3 corners (a real d4 prints
  // the same number near each corner), so when the die rests, all three
  // visible faces show the rolled value at the top vertex.
  const vertexVal = v => {
    // the value of a vertex = index+1 of the face NOT containing it
    const idx = faces.findIndex(f => !f.some(fv => fv.every((c, i) => Math.abs(c - v[i]) < 1e-9)));
    return idx + 1;
  };
  return faces.map((f, i) => {
    const n = faceNormal(f);
    // corners: for each vertex of this face, its value
    const corners = f.map(v => vertexVal(v));
    return { value: i + 1, label: String(i + 1), corners, n, dist: V.dot(n, f[0]), verts: f };
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
  const faces = raw.map(f => {
    const n = faceNormal(f.verts);
    return { n, dist: V.dot(n, f.verts[0]), verts: f.verts };
  });
  // Assign 1-8 so geometric opposites sum to 9, matching a real d8.
  const values = new Array(8);
  const taken = new Set();
  let low = 1, high = 8;
  for (let i = 0; i < 8; i++) {
    if (taken.has(i)) continue;
    let opp = -1;
    for (let j = i + 1; j < 8; j++) {
      if (!taken.has(j) && V.dot(faces[i].n, faces[j].n) < -0.999) { opp = j; break; }
    }
    values[i] = low;
    taken.add(i);
    if (opp >= 0) { values[opp] = high; taken.add(opp); }
    low++; high--;
  }
  return faces.map((f, i) => ({ ...f, value: values[i], label: String(values[i]) }));
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

// Build the 20 faces of an icosahedron directly from its 12 vertices.
// Each face is a triangle of three pairwise-adjacent vertices; adjacency
// is the icosahedron edge length. This yields exactly 20 coplanar faces.
// Returns faces as {n, dist, verts, idx} where idx are the vertex indices.
function icosaFaces() {
  const verts = icosaDirs();
  const edge = V.dot(verts[0], verts[1]); // cos between adjacent verts
  const faces = [];
  const seen = new Set();
  for (let a = 0; a < verts.length; a++) {
    for (let b = a + 1; b < verts.length; b++) {
      if (Math.abs(V.dot(verts[a], verts[b]) - edge) > 1e-6) continue;
      for (let c = b + 1; c < verts.length; c++) {
        if (Math.abs(V.dot(verts[a], verts[c]) - edge) > 1e-6) continue;
        if (Math.abs(V.dot(verts[b], verts[c]) - edge) > 1e-6) continue;
        const key = [a, b, c].sort((x, y) => x - y).join(',');
        if (seen.has(key)) continue;
        seen.add(key);
        faces.push({ idx: [a, b, c] });
      }
    }
  }
  return faces.map(({ idx }) => {
    const tri = idx.map(i => verts[i]);
    const n = faceNormal(tri);
    const dist = V.dot(n, tri[0]);
    return { n, dist, verts: tri, idx };
  });
}

// Build the 12 faces of a dodecahedron as the exact dual of the icosahedron.
// The dodecahedron's 20 vertices are the icosahedron's 20 FACE NORMALS
// (from icosaFaces().n); two dodeca vertices are adjacent when their icosa
// faces share an edge (2 vertices). A dodeca face surrounds an icosa vertex
// v and consists of the 5 dodeca vertices whose icosa faces contain v.
// This yields 12 coplanar pentagons whose normals point exactly at the
// 12 icosa vertices.
function dodecaFaces() {
  const ico = icosaFaces();
  const icoVerts = icosaDirs();
  const dodecaVerts = ico.map(f => f.n); // 20 dodeca vertices
  return icoVerts.map(v => {
    const pent = [];
    ico.forEach((f, fi) => {
      if (f.idx.some(i => Math.abs(V.dot(icoVerts[i], v) - 1) < 1e-9)) pent.push(dodecaVerts[fi]);
    });
    const nrm = faceNormal(pent);
    // Order the 5 coplanar vertices as a cycle around the face normal so
    // the polygon is a proper pentagon (adjacent in the cycle are edges).
    const ref = [1, 0, 0];
    if (Math.abs(V.dot(nrm, ref)) > 0.9) ref[0] = 0, ref[1] = 1;
    const u = V.norm(V.cross(nrm, ref));
    const w = V.cross(nrm, u);
    const center = pent.reduce((s, p) => [s[0] + p[0], s[1] + p[1], s[2] + p[2]], [0, 0, 0]).map(x => x / pent.length);
    const sorted = pent.map(p => ({
      p,
      a: Math.atan2(
        (p[0] - center[0]) * w[0] + (p[1] - center[1]) * w[1] + (p[2] - center[2]) * w[2],
        (p[0] - center[0]) * u[0] + (p[1] - center[1]) * u[1] + (p[2] - center[2]) * u[2]
      )
    })).sort((x, y) => x.a - y.a).map(x => x.p);
    return { n: nrm, dist: V.dot(nrm, pent[0]), verts: sorted };
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

// Pentagonal trapezohedron (d10): all vertices on the unit sphere, two
// apices at the poles and two rings of five vertices at latitudes +a/-a
// offset by 36°. At latitude a = 6.06017° the kite faces are exactly
// planar, giving a watertight, fair die shape.
function trapezoFaces(tens) {
  const n = 5;
  const lat = 6.06017 * Math.PI / 180;
  const c = Math.cos(lat), s = Math.sin(lat);
  const U = [], L = [];
  for (let k = 0; k < n; k++) {
    const a = 2 * Math.PI * k / n;
    U.push([c * Math.cos(a), c * Math.sin(a), s]);
    L.push([c * Math.cos(a + Math.PI / n), c * Math.sin(a + Math.PI / n), -s]);
  }
  const N = [0, 0, 1], S = [0, 0, -1];
  const faces = [];
  for (let k = 0; k < n; k++) {
    faces.push({ verts: [N, U[k], L[k], U[(k + 1) % n]] });
    faces.push({ verts: [S, L[(k + 1) % n], U[(k + 1) % n], L[k]] });
  }
  const out = faces.map(f => {
    const nrm = faceNormal(f.verts);
    return { ...f, n: nrm, dist: V.dot(nrm, f.verts[0]) };
  });
  // pair faces by opposing normals, assign 0-4 to one side, 9-5 to the other
  const values = new Array(out.length).fill(-1);
  let low = 0, high = 2 * n - 1;
  for (let i = 0; i < out.length; i++) {
    if (values[i] !== -1) continue;
    let opp = -1, best = 0;
    for (let j = i + 1; j < out.length; j++) {
      const d = V.dot(out[i].n, out[j].n);
      if (d < best) { best = d; opp = j; }
    }
    values[i] = low;
    if (opp >= 0) values[opp] = high;
    low++; high--;
  }
  return out.map((f, i) => {
    const value = values[i];
    const label = tens ? String(value * 10).padStart(2, '0') : String(value);
    return { ...f, value, label };
  });
}

// Project the face's 3D vertices into the face element's own local frame
// (the face element is rotated by alignMatrix(n, [0,0,1]) so +Z = normal).
// Returns a clip-path polygon in percent coordinates relative to a square
// panel of the given side (in die-unit space).
function polyPoints(n, verts, panel) {
  const M = alignMatrix(n, [0, 0, 1]);
  const pts = verts.map(v => {
    const x = M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2];
    const y = M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2];
    return [x, y];
  });
  const c = [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
  const sorted = pts.map(p => ({ p, a: Math.atan2(p[1] - c[1], p[0] - c[0]) })).sort((a, b) => a.a - b.a).map(x => x.p);
  const half = panel / 2;
  const poly = sorted.map(p => `${((p[0] / half + 1) * 50).toFixed(2)}% ${((p[1] / half + 1) * 50).toFixed(2)}%`).join(', ');
  return { poly };
}

// Uniform square panel per die type: large enough to contain any face's
// polygon, small enough that adjacent panels don't overlap much.
const FACE_PANEL = { d4: 1.35, d6: 1.42, d8: 1.25, d10: 1.05, d12: 0.95, d20: 0.95, d10t: 1.05, d100: 1.42 };

const GEOMETRY = (() => {
  const base = {
    d4: { faces: tetraFaces() },
    d6: { faces: cubeFaces() },
    d8: { faces: octaFaces() },
    d10: { faces: trapezoFaces(false) },
    d12: { faces: assignOpposites(dodecaFaces()) },
    d20: { faces: assignOpposites(icosaFaces()) }
  };
  base.d10t = { faces: trapezoFaces(true) };
  for (const key of Object.keys(base)) {
    const panel = FACE_PANEL[key];
    for (const f of base[key].faces) {
      f.poly = polyPoints(f.n, f.verts, panel).poly;
      // d4: place the label at the corner that carries this face's value.
      if (key === 'd4') {
        const s = 1 / Math.sqrt(3);
        const vertsAll = [
          [s, s, s], [s, -s, -s], [-s, s, -s], [-s, -s, s]
        ];
        const onFace = v => f.verts.some(fv => fv.every((c, i) => Math.abs(c - v[i]) < 1e-9));
        const apex = vertsAll.find(v => !onFace(v));
        const M = alignMatrix(f.n, [0, 0, 1]);
        const ax = M[0][0] * apex[0] + M[0][1] * apex[1] + M[0][2] * apex[2];
        const ay = M[1][0] * apex[0] + M[1][1] * apex[1] + M[1][2] * apex[2];
        f.corner = [((ax / (panel / 2) + 1) * 50), ((ay / (panel / 2) + 1) * 50)];
      }
    }
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
    // A physical d10 is labeled 0-9; 0 reads as 10 when rolled alone.
    if (g.sides === 10) {
      const raw = randInt(10); // 0-9
      dies.push({
        value: raw,
        type: 'd10',
        kept: true,
        dropped: false,
        label: raw === 0 ? '10' : String(raw)
      });
    } else {
      dies.push({ value: rollDie(g.sides, g.ops), type: 'd' + g.sides, kept: true, dropped: false });
    }
  }
  // A d10's face value is 0-9 internally; 0 reads as 10 when rolled alone.
  // dieVal is the sortable value (0 -> 10); contrib is what a kept die adds.
  const dieVal = d => (d.type === 'd10' && d.value === 0) ? 10 : d.value;
  const contrib = d => (d.kept && d.type === 'd10' && d.value === 0) ? 10 : (d.kept ? d.value : 0);
  const { kh, kl, dh, dl } = g.ops;
  if (kh || kl || dh || dl) {
    const idx = dies.map((_, i) => i).sort((a, b) => dieVal(dies[a]) - dieVal(dies[b]));
    const drop = n => { for (let k = 0; k < n; k++) dies[idx[k]].dropped = true; };       // lowest
    const dropHigh = n => { for (let k = 0; k < n; k++) dies[idx[idx.length - 1 - k]].dropped = true; }; // highest
    if (kh) drop(Math.max(0, dies.length - kh));       // keep highest: drop lowest N-kh
    else if (kl) dropHigh(Math.max(0, dies.length - kl)); // keep lowest: drop highest N-kl
    else if (dh) dropHigh(dh);
    else if (dl) drop(dl);
    for (const d of dies) if (d.dropped) d.kept = false;
  }
  return { sides: g.sides, cnt: g.cnt, dies, total: dies.reduce((s, d) => s + (d.kept ? contrib(d) : 0), 0) };
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
// Fixed overhead light: faces pointing up catch more light, giving the die depth.
const LIGHT_DIR = V.norm([-0.35, -0.6, 0.85]);
const DIE_HUE = { d6: 80, d8: 45, d10: 300, d10t: 300, d12: 160, d20: 20, d4: 60, d100: 80 };
function faceShade(n, dieType) {
  const d = V.dot(n, LIGHT_DIR);
  const t = (d + 1) / 2; // 0..1
  const hue = DIE_HUE[dieType] !== undefined ? DIE_HUE[dieType] : 70;
  const chroma = hue === 80 ? 0.015 : 0.05; // d6 stays ivory; others carry a tint
  const dark = Math.min(0.92, 0.66 + t * 0.24);   // bottom faces darker, top faces lighter
  const light = Math.min(0.96, dark + 0.07);
  return `linear-gradient(145deg, oklch(${light.toFixed(2)} ${chroma} ${hue}) 0%, oklch(${dark.toFixed(2)} ${chroma} ${hue}) 100%)`;
}
function buildFaceEl(face, dieType, size, worldN) {
  const el = document.createElement('div');
  el.className = 'face';
  el.dataset.value = face.value;
  // Uniform square panel per die type: large enough to contain any face's
  // polygon, small enough that adjacent panels don't overlap much. The
  // clip-path trims each face to its polygon shape.
  const panel = size * (FACE_PANEL[dieType] || 1.1);
  el.style.width = el.style.height = panel.toFixed(1) + 'px';
  el.style.marginLeft = el.style.marginTop = (-panel / 2).toFixed(1) + 'px';
  const M = alignMatrix(face.n, [0, 0, 1]);
  const tz = face.dist * size / 2;
  el.style.transform = `${toMatrix3d(M)} translateZ(${tz.toFixed(2)}px)`;
  if (face.poly) el.style.clipPath = `polygon(${face.poly})`;
  el.style.setProperty('--shade', faceShade(worldN || face.n, dieType));
  el.innerHTML = faceHTML(face, dieType, panel, worldN);
  return el;
}

const PIPS = {
  1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]], 5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]]
};

function faceHTML(face, dieType, panel, worldN) {
  if (dieType === 'd6') {
    const pips = PIPS[face.value] || [];
    const onDark = worldN ? V.dot(worldN, LIGHT_DIR) < -0.1 : false;
    const pipColor = onDark ? 'rgba(240,240,240,0.92)' : 'rgba(20,20,18,0.92)';
    // Real dice inset pips from the face edges (~15% of face size). Map the
    // 0..2 grid to 15%..85% so corner pips sit comfortably inside the face.
    return `<span class="pips" style="--pip:${pipColor}">${pips.map(p => `<i style="left:${(p[0] * 35 + 15).toFixed(1)}%;top:${(p[1] * 35 + 15).toFixed(1)}%"></i>`).join('')}</span>`;
  }
  const fs = Math.max(10, panel * 0.34);
  const onDark = worldN ? V.dot(worldN, LIGHT_DIR) < -0.1 : false;
  const color = onDark ? '#f2efe8' : '#1a1a16';
  // On a real d4 the value is printed near each face's "apex" corner, and
  // the top vertex shows the rolled number on all three visible faces. We
  // center the label near the corner that is farthest from the face's
  // centroid along the projection of that apex vertex.
  if (dieType === 'd4' && face.corner) {
    return `<span class="face-num" style="font-size:${fs.toFixed(0)}px;color:${color};position:absolute;left:${face.corner[0].toFixed(0)}%;top:${face.corner[1].toFixed(0)}%;transform:translate(-50%,-50%)">${face.label}</span>`;
  }
  return `<span class="face-num" style="font-size:${fs.toFixed(0)}px;color:${color}">${face.label}</span>`;
}
function settleMatrix(face) {
  // The browser's world transform of a face normal is S^T * n (matrix3d
  // emits rows as columns). We want the target face's world normal to be
  // [0,0,1]:  S^T * n_target = [0,0,1]  <=>  n_target = S * [0,0,1].
  // With S = spin * R, the third column of S is spin * (R's third column).
  // Verified empirically: S = spin * R maps n_target to exactly [0,0,1],
  // while S = R * spin tilts it. (Verified for d20 and d8 in headless run.)
  const R = alignMatrix(face.n, [0, 0, 1]);
  const spin = rotMatrix([0, 0, 1], rand() * Math.PI * 2);
  return mul3(spin, R);
}

// A d4 rests on one face with the opposite vertex up; the rolled value is
// read from that top vertex. The vertex for value v is opposite face v, so
// settle with face v's normal pointing DOWN ([0,0,-1]).
function settleD4(face, geo) {
  const R = alignMatrix(face.n, [0, 0, -1]);
  const spin = rotMatrix([0, 0, 1], rand() * Math.PI * 2);
  return mul3(spin, R);
}

// Apply rotation matrix M to vector v using the same convention the CSS
// matrix3d() transform uses (column-vector). toMatrix3d emits M's rows as
// matrix3d columns, so the world transform of a vector is M^T * v.
function applyMatrix(M, v) {
  return [
    M[0][0] * v[0] + M[1][0] * v[1] + M[2][0] * v[2],
    M[0][1] * v[0] + M[1][1] * v[1] + M[2][1] * v[2],
    M[0][2] * v[0] + M[1][2] * v[1] + M[2][2] * v[2]
  ];
}

function buildDie(type, value, size) {
  const actor = document.createElement('div');
  actor.className = 'die-actor';
  actor._dieType = type;
  const rot = document.createElement('div');
  rot.className = 'die-rotator die-' + type;
  const g = GEOMETRY[type] || GEOMETRY.d6;
  const face = g.faces.find(f => f.value === value) || g.faces[0];
  // Decide the settle rotation first so face shading matches the final
  // world orientation (light from above stays consistent after the roll).
  const settle = type === 'd4' ? settleD4(face, g) : settleMatrix(face);
  for (const f of g.faces) {
    const worldN = applyMatrix(settle, f.n);
    rot.appendChild(buildFaceEl(f, type, size, worldN));
  }
  actor.appendChild(rot);
  return { actor, rot, settle, size, geo: g };
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
  shake: true,
  selected: new Set(),
  rolling: false,
  lastRollExpr: '1d20'
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
        fumble: s.fumble !== false,
        shake: s.shake !== false
      });
    } catch (e) { /* defaults */ }
  },
  save() {
    try {
      localStorage.setItem('rattle-settings', JSON.stringify({
        anim: state.anim, together: state.together, sound: state.sound,
        crit: state.crit, fumble: state.fumble, shake: state.shake
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

function settleActor(actor, rot, settle, t, geo) {
  // Cancel any running/filled animations so inline styles win the cascade.
  for (const el of [actor, rot]) {
    if (el.getAnimations) el.getAnimations().forEach(a => a.cancel());
  }
  rot.style.transform = toMatrix3d(settle);
  actor.style.transform = `translate(-50%, -50%) translate(${t.x}px,${t.y}px) scale(1)`;
  actor.style.opacity = '1';
  // Render the settled die as a 2D projected SVG: identical output in every
  // browser (CSS preserve-3d + clip-path faces composite badly on some
  // renderers, showing overlapping/see-through faces).
  renderSettledDie(actor, settle, geo);
}

// Perspective-project the settled die onto a 2D SVG. Painter's algorithm:
// sort visible faces far-to-near and draw as polygons. This is plain 2D
// rendering, so it looks correct everywhere.
function renderSettledDie(actor, settle, geo) {
  const size = parseFloat(actor.style.getPropertyValue('--die-size')) || 100;
  const R = size / 2;
  const cam = 900; // perspective distance in px at die size 100
  const project = p => {
    // world coords: S * p (die-unit space), scaled to px
    const wx = (settle[0][0] * p[0] + settle[0][1] * p[1] + settle[0][2] * p[2]) * R;
    const wy = (settle[1][0] * p[0] + settle[1][1] * p[1] + settle[1][2] * p[2]) * R;
    const wz = (settle[2][0] * p[0] + settle[2][1] * p[1] + settle[2][2] * p[2]) * R;
    const f = cam / (cam - wz);
    return { x: wx * f, y: wy * f, z: wz };
  };
  const faces = [];
  for (const f of geo.faces) {
    const pts = f.verts.map(project);
    const cz = pts.reduce((s, p) => s + p.z, 0) / pts.length;
    const n = f.n;
    const wnz = settle[2][0] * n[0] + settle[2][1] * n[1] + settle[2][2] * n[2];
    if (wnz <= 0.05) continue; // back face
    faces.push({ f, pts, cz });
  }
  faces.sort((a, b) => a.cz - b.cz); // far first
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  const vb = size * 0.55;
  svg.setAttribute('viewBox', `${-vb} ${-vb} ${vb * 2} ${vb * 2}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.position = 'absolute';
  svg.style.inset = '0';
  svg.style.overflow = 'visible';
  for (const { f, pts } of faces) {
    const poly = document.createElementNS(NS, 'polygon');
    poly.setAttribute('points', pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
    const d = V.dot(f.n, LIGHT_DIR);
    const t = (d + 1) / 2;
    const hue = DIE_HUE[actor._dieType] !== undefined ? DIE_HUE[actor._dieType] : 70;
    const chroma = hue === 80 ? 0.015 : 0.05;
    const dark = Math.min(0.92, 0.66 + t * 0.24);
    const light = Math.min(0.96, dark + 0.07);
    poly.setAttribute('fill', `oklch(${light.toFixed(2)} ${chroma} ${hue})`);
    poly.setAttribute('stroke', 'oklch(0.45 0.02 60 / 0.9)');
    poly.setAttribute('stroke-width', '0.8');
    // face label
    if (f.corners && actor._dieType === 'd4') {
      // d4: draw each corner's value near its vertex (inset toward center).
      const wrap = document.createElementNS(NS, 'g');
      wrap.appendChild(poly);
      const pts2 = f.verts.map(project);
      const cx = pts2.reduce((s, p) => s + p.x, 0) / pts2.length;
      const cy = pts2.reduce((s, p) => s + p.y, 0) / pts2.length;
      f.corners.forEach((val, i) => {
        const v = pts2[i];
        const inset = 0.25; // fraction of the way from corner to center
        const lx = v.x + (cx - v.x) * inset;
        const ly = v.y + (cy - v.y) * inset;
        const label = document.createElementNS(NS, 'text');
        label.setAttribute('x', lx.toFixed(1));
        label.setAttribute('y', ly.toFixed(1));
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('dominant-baseline', 'central');
        label.setAttribute('font-size', (size * 0.11).toFixed(1));
        label.setAttribute('font-weight', 'bold');
        label.setAttribute('fill', 'oklch(0.16 0.01 55)');
        label.textContent = String(val);
        wrap.appendChild(label);
      });
      svg.appendChild(wrap);
    } else if (f.label !== undefined) {
      const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
      const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
      // A standalone d10's 0 reads as 10.
      let text = f.label;
      if (actor._dieType === 'd10' && f.value === 0) text = '10';
      if (actor._dieType === 'd10t') text = f.label; // tens die keeps 00-90
      const label = document.createElementNS(NS, 'text');
      label.setAttribute('x', cx.toFixed(1));
      label.setAttribute('y', cy.toFixed(1));
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('dominant-baseline', 'central');
      label.setAttribute('font-size', (size * 0.14).toFixed(1));
      label.setAttribute('font-weight', 'bold');
      label.setAttribute('fill', 'oklch(0.16 0.01 55)');
      label.textContent = text;
      const wrap = document.createElementNS(NS, 'g');
      wrap.appendChild(poly);
      wrap.appendChild(label);
      svg.appendChild(wrap);
    } else if (actor._dieType === 'd6' && f.value >= 1 && f.value <= 6) {
      // cube pips: inset from edges like a real d6
      const wrap = document.createElementNS(NS, 'g');
      wrap.appendChild(poly);
      const pips = PIPS[f.value] || [];
      const pts2 = f.verts.map(project);
      // bounding box of the projected face
      const xs = pts2.map(p => p.x), ys = pts2.map(p => p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const pw = (maxX - minX) * 0.35, ph = (maxY - minY) * 0.35;
      for (const p of pips) {
        const dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('cx', (minX + pw + p[0] * pw).toFixed(1));
        dot.setAttribute('cy', (minY + ph + p[1] * ph).toFixed(1));
        dot.setAttribute('r', (pw * 0.32).toFixed(1));
        dot.setAttribute('fill', 'oklch(0.16 0.01 55)');
        wrap.appendChild(dot);
      }
      svg.appendChild(wrap);
    } else {
      svg.appendChild(poly);
    }
  }
  // remove the CSS 3D faces, attach the SVG
  while (actor.firstChild) actor.removeChild(actor.firstChild);
  actor.appendChild(svg);
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

    // Render the solid projected die immediately; the animation moves this
    // solid 2D render (never raw 3D faces, which composite badly).
    renderSettledDie(actor, settle, item.geo);
    rot.style.transform = 'none';

    if (eff === 'none') {
      actor.style.transform = `${actorBase} translate(${t.x}px,${t.y}px) scale(1)`;
      actor.style.opacity = '1';
      return;
    }

    if (eff === 'minimal') {
      // spin the solid die in place at the target position
      const turns = 1.5 + rand() * 1.5;
      const spinAnim = actor.animate([
        { transform: `${actorBase} translate(${t.x}px,${t.y}px) scale(0.9) rotate(0deg)`, opacity: 0, offset: 0, easing: 'ease-in-out' },
        { transform: `${actorBase} translate(${t.x}px,${t.y}px) scale(1.05) rotate(${360 * turns}deg)`, opacity: 1, offset: 0.75, easing: EASE_OUT },
        { transform: `${actorBase} translate(${t.x}px,${t.y}px) scale(1) rotate(${360 * turns}deg)`, opacity: 1, offset: 1 }
      ], { duration: 850 + delay, delay, fill: 'both' });
      Promise.all([spinAnim.finished]).then(() => {
        actor.style.transform = `${actorBase} translate(${t.x}px,${t.y}px) scale(1) rotate(0deg)`;
        actor.style.opacity = '1';
      }).catch(() => {});
      return;
    }

    // full: fly the solid die across the stage with a spin
    const sx = (rand() - 0.5) * w * 0.9;
    const sy = (rand() - 0.5) * h * 0.9;
    const turns = 2 + rand() * 2;
    const anim = actor.animate([
      { transform: `${actorBase} translate(${sx}px,${sy}px) scale(0.4) rotate(0deg)`, opacity: 0, offset: 0, easing: 'ease-out' },
      { transform: `${actorBase} translate(${sx * 0.5}px,${sy * 0.5}px) scale(0.8) rotate(${180 * turns}deg)`, opacity: 1, offset: 0.35, easing: 'ease-out' },
      { transform: `${actorBase} translate(${t.x}px,${t.y}px) scale(1.12) rotate(${360 * turns}deg)`, offset: 0.85, easing: EASE_LAND },
      { transform: `${actorBase} translate(${t.x}px,${t.y}px) scale(1) rotate(${360 * turns}deg)`, offset: 1 }
    ], { duration: 1350 + delay, delay, fill: 'both' });
    Promise.all([anim.finished]).then(() => {
      actor.style.transform = `${actorBase} translate(${t.x}px,${t.y}px) scale(1) rotate(0deg)`;
      actor.style.opacity = '1';
    }).catch(() => {});
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
  // Detail only when it adds information: dropped dice, multiple dice,
  // multiple groups, or modifiers. A plain 1d20 shows just the total.
  const hasDetail = groups.some(g => g.sides !== 100 && (g.cnt > 1 || g.dies.some(d => d.dropped)))
    || groups.length > 1
    || roll.mod !== 0;
  const parts = groups.map(g => {
    const vals = g.dies.map(d => fmtDie(d, d.type)).join(' · ');
    return `${vals}`;
  });
  const modPart = roll.mod ? `${roll.mod > 0 ? ' + ' : ' − '}${Math.abs(roll.mod)}` : '';
  labelEl.textContent = exprLabel(parsed);
  valueEl.textContent = String(roll.total);
  detailEl.innerHTML = hasDetail ? parts.join('  ') + modPart + ` = ${roll.total}` : '';

  valueEl.classList.remove('is-crit', 'is-fumble', 'is-spin');
  labelEl.classList.remove('is-special');
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
  if (special) labelEl.classList.add('is-special');
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
  state.lastRollExpr = exprStr;
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
      settleActor(item.actor, item.rot, item.settle, targets[i] || { x: 0, y: 0 }, item.geo);
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

/* ---------------- shake to reroll ---------------- */
const Shake = (() => {
  let last = null;
  let lastTrigger = 0;
  let listening = false;
  const THRESHOLD = 22; // delta g
  const DEBOUNCE_MS = 500;

  function onMotion(e) {
    const acc = e.accelerationIncludingGravity;
    if (!acc || !state.shake) return;
    const now = Date.now();
    // Debounce: one trigger per 500ms window. A single quick shake produces
    // a few motion spikes within ~100ms, so only the first can fire.
    if (now - lastTrigger < DEBOUNCE_MS) return;
    if (!last) { last = { x: acc.x || 0, y: acc.y || 0, z: acc.z || 0 }; return; }
    const dx = Math.abs((acc.x || 0) - last.x);
    const dy = Math.abs((acc.y || 0) - last.y);
    const dz = Math.abs((acc.z || 0) - last.z);
    // Always refresh the baseline first, so a roll in progress never leaves
    // a stale pre-shake reading that re-fires after the roll ends.
    last = { x: acc.x || 0, y: acc.y || 0, z: acc.z || 0 };
    if (state.rolling) return;
    if (dx + dy + dz > THRESHOLD) {
      lastTrigger = now;
      doRoll(state.lastRollExpr);
    }
  }

  function start() {
    if (listening) return;
    if (!('DeviceMotionEvent' in window)) return;
    const request = window.DeviceMotionEvent.requestPermission;
    const begin = () => {
      window.addEventListener('devicemotion', onMotion);
      listening = true;
    };
    if (typeof request === 'function') {
      request().then(res => { if (res === 'granted') begin(); }).catch(() => {});
    } else {
      begin();
    }
  }

  return { start };
})();

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
  bind('shake-toggle', 'shake');
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
  Shake.start();

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
