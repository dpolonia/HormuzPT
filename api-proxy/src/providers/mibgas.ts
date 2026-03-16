// MIBGAS — Mercado Ibérico de Gás Natural
// Source: https://www.mibgas.es/en/ajax/table/daily-price/pvb/export?date=DD/MM/YYYY
// Format: CSV (Product, Delivery, Price €/MWh)

import { resilientFetchText } from '../utils/resilientFetch.js';

export interface MIBGASPrice {
    product: string;
    delivery: string;
    price_eur_mwh: number | null;
    date: string;
}

/**
 * Parse MIBGAS CSV export.
 * Format: Product;Delivery;Price (€/MWh)\n rows separated by ; or ,
 */
function parseMIBGASCSV(csv: string): MIBGASPrice[] {
    try {
        const lines = csv.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) return [];

        const results: MIBGASPrice[] = [];
        // Skip header line
        for (let i = 1; i < lines.length; i++) {
            // Try both ; and , as separator
            let parts = lines[i].split(';');
            if (parts.length < 3) parts = lines[i].split(',');
            if (parts.length < 3) continue;

            const product = parts[0].trim();
            const delivery = parts[1].trim();
            const priceStr = parts[2].trim().replace(',', '.');
            const price = parseFloat(priceStr);

            results.push({
                product,
                delivery,
                price_eur_mwh: isNaN(price) ? null : price,
                date: delivery, // Delivery date is the reference date
            });
        }

        return results;
    } catch {
        return [];
    }
}

/**
 * Fetch latest MIBGAS PVB spot prices.
 * Downloads the CSV export for today's date.
 */
export async function fetchMIBGAS(): Promise<{
    spot: number | null;
    day_ahead: number | null;
    date: string;
    all: MIBGASPrice[];
}> {
    const now = new Date();
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = now.getUTCFullYear();
    const dateStr = `${dd}/${mm}/${yyyy}`;

    const url = `https://www.mibgas.es/en/ajax/table/daily-price/pvb/export?date=${dateStr}`;

    const { data: csv } = await resilientFetchText(url, {
        cacheKey: `mibgas:pvb:${yyyy}${mm}${dd}`,
        provider: 'mibgas',
        ttlMs: 6 * 60 * 60 * 1000,
    });

    if (!csv) {
        return { spot: null, day_ahead: null, date: `${yyyy}-${mm}-${dd}`, all: [] };
    }

    const all = parseMIBGASCSV(csv);

    // Extract key prices
    const withinDay = all.find(p =>
        p.product.toLowerCase().includes('within') || p.product.toLowerCase().includes('intra')
    );
    const dayAhead = all.find(p =>
        p.product.toLowerCase().includes('day') && p.product.toLowerCase().includes('ahead')
    );

    return {
        spot: withinDay?.price_eur_mwh ?? dayAhead?.price_eur_mwh ?? all[0]?.price_eur_mwh ?? null,
        day_ahead: dayAhead?.price_eur_mwh ?? null,
        date: `${yyyy}-${mm}-${dd}`,
        all,
    };
}
