import { Router, Request, Response } from 'express';
import { LLMRouter } from '../llm/router.js';
import { logAudit } from '../utils/logger.js';
import { getModelState } from '../services/modelStateService.js';
import { buildChatCacheKey, getCachedChat, setCachedChat } from '../services/chatCache.js';
import type { ModelStateEnvelope } from '../types/modelState.js';
import db from '../services/db.js';

const router = Router();
const llmRouter = new LLMRouter();

type ModelStateData = Record<string, unknown>;

type ChatResultMeta = {
  provider: string;
  model: string;
  tier: string;
};

type PersistableResult = {
  model_meta: ChatResultMeta;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
};

function stringifyModelState(modelState: unknown): string {
  if (!modelState) return 'Dados não disponíveis.';

  try {
    return JSON.stringify(modelState, null, 2);
  } catch {
    return 'Dados não disponíveis.';
  }
}

function buildFallbackAnswer(question: string, baselineState: string): string {
  return [
    'O serviço de linguagem não está atualmente disponível, pelo que esta resposta foi gerada em modo de contingência.',
    '',
    `Pergunta recebida: ${question}`,
    '',
    'Estado-base disponível no momento:',
    baselineState || 'Dados não disponíveis.',
    '',
    'Interpretação prudente:',
    '- A plataforma continua operacional para consulta do estado do modelo.',
    '- A componente explicativa por LLM encontra-se temporariamente indisponível.',
    '- Assim que um provider estiver configurado, o endpoint voltará a responder com análise interpretativa em PT-PT.'
  ].join('\n');
}

async function fetchBaselineState(): Promise<{
  baselineStateText: string;
  modelMetaPayload: ModelStateData | null;
  modelStateLoaded: boolean;
  modelStateError: string | null;
  modelStateVersion: string;
}> {
  try {
    const envelope = await getModelState();

    // getModelState() always returns a ModelStateEnvelope with .state
    const statePayload = (envelope.state as ModelStateData) ?? null;

    return {
      baselineStateText: stringifyModelState(statePayload),
      modelMetaPayload: statePayload,
      modelStateLoaded: !!statePayload,
      modelStateError: null,
      modelStateVersion: envelope.version || 'unknown'
    };
  } catch (error) {
    return {
      baselineStateText: 'Dados não disponíveis.',
      modelMetaPayload: null,
      modelStateLoaded: false,
      modelStateError: error instanceof Error ? error.message : String(error),
      modelStateVersion: 'unknown'
    };
  }
}

function persistHistory(question: string, result: PersistableResult) {
  try {
    const stmt = db.prepare(
      'INSERT INTO history_events (timestamp, user, action, details) VALUES (?, ?, ?, ?)'
    );

    const timestamp = new Date().toISOString();
    const details = {
      question,
      model_meta: result.model_meta,
      tokens_in: result.tokens_in,
      tokens_out: result.tokens_out,
      cost_usd: result.cost_usd
    };

    stmt.run(timestamp, 'system', 'qna', JSON.stringify(details));
  } catch (dbErr) {
    console.error('Failed to log Q&A interaction to SQLite:', dbErr);
  }
}

// POST /api/chat — Q&A with LLM (Moderado tier)
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const rawQuestion = (req.body as { question?: string })?.question;
    const question = typeof rawQuestion === 'string' ? rawQuestion.trim() : '';

    if (!question) {
      res.status(400).json({ error: 'Missing or empty "question" in request body' });
      return;
    }

    const {
      baselineStateText,
      modelMetaPayload,
      modelStateLoaded,
      modelStateError,
      modelStateVersion
    } = await fetchBaselineState();

    // ── Cache lookup ───────────────────────────────────────────────
    const cacheKey = buildChatCacheKey(question, modelStateVersion);
    const hit = getCachedChat(cacheKey);

    if (hit) {
      persistHistory(question, {
        model_meta: hit.model_meta,
        tokens_in: hit.tokens_in,
        tokens_out: hit.tokens_out,
        cost_usd: 0 // no cost on cache hit
      });

      logAudit({
        ip: req.ip || '0.0.0.0',
        route: '/api/chat',
        method: 'POST',
        action: 'Generate Scenarios (Cached)',
        userAgent: req.get('user-agent') || 'unknown',
        provider: 'cache',
        model: hit.model_meta.model,
        tier: hit.model_meta.tier,
        tokens_in: hit.tokens_in,
        tokens_out: hit.tokens_out,
        cost_usd: 0,
        status_code: 200,
        chat_content: `Q: ${question}\nA: [cached]`
      });

      res.json({
        answer: hit.answer,
        model_meta: hit.model_meta,
        tokens_in: hit.tokens_in,
        tokens_out: hit.tokens_out,
        cost_usd: hit.cost_usd,
        cached: true,
        fallback: false,
        model_state_loaded: modelStateLoaded,
        model_state_error: modelStateError,
        model_state: modelMetaPayload
      });
      return;
    }

    // ── LLM call (cache miss) ──────────────────────────────────────
    const systemPrompt = `You are a Senior Energy Economist analyzing the HormuzPT projections (a Portuguese energy-system model simulating crude oil shocks).
Your goal is to explain the economic and cascade impacts to policymakers clearly and objectively.
Base your insights strictly on this baseline model state:
${baselineStateText}

Rules for your response:
1. Tone: Professional, analytical, and objective.
2. Language: Concise and clear European Portuguese (PT-PT).
3. Structure: Use a direct, structured format (e.g., bullet points) if explaining multiple effects. Do not use conversational filler (e.g., "Olá", "Aqui está a análise", "Espero ter ajudado").
4. Constraints: Only discuss data derived from the provided model state and the established parameters of the HormuzPT dashboard. If asked about external topics, politely decline and refocus on the energy model.`;

    const fullPrompt = `${systemPrompt}\n\nUser Question:\n${question}`;

    try {
      const result = await llmRouter.chat(fullPrompt, 'frontend_qa');

      // Store successful LLM response in cache
      setCachedChat(cacheKey, {
        answer: result.answer,
        model_meta: result.model_meta,
        tokens_in: result.tokens_in,
        tokens_out: result.tokens_out,
        cost_usd: result.cost_usd
      });

      persistHistory(question, {
        model_meta: result.model_meta,
        tokens_in: result.tokens_in,
        tokens_out: result.tokens_out,
        cost_usd: result.cost_usd
      });

      logAudit({
        ip: req.ip || '0.0.0.0',
        route: '/api/chat',
        method: 'POST',
        action: 'Generate Scenarios',
        userAgent: req.get('user-agent') || 'unknown',
        provider: result.model_meta.provider,
        model: result.model_meta.model,
        tier: result.model_meta.tier,
        tokens_in: result.tokens_in,
        tokens_out: result.tokens_out,
        cost_usd: result.cost_usd,
        status_code: 200,
        chat_content: `Q: ${question}\nA: ${result.answer}`
      });

      res.json({
        answer: result.answer,
        model_meta: result.model_meta,
        tokens_in: result.tokens_in,
        tokens_out: result.tokens_out,
        cost_usd: result.cost_usd,
        cached: false,
        fallback: false,
        model_state_loaded: modelStateLoaded,
        model_state_error: modelStateError,
        model_state: modelMetaPayload
      });
      return;
    } catch (llmErr) {
      const detail = String(llmErr);

      // Treat both "no route" and provider auth/connection failures as fallback-worthy
      const isFallbackError =
        detail.includes('No LLM route available') ||
        detail.includes('401') ||
        detail.includes('403') ||
        detail.includes('not configured') ||
        detail.includes('ECONNREFUSED');

      if (isFallbackError) {
        console.warn('[chat] LLM unavailable, using fallback:', detail.slice(0, 120));
        const fallbackAnswer = buildFallbackAnswer(question, baselineStateText);

        const fallbackResult: PersistableResult = {
          model_meta: {
            provider: 'fallback',
            model: 'no-llm-route',
            tier: 'moderado'
          },
          tokens_in: 0,
          tokens_out: 0,
          cost_usd: 0
        };

        persistHistory(question, fallbackResult);

        logAudit({
          ip: req.ip || '0.0.0.0',
          route: '/api/chat',
          method: 'POST',
          action: 'Generate Scenarios (Fallback)',
          userAgent: req.get('user-agent') || 'unknown',
          provider: fallbackResult.model_meta.provider,
          model: fallbackResult.model_meta.model,
          tier: fallbackResult.model_meta.tier,
          tokens_in: 0,
          tokens_out: 0,
          cost_usd: 0,
          status_code: 200,
          chat_content: `Q: ${question}\nA: ${fallbackAnswer}`
        });

        res.json({
          answer: fallbackAnswer,
          model_meta: fallbackResult.model_meta,
          tokens_in: 0,
          tokens_out: 0,
          cost_usd: 0,
          cached: false,
          fallback: true,
          model_state_loaded: modelStateLoaded,
          model_state_error: modelStateError,
          model_state: modelMetaPayload
        });
        return;
      }

      throw llmErr;
    }
  } catch (err) {
    console.error('Chat error:', err);

    logAudit({
      ip: req.ip || '0.0.0.0',
      route: '/api/chat',
      method: 'POST',
      action: 'Generate Scenarios (Failed)',
      userAgent: req.get('user-agent') || 'unknown',
      status_code: 500
    });

    res.status(500).json({
      error: 'Chat failed',
      detail: 'Internal server error'
    });
  }
});

export default router;