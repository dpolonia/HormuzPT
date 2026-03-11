import { Router } from 'express';
import { cacheMiddleware } from '../middleware/cache.js';

const router = Router();

// Default model state matching CLAUDE.md §3.1
const DEFAULT_MODEL_STATE = {
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

// GET /api/model-state — Current model state, TTL 1min
router.get('/model-state', cacheMiddleware(60), async (_req, res) => {
    try {
        // TODO: Read from GCS in production
        res.json({
            source: 'local',
            updated_at: new Date().toISOString(),
            state: DEFAULT_MODEL_STATE,
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch model state', detail: String(err) });
    }
});

export default router;
