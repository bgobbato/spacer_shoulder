/* MODEL B — "Anatômico" (anatomic archetype, after the Synicem drawing).

   SURGEON DECISION 26/Sep/2026: the distal stem is a CHEST TUBE filled with
   cement (Klosterman 2021, PMC7917196). This positive is the PROXIMAL PART
   ONLY — it has to fit a Bambu Lab A1 mini (180 mm cube) as a two-half mold
   with ≥ 10 mm walls — and ends distally in a TUBE COUPLING:

     - exact polished sphere-segment head (near-hemisphere) whose flat base
       sits on the resection plane, NSA 135°, centre offset medially;
     - proximal metaphyseal BODY under the head: its footprint on the cut
       plane is a stadium (ML × AP); the medial calcar flares in a concave
       curve and flows into the head base through a fillet;
     - rounded LATERAL SHOULDER (a flat-faced fin, under the greater
       tuberosity) with 0 or 3 suture through-holes along Y;
     - short round proximal stem, Ø = tube OD + 2 × shoulderW;
     - TUBE COUPLING at the distal end: a coaxial SPIGOT Ø = tube OD
       (z ∈ [0, couplingLen]; in the mold it becomes the bore that seats the
       tube end and keeps it coaxial) and a flat annular SHOULDER (batente)
       at z = couplingLen where the stem widens: the tube end is set at this
       plane;
     - a straight CORE pin axis (stainless wire, default Ø 3.2) on the stem
       axis, continuous through the tube and this part up into the head —
       reported in meta, NOT subtracted (the solid stays full);
     - the fin ends distally in a 'gusset' segment that runs medially down
       into the stem (open junction angle instead of a square capsule end).

   Inside the tube the cement is a rod of the tube's LUMEN (≈ 6.7 mm with
   28 Fr and an assumed 1.3 mm wall), not the molded shaft: see meta.tube.lumen
   and docs/modelB.md. The mold makers do not open a bore for the tube:
   boreTool() + the CLI at the end of this file do (bore-tool / bore-mold).

   Model-level checks (throw): nothing above the head base but the head;
   concave junction radius ≥ minConcaveR on three section families
   (concaveRadiusCheck); suture-hole bridges ≥ 6 mm; molded shaft Ø constant
   within 0.1 mm (no ring at the coupling).

   Frame (mold contract): mm; stem axis = +Z; distal face at z = 0; +X =
   MEDIAL; Y = AP; mirror-symmetric about y = 0 (parting plane, demold ±Y).

   Construction:
     body SDF = smin( max( smin(stemAndCoupling, metaphysis, fin), cut-plane clip ), headProxy )
       - stemAndCoupling : smin(rounded cylinder Ø stem from z = couplingLen,
                                cylinder Ø tube OD below it, k = fillet at the batente)
       - metaphysis : triangle in the XZ plane (apex on the stem axis, top edge
                      on the cut plane) swept by a ball whose radius grows from
                      the stem radius to bodyAP/2 — f = hypot(max(d2,0), y) − r(z)
       - fin        : rounded slab (flat ±Y faces) of an XZ capsule
     every term is even in y and non-decreasing in |y| → every Y-line meets
     the solid in one interval through y = 0 (validate() checks).
     levelSetSolid → ∩ {z ≥ 0} (exact flat distal face) → ∪ exact head → − Y holes.
*/

import {
  DEG, headAxis, add, sub, scale, dot, sphereSegment, cylinderY, unionAll, toMeshArrays,
  sdPolygon2, sdExtrudeY, smin, headProxySDF, levelSetSolid, bbox, getEngine, revolveProfile, arcPoints,
  bake, cylinderBetween,
} from '../common.mjs';
import { buildBVH, closestPoint } from '../bvh.mjs';
import { validate } from '../validate.mjs';

export const NAME = 'B-anatomico';
export const DESCRIPTION = 'Anatomic archetype (Synicem-like), proximal part for a chest-tube stem: metaphyseal body with medial calcar curve, rounded lateral shoulder with suture holes, near-hemispherical polished head, short stem ending in a tube spigot + flat shoulder; straight core wire reported in meta';

export const TUBE_FR_OPTIONS = [24, 28, 32, 36];

export const DEFAULTS = {
  headD: 48,          // mm head sphere diameter
  headHD: 0.50,       // head height / diameter (0.5 = hemisphere); h = R − cut
  rimFillet: 2,       // mm torus blend at the head rim
  nsDeg: 135,         // neck–shaft angle (head axis tilted 180 − NSA toward +X)
  headOffset: 6,      // mm medial offset of the head-sphere centre from the stem axis
  totalLength: 115,   // mm positive length along Z: distal face (z = 0) to the top of the head
  tubeFr: 28,         // chest tube size (24 | 28 | 32 | 36 Fr); OD = Fr / 3 mm
  couplingLen: 15,    // mm spigot length (tube seat) from z = 0 up to the shoulder
  shoulderW: 2,       // mm radial width of the flat shoulder: stem Ø = OD + 2·shoulderW
  shoulderFillet: 0.6,// mm concave fillet spigot → shoulder (exact arc; the tube-seat corner)
  stemEdge: 0.6,      // mm rounding of the shoulder's outer (convex) edge (exact arc)
  finDraftDeg: 5,     // ° draft of the fin side walls (no wall parallel to the demold direction Y)
  metaLen: 45,        // mm below O (cut plane × stem axis) where the metaphyseal flare starts
  footprintML: null,  // mm body footprint on the cut plane, along the plane (ML); null = footprintRatio·headD (≤ 40)
  footprintMaxML: 30,  // mm cap of the ratio-derived footprint (34 on D58 left R 1.7 mm at the calcar)
  footprintRatio: 0.583, // footprint ML / head D when footprintML is null (48 → 28 mm; medial end unchanged vs 0.625 with margin 3)
  bodyAP: 20,         // mm body AP thickness at the cut plane
  medialRimGap: 14,   // mm medial end of the footprint kept this far inside the head base rim (room for the calcar fillet; 9 left R ≈ 1.5 mm on D44, 12 left 1.7 mm with NSA 125)
  footprintMargin: 5, // mm lateral end of the footprint kept inside the head base rim (5: room for a ≥ 2 mm fillet under the lateral rim)
  calcarPow: 1.6,     // growth exponent of the body radius (>1 = concave calcar flare)
  shoulderX: 19,      // mm lateral reach of the shoulder outline from the stem axis
  finAP: 12,          // mm AP thickness of the shoulder fin (flat ±Y faces)
  finTaper: 0.6,      // lower fin segment ends at (1 − finTaper)·hole-line x (0 = no gusset)
  finTaperLen: 12,    // mm length (in z) of that lower segment below the last hole
  finEdge: 3,         // mm rounding of the fin's AP edges
  sutureHoles: 3,     // 0 | 3 suture through-holes along Y in the shoulder
  holeD: 2.5,         // mm suture hole diameter
  holeSpacing: 8.5,   // mm centre-to-centre (cement bridge between holes = holeSpacing − holeD ≥ 6)
  holeCement: 6,      // mm cement around each hole in the XZ plane (fin radius − hole radius − 0.75)
  holeBodyClear: 11,  // mm hole line kept lateral of the body core's lateral edge (holes exit on flat fin faces)
  finGap: 6,          // mm fin top kept below the cut plane (keeps it clear of the head rim overhang)
  coreD: 3.2,         // mm stainless-steel core wire diameter (reported, not subtracted)
  tubeWall: 1.3,      // mm ASSUMED chest-tube wall (brand-dependent: measure) → lumen = OD − 2·wall (reported)
  boreClearance: 0.3, // mm diametral clearance of the tube bore tool (mold post-process, see CLI)
  coreHeadCover: 10,  // mm cement between the wire end and the polished dome
  kFin: 5,            // mm smin blend fin ↔ body (7 grew the blend onto the suture-hole exits on D52)
  kHead: 8,           // mm smin blend body ↔ head base (calcar → head fillet)
  kHeadMin: 4,        // mm smallest head blend (near the lateral rim; 3 left R ≈ 1.5 mm there)
  minConcaveR: 2,     // mm every concave junction must admit a ball of this radius (checked on sections)
  proxyRimMargin: 0.5,// mm head proxy pulled inside the flat base rim (see headProxySDF)
  headFilletAngleDeg: 7,  // ° angle at which the head-junction fillet meets the flat head base (13: ~30° kink; 8: R 1.7–1.99 on D44 / h/D 0.63 / NSA 125; 6: Y-undercut sliver at NSA 140)
  edge: 0.7,          // mm levelSet edge length
};

export const RANGES = {
  headD: [40, 58],
  headHD: [0.37, 0.63],
  rimFillet: [0, 4],
  nsDeg: [125, 140],
  headOffset: [0, 10],
  totalLength: [95, 140],
  tubeFr: [24, 36],
  couplingLen: [8, 25],
  shoulderW: [1.5, 4],
  shoulderFillet: [0.4, 1.5],
  stemEdge: [0.4, 1.5],
  finDraftDeg: [2, 10],
  metaLen: [30, 60],
  footprintML: [22, 40],
  footprintRatio: [0.5, 0.7],
  footprintMaxML: [22, 40],
  bodyAP: [14, 25],
  footprintMargin: [2, 6],
  medialRimGap: [6, 16],
  calcarPow: [1, 3],
  shoulderX: [12, 22],
  finAP: [8, 20],
  finTaper: [0, 1],
  finTaperLen: [0, 25],
  finEdge: [1, 4],
  sutureHoles: [0, 3],
  holeD: [1.5, 3.5],
  holeSpacing: [8.5, 12],
  holeCement: [5, 8],
  holeBodyClear: [8, 16],
  finGap: [3, 12],
  coreD: [2, 4],
  tubeWall: [0.8, 2],
  boreClearance: [0.1, 0.8],
  coreHeadCover: [6, 16],
  kFin: [2, 10],
  kHead: [2, 12],
  kHeadMin: [1, 8],
  minConcaveR: [2, 4],
  proxyRimMargin: [0.3, 3],
  headFilletAngleDeg: [6, 30],
  edge: [0.4, 1.2],
};

const r3 = (v, d = 3) => (Array.isArray(v) ? v.map((x) => +x.toFixed(d)) : +v.toFixed(d));
const clamp01 = (t) => Math.max(0, Math.min(1, t));

/* Distance from (u, v) to segment (a, b) in 2D. */
function sdSegment2(u, v, a, b) {
  const px = u - a[0], pz = v - a[1], bx = b[0] - a[0], bz = b[1] - a[1];
  const t = clamp01((px * bx + pz * bz) / (bx * bx + bz * bz || 1));
  return Math.hypot(px - bx * t, pz - bz * t);
}

/* Z-axis cylinder r, z ∈ [z0, z1], edges rounded by e (exact SDF). */
function sdCylZ(q, r, z0, z1, e = 0) {
  const hz = (z1 - z0) / 2, zc = (z0 + z1) / 2;
  const dx = Math.hypot(q[0], q[1]) - (r - e), dz = Math.abs(q[2] - zc) - (hz - e);
  return Math.min(Math.max(dx, dz), 0) + Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) - e;
}

/* ---- concave-radius check on planar sections --------------------------------
   A concave junction of radius r0 admits a rolling ball of radius r0: the
   morphological CLOSING of the section with a disc of radius r (offset +r then
   −r) adds material only where some concave corner is tighter than r. By
   Meusnier, a section's curvature is ≥ the surface's normal curvature in that
   direction, so passing on a section is conservative. For each section family
   the closing is binary-searched for the largest r that adds no region thicker
   than eps (= the estimated smallest concave radius there).
   family 'y': sections y = c (the XZ profile; the lateral head-rim notch lives
   here); family 'z': sections z = c (the fin ↔ body junctions).
   exclude(x, z, c) drops regions by their centroid (suture holes, the tube
   coupling's intentional 0.6 mm arcs). */
function sectionClosingExcess(cs, r, eps, keep) {
  const segs = 96;
  const a = cs.offset(r, 'Round', 2, segs);
  const c = a.offset(-r, 'Round', 2, segs);
  const d = c.subtract(cs);
  a.delete(); c.delete();
  let worst = 0, at = null;
  const all = [];
  for (const comp of d.decompose()) {
    if (comp.area() > 1e-4) {
      const bb = comp.bounds();
      const cu = (bb.min[0] + bb.max[0]) / 2, cv = (bb.min[1] + bb.max[1]) / 2;
      if (keep(cu, cv)) {
        // thickness of the added crescent: 2 × largest inward offset that leaves it non-empty
        let lo = 0, hi = Math.min(bb.max[0] - bb.min[0], bb.max[1] - bb.min[1]) / 2 + 1e-3;
        for (let i = 0; i < 12; i++) {
          const m = (lo + hi) / 2, e = comp.offset(-m, 'Round', 2, 32);
          if (e.isEmpty() || e.area() < 1e-6) hi = m; else lo = m;
          e.delete();
        }
        if (2 * lo > eps) all.push({ t: 2 * lo, at: [cu, cv] });
        if (2 * lo > worst) { worst = 2 * lo; at = [cu, cv]; }
      }
    }
    comp.delete();
  }
  d.delete();
  return { excess: worst, at, all };
}

/* planes: [{ family, R (rows = in-plane u, in-plane v, normal n; det +1), c (= n·p on
   the plane), keep(worldPoint) → bool }]. One bake per distinct R. */
export function concaveRadiusCheck(solid, { rMin = 2, eps = 0.03, planes = [] } = {}) {
  const out = { rMin, eps, sections: [], minR: Infinity, minAt: null, pass: true };
  const cache = new Map();
  for (const pl of planes) {
    const key = pl.R.join(',');
    if (!cache.has(key)) cache.set(key, bake(solid, pl.R));
    const cs = cache.get(key).slice(pl.c);
    if (!cs.isEmpty()) {
      const R = pl.R;
      const toWorld = (u, v) => [0, 1, 2].map((k) => R[k] * u + R[3 + k] * v + R[6 + k] * pl.c);
      const keep = (u, v) => pl.keep(toWorld(u, v));
      const atMin = sectionClosingExcess(cs, rMin, eps, keep);
      let rEst = rMin, at = null;
      if (atMin.excess > eps) {                     // tighter than rMin: estimate the radius
        let lo = 0.1, hi = rMin;
        for (let i = 0; i < 10; i++) {
          const m = (lo + hi) / 2;
          if (sectionClosingExcess(cs, m, eps, keep).excess > eps) hi = m; else lo = m;
        }
        rEst = lo; at = toWorld(...atMin.at);
        if (+rEst.toFixed(2) < rMin) out.pass = false;   // judged at the reported 0.01 mm resolution
      }
      const rec = { family: pl.family, plane: pl.label, excessAtRmin: +atMin.excess.toFixed(3), rEstimate: rEst >= rMin ? `>= ${rMin}` : +rEst.toFixed(2) };
      if (at) rec.where = at.map((x) => +x.toFixed(1));
      if (atMin.all.length > 1) rec.others = atMin.all.map((o) => ({ t: +o.t.toFixed(3), at: toWorld(...o.at).map((x) => +x.toFixed(1)) }));
      out.sections.push(rec);
      if (rEst < out.minR) { out.minR = rEst; out.minAt = at; }
    }
    cs.delete();
  }
  for (const m of cache.values()) m.delete();
  out.minR = out.minR >= rMin ? `>= ${rMin}` : +out.minR.toFixed(3);
  return out;
}

/* Equivalent diameter of the z = c section (2·√(A/π)). */
function sectionDiameter(solid, c) {
  const cs = solid.slice(c);
  const A = cs.area();
  cs.delete();
  return 2 * Math.sqrt(A / Math.PI);
}

/* Resolve all derived geometry (pure numbers, no engine). */
export function layout(p) {
  if (!(p.sutureHoles === 0 || p.sutureHoles === 3)) throw new Error(`modelB: sutureHoles must be 0 or 3 (got ${p.sutureHoles})`);
  if (!TUBE_FR_OPTIONS.includes(p.tubeFr)) throw new Error(`modelB: tubeFr must be one of ${TUBE_FR_OPTIONS} (got ${p.tubeFr})`);
  const R = p.headD / 2;
  const beta = (180 - p.nsDeg) * DEG;
  const a = headAxis(p.nsDeg);                                  // head axis (unit, XZ)
  const w = [Math.cos(beta), 0, -Math.sin(beta)];              // in the cut plane, medial-down
  const cut = R * (1 - 2 * p.headHD);                           // base plane offset from C along a
  const m = p.headOffset;
  const zC = p.totalLength - R;                                 // top of the sphere = totalLength
  const C = [m, 0, zC];
  const zO = zC + (cut + m * Math.sin(beta)) / Math.cos(beta);  // cut plane × stem axis
  const O = [0, 0, zO];
  const rho = p.rimFillet;
  const Rb = rho > 0 ? Math.sqrt((R - rho) ** 2 - (cut + rho) ** 2) : Math.sqrt(R * R - cut * cut);
  const B = add(C, scale(a, cut));                              // base centre
  const sB = dot(sub(B, O), w);
  const r1 = p.bodyAP / 2;
  const sLat = sB - Rb + p.footprintMargin;
  const fML = p.footprintML ?? Math.min(p.footprintMaxML, p.footprintRatio * p.headD);
  const sMed = Math.max(sLat + 2 * r1 + 2, Math.min(sLat + fML, sB + Rb - p.medialRimGap));
  if (sMed - sLat < 2 * r1 + 2) throw new Error(`modelB: footprint ${(sMed - sLat).toFixed(1)} mm too short for bodyAP ${p.bodyAP} (head too small?)`);
  const onPlane = (s) => add(O, scale(w, s));
  const Tl = onPlane(sLat + r1), Tm = onPlane(sMed - r1);
  const zA = zO - p.metaLen;

  // tube coupling + stem
  const tubeOD = p.tubeFr / 3;
  const rTube = tubeOD / 2;
  const rS = rTube + p.shoulderW;                               // proximal stem radius
  if (2 * rS < 8) throw new Error('modelB: stem Ø < 8 mm');
  if (rS > r1) throw new Error(`modelB: stem Ø ${(2 * rS).toFixed(1)} wider than bodyAP ${p.bodyAP}`);
  const zSh = p.couplingLen;                                    // shoulder (batente) plane
  if (zA < zSh + 10) throw new Error(`modelB: no room for the stem: metaphysis starts at z = ${zA.toFixed(1)}, shoulder at ${zSh} (raise totalLength or lower metaLen)`);
  const tri = [[0, zA], [Tl[0], Tl[2]], [Tm[0], Tm[2]]];         // XZ core triangle
  const zTop = Tm[2];                                           // radius reaches r1 here

  // shoulder fin: capsule in XZ, holes on its axis (vertical line)
  const holeR = p.holeD / 2;
  const rhoF = holeR + p.holeCement + 0.75;                     // capsule radius (≥ 5 mm cement laterally)
  // hole line (x < 0: lateral): at least shoulderX of lateral reach, and far
  // enough from the body core that the holes exit on the fin's flat faces
  const xH = Math.min(-p.shoulderX + rhoF, Tl[0] - p.holeBodyClear);
  const gap = p.finGap;                                         // fin top stays this far below the cut plane
  const zH1 = zO + (-gap - rhoF - xH * Math.sin(beta)) / Math.cos(beta);
  const holeZ = [zH1, zH1 - p.holeSpacing, zH1 - 2 * p.holeSpacing];
  const holeBridge = p.holeSpacing - p.holeD;                    // cement between neighbouring holes
  if (p.sutureHoles === 3 && holeBridge < 6 - 1e-9) throw new Error(`modelB: suture-hole bridge ${holeBridge.toFixed(2)} mm < 6 (holeSpacing ≥ holeD + 6)`);
  const finA = [xH, zH1], finB = [xH, holeZ[2]];
  // lower 'gusset' segment: from the last hole down and medially toward the stem,
  // so the fin's distal end meets the stem at an open angle (a square capsule end
  // against the stem left a concave radius < 2 mm on low heads / h/D 0.63)
  const finC = [finB[0] * (1 - p.finTaper), finB[1] - p.finTaperLen];

  // straight core wire on the stem axis, from the distal face into the head
  const rc = R - p.coreHeadCover - p.coreD / 2;
  if (!(rc > m)) throw new Error('modelB: head too small for the core cover');
  const zEnd = zC + Math.sqrt(rc * rc - m * m);
  return {
    R, beta, a, w, cut, C, O, zO, Rb, B, sB, r1, sLat, sMed, Tl, Tm, zA, tri, zTop,
    tubeOD, rTube, rS, zSh,
    holeR, rhoF, xH, holeZ, holeBridge, finA, finB, finC, gap, zEnd,
    tubeID: tubeOD - 2 * p.tubeWall,
  };
}

export function build(engine, p) {
  const L = layout(p);
  const { R, a, O, r1, rS, rTube, zSh, zA, tri, zTop } = L;
  const { Manifold } = engine || getEngine();

  const head = sphereSegment({ center: L.C, radius: R, axis: a, cut: L.cut, rimFillet: p.rimFillet });
  
  const hF = p.finAP / 2, rE = Math.min(p.finEdge, hF - 0.5);
  const ov = 1.0;                                                 // body pokes 1 mm into the head

  // levelSet stem radius: a hair under the exact coupling radius rS, so the
  // exact revolve (below) ends in a gentle 2–3° taper INTO the levelSet
  // cylinder instead of two coincident cylinders
  const dr = 0.03, rL = rS - dr;                                  // 0.3 left a visible 0.6 mm ring (review 26/Sep)
  const bodyR = (z) => rL + (r1 - rL) * Math.pow(clamp01((z - zA) / (zTop - zA)), p.calcarPow);
  const meta = (q) => Math.hypot(Math.max(sdPolygon2(q[0], q[2], tri), 0), q[1]) - bodyR(q[2]);
  // the stem cylinder ends 1 mm into the metaphysis apex ball (same radius rS):
  // plain min, no blend (a blend of coincident surfaces would bulge)
  const zCplTop = zSh + p.stemEdge + 3 + 6 + 2;                   // top of the exact coupling revolve
  const zLs0 = zSh + p.stemEdge + 1;                              // levelSet stem starts inside the revolve
  const stem = (q) => sdCylZ(q, rL, zLs0, zA + 1, 0.5);
  // fin: XZ capsule extruded along Y with drafted side walls (radius shrinks
  // with |y|) — a wall exactly parallel to Y makes grazing demold rays run
  // along levelSet facets
  const tD = Math.tan(p.finDraftDeg * DEG);
  const fin = (q) => sdExtrudeY(Math.min(sdSegment2(q[0], q[2], L.finA, L.finB), sdSegment2(q[0], q[2], L.finB, L.finC)) - L.rhoF + rE + tD * Math.abs(q[1]), q[1], hF - rE) - rE;

  // EXACT tube coupling (solid of revolution about the stem axis): spigot Ø OD,
  // concave arc, flat annular shoulder at z = zSh, convex arc, stem Ø 2·rS,
  // then a cosine taper to rL − 0.05 that dives into the levelSet stem.
  const f0 = p.shoulderFillet, e0 = p.stemEdge;
  if (rTube + f0 + 0.3 > rS - e0) throw new Error('modelB: shoulderW too small for shoulderFillet + stemEdge (no flat annulus)');
  const prof = [[0, 0], [rTube, 0], [rTube, zSh - f0]];
  prof.push(...arcPoints(rTube + f0, zSh - f0, f0, -Math.PI / 2, 0, 0.005).slice(1));
  prof.push([rS - e0, zSh]);
  prof.push(...arcPoints(rS - e0, zSh + e0, e0, Math.PI, Math.PI / 2, 0.005).slice(1));
  const zT1 = zSh + e0 + 3, zT2 = zT1 + 6;
  prof.push([rS, zT1]);
  for (let i = 1; i <= 24; i++) {
    const t = i / 24;
    prof.push([rS - (dr + 0.05) * (1 - Math.cos(Math.PI * t)) / 2, zT1 + 6 * t]);
  }
  prof.push([rL - 0.05, zCplTop], [0, zCplTop]);
  const coupling = revolveProfile(prof, { center: [0, 0, 0], axis: [0, 0, 1], tol: 0.005, label: 'modelB coupling' });
  const plane = (q) => (q[0] - O[0]) * a[0] + (q[2] - O[2]) * a[2] - ov;   // > 0 above the clip
  const bodyNoHead = (q) => Math.max(smin(Math.min(stem(q), meta(q)), fin(q), p.kFin), plane(q));
  // head-junction blend: full kHead where the base disc has room (medial calcar),
  // shrinking toward the lateral rim so the fillet never runs past the proxy rim
  const hi = head.info, rimR = hi.baseRadius - p.proxyRimMargin;
  // The proxy's base is raised by inset(k) = ½·θ²·k so the fillet crosses the
  // real flat base at ≈ θ whatever k is: a near-tangent fillet tail lies almost
  // parallel to the base plane — which contains Y — and a Y-ray skimming just
  // under the base then runs along levelSet facets and reads slivers.
  const th2 = (p.headFilletAngleDeg * DEG) ** 2;
  const Rp = R - 0.1, rCyl = rimR;
  const sdf = (q) => {
    const dx = q[0] - hi.center[0], dy = q[1] - hi.center[1], dz = q[2] - hi.center[2];
    const hh = dx * a[0] + dz * a[2];                            // axis has no y component
    const d2 = dx * dx + dy * dy + dz * dz;
    const rr = Math.sqrt(Math.max(0, d2 - hh * hh));
    const k = Math.max(p.kHeadMin, Math.min(p.kHead, rimR - rr - 0.5));   // non-increasing in |y|
    const kx = Math.max(p.kHeadMin, Math.min(p.kHead, rimR - Math.sqrt(Math.max(0, d2 - dy * dy - hh * hh)) - 0.5));
    const inset = 0.5 * th2 * kx;                                // y-independent → keeps Y-monotony
    const px = Math.max(Math.sqrt(d2) - Rp, hi.cut + inset - hh, rr - rCyl);
    return smin(bodyNoHead(q), px, k);
  };

  const bounds = {
    min: [Math.min(L.xH - L.rhoF - 1, L.C[0] - R), -Math.max(R, r1 + 2), zLs0 - 0.5],
    max: [L.C[0] + R, Math.max(R, r1 + 2), L.C[2] + R],
  };
  // Mesh → clip → head → holes. The body is Y-convex by construction (every SDF
  // term is non-decreasing in |y|), but marching-grid faceting can leave a µm
  // dent at y = 0 exactly on the front silhouette, where a grazing Y-line of
  // the validator then reads two slivers (e.g. ±[0.26, 0.39] mm). Such a dent
  // moves with the grid phase, a real undercut does not: if the Y-demold scan
  // (or the crease scan) fails, re-mesh with the grid shifted by a fraction of an edge and edge ±7 % (max 8 tries)
  // and report the attempts in meta.meshing.
  const holes = [];
  if (p.sutureHoles === 3) for (const z of L.holeZ) holes.push({ x: L.xH, z, r: L.holeR });
  const cutter = holes.length ? unionAll(holes.map((h) => cylinderY({ ...h, length: 4 * R }))) : null;
  const shifts = [[0, 0, 1], [0.31, 0.17, 1], [0.13, 0.43, 0.96], [0.47, 0.29, 1.04], [0.23, 0.07, 0.93], [0.07, 0.31, 1.07], [0.39, 0.47, 0.98], [0.19, 0.23, 1.02]];
  const attempts = [];
  let solid = null;
  for (const [fx, fz, fe] of shifts) {
    const sb = {
      min: [bounds.min[0] - fx * p.edge, bounds.min[1], bounds.min[2] - fz * p.edge],
      max: bounds.max,
    };
    const raw = levelSetSolid(sdf, sb, p.edge * fe);
    let s = unionAll([raw, coupling, head]);
    if (cutter) { const s2 = s.subtract(cutter); s2.getMesh(); s = s2; }
    const vr = validate(s, {
      holes, expectedGenus: holes.length, minThickness: 0, thicknessSamples: 1,
    });
    const dm = vr.demold, cr = vr.creases;
    // a real undercut or unfilleted junction does not move with the grid; a
    // levelSet/boolean sliver (e.g. a 180° fold at the head junction, NSA 140) does
    attempts.push({ gridShift: [fx, fz], edge: +(p.edge * fe).toFixed(3), demoldFailures: dm.failures, samples: dm.samples, creaseMm: cr ? cr.lengthMm : null });
    if ((dm.failures === 0 && (!cr || cr.pass)) || attempts.length === shifts.length) { solid = s; break; }
    s.delete();
  }

  // ---- model-level checks on the final mesh -------------------------------
  const mesh = toMeshArrays(solid);
  const P = mesh.positions;
  const hb = head.info;
  // (1) nothing above the head base plane except the exact head
  let worstAbove = 0, worstAt = null;
  // (2) the spigot/shoulder: radius of every vertex in the coupling zone
  let spigotRmax = 0, shoulderZmin = Infinity, shoulderZmax = -Infinity;
  for (let i = 0; i < P.length; i += 3) {
    const q = [P[i], P[i + 1], P[i + 2]];
    const hgt = dot(sub(q, hb.baseCenter), a);
    if (hgt > 0.02) {
      const out = Math.hypot(q[0] - L.C[0], q[1] - L.C[1], q[2] - L.C[2]) - R;
      if (out > worstAbove) { worstAbove = out; worstAt = q; }
    }
    const rr = Math.hypot(q[0], q[1]);
    if (q[2] < zSh - f0 - 0.05) spigotRmax = Math.max(spigotRmax, rr);
    if (rr > rTube + f0 - 0.01 && rr < rS - e0 + 0.01 && Math.abs(q[2] - zSh) < 0.5) { shoulderZmin = Math.min(shoulderZmin, q[2]); shoulderZmax = Math.max(shoulderZmax, q[2]); }
  }
  if (worstAbove > 0.05) throw new Error(`modelB: body pokes above the cut plane outside the head by ${worstAbove.toFixed(2)} mm at ${r3(worstAt, 1)}`);

  // (1b) concave junction radius ≥ minConcaveR (the thickness and crease checks
  // of validate() cannot see a smooth but too-tight fillet)
  const zExcl = zSh + e0 + 1.5;                                   // tube-seat arcs are intentional
  const nearHole = (x, z) => holes.some((h) => Math.hypot(x - h.x, z - h.z) < h.r + 1.5);
  // three section families, each roughly perpendicular to the fillets it checks:
  //  - 'y'   : y = 0…5 (the XZ profile; lateral rim notch; y = 6 would lie ON the fin's flat face)
  //  - 'mer' : planes through the head axis every 10° (the head-base ↔ body junction all round)
  //  - 'z'   : z = const (fin ↔ body ↔ stem), outside the head-base shadow where z-planes are oblique
  const hbA = dot(sub(hb.baseCenter, L.C), a);                    // = cut
  const underHead = (q) => {
    const v = sub(q, L.C), h = dot(v, a), rr = Math.sqrt(Math.max(0, dot(v, v) - h * h));
    return h > hbA - 8 && rr < hb.baseRadius + p.rimFillet + 2;
  };
  const common = (q) => !(q[2] < zExcl || nearHole(q[0], q[2]));
  const planes = [];
  for (const y of [0, 1, 2, 3, 4, 5]) planes.push({ family: 'y', label: `y=${y}`, R: [1, 0, 0, 0, 0, -1, 0, 1, 0], c: y, keep: common });
  for (let deg = 0; deg <= 90; deg += 10) {
    const f = deg * DEG, d = add(scale(L.w, Math.cos(f)), [0, Math.sin(f), 0]);   // in-plane, ⟂ a
    const n = [d[1] * a[2] - d[2] * a[1], d[2] * a[0] - d[0] * a[2], d[0] * a[1] - d[1] * a[0]];   // d × a → det +1
    planes.push({
      family: 'mer', label: `head meridian ${deg}°`, R: [...d, ...a, ...n], c: dot(n, L.C),
      keep: (q) => common(q) && (() => { const h = dot(sub(q, L.C), a); return h < hbA + 0.5 && h > hbA - 15; })(),
    });
  }
  for (let z = zExcl; z <= L.zO - 1; z += 1.5) planes.push({ family: 'z', label: `z=${z.toFixed(1)}`, R: [1, 0, 0, 0, 1, 0, 0, 0, 1], c: z, keep: (q) => common(q) && !underHead(q) });
  const concave = concaveRadiusCheck(solid, { rMin: p.minConcaveR, eps: 0.03, planes });
  if (!concave.pass) throw new Error(`modelB: concave junction radius ${concave.minR} mm < ${p.minConcaveR} at ${concave.minAt}`);

  // (1c) cement bridges between suture holes, measured on the final holes
  let holeBridgeMin = null;
  for (let i = 1; i < holes.length; i++) {
    const b = Math.hypot(holes[i].x - holes[i - 1].x, holes[i].z - holes[i - 1].z) - holes[i].r - holes[i - 1].r;
    holeBridgeMin = holeBridgeMin == null ? b : Math.min(holeBridgeMin, b);
  }

  // (1d) measured molded-shaft diameter (equivalent Ø from the section area)
  const shaft = [];
  const zShaftTop = Math.min(zA, Math.min(L.finB[1], L.finC[1]) - L.rhoF - p.kFin) - 1;   // below the metaphysis and the fin
  for (let z = zSh + 1; z <= zShaftTop; z += 2) shaft.push([r3(z, 1), r3(sectionDiameter(solid, z), 3)]);
  const shaftDs = shaft.map((v) => v[1]);
  const shaftMin = Math.min(...shaftDs), shaftMax = Math.max(...shaftDs);
  if (shaftMax - shaftMin > 0.1) throw new Error(`modelB: molded shaft Ø varies ${shaftMin.toFixed(2)}–${shaftMax.toFixed(2)} mm (ring at the coupling?)`);

  // (3) core cover: distance from the wire axis to the surface minus the wire radius
  const BV = buildBVH(mesh.positions, mesh.indices);
  let minCover = Infinity, minCoverAt = null, minCoverProx = Infinity, n = 0;
  const kS = Math.ceil(L.zEnd / 0.5);
  for (let j = 0; j <= kS; j++) {
    const q = [0, 0, (L.zEnd * j) / kS];
    if (q[2] < zSh + 0.5) continue;                                // inside the spigot the cement surface is the TUBE LUMEN (see coverInTube)
    const cov = closestPoint(BV, q).dist - p.coreD / 2;
    n++;
    if (cov < minCover) { minCover = cov; minCoverAt = q; }
    if (q[2] > zSh + 3 && cov < minCoverProx) minCoverProx = cov;
  }

  // (4) measured section just below the cut plane (the body footprint incl. the fillet)
  const section = (depth) => {
    let sMin = Infinity, sMax = -Infinity, yMax = 0;
    for (let s = -40; s <= 45; s += 0.25) {
      for (let y = 0; y <= 30; y += 0.25) {
        const q = sub(add(add(O, scale(L.w, s)), [0, y, 0]), scale(a, depth));
        if (sdf(q) < 0) { sMin = Math.min(sMin, s); sMax = Math.max(sMax, s); yMax = Math.max(yMax, y); }
      }
    }
    return { depthBelowCut: depth, alongPlaneML: r3(sMax - sMin, 1), AP: r3(2 * yMax, 1) };
  };

  const bbAll = bbox(solid);
  const ext = [0, 1, 2].map((k) => bbAll.max[k] - bbAll.min[k]);
  const spigotVol = Math.PI * rTube * rTube * zSh;   // approx., mm³
  return {
    manifold: solid,
    meta: {
      head: hb.validateHead,
      holes,
      headCenter: r3(L.C),
      headD: p.headD,
      headHeight: r3(hb.height, 2),
      headHOverD: r3(hb.hOverD, 3),
      headBaseDiameter: r3(2 * hb.baseRadius, 2),
      NSA: p.nsDeg,
      headAxis: r3(a, 5),
      headOffsetMedial: p.headOffset,
      resection: {
        O: r3(O), normal: r3(a, 5), baseCenter: r3(hb.baseCenter),
        note: 'O = cut plane × stem axis; the head base (flat) lies on this plane',
      },
      tube: {
        what: 'chest tube filled with cement = the distal stem (Klosterman 2021, PMC7917196). This positive is the proximal part only.',
        fr: p.tubeFr, od: r3(L.tubeOD, 3), options: TUBE_FR_OPTIONS.map((f) => ({ fr: f, od: r3(f / 3, 2) })),
        axis: { point: [0, 0, 0], direction: [0, 0, -1], note: 'coaxial with the stem axis; the tube leaves the part at z = 0 going −Z' },
        spigot: { diameter: r3(L.tubeOD, 3), z: [0, zSh], measuredMaxRadius: r3(spigotRmax, 3), note: 'in the mold this cylinder is the bore that seats the tube end (tube fills it; cement fills the tube)' },
        shoulder: { z: zSh, innerD: r3(L.tubeOD, 2), outerD: r3(2 * rS, 2), flatAnnulus: [r3(rTube + f0, 2), r3(rS - e0, 2)], measuredFlatZ: [r3(shoulderZmin, 4), r3(shoulderZmax, 4)], note: 'flat annular batente; set the tube end at this plane. It is a widening of the cavity, so the stop is visual (open half-mold), not mechanical — see docs/modelB.md' },
        couplingLength: zSh,
        spigotVolumeCm3: r3(spigotVol / 1000, 2),
        lumen: {
          wallAssumedMm: p.tubeWall, innerD: r3(L.tubeID, 2),
          table: TUBE_FR_OPTIONS.map((f) => ({ fr: f, od: r3(f / 3, 2), idAssumed: r3(f / 3 - 2 * p.tubeWall, 2), coverOverCore: r3((f / 3 - 2 * p.tubeWall - p.coreD) / 2, 2) })),
          note: 'ASSUMED wall — measure the tube. Below the batente (z < couplingLen) and all along the tube the cement is a rod of Ø innerD, not the molded shaft: the steel core carries the load there.',
        },
        cementSectionStep: {
          z: zSh, fromD: r3(L.tubeID, 2), toD: r3(shaftMin, 2),
          belowLockedMin8: L.tubeID < 8,
          note: 'the cement rod inside the tube (Ø lumen) widens to the molded shaft at the tube end; the re-entrant corner there is shaped by the square-cut tube end (not by this positive). Bevel the tube end inside if wanted.',
        },
        bore: {
          what: 'the mold halves need a bore through their distal wall so the tube can enter the spigot; nothing in the mold makers creates it from this STL. Tool = cylinder on the stem axis, subtract it from both mold halves.',
          toolD: r3(L.tubeOD + p.boreClearance, 3), z: [-40, zSh],
          cli: 'node src/models/modelB.mjs bore-tool | bore-mold (see docs/modelB.md)',
        },
      },
      dims: {
        positiveLengthZ: r3(ext[2], 2),
        maxExtent: r3(Math.max(...ext), 2),
        extentXYZ: r3(ext, 2),
        stemDiameter: r3(shaftMin, 2),
        stemDiameterDesign: r3(2 * rS, 2),
        stemDiameterMeasured: { min: r3(shaftMin, 3), max: r3(shaftMax, 3), samples: shaft },
        stemFromTo: [zSh, r3(zA, 2)],
        metaphysisStartZ: r3(zA, 2),
        cutPlaneAtStemAxisZ: r3(L.zO, 2),
        footprintDesign: { alongPlaneML: r3(L.sMed - L.sLat, 1), AP: p.bodyAP },
        footprintMeasured: [section(2), section(10), section(20)],
        shoulderLateralX: r3(L.xH - L.rhoF, 2),
        finAP: p.finAP,
        bbox: { min: r3(bbAll.min, 2), max: r3(bbAll.max, 2) },
      },
      core: {
        what: 'continuous stainless-steel core wire through the cement-filled tube and this part (NOT subtracted: the solid is full). Mold system: add a wire hole along the axis if wanted.',
        diameter: p.coreD,
        entry: { point: [0, 0, 0], outward: [0, 0, -1], note: 'enters at the distal face centre, continues distally inside the tube' },
        polyline: [[0, 0, 0], r3([0, 0, L.zEnd])],
        direction: [0, 0, 1],
        lengthInPart: r3(L.zEnd, 2),
        headCover: p.coreHeadCover,
        minCementCover: { mm: r3(minCover, 2), at: r3(minCoverAt, 1), proximalToShoulderMm: r3(minCoverProx, 2), samples: n, note: 'measured from the batente upward (molded cement)' },
        coverInTube: { mm: r3((L.tubeID - p.coreD) / 2, 2), note: 'inside the tube the cement surface is the lumen: (innerD − coreD)/2 with the ASSUMED wall' },
      },
      checks: {
        maxAboveCutOutsideHead: r3(worstAbove, 4),
        holeBridgeMinMm: holeBridgeMin == null ? null : r3(holeBridgeMin, 3),
        concaveRadius: concave,
      },
      meshing: { edge: p.edge, attempts: attempts.length, log: attempts },
      layout: {
        sLat: r3(L.sLat, 2), sMed: r3(L.sMed, 2), sBase: r3(L.sB, 2), baseRadius: r3(L.Rb, 2),
        holeLineX: r3(L.xH, 2), holeZ: L.holeZ.map((z) => r3(z, 2)), finRadiusXZ: r3(L.rhoF, 2),
      },
    },
  };
}

/* ---- tube bore for the mold halves -------------------------------------------
   Neither mold maker opens a way for the chest tube from this STL: moldapp
   closes the spigot inside its 6 mm floor (bbox + margin block), and lib
   buildMold clamps tubeFr to 24–34 and puts its injection port from its own
   head centre. The positive side therefore ships the TOOL and a post-process:

     node src/models/modelB.mjs bore-tool [--fr 24,28,32,36] [--set couplingLen=15,boreClearance=0.3]
         → stl/B_tube_bore_<Fr>Fr.stl : cylinder Ø(OD + clearance) on the stem
           axis, z ∈ [−40, couplingLen], in the POSITIVE's frame. Subtract it
           from both mold halves (e.g. Bambu Studio: add part → negative part),
           only if the halves are still in the positive's frame.
     node src/models/modelB.mjs bore-mold --positive stl/B_h48.json --halves A.stl,B.stl [--out dir]
         → <half>_bore.stl for each half. The halves' frame is found from the
           block (bbox of positive + uniform margin, so the block centre = the
           positive's bbox centre; moldapp re-centres the model, lib does not)
           and CHECKED: the shifted positive must not overlap the halves, the
           bore must be blocked before and open after. */
export function boreTool(p, engine) {
  const q = { ...DEFAULTS, ...p };
  const od = q.tubeFr / 3;
  return cylinderBetween([0, 0, -40], [0, 0, q.couplingLen], (od + q.boreClearance) / 2, undefined, { tol: 0.01 });
}

async function cli(argv) {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { initEngine, fromMeshArrays, bake: bk } = await import('../common.mjs');
  const { writeSTL, readSTL } = await import('../stl.mjs');
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  await initEngine();
  const args = { cmd: argv[0], set: {} };
  for (let i = 1; i < argv.length; i += 2) {
    const k = argv[i], v = argv[i + 1];
    if (k === '--set') for (const kv of v.split(',')) { const [a, b] = kv.split('='); args.set[a] = Number(b); }
    else args[k.replace(/^--/, '')] = v;
  }
  const vol = (m) => m.getProperties().volume;
  if (args.cmd === 'bore-tool') {
    const frs = (args.fr || TUBE_FR_OPTIONS.join(',')).split(',').map(Number);
    for (const fr of frs) {
      const p = { ...DEFAULTS, ...args.set, tubeFr: fr };
      const t = boreTool(p);
      const f = path.join(ROOT, 'stl', `B_tube_bore_${fr}Fr.stl`);
      writeSTL(f, t, `B tube bore ${fr}Fr D${(fr / 3 + p.boreClearance).toFixed(2)} z-40..${p.couplingLen} (mm)`);
      const b = t.boundingBox();
      console.log(`${path.relative(ROOT, f)}: Ø ${(b.max[0] - b.min[0]).toFixed(3)} mm, z ${b.min[2].toFixed(2)} … ${b.max[2].toFixed(2)}`);
      t.delete();
    }
    return;
  }
  if (args.cmd === 'bore-mold') {
    const J = JSON.parse(fs.readFileSync(path.resolve(args.positive), 'utf8'));
    const p = { ...DEFAULTS, ...J.params, ...args.set };
    const posStl = path.resolve(path.dirname(path.resolve(args.positive)), '..', J.files.stl);
    const positive = fromMeshArrays(...Object.values(readSTL(posStl)), 'positive');
    const halves = args.halves.split(',').map((f) => ({ f: path.resolve(f), m: fromMeshArrays(...Object.values(readSTL(path.resolve(f))), f) }));
    const bb = (list) => {
      const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
      for (const m of list) { const b = m.boundingBox(); for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], b.min[k]); mx[k] = Math.max(mx[k], b.max[k]); } }
      return { c: [0, 1, 2].map((k) => (mn[k] + mx[k]) / 2), mn, mx };
    };
    const bm = bb(halves.map((h) => h.m)), bp = bb([positive]);
    // block = positive bbox + uniform margin (pins stay inside it) → same centre
    const shift = [0, 1, 2].map((k) => bm.c[k] - bp.c[k]);
    const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const posShifted = bk(positive, I3, shift);
    const vPos = vol(posShifted);
    const tool0 = boreTool(p);
    const tool = bk(tool0, I3, shift);
    const probe0 = cylinderBetween([0, 0, bm.mn[2] - shift[2] - 1], [0, 0, 0], Math.max(0.5, p.tubeFr / 6 - 0.5), undefined, { tol: 0.02 });
    const probe = bk(probe0, I3, shift);
    const outDir = path.resolve(args.out || path.dirname(halves[0].f));
    fs.mkdirSync(outDir, { recursive: true });
    const report = { shift: shift.map((v) => +v.toFixed(3)), toolD: +(p.tubeFr / 3 + p.boreClearance).toFixed(3), halves: [] };
    for (const h of halves) {
      const overlap = vol(h.m.intersect(posShifted));
      if (overlap > 0.005 * vPos) throw new Error(`${h.f}: positive overlaps the half by ${(overlap / 1000).toFixed(2)} cm³ — frame not recognised (shift ${report.shift})`);
      const before = vol(h.m.intersect(probe));
      const cut = h.m.subtract(tool);
      const after = vol(cut.intersect(probe));
      const removed = vol(h.m) - vol(cut);
      const f = path.join(outDir, path.basename(h.f).replace(/\.stl$/i, '') + '_bore.stl');
      writeSTL(f, cut, `mold half + tube bore ${p.tubeFr}Fr`);
      report.halves.push({ file: f, overlapWithPositiveMm3: +overlap.toFixed(3), floorInBoreBeforeMm3: +before.toFixed(1), floorInBoreAfterMm3: +after.toFixed(3), removedMm3: +removed.toFixed(1), genus: cut.genus() });
      if (after > 0.01) throw new Error(`${h.f}: bore still blocked after the cut (${after.toFixed(3)} mm³)`);
      cut.delete();
    }
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  console.log('usage: node src/models/modelB.mjs bore-tool [--fr 24,28,32,36] [--set k=v,...]\n       node src/models/modelB.mjs bore-mold --positive stl/B_h48.json --halves A.stl,B.stl [--out dir] [--set k=v,...]');
}

{
  const { fileURLToPath } = await import('node:url');
  if (process.argv[1] && fileURLToPath(import.meta.url) === (await import('node:path')).resolve(process.argv[1])) {
    cli(process.argv.slice(2)).catch((e) => { console.error(e.stack || e); process.exit(1); });
  }
}
