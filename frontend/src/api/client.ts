/** Fetch wrapper for API calls */

import { API_BASE } from '../config';

export async function apiGet<T = unknown>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
    return res.json() as Promise<T>;
}

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
    return res.json() as Promise<T>;
}
