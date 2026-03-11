// BPstat — Banco de Portugal
// Base: https://bpstat.bportugal.pt/data/v1

export interface BPstatSeries {
    seriesId: string;
    label: string;
    value: number | null;
    period: string;
    unit: string;
}

const SERIES: Record<string, { id: string; label: string; unit: string }> = {
    gdp_real: { id: '12559825', label: 'PIB real (var. homóloga)', unit: '%' },
    hicp: { id: '12559619', label: 'IHPC Portugal', unit: 'índice' },
    current_account: { id: '12517013', label: 'Balança corrente', unit: 'M€' },
    public_debt: { id: '12559829', label: 'Dívida pública (% PIB)', unit: '%' },
    debt_interest: { id: '12516825', label: 'Taxa juro dívida', unit: '%' },
    mortgage_rate: { id: '12516755', label: 'Crédito habitação — taxa média', unit: '%' },
    employment: { id: '12559827', label: 'Emprego total', unit: 'milhares' },
    tax_revenue: { id: '12517093', label: 'Receita fiscal', unit: 'M€' },
};

export async function fetchBPstat(seriesKey: string): Promise<BPstatSeries> {
    const s = SERIES[seriesKey];
    if (!s) throw new Error(`Unknown BPstat series: ${seriesKey}`);

    // TODO: Real fetch from https://bpstat.bportugal.pt/data/v1/observations/?series_ids=${s.id}
    return {
        seriesId: s.id,
        label: s.label,
        value: null,
        period: '2025-Q4',
        unit: s.unit,
    };
}

export async function fetchAllBPstat(): Promise<BPstatSeries[]> {
    return Promise.all(Object.keys(SERIES).map(fetchBPstat));
}
