// Configuration — all secrets loaded from environment (.env via docker-compose)

export const config = {
    port: parseInt(process.env.PORT || '8081', 10),
    env: process.env.HORMUZ_ENV || 'development',

    // API keys (loaded from .env, never hardcoded)
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    vertexApiKey: process.env.VERTEX_AI_API_KEY || '',
    huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY || '',
    scopusApiKey: process.env.SCOPUS_API_KEY || '',
    apiabertaApiKey: process.env.APIABERTA_API_KEY || '',

    // GCP
    gcsBucket: process.env.GCS_BUCKET || 'hormuzpt-hormuz-cache',
    gcpProject: process.env.GOOGLE_CLOUD_PROJECT || 'hormuzpt',
    vertexLocation: process.env.VERTEX_AI_LOCATION || 'europe-west1',

    // Limits
    maxWeeklyLlmCost: parseFloat(process.env.MAX_WEEKLY_LLM_COST_USD || '50'),

    // Recalibrator URL (for internal routing)
    recalibratorUrl: process.env.RECALIBRATOR_URL || 'http://recalibrator:8082',
} as const;
