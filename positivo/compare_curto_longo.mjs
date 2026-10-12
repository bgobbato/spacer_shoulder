/* render/COMPARACAO_C_curto_longo.png: C curto + dreno vs C longo (head 48),
   front and lateral views, same scale (4 px/mm), images TOP-aligned so the
   heads sit on one line and the extra stem of the long variant shows below.
   Reads stl/C_h48.stl and stl/C_longo_h48.stl (run build.mjs first). */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as R from './src/render.mjs';
import { readSTL } from './src/stl.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const D = Number(process.argv[2] || 48);
const views = ['front', 'lateral'];
const cols = [
  { file: `C_h${D}.stl`, title: 'C CURTO + DRENO', sub: '110 MM + DRENO DE TORAX' },
  { file: `C_longo_h${D}.stl`, title: 'C LONGO', sub: '150 MM, SEM DRENO' },
];
const px = 4;
const imgs = cols.map((c) => {
  const mesh = readSTL(path.join(ROOT, 'stl', c.file));
  return views.map((v) => R.renderView(mesh, { view: v, pxPerMm: px, label: `${c.title} H${D} ${v === 'front' ? 'FRENTE' : 'LATERAL'}` }));
});
const cw = Math.max(...imgs.flat().map((i) => i.width));
const ch = Math.max(...imgs.flat().map((i) => i.height));
const gap = 18, head = 70;
const W = gap + cols.length * views.length * (cw + gap), H = head + ch + gap;
const sheet = R.newImage(W, H);
R.drawText(sheet, `ESPACADOR C - CURTO X LONGO - CABECA ${D} - MESMA ESCALA ${px} PX/MM`, gap, 14, [30, 30, 30], 2);
cols.forEach((c, i) => {
  const x0 = gap + i * views.length * (cw + gap);
  R.drawText(sheet, `${c.title}: ${c.sub}`, x0, 42, i ? [40, 110, 60] : [60, 60, 60], 2);
  imgs[i].forEach((im, j) => {
    const ox = x0 + j * (cw + gap) + ((cw - im.width) >> 1), oy = head;   // top-aligned: heads on one line
    for (let y = 0; y < im.height; y++) sheet.data.set(im.data.subarray(y * im.width * 3, (y + 1) * im.width * 3), ((oy + y) * W + ox) * 3);
  });
});
const out = path.join(ROOT, 'render', `COMPARACAO_C_curto_longo.png`);
R.writePNG(out, sheet);
console.log(out, W, H);
