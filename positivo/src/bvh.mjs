/* Triangle BVH for ray casting and closest-point queries (float64, no deps).
   Used by validate.mjs (demold rays, shape-diameter thickness, symmetry,
   head-fit rays). Build: spatial-median split on the longest centroid axis,
   in-place partition, leaves ≤ 4 triangles. */

export function buildBVH(positions, indices) {
  const nTri = (indices.length / 3) | 0;
  const tri = new Float64Array(nTri * 9);
  const cen = new Float64Array(nTri * 3);
  for (let t = 0; t < nTri; t++) {
    for (let k = 0; k < 3; k++) {
      const v = indices[t * 3 + k] * 3;
      tri[t * 9 + k * 3] = positions[v];
      tri[t * 9 + k * 3 + 1] = positions[v + 1];
      tri[t * 9 + k * 3 + 2] = positions[v + 2];
    }
    for (let a = 0; a < 3; a++) cen[t * 3 + a] = (tri[t * 9 + a] + tri[t * 9 + 3 + a] + tri[t * 9 + 6 + a]) / 3;
  }
  const order = new Uint32Array(nTri);
  for (let i = 0; i < nTri; i++) order[i] = i;

  const maxNodes = Math.max(1, 2 * nTri);
  const bmin = new Float64Array(maxNodes * 3), bmax = new Float64Array(maxNodes * 3);
  const left = new Int32Array(maxNodes).fill(-1);
  const start = new Uint32Array(maxNodes), count = new Uint32Array(maxNodes);
  let nNodes = 1;
  start[0] = 0; count[0] = nTri;

  const stack = [0];
  while (stack.length) {
    const node = stack.pop();
    const s = start[node], c = count[node];
    let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
    let cx0 = Infinity, cy0 = Infinity, cz0 = Infinity, cx1 = -Infinity, cy1 = -Infinity, cz1 = -Infinity;
    for (let i = s; i < s + c; i++) {
      const t = order[i];
      for (let k = 0; k < 3; k++) {
        const o = t * 9 + k * 3;
        const x = tri[o], y = tri[o + 1], z = tri[o + 2];
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
        if (z < z0) z0 = z; if (z > z1) z1 = z;
      }
      const cx = cen[t * 3], cy = cen[t * 3 + 1], cz = cen[t * 3 + 2];
      if (cx < cx0) cx0 = cx; if (cx > cx1) cx1 = cx;
      if (cy < cy0) cy0 = cy; if (cy > cy1) cy1 = cy;
      if (cz < cz0) cz0 = cz; if (cz > cz1) cz1 = cz;
    }
    bmin[node * 3] = x0; bmin[node * 3 + 1] = y0; bmin[node * 3 + 2] = z0;
    bmax[node * 3] = x1; bmax[node * 3 + 1] = y1; bmax[node * 3 + 2] = z1;
    if (c <= 4) continue;
    const ex = cx1 - cx0, ey = cy1 - cy0, ez = cz1 - cz0;
    const axis = ex >= ey && ex >= ez ? 0 : (ey >= ez ? 1 : 2);
    const split = axis === 0 ? (cx0 + cx1) / 2 : axis === 1 ? (cy0 + cy1) / 2 : (cz0 + cz1) / 2;
    let i = s, j = s + c - 1;
    while (i <= j) {
      if (cen[order[i] * 3 + axis] < split) i++;
      else { const tmp = order[i]; order[i] = order[j]; order[j] = tmp; j--; }
    }
    let nl = i - s;
    if (nl === 0 || nl === c) nl = c >> 1;       // degenerate (coincident centroids)
    const l = nNodes, r = nNodes + 1;
    nNodes += 2;
    left[node] = l;
    start[l] = s; count[l] = nl;
    start[r] = s + nl; count[r] = c - nl;
    stack.push(l, r);
  }

  // reorder triangle data so leaves are contiguous
  const triS = new Float64Array(nTri * 9);
  const nrm = new Float64Array(nTri * 3);
  for (let i = 0; i < nTri; i++) {
    const t = order[i];
    for (let k = 0; k < 9; k++) triS[i * 9 + k] = tri[t * 9 + k];
    const o = i * 9;
    const ux = triS[o + 3] - triS[o], uy = triS[o + 4] - triS[o + 1], uz = triS[o + 5] - triS[o + 2];
    const vx = triS[o + 6] - triS[o], vy = triS[o + 7] - triS[o + 1], vz = triS[o + 8] - triS[o + 2];
    nrm[i * 3] = uy * vz - uz * vy; nrm[i * 3 + 1] = uz * vx - ux * vz; nrm[i * 3 + 2] = ux * vy - uy * vx;
  }
  return { nTri, tri: triS, nrm, order, bmin, bmax, left, start, count, nNodes };
}

/* Möller–Trumbore, inclusive edges. Returns t or −1. */
function rayTri(T, o, ox, oy, oz, dx, dy, dz) {
  const ax = T[o], ay = T[o + 1], az = T[o + 2];
  const e1x = T[o + 3] - ax, e1y = T[o + 4] - ay, e1z = T[o + 5] - az;
  const e2x = T[o + 6] - ax, e2y = T[o + 7] - ay, e2z = T[o + 8] - az;
  const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x;
  const det = e1x * px + e1y * py + e1z * pz;
  if (det > -1e-14 && det < 1e-14) return -1;
  const inv = 1 / det;
  const sx = ox - ax, sy = oy - ay, sz = oz - az;
  const u = (sx * px + sy * py + sz * pz) * inv;
  if (u < -1e-10 || u > 1 + 1e-10) return -1;
  const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x;
  const v = (dx * qx + dy * qy + dz * qz) * inv;
  if (v < -1e-10 || u + v > 1 + 1e-10) return -1;
  return (e2x * qx + e2y * qy + e2z * qz) * inv;
}

function slab(B, n, ox, oy, oz, idx, idy, idz, tmin, tmax) {
  let t0 = (B.bmin[n * 3] - ox) * idx, t1 = (B.bmax[n * 3] - ox) * idx;
  if (t0 > t1) { const s = t0; t0 = t1; t1 = s; }
  let u0 = (B.bmin[n * 3 + 1] - oy) * idy, u1 = (B.bmax[n * 3 + 1] - oy) * idy;
  if (u0 > u1) { const s = u0; u0 = u1; u1 = s; }
  let w0 = (B.bmin[n * 3 + 2] - oz) * idz, w1 = (B.bmax[n * 3 + 2] - oz) * idz;
  if (w0 > w1) { const s = w0; w0 = w1; w1 = s; }
  const lo = Math.max(t0, u0, w0, tmin), hi = Math.min(t1, u1, w1, tmax);
  return lo <= hi ? lo : Infinity;
}

const STACK = new Int32Array(256);
/* 1/v without NaN in the slab test when a direction component is 0. */
const safeInv = (v) => 1 / (Math.abs(v) < 1e-30 ? (v < 0 ? -1e-30 : 1e-30) : v);

/* All hits along a ray. Fills outT (Float64Array) / outS (Int8Array: +1 the
   ray EXITS through that face, −1 it ENTERS). Returns the hit count. */
export function rayAll(B, o, d, tmin, tmax, outT, outS) {
  const [ox, oy, oz] = o, [dx, dy, dz] = d;
  const idx = safeInv(dx), idy = safeInv(dy), idz = safeInv(dz);
  let n = 0, sp = 0;
  STACK[sp++] = 0;
  while (sp) {
    const node = STACK[--sp];
    if (slab(B, node, ox, oy, oz, idx, idy, idz, tmin, tmax) === Infinity) continue;
    const l = B.left[node];
    if (l < 0) {
      const s = B.start[node], e = s + B.count[node];
      for (let i = s; i < e; i++) {
        const t = rayTri(B.tri, i * 9, ox, oy, oz, dx, dy, dz);
        if (t >= tmin && t <= tmax && n < outT.length) {
          const dn = B.nrm[i * 3] * dx + B.nrm[i * 3 + 1] * dy + B.nrm[i * 3 + 2] * dz;
          outT[n] = t; outS[n] = dn > 0 ? 1 : -1; n++;
        }
      }
    } else { STACK[sp++] = l; STACK[sp++] = l + 1; }
  }
  return n;
}

/* Nearest hit (optionally only exits: wantSign = +1, or entries: −1).
   Returns { t, tri } or null. */
export function rayFirst(B, o, d, tmin, tmax, wantSign = 0) {
  const [ox, oy, oz] = o, [dx, dy, dz] = d;
  const idx = safeInv(dx), idy = safeInv(dy), idz = safeInv(dz);
  let best = tmax, bestTri = -1, sp = 0;
  STACK[sp++] = 0;
  while (sp) {
    const node = STACK[--sp];
    if (slab(B, node, ox, oy, oz, idx, idy, idz, tmin, best) === Infinity) continue;
    const l = B.left[node];
    if (l < 0) {
      const s = B.start[node], e = s + B.count[node];
      for (let i = s; i < e; i++) {
        const t = rayTri(B.tri, i * 9, ox, oy, oz, dx, dy, dz);
        if (t >= tmin && t < best) {
          if (wantSign) {
            const dn = B.nrm[i * 3] * dx + B.nrm[i * 3 + 1] * dy + B.nrm[i * 3 + 2] * dz;
            if ((dn > 0 ? 1 : -1) !== wantSign) continue;
          }
          best = t; bestTri = i;
        }
      }
    } else {
      const tl = slab(B, l, ox, oy, oz, idx, idy, idz, tmin, best);
      const tr = slab(B, l + 1, ox, oy, oz, idx, idy, idz, tmin, best);
      if (tl < tr) { if (tr !== Infinity) STACK[sp++] = l + 1; if (tl !== Infinity) STACK[sp++] = l; }
      else { if (tl !== Infinity) STACK[sp++] = l; if (tr !== Infinity) STACK[sp++] = l + 1; }
    }
  }
  return bestTri < 0 ? null : { t: best, tri: bestTri };
}

/* Closest point on triangle (Ericson, Real-Time Collision Detection 5.1.5). */
export function closestPtTri(px, py, pz, T, o, out) {
  const ax = T[o], ay = T[o + 1], az = T[o + 2];
  const bx = T[o + 3], by = T[o + 4], bz = T[o + 5];
  const cx = T[o + 6], cy = T[o + 7], cz = T[o + 8];
  const abx = bx - ax, aby = by - ay, abz = bz - az;
  const acx = cx - ax, acy = cy - ay, acz = cz - az;
  const apx = px - ax, apy = py - ay, apz = pz - az;
  const d1 = abx * apx + aby * apy + abz * apz, d2 = acx * apx + acy * apy + acz * apz;
  if (d1 <= 0 && d2 <= 0) { out[0] = ax; out[1] = ay; out[2] = az; return; }
  const bpx = px - bx, bpy = py - by, bpz = pz - bz;
  const d3 = abx * bpx + aby * bpy + abz * bpz, d4 = acx * bpx + acy * bpy + acz * bpz;
  if (d3 >= 0 && d4 <= d3) { out[0] = bx; out[1] = by; out[2] = bz; return; }
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) {
    const v = d1 / (d1 - d3); out[0] = ax + v * abx; out[1] = ay + v * aby; out[2] = az + v * abz; return;
  }
  const cpx = px - cx, cpy = py - cy, cpz = pz - cz;
  const d5 = abx * cpx + aby * cpy + abz * cpz, d6 = acx * cpx + acy * cpy + acz * cpz;
  if (d6 >= 0 && d5 <= d6) { out[0] = cx; out[1] = cy; out[2] = cz; return; }
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) {
    const w = d2 / (d2 - d6); out[0] = ax + w * acx; out[1] = ay + w * acy; out[2] = az + w * acz; return;
  }
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
    const w = (d4 - d3) / ((d4 - d3) + (d5 - d6));
    out[0] = bx + w * (cx - bx); out[1] = by + w * (cy - by); out[2] = bz + w * (cz - bz); return;
  }
  const denom = 1 / (va + vb + vc);
  const v = vb * denom, w = vc * denom;
  out[0] = ax + abx * v + acx * w; out[1] = ay + aby * v + acy * w; out[2] = az + abz * v + acz * w;
}

function boxDist2(B, n, px, py, pz) {
  let d = 0, v;
  v = B.bmin[n * 3] - px; if (v > 0) d += v * v; else { v = px - B.bmax[n * 3]; if (v > 0) d += v * v; }
  v = B.bmin[n * 3 + 1] - py; if (v > 0) d += v * v; else { v = py - B.bmax[n * 3 + 1]; if (v > 0) d += v * v; }
  v = B.bmin[n * 3 + 2] - pz; if (v > 0) d += v * v; else { v = pz - B.bmax[n * 3 + 2]; if (v > 0) d += v * v; }
  return d;
}

/* Distance from point p to the surface (unsigned). Returns { dist, point, tri }. */
export function closestPoint(B, p, maxDist = Infinity) {
  const [px, py, pz] = p;
  let best2 = maxDist * maxDist, bestTri = -1, sp = 0;
  const q = [0, 0, 0], bp = [0, 0, 0];
  STACK[sp++] = 0;
  while (sp) {
    const node = STACK[--sp];
    if (boxDist2(B, node, px, py, pz) >= best2) continue;
    const l = B.left[node];
    if (l < 0) {
      const s = B.start[node], e = s + B.count[node];
      for (let i = s; i < e; i++) {
        closestPtTri(px, py, pz, B.tri, i * 9, q);
        const d2 = (q[0] - px) ** 2 + (q[1] - py) ** 2 + (q[2] - pz) ** 2;
        if (d2 < best2) { best2 = d2; bestTri = i; bp[0] = q[0]; bp[1] = q[1]; bp[2] = q[2]; }
      }
    } else {
      const dl = boxDist2(B, l, px, py, pz), dr = boxDist2(B, l + 1, px, py, pz);
      if (dl < dr) { STACK[sp++] = l + 1; STACK[sp++] = l; } else { STACK[sp++] = l; STACK[sp++] = l + 1; }
    }
  }
  return bestTri < 0 ? null : { dist: Math.sqrt(best2), point: bp, tri: bestTri };
}
