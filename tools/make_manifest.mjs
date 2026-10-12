#!/usr/bin/env node
/* Gera stl/manifest.json: a lista de todos os STL de stl/, agrupados por tipo,
   com rótulo, tamanho, miniatura (render já existente) e os pares ANT/POST.
   Lido pelo visualizador.html. Rodar de novo sempre que um STL entrar ou sair:
     node tools/make_manifest.mjs
   Caminhos relativos à raiz do repositório (funciona em servidor local e no GitHub Pages). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STL = path.join(ROOT, 'stl');
const LIMIT = 100 * 1024 * 1024; // limite do GitHub por arquivo

const GROUPS = [
  { id: 'padrao', label: 'Padrão — C longo, cabeça 52, sem dreno', note: 'Os arquivos para imprimir hoje: as duas metades já na posição da mesa e o positivo.' },
  { id: 'C_longo', label: 'Molde C longo (150 mm, sem dreno)', note: 'Metades no sistema do modelo (ANT/POST) e na posição de impressão (_mesa).' },
  { id: 'C_curto_dreno', label: 'Molde C curto + dreno de tórax (28 Fr)', note: 'Parte proximal de 110 mm; a haste distal é o dreno cheio de cimento.' },
  { id: 'positivos', label: 'Positivos (o espaçador em si)', note: 'A colher, B anatômico, C curto + dreno, C longo. Sólidos fechados.' },
  { id: 'cupons', label: 'Cupons de calibração', note: 'Imprimir antes do molde, com o mesmo filamento e perfil.' },
];
const MODEL = { A: 'A colher', B: 'B anatômico', C: 'C curto + dreno', C_longo: 'C longo, sem dreno' };
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
const thumb = (...c) => c.find((r) => r && exists(r)) || null;

function describe(group, file) {
  const n = file.replace(/\.stl$/i, '');
  let m;
  if ((m = n.match(/^(C_longo|C)_h(\d+)(?:_(\d+)Fr)?_(ANT|POST)(_mesa)?$/))) {
    const [, kind, head, fr, half, mesa] = m;
    const long = kind === 'C_longo';
    const set = long ? `C_longo_h${head}` : `C_h${head}_${fr}Fr`;
    return {
      kind: 'mold-half', head: +head, half, printPose: !!mesa, set,
      label: `${long ? 'C longo' : `C curto + dreno ${fr} Fr`} · cabeça ${head} · metade ${half}${mesa ? ' · posição da mesa' : ''}`,
      thumb: thumb(mesa ? `molde/render/${set}_mesa_${half}.png` : `molde/render/${set}_face_${half}.png`, `molde/render/${set}_closed.png`),
      positive: `stl/positivos/${long ? `C_longo_h${head}` : `C_h${head}`}.stl`,
    };
  }
  if ((m = n.match(/^(A|B|C|C_longo)_h(\d+)$/))) {
    const [, k, head] = m;
    return { kind: 'positive', head: +head, model: k, label: `Positivo ${MODEL[k]} · cabeça ${head}`, thumb: thumb(`positivo/render/${k}_h${head}_front.png`, `positivo/render/${k}_h${head}_oblique.png`) };
  }
  if (n.startsWith('cupom_')) {
    const lbl = { cupom_pinos_MACHO: 'Cupom dos pinos — macho (Ø8)', cupom_pinos_FEMEA: 'Cupom dos pinos — fêmea (folgas 0,15–0,35 mm)' }[n]
      || n.replace(/^cupom_dreno_(.+)$/, 'Cupom do dreno $1 (furos OD + 0,2 / 0,4 / 0,6)');
    return { kind: 'coupon', label: lbl, thumb: null };
  }
  return { kind: 'other', label: n, thumb: null };
}

const out = { generated: new Date().toISOString(), default: null, groups: [] };
let tooBig = [];
for (const g of GROUPS) {
  const dir = path.join(STL, g.id);
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter((f) => /\.stl$/i.test(f)).sort();
  const items = files.map((f) => {
    const rel = `stl/${g.id}/${f}`;
    const size = fs.statSync(path.join(ROOT, rel)).size;
    if (size >= LIMIT) tooBig.push(rel);
    const d = describe(g.id, f);
    const json = rel.replace(/(_ANT|_POST)(_mesa)?\.stl$|\.stl$/, '.json');
    return { id: rel, file: rel, name: f, sizeBytes: size, json: exists(json) && json !== rel ? json : null, ...d };
  });
  // pares ANT + POST (sistema do modelo) para ver fechado / aberto
  const pairs = [];
  const sets = new Map();
  for (const it of items) if (it.kind === 'mold-half' && !it.printPose) {
    if (!sets.has(it.set)) sets.set(it.set, {});
    sets.get(it.set)[it.half] = it.file;
  }
  // no grupo padrão, o par montado usa as metades do sistema do modelo da pasta C_longo
  if (g.id === 'padrao') {
    const a = 'stl/C_longo/C_longo_h52_ANT.stl', p = 'stl/C_longo/C_longo_h52_POST.stl';
    if (exists(a) && exists(p)) sets.set('C_longo_h52', { ANT: a, POST: p });
  }
  for (const [set, h] of sets) {
    if (!h.ANT || !h.POST) continue;
    const it = items.find((x) => x.set === set) || {};
    const long = set.startsWith('C_longo');
    const head = +set.match(/_h(\d+)/)[1];
    pairs.push({
      id: `pair:${g.id}:${set}`, kind: 'mold-pair', set, head, ANT: h.ANT, POST: h.POST,
      positive: `stl/positivos/${long ? `C_longo_h${head}` : `C_h${head}`}.stl`,
      label: `Molde ${long ? 'C longo' : 'C curto + dreno 28 Fr'} · cabeça ${head} · ANT + POST`,
      thumb: thumb(`molde/render/${set}_closed.png`, it.thumb),
    });
  }
  out.groups.push({ ...g, pairs, items });
}
out.default = 'pair:padrao:C_longo_h52';
fs.writeFileSync(path.join(STL, 'manifest.json'), JSON.stringify(out, null, 2) + '\n');
const n = out.groups.reduce((s, g) => s + g.items.length, 0);
console.log(`stl/manifest.json: ${n} STL em ${out.groups.length} grupos, ${out.groups.reduce((s, g) => s + g.pairs.length, 0)} pares`);
if (tooBig.length) { console.error(`ACIMA DE 100 MB (o GitHub recusa): ${tooBig.join(', ')}`); process.exit(1); }
