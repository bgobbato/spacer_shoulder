/* Two-half mold for the model-C humeral spacer (open technique).

   buildMold(E, src, userParams) → { ant, post, parts, layout, report }

   Order of construction (everything placed from the ACTUAL geometry):
   1. cement = positive above the tube stop (flare rebuilt if the tube OD
      differs from the positive's), minus the two stop flats;
      'long' variant (C longo, no tube): cement = the whole positive, the
      distal end of the block is CLOSED around the rounded tip (wall ≥ wall)
      and only a coaxial core-wire exit hole crosses it (wireExit);
   2. block = rounded rectangle in XZ, extruded ±T in Y (T from the deepest
      cavity point + wall + engraving);
   3. cavity-connected features, symmetric about y = 0: tube guide bore with
      lead-in chamfer, spew groove ring + exits, air vents at the deep points
      off the articular dome;
   4. outside features: M5 through-bolts (nut pockets in POST), pry notches;
   5. split at y = 0; then per half: registration pins (1 male + 1 female per
      half, Ø8 / Ø6 so the halves close one way only) and engravings. */

import { resolveParams } from './params.mjs';
import {
  DEG, force, volume, bounds, box, cylY, cylZ, extrudeXZ, sliceAtY, union, bake,
  R_Z_TO_PY, R_Z_TO_NY, csPolys, dropDebris, sdPolys, distToPolys, roundedRectCS, rectCS, strokeCS,
} from './geom.mjs';
import { cementSolid, findVentSites } from './positive.mjs';
import { placeText, strokesToCS, textWidth } from './labels.mjs';

const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;

/* Solid of revolution along ±Y from y0: profile [[r, t], ...] with t ≥ 0 the
   distance travelled from y0 in direction dir (+1 / −1). */
function revolveY(E, x, z, y0, dir, prof, seg = 64) {
  const pts = prof.map(([r, t]) => [r, t]);
  // CCW orientation in (r, t)
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }
  const cs = new E.CrossSection([a < 0 ? pts.reverse() : pts], 'Positive');
  const rev = E.Manifold.revolve(cs, seg);
  return bake(E, rev, dir > 0 ? R_Z_TO_PY : R_Z_TO_NY, [x, y0, z], 'revolveY');
}

export function malePin(E, x, z, d, p, dir) {
  // base 0.5 mm inside its own half, protrudes pinH beyond the parting plane
  const R = d / 2, c = p.pinChamfer, H = p.pinH + 0.5;
  return revolveY(E, x, z, -dir * 0.5, dir, [[0, 0], [R, 0], [R, H - c], [R - c, H], [0, H]]);
}

export function femaleHole(E, x, z, d, p, dir) {
  // dir = direction INTO the half (+1 ANT, −1 POST); starts 0.1 outside the face
  const rh = d / 2 + p.pinClear, ch = p.holeChamfer, D = 0.1 + p.pinH + p.holeExtraDepth;
  return revolveY(E, x, z, -dir * 0.1, dir, [[0, 0], [rh + ch + 0.1, 0], [rh, ch + 0.1], [rh, D], [0, D]]);
}

function hexPrismY(E, x, z, y0, y1, af) {
  const rc = af / Math.sqrt(3);
  const cs = E.CrossSection.circle(rc, 6).rotate(30).translate([x, z]);
  return extrudeXZ(E, cs, Math.min(y0, y1), Math.max(y0, y1));
}

/* Search the XZ plane for the feasible point nearest to `target`. */
function placeNear(target, r, ctx, extraCheck) {
  const { x0, x1, z0, z1 } = ctx.rect;
  const step = 0.5;
  const cands = [];
  for (let x = x0; x <= x1; x += step) for (let z = z0; z <= z1; z += step) {
    cands.push([x, z, (x - target[0]) ** 2 + (z - target[1]) ** 2]);
  }
  cands.sort((a, b) => a[2] - b[2]);
  for (const [x, z] of cands) {
    const q = [x, z];
    if (-sdPolys(q, ctx.outline) < r + ctx.p.featureEdge) continue;
    if (sdPolys(q, ctx.cavity) < ctx.p.wall + r) continue;
    if (sdPolys(q, ctx.groove) < r + 2) continue;
    let ok = true;
    for (const v of ctx.vents) if (Math.hypot(x - v.x, z - v.z) < r + ctx.p.ventD / 2 + 3) { ok = false; break; }
    if (!ok) continue;
    for (const f of ctx.placed) if (Math.hypot(x - f.x, z - f.z) < r + f.r + 3) { ok = false; break; }
    if (!ok) continue;
    if (extraCheck && !extraCheck(q)) continue;
    return q;
  }
  return null;
}

export function buildMold(E, src, userParams = {}) {
  const t0 = Date.now();
  const p = resolveParams({ headD: src.desc.headD, ...userParams });
  const desc = src.desc;
  const warnings = [];

  /* 1 — cement and stop flats */
  const long = desc.distal === 'long';
  const { cement, info: cemInfo } = cementSolid(E, src.positive, desc, p);
  warnings.push(...cemInfo.warnings);
  const zStop = cemInfo.zStop;
  const xIn = p.tubeODmm / 2 - p.stopLip;
  const stopFlats = long ? null : union(E, [
    box(E, [xIn, -40, zStop], [xIn + 30, 40, zStop + p.stopLen]),
    box(E, [-xIn - 30, -40, zStop], [-xIn, 40, zStop + p.stopLen]),
  ]);
  const cav = long ? force(cement.translate([0, 0, 0]), 'cavity') : force(cement.subtract(stopFlats), 'cavity');
  const cb = bounds(cement);
  const ymax = Math.max(-cb.min[1], cb.max[1]);
  const zBase = long ? cb.min[2] : zStop;          // lowest cement level the groove exits look above

  /* 2 — block */
  // long: closed distal wall = wall (whole mm, rounded down → ≥ wall)
  const zMin = long ? Math.floor(cb.min[2] - p.wall) : zStop - p.guideLen;
  const T = Math.ceil((ymax + p.wall + p.engraveDepth + 0.2) * 2) / 2;
  const bx0 = Math.floor(cb.min[0] - p.sideMargin), bx1 = Math.ceil(cb.max[0] + p.sideMargin);
  const bz1 = Math.ceil(cb.max[2] + p.topMargin);
  const outlineCS = roundedRectCS(E, bx0, zMin, bx1, bz1, p.cornerR);
  const block = extrudeXZ(E, outlineCS, -T, T);

  /* 3 — tube guide bore + lead-in chamfer (coaxial with the stem axis x = y = 0);
     long: core-wire exit hole (or nothing) through the closed distal wall */
  const wireD = desc.wire ? desc.wire.d : 3.2;
  const rb = long ? (wireD + p.wireClearDia) / 2 : p.boreD / 2;
  const cham = long ? p.wireChamfer : p.boreChamfer;
  const wireHole = long && p.wireExit;
  const bore = !long ? cylZ(E, 0, 0, zMin - 1, zStop, rb, rb, 96)
    : wireHole ? cylZ(E, 0, 0, zMin - 1, cb.min[2] + 1, rb, rb, 48) : E.Manifold.cube([0, 0, 0]);
  const chamfer = !long || wireHole ? cylZ(E, 0, 0, zMin - 0.01, zMin + cham, rb + cham, rb, long ? 48 : 96) : E.Manifold.cube([0, 0, 0]);

  // parting-face outline of the cavity (cement ∪ bore) → groove ring
  const cavAndBore = force(cav.add(bore), 'cav+bore');
  const cavOutline = sliceAtY(E, cavAndBore, 0.01);
  const cavPolys = csPolys(cavOutline);
  const outlinePolys = csPolys(outlineCS);
  // close narrow concave notches of the outline first (fin/head, neck/head
  // corners): otherwise the ring touches itself there and the extrusion has
  // pinched edges (measured: 450 edges shared by 4 faces in the STL)
  const kClose = p.land + p.grooveW + 1;
  const smooth = cavOutline.offset(kClose, 'Round', 2, 96).offset(-kClose, 'Round', 2, 96).add(cavOutline).simplify(0.001);
  const ringIn = smooth.offset(p.land, 'Round', 2, 96).simplify(0.001);
  const ringOut = smooth.offset(p.land + p.grooveW, 'Round', 2, 96).simplify(0.001);
  let ring = ringOut.subtract(ringIn).intersect(outlineCS);
  // exits: top, lateral (−X), medial (+X), from the ring to the block edge
  const ringOutPolys = csPolys(ringOut);
  let top = null, left = null, right = null;
  for (const poly of ringOutPolys) for (const q of poly) {
    if (q[1] > zBase + 10) {
      if (!top || q[1] > top[1]) top = q;
      if (!left || q[0] < left[0]) left = q;
      if (!right || q[0] > right[0]) right = q;
    }
  }
  const hw = p.exitW / 2;
  const exits = [
    { name: 'top', cs: rectCS(E, top[0] - hw, top[1] - p.grooveW, top[0] + hw, bz1 + 1) },
    { name: 'lateral', cs: rectCS(E, bx0 - 1, left[1] - hw, left[0] + p.grooveW, left[1] + hw) },
    { name: 'medial', cs: rectCS(E, right[0] - p.grooveW, right[1] - hw, bx1 + 1, right[1] + hw) },
  ];
  if (long) {
    // the long stem: 2 more exits low on the stem (lateral + medial), from the
    // block edge to the land (the land itself stays: rect − ringIn)
    const zE = cb.min[2] + 25;
    exits.push({ name: 'distal-lateral', cs: rectCS(E, bx0 - 1, zE - hw, -1, zE + hw).subtract(ringIn) });
    exits.push({ name: 'distal-medial', cs: rectCS(E, 1, zE - hw, bx1 + 1, zE + hw).subtract(ringIn) });
  }
  const grooveCS = E.CrossSection.union([ring, ...exits.map((e) => e.cs)]).intersect(
    rectCS(E, bx0 - 2, zMin - 2, bx1 + 2, bz1 + 2)).simplify(0.001);
  const groovePolys = csPolys(grooveCS);
  const grooves = extrudeXZ(E, grooveCS, -p.grooveD, p.grooveD);

  // vents (mirror pair per site)
  const ventSites = findVentSites(src.arrays, desc, p);
  const vents = [];
  for (const v of ventSites) {
    vents.push(cylY(E, v.x, v.z, v.y - 1, T + 1, p.ventD / 2, p.ventD / 2, 24));
    vents.push(cylY(E, v.x, v.z, -v.y + 1, -T - 1, p.ventD / 2, p.ventD / 2, 24));
  }

  /* 4 — bolts, pins, notches placed in the real wall */
  const ctx = {
    p, outline: outlinePolys, cavity: cavPolys, groove: groovePolys, vents: ventSites, placed: [],
    rect: { x0: bx0, x1: bx1, z0: zMin, z1: bz1 },
  };
  const nutR = p.nutAF / Math.sqrt(3);
  const boltSites = [];
  if (p.bolts) {
    for (const [name, tgt] of [['inf-lat', [bx0, zMin]], ['inf-med', [bx1, zMin]], ['sup-lat', [bx0, bz1]], ['sup-med', [bx1, bz1]]]) {
      const q = placeNear(tgt, nutR, ctx);
      if (!q) { warnings.push(`parafuso ${name}: sem lugar na parede — omitido`); continue; }
      const s = { name, x: q[0], z: q[1], r: nutR };
      boltSites.push(s); ctx.placed.push(s);
    }
  }
  const H = bz1 - zMin;
  const pinSpecs = [
    { name: 'P1', d: p.pinD[0], male: 'ANT', target: [bx1, zMin + 0.30 * H] },
    { name: 'P2', d: p.pinD[1], male: 'POST', target: [bx0, zMin + 0.62 * H] },
  ];
  const pinSites = [];
  for (const s of pinSpecs) {
    // Place with a FIXED reference clearance (≥ 0.35 mm) so the pin site does not
    // move when pinClear is tuned: a smaller clearance let placeNear slide the
    // hole toward the cavity and the 3D wall fell to 7.91 mm (h48, 27/Sep).
    const rKeep = s.d / 2 + Math.max(p.pinClear, 0.35) + p.holeChamfer;
    const q = placeNear(s.target, rKeep, ctx);
    if (!q) throw new Error(`pino ${s.name}: sem lugar na parede (aumente sideMargin)`);
    const site = { ...s, x: q[0], z: q[1], r: rKeep };
    pinSites.push(site); ctx.placed.push(site);
  }
  // pry notches on the lateral and medial side faces, at the parting line
  const notchSites = [];
  for (const [name, side] of [['lateral', -1], ['medial', 1]]) {
    const xe = side < 0 ? bx0 : bx1;
    let best = null;
    const zc0 = zMin + 0.45 * H;
    for (let k = 0; k < 400 && !best; k++) {
      const zc = zc0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.5;
      if (zc - p.notchLen / 2 < zMin + p.cornerR + 2 || zc + p.notchLen / 2 > bz1 - p.cornerR - 2) continue;
      const xa = side < 0 ? xe - 1 : xe - p.notchDepth, xb = side < 0 ? xe + p.notchDepth : xe + 1;
      const corners = [[xa, zc - p.notchLen / 2], [xb, zc - p.notchLen / 2], [xb, zc + p.notchLen / 2], [xa, zc + p.notchLen / 2]];
      const inner = side < 0 ? xb : xa;
      const pts = [...corners, [inner, zc]];
      let ok = pts.every((q) => sdPolys(q, cavPolys) >= p.wall) && pts.every((q) => sdPolys(q, groovePolys) >= 2);
      if (ok) for (const f of ctx.placed) {
        const dx = Math.max(xa - f.x, 0, f.x - xb), dz = Math.max(zc - p.notchLen / 2 - f.z, 0, f.z - zc - p.notchLen / 2);
        if (Math.hypot(dx, dz) < f.r + 3) { ok = false; break; }
      }
      if (ok) best = { name, x0: xa, x1: xb, z0: zc - p.notchLen / 2, z1: zc + p.notchLen / 2 };
    }
    if (best) notchSites.push(best); else warnings.push(`fenda de alavanca ${name}: sem lugar`);
  }
  const notches = notchSites.map((n) => extrudeXZ(E, rectCS(E, n.x0, n.z0, n.x1, n.z1), -p.notchH, p.notchH));
  const boltHoles = boltSites.map((b) => cylY(E, b.x, b.z, -T - 1, T + 1, p.boltD / 2, p.boltD / 2, 32));
  const nutPockets = boltSites.map((b) => hexPrismY(E, b.x, b.z, -T - 1, -T + p.nutDepth, p.nutAF));

  /* 5 — full mold, split, per-half features */
  const toolSym = union(E, [cav, bore, chamfer, ...vents, grooves, ...notches, ...boltHoles]);
  const full = force(block.subtract(toolSym), 'full mold');
  // split with half-space BOXES, not trimByPlane: on this level-set cavity
  // trimByPlane([0,−1,0], 0) left a zero-thickness membrane across the
  // cavity at y = 0 (measured); box intersection does not.
  const fb = bounds(full);
  const lo = fb.min.map((v) => v - 2), hi = fb.max.map((v) => v + 2);
  const cutA = dropDebris(E, force(full.intersect(box(E, [lo[0], 0, lo[2]], hi)), 'ANT raw'));
  const cutP = dropDebris(E, force(full.intersect(box(E, lo, [hi[0], 0, hi[2]])), 'POST raw'));
  let ant = cutA.m, post = cutP.m;
  const debris = { ANT: cutA.removed, POST: cutP.removed };

  const [P1, P2] = pinSites;
  const maleAnt = malePin(E, P1.x, P1.z, P1.d, p, -1);    // protrudes toward −Y (into POST)
  const femPost = femaleHole(E, P1.x, P1.z, P1.d, p, -1);  // into POST
  const malePost = malePin(E, P2.x, P2.z, P2.d, p, +1);   // protrudes toward +Y (into ANT)
  const femAnt = femaleHole(E, P2.x, P2.z, P2.d, p, +1);   // into ANT

  // engravings
  const eng = buildEngravings(E, p, { T, bx0, bx1, zMin, bz1, zStop, desc, cemInfo, boltSites, ventSites, nutR, long });
  const finA = dropDebris(E, force(ant.add(maleAnt).subtract(union(E, [femAnt, eng.antSolid])), 'ANT'));
  const finP = dropDebris(E, force(post.add(malePost).subtract(union(E, [femPost, ...nutPockets, eng.postSolid])), 'POST'));
  ant = finA.m; post = finP.m;
  debris.ANT.count += finA.removed.count; debris.ANT.volumeMm3 += finA.removed.volumeMm3;
  debris.POST.count += finP.removed.count; debris.POST.volumeMm3 += finP.removed.volumeMm3;

  // M5 socket-head screw: under-head → far face of the nut (nut 4 mm, pocket nutDepth) + 1 mm
  const boltMin = 2 * T - (p.nutDepth - 4) + 1;
  const boltStd = [40, 45, 50, 55, 60, 65, 70, 75, 80, 90, 100].find((L) => L >= boltMin) || Math.ceil(boltMin);
  const layout = {
    frame: 'mm; stem axis +Z; head +X (medial); parting plane y = 0; ANT y > 0, POST y < 0',
    block: { x: [bx0, bx1], y: [-T, T], z: [zMin, bz1], halfThicknessY: T, cornerR: p.cornerR },
    distal: long ? {
      variant: 'long', name: 'C longo (sem dreno)', totalLenMm: desc.long.totalLenMm, stemD: desc.long.stemD,
      tipZ: r2(cb.min[2]), distalFaceZ: zMin, endWallMm: r2(cb.min[2] - zMin), closed: true,
      wireHole: wireHole ? { d: r2(2 * rb), wireD, axis: { point: [0, 0, 0], dir: [0, 0, 1] }, fromZ: zMin, toZ: r2(cb.min[2]), chamfer: cham } : null,
      wireCheckFromZ: desc.long.tipR,
    } : { variant: 'tube', name: 'C curto + dreno' },
    tube: long ? null : {
      odMm: r2(p.tubeODmm), odSource: p.tubeODsource, boreD: r2(p.boreD), axis: { point: [0, 0, 0], dir: [0, 0, 1] },
      stopZ: zStop, insertionDepthFromDistalFaceMm: p.guideLen, distalFaceZ: zMin,
      stopFlats: { xInner: r2(xIn), zRange: [zStop, zStop + p.stopLen], lipOverTubeWallMm: p.stopLip },
      flare: cemInfo,
    },
    vents: ventSites.map((v) => ({ ...v, x: r2(v.x), y: r2(v.y), z: r2(v.z), angleFromAxisDeg: r1(v.angleFromAxisDeg), d: p.ventD })),
    domeCapDeg: r1(desc.head.capDeg),
    grooves: { land: p.land, width: p.grooveW, depthPerHalf: p.grooveD, exits: exits.map((e) => e.name).concat(long ? [] : ['distal (ao longo do furo do dreno)']) },
    pins: pinSites.map((s) => ({ name: s.name, x: r2(s.x), z: r2(s.z), d: s.d, male: s.male, female: s.male === 'ANT' ? 'POST' : 'ANT', holeD: r2(s.d + 2 * p.pinClear), height: p.pinH, holeDepth: r2(p.pinH + p.holeExtraDepth) })),
    bolts: boltSites.map((b) => ({ name: b.name, x: r2(b.x), z: r2(b.z), holeD: p.boltD, nutPocketAF: p.nutAF, nutPocketDepth: p.nutDepth, nutSide: 'POST', boltMinLengthMm: r1(boltMin), boltLengthMm: boltStd })),
    notches: notchSites.map((n) => ({ ...n, depthY: p.notchH })),
    engraving: eng.info,
  };

  const parts = {
    cement: cement, cavity: cav, stopFlats, block, long, bore, chamfer, vents: union(E, vents), grooves,
    notches: union(E, notches), boltHoles: union(E, boltHoles), nutPockets: union(E, nutPockets),
    femaleHoles: union(E, [femAnt, femPost]), malePins: union(E, [maleAnt, malePost]),
    pins: [
      { name: 'P1', male: maleAnt, maleHalf: 'ANT', hole: femPost, holeHalf: 'POST', site: P1 },
      { name: 'P2', male: malePost, maleHalf: 'POST', hole: femAnt, holeHalf: 'ANT', site: P2 },
    ],
    engraving: union(E, [eng.antSolid, eng.postSolid]), engravingANT: eng.antSolid, engravingPOST: eng.postSolid, full,
  };

  const vAnt = volume(ant), vPost = volume(post), vCav = volume(cav), vCement = volume(cement);
  const bA = bounds(ant), bP = bounds(post);
  const report = {
    model: desc.model, variant: long ? 'long' : 'tube', headD: desc.headD,
    fr: long ? null : p.tubeOD != null ? null : p.fr, tubeODmm: long ? null : r2(p.tubeODmm),
    halves: {
      ANT: { volumeCm3: r2(vAnt / 1000), bounds: bA, sizeMm: bA.max.map((v, k) => r1(v - bA.min[k])), triangles: ant.numTri() },
      POST: { volumeCm3: r2(vPost / 1000), bounds: bP, sizeMm: bP.max.map((v, k) => r1(v - bP.min[k])), triangles: post.numTri() },
    },
    cement: {
      cavityCm3: r2(vCav / 1000), cementAboveStopCm3: r2(vCement / 1000),
      positiveTotalCm3: desc.volumeMm3 ? r2(desc.volumeMm3 / 1000) : null,
      note: long ? 'C longo: cavidade = positivo inteiro (sem dreno, ponta arredondada fechada no molde)'
        : 'cavidade = positivo acima do batente do dreno (z ≥ batente) menos as 2 abas de batente; cimento dentro do dreno não está incluído',
    },
    debrisRemoved: debris,
    warnings,
    buildMs: Date.now() - t0,
  };
  return { ant, post, parts, layout, report, params: p, head: desc.head, wire: desc.wire };
}

/* Labels and 1:1 gauges on the two outer faces. */
function buildEngravings(E, p, g) {
  const { T, bx1, zMin, zStop, desc, cemInfo, boltSites, ventSites, nutR, long } = g;
  const d = p.engraveDepth;
  const keep = [
    ...boltSites.map((b) => ({ x: b.x, z: b.z, r: nutR + 1.5 })),
    ...ventSites.map((v) => ({ x: v.x, z: v.z, r: p.ventD / 2 + 2 })),
  ];
  const odTxt = p.tubeOD != null ? `OD ${p.tubeODmm.toFixed(1)}` : `${p.fr}FR`;
  const lines = (side) => (long ? [side, `${desc.model} LONGO`, `${desc.headD}`] : [side, `${desc.model} ${desc.headD}`, odTxt]);
  // text block to the medial side of the stem, above the lower bolt
  const xa = 9, xb = bx1 - p.featureEdge - 1;
  const wAvail = xb - xa, xc = (xa + xb) / 2;
  const lowBolt = boltSites.filter((b) => b.x > 0).reduce((m, b) => Math.min(m, b.z), Infinity);
  let zTop = (isFinite(lowBolt) ? lowBolt : zMin) + nutR + 4;
  const mk = (side, dirX) => {
    const polylines = [];
    let z = zTop;
    const out = [];
    // top line first: stack from the top of the block down
    const L = lines(side).map((s, i) => ({ s, h: Math.min(i === 0 ? p.textH + 2 : p.textH, (wAvail * 6) / (s.length * 6 - 2)) }));
    z = zTop + L.reduce((a, q) => a + q.h + 4, -4);
    for (const q of L) {
      z -= q.h;
      polylines.push(...placeText(q.s, q.h, xc, z, dirX));
      out.push({ text: q.s, h: r1(q.h), z: r1(z) });
      z -= 4;
    }
    return { polylines, out, zEnd: z };
  };
  const antT = mk('ANT', -1), postT = mk('POST', +1);

  // ANT: tube-depth gauge on the stem axis (1:1): line from the distal face
  // to the stop plane, cross-tick at the stop, insertion depth written beside.
  // long: no tube → no depth ruler
  const gauge = long ? [] : [
    [[0, zMin], [0, zStop]],
    [[-7, zStop], [7, zStop]],
  ];
  const depthTxt = long ? [] : placeText(`${p.guideLen}`, 6, -12, zStop + 3, -1);
  // POST: core-wire template (1:1 over its real place), clipped around vents
  const wire = desc.wire ? desc.wire.polyline.map((q) => [q[0], q[2]]) : null;
  const wireLines = [];
  if (wire) {
    wireLines.push([[wire[0][0], zMin], ...wire]);
    const tip = wire[wire.length - 1], prev = wire[wire.length - 2];
    const dx = tip[0] - prev[0], dz = tip[1] - prev[1], l = Math.hypot(dx, dz);
    const nx = -dz / l * 3, nz = dx / l * 3;
    wireLines.push([[tip[0] - nx, tip[1] - nz], [tip[0] + nx, tip[1] + nz]]);
    const bend = wire[1];
    wireLines.push([[bend[0] - 3, bend[1]], [bend[0] + 3, bend[1]]]);
  }
  const clip = (cs) => {
    if (!cs) return null;
    const holes = keep.map((k) => E.CrossSection.circle(k.r, 32).translate([k.x, k.z]));
    return holes.length ? cs.subtract(E.CrossSection.union(holes)) : cs;
  };
  const antCS = clip(strokesToCS(E, [...antT.polylines, ...gauge, ...depthTxt], p.strokeW));
  const postCS = clip(strokesToCS(E, [...postT.polylines, ...wireLines], p.strokeW));
  const antSolid = extrudeXZ(E, antCS, T - d, T + 1);
  const postSolid = extrudeXZ(E, postCS, -T - 1, -T + d);
  return {
    antSolid, postSolid,
    info: {
      depthMm: d, strokeMm: p.strokeW,
      ANT: { face: `y = +${T}`, lines: antT.out, tubeGauge: long ? null : { axisX: 0, fromZ: zMin, stopZ: zStop, label: `${p.guideLen}` } },
      POST: { face: `y = -${T}`, lines: postT.out, wireTemplate: wire ? { polylineXZ: wire, fromZ: zMin } : null },
      readingNote: 'texto lido de fora de cada metade (ANT visto de +Y, POST visto de −Y)',
      fitNote: long ? 'C longo: sem dreno' : cemInfo.flareRebuilt ? 'transição dreno→haste reconstruída para o OD pedido' : 'transição dreno→haste = a do positivo',
    },
  };
}

/* A half in its PRINT pose on the A1 mini bed (printed straight, never
   rotated about the bed normal): outer face on the bed (z = 0), parting
   face up, footprint centred on the 180 × 180 plate. ANT: (x, y, z) →
   (x, z, T − y); POST: (x, y, z) → (x, −z, T + y). Both proper rotations
   (no mirror). Returns { m, bounds }. */
export function bedPose(E, mold, which, plate = 180) {
  const T = mold.layout.block.halfThicknessY;
  const half = which === 'ANT' ? mold.ant : mold.post;
  const R = which === 'ANT' ? R_XZ_TO_XY_BED : R_Z_TO_NY_BED;
  const m0 = bake(E, half, R, [0, 0, T], `bed ${which}`);
  const b = bounds(m0);
  const m = m0.translate([plate / 2 - (b.min[0] + b.max[0]) / 2, plate / 2 - (b.min[1] + b.max[1]) / 2, -b.min[2]]);
  m0.delete();
  return { m, bounds: bounds(m) };
}
const R_XZ_TO_XY_BED = [1, 0, 0, 0, 0, 1, 0, -1, 0];   // (x, y, z) → (x, z, −y)
const R_Z_TO_NY_BED = [1, 0, 0, 0, 0, -1, 0, 1, 0];    // (x, y, z) → (x, −z, y)
