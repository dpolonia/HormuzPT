// INE — Instituto Nacional de Estatística
// Base: https://www.ine.pt/ine/json_indicador/pindica.jsp
// Format: Custom JSON (array of indicator objects)

import { resilientFetchJson } from '../utils/resilientFetch.js';

export interface INEIndicator {
    varcd: string;
    label: string;
    value: number | null;
    period: string;
    unit: string;
}

const INDICATORS: Record<string, { varcd: string; label: string; unit: string }> = {
    cpi_yoy: { varcd: '0008353', label: 'IPC taxa variação homóloga (%)', unit: '%' },
    cpi_avg: { varcd: '0008355', label: 'IPC taxa variação média 12 meses (%)', unit: '%' },
    gdp_growth: { varcd: '0009887', label: 'PIB real variação homóloga (%)', unit: '%' },
    gdp_current: { varcd: '0009884', label: 'PIB a preços correntes (M€)', unit: 'M€' },
    unemployment: { varcd: '0011275', label: 'Taxa de desemprego (%)', unit: '%' },
    imports: { varcd: '0008075', label: 'Importações de bens (€)', unit: '€' },
    exports: { varcd: '0008076', label: 'Exportações de bens (€)', unit: '€' },
    mfg_employment: { varcd: '0011389', label: 'Emprego na indústria transformadora (%)', unit: '%' },
};

/**
 * Parse INE JSON response.
 * Structure:
 *   [0].IndicadorDsg = indicator description
 *   [0].UltimoPref = most recent period (e.g. "2025")
 *   [0].Dados["2025"] = array of { geocod, geodsg, dim_3, dim_3_t, valor, ... }
 */
function parseINEResponse(json: any): { value: number | null; period: string } {
    try {
        const item = json?.[0];
        if (!item || item.Sucesso === false) return { value: null, period: '' };

        const period = item.UltimoPref || '';
        const data = item.Dados;
        if (!data || !period) return { value: null, period: '' };

        const periodData = data[period];
        if (!Array.isArray(periodData) || periodData.length === 0) {
            return { value: null, period };
        }

        // Filter rows with valid numeric values
        const validRows = periodData.filter((r: any) => {
            const v = r.valor;
            return v != null && v !== '' && v !== 'x' && v !== '..';
        });

        if (validRows.length === 0) return { value: null, period };

        // Score rows: prefer PT geocod + HM sex + "Total" dimensions
        const scored = validRows.map((r: any) => {
            let score = 0;
            if (r.geocod === 'PT' || r.geocod === '1') score += 10;
            if (r.geodsg?.includes('Portugal')) score += 10;
            if (r.dim_3 === 'HM' || r.dim_3 === 'T') score += 5;
            if (r.dim_3_t?.includes('Total') || r.dim_3_t === 'HM') score += 3;
            for (const key of Object.keys(r)) {
                if (key.endsWith('_t') && typeof r[key] === 'string' && r[key] === 'Total') {
                    score += 2;
                }
            }
            return { row: r, score };
        });

        scored.sort((a, b) => b.score - a.score);
        const ptRow = scored[0].row;

        const rawValue = ptRow?.valor;
        if (rawValue == null || rawValue === '' || rawValue === 'x') {
            return { value: null, period };
        }

        const value = parseFloat(String(rawValue).replace(/\s/g, ''));
        return { value: isNaN(value) ? null : value, period };
    } catch {
        return { value: null, period: '' };
    }
}

export async function fetchINE(indicatorKey: string): Promise<INEIndicator> {
    const ind = INDICATORS[indicatorKey];
    if (!ind) throw new Error(`Unknown INE indicator: ${indicatorKey}`);

    const url = `https://www.ine.pt/ine/json_indicador/pindica.jsp?op=2&varcd=${ind.varcd}&lang=PT`;

    const { data: json } = await resilientFetchJson(url, {
        cacheKey: `ine:${indicatorKey}`,
        provider: 'ine',
        timeoutMs: 15000,
        retries: 1,
        ttlMs: 24 * 60 * 60 * 1000, // 24h — INE data updates infrequently
    });

    if (!json) {
        return { varcd: ind.varcd, label: ind.label, value: null, period: '', unit: ind.unit };
    }

    const { value, period } = parseINEResponse(json);
    return { varcd: ind.varcd, label: ind.label, value, period, unit: ind.unit };
}

export async function fetchAllINE(): Promise<INEIndicator[]> {
    return Promise.all(Object.keys(INDICATORS).map(fetchINE));
}
