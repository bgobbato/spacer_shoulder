/* The positive (spacer shape) as the mold sees it.

   Source: spacer/positivo (read-only). The positive STL + JSON of model C are
   loaded as-is (node: from disk; browser: fetched). z ∈ [0, batenteZ] of the
   positive is the SPACE of the chest-tube end, not cement: the mold replaces
   it with its own guide bore and stop. The cement part is the positive above
   the stop plane z = batenteZ.

   LONG variant (C longo, meta.distal.variant = long): no tube; the whole
   positive is cement, ending in a rounded tip at z ≈ 0. */

import { DEG, fromArrays, force, bake, volume, sliceAtY } from './geom.mjs';
import { parseSTL } from './stl.mjs';

export function positiveFromSTL(E, buf) {
  const arr = parseSTL(buf);
  const m = fromArrays(E, arr.positions, arr.indices, 'positive STL');
  return { manifold: m, arrays: arr };
}

/* Head / tube / wire description pulled out of the positive JSON. */
export function describePositive(json) {
  const meta = json.meta || json;
  const head = meta.head || meta.headInfo;
  const hi = meta.headInfo || {};
  const capDeg = Math.max(head.capAngleDeg || 0, hi.sphereCapDeg || 0);
  const long = !!(meta.distal && meta.distal.variant === 'long');
  return {
    model: json.model || 'C',
    headD: json.headD || meta.headD,
    distal: long ? 'long' : 'tube',
    long: long ? { totalLenMm: meta.distal.totalLenMm, stemD: meta.distal.stemD, tipR: meta.distal.tip.radiusMm } : null,
    head: { center: head.center, radius: head.radius, axis: head.axis, capDeg },
    tube: long ? null : {
      odMm: meta.tube.odMm,
      fr: meta.tube.fr,
      stopZ: meta.tube.batenteZ,
      flareTopZ: meta.tube.flareTopZ,
      stemAboveFlareD: meta.tube.stemAboveFlareD,
    },
    wire: meta.coreWire ? { d: meta.coreWire.diameterMm, polyline: meta.coreWire.polyline, bendDeg: meta.coreWire.bendDeg } : null,
    volumeMm3: json.validation && json.validation.volume ? json.validation.volume.mm3 : null,
  };
}

/* Radius of an (almost) circular section of m at height z, from its area. */
export function sectionRadius(m, z) {
  const cs = m.slice(z);
  const a = cs.area();
  cs.delete();
  return Math.sqrt(a / Math.PI);
}

/* Cement solid = positive above the stop plane. If the tube OD differs from
   the OD the positive was built for, the short flare from the tube end up to
   the stem is rebuilt for the real OD (same flare angle). */
export function cementSolid(E, positive, desc, p) {
  if (desc.distal === 'long') {
    // no tube: the whole positive is cement
    const c = force(positive.translate([0, 0, 0]), 'cement(long)');
    return { cement: c, info: { zStop: null, long: true, flareRebuilt: false, warnings: [] } };
  }
  const zStop = desc.tube.stopZ;
  const od = p.tubeODmm;
  const info = { zStop, positiveOD: desc.tube.odMm, tubeOD: od, flareRebuilt: false, warnings: [] };
  if (Math.abs(od - desc.tube.odMm) <= 0.05) {
    const c = force(positive.trimByPlane([0, 0, 1], zStop), 'cement');
    info.flareBaseD = desc.tube.odMm;
    return { cement: c, info };
  }
  // rebuild the flare
  const zCut = desc.tube.flareTopZ + 0.6;
  const rS = sectionRadius(positive, zCut) - 0.01;
  const r0 = od / 2;
  let prof;
  let zTop = zCut;
  if (r0 < rS) {
    const L = (rS - r0) / Math.tan(p.flareDeg * DEG);
    zTop = Math.max(zCut, zStop + L);
    prof = [[0, zStop], [r0, zStop], [rS, zStop + L], [rS, zTop + 0.3], [0, zTop + 0.3]];
  } else {
    prof = [[0, zStop], [rS, zStop], [rS, zTop + 0.3], [0, zTop + 0.3]];
    info.warnings.push(`tubo Ø${od.toFixed(2)} ≥ haste Ø${(2 * rS).toFixed(2)}: o dreno fica mais grosso que a haste de cimento logo acima dele`);
  }
  const upper = positive.trimByPlane([0, 0, 1], zTop);
  const flare = E.Manifold.revolve(new E.CrossSection([prof], 'Positive'), 128);
  const c = force(upper.add(flare), 'cement(rebuilt flare)');
  upper.delete(); flare.delete();
  Object.assign(info, { flareRebuilt: true, flareBaseD: Math.min(od, 2 * rS), flareTopZ: zTop, stemDAtFlareTop: 2 * rS });
  return { cement: c, info };
}

/* Rotation (row-major) taking +Z onto an axis lying in the XZ plane. */
export function rotZToXZ(axis) {
  const b = Math.atan2(axis[0], axis[2]);
  const c = Math.cos(b), s = Math.sin(b);
  return [c, 0, s, 0, 1, 0, -s, 0, c];
}

/* Solid cone-sector around the head axis: all points within `deg` of the axis
   (seen from the head centre) and closer than `rOut` to the centre. Used to
   prove no vent / groove touches the articular dome. */
export function domeZone(E, head, deg, rOut) {
  const pts = [[0, 0]];
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const t = (deg * DEG * i) / n;
    pts.push([rOut * Math.sin(t), rOut * Math.cos(t)]);
  }
  // CCW
  const cs = new E.CrossSection([pts.slice().reverse()], 'NonZero');
  const rev = E.Manifold.revolve(cs, 128);
  return bake(E, rev, rotZToXZ(head.axis), head.center, 'domeZone');
}

/* Vent sites on the positive surface: the deepest points (max |y|) of each
   half's cavity outside the articular cap, one on the head rim and one on
   the flat face of the lateral fin. Returned for the +Y side; mirror for −Y. */
export function findVentSites(arrays, desc, p) {
  const P = arrays.positions;
  const h = desc.head;
  const limit = h.capDeg + p.domeMarginDeg;
  const cosLim = Math.cos(limit * DEG);
  let best = null;
  let finBest = -Infinity;
  const nV = P.length / 3;
  for (let i = 0; i < nV; i++) {
    const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
    if (desc.tube && z < desc.tube.stopZ + 1) continue;
    const d = [x - h.center[0], y - h.center[1], z - h.center[2]];
    const l = Math.hypot(d[0], d[1], d[2]);
    const c = (d[0] * h.axis[0] + d[1] * h.axis[1] + d[2] * h.axis[2]) / (l || 1);
    if (l < h.radius + 1 && l > h.radius * 0.6 && c < cosLim) {
      if (!best || y > best[1]) best = [x, y, z];
    }
    if (x < -9 && y > finBest) finBest = y;
  }
  // fin: centroid of the vertices on its flat +y face
  let sx = 0, sz = 0, cnt = 0;
  for (let i = 0; i < nV; i++) {
    const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
    if (x < -9 && y > finBest - 0.02) { sx += x; sz += z; cnt++; }
  }
  const sites = [];
  if (best) sites.push({ name: 'head-rim', x: best[0], z: best[2], y: best[1], angleFromAxisDeg: angleFromAxis(best, h) });
  if (cnt) {
    const f = [sx / cnt, finBest, sz / cnt];
    sites.push({ name: 'fin', x: f[0], z: f[2], y: f[1], angleFromAxisDeg: angleFromAxis(f, h) });
  }
  return sites;
}

function angleFromAxis(q, h) {
  const d = [q[0] - h.center[0], q[1] - h.center[1], q[2] - h.center[2]];
  const l = Math.hypot(d[0], d[1], d[2]) || 1;
  return Math.acos((d[0] * h.axis[0] + d[1] * h.axis[1] + d[2] * h.axis[2]) / l) / DEG;
}

export { volume, sliceAtY };
