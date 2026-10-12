/* PNG renders of the mold (node only), on top of the positive's software
   renderer (positivo/src/render.mjs, single colour per call). Several
   coloured parts are composited: each part is rendered with the SAME framing
   (the scene's bounding-box corners are appended as unreferenced vertices, so
   every call fits the same box) and pasted far-to-near. */

import { renderView, renderSheet, writePNG, BACKGROUND } from '../../positivo/src/render.mjs';
import { toArrays, bake, bounds, cylZ, union, box } from './geom.mjs';
import { bedPose } from './mold.mjs';

export const COLORS = {
  ANT: [120, 160, 205],
  POST: [225, 160, 105],
  cement: [236, 226, 200],
  tube: [170, 190, 170],
  wire: [110, 115, 125],
  plate: [60, 60, 66],
  margin: [215, 80, 60],
  engrave: [45, 45, 60],
};

function boxOf(E, m) {
  const b = bounds(m);
  const s = b.max.map((v, k) => v - b.min[k] + 4);
  return E.Manifold.cube(s, false).translate(b.min.map((v) => v - 2));
}

const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

/* Unshared vertices (flat shading: the renderer's vertex normals then equal
   the face normals, so long thin triangles on flat faces do not streak) +
   the scene's bounding-box corners (same framing for every part). */
function withCorners(arr, bb) {
  const I0 = arr.indices, P0 = arr.positions;
  const P = new Float32Array(I0.length * 3 + 24);
  const I = new Uint32Array(I0.length);
  for (let i = 0; i < I0.length; i++) {
    const q = I0[i] * 3;
    P[i * 3] = P0[q]; P[i * 3 + 1] = P0[q + 1]; P[i * 3 + 2] = P0[q + 2];
    I[i] = i;
  }
  let o = I0.length * 3;
  for (const x of [bb.min[0], bb.max[0]]) for (const y of [bb.min[1], bb.max[1]]) for (const z of [bb.min[2], bb.max[2]]) {
    P[o++] = x; P[o++] = y; P[o++] = z;
  }
  return { positions: P, indices: I };
}

/* parts: [{ m: Manifold, color }] → image */
export function renderComposite(parts, view, opts = {}) {
  const arrs = parts.map((q) => ({ ...q, a: toArrays(q.m), b: bounds(q.m) }));
  const bb = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  for (const q of arrs) for (let k = 0; k < 3; k++) { bb.min[k] = Math.min(bb.min[k], q.b.min[k]); bb.max[k] = Math.max(bb.max[k], q.b.max[k]); }
  const f = nrm(view.dir);
  const depth = (q) => { const c = q.b.min.map((v, k) => (v + q.b.max[k]) / 2); return c[0] * f[0] + c[1] * f[1] + c[2] * f[2]; };
  arrs.sort((a, b) => depth(b) - depth(a)); // far first
  let out = null;
  for (const q of arrs) {
    const img = renderView(withCorners(q.a, bb), { view, color: q.color, parting: false, pxPerMm: opts.pxPerMm || 3, label: opts.label || '' });
    if (!out) { out = img; continue; }
    const D = img.data, O = out.data;
    for (let i = 0; i < D.length; i += 3) {
      if (Math.abs(D[i] - BACKGROUND[0]) + Math.abs(D[i + 1] - BACKGROUND[1]) + Math.abs(D[i + 2] - BACKGROUND[2]) > 12) {
        O[i] = D[i]; O[i + 1] = D[i + 1]; O[i + 2] = D[i + 2];
      }
    }
  }
  return out;
}

const ROT_Z180 = [-1, 0, 0, 0, -1, 0, 0, 0, 1];

/* The standard set of views for one mold. Returns { name: image }. */
/* Core wire as a solid (capsules along the polyline); the straight part is
   extended below the tip by `below` mm (long variant: it leaves through the
   exit hole in the distal wall). */
export function wireSolid(E, polyline, d, below = 0) {
  const pts = polyline.map((q) => q.slice());
  if (below) pts[0] = [pts[0][0], pts[0][1], pts[0][2] - below];
  const segs = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = E.Manifold.sphere(d / 2, 24).translate(pts[i]), c = E.Manifold.sphere(d / 2, 24).translate(pts[i + 1]);
    segs.push(E.Manifold.hull([a, c]));
    a.delete(); c.delete();
  }
  return union(E, segs);
}

export function moldViews(E, mold, label) {
  const { ant, post, parts, layout } = mold;
  const b = layout.block;
  const W = b.x[1] - b.x[0];
  const t = layout.tube;
  // short: the chest tube in its bore; long: the core wire leaving the distal wall
  const tube = t ? cylZ(E, 0, 0, t.distalFaceZ - 45, t.stopZ, t.odMm / 2, t.odMm / 2, 48)
    : wireSolid(E, mold.wire.polyline, mold.wire.d, -layout.distal.distalFaceZ + 15);
  const tubeColor = t ? COLORS.tube : COLORS.wire;
  const spacer = parts.cement;
  const imgs = {};

  // exploded = the mold opened on the bench: both halves parting face up,
  // side by side (ANT turned 180° about Z), spacer + tube in front
  const antOpen = bake(E, ant, ROT_Z180, [b.x[0] + b.x[1] + W + 25, 0, 0], 'antOpen');
  const lift = b.y[1] + 30;
  const spacerUp = spacer.translate([W / 2 + 12, lift, 0]);
  const tubeUp = tube.translate([W / 2 + 12, lift, 0]);
  const exView = { dir: nrm([-0.12, -1, -0.55]), up: [0, 0, 1] };
  imgs.exploded = renderComposite([
    { m: post, color: COLORS.POST }, { m: antOpen, color: COLORS.ANT },
    { m: spacerUp, color: COLORS.cement }, { m: tubeUp, color: tubeColor },
  ], exView, { label: `${label} ABERTO: ANT AZUL, POST LARANJA` });

  // parting faces (slightly oblique so depth reads)
  imgs.face_ANT = renderComposite([{ m: ant, color: COLORS.ANT }], { dir: nrm([0.18, 1, -0.3]), up: [0, 0, 1] }, { label: `${label} ANT FACE DE PARTICAO`, pxPerMm: 4 });
  imgs.face_POST = renderComposite([{ m: post, color: COLORS.POST }], { dir: nrm([-0.18, -1, -0.3]), up: [0, 0, 1] }, { label: `${label} POST FACE DE PARTICAO`, pxPerMm: 4 });
  // outer faces (labels, gauges, nut pockets)
  // engraved strokes painted dark (a 0.8 mm recess parallel to the face has
  // the same shading as the face and would not show)
  const engA = parts.engravingANT.intersect(ant.boundingBox ? boxOf(E, ant) : ant);
  const engP = parts.engravingPOST.intersect(boxOf(E, post));
  imgs.outer_ANT = renderComposite([{ m: ant, color: COLORS.ANT }, { m: engA.translate([0, 0.9, 0]), color: COLORS.engrave }], { dir: [0, -1, 0], up: [0, 0, 1] }, { label: `${label} ANT FACE EXTERNA`, pxPerMm: 4 });
  imgs.outer_POST = renderComposite([{ m: post, color: COLORS.POST }, { m: engP.translate([0, -0.9, 0]), color: COLORS.engrave }], { dir: [0, 1, 0], up: [0, 0, 1] }, { label: `${label} POST FACE EXTERNA`, pxPerMm: 4 });
  // closed, with the tube in its bore
  imgs.closed = renderComposite([
    { m: ant, color: COLORS.ANT }, { m: post, color: COLORS.POST }, { m: tube, color: tubeColor },
  ], { dir: nrm([-0.55, -0.7, -0.45]), up: [0, 0, 1] }, { label: `${label} FECHADO` });
  // distal face (tube bore + depth)
  imgs.distal = renderComposite([
    { m: ant, color: COLORS.ANT }, { m: post, color: COLORS.POST },
  ], { dir: nrm([0.15, -0.25, 1]), up: [0, 1, 0] }, { label: `${label} FACE DISTAL`, pxPerMm: 4 });
  [antOpen, spacerUp, tube, tubeUp].forEach((m) => m.delete());
  return imgs;
}

/* One half on the 180 × 180 A1 mini plate, seen from above, printed straight
   (parting face up). The red frame is the bedMargin line. */
export function bedView(E, mold, which, label, plate = 180) {
  const { m, bounds: bb } = bedPose(E, mold, which, plate);
  const mg = mold.params.bedMargin ?? 3;
  const w = 0.8;
  const frame = union(E, [
    box(E, [mg, mg, -0.3], [plate - mg, mg + w, 0]), box(E, [mg, plate - mg - w, -0.3], [plate - mg, plate - mg, 0]),
    box(E, [mg, mg, -0.3], [mg + w, plate - mg, 0]), box(E, [plate - mg - w, mg, -0.3], [plate - mg, plate - mg, 0]),
  ]);
  const bed = box(E, [0, 0, -1.5], [plate, plate, -0.4]);
  const img = renderComposite([
    { m: bed, color: COLORS.plate }, { m: frame, color: COLORS.margin }, { m, color: which === 'ANT' ? COLORS.ANT : COLORS.POST },
  ], { dir: [0, 0, -1], up: [0, 1, 0] }, { label, pxPerMm: 4 });
  const size = bb.max.map((v, k) => v - bb.min[k]);
  [m, frame, bed].forEach((q) => q.delete());
  return { img, size, margins: [bb.min[0], plate - bb.max[0], bb.min[1], plate - bb.max[1]] };
}

export { renderSheet, writePNG };
