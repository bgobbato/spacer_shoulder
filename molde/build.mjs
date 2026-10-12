#!/usr/bin/env node
/* Build the two-half mold for the model-C spacer.

   DEFAULT (no arguments) = the surgeon's standard model: C longo, head 52
   (= --variant long --head 52). For C curto + dreno pass --variant short.

   node molde/build.mjs --head 44,48,52 --fr 28 [--tube-od mm] [--clear 0.20]
        [--tube-clear 0.4] [--wall 8] [--no-render] [--quick] [--rebuild-positive] [--coupons]
        [--set key=value,...] [--variant short|long]

   --variant long = "C longo" (no chest tube, 150 mm, closed rounded tip,
   core-wire exit hole): reads positivo/stl/C_longo_h<D>.*, writes
     stl/C_longo_h<D>_ANT.stl, _POST.stl, .json            (model frame, for the page)
     stl/C_longo_h<D>_ANT_mesa.stl, _POST_mesa.stl        (print pose: parting face up, centred on the 180 × 180 bed)
     render/C_longo_h<D>_<view>.png, _mesa_ANT.png, _mesa_POST.png

   Writes (in molde/):
     stl/C_h<D>_<Fr>Fr_ANT.stl, _POST.stl, .json (params, layout, report, validation)
     render/C_h<D>_<Fr>Fr_<view>.png  + _sheet.png
   --coupons also writes stl/cupom_pinos_MACHO.stl, cupom_pinos_FEMEA.stl
   (pin fit 0.15–0.35 mm) and cupom_dreno_<Fr>.stl (tube bores +0.2/0.4/0.6).
   --tube-od replaces Fr/3 by the measured OD (files named ..._OD<mm>_...).
   --quick skips the slower checks (min wall, sealed cavity). Exit code 1 if
   any check fails. */

import fs from 'node:fs';
import path from 'node:path';
import { engine, loadPositive, rebuildPositive, MOLDE_DIR } from './src/node.mjs';
import { buildMold, bedPose } from './src/mold.mjs';
import { validateMold } from './src/validate.mjs';
import { toSTL } from './src/stl.mjs';
import { printEstimate } from './src/estimate.mjs';

function parseArgs(argv) {
  // default = C longo, head 52 (surgeon's standard model, 12/Oct/2026)
  const a = { heads: [52], set: {}, render: true, quick: false, rebuild: false, coupons: false, variant: 'long' };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i], v = argv[i + 1];
    if (k === '--head') { a.heads = v.split(',').map(Number); i++; }
    else if (k === '--fr') { a.set.fr = Number(v); i++; }
    else if (k === '--tube-od') { a.set.tubeOD = Number(v); i++; }
    else if (k === '--clear') { a.set.pinClear = Number(v); i++; }
    else if (k === '--tube-clear') { a.set.tubeClearDia = Number(v); i++; }
    else if (k === '--wall') { a.set.wall = Number(v); i++; }
    else if (k === '--variant') {
      if (!['short', 'long', 'curto', 'longo'].includes(v)) throw new Error('--variant: short ou long');
      a.variant = v === 'long' || v === 'longo' ? 'long' : 'short'; i++;
    }
    else if (k === '--no-render') a.render = false;
    else if (k === '--quick') a.quick = true;
    else if (k === '--rebuild-positive') a.rebuild = true;
    else if (k === '--coupons') a.coupons = true;
    else if (k === '--set') {
      for (const kv of v.split(',')) { const [key, val] = kv.split('='); a.set[key] = val === 'true' ? true : val === 'false' ? false : isNaN(Number(val)) ? val : Number(val); }
      i++;
    } else if (k === '--help' || k === '-h') {
      console.log('node molde/build.mjs [--head 52] [--variant long|short] [--fr 28] [--tube-od mm] [--clear 0.20] [--tube-clear 0.4] [--wall 8] [--no-render] [--quick] [--rebuild-positive] [--set k=v,...]');
      process.exit(0);
    } else throw new Error(`argumento desconhecido ${k}`);
  }
  return a;
}

const jsonSafe = (_k, v) => (ArrayBuffer.isView(v) ? Array.from(v) : v);

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const E = await engine();
  const stlDir = path.join(MOLDE_DIR, 'stl'), renDir = path.join(MOLDE_DIR, 'render');
  fs.mkdirSync(stlDir, { recursive: true });
  let failed = 0;
  if (args.coupons) {
    const { pinCoupon, tubeCoupon } = await import('./src/coupon.mjs');
    const pc = pinCoupon(E, args.set);
    fs.writeFileSync(path.join(stlDir, 'cupom_pinos_MACHO.stl'), toSTL(pc.male, 'pin coupon male'));
    fs.writeFileSync(path.join(stlDir, 'cupom_pinos_FEMEA.stl'), toSTL(pc.female, 'pin coupon female'));
    const tc = tubeCoupon(E, args.set);
    const ttag = args.set.tubeOD != null ? `OD${tc.od.toFixed(2).replace('.', 'p')}` : `${args.set.fr || 28}Fr`;
    fs.writeFileSync(path.join(stlDir, `cupom_dreno_${ttag}.stl`), toSTL(tc.plate, 'tube coupon'));
    console.log(`cupons: pinos Ø${pc.pinD} folgas ${pc.clearances.join('/')} mm · dreno furos Ø${tc.boresD.join('/')} mm`);
  }
  for (const D of args.heads) {
    const t0 = Date.now();
    const long = args.variant === 'long';
    const src = args.rebuild ? await rebuildPositive(E, D, {}, args.variant) : loadPositive(E, D, 'C', args.variant);
    const mold = buildMold(E, src, { ...args.set, headD: D });
    const p = mold.params;
    const tag = long ? 'LONGO' : p.tubeOD != null ? `OD${p.tubeODmm.toFixed(2).replace('.', 'p')}` : `${p.fr}Fr`;
    const base = long ? `C_longo_h${D}` : `C_h${D}_${tag}`;
    const val = validateMold(E, mold, { full: !args.quick });
    const est = printEstimate(E, mold);
    fs.writeFileSync(path.join(stlDir, `${base}_ANT.stl`), toSTL(mold.ant, `GPS spacer mold ${base} ANT (mm)`));
    fs.writeFileSync(path.join(stlDir, `${base}_POST.stl`), toSTL(mold.post, `GPS spacer mold ${base} POST (mm)`));
    const out = {
      name: base, generated: new Date().toISOString(), positiveSource: src.source,
      params: p, layout: mold.layout, report: mold.report, estimate: est, validation: val,
      files: { ANT: `stl/${base}_ANT.stl`, POST: `stl/${base}_POST.stl` },
    };
    if (long) {
      // print pose copies (parting face up, centred on the bed, NOT rotated about the bed normal)
      out.files.printPose = {};
      for (const h of ['ANT', 'POST']) {
        const { m, bounds: bb } = bedPose(E, mold, h);
        const f = `stl/${base}_${h}_mesa.stl`;
        fs.writeFileSync(path.join(MOLDE_DIR, f), toSTL(m, `GPS spacer mold ${base} ${h} print pose (mm)`));
        out.files.printPose[h] = { file: f, boundsMm: bb };
        m.delete();
      }
    }
    if (args.render) {
      const { moldViews, renderSheet, writePNG } = await import('./src/renders.mjs');
      const imgs = moldViews(E, mold, `C H${D} ${tag.toUpperCase()}`);
      out.renders = {};
      for (const [k, img] of Object.entries(imgs)) {
        const f = path.join(renDir, `${base}_${k}.png`);
        writePNG(f, img);
        out.renders[k] = path.relative(MOLDE_DIR, f);
      }
      writePNG(path.join(renDir, `${base}_sheet.png`), renderSheet([imgs.face_ANT, imgs.face_POST, imgs.outer_ANT, imgs.outer_POST], { cols: 4 }));
      if (long) {
        const { bedView } = await import('./src/renders.mjs');
        for (const h of ['ANT', 'POST']) {
          const bs = val.checks[h].bedStraight;
          const bv = bedView(E, mold, h, `A1 MINI 180X180 - ${base.toUpperCase()} ${h} - ${bs.footprintMm.join('X')} MM, ALTURA ${bs.heightMm} - FOLGA ${bs.marginMm.join('/')} MM`);
          const f = path.join(renDir, `${base}_mesa_${h}.png`);
          writePNG(f, bv.img);
          out.renders[`mesa_${h}`] = path.relative(MOLDE_DIR, f);
        }
      }
    }
    fs.writeFileSync(path.join(stlDir, `${base}.json`), JSON.stringify(out, jsonSafe, 2));
    const c = val.checks;
    console.log(`${base}: ${val.ok ? 'OK' : 'FALHOU'} | metade ${mold.report.halves.ANT.sizeMm.join('×')} mm | cavidade ${mold.report.cement.cavityCm3} cm³`
      + (c.wall ? ` | parede mín ${c.wall.min} mm (${c.wall.limitedBy})` : '')
      + (c.cavity ? ` | vazio fechado vs cimento ${c.cavity.voidVsCementPct}%` : '')
      + ` | comp ${c.ANT.components}/${c.POST.components} | ${Date.now() - t0} ms`);
    for (const f of val.failures) console.log(`   FALHA ${f}`);
    for (const w of [...val.warnings, ...mold.report.warnings]) console.log(`   aviso ${w}`);
    if (!val.ok) failed++;
  }
  console.log(failed ? `${failed} molde(s) com falha` : 'todos os moldes OK');
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e.stack || e); process.exit(1); });
