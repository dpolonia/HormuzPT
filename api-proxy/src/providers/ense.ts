// ENSE-EPE — Preços de referência de combustíveis
// Source: https://www.ense-epe.pt/precos-de-referencia/
// Format: HTML table (tablepress class), scraped for latest row

import { resilientFetchText, getProviderStatus } from '../utils/resilientFetch.js';

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

export interface ENSEReferencePrice {
    fuelType: string;
    price_eur_l: number | null;
    date: string;
}

/**
 * Parse ENSE reference price HTML table.
 * The table has columns: DATA | Gasolina (Referência) | Gasóleo (Referência) | GPL Auto | GPL Butano | GPL Propano
 * Rows are date-sorted descending; first data row = latest.
 */
function parseReferenceTable(html: string): ENSEReferencePrice[] {
    try {
        // Extract table rows: look for <tr> containing <td> with date pattern dd/mm/yyyy
        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
        const results: ENSEReferencePrice[] = [];

        let match: RegExpExecArray | null;
        while ((match = rowRegex.exec(html)) !== null) {
            const rowHtml = match[1];
            const cells: string[] = [];
            let cellMatch: RegExpExecArray | null;
            while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
                // Strip HTML tags and trim
                cells.push(cellMatch[1].replace(/<[^>]*>/g, '').trim());
            }

            // Need at least 3 cells: date, gasolina, gasóleo
            if (cells.length < 3) continue;

            // Check if first cell is a date (dd/mm/yyyy)
            const dateMatch = cells[0].match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (!dateMatch) continue;

            const date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;

            const parsePrice = (s: string): number | null => {
                // Format: "1,702€" or "1.702" or "1,702"
                const clean = s.replace(/[€\s]/g, '').replace(',', '.');
                const v = parseFloat(clean);
                return isNaN(v) ? null : v;
            };

            results.push(
                { fuelType: 'gasolina_95', price_eur_l: parsePrice(cells[1]), date },
                { fuelType: 'gasoleo', price_eur_l: parsePrice(cells[2]), date },
            );

            // Only take the first (latest) row
            break;
        }

        return results;
    } catch {
        return [];
    }
}

export async function fetchENSEReferencePrices(): Promise<ENSEReferencePrice[]> {
    const { data } = await resilientFetchText(
        'https://www.ense-epe.pt/precos-de-referencia/',
        { cacheKey: 'ense:reference', provider: 'ense', ttlMs: 24 * 60 * 60 * 1000 },
    );

    if (!data) return [];
    return parseReferenceTable(data);
}

export async function fetchPriceDecomposition(): Promise<PriceDecomposition[]> {
    // The decomposition page requires more complex scraping.
    // Use reference prices as a minimal real data source and populate what we can.
    const refs = await fetchENSEReferencePrices();
    if (refs.length === 0) {
        return [
            makeEmptyDecomposition('gasolina_95'),
            makeEmptyDecomposition('gasoleo'),
        ];
    }

    return refs.map(ref => ({
        fuelType: ref.fuelType,
        components: {
            international_quote: null, // Not available from reference page
            freight: null,
            storage: null,
            ense_reserves: null,
            biofuels: null,
            isp: null,
            carbon_tax: null,
            road_contribution: null,
            vat: null,
            total: ref.price_eur_l,
        },
        date: ref.date,
    }));
}

function makeEmptyDecomposition(fuelType: string): PriceDecomposition {
    return {
        fuelType,
        components: {
            international_quote: null, freight: null, storage: null,
            ense_reserves: null, biofuels: null, isp: null,
            carbon_tax: null, road_contribution: null, vat: null, total: null,
        },
        date: '',
    };
}
