/* MODEL A — "Colher" (spoon archetype), PROXIMAL PART + CHEST-TUBE COUPLING.

   Archetype (reference photos 84989-6268795.jpg and images (1).jpeg, NOT a
   copy of any product): a polished dome head (sphere segment with a flat base
   on the resection plane, rim rounded) whose lateral rim is nearly flush with
   the stem's lateral line while the dome overhangs medially; a short, stout
   triangular NECK WEB rises from the stem's medial side to the underside of
   the dome; a straight round stem with one shallow longitudinal groove on each
   ±Y face (rotational grip).

   SURGEON DECISION 26/Sep/2026: the distal stem is a CHEST TUBE filled with
   cement (Klosterman 2021, PMC7917196). The printer is a Bambu Lab A1 mini
   (180 mm cube), so this positive is only the proximal part: head + web +
   a short stem segment that ends distally in a TUBE COUPLING:
     z ∈ [0, Lc]  TUBE SEAT: cylinder Ø = tube OD (Fr / 3). In the mold it
                  becomes a bore that holds the tube coaxial with the stem;
                  the tube occupies it (it is NOT cement of this positive).
     z = Lc       STOP (batente): a 50° conical seat that narrows the cavity by
                  `stopOverlap` per side, so mold material sits over the outer
                  ring of the tube wall and the tube end stops there, centred.
                  The waist is a concave arc (radius ≥ 2 mm, no notch), then
                  the stem flares back out to its own diameter.
   Cement in the tube lumen meets the cement of this part through the waist
   (Ø = OD − 2·stopOverlap), so the joint is monolithic. A continuous core wire
   (default Ø 3.2 mm) runs on the stem axis through tube and part; the solid
   stays FULL (the wire is reported in meta, never subtracted).

   Frame (shared contract, see src/common.mjs): mm; stem axis +Z; distal face
   of the part at z = 0; head axis tilted toward +X (medial) by beta = 180° − NSA;
   Y = AP; the solid is mirror-symmetric about y = 0 (parting plane) and
   demolds along ±Y.

   Construction (the foundation's recommended pattern):
     1. body SDF = smooth union (smin, blend `fillet`) of
          - the stem: exact solid of revolution about Z from a 2D (r, z)
            profile (tube seat, stop cone, waist arc, flare, convex arc, stem
            cylinder), clipped 1 mm below the head base plane,
          - the web (triangular core polygon in XZ dilated by webT/2: a
            Y-slab with a fully round free edge),
          - a FULL head proxy (the exact filleted sphere segment shrunk inside
            itself) so the stem→rim junction is filleted too,
          - a FEED PAD under the frozen mold app's sprue when needed,
        minus the two ±Y grooves (smooth subtraction, rounded lips);
        meshed by levelSetSolid (Y-symmetric grid).
     2. union with the EXACT polished head (sphereSegment, facet dev ≤ 0.01 mm),
        then inverted needles on the planar head base are flipped away.
   The mold app is frozen: the tube hole and a dome vent are MANUAL steps,
   with coordinates in meta.moldPrep.
   Every primitive is Y-convex and symmetric about y = 0 and the groove cutters
   sit on the ±Y faces, so every Y-line meets the solid in one interval that
   contains y = 0.
*/

import {
  DEG, headAxis, add, sub, scale, dot,
  sphereSegment, unionAll, levelSetSolid, arcPoints, bbox, revolveProfile,
  sdCapsule, sdPolygon2, sdExtrudeY, smin, ssub, toMeshArrays, fromMeshArrays,
} from '../common.mjs';

export const NAME = 'A-colher';
export const DESCRIPTION = 'Model A "Colher": dome head on a filleted triangular neck web, short grooved stem ending in a chest-tube coupling (tube seat + 45° stop)';

export const DEFAULTS = {
  headD: 48,          // mm head sphere diameter
  headHD: 0.43,       // head height / diameter (sphere cap, h = R − cut)
  rimFillet: 3,       // mm torus blend at the head rim (h/D < 0.5 → needed)
  nsDeg: 135,         // neck-shaft angle; head axis tilt beta = 180 − NSA
  proxLength: 90,     // mm, length of THIS positive: distal face (z = 0) → top of the dome
  totalLength: 110,   // mm, whole construct (dome top → distal end of the tube): only sets the tube cut length
  stemD: 11,          // mm molded stem diameter (raised to the tube OD if the tube is wider)
  tubeFr: 28,         // chest tube French size (OD = Fr/3 mm); offered 24 / 28 / 32 / 36
  couplingLen: 15,    // mm tube seat length (tube inserted this deep into the mold)
  stopOverlap: 0.65,  // mm per side the stop covers the tube wall (waist Ø = OD − 2·this; 0.65 keeps the 28 Fr waist ≥ 8 mm)
  seatDeg: 50,        // stop cone angle above the horizontal (conical seat centres the tube; 50° keeps the waist fillet ≥ 2 mm at overlap 0.65)
  waistMinD: 8,       // mm locked rule "stem Ø ≥ 8": the coupling waist is part of the stem → build refuses a thinner waist
  waistExempt: 0,     // 1 = surgeon exempted the waist from the 8 mm rule (needed for 24 Fr: waist ≤ 6.8 mm) — NOT decided yet
  stopRound: 0.6,     // mm convex round on the seat's top edge (clean mesh; the tube stops where it starts)
  flareDeg: 20,       // waist → stem flare, angle from the stem axis
  flareRound: 4,      // mm convex arc between the flare and the stem cylinder
  entryRound: 0,      // mm round on the distal edge of the tube seat (0: the exact revolve needs none, and a round leaves a lip in the mold that narrows the tube entry below OD)
  coreWireD: 3.2,     // mm core wire through tube + part (reported, NOT subtracted)
  coreWireCover: 8,   // mm of cement left above the wire's proximal end (inside the head)
  latOverhang: 2.5,   // mm the head rim stands lateral to the stem's lateral line
  stemClip: -1,       // mm the stem's top is clipped at this height above the head base plane
  webT: 10,           // mm web thickness along Y (spacer-grade ≥ 10)
  webReach: 0.66,     // where the web meets the base: fraction of the rim diameter from the lateral rim
  webDrop: 0.26,      // web root on the stem's medial surface, below the contact point (× headD, along Z)
  webSag: 0.10,       // concavity of the web's free edge (sagitta / chord); 0 = straight
  grooveDepth: 1.2,   // mm (≤ 1.5; auto-reduced so the stem keeps ≥ 8 mm across the grooves; < 0.5 → no groove)
  grooveWidth: 3,     // mm at the surface
  grooveFlareGap: 4,  // mm from the top of the flare to the groove's distal end
  grooveWebGap: 3,    // mm clearance between the groove's proximal end and the web's fillet
  fillet: 6,          // mm smin blend width at every junction (5 left a 2 mm, 40° crease where the web meets the head base at NSA 125 with heads 40–44)
  grooveBlend: 0.8,   // mm smin blend at the groove lips
  edge: 0.6,          // mm levelSet edge length
  printerMm: 180,     // printer build cube edge (Bambu Lab A1 mini)
  moldWall: 10,       // mm minimum mold wall around the cavity (checked against printerMm)
  /* FROZEN mold app (spacer/moldapp, not updated any more): it centres the STL
     on its bbox, makes block = bbox + margin, drills ONE sprue Ø sprueD along Y
     through both halves at the bbox centre (x, z), and ONE Ø3 vent along X at
     the parting plane at the same z. It opens nothing else. The positive adapts: */
  moldMargin: 6,      // mm the mold app's "margem (parede)" slider (default 6): only used for the manual-step coordinates in meta.moldPrep
  sprueD: 10,         // mm the mold app's sprue Ø (slider 6–14, default 10)
  sprueGateT: 8,      // mm minimum Y thickness of the part under the whole sprue disc (a FEED PAD is added when the body is thinner there)
  sprueCover: 2.5,    // mm the pad's outline extends beyond the sprue channel
  padFillet: 5,       // mm smin blend between the feed pad and the rest
  padBridgeFillet: 8, // mm blend of the bridged pad (5 left 40–50° creases where it meets the medial rim at NSA 125)
  padBridgeGap: 4.5,  // mm bridge the pad up to the web contact when it comes closer than this to the head (a separate lobe there leaves a tunnel; bridging always failed the crease check on 44–48)
  domeVentD: 2,       // mm manual vent drilled at the dome top (the app's vent is at mid height)
};

export const RANGES = {
  headD: [40, 58],
  headHD: [0.37, 0.50],
  rimFillet: [2, 5],
  nsDeg: [125, 140],
  proxLength: [75, 140],
  totalLength: [100, 200],
  stemD: [8, 14],
  tubeFr: [24, 36],
  couplingLen: [10, 25],
  stopOverlap: [0.6, 1.5],
  seatDeg: [40, 55],
  waistMinD: [8, 8],
  waistExempt: [0, 1],
  stopRound: [0, 1],
  flareDeg: [12, 35],
  flareRound: [2, 8],
  entryRound: [0, 2],
  coreWireD: [2, 4],
  coreWireCover: [5, 15],
  latOverhang: [0.5, 4],
  stemClip: [-2, 1],
  webT: [10, 16],
  webReach: [0.55, 0.75],
  webDrop: [0.18, 0.40],
  webSag: [0, 0.2],
  grooveDepth: [0, 1.5],
  grooveWidth: [2, 4],
  grooveFlareGap: [1, 15],
  grooveWebGap: [1, 10],
  fillet: [3, 8],
  grooveBlend: [0, 1.5],
  edge: [0.4, 1.0],
  printerMm: [150, 400],
  moldWall: [6, 20],
  moldMargin: [3, 15],
  sprueD: [6, 14],
  sprueGateT: [6, 10],
  sprueCover: [1, 5],
  padFillet: [3, 14],
  padBridgeGap: [0, 99],
  padBridgeFillet: [5, 10],
  domeVentD: [1.5, 3],
};

/* Exact signed distance (negative inside) of a sphere segment with a rounded
   rim, built as (convex K) ⊕ rho with K = ball(C, Rk) ∩ {h ≥ hk}:
   dome radius Rk + rho, base plane at hk − rho, rim torus of radius rho
   centred on the corner circle (ak, hk). Same geometry as
   sphereSegment({rimFillet: rho}) when Rk = R − rho, hk = cut + rho. */
function roundedSegmentSDF(C, axis, Rk, hk, rho) {
  if (!(Rk > Math.abs(hk))) throw new Error('roundedSegmentSDF: plane misses the ball');
  const ak = Math.sqrt(Rk * Rk - hk * hk);
  const phiK = Math.atan2(ak, hk);
  return (p) => {
    const dx = p[0] - C[0], dy = p[1] - C[1], dz = p[2] - C[2];
    const h = dx * axis[0] + dy * axis[1] + dz * axis[2];
    const r = Math.sqrt(Math.max(0, dx * dx + dy * dy + dz * dz - h * h));
    const q = Math.hypot(r, h);
    let dK;
    if (q <= Rk && h >= hk) {
      dK = -Math.min(Rk - q, h - hk);                      // interior (lower bound, Lipschitz 1)
    } else {
      const dCorner = Math.hypot(r - ak, h - hk);
      const dArc = Math.atan2(r, h) <= phiK ? Math.abs(q - Rk) : dCorner;
      const dSeg = r <= ak ? Math.abs(h - hk) : dCorner;
      dK = Math.min(dArc, dSeg);
    }
    return dK - rho;
  };
}

/* Concave free edge: arc through a and b bulging toward `inward` by sag·|ab|. */
function sagArc(a, b, sag, inward, n = 12) {
  const pts = [];
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const off = 4 * sag * L * t * (1 - t);                  // parabola ≈ shallow arc
    pts.push([a[0] + (b[0] - a[0]) * t + inward[0] * off, a[1] + (b[1] - a[1]) * t + inward[1] * off]);
  }
  return pts;
}

/* Stem profile in the (r, z) half-plane, bottom → top (r ≥ 0):
   tube seat (r = rt, z 0 → Lc), 45° stop cone blended into a concave waist
   arc (radius rho1, minimum r = rt − overlap), a straight flare at flareDeg
   from the axis, a convex arc (flareRound) into the stem cylinder (r = rs),
   up to zTop. Returns the points and the key heights. */
function stemProfile({ rt, rs, Lc, overlap, seatDeg, flareDeg, flareRound, zTop, entryRound, rc }) {
  const phi = seatDeg * DEG, tf = flareDeg * DEG;
  // convex round (radius rc) on the seat's top edge: seat cylinder → stop cone
  const arcS = rc > 0 ? arcPoints(rt - rc, Lc, rc, 0.5 * Math.PI, phi, 0.005) : [[rt, Lc]];
  const E = arcS[arcS.length - 1];
  // overlap = (rc + rho1)·(1 − sin φ): the concave waist arc starts where the round ends
  const rho1 = overlap / (1 - Math.sin(phi)) - rc;
  if (rho1 < 2 - 1e-9) throw new Error(`modelA: waist fillet ${rho1.toFixed(2)} mm < 2 mm (raise stopOverlap or seatDeg, or lower stopRound)`);
  // concave arc: centre up-and-out of E; polar angle t from +z toward +r
  const c1 = [E[0] + rho1 * Math.sin(phi), E[1] + rho1 * Math.cos(phi)];
  const arc1 = arcPoints(c1[0], c1[1], rho1, Math.PI + phi, 1.5 * Math.PI + tf, 0.005);
  const A = arc1[arc1.length - 1];
  // convex arc into the stem cylinder
  const rho2 = flareRound;
  const Tr = rs - rho2 + rho2 * Math.cos(tf);
  const s = (Tr - A[0]) / Math.sin(tf);
  if (!(s >= 0)) throw new Error('modelA: stem too thin for the flare (raise stemD)');
  const T = [A[0] + s * Math.sin(tf), A[1] + s * Math.cos(tf)];
  const c2 = [T[0] - rho2 * Math.cos(tf), T[1] + rho2 * Math.sin(tf)];
  const arc2 = arcPoints(c2[0], c2[1], rho2, 0.5 * Math.PI + tf, 0.5 * Math.PI, 0.005);
  if (!(zTop > c2[1] + 1)) throw new Error('modelA: stem top below the flare');
  // distal edge: small convex round (a sharp levelSet edge folds into fake creases);
  // the mold's through-hole Ø OD + 0.3 removes the resulting lip at the bore entry
  const rb = entryRound;
  const arc0 = rb > 0 ? arcPoints(rt - rb, rb, rb, Math.PI, 0.5 * Math.PI, 0.005) : [[rt, 0]];
  const pts = [[0, 0], ...arc0, ...arcS, ...arc1.slice(1), ...arc2, [rs, zTop], [0, zTop]];
  return {
    pts, rho1,
    waistR: c1[0] - rho1, waistZ: c1[1],
    flareTopZ: c2[1],
  };
}

export function build(engine, p) {
  const r3 = (v) => +v.toFixed(3);
  const R = p.headD / 2;
  const beta = (180 - p.nsDeg) * DEG;
  const sb = Math.sin(beta), cb = Math.cos(beta);
  const a = headAxis(p.nsDeg);                  // head axis, +Z tilted toward +X
  const u = [-cb, 0, sb];                       // in the base plane, lateral + proximal
  const tubeOD = p.tubeFr / 3;
  const rt = tubeOD / 2;                        // tube seat radius
  const rs = Math.max(p.stemD / 2, rt);         // molded stem radius (never thinner than the tube)
  if (2 * rs < 8) throw new Error('modelA: stem Ø < 8 mm');
  const Lc = p.couplingLen;
  const rho = p.rimFillet;
  const cut = R * (1 - 2 * p.headHD);           // h = R − cut
  const hc = cut + rho;
  const ac = Math.sqrt((R - rho) ** 2 - hc ** 2); // flat base disc radius (torus centre radius)
  const rimRadius = Math.sqrt(R * R - cut * cut); // unfilleted rim radius

  /* Head placement.
     z: the dome top (sphere point straight up, inside the cap since beta < cap angle)
        is at z = proxLength → C_z = proxLength − R.
     x: the rim torus's lateral extreme (x = T_L.x − rho, T_L = B + rho·a + ac·u)
        sits latOverhang lateral to the stem's lateral line x = −rs. */
  const Bx = ac * cb - rho * sb + rho - rs - p.latOverhang;
  const Cx = Bx - cut * sb;
  const Cz = p.proxLength - R;
  const C = [Cx, 0, Cz];
  const B = add(C, scale(a, cut));              // base-disc centre
  const capDeg = Math.acos(cut / R) / DEG;
  if (!(beta / DEG < capDeg - 5)) throw new Error('modelA: dome top not on the cap (NSA / h/D combination)');

  const head = sphereSegment({ center: C, radius: R, axis: a, cut, rimFillet: rho });
  const info = head.info;
  if (Math.abs(info.baseRadius - ac) > 1e-6) throw new Error('modelA: base radius mismatch');

  /* full head proxy (exact segment shrunk inside itself: sphere −0.4, base +0.6).
     Larger than the foundation's 0.1 / 0.03: near-coincident levelSet and exact
     faces folded in the union (180° creases, grazing Y-lines) at range corners.
     The fillet now meets the base plane at ≈ sqrt(2·0.6/fillet) ≈ 28° (< 35°)
     and the dome/rim at ≈ 23°. */
  const inset = 0.4, baseInset = 0.6;
  const headSDF = roundedSegmentSDF(C, a, R - rho - inset, hc + baseInset, rho);

  const hBase = (q) => dot(sub(q, B), a);                      // signed height above the base plane
  const zOnBase = (x) => B[2] - (x - B[0]) * Math.tan(beta);   // base plane ∩ y=0 at a given x

  /* Stem: exact solid of revolution about Z (profile polygon mirrored to r < 0
     so the axis is not a boundary), clipped `stemClip` above the base plane. */
  const zCrossAxis = zOnBase(0);
  const zStemTop = zCrossAxis + rs * Math.tan(beta) + 4;
  const prof = stemProfile({
    rt, rs, Lc, overlap: p.stopOverlap, seatDeg: p.seatDeg, flareDeg: p.flareDeg,
    flareRound: p.flareRound, zTop: zStemTop, entryRound: p.entryRound, rc: p.stopRound,
  });
  const waistD = 2 * prof.waistR;
  if (waistD < p.waistMinD - 1e-6 && !p.waistExempt) {
    throw new Error(`modelA: coupling waist Ø ${waistD.toFixed(2)} mm < ${p.waistMinD} mm (locked rule "stem Ø ≥ 8"): lower stopOverlap to ≤ ${((tubeOD - p.waistMinD) / 2).toFixed(2)} mm, use a wider tube, or set waistExempt=1 only after the surgeon exempts the waist`);
  }
  const right = prof.pts.slice(1, -1);                         // without the two axis points
  const poly2 = [[0, 0], ...right, [0, zStemTop], ...right.slice().reverse().map(([r, z]) => [-r, z])];
  const stemSDF = (q) => Math.max(sdPolygon2(Math.hypot(q[0], q[1]), q[2], poly2), hBase(q) - p.stemClip);
  {
    const lat = [-rs, 0, zOnBase(-rs)];
    const dIn = Math.hypot(...sub(lat, B));
    if (dIn > ac - 0.2) throw new Error(`modelA: stem leaves the base disc laterally (${dIn.toFixed(2)} vs ${ac.toFixed(2)}) — raise latOverhang`);
  }

  /* Web: a CORE polygon in the y = 0 plane dilated by a ball of radius
     webT/2 → a Y-slab of thickness webT whose free edge is fully round.
     Outline: contact point Q on the base plane at webReach of the rim
     diameter from the lateral rim; root on the stem's medial surface webDrop·D
     below Q; free edge root → Q (optionally concave by webSag). The core's
     other two corners sit on the stem axis (hidden in the stem) and `lift`
     above the base plane (hidden in the head). */
  let sQ = (p.webReach - 0.5) * 2 * rimRadius;             // from B toward medial (−u)
  // low NSA + small head: move the contact medially (≥ 3 mm medial to the stem
  // surface) but keep it ≥ 3.5 mm inside the flat base (the web's round edge must
  // not reach the rim torus)
  const sQmin = Math.min((rs + 3 - B[0]) / cb, ac - 3.5);
  sQ = Math.max(sQ, sQmin);
  const webReachUsed = 0.5 + sQ / (2 * rimRadius);
  const Q = sub(B, scale(u, sQ));
  const hw = p.webT / 2;
  if (sQ + 1 > ac) throw new Error('modelA: web reaches past the flat base');
  const zRoot = Q[2] - p.webDrop * p.headD;
  const root = [rs, 0, zRoot];
  const dxe = Q[0] - root[0], dze = Q[2] - root[2];
  if (!(dxe > 2)) throw new Error('modelA: web contact point is not medial to the stem');
  const eL = Math.hypot(dxe, dze);
  const ed = [dxe / eL, dze / eL];                         // free-edge direction (x, z), root → Q
  const nin = [-ed[1], ed[0]];                             // inward normal (lateral / proximal)
  const P0 = [root[0] + nin[0] * hw, root[2] + nin[1] * hw];
  const tV1 = -P0[0] / ed[0];
  const V1 = [0, 0, P0[1] + ed[1] * tV1];                  // core free edge ∩ stem axis
  const lift = 1.0;
  const hAt = (x, z) => (x - B[0]) * a[0] + (z - B[2]) * a[2];
  const h0 = hAt(P0[0], P0[1]), hd = ed[0] * a[0] + ed[1] * a[2];
  if (!(hd > 0.05)) throw new Error('modelA: web free edge nearly parallel to the base plane');
  const tV2 = (lift - h0) / hd;
  const V2 = [P0[0] + ed[0] * tV2, 0, P0[1] + ed[1] * tV2];
  const V3 = [0, 0, zOnBase(0) + lift / cb];
  const poly = [[V1[0], V1[2]]];
  if (p.webSag > 0) {
    for (const pt of sagArc([V1[0], V1[2]], [V2[0], V2[2]], p.webSag, nin)) poly.push(pt);
  }
  poly.push([V2[0], V2[2]], [V3[0], V3[2]]);
  const webSDF = (q) => sdExtrudeY(sdPolygon2(q[0], q[2], poly), q[1], 0) - hw;

  const k = p.fillet;
  const webLowZ = V1[2] - hw;                              // lowest point of the web slab (on the axis side)
  if (!(zRoot - k > prof.flareTopZ + 3)) {
    throw new Error(`modelA: no straight stem between flare (z ${prof.flareTopZ.toFixed(1)}) and web root (z ${zRoot.toFixed(1)}) — raise proxLength`);
  }

  const kg = p.grooveBlend;
  const zBlendMin = prof.flareTopZ;                        // below this only the stem exists
  const bodySDF = (q) => smin(smin(stemSDF(q), webSDF(q), k), headSDF(q), k);

  /* FEED PAD under the frozen mold app's sprue. The app centres the STL on its
     bounding box and drills the sprue (Ø sprueD, along Y, through both halves)
     at the bbox centre (x, z); nothing else lets cement in. That point is
     ~9–12 mm medial to the stem axis at mid length, where the old part had only
     a sliver (h48) or nothing (h52) under the sprue. The bbox is known before
     meshing: head (exact) for x and the top, z = 0 for the distal face (the
     pad itself stays inside it; checked after the union). If the body is not
     at least sprueGateT thick (Y) under the whole sprue disc, add a FEED PAD
     (below). */
  const headBB = bbox(head);
  const bbPred = {
    min: [Math.min(headBB.min[0], -rs), 0],
    max: [Math.max(headBB.max[0], rs), Math.max(headBB.max[2], p.proxLength)],
  };
  const sprueC = [(bbPred.min[0] + bbPred.max[0]) / 2, (bbPred.min[1] + bbPred.max[1]) / 2];   // (x, z)
  const sprueR = p.sprueD / 2;
  const gateH = p.sprueGateT / 2;
  const gateOK = (f) => {
    const pts = [[0, 0]];
    for (let i = 0; i < 24; i++) {
      const t = (i / 24) * 2 * Math.PI;
      for (const rr of [sprueR / 2, sprueR]) pts.push([rr * Math.cos(t), rr * Math.sin(t)]);
    }
    return pts.every(([dx, dz]) => f([sprueC[0] + dx, gateH, sprueC[1] + dz]) < 0 && f([sprueC[0] + dx, -gateH, sprueC[1] + dz]) < 0);
  };
  let padSDF = null, pad = null;
  if (!gateOK(bodySDF)) {
    /* feed pad: an XZ stadium from inside the stem to the sprue centre (core
       radius rpc), dilated by a ball of radius webT/2 → Y-convex, symmetric,
       fully round edge; smooth-unioned like the web (fillet k). */
    const hp = hw;
    if (!(gateH < hp)) throw new Error('modelA: sprueGateT must be < webT');
    const rpc = Math.max(0, sprueR + p.sprueCover - hp, sprueR - Math.sqrt(hp * hp - gateH * gateH));
    const x0 = Math.min(rs - 1, sprueC[0]);
    const seg2 = (x, z) => {
      const t = Math.max(0, Math.min(1, (x - x0) / Math.max(1e-9, sprueC[0] - x0)));
      return Math.hypot(x - (x0 + t * (sprueC[0] - x0)), z - sprueC[1]);
    };
    padSDF = (q) => sdExtrudeY(seg2(q[0], q[2]) - rpc, q[1], 0) - hp;
    // clearance between the pad and the head (proxy) / the web, on y = 0
    let headGap = Infinity, webGap = Infinity;
    for (let i = 0; i < 72; i++) {
      const t = (i / 72) * 2 * Math.PI;
      for (let j = 0; j <= 8; j++) {
        const cx = x0 + ((sprueC[0] - x0) * j) / 8;
        const q = [cx + (rpc + hp) * Math.cos(t), 0, sprueC[1] + (rpc + hp) * Math.sin(t)];
        if (padSDF(q) > 1e-6) continue;                        // interior sample of the stadium outline
        headGap = Math.min(headGap, headSDF(q));
        webGap = Math.min(webGap, webSDF(q));
      }
    }
    /* Pad close to the head (low NSA / large head: the medial rim hangs down
       to the sprue height): a separate lobe left a tunnel between pad, web and
       rim (genus 1). Then the pad also runs up to the web contact point Q
       (lifted inside the head): one continuous gusset under the web. */
    let bridged = false;
    if (headGap < p.padBridgeGap) {
      const Ql = add(Q, scale(a, 1.0));
      const sdSeg = (x, z, A, Bp) => {
        const ex = Bp[0] - A[0], ez = Bp[1] - A[1];
        const t = Math.max(0, Math.min(1, ((x - A[0]) * ex + (z - A[1]) * ez) / (ex * ex + ez * ez)));
        return Math.hypot(x - A[0] - t * ex, z - A[1] - t * ez);
      };
      const S2 = [sprueC[0], sprueC[1]], Q2 = [Ql[0], Ql[2]];
      padSDF = (q) => sdExtrudeY(Math.min(seg2(q[0], q[2]), sdSeg(q[0], q[2], S2, Q2)) - rpc, q[1], 0) - hp;
      bridged = true;
    }
    pad = { bridgedToWebContact: bridged, headGapMm: r3(headGap), webGapMm: r3(webGap), from: [r3(x0), 0, r3(sprueC[1])], to: [r3(sprueC[0]), 0, r3(sprueC[1])], coreR: r3(rpc), halfT: hp, outlineR: r3(rpc + hp), lowestZ: r3(sprueC[1] - rpc - hp) };
    if (sprueC[1] - rpc - hp < prof.flareTopZ + 2) throw new Error('modelA: feed pad reaches the flare (raise proxLength)');
  }
  const kp = pad && pad.bridgedToWebContact ? Math.max(p.padFillet, p.padBridgeFillet) : p.padFillet;
  /* the pad's blend must never put material on the polished dome: over the
     cap cone (angle from the head axis ≤ the sphere's cap angle) it is clipped
     to the sphere; the clip fades out (continuously) past the cone edge */
  const capRad = info.sphereCapDeg * DEG;
  const capGuard = (q) => {
    const d = sub(q, C), l = Math.hypot(d[0], d[1], d[2]);
    const ang = Math.acos(Math.max(-1, Math.min(1, dot(d, a) / (l || 1))));
    return l - R - 4 * R * Math.max(0, ang - capRad);
  };
  const bodyPadSDF = padSDF ? (q) => { const b0 = bodySDF(q); return Math.min(b0, Math.max(smin(b0, padSDF(q), kp), capGuard(q))); } : bodySDF;
  if (!gateOK(bodyPadSDF)) throw new Error('modelA: the sprue disc is still not covered (check sprueD / webT)');
  /* Grooves on the ±Y faces: capsules along the straight stem, axes just
     outside the surface (centre at |y| = rs − depth + rg ≥ rs), cut with a
     smooth subtraction. Depth auto-limited so the stem keeps ≥ 6.6 mm across. */
  const gz0 = prof.flareTopZ + p.grooveFlareGap;
  let gz1 = webLowZ - k / 2 - p.grooveWebGap;
  if (pad) gz1 = Math.min(gz1, pad.lowestZ - p.grooveWebGap);   // stop below the feed pad
  const depth = Math.max(0, Math.min(p.grooveDepth, (2 * rs - 8) / 2));   // ≥ 8 mm left across the grooves
  let grooveSDF = null;
  const grooves = [];
  if (depth >= 0.5 && gz1 - gz0 > 8) {
    const w = p.grooveWidth;
    const rg = (w * w / 4 + depth * depth) / (2 * depth);  // circle through both lips and the bottom
    const g = [];
    for (const s of [1, -1]) {
      const A0 = [0, s * (rs - depth + rg), gz0 + rg * 0.5];
      const A1 = [0, s * (rs - depth + rg), gz1 - rg * 0.5];
      g.push([A0, A1]);
      grooves.push({ side: s > 0 ? 'anterior (+Y)' : 'posterior (−Y)', from: A0, to: A1, radius: rg });
    }
    grooveSDF = (q) => Math.min(sdCapsule(q, g[0][0], g[0][1], rg), sdCapsule(q, g[1][0], g[1][1], rg));
  }

  const sdf = (q) => {
    if (q[2] < zBlendMin - 2) return stemSDF(q);           // coupling zone: exact profile, no blends
    let d = bodyPadSDF(q);
    if (grooveSDF) d = kg > 0 ? ssub(d, grooveSDF(q), kg) : Math.max(d, -grooveSDF(q));
    return d;
  };

  const xMin = -(rs + p.latOverhang + 2);
  const xMax = Cx + R + 1;
  const yMax = R + 1;
  const bounds = { min: [xMin, -yMax, -1], max: [xMax, yMax, p.proxLength + 1] };
  /* Coupling + flare EXACT: below zSplit (straight stem, under the grooves) the
     levelSet body is trimmed away and replaced by the exact solid of revolution
     of the same profile (levelSet faceting at the seat edges left sub-0.01 mm
     non-convex dimples that a grazing Y-line reads as an undercut). The two
     parts meet on the plane z = zSplit, both r = rs there (≤ 0.01 mm apart); a
     0.8 mm tenon of r = rs − 0.05 overlaps them so the union is one solid. */
  const zSplit = prof.flareTopZ + Math.min(0.6, p.grooveFlareGap / 4);
  const lower = [];
  for (const q of prof.pts) { if (q[1] < zSplit - 1e-6) lower.push(q); }
  lower.push([rs, zSplit], [rs - 0.05, zSplit + 0.05], [rs - 0.05, zSplit + 0.8], [0, zSplit + 0.8]);   // 0.8 mm tenon hidden in the levelSet stem → one component
  const coupling = revolveProfile(lower, { tol: 0.005, label: 'modelA coupling' });
  const body = levelSetSolid(sdf, bounds, p.edge).trimByPlane([0, 0, 1], zSplit);
  const joined = unionAll([coupling, body, head]);
  joined.getMesh();
  /* The union merges the head's flat base into one polygon and re-triangulates
     it with long (≈ base-radius) diagonals; where the levelSet footprint has two
     vertices a few µm apart next to such a diagonal, the triangulator can emit
     an inverted needle (height < 1 µm) lying on the plane: a 180° "fold" to any
     dihedral check (h44 at NSA 125 / 140). Flip those edges away (exact, no
     vertex moves). */
  const { manifold: solid, flips } = flipInvertedNeedles(joined);
  if (solid !== joined) joined.delete();

  /* Printer / mold envelope: each mold half is the cavity + moldWall on every
     side; it must fit the printer cube. */
  const bb = bbox(solid);
  const ext = [0, 1, 2].map((i) => bb.max[i] - bb.min[i]);
  const ctrReal = [(bb.min[0] + bb.max[0]) / 2, (bb.min[2] + bb.max[2]) / 2];
  if (Math.hypot(ctrReal[0] - sprueC[0], ctrReal[1] - sprueC[1]) > 0.1 || Math.abs(bb.min[1] + bb.max[1]) > 0.01) {
    throw new Error(`modelA: bbox centre (${ctrReal.map((v) => v.toFixed(2))}) ≠ predicted sprue (${sprueC.map((v) => v.toFixed(2))})`);
  }
  const moldExt = ext.map((e) => e + 2 * p.moldWall);
  if (Math.max(...moldExt) > p.printerMm) {
    throw new Error(`modelA: mold envelope ${moldExt.map((e) => e.toFixed(0)).join('×')} mm exceeds the ${p.printerMm} mm printer (reduce proxLength)`);
  }

  // core wire on the stem axis: from the tube's distal end to coreWireCover below the dome at x = 0
  const tubeLength = p.totalLength - p.proxLength + Lc;
  if (!(tubeLength >= Lc + 10)) throw new Error(`modelA: totalLength ${p.totalLength} leaves < 10 mm of tube outside the part (raise totalLength or cut proxLength)`);
  const zDomeOnAxis = Cz + Math.sqrt(R * R - Cx * Cx);
  const wireTop = zDomeOnAxis - p.coreWireCover;
  const wireBottom = Lc - tubeLength;

  // cement bookkeeping: the tube seat is occupied by the tube (not cement of the molded part)
  const seatVolMm3 = Math.PI * rt * rt * Lc;

  const medialRim = sub(B, scale(u, rimRadius));
  const lateralRim = add(B, scale(u, rimRadius));
  const M = p.moldMargin;
  const r1 = (v) => +v.toFixed(1);
  const drillD = Math.ceil((tubeOD + 0.3) * 2) / 2;           // next 0.5 mm drill ≥ OD + 0.3
  const moldPrep = {
    note: 'The mold app is frozen (not updated any more). Its sprue/vent land as below; the two holes it cannot make are MANUAL steps on the printed halves (clamped together). Distances are on the block faces, measured along the parting seam (y = 0), for margin = moldMargin.',
    margin: M,
    block: { x: [r1(bb.min[0] - M), r1(bb.max[0] + M)], z: [r1(bb.min[2] - M), r1(bb.max[2] + M)], sizeXYZ: ext.map((e) => r1(e + 2 * M)) },
    sprue: {
      by: 'mold app (automatic)', d: p.sprueD, xz: sprueC.map(r3),
      gateMinThicknessY: p.sprueGateT, feedPad: pad,
    },
    appVent: { by: 'mold app (automatic)', d: 3, alongX: true, z: r3(ctrReal[1]), note: 'mid height only' },
    tubeHole: {
      by: 'MANUAL', face: 'distal (−Z) face of the block, on the seam',
      fromLateralFaceMm: r1(M - bb.min[0]), fromMedialFaceMm: r1(bb.max[0] + M),
      wallMm: M, drillD, note: `drill Ø ${drillD} mm straight along the stem axis through the ${M} mm wall until it opens into the molded Ø ${tubeOD.toFixed(2)} mm seat (≈ ${M + 2} mm deep); or subtract the same cylinder as a negative part in the slicer before printing`,
    },
    domeVent: {
      by: 'MANUAL', face: 'proximal (+Z) face of the block, on the seam',
      fromLateralFaceMm: r1(M + Cx - bb.min[0]), fromMedialFaceMm: r1(bb.max[0] - Cx + M),
      wallMm: M, drillD: p.domeVentD, note: 'the highest point of the dome; lets the air out when the mold is filled head-up (e.g. cement injected through the tube)',
    },
  };
  return {
    manifold: solid,
    meta: {
      head: info.validateHead,
      holes: [],
      headInfo: info,
      headCenter: C,
      headD: p.headD,
      NSA: p.nsDeg,
      tube: {
        fr: p.tubeFr,
        od: r3(tubeOD),
        axis: { point: [0, 0, Lc], direction: [0, 0, -1] },   // tube end at the stop, tube runs distally
        couplingLength: Lc,
        seat: { zFrom: 0, zTo: Lc, diameter: r3(tubeOD) },
        stop: {
          z: Lc, type: 'conical seat (45° by default) with a convex round at its outer edge', seatDeg: p.seatDeg, edgeRound: p.stopRound, overlapPerSide: p.stopOverlap,
          waistD: r3(2 * prof.waistR), waistZ: r3(prof.waistZ), waistFilletR: r3(prof.rho1),
        },
        tubeLength: r3(tubeLength),                  // cut length: Lc inside the mold + the rest outside
        tubeOutsidePart: r3(tubeLength - Lc),
        seatVolumeCm3: r3(seatVolMm3 / 1000),
        moldNote: `the tube seat reaches the distal face (z = 0), but the frozen mold app closes it with a ${M} mm wall: drill it open by hand (meta.moldPrep.tubeHole). The app does NOT make this hole.`,
      },
      moldPrep,
      meshRepair: { invertedNeedleFlips: flips },
      coreWire: {
        d: p.coreWireD,
        polyline: [[0, 0, r3(wireBottom)], [0, 0, r3(wireTop)]],
        length: r3(wireTop - wireBottom),
        note: 'continuous wire on the stem axis through the tube lumen and the molded part; the solid stays FULL (do not subtract it)',
      },
      printer: {
        name: 'Bambu Lab A1 mini', cubeMm: p.printerMm, moldWall: p.moldWall,
        partExtentMm: ext.map(r3), moldHalfEnvelopeMm: moldExt.map(r3), fits: true,
      },
      dims: {
        proxLength: p.proxLength,
        totalLength: p.totalLength,
        headHeight: r3(R - cut),
        hOverD: r3(p.headHD),
        headCenterMedialOffset: r3(Cx),
        headCenterZ: r3(Cz),
        baseCenter: B.map(r3),
        rimRadius: r3(rimRadius),
        flatBaseRadius: r3(ac),
        medialRimZ: r3(medialRim[2]),
        lateralRimZ: r3(lateralRim[2]),
        stemD: r3(2 * rs),
        waistD: r3(waistD),
        waistExempt: !!p.waistExempt,
        flareTopZ: r3(prof.flareTopZ),
        straightStemLength: r3(zRoot - prof.flareTopZ),
        webT: p.webT,
        webReachUsed: r3(webReachUsed),
        webContact: Q.map(r3),
        webRootZ: r3(zRoot),
        webApexZ: r3(V1[2]),
        webPolygonXZ: poly.map(([x, z]) => [r3(x), r3(z)]),
        grooveDepth: r3(depth),
        grooveWidth: p.grooveWidth,
        grooveZ: grooves.length ? [r3(gz0), r3(gz1)] : null,
        fillet: k,
      },
      grooves,
    },
  };
}

/* Remove inverted needles left by the boolean's re-triangulation of planar
   faces: a triangle (a, b, c) whose normal is opposite to that of the
   neighbour (b, a, d) across edge ab, both on one plane, apex c within
   0.02 mm of line ab. Flipping edge ab → cd gives (c, a, d) + (d, b, c),
   which tile the neighbour minus the needle (no vertex moves). Returns the
   input manifold untouched when there is nothing to fix. */
function flipInvertedNeedles(m, { maxIter = 200, maxH = 0.02 } = {}) {
  const { positions: P, indices } = toMeshArrays(m);
  const T = Array.from(indices);
  const nT = T.length / 3;
  const V = (i) => [P[3 * i], P[3 * i + 1], P[3 * i + 2]];
  const nrm = (t) => {
    const a = V(T[3 * t]), b = V(T[3 * t + 1]), c = V(T[3 * t + 2]);
    const u = sub(b, a), w = sub(c, a);
    const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    const l = Math.hypot(...n);
    return { n: l > 0 ? scale(n, 1 / l) : [0, 0, 0], area2: l };
  };
  let flips = 0;
  for (let it = 0; it < maxIter; it++) {
    const edge = new Map();
    for (let t = 0; t < nT; t++) for (let k = 0; k < 3; k++) edge.set(T[3 * t + k] + ',' + T[3 * t + (k + 1) % 3], t);
    let changed = false;
    for (let t = 0; t < nT && !changed; t++) {
      const { n, area2 } = nrm(t);
      for (let kL = 0; kL < 3 && !changed; kL++) {
        const a = T[3 * t + kL], b = T[3 * t + (kL + 1) % 3], c = T[3 * t + (kL + 2) % 3];
        const L = Math.hypot(...sub(V(b), V(a)));
        if (!(L > 0) || area2 / L > maxH) continue;              // apex height over edge ab
        const u = edge.get(b + ',' + a);
        if (u == null) continue;
        const nu = nrm(u).n;
        if (!(dot(n, nu) < -0.99)) continue;                    // only inverted, coplanar pairs
        let d = -1;
        for (let k = 0; k < 3; k++) { const x = T[3 * u + k]; if (x !== a && x !== b) d = x; }
        if (d < 0 || c === d || edge.has(c + ',' + d) || edge.has(d + ',' + c)) continue;
        const t1 = [c, a, d], t2 = [d, b, c];
        const ok = [t1, t2].every((tri) => {
          const A = V(tri[0]), Bv = V(tri[1]), Cv = V(tri[2]);
          const x = sub(Bv, A), y = sub(Cv, A);
          const nn = [x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]];
          return dot(nn, nu) > 0;
        });
        if (!ok) continue;
        T.splice(3 * t, 3, ...t1);
        T.splice(3 * u, 3, ...t2);
        flips++; changed = true;
      }
    }
    if (!changed) break;
  }
  if (!flips) return { manifold: m, flips };
  const out = fromMeshArrays(P, new Uint32Array(T), 'modelA needle repair');
  const v0 = m.getProperties().volume, v1 = out.getProperties().volume;
  if (Math.abs(v1 - v0) > 1e-3 * v0 || out.genus() !== m.genus()) throw new Error('modelA: needle repair changed the solid');
  return { manifold: out, flips };
}
