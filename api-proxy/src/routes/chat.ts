import { Router, Request, Response } from 'express';
import { config } from '../config.js';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

let anthropic: Anthropic | null = null;
try {
    anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY || 'stub',
    });
} catch (e) {
    console.error("Failed to initialize Anthropic client:", e);
}

// POST /api/chat — Q&A with LLM (Moderado tier)
router.post('/chat', async (req: Request, res: Response) => {
    try {
        const { question } = req.body as { question?: string };
        if (!question) {
            res.status(400).json({ error: 'Missing "question" in request body' });
            return;
        }

        if (!anthropic || process.env.ANTHROPIC_API_KEY === 'stub' || !process.env.ANTHROPIC_API_KEY) {
            return res.json({
                answer: `[Modo Offline] Integração Anthropic API não configurada. A pergunta foi: "${question}"`,
                model: 'offline-stub',
                tier: 'moderado',
                tokens_in: 0,
                tokens_out: 0,
                cost_eur: 0,
                cached: false,
            });
        }

        // Fetch baseline dynamically from the recalibrator through our own proxy config
        let baselineState = "Dados não disponíveis.";
        try {
            const stateRes = await fetch(`http://localhost:${config.port}/api/model-state`);
            if (stateRes.ok) {
                const stateData = await stateRes.json();
                baselineState = JSON.stringify(stateData.state, null, 2);
            }
        } catch (err) {
            console.warn("Chat could not fetch current model context");
        }

        const systemPrompt = `You are a Senior Energy Economist analyzing the HormuzPT projections (a Portuguese energy-system model simulating crude oil shocks).
Your goal is to explain the economic and cascade impacts to policymakers clearly and objectively.
Base your insights strictly on this baseline model state:
${baselineState}

Rules for your response:
1. Tone: Professional, analytical, and objective.
2. Language: Concise and clear European Portuguese (PT-PT).
3. Structure: Use a direct, structured format (e.g., bullet points) if explaining multiple effects. Do not use conversational filler (e.g., "Olá", "Aqui está a análise", "Espero ter ajudado").
4. Constraints: Only discuss data derived from the provided model state and the established parameters of the HormuzPT dashboard. If asked about external topics, politely decline and refocus on the energy model.`;

        const message = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            temperature: 0.3,
            system: systemPrompt,
            messages: [{ role: 'user', content: question }]
        });

        const answerText = message.content[0].type === 'text' ? message.content[0].text : 'No text response generated.';
        
        res.json({
            answer: answerText,
            model: 'claude-3-5-sonnet-20241022',
            tier: 'moderado',
            tokens_in: message.usage.input_tokens,
            tokens_out: message.usage.output_tokens,
            cost_eur: 0, // Simplified for now
            cached: false,
        });
    } catch (err) {
        console.error("Chat error:", err);
        res.status(500).json({ error: 'Chat failed', detail: String(err) });
    }
});

export default router;
