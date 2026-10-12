import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const R = await import(path.join(ROOT, 'src/render.mjs'));
const S = await import(path.join(ROOT, 'src/stl.mjs'));
const views = ['front', 'lateral', 'oblique'];
const rows = [
  { id: 'A', name: 'COLHER', col: [214, 96, 40] },
  { id: 'B', name: 'ANATOMICO', col: [40, 110, 190] },
  { id: 'C', name: 'COGUMELO', col: [60, 150, 80] },
];
const px = 4;
const imgs = rows.map((r) => {
  const mesh = S.readSTL(path.join(ROOT, 'stl', `${r.id}_h48.stl`));
  return views.map((v) => R.renderView(mesh, { view: v, pxPerMm: px, label: `${r.id} H48 ${v}` }));
});
const cw = Math.max(...imgs.flat().map((i) => i.width));
const ch = Math.max(...imgs.flat().map((i) => i.height));
const tab = 130, gap = 14, head = 60;
const W = tab + views.length * (cw + gap) + gap, H = head + rows.length * (ch + gap) + gap;
const sheet = R.newImage(W, H);
R.drawText(sheet, 'ESPACADOR UMERO - POSITIVOS CABECA 48 - MESMA ESCALA 4 PX/MM', gap, 14, [30, 30, 30], 2);
views.forEach((v, j) => {
  const t = ({front:'FRENTE',lateral:'LATERAL',oblique:'OBLIQUA'})[v];
  R.drawText(sheet, t, tab + gap + j * (cw + gap) + ((cw - R.textWidth(t, 3)) >> 1), 36, [60, 60, 60], 3);
});
const fill = (x0, y0, w, h, c) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { const k = (y * W + x) * 3; sheet.data[k] = c[0]; sheet.data[k + 1] = c[1]; sheet.data[k + 2] = c[2]; } };
rows.forEach((r, i) => {
  const y0 = head + gap + i * (ch + gap);
  fill(gap, y0, tab - gap, ch, r.col);
  R.drawText(sheet, r.id, gap + ((tab - gap - R.textWidth(r.id, 10)) >> 1), y0 + (ch >> 1) - 50, [255, 255, 255], 10);
  R.drawText(sheet, r.name, gap + ((tab - gap - R.textWidth(r.name, 2)) >> 1), y0 + (ch >> 1) + 40, [255, 255, 255], 2);
  imgs[i].forEach((im, j) => {
    const ox = tab + gap + j * (cw + gap) + ((cw - im.width) >> 1), oy = y0 + (ch - im.height); // bottom-aligned: tips on one line
    for (let y = 0; y < im.height; y++) sheet.data.set(im.data.subarray(y * im.width * 3, (y + 1) * im.width * 3), ((oy + y) * W + ox) * 3);
  });
  if (i > 0) fill(gap, y0 - (gap >> 1) - 1, W - 2 * gap, 2, [200, 200, 200]);
});
R.writePNG(path.join(ROOT, 'render', 'COMPARACAO.png'), sheet);
console.log(W, H);
