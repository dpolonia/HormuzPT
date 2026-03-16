// ECB — European Central Bank
// Base: https://data-api.ecb.europa.eu/service/data
// Format: SDMX-JSON (jsondata)

import { resilientFetchJson, getProviderStatus } from '../utils/resilientFetch.js';

export interface ECBIndicator {
    flowRef: string;
    label: string;
    value: number | null;
    period: string;
    unit: string;
}

const INDICATORS: Record<string, { flowRef: string; label: string; unit: string }> = {
    eur_usd: { flowRef: 'EXR/D.USD.EUR.SP00.A', label: 'EUR/USD', unit: 'rate' },
    // Deposit rate: business-day frequency (B) works; monthly (M) returns 404
    deposit_rate: { flowRef: 'FM/B.U2.EUR.4F.KR.DFR.LEV', label: 'Taxa facilidade depósito', unit: '%' },
    hicp_ez: { flowRef: 'ICP/M.U2.N.000000.4.ANR', label: 'IHPC zona euro', unit: '%' },
    // Brent: ECB FM series discontinued/broken for both M and B frequencies
    brent: { flowRef: 'FM/M.U2.EUR.4F.KR.OIL_B.USD', label: 'Brent (USD)', unit: 'USD/bbl' },
    // TTF: ECB FM series also broken
    ttf_gas: { flowRef: 'FM/M.U2.EUR.4F.KR.GAS_TTF.EUR', label: 'TTF gás natural', unit: '€/MWh' },
    // PT mortgage rate via MIR (Monetary Financial Institutions Interest Rates)
    mortgage_pt: { flowRef: 'MIR/M.PT.B.A2C.AM.R.A.2250.EUR.N', label: 'Crédito habitação PT', unit: '%' },
};

/**
 * Parse ECB SDMX-JSON (jsondata format) response.
 */
function parseECBResponse(json: any): { value: number | null; period: string } {
    try {
        const series = json?.dataSets?.[0]?.series;
        if (!series) return { value: null, period: '' };

        const seriesKey = Object.keys(series)[0];
        if (!seriesKey) return { value: null, period: '' };

        const observations = series[seriesKey]?.observations;
        if (!observations) return { value: null, period: '' };

        const obsKeys = Object.keys(observations).map(Number).sort((a, b) => a - b);
        const lastKey = String(obsKeys[obsKeys.length - 1]);
        const value = observations[lastKey]?.[0] ?? null;

        const timeDim = json?.structure?.dimensions?.observation?.[0];
        const period = timeDim?.values?.[obsKeys.length - 1]?.id || '';

        return { value, period };
    } catch {
        return { value: null, period: '' };
    }
}

export async function fetchECB(indicatorKey: string): Promise<ECBIndicator> {
    const ind = INDICATORS[indicatorKey];
    if (!ind) throw new Error(`Unknown ECB indicator: ${indicatorKey}`);

    const url = `https://data-api.ecb.europa.eu/service/data/${ind.flowRef}?lastNObservations=1&format=jsondata`;

    const { data: json } = await resilientFetchJson(url, {
        cacheKey: `ecb:${indicatorKey}`,
        provider: 'ecb',
        timeoutMs: 8000,
        retries: 1,
        ttlMs: 6 * 60 * 60 * 1000,
        headers: { Accept: 'application/json' },
    });

    if (!json) {
        return { flowRef: ind.flowRef, label: ind.label, value: null, period: '', unit: ind.unit };
    }

    const { value, period } = parseECBResponse(json);
    return { flowRef: ind.flowRef, label: ind.label, value, period, unit: ind.unit };
}

export async function fetchAllECB(): Promise<ECBIndicator[]> {
    return Promise.all(Object.keys(INDICATORS).map(fetchECB));
}
