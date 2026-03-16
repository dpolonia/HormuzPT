/**
 * Sensitivity Analysis Engine — Sprint 14
 *
 * Varies one chosen input across a range while holding others fixed,
 * and returns the effect on all outputs.
 */

import { ScenarioInputs, DEFAULT_INPUTS, runScenario } from './economicEngine.js';
import { ModelParameters, DEFAULT_PARAMETERS } from './modelParameters.js';

export interface SensitivityRequest {
    /** Name of the input variable to vary */
    variable: keyof ScenarioInputs;
    /** Minimum value of the range */
    min: number;
    /** Maximum value of the range */
    max: number;
    /** Step size */
    step: number;
    /** Fixed baseline values for the other variables */
    baseline?: Partial<ScenarioInputs>;
    /** Optional custom parameters */
    parameters?: Partial<ModelParameters>;
}

export interface SensitivityPoint {
    [key: string]: number;
}

export interface SensitivityResult {
    variable: string;
    variable_label: string;
    range: { min: number; max: number; step: number };
    baseline: ScenarioInputs;
    points: SensitivityPoint[];
    outputs_included: string[];
}

const INPUT_LABELS: Record<keyof ScenarioInputs, string> = {
    oil_price_change_pct: 'Variacao preco petroleo (%)',
    gas_price_change_pct: 'Variacao preco gas natural (%)',
    electricity_price_change_pct: 'Variacao preco electricidade (%)',
    shipping_cost_change_pct: 'Variacao custo transporte maritimo (%)',
    trade_disruption_pct: 'Disrupcao comercial (%)',
    shock_duration_days: 'Duracao do choque (dias)',
};

/**
 * Run sensitivity analysis: vary one input across [min, max] by step,
 * keeping all other inputs at their baseline values.
 */
export function runSensitivity(req: SensitivityRequest): SensitivityResult {
    const { variable, min, max, step } = req;

    // Build baseline inputs: user-provided overrides + defaults
    const baseline: ScenarioInputs = { ...DEFAULT_INPUTS, ...req.baseline };
    const params: ModelParameters = { ...DEFAULT_PARAMETERS, ...req.parameters };

    // Validate
    if (!(variable in DEFAULT_INPUTS)) {
        throw new Error(`Unknown input variable: ${variable}`);
    }
    if (step <= 0) throw new Error('Step must be positive');
    if (min > max) throw new Error('Min must be <= max');

    const points: SensitivityPoint[] = [];

    for (let v = min; v <= max + step * 0.001; v += step) {
        const val = Math.round(v * 1000) / 1000; // avoid float drift
        const inputs: ScenarioInputs = { ...baseline, [variable]: val };
        const result = runScenario(inputs, params);

        points.push({
            [variable]: val,
            gdp_change_pct: result.summary.gdp_change_pct,
            cpi_change_pct: result.summary.cpi_change_pct,
            trade_balance_change_pct: result.summary.trade_balance_change_pct,
            unemployment_change_pct: result.summary.unemployment_change_pct,
            industrial_output_change_pct: result.summary.industrial_output_change_pct,
        });
    }

    return {
        variable,
        variable_label: INPUT_LABELS[variable] || variable,
        range: { min, max, step },
        baseline,
        points,
        outputs_included: [
            'gdp_change_pct',
            'cpi_change_pct',
            'trade_balance_change_pct',
            'unemployment_change_pct',
            'industrial_output_change_pct',
        ],
    };
}
