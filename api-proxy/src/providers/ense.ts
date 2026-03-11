// ENSE-EPE — Decomposição de preços de combustíveis
// URLs:
//   Decomposição: https://www.ense-epe.pt/decomposicao-de-preco/
//   Referência:   https://www.ense-epe.pt/precos-de-referencia/
//   Boletim:      https://www.ense-epe.pt/wp-content/uploads/{YYYY}/{MM}/Boletim_Diario_{YYYYMMDD}.pdf

export interface PriceDecomposition {
    fuelType: string;
    components: {
        international_quote: number | null;
        freight: number | null;
        storage: number | null;
        ense_reserves: number | null;
        biofuels: number | null;
        isp: number | null;
        carbon_tax: number | null;
        road_contribution: number | null;
        vat: number | null;
        total: number | null;
    };
    date: string;
}

export async function fetchPriceDecomposition(): Promise<PriceDecomposition[]> {
    // TODO: Real scraping/API call to ENSE-EPE
    return [
        {
            fuelType: 'gasolina_95',
            components: {
                international_quote: null, freight: null, storage: null,
                ense_reserves: null, biofuels: null, isp: null,
                carbon_tax: null, road_contribution: null, vat: null, total: null,
            },
            date: '2026-03-11',
        },
        {
            fuelType: 'gasoleo',
            components: {
                international_quote: null, freight: null, storage: null,
                ense_reserves: null, biofuels: null, isp: null,
                carbon_tax: null, road_contribution: null, vat: null, total: null,
            },
            date: '2026-03-11',
        },
    ];
}
