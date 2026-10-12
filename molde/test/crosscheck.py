#!/usr/bin/env python3
"""Independent cross-check of the mold halves with trimesh (no manifold-3d).

usage: python3 molde/test/crosscheck.py <mold.json> [...]

Per mold (JSON written by build.mjs / molde_test.mjs, STLs next to it):
  - each half watertight, winding consistent, ONE body, fits 180^3
  - no mold material inside the cement (random points inside the positive,
    above the stop flats, are outside both halves)
  - the cavity hugs the positive: points 0.4 mm outside the positive surface
    (above the stop flats, off the parting plane, away from vents) are inside
    the half on their side
  - tube bore empty along the stem axis, stop flats solid just above the stop
  - male pin tip inside its half, female hole empty at the pin depth
  - wall: analytic distance from positive-surface vertices to the block faces
    and to every through/blind hole axis (bolts, nut pockets, pin holes)
  - C longo (layout.tube is null): the WHOLE positive is cement; instead of
    bore + stop: distal end solid around the tip, core-wire exit hole empty
    on the axis; the distal face counts in the wall; half fits the bed
    STRAIGHT (footprint X x Z) with >= 3 mm free on every side
Prints one JSON line per mold; exit 1 on any failure."""
import json, sys, os
import numpy as np
import trimesh

def load(p):
    m = trimesh.load(p, force='mesh', process=True)
    m.inside = YRayParity(m)
    return m

class YRayParity:
    """Point-in-solid by counting crossings of a +Y ray (numpy, XZ grid of
    triangle buckets). Independent of trimesh.contains (too slow without
    embree) and of manifold-3d. A tiny irrational shear of the query avoids
    rays through vertices/edges."""
    def __init__(self, m, cell=2.0):
        V = m.vertices[m.faces]                    # (n,3,3)
        self.V = V
        self.cell = cell
        lo = V[:, :, [0, 2]].min(axis=1); hi = V[:, :, [0, 2]].max(axis=1)
        self.o = lo.min(axis=0) - 1
        i0 = np.floor((lo - self.o) / cell).astype(int); i1 = np.floor((hi - self.o) / cell).astype(int)
        self.b = {}
        for t in range(len(V)):
            for i in range(i0[t, 0], i1[t, 0] + 1):
                for k in range(i0[t, 1], i1[t, 1] + 1):
                    self.b.setdefault((i, k), []).append(t)
        self.b = {k: np.array(v) for k, v in self.b.items()}
    def __call__(self, pts):
        pts = np.atleast_2d(np.asarray(pts, float))
        out = np.zeros(len(pts), bool)
        for j, p in enumerate(pts):
            x, y, z = p[0] + 1.234e-6, p[1], p[2] + 2.345e-6
            key = (int(np.floor((x - self.o[0]) / self.cell)), int(np.floor((z - self.o[1]) / self.cell)))
            ts = self.b.get(key)
            if ts is None: continue
            T = self.V[ts]
            ax, az = T[:, 0, 0], T[:, 0, 2]; bx, bz = T[:, 1, 0], T[:, 1, 2]; cx, cz = T[:, 2, 0], T[:, 2, 2]
            d = (bx - ax) * (cz - az) - (cx - ax) * (bz - az)
            ok = np.abs(d) > 1e-14
            w1 = ((x - ax) * (cz - az) - (cx - ax) * (z - az)) / np.where(ok, d, 1)
            w2 = ((bx - ax) * (z - az) - (x - ax) * (bz - az)) / np.where(ok, d, 1)
            w0 = 1 - w1 - w2
            hit = ok & (w0 >= 0) & (w1 >= 0) & (w2 >= 0)
            yi = w0 * T[:, 0, 1] + w1 * T[:, 1, 1] + w2 * T[:, 2, 1]
            out[j] = (np.count_nonzero(hit & (yi > y)) % 2) == 1
        return out

def main(paths):
    bad = 0
    rng = np.random.default_rng(7)
    for jp in paths:
        J = json.load(open(jp))
        base = os.path.dirname(os.path.dirname(os.path.abspath(jp)))
        ant = load(os.path.join(base, J['files']['ANT']))
        post = load(os.path.join(base, J['files']['POST']))
        pos_path = os.path.join(base, J['positiveSource'])
        pos = load(pos_path)
        L = J['layout']; t = L['tube']; P = J['params']
        long = t is None
        res = {'mold': J['name']}
        fails = []
        for name, m in (('ANT', ant), ('POST', post)):
            bodies = m.split(only_watertight=False)
            ext = m.bounds[1] - m.bounds[0]
            r = {'watertight': bool(m.is_watertight), 'winding': bool(m.is_winding_consistent),
                 'bodies': len(bodies), 'volume_cm3': round(float(m.volume) / 1000, 2),
                 'size': [round(float(v), 2) for v in ext]}
            res[name] = r
            if not r['watertight'] or not r['winding']: fails.append(f'{name} not watertight')
            if r['bodies'] != 1: fails.append(f'{name} has {r["bodies"]} bodies')
            if max(ext) > 180: fails.append(f'{name} too big')
            # printed straight, parting face up: X and Z on the bed, 3 mm free each side
            r['bedMargins'] = [round((180 - float(ext[0])) / 2, 2), round((180 - float(ext[2])) / 2, 2)]
            if min(r['bedMargins']) < 3 or ext[1] > 180: fails.append(f'{name} does not fit the bed straight')
        zs = (L['distal']['tipZ'] - 1) if long else t['stopZ'] + P['stopLen'] + 0.3
        # 1) nothing of the mold inside the cement
        lo, hi = pos.bounds
        pts = rng.uniform(lo, hi, size=(20000, 3))
        pts = pts[pts[:, 2] > zs]
        inside = pts[pos.inside(pts)]
        hitA = int(ant.inside(inside).sum()); hitP = int(post.inside(inside).sum())
        res['cementPoints'] = int(len(inside)); res['cementPointsInMold'] = hitA + hitP
        if hitA + hitP: fails.append(f'{hitA + hitP} cement points inside mold material')
        # 2) cavity hugs the positive
        v = pos.vertices; n = pos.vertex_normals
        sel = (v[:, 2] > zs + 0.5) & (np.abs(v[:, 1]) > 0.6)
        if long:  # off the wire exit hole at the pole
            sel &= ~((v[:, 2] < L['distal']['tipZ'] + 1.5) & (np.hypot(v[:, 0], v[:, 1]) < 3))
        vents = L['vents']
        for vt in vents:
            d = np.hypot(v[:, 0] - vt['x'], v[:, 2] - vt['z'])
            sel &= d > P['ventD'] / 2 + 1.0
        idx = np.nonzero(sel)[0]
        idx = rng.choice(idx, size=min(6000, len(idx)), replace=False)
        q = v[idx] + 0.4 * n[idx]
        qa, qp = q[q[:, 1] > 0], q[q[:, 1] < 0]
        okA = ant.inside(qa); okP = post.inside(qp)
        missPts = np.r_[qa[~okA], qp[~okP]]
        # a miss that lands back inside the positive is a normal-offset artefact
        # at a concave crease, not a gap in the mold
        inPos = pos.inside(missPts) if len(missPts) else np.zeros(0, bool)
        res['huggingMissesAt'] = [[round(float(c), 2) for c in m_] for m_ in missPts[:5]]
        res['huggingMissesInsidePositive'] = int(inPos.sum())
        miss = int((~inPos).sum())
        res['huggingPoints'] = int(len(q)); res['huggingMisses'] = miss
        if miss: fails.append(f'{miss} points just outside the positive are not mold material')
        # 3) bore + stop (short) / closed tip + wire hole (long)
        if long:
            dl = L['distal']; wh = dl['wireHole']
            zw = dl['distalFaceZ'] + 1.5
            wallPts = np.array([[4, 0.4, zw], [-4, 0.4, zw], [0, 3, zw], [3, 3, zw]])
            endSolid = bool(ant.inside(wallPts).all() and post.inside(wallPts * [1, -1, 1]).all())
            zh = np.linspace(dl['distalFaceZ'] + 0.3, dl['tipZ'] - 0.3, 15)
            holePts = np.c_[np.full_like(zh, 0.3), np.full_like(zh, 0.3), zh]
            holeHit = int(ant.inside(holePts).sum() + post.inside(holePts * [1, -1, 1]).sum()) if wh else 0
            res['distal'] = {'endWallSolid': endSolid, 'wireHolePointsInMold': holeHit}
            if not endSolid: fails.append('distal end not closed')
            if holeHit: fails.append('wire hole obstructed')
        else:
          zb = np.linspace(t['distalFaceZ'] + 0.5, t['stopZ'] - 0.3, 25)
          axis = np.c_[np.zeros_like(zb), np.full_like(zb, 0.2), zb]
          axisN = axis * [1, -1, 1]
          boreHit = int(ant.inside(axis).sum() + post.inside(axisN).sum())
          rb = t['boreD'] / 2
          ring = np.array([[0.97 * rb * np.cos(a), 0.97 * rb * np.sin(a), z] for a in np.linspace(0.1, np.pi - 0.1, 12) for z in zb[::4]])
          ringHit = int(ant.inside(ring).sum() + post.inside(ring * [1, -1, 1]).sum())
          xp = (t['stopFlats']['xInner'] + rb) / 2
          flat = np.array([[xp, 0.3, t['stopZ'] + 1], [-xp, 0.3, t['stopZ'] + 1]])
          flatOk = bool(ant.inside(flat).all() and post.inside(flat * [1, -1, 1]).all())
          res['bore'] = {'axisPointsInMold': boreHit, 'ringPointsInMold': ringHit, 'stopFlatsSolid': flatOk}
          if boreHit or ringHit: fails.append('tube bore obstructed')
          if not flatOk: fails.append('stop flats missing')
        # 4) pins
        pr = []
        for pin in L['pins']:
            male = ant if pin['male'] == 'ANT' else post
            fem = post if pin['male'] == 'ANT' else ant
            s = -1 if pin['male'] == 'ANT' else 1
            tip = np.array([[pin['x'], s * (pin['height'] - 1.0), pin['z']]])
            holeEmpty = np.array([[pin['x'], s * (pin['height'] + 0.3), pin['z']], [pin['x'] + pin['d'] / 2 - 0.2, s * 2, pin['z']]])
            below = np.array([[pin['x'], s * (pin['holeDepth'] + 0.5), pin['z']]])
            r = {'pin': pin['name'], 'maleTipSolid': bool(male.inside(tip).all()),
                 'holeEmpty': bool(not fem.inside(holeEmpty).any()), 'holeFloorSolid': bool(fem.inside(below).all())}
            pr.append(r)
            if not all(r[k] for k in ('maleTipSolid', 'holeEmpty', 'holeFloorSolid')): fails.append(f'pin {pin["name"]} wrong')
        res['pins'] = pr
        # 5) analytic wall
        B = L['block']; T = B['halfThicknessY']
        vv = v if long else v[v[:, 2] > t['stopZ'] + 0.01]
        cols = [vv[:, 0] - B['x'][0], B['x'][1] - vv[:, 0], T - np.abs(vv[:, 1]) - P['engraveDepth'], B['z'][1] - vv[:, 2]]
        if long: cols.append(vv[:, 2] - B['z'][0])   # closed distal face
        dFaces = np.min(np.c_[tuple(cols)], axis=1)
        holes = [(b['x'], b['z'], P['nutAF'] / np.sqrt(3)) for b in L['bolts']] + \
                [(p['x'], p['z'], p['holeD'] / 2 + P['holeChamfer']) for p in L['pins']]
        dHoles = np.min([np.hypot(vv[:, 0] - x, vv[:, 2] - z) - r for x, z, r in holes], axis=0)
        wall = float(min(dFaces.min(), dHoles.min()))
        res['wallAnalyticMin'] = round(wall, 3)
        if wall < P['wall'] - 0.05: fails.append(f'analytic wall {wall:.2f} < {P["wall"]}')
        res['ok'] = not fails; res['failures'] = fails
        print(json.dumps(res))
        if fails: bad += 1
    sys.exit(1 if bad else 0)

if __name__ == '__main__':
    main(sys.argv[1:])
