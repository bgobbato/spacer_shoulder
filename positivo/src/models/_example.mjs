/* PLACEHOLDER model (not a design): capsule stem + round-cone neck + exact
   sphere-segment head. Shows the model contract that build.mjs expects:

     export const NAME, DESCRIPTION, DEFAULTS, RANGES
     export function build(engine, params) -> { manifold, meta }

   meta.head = { center, radius, axis, capAngleDeg }  (validator head fit;
               sphereSegment(...).info.validateHead gives it ready-made)
   meta.holes = [{ x, z, r }] Y through-holes (suture): expected genus =
               holes.length, each checked open along Y, rim zone kept out
               of the thickness survey (meta.throughHoles = count overrides genus)
   meta.minThickness / meta.thicknessIgnoreBelowZ / meta.validateOptions
                                                      (optional overrides)

   RECOMMENDED PATTERN (smooth = true, the default):
     1. body SDF = smooth union (smin, blend k) of stem, neck, … AND the head
        proxy (headProxySDF) → levelSetSolid: every junction gets a fillet,
        including neck → flat head base.
     2. union the EXACT polished head (sphereSegment) on top.
   smooth = false builds the same parts with plain CSG unions: sharp concave
   creases at the junctions → the validator FAILS it (kept as a demo).
*/

import {
  headAxis, add, sub, scale, lerp3, capsule, taperedRod, sphereSegment, cylinderY, unionAll,
  sdCapsule, smin, headProxySDF, levelSetSolid,
} from '../common.mjs';

export const NAME = 'example';
export const DESCRIPTION = 'Placeholder: capsule stem, round-cone neck, filleted sphere-cap head';

export const DEFAULTS = {
  headD: 48,        // mm head sphere diameter
  headHD: 0.40,     // head height / diameter (calota); h = R − cut
  rimFillet: 3,     // mm torus blend at the head rim (0 = bare rim: a knife edge when headHD < 0.5)
  nsDeg: 135,       // neck-shaft angle
  stemD: 10,        // mm stem diameter (rounded tip at z = 0)
  stemTopZ: 95,     // mm stem top / neck origin on the stem axis
  neckLen: 10,      // mm from stem top to the head base centre, along the head axis
  smooth: true,     // SDF body with filleted junctions (false = sharp CSG demo, fails)
  fillet: 5,        // mm smin blend width at the junctions
  edge: 0.8,        // mm levelSet edge length
  sutureHole: false,// one Y through-hole in the neck (genus 1) — demo only
};

export const RANGES = {
  headD: [40, 58],
  headHD: [0.37, 0.63],
  rimFillet: [0, 6],
  nsDeg: [125, 140],
  stemD: [8, 14],
  fillet: [0, 10],
  edge: [0.4, 1.2],
};

export function build(engine, p) {
  const R = p.headD / 2;
  const axis = headAxis(p.nsDeg);
  const rs = p.stemD / 2;
  const cut = R * (1 - 2 * p.headHD);            // h = R − cut = headHD · D
  const S = [0, 0, p.stemTopZ];
  const B = add(S, scale(axis, p.neckLen));      // head base centre
  const C = sub(B, scale(axis, cut));            // head sphere centre
  const neckR = 0.36 * R;
  const neckEnd = add(B, scale(axis, 1));        // 1 mm inside the head

  const head = sphereSegment({ center: C, radius: R, axis, cut, rimFillet: p.rimFillet });

  let solid;
  if (p.smooth) {
    const proxy = headProxySDF(head.info);
    const tip = [0, 0, rs];
    const sdf = (q) => smin(smin(sdCapsule(q, tip, S, rs), sdCapsule(q, S, neckEnd, rs + 2, neckR), p.fillet), proxy(q), p.fillet);
    const m = rs + 2 + p.fillet;
    const bounds = {
      min: [Math.min(-m, C[0] - R), -Math.max(m, R), 0],
      max: [Math.max(m, C[0] + R), Math.max(m, R), C[2] + R],
    };
    const body = levelSetSolid(sdf, bounds, p.edge);
    solid = unionAll([body, head]);
  } else {
    const stem = capsule([0, 0, rs], S, rs);       // tip sphere touches z = 0
    const neck = taperedRod(S, rs + 2, neckEnd, neckR);
    solid = unionAll([stem, neck, head]);
  }

  const holes = [];
  if (p.sutureHole) {
    const H = lerp3(S, B, 0.5);
    const hole = { x: H[0], z: H[2], r: 1.5 };
    const cutter = cylinderY({ ...hole, length: 4 * R });
    solid = solid.subtract(cutter);
    solid.getMesh();
    holes.push(hole);
  }

  return {
    manifold: solid,
    meta: {
      head: head.info.validateHead,
      holes,                       // Y through-holes → genus + open check + rim zone
      headInfo: head.info,
      stemTip: [0, 0, 0],
    },
  };
}
