/* Shared geometry foundation for the spacer POSITIVE (the spacer solid itself).

   Frame contract (same as spacer/lib/src/params.js, the mold lib):
   - units mm; stem axis = +Z; distal tip at z = 0; head at the top.
   - head axis tilted in XZ toward +X (+X = MEDIAL) by beta = 180° − NSA.
   - Y = anterior–posterior; solid mirror-symmetric about y = 0, which is the
     mold PARTING PLANE (demold along ±Y).

   manifold-3d 2.5.1 policy (repo invariant, see HANDOFF_MOLD_SYSTEM.md):
   - Placement uses Manifold.translate (verified here numerically) or
     transforms BAKED into vertex arrays (bake()). Never Manifold.rotate /
     .transform for placement.
   - manifold is lazy: every helper forces getMesh()/boundingBox() so errors
     surface where they happen.
   - Measured here (test/foundation_test.mjs, probes): .translate() and
     .rotate([x,y,z]°) place correctly; .transform(m) is correct ONLY with a
     16-entry COLUMN-MAJOR Mat4 — a 12-entry (3×4) array is silently misread
     (garbage bounds, no error). That is the likely origin of the "drops the
     translation" gotcha. Policy stays: bake(), then assert numerically.
   - Manifold.levelSet wants POSITIVE inside; its grid spans exactly [min,max]
     so ±y bounds give a mirror-symmetric BCC grid (symmetry ≈ 1e-3 mm).
     Marching-tetrahedra slivers (area ~1e-5 mm²) carry random normals: any
     per-edge check must skip them (validate.mjs creases does).

   SDF convention in THIS module: standard signed distance, NEGATIVE INSIDE.
   levelSetSolid() negates for manifold (whose levelSet wants positive inside).
*/

const MANIFOLD_URL = new URL('../../node_modules/manifold-3d/manifold.js', import.meta.url);

let _engine = null;
let _enginePromise = null;

/* Load manifold-3d once. Returns { wasm, Manifold, CrossSection, Mesh }. */
export async function initEngine() {
  if (_engine) return _engine;
  if (!_enginePromise) {
    _enginePromise = (async () => {
      const factory = (await import(MANIFOLD_URL.href)).default;
      const wasm = await factory();
      wasm.setup();
      _engine = { wasm, Manifold: wasm.Manifold, CrossSection: wasm.CrossSection, Mesh: wasm.Mesh };
      return _engine;
    })();
  }
  return _enginePromise;
}

export function getEngine() {
  if (!_engine) throw new Error('manifold engine not ready — await initEngine() first');
  return _engine;
}

/* ------------------------------------------------------------------ */
/* small vector / matrix math (row-major 3x3 as flat length-9 arrays)  */
/* ------------------------------------------------------------------ */

export const DEG = Math.PI / 180;
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export const M3_IDENTITY = [1, 0, 0, 0, 1, 0, 0, 0, 1];
export const m3Apply = (m, v) => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
];
export const m3Mul = (a, b) => {
  const r = new Array(9);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++)
    r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  return r;
};
export const m3Det = (m) =>
  m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]);

/* Rotation about +Y by deg (right-hand). rotY(beta) maps +Z → (sin β, 0, cos β). */
export function rotY(deg) {
  const c = Math.cos(deg * DEG), s = Math.sin(deg * DEG);
  return [c, 0, s, 0, 1, 0, -s, 0, c];
}
export function rotX(deg) {
  const c = Math.cos(deg * DEG), s = Math.sin(deg * DEG);
  return [1, 0, 0, 0, c, -s, 0, s, c];
}
export function rotZ(deg) {
  const c = Math.cos(deg * DEG), s = Math.sin(deg * DEG);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}

/* Rotation taking +Z onto unit vector `axis`. Axis in the XZ plane → pure
   rotation about Y (keeps y exactly, so y-mirror symmetry survives). */
export function rotZTo(axis) {
  const a = norm(axis);
  if (Math.abs(a[1]) < 1e-12) return rotY(Math.atan2(a[0], a[2]) / DEG);
  const z = [0, 0, 1];
  const c = a[2];
  if (c > 1 - 1e-12) return M3_IDENTITY.slice();
  if (c < -1 + 1e-12) return rotX(180);
  const k = norm(cross(z, a));
  const s = Math.sqrt(1 - c * c), t = 1 - c;
  const [x, y, w] = k;
  return [
    t * x * x + c, t * x * y - s * w, t * x * w + s * y,
    t * x * y + s * w, t * y * y + c, t * y * w - s * x,
    t * x * w - s * y, t * y * w + s * x, t * w * w + c,
  ];
}

/* Head axis for a neck–shaft angle (implant convention): tilt beta = 180 − NSA
   from +Z toward +X (medial). */
export function headAxis(nsDeg) {
  const b = (180 - nsDeg) * DEG;
  return [Math.sin(b), 0, Math.cos(b)];
}

/* ------------------------------------------------------------------ */
/* Manifold <-> arrays, baking, checks                                 */
/* ------------------------------------------------------------------ */

/* Status enum → name ('NoError', 'NotManifold', …). */
export function statusName(m) {
  const { wasm } = getEngine();
  const st = m.status();
  const v = st && typeof st.value === 'number' ? st.value : st;
  for (const k of Object.keys(wasm.status || {})) {
    if (k === 'values') continue;
    if (wasm.status[k] && wasm.status[k].value === v) return k;
  }
  return String(v);
}

/* Manifold → { positions: Float32Array(xyz), indices: Uint32Array }. */
export function toMeshArrays(manifold) {
  const raw = manifold.getMesh();
  const np = raw.numProp || 3;
  const vp = raw.vertProperties;
  const n = (vp.length / np) | 0;
  const positions = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    positions[i * 3] = vp[i * np];
    positions[i * 3 + 1] = vp[i * np + 1];
    positions[i * 3 + 2] = vp[i * np + 2];
  }
  return { positions, indices: new Uint32Array(raw.triVerts) };
}

/* { positions, indices } (shared vertices, outward CCW) → Manifold.
   Throws if the result is not a valid manifold. */
export function fromMeshArrays(positions, indices, label = 'mesh') {
  const { Manifold, Mesh } = getEngine();
  const mesh = new Mesh({
    numProp: 3,
    vertProperties: positions instanceof Float32Array ? positions : new Float32Array(positions),
    triVerts: indices instanceof Uint32Array ? indices : new Uint32Array(indices),
  });
  mesh.merge();
  const m = new Manifold(mesh);
  const st = statusName(m);
  if (st !== 'NoError') throw new Error(`${label}: manifold status ${st}`);
  m.getMesh();
  if (m.isEmpty()) throw new Error(`${label}: empty manifold`);
  return m;
}

/* Bake p' = R·p + t into the vertex array and rebuild (the 2.5.1-safe way to
   rotate). Mirror matrices (det < 0) flip the winding so the solid stays
   outward-oriented. */
export function bake(manifold, R = M3_IDENTITY, t = [0, 0, 0]) {
  const { Manifold, Mesh } = getEngine();
  const raw = manifold.getMesh();
  const np = raw.numProp || 3;
  const vp = new Float32Array(raw.vertProperties);
  for (let i = 0; i < vp.length; i += np) {
    const x = vp[i], y = vp[i + 1], z = vp[i + 2];
    vp[i] = R[0] * x + R[1] * y + R[2] * z + t[0];
    vp[i + 1] = R[3] * x + R[4] * y + R[5] * z + t[1];
    vp[i + 2] = R[6] * x + R[7] * y + R[8] * z + t[2];
  }
  const tv = new Uint32Array(raw.triVerts);
  if (m3Det(R) < 0) {
    for (let i = 0; i < tv.length; i += 3) { const s = tv[i + 1]; tv[i + 1] = tv[i + 2]; tv[i + 2] = s; }
  }
  const opts = { numProp: np, vertProperties: vp, triVerts: tv };
  if (raw.mergeFromVert && raw.mergeFromVert.length) {
    opts.mergeFromVert = new Uint32Array(raw.mergeFromVert);
    opts.mergeToVert = new Uint32Array(raw.mergeToVert);
  }
  const m = new Manifold(new Mesh(opts));
  const st = statusName(m);
  if (st !== 'NoError') throw new Error(`bake: manifold status ${st}`);
  return m;
}

/* Plain-array bounding box. */
export function bbox(m) {
  const b = m.boundingBox();
  return { min: [b.min[0], b.min[1], b.min[2]], max: [b.max[0], b.max[1], b.max[2]] };
}

/* Throw unless the bounding box matches (numerical transform verification). */
export function assertBounds(m, expMin, expMax, tol = 1e-3, label = 'solid') {
  const b = bbox(m);
  for (let k = 0; k < 3; k++) {
    if (expMin && expMin[k] != null && Math.abs(b.min[k] - expMin[k]) > tol)
      throw new Error(`${label}: bbox.min[${k}] = ${b.min[k].toFixed(4)}, expected ${expMin[k].toFixed(4)}`);
    if (expMax && expMax[k] != null && Math.abs(b.max[k] - expMax[k]) > tol)
      throw new Error(`${label}: bbox.max[${k}] = ${b.max[k].toFixed(4)}, expected ${expMax[k].toFixed(4)}`);
  }
  return b;
}

/* Boolean union of a list (single batched call). */
export function unionAll(list) {
  const { Manifold } = getEngine();
  const parts = list.filter(Boolean);
  if (parts.length === 1) return parts[0];
  const m = Manifold.union(parts);
  m.getMesh();
  return m;
}

/* ------------------------------------------------------------------ */
/* Tessellation tolerance                                              */
/* ------------------------------------------------------------------ */

/* Segments around a circle of radius r so chord sagitta ≤ tol (multiple of 4). */
export function circleSegments(r, tol = 0.02) {
  const n = Math.ceil(Math.PI / Math.acos(Math.max(-1, 1 - tol / r)));
  return Math.min(1024, Math.max(16, Math.ceil(n / 4) * 4));
}

/* Segments for Manifold.sphere (geodesic from an octahedron) so the facet
   deviation ≤ tol. Geodesic facets are uneven, so edge a = sqrt(3·r·tol)
   (≈2× margin over a uniform grid). */
export function sphereSegments(r, tol = 0.02) {
  const a = Math.sqrt(3 * r * tol);
  const n = Math.ceil((2 * Math.PI * r) / a);
  return Math.min(1024, Math.max(16, Math.ceil(n / 4) * 4));
}

/* ------------------------------------------------------------------ */
/* Primitives (all placed by translate or baked; all verified)         */
/* ------------------------------------------------------------------ */

/* Sphere of radius r centred at c. Geodesic (octahedron) tessellation →
   mirror-symmetric about every coordinate plane through c. */
export function sphereAt(c, r, { tol = 0.02, segments } = {}) {
  const { Manifold } = getEngine();
  const n = segments ?? sphereSegments(r, tol);
  const m = Manifold.sphere(r, n).translate([c[0], c[1], c[2]]);
  assertBounds(m, [c[0] - r, c[1] - r, c[2] - r], [c[0] + r, c[1] + r, c[2] + r], 1e-3 + 1e-4 * r, 'sphereAt');
  return m;
}

/* Tapered rod = convex hull of two spheres (a, ra) and (b, rb): a capsule
   when ra = rb, a round cone otherwise. */
export function taperedRod(a, ra, b, rb, opts = {}) {
  return hullSpheres([{ c: a, r: ra }, { c: b, r: rb }], opts);
}
export const capsule = (a, b, r, opts = {}) => taperedRod(a, r, b, r, opts);

/* Convex hull of a list of spheres [{c:[x,y,z], r}]. Keep centres on y = 0
   (or in ±y pairs) and the hull is Y-symmetric and Y-convex → demoldable. */
export function hullSpheres(list, { tol = 0.02 } = {}) {
  const { Manifold } = getEngine();
  const parts = list.map(({ c, r }) => sphereAt(c, r, { tol }));
  const h = Manifold.hull(parts);
  h.getMesh();
  for (const p of parts) p.delete();
  return h;
}

/* Solid of revolution with EXACT, y-mirror-symmetric tessellation.
   profile = [[r, h], …] in the local frame (h along `axis`, r = distance from
   the axis), an open polyline from a point ON the axis (r = 0) to another
   point on the axis, r > 0 in between. A flat end face = a profile segment at
   constant h ending/starting at r = 0 (fan from the pole). The profile is
   revolved about `axis` through `center` (center ↔ h = 0).
   The caller samples curved parts of the profile (see arcPoints); this only
   picks the number of segments around (from tol and the largest r).
   Axis in the XZ plane → the placement is a pure rotation about Y, so the
   solid is mirror-symmetric about y = 0 and (any profile) Y-demoldable.
   Returns the Manifold with .info { segments, rings, volumeExact }. */
export function revolveProfile(profile, { center = [0, 0, 0], axis = [0, 0, 1], tol = 0.01, segments, label = 'revolveProfile' } = {}) {
  // drop consecutive duplicates
  let pr = profile.filter((q, i) => i === 0 || Math.hypot(q[0] - profile[i - 1][0], q[1] - profile[i - 1][1]) > 1e-9);
  if (pr.length < 3) throw new Error(`${label}: profile needs ≥ 3 distinct points`);
  if (Math.abs(pr[0][0]) > 1e-9 || Math.abs(pr[pr.length - 1][0]) > 1e-9) throw new Error(`${label}: profile must start and end on the axis (r = 0)`);
  for (let i = 1; i < pr.length - 1; i++) if (!(pr[i][0] > 1e-9)) throw new Error(`${label}: interior profile point ${i} has r ≤ 0`);
  // orientation: clockwise in (r, h) (top pole → down the outside → bottom pole) is outward
  let a2 = 0, vol6 = 0;
  for (let i = 0; i < pr.length; i++) {
    const [r0, h0] = pr[i], [r1, h1] = pr[(i + 1) % pr.length];
    const c = r0 * h1 - r1 * h0;
    a2 += c; vol6 += (r0 + r1) * c;
  }
  if (a2 > 0) pr = pr.slice().reverse();
  const volumeExact = Math.abs((2 * Math.PI * vol6) / 6);

  const rMax = Math.max(...pr.map((q) => q[0]));
  let N = segments;
  if (!N) {
    const a = Math.sqrt(4 * rMax * tol);          // quad (a × a) sagitta ≈ a²/(4r) ≤ tol
    N = Math.ceil((2 * Math.PI * rMax) / a);
  }
  N = Math.max(16, Math.ceil(N / 4) * 4);         // multiple of 4 → vertices at phi = 0, ±90°, 180°

  const K = pr.length - 2;                        // rings
  const pos = [0, 0, pr[0][1]];                   // 0: first pole
  for (let i = 1; i <= K; i++) {
    const [r, h] = pr[i];
    for (let j = 0; j < N; j++) {
      const ph = (j / N) * 2 * Math.PI;
      pos.push(r * Math.cos(ph), r * Math.sin(ph), h);
    }
  }
  const lastPole = pos.length / 3;
  pos.push(0, 0, pr[pr.length - 1][1]);
  const ring = (i, j) => 1 + (i - 1) * N + (((j % N) + N) % N);
  const idx = [];
  for (let j = 0; j < N; j++) idx.push(0, ring(1, j), ring(1, j + 1));
  for (let i = 1; i < K; i++) {
    for (let j = 0; j < N; j++) {
      const a0 = ring(i, j), a1 = ring(i, j + 1), b0 = ring(i + 1, j), b1 = ring(i + 1, j + 1);
      if (j < N / 2) idx.push(a0, b0, b1, a0, b1, a1);            // diagonal a0–b1
      else idx.push(a0, b0, a1, a1, b0, b1);                       // mirrored diagonal a1–b0
    }
  }
  for (let j = 0; j < N; j++) idx.push(lastPole, ring(K, j + 1), ring(K, j));

  // bake rotation (+Z → axis) and translation in float64
  const Rm = rotZTo(axis);
  const out = new Float32Array(pos.length);
  for (let v = 0; v < pos.length; v += 3) {
    const p = m3Apply(Rm, [pos[v], pos[v + 1], pos[v + 2]]);
    out[v] = p[0] + center[0]; out[v + 1] = p[1] + center[1]; out[v + 2] = p[2] + center[2];
  }
  const m = fromMeshArrays(out, new Uint32Array(idx), label);
  const vol = m.getProperties().volume;
  const volPolygon = volumeExact * (N / (2 * Math.PI)) * Math.sin((2 * Math.PI) / N);  // inscribed N-gon sections
  if (!(vol > 0) || Math.abs(vol - volPolygon) / volPolygon > 0.005) {
    throw new Error(`${label}: volume ${vol.toFixed(1)} vs profile ${volPolygon.toFixed(1)} (orientation/self-intersection?)`);
  }
  m.info = { segments: N, rings: K, volumeExact, facetTol: tol };
  return m;
}

/* Points on a circular arc in the (r, h) profile plane: centre (cr, ch),
   radius rho, polar angles t0 → t1 (radians, measured from +h toward +r),
   sampled so the chord sagitta ≤ tol/2. Includes both ends. */
export function arcPoints(cr, ch, rho, t0, t1, tol = 0.01) {
  const step = 2 * Math.acos(Math.max(-1, 1 - tol / 2 / rho));
  const n = Math.max(2, Math.ceil(Math.abs(t1 - t0) / step));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n;
    pts.push([cr + rho * Math.sin(t), ch + rho * Math.cos(t)]);
  }
  return pts;
}

/* Sphere SEGMENT (the polished head): sphere (center, radius) cut by the
   plane perpendicular to `axis` at signed distance `cut` from the centre;
   keeps the dome on the +axis side (cut > 0 → less than a hemisphere;
   height h = R − cut, so h/D = (1 − cut/R)/2).
   rimFillet (mm, default 0): torus blend between the dome and the flat base
   — needed when cut > 0, where the bare rim is an acute (θmax < 90°) knife
   edge that fails the thickness check and chips in PMMA.
   Exact lat–long tessellation aligned with the head axis: every dome vertex
   on the sphere, facet deviation ≤ tol (default 0.01 mm), exactly
   mirror-symmetric about y = 0 when the axis lies in the XZ plane.
   Returns the Manifold; .info has the numbers and .info.validateHead is
   ready for validate({ head }). */
export function sphereSegment({ center, radius: R, axis = [0, 0, 1], cut = 0, tol = 0.01, rimFillet = 0 }) {
  if (!(Math.abs(cut) < R)) throw new Error(`sphereSegment: |cut| must be < radius (cut=${cut}, R=${R})`);
  const rho = rimFillet || 0;
  let thetaSphere, baseRadius;
  const profile = [];
  const a = Math.sqrt(4 * R * tol);             // meridional step (same rule as around)
  if (rho > 0) {
    const hc = cut + rho;                         // torus-centre height
    if (!(R - rho > Math.abs(hc))) throw new Error(`sphereSegment: rimFillet ${rho} too large for R=${R}, cut=${cut}`);
    const ac = Math.sqrt((R - rho) ** 2 - hc ** 2); // torus-centre radius = flat-base radius
    thetaSphere = Math.atan2(ac, hc);
    baseRadius = ac;
    const K = Math.max(4, Math.ceil((thetaSphere * R) / a));
    for (let i = 0; i <= K; i++) { const th = (i / K) * thetaSphere; profile.push([R * Math.sin(th), R * Math.cos(th)]); }
    const arc = arcPoints(ac, hc, rho, thetaSphere, Math.PI, tol);
    for (let i = 1; i < arc.length; i++) profile.push(arc[i]);
  } else {
    thetaSphere = Math.acos(cut / R);
    baseRadius = R * Math.sin(thetaSphere);
    const K = Math.max(4, Math.ceil((thetaSphere * R) / a));
    for (let i = 0; i <= K; i++) { const th = (i / K) * thetaSphere; profile.push([R * Math.sin(th), R * Math.cos(th)]); }
  }
  profile[0] = [0, R];
  const last = profile[profile.length - 1];
  last[1] = cut;                                  // exact base plane (arc end / rim)
  profile.push([0, cut]);                         // base centre (flat base face)

  const m = revolveProfile(profile, { center, axis, tol, label: 'sphereSegment' });

  // numerical placement + volume checks
  const ax = norm(axis);
  const apex = add(center, scale(ax, R));
  const raw = m.getMesh();
  let apexErr = Infinity;
  const vp = raw.vertProperties, np = raw.numProp || 3;
  for (let i = 0; i < vp.length; i += np) apexErr = Math.min(apexErr, Math.hypot(vp[i] - apex[0], vp[i + 1] - apex[1], vp[i + 2] - apex[2]));
  if (apexErr > 1e-3) throw new Error('sphereSegment: apex misplaced');
  const h = R - cut;
  if (!rho) {
    const volExact = (Math.PI * h * h * (3 * R - h)) / 3;
    const vol = m.getProperties().volume;
    if (Math.abs(vol - volExact) / volExact > 0.01) throw new Error(`sphereSegment: volume ${vol.toFixed(1)} vs exact ${volExact.toFixed(1)}`);
  }
  const capAngleDeg = thetaSphere / DEG;
  m.info = {
    ...m.info,
    center: [...center], radius: R, axis: ax, cut, height: h, hOverD: h / (2 * R),
    thetaMaxDeg: Math.acos(cut / R) / DEG,       // rim angle of the unfilleted cap
    sphereCapDeg: capAngleDeg,                   // the polished sphere ends here (fillet starts)
    rimRadius: R * Math.sin(Math.acos(cut / R)), // unfilleted rim radius
    baseRadius,                                  // radius of the flat base disc
    rimFillet: rho,
    baseCenter: add(center, scale(ax, cut)), apex,
    validateHead: { center: [...center], radius: R, axis: ax, capAngleDeg: Math.max(1, capAngleDeg - 0.5) },
  };
  return m;
}

/* Cylinder along Y (a suture THROUGH-hole cutter, or a Y-symmetric boss),
   centred at (x, 0, z), full length `length` (make it longer than the part
   so it cuts through). */
export function cylinderY({ x, z, r, length, tol = 0.02, segments }) {
  const { Manifold } = getEngine();
  const n = segments ?? circleSegments(r, tol);
  const c = Manifold.cylinder(length, r, r, n, true);   // along Z, centred at origin
  const m = bake(c, rotX(90), [x, 0, z]);                // Z → −Y (axis now along Y)
  c.delete();
  assertBounds(m, [null, -length / 2, null], [null, length / 2, null], 1e-3, 'cylinderY');
  const b = bbox(m);
  if (Math.abs((b.min[0] + b.max[0]) / 2 - x) > 1e-3 || Math.abs((b.min[2] + b.max[2]) / 2 - z) > 1e-3)
    throw new Error('cylinderY: misplaced');
  return m;
}

/* Cylinder / cone along an arbitrary axis from point a to point b (radii ra,
   rb). Flat ends. Baked placement. */
export function cylinderBetween(a, b, ra, rb = ra, { tol = 0.02, segments } = {}) {
  const { Manifold } = getEngine();
  const d = sub(b, a);
  const L = len(d);
  const n = segments ?? circleSegments(Math.max(ra, rb), tol);
  const c = Manifold.cylinder(L, ra, rb, n, false);      // z ∈ [0, L]
  const m = bake(c, rotZTo(d), a);
  c.delete();
  return m;
}

/* Y-symmetric prism: a 2D profile drawn in the XZ plane (coordinates [x, z]),
   extruded along Y to total thickness t, centred on y = 0.
   `profile` = CrossSection or Polygons ([[ [x,z], … ], …], CCW outer). */
export function extrudeY(profile, t) {
  const { CrossSection } = getEngine();
  const cs = profile instanceof CrossSection ? profile : new CrossSection(profile);
  const csb = cs.bounds();
  const e = cs.extrude(t);                               // (u, v, w), w ∈ [0, t]
  // rotX(90): (u, v, w) → (u, −w, v)  (proper rotation, winding kept); then y += t/2
  const m = bake(e, rotX(90), [0, t / 2, 0]);
  e.delete();
  assertBounds(m, [csb.min[0], -t / 2, csb.min[1]], [csb.max[0], t / 2, csb.max[1]], 1e-3, 'extrudeY');
  return m;
}

/* ------------------------------------------------------------------ */
/* SDF toolkit (NEGATIVE INSIDE). p is [x, y, z].                      */
/* ------------------------------------------------------------------ */

export function sdSphere(p, c, r) {
  return Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) - r;
}

/* Round cone = hull of sphere (a, ra) and sphere (b, rb); capsule if ra = rb.
   Exact distance (Inigo Quilez, sdRoundCone for arbitrary endpoints). */
export function sdCapsule(p, a, b, ra, rb = ra) {
  const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
  const l2 = bax * bax + bay * bay + baz * baz;
  const rr = ra - rb;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  const pax = p[0] - a[0], pay = p[1] - a[1], paz = p[2] - a[2];
  const y = pax * bax + pay * bay + paz * baz;
  const z = y - l2;
  const qx = pax * l2 - bax * y, qy = pay * l2 - bay * y, qz = paz * l2 - baz * y;
  const x2 = qx * qx + qy * qy + qz * qz;
  const y2 = y * y * l2;
  const z2 = z * z * l2;
  const k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - rb;
  if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - ra;
  return (Math.sqrt(x2 * a2 * il2) + y * rr) * il2 - ra;
}

export const sdRoundCone = sdCapsule;

/* Half-space {(p − c)·n ≥ 0} (n unit): distance, negative inside. */
export function sdHalfSpace(p, c, n) {
  return -((p[0] - c[0]) * n[0] + (p[1] - c[1]) * n[1] + (p[2] - c[2]) * n[2]);
}

/* Sharp sphere segment (ball ∩ half-space above the cut plane). Bound, not
   exact, near the rim — fine for smin/levelSet. */
export function sdSphereSegment(p, center, R, axis, cut) {
  const dx = p[0] - center[0], dy = p[1] - center[1], dz = p[2] - center[2];
  const hh = dx * axis[0] + dy * axis[1] + dz * axis[2];
  return Math.max(Math.hypot(dx, dy, dz) - R, cut - hh);
}

/* HEAD PROXY for the recommended junction pattern:
     body = levelSetSolid(p => smin(bodySDF(p), proxy(p), k))   // fillets the neck→head-base corner
     solid = unionAll([body, sphereSegment(...)])               // exact polished head on top
   The proxy is the exact head shrunk INSIDE itself (sphere by `inset`, base
   plane raised by `baseInset`, footprint pulled `rimMargin` inside the flat
   base disc), so none of its faceted levelSet surface survives the union; only
   the smin fillet below the base plane shows. Keep baseInset small (0.03 mm):
   the fillet meets the real base plane at ≈ sqrt(2·baseInset/k) rad.
   `info` = sphereSegment(...).info. Returns p → distance (negative inside). */
export function headProxySDF(info, { inset = 0.1, baseInset = 0.03, rimMargin = 1.5 } = {}) {
  const C = info.center, R = info.radius - inset, ax = info.axis, cut = info.cut + baseInset;
  const rCyl = info.baseRadius - rimMargin;
  if (!(rCyl > 0)) throw new Error('headProxySDF: rimMargin larger than the base disc');
  return (p) => {
    const dx = p[0] - C[0], dy = p[1] - C[1], dz = p[2] - C[2];
    const hh = dx * ax[0] + dy * ax[1] + dz * ax[2];
    const rr = Math.sqrt(Math.max(0, dx * dx + dy * dy + dz * dz - hh * hh));
    return Math.max(Math.hypot(dx, dy, dz) - R, cut - hh, rr - rCyl);
  };
}

/* Axis-aligned box, centre c, half sizes h, optional edge rounding r. */
export function sdBox(p, c, h, r = 0) {
  const qx = Math.abs(p[0] - c[0]) - (h[0] - r);
  const qy = Math.abs(p[1] - c[1]) - (h[1] - r);
  const qz = Math.abs(p[2] - c[2]) - (h[2] - r);
  const ox = Math.max(qx, 0), oy = Math.max(qy, 0), oz = Math.max(qz, 0);
  return Math.hypot(ox, oy, oz) + Math.min(Math.max(qx, qy, qz), 0) - r;
}

/* 2D polygon SDF (negative inside). poly = [[u, v], …] any winding. */
export function sdPolygon2(u, v, poly) {
  const n = poly.length;
  let d = (u - poly[0][0]) ** 2 + (v - poly[0][1]) ** 2;
  let s = 1;
  for (let i = 0, j = n - 1; i < n; j = i, i++) {
    const ex = poly[j][0] - poly[i][0], ey = poly[j][1] - poly[i][1];
    const wx = u - poly[i][0], wy = v - poly[i][1];
    const t = Math.max(0, Math.min(1, (wx * ex + wy * ey) / (ex * ex + ey * ey)));
    const bx = wx - ex * t, by = wy - ey * t;
    d = Math.min(d, bx * bx + by * by);
    const c1 = v >= poly[i][1], c2 = v < poly[j][1], c3 = ex * wy > ey * wx;
    if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
  }
  return s * Math.sqrt(d);
}

/* Extrude a 2D distance d2 (in XZ) symmetrically along Y to half-thickness h. */
export function sdExtrudeY(d2, y, h) {
  const wx = d2, wy = Math.abs(y) - h;
  return Math.min(Math.max(wx, wy), 0) + Math.hypot(Math.max(wx, 0), Math.max(wy, 0));
}

/* Fin / slab with ROUNDED edges: polygon in XZ ([[x, z], …]), total
   thickness 2h along Y, edge radius r (r < h). */
export function sdRoundedSlabY(p, poly, h, r) {
  return sdExtrudeY(sdPolygon2(p[0], p[2], poly) + r, p[1], h - r) - r;
}

/* Smooth union (quadratic smin). k ≈ blend width in mm (≈ fillet size). */
export function smin(a, b, k) {
  if (k <= 0) return Math.min(a, b);
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
/* Smooth subtraction: remove b from a with blend k. */
export function ssub(a, b, k) {
  return -smin(-a, b, k);
}
/* Smooth-union a list of distances. */
export function sminAll(ds, k) {
  let d = ds[0];
  for (let i = 1; i < ds.length; i++) d = smin(d, ds[i], k);
  return d;
}

/* Mesh an SDF (negative inside) with Manifold.levelSet.
   bounds {min, max} of the solid — padded by 2·edge automatically; with
   symmetricY the Y range is made ±max so the BCC grid is mirror-symmetric
   about y = 0. Throws if the surface touches the grid box (egg-crate).
   Cost: ~0.7 s per 1e5 triangles at edge 1.0 mm (JS callback bound). Use
   edge 0.6–1.0 mm for bodies; put the polished head on as an exact
   sphereSegment instead of meshing it here. */
export function levelSetSolid(sdf, bounds, edge = 0.8, { symmetricY = true, level = 0 } = {}) {
  const { Manifold } = getEngine();
  const pad = 2 * edge;
  const min = [bounds.min[0] - pad, bounds.min[1] - pad, bounds.min[2] - pad];
  const max = [bounds.max[0] + pad, bounds.max[1] + pad, bounds.max[2] + pad];
  if (symmetricY) { const yy = Math.max(Math.abs(min[1]), Math.abs(max[1])); min[1] = -yy; max[1] = yy; }
  const m = Manifold.levelSet((p) => -sdf(p), { min, max }, edge, level);
  m.getMesh();
  if (m.isEmpty()) throw new Error('levelSetSolid: empty (sdf sign? negative must be inside)');
  const b = bbox(m);
  for (let k = 0; k < 3; k++) {
    if (b.min[k] <= min[k] + edge * 0.5 || b.max[k] >= max[k] - edge * 0.5)
      throw new Error(`levelSetSolid: surface reaches the grid box on axis ${k} — enlarge bounds`);
  }
  return m;
}
