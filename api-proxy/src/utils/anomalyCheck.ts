/**
 * Lightweight anomaly check for key macroeconomic indicators.
 *
 * Detects obvious magnitude/unit/sign mismatches — e.g. public debt
 * in the range of deposits, GDP labelled in € instead of M€, etc.
 *
 * Design:
 *  - Does NOT reject data or crash routes.
 *  - Returns an anomaly flag per indicator for metadata/logging.
 *  - Uses simple magnitude bands (order-of-magnitude checks).
 */

export interface AnomalyFlag {
    indicator: string;
    value: number | null;
    unit: string;
    anomaly: boolean;
    reason?: string;
}

interface ExpectedRange {
    /** Minimum plausible value (inclusive) */
    min: number;
    /** Maximum plausible value (inclusive) */
    max: number;
    /** Expected unit family */
    expectedUnit: string;
    /** Human-readable description for log messages */
    description: string;
}

/**
 * Expected ranges for Portugal's key macro indicators.
 * These are deliberately wide bands — they catch gross mapping errors
 * (e.g. deposits vs debt, wrong unit) without rejecting normal fluctuations.
 *
 * Sources for calibration: Eurostat, BPstat, INE (2020-2026 range).
 */
const EXPECTED_RANGES: Record<string, ExpectedRange> = {
    // Public debt: ~260-300 B€ → 200,000-350,000 M€
    public_debt_meur: {
        min: 150_000,
        max: 400_000,
        expectedUnit: 'M€',
        description: 'Portugal public debt (Maastricht, M€)',
    },
    // Public debt as % GDP: ~90-140%
    public_debt_pct: {
        min: 50,
        max: 200,
        expectedUnit: '%',
        description: 'Portugal public debt (% GDP)',
    },
    // Nominal GDP quarterly: ~50,000-90,000 M€
    gdp_current: {
        min: 30_000,
        max: 120_000,
        expectedUnit: 'M€',
        description: 'Portugal nominal GDP quarterly (M€)',
    },
    // GDP growth YoY: typically -10% to +15%
    gdp_growth: {
        min: -15,
        max: 20,
        expectedUnit: '%',
        description: 'Portugal GDP real YoY growth (%)',
    },
    // Unemployment rate: 3-20%
    unemployment: {
        min: 2,
        max: 25,
        expectedUnit: '%',
        description: 'Portugal unemployment rate (%)',
    },
    // HICP/CPI YoY: -3% to +15%
    hicp: {
        min: -5,
        max: 20,
        expectedUnit: '%',
        description: 'Portugal HICP YoY (%)',
    },
    cpi_yoy: {
        min: -5,
        max: 20,
        expectedUnit: '%',
        description: 'Portugal CPI YoY (%)',
    },
    // Interest rates (housing credit): 0-15%
    interest_rates: {
        min: 0,
        max: 15,
        expectedUnit: '%',
        description: 'Portugal housing credit interest rate (%)',
    },
};

/**
 * Check a single indicator value against its expected range.
 */
export function checkAnomaly(
    indicator: string,
    value: number | null,
    unit: string,
): AnomalyFlag {
    const result: AnomalyFlag = { indicator, value, unit, anomaly: false };

    if (value === null || value === undefined) {
        return result; // null values are not anomalies (just missing data)
    }

    const expected = EXPECTED_RANGES[indicator];
    if (!expected) {
        return result; // no range defined — pass through
    }

    // Check unit mismatch
    if (expected.expectedUnit && unit && unit !== expected.expectedUnit) {
        result.anomaly = true;
        result.reason = `Unit mismatch: got "${unit}", expected "${expected.expectedUnit}" for ${expected.description}`;
        return result;
    }

    // Check magnitude band
    if (value < expected.min || value > expected.max) {
        result.anomaly = true;
        result.reason = `Value ${value} outside expected range [${expected.min}, ${expected.max}] for ${expected.description}`;
        return result;
    }

    return result;
}

/**
 * Check an array of indicators (INE or BPstat format).
 * Returns the array of anomaly flags (only flagged ones if filterClean=true).
 */
export function checkIndicatorArray(
    items: Array<{ label?: string; value: number | null; unit: string; varcd?: string; seriesId?: string }>,
    keyMap: Record<string, string>,
): AnomalyFlag[] {
    const flags: AnomalyFlag[] = [];

    for (const item of items) {
        const itemKey = item.varcd || item.seriesId || '';
        const anomalyKey = keyMap[itemKey];
        if (!anomalyKey) continue;

        const flag = checkAnomaly(anomalyKey, item.value, item.unit);
        if (flag.anomaly) {
            flags.push(flag);
        }
    }

    return flags;
}
