/* ROUGH print and cement estimates (not measured; a slicer gives the real
   number). Extruded volume ≈ shell (surface area × wall thickness) + infill
   fraction of the rest; time = extruded volume / average volumetric flow. */

import { volume, area } from './geom.mjs';

export const PETG_G_CM3 = 1.27;
export const PMMA_G_CM3 = 1.18;           // same assumption as positivo/src/validate.mjs
export const AVG_FLOW_MM3_S = 8;          // A1 mini, PETG, average incl. travel/accel (assumption)

export const PROFILES = {
  encaixe: { label: 'teste de encaixe / gesso', shellMm: 1.7, infill: 0.15 },   // 4 paredes 0,42 + 15 % giroide
  cimento: { label: 'bancada com cimento (PETG 100 %)', shellMm: 99, infill: 1.0 },
};

export function printEstimate(E, mold) {
  const out = { assumptions: `fluxo médio ${AVG_FLOW_MM3_S} mm³/s, PETG ${PETG_G_CM3} g/cm³, +10 % de tempo morto; estimativa grosseira — conferir no Bambu Studio`, halves: {} };
  for (const [name, m] of [['ANT', mold.ant], ['POST', mold.post]]) {
    const V = volume(m), A = area(m);
    const r = {};
    for (const [k, pr] of Object.entries(PROFILES)) {
      const shell = Math.min(V, A * pr.shellMm);
      const ext = shell + pr.infill * (V - shell);
      r[k] = { perfil: pr.label, gramas: Math.round((ext / 1000) * PETG_G_CM3), horas: +((ext / AVG_FLOW_MM3_S) * 1.1 / 3600).toFixed(1) };
    }
    out.halves[name] = { volumeCm3: +(V / 1000).toFixed(1), areaCm2: +(A / 100).toFixed(0), ...r };
  }
  const cav = volume(mold.parts.cavity) / 1000;
  out.cement = {
    cavityCm3: +cav.toFixed(1),
    gramsAt118: +(cav * PMMA_G_CM3).toFixed(1),
    withOverfill30pctG: +(cav * PMMA_G_CM3 * 1.3).toFixed(1),
    note: 'técnica aberta: encher cada metade com sobra (~30 %); o cimento dentro do dreno não está incluído; densidade 1,18 g/cm³ NÃO VERIFICADA para PMMA com antibiótico',
  };
  return out;
}
