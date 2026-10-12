/* Checks on a built mold (manifold-3d only; runs in node and in the browser).

   validateMold(E, mold, { full: true }) → { ok, failures, warnings, checks }
   full = false skips the slower checks (min wall by minGap, sealed-cavity
   booleans) for the live page. */

import { box, bounds, volume, force, union, csPolys, toArrays } from './geom.mjs';
import { buildBVH, closestPoint } from '../../positivo/src/bvh.mjs';
import { domeZone } from './positive.mjs';

const PRINT_VOLUME = [180, 180, 180];

function contains(E, m, p, h = 0.05) {
  const c = box(E, [p[0] - h, p[1] - h, p[2] - h], [p[0] + h, p[1] + h, p[2] + h]);
  const v = volume(m.intersect(c));
  c.delete();
  return v > 0.5 * (2 * h) ** 3;
}

/* Minimum distance between two surfaces, by BVH closest-point queries from
   every vertex and triangle centroid of each mesh onto the other (manifold's
   own minGap() returned false zeros in 2.5.1 — measured, not used). */
export function surfaceGap(ma, mb, maxDist = 50) {
  const A = toArrays(ma), B = toArrays(mb);
  let best = { dist: maxDist, at: null };
  const scan = (X, BVH) => {
    const P = X.positions, I = X.indices;
    const q = (p) => { const r = closestPoint(BVH, p, best.dist); if (r && r.dist < best.dist) best = { dist: r.dist, at: p.slice() }; };
    for (let i = 0; i < P.length; i += 3) q([P[i], P[i + 1], P[i + 2]]);
    for (let t = 0; t < I.length; t += 3) {
      const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
      q([(P[a] + P[b] + P[c]) / 3, (P[a + 1] + P[b + 1] + P[c + 1]) / 3, (P[a + 2] + P[b + 2] + P[c + 2]) / 3]);
    }
  };
  scan(A, buildBVH(B.positions, B.indices));
  scan(B, buildBVH(A.positions, A.indices));
  return best;
}

export function validateMold(E, mold, opts = {}) {
  const full = opts.full !== false;
  const { ant, post, parts, layout, params: p } = mold;
  const failures = [], warnings = [], checks = {};
  const fail = (m) => failures.push(m);

  /* 1 — each half: manifold, ONE component, fits the printer */
  for (const [name, m] of [['ANT', ant], ['POST', post]]) {
    const comps = m.decompose();
    const b = bounds(m);
    const size = b.max.map((v, k) => v - b.min[k]);
    const sorted = [...size].sort((a, c) => a - c);
    const fits = sorted.every((s, k) => s <= [...PRINT_VOLUME].sort((a, c) => a - c)[k]);
    checks[name] = {
      status: m.status().value ?? m.status(), components: comps.length, componentVolumesCm3: comps.map((c) => +(volume(c) / 1000).toFixed(4)),
      genus: m.genus(), sizeMm: size.map((v) => +v.toFixed(2)), fits180: fits, volumeCm3: +(volume(m) / 1000).toFixed(2),
    };
    comps.forEach((c) => c.delete());
    if (checks[name].components !== 1) fail(`${name}: ${checks[name].components} componentes (peça solta)`);
    if (!fits) fail(`${name}: não cabe em 180×180×180 (${size.map((v) => v.toFixed(1)).join('×')})`);
    // printed STRAIGHT with the parting face up: footprint = X × Z on the bed,
    // height = Y (block half + male pin); bedMargin free on every side
    const m0 = p.bedMargin ?? 3;
    const bed = {
      footprintMm: [+size[0].toFixed(2), +size[2].toFixed(2)], heightMm: +size[1].toFixed(2), bedMm: [PRINT_VOLUME[0], PRINT_VOLUME[1]],
      marginMm: [+((PRINT_VOLUME[0] - size[0]) / 2).toFixed(2), +((PRINT_VOLUME[1] - size[2]) / 2).toFixed(2)], requiredMarginMm: m0,
      orientation: 'reta (sem girar na mesa): face de partição para cima, X da peça no X da mesa, Z da peça no Y da mesa',
    };
    bed.fits = bed.marginMm[0] >= m0 - 1e-9 && bed.marginMm[1] >= m0 - 1e-9 && size[1] <= PRINT_VOLUME[2];
    checks[name].bedStraight = bed;
    if (!bed.fits) fail(`${name}: não cabe RETA na mesa 180 × 180 com ${m0} mm de folga (${bed.footprintMm.join(' × ')} mm)`);
  }

  /* 1b — what the STL will contain (float32 vertices): every edge used by
     exactly 2 triangles when vertices are merged by position (no pinch) */
  for (const [name, m] of [['ANT', ant], ['POST', post]]) {
    const { positions: P, indices: I } = toArrays(m);
    const id = new Map(); const vid = new Uint32Array(P.length / 3);
    for (let i = 0; i < vid.length; i++) {
      const k = `${P[3 * i]},${P[3 * i + 1]},${P[3 * i + 2]}`;
      let v = id.get(k); if (v === undefined) { v = id.size; id.set(k, v); } vid[i] = v;
    }
    const ec = new Map();
    for (let t = 0; t < I.length; t += 3) for (const [a, b] of [[I[t], I[t + 1]], [I[t + 1], I[t + 2]], [I[t + 2], I[t]]]) {
      const x = vid[a], y = vid[b], k = x < y ? x * 4294967296 + y : y * 4294967296 + x;
      ec.set(k, (ec.get(k) || 0) + 1);
    }
    let bad = 0; for (const c of ec.values()) if (c !== 2) bad++;
    checks[name].stlEdgesNot2 = bad;
    checks[name].stlDuplicateVertexPositions = vid.length - id.size;
    if (bad) fail(`${name}: ${bad} arestas do STL não são compartilhadas por exatamente 2 triângulos (pinçamento)`);
  }

  /* 2 — halves do not interpenetrate (pins have clearance) */
  const inter = volume(ant.intersect(post));
  checks.halvesOverlapMm3 = +inter.toFixed(4);
  if (inter > 1e-3) fail(`metades se sobrepõem ${inter.toFixed(3)} mm³`);

  /* 3 — registration: protrusion of each male pin lies inside the mating hole */
  checks.pins = [];
  for (const pin of parts.pins) {
    const other = pin.maleHalf === 'ANT' ? post : ant;
    const sgn = pin.maleHalf === 'ANT' ? -1 : 1;             // protrusion side
    const protr = pin.male.trimByPlane([0, sgn, 0], 0);
    const outside = volume(protr.subtract(pin.hole));
    const inOther = volume(pin.male.intersect(other));
    const bm = bounds(pin.male), bh = bounds(pin.hole);
    const cm = [(bm.min[0] + bm.max[0]) / 2, (bm.min[2] + bm.max[2]) / 2], ch = [(bh.min[0] + bh.max[0]) / 2, (bh.min[2] + bh.max[2]) / 2];
    const off = Math.hypot(cm[0] - ch[0], cm[1] - ch[1]);
    const depthMargin = (bh.max[1] - bh.min[1]) - (bm.max[1] - bm.min[1] - 0.5);
    const r = { name: pin.name, d: pin.site.d, maleHalf: pin.maleHalf, holeHalf: pin.holeHalf, protrusionOutsideHoleMm3: +outside.toFixed(4), maleInsideOtherHalfMm3: +inOther.toFixed(4), axisOffsetMm: +off.toFixed(4), holeDeeperThanPinMm: +depthMargin.toFixed(2) };
    checks.pins.push(r);
    protr.delete();
    if (outside > 1e-3 || inOther > 1e-3) fail(`pino ${pin.name}: não encaixa no furo (${outside.toFixed(3)} / ${inOther.toFixed(3)} mm³)`);
    if (off > 0.01) fail(`pino ${pin.name}: furo desalinhado ${off.toFixed(3)} mm`);
    if (depthMargin < 0.3) fail(`pino ${pin.name}: furo raso`);
  }
  if (parts.pins[0].site.d === parts.pins[1].site.d) warnings.push('pinos com o mesmo Ø: o fechamento errado fica possível');

  /* 4 — tube bore coaxial with the stem axis, stop at the planned depth
     (long: closed distal end + coaxial core-wire exit hole) */
  const closed = force(ant.add(post), 'closed');
  const t = layout.tube;
  if (!t) {
    const dL = layout.distal, wh = dL.wireHole;
    const r = {};
    // end wall solid around the tip, off the axis (both halves)
    const zw = dL.distalFaceZ + 1.5;   // below the spew ring around the tip
    r.endWallSolid = [[4, 0.4], [-4, 0.4], [0, 3], [3, 3]].every(([x, y]) => contains(E, closed, [x, y, zw]) && contains(E, closed, [x, -y, zw]));
    r.tipCavityEmpty = !contains(E, closed, [0, 0.3, dL.tipZ + 2]);
    if (wh) {
      const rh = wh.d / 2;
      const fitsW = [];
      // slices in the end wall below the spew ring (ring reaches tipZ − land − grooveW)
      const zRing = dL.tipZ - p.land - p.grooveW;
      for (const z of [dL.distalFaceZ + wh.chamfer + 0.3, (dL.distalFaceZ + wh.chamfer + zRing) / 2]) {
        const cs = closed.slice(z);
        const polys = csPolys(cs);
        cs.delete();
        let best = null;
        for (const q of polys) {
          let A = 0, cx = 0, cy = 0;
          for (let i = 0; i < q.length; i++) {
            const a = q[i], c = q[(i + 1) % q.length], k = a[0] * c[1] - c[0] * a[1];
            A += k; cx += (a[0] + c[0]) * k; cy += (a[1] + c[1]) * k;
          }
          A /= 2; cx /= 6 * A; cy /= 6 * A;
          const rr = Math.sqrt(Math.abs(A) / Math.PI);
          if (Math.hypot(cx, cy) < 1 && (!best || rr < best.r)) best = { cx, cy, r: rr };
        }
        fitsW.push({ z: +z.toFixed(2), center: best ? [+best.cx.toFixed(4), +best.cy.toFixed(4)] : null, radius: best ? +best.r.toFixed(3) : null });
      }
      r.wireHoleFits = fitsW;
      r.wireHoleOpen = !contains(E, closed, [0, 0, dL.distalFaceZ + 1], 0.3) && !contains(E, closed, [0, 0, dL.tipZ - 1], 0.3);
      for (const f of fitsW) {
        if (!f.center || Math.hypot(f.center[0], f.center[1]) > 0.02) fail(`furo do fio fora do eixo em z=${f.z}`);
        else if (Math.abs(f.radius - rh) > 0.06) fail(`furo do fio com raio ${f.radius} ≠ ${rh.toFixed(3)} em z=${f.z}`);
      }
      if (!r.wireHoleOpen) fail('furo do fio obstruído');
    }
    checks.distal = r;
    if (!r.endWallSolid) fail('ponta distal do molde não está fechada');
    if (!r.tipCavityEmpty) fail('cavidade da ponta preenchida');
  } else {
    const rb = t.boreD / 2;
    const fits = [];
    for (const z of [t.distalFaceZ + p.boreChamfer + 1, (t.distalFaceZ + t.stopZ) / 2, t.stopZ - 1]) {
      const cs = closed.slice(z);
      const polys = csPolys(cs);
      cs.delete();
      // contour around the origin with the smallest area = the bore (area centroid, r = √(A/π))
      let best = null;
      for (const q of polys) {
        let A = 0, cx = 0, cy = 0;
        for (let i = 0; i < q.length; i++) {
          const a = q[i], c = q[(i + 1) % q.length], k = a[0] * c[1] - c[0] * a[1];
          A += k; cx += (a[0] + c[0]) * k; cy += (a[1] + c[1]) * k;
        }
        A /= 2; cx /= 6 * A; cy /= 6 * A;
        const rr = Math.sqrt(Math.abs(A) / Math.PI);
        if (Math.hypot(cx, cy) < 2 && (!best || rr < best.r)) best = { cx, cy, r: rr, n: q.length };
      }
      fits.push({ z, center: best ? [+best.cx.toFixed(4), +best.cy.toFixed(4)] : null, radius: best ? +best.r.toFixed(3) : null });
  }
  const xProbe = (t.stopFlats.xInner + rb) / 2;
  const stop = {
    boreEmptyBelowStop: !contains(E, closed, [xProbe, 0.3, t.stopZ - 0.5]) && !contains(E, closed, [-xProbe, -0.3, t.stopZ - 0.5]),
    flatSolidAboveStop: contains(E, closed, [xProbe, 0.3, t.stopZ + p.stopLen / 2]) && contains(E, closed, [-xProbe, -0.3, t.stopZ + p.stopLen / 2]),
    cementPassOpenAtAxis: !contains(E, closed, [0, 0.3, t.stopZ + p.stopLen / 2]),
    stopZ: t.stopZ, depthFromDistalFace: t.stopZ - t.distalFaceZ,
  };
  checks.tube = { boreFits: fits, stop };
  for (const f of fits) {
    if (!f.center || Math.hypot(f.center[0], f.center[1]) > 0.02) fail(`furo do dreno fora do eixo em z=${f.z}`);
    else if (Math.abs(f.radius - rb) > 0.06) fail(`furo do dreno com raio ${f.radius} ≠ ${rb.toFixed(3)} em z=${f.z}`);
  }
  if (!stop.boreEmptyBelowStop || !stop.flatSolidAboveStop || !stop.cementPassOpenAtAxis) fail('batente do dreno ausente ou no lugar errado');
  }

  /* 5 — articular dome: no vent / groove inside the cap cone (R + 2 mm) */
  const head = mold.head;
  const zone = domeZone(E, head, head.capDeg, head.radius + 2);
  const vDome = volume(parts.vents.intersect(zone));
  const gDome = volume(parts.grooves.intersect(zone));
  checks.dome = { capDeg: +head.capDeg.toFixed(2), ventsInDomeMm3: +vDome.toFixed(4), groovesInDomeMm3: +gDome.toFixed(4), ventAnglesDeg: layout.vents.map((v) => v.angleFromAxisDeg) };
  if (vDome > 1e-4) fail('respiro dentro da calota articular');
  if (gDome > 1e-4) fail('canal de rebarba dentro da calota articular');
  zone.delete();

  if (full) {
    /* 6 — minimum wall: cavity → every outside surface or hole */
    const b = bounds(parts.block);
    const big = box(E, b.min.map((v) => v - 5), b.max.map((v) => v + 5));
    const outside = force(big.subtract(parts.block), 'outside');
    const cats = {
      outerFaces: outside, boltHoles: parts.boltHoles, nutPockets: parts.nutPockets, pryNotches: parts.notches,
      pinHoles: parts.femaleHoles, engraving: parts.engraving,
    };
    const search = p.wall * 2;
    const walls = {};
    let minW = Infinity, where = null;
    let whereAt = null;
    for (const [k, m] of Object.entries(cats)) {
      if (!m) continue;
      const g = surfaceGap(parts.cavity, m, search);
      walls[k] = +g.dist.toFixed(3);
      if (g.dist < minW) { minW = g.dist; where = k; whereAt = g.at && g.at.map((v) => +v.toFixed(2)); }
    }
    checks.wall = { required: p.wall, min: +minW.toFixed(3), limitedBy: where, at: whereAt, byFeature: walls, note: `distância superfície-superfície (BVH, vértices + centroides dos dois lados), busca até ${search} mm; canal de rebarba, respiros e furo do dreno são ligados à cavidade de propósito e não entram` };
    if (minW < p.wall - 0.02) fail(`parede mínima ${minW.toFixed(2)} < ${p.wall} mm (${where})`);
    outside.delete(); big.delete();

    /* 7 — closing the halves reproduces the cavity (sealed test) */
    const plugs = force(union(E, [parts.bore, parts.chamfer, parts.vents, parts.grooves, parts.notches, parts.boltHoles, parts.nutPockets, parts.femaleHoles, parts.engraving]).subtract(parts.cavity), 'plugs');
    const sealed = force(closed.add(plugs), 'sealed');
    const voidM = force(parts.block.subtract(sealed), 'void');
    const vVoid = volume(voidM), vCav = volume(parts.cavity), vCem = volume(parts.cement);
    const extra = volume(voidM.subtract(parts.cavity)), missing = volume(parts.cavity.subtract(voidM));
    const vComps = voidM.decompose().filter((c) => Math.abs(volume(c)) >= 0.01);
    checks.cavity = {
      voidMm3: +vVoid.toFixed(1), cavityMm3: +vCav.toFixed(1), cementAboveStopMm3: +vCem.toFixed(1),
      voidVsCementPct: +(100 * (vVoid - vCem) / vCem).toFixed(3), voidMinusCavityMm3: +extra.toFixed(3), cavityMinusVoidMm3: +missing.toFixed(3),
      voidComponents: vComps.length, stopFlatsTakeMm3: +(vCem - vCav).toFixed(1),
    };
    vComps.forEach((c) => c.delete());
    if (Math.abs(vVoid - vCem) / vCem > 0.01) fail(`cavidade ${vVoid.toFixed(0)} ≠ cimento ${vCem.toFixed(0)} mm³ (>1%)`);
    if (extra > 0.5 || missing > 0.5) fail(`cavidade fechada difere do positivo (${extra.toFixed(2)} / ${missing.toFixed(2)} mm³)`);
    if (checks.cavity.voidComponents !== 1) fail(`cavidade fechada em ${checks.cavity.voidComponents} partes`);

    /* 8 — mirror: POST reflected through y = 0 has the same cavity imprint
       (cavity ∩ each half's slab); measured as imprint volumes */
    const slabA = box(E, [b.min[0] - 1, 0, b.min[2] - 1], [b.max[0] + 1, b.max[1] + 1, b.max[2] + 1]);
    const slabP = box(E, [b.min[0] - 1, b.min[1] - 1, b.min[2] - 1], [b.max[0] + 1, 0, b.max[2] + 1]);
    const impA = volume(voidM.intersect(slabA)), impP = volume(voidM.intersect(slabP));
    checks.mirror = { cavityInAntMm3: +impA.toFixed(1), cavityInPostMm3: +impP.toFixed(1), diffPct: +(100 * (impA - impP) / ((impA + impP) / 2)).toFixed(3) };
    if (Math.abs(impA - impP) / ((impA + impP) / 2) > 0.005) fail('as duas meias-cavidades não são espelho (>0,5%)');
    slabA.delete(); slabP.delete(); voidM.delete(); sealed.delete(); plugs.delete();

    /* 9 — core wire: stays in cement / tube; cement cover to the mold */
    if (mold.wire) {
      const C = toArrays(closed);
      const bvh = buildBVH(C.positions, C.indices);
      const pl = mold.wire.polyline;
      let cover = Infinity, at = null;
      for (let i = 0; i + 1 < pl.length; i++) {
        const a = pl[i], c = pl[i + 1], L = Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]);
        for (let s2 = 0; s2 <= L; s2 += 0.25) {
          const q = [a[0] + (c[0] - a[0]) * s2 / L, a[1] + (c[1] - a[1]) * s2 / L, a[2] + (c[2] - a[2]) * s2 / L];
          if (q[2] < (t ? t.stopZ : layout.distal.wireCheckFromZ)) continue;
          const r = closestPoint(bvh, q, 30);
          const cv = (r ? r.dist : 30) - mold.wire.d / 2;
          if (cv < cover) { cover = cv; at = q.map((v) => +v.toFixed(2)); }
        }
      }
      checks.wire = {
        d: mold.wire.d, cementCoverMinMm: +cover.toFixed(2), at,
        note: t ? 'cobertura de cimento entre o fio (eixo do positivo) e o molde, acima do batente; o fio fica dentro do cimento e do dreno: não precisa de saída nem de apoio no molde'
          : `C longo: cobertura de cimento entre o fio e o molde acima da ponta arredondada (z ≥ ${layout.distal.wireCheckFromZ}); abaixo dela o fio entra no furo de saída coaxial`,
      };
      if (cover <= 0.5) fail('fio de aço quase encosta no molde');
    }
  }
  closed.delete();
  return { ok: failures.length === 0, failures, warnings, checks };
}
