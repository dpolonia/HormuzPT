// BPstat — Banco de Portugal
// Base: https://bpstat.bportugal.pt/data/v1
// Format: JSON-stat v2.0 (observations via domain/dataset endpoint)
//
// The correct endpoint for observations is:
//   GET /data/v1/domains/{domain_id}/datasets/{dataset_id}/?lang=EN
// This returns JSON-stat with actual values.

import { resilientFetchJson } from '../utils/resilientFetch.js';

export interface BPstatSeries {
    seriesId: string;
    label: string;
    value: number | null;
    period: string;
    unit: string;
}

/**
 * Each indicator maps to a specific domain + dataset in BPstat.
 * The targetDimFilters identify which slice of the multi-dimensional
 * dataset to extract (e.g. "Portugal" in the territory dimension).
 */
interface BPstatIndicator {
    label: string;
    unit: string;
    domainId: number;
    datasetId: string;
    /** Dimension filters: dim_id → target category label substring */
    targetDimFilters: Record<string, string>;
}

const INDICATORS: Record<string, BPstatIndicator> = {
    hicp: {
        label: 'IHPC Portugal (var. homóloga)',
        unit: '%',
        domainId: 41,
        datasetId: 'b8cc662879c9f7b0f3faf89c7871fc38',
        // 5-series dataset: HICP yoy, 12m avg, trimmed mean for PT + EA
        targetDimFilters: { '63': 'Portugal', '29': 'Year-on-year' },
    },
    unemployment: {
        label: 'Taxa de desemprego (%)',
        unit: '%',
        domainId: 139,
        datasetId: 'e1bc26e910f42ba278827b0ad804be2a',
        targetDimFilters: { '23': 'Unemployment rate', '16': '74', '29': 'Ratio', '70': 'Percentage' },
    },
    gdp_expenditure: {
        label: 'Consumo privado (M€, preços correntes)',
        unit: 'M€',
        domainId: 54,
        datasetId: '8b6aeea21d8686f3788d49c7551779df',
        targetDimFilters: { '63': 'Portugal', '2': 'Private consumption' },
    },
    // public_debt removed: dataset d0b1b2758e97... in domain 28 is "Deposits" (dim 25=3182),
    // NOT actual public debt. Correct source is Eurostat gov_10dd_edpt1 (unit=MIO_EUR).
    // Public debt is now fetched via Eurostat and injected by the context route.
    interest_rates: {
        label: 'Taxas de juro — crédito habitação',
        unit: '%',
        domainId: 21,
        datasetId: '6eaa8db94523f54733dddc22479c11a4',
        targetDimFilters: { '17': 'House purchase', '54': 'Resident individuals', '43': 'Up to 1 year' },
    },
    budget: {
        label: 'Execução orçamental',
        unit: 'M€',
        domainId: 10,
        datasetId: '9a04dd6b16441184dd993a5015490e72',
        targetDimFilters: {},
    },
};

/**
 * Parse a BPstat JSON-stat v2.0 dataset response.
 * Extracts the latest non-null value matching the target dimension filters.
 *
 * JSON-stat structure:
 *   id: [dim1, dim2, ..., "reference_date"]
 *   size: [n1, n2, ..., nT]
 *   dimension.{dim}.category.index: list of category keys
 *   dimension.{dim}.category.label: dict of key → label
 *   value: dict or list of flat-indexed values
 */
function parseJsonStat(
    json: any,
    filters: Record<string, string>,
): { value: number | null; period: string } {
    try {
        const dims: string[] = json?.id;
        const size: number[] = json?.size;
        if (!dims || !size || dims.length !== size.length) {
            return { value: null, period: '' };
        }

        // Compute strides for flat index
        const strides: number[] = new Array(dims.length).fill(1);
        for (let i = dims.length - 2; i >= 0; i--) {
            strides[i] = strides[i + 1] * size[i + 1];
        }

        const refDatePos = dims.indexOf('reference_date');
        if (refDatePos === -1) return { value: null, period: '' };

        const refDateIdx: string[] = json.dimension.reference_date.category.index;
        const dateCount = refDateIdx.length;

        // For each non-reference-date dimension, find the target position
        const dimPositions: number[] = new Array(dims.length).fill(0);

        for (let d = 0; d < dims.length; d++) {
            if (dims[d] === 'reference_date') continue;

            const dim = json.dimension[dims[d]];
            if (!dim?.category) continue;

            const catIdx: string[] = dim.category.index;
            const catLbl: Record<string, string> = dim.category.label || {};

            const filterValue = filters[dims[d]];
            if (filterValue) {
                // Find category matching the filter substring
                let found = false;
                for (let i = 0; i < catIdx.length; i++) {
                    const label = catLbl[catIdx[i]] || catIdx[i];
                    if (label.includes(filterValue)) {
                        dimPositions[d] = i;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    // Filter didn't match — try position 0
                    dimPositions[d] = 0;
                }
            }
            // No filter → use position 0 (default)
        }

        // Get values (can be dict or array)
        const vals = json.value;
        const getVal = (flatIdx: number): number | null => {
            if (Array.isArray(vals)) {
                return vals[flatIdx] ?? null;
            }
            return vals?.[String(flatIdx)] ?? null;
        };

        // Scan dates backwards to find latest non-null value
        for (let t = dateCount - 1; t >= 0; t--) {
            dimPositions[refDatePos] = t;

            // Compute flat index
            let flatIdx = 0;
            for (let d = 0; d < dims.length; d++) {
                flatIdx += dimPositions[d] * strides[d];
            }

            const v = getVal(flatIdx);
            if (v !== null && v !== undefined) {
                return { value: v, period: refDateIdx[t] };
            }
        }

        return { value: null, period: '' };
    } catch {
        return { value: null, period: '' };
    }
}

export async function fetchBPstat(indicatorKey: string): Promise<BPstatSeries> {
    const ind = INDICATORS[indicatorKey];
    if (!ind) throw new Error(`Unknown BPstat indicator: ${indicatorKey}`);

    const url = `https://bpstat.bportugal.pt/data/v1/domains/${ind.domainId}/datasets/${ind.datasetId}/?lang=EN`;

    const { data: json } = await resilientFetchJson(url, {
        cacheKey: `bpstat:${indicatorKey}`,
        provider: 'bpstat',
        timeoutMs: 15000,
        retries: 1,
        ttlMs: 24 * 60 * 60 * 1000,
    });

    if (!json) {
        return { seriesId: indicatorKey, label: ind.label, value: null, period: '', unit: ind.unit };
    }

    const { value, period } = parseJsonStat(json, ind.targetDimFilters);

    // Format period: "2025-12-31" → "2025-12" or "2024-12-31" → "2024"
    const formattedPeriod = period.replace(/-\d{2}$/, '');

    return {
        seriesId: indicatorKey,
        label: ind.label,
        value,
        period: formattedPeriod,
        unit: ind.unit,
    };
}

export async function fetchAllBPstat(): Promise<BPstatSeries[]> {
    return Promise.all(Object.keys(INDICATORS).map(fetchBPstat));
}
