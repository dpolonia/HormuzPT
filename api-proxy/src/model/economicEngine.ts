/**
 * HormuzPT Economic Transmission Model — Sprint 14
 *
 * A transparent, modular, explainable policy simulation engine.
 *
 * Architecture:
 *   Layer 1 — Exogenous Shock Inputs (user-provided)
 *   Layer 2 — Intermediate Transmission Variables (computed)
 *   Layer 3 — Final Macroeconomic Outputs (computed)
 *
 * Every output includes a contribution decomposition showing
 * how each driver contributed to the final value.
 *
 * This is NOT an econometric model. It is a configurable scenario
 * simulation with explicit equations and auditable coefficients.
 */

import { ModelParameters, DEFAULT_PARAMETERS } from './modelParameters.js';

// ─────────────────────────────────────────────
// Type definitions
// ─────────────────────────────────────────────

export interface ScenarioInputs {
    /** Oil price change from baseline (%) */
    oil_price_change_pct: number;
    /** Natural gas price change from baseline (%) */
    gas_price_change_pct: number;
    /** Electricity price change from baseline (%) */
    electricity_price_change_pct: number;
    /** Shipping/freight cost change from baseline (%) */
    shipping_cost_change_pct: number;
    /** Trade disruption intensity (%) */
    trade_disruption_pct: number;
    /** Duration of the shock in days */
    shock_duration_days: number;
}

export interface IntermediateVariables {
    /** Weighted energy import cost pressure (%) */
    energy_import_cost_pressure: number;
    /** Transport sector cost pressure (%) */
    transport_cost_pressure: number;
    /** Industrial sector cost pressure (%) */
    industrial_cost_pressure: number;
    /** Consumer price pressure (%) */
    consumer_price_pressure: number;
    /** Export competitiveness loss (%) */
    export_competitiveness_pressure: number;
    /** Import bill increase pressure (%) */
    import_bill_pressure: number;
    /** Normalized shock duration (months) */
    normalized_duration: number;
}

export interface ContributionBreakdown {
    [driver: string]: number;
}

export interface OutputWithContributions {
    value: number;
    contributions: ContributionBreakdown;
    unit: string;
    label: string;
}

export interface ScenarioOutputs {
    gdp_change_pct: OutputWithContributions;
    cpi_change_pct: OutputWithContributions;
    trade_balance_change_pct: OutputWithContributions;
    unemployment_change_pct: OutputWithContributions;
    industrial_output_change_pct: OutputWithContributions;
}

export interface ScenarioResult {
    inputs: ScenarioInputs;
    parameters: ModelParameters;
    intermediate: IntermediateVariables;
    outputs: ScenarioOutputs;
    /** Flat summary for quick access */
    summary: {
        gdp_change_pct: number;
        cpi_change_pct: number;
        trade_balance_change_pct: number;
        unemployment_change_pct: number;
        industrial_output_change_pct: number;
    };
    computed_at: string;
}

// ─────────────────────────────────────────────
// Default scenario inputs (no shock)
// ─────────────────────────────────────────────

export const DEFAULT_INPUTS: ScenarioInputs = {
    oil_price_change_pct: 0,
    gas_price_change_pct: 0,
    electricity_price_change_pct: 0,
    shipping_cost_change_pct: 0,
    trade_disruption_pct: 0,
    shock_duration_days: 0,
};

// ─────────────────────────────────────────────
// Core computation — fully explicit equations
// ─────────────────────────────────────────────

/**
 * Run the economic transmission model.
 *
 * All equations are inline and visible. No hidden logic.
 *
 * @param inputs  - Layer 1: exogenous shock scenario
 * @param params  - Transmission coefficients (defaults if omitted)
 * @returns       - Full result with intermediates, outputs, and contributions
 */
export function runScenario(
    inputs: ScenarioInputs,
    params: ModelParameters = DEFAULT_PARAMETERS,
): ScenarioResult {
    // ── Layer 2: Intermediate transmission variables ──

    // Eq. 1: Energy import cost pressure
    const energy_import_cost_pressure =
        params.w_oil * inputs.oil_price_change_pct +
        params.w_gas * inputs.gas_price_change_pct +
        params.w_electricity * inputs.electricity_price_change_pct;

    // Eq. 2: Transport cost pressure
    const transport_cost_pressure =
        params.a_shipping * inputs.shipping_cost_change_pct +
        params.a_oil_transport * inputs.oil_price_change_pct;

    // Eq. 3: Industrial cost pressure
    const industrial_cost_pressure =
        params.b_energy_industry * energy_import_cost_pressure +
        params.b_trade_industry * inputs.trade_disruption_pct;

    // Eq. 4: Consumer price pressure
    const consumer_price_pressure =
        params.c_energy_cpi * energy_import_cost_pressure +
        params.c_transport_cpi * transport_cost_pressure;

    // Eq. 5: Export competitiveness pressure
    const export_competitiveness_pressure =
        params.d_shipping_exports * inputs.shipping_cost_change_pct +
        params.d_trade_exports * inputs.trade_disruption_pct +
        params.d_energy_exports * industrial_cost_pressure;

    // Eq. 6: Import bill pressure
    const import_bill_pressure =
        params.e_energy_imports * energy_import_cost_pressure +
        params.e_trade_imports * inputs.trade_disruption_pct;

    // Normalized duration (months)
    const normalized_duration = inputs.shock_duration_days / 30;

    const intermediate: IntermediateVariables = {
        energy_import_cost_pressure: round(energy_import_cost_pressure),
        transport_cost_pressure: round(transport_cost_pressure),
        industrial_cost_pressure: round(industrial_cost_pressure),
        consumer_price_pressure: round(consumer_price_pressure),
        export_competitiveness_pressure: round(export_competitiveness_pressure),
        import_bill_pressure: round(import_bill_pressure),
        normalized_duration: round(normalized_duration),
    };

    // ── Layer 3: Final macroeconomic outputs ──
    //
    // Each output = scale_factor × weighted_pressure
    // The weights (g_*, t_*, i_*) determine RELATIVE contribution.
    // The scale factors (gdp_scale, cpi_scale, etc.) convert
    // percentage pressure into realistic p.p. macro impact.

    // Eq. 7: GDP change (negative = contraction)
    const gdp_raw_industry = -params.g_industry * industrial_cost_pressure;
    const gdp_raw_exports = -params.g_exports * export_competitiveness_pressure;
    const gdp_raw_duration = -params.g_duration * normalized_duration;
    const gdp_raw = gdp_raw_industry + gdp_raw_exports + gdp_raw_duration;
    const gdp_change_pct = params.gdp_scale * gdp_raw;
    const gdp_industry = params.gdp_scale * gdp_raw_industry;
    const gdp_exports = params.gdp_scale * gdp_raw_exports;
    const gdp_duration = params.gdp_scale * gdp_raw_duration;

    // Eq. 8: CPI change (positive = inflation)
    const cpi_raw = params.p_consumer * consumer_price_pressure;
    const cpi_change_pct = params.cpi_scale * cpi_raw;
    const cpi_contrib_energy = params.cpi_scale * params.p_consumer * params.c_energy_cpi * energy_import_cost_pressure;
    const cpi_contrib_transport = params.cpi_scale * params.p_consumer * params.c_transport_cpi * transport_cost_pressure;

    // Eq. 9: Trade balance change (negative = deterioration)
    const trade_raw_imports = -params.t_imports * import_bill_pressure;
    const trade_raw_exports = -params.t_exports * export_competitiveness_pressure;
    const trade_raw = trade_raw_imports + trade_raw_exports;
    const trade_balance_change_pct = params.trade_scale * trade_raw;
    const trade_imports = params.trade_scale * trade_raw_imports;
    const trade_exports = params.trade_scale * trade_raw_exports;

    // Eq. 10: Unemployment change (positive = increase)
    // Okun-like: applied to already-scaled GDP change
    const unemployment_change_pct =
        params.u_gdp * Math.abs(Math.min(gdp_change_pct, 0));

    // Eq. 11: Industrial output change (negative = decline)
    const ind_raw_cost = -params.i_cost * industrial_cost_pressure;
    const ind_raw_duration = -params.i_duration * normalized_duration;
    const ind_raw = ind_raw_cost + ind_raw_duration;
    const industrial_output_change_pct = params.industrial_scale * ind_raw;
    const ind_cost = params.industrial_scale * ind_raw_cost;
    const ind_duration = params.industrial_scale * ind_raw_duration;

    // ── Build outputs with contribution decompositions ──

    const outputs: ScenarioOutputs = {
        gdp_change_pct: {
            value: round(gdp_change_pct),
            contributions: {
                industrial_cost_pressure: round(gdp_industry),
                export_competitiveness_pressure: round(gdp_exports),
                shock_duration: round(gdp_duration),
            },
            unit: 'p.p.',
            label: 'Variação do PIB',
        },
        cpi_change_pct: {
            value: round(cpi_change_pct),
            contributions: {
                energy_import_cost_pressure: round(cpi_contrib_energy),
                transport_cost_pressure: round(cpi_contrib_transport),
            },
            unit: 'p.p.',
            label: 'Variação do IPC',
        },
        trade_balance_change_pct: {
            value: round(trade_balance_change_pct),
            contributions: {
                import_bill_pressure: round(trade_imports),
                export_competitiveness_pressure: round(trade_exports),
            },
            unit: 'p.p.',
            label: 'Variação da balança comercial',
        },
        unemployment_change_pct: {
            value: round(unemployment_change_pct),
            contributions: {
                gdp_contraction: round(unemployment_change_pct),
            },
            unit: 'p.p.',
            label: 'Variação do desemprego',
        },
        industrial_output_change_pct: {
            value: round(industrial_output_change_pct),
            contributions: {
                industrial_cost_pressure: round(ind_cost),
                shock_duration: round(ind_duration),
            },
            unit: 'p.p.',
            label: 'Variação do produto industrial',
        },
    };

    return {
        inputs,
        parameters: params,
        intermediate,
        outputs,
        summary: {
            gdp_change_pct: round(gdp_change_pct),
            cpi_change_pct: round(cpi_change_pct),
            trade_balance_change_pct: round(trade_balance_change_pct),
            unemployment_change_pct: round(unemployment_change_pct),
            industrial_output_change_pct: round(industrial_output_change_pct),
        },
        computed_at: new Date().toISOString(),
    };
}

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────

/** Round to 4 decimal places to avoid floating-point noise */
function round(v: number): number {
    return Math.round(v * 10000) / 10000;
}

/**
 * Get the model structure metadata — variable map, equations, layers.
 * Used by GET /api/model/explain and for documentation.
 */
export function getModelStructure() {
    return {
        name: 'HormuzPT Economic Transmission Model',
        version: '1.0.0-sprint14',
        layers: {
            exogenous_inputs: {
                description: 'Choques exógenos definidos pelo utilizador',
                variables: [
                    { name: 'oil_price_change_pct', label: 'Variação do preço do petróleo', unit: '%' },
                    { name: 'gas_price_change_pct', label: 'Variação do preço do gás natural', unit: '%' },
                    { name: 'electricity_price_change_pct', label: 'Variação do preço da electricidade', unit: '%' },
                    { name: 'shipping_cost_change_pct', label: 'Variação do custo de transporte marítimo', unit: '%' },
                    { name: 'trade_disruption_pct', label: 'Intensidade da disrupção comercial', unit: '%' },
                    { name: 'shock_duration_days', label: 'Duração do choque', unit: 'dias' },
                ],
            },
            intermediate_transmission: {
                description: 'Variáveis de transmissão intermédias (calculadas)',
                variables: [
                    { name: 'energy_import_cost_pressure', label: 'Pressão custo energético importado', unit: '%' },
                    { name: 'transport_cost_pressure', label: 'Pressão custo de transporte', unit: '%' },
                    { name: 'industrial_cost_pressure', label: 'Pressão custo industrial', unit: '%' },
                    { name: 'consumer_price_pressure', label: 'Pressão preços ao consumidor', unit: '%' },
                    { name: 'export_competitiveness_pressure', label: 'Pressão competitividade exportadora', unit: '%' },
                    { name: 'import_bill_pressure', label: 'Pressão factura importação', unit: '%' },
                    { name: 'normalized_duration', label: 'Duração normalizada', unit: 'meses' },
                ],
            },
            final_outputs: {
                description: 'Impactos macroeconómicos finais',
                variables: [
                    { name: 'gdp_change_pct', label: 'Variação do PIB', unit: 'p.p.' },
                    { name: 'cpi_change_pct', label: 'Variação do IPC', unit: 'p.p.' },
                    { name: 'trade_balance_change_pct', label: 'Variação da balança comercial', unit: 'p.p.' },
                    { name: 'unemployment_change_pct', label: 'Variação do desemprego', unit: 'p.p.' },
                    { name: 'industrial_output_change_pct', label: 'Variação do produto industrial', unit: 'p.p.' },
                ],
            },
        },
        equations: [
            { id: 1, name: 'energy_import_cost_pressure', formula: 'w_oil * oil + w_gas * gas + w_electricity * electricity' },
            { id: 2, name: 'transport_cost_pressure', formula: 'a_shipping * shipping + a_oil_transport * oil' },
            { id: 3, name: 'industrial_cost_pressure', formula: 'b_energy_industry * energy_pressure + b_trade_industry * trade_disruption' },
            { id: 4, name: 'consumer_price_pressure', formula: 'c_energy_cpi * energy_pressure + c_transport_cpi * transport_pressure' },
            { id: 5, name: 'export_competitiveness_pressure', formula: 'd_shipping * shipping + d_trade * trade_disruption + d_energy * industrial_pressure' },
            { id: 6, name: 'import_bill_pressure', formula: 'e_energy * energy_pressure + e_trade * trade_disruption' },
            { id: 7, name: 'gdp_change_pct', formula: '-(g_industry * industrial + g_exports * exports + g_duration * duration)' },
            { id: 8, name: 'cpi_change_pct', formula: 'p_consumer * consumer_price_pressure' },
            { id: 9, name: 'trade_balance_change_pct', formula: '-(t_imports * import_bill + t_exports * export_competitiveness)' },
            { id: 10, name: 'unemployment_change_pct', formula: 'u_gdp * |min(gdp_change, 0)|' },
            { id: 11, name: 'industrial_output_change_pct', formula: '-(i_cost * industrial_pressure + i_duration * duration)' },
        ],
    };
}
