/* validate(manifold, opts) → report for a spacer POSITIVE.

   Checks (each fills report.<key> and, if it fails, report.failures):
   - manifold status NoError; exactly 1 connected component; genus equal to
     the number of intended through-holes (opts.expectedGenus, default 0)
   - volume, PMMA mass (ASSUMPTION: 1.18 g/cm³) and 40 g packs
   - mirror symmetry about y = 0 (max point→surface deviation)
   - Y-DEMOLD: a 0.5 mm grid of lines parallel to Y over the XZ bounds; each
     line must meet the solid in ONE interval containing y = 0, or not at all
   - minimum local thickness (shape diameter along −normal from surface samples)
   - sharp CONCAVE creases (unfilleted junctions / notches): concave mesh edges
     turning more than maxCreaseDeg, sliver triangles ignored, fail when their
     total length exceeds creaseMaxLengthMm
   - head: sphere fit given the head centre + radius (facet deviation, LSQ fit,
     radial rays over the polished cap)
   - triangle count
*/

import { statusName, toMeshArrays, norm, DEG } from './common.mjs';
import { buildBVH, rayAll, rayFirst, closestPoint, closestPtTri } from './bvh.mjs';

export const PMMA_DENSITY_G_CM3 = 1.18;
export const PACK_G = 40;

const DEFAULTS = {
  expectedGenus: null,     // default: holes.length (or 0)
  holes: null,             // Y through-holes [{ x, z, r }]: each must be open along Y;
                           // thickness samples within r + holeRimMargin of the axis are
                           // skipped (a Y hole in a curved face leaves an intrinsic wedge rim)
  holeRimMargin: 2,        // mm
  symTol: 0.05,            // mm, max mirror deviation
  demoldSpacing: 0.5,      // mm, grid of Y-lines
  demoldYTol: 0.01,        // mm, "interval contains y = 0" slack
  thicknessSamples: 3000,
  minThickness: 6,         // mm, required local thickness (p1 must reach it)
  minThicknessHardFrac: 0.9, // absolute min must reach frac × minThickness
  thicknessIgnoreBelowZ: null, // e.g. exclude the rounded distal tip
  thicknessIgnore: null,   // (p) => bool, custom exclusion
  thicknessGrazingDeg: 70, // a ray meeting the far face at > this incidence is an EDGE
                           // artefact (hole rim on a curved face, ~90° edge), not a
                           // wall: reported, but kept out of min / p1. Wedges sharper
                           // than ~70° are still measured (and fail).
  maxCreaseDeg: 35,        // concave dihedral turn that counts as a sharp notch
                           // (a ≥ 2 mm fillet meshed at ≤ 1 mm edges turns ≤ ~29° per edge)
  creaseMaxLengthMm: 2,    // total crease length tolerated (levelSet noise is sub-mm)
  creaseMinAreaFrac: 0.05, // ignore edges touching faces smaller than this × median face area
  knifeEdgeDeg: 80,        // WARN on convex edges whose interior angle is below this (bare rims)
  head: null,              // { center, radius, axis?, capAngleDeg? }
  sphereTol: 0.05,         // mm, head facet deviation allowed
  maxTriangles: 2_000_000,
  seed: 12345,
};

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r3 = (v, d = 3) => v.map((x) => +x.toFixed(d));
const rnd = (x, d = 3) => (x == null || !isFinite(x) ? x : +x.toFixed(d));

function percentile(sorted, q) {
  if (!sorted.length) return null;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.floor(q * (sorted.length - 1))));
  return sorted[i];
}

/* ---------------------------------------------------------------- */

function checkSymmetry(mesh, B, tol) {
  const P = mesh.positions;
  const nV = P.length / 3;
  const q = 1e4; // 0.1 µm key grid
  const key = (x, y, z) => `${Math.round(x * q)},${Math.round(y * q)},${Math.round(z * q)}`;
  const set = new Set();
  for (let i = 0; i < nV; i++) set.add(key(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]));
  let maxDev = 0, sum = 0, nExact = 0, nQuery = 0, worst = null;
  for (let i = 0; i < nV; i++) {
    const x = P[i * 3], y = -P[i * 3 + 1], z = P[i * 3 + 2];
    if (set.has(key(x, y, z))) { nExact++; continue; }
    const cp = closestPoint(B, [x, y, z]);
    nQuery++;
    const d = cp ? cp.dist : Infinity;
    sum += d;
    if (d > maxDev) { maxDev = d; worst = [x, -y, z]; }
  }
  return {
    maxDev: rnd(maxDev, 5), meanDev: rnd(nV ? sum / nV : 0, 6), vertices: nV,
    exactMirrorMatches: nExact, closestPointQueries: nQuery,
    worstVertex: worst ? r3(worst) : null, tol, pass: maxDev <= tol,
  };
}

/* Lines parallel to +Y on a jittered XZ grid. */
function checkDemold(B, bounds, spacing, yTol) {
  const [x0, y0, z0] = bounds.min, [x1, y1, z1] = bounds.max;
  const jx = 0.1371 * spacing, jz = 0.2913 * spacing;           // avoid vertex/edge alignment
  const nx = Math.max(1, Math.ceil((x1 - x0) / spacing)), nz = Math.max(1, Math.ceil((z1 - z0) / spacing));
  const T = new Float64Array(4096), S = new Int8Array(4096);
  const idx = new Uint32Array(4096);
  let rays = 0, hitRays = 0, fails = 0, ambiguous = 0, maxIntervals = 0;
  const samples = [];
  let fb = null; // bounding box of failing rays
  const oy = y0 - 1, tmax = (y1 - y0) + 2;
  for (let iz = 0; iz <= nz; iz++) {
    const z = z0 + iz * spacing + jz;
    if (z > z1) continue;
    for (let ix = 0; ix <= nx; ix++) {
      const x = x0 + ix * spacing + jx;
      if (x > x1) continue;
      rays++;
      const n = rayAll(B, [x, oy, z], [0, 1, 0], 0, tmax, T, S);
      if (!n) continue;
      hitRays++;
      for (let i = 0; i < n; i++) idx[i] = i;
      const ord = Array.from(idx.subarray(0, n)).sort((a, b) => T[a] - T[b]);
      // dedupe coincident same-sign hits (shared edges / vertices)
      const ts = [], ss = [];
      for (const i of ord) {
        const t = T[i], s = S[i];
        if (ts.length && Math.abs(t - ts[ts.length - 1]) < 1e-7 && s === ss[ss.length - 1]) continue;
        ts.push(t); ss.push(s);
      }
      // winding walk → inside intervals
      let w = 0, bad = false;
      const iv = [];
      let open = null;
      for (let k = 0; k < ts.length; k++) {
        const prev = w;
        w += ss[k] < 0 ? 1 : -1;
        if (w < 0) { bad = true; break; }
        if (prev === 0 && w > 0) open = ts[k];
        if (prev > 0 && w === 0) { iv.push([open + oy, ts[k] + oy]); open = null; }
      }
      if (bad || w !== 0) {
        ambiguous++;
        if (samples.length < 20) samples.push({ x: rnd(x), z: rnd(z), kind: 'ambiguous', hits: ts.map((t) => rnd(t + oy)) });
        continue;
      }
      // merge touching intervals (gap < 1 µm)
      const merged = [];
      for (const it of iv) {
        if (merged.length && it[0] - merged[merged.length - 1][1] < 1e-3) merged[merged.length - 1][1] = it[1];
        else merged.push(it.slice());
      }
      if (merged.length > maxIntervals) maxIntervals = merged.length;
      const ok = merged.length === 0 || (merged.length === 1 && merged[0][0] <= yTol && merged[0][1] >= -yTol);
      if (!ok) {
        fails++;
        if (!fb) fb = { min: [x, z], max: [x, z] };
        fb.min[0] = Math.min(fb.min[0], x); fb.min[1] = Math.min(fb.min[1], z);
        fb.max[0] = Math.max(fb.max[0], x); fb.max[1] = Math.max(fb.max[1], z);
        if (samples.length < 20) samples.push({ x: rnd(x), z: rnd(z), kind: 'undercut', intervals: merged.map((m) => [rnd(m[0]), rnd(m[1])]) });
      }
    }
  }
  const ambLimit = Math.max(3, Math.floor(0.0005 * hitRays));
  return {
    spacing, rays, raysHittingSolid: hitRays, failures: fails, ambiguous, ambiguousLimit: ambLimit,
    maxIntervalsOnALine: maxIntervals,
    failRegionXZ: fb ? { x: [rnd(fb.min[0]), rnd(fb.max[0])], z: [rnd(fb.min[1]), rnd(fb.max[1])] } : null,
    samples, pass: fails === 0 && ambiguous <= ambLimit,
  };
}

/* Shape-diameter along −normal from area-weighted surface samples. */
function checkThickness(mesh, B, o) {
  const P = mesh.positions, I = mesh.indices;
  const nT = I.length / 3;
  const cum = new Float64Array(nT);
  let tot = 0;
  for (let t = 0; t < nT; t++) {
    const a = I[t * 3] * 3, b = I[t * 3 + 1] * 3, c = I[t * 3 + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
    const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    tot += 0.5 * Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx);
    cum[t] = tot;
  }
  const rng = mulberry32(o.seed);
  const vals = [], grazing = [];
  const cosGraze = Math.cos(o.thicknessGrazingDeg * DEG);
  const holes = o.holes && o.holes.length ? o.holes : null;
  let skipped = 0, noHit = 0, nearHoles = 0;
  for (let s = 0; s < o.thicknessSamples; s++) {
    const r = rng() * tot;
    let lo = 0, hi = nT - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < r) lo = m + 1; else hi = m; }
    const t = lo;
    const a = I[t * 3] * 3, b = I[t * 3 + 1] * 3, c = I[t * 3 + 2] * 3;
    let u = rng(), v = rng();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const p = [
      P[a] + u * (P[b] - P[a]) + v * (P[c] - P[a]),
      P[a + 1] + u * (P[b + 1] - P[a + 1]) + v * (P[c + 1] - P[a + 1]),
      P[a + 2] + u * (P[b + 2] - P[a + 2]) + v * (P[c + 2] - P[a + 2]),
    ];
    if (o.thicknessIgnoreBelowZ != null && p[2] < o.thicknessIgnoreBelowZ) { skipped++; continue; }
    if (o.thicknessIgnore && o.thicknessIgnore(p)) { skipped++; continue; }
    if (holes && holes.some((hh) => Math.hypot(p[0] - hh.x, p[2] - hh.z) < hh.r + o.holeRimMargin)) { nearHoles++; continue; }
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
    const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    const n = norm([uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]);
    const eps = 1e-3;
    const org = [p[0] - n[0] * eps, p[1] - n[1] * eps, p[2] - n[2] * eps];
    const h = rayFirst(B, org, [-n[0], -n[1], -n[2]], 1e-6, 1e4, +1);
    if (!h) { noHit++; continue; }
    const hn = B.nrm, hl = Math.hypot(hn[h.tri * 3], hn[h.tri * 3 + 1], hn[h.tri * 3 + 2]) || 1;
    const inc = -(hn[h.tri * 3] * n[0] + hn[h.tri * 3 + 1] * n[1] + hn[h.tri * 3 + 2] * n[2]) / hl;  // cos(incidence)
    if (inc < cosGraze) { grazing.push(h.t + eps); continue; }
    vals.push({ d: h.t + eps, p, n });
  }
  vals.sort((x, y) => x.d - y.d);
  const ds = vals.map((v) => v.d);
  const min = ds.length ? ds[0] : null;
  const p1 = percentile(ds, 0.01), p5 = percentile(ds, 0.05), med = percentile(ds, 0.5);
  const thinnest = [];
  for (const v of vals) {
    if (thinnest.length >= 10) break;
    if (thinnest.some((w) => Math.hypot(w.p[0] - v.p[0], w.p[1] - v.p[1], w.p[2] - v.p[2]) < 3)) continue;
    thinnest.push({ d: rnd(v.d), p: r3(v.p, 2), n: r3(v.n, 2) });
  }
  const hard = o.minThickness * o.minThicknessHardFrac;
  return {
    samples: vals.length, skipped, skippedNearHoles: nearHoles, noHit, edgeSamples: grazing.length,
    edgeSamplesMin: grazing.length ? rnd(Math.min(...grazing)) : null,
    min: rnd(min), p1: rnd(p1), p5: rnd(p5), median: rnd(med),
    where: vals.length ? { p: r3(vals[0].p, 2), n: r3(vals[0].n, 2) } : null,
    thinnest, minRequired: o.minThickness, hardMin: rnd(hard),
    pass: ds.length > 0 && p1 >= o.minThickness && min >= hard,
  };
}

/* Sharp concave edges. For each interior edge: turn angle between the two
   face normals; concave when the far vertex of one face lies above the
   other face's plane. Slivers (area < creaseMinAreaFrac × median) are
   skipped — marching-tetrahedra slivers carry random normals. */
function checkCreases(mesh, o) {
  const P = mesh.positions, I = mesh.indices;
  const nT = I.length / 3, nV = P.length / 3;
  const fn = new Float64Array(nT * 3), fa = new Float64Array(nT);
  for (let t = 0; t < nT; t++) {
    const a = I[t * 3] * 3, b = I[t * 3 + 1] * 3, c = I[t * 3 + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
    const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    fa[t] = l / 2;
    fn[t * 3] = nx / l; fn[t * 3 + 1] = ny / l; fn[t * 3 + 2] = nz / l;
  }
  const sortedA = Float64Array.from(fa).sort();
  const minArea = o.creaseMinAreaFrac * (sortedA.length ? sortedA[sortedA.length >> 1] : 0);
  const cosMax = Math.cos(o.maxCreaseDeg * DEG);
  const cosKnife = Math.cos((180 - (o.knifeEdgeDeg ?? 0)) * DEG);   // turn > 180 − interior
  const open = new Map();
  let count = 0, length = 0, worstDeg = 0, worstAt = null, skipped = 0;
  let knifeLen = 0, knifeWorst = 180, knifeAt = null;
  const where = [];
  for (let t = 0; t < nT; t++) {
    for (let k = 0; k < 3; k++) {
      const a = I[t * 3 + k], b = I[t * 3 + ((k + 1) % 3)];
      const key = a < b ? a * nV + b : b * nV + a;
      const other = open.get(key);
      if (other === undefined) { open.set(key, t * 3 + k); continue; }
      open.delete(key);
      const t2 = (other / 3) | 0, k2 = other % 3;
      if (fa[t] < minArea || fa[t2] < minArea) { skipped++; continue; }
      const cs = fn[t * 3] * fn[t2 * 3] + fn[t * 3 + 1] * fn[t2 * 3 + 1] + fn[t * 3 + 2] * fn[t2 * 3 + 2];
      if (cs >= cosMax) continue;
      const c2 = I[t2 * 3 + ((k2 + 2) % 3)] * 3, a3 = a * 3;
      const side = (P[c2] - P[a3]) * fn[t * 3] + (P[c2 + 1] - P[a3 + 1]) * fn[t * 3 + 1] + (P[c2 + 2] - P[a3 + 2]) * fn[t * 3 + 2];
      const b3 = b * 3;
      const el = Math.hypot(P[b3] - P[a3], P[b3 + 1] - P[a3 + 1], P[b3 + 2] - P[a3 + 2]);
      const deg = Math.acos(Math.max(-1, Math.min(1, cs))) / DEG;
      if (side <= 0) {                                              // convex edge
        if (cs < cosKnife) {
          knifeLen += el;
          if (180 - deg < knifeWorst) { knifeWorst = 180 - deg; knifeAt = [(P[a3] + P[b3]) / 2, (P[a3 + 1] + P[b3 + 1]) / 2, (P[a3 + 2] + P[b3 + 2]) / 2]; }
        }
        continue;
      }
      const mid = [(P[a3] + P[b3]) / 2, (P[a3 + 1] + P[b3 + 1]) / 2, (P[a3 + 2] + P[b3 + 2]) / 2];
      count++; length += el;
      if (deg > worstDeg) { worstDeg = deg; worstAt = mid; }
      if (where.length < 10 && !where.some((w) => Math.hypot(w[0] - mid[0], w[1] - mid[1], w[2] - mid[2]) < 5)) where.push(mid);
    }
  }
  return {
    maxCreaseDeg: o.maxCreaseDeg, edges: count, lengthMm: rnd(length, 2), worstDeg: rnd(worstDeg, 1),
    worstAt: worstAt ? r3(worstAt, 2) : null, locations: where.map((w) => r3(w, 1)),
    slivers: skipped, maxLengthMm: o.creaseMaxLengthMm, pass: length <= o.creaseMaxLengthMm,
    knifeEdges: { interiorBelowDeg: o.knifeEdgeDeg, lengthMm: rnd(knifeLen, 2), sharpestDeg: knifeAt ? rnd(knifeWorst, 1) : null, at: knifeAt ? r3(knifeAt, 2) : null },
  };
}

/* Algebraic least-squares sphere fit: |x|² = 2c·x + d. */
function fitSphere(pts) {
  const A = Array.from({ length: 4 }, () => new Float64Array(4));
  const bv = new Float64Array(4);
  for (const [x, y, z] of pts) {
    const row = [2 * x, 2 * y, 2 * z, 1], rhs = x * x + y * y + z * z;
    for (let i = 0; i < 4; i++) { bv[i] += row[i] * rhs; for (let j = 0; j < 4; j++) A[i][j] += row[i] * row[j]; }
  }
  // Gaussian elimination with partial pivoting
  const M = A.map((r, i) => [...r, bv[i]]);
  for (let c = 0; c < 4; c++) {
    let p = c;
    for (let r = c + 1; r < 4; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    if (Math.abs(M[c][c]) < 1e-12) return null;
    for (let r = 0; r < 4; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k < 5; k++) M[r][k] -= f * M[c][k];
    }
  }
  const s = M.map((r, i) => r[4] / r[i]);
  const c = [s[0], s[1], s[2]];
  return { center: c, radius: Math.sqrt(s[3] + c[0] ** 2 + c[1] ** 2 + c[2] ** 2) };
}

function checkHead(mesh, B, head, sphereTol) {
  const C = head.center, R = head.radius;
  const axis = head.axis ? norm(head.axis) : null;
  const capCos = axis && head.capAngleDeg != null ? Math.cos(head.capAngleDeg * DEG) : null;
  const P = mesh.positions, I = mesh.indices;
  const band = 0.1; // mm: a vertex within this of the sphere counts as "on the head"
  const onSphere = new Uint8Array(P.length / 3);
  const inCap = (x, y, z) => {
    if (!capCos) return true;
    const dx = x - C[0], dy = y - C[1], dz = z - C[2];
    const l = Math.hypot(dx, dy, dz) || 1;
    return (dx * axis[0] + dy * axis[1] + dz * axis[2]) / l >= capCos - 1e-9;
  };
  let maxVtx = 0;
  const pts = [];
  for (let i = 0; i < onSphere.length; i++) {
    const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
    const d = Math.hypot(x - C[0], y - C[1], z - C[2]) - R;
    if (Math.abs(d) <= band) {
      onSphere[i] = 1;
      if (!inCap(x, y, z)) continue;
      if (Math.abs(d) > maxVtx) maxVtx = Math.abs(d);
      pts.push([x, y, z]);
    }
  }
  // facets inside the cap (by centroid) with all three corners on the sphere:
  // deepest point = closest point to C
  const T9 = new Float64Array(9), q = [0, 0, 0];
  let nTri = 0, area = 0, maxFacet = 0, worst = null;
  for (let t = 0; t < I.length / 3; t++) {
    const a = I[t * 3], b = I[t * 3 + 1], c = I[t * 3 + 2];
    if (!(onSphere[a] && onSphere[b] && onSphere[c])) continue;
    const gx = (P[a * 3] + P[b * 3] + P[c * 3]) / 3, gy = (P[a * 3 + 1] + P[b * 3 + 1] + P[c * 3 + 1]) / 3, gz = (P[a * 3 + 2] + P[b * 3 + 2] + P[c * 3 + 2]) / 3;
    if (!inCap(gx, gy, gz)) continue;
    for (let k = 0; k < 3; k++) { const v = I[t * 3 + k] * 3; T9[k * 3] = P[v]; T9[k * 3 + 1] = P[v + 1]; T9[k * 3 + 2] = P[v + 2]; }
    {
      // a facet whose corners all sit on the sphere but whose normal is not radial is a
      // chord (e.g. flat base triangles spanning rim vertices), not part of the dome
      const ux = T9[3] - T9[0], uy = T9[4] - T9[1], uz = T9[5] - T9[2];
      const vx = T9[6] - T9[0], vy = T9[7] - T9[1], vz = T9[8] - T9[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const rx = gx - C[0], ry = gy - C[1], rz = gz - C[2];
      const cr = (nx * rx + ny * ry + nz * rz) / ((Math.hypot(nx, ny, nz) * Math.hypot(rx, ry, rz)) || 1);
      if (cr < 0.95) continue;
    }
    closestPtTri(C[0], C[1], C[2], T9, 0, q);
    const dev = R - Math.hypot(q[0] - C[0], q[1] - C[1], q[2] - C[2]);
    if (dev > maxFacet) { maxFacet = dev; worst = q.slice(); }
    const ux = T9[3] - T9[0], uy = T9[4] - T9[1], uz = T9[5] - T9[2];
    const vx = T9[6] - T9[0], vy = T9[7] - T9[1], vz = T9[8] - T9[2];
    area += 0.5 * Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx);
    nTri++;
  }
  const fit = pts.length >= 10 ? fitSphere(pts) : null;
  const fitCenterErr = fit ? Math.hypot(fit.center[0] - C[0], fit.center[1] - C[1], fit.center[2] - C[2]) : null;
  const fitRadiusErr = fit ? fit.radius - R : null;

  // radial rays over the cap (Fibonacci directions): farthest surface point per direction
  let rayOut = 0, rayIn = 0, nRays = 0, rayWorst = null;
  if (axis && capCos != null) {
    const T = new Float64Array(1024), S = new Int8Array(1024);
    const N = 2000;
    const ref = Math.abs(axis[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const e1 = norm([ref[1] * axis[2] - ref[2] * axis[1], ref[2] * axis[0] - ref[0] * axis[2], ref[0] * axis[1] - ref[1] * axis[0]]);
    const e2 = [axis[1] * e1[2] - axis[2] * e1[1], axis[2] * e1[0] - axis[0] * e1[2], axis[0] * e1[1] - axis[1] * e1[0]];
    for (let i = 0; i < N; i++) {
      const zc = 1 - (i + 0.5) / N * (1 - capCos);        // uniform over the cap
      const r = Math.sqrt(Math.max(0, 1 - zc * zc)), ph = i * Math.PI * (3 - Math.sqrt(5));
      const loc = [r * Math.cos(ph), r * Math.sin(ph), zc];
      // local (+Z = axis) → world
      const d = [
        loc[0] * e1[0] + loc[1] * e2[0] + loc[2] * axis[0],
        loc[0] * e1[1] + loc[1] * e2[1] + loc[2] * axis[1],
        loc[0] * e1[2] + loc[1] * e2[2] + loc[2] * axis[2],
      ];
      const n = rayAll(B, C, d, 0, 4 * R + 200, T, S);
      if (!n) { rayIn = Math.max(rayIn, R); continue; }
      let far = 0;
      for (let k = 0; k < n; k++) if (S[k] > 0 && T[k] > far) far = T[k];
      nRays++;
      if (far - R > rayOut) { rayOut = far - R; rayWorst = [C[0] + d[0] * far, C[1] + d[1] * far, C[2] + d[2] * far]; }
      if (R - far > rayIn) { rayIn = R - far; rayWorst = rayWorst || [C[0] + d[0] * far, C[1] + d[1] * far, C[2] + d[2] * far]; }
    }
  }
  const capArea = capCos != null ? 2 * Math.PI * R * R * (1 - capCos) : null;
  const coverage = capArea ? area / capArea : null;
  const fails = [];
  if (!nTri) fails.push('no head facets found on the given sphere');
  if (maxFacet > sphereTol) fails.push(`facet deviation ${maxFacet.toFixed(4)} > ${sphereTol}`);
  if (fit && fitCenterErr > sphereTol) fails.push(`LSQ centre off by ${fitCenterErr.toFixed(4)}`);
  if (fit && Math.abs(fitRadiusErr) > sphereTol) fails.push(`LSQ radius off by ${fitRadiusErr.toFixed(4)}`);
  if (capCos != null && (rayOut > sphereTol || rayIn > sphereTol)) fails.push(`cap rays: out ${rayOut.toFixed(3)}, in ${rayIn.toFixed(3)}`);
  if (coverage != null && coverage < 0.95) fails.push(`only ${(coverage * 100).toFixed(1)}% of the ${head.capAngleDeg}° cap is on the sphere`);
  return {
    center: r3(C), radius: R, axis: axis ? r3(axis, 4) : null, capAngleDeg: head.capAngleDeg ?? null,
    vertices: pts.length, facets: nTri, areaMm2: rnd(area, 1), capCoverage: rnd(coverage, 4),
    maxVertexDev: rnd(maxVtx, 5), maxFacetDev: rnd(maxFacet, 5), worstFacetPoint: worst ? r3(worst) : null,
    lsqFit: fit ? { center: r3(fit.center, 4), radius: rnd(fit.radius, 4), centerErr: rnd(fitCenterErr, 5), radiusErr: rnd(fitRadiusErr, 5) } : null,
    capRays: capCos != null ? { rays: nRays, maxOutward: rnd(rayOut, 4), maxInward: rnd(rayIn, 4), worst: rayWorst ? r3(rayWorst) : null } : null,
    tol: sphereTol, failures: fails, pass: fails.length === 0,
  };
}

/* ---------------------------------------------------------------- */

export function validate(manifold, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const t0 = Date.now();
  const timing = {};
  const rep = { ok: false, failures: [], warnings: [] };
  const fail = (m) => rep.failures.push(m);

  rep.status = statusName(manifold);
  if (rep.status !== 'NoError') fail(`manifold status ${rep.status}`);
  if (manifold.isEmpty()) { fail('empty solid'); return rep; }

  const parts = manifold.decompose();
  rep.components = parts.length;
  for (const p of parts) p.delete();
  if (rep.components !== 1) fail(`${rep.components} connected components (must be 1)`);

  if (o.expectedGenus == null) o.expectedGenus = o.holes ? o.holes.length : 0;
  rep.genus = manifold.genus();
  rep.expectedGenus = o.expectedGenus;
  if (rep.genus !== o.expectedGenus) fail(`genus ${rep.genus} ≠ expected ${o.expectedGenus} (through-holes)`);

  rep.triangles = manifold.numTri();
  rep.vertices = manifold.numVert();
  if (rep.triangles > o.maxTriangles) fail(`${rep.triangles} triangles > ${o.maxTriangles}`);

  const props = manifold.getProperties();
  const cm3 = props.volume / 1000;
  rep.volume = { mm3: rnd(props.volume, 1), cm3: rnd(cm3, 2) };
  rep.surfaceAreaMm2 = rnd(props.surfaceArea, 1);
  const mass = cm3 * PMMA_DENSITY_G_CM3;
  rep.pmma = {
    densityGcm3: PMMA_DENSITY_G_CM3,
    assumption: 'ASSUMPTION: cured PMMA bone cement 1.18 g/cm³; one 40 g pack counted as 40 g of cement (ignores monomer mass and waste — conservative)',
    massG: rnd(mass, 1), packs40gExact: rnd(mass / PACK_G, 2), packs40g: Math.ceil(mass / PACK_G - 1e-9),
  };

  const b = manifold.boundingBox();
  rep.bounds = {
    min: r3([b.min[0], b.min[1], b.min[2]]), max: r3([b.max[0], b.max[1], b.max[2]]),
    size: r3([b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]]),
  };
  if (Math.abs(b.min[2]) > 0.05) rep.warnings.push(`distal tip at z = ${b.min[2].toFixed(3)} (contract: z = 0)`);
  timing.basics = Date.now() - t0;

  const mesh = toMeshArrays(manifold);
  let t = Date.now();
  const B = buildBVH(mesh.positions, mesh.indices);
  timing.bvh = Date.now() - t;

  t = Date.now();
  rep.symmetry = checkSymmetry(mesh, B, o.symTol);
  timing.symmetry = Date.now() - t;
  if (!rep.symmetry.pass) fail(`mirror asymmetry ${rep.symmetry.maxDev} mm > ${o.symTol} at ${rep.symmetry.worstVertex}`);

  t = Date.now();
  rep.demold = checkDemold(B, { min: [b.min[0], b.min[1], b.min[2]], max: [b.max[0], b.max[1], b.max[2]] }, o.demoldSpacing, o.demoldYTol);
  timing.demold = Date.now() - t;
  if (!rep.demold.pass) {
    fail(`Y-demold: ${rep.demold.failures} undercut lines, ${rep.demold.ambiguous} ambiguous` +
      (rep.demold.failRegionXZ ? ` (x ${rep.demold.failRegionXZ.x}, z ${rep.demold.failRegionXZ.z})` : ''));
  } else if (rep.demold.ambiguous) rep.warnings.push(`${rep.demold.ambiguous} ambiguous demold rays (grazing)`);

  if (o.holes && o.holes.length) {
    const T = new Float64Array(64), S = new Int8Array(64);
    rep.holes = o.holes.map((hh) => {
      const n = rayAll(B, [hh.x, b.min[1] - 1, hh.z], [0, 1, 0], 0, b.max[1] - b.min[1] + 2, T, S);
      return { x: rnd(hh.x), z: rnd(hh.z), r: hh.r, open: n === 0 };
    });
    const shut = rep.holes.filter((hh) => !hh.open);
    if (shut.length) fail(`${shut.length} declared Y through-hole(s) blocked at ${shut.map((hh) => `(${hh.x}, ${hh.z})`).join(' ')}`);
  }

  t = Date.now();
  rep.thickness = checkThickness(mesh, B, o);
  timing.thickness = Date.now() - t;
  if (!rep.thickness.pass) {
    fail(`thickness: min ${rep.thickness.min} / p1 ${rep.thickness.p1} mm (need p1 ≥ ${o.minThickness}, min ≥ ${rep.thickness.hardMin}) at ${rep.thickness.where && rep.thickness.where.p}`);
  } else if (rep.thickness.min < o.minThickness) {
    rep.warnings.push(`thinnest sample ${rep.thickness.min} mm at ${rep.thickness.where.p} (< ${o.minThickness}, within hard limit)`);
  }

  if (o.maxCreaseDeg != null) {
    t = Date.now();
    rep.creases = checkCreases(mesh, o);
    timing.creases = Date.now() - t;
    if (!rep.creases.pass) {
      fail(`sharp concave crease: ${rep.creases.lengthMm} mm of edges turning > ${o.maxCreaseDeg}° (worst ${rep.creases.worstDeg}° at ${rep.creases.worstAt}) — fillet the junction`);
    }
    const kn = rep.creases.knifeEdges;
    if (kn.lengthMm > o.creaseMaxLengthMm) {
      rep.warnings.push(`knife edge: ${kn.lengthMm} mm of convex edges with interior angle < ${o.knifeEdgeDeg}° (sharpest ${kn.sharpestDeg}° at ${kn.at}) — round it (e.g. sphereSegment rimFillet)`);
    }
  }

  if (o.head) {
    t = Date.now();
    rep.head = checkHead(mesh, B, o.head, o.sphereTol);
    timing.head = Date.now() - t;
    if (!rep.head.pass) fail(`head: ${rep.head.failures.join('; ')}`);
  } else {
    rep.head = null;
    rep.warnings.push('no head sphere given — head fit not checked');
  }

  timing.total = Date.now() - t0;
  rep.timingMs = timing;
  rep.ok = rep.failures.length === 0;
  return rep;
}

/* One-line summary for logs. */
export function summarize(rep) {
  const h = rep.head;
  return [
    rep.ok ? 'OK  ' : 'FAIL',
    `vol ${rep.volume?.cm3} cm³`,
    `PMMA ${rep.pmma?.massG} g (${rep.pmma?.packs40g}×40 g)`,
    `comp ${rep.components}`, `genus ${rep.genus}/${rep.expectedGenus}`,
    `demold ${rep.demold?.failures}/${rep.demold?.rays}`,
    `sym ${rep.symmetry?.maxDev}`,
    `thick min ${rep.thickness?.min} p1 ${rep.thickness?.p1}`,
    `crease ${rep.creases ? rep.creases.lengthMm + ' mm' : '-'}`,
    h ? `head facet ${h.maxFacetDev}` : 'head -',
    `tris ${rep.triangles}`, `${rep.timingMs?.total} ms`,
  ].join(' | ');
}
