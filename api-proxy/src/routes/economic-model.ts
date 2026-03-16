import { Router, Request, Response } from 'express';
import { runScenario, DEFAULT_INPUTS, getModelStructure, ScenarioInputs } from '../model/economicEngine.js';
import { DEFAULT_PARAMETERS, PARAMETER_LABELS, SCENARIO_PRESETS, ModelParameters } from '../model/modelParameters.js';
import { runSensitivity, SensitivityRequest } from '../model/sensitivity.js';

const router = Router();

// ──────────────────────────────────────────────
// POST /api/model/run — Run one scenario
// ──────────────────────────────────────────────
router.post('/model/run', (req: Request, res: Response) => {
    try {
        const body = req.body || {};

        // Accept inputs as top-level or nested under "inputs"
        const rawInputs = body.inputs || body;
        const inputs: ScenarioInputs = {
            oil_price_change_pct: num(rawInputs.oil_price_change_pct, DEFAULT_INPUTS.oil_price_change_pct),
            gas_price_change_pct: num(rawInputs.gas_price_change_pct, DEFAULT_INPUTS.gas_price_change_pct),
            electricity_price_change_pct: num(rawInputs.electricity_price_change_pct, DEFAULT_INPUTS.electricity_price_change_pct),
            shipping_cost_change_pct: num(rawInputs.shipping_cost_change_pct, DEFAULT_INPUTS.shipping_cost_change_pct),
            trade_disruption_pct: num(rawInputs.trade_disruption_pct, DEFAULT_INPUTS.trade_disruption_pct),
            shock_duration_days: num(rawInputs.shock_duration_days, DEFAULT_INPUTS.shock_duration_days),
        };

        // Optional custom parameters (partial override)
        const params: ModelParameters = body.parameters
            ? { ...DEFAULT_PARAMETERS, ...body.parameters }
            : DEFAULT_PARAMETERS;

        const result = runScenario(inputs, params);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: 'Model run failed', detail: String(err) });
    }
});

// ──────────────────────────────────────────────
// POST /api/model/sensitivity — Sensitivity analysis
// ──────────────────────────────────────────────
router.post('/model/sensitivity', (req: Request, res: Response) => {
    try {
        const body = req.body;
        if (!body?.variable) {
            res.status(400).json({ error: 'Missing required field: variable' });
            return;
        }

        const request: SensitivityRequest = {
            variable: body.variable,
            min: num(body.min, 0),
            max: num(body.max, 100),
            step: num(body.step, 10),
            baseline: body.baseline,
            parameters: body.parameters,
        };

        const result = runSensitivity(request);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: 'Sensitivity analysis failed', detail: String(err) });
    }
});

// ──────────────────────────────────────────────
// GET /api/model/parameters — Current parameter set
// ──────────────────────────────────────────────
router.get('/model/parameters', (_req: Request, res: Response) => {
    res.json({
        parameters: DEFAULT_PARAMETERS,
        labels: PARAMETER_LABELS,
        note: 'Read-only. These are the default coefficients for the economic transmission model.',
    });
});

// ──────────────────────────────────────────────
// GET /api/model/presets — Scenario presets
// ──────────────────────────────────────────────
router.get('/model/presets', (_req: Request, res: Response) => {
    res.json({
        presets: SCENARIO_PRESETS,
        default_inputs: DEFAULT_INPUTS,
    });
});

// ──────────────────────────────────────────────
// GET /api/model/explain — Model structure metadata
// ──────────────────────────────────────────────
router.get('/model/explain', (_req: Request, res: Response) => {
    res.json(getModelStructure());
});

// ──────────────────────────────────────────────
// POST /api/model/compare — Compare multiple scenarios
// ──────────────────────────────────────────────
router.post('/model/compare', (req: Request, res: Response) => {
    try {
        const scenarios: Record<string, any> = req.body?.scenarios;
        if (!scenarios || typeof scenarios !== 'object') {
            res.status(400).json({ error: 'Missing scenarios object' });
            return;
        }

        const results: Record<string, any> = {};
        for (const [name, rawInputs] of Object.entries(scenarios)) {
            const inputs: ScenarioInputs = {
                oil_price_change_pct: num(rawInputs.oil_price_change_pct, 0),
                gas_price_change_pct: num(rawInputs.gas_price_change_pct, 0),
                electricity_price_change_pct: num(rawInputs.electricity_price_change_pct, 0),
                shipping_cost_change_pct: num(rawInputs.shipping_cost_change_pct, 0),
                trade_disruption_pct: num(rawInputs.trade_disruption_pct, 0),
                shock_duration_days: num(rawInputs.shock_duration_days, 0),
            };
            results[name] = runScenario(inputs);
        }

        res.json({ scenarios: results });
    } catch (err) {
        res.status(400).json({ error: 'Comparison failed', detail: String(err) });
    }
});

// ──────────────────────────────────────────────
// Helper
// ──────────────────────────────────────────────

function num(v: any, fallback: number): number {
    if (v === undefined || v === null || v === '') return fallback;
    const n = Number(v);
    return isNaN(n) ? fallback : n;
}

export default router;
