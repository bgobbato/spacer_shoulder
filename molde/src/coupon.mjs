/* Calibration coupons (print BEFORE the mold, ~20–30 min each):
   - pin coupon: plate M with 5 male Ø8 pins identical to the mold's, plate F
     with 5 holes at radial clearances 0.15 … 0.35 mm (engraved 15 … 35);
   - tube coupon: plate with 3 guide bores Ø(OD + 0.2 / 0.4 / 0.6) to try
     the real chest tube (engraved 2 / 4 / 6).
   Same malePin / femaleHole code as the mold, same frame convention (parting
   face = y 0, print it face UP). */

import { resolveParams } from './params.mjs';
import { force, box, cylZ, extrudeXZ, union } from './geom.mjs';
import { malePin, femaleHole } from './mold.mjs';
import { placeText, strokesToCS } from './labels.mjs';

const CLEARS = [0.15, 0.2, 0.25, 0.3, 0.35];

export function pinCoupon(E, user = {}) {
  const p = resolveParams(user);
  const d = p.pinD[0], pitch = 14, n = CLEARS.length;
  const W = pitch * n + 6, H = 26, T = 9;
  const xs = CLEARS.map((_, i) => 3 + pitch / 2 + i * pitch);
  // plate M: y ∈ [0, T] (face y = 0), pins toward −y
  let M = box(E, [0, 0, 0], [W, T, H]);
  M = force(M.add(union(E, xs.map((x) => malePin(E, x, 10, d, p, -1)))), 'coupon M');
  // plate F: y ∈ [−T, 0], holes into −y, labels engraved on the parting face
  let F = box(E, [0, -T, 0], [W, 0, H]);
  const holes = xs.map((x, i) => femaleHole(E, x, 10, d, { ...p, pinClear: CLEARS[i] }, -1));
  const txt = strokesToCS(E, xs.flatMap((x, i) => placeText(String(Math.round(CLEARS[i] * 100)), 4, x, 18.5, -1)), 0.8);
  const eng = extrudeXZ(E, txt, -0.6, 0.5);
  F = force(F.subtract(union(E, [...holes, eng])), 'coupon F');
  return { male: M, female: F, clearances: CLEARS, pinD: d };
}

export function tubeCoupon(E, user = {}) {
  const p = resolveParams(user);
  const extra = [0.2, 0.4, 0.6];
  const od = p.tubeODmm, pitch = od + 10;
  const W = pitch * 3 + 4, L = 15, H = od + 14;
  let B = box(E, [0, 0, 0], [W, H, L]);
  const bores = extra.map((e, i) => cylZ(E, 2 + pitch / 2 + i * pitch, H / 2, -1, L + 1, (od + e) / 2, (od + e) / 2, 96));
  const txt = strokesToCS(E, extra.flatMap((e, i) => placeText(String(Math.round(e * 10)), 4, 2 + pitch / 2 + i * pitch, 2, 1)), 0.8);
  // engrave on the top face z = L (text drawn in XZ, so place it via a thin XY slab instead)
  const tx = E.Manifold.extrude(txt, 1.6).translate([0, 0, L - 0.6]);
  B = force(B.subtract(union(E, [...bores, tx])), 'tube coupon');
  return { plate: B, boresD: extra.map((e) => +(od + e).toFixed(2)), od };
}
