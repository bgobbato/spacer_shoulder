/* Node-only glue: engine (the SAME manifold instance spacer/positivo uses),
   positive loading from positivo/stl (read-only), optional rebuild of
   the positive through positivo/src/models/modelC.mjs. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { initEngine } from '../../positivo/src/common.mjs';
import { positiveFromSTL, describePositive } from './positive.mjs';
import { toArrays } from './geom.mjs';

export const MOLDE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const POSITIVO_DIR = path.resolve(MOLDE_DIR, '..', 'positivo');
export const PUBLISHED_POSITIVES_DIR = path.resolve(MOLDE_DIR, '..', 'stl', 'positivos');

export async function engine() {
  const e = await initEngine();
  return e.wasm; // { Manifold, CrossSection, Mesh, ... }
}

/* Load model-C positive of head D from the committed STL + JSON. */
export function loadPositive(E, headD, model = 'C', variant = 'short') {
  const long = variant === 'long';
  const name = `${model}${long ? '_longo' : ''}_h${headD}`;
  // 1st choice: positivo/stl/ (local build output, gitignored); fallback: the
  // published copies in ../stl/positivos/ (committed), so a fresh clone works.
  let base = path.join(POSITIVO_DIR, 'stl', name);
  if (!fs.existsSync(`${base}.stl`)) base = path.join(PUBLISHED_POSITIVES_DIR, name);
  if (!fs.existsSync(`${base}.stl`)) throw new Error(`positivo não encontrado: ${base}.stl (rode positivo/build.mjs --model ${model} --head ${headD}${long ? ' --variant long' : ''})`);
  const json = JSON.parse(fs.readFileSync(`${base}.json`, 'utf8'));
  const { manifold, arrays } = positiveFromSTL(E, fs.readFileSync(`${base}.stl`));
  return { positive: manifold, arrays, desc: describePositive(json), source: path.relative(MOLDE_DIR, `${base}.stl`) };
}

/* Rebuild the positive from modelC.mjs (≈8 s per head) instead of reading
   the STL. Same engine instance as positivo/common.mjs. */
export async function rebuildPositive(E, headD, set = {}, variant = 'short') {
  const mod = await import(pathToFileURL(path.join(POSITIVO_DIR, 'src', 'models', 'modelC.mjs')).href);
  const params = { ...mod.DEFAULTS, headD, ...(variant === 'long' ? { distal: 'long' } : {}), ...set };
  const { manifold, meta } = await mod.build(await initEngine(), params);
  const json = { model: 'C', headD, meta, validation: { volume: { mm3: manifold.getProperties().volume } } };
  return { positive: manifold, arrays: toArrays(manifold), desc: describePositive(json), source: 'modelC.build()' };
}
