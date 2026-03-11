// INE — Instituto Nacional de Estatística
// Base: https://www.ine.pt/ine/json_indicador/pindica.jsp

export interface INEIndicator {
    varcd: string;
    label: string;
    value: number | null;
    period: string;
    unit: string;
}

const INDICATORS: Record<string, { varcd: string; label: string; unit: string }> = {
    cpi: { varcd: '0008350', label: 'IPC (COICOP)', unit: 'índice' },
    gdp: { varcd: '0009894', label: 'PIB trimestral', unit: 'M€' },
    trade: { varcd: '0005692', label: 'Balança comercial', unit: 'M€' },
    fuel_sales: { varcd: '0005985', label: 'Vendas combustíveis', unit: 'litros' },
    unemployment: { varcd: '0005599', label: 'Taxa desemprego', unit: '%' },
    services: { varcd: '0007916', label: 'Vol. negócios serviços', unit: 'índice' },
};

export async function fetchINE(indicatorKey: string): Promise<INEIndicator> {
    const ind = INDICATORS[indicatorKey];
    if (!ind) throw new Error(`Unknown INE indicator: ${indicatorKey}`);

    // TODO: Real fetch from https://www.ine.pt/ine/json_indicador/pindica.jsp?varcd=${ind.varcd}
    // Returning structured mock data for now
    return {
        varcd: ind.varcd,
        label: ind.label,
        value: null,
        period: '2026-Q1',
        unit: ind.unit,
    };
}

export async function fetchAllINE(): Promise<INEIndicator[]> {
    return Promise.all(Object.keys(INDICATORS).map(fetchINE));
}
