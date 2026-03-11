/** ModelState — full model state matching CLAUDE.md §3.1 */
export interface ModelState {
    version: string;
    updated_at: string;
    base_eff_gas: number;
    base_eff_die: number;
    pretax_gas: number;
    pretax_die: number;
    ext_gas: number;
    ext_die: number;
    disc_gas: number;
    disc_die: number;
    base_ref_eff_gas: number;
    base_ref_eff_die: number;
    base_ref_pump_gas: number;
    base_ref_pump_die: number;
    weekly_l_gas: number;
    weekly_l_die: number;
    vat_rate: number;
    temp_isp_die: number;
    w1_off_die_disc: number;
    mult_gas: Record<string, number>;
    mult_die: Record<string, number>;
    elast_gas: number;
    elast_die: number;
    mibgas_spot?: number | null;
    omie_pt_avg?: number | null;
    gas_stress_mult: number;
    elec_gas_sensitivity: number;
    mix_petroleum: number;
    mix_gas: number;
    mix_renewables: number;
    mix_biomass: number;
    mix_other: number;
}

/** Controls — user-adjustable scenario parameters */
export interface Controls {
    scenario: 'moderado' | 'severo' | 'extremo';
    elast_gas: number;
    elast_die: number;
    retain_disc_gas: number;
    retain_disc_die: number;
    threshold: number;
    horizon_weeks: number;
    use_official_w1: boolean;
    personal_die_l_week: number;
    personal_gas_l_week: number;
}

/** WeeklyResult — output of the 12-week computation */
export interface WeeklyResult {
    week: number;
    phase: string;
    gasEff: number;
    gasPump: number;
    dieEff: number;
    diePump: number;
    deltaGas: number;
    deltaDie: number;
    descGovGas: number;
    descGovDie: number;
    volGas: number;
    volDie: number;
    costGas: number;
    costDie: number;
    weeklyTotal: number;
    cumCost: number;
}

/** CascadeEffect — one of the 18 impact cascade effects */
export interface CascadeEffect {
    ordem: string;
    canal: string;
    mag: string;
    hor: string;
}

/** Default controls */
export const DEFAULT_CONTROLS: Controls = {
    scenario: 'severo',
    elast_gas: -0.20,
    elast_die: -0.15,
    retain_disc_gas: 1,
    retain_disc_die: 1,
    threshold: 0.10,
    horizon_weeks: 12,
    use_official_w1: true,
    personal_die_l_week: 30,
    personal_gas_l_week: 20,
};

/** Default model state (baseline values from CLAUDE.md §3.1) */
export const DEFAULT_MODEL_STATE: ModelState = {
    version: '2026-W11',
    updated_at: '2026-03-11T00:00:00Z',
    base_eff_gas: 1.850,
    base_eff_die: 1.955,
    pretax_gas: 0.847,
    pretax_die: 1.090,
    ext_gas: 0.550,
    ext_die: 0.7744,
    disc_gas: 0.047,
    disc_die: 0.093,
    base_ref_eff_gas: 1.751,
    base_ref_eff_die: 1.727,
    base_ref_pump_gas: 1.704,
    base_ref_pump_die: 1.633,
    weekly_l_gas: 28_854_795,
    weekly_l_die: 95_405_914,
    vat_rate: 0.23,
    temp_isp_die: 0.03553,
    w1_off_die_disc: 0.0437,
    mult_gas: { moderado: 1.20, severo: 1.35, extremo: 1.50 },
    mult_die: { moderado: 1.25, severo: 1.45, extremo: 1.65 },
    elast_gas: -0.20,
    elast_die: -0.15,
    mibgas_spot: null,
    omie_pt_avg: null,
    gas_stress_mult: 1.15,
    elec_gas_sensitivity: 0.35,
    mix_petroleum: 0.415,
    mix_gas: 0.185,
    mix_renewables: 0.182,
    mix_biomass: 0.160,
    mix_other: 0.058,
};
