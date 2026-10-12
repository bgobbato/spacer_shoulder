/* MODEL C — "Cogumelo com aleta" (mushroom head with a lateral fin).

   Archetype: the Subiton / Biofix-like preformed shoulder spacer
   (referencia/subiton-espaciador_hombro_n.jpg, images.jpeg and the line
   drawing with the 15 cm ruler in images (2).jpeg). Proportions were
   measured in pixels on that drawing and normalised to a 150 mm spacer;
   nothing is copied from the product's dimensions — only the archetype:
     - mushroom dome: a sphere segment ~0.45·D tall with a thick, rounded rim
       (the drawing's flat face sits 0.086·R below the sphere centre);
     - short conical neck that flares medially from the stem into the head base;
     - LATERAL FIN from the proximal stem up to under the lateral rim of the
       dome, carrying 3 suture holes through along Y;
     - a SHORT proximal stem only: the long distal stem of the photos is a
       CHEST TUBE filled with cement (Klosterman technique, PMC7917196;
       surgeon decision 26/Sep/2026 — printer is a Bambu Lab A1 mini, 180 mm
       cube, so the molded part must stay short).

   Tube coupling (distal end of this positive):
     z ∈ [0, couplingLen]  cylinder of Ø = tube OD (tubeFr / 3 mm), coaxial
                           with the stem axis: the mold channel that holds
                           the tube end coaxial while the proximal part is cast
     z = couplingLen       the BATENTE plane: the tube end stops here and the
                           cast cement closes over it
     above                 a short conical flare (shoulderDeg from the axis,
                           ≤ 35° so it is not a notch) up to the proximal stem
   A continuous core wire (default Ø 3.2 mm) runs along the stem axis through
   tube and proximal part; the solid stays FULL (the mold system decides how
   the wire is held) — meta.coreWire gives its polyline.

   VARIANT distal = 'long' ("C longo", surgeon 29/Sep/2026): NO chest tube.
   The same head / neck / fin / body sit higher so the whole spacer is
   longLen (default 150 mm, capped by the A1 mini bed: the mold half must
   print straight within 180 mm) from the distal tip to the dome top. The
   stem keeps the SAME profile: the proximal cone (rBot → rTop) is unchanged
   and below it the stem continues as a straight cylinder of Ø 2·rBot (no
   spigot, shoulder or step) down to a hemispherical tip at z = 0. The core
   wire runs from the tip up the axis to the neck origin and bends into the
   neck as in the short variant.

   Frame (spacer/lib contract): mm; stem axis = +Z; coupling end (distal) at z = 0;
   +X = MEDIAL (head side); Y = anterior–posterior; y = 0 is the mold parting
   plane and the solid is mirror-symmetric about it; demold along ±Y.

   Construction (the foundation's recommended pattern):
     body = levelSet( smin( stem, neck, fin, head proxy ) )   // every junction filleted
     solid = body ∪ exact polished sphereSegment head − Y suture holes
   Every SDF piece is Y-symmetric with a distance that grows with |y| along
   any Y line (the stem is a solid of revolution about Z, whose radius grows
   with |y|), and smin is monotone in both arguments, so the blended body is
   Y-demoldable. Meshing: levelSet vertices are snapped onto the exact
   surface, and a mesh whose quick Y-demold check trips (µm ripples on
   grazing fillets) is re-meshed on a slightly different grid.

   Head proxy: unlike headProxySDF() (flat base only), this model uses the
   EXACT signed distance of the whole filleted head (dome + rim torus + base),
   shrunk by `proxyInset`, so the fin that climbs to the rim torus also gets a
   fillet there instead of a concave crease.
*/

import {
  DEG, headAxis, add, scale, sphereSegment, cylinderY, unionAll,
  sdCapsule, smin, sdPolygon2, sdExtrudeY, levelSetSolid, bbox,
  toMeshArrays, getEngine, statusName,
} from '../common.mjs';
import { validate } from '../validate.mjs';

/* Snap the levelSet vertices onto the true zero surface of f (Newton steps
   along the numeric gradient; vertices ON y = 0 move only in X/Z, so mirror
   symmetry holds). levelSet places vertices by linear interpolation of f
   along grid edges, a few hundredths of a mm inside a curved surface; at a
   Y-silhouette (the outline seen in the front view) a vertex left inside
   while its neighbours sit on the surface makes a ~0.05 mm dent that the
   Y-demold check rightly reads as an undercut. Guard: a move that turns any
   incident triangle by more than maxTurnDeg (sliver flips) is undone. */
function snapToSurface(m, f, { iters = 4, maxMove = 0.2, maxTurnDeg = 25, tolerance = 0.02 } = {}) {
  const { positions, indices } = toMeshArrays(m);
  const P0 = Float64Array.from(positions);
  const Q = Float64Array.from(positions);
  const h = 1e-3;
  const nV = positions.length / 3;
  for (let v = 0; v < nV; v++) {
    const i = v * 3;
    const onPlane = P0[i + 1] === 0;
    const q = [P0[i], P0[i + 1], P0[i + 2]];
    for (let k = 0; k < iters; k++) {
      const d = f(q);
      if (Math.abs(d) < 1e-5) break;
      const gx = (f([q[0] + h, q[1], q[2]]) - f([q[0] - h, q[1], q[2]])) / (2 * h);
      const gy = onPlane ? 0 : (f([q[0], q[1] + h, q[2]]) - f([q[0], q[1] - h, q[2]])) / (2 * h);
      const gz = (f([q[0], q[1], q[2] + h]) - f([q[0], q[1], q[2] - h])) / (2 * h);
      const g2 = gx * gx + gy * gy + gz * gz;
      if (!(g2 > 1e-6)) break;
      q[0] -= d * gx / g2; q[1] -= d * gy / g2; q[2] -= d * gz / g2;
    }
    if (Math.hypot(q[0] - P0[i], q[1] - P0[i + 1], q[2] - P0[i + 2]) > maxMove) continue;
    Q[i] = q[0]; Q[i + 1] = onPlane ? 0 : q[1]; Q[i + 2] = q[2];
  }
  const nrm = (A, t) => {
    const a = indices[t * 3] * 3, b = indices[t * 3 + 1] * 3, c = indices[t * 3 + 2] * 3;
    const ux = A[b] - A[a], uy = A[b + 1] - A[a + 1], uz = A[b + 2] - A[a + 2];
    const vx = A[c] - A[a], vy = A[c + 1] - A[a + 1], vz = A[c + 2] - A[a + 2];
    return [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
  };
  const cosMax = Math.cos(maxTurnDeg * DEG);
  let reverted = 0;
  for (let pass = 0; pass < 4; pass++) {
    let changed = 0;
    for (let t = 0; t < indices.length / 3; t++) {
      const n0 = nrm(P0, t), n1 = nrm(Q, t);
      const l0 = Math.hypot(...n0), l1 = Math.hypot(...n1);
      if (l0 < 1e-12) continue;
      const c = l1 < 1e-12 ? -1 : (n0[0] * n1[0] + n0[1] * n1[1] + n0[2] * n1[2]) / (l0 * l1);
      if (c >= cosMax) continue;
      for (let k = 0; k < 3; k++) {
        const i = indices[t * 3 + k] * 3;
        if (Q[i] !== P0[i] || Q[i + 1] !== P0[i + 1] || Q[i + 2] !== P0[i + 2]) {
          Q[i] = P0[i]; Q[i + 1] = P0[i + 1]; Q[i + 2] = P0[i + 2]; changed++;
        }
      }
    }
    reverted += changed;
    if (!changed) break;
  }
  let worst = 0;
  for (let i = 0; i < Q.length; i += 3) worst = Math.max(worst, Math.hypot(Q[i] - P0[i], Q[i + 1] - P0[i + 1], Q[i + 2] - P0[i + 2]));
  // rebuild with a small tolerance: manifold collapses the levelSet sliver
  // triangles (edges ≪ tol) that otherwise fold at front-view silhouettes
  const { Manifold, Mesh } = getEngine();
  const mesh = new Mesh({ numProp: 3, vertProperties: Float32Array.from(Q), triVerts: indices, tolerance });
  mesh.merge();
  const out = new Manifold(mesh);
  if (statusName(out) !== 'NoError') throw new Error(`modelC body (snapped): ${statusName(out)}`);
  out.getMesh();
  return { manifold: out, reverted, worst };
}


/* Chest-tube OD in mm from the French gauge (3 Fr = 1 mm). */
export const frToMm = (fr) => fr / 3;
export const TUBE_FR_OPTIONS = [24, 28, 32, 34];   // capped at 34 Fr like spacer/lib (params.js tubeFr range)

export const NAME = 'C';
export const DESCRIPTION = 'Cogumelo com aleta: calota esférica ~0,45·D com borda grossa arredondada, colo cônico curto, '
  + 'aleta lateral com 3 furos de sutura (Y), haste proximal curta terminando no acoplamento do dreno de tórax (haste distal = dreno)';

export const DEFAULTS = {
  distal: 'tube',     // 'tube' = C curto + dreno (proximal part + chest-tube coupling) | 'long' = C longo, one cement piece, no tube
  longLen: 150,       // mm, 'long' only: distal tip (z = 0) to dome top. ≤ 150: the mold half must fit the A1 mini bed straight
  headD: 48,          // mm, head sphere diameter
  headHD: 0.45,       // sphere-segment height / D  (h = R − cut; locked range 0.37–0.63)
  rimFillet: 4,       // mm, rounded thick rim of the mushroom (torus between dome and flat base)
  nsDeg: 135,         // neck–shaft angle (head axis tilted 180 − NSA toward +X)
  headOffset: 6,      // mm, head-sphere centre medial (+X) of the stem axis (drawing: 6.0)
  proxLen: 110,       // mm, coupling end (z = 0) to the top of the dome (positive length along Z)
  stemTopD: 12,       // mm, proximal stem Ø under the neck (raised to stemBotD if smaller); ≤ reamerD
  stemBotD: 11.5,     // mm, proximal stem Ø just above the tube flare (raised to tube OD + tubeClear if smaller)
  tubeClear: 2,       // mm, stem Ø above the flare ≥ tube OD + tubeClear (1 mm flare step per side at 2)
  reamerD: 12,        // mm, canal Ø the stem must enter (final reamer); stem Ø above it → warning (SPEC V7)
  tubeFr: 28,         // chest tube gauge, Fr (OD = Fr/3 mm); offer 24 / 28 / 32 / 34
  couplingLen: 15,    // mm, length of the tube-OD cylinder (z = 0 … couplingLen); batente at its top
  shoulderDeg: 30,    // flare from tube OD to the stem, angle from the stem axis (≤ 35: not a notch)
  rootFillet: 1,      // mm, tiny round at the flare root (keeps the tube end square-seated)
  coreWireD: 3.2,     // mm, continuous core wire along the stem axis (NOT subtracted; reported)
  coreCover: 4,       // mm, minimum radial cement around the wire; the wire ends where this would be lost
  neckDropR: 1.0,     // neck starts on the stem axis this many head radii below the head centre
  neckFrac: 0.40,     // neck radius at the head base / R
  finT: 8,            // mm, fin thickness along Y (≥ 8)
  finEdgeR: 3.8,      // mm, rounding of the fin's edges (< finT/2): near-round, no flat band parallel to Y at the fin's top/outer edge
  finTopDrop: 1.5,    // mm, fin top at the hole column sits this far below the head's lateral extreme
  finTail: 0,         // mm, stem top sphere centre this far below the fin's rounded lower end
  finTaper: 14,       // mm, the fin's lower edge runs down the lateral stem this far (photo: fin tapers into the stem)
  sutureHoles: 0,     // 0 | 3 suture holes through the fin along Y
  holeD: 2.5,         // mm, suture hole Ø
  holeEdge: 6.25,     // mm, cement from each hole to the fin's free edge (≥ 5; > 6 keeps the 6 mm thickness rule)
  holeSpacing: 9,     // mm, hole centre-to-centre (cement between holes = spacing − holeD ≥ 6: checked)
  holeClear: 0.75,    // mm, hole rim kept this far outside any fillet (holes sit in the flat fin face)
  fillet: 3,          // mm, smin blend: stem/neck ↔ fin
  neckFillet: 5,      // mm, smin blend: stem ↔ neck (medial flare)
  neckStartFrac: 0.7, // neck radius where it leaves the stem axis / stem top radius (< 1: no smin swelling)
  headFillet: 4,      // mm, smin blend: body ↔ head (neck/fin → base and rim)
  baseInset: 0.3,     // mm, head proxy base raised above the real base (fillet crossing angle)
  proxyInset: 0.3,    // mm, head proxy dome/rim shrunk inside the polished head (0.1 let the fin blend graze the rim torus: slivers)
  edge: 0.6,          // mm, levelSet edge length (0.7 left sporadic 0.07 mm dents at the fin silhouette)
};

export const RANGES = {
  longLen: [120, 150],
  headD: [40, 58],
  headHD: [0.37, 0.63],
  rimFillet: [2, 6],
  nsDeg: [125, 140],
  headOffset: [0, 10],
  proxLen: [90, 140],   // below ~86 mm a 58 mm head leaves < 10 mm of stem between flare and neck
  stemTopD: [10, 18],
  stemBotD: [10, 18],
  tubeFr: [24, 34],
  tubeClear: [2, 4],
  reamerD: [8, 18],
  couplingLen: [8, 25],
  shoulderDeg: [15, 35],
  rootFillet: [0.5, 2],
  coreWireD: [2, 4],
  coreCover: [3, 8],
  finTaper: [0, 25],
  neckDropR: [0.6, 1.4],
  neckFrac: [0.3, 0.5],
  finT: [8, 14],
  finEdgeR: [3, 5],
  finTopDrop: [0, 6],
  finTail: [0, 20],
  sutureHoles: [0, 3],
  holeD: [2, 3.5],
  holeEdge: [6, 10],
  holeSpacing: [8, 12],  // bridge = spacing − holeD must also be ≥ 6 (build refuses otherwise)
  fillet: [2, 6],
  neckFillet: [2, 10],
  neckStartFrac: [0.5, 1],
  headFillet: [2, 8],
  edge: [0.4, 0.7],
  proxyInset: [0.1, 0.6],
};

/* Exact 2D SDF (negative inside) of the region {r² + h² ≤ Rc², h ≥ cc}
   in the meridian half-plane (r ≥ 0). Convex, so the projection rules are exact. */
function sdCapProfile(r, h, Rc, cc) {
  const ac = Math.sqrt(Math.max(0, Rc * Rc - cc * cc));
  const q = Math.hypot(r, h);
  if (q <= Rc && h >= cc) return Math.max(q - Rc, cc - h);
  if (h < cc && r <= ac) return cc - h;
  if (Math.atan2(r, h) <= Math.atan2(ac, cc) && q > Rc) return q - Rc;
  return Math.hypot(r - ac, h - cc);
}

/* Exact SDF of the filleted head (sphere R, base plane at `cut`, rim torus
   rho), shrunk by `inset`. filleted = (cap eroded by rho) dilated by rho. */
function headSDF(C, R, a, cut, rho, inset = 0, baseInset = inset) {
  const Rc = R - rho, cc = cut + (baseInset - inset) + rho;   // base plane ends up at cut + baseInset
  return (p) => {
    const dx = p[0] - C[0], dy = p[1] - C[1], dz = p[2] - C[2];
    const hh = dx * a[0] + dy * a[1] + dz * a[2];
    const rr = Math.sqrt(Math.max(0, dx * dx + dy * dy + dz * dz - hh * hh));
    return sdCapProfile(rr, hh, Rc, cc) - rho + inset;
  };
}

/* Fin: 2D core polygon (x, z) dilated by Rc (rounded outline), extruded along
   Y to total thickness t with edges rounded by e. Negative inside. */
function finSDF(core, Rc, t, e) {
  const h = t / 2;
  return (p) => {
    const d2 = sdPolygon2(p[0], p[2], core) - Rc;
    return sdExtrudeY(d2 + e, p[1], h - e) - e;
  };
}

/* 2D convex hull (monotone chain), points [x, z]; returns CCW polygon. */
function hull2(pts) {
  const P = pts.map((q) => q.slice()).sort((u, v) => u[0] - v[0] || u[1] - v[1]);
  const cr = (o, u, v) => (u[0] - o[0]) * (v[1] - o[1]) - (u[1] - o[1]) * (v[0] - o[0]);
  const lo = [], up = [];
  for (const q of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = P.length - 1; i >= 0; i--) { const q = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  lo.pop(); up.pop();
  return lo.concat(up);
}

export function derive(p) {
  const R = p.headD / 2;
  const beta = (180 - p.nsDeg) * DEG;
  const a = headAxis(p.nsDeg);                         // (sin β, 0, cos β)
  const wLat = [-Math.cos(beta), 0, Math.sin(beta)];   // in the base plane, toward the lateral rim
  const cut = R * (1 - 2 * p.headHD);
  const rho = p.rimFillet;
  const hc = cut + rho;
  const ac = Math.sqrt((R - rho) ** 2 - hc ** 2);      // flat-base radius = torus-centre radius
  const thetaS = Math.atan2(ac, hc);                   // polished sphere ends here

  // head centre: medial offset, dome top at z = proxLen (short) or longLen (long)
  const long = p.distal === 'long';
  const extra = long ? p.longLen - p.proxLen : 0;      // whole proximal geometry shifted up by this
  const zTopRel = beta <= thetaS ? R : hc * Math.cos(beta) + ac * Math.sin(beta) + rho;
  const C = [p.headOffset, 0, p.proxLen + extra - zTopRel];
  const B = add(C, scale(a, cut));                     // base-disc centre
  const K = add(add(C, scale(a, hc)), scale(wLat, ac)); // lateral rim-torus centre (y = 0)
  const latExtreme = [K[0] - rho, 0, K[2]];            // most lateral point of the head (y = 0)

  const tubeOD = frToMm(p.tubeFr);
  const rOD = tubeOD / 2;
  const rBot = Math.max(p.stemBotD, tubeOD + p.tubeClear) / 2;   // ≥ tubeClear/2 flare step all round
  const rTop = Math.max(p.stemTopD / 2, rBot);
  const zS = C[2] - p.neckDropR * R;                   // neck leaves the stem axis here
  const S = [0, 0, zS];
  const neckR = p.neckFrac * R;
  const N = add(B, scale(a, 1.0));                     // neck end 1 mm inside the head

  const neckR0 = p.neckStartFrac * rTop;

  const rHole = p.holeD / 2;
  const Rc = rHole + p.holeEdge;                       // fin outline radius around each hole centre
  const nH = 3;                                        // the fin keeps its 3-hole outline even with 0 holes
  const zH = [];
  const z1 = latExtreme[2] - p.finTopDrop - Rc;
  for (let i = 0; i < nH; i++) zH.push(z1 - i * p.holeSpacing);
  // the stem's straight lateral edge runs up to where the fin's rounded lower end starts
  const zStemTop = Math.max(zS, zH[nH - 1] - Rc - p.finTail);
  const stemTop = [0, 0, zStemTop];

  // tube coupling + flare + proximal stem, as an (r, z) profile revolved about Z
  const phi = p.shoulderDeg * DEG;
  const zBat = p.couplingLen + extra;                  // batente plane (tube end); 'long': where it would be
  const zFlare = zBat + (rBot - rOD) / Math.tan(phi);  // flare meets the stem cone (same cone in both variants)
  const stemProfile = long
    ? stemProfileLongRZ({ rBot, rTop, zFlare, zStemTop })
    : stemProfileRZ({ rOD, rBot, rTop, zBat, zFlare, zStemTop, phi, rf: p.rootFillet });

  return { R, beta, a, wLat, cut, rho, hc, ac, thetaS, zTopRel, C, B, K, latExtreme,
    tubeOD, rOD, rBot, rTop, zS, S, neckR, neckR0, N, rHole, Rc, nH, zH, zStemTop, stemTop,
    phi, zBat, zFlare, stemProfile, long, extra };
}

/* Quadratic Bézier between two tangent points around a corner (round-ish fillet). */
function cornerRound(P0, Pc, P1, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * P0[0] + 2 * u * t * Pc[0] + t * t * P1[0], u * u * P0[1] + 2 * u * t * Pc[1] + t * t * P1[1]]);
  }
  return out;
}

/* Closed (r, z) polygon of the stem, MIRRORED to r < 0 so the axis is not an
   edge (sdPolygon2 of |r| is then the exact revolved distance). Bottom face at
   z = −2 (the solid is trimmed at z = 0 afterwards: exact flat coupling end). */
function stemProfileRZ({ rOD, rBot, rTop, zBat, zFlare, zStemTop, phi, rf }) {
  const t = rf * Math.tan(phi / 2);                    // fillet tangent length at the flare root
  const dir = [Math.sin(phi), Math.cos(phi)];          // flare direction (r, z)
  const root = [rOD, zBat];
  const half = [[rOD, -2]];
  half.push(...cornerRound([rOD, zBat - t], root, [rOD + dir[0] * t, zBat + dir[1] * t], 6));
  // convex knee flare → stem cone, rounded over 1.5 mm
  const knee = [rBot, zFlare];
  const coneDir = (() => { const dr = rTop - rBot, dz = zStemTop - zFlare, l = Math.hypot(dr, dz); return [dr / l, dz / l]; })();
  const kt = 1.5;
  half.push(...cornerRound([knee[0] - dir[0] * kt, knee[1] - dir[1] * kt], knee, [knee[0] + coneDir[0] * kt, knee[1] + coneDir[1] * kt], 6).slice(0));
  // rounded top (hemisphere of rTop), buried in the neck / fin
  for (let i = 0; i <= 12; i++) {
    const th = (i / 12) * (Math.PI / 2);
    half.push([rTop * Math.cos(th), zStemTop + rTop * Math.sin(th)]);
  }
  half[half.length - 1][0] = 0;
  const mirror = half.slice(0, -1).reverse().map(([r, z]) => [-r, z]);
  return half.concat(mirror);
}

/* 'long' variant: hemispherical tip (radius rBot, pole at z = 0) → straight
   cylinder Ø 2·rBot → the SAME cone rBot → rTop from zFlare to zStemTop as the
   short variant → rounded top. Mirrored to r < 0 like stemProfileRZ; the arc
   starts one step off the pole so the mirror has no duplicate vertex (the
   chord there lies 0.01 mm inside the sphere). */
function stemProfileLongRZ({ rBot, rTop, zFlare, zStemTop }) {
  const half = [];
  const n = 24;
  for (let i = 1; i <= n; i++) {
    const th = -Math.PI / 2 + (i / n) * (Math.PI / 2);
    half.push([rBot * Math.cos(th), rBot + rBot * Math.sin(th)]);
  }
  half.push([rBot, zFlare]);
  for (let i = 0; i <= 12; i++) {
    const th = (i / 12) * (Math.PI / 2);
    half.push([rTop * Math.cos(th), zStemTop + rTop * Math.sin(th)]);
  }
  half[half.length - 1][0] = 0;
  const mirror = half.slice(0, -1).reverse().map(([r, z]) => [-r, z]);
  return half.concat(mirror);
}

function bodySDF(p, g, xh) {
  const core = finCore(p, g, xh);
  const fin = finSDF(core, g.Rc, p.finT, p.finEdgeR);
  // dome/torus shrunk 0.1 mm; base raised 0.3 mm so the fillet crosses the real
  // base at ~20° (a near-tangent crossing gives noisy Y-demold rays)
  const proxy = headSDF(g.C, g.R, g.a, g.cut, g.rho, p.proxyInset, p.baseInset);
  const f = (q) => {
    const dStem = sdPolygon2(Math.hypot(q[0], q[1]), q[2], g.stemProfile);
    const dNeck = sdCapsule(q, g.S, g.N, g.neckR0, g.neckR);
    let d = smin(dStem, dNeck, p.neckFillet);
    d = smin(d, fin(q), p.fillet);
    return smin(d, proxy(q), p.headFillet);
  };
  return { f, core };
}

/* Fin core = rectangle from the hole column (x = xh) to a medial line inside
   the stem/neck (xa), between the top and bottom hole heights; dilated by Rc
   it gives a rounded plate whose lateral edge is xh − Rc, top zH[0] + Rc
   (just under the head's lateral rim) and bottom zH[2] − Rc (on the stem). */
function finCore(p, g, xh) {
  const xa = Math.min(0, g.rTop - g.Rc - 0.5);
  const zt = g.zH[0], zb = g.zH[g.nH - 1];
  const pts = [[xh, zt], [xh, zb], [xa, zb], [xa, zt]];
  // lower edge slants down into the lateral stem (the photos' fin tapers into the stem):
  // the dilated outline reaches 0.5 mm beyond the stem's lateral edge at zb − finTaper
  if (p.finTaper > 0) pts.push([-g.rTop - 0.5 + g.Rc, zb - p.finTaper]);
  return hull2(pts);
}

/* Most medial hole column x such that every hole rim (+ holeClear) lies on the
   flat fin face: just above the face (y = finT/2 + 0.05) the body is empty. */
function placeHoles(p, g) {
  const ring = g.rHole + p.holeClear;
  const yT = p.finT / 2 + 0.05;
  for (let xh = Math.min(-2, g.latExtreme[0]); xh > -40; xh -= 0.25) {
    const { f } = bodySDF(p, g, xh);
    let ok = true;
    for (const z of g.zH) {
      for (let k = 0; k < 24 && ok; k++) {
        const t = (k / 24) * 2 * Math.PI;
        const x = xh + ring * Math.cos(t), zz = z + ring * Math.sin(t);
        if (!(f([x, yT, zz]) > 0.02)) ok = false;
      }
      if (!ok) break;
    }
    if (ok) return Math.round(xh * 4) / 4;
  }
  throw new Error('modelC: no hole column position leaves the holes on a flat fin face');
}

/* Cement ligaments around the suture holes, measured in the parting plane
   y = 0 (where the fin is thickest in Y and the holes are full round): from
   each hole rim, march outward in 72 directions of the XZ plane through the
   solid (dAll < 0) until reaching the outside (edge ligament) or another hole
   (bridge). The validator's thickness sampler skips the hole rims and shoots
   along Y (it reads the 8 mm fin), so it cannot see these; the build refuses
   when any ligament is < minThickness. */
function holeLigaments(holes, dAll, { dirs = 72, step = 0.02, maxLen = 40 } = {}) {
  let edgeMin = Infinity, bridgeMin = Infinity, edgeAt = null, bridgeAt = null;
  const perHole = [];
  holes.forEach((h, i) => {
    let eMin = Infinity, bMin = Infinity;
    for (let k = 0; k < dirs; k++) {
      const t = (k / dirs) * 2 * Math.PI, c = Math.cos(t), sn = Math.sin(t);
      for (let s = 0; s <= maxLen; s += step) {
        const x = h.x + (h.r + s) * c, z = h.z + (h.r + s) * sn;
        const other = holes.findIndex((o, j) => j !== i && Math.hypot(x - o.x, z - o.z) < o.r);
        if (other >= 0) { if (s < bMin) bMin = s; if (s < bridgeMin) { bridgeMin = s; bridgeAt = [i, other]; } break; }
        if (dAll([x, 0, z]) > 0) { if (s < eMin) eMin = s; if (s < edgeMin) { edgeMin = s; edgeAt = [Math.round(x * 100) / 100, 0, Math.round(z * 100) / 100]; } break; }
      }
    }
    perHole.push({ edgeMm: Math.round(eMin * 100) / 100, bridgeMm: isFinite(bMin) ? Math.round(bMin * 100) / 100 : null });
  });
  return { edgeMinMm: Math.round(edgeMin * 100) / 100, edgeAt, bridgeMinMm: isFinite(bridgeMin) ? Math.round(bridgeMin * 100) / 100 : null, bridgeAt, perHole };
}

const MIN_THICKNESS = 6;   // mm, locked robustness rule

export function build(engine, p) {
  if (![0, 3].includes(p.sutureHoles)) throw new Error('modelC: sutureHoles must be 0 or 3');
  if (p.sutureHoles && p.holeSpacing - p.holeD < MIN_THICKNESS)
    throw new Error(`modelC: cement between suture holes = holeSpacing − holeD = ${(p.holeSpacing - p.holeD).toFixed(2)} mm < ${MIN_THICKNESS} (raise holeSpacing to ≥ ${p.holeD + MIN_THICKNESS})`);
  if (p.sutureHoles && p.holeEdge < MIN_THICKNESS)
    throw new Error(`modelC: holeEdge ${p.holeEdge} mm < ${MIN_THICKNESS}`);
  if (!(p.finEdgeR < p.finT / 2)) throw new Error('modelC: finEdgeR must be < finT/2');
  if (!['tube', 'long'].includes(p.distal)) throw new Error(`modelC: distal must be 'tube' or 'long' (got ${p.distal})`);
  if (p.distal === 'long' && !(p.longLen > p.proxLen)) throw new Error(`modelC: longLen ${p.longLen} must exceed proxLen ${p.proxLen}`);
  const g = derive(p);
  if (g.zS - g.zFlare < 10) throw new Error('modelC: proximal stem too short between the tube flare and the neck (raise proxLen or shorten couplingLen)');

  const xh = placeHoles(p, g);
  const { f, core } = bodySDF(p, g, xh);

  const head = sphereSegment({ center: g.C, radius: g.R, axis: g.a, cut: g.cut, rimFillet: g.rho });
  const hb = bbox(head);
  const xMin = xh - g.Rc - 1;
  const bounds = {
    min: [Math.min(xMin, hb.min[0] - 1, -g.rTop - 1), -(Math.max(g.R, g.rTop, g.neckR) + 1), g.long ? -1 : -2],
    max: [Math.max(hb.max[0] + 1, g.rTop + 1), Math.max(g.R, g.rTop, g.neckR) + 1, hb.max[2] + 1],
  };
  const holes = p.sutureHoles === 3 ? g.zH.map((z) => ({ x: xh, z, r: g.rHole })) : [];
  const mesh = (edge) => {
    const body = snapToSurface(levelSetSolid(f, bounds, edge), f).manifold;
    // short: exact flat coupling end at z = 0 (the SDF runs on to z = −2);
    // long: the rounded tip ends at z ≈ 0 by itself (no trim)
    let s = unionAll([body, head]);
    if (!g.long) s = s.trimByPlane([0, 0, 1], 0);
    s.getMesh();
    const tb = bbox(s);
    if (!g.long && Math.abs(tb.min[2]) > 1e-6) throw new Error(`modelC: trim left z min ${tb.min[2]}`);
    if (g.long && Math.abs(tb.min[2]) > 0.05) throw new Error(`modelC: long tip z min ${tb.min[2]} (expected ≈ 0)`);
    if (holes.length) {
      const next = s.subtract(unionAll(holes.map((h) => cylinderY({ ...h, length: 4 * g.R }))));
      next.getMesh();
      s = next;
    }
    return s;
  };
  // Meshing lottery guard: on saddle-shaped fillets whose surface runs almost
  // parallel to Y, the triangulation can leave a ~0.01 mm ripple that one
  // grazing Y-ray in ~20 000 reads as an undercut. The shape is Y-monotone by
  // construction (see header); if the quick Y-demold check trips, re-mesh
  // with a slightly different grid and keep the first clean mesh.
  const tries = [];
  let solid = null;
  for (const k of [1, 0.95, 1.05, 0.9, 1.1]) {
    const edge = Math.round(p.edge * k * 1000) / 1000;
    const s = mesh(edge);
    const dm = validate(s, { holes, maxCreaseDeg: null, thicknessSamples: 50, head: null }).demold;
    tries.push({ edge, demoldFailures: dm.failures });
    if (solid) solid.delete();
    solid = s;
    if (dm.pass) break;
  }

  // core wire: up the stem axis to the neck origin S, then bent along S → head
  // centre C (the neck line, like the steel core of the Synicem drawing) and on
  // until coreCover of cement would no longer surround it. A straight wire up
  // the stem axis would leave the neck into the 8 mm fin (cover 2.4 mm).
  const proxyExact = headSDF(g.C, g.R, g.a, g.cut, g.rho, 0, 0);
  const dAll = (q) => Math.min(f(q), proxyExact(q));
  const need = -(p.coreWireD / 2 + p.coreCover);
  const u = (() => { const d = [g.C[0] - g.S[0], 0, g.C[2] - g.S[2]], l = Math.hypot(d[0], d[2]); return [d[0] / l, 0, d[2] / l]; })();
  let tEnd = null;
  for (let t = 0; t < 3 * g.R; t += 0.25) { if (dAll(add(g.S, scale(u, t))) <= need) tEnd = t; else break; }
  if (tEnd == null) throw new Error('modelC: the core wire has no cover at the neck origin');
  const wireEnd = add(g.S, scale(u, tEnd));
  // cement cover along the wire in the CAST part: at the tube stop (batente,
  // where the cast cement starts over the tube end; radius = tube OD there) and
  // from the flare top up
  const wR = p.coreWireD / 2;
  // long: no tube — the wire's cast cover is measured from the top of the
  // hemispherical tip (z = rBot) up; inside the tip it runs to the pole
  const coverAtBatente = g.long ? null : g.rOD - wR;
  let coverFlare = Infinity;
  if (!g.long) for (let z = g.zBat; z <= g.zFlare; z += 0.1) coverFlare = Math.min(coverFlare, -dAll([0, 0, z]) - wR);
  let minCover = Infinity;
  for (let z = g.long ? g.rBot : g.zFlare; z <= g.zS; z += 0.25) minCover = Math.min(minCover, -dAll([0, 0, z]) - wR);
  for (let t = 0; t <= tEnd; t += 0.25) minCover = Math.min(minCover, -dAll(add(g.S, scale(u, t))) - wR);
  // lowest z from which the coreCover rule holds all the way up the stem axis
  let zCoverOK = g.zS;
  for (let z = g.zS; z >= (g.long ? 0 : g.zBat); z -= 0.1) { if (-dAll([0, 0, z]) - wR >= p.coreCover - 1e-6) zCoverOK = z; else break; }

  // suture-hole ligaments (hard rule: ≥ MIN_THICKNESS, build refuses otherwise)
  const lig = holes.length ? holeLigaments(holes, dAll) : null;
  if (lig) {
    const bad = [];
    if (lig.bridgeMinMm != null && lig.bridgeMinMm < MIN_THICKNESS - 0.05) bad.push(`bridge between holes ${lig.bridgeMinMm} mm`);
    if (lig.edgeMinMm < MIN_THICKNESS - 0.05) bad.push(`hole-to-edge ${lig.edgeMinMm} mm at ${lig.edgeAt}`);
    if (bad.length) throw new Error(`modelC: suture-hole cement < ${MIN_THICKNESS} mm: ${bad.join('; ')}`);
  }

  // stem vs canal (SPEC V7 style): the stem below the neck origin must enter a
  // canal reamed to reamerD. Nominal profile Ø and the measured AP width (Y) of
  // the body on the stem axis from the tube stop up to the neck origin.
  // Measured widths: AP along Y at x = 0 and ML along X at y = 0 (the fin and
  // the neck blend widen the body near the neck origin — that is the
  // metaphyseal part, above the level where it stops fitting reamerD).
  const reach = (dir, z) => { let s = 0; while (s < 40 && dAll([dir[0] * s, dir[1] * s, z]) < 0) s += 0.02; return s; };
  let apMax = 0, zFit = null;
  for (let z = g.long ? g.rBot : g.zBat; z <= g.zS + 1e-9; z += 0.25) {
    const ap = 2 * reach([0, 1], z), ml = reach([1, 0], z) + reach([-1, 0], z);
    if (z <= g.zS - 8) apMax = Math.max(apMax, ap);
    if (zFit == null && Math.max(ap, ml) > p.reamerD + 0.05) zFit = z;
  }
  const zCutOnAxis = g.B[2] + (g.a[0] * g.B[0]) / g.a[2];   // resection plane crosses the stem axis here
  const stemMaxD = 2 * Math.max(g.rBot, g.rTop);
  const warnings = [];
  if (stemMaxD > p.reamerD + 1e-9 && g.long) {
    warnings.push(`stem Ø ${stemMaxD.toFixed(2)} mm > reamerD ${p.reamerD} mm: ream the canal to ≥ ${stemMaxD.toFixed(1)} mm or lower stemTopD/stemBotD`);
  } else if (stemMaxD > p.reamerD + 1e-9) {
    warnings.push(`stem Ø ${stemMaxD.toFixed(2)} mm > reamerD ${p.reamerD} mm (tube ${p.tubeFr} Fr needs ≥ ${(g.tubeOD + p.tubeClear).toFixed(2)}): ream the canal to ≥ ${stemMaxD.toFixed(1)} mm or use a smaller tube (24 Fr = 8 mm OD)`);
  }
  // where the frozen moldapp puts its Y sprue: centre of the solid's bbox in X and Z
  const sbb = bbox(solid);
  const sprueXZ = [(sbb.min[0] + sbb.max[0]) / 2, (sbb.min[2] + sbb.max[2]) / 2];
  const sprueInside = dAll([sprueXZ[0], 0, sprueXZ[1]]) < 0;
  // moldapp default sprue Ø 10: does its disc (in XZ) reach the solid at all?
  let sprueOverlap = 0;
  for (let rr = 0; rr <= 5; rr += 0.25) for (let k = 0; k < 48; k++) {
    const t = (k / 48) * 2 * Math.PI;
    if (dAll([sprueXZ[0] + rr * Math.cos(t), 0, sprueXZ[1] + rr * Math.sin(t)]) < 0) { sprueOverlap = Math.max(sprueOverlap, 5 - rr); }
  }
  for (const w of warnings) console.warn(`   modelC warn ${w}`);


  const sb = bbox(solid);
  const finLat = xh - g.Rc;                              // fin's most lateral x (mid-plane)
  const stemLatAtHoles = -g.rTop;                        // stem lateral edge (upper stem)
  const r2 = (v) => Math.round(v * 100) / 100;
  const v2 = (v) => v.map(r2);

  return {
    manifold: solid,
    meta: {
      head: head.info.validateHead,
      holes,
      headCenter: v2(g.C),
      headD: p.headD,
      NSA: p.nsDeg,
      headInfo: head.info,
      meshing: { levelSetTries: tries },
      stemTip: [0, 0, 0],
      distal: g.long ? {
        variant: 'long',
        name: 'C longo (sem dreno)',
        totalLenMm: p.longLen,
        extraOverShortMm: r2(g.extra),
        lengthCapNote: 'capped at 150 mm: the two-half mold must print STRAIGHT on the Bambu Lab A1 mini (180 mm bed) with its 8 mm walls',
        stemD: r2(2 * g.rBot),
        stemCylinderZ: [r2(g.rBot), r2(g.zFlare)],
        stemConeZ: [r2(g.zFlare), r2(g.zStemTop)],
        tip: { shape: 'hemisphere', radiusMm: r2(g.rBot), poleZ: 0 },
        note: 'one continuous cement piece: straight cylinder Ø stemBotD below the unchanged proximal cone, hemispherical tip; no tube, no spigot, no step',
      } : { variant: 'tube', name: 'C curto + dreno' },
      tube: g.long ? null : {
        fr: p.tubeFr,
        odMm: r2(g.tubeOD),
        axisPoint: [0, 0, 0],
        axisDir: [0, 0, -1],               // the tube runs distally from the coupling end
        couplingLenMm: p.couplingLen,      // tube-OD cylinder z ∈ [0, couplingLen]
        clearanceMm: p.tubeClear,          // stem Ø above the flare ≥ OD + this
        batenteZ: p.couplingLen,           // tube end stops on this plane
        flareDegFromAxis: p.shoulderDeg,
        flareTopZ: r2(g.zFlare),
        stemAboveFlareD: r2(2 * g.rBot),
        note: 'z ∈ [0, couplingLen] is the SPACE of the chest-tube end (OD = Fr/3), not molded cement: '
          + 'in the mold it becomes a coaxial channel that holds the tube; the tube end stops on the batente '
          + 'plane z = couplingLen and the cast cement closes over it. Tube ID is brand-dependent and not modeled.',
        moldChannel: {
          openedByPositive: false,
          reason: 'spacer/moldapp (frozen) builds block = bbox + margin on every side, so no feature of the '
            + 'positive can reach the outside: z ∈ [0, couplingLen] becomes a BLIND pocket Ø tube OD behind a '
            + 'margin-thick (default 6 mm) distal wall.',
          axis: { point: [0, 0, 0], dir: [0, 0, -1] },
          holeDMm: r2(g.tubeOD + 0.3),
          options: [
            'A: after printing, open the distal wall coaxially with the pocket (drill Ø OD+0.3) — or in Bambu Studio add a negative-part cylinder Ø OD+0.3 on this axis before slicing',
            'B: spacer/lib/src/mold.js buildMold() already cuts tubeHole Ø(OD+0.3) at x = y = 0 along +Z through the bottom wall — same axis as this positive',
            'C: Claude (not OpenCode) adds an optional tubeHole to moldapp — surgeon decision',
          ],
        },
      },
      moldapp: {
        sprueXZ: v2(sprueXZ),
        sprueCentreInSolid: sprueInside,
        sprueOverlapMm: r2(sprueOverlap),   // how deep the Ø10 disc reaches into the solid's outline at y = 0
        note: 'moldapp places its Ø10 sprue along Y through the bbox centre (x, z) = sprueXZ: on this positive the centre is '
          + (sprueInside ? 'inside the solid' : 'just outside the solid')
          + (sprueOverlap > 0 ? `, and the channel cuts ${r2(sprueOverlap)} mm into the side of the stem/neck: it opens into the cavity there, sideways (trim the stub after demolding)`
            : ' and the channel misses the cavity — reposition it'),
      },
      canal: {
        reamerDMm: p.reamerD,
        stemMaxDMm: r2(stemMaxD),
        stemMeasuredApMaxMm: r2(apMax),         // tube stop … 8 mm below the neck origin
        fitsReamerUpToZ: zFit == null ? r2(g.zS) : r2(zFit),   // first level where AP or ML width > reamerD
        fitsReamerDepthBelowCutMm: r2(zCutOnAxis - (zFit == null ? g.zS : zFit)),
        cutPlaneOnAxisZ: r2(zCutOnAxis),
        note: 'below fitsReamerUpToZ the whole cross-section fits a canal reamed to reamerD; above it the fin and '
          + 'the neck blend widen the body (metaphyseal part)',
        fitsReamer: stemMaxD <= p.reamerD + 1e-9,
        minStemDForTubeMm: r2(g.tubeOD + p.tubeClear),
      },
      warnings,
      coreWire: {
        diameterMm: p.coreWireD,
        polyline: [[0, 0, 0], v2(g.S), v2(wireEnd)],
        bendDeg: r2(Math.acos(u[2]) / DEG),
        lengthInPartMm: r2(g.zS + tEnd),
        continuesInto: g.long
          ? 'distal tip (z = 0), along −Z: the long mold holds it in a coaxial exit hole through its distal wall; cut flush after demolding'
          : 'chest tube (distal), along −Z',
        ...(g.long ? {
          minCoverAboveTipMm: r2(minCover),     // radial cement around the wire from the top of the rounded tip (z = rBot) up
          buriedStartZ: r2(zCoverOK),           // start the wire here instead to keep it fully in cement with the coreCover rule
          coverRuleHoldsFromZ: r2(zCoverOK),
          coverNote: `stem Ø ${r2(2 * g.rBot)} mm: ${r2(minCover)} mm of cement around the wire from z = ${r2(g.rBot)} up; `
            + `the ${p.coreCover} mm rule holds from z = ${r2(zCoverOK)} up (below it the wire enters the rounded tip and exits at the pole)`,
        } : {
          minCoverAboveFlareMm: r2(minCover),   // radial cement around the wire from the flare top up
          coverAtBatenteMm: r2(coverAtBatente),   // at the tube stop (radius = tube OD): thinnest point of the cast part
          minCoverInFlareMm: r2(coverFlare),
          coverRuleHoldsFromZ: r2(zCoverOK),      // coreCover holds from here up to the neck origin
          coverInCouplingMm: r2(g.rOD - p.coreWireD / 2),   // inside the tube region (tube + its cement)
          coverNote: `cast cement around the wire: ${r2(coverAtBatente)} mm at the tube stop (z = ${p.couplingLen}), `
            + `≥ ${r2(minCover)} mm from the flare top (z = ${r2(g.zFlare)}) up; the ${p.coreCover} mm rule holds from z = ${r2(zCoverOK)} up`,
        }),
        endCoverMm: p.coreCover,
        note: 'continuous core wire/pin Ø' + p.coreWireD + ' mm through ' + (g.long ? 'the whole stem' : 'tube and proximal part') + '; the solid stays FULL (not subtracted)',
      },
      dims: {
        proxLenMm: r2(sb.max[2] - sb.min[2]),
        sizeMm: v2([sb.max[0] - sb.min[0], sb.max[1] - sb.min[1], sb.max[2] - sb.min[2]]),
        maxExtentMm: r2(Math.max(sb.max[0] - sb.min[0], sb.max[1] - sb.min[1], sb.max[2] - sb.min[2])),
        headHeightMm: r2(g.R - g.cut),
        headHOverD: r2((g.R - g.cut) / p.headD),
        headBaseCenter: v2(g.B),
        headFlatBaseD: r2(2 * g.ac),
        headRimFillet: g.rho,
        headMedialOffset: p.headOffset,
        headLateralExtreme: v2(g.latExtreme),
        headCenterZ: r2(g.C[2]),
        neckStartZ: r2(g.zS),
        neckBaseD: r2(2 * g.neckR),
        stemTopD: r2(2 * g.rTop),
        stemBotD: r2(2 * g.rBot),
        stemTaperDegPerSide: r2(Math.atan2(g.rTop - g.rBot, g.zS - g.zFlare) / DEG),
        finThicknessY: p.finT,
        finLateralX: r2(finLat),
        finBeyondStemMm: r2(stemLatAtHoles - finLat),
        finTopZ: r2(g.zH[0] + g.Rc),
        finBottomZAtHoles: r2(g.zH[g.nH - 1] - g.Rc),
        finCore: core.map(v2),
        holeColumnX: xh,
        holeZ: g.zH.map(r2),
        holeCementToEdgeMm: r2(g.Rc - g.rHole),
        holeCementBetweenMm: r2(p.holeSpacing - p.holeD),
        holeLigamentsMeasured: lig,   // y = 0, 72 directions per hole; build refuses < 6 mm
        bboxMin: v2(sb.min),
        bboxMax: v2(sb.max),
      },
    },
  };
}
