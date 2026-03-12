import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { VertexAI } from '@google-cloud/vertexai';
import { calculateCostUsd } from './pricing.js';

export type Tier = 'baixo' | 'moderado' | 'intenso';
export type Provider = 'openai' | 'anthropic' | 'vertex';

const MODEL_MAP: Record<Provider, Record<Tier, string>> = {
    openai: {
        baixo: process.env.OPENAI_MODEL_BAIXO || 'gpt-5-mini-2025-08-07',
        moderado: process.env.OPENAI_MODEL_MODERADO || 'gpt-5.4-2026-03-05',
        intenso: process.env.OPENAI_MODEL_INTENSO || 'gpt-5.4-pro-2026-03-05'
    },
    anthropic: {
        baixo: process.env.ANTHROPIC_MODEL_BAIXO || 'claude-haiku-4-5',
        moderado: process.env.ANTHROPIC_MODEL_MODERADO || 'claude-sonnet-4-6',
        intenso: process.env.ANTHROPIC_MODEL_INTENSO || 'claude-opus-4-6'
    },
    vertex: {
        baixo: process.env.VERTEX_MODEL_BAIXO || 'gemini-3.1-flash-lite-preview',
        moderado: process.env.VERTEX_MODEL_MODERADO || 'gemini-3-flash-preview',
        intenso: process.env.VERTEX_MODEL_INTENSO || 'gemini-3.1-pro-preview'
    }
};


export interface ModelMeta {
    provider: Provider;
    model: string;
    tier: Tier;
}

export interface LLMResponse {
    answer: string;
    model_meta: ModelMeta;
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
    reason: string;
}

export class LLMRouter {
    private openai: OpenAI | null = null;
    private anthropic: Anthropic | null = null;
    private vertex: VertexAI | null = null;

    constructor() {
        if (process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        }
        if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'stub') {
            this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        }
        if (process.env.VERTEX_AI_PROJECT_ID && process.env.VERTEX_AI_LOCATION) {
            this.vertex = new VertexAI({ project: process.env.VERTEX_AI_PROJECT_ID, location: process.env.VERTEX_AI_LOCATION });
        }
    }

    private inferTierFromModel(model: string): Tier {
        for (const [provider, tiers] of Object.entries(MODEL_MAP)) {
            for (const [t, m] of Object.entries(tiers)) {
                if (m === model) return t as Tier;
            }
        }
        return 'moderado';
    }

    private inferProviderFromModel(model: string): Provider {
        for (const [provider, tiers] of Object.entries(MODEL_MAP)) {
            for (const [t, m] of Object.entries(tiers)) {
                if (m === model) return provider as Provider;
            }
        }
        return 'openai';
    }

    private defaultTierForEnv(env: string): Tier {
        if (env === 'development') {
            return 'baixo';
        } else if (env === 'test') {
            return 'moderado';
        } else if (env === 'production') {
            return 'intenso';
        } else {
            return 'baixo';
        }
    }

    private tierRank(tier: Tier): number {
        if (tier === 'intenso') return 3;
        if (tier === 'moderado') return 2;
        return 1; // baixo
    }

    private minTier(t1: Tier, t2: Tier): Tier {
        return this.tierRank(t1) <= this.tierRank(t2) ? t1 : t2;
    }

    private maxTier(t1: Tier, t2: Tier): Tier {
        return this.tierRank(t1) >= this.tierRank(t2) ? t1 : t2;
    }

    private applyTaskDefaults(currentTier: Tier, taskType: string, userFacing: boolean): Tier {
        // frontend Q&A should default to Moderado
        if (taskType === 'frontend_qa') {
            return 'moderado';
        }

        if (taskType === 'long_context_reasoning' || taskType === 'long_context_synthesis') {
            return 'intenso';
        }

        // cheap backoffice and background jobs default to Baixo
        if (['backoffice_analysis', 'background_job', 'simple_extraction', 'summarization'].includes(taskType)) {
            return this.minTier(currentTier, 'baixo');
        }

        // normal recalibration starts at Moderado
        if (taskType === 'recalibration') {
            return this.maxTier(currentTier, 'moderado');
        }

        return currentTier;
    }

    private adjustTierByComplexity(currentTier: Tier, complexity: string, env: string, taskType: string, userFacing: boolean): Tier {
        if (complexity === 'low') {
            // low complexity can stay cheap, especially if not user-facing
            if (!userFacing) {
                return this.minTier(currentTier, 'baixo');
            }
            return currentTier;
        }

        if (complexity === 'medium') {
            return this.maxTier(currentTier, 'moderado');
        }

        if (complexity === 'high') {
            // High complexity should escalate
            return this.maxTier(currentTier, 'intenso');
        }

        return currentTier;
    }

    private applyCostLatencyPolicy(currentTier: Tier, env: string, taskType: string, userFacing: boolean, latencySensitive: boolean): Tier {
        // development stays cheap by default
        if (env === 'development' && !userFacing) {
            return this.minTier(currentTier, 'baixo');
        }

        // backoffice and background tasks should remain cheaper unless clearly high-complexity
        if (['backoffice_analysis', 'background_job', 'simple_extraction', 'summarization'].includes(taskType) && !userFacing) {
            return this.minTier(currentTier, 'baixo');
        }

        // frontend Q&A should avoid Intenso by default unless really needed
        if (taskType === 'frontend_qa' && userFacing) {
            return this.minTier(currentTier, 'moderado');
        }

        // latency-sensitive requests prefer Moderado/Baixo
        if (latencySensitive && currentTier === 'intenso') {
            return 'moderado';
        }

        return currentTier;
    }

    private getProviderPriorityForTier(tier: Tier): Provider[] {
        if (tier === 'intenso') {
            return ['openai', 'anthropic', 'vertex'];
        } else if (tier === 'moderado') {
            return ['openai', 'anthropic', 'vertex'];
        } else if (tier === 'baixo') {
            return ['openai', 'anthropic', 'vertex'];
        } else {
            return ['openai', 'anthropic', 'vertex'];
        }
    }

    private getModelFor(provider: Provider, tier: Tier): string {
        return MODEL_MAP[provider][tier];
    }

    private providerIsAvailable(provider: Provider): boolean {
        if (provider === 'openai' && this.openai) return true;
        if (provider === 'anthropic' && this.anthropic) return true;
        if (provider === 'vertex') {
            if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return true;
            if (process.env.VERTEX_AI_PROJECT_ID) return true;
            return false;
        }
        return false;
    }

    private modelIsAvailable(provider: Provider, model: string): boolean {
        return true;
    }

    private allowTierDowngrade(): boolean {
        return (process.env.LLM_ALLOW_TIER_DOWNGRADE || 'true').toLowerCase() === 'true';
    }

    private nextLowerTier(tier: Tier): Tier | null {
        if (tier === 'intenso') return 'moderado';
        if (tier === 'moderado') return 'baixo';
        return null;
    }

    public resolveLlmRoute(
        env: string,
        taskType: string,
        complexity: string,
        userFacing: boolean,
        latencySensitive: boolean,
        explicitTier?: Tier,
        explicitProvider?: Provider,
        explicitModel?: string
    ): { tier: Tier, provider: Provider, model: string, reason: string } {
        // 1. Explicit hard override wins
        if (explicitModel) {
            return {
                tier: explicitTier || this.inferTierFromModel(explicitModel),
                provider: explicitProvider || this.inferProviderFromModel(explicitModel),
                model: explicitModel,
                reason: 'explicit_model_override'
            };
        }

        // 2. Start from environment default
        let tier = this.defaultTierForEnv(env);

        // 3. Task-specific defaults may refine the starting point
        tier = this.applyTaskDefaults(tier, taskType, userFacing);

        // 4. Complexity may adjust tier up or down
        tier = this.adjustTierByComplexity(tier, complexity, env, taskType, userFacing);

        // 5. Latency / cost controls may keep non-critical tasks cheaper
        tier = this.applyCostLatencyPolicy(tier, env, taskType, userFacing, latencySensitive);

        // 6. Explicit tier override, if present, takes precedence after policy calculation
        if (explicitTier) {
            tier = explicitTier;
        }

        // 7. Choose provider order for the final tier
        let providerOrder = this.getProviderPriorityForTier(tier);

        // 8. If explicit provider is requested, try it first
        if (explicitProvider) {
            providerOrder = [explicitProvider, ...providerOrder.filter(p => p !== explicitProvider)];
        }

        // 9. Select first available provider/model in same tier
        for (const provider of providerOrder) {
            const model = this.getModelFor(provider, tier);
            if (this.providerIsAvailable(provider) && this.modelIsAvailable(provider, model)) {
                return {
                    tier,
                    provider,
                    model,
                    reason: 'policy_selected'
                };
            }
        }

        // 10. Same-tier providers failed: downgrade only if allowed
        if (this.allowTierDowngrade()) {
            if (explicitTier === 'intenso' || complexity === 'high' || tier === 'intenso') {
                console.warn(`[LLMRouter] Unavoidable tier downgrade from ${tier}. Explicit high-tier requested.`);
            }
            const lowerTier = this.nextLowerTier(tier);
            if (lowerTier) {
                for (const provider of this.getProviderPriorityForTier(lowerTier)) {
                    const model = this.getModelFor(provider, lowerTier);
                    if (this.providerIsAvailable(provider) && this.modelIsAvailable(provider, model)) {
                        return {
                            tier: lowerTier,
                            provider,
                            model,
                            reason: 'tier_downgrade_fallback'
                        };
                    }
                }
            }
        }

        throw new Error("No LLM route available");
    }

    public resolveRecalibrationRoute(env: string, complexity: string): { tier: Tier, provider: Provider, model: string, reason: string } {
        let tier = this.defaultTierForEnv(env);

        // recalibration should not be below Moderado
        if (tier === 'baixo') {
            tier = 'moderado';
        }

        if (complexity === 'high') {
            tier = 'intenso';
        }

        const providerOrder: Provider[] = ['vertex', 'openai', 'anthropic'];

        for (const provider of providerOrder) {
            const model = this.getModelFor(provider, tier);
            if (this.providerIsAvailable(provider) && this.modelIsAvailable(provider, model)) {
                return {
                    tier,
                    provider,
                    model,
                    reason: 'recalibration_policy'
                };
            }
        }

        throw new Error("No recalibration route available");
    }

    public resolveFrontendQaRoute(env: string, complexity: string): { tier: Tier, provider: Provider, model: string, reason: string } {
        let route = this.resolveLlmRoute(
            env,
            'frontend_qa',
            complexity,
            true, // userFacing
            true  // latencySensitive
        );

        // never silently exceed Moderado unless explicit escalation
        if (route.tier === 'intenso') {
            route = this.resolveLlmRoute(
                env,
                'frontend_qa',
                complexity,
                true,
                true,
                'moderado'
            );
            route.reason = 'frontend_default_capped_to_moderado';
        }

        return route;
    }

    async chat(prompt: string, taskType: string = 'frontend_qa'): Promise<LLMResponse> {
        const env = process.env.HORMUZ_ENV || 'development';
        
        let complexity = 'medium';
        if (taskType === 'recalibration_complex') complexity = 'high';

        let route;
        if (taskType === 'frontend_qa') {
            route = this.resolveFrontendQaRoute(env, complexity);
        } else if (taskType.startsWith('recalibration')) {
            route = this.resolveRecalibrationRoute(env, complexity);
        } else {
            route = this.resolveLlmRoute(
                env,
                taskType,
                complexity,
                true, // userFacing for chat is true
                false // latencySensitive
            );
        }

        return await this.executeCall(route.provider, route.tier, route.model, prompt, route.reason || 'policy_selected');
    }

    private async executeCall(provider: Provider, tier: Tier, model: string, prompt: string, reason: string): Promise<LLMResponse> {
        console.log(`Executing ${provider} call to model ${model} (tier: ${tier})...`);
        if (provider === 'openai' && this.openai) {
            const response = await this.openai.chat.completions.create({
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
            });
            return {
                answer: response.choices[0].message.content || '',
                model_meta: {
                    model,
                    provider,
                    tier
                },
                tokens_in: response.usage?.prompt_tokens || 0,
                tokens_out: response.usage?.completion_tokens || 0,
                cost_usd: calculateCostUsd('openai', tier, response.usage?.prompt_tokens || 0, response.usage?.completion_tokens || 0),
                reason
            };
        }

        if (provider === 'anthropic' && this.anthropic) {
            // Treat entire prompt as system + user
            const response = await this.anthropic.messages.create({
                model,
                max_tokens: 1024,
                temperature: 0.3,
                messages: [{ role: 'user', content: prompt }],
            });
            const text = response.content[0].type === 'text' ? response.content[0].text : '';
            return {
                answer: text,
                model_meta: {
                    model,
                    provider,
                    tier
                },
                tokens_in: response.usage.input_tokens || 0,
                tokens_out: response.usage.output_tokens,
                cost_usd: calculateCostUsd('anthropic', tier, response.usage.input_tokens, response.usage.output_tokens),
                reason
            };
        }

        if (provider === 'vertex' && this.vertex) {
            const vertexModel = this.vertex.getGenerativeModel({ model });
            const result = await vertexModel.generateContent(prompt);
            const response = await result.response;
            const text = response.candidates && response.candidates[0].content.parts[0].text ? response.candidates[0].content.parts[0].text : '';
            return {
                answer: text,
                model_meta: {
                    model,
                    provider,
                    tier
                },
                tokens_in: response.usageMetadata?.promptTokenCount || 0,
                tokens_out: response.usageMetadata?.candidatesTokenCount || 0,
                cost_usd: calculateCostUsd('vertex', tier, response.usageMetadata?.promptTokenCount || 0, response.usageMetadata?.candidatesTokenCount || 0),
                reason
            };
        }

        throw new Error(`Provider ${provider} not configured or initialized.`);
    }
}
