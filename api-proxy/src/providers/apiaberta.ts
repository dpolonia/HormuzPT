// API Aberta — Preços reais combustíveis PT
// Base: https://api.apiaberta.pt/v1
// Auth: None required (public endpoint)

import { resilientFetchJson } from '../utils/resilientFetch.js';

export interface FuelPrice {
    fuel_slug: string;
    fuel_name: string;
    road_vehicle: boolean;
    avg_price_eur: number | null;
    min_price_eur: number | null;
    max_price_eur: number | null;
    station_count: number | null;
    date: string;
}

/**
 * Fetch current fuel prices from API Aberta.
 * Returns all fuel types, optionally filtered by slug.
 */
export async function fetchFuelPrices(fuelType?: string): Promise<FuelPrice[]> {
    const url = 'https://api.apiaberta.pt/v1/fuel/prices';

    const { data: json } = await resilientFetchJson(url, {
        cacheKey: 'apiaberta:fuel_prices',
        provider: 'apiaberta',
        timeoutMs: 10000,
        retries: 1,
        ttlMs: 6 * 60 * 60 * 1000,
    });

    if (!json) return [];

    const data: any[] = json?.data || [];

    const prices: FuelPrice[] = data.map((item: any) => ({
        fuel_slug: item.fuel_slug || '',
        fuel_name: item.fuel_name || '',
        road_vehicle: item.road_vehicle ?? true,
        avg_price_eur: item.avg_price_eur ?? null,
        min_price_eur: item.min_price_eur ?? null,
        max_price_eur: item.max_price_eur ?? null,
        station_count: item.station_count ?? null,
        date: item.date || '',
    }));

    if (fuelType) {
        return prices.filter(p =>
            p.fuel_slug.includes(fuelType) || p.fuel_name.toLowerCase().includes(fuelType.toLowerCase())
        );
    }

    return prices;
}
