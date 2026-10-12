/* Dependency-free software renderer for spacer positives.
   Orthographic z-buffer rasterizer, Lambert + Blinn specular, PMMA ivory
   material, silhouette/occlusion outlines, supersampled anti-aliasing,
   10 mm scale bar, axis triad (X red, Y green, Z blue), dashed parting-plane
   trace (y = 0) in views where the plane is edge-on. PNG encode/decode is
   written here on top of node:zlib.

   Images are { width, height, data: Uint8Array RGB }. */

import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dt = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/* Camera looks ALONG dir; up is projected to screen-up.
   front   : along −Y onto the XZ plane (the parting-plane view)
   lateral : along +X (camera on the lateral side, −X)
   oblique : 3/4 from anterior–medial–superior
   top     : along −Z (from above; +X right, +Y up) */
export const VIEWS = {
  front: { dir: [0, -1, 0], up: [0, 0, 1] },
  lateral: { dir: [1, 0, 0], up: [0, 0, 1] },
  oblique: { dir: nrm([-0.5, -0.78, -0.36]), up: [0, 0, 1] },
  top: { dir: [0, 0, -1], up: [0, 1, 0] },
};
export const VIEW_NAMES = Object.keys(VIEWS);

export const PMMA_IVORY = [236, 226, 200];
export const BACKGROUND = [248, 248, 246];

/* ------------------------------------------------------------------ */
/* 5×7 bitmap font (uppercase, digits, a few symbols)                  */
/* ------------------------------------------------------------------ */
const FONT = {
  A: '01110,10001,10001,11111,10001,10001,10001', B: '11110,10001,10001,11110,10001,10001,11110',
  C: '01110,10001,10000,10000,10000,10001,01110', D: '11110,10001,10001,10001,10001,10001,11110',
  E: '11111,10000,10000,11110,10000,10000,11111', F: '11111,10000,10000,11110,10000,10000,10000',
  G: '01110,10001,10000,10111,10001,10001,01111', H: '10001,10001,10001,11111,10001,10001,10001',
  I: '01110,00100,00100,00100,00100,00100,01110', J: '00111,00010,00010,00010,00010,10010,01100',
  K: '10001,10010,10100,11000,10100,10010,10001', L: '10000,10000,10000,10000,10000,10000,11111',
  M: '10001,11011,10101,10101,10001,10001,10001', N: '10001,10001,11001,10101,10011,10001,10001',
  O: '01110,10001,10001,10001,10001,10001,01110', P: '11110,10001,10001,11110,10000,10000,10000',
  Q: '01110,10001,10001,10001,10101,10010,01101', R: '11110,10001,10001,11110,10100,10010,10001',
  S: '01111,10000,10000,01110,00001,00001,11110', T: '11111,00100,00100,00100,00100,00100,00100',
  U: '10001,10001,10001,10001,10001,10001,01110', V: '10001,10001,10001,10001,10001,01010,00100',
  W: '10001,10001,10001,10101,10101,10101,01010', X: '10001,10001,01010,00100,01010,10001,10001',
  Y: '10001,10001,01010,00100,00100,00100,00100', Z: '11111,00001,00010,00100,01000,10000,11111',
  0: '01110,10001,10011,10101,11001,10001,01110', 1: '00100,01100,00100,00100,00100,00100,01110',
  2: '01110,10001,00001,00010,00100,01000,11111', 3: '11111,00010,00100,00010,00001,10001,01110',
  4: '00010,00110,01010,10010,11111,00010,00010', 5: '11111,10000,11110,00001,00001,10001,01110',
  6: '00110,01000,10000,11110,10001,10001,01110', 7: '11111,00001,00010,00100,01000,01000,01000',
  8: '01110,10001,10001,01110,10001,10001,01110', 9: '01110,10001,10001,01111,00001,00010,01100',
  '-': '00000,00000,00000,11111,00000,00000,00000', '.': '00000,00000,00000,00000,00000,01100,01100',
  ':': '00000,01100,01100,00000,01100,01100,00000', '/': '00001,00001,00010,00100,01000,10000,10000',
  '_': '00000,00000,00000,00000,00000,00000,11111', '=': '00000,00000,11111,00000,11111,00000,00000',
  '(': '00010,00100,01000,01000,01000,00100,00010', ')': '01000,00100,00010,00010,00010,00100,01000',
  ',': '00000,00000,00000,00000,01100,00100,01000', '+': '00000,00100,00100,11111,00100,00100,00000',
  ' ': '00000,00000,00000,00000,00000,00000,00000',
};
const GLYPHS = Object.fromEntries(Object.entries(FONT).map(([k, v]) => [k, v.split(',').map((r) => parseInt(r, 2))]));

export function textWidth(str, s = 2) { return str.length * 6 * s - s; }

export function drawText(img, str, x0, y0, color = [40, 40, 40], s = 2) {
  let x = x0;
  for (const ch of String(str).toUpperCase()) {
    const g = GLYPHS[ch] || GLYPHS[' '];
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) {
      if (!(g[r] & (1 << (4 - c)))) continue;
      for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) setPx(img, x + c * s + dx, y0 + r * s + dy, color);
    }
    x += 6 * s;
  }
}

function setPx(img, x, y, c, a = 1) {
  x |= 0; y |= 0;
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const o = (y * img.width + x) * 3;
  if (a >= 1) { img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; return; }
  img.data[o] = img.data[o] * (1 - a) + c[0] * a;
  img.data[o + 1] = img.data[o + 1] * (1 - a) + c[1] * a;
  img.data[o + 2] = img.data[o + 2] * (1 - a) + c[2] * a;
}

function fillRect(img, x0, y0, w, h, c) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) setPx(img, x, y, c);
}

function drawLine(img, x0, y0, x1, y1, c, width = 2) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) + 1;
  const r = width / 2;
  for (let i = 0; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
    for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++)
      if (dx * dx + dy * dy <= r * r + 0.25) setPx(img, Math.round(x + dx), Math.round(y + dy), c);
  }
}

export function newImage(w, h, bg = BACKGROUND) {
  const data = new Uint8Array(w * h * 3);
  for (let i = 0; i < w * h; i++) { data[i * 3] = bg[0]; data[i * 3 + 1] = bg[1]; data[i * 3 + 2] = bg[2]; }
  return { width: w, height: h, data };
}

/* ------------------------------------------------------------------ */

function asMesh(m) {
  if (m && typeof m.getMesh === 'function') {
    const raw = m.getMesh();
    const np = raw.numProp || 3;
    const n = raw.vertProperties.length / np;
    const positions = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) positions[i * 3 + k] = raw.vertProperties[i * np + k];
    return { positions, indices: new Uint32Array(raw.triVerts) };
  }
  return m;
}

function camera(view) {
  const v = typeof view === 'string' ? VIEWS[view] : view;
  if (!v) throw new Error(`unknown view ${view}`);
  const f = nrm(v.dir);
  const r = nrm(crs(f, v.up));
  const u = crs(r, f);
  return { f, r, u };
}

/* Render one view → image. opts: view, pxPerMm (4), ss (2 supersampling),
   margin (28 px), color, bg, label, scaleBarMm (10), parting (true),
   axes (true), outline (true), marks ([{p:[x,y,z], color}]). */
export function renderView(meshOrManifold, opts = {}) {
  const o = {
    view: 'front', pxPerMm: 4, ss: 2, margin: 28, color: PMMA_IVORY, bg: BACKGROUND, label: '',
    scaleBarMm: 10, parting: true, axes: true, outline: true, marks: [], ...opts,
  };
  const mesh = asMesh(meshOrManifold);
  const P = mesh.positions, I = mesh.indices;
  const nV = P.length / 3, nT = I.length / 3;
  const { f, r, u } = camera(o.view);

  // project
  const sx = new Float64Array(nV), sy = new Float64Array(nV), sz = new Float64Array(nV);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i < nV; i++) {
    const p = [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]];
    sx[i] = dt(p, r); sy[i] = dt(p, u); sz[i] = dt(p, f);
    if (sx[i] < x0) x0 = sx[i]; if (sx[i] > x1) x1 = sx[i];
    if (sy[i] < y0) y0 = sy[i]; if (sy[i] > y1) y1 = sy[i];
  }
  if (!nV) { x0 = y0 = -10; x1 = y1 = 10; }
  const top = o.label ? 30 : 8, bottom = 44;
  const objW = Math.ceil((x1 - x0) * o.pxPerMm);
  // wide enough for the label and for scale bar + axis triad; object centred
  const W = Math.max(objW + 2 * o.margin, o.label ? textWidth(o.label, 2) + 2 * o.margin : 0, 170);
  const H = Math.ceil((y1 - y0) * o.pxPerMm) + 2 * o.margin + top + bottom;
  const padX = Math.floor((W - objW) / 2);
  const ss = o.ss, S = o.pxPerMm * ss, WS = W * ss, HS = H * ss;
  const offX = padX * ss, offY = (o.margin + top) * ss;
  const toX = (v) => (v - x0) * S + offX;
  const toY = (v) => (y1 - v) * S + offY;

  // vertex normals (area weighted)
  const vn = new Float64Array(nV * 3);
  const fnArr = new Float64Array(nT * 3);
  for (let t = 0; t < nT; t++) {
    const a = I[t * 3] * 3, b = I[t * 3 + 1] * 3, c = I[t * 3 + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
    const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    fnArr[t * 3] = nx; fnArr[t * 3 + 1] = ny; fnArr[t * 3 + 2] = nz;
    for (const q of [a, b, c]) { vn[q] += nx; vn[q + 1] += ny; vn[q + 2] += nz; }
  }
  for (let i = 0; i < nV; i++) {
    const l = Math.hypot(vn[i * 3], vn[i * 3 + 1], vn[i * 3 + 2]) || 1;
    vn[i * 3] /= l; vn[i * 3 + 1] /= l; vn[i * 3 + 2] /= l;
  }

  // lights (world directions toward the light)
  const L1 = nrm([-f[0] * 0.75 + u[0] * 0.55 - r[0] * 0.4, -f[1] * 0.75 + u[1] * 0.55 - r[1] * 0.4, -f[2] * 0.75 + u[2] * 0.55 - r[2] * 0.4]);
  const L2 = nrm([-f[0] * 0.6 - u[0] * 0.2 + r[0] * 0.65, -f[1] * 0.6 - u[1] * 0.2 + r[1] * 0.65, -f[2] * 0.6 - u[2] * 0.2 + r[2] * 0.65]);
  const V = [-f[0], -f[1], -f[2]];
  const H1 = nrm([L1[0] + V[0], L1[1] + V[1], L1[2] + V[2]]);
  const creaseCos = Math.cos(35 * Math.PI / 180);

  const depth = new Float32Array(WS * HS).fill(Infinity);
  const col = new Uint8Array(WS * HS * 3);
  const base = o.color;

  const cn = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let t = 0; t < nT; t++) {
    let fx = fnArr[t * 3], fy = fnArr[t * 3 + 1], fz = fnArr[t * 3 + 2];
    const fl = Math.hypot(fx, fy, fz);
    if (!fl) continue;
    fx /= fl; fy /= fl; fz /= fl;
    if (fx * f[0] + fy * f[1] + fz * f[2] > 1e-9) continue; // back face (closed mesh)
    const ia = I[t * 3], ib = I[t * 3 + 1], ic = I[t * 3 + 2];
    const ax = toX(sx[ia]), ay = toY(sy[ia]), bx = toX(sx[ib]), by = toY(sy[ib]), cx = toX(sx[ic]), cy = toY(sy[ic]);
    const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (Math.abs(area) < 1e-12) continue;
    const vs = [ia, ib, ic];
    for (let k = 0; k < 3; k++) {
      const q = vs[k] * 3;
      const d = vn[q] * fx + vn[q + 1] * fy + vn[q + 2] * fz;
      if (d > creaseCos) { cn[k][0] = vn[q]; cn[k][1] = vn[q + 1]; cn[k][2] = vn[q + 2]; }
      else { cn[k][0] = fx; cn[k][1] = fy; cn[k][2] = fz; }
    }
    const za = sz[ia], zb = sz[ib], zc = sz[ic];
    const minX = Math.max(0, Math.floor(Math.min(ax, bx, cx))), maxX = Math.min(WS - 1, Math.ceil(Math.max(ax, bx, cx)));
    const minY = Math.max(0, Math.floor(Math.min(ay, by, cy))), maxY = Math.min(HS - 1, Math.ceil(Math.max(ay, by, cy)));
    const inv = 1 / area;
    for (let py = minY; py <= maxY; py++) {
      const yc = py + 0.5;
      for (let px = minX; px <= maxX; px++) {
        const xc = px + 0.5;
        const w0 = ((bx - xc) * (cy - yc) - (by - yc) * (cx - xc)) * inv;
        const w1 = ((cx - xc) * (ay - yc) - (cy - yc) * (ax - xc)) * inv;
        const w2 = 1 - w0 - w1;
        if (w0 < -1e-9 || w1 < -1e-9 || w2 < -1e-9) continue;
        const z = w0 * za + w1 * zb + w2 * zc;
        const pi = py * WS + px;
        if (z >= depth[pi]) continue;
        depth[pi] = z;
        let nx = w0 * cn[0][0] + w1 * cn[1][0] + w2 * cn[2][0];
        let ny = w0 * cn[0][1] + w1 * cn[1][1] + w2 * cn[2][1];
        let nz = w0 * cn[0][2] + w1 * cn[1][2] + w2 * cn[2][2];
        const nl = Math.hypot(nx, ny, nz) || 1;
        nx /= nl; ny /= nl; nz /= nl;
        const d1 = Math.max(0, nx * L1[0] + ny * L1[1] + nz * L1[2]);
        const d2 = Math.max(0, nx * L2[0] + ny * L2[1] + nz * L2[2]);
        const hemi = 0.5 + 0.5 * (nx * u[0] + ny * u[1] + nz * u[2]);
        const amb = 0.22 + 0.12 * hemi;
        const sp = 0.30 * Math.pow(Math.max(0, nx * H1[0] + ny * H1[1] + nz * H1[2]), 48);
        const k = amb + 0.62 * d1 + 0.2 * d2;
        col[pi * 3] = Math.min(255, base[0] * k + 255 * sp);
        col[pi * 3 + 1] = Math.min(255, base[1] * k + 255 * sp);
        col[pi * 3 + 2] = Math.min(255, base[2] * k + 255 * sp);
      }
    }
  }

  // compose at supersampled resolution: background, parting trace, outlines
  const big = newImage(WS, HS, o.bg);
  const edgeCol = [88, 76, 58];
  const partCol = [70, 130, 190];
  const ry = r[1], uy = u[1];
  const partingOn = o.parting && Math.abs(f[1]) < 1e-6 && Math.hypot(ry, uy) > 1e-6;
  const rad = ss; // outline half-width in ss pixels (≈1 final px)
  const thr = 1.2; // mm depth jump that counts as an occluding edge
  for (let py = 0; py < HS; py++) {
    for (let px = 0; px < WS; px++) {
      const pi = py * WS + px;
      const inObj = depth[pi] !== Infinity;
      if (inObj) {
        big.data[pi * 3] = col[pi * 3]; big.data[pi * 3 + 1] = col[pi * 3 + 1]; big.data[pi * 3 + 2] = col[pi * 3 + 2];
      }
      if (partingOn) {
        const X = (px + 0.5 - offX) / S + x0, Y = y1 - (py + 0.5 - offY) / S;
        const dist = Math.abs(X * ry + Y * uy) / Math.hypot(ry, uy) * S;
        if (dist < 0.75 * ss) {
          const along = (-X * uy + Y * ry) * S;
          if (Math.floor(along / (7 * ss)) % 2 === 0) setPx(big, px, py, partCol, inObj ? 0.35 : 0.9);
        }
      }
      if (o.outline && inObj) {
        let edge = false;
        for (let dy = -rad; dy <= rad && !edge; dy++) for (let dx = -rad; dx <= rad; dx++) {
          if (!dx && !dy) continue;
          const qx = px + dx, qy = py + dy;
          if (qx < 0 || qy < 0 || qx >= WS || qy >= HS) { edge = true; break; }
          const dq = depth[qy * WS + qx];
          if (dq === Infinity || dq < depth[pi] - thr) { edge = true; break; }
        }
        if (edge) setPx(big, px, py, edgeCol, 0.85);
      }
    }
  }

  // downsample
  const img = newImage(W, H, o.bg);
  const n2 = ss * ss;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let a = 0, b = 0, c = 0;
    for (let dy = 0; dy < ss; dy++) for (let dx = 0; dx < ss; dx++) {
      const q = ((y * ss + dy) * WS + (x * ss + dx)) * 3;
      a += big.data[q]; b += big.data[q + 1]; c += big.data[q + 2];
    }
    const q = (y * W + x) * 3;
    img.data[q] = a / n2; img.data[q + 1] = b / n2; img.data[q + 2] = c / n2;
  }

  // overlays (final resolution)
  const toXf = (v) => (v - x0) * o.pxPerMm + padX;
  const toYf = (v) => (y1 - v) * o.pxPerMm + o.margin + top;
  for (const m of o.marks || []) {
    const X = toXf(dt(m.p, r)), Y = toYf(dt(m.p, u));
    const c = m.color || [200, 40, 40];
    drawLine(img, X - 5, Y, X + 5, Y, c, 1.5); drawLine(img, X, Y - 5, X, Y + 5, c, 1.5);
  }
  if (o.label) drawText(img, o.label, o.margin, 8, [45, 45, 45], 2);
  if (o.scaleBarMm) {
    const L = Math.round(o.scaleBarMm * o.pxPerMm);
    const bx = o.margin, by = H - 16;
    fillRect(img, bx, by, L, 4, [30, 30, 30]);
    fillRect(img, bx, by - 5, 2, 9, [30, 30, 30]);
    fillRect(img, bx + L - 2, by - 5, 2, 9, [30, 30, 30]);
    drawText(img, `${o.scaleBarMm} MM`, bx, by - 22, [30, 30, 30], 2);
  }
  if (o.axes) {
    const cxA = W - o.margin - 26, cyA = H - 26, Lp = 20;
    const axes = [[[1, 0, 0], [200, 55, 45], 'X'], [[0, 1, 0], [50, 150, 70], 'Y'], [[0, 0, 1], [50, 90, 205], 'Z']];
    for (const [e, c, name] of axes) {
      const ex = dt(e, r) * Lp, ey = -dt(e, u) * Lp;
      if (Math.hypot(ex, ey) < 4) {
        // axis along the view direction: dot = toward viewer, ring = away
        const toward = dt(e, f) < 0;
        for (let a = 0; a < 24; a++) {
          const th = a / 24 * 2 * Math.PI;
          setPx(img, cxA + Math.round(4 * Math.cos(th)), cyA + Math.round(4 * Math.sin(th)), c);
        }
        if (toward) fillRect(img, cxA - 1, cyA - 1, 3, 3, c);
        drawText(img, name, cxA + 7, cyA + 3, c, 1);
        continue;
      }
      drawLine(img, cxA, cyA, cxA + ex, cyA + ey, c, 2);
      drawText(img, name, cxA + ex * 1.25 - 2, cyA + ey * 1.25 - 3, c, 1);
    }
  }
  img.view = typeof o.view === 'string' ? o.view : 'custom';
  img.pxPerMm = o.pxPerMm;
  return img;
}

/* Several views of one mesh → { [view]: image }. */
export function renderViews(meshOrManifold, views = VIEW_NAMES, opts = {}) {
  const mesh = asMesh(meshOrManifold);
  const out = {};
  for (const v of views) out[v] = renderView(mesh, { ...opts, view: v, label: opts.label ? `${opts.label} ${v}` : v });
  return out;
}

/* Tile images (image objects, PNG Buffers or PNG file paths) into one image.
   opts: cols (default all in one row), gap (12), bg, labels ([] per cell). */
export function renderSheet(list, opts = {}) {
  const imgs = list.map((it) => (typeof it === 'string' ? decodePNG(fs.readFileSync(it))
    : Buffer.isBuffer(it) ? decodePNG(it) : it));
  const n = imgs.length;
  const cols = Math.max(1, Math.min(n, opts.cols || n));
  const rows = Math.ceil(n / cols);
  const gap = opts.gap ?? 12;
  const bg = opts.bg || BACKGROUND;
  const cw = Math.max(...imgs.map((i) => i.width)), ch = Math.max(...imgs.map((i) => i.height));
  const lab = opts.labels ? 26 : 0;
  const sheet = newImage(cols * cw + (cols + 1) * gap, rows * (ch + lab) + (rows + 1) * gap, bg);
  imgs.forEach((im, k) => {
    const cx = gap + (k % cols) * (cw + gap), cy = gap + Math.floor(k / cols) * (ch + lab + gap);
    if (opts.labels && opts.labels[k]) drawText(sheet, opts.labels[k], cx + 4, cy + 4, [40, 40, 40], 2);
    const ox = cx + ((cw - im.width) >> 1), oy = cy + lab + (ch - im.height);   // bottom-aligned
    for (let y = 0; y < im.height; y++) {
      const src = y * im.width * 3, dst = ((oy + y) * sheet.width + ox) * 3;
      sheet.data.set(im.data.subarray(src, src + im.width * 3), dst);
    }
  });
  return sheet;
}

/* Fraction of pixels that differ from the background (render sanity). */
export function nonBackgroundFraction(img, bg = BACKGROUND, tol = 6) {
  let n = 0;
  const N = img.width * img.height;
  for (let i = 0; i < N; i++) {
    if (Math.abs(img.data[i * 3] - bg[0]) > tol || Math.abs(img.data[i * 3 + 1] - bg[1]) > tol || Math.abs(img.data[i * 3 + 2] - bg[2]) > tol) n++;
  }
  return n / N;
}

/* ------------------------------------------------------------------ */
/* PNG                                                                 */
/* ------------------------------------------------------------------ */
const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
export function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const head = Buffer.alloc(4);
  head.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([head, td, crc]);
}

/* RGB image → PNG Buffer (8-bit truecolour, Sub filter, zlib deflate). */
export function encodePNG(img) {
  const { width: w, height: h, data } = img;
  const stride = w * 3;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    const o = y * (stride + 1), row = y * stride;
    raw[o] = 1;
    for (let x = 0; x < stride; x++) raw[o + 1 + x] = (data[row + x] - (x >= 3 ? data[row + x - 3] : 0)) & 0xFF;
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([PNG_SIG, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 7 })), chunk('IEND', Buffer.alloc(0))]);
}

/* PNG Buffer → RGB image. 8-bit, non-interlaced, grey / RGB / grey+A / RGBA. */
export function decodePNG(buf) {
  if (!buf.subarray(0, 8).equals(PNG_SIG)) throw new Error('decodePNG: bad signature');
  let o = 8, w = 0, h = 0, ct = 0, depthBits = 0, interlace = 0;
  const idat = [];
  while (o < buf.length) {
    const n = buf.readUInt32BE(o), type = buf.toString('latin1', o + 4, o + 8);
    const data = buf.subarray(o + 8, o + 8 + n);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depthBits = data[8]; ct = data[9]; interlace = data[12]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    o += 12 + n;
  }
  if (depthBits !== 8 || interlace) throw new Error('decodePNG: only 8-bit non-interlaced');
  const ch = { 0: 1, 2: 3, 4: 2, 6: 4 }[ct];
  if (!ch) throw new Error(`decodePNG: colour type ${ct} unsupported`);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * ch;
  const px = new Uint8Array(stride * h);
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1, dst = y * stride, prev = dst - stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? px[dst + x - ch] : 0;
      const b = y > 0 ? px[prev + x] : 0;
      const c = x >= ch && y > 0 ? px[prev + x - ch] : 0;
      let v = raw[src + x];
      if (ft === 1) v += a;
      else if (ft === 2) v += b;
      else if (ft === 3) v += (a + b) >> 1;
      else if (ft === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      px[dst + x] = v & 0xFF;
    }
  }
  const img = newImage(w, h);
  for (let i = 0; i < w * h; i++) {
    if (ch >= 3) { img.data[i * 3] = px[i * ch]; img.data[i * 3 + 1] = px[i * ch + 1]; img.data[i * 3 + 2] = px[i * ch + 2]; }
    else { img.data[i * 3] = img.data[i * 3 + 1] = img.data[i * 3 + 2] = px[i * ch]; }
  }
  return img;
}

export function writePNG(file, img) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const buf = encodePNG(img);
  fs.writeFileSync(file, buf);
  return buf.length;
}
