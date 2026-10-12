/* Binary STL writer (+ reader for round-trip checks). Zero dependencies.
   Layout: 80-byte header · uint32 triangle count · per triangle: normal
   (3×f32) + 3 vertices (9×f32) + uint16 attribute = 50 bytes, little-endian.
   Normals are computed in float64 from the (outward CCW) winding. */

import fs from 'node:fs';
import path from 'node:path';

function asMesh(meshOrManifold) {
  if (meshOrManifold && typeof meshOrManifold.getMesh === 'function') {
    const raw = meshOrManifold.getMesh();
    const np = raw.numProp || 3;
    const n = raw.vertProperties.length / np;
    const positions = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      positions[i * 3] = raw.vertProperties[i * np];
      positions[i * 3 + 1] = raw.vertProperties[i * np + 1];
      positions[i * 3 + 2] = raw.vertProperties[i * np + 2];
    }
    return { positions, indices: new Uint32Array(raw.triVerts) };
  }
  return meshOrManifold;
}

/* mesh {positions, indices} or Manifold → Buffer (binary STL). */
export function meshToSTL(meshOrManifold, header = 'GPS spacer positive - binary STL (mm)') {
  const { positions: P, indices: I } = asMesh(meshOrManifold);
  const nTri = I.length / 3;
  const buf = Buffer.alloc(84 + 50 * nTri);
  buf.write(header.slice(0, 79), 0, 'latin1');
  buf.writeUInt32LE(nTri, 80);
  let o = 84;
  for (let t = 0; t < nTri; t++) {
    const a = I[t * 3] * 3, b = I[t * 3 + 1] * 3, c = I[t * 3 + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
    const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    buf.writeFloatLE(nx, o); buf.writeFloatLE(ny, o + 4); buf.writeFloatLE(nz, o + 8);
    for (let k = 0; k < 3; k++) {
      const v = I[t * 3 + k] * 3;
      buf.writeFloatLE(P[v], o + 12 + k * 12);
      buf.writeFloatLE(P[v + 1], o + 16 + k * 12);
      buf.writeFloatLE(P[v + 2], o + 20 + k * 12);
    }
    buf.writeUInt16LE(0, o + 48);
    o += 50;
  }
  return buf;
}

/* Write a binary STL; creates the directory. Returns bytes written. */
export function writeSTL(file, meshOrManifold, header) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const buf = meshToSTL(meshOrManifold, header);
  fs.writeFileSync(file, buf);
  return buf.length;
}

/* Read a binary STL and weld coincident vertices (tol mm) → {positions, indices}. */
export function readSTL(bufOrFile, tol = 1e-5) {
  const buf = typeof bufOrFile === 'string' ? fs.readFileSync(bufOrFile) : bufOrFile;
  const nTri = buf.readUInt32LE(80);
  if (84 + 50 * nTri !== buf.length) throw new Error('readSTL: not a binary STL (size mismatch)');
  const inv = 1 / tol;
  const map = new Map();
  const pos = [];
  const idx = new Uint32Array(nTri * 3);
  let o = 84;
  for (let t = 0; t < nTri; t++) {
    for (let k = 0; k < 3; k++) {
      const x = buf.readFloatLE(o + 12 + k * 12), y = buf.readFloatLE(o + 16 + k * 12), z = buf.readFloatLE(o + 20 + k * 12);
      const key = `${Math.round(x * inv)},${Math.round(y * inv)},${Math.round(z * inv)}`;
      let id = map.get(key);
      if (id === undefined) { id = pos.length / 3; map.set(key, id); pos.push(x, y, z); }
      idx[t * 3 + k] = id;
    }
    o += 50;
  }
  return { positions: new Float32Array(pos), indices: idx };
}

/* Signed volume of a closed mesh (mm³). */
export function meshVolume({ positions: P, indices: I }) {
  let v = 0;
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
    v += P[a] * (P[b + 1] * P[c + 2] - P[b + 2] * P[c + 1])
       - P[a + 1] * (P[b] * P[c + 2] - P[b + 2] * P[c])
       + P[a + 2] * (P[b] * P[c + 1] - P[b + 1] * P[c]);
  }
  return v / 6;
}
