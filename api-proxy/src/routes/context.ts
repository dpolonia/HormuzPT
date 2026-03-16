import { Router } from 'express';
import { fetchAllINE } from '../providers/ine.js';
import { fetchAllBPstat } from '../providers/bpstat.js';
import { fetchEurostat } from '../providers/eurostat.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { checkAnomaly, type AnomalyFlag } from '../utils/anomalyCheck.js';

const router = Router();

// GET /api/context — Macro panel (INE + BPstat + Eurostat), TTL 24h
router.get('/context', cacheMiddleware(86400), async (_req, res) => {
    try {
        const [ine, bpstat, hicpPt, gdp, unemployment, publicDebtMeur] = await Promise.all([
            fetchAllINE(),
            fetchAllBPstat(),
            fetchEurostat('hicp_pt'),
            fetchEurostat('gdp_annual'),
            fetchEurostat('unemployment'),
            fetchEurostat('public_debt_meur'),
        ]);

        // Inject Eurostat public debt (M€) into BPstat results.
        // BPstat domain 28 dataset was deposits, not debt — Eurostat gov_10dd_edpt1 is correct.
        const debtLatest = extractLatest(publicDebtMeur.data);
        const bpstatWithDebt = [
            ...bpstat,
            {
                seriesId: 'public_debt_eurostat',
                label: 'Dívida pública (M€)',
                value: debtLatest.value,
                period: debtLatest.period,
                unit: 'M€',
            },
        ];

        // Extract latest values from Eurostat datasets for easy frontend consumption
        const eurostatSummary = {
            hicp_pt: extractLatest(hicpPt.data),
            gdp_annual: extractLatest(gdp.data),
            unemployment: extractLatest(unemployment.data),
            public_debt_meur: debtLatest,
        };

        // Run anomaly checks on key indicators
        const anomalies: AnomalyFlag[] = [];
        // INE key indicators
        const ineKeyMap: Record<string, string> = {
            '0009884': 'gdp_current',      // GDP nominal quarterly
            '0008353': 'cpi_yoy',           // CPI YoY
            '0009887': 'gdp_growth',        // GDP real growth
            '0011275': 'unemployment',      // Unemployment
        };
        for (const ind of ine) {
            const key = ineKeyMap[ind.varcd];
            if (key) {
                const flag = checkAnomaly(key, ind.value, ind.unit);
                if (flag.anomaly) anomalies.push(flag);
            }
        }
        // BPstat key indicators
        const bpstatKeyMap: Record<string, string> = {
            hicp: 'hicp',
            unemployment: 'unemployment',
            interest_rates: 'interest_rates',
            public_debt_eurostat: 'public_debt_meur',
        };
        for (const s of bpstatWithDebt) {
            const key = bpstatKeyMap[(s as any).seriesId];
            if (key) {
                const flag = checkAnomaly(key, s.value, s.unit);
                if (flag.anomaly) anomalies.push(flag);
            }
        }

        if (anomalies.length > 0) {
            console.warn('[anomaly-check] Context data anomalies detected:', JSON.stringify(anomalies));
        }

        res.json({
            source: 'ine+bpstat+eurostat',
            updated_at: new Date().toISOString(),
            ine,
            bpstat: bpstatWithDebt,
            eurostat: {
                hicp_pt: hicpPt,
                gdp_annual: gdp,
                unemployment,
                public_debt_meur: publicDebtMeur,
            },
            summary: eurostatSummary,
            anomalies: anomalies.length > 0 ? anomalies : undefined,
        });
    } catch (err) {
        res.status(502).json({ error: 'Failed to fetch context data', detail: String(err) });
    }
});

/** Extract the latest (most recent period) entry from a period→value map */
function extractLatest(data: Record<string, number | null>): { period: string; value: number | null } {
    const entries = Object.entries(data).filter(([_, v]) => v !== null);
    if (entries.length === 0) return { period: '', value: null };
    // Sort periods descending (works for both "2025-12" and "2024" formats)
    entries.sort((a, b) => b[0].localeCompare(a[0]));
    return { period: entries[0][0], value: entries[0][1] };
}

export default router;
