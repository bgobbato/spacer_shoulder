#!/usr/bin/env node
/* node molde/test/molde_test.mjs [--no-python]

   For heads 44/48/52 × 28 Fr (C curto + dreno) and 44/48/52 C longo (no
   tube, 150 mm, closed tip + core-wire exit): builds the mold from the committed positive,
   runs every check of src/validate.mjs (full), adds the layout assertions
   below, writes the halves to test/_out/ and cross-checks them with
   python3 + trimesh (test/crosscheck.py) — an independent code path. */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { engine, loadPositive, MOLDE_DIR } from '../src/node.mjs';
import { buildMold } from '../src/mold.mjs';
import { validateMold } from '../src/validate.mjs';
import { toSTL } from '../src/stl.mjs';
import { bounds } from '../src/geom.mjs';

const OUT = path.join(MOLDE_DIR, 'test', '_out');
let failed = 0, passed = 0;
const ok = (cond, msg) => { if (cond) passed++; else { failed++; console.log(`  FAIL ${msg}`); } };

const E = await engine();
// free the WASM heap between molds (6 full molds + checks exceed it otherwise)
function dispose(mold, src) {
  const seen = new Set();
  const del = (m) => { if (m && typeof m.delete === 'function' && !seen.has(m)) { seen.add(m); try { m.delete(); } catch {} } };
  for (const v of Object.values(mold.parts)) {
    if (Array.isArray(v)) v.forEach((q) => { del(q.male); del(q.hole); }); else del(v);
  }
  del(mold.ant); del(mold.post); del(src.positive);
}
const jsons = [];
for (const D of [44, 48, 52]) {
  const t0 = Date.now();
  const src = loadPositive(E, D);
  const mold = buildMold(E, src, { headD: D, fr: 28 });
  // the short mold prints straight too (same bed rule as the long one)
  const v0 = validateMold(E, mold, { full: false });
  for (const h of ['ANT', 'POST']) ok(v0.checks[h].bedStraight.fits, `h${D} ${h} bed ${v0.checks[h].bedStraight.footprintMm}`);
  const v = validateMold(E, mold, { full: true });
  const c = v.checks, L = mold.layout, p = mold.params;
  console.log(`h${D}: validate ${v.ok ? 'ok' : 'FAIL'} (${Date.now() - t0} ms)`);
  for (const f of v.failures) ok(false, `h${D} ${f}`);
  if (v.ok) passed++;

  // each half: manifold, one component, fits the A1 mini
  for (const h of ['ANT', 'POST']) {
    ok(c[h].status === 0, `h${D} ${h} status`);
    ok(c[h].components === 1, `h${D} ${h} components = ${c[h].components}`);
    ok(c[h].sizeMm.every((s) => s <= 180), `h${D} ${h} size ${c[h].sizeMm}`);
  }
  // min wall
  ok(c.wall.min >= p.wall - 0.02, `h${D} wall ${c.wall.min} < ${p.wall}`);
  // cavity = positive (cement part) ±1 %, mirrored halves
  ok(Math.abs(c.cavity.voidVsCementPct) <= 1, `h${D} cavity vs cement ${c.cavity.voidVsCementPct} %`);
  ok(c.cavity.voidMinusCavityMm3 < 0.5 && c.cavity.cavityMinusVoidMm3 < 0.5, `h${D} sealed cavity differs`);
  ok(Math.abs(c.mirror.diffPct) <= 0.5, `h${D} mirror ${c.mirror.diffPct} %`);
  // positive total vs cavity: the difference must be the tube space z < stop (+ flats)
  const tubeSpace = Math.PI * (src.desc.tube.odMm / 2) ** 2 * src.desc.tube.stopZ;
  const posTot = src.desc.volumeMm3;
  ok(Math.abs(posTot - tubeSpace - c.cavity.cementAboveStopMm3) / posTot < 0.01, `h${D} positive − tube space ≠ cement (${posTot} − ${tubeSpace.toFixed(0)} vs ${c.cavity.cementAboveStopMm3})`);
  // pins: from the ACTUAL block, inside the wall, matched, two diameters
  const B = L.block;
  for (const pin of L.pins) {
    const r = pin.holeD / 2 + p.holeChamfer;
    ok(pin.x - r >= B.x[0] + p.featureEdge - 1e-6 && pin.x + r <= B.x[1] - p.featureEdge + 1e-6 && pin.z - r >= B.z[0] + p.featureEdge - 1e-6 && pin.z + r <= B.z[1] - p.featureEdge + 1e-6, `h${D} pin ${pin.name} outside block`);
  }
  ok(L.pins[0].male !== L.pins[1].male && L.pins[0].d !== L.pins[1].d, `h${D} pins not 1 male + 1 female per half with two Ø`);
  for (const r of c.pins) ok(r.protrusionOutsideHoleMm3 < 1e-3 && r.maleInsideOtherHalfMm3 < 1e-3 && r.axisOffsetMm < 0.01, `h${D} pin ${r.name} mismatch`);
  // tube bore coaxial with the stem axis; stop at the planned depth
  for (const f of c.tube.boreFits) ok(Math.hypot(...f.center) <= 0.02 && Math.abs(f.radius - p.boreD / 2) <= 0.06, `h${D} bore at z=${f.z}`);
  ok(c.tube.stop.boreEmptyBelowStop && c.tube.stop.flatSolidAboveStop && c.tube.stop.cementPassOpenAtAxis, `h${D} stop`);
  ok(L.tube.stopZ === src.desc.tube.stopZ && L.tube.insertionDepthFromDistalFaceMm === p.guideLen && L.tube.stopZ - L.tube.distalFaceZ === p.guideLen, `h${D} stop depth`);
  // dome
  ok(c.dome.ventsInDomeMm3 === 0 && c.dome.groovesInDomeMm3 === 0, `h${D} dome touched`);
  ok(L.vents.every((vt) => vt.angleFromAxisDeg >= c.dome.capDeg + p.domeMarginDeg - 0.5), `h${D} vent too close to the dome`);
  // wire cover
  ok(c.wire.cementCoverMinMm >= 1.5, `h${D} wire cover ${c.wire.cementCoverMinMm}`);
  // translation sanity (Manifold.translate used for placement)
  const bA = bounds(mold.ant), bP = bounds(mold.post);
  ok(Math.abs(bA.max[1] - B.y[1]) < 1e-3 && Math.abs(bP.min[1] - B.y[0]) < 1e-3, `h${D} half bounds`);

  fs.mkdirSync(path.join(OUT, 'stl'), { recursive: true });
  const base = `C_h${D}_28Fr`;
  fs.writeFileSync(path.join(OUT, 'stl', `${base}_ANT.stl`), toSTL(mold.ant));
  fs.writeFileSync(path.join(OUT, 'stl', `${base}_POST.stl`), toSTL(mold.post));
  const jp = path.join(OUT, 'stl', `${base}.json`);
  fs.writeFileSync(jp, JSON.stringify({
    name: base, params: p, layout: L, validation: v,
    positiveSource: path.relative(OUT, path.join(MOLDE_DIR, src.source)),
    files: { ANT: `stl/${base}_ANT.stl`, POST: `stl/${base}_POST.stl` },
  }, null, 1));
  jsons.push(jp);
  dispose(mold, src);
  console.log(`  wall ${c.wall.min} mm (${c.wall.limitedBy}) · cavity ${c.cavity.voidMm3} vs cement ${c.cavity.cementAboveStopMm3} mm³ (${c.cavity.voidVsCementPct} %) · mirror ${c.mirror.diffPct} % · wire cover ${c.wire.cementCoverMinMm} mm · debris removed ANT ${mold.report.debrisRemoved.ANT.count}/POST ${mold.report.debrisRemoved.POST.count}`);
}

// C longo: no tube, closed rounded tip, core-wire exit hole, printed straight
for (const D of [44, 48, 52]) {
  const t0 = Date.now();
  const src = loadPositive(E, D, 'C', 'long');
  const mold = buildMold(E, src, { headD: D });
  const v = validateMold(E, mold, { full: true });
  const c = v.checks, L = mold.layout, p = mold.params;
  console.log(`longo h${D}: validate ${v.ok ? 'ok' : 'FAIL'} (${Date.now() - t0} ms)`);
  for (const f of v.failures) ok(false, `longo h${D} ${f}`);
  if (v.ok) passed++;
  ok(src.desc.distal === 'long' && src.desc.tube === null && L.tube === null, `longo h${D}: tube present`);
  ok(Math.abs(src.desc.long.totalLenMm - 150) < 1e-9, `longo h${D}: positive length ${src.desc.long.totalLenMm} ≠ 150`);
  const pb = bounds(src.positive);
  ok(pb.max[2] - pb.min[2] <= 150 + 1e-6 && pb.max[2] - pb.min[2] >= 149.9, `longo h${D}: positive Z ${pb.max[2] - pb.min[2]}`);
  for (const h of ['ANT', 'POST']) {
    ok(c[h].status === 0, `longo h${D} ${h} status`);
    ok(c[h].components === 1, `longo h${D} ${h} components = ${c[h].components}`);
    // printed STRAIGHT, parting face up: footprint X × Z with ≥ 3 mm free on every side, height Y
    const bs = c[h].bedStraight;
    ok(bs.fits && bs.marginMm[0] >= 3 && bs.marginMm[1] >= 3 && bs.heightMm <= 180, `longo h${D} ${h} bed ${bs.footprintMm} margins ${bs.marginMm}`);
  }
  ok(c.wall.min >= p.wall - 0.02, `longo h${D} wall ${c.wall.min} < ${p.wall}`);
  // cavity = the WHOLE positive ±1 %
  ok(Math.abs(c.cavity.voidMm3 - src.desc.volumeMm3) / src.desc.volumeMm3 <= 0.01, `longo h${D} cavity ${c.cavity.voidMm3} vs positive ${src.desc.volumeMm3}`);
  ok(c.cavity.voidMinusCavityMm3 < 0.5 && c.cavity.cavityMinusVoidMm3 < 0.5 && c.cavity.voidComponents === 1, `longo h${D} sealed cavity differs`);
  ok(Math.abs(c.mirror.diffPct) <= 0.5, `longo h${D} mirror ${c.mirror.diffPct} %`);
  // closed distal end + coaxial wire hole; no bore / stop / depth ruler
  ok(c.distal.endWallSolid && c.distal.tipCavityEmpty && c.distal.wireHoleOpen, `longo h${D} distal end`);
  for (const f of c.distal.wireHoleFits) ok(Math.hypot(...f.center) <= 0.02 && Math.abs(f.radius - L.distal.wireHole.d / 2) <= 0.06, `longo h${D} wire hole at z=${f.z}`);
  ok(L.distal.endWallMm >= p.wall, `longo h${D} end wall ${L.distal.endWallMm}`);
  ok(!c.tube && L.engraving.ANT.tubeGauge === null, `longo h${D}: tube check / depth ruler present`);
  ok(L.engraving.ANT.lines.some((q) => q.text === 'C LONGO') && L.engraving.ANT.lines.some((q) => q.text === `${D}`), `longo h${D}: labels`);
  // pins from the ACTUAL block, inside the wall
  const B = L.block;
  for (const pin of L.pins) {
    const r = pin.holeD / 2 + p.holeChamfer;
    ok(pin.x - r >= B.x[0] + p.featureEdge - 1e-6 && pin.x + r <= B.x[1] - p.featureEdge + 1e-6 && pin.z - r >= B.z[0] + p.featureEdge - 1e-6 && pin.z + r <= B.z[1] - p.featureEdge + 1e-6, `longo h${D} pin ${pin.name} outside block`);
  }
  for (const r of c.pins) ok(r.protrusionOutsideHoleMm3 < 1e-3 && r.maleInsideOtherHalfMm3 < 1e-3 && r.axisOffsetMm < 0.01, `longo h${D} pin ${r.name} mismatch`);
  // dome untouched
  ok(c.dome.ventsInDomeMm3 === 0 && c.dome.groovesInDomeMm3 === 0, `longo h${D} dome touched`);
  ok(L.vents.every((vt) => vt.angleFromAxisDeg >= c.dome.capDeg + p.domeMarginDeg - 0.5), `longo h${D} vent too close to the dome`);
  ok(c.wire.cementCoverMinMm >= 3.5, `longo h${D} wire cover ${c.wire.cementCoverMinMm}`);

  const base = `C_longo_h${D}`;
  fs.writeFileSync(path.join(OUT, 'stl', `${base}_ANT.stl`), toSTL(mold.ant));
  fs.writeFileSync(path.join(OUT, 'stl', `${base}_POST.stl`), toSTL(mold.post));
  const jp = path.join(OUT, 'stl', `${base}.json`);
  fs.writeFileSync(jp, JSON.stringify({
    name: base, params: p, layout: L, validation: v,
    positiveSource: path.relative(OUT, path.join(MOLDE_DIR, src.source)),
    files: { ANT: `stl/${base}_ANT.stl`, POST: `stl/${base}_POST.stl` },
  }, null, 1));
  jsons.push(jp);
  dispose(mold, src);
  console.log(`  half ${c.ANT.bedStraight.footprintMm.join('×')}×${c.ANT.bedStraight.heightMm} mm, bed margins ${c.ANT.bedStraight.marginMm.join('/')} mm · wall ${c.wall.min} mm (${c.wall.limitedBy}) · cavity ${c.cavity.voidMm3} vs positive ${src.desc.volumeMm3.toFixed(1)} mm³ · wire cover ${c.wire.cementCoverMinMm} mm`);
}

// calibration coupons: one body each
{
  const { pinCoupon, tubeCoupon } = await import('../src/coupon.mjs');
  const pc = pinCoupon(E), tc = tubeCoupon(E);
  for (const [n, m] of [['coupon male', pc.male], ['coupon female', pc.female], ['tube coupon', tc.plate]]) {
    const k = m.decompose().length;
    ok(k === 1, `${n}: ${k} components`);
  }
  console.log(`coupons: pin clearances ${pc.clearances.join('/')} · tube bores ${tc.boresD.join('/')}`);
}

if (!process.argv.includes('--no-python')) {
  const r = spawnSync('python3', [path.join(MOLDE_DIR, 'test', 'crosscheck.py'), ...jsons], { encoding: 'utf8' });
  if (r.error) console.log(`python3 cross-check not run: ${r.error.message}`);
  else {
    for (const line of r.stdout.trim().split('\n')) {
      try {
        const j = JSON.parse(line);
        console.log(`trimesh ${j.mold}: ${j.ok ? 'ok' : 'FAIL'} · bodies ${j.ANT.bodies}/${j.POST.bodies} · watertight ${j.ANT.watertight}/${j.POST.watertight} · cement pts in mold ${j.cementPointsInMold}/${j.cementPoints} · hugging misses ${j.huggingMisses}/${j.huggingPoints} · ${j.bore ? `bore ${j.bore.axisPointsInMold + j.bore.ringPointsInMold} hits, flats ${j.bore.stopFlatsSolid}` : `distal closed ${j.distal.endWallSolid}, wire hole hits ${j.distal.wireHolePointsInMold}`} · bed margins ${j.ANT.bedMargins.join('/')} · wall ${j.wallAnalyticMin} mm`);
        ok(j.ok, `trimesh ${j.mold}: ${j.failures.join('; ')}`);
      } catch { console.log(line); }
    }
    if (r.status !== 0 && !r.stdout.trim()) { ok(false, `crosscheck.py: ${r.stderr.slice(-400)}`); }
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
