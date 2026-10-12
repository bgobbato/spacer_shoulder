#!/usr/bin/env node
/* Build + validate + render spacer positives.

   node build.mjs --model A|B|C|all|_example --head 44,48,52
                  [--views front,lateral,oblique,top] [--no-render] [--px 4]
                  [--set key=value,key=value] [--quiet] [--variant short|long]

   DEFAULT (no arguments) = the surgeon's standard model: C longo, head 52
   (= --model C --head 52 --variant long).
   --variant long (model C only, the default) = "C longo": no chest tube, one cement
   piece longLen (150) mm long, files named C_longo_h<D>.*  (same as --set distal=long).
   --variant short = "C curto + dreno" (C_h<D>.*). The variant only touches model C;
   A, B and _example ignore it.

   Loads src/models/model<X>.mjs (or src/models/<name>.mjs), each exporting
   DEFAULTS, RANGES, build(engine, params) -> { manifold, meta }. meta may
   carry: head {center, radius, axis, capAngleDeg} (= sphereSegment().info
   .validateHead), holes [{x, z, r}] (Y through-holes), throughHoles (genus
   override), minThickness, thicknessIgnoreBelowZ, validateOptions {...}
   (any validate() option). See src/models/_example.mjs. Writes
     stl/<model>_h<D>.stl            binary STL
     stl/<model>_h<D>.json           params + meta + validation report
     render/<model>_h<D>_<view>.png  one per view, + _sheet.png
     render/compare_<view>.png       all builds of this run side by side (same scale)
   Exits 1 if any build fails validation (or throws). */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { initEngine } from './src/common.mjs';
import { validate, summarize } from './src/validate.mjs';
import { writeSTL } from './src/stl.mjs';
import { renderView, renderSheet, writePNG, VIEW_NAMES } from './src/render.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.join(ROOT, 'src', 'models');

function parseArgs(argv) {
  // default = C longo, head 52 (surgeon's standard model, 12/Oct/2026)
  const a = { model: 'C', heads: [52], variant: 'long', views: VIEW_NAMES, render: true, px: 4, set: {}, quiet: false, outDir: ROOT };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i], v = argv[i + 1];
    if (k === '--model') { a.model = v; i++; }
    else if (k === '--head') { a.heads = v.split(',').map(Number); i++; }
    else if (k === '--views') { a.views = v.split(','); i++; }
    else if (k === '--no-render') a.render = false;
    else if (k === '--px') { a.px = Number(v); i++; }
    else if (k === '--out') { a.outDir = path.resolve(v); i++; }
    else if (k === '--quiet') a.quiet = true;
    else if (k === '--variant') {
      if (!['short', 'long', 'curto', 'longo'].includes(v)) throw new Error('--variant expects short or long');
      a.variant = v === 'long' || v === 'longo' ? 'long' : 'short'; i++;
    }
    else if (k === '--set') {
      for (const kv of v.split(',')) {
        const [key, val] = kv.split('=');
        a.set[key] = val === 'true' ? true : val === 'false' ? false : isNaN(Number(val)) ? val : Number(val);
      }
      i++;
    } else if (k === '--help' || k === '-h') {
      console.log('node build.mjs [--model A|B|C|all|_example] [--head 44,48,52] [--variant long|short] [--views ...] [--no-render] [--px 4] [--set k=v,...]   (default: --model C --head 52 --variant long)');
      process.exit(0);
    } else throw new Error(`unknown argument ${k}`);
  }
  if (a.heads.some((d) => !isFinite(d))) throw new Error('--head expects numbers, e.g. 44,48,52');
  return a;
}

function modelFile(id) {
  return path.join(MODELS_DIR, /^[A-Z]$/i.test(id) ? `model${id.toUpperCase()}.mjs` : `${id}.mjs`);
}

function resolveModels(sel) {
  if (sel === 'all') {
    const ids = ['A', 'B', 'C'].filter((id) => fs.existsSync(modelFile(id)));
    if (!ids.length) throw new Error('no src/models/model{A,B,C}.mjs found');
    return ids;
  }
  return sel.split(',').map((s) => (/^[a-z]$/i.test(s) ? s.toUpperCase() : s));
}

const jsonSafe = (_k, v) => (typeof v === 'function' ? undefined
  : ArrayBuffer.isView(v) ? Array.from(v) : v);

export async function buildOne(engine, id, headD, args) {
  const mod = await import(pathToFileURL(modelFile(id)).href);
  const variantSet = id === 'C' && args.variant ? { distal: args.variant === 'long' ? 'long' : 'tube' } : {};
  const params = { ...mod.DEFAULTS, headD, ...variantSet, ...args.set };
  for (const [k, rg] of Object.entries(mod.RANGES || {})) {
    if (params[k] == null || !Array.isArray(rg)) continue;
    if (params[k] < rg[0] || params[k] > rg[1]) throw new Error(`${id}: ${k} = ${params[k]} outside range [${rg}]`);
  }
  const t0 = Date.now();
  const { manifold, meta = {} } = await mod.build(engine, params);
  manifold.getMesh();
  const tBuild = Date.now() - t0;

  const report = validate(manifold, {
    head: meta.head || null,
    holes: meta.holes || null,
    expectedGenus: meta.throughHoles ?? (meta.holes ? meta.holes.length : 0),
    ...(meta.minThickness != null ? { minThickness: meta.minThickness } : {}),
    ...(meta.thicknessIgnoreBelowZ != null ? { thicknessIgnoreBelowZ: meta.thicknessIgnoreBelowZ } : {}),
    ...(meta.validateOptions || {}),
  });
  report.timingMs.build = tBuild;

  const base = `${id}${params.distal === 'long' ? '_longo' : ''}_h${headD}`;
  const stlPath = path.join(args.outDir, 'stl', `${base}.stl`);
  writeSTL(stlPath, manifold, `GPS spacer positive ${base} (mm)`);

  const images = {};
  if (args.render) {
    const t1 = Date.now();
    const marks = meta.head ? [{ p: meta.head.center, color: [200, 50, 40] }] : [];
    for (const v of args.views) {
      const img = renderView(manifold, { view: v, pxPerMm: args.px, label: `${id}${params.distal === 'long' ? ' LONGO' : ''} H${headD} ${v}`, marks });
      images[v] = img;
      writePNG(path.join(args.outDir, 'render', `${base}_${v}.png`), img);
    }
    writePNG(path.join(args.outDir, 'render', `${base}_sheet.png`), renderSheet(args.views.map((v) => images[v])));
    report.timingMs.render = Date.now() - t1;
  }

  const out = {
    model: id, name: mod.NAME || id, description: mod.DESCRIPTION || '', headD,
    params, meta, validation: report,
    files: { stl: path.relative(args.outDir, stlPath) },
    generated: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(args.outDir, 'stl', `${base}.json`), JSON.stringify(out, jsonSafe, 2));
  manifold.delete();
  return { id, headD, report, images };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const engine = await initEngine();
  const ids = resolveModels(args.model);
  const results = [];
  let failed = 0;
  for (const id of ids) {
    for (const d of args.heads) {
      const t0 = Date.now();
      try {
        const r = await buildOne(engine, id, d, args);
        results.push(r);
        if (!r.report.ok) failed++;
        console.log(`${id} h${d}: ${summarize(r.report)} | total ${Date.now() - t0} ms`);
        if (!r.report.ok || !args.quiet) {
          for (const f of r.report.failures) console.log(`   FAIL ${f}`);
          for (const w of r.report.warnings) console.log(`   warn ${w}`);
        }
      } catch (e) {
        failed++;
        console.log(`${id} h${d}: ERROR ${e.stack || e.message}`);
      }
    }
  }
  if (args.render && results.length > 1) {
    for (const v of args.views) {
      writePNG(path.join(args.outDir, 'render', `compare_${v}.png`),
        renderSheet(results.map((r) => r.images[v]), { cols: args.heads.length }));
    }
  }
  console.log(failed ? `${failed} build(s) FAILED` : `all ${results.length} build(s) OK`);
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.stack || e); process.exit(1); });
}
