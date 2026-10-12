#!/usr/bin/env node
/* Foundation test for the spacer POSITIVE toolkit (no runner):
     node positivo/test/foundation_test.mjs
   Proves: transforms place solids where expected (numerically), the exact
   head is a sphere to < 0.05 mm, STL round-trips (node reader AND python
   trimesh, volume within 0.5 %), the validator passes allowed features and
   catches bad solids (groove / hole along X → demold, two parts →
   components 2, asymmetry, thin fin, sharp crease, faceted head), renders
   are non-empty and correctly oriented, build.mjs writes its files, stays
   under 20 s and exits non-zero on a failing model.
   Scratch output: positivo/test/_out/ (safe to delete). */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as G from '../src/common.mjs';
import { validate, summarize } from '../src/validate.mjs';
import { writeSTL, readSTL, meshVolume } from '../src/stl.mjs';
import { renderView, renderSheet, encodePNG, decodePNG, nonBackgroundFraction, VIEW_NAMES, BACKGROUND } from '../src/render.mjs';
import * as EXAMPLE from '../src/models/_example.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const OUT = path.join(HERE, '_out');
fs.mkdirSync(OUT, { recursive: true });

let passed = 0, failed = 0;
const t0 = Date.now();
function check(name, cond, detail = '') {
  if (cond) { passed++; console.log(`  ok   ${name}${detail ? ' — ' + detail : ''}`); }
  else { failed++; console.log(`  FAIL ${name}${detail ? ' — ' + detail : ''}`); }
}
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const near3 = (a, b, tol) => a.every((v, i) => near(v, b[i], tol));
const f3 = (v) => `[${v.map((x) => x.toFixed(4)).join(', ')}]`;
function vertexStats(m, c) {
  const { positions: P } = G.toMeshArrays(m);
  let lo = Infinity, hi = -Infinity;
  const mean = [0, 0, 0];
  const n = P.length / 3;
  for (let i = 0; i < n; i++) {
    const d = Math.hypot(P[i * 3] - c[0], P[i * 3 + 1] - c[1], P[i * 3 + 2] - c[2]);
    lo = Math.min(lo, d); hi = Math.max(hi, d);
    for (let k = 0; k < 3; k++) mean[k] += P[i * 3 + k] / n;
  }
  return { lo, hi, mean };
}

const E = await G.initEngine();
const { Manifold } = E;

/* ------------------------------------------------------------------ */
console.log('1. transforms (numerical placement)');
{
  const ax = G.headAxis(135);
  check('headAxis(135) = (sin45, 0, cos45)', near3(ax, [Math.SQRT1_2, 0, Math.SQRT1_2], 1e-12), f3(ax));
  check('rotY(beta) maps +Z to (sin b, 0, cos b)', near3(G.m3Apply(G.rotY(30), [0, 0, 1]), [0.5, 0, Math.cos(30 * G.DEG)], 1e-12));
  check('rotZTo(axis) maps +Z to axis', near3(G.m3Apply(G.rotZTo(ax), [0, 0, 1]), ax, 1e-12));

  const c = [12.5, 0, 34.25], r = 7;
  const s = G.sphereAt(c, r);
  const vs = vertexStats(s, c);
  const b = G.bbox(s);
  check('sphereAt: bbox centre where asked', near3(b.min.map((v, k) => (v + b.max[k]) / 2), c, 1e-4), f3(b.min.map((v, k) => (v + b.max[k]) / 2)));
  check('sphereAt: every vertex at radius r', vs.lo > r - 1e-4 && vs.hi < r + 1e-4, `${vs.lo.toFixed(5)}..${vs.hi.toFixed(5)}`);

  // bake = the 2.5.1-safe rotation: p' = R·p + t
  const s0 = G.sphereAt([10, 0, 0], 3);
  const R = G.rotY(90), t = [1, 2, 3];
  const baked = G.bake(s0, R, t);
  const exp = G.add(G.m3Apply(R, [10, 0, 0]), t);          // (1, 2, −7)
  const vb = vertexStats(baked, exp);
  check('bake(rotY 90, t): sphere centre lands at R·c + t', near3(exp, [1, 2, -7], 1e-12) && vb.hi < 3 + 1e-4 && vb.lo > 3 - 1e-4, `centre ${f3(exp)}, radii ${vb.lo.toFixed(5)}..${vb.hi.toFixed(5)}`);
  const mir = G.bake(G.sphereAt([4, 5, 6], 2), [1, 0, 0, 0, -1, 0, 0, 0, 1]);
  check('bake(mirror Y) keeps a positive volume and moves the centre to y = −5', mir.getProperties().volume > 0 && near3(vertexStats(mir, [4, -5, 6]).mean, [4, -5, 6], 1e-3));

  const ex = G.extrudeY([[0, 0], [20, 0], [20, 30], [0, 30]], 10);
  const eb = G.bbox(ex);
  check('extrudeY: XZ profile, Y centred on 0', near3(eb.min, [0, -5, 0], 1e-6) && near3(eb.max, [20, 5, 30], 1e-6) && near(ex.getProperties().volume, 6000, 1e-3));

  const cy = G.cylinderY({ x: 5, z: 7, r: 2, length: 40 });
  const cb = G.bbox(cy);
  check('cylinderY: axis along Y through (x, z)', near3(cb.min, [3, -20, 5], 1e-3) && near3(cb.max, [7, 20, 9], 1e-3));

  const rv = G.revolveProfile([[0, 10], [5, 10], [5, 0], [0, 0]], { center: [1, 0, 2], axis: ax, tol: 0.005 });
  const rb = G.bbox(rv);
  const rvc = rb.min.map((v, k) => (v + rb.max[k]) / 2);
  check('revolveProfile: cylinder volume and centre on the tilted axis', near(rv.getProperties().volume, Math.PI * 25 * 10, Math.PI * 250 * 0.002) && near3(rvc, G.add([1, 0, 2], G.scale(ax, 5)), 1e-3), `vol ${rv.getProperties().volume.toFixed(1)} vs ${(Math.PI * 250).toFixed(1)}`);

  const ls = G.levelSetSolid((p) => G.sdSphere(p, [0, 0, 20], 10), { min: [-10, -10, 10], max: [10, 10, 30] }, 0.6);
  const lsb = G.bbox(ls);
  check('levelSetSolid: sphere SDF → volume within 1 %, Y-symmetric bounds', near(ls.getProperties().volume, (4 / 3) * Math.PI * 1000, 0.01 * (4 / 3) * Math.PI * 1000) && near(lsb.min[1], -lsb.max[1], 1e-4), `vol ${ls.getProperties().volume.toFixed(1)}`);
}

/* ------------------------------------------------------------------ */
console.log('2. exact head (sphere segment)');
{
  const C = [3.2, 0, 98.7], Rh = 24, ax = G.headAxis(135);
  for (const [cut, fillet] of [[4.8, 0], [4.8, 3], [-4.8, 2]]) {
    const hd = G.sphereSegment({ center: C, radius: Rh, axis: ax, cut, rimFillet: fillet });
    const inf = hd.info;
    const { positions: P } = G.toMeshArrays(hd);
    let domeDev = 0, baseDev = 0, nDome = 0, apexHit = false;
    const capCos = Math.cos(inf.sphereCapDeg * G.DEG);
    for (let i = 0; i < P.length / 3; i++) {
      const v = [P[i * 3] - C[0], P[i * 3 + 1] - C[1], P[i * 3 + 2] - C[2]];
      const d = G.len(v), h = G.dot(v, ax);
      if (h / d >= capCos - 1e-9) { domeDev = Math.max(domeDev, Math.abs(d - Rh)); nDome++; }
      if (Math.abs(h - cut) < 1e-3) baseDev = Math.max(baseDev, Math.abs(h - cut));
      if (G.len(G.sub(v, G.scale(ax, Rh))) < 1e-4) apexHit = true;
    }
    const rep = validate(hd, { head: inf.validateHead, minThickness: 0, maxCreaseDeg: null });
    const tag = `cut ${cut}, rimFillet ${fillet}`;
    check(`${tag}: apex vertex at C + R·axis`, apexHit);
    check(`${tag}: dome vertices on the sphere (≤ 1e-4 mm)`, domeDev < 1e-4, `${nDome} vertices, max ${domeDev.toExponential(2)}`);
    check(`${tag}: facet deviation ≤ 0.05 mm (mold copies facets)`, rep.head.pass && rep.head.maxFacetDev <= 0.05, `max facet ${rep.head.maxFacetDev} mm, coverage ${rep.head.capCoverage}`);
    check(`${tag}: exactly mirror-symmetric about y = 0`, rep.symmetry.maxDev === 0 && rep.demold.failures === 0);
    if (!fillet) {
      const h = Rh - cut, vex = (Math.PI * h * h * (3 * Rh - h)) / 3;
      check(`${tag}: volume = analytic cap within 0.2 %`, near(hd.getProperties().volume, vex, 0.002 * vex), `${hd.getProperties().volume.toFixed(1)} vs ${vex.toFixed(1)}`);
    }
  }
}

/* ------------------------------------------------------------------ */
console.log('3. validator: allowed features pass, bad solids fail');
{
  // allowed: a 12 mm slab (fin) with a Y through-hole and round-bottom grooves on BOTH ±Y faces
  const slab = G.extrudeY([[-20, 10], [20, 10], [20, 50], [-20, 50]], 12);
  const hole = { x: -8, z: 30, r: 2 };
  // (grooves stay ≥ 7.5 mm from every face and from the hole: a groove ending 1.8 mm under
  //  a face, or running 5.7 mm from the side face, leaves a thin wall that is rightly rejected)
  const grooveA = G.capsule([10, 6.8, 20], [10, 6.8, 40], 2.5);
  const grooveB = G.capsule([10, -6.8, 20], [10, -6.8, 40], 2.5);
  let good = slab.subtract(G.cylinderY({ ...hole, length: 40 })).subtract(grooveA).subtract(grooveB);
  const rg = validate(good, { holes: [hole] });
  check('allowed (Y hole + shallow ±Y grooves): passes', rg.ok, summarize(rg) + (rg.failures.length ? ' :: ' + rg.failures.join('; ') : ''));
  check('allowed: genus 1 = declared hole, hole open', rg.genus === 1 && rg.holes[0].open);
  check('allowed: demold 0 failures on a 0.5 mm grid', rg.demold.failures === 0 && rg.demold.spacing === 0.5 && rg.demold.rays > 1000, `${rg.demold.rays} rays`);
  check('allowed: PMMA mass/packs reported', rg.pmma.densityGcm3 === 1.18 && near(rg.pmma.massG, (rg.volume.mm3 / 1000) * 1.18, 0.2) && rg.pmma.packs40g >= 1);

  // groove along X (cut into the +X side, opening toward +X) → undercut for Y demold
  const stem = G.capsule([0, 0, 6], [0, 0, 80], 6);
  const slot = G.extrudeY([[3, 20], [10, 20], [10, 40], [3, 40]], 3);
  const rx = validate(stem.subtract(slot), {});
  check('groove along X → Y-demold failure', !rx.ok && rx.demold.failures > 0 && rx.failures.some((f) => f.startsWith('Y-demold')), `${rx.demold.failures} undercut lines, region ${JSON.stringify(rx.demold.failRegionXZ)}`);

  // hole along X → demold failure and an unexpected genus
  const xhole = G.cylinderBetween([-20, 0, 40], [20, 0, 40], 2);
  const rh = validate(stem.subtract(xhole), {});
  check('hole along X → Y-demold failure + genus 1 ≠ 0', !rh.ok && rh.demold.failures > 0 && rh.genus === 1, `${rh.demold.failures} undercut lines`);

  // two disjoint parts
  const two = G.unionAll([G.capsule([0, 0, 6], [0, 0, 60], 6), G.sphereAt([40, 0, 30], 8)]);
  const r2 = validate(two, {});
  check('two disjoint parts → components 2', !r2.ok && r2.components === 2 && r2.failures.some((f) => f.includes('components')));

  // asymmetric (shifted 0.5 mm in Y)
  const ra = validate(stem.translate([0, 0.5, 0]), {});
  check('shifted 0.5 mm off the parting plane → symmetry failure', !ra.ok && ra.symmetry.maxDev > 0.3, `max dev ${ra.symmetry.maxDev}`);

  // thin fin (3 mm)
  const fin = G.extrudeY([[-20, 10], [20, 10], [20, 50], [-20, 50]], 3);
  const rf = validate(fin, {});
  check('3 mm fin → thickness failure', !rf.ok && rf.thickness.p1 < 6 && rf.failures.some((f) => f.startsWith('thickness')), `p1 ${rf.thickness.p1}`);

  // sharp concave corner (L-shaped block)
  const L = G.extrudeY([[0, 0], [30, 0], [30, 12], [12, 12], [12, 40], [0, 40]], 12);
  const rl = validate(L, {});
  check('unfilleted inner corner → crease failure', !rl.ok && rl.creases.lengthMm > 10 && rl.failures.some((f) => f.startsWith('sharp concave crease')), `${rl.creases.lengthMm} mm, worst ${rl.creases.worstDeg}°`);

  // faceted head: a coarse Manifold.sphere is not a polished sphere
  const coarse = Manifold.sphere(24, 24).translate([0, 0, 50]);
  const rc = validate(coarse, { head: { center: [0, 0, 50], radius: 24 }, maxCreaseDeg: null });
  check('coarse sphere head → head fit failure (facets > 0.05 mm)', !rc.ok && !rc.head.pass && rc.head.maxFacetDev > 0.05, `max facet ${rc.head.maxFacetDev} mm`);

  // a declared hole that is not there
  const rb = validate(slab, { holes: [hole] });
  check('declared hole missing → blocked + genus 0 ≠ 1', !rb.ok && !rb.holes[0].open && rb.genus === 0);
}

/* ------------------------------------------------------------------ */
console.log('4. example model + STL round trip');
let exampleMesh;
{
  const t1 = Date.now();
  const { manifold, meta } = EXAMPLE.build(E, { ...EXAMPLE.DEFAULTS });
  const rep = validate(manifold, { head: meta.head, holes: meta.holes });
  const tb = Date.now() - t1;
  check('example (defaults) builds and validates', rep.ok, summarize(rep) + (rep.failures.length ? ' :: ' + rep.failures.join('; ') : ''));
  check('example: distal tip at z = 0, stem axis +Z', Math.abs(rep.bounds.min[2]) < 0.05, `z min ${rep.bounds.min[2]}`);
  check('example: head centre lies on the NSA-tilted axis', near3(G.norm(G.sub(meta.head.center, [0, 0, EXAMPLE.DEFAULTS.stemTopZ])), G.headAxis(EXAMPLE.DEFAULTS.nsDeg), 1e-9));

  const stlPath = path.join(OUT, 'roundtrip.stl');
  const bytes = writeSTL(stlPath, manifold, 'foundation test');
  const back = readSTL(stlPath);
  const vM = manifold.getProperties().volume, vN = meshVolume(back);
  check('STL: binary size = 84 + 50·triangles', bytes === 84 + 50 * manifold.numTri());
  check('STL: node reader welds back to the same vertex/triangle count', back.indices.length / 3 === manifold.numTri() && back.positions.length / 3 === manifold.numVert(), `${back.positions.length / 3} verts`);
  check('STL: node volume within 0.1 %', near(vN, vM, 0.001 * vM), `${vN.toFixed(1)} vs ${vM.toFixed(1)}`);

  const py = spawnSync('python3', ['-W', 'ignore', '-c', [
    'import json, sys, trimesh',
    'm = trimesh.load(sys.argv[1], force="mesh")',
    'print(json.dumps({"volume": float(m.volume), "watertight": bool(m.is_watertight), "winding": bool(m.is_winding_consistent), "faces": int(len(m.faces)), "euler": int(m.euler_number)}))',
  ].join('\n'), stlPath], { encoding: 'utf8' });
  let tm = null;
  try { tm = JSON.parse(py.stdout.trim().split('\n').pop()); } catch { /* reported below */ }
  check('STL: trimesh loads it', !!tm, tm ? '' : (py.stderr || '').slice(-300));
  if (tm) {
    check('STL: trimesh volume within 0.5 %', near(tm.volume, vM, 0.005 * vM), `${tm.volume.toFixed(1)} vs ${vM.toFixed(1)} (${(((tm.volume - vM) / vM) * 100).toFixed(4)} %)`);
    check('STL: trimesh says watertight, consistent winding, Euler 2 (genus 0)', tm.watertight && tm.winding && tm.euler === 2, JSON.stringify(tm));
  }
  exampleMesh = G.toMeshArrays(manifold);
  console.log(`  (build + validate ${tb} ms)`);
}

/* ------------------------------------------------------------------ */
console.log('5. renders');
{
  const imgs = [];
  for (const v of VIEW_NAMES) {
    const img = renderView(exampleMesh, { view: v, label: `test ${v}` });
    const frac = nonBackgroundFraction(img);
    check(`render ${v}: non-empty`, img.width > 100 && img.height > 100 && frac > 0.05 && frac < 0.9, `${img.width}x${img.height}, ${(frac * 100).toFixed(1)} % ink`);
    imgs.push(img);
  }
  const png = encodePNG(imgs[0]);
  const dec = decodePNG(png);
  check('PNG: encoder output decodes back bit-exact', dec.width === imgs[0].width && dec.height === imgs[0].height && Buffer.compare(Buffer.from(dec.data), Buffer.from(imgs[0].data)) === 0, `${png.length} bytes`);
  const sheet = renderSheet(imgs, { cols: 2 });
  check('renderSheet: tiles 2×2', sheet.width >= 2 * Math.max(...imgs.map((i) => i.width)) && sheet.height >= 2 * Math.max(...imgs.map((i) => i.height)));
  fs.writeFileSync(path.join(OUT, 'sheet.png'), encodePNG(sheet));

  // orientation: ink extent (overlays off) matches the mm size along the view axes
  const b = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  const P = exampleMesh.positions;
  for (let i = 0; i < P.length; i++) { const k = i % 3; b.min[k] = Math.min(b.min[k], P[i]); b.max[k] = Math.max(b.max[k], P[i]); }
  const size = b.max.map((v, k) => v - b.min[k]);
  const inkBox = (img) => {
    let x0 = Infinity, x1 = -1, y0 = Infinity, y1 = -1;
    for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
      const o = (y * img.width + x) * 3;
      if (Math.abs(img.data[o] - BACKGROUND[0]) + Math.abs(img.data[o + 1] - BACKGROUND[1]) + Math.abs(img.data[o + 2] - BACKGROUND[2]) > 30) {
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
    }
    return [x1 - x0 + 1, y1 - y0 + 1];
  };
  const px = 4, bare = { pxPerMm: px, label: '', scaleBarMm: 0, axes: false, parting: false };
  const [fw, fh] = inkBox(renderView(exampleMesh, { ...bare, view: 'front' }));
  const [lw, lh] = inkBox(renderView(exampleMesh, { ...bare, view: 'lateral' }));
  const [tw, th] = inkBox(renderView(exampleMesh, { ...bare, view: 'top' }));
  check('front view: width = X extent, height = Z extent (±3 px)', near(fw, size[0] * px, 3) && near(fh, size[2] * px, 3), `${fw}x${fh} px vs ${(size[0] * px).toFixed(0)}x${(size[2] * px).toFixed(0)}`);
  check('lateral view: width = Y extent, height = Z extent (±3 px)', near(lw, size[1] * px, 3) && near(lh, size[2] * px, 3), `${lw}x${lh} px vs ${(size[1] * px).toFixed(0)}x${(size[2] * px).toFixed(0)}`);
  check('top view: width = X extent, height = Y extent (±3 px)', near(tw, size[0] * px, 3) && near(th, size[1] * px, 3), `${tw}x${th} px vs ${(size[0] * px).toFixed(0)}x${(size[1] * px).toFixed(0)}`);
}

/* ------------------------------------------------------------------ */
console.log('6. build.mjs CLI');
{
  const build = path.join(ROOT, 'build.mjs');
  const t1 = Date.now();
  const ok = spawnSync(process.execPath, [build, '--model', '_example', '--head', '48', '--out', OUT, '--quiet'], { encoding: 'utf8' });
  const dt = Date.now() - t1;
  check('build _example h48: exit 0', ok.status === 0, (ok.stdout + ok.stderr).trim().split('\n').slice(-3).join(' | '));
  const files = ['stl/_example_h48.stl', 'stl/_example_h48.json', ...VIEW_NAMES.map((v) => `render/_example_h48_${v}.png`), 'render/_example_h48_sheet.png'];
  const missing = files.filter((f) => !fs.existsSync(path.join(OUT, f)));
  check('build writes STL + JSON + one PNG per view + sheet', missing.length === 0, missing.length ? `missing ${missing.join(', ')}` : `${files.length} files`);
  let js = null;
  try { js = JSON.parse(fs.readFileSync(path.join(OUT, 'stl/_example_h48.json'), 'utf8')); } catch { /* reported below */ }
  check('JSON has params + validation report (ok)', js && js.params.headD === 48 && js.validation && js.validation.ok === true && js.validation.pmma && js.validation.demold);
  check('full build + validate + render of one model < 20 s', dt < 20000, `${dt} ms (incl. node start)`);

  const bad = spawnSync(process.execPath, [build, '--model', '_example', '--head', '48', '--set', 'smooth=false', '--out', path.join(OUT, 'bad'), '--no-render', '--quiet'], { encoding: 'utf8' });
  let jb = null;
  try { jb = JSON.parse(fs.readFileSync(path.join(OUT, 'bad', 'stl/_example_h48.json'), 'utf8')); } catch { /* reported below */ }
  check('failing model (sharp junctions) → exit code ≠ 0', bad.status !== 0 && jb && jb.validation.ok === false && jb.validation.failures.some((f) => f.startsWith('sharp concave crease')), `exit ${bad.status}`);
}

console.log(`\n${failed ? 'FAILED' : 'PASSED'}: ${passed} passed, ${failed} failed (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
process.exit(failed ? 1 : 0);
