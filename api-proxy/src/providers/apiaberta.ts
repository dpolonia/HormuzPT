// API Aberta — Preços reais combustíveis PT
// Base: https://api.apiaberta.pt/v1
// Auth: Header X-API-Key

import { config } from '../config.js';

export interface FuelPrice {
    type: string;
    brand: string;
    station: string;
    price: number | null;
    date: string;
}

export async function fetchFuelPrices(fuelType?: string): Promise<FuelPrice[]> {
    const _apiKey = config.apiabertaApiKey;

    // TODO: Real fetch from https://api.apiaberta.pt/v1/fuel/prices
    // with header X-API-Key and optional ?type=gasoleo
    return [
        { type: fuelType || 'gasolina_95', brand: 'stub', station: 'stub', price: null, date: '2026-03-11' },
        { type: fuelType || 'gasoleo', brand: 'stub', station: 'stub', price: null, date: '2026-03-11' },
    ];
}
