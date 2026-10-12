/* Binary STL read (with weld) and write. Browser-safe (ArrayBuffer only). */

import { toArrays } from './geom.mjs';

/* ArrayBuffer | Uint8Array → { positions, indices } with exact-coordinate
   weld (STL soup → shared vertices; float32 coordinates repeat bit-exactly). */
export function parseSTL(buf) {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const nTri = dv.getUint32(80, true);
  if (84 + 50 * nTri !== u8.byteLength) throw new Error('parseSTL: not a binary STL (size mismatch)');
  const map = new Map();
  const pos = [];
  const idx = new Uint32Array(nTri * 3);
  let o = 84;
  for (let t = 0; t < nTri; t++) {
    for (let k = 0; k < 3; k++) {
      const x = dv.getFloat32(o + 12 + k * 12, true), y = dv.getFloat32(o + 16 + k * 12, true), z = dv.getFloat32(o + 20 + k * 12, true);
      const key = `${x},${y},${z}`;
      let id = map.get(key);
      if (id === undefined) { id = pos.length / 3; map.set(key, id); pos.push(x, y, z); }
      idx[t * 3 + k] = id;
    }
    o += 50;
  }
  return { positions: new Float32Array(pos), indices: idx };
}

/* Manifold or {positions, indices} → Uint8Array binary STL. */
export function toSTL(meshOrManifold, header = 'GPS spacer mold (mm)') {
  const { positions: P, indices: I } = typeof meshOrManifold.getMesh === 'function' ? toArrays(meshOrManifold) : meshOrManifold;
  const n = I.length / 3;
  const out = new Uint8Array(84 + 50 * n);
  const dv = new DataView(out.buffer);
  const h = String(header).slice(0, 79);
  for (let i = 0; i < h.length; i++) out[i] = h.charCodeAt(i) & 0x7f;
  dv.setUint32(80, n, true);
  let o = 84;
  for (let t = 0; t < n; t++) {
    const a = I[t * 3] * 3, b = I[t * 3 + 1] * 3, c = I[t * 3 + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
    const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    dv.setFloat32(o, nx, true); dv.setFloat32(o + 4, ny, true); dv.setFloat32(o + 8, nz, true);
    for (const [k, q] of [[0, a], [1, b], [2, c]]) {
      dv.setFloat32(o + 12 + k * 12, P[q], true);
      dv.setFloat32(o + 16 + k * 12, P[q + 1], true);
      dv.setFloat32(o + 20 + k * 12, P[q + 2], true);
    }
    o += 50;
  }
  return out;
}
