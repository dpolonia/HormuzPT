/**
 * Economic Model Parameters — configurable coefficients for the
 * HormuzPT macro-economic transmission model.
 *
 * These are NOT econometrically estimated causal truths.
 * They are transparent policy simulation coefficients, documented
 * in docs/economic-model.md, and designed for inspection and adjustment.
 *
 * Naming convention:
 *   w_*   = weight (energy import cost composition)
 *   a_*   = transport cost coefficient
 *   b_*   = industrial cost coefficient
 *   c_*   = consumer price coefficient
 *   d_*   = export competitiveness coefficient
 *   e_*   = import bill coefficient
 *   g_*   = GDP transmission coefficient
 *   p_*   = CPI transmission coefficient
 *   t_*   = trade balance coefficient
 *   u_*   = unemployment coefficient
 *   i_*   = industrial output coefficient
 */

export interface ModelParameters {
    // --- Layer 1 → Layer 2: Energy import cost weights ---
    /** Weight of oil price in energy import cost pressure */
    w_oil: number;
    /** Weight of gas price in energy import cost pressure */
    w_gas: number;
    /** Weight of electricity price in energy import cost pressure */
    w_electricity: number;

    // --- Transport cost coefficients ---
    /** Shipping cost contribution to transport pressure */
    a_shipping: number;
    /** Oil price contribution to transport pressure */
    a_oil_transport: number;

    // --- Industrial cost coefficients ---
    /** Energy cost pass-through to industry */
    b_energy_industry: number;
    /** Trade disruption impact on industry */
    b_trade_industry: number;

    // --- Consumer price coefficients ---
    /** Energy cost pass-through to consumer prices */
    c_energy_cpi: number;
    /** Transport cost pass-through to consumer prices */
    c_transport_cpi: number;

    // --- Export competitiveness coefficients ---
    /** Shipping cost impact on export competitiveness */
    d_shipping_exports: number;
    /** Trade disruption impact on export competitiveness */
    d_trade_exports: number;
    /** Industrial cost spill-over to export competitiveness */
    d_energy_exports: number;

    // --- Import bill coefficients ---
    /** Energy cost contribution to import bill */
    e_energy_imports: number;
    /** Trade disruption contribution to import bill */
    e_trade_imports: number;

    // --- GDP transmission coefficients ---
    /** Industrial cost pressure weight in GDP */
    g_industry: number;
    /** Export competitiveness weight in GDP */
    g_exports: number;
    /** Shock duration weight in GDP */
    g_duration: number;

    // --- CPI transmission coefficient ---
    /** Consumer price pressure multiplier for CPI */
    p_consumer: number;

    // --- Trade balance coefficients ---
    /** Import bill weight in trade balance */
    t_imports: number;
    /** Export competitiveness weight in trade balance */
    t_exports: number;

    // --- Unemployment coefficient ---
    /** GDP-to-unemployment Okun-like coefficient */
    u_gdp: number;

    // --- Industrial output coefficients ---
    /** Cost pressure weight in industrial output */
    i_cost: number;
    /** Duration weight in industrial output */
    i_duration: number;

    // --- Macro attenuation scale factors ---
    // These convert intermediate percentage pressures into realistic
    // percentage-point macro impacts. Without them, a 40% oil shock
    // would imply ~25 p.p. GDP decline, which is unrealistic.
    // See docs/economic-model.md §Assumptions for calibration rationale.

    /** GDP: fraction of weighted pressure → p.p. impact */
    gdp_scale: number;
    /** CPI: fraction of consumer pressure → p.p. inflation */
    cpi_scale: number;
    /** Trade balance: fraction of import/export pressure → p.p. impact */
    trade_scale: number;
    /** Industrial output: fraction of cost pressure → p.p. impact */
    industrial_scale: number;
}

/**
 * Default parameter set — initial calibration for Sprint 14.
 *
 * These are starting defaults reflecting Portugal's energy import
 * structure and macroeconomic sensitivity. They are NOT sacred truths
 * and are designed to be adjusted via the parameter endpoint.
 */
export const DEFAULT_PARAMETERS: ModelParameters = {
    // Energy import cost weights (must sum to 1.0)
    w_oil: 0.50,
    w_gas: 0.30,
    w_electricity: 0.20,

    // Transport cost coefficients
    a_shipping: 0.70,
    a_oil_transport: 0.30,

    // Industrial cost coefficients
    b_energy_industry: 0.60,
    b_trade_industry: 0.40,

    // Consumer price coefficients
    c_energy_cpi: 0.70,
    c_transport_cpi: 0.30,

    // Export competitiveness coefficients
    d_shipping_exports: 0.40,
    d_trade_exports: 0.40,
    d_energy_exports: 0.20,

    // Import bill coefficients
    e_energy_imports: 0.70,
    e_trade_imports: 0.30,

    // GDP transmission
    g_industry: 0.50,
    g_exports: 0.30,
    g_duration: 0.20,

    // CPI transmission
    p_consumer: 1.00,

    // Trade balance
    t_imports: 0.60,
    t_exports: 0.40,

    // Unemployment (Okun-like)
    u_gdp: 0.35,

    // Industrial output
    i_cost: 0.70,
    i_duration: 0.30,

    // Macro attenuation scale factors
    // Calibrated so that the severe scenario (oil+40%, gas+60%)
    // produces GDP ≈ -1.5 p.p., CPI ≈ +2.5 p.p., which aligns
    // with IMF and ECB estimates for comparable energy shocks.
    gdp_scale: 0.06,
    cpi_scale: 0.055,
    trade_scale: 0.06,
    industrial_scale: 0.09,
};

/** Human-readable labels for each parameter */
export const PARAMETER_LABELS: Record<keyof ModelParameters, string> = {
    w_oil: 'Peso do petróleo no custo energético',
    w_gas: 'Peso do gás natural no custo energético',
    w_electricity: 'Peso da electricidade no custo energético',
    a_shipping: 'Coef. frete no custo de transporte',
    a_oil_transport: 'Coef. petróleo no custo de transporte',
    b_energy_industry: 'Coef. energia no custo industrial',
    b_trade_industry: 'Coef. disrupção comercial no custo industrial',
    c_energy_cpi: 'Coef. energia nos preços ao consumidor',
    c_transport_cpi: 'Coef. transporte nos preços ao consumidor',
    d_shipping_exports: 'Coef. frete na competitividade exportadora',
    d_trade_exports: 'Coef. disrupção na competitividade exportadora',
    d_energy_exports: 'Coef. custo industrial na competitividade exportadora',
    e_energy_imports: 'Coef. energia na factura de importação',
    e_trade_imports: 'Coef. disrupção na factura de importação',
    g_industry: 'Peso da pressão industrial no PIB',
    g_exports: 'Peso da competitividade exportadora no PIB',
    g_duration: 'Peso da duração do choque no PIB',
    p_consumer: 'Multiplicador de pressão de preços → IPC',
    t_imports: 'Peso das importações na balança comercial',
    t_exports: 'Peso das exportações na balança comercial',
    u_gdp: 'Coef. PIB → desemprego (tipo Okun)',
    i_cost: 'Peso do custo no produto industrial',
    i_duration: 'Peso da duração no produto industrial',
    gdp_scale: 'Factor de escala macro: pressão → PIB (p.p.)',
    cpi_scale: 'Factor de escala macro: pressão → IPC (p.p.)',
    trade_scale: 'Factor de escala macro: pressão → balança (p.p.)',
    industrial_scale: 'Factor de escala macro: pressão → prod. industrial (p.p.)',
};

/**
 * Predefined scenario presets that map to typical Hormuz disruption intensities.
 */
export const SCENARIO_PRESETS = {
    moderado: {
        label: 'Moderado',
        description: 'Bloqueio parcial de curta duração — 2-4 semanas',
        inputs: {
            oil_price_change_pct: 20,
            gas_price_change_pct: 15,
            electricity_price_change_pct: 8,
            shipping_cost_change_pct: 25,
            trade_disruption_pct: 5,
            shock_duration_days: 21,
        },
    },
    severo: {
        label: 'Severo',
        description: 'Bloqueio total de 4-8 semanas com escalada regional',
        inputs: {
            oil_price_change_pct: 40,
            gas_price_change_pct: 60,
            electricity_price_change_pct: 25,
            shipping_cost_change_pct: 50,
            trade_disruption_pct: 15,
            shock_duration_days: 42,
        },
    },
    extremo: {
        label: 'Extremo',
        description: 'Bloqueio prolongado (8-12 semanas) com conflito alargado',
        inputs: {
            oil_price_change_pct: 80,
            gas_price_change_pct: 120,
            electricity_price_change_pct: 50,
            shipping_cost_change_pct: 100,
            trade_disruption_pct: 30,
            shock_duration_days: 84,
        },
    },
} as const;
