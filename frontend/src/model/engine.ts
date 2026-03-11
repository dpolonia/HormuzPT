/**
 * HormuzPT Computation Engine — 12 weeks, 3 phases
 * Exact implementation of CLAUDE.md §3.2
 *
 * VERIFICATION (§3.3): Must reproduce these values with default state:
 *   Severo  S4: gasEff=2.0425, dieEff=2.30348, cumCost4=31,206,263, cumCost12=115,785,573
 *   Moderado S4: gasEff=1.960, dieEff=2.1486,  cumCost4=25,281,096, cumCost12=88,776,973
 *   Extremo S4: gasEff=2.125, dieEff=2.45836, cumCost4=36,995,725, cumCost12=142,087,780
 */

import { ModelState, Controls, WeeklyResult } from './types';

export function compute(state: ModelState, controls: Controls): WeeklyResult[] {
    const TAX_GAS = state.base_eff_gas - state.pretax_gas;
    const OTH_GAS = state.pretax_gas - state.ext_gas;
    const TAX_DIE = state.base_eff_die - state.pretax_die;
    const OTH_DIE = state.pretax_die - state.ext_die;

    const termGas = TAX_GAS + OTH_GAS + state.ext_gas * state.mult_gas[controls.scenario];
    const termDie = TAX_DIE + OTH_DIE + state.ext_die * state.mult_die[controls.scenario];

    const results: WeeklyResult[] = [];
    let cumCost = 0;

    for (let w = 1; w <= 12; w++) {
        let gasEff: number, dieEff: number, phase: string;

        if (w <= 4) {
            phase = 'Escalada';
            const step = Math.min(w - 1, 3);
            gasEff = state.base_eff_gas + (termGas - state.base_eff_gas) * step / 3;
            dieEff = state.base_eff_die + (termDie - state.base_eff_die) * step / 3;
        } else if (w <= 8) {
            phase = 'Plateau';
            gasEff = termGas;
            dieEff = termDie;
        } else {
            phase = 'Descompressão';
            const recovery = w - 8;
            gasEff = termGas - (termGas - state.base_eff_gas) * recovery / 12;
            dieEff = termDie - (termDie - state.base_eff_die) * recovery / 12;
        }

        const gasPump = gasEff - state.disc_gas * controls.retain_disc_gas;
        const diePump = dieEff - state.disc_die * controls.retain_disc_die;

        const deltaGas = gasEff - state.base_ref_eff_gas;
        const deltaDie = dieEff - state.base_ref_eff_die;

        const descGovGas = deltaGas > controls.threshold
            ? deltaGas * (state.vat_rate / (1 + state.vat_rate)) : 0;
        const descGovDie = (w === 1 && controls.use_official_w1)
            ? state.w1_off_die_disc
            : deltaDie > controls.threshold
                ? deltaDie * (state.vat_rate / (1 + state.vat_rate)) : 0;

        const volGas = Math.max(0, state.weekly_l_gas *
            (1 + controls.elast_gas * (gasPump / state.base_ref_pump_gas - 1)));
        const volDie = Math.max(0, state.weekly_l_die *
            (1 + controls.elast_die * (diePump / state.base_ref_pump_die - 1)));

        const costGas = descGovGas * volGas;
        const costDie = descGovDie * volDie;
        const weeklyTotal = w <= controls.horizon_weeks ? costGas + costDie : 0;
        cumCost += weeklyTotal;

        results.push({
            week: w, phase, gasEff, gasPump, dieEff, diePump,
            deltaGas, deltaDie, descGovGas, descGovDie, volGas, volDie,
            costGas, costDie, weeklyTotal, cumCost,
        });
    }
    return results;
}
