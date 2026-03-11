// Eurostat
// Base: https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data

export interface EurostatDataset {
    code: string;
    label: string;
    data: Record<string, number | null>;
}

const DATASETS: Record<string, { code: string; label: string }> = {
    energy_prices: { code: 'nrg_pc_204', label: 'Preços energia' },
    energy_dependency: { code: 'nrg_ind_id', label: 'Dependência energética' },
    hicp_coicop: { code: 'prc_hicp_manr', label: 'IHPC por COICOP' },
    public_debt: { code: 'gov_10dd_edpt1', label: 'Dívida pública' },
};

export async function fetchEurostat(datasetKey: string): Promise<EurostatDataset> {
    const ds = DATASETS[datasetKey];
    if (!ds) throw new Error(`Unknown Eurostat dataset: ${datasetKey}`);

    // TODO: Real fetch from https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${ds.code}
    return {
        code: ds.code,
        label: ds.label,
        data: {},
    };
}

export async function fetchAllEurostat(): Promise<EurostatDataset[]> {
    return Promise.all(Object.keys(DATASETS).map(fetchEurostat));
}
