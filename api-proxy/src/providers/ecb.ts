// ECB — European Central Bank
// Base: https://data-api.ecb.europa.eu/service/data
// Header: Accept: application/json

export interface ECBIndicator {
    flowRef: string;
    label: string;
    value: number | null;
    period: string;
    unit: string;
}

const INDICATORS: Record<string, { flowRef: string; label: string; unit: string }> = {
    eur_usd: { flowRef: 'EXR/D.USD.EUR.SP00.A', label: 'EUR/USD', unit: 'rate' },
    deposit_rate: { flowRef: 'FM/M.U2.EUR.4F.KR.DFR.LEV', label: 'Taxa facilidade depósito', unit: '%' },
    hicp_ez: { flowRef: 'ICP/M.U2.N.000000.4.ANR', label: 'IHPC zona euro', unit: '%' },
    brent: { flowRef: 'FM/M.U2.EUR.4F.KR.OIL_B.USD', label: 'Brent (USD)', unit: 'USD/bbl' },
    ttf_gas: { flowRef: 'FM/M.U2.EUR.4F.KR.GAS_TTF.EUR', label: 'TTF gás natural', unit: '€/MWh' },
};

export async function fetchECB(indicatorKey: string): Promise<ECBIndicator> {
    const ind = INDICATORS[indicatorKey];
    if (!ind) throw new Error(`Unknown ECB indicator: ${indicatorKey}`);

    // TODO: Real fetch from https://data-api.ecb.europa.eu/service/data/${ind.flowRef}
    return {
        flowRef: ind.flowRef,
        label: ind.label,
        value: null,
        period: '2026-03',
        unit: ind.unit,
    };
}

export async function fetchAllECB(): Promise<ECBIndicator[]> {
    return Promise.all(Object.keys(INDICATORS).map(fetchECB));
}
