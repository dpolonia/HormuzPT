import { Provider, Tier } from "./router.js";

// Extracts cost structure from process.env, defaults to 0 if missing.
export function calculateCostUsd(provider: Provider, tier: Tier, tokensIn: number, tokensOut: number): number {
    const envPrefix = `${provider.toUpperCase()}_COST_${tier.toUpperCase()}`;
    
    const rawInputCost = process.env[`${envPrefix}_INPUT_USD_PER_1M`];
    const rawOutputCost = process.env[`${envPrefix}_OUTPUT_USD_PER_1M`];

    if (!rawInputCost || !rawOutputCost) {
        console.warn(`[pricing] WARNING: Missing pricing metadata for ${provider.toUpperCase()} ${tier.toUpperCase()} (${envPrefix}_INPUT_USD_PER_1M). Defaulting to $0.00.`);
    }

    const inputCostPer1M = parseFloat(rawInputCost || '0');
    const outputCostPer1M = parseFloat(rawOutputCost || '0');

    // Calculate absolute decimal cost
    const inputCost = (tokensIn / 1_000_000) * inputCostPer1M;
    const outputCost = (tokensOut / 1_000_000) * outputCostPer1M;

    // Return the total rounded to 6 decimal places to prevent floating point drift
    return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
}
