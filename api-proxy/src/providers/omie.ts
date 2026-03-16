// OMIE — Operador del Mercado Ibérico de Energía
// Source: https://www.omie.es/sites/default/files/dados/NUEVA_SECCION/INT_PBC_EV_H_ACUM.TXT
// Format: CSV/TXT with semicolon delimiter
// Columns: Date;Period;ES price;PT price;ES buy MW;ES sell MW;PT buy MW;PT sell MW;...

import { resilientFetchText } from '../utils/resilientFetch.js';

export interface OMIEPrice {
    date: string;
    period: number;
    price_es_eur_mwh: number | null;
    price_pt_eur_mwh: number | null;
}

export interface OMIEDailySummary {
    date: string;
    avg_pt_eur_mwh: number | null;
    min_pt_eur_mwh: number | null;
    max_pt_eur_mwh: number | null;
    avg_es_eur_mwh: number | null;
    hourly: OMIEPrice[];
}

/**
 * Parse OMIE accumulated hourly prices TXT file.
 * Header rows start with "OMIE" or "Fecha"; data rows start with date dd/mm/yyyy.
 * Prices use comma as decimal separator.
 */
function parseOMIE(text: string): OMIEPrice[] {
    try {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const results: OMIEPrice[] = [];

        for (const line of lines) {
            const parts = line.split(';');
            if (parts.length < 4) continue;

            // Check if first part is a date
            const dateMatch = parts[0].match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (!dateMatch) continue;

            const date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
            const period = parseInt(parts[1], 10);
            if (isNaN(period)) continue;

            const parsePrice = (s: string): number | null => {
                const v = parseFloat(s.replace(',', '.'));
                return isNaN(v) ? null : v;
            };

            results.push({
                date,
                period,
                price_es_eur_mwh: parsePrice(parts[2]),
                price_pt_eur_mwh: parsePrice(parts[3]),
            });
        }

        return results;
    } catch {
        return [];
    }
}

/**
 * Compute daily summary from hourly data.
 */
function summarize(hourly: OMIEPrice[]): OMIEDailySummary {
    const ptPrices = hourly.map(h => h.price_pt_eur_mwh).filter((v): v is number => v !== null);
    const esPrices = hourly.map(h => h.price_es_eur_mwh).filter((v): v is number => v !== null);
    const date = hourly[0]?.date || '';

    return {
        date,
        avg_pt_eur_mwh: ptPrices.length > 0 ? Math.round((ptPrices.reduce((a, b) => a + b, 0) / ptPrices.length) * 100) / 100 : null,
        min_pt_eur_mwh: ptPrices.length > 0 ? Math.min(...ptPrices) : null,
        max_pt_eur_mwh: ptPrices.length > 0 ? Math.max(...ptPrices) : null,
        avg_es_eur_mwh: esPrices.length > 0 ? Math.round((esPrices.reduce((a, b) => a + b, 0) / esPrices.length) * 100) / 100 : null,
        hourly,
    };
}

/**
 * Fetch latest OMIE day-ahead prices (Portugal + Spain).
 * Returns daily summary with PT average price.
 */
export async function fetchOMIE(): Promise<OMIEDailySummary> {
    const url = 'https://www.omie.es/sites/default/files/dados/NUEVA_SECCION/INT_PBC_EV_H_ACUM.TXT';

    const { data: text } = await resilientFetchText(url, {
        cacheKey: 'omie:dayahead',
        provider: 'omie',
        ttlMs: 6 * 60 * 60 * 1000,
    });

    if (!text) {
        return { date: '', avg_pt_eur_mwh: null, min_pt_eur_mwh: null, max_pt_eur_mwh: null, avg_es_eur_mwh: null, hourly: [] };
    }

    const hourly = parseOMIE(text);
    if (hourly.length === 0) {
        return { date: '', avg_pt_eur_mwh: null, min_pt_eur_mwh: null, max_pt_eur_mwh: null, avg_es_eur_mwh: null, hourly: [] };
    }

    return summarize(hourly);
}
