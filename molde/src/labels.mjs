/* Engraved text and 1:1 gauges on the outer faces (single-stroke font).
   Glyphs on a 4 × 6 grid, (0,0) bottom-left. Only the characters the mold
   needs. Strokes become 2D CrossSections; mold.mjs extrudes them into the
   outer face. */

import { strokeCS } from './geom.mjs';

const O = [[1, 0], [3, 0], [4, 1], [4, 5], [3, 6], [1, 6], [0, 5], [0, 1], [1, 0]];
export const GLYPHS = {
  '0': [[[0, 0], [4, 0], [4, 6], [0, 6], [0, 0]], [[0, 0], [4, 6]]],
  '1': [[[1, 5], [2, 6], [2, 0]], [[1, 0], [3, 0]]],
  '2': [[[0, 5], [1, 6], [3, 6], [4, 5], [4, 4], [0, 0], [4, 0]]],
  '3': [[[0, 6], [4, 6], [2, 3.5], [3, 3.5], [4, 2.5], [4, 1], [3, 0], [0, 0]]],
  '4': [[[3, 0], [3, 6], [0, 2], [4, 2]]],
  '5': [[[4, 6], [0.5, 6], [0, 3.2], [3, 3.6], [4, 2.5], [4, 1], [3, 0], [0, 0]]],
  '6': [[[4, 6], [1, 6], [0, 5], [0, 0], [4, 0], [4, 3], [0, 3]]],
  '7': [[[0, 6], [4, 6], [1, 0]]],
  '8': [[[0, 0], [4, 0], [4, 6], [0, 6], [0, 0]], [[0, 3], [4, 3]]],
  '9': [[[0, 0], [4, 0], [4, 6], [0, 6], [0, 3], [4, 3]]],
  A: [[[0, 0], [0, 4], [2, 6], [4, 4], [4, 0]], [[0, 2.5], [4, 2.5]]],
  C: [[[4, 5], [3, 6], [1, 6], [0, 5], [0, 1], [1, 0], [3, 0], [4, 1]]],
  D: [[[0, 0], [0, 6], [3, 6], [4, 5], [4, 1], [3, 0], [0, 0]]],
  E: [[[4, 6], [0, 6], [0, 0], [4, 0]], [[0, 3], [3, 3]]],
  F: [[[4, 6], [0, 6], [0, 0]], [[0, 3], [3, 3]]],
  G: [[[4, 5], [3, 6], [1, 6], [0, 5], [0, 1], [1, 0], [3, 0], [4, 1], [4, 3], [2, 3]]],
  H: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]],
  I: [[[2, 0], [2, 6]], [[1, 0], [3, 0]], [[1, 6], [3, 6]]],
  L: [[[0, 6], [0, 0], [4, 0]]],
  M: [[[0, 0], [0, 6], [2, 3], [4, 6], [4, 0]]],
  N: [[[0, 0], [0, 6], [4, 0], [4, 6]]],
  O: [O],
  P: [[[0, 0], [0, 6], [4, 6], [4, 3], [0, 3]]],
  R: [[[0, 0], [0, 6], [4, 6], [4, 3], [0, 3], [4, 0]]],
  S: [[[4, 5], [3, 6], [1, 6], [0, 5], [0, 4], [4, 2], [4, 1], [3, 0], [1, 0], [0, 1]]],
  T: [[[0, 6], [4, 6]], [[2, 6], [2, 0]]],
  U: [[[0, 6], [0, 0], [4, 0], [4, 6]]],
  V: [[[0, 6], [2, 0], [4, 6]]],
  X: [[[0, 0], [4, 6]], [[0, 6], [4, 0]]],
  '-': [[[0.5, 3], [3.5, 3]]],
  '.': [[[1.6, 0], [2.4, 0]]],
  '>': [[[0, 6], [4, 3], [0, 0]]],
  '<': [[[4, 6], [0, 3], [4, 0]]],
  ' ': [],
};

const ADV = 6; // advance per char in grid units (4 glyph + 2 space)

export function textWidth(str, h) { return str.length ? ((str.length * ADV - 2) * h) / 6 : 0; }

/* Strokes of a text in 2D (u right, v up), baseline at v = 0, starting u = 0. */
export function textStrokes(str, h) {
  const s = h / 6;
  const out = [];
  [...str.toUpperCase()].forEach((ch, i) => {
    const g = GLYPHS[ch];
    if (!g) throw new Error(`glyph '${ch}' not in the engraving font`);
    for (const line of g) out.push(line.map(([a, b]) => [(a + i * ADV) * s, b * s]));
  });
  return out;
}

/* Place text on the XZ plane. dirX = +1: reading direction +X (seen from −Y);
   dirX = −1: reading direction −X (seen from +Y). (x0, z0) = start of the
   baseline; centered when align = 'center'. Returns polylines in (x, z). */
export function placeText(str, h, x0, z0, dirX, align = 'center') {
  const w = textWidth(str, h);
  const u0 = align === 'center' ? -w / 2 : 0;
  return textStrokes(str, h).map((l) => l.map(([u, v]) => [x0 + dirX * (u + u0), z0 + v]));
}

export function strokesToCS(E, polylines, w) {
  const parts = polylines.filter((l) => l.length >= 2).map((l) => strokeCS(E, l, w));
  if (!parts.length) return null;
  return E.CrossSection.union(parts);
}
