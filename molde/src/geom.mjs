/* Geometry helpers for the mold generator. Zero three.js; manifold-3d 2.5.1.

   The engine (the object returned by the manifold-3d factory after setup())
   is passed in explicitly, so the same code runs in node and in the browser.

   manifold-3d 2.5.1 rules kept here (spacer/HANDOFF_MOLD_SYSTEM.md):
   - rotations are BAKED into vertex arrays (bake()); Manifold.translate is
     used for pure translation (verified by bounds in the tests);
   - manifold is lazy: force() calls getMesh() so errors surface where made;
   - STL is triangle soup: weld before building a Manifold (stl.mjs). */

export const DEG = Math.PI / 180;

export function force(m, label = 'solid') {
  m.getMesh();
  const st = statusOf(m);
  if (st !== 0) throw new Error(`${label}: manifold status ${st}`);
  return m;
}

export function statusOf(m) {
  const s = m.status();
  return s && typeof s.value === 'number' ? s.value : Number(s) || 0;
}

export const volume = (m) => m.getProperties().volume;
export const area = (m) => m.getProperties().surfaceArea;

export function bounds(m) {
  const b = m.boundingBox();
  return { min: [b.min[0], b.min[1], b.min[2]], max: [b.max[0], b.max[1], b.max[2]] };
}

/* Build a Manifold from shared-vertex arrays. */
export function fromArrays(E, positions, indices, label = 'mesh') {
  const mesh = new E.Mesh({
    numProp: 3,
    vertProperties: positions instanceof Float32Array ? positions : new Float32Array(positions),
    triVerts: indices instanceof Uint32Array ? indices : new Uint32Array(indices),
  });
  mesh.merge();
  const m = new E.Manifold(mesh);
  return force(m, label);
}

/* Manifold → { positions: Float32Array, indices: Uint32Array }. */
export function toArrays(m) {
  const raw = m.getMesh();
  const np = raw.numProp || 3;
  const vp = raw.vertProperties;
  const n = (vp.length / np) | 0;
  const positions = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    positions[i * 3] = vp[i * np];
    positions[i * 3 + 1] = vp[i * np + 1];
    positions[i * 3 + 2] = vp[i * np + 2];
  }
  return { positions, indices: new Uint32Array(raw.triVerts) };
}

/* p' = R·p + t baked into the vertices (R row-major 3×3). det(R) < 0 flips
   the winding so the solid stays outward. */
export function bake(E, m, R, t = [0, 0, 0], label = 'bake') {
  const raw = m.getMesh();
  const np = raw.numProp || 3;
  const vp = new Float32Array(raw.vertProperties);
  for (let i = 0; i < vp.length; i += np) {
    const x = vp[i], y = vp[i + 1], z = vp[i + 2];
    vp[i] = R[0] * x + R[1] * y + R[2] * z + t[0];
    vp[i + 1] = R[3] * x + R[4] * y + R[5] * z + t[1];
    vp[i + 2] = R[6] * x + R[7] * y + R[8] * z + t[2];
  }
  const tv = new Uint32Array(raw.triVerts);
  const det = R[0] * (R[4] * R[8] - R[5] * R[7]) - R[1] * (R[3] * R[8] - R[5] * R[6]) + R[2] * (R[3] * R[7] - R[4] * R[6]);
  if (det < 0) for (let i = 0; i < tv.length; i += 3) { const s = tv[i + 1]; tv[i + 1] = tv[i + 2]; tv[i + 2] = s; }
  const opts = { numProp: np, vertProperties: vp, triVerts: tv };
  if (raw.mergeFromVert && raw.mergeFromVert.length) {
    opts.mergeFromVert = new Uint32Array(raw.mergeFromVert);
    opts.mergeToVert = new Uint32Array(raw.mergeToVert);
  }
  return force(new E.Manifold(new E.Mesh(opts)), label);
}

/* Row-major rotations used below. */
// (a,b,c) → (a, c, −b): local +Z becomes world +Y (proper rotation)
export const R_Z_TO_PY = [1, 0, 0, 0, 0, 1, 0, -1, 0];
// (a,b,c) → (a, −c, b): local +Z becomes world −Y
export const R_Z_TO_NY = [1, 0, 0, 0, 0, -1, 0, 1, 0];
// (x,y,z) → (x, z, −y): world XZ-plane becomes local XY (for slice/project at y)
export const R_XZ_TO_XY = [1, 0, 0, 0, 0, 1, 0, -1, 0];
// (u,v,w) → (u, w, v): local XY-plane (u=x, v=z) extruded along +w → +Y (mirror, det −1)
export const R_UVW_TO_XZY = [1, 0, 0, 0, 0, 1, 0, 1, 0];

export function box(E, min, max) {
  const s = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  return E.Manifold.cube(s, false).translate(min);
}

/* Cylinder along Z from z0 to z1 at (x, y). r1 = radius at z1. */
export function cylZ(E, x, y, z0, z1, r0, r1 = r0, seg = 64) {
  return E.Manifold.cylinder(z1 - z0, r0, r1, seg, false).translate([x, y, z0]);
}

/* Cylinder along Y at (x, z) from y0 to y1 (either order). rA at y0, rB at y1. */
export function cylY(E, x, z, y0, y1, rA, rB = rA, seg = 64) {
  const up = y1 >= y0;
  const h = Math.abs(y1 - y0);
  const c = E.Manifold.cylinder(h, rA, rB, seg, false);
  const m = bake(E, c, up ? R_Z_TO_PY : R_Z_TO_NY, [x, y0, z]);
  return m;
}

/* Extrude a CrossSection drawn in the XZ plane (2D x = X, 2D y = Z) along Y
   between y0 < y1. */
export function extrudeXZ(E, cs, y0, y1) {
  const m = E.Manifold.extrude(cs, y1 - y0);
  return bake(E, m, R_UVW_TO_XZY, [0, y0, 0], 'extrudeXZ');
}

/* Section of a solid by the plane y = y0, as a CrossSection in (x, z). */
export function sliceAtY(E, m, y0 = 0) {
  const r = bake(E, m, R_XZ_TO_XY, [0, 0, 0], 'sliceAtY');
  const cs = r.slice(-y0);
  r.delete();
  const c = cleanCS(E, cs);
  cs.delete();
  return c;
}

/* Projection of a solid onto the XZ plane as a CrossSection in (x, z). */
export function projectXZ(E, m) {
  const r = bake(E, m, R_XZ_TO_XY, [0, 0, 0], 'projectXZ');
  const cs = r.project();
  r.delete();
  return cs;
}

export function union(E, list) {
  const parts = list.filter(Boolean);
  if (!parts.length) return null;
  if (parts.length === 1) return parts[0];
  return force(E.Manifold.union(parts), 'union');
}

/* ---------------- 2D (x, z) helpers on plain polygons ---------------- */

const xy = (p) => (Array.isArray(p) ? [p[0], p[1]] : [p.x, p.y]);
export function csPolys(cs) {
  return cs.toPolygons().map((poly) => poly.map(xy));
}

export function polyArea(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; a += p[0] * q[1] - q[0] * p[1]; }
  return a / 2;
}

/* Drop sliver contours (|area| < minArea) left by slicing through a mesh. */
export function cleanCS(E, cs, minArea = 0.05) {
  const keep = csPolys(cs).filter((q) => Math.abs(polyArea(q)) >= minArea);
  return new E.CrossSection(keep, 'EvenOdd');
}

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  const qx = ax + t * dx - px, qy = ay + t * dy - py;
  return Math.sqrt(qx * qx + qy * qy);
}

/* Distance from p to the boundary of a polygon set. */
export function distToPolys(p, polys) {
  let d = Infinity;
  for (const poly of polys) {
    for (let i = 0, n = poly.length; i < n; i++) {
      const a = poly[i], b = poly[(i + 1) % n];
      const s = segDist(p[0], p[1], a[0], a[1], b[0], b[1]);
      if (s < d) d = s;
    }
  }
  return d;
}

/* Even-odd point-in-polygon-set. */
export function insidePolys(p, polys) {
  let inside = false;
  for (const poly of polys) {
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
  }
  return inside;
}

/* Signed distance to a region (negative inside). */
export function sdPolys(p, polys) {
  const d = distToPolys(p, polys);
  return insidePolys(p, polys) ? -d : d;
}

/* Thick polyline (stroke) as a CrossSection: rectangles + round joints. */
export function strokeCS(E, pts, w, seg = 16) {
  const r = w / 2;
  const parts = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy);
    if (l < 1e-9) continue;
    const nx = (-dy / l) * r, ny = (dx / l) * r;
    parts.push([[ax + nx, ay + ny], [ax - nx, ay - ny], [bx - nx, by - ny], [bx + nx, by + ny]]);
  }
  const rects = parts.map((q) => {
    // make CCW
    let a = 0;
    for (let i = 0; i < 4; i++) { const p = q[i], n = q[(i + 1) % 4]; a += p[0] * n[1] - n[0] * p[1]; }
    return a < 0 ? q.reverse() : q;
  });
  const list = rects.map((q) => new E.CrossSection([q], 'Positive'));
  for (const p of pts) list.push(E.CrossSection.circle(r, seg).translate(p));
  return E.CrossSection.union(list);
}

export function rectCS(E, x0, z0, x1, z1) {
  return new E.CrossSection([[[x0, z0], [x1, z0], [x1, z1], [x0, z1]]], 'Positive');
}

export function roundedRectCS(E, x0, z0, x1, z1, r) {
  return rectCS(E, x0 + r, z0 + r, x1 - r, z1 - r).offset(r, 'Round', 2, 48);
}

/* Split into components and drop numerical debris: zero-volume slivers
   (|V| < minVol mm³, typically 4-triangle tetrahedra of ~1e-6 mm³) that a
   plane cut through the level-set positive can leave on the cut plane.
   Returns { m, removed: { count, volumeMm3 } }. */
export function dropDebris(E, m, minVol = 0.01) {
  const comps = m.decompose();
  if (comps.length === 1) { comps[0].delete(); return { m, removed: { count: 0, volumeMm3: 0 } }; }
  const keep = [], drop = [];
  for (const c of comps) (Math.abs(volume(c)) >= minVol ? keep : drop).push(c);
  const removed = { count: drop.length, volumeMm3: drop.reduce((s, c) => s + Math.abs(volume(c)), 0) };
  drop.forEach((c) => c.delete());
  const out = keep.length === 1 ? keep[0] : E.Manifold.compose(keep);
  return { m: force(out, 'dropDebris'), removed };
}
