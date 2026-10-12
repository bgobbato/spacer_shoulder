/* Parameters of the two-half mold for the model-C humeral spacer.

   Frame (same as spacer/positivo): mm, stem axis +Z, distal end z = 0, head
   toward +X (medial), parting plane y = 0, ANT half y > 0, POST half y < 0.

   All lengths in mm. Diametral vs radial clearances are named explicitly. */

export const FR_OPTIONS = [24, 28, 32, 36];
export const HEAD_OPTIONS = [44, 48, 52];

export const DEFAULTS = {
  model: 'C',
  headD: 48,
  // chest tube (distal stem): OD = Fr/3 unless tubeOD (measured, mm) is given
  fr: 28,
  tubeOD: null,
  tubeClearDia: 0.4,      // bore Ø = OD + this (diametral). FDM holes print ~0.1–0.2 small.
  guideLen: 25,           // length of the tube guide bore below the stop (= insertion depth from the distal face)
  boreChamfer: 1.2,       // lead-in chamfer at the bore mouth
  stopLip: 1.0,           // how far the stop flats reach over the tube wall (radial, from the OD inward)
  stopLen: 2.0,           // axial length of the stop flats
  flareDeg: 30,           // cement flare from tube OD to stem Ø (only rebuilt when OD ≠ positive OD)
  // 'long' variant (C longo, no tube): core-wire exit through the distal wall
  wireExit: true,         // coaxial hole for the Ø3.2 core wire through the closed distal end
  wireClearDia: 0.4,      // wire hole Ø = wire Ø + this (diametral)
  wireChamfer: 0.8,       // lead-in chamfer at the outer mouth of the wire hole
  bedMargin: 3,           // mm kept free on every side of the 180 × 180 bed (checked, both variants)
  // walls
  wall: 8,                // minimum mold wall from cavity to any outside surface / hole
  sideMargin: 12,         // block side margin in X beyond the cavity (≥ wall; room for pins/bolts)
  topMargin: 11,          // block margin above the cavity top
  cornerR: 5,             // block vertical-edge rounding
  // registration (1 male + 1 female per half; two different diameters)
  pinD: [8, 6],           // P1 male on ANT (Ø8), P2 male on POST (Ø6)
  pinH: 6,                // male pin height above the parting face
  pinChamfer: 0.8,        // tip chamfer of male pin
  pinClear: 0.20,         // FDM clearance, RADIAL — 0.20 chosen on the surgeon's A1 mini coupon (27/Sep) (hole Ø = pin Ø + 2·pinClear)
  holeExtraDepth: 0.8,    // female hole deeper than the pin
  holeChamfer: 0.5,       // mouth chamfer of female hole
  // overflow (open technique)
  land: 2.5,              // flat land between cavity edge and the spew groove
  grooveW: 3,             // groove width
  grooveD: 1.5,           // groove depth in EACH half (closed channel 3 mm)
  exitW: 3,               // exit channel width (groove → outside)
  ventD: 2,               // air vents at the deep points (not on the dome)
  domeMarginDeg: 8,       // vents must sit this far beyond the articular cap angle
  // clamping
  bolts: true,
  boltD: 5.5,             // M5 clearance
  nutAF: 8.4,             // M5 hex nut 8 mm AF + 0.4
  nutDepth: 4.5,          // M5 nut is 4 mm thick
  featureEdge: 3,         // min material between a hole and the block edge
  // pry notches
  notchLen: 12, notchDepth: 4, notchH: 2.5,
  // engraving
  engraveDepth: 0.8,
  textH: 7,
  strokeW: 1.1,
};

export const RANGES = {
  headD: [40, 58], fr: [16, 40], tubeOD: [5, 14], tubeClearDia: [0, 1.5], guideLen: [12, 40],
  stopLip: [0.4, 2], stopLen: [1, 4], wall: [4, 20], pinClear: [0, 0.6], ventD: [1, 4], wireClearDia: [0.1, 1.5],
};

export const frToMm = (fr) => fr / 3;

export function resolveParams(user = {}) {
  const p = { ...DEFAULTS };
  for (const [k, v] of Object.entries(user)) if (v !== undefined && v !== null && v !== '') p[k] = v;
  const errors = [];
  for (const [k, [a, b]] of Object.entries(RANGES)) {
    if (p[k] == null) continue;
    if (!(Number(p[k]) >= a && Number(p[k]) <= b)) errors.push(`${k} = ${p[k]} fora da faixa [${a}, ${b}]`);
  }
  p.tubeODmm = p.tubeOD != null ? Number(p.tubeOD) : frToMm(Number(p.fr));
  p.tubeODsource = p.tubeOD != null ? 'medido (mm)' : `Fr/3 (${p.fr} Fr)`;
  p.boreD = p.tubeODmm + p.tubeClearDia;
  if (p.sideMargin < p.wall) p.sideMargin = p.wall;
  if (p.topMargin < p.wall) p.topMargin = p.wall;
  if (errors.length) throw new Error(`parâmetros inválidos: ${errors.join('; ')}`);
  return p;
}
