// Eurostat
// Base: https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data
// Format: JSON-stat

import { resilientFetchJson } from '../utils/resilientFetch.js';

export interface EurostatDataset {
    code: string;
    label: string;
    data: Record<string, number | null>;
}

interface DatasetConfig {
    code: string;
    label: string;
    params: Record<string, string>;
    /** Extra query params for repeated keys (e.g. multiple geo values) */
    extraParams?: string;
}

const DATASETS: Record<string, DatasetConfig> = {
    hicp_pt: {
        code: 'prc_hicp_manr',
        label: 'IHPC Portugal (taxa anual)',
        params: { geo: 'PT', coicop: 'CP00', sinceTimePeriod: '2024-01' },
    },
    public_debt: {
        code: 'gov_10dd_edpt1',
        label: 'Dívida pública (% PIB)',
        params: { geo: 'PT', sector: 'S13', na_item: 'GD', unit: 'PC_GDP', sinceTimePeriod: '2018' },
    },
    public_debt_meur: {
        code: 'gov_10dd_edpt1',
        label: 'Dívida pública (M€)',
        params: { geo: 'PT', sector: 'S13', na_item: 'GD', unit: 'MIO_EUR', sinceTimePeriod: '2018' },
    },
    gdp_annual: {
        code: 'nama_10_gdp',
        label: 'PIB anual (M€ vol. enc. 2010)',
        params: { geo: 'PT', na_item: 'B1GQ', unit: 'CLV10_MEUR', sinceTimePeriod: '2020' },
    },
    unemployment: {
        code: 'une_rt_m',
        label: 'Taxa de desemprego mensal (%)',
        params: { geo: 'PT', s_adj: 'SA', age: 'TOTAL', unit: 'PC_ACT', sex: 'T', sinceTimePeriod: '2024-01' },
    },
    energy_dependency: {
        code: 'nrg_ind_id',
        label: 'Dependência energética (%)',
        params: { geo: 'PT', siec: 'TOTAL', sinceTimePeriod: '2018' },
    },
    hicp_eu: {
        code: 'prc_hicp_manr',
        label: 'IHPC comparação UE',
        params: { coicop: 'CP00', sinceTimePeriod: '2025-01' },
        extraParams: 'geo=PT&geo=DE&geo=FR&geo=ES&geo=IT&geo=EU27_2020',
    },
};

/**
 * Parse Eurostat JSON-stat response.
 * Structure:
 *   value: { "0": 2.7, "1": 2.5, ... }
 *   dimension.time.category.index: { "2025-01": 0, "2025-02": 1, ... }
 *   size: [1, 1, 1, ..., N] (last dimension = time for single-geo queries)
 */
function parseEurostatResponse(json: any): Record<string, number | null> {
    try {
        const values = json?.value;
        if (!values || typeof values !== 'object') return {};

        // Find the time dimension
        const timeDim = json?.dimension?.time;
        if (!timeDim?.category?.index) return {};

        const timeIndex = timeDim.category.index as Record<string, number>;
        // Build reverse map: index → period
        const indexToPeriod: Record<number, string> = {};
        for (const [period, idx] of Object.entries(timeIndex)) {
            indexToPeriod[idx as number] = period;
        }

        // Compute time offset within the flat value array.
        // For single-geo/single-filter queries, the time dimension is the last one
        // and values map directly: value[i] = data for time index i.
        // For multi-geo queries, we need to consider the product of dimensions before time.
        const dims = json?.id as string[] | undefined;
        const sizes = json?.size as number[] | undefined;
        if (!dims || !sizes) return {};

        const timePos = dims.indexOf('time');
        if (timePos === -1) return {};

        const timeSize = sizes[timePos];

        // For single-filter queries (all other dims size=1), direct mapping works
        const otherSizes = sizes.filter((_, i) => i !== timePos);
        const isSimple = otherSizes.every(s => s === 1);

        if (isSimple) {
            const result: Record<string, number | null> = {};
            for (let i = 0; i < timeSize; i++) {
                const period = indexToPeriod[i];
                if (period) {
                    result[period] = values[String(i)] ?? null;
                }
            }
            return result;
        }

        // Multi-dimensional: compute stride for time dimension
        // Flatten: value index = sum(dimIndex[d] * stride[d]) for all dims
        // stride[d] = product of sizes[d+1..n-1]
        // For multi-geo, return only data keyed as "GEO:PERIOD"
        const geoDim = json?.dimension?.geo;
        const geoIndex = geoDim?.category?.index as Record<string, number> | undefined;
        const geoLabels = geoDim?.category?.label as Record<string, string> | undefined;

        if (!geoIndex) return {};

        // Compute strides
        const strides: number[] = new Array(dims.length).fill(1);
        for (let d = dims.length - 2; d >= 0; d--) {
            strides[d] = strides[d + 1] * sizes[d + 1];
        }

        const geoPos = dims.indexOf('geo');
        const result: Record<string, number | null> = {};

        for (const [geo, geoIdx] of Object.entries(geoIndex)) {
            for (let t = 0; t < timeSize; t++) {
                // Compute flat index assuming all other dims = 0
                let flatIdx = 0;
                for (let d = 0; d < dims.length; d++) {
                    if (d === geoPos) flatIdx += (geoIdx as number) * strides[d];
                    else if (d === timePos) flatIdx += t * strides[d];
                    // Other dimensions: index 0 (single-filter)
                }
                const period = indexToPeriod[t];
                if (period) {
                    result[`${geo}:${period}`] = values[String(flatIdx)] ?? null;
                }
            }
        }
        return result;
    } catch {
        return {};
    }
}

export async function fetchEurostat(datasetKey: string): Promise<EurostatDataset> {
    const ds = DATASETS[datasetKey];
    if (!ds) throw new Error(`Unknown Eurostat dataset: ${datasetKey}`);

    const params = new URLSearchParams(ds.params);
    const extra = ds.extraParams ? `&${ds.extraParams}` : '';
    const url = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${ds.code}?${params}${extra}`;

    const { data: json } = await resilientFetchJson(url, {
        cacheKey: `eurostat:${datasetKey}`,
        provider: 'eurostat',
        timeoutMs: 15000,
        retries: 1,
        ttlMs: 24 * 60 * 60 * 1000,
    });

    if (!json) {
        return { code: ds.code, label: ds.label, data: {} };
    }

    const data = parseEurostatResponse(json);
    return { code: ds.code, label: ds.label, data };
}

export async function fetchAllEurostat(): Promise<EurostatDataset[]> {
    return Promise.all(Object.keys(DATASETS).map(fetchEurostat));
}
